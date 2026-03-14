"""Unit tests for the Katabatic MCP server tools.

Tests use unittest.mock to patch the scoring engine and weather provider so
they run without network access or live API keys. All assertions focus on:
  - Correct envelope structure  ({ data, error, timestamp })
  - Correct delegation to underlying service methods
  - Error handling for unknown symbols and missing scenario params
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# Fixtures — minimal stub objects that satisfy the tool implementations
# ---------------------------------------------------------------------------

def _make_dimension(name: str, score: float = 50.0, weight: float = 0.15) -> MagicMock:
    dim = MagicMock()
    dim.name = name
    dim.score = score
    dim.weight = weight
    dim.weighted_score = round(score * weight, 2)
    dim.detail = f"Test detail for {name}."
    return dim


def _make_stress_result(symbol: str = "USDC", score: float = 42.5) -> MagicMock:
    result = MagicMock()
    result.stablecoin = symbol
    result.stress_score = score
    result.stress_level = "Moderate Stress"
    result.redemption_latency_hours = "4-24h"
    result.liquidity_coverage_ratio = "95-100%"
    result.resolution_source = "fixture"
    result.source_timestamp = datetime.now(timezone.utc).isoformat()
    result.jury = None
    result.narrative = "Test narrative."
    result.dimensions = [
        _make_dimension("Duration Risk (WAM)", 55.0, 0.30),
        _make_dimension("Reserve Transparency", 30.0, 0.20),
        _make_dimension("Geographic Concentration", 40.0, 0.15),
        _make_dimension("Weather Tail-Risk", 20.0, 0.15),
        _make_dimension("Counterparty Health", 50.0, 0.15),
        _make_dimension("Peg Stability", 10.0, 0.05),
    ]
    result.model_dump.return_value = {
        "stablecoin": symbol,
        "stress_score": score,
        "stress_level": "Moderate Stress",
        "redemption_latency_hours": "4-24h",
        "liquidity_coverage_ratio": "95-100%",
        "resolution_source": "fixture",
        "source_timestamp": result.source_timestamp,
        "jury": None,
        "narrative": "Test narrative.",
        "dimensions": [],
    }
    return result


def _make_projection(symbol: str = "USDC") -> dict:
    return {
        "stablecoin": symbol,
        "scenario": {"rate_hike_bps": 100, "hurricane": None, "bank_failure": None},
        "baseline": {
            "stress_score": 42.5,
            "stress_level": "Moderate Stress",
            "redemption_latency_hours": "4-24h",
            "liquidity_coverage_ratio": "95-100%",
        },
        "projected": {
            "stress_score": 58.1,
            "stress_level": "Elevated Stress",
            "redemption_latency_hours": "24-72h",
            "liquidity_coverage_ratio": "85-95%",
        },
        "dimensions": [],
        "delta": 15.6,
    }


# ---------------------------------------------------------------------------
# Helper — build a patched engine and import tools under test
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_history():
    """Clear in-process score history between tests."""
    import importlib
    import mcp_server
    mcp_server._score_history.clear()
    mcp_server._engine = None
    yield
    mcp_server._score_history.clear()
    mcp_server._engine = None


@pytest.fixture()
def mock_engine():
    """Return a mock ScoringEngine and patch _get_engine to return it."""
    engine = MagicMock()
    engine.compute_all_scores = AsyncMock(
        return_value=[_make_stress_result("USDC"), _make_stress_result("USDT", 61.0)]
    )
    engine.compute_stress_score = AsyncMock(side_effect=lambda sym: _make_stress_result(sym))
    engine.project_scenario = AsyncMock(return_value=_make_projection())
    return engine


@pytest.fixture()
def mock_weather_data():
    return {
        "weather_alerts": {"FL": {"alerts": [{"event": "Hurricane Warning", "severity": "Extreme"}], "alert_count": 1}},
        "ops_impact": [{"corridor": "us-east-1", "stablecoin": "USDC"}],
        "states_checked": ["NY", "FL", "CA"],
    }


# ---------------------------------------------------------------------------
# Tests: get_stress_scores
# ---------------------------------------------------------------------------

class TestGetStressScores:
    @pytest.mark.asyncio
    async def test_returns_envelope_with_list(self, mock_engine):
        import mcp_server
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            result = await mcp_server.get_stress_scores()

        assert result["error"] is None
        assert "timestamp" in result
        assert isinstance(result["data"], list)
        assert len(result["data"]) == 2

    @pytest.mark.asyncio
    async def test_all_symbols_present(self, mock_engine):
        import mcp_server
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            result = await mcp_server.get_stress_scores()

        symbols = [item["stablecoin"] for item in result["data"]]
        assert "USDC" in symbols
        assert "USDT" in symbols

    @pytest.mark.asyncio
    async def test_records_history(self, mock_engine):
        import mcp_server
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            await mcp_server.get_stress_scores()

        assert "USDC" in mcp_server._score_history
        assert len(mcp_server._score_history["USDC"]) == 1

    @pytest.mark.asyncio
    async def test_engine_error_returns_error_envelope(self, mock_engine):
        import mcp_server
        mock_engine.compute_all_scores = AsyncMock(side_effect=RuntimeError("DB down"))
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            result = await mcp_server.get_stress_scores()

        assert result["data"] is None
        assert "DB down" in result["error"]


# ---------------------------------------------------------------------------
# Tests: get_stablecoin_detail
# ---------------------------------------------------------------------------

class TestGetStablecoinDetail:
    @pytest.mark.asyncio
    async def test_returns_single_result(self, mock_engine):
        import mcp_server
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            result = await mcp_server.get_stablecoin_detail("USDC")

        assert result["error"] is None
        assert result["data"]["stablecoin"] == "USDC"

    @pytest.mark.asyncio
    async def test_uppercases_symbol(self, mock_engine):
        import mcp_server
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            await mcp_server.get_stablecoin_detail("usdc")

        mock_engine.compute_stress_score.assert_called_once_with("USDC")

    @pytest.mark.asyncio
    async def test_unknown_symbol_returns_error(self, mock_engine):
        import mcp_server
        mock_engine.compute_stress_score = AsyncMock(
            side_effect=ValueError("No fixture for FAKE")
        )
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            result = await mcp_server.get_stablecoin_detail("FAKE")

        assert result["data"] is None
        assert "FAKE" in result["error"]

    @pytest.mark.asyncio
    async def test_records_history(self, mock_engine):
        import mcp_server
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            await mcp_server.get_stablecoin_detail("USDC")

        assert "USDC" in mcp_server._score_history


# ---------------------------------------------------------------------------
# Tests: project_scenario
# ---------------------------------------------------------------------------

class TestProjectScenario:
    @pytest.mark.asyncio
    async def test_rate_hike_scenario(self, mock_engine):
        import mcp_server
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            result = await mcp_server.project_scenario("USDC", rate_hike_bps=100)

        assert result["error"] is None
        assert result["data"]["baseline"]["stress_score"] == 42.5
        assert result["data"]["projected"]["stress_score"] == 58.1
        assert result["data"]["delta"] == 15.6

    @pytest.mark.asyncio
    async def test_hurricane_scenario(self, mock_engine):
        import mcp_server
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            result = await mcp_server.project_scenario(
                "USDC", hurricane_lat=25.8, hurricane_lng=-80.2, hurricane_category=4
            )

        assert result["error"] is None
        mock_engine.project_scenario.assert_called_once_with(
            symbol="USDC",
            rate_hike_bps=None,
            hurricane_lat=25.8,
            hurricane_lng=-80.2,
            hurricane_category=4,
            bank_failure=None,
        )

    @pytest.mark.asyncio
    async def test_no_scenario_params_returns_error(self, mock_engine):
        import mcp_server
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            result = await mcp_server.project_scenario("USDC")

        assert result["data"] is None
        assert "scenario parameter" in result["error"]
        mock_engine.project_scenario.assert_not_called()

    @pytest.mark.asyncio
    async def test_unknown_symbol_returns_error(self, mock_engine):
        import mcp_server
        mock_engine.project_scenario = AsyncMock(
            side_effect=FileNotFoundError("No fixture for FAKE")
        )
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            result = await mcp_server.project_scenario("FAKE", rate_hike_bps=50)

        assert result["data"] is None
        assert "FAKE" in result["error"]


# ---------------------------------------------------------------------------
# Tests: get_active_alerts
# ---------------------------------------------------------------------------

class TestGetActiveAlerts:
    @pytest.mark.asyncio
    async def test_returns_alert_structure(self, mock_engine):
        import mcp_server

        weather_result = MagicMock()
        weather_result.source = "live"
        weather_result.data = {
            "alert_count": 1,
            "alerts": [{"event": "Hurricane Warning", "severity": "Extreme"}],
        }

        with (
            patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)),
            patch.object(mcp_server, "get_all_states", return_value={"FL"}),
            patch.object(mcp_server._weather, "resolve", AsyncMock(return_value=weather_result)),
            patch.object(mcp_server._graph, "get_ops_risk_by_state", return_value=[
                {"corridor": "us-east-1", "stablecoin": "USDC"}
            ]),
        ):
            result = await mcp_server.get_active_alerts()

        assert result["error"] is None
        data = result["data"]
        assert "weather_alerts" in data
        assert "ops_impact" in data
        assert "states_checked" in data
        assert "FL" in data["weather_alerts"]

    @pytest.mark.asyncio
    async def test_no_alerts_returns_empty(self, mock_engine):
        import mcp_server

        weather_result = MagicMock()
        weather_result.source = "live"
        weather_result.data = {"alert_count": 0, "alerts": []}

        with (
            patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)),
            patch.object(mcp_server, "get_all_states", return_value={"NY", "CA"}),
            patch.object(mcp_server._weather, "resolve", AsyncMock(return_value=weather_result)),
        ):
            result = await mcp_server.get_active_alerts()

        assert result["error"] is None
        assert result["data"]["weather_alerts"] == {}
        assert result["data"]["ops_impact"] == []


# ---------------------------------------------------------------------------
# Tests: get_score_history
# ---------------------------------------------------------------------------

class TestGetScoreHistory:
    @pytest.mark.asyncio
    async def test_seeds_history_on_first_call(self, mock_engine):
        import mcp_server
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            result = await mcp_server.get_score_history("USDC")

        assert result["error"] is None
        data = result["data"]
        assert data["stablecoin"] == "USDC"
        assert len(data["history"]) == 1
        assert data["history"][0]["stress_score"] == 42.5

    @pytest.mark.asyncio
    async def test_respects_limit(self, mock_engine):
        import mcp_server
        # Pre-populate history with 20 entries
        for _ in range(20):
            mcp_server._record_history("USDC", {"stress_score": 42.5, "stress_level": "Moderate Stress",
                                                  "redemption_latency_hours": "4-24h",
                                                  "liquidity_coverage_ratio": "95-100%",
                                                  "resolution_source": "fixture"})

        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            result = await mcp_server.get_score_history("USDC", limit=5)

        assert len(result["data"]["history"]) == 5
        assert result["data"]["total_snapshots"] == 20

    @pytest.mark.asyncio
    async def test_unknown_symbol_returns_error(self, mock_engine):
        import mcp_server
        mock_engine.compute_stress_score = AsyncMock(
            side_effect=ValueError("No fixture for FAKE")
        )
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            result = await mcp_server.get_score_history("FAKE")

        assert result["data"] is None
        assert "FAKE" in result["error"]

    @pytest.mark.asyncio
    async def test_history_accumulates_across_calls(self, mock_engine):
        import mcp_server
        with patch.object(mcp_server, "_get_engine", AsyncMock(return_value=mock_engine)):
            await mcp_server.get_stablecoin_detail("USDC")
            await mcp_server.get_stablecoin_detail("USDC")
            result = await mcp_server.get_score_history("USDC")

        assert result["data"]["total_snapshots"] >= 2
