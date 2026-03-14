"""6-dimension scoring engine — computes Liquidity Stress Scores from live data."""

import asyncio
from datetime import datetime, timezone
from typing import Optional

from app.services.narratives import NarrativeService

from app.models.reserve import ReserveData
from app.models.stress import DimensionScore, StressScoreResult
from app.services.cache import Cache
from app.services.fdic_provider import FDICProvider
from app.services.weather_provider import WeatherProvider
from app.services.etherscan_provider import EtherscanProvider
from app.services.knowledge_graph import KnowledgeGraphService
from app.services.llm_jury import LLMJuryService
from app.services.registry import get_all_symbols, get_reserve_data, get_all_states


class ScoringEngine:
    """Computes Liquidity Stress Scores across 6 dimensions using live data providers."""

    def __init__(
        self,
        cache: Cache,
        graph: KnowledgeGraphService,
        llm_jury: LLMJuryService,
        narrative_service: Optional[NarrativeService] = None,
    ) -> None:
        self.cache = cache
        self.graph = graph
        self.llm_jury = llm_jury
        self.narrative_service = narrative_service
        self.fdic = FDICProvider(cache)
        self.weather = WeatherProvider(cache)
        self.etherscan = EtherscanProvider(cache)
        # In-memory store of the last known score per symbol for webhook delta checks
        self._last_scores: dict[str, float] = {}

    async def compute_stress_score(self, symbol: str) -> StressScoreResult:
        """Compute the full 6-dimension stress score for a stablecoin."""
        reserve = get_reserve_data(symbol)

        # Compute all 6 dimensions in parallel
        dims = await asyncio.gather(
            self._duration_risk(reserve),
            self._reserve_transparency(reserve),
            self._geographic_concentration(reserve),
            self._weather_tail_risk(reserve),
            self._counterparty_health(reserve),
            self._peg_stability(reserve),
        )

        composite = sum(d.weighted_score for d in dims)
        composite = min(100.0, max(0.0, composite))
        level, latency, coverage = _map_score(composite)

        # Track worst resolution source across providers
        sources = set()
        for d in dims:
            if d.detail and "fixture" in d.detail.lower():
                sources.add("fixture")
            elif d.detail and "cache" in d.detail.lower():
                sources.add("cache")
            else:
                sources.add("live")
        resolution = "fixture" if "fixture" in sources else ("cache" if "cache" in sources else "live")

        # Generate narrative + jury (async, non-blocking)
        narrative = None
        jury = None
        context = _build_context(reserve, dims, composite)
        if self.llm_jury.available:
            jury_result = await self.llm_jury.evaluate_counterparty_health(context)
            if jury_result:
                jury = jury_result
        if self.narrative_service and self.narrative_service.available:
            narrative = await self.narrative_service.generate_narrative(context)
        elif self.llm_jury.available:
            # Fallback: wrap old single-model narrative in NarrativeResult
            from app.models.stress import NarrativeResult as NR
            old_narrative = await self.llm_jury.generate_narrative(context)
            if old_narrative:
                narrative = NR(narrative=old_narrative, consensus=False)

        result = StressScoreResult(
            stablecoin=symbol,
            stress_score=round(composite, 1),
            redemption_latency_hours=latency,
            liquidity_coverage_ratio=coverage,
            stress_level=level,
            dimensions=list(dims),
            jury=jury,
            narrative=narrative,
            resolution_source=resolution,
            source_timestamp=datetime.now(timezone.utc).isoformat(),
        )

        # Fire webhooks in background if score changed since last run
        previous_score = self._last_scores.get(symbol)
        self._last_scores[symbol] = result.stress_score
        if previous_score is not None:
            from app.services.webhooks import fire_webhooks
            asyncio.create_task(
                fire_webhooks(symbol, previous_score, result.stress_score, result)
            )

        return result

    async def compute_all_scores(self) -> list[StressScoreResult]:
        """Compute stress scores for all tracked stablecoins."""
        symbols = get_all_symbols()
        tasks = [self.compute_stress_score(s) for s in symbols]
        return await asyncio.gather(*tasks)

    async def project_scenario(
        self,
        symbol: str,
        rate_hike_bps: Optional[int] = None,
        hurricane_lat: Optional[float] = None,
        hurricane_lng: Optional[float] = None,
        hurricane_category: Optional[int] = None,
        bank_failure: Optional[str] = None,
    ) -> dict:
        """Project stress score under a scenario — grounded in real data with overrides.

        Returns both baseline (current) and projected scores with per-dimension deltas.
        """
        reserve = get_reserve_data(symbol)
        baseline = await self.compute_stress_score(symbol)

        # Build scenario-adjusted dimensions
        adjusted_dims = []
        for dim in baseline.dimensions:
            adj_score = dim.score

            if dim.name == "Duration Risk (WAM)" and rate_hike_bps:
                # Rate hikes amplify duration risk — each 25bps adds ~5 points if WAM > 60d
                wam = reserve.weighted_avg_maturity_days
                rate_multiplier = (rate_hike_bps / 25) * 5 * (wam / 365.0)
                adj_score = min(100.0, dim.score + rate_multiplier)

            elif dim.name == "Weather Tail-Risk" and hurricane_lat is not None:
                # Project hurricane impact on counterparty banks
                cat = hurricane_category or 3
                severity = cat / 5.0
                hit_score = 0.0
                for cp in reserve.counterparties:
                    if cp.lat and cp.lng:
                        from app.services.knowledge_graph import _haversine
                        dist = _haversine(hurricane_lat, hurricane_lng, cp.lat, cp.lng)
                        impact = max(0, 1 - dist / 500) * severity
                        ltv = cp.fdic_ltv_ratio or 0.5
                        hit_score += impact * ltv * (cp.percentage / 100.0) * 100

                # Also check data center corridor impact
                corridors_hit = self.graph.get_corridors_in_radius(
                    hurricane_lat, hurricane_lng, 300.0
                )
                if corridors_hit:
                    hit_score += 15 * severity  # ops risk bonus

                adj_score = min(100.0, max(dim.score, hit_score))

            elif dim.name == "Counterparty Health" and bank_failure:
                # If a specific bank fails, spike counterparty health risk
                for cp in reserve.counterparties:
                    if bank_failure.lower() in cp.bank_name.lower():
                        adj_score = min(100.0, dim.score + cp.percentage)
                        break

            adjusted_dims.append({
                "name": dim.name,
                "baseline_score": dim.score,
                "projected_score": round(adj_score, 1),
                "delta": round(adj_score - dim.score, 1),
                "weight": dim.weight,
                "baseline_weighted": dim.weighted_score,
                "projected_weighted": round(adj_score * dim.weight, 2),
            })

        projected_composite = sum(d["projected_weighted"] for d in adjusted_dims)
        projected_composite = min(100.0, max(0.0, projected_composite))
        proj_level, proj_latency, proj_coverage = _map_score(projected_composite)

        return {
            "stablecoin": symbol,
            "scenario": {
                "rate_hike_bps": rate_hike_bps,
                "hurricane": {"lat": hurricane_lat, "lng": hurricane_lng, "category": hurricane_category}
                if hurricane_lat is not None else None,
                "bank_failure": bank_failure,
            },
            "baseline": {
                "stress_score": baseline.stress_score,
                "stress_level": baseline.stress_level,
                "redemption_latency_hours": baseline.redemption_latency_hours,
                "liquidity_coverage_ratio": baseline.liquidity_coverage_ratio,
            },
            "projected": {
                "stress_score": round(projected_composite, 1),
                "stress_level": proj_level,
                "redemption_latency_hours": proj_latency,
                "liquidity_coverage_ratio": proj_coverage,
            },
            "dimensions": adjusted_dims,
            "delta": round(projected_composite - baseline.stress_score, 1),
        }

    # --- Dimension 1: Duration Risk (30% weight) ---

    async def _duration_risk(self, reserve: ReserveData) -> DimensionScore:
        wam = reserve.weighted_avg_maturity_days
        score = min(100.0, (wam / 365.0) * 100.0)
        return DimensionScore(
            name="Duration Risk (WAM)",
            score=round(score, 1),
            weight=0.30,
            weighted_score=round(score * 0.30, 2),
            detail=f"WAM: {wam} days. Score scales linearly — 365d = max risk.",
        )

    # --- Dimension 2: Reserve Transparency (20% weight) ---

    async def _reserve_transparency(self, reserve: ReserveData) -> DimensionScore:
        score = 0.0

        # Data source quality
        if reserve.data_source == "genius_act_attestation":
            score += 0
        elif reserve.data_source == "pdf_attestation":
            score += 25
        else:
            score += 50

        # Report staleness
        try:
            report_date = datetime.strptime(reserve.report_date, "%Y-%m-%d")
            days_old = (datetime.now() - report_date).days
            score += min(30, days_old)  # +1 per day, cap at 30
        except ValueError:
            score += 30

        # On-chain cross-check divergence
        if reserve.onchain_cross_check:
            div = reserve.onchain_cross_check.divergence_pct
            if div is not None:
                if div > 5:
                    score += 25
                elif div > 2:
                    score += 10

        # Counterparties with missing FDIC data
        opaque = sum(1 for cp in reserve.counterparties if cp.fdic_cert is None)
        score += opaque * 5

        score = min(100.0, score)
        return DimensionScore(
            name="Reserve Transparency",
            score=round(score, 1),
            weight=0.20,
            weighted_score=round(score * 0.20, 2),
            detail=f"Source: {reserve.data_source}. Report date: {reserve.report_date}. {opaque} opaque counterparties.",
        )

    # --- Dimension 3: Geographic + Operational Concentration (15% weight) ---

    async def _geographic_concentration(self, reserve: ReserveData) -> DimensionScore:
        # HHI of counterparty reserve shares
        hhi = self.graph.get_concentration_hhi(reserve.stablecoin)
        # Normalize HHI: 10000 = max (all in one bank), 0 = perfectly distributed
        hhi_score = min(100.0, hhi / 100.0)

        # Data center corridor concentration
        corridors = [cp.data_center_corridor for cp in reserve.counterparties if cp.data_center_corridor]
        if corridors:
            unique_corridors = set(corridors)
            corridor_concentration = 1.0 - (len(unique_corridors) / max(len(corridors), 1))
            ops_bonus = corridor_concentration * 30  # up to 30 points for single-corridor risk
        else:
            ops_bonus = 0

        score = min(100.0, hhi_score * 0.6 + ops_bonus * 0.4 + (20 if len(set(corridors)) <= 1 and corridors else 0))
        return DimensionScore(
            name="Geographic Concentration",
            score=round(score, 1),
            weight=0.15,
            weighted_score=round(score * 0.15, 2),
            detail=f"HHI: {round(hhi, 0)}. Corridors: {len(set(corridors)) if corridors else 0} unique.",
        )

    # --- Dimension 4: Weather Tail-Risk Multiplier (15% weight) ---

    async def _weather_tail_risk(self, reserve: ReserveData) -> DimensionScore:
        # Fetch active weather alerts for all states where counterparties are located
        states = set()
        state_weights: dict[str, float] = {}
        for cp in reserve.counterparties:
            if cp.state and len(cp.state) == 2:
                states.add(cp.state)
                state_weights[cp.state] = state_weights.get(cp.state, 0) + cp.percentage

        if not states:
            return DimensionScore(
                name="Weather Tail-Risk",
                score=0.0,
                weight=0.15,
                weighted_score=0.0,
                detail="No US-based counterparties to assess weather risk.",
            )

        severity_map = {"Extreme": 1.0, "Severe": 0.7, "Moderate": 0.4, "Minor": 0.1}
        total_weather_score = 0.0
        alert_details = []
        source = "live"

        for state in states:
            try:
                result = await self.weather.resolve(f"alerts:{state}")
                if result.source == "fixture":
                    source = "fixture"
                elif result.source == "cache" and source != "fixture":
                    source = "cache"

                if result.data and result.data.get("alert_count", 0) > 0:
                    max_severity = 0.0
                    for alert in result.data["alerts"]:
                        sev = severity_map.get(alert.get("severity", ""), 0.0)
                        max_severity = max(max_severity, sev)
                        if sev >= 0.7:
                            alert_details.append(f"{alert.get('event', 'Alert')} in {state}")

                    weight = state_weights.get(state, 0) / 100.0
                    # Factor in LTV for banks in this state
                    ltv_factor = 1.0
                    for cp in reserve.counterparties:
                        if cp.state == state and cp.fdic_ltv_ratio:
                            ltv_factor = max(ltv_factor, cp.fdic_ltv_ratio)

                    total_weather_score += max_severity * weight * ltv_factor * 100
            except Exception:
                continue

        score = min(100.0, total_weather_score)
        detail = f"Active alerts: {', '.join(alert_details) if alert_details else 'None'}. Source: {source}."
        return DimensionScore(
            name="Weather Tail-Risk",
            score=round(score, 1),
            weight=0.15,
            weighted_score=round(score * 0.15, 2),
            detail=detail,
        )

    # --- Dimension 5: Counterparty Health (15% weight) ---

    async def _counterparty_health(self, reserve: ReserveData) -> DimensionScore:
        health_scores = []
        source = "live"

        for cp in reserve.counterparties:
            if cp.fdic_cert:
                try:
                    result = await self.fdic.resolve(str(cp.fdic_cert))
                    if result.source == "fixture":
                        source = "fixture"
                    elif result.source == "cache" and source != "fixture":
                        source = "cache"

                    if result.data:
                        # Higher LTV = worse health. Score 0-100.
                        ltv = result.data.get("ltv_proxy") or cp.fdic_ltv_ratio or 0.5
                        roa = result.data.get("roa") or 0
                        nim = result.data.get("net_interest_margin") or 0

                        # Health heuristic: high leverage + low profitability = bad
                        ltv_score = min(100, ltv * 100)
                        roa_penalty = max(0, 30 - roa * 30) if roa < 1 else 0
                        health = ltv_score * 0.6 + roa_penalty * 0.4

                        health_scores.append((health, cp.percentage / 100.0))
                except Exception:
                    # Default moderate risk for failed lookups
                    health_scores.append((50.0, cp.percentage / 100.0))
            else:
                # No FDIC cert = opaque = higher risk
                health_scores.append((65.0, cp.percentage / 100.0))

        if not health_scores:
            score = 50.0
        else:
            score = sum(h * w for h, w in health_scores) / sum(w for _, w in health_scores)

        score = min(100.0, score)
        return DimensionScore(
            name="Counterparty Health",
            score=round(score, 1),
            weight=0.15,
            weighted_score=round(score * 0.15, 2),
            detail=f"Assessed {len(health_scores)} counterparties. Source: {source}.",
        )

    # --- Dimension 6: Peg Stability (5% weight) ---

    async def _peg_stability(self, reserve: ReserveData) -> DimensionScore:
        score = 0.0
        source = "fixture"

        try:
            result = await self.etherscan.resolve(reserve.stablecoin)
            source = result.source

            if result.data:
                div = result.data.get("divergence_pct")
                if div is not None and div > 5:
                    score += 40
                elif div is not None and div > 2:
                    score += 15

                burn = result.data.get("burn_7d_usd")
                if burn and reserve.total_reserves > 0:
                    burn_ratio = burn / reserve.total_reserves
                    if burn_ratio > 0.05:  # >5% of reserves burned in 7d
                        score += 40
                    elif burn_ratio > 0.02:
                        score += 20
        except Exception:
            score = 10.0  # Default low risk

        # Cross-check from fixture data
        if reserve.onchain_cross_check:
            div = reserve.onchain_cross_check.divergence_pct
            if div is not None and div > 5:
                score = max(score, 30)

        score = min(100.0, score)
        return DimensionScore(
            name="Peg Stability",
            score=round(score, 1),
            weight=0.05,
            weighted_score=round(score * 0.05, 2),
            detail=f"On-chain source: {source}.",
        )


