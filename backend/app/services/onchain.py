"""On-chain mint/burn cross-reference service.

Uses Etherscan V2 API to fetch ERC-20 token transfer data and validate
reserve attestation data against actual on-chain token flows.

Mints  = Transfer events from the zero address (new tokens issued).
Burns  = Transfer events to   the zero address (tokens redeemed/destroyed).

If $1B USDC is burned on-chain but the attestation shows no corresponding
decrease in custodian cash, the divergence is flagged as an opacity signal.

Graceful degradation: if ETHERSCAN_API_KEY is not set, returns fixture data.
Rate limiting: Etherscan free tier = 5 calls/sec (enforced via asyncio.Semaphore).
Caching: results stored in SQLite with a 1-hour TTL.
"""

import asyncio
import json
import os
import time
from pathlib import Path
from typing import Optional

import httpx

from app.models.reserve import OnchainCrossCheck, ReserveData
from app.services.cache import Cache

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ETHERSCAN_V2_URL = "https://api.etherscan.io/v2/api"
ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
DIVERGENCE_FLAG_THRESHOLD = 5.0  # percent — flag if divergence exceeds this
CACHE_TTL = 3600  # 1 hour

# Ethereum mainnet contract addresses
TOKEN_CONTRACTS: dict[str, str] = {
    "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "USDT": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "DAI": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
}

TOKEN_DECIMALS: dict[str, int] = {
    "USDC": 6,
    "USDT": 6,
    "DAI": 18,
}

# Fixture directories (newer /data/reserves/ preferred, legacy /data/fixtures/ as fallback)
_DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"
_RESERVES_DIR = _DATA_DIR / "reserves"
_FIXTURES_DIR = _DATA_DIR / "fixtures"

# Etherscan free tier: max 5 concurrent requests
_semaphore = asyncio.Semaphore(5)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _load_fixture(symbol: str) -> Optional[dict]:
    """Load onchain_cross_check dict from reserve fixture files.

    Checks /data/reserves/<symbol>.json first, then falls back to
    /data/fixtures/<symbol>_baseline.json (legacy format).

    Args:
        symbol: Stablecoin ticker (e.g. "USDC").

    Returns:
        onchain_cross_check dict, or None if no fixture exists.
    """
    sym = symbol.upper()

    for candidate in [
        _RESERVES_DIR / f"{sym.lower()}.json",
        _FIXTURES_DIR / f"{sym.lower()}_baseline.json",
    ]:
        if candidate.exists():
            with open(candidate) as fh:
                data = json.load(fh)
            cc = data.get("onchain_cross_check")
            if cc:
                return cc

    return None


async def etherscan_get(params: dict) -> dict:
    """Call the Etherscan V2 API with rate-limit enforcement.

    Injects chainid=1 (Ethereum mainnet) and the ETHERSCAN_API_KEY.
    Returns {"status": "0", "result": []} on any network or API error
    so callers can treat failures uniformly.

    Args:
        params: Query parameters (without apikey or chainid).

    Returns:
        Parsed JSON response, or a safe empty-result dict on failure.
    """
    request_params = dict(params)
    request_params["chainid"] = 1
    request_params["apikey"] = os.getenv("ETHERSCAN_API_KEY", "")

    async with _semaphore:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(ETHERSCAN_V2_URL, params=request_params)
                resp.raise_for_status()
                return resp.json()
        except Exception:
            return {"status": "0", "message": "NOTOK", "result": []}


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------


