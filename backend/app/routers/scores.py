"""Stress score API endpoints."""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/stress-scores", tags=["scores"])


class ProjectionRequest(BaseModel):
    stablecoin: str
    rate_hike_bps: Optional[int] = Field(default=None, ge=0, le=500)
    hurricane_lat: Optional[float] = None
    hurricane_lng: Optional[float] = None
    hurricane_category: Optional[int] = Field(default=None, ge=1, le=5)
    bank_failure: Optional[str] = None


@router.get("/")
async def get_all_stress_scores():
    """Return stress scores for all tracked stablecoins."""
    from main import envelope, scoring_engine

    if scoring_engine is None:
        raise HTTPException(status_code=503, detail="Scoring engine not initialized")

    results = await scoring_engine.compute_all_scores()
    return envelope(data=[r.model_dump() for r in results])


@router.post("/project")
async def project_scenario(body: ProjectionRequest):
    """Project stress score under a data-driven scenario.

    Accepts real-world scenario parameters (weather forecasts, rate expectations,
    bank health events) and returns baseline vs. projected scores with per-dimension deltas.
    """
    from main import envelope, scoring_engine

    if scoring_engine is None:
        raise HTTPException(status_code=503, detail="Scoring engine not initialized")

    try:
        result = await scoring_engine.project_scenario(
            symbol=body.stablecoin.upper(),
            rate_hike_bps=body.rate_hike_bps,
            hurricane_lat=body.hurricane_lat,
            hurricane_lng=body.hurricane_lng,
            hurricane_category=body.hurricane_category,
            bank_failure=body.bank_failure,
        )
        return envelope(data=result)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{stablecoin}")
async def get_stress_score(stablecoin: str):
    """Return detailed stress score for a single stablecoin."""
    from main import envelope, scoring_engine

    if scoring_engine is None:
        raise HTTPException(status_code=503, detail="Scoring engine not initialized")

    try:
        result = await scoring_engine.compute_stress_score(stablecoin.upper())
        return envelope(data=result.model_dump())
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
