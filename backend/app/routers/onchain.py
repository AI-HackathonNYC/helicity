"""On-chain cross-reference API endpoints.

Exposes mint/burn volume and reserve divergence data fetched from Etherscan
for all tracked stablecoins (USDC, USDT, and any others in the registry).
"""

import asyncio

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/onchain", tags=["onchain"])


@router.get("/")
async def get_all_onchain():
    """Return on-chain cross-reference data for all tracked stablecoins.

    Runs cross-reference pipelines concurrently. Individual failures are
    captured per-stablecoin and do not fail the whole response.
    """
    from main import cache, envelope
    from app.services.onchain import cross_reference_stablecoin
    from app.services.registry import get_all_symbols, get_reserve_data

    async def _fetch(symbol: str) -> dict:
        try:
            reserve = get_reserve_data(symbol)
            cc = await cross_reference_stablecoin(symbol, reserve, cache=cache)
            return {
                "stablecoin": symbol,
                "onchain_cross_check": cc.model_dump(),
                "error": None,
            }
        except Exception as exc:
            return {
                "stablecoin": symbol,
                "onchain_cross_check": None,
                "error": str(exc),
            }

    results = await asyncio.gather(*[_fetch(sym) for sym in get_all_symbols()])
    return envelope(data=list(results))


@router.get("/{stablecoin}")
async def get_onchain(stablecoin: str):
    """Return on-chain cross-reference data for a single stablecoin.

    Args:
        stablecoin: Ticker symbol, e.g. "USDC" or "USDT" (case-insensitive).

    Returns 404 if the stablecoin is not tracked.
    """
    from main import cache, envelope
    from app.services.onchain import cross_reference_stablecoin
    from app.services.registry import get_reserve_data

    sym = stablecoin.upper()

    try:
        reserve = get_reserve_data(sym)
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    try:
        cc = await cross_reference_stablecoin(sym, reserve, cache=cache)
        return envelope(
            data={
                "stablecoin": sym,
                "onchain_cross_check": cc.model_dump(),
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
