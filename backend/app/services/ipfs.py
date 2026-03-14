"""IPFS pinning via Pinata — pins score snapshots for verifiable provenance."""

import os
from datetime import datetime, timezone

import httpx

PINATA_API = "https://api.pinata.cloud"

# In-memory store of published scores (persists for process lifetime)
_published_scores: list[dict] = []


async def pin_score_to_ipfs(score_snapshot: dict) -> dict:
    """Pin a score snapshot to IPFS via Pinata. Returns CID and gateway URL.

    Falls back to mock mode when API keys are not set.
    """
    api_key = os.getenv("PINATA_API_KEY")
    secret_key = os.getenv("PINATA_SECRET_API_KEY")

    if not api_key or not secret_key:
        mock_cid = f"QmMock{score_snapshot.get('stablecoin', 'X')}Demo"
        return {
            "cid": mock_cid,
            "ipfs_url": f"https://gateway.pinata.cloud/ipfs/{mock_cid}",
            "mock": True,
        }

    stablecoin = score_snapshot.get("stablecoin", "unknown")
    ts = score_snapshot.get("timestamp", "")

    headers = {
        "pinata_api_key": api_key,
        "pinata_secret_api_key": secret_key,
        "Content-Type": "application/json",
    }
    payload = {
        "pinataContent": score_snapshot,
        "pinataMetadata": {
            "name": f"helicity-score-{stablecoin}-{ts}",
        },
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{PINATA_API}/pinning/pinJSONToIPFS",
            json=payload,
            headers=headers,
        )
        resp.raise_for_status()
        data = resp.json()
        cid = data["IpfsHash"]
        return {
            "cid": cid,
            "ipfs_url": f"https://gateway.pinata.cloud/ipfs/{cid}",
            "mock": False,
        }


def store_published_score(record: dict) -> None:
    """Append a published score record to in-memory history."""
    _published_scores.append(record)


def get_published_scores() -> list[dict]:
    """Return all published score records (newest first)."""
    return list(reversed(_published_scores))
