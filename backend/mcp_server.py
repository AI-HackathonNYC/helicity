"""Katabatic MCP Server — AI-agent-native delivery of reserve risk scores.

Exposes 5 tools via the Model Context Protocol (MCP):
  - get_stress_scores        → all stablecoin stress scores
  - get_stablecoin_detail    → single stablecoin full breakdown
  - project_scenario         → baseline vs. projected score under a stress scenario
  - get_active_alerts        → live NOAA weather alerts + ops impact
  - get_score_history        → recent score history for a stablecoin

Transports:
  - stdio (default)  → local agent integration (Claude Desktop, etc.)
  - SSE              → remote agent integration (set TRANSPORT=sse)

Usage:
  python mcp_server.py                   # stdio
  TRANSPORT=sse python mcp_server.py     # SSE on port 8001
"""

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Ensure backend/ is on the path so app.* imports resolve
sys.path.insert(0, str(Path(__file__).resolve().parent))
load_dotenv()

from fastmcp import FastMCP

from app.services.cache import Cache
from app.services.knowledge_graph import KnowledgeGraphService
from app.services.llm_jury import LLMJuryService
from app.services.scoring_engine import ScoringEngine
from app.services.weather_provider import WeatherProvider
from app.services.registry import get_all_symbols, get_all_states, get_reserve_data

# ---------------------------------------------------------------------------
# Service initialisation (shared across all tool calls within the process)
# ---------------------------------------------------------------------------

_cache = Cache()
_graph = KnowledgeGraphService()
_llm_jury = LLMJuryService()
_weather = WeatherProvider(_cache)
_engine: Optional[ScoringEngine] = None

# In-process score history: symbol → list of snapshots (capped at 50 per symbol)
_score_history: dict[str, list[dict]] = {}
_MAX_HISTORY = 50


async def _get_engine() -> ScoringEngine:
    """Lazily initialise the scoring engine and its dependencies."""
    global _engine
    if _engine is not None:
        return _engine

    await _cache.initialize()

    reserves = {}
    for symbol in get_all_symbols():
        try:
            reserves[symbol] = get_reserve_data(symbol)
        except (ValueError, FileNotFoundError):
            pass

    _graph.build_from_reserves(reserves)
    _engine = ScoringEngine(_cache, _graph, _llm_jury)
    return _engine


