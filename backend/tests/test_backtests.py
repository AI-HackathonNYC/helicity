"""Unit tests for backtest services — SVB + Hurricane Ian."""

import pytest
from app.services.backtest_svb import run_svb_backtest, get_svb_summary
from app.services.backtest_ian import run_ian_backtest, get_ian_summary


class TestSvbBacktest:
    @pytest.mark.asyncio
    async def test_returns_15_data_points(self):
        result = await run_svb_backtest()
        assert len(result.timeline) == 15

    @pytest.mark.asyncio
    async def test_critical_date_is_march_8(self):
        result = await run_svb_backtest()
        assert result.critical_date == "2023-03-08"

    @pytest.mark.asyncio
    async def test_peak_score_is_97(self):
        result = await run_svb_backtest()
        peak = max(result.timeline, key=lambda e: e.stress_score)
        assert peak.stress_score == 97
        assert peak.date == "2023-03-11"

    @pytest.mark.asyncio
    async def test_wam_is_2040(self):
        result = await run_svb_backtest()
        for event in result.timeline:
            assert event.wam_days == 2040

    @pytest.mark.asyncio
    async def test_dimensions_present(self):
        result = await run_svb_backtest()
        for event in result.timeline:
            assert len(event.dimensions) == 6

    @pytest.mark.asyncio
    async def test_summary(self):
        summary = await get_svb_summary()
        assert summary["critical_date"] == "2023-03-08"
        assert summary["peak_stress_score"] == 97
        assert summary["early_warning_hours"] > 0


class TestIanBacktest:
    @pytest.mark.asyncio
    async def test_returns_16_data_points(self):
        result = await run_ian_backtest()
        assert len(result.timeline) == 16

    @pytest.mark.asyncio
    async def test_peak_on_sept_28(self):
        result = await run_ian_backtest()
        peak = max(result.timeline, key=lambda e: e.stress_score)
        assert peak.stress_score == 61
        assert peak.date == "2022-09-28"

    @pytest.mark.asyncio
    async def test_hurricane_category_present(self):
        result = await run_ian_backtest()
        landfall = [e for e in result.timeline if e.date == "2022-09-28"][0]
        assert landfall.hurricane_category == 4
        assert landfall.hurricane_lat == 26.64

    @pytest.mark.asyncio
    async def test_ltv_rises_with_storm(self):
        result = await run_ian_backtest()
        first = result.timeline[0]
        peak_day = [e for e in result.timeline if e.date == "2022-09-28"][0]
        assert peak_day.bank_avg_ltv > first.bank_avg_ltv

    @pytest.mark.asyncio
    async def test_dimensions_present(self):
        result = await run_ian_backtest()
        for event in result.timeline:
            assert len(event.dimensions) == 6

    @pytest.mark.asyncio
    async def test_tusd_stress_included(self):
        result = await run_ian_backtest()
        landfall = [e for e in result.timeline if e.date == "2022-09-28"][0]
        assert landfall.tusd_stress_score == 71

    @pytest.mark.asyncio
    async def test_summary(self):
        summary = await get_ian_summary()
        assert summary["peak_stress_score"] == 61
        assert summary["peak_hurricane_category"] == 4
