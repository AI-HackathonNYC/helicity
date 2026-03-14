"""Pydantic models for stress scoring output and scenario parameters."""

from pydantic import BaseModel, Field
from typing import Optional


class DimensionScore(BaseModel):
    name: str
    score: float = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    weighted_score: float = Field(ge=0, le=100)
    detail: Optional[str] = None


class JuryResult(BaseModel):
    claude_score: float
    gemini_score: float
    delta: float
    consensus: bool
    averaged_score: float
    warning: Optional[str] = None


class NarrativeClaim(BaseModel):
    """A single factual claim extracted from an LLM narrative."""
    text: str
    supported_by: list[str]  # ["claude", "gemini"] or subset


class NarrativeResult(BaseModel):
    """Multi-model narrative with claim-level consensus detection."""
    narrative: str  # Final consensus or primary narrative text
    claude_narrative: Optional[str] = None
    gemini_narrative: Optional[str] = None
    claims: list[NarrativeClaim] = []
    consensus: bool = False
    overlap_pct: float = 0.0


class StressScoreResult(BaseModel):
    stablecoin: str
    stress_score: float = Field(ge=0, le=100)
    redemption_latency_hours: str
    liquidity_coverage_ratio: str
    stress_level: str = Field(description="Low, Moderate, Elevated, or Critical")
    dimensions: list[DimensionScore]
    jury: Optional[JuryResult] = None
    narrative: Optional[NarrativeResult] = None
    ipfs_cid: Optional[str] = None
    resolution_source: str = Field(default="fixture", description="live | cache | fixture — how underlying data was resolved")
    source_timestamp: Optional[str] = Field(default=None, description="ISO timestamp of when source data was fetched")


class HurricaneParams(BaseModel):
    lat: float
    lng: float
    category: int = Field(ge=1, le=5)


class ScenarioParams(BaseModel):
    stablecoin: str
    rate_hike_bps: Optional[int] = Field(default=None, ge=0, le=500)
    hurricane: Optional[HurricaneParams] = None
    bank_failure: Optional[str] = None


class BacktestEvent(BaseModel):
    date: str
    stress_score: float
    level: str
    latency_hours: str
    coverage_ratio: str
    wam_days: Optional[int] = None
    fed_rate_bps: Optional[int] = None
    unrealized_losses_B: Optional[float] = None
    usdc_peg: float = 1.00
    event: Optional[str] = None
    dimensions: list[DimensionScore] = []
    # Hurricane-specific fields
    hurricane_category: Optional[int] = None
    hurricane_lat: Optional[float] = None
    hurricane_lng: Optional[float] = None
    bank_avg_ltv: Optional[float] = None
    tusd_stress_score: Optional[float] = None


class BacktestResult(BaseModel):
    name: str
    description: str
    timeline: list[BacktestEvent]
    critical_date: Optional[str] = None
    key_insight: Optional[str] = None


class DetectedScenario(BaseModel):
    id: str
    type: str  # "weather", "rate", "bank"
    title: str
    description: str
    source: str  # "NOAA", "FDIC", "macro"
    severity: int = Field(ge=1, le=5)
    projection: Optional[dict] = None  # ProjectionResult dict per stablecoin
    affected_stablecoins: list[str] = []