def _envelope(data=None, error: Optional[str] = None) -> dict:
    return {
        "data": data,
        "error": error,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _record_history(symbol: str, score_data: dict) -> None:
    """Append a score snapshot to the in-process history store."""
    bucket = _score_history.setdefault(symbol, [])
    bucket.append({
        "stress_score": score_data.get("stress_score"),
        "stress_level": score_data.get("stress_level"),
        "redemption_latency_hours": score_data.get("redemption_latency_hours"),
        "liquidity_coverage_ratio": score_data.get("liquidity_coverage_ratio"),
        "resolution_source": score_data.get("resolution_source"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    if len(bucket) > _MAX_HISTORY:
        _score_history[symbol] = bucket[-_MAX_HISTORY:]


# ---------------------------------------------------------------------------
# MCP server
# ---------------------------------------------------------------------------

mcp = FastMCP(
    "Katabatic",
    instructions=(
        "Katabatic is the system of record for stablecoin reserve risk. "
        "Use these tools to query Liquidity Stress Scores (0–100), redemption "
        "latency estimates, liquidity coverage ratios, and weather-driven operational "
        "risk alerts for USDC, USDT, DAI, FRAX, PYUSD, and TUSD. "
        "All scores are derived from GENIUS Act attestation data, FDIC Call Reports, "
        "NOAA weather feeds, and on-chain Etherscan mint/burn flows."
    ),
)


@mcp.tool()
async def get_stress_scores() -> dict:
    """Return current Liquidity Stress Scores for all tracked stablecoins.

    Scores are computed from live GENIUS Act attestation data, FDIC Call Reports,
    NOAA weather alerts, and on-chain mint/burn flows. Each score is 0–100 where
    higher values indicate greater reserve fragility.

    Returns a list of stablecoin stress summaries including score, stress level,
    redemption latency estimate, liquidity coverage ratio, and data resolution source.
    """
    try:
        engine = await _get_engine()
        results = await engine.compute_all_scores()
        data = [r.model_dump() for r in results]
        for item in data:
            _record_history(item["stablecoin"], item)
        return _envelope(data=data)
    except Exception as exc:
        return _envelope(error=str(exc))


@mcp.tool()
async def get_stablecoin_detail(symbol: str) -> dict:
    """Return the full 6-dimension stress score breakdown for a single stablecoin.

    Args:
        symbol: Stablecoin ticker (e.g. "USDC", "USDT", "DAI", "FRAX", "PYUSD", "TUSD").

    Returns a detailed breakdown including:
      - Composite Liquidity Stress Score (0–100)
      - 6 weighted dimension scores: Duration Risk (WAM), Reserve Transparency,
        Geographic Concentration, Weather Tail-Risk, Counterparty Health, Peg Stability
      - LLM jury consensus (Claude + Gemini scores and delta)
      - Causal narrative explaining the current stress level
      - Redemption latency estimate and liquidity coverage ratio
    """
    try:
        engine = await _get_engine()
        result = await engine.compute_stress_score(symbol.upper())
        data = result.model_dump()
        _record_history(symbol.upper(), data)
        return _envelope(data=data)
    except (ValueError, FileNotFoundError) as exc:
        return _envelope(error=f"Unknown stablecoin '{symbol}': {exc}")
    except Exception as exc:
        return _envelope(error=str(exc))


@mcp.tool()
async def project_scenario(
    symbol: str,
    rate_hike_bps: Optional[int] = None,
    hurricane_lat: Optional[float] = None,
    hurricane_lng: Optional[float] = None,
    hurricane_category: Optional[int] = None,
    bank_failure: Optional[str] = None,
) -> dict:
    """Project how a stress scenario would affect a stablecoin's Liquidity Stress Score.

    Computes baseline (current) and projected scores with per-dimension deltas.
    At least one scenario parameter must be provided.

    Args:
        symbol: Stablecoin ticker (e.g. "USDC", "USDT", "DAI").
        rate_hike_bps: Federal Reserve rate hike in basis points (e.g. 50 = +0.50%).
            Amplifies Duration Risk proportionally to WAM length.
        hurricane_lat: Latitude of hurricane centre (decimal degrees).
        hurricane_lng: Longitude of hurricane centre (decimal degrees).
        hurricane_category: Saffir-Simpson category 1–5. Defaults to 3 if lat/lng provided.
        bank_failure: Name (or partial name) of a counterparty bank to simulate failure
            (e.g. "BNY Mellon", "State Street").

    Returns baseline vs. projected scores with per-dimension breakdown and total delta.
    """
    if not any([rate_hike_bps, hurricane_lat, bank_failure]):
        return _envelope(error="At least one scenario parameter must be provided.")

    try:
        engine = await _get_engine()
        result = await engine.project_scenario(
            symbol=symbol.upper(),
            rate_hike_bps=rate_hike_bps,
            hurricane_lat=hurricane_lat,
            hurricane_lng=hurricane_lng,
            hurricane_category=hurricane_category,
            bank_failure=bank_failure,
        )
        return _envelope(data=result)
    except (ValueError, FileNotFoundError) as exc:
        return _envelope(error=f"Unknown stablecoin '{symbol}': {exc}")
    except Exception as exc:
        return _envelope(error=str(exc))


@mcp.tool()
async def get_active_alerts() -> dict:
    """Return active NOAA weather alerts and their operational impact on stablecoin reserves.

    Checks all US states where counterparty banks hold stablecoin reserves. For each
    severe or extreme alert, assesses operational risk to AWS/Azure data center corridors
    used by those banks for redemption processing.

    Returns:
      - weather_alerts: dict of state → alert list for states with active alerts
      - ops_impact: list of data center corridors at risk from current weather events
      - states_checked: all states monitored (based on counterparty locations)
    """
    try:
        await _get_engine()  # Ensure graph is built
        states = get_all_states()
        all_alerts: dict = {}
        ops_impact: list = []

        for state in states:
            try:
                result = await _weather.resolve(f"alerts:{state}")
                if result.data and result.data.get("alert_count", 0) > 0:
                    all_alerts[state] = {
                        "alerts": result.data["alerts"],
                        "alert_count": result.data["alert_count"],
                        "resolution_source": result.source,
                    }
                    for alert in result.data["alerts"]:
                        if alert.get("severity") in ("Extreme", "Severe"):
                            affected = _graph.get_ops_risk_by_state(state)
                            for item in affected:
                                if item not in ops_impact:
                                    ops_impact.append(item)
            except Exception:
                continue

        return _envelope(data={
            "weather_alerts": all_alerts,
            "ops_impact": ops_impact,
            "states_checked": list(states),
        })
    except Exception as exc:
        return _envelope(error=str(exc))


@mcp.tool()
async def get_score_history(symbol: str, limit: int = 10) -> dict:
    """Return recent Liquidity Stress Score history for a stablecoin.

    History is accumulated in-process — each call to get_stress_scores or
    get_stablecoin_detail for this symbol adds a snapshot. History resets
    when the MCP server process restarts.

    Args:
        symbol: Stablecoin ticker (e.g. "USDC", "USDT", "DAI").
        limit: Number of most-recent snapshots to return (default 10, max 50).

    Returns a list of score snapshots with timestamps, ordered oldest-first.
    If no history exists yet for this symbol, triggers a fresh score computation
    and returns that as the first entry.
    """
    sym = symbol.upper()
    limit = max(1, min(limit, _MAX_HISTORY))

    if sym not in _score_history or not _score_history[sym]:
        # Seed history with a fresh score so callers always get something useful
        try:
            engine = await _get_engine()
            result = await engine.compute_stress_score(sym)
            _record_history(sym, result.model_dump())
        except (ValueError, FileNotFoundError) as exc:
            return _envelope(error=f"Unknown stablecoin '{symbol}': {exc}")
        except Exception as exc:
            return _envelope(error=str(exc))

    history = _score_history.get(sym, [])
    return _envelope(data={
        "stablecoin": sym,
        "history": history[-limit:],
        "total_snapshots": len(history),
        "note": (
            "History is accumulated in-process. For persistent historical data, "
            "use the REST API with a time-series database backend."
        ),
    })


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    transport = os.getenv("TRANSPORT", "stdio")
    if transport == "sse":
        port = int(os.getenv("MCP_PORT", "8001"))
        print(f"Starting Katabatic MCP server on SSE transport (port {port})")
        mcp.run(transport="sse", host="0.0.0.0", port=port)
    else:
        mcp.run(transport="stdio")