def _map_score(score: float) -> tuple[str, str, str]:
    """Map composite score to stress level, redemption latency, and coverage ratio."""
    if score <= 25:
        return ("Low Stress", "<4h", "100%+")
    elif score <= 50:
        return ("Moderate Stress", "4-24h", "95-100%")
    elif score <= 75:
        return ("Elevated Stress", "24-72h", "85-95%")
    else:
        return ("Critical Stress", "72h+", "<85%")


def _build_context(reserve: ReserveData, dims: tuple, composite: float) -> str:
    """Build context string for LLM jury from reserve data and dimension scores."""
    lines = [
        f"Stablecoin: {reserve.stablecoin} ({reserve.issuer})",
        f"Total Reserves: ${reserve.total_reserves:,.0f}",
        f"WAM: {reserve.weighted_avg_maturity_days} days",
        f"Data Source: {reserve.data_source}",
        f"Report Date: {reserve.report_date}",
        f"Composite Stress Score: {composite:.1f}/100",
        "",
        "Counterparties:",
    ]
    for cp in reserve.counterparties:
        lines.append(
            f"  - {cp.bank_name} ({cp.city}, {cp.state}): "
            f"{cp.percentage}% | {cp.asset_class} | {cp.maturity_days}d maturity | "
            f"LTV: {cp.fdic_ltv_ratio or 'N/A'}"
        )
    lines.append("")
    lines.append("Dimension Scores:")
    for d in dims:
        lines.append(f"  - {d.name}: {d.score}/100 (weight {d.weight}, contributes {d.weighted_score})")
    return "\n".join(lines)
