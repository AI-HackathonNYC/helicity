"""IPFS pinning endpoints — publish and retrieve verified scores."""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["ipfs"])


class PublishRequest(BaseModel):
    stablecoin: str


@router.post("/publish-score")
async def publish_score(body: PublishRequest):
    """Pin a score snapshot to IPFS via Pinata. Returns CID and gateway URL."""
    from main import envelope, scoring_engine
    from app.services.ipfs import pin_score_to_ipfs, store_published_score

    if scoring_engine is None:
        raise HTTPException(status_code=503, detail="Scoring engine not initialized")

    try:
        result = await scoring_engine.compute_stress_score(body.stablecoin.upper())
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))

    timestamp = datetime.now(timezone.utc).isoformat()

    # Build snapshot to pin
    snapshot = {
        "stablecoin": result.stablecoin,
        "stress_score": result.stress_score,
        "level": result.stress_level,
        "latency_hours": result.redemption_latency_hours,
        "coverage_ratio": result.liquidity_coverage_ratio,
        "dimensions": [d.model_dump() for d in result.dimensions],
        "timestamp": timestamp,
        "version": "helicity-v1",
    }

    # Add jury data if available
    if result.jury:
        snapshot["claude_score"] = result.jury.claude_score
        snapshot["gemini_score"] = result.jury.gemini_score
        snapshot["consensus"] = result.jury.consensus
        snapshot["delta"] = result.jury.delta

    # Add narrative if available
    if result.narrative:
        snapshot["narrative"] = result.narrative.narrative

    pin_result = await pin_score_to_ipfs(snapshot)

    record = {
        "cid": pin_result["cid"],
        "ipfs_url": pin_result["ipfs_url"],
        "mock": pin_result["mock"],
        "snapshot": snapshot,
        "timestamp": timestamp,
    }
    store_published_score(record)

    return envelope(data=record)


@router.get("/scores/verified")
async def get_verified_scores():
    """Return all published scores with their IPFS CIDs."""
    from main import envelope
    from app.services.ipfs import get_published_scores

    return envelope(data=get_published_scores())
