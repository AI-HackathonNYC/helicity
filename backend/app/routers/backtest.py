"""Backtest API endpoints — historical replay of stress scoring."""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/backtests", tags=["backtests"])


@router.get("/")
async def list_backtests():
    """List available backtests."""
    from main import envelope

    return envelope(data=[
        {
            "id": "svb",
            "name": "SVB Collapse — March 2023",
            "description": "Silicon Valley Bank collapse replay. Shows stress score crossing Critical threshold ~48h before USDC depeg.",
            "data_points": 15,
            "date_range": "2023-03-01 to 2023-03-15",
        },
        {
            "id": "hurricane-ian",
            "name": "Hurricane Ian — September 2022",
            "description": "Cat 4 hurricane landfall at Fort Myers, FL. Demonstrates weather tail-risk multiplier on stablecoins with FL bank exposure and elevated mortgage LTV ratios.",
            "data_points": 16,
            "date_range": "2022-09-20 to 2022-10-05",
        },
    ])


@router.get("/svb")
async def get_svb_backtest():
    """Return full SVB backtest timeline with day-by-day stress scores and dimension breakdowns."""
    from main import envelope
    from app.services.backtest_svb import run_svb_backtest

    result = await run_svb_backtest()
    return envelope(data=result.model_dump())


@router.get("/svb/summary")
async def get_svb_summary():
    """Return SVB backtest summary — key insight: flagged Critical 48h before depeg."""
    from main import envelope
    from app.services.backtest_svb import get_svb_summary

    result = await get_svb_summary()
    return envelope(data=result)


@router.get("/hurricane-ian")
async def get_ian_backtest():
    """Return full Hurricane Ian backtest timeline with day-by-day stress scores."""
    from main import envelope
    from app.services.backtest_ian import run_ian_backtest

    result = await run_ian_backtest()
    return envelope(data=result.model_dump())


@router.get("/hurricane-ian/summary")
async def get_ian_summary():
    """Return Hurricane Ian backtest summary — weather tail-risk as primary driver."""
    from main import envelope
    from app.services.backtest_ian import get_ian_summary

    result = await get_ian_summary()
    return envelope(data=result)
