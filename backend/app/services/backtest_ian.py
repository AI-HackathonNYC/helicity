"""Hurricane Ian September 2022 backtest — replays weather tail-risk multiplier day-by-day.

Demonstrates how a Cat 4 hurricane hitting Florida causes stress score
spikes for stablecoins with FL bank exposure and elevated mortgage LTV ratios.
"""

import json
from pathlib import Path

from app.models.stress import BacktestEvent, BacktestResult, DimensionScore


DATA_DIR = Path(__file__).resolve().parents[3] / "data"
IAN_TIMELINE = DATA_DIR / "backtests" / "hurricane_ian.json"


def _map_score(score: float) -> tuple[str, str, str]:
    if score <= 25:
        return ("Low Stress", "<4h", "100%+")
    elif score <= 50:
        return ("Moderate Stress", "4-24h", "95-100%")
    elif score <= 75:
        return ("Elevated Stress", "24-72h", "85-95%")
    else:
        return ("Critical Stress", "72h+", "<85%")


def _compute_dimensions_for_date(day: dict) -> list[DimensionScore]:
    """Compute 6 scoring dimensions for a hurricane Ian timeline date."""
    stress = day["usdc_stress_score"]
    category = day.get("hurricane_category") or 0
    ltv = day.get("fl_bank_avg_ltv", 0.68)

    # Dimension 1: Duration Risk (30%) — moderate for USDC (normal WAM ~38 days)
    duration_score = 25.0  # USDC has healthy short-duration portfolio

    # Dimension 2: Reserve Transparency (20%) — standard pre-GENIUS Act
    transparency_score = 35.0

    # Dimension 3: Geographic Concentration (15%) — FL exposure matters here
    geo_score = 40.0 + (ltv - 0.68) * 200  # rises with FL bank LTV stress

    # Dimension 4: Weather Tail-Risk (15%) — KEY DRIVER for this backtest
    if category >= 4:
        weather_score = 85.0 + (ltv - 0.70) * 100
    elif category >= 3:
        weather_score = 60.0 + (ltv - 0.68) * 150
    elif category >= 2:
        weather_score = 40.0
    elif category >= 1:
        weather_score = 20.0
    else:
        weather_score = 5.0 + max(0, (ltv - 0.72) * 80)  # post-storm LTV residual
    weather_score = min(100.0, max(0.0, weather_score))

    # Dimension 5: Counterparty Health (15%) — FL banks under LTV stress
    ltv_stress = max(0, (ltv - 0.65) * 300)
    counterparty_score = min(100.0, 20.0 + ltv_stress)

    # Dimension 6: Peg Stability (5%) — USDC maintained peg during Ian
    peg_score = 0.0

    dims = [
        DimensionScore(
            name="Duration Risk (WAM)",
            score=round(duration_score, 1),
            weight=0.30,
            weighted_score=round(duration_score * 0.30, 2),
            detail="USDC portfolio WAM ~38 days. Normal duration risk.",
        ),
        DimensionScore(
            name="Reserve Transparency",
            score=round(transparency_score, 1),
            weight=0.20,
            weighted_score=round(transparency_score * 0.20, 2),
            detail="Pre-GENIUS Act era. PDF attestation with ~30-day lag.",
        ),
        DimensionScore(
            name="Geographic Concentration",
            score=round(min(100, geo_score), 1),
            weight=0.15,
            weighted_score=round(min(100, geo_score) * 0.15, 2),
            detail=f"FL bank exposure with avg LTV {ltv:.2f}.",
        ),
        DimensionScore(
            name="Weather Tail-Risk",
            score=round(weather_score, 1),
            weight=0.15,
            weighted_score=round(weather_score * 0.15, 2),
            detail=f"Hurricane Ian Cat {category}." if category else "Post-storm monitoring.",
        ),
        DimensionScore(
            name="Counterparty Health",
            score=round(counterparty_score, 1),
            weight=0.15,
            weighted_score=round(counterparty_score * 0.15, 2),
            detail=f"FL regional banks avg mortgage LTV: {ltv:.2f}.",
        ),
        DimensionScore(
            name="Peg Stability",
            score=round(peg_score, 1),
            weight=0.05,
            weighted_score=round(peg_score * 0.05, 2),
            detail="USDC maintained peg throughout Hurricane Ian.",
        ),
    ]
    return dims


async def run_ian_backtest() -> BacktestResult:
    """Run Hurricane Ian backtest — day-by-day stress scores with dimension breakdowns."""
    with open(IAN_TIMELINE) as f:
        timeline_data = json.load(f)

    events: list[BacktestEvent] = []
    critical_date = None

    for day in timeline_data["dates"]:
        score = day["usdc_stress_score"]
        level, latency, coverage = _map_score(score)
        dimensions = _compute_dimensions_for_date(day)

        event = BacktestEvent(
            date=day["date"],
            stress_score=score,
            level=level,
            latency_hours=latency,
            coverage_ratio=coverage,
            event=day.get("event"),
            dimensions=dimensions,
            hurricane_category=day.get("hurricane_category"),
            hurricane_lat=day.get("hurricane_lat"),
            hurricane_lng=day.get("hurricane_lng"),
            bank_avg_ltv=day.get("fl_bank_avg_ltv"),
            tusd_stress_score=day.get("tusd_stress_score"),
        )
        events.append(event)

        if critical_date is None and score >= 75:
            critical_date = day["date"]

    return BacktestResult(
        name="Hurricane Ian — September 2022",
        description=timeline_data["description"],
        timeline=events,
        critical_date=critical_date,
        key_insight=timeline_data["key_insight"],
    )


async def get_ian_summary() -> dict:
    """Return Hurricane Ian backtest summary."""
    result = await run_ian_backtest()

    peak = max(result.timeline, key=lambda e: e.stress_score)
    peak_ltv = peak.bank_avg_ltv

    return {
        "name": result.name,
        "key_insight": result.key_insight,
        "critical_date": result.critical_date,
        "peak_stress_score": peak.stress_score,
        "peak_date": peak.date,
        "peak_event": peak.event,
        "peak_hurricane_category": peak.hurricane_category,
        "peak_bank_avg_ltv": peak_ltv,
        "insight": f"Cat 4 landfall drove USDC stress to {peak.stress_score}/100. FL bank avg LTV peaked at {peak_ltv}. Weather tail-risk was the primary driver, not duration mismatch.",
        "total_data_points": len(result.timeline),
    }