async def get_mint_burn_volume(
    token: str,
    days: int = 7,
    cache: Optional[Cache] = None,
) -> dict:
    """Fetch 7-day mint and burn volume for a stablecoin from Etherscan.

    Queries ERC-20 token transfers on Ethereum mainnet. Mints are transfers
    from the zero address; burns are transfers to the zero address. Values
    are converted from raw wei to USD using the token's decimal precision.

    Falls back to seed fixture data when ETHERSCAN_API_KEY is not set or
    when the API returns an error.

    Args:
        token: Stablecoin ticker (e.g. "USDC", "USDT", "DAI").
        days: Lookback window in calendar days (default 7).
        cache: Optional Cache instance. If provided, results are read from
            and written to the SQLite cache with a 1-hour TTL.

    Returns:
        dict with keys:
          - token (str): uppercased symbol
          - mint_7d_usd (float | None): minted USD volume over the period
          - burn_7d_usd (float | None): burned USD volume over the period
          - resolution_source (str): "live" | "cache" | "fixture"
    """
    sym = token.upper()
    cache_key = f"onchain:mint_burn:{sym}:{days}d"

    # 1. Try fresh cache entry
    if cache is not None:
        cached_value = await cache.get(cache_key)
        is_expired = await cache.is_expired(cache_key)
        if cached_value is not None and not is_expired:
            return {**cached_value, "resolution_source": "cache"}
    else:
        cached_value = None

    api_key = os.getenv("ETHERSCAN_API_KEY", "")
    contract = TOKEN_CONTRACTS.get(sym)

    # 2. No API key or unknown token → fixture fallback
    if not api_key or not contract:
        fixture = _load_fixture(sym)
        return {
            "token": sym,
            "mint_7d_usd": None,
            "burn_7d_usd": fixture.get("burn_7d_usd") if fixture else None,
            "resolution_source": "fixture",
        }

    # 3. Fetch live token transfers from Etherscan
    decimals = TOKEN_DECIMALS.get(sym, 18)
    cutoff_ts = int(time.time()) - days * 86400

    response = await etherscan_get(
        {
            "module": "account",
            "action": "tokentx",
            "contractaddress": contract,
            "sort": "desc",
            "offset": 1000,
            "page": 1,
        }
    )

    transactions = response.get("result", [])

    # API returned an error — fall back to stale cache then fixture
    if not isinstance(transactions, list):
        if cached_value is not None:
            return {**cached_value, "resolution_source": "cache"}
        fixture = _load_fixture(sym)
        return {
            "token": sym,
            "mint_7d_usd": None,
            "burn_7d_usd": fixture.get("burn_7d_usd") if fixture else None,
            "resolution_source": "fixture",
        }

    mint_wei = 0
    burn_wei = 0
    for tx in transactions:
        ts = int(tx.get("timeStamp", 0))
        if ts < cutoff_ts:
            # Results are sorted descending; once we're past the window, stop.
            break
        value = int(tx.get("value", 0))
        from_addr = (tx.get("from") or "").lower()
        to_addr = (tx.get("to") or "").lower()

        if from_addr == ZERO_ADDRESS:
            mint_wei += value
        elif to_addr == ZERO_ADDRESS:
            burn_wei += value

    result = {
        "token": sym,
        "mint_7d_usd": round(mint_wei / (10**decimals), 2),
        "burn_7d_usd": round(burn_wei / (10**decimals), 2),
        "resolution_source": "live",
    }

    if cache is not None:
        await cache.set(cache_key, result, ttl=CACHE_TTL)

    return result


async def compute_divergence(burn_volume: float, custodian_delta: float) -> dict:
    """Compare on-chain burn volume to the attestation custodian cash delta.

    A divergence >5% between what was burned on-chain and the corresponding
    outflow from custodian cash is flagged as a reserve transparency signal.
    This is the key insight: if $1B USDC is redeemed (burned) but custodian
    cash only decreased by $940M, that $60M gap is suspicious.

    Args:
        burn_volume: 7-day burn volume in USD (positive number).
        custodian_delta: Change in custodian cash in USD from the attestation.
            Typically negative (cash left the custodian). Absolute value used.

    Returns:
        dict with keys:
          - divergence_pct (float): percentage gap between burn and cash outflow
          - flag (bool): True if divergence_pct > 5%
    """
    if burn_volume == 0:
        return {"divergence_pct": 0.0, "flag": False}

    cash_outflow = abs(custodian_delta)
    divergence_pct = abs(burn_volume - cash_outflow) / burn_volume * 100.0

    return {
        "divergence_pct": round(divergence_pct, 2),
        "flag": divergence_pct > DIVERGENCE_FLAG_THRESHOLD,
    }


async def cross_reference_stablecoin(
    stablecoin: str,
    reserve_data: ReserveData,
    cache: Optional[Cache] = None,
) -> OnchainCrossCheck:
    """Run the full on-chain cross-reference pipeline for a stablecoin.

    Fetches 7-day mint/burn volume from Etherscan and compares it to the
    custodian cash delta reported in the reserve attestation. Falls back
    to the attestation's own cross-check values when live data is unavailable.

    Args:
        stablecoin: Stablecoin ticker (e.g. "USDC").
        reserve_data: Parsed ReserveData from the attestation report.
        cache: Optional Cache instance for caching intermediate results.

    Returns:
        OnchainCrossCheck with burn_7d_usd, custodian_cash_delta,
        and divergence_pct populated.
    """
    mb = await get_mint_burn_volume(stablecoin, days=7, cache=cache)
    live_burn = mb.get("burn_7d_usd")

    attestation_cc = reserve_data.onchain_cross_check
    custodian_delta = (
        attestation_cc.custodian_cash_delta if attestation_cc else None
    )

    if live_burn is not None and custodian_delta is not None:
        div = await compute_divergence(live_burn, custodian_delta)
        divergence_pct: Optional[float] = div["divergence_pct"]
        burn_7d_usd = live_burn
    elif attestation_cc is not None:
        # Live data unavailable — use values from the attestation itself
        burn_7d_usd = live_burn if live_burn is not None else attestation_cc.burn_7d_usd
        custodian_delta = attestation_cc.custodian_cash_delta
        divergence_pct = attestation_cc.divergence_pct
    else:
        burn_7d_usd = live_burn
        divergence_pct = None

    return OnchainCrossCheck(
        burn_7d_usd=burn_7d_usd,
        custodian_cash_delta=custodian_delta,
        divergence_pct=divergence_pct,
    )
