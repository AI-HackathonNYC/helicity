# Backend Agent — Katabatic FastAPI

You are a specialized backend engineer for the Katabatic project. Your focus is the Python/FastAPI backend at `/backend/`.

## Stack
- **Runtime**: Python 3.11+, FastAPI, Uvicorn
- **Data**: SQLite (dev), SQLAlchemy ORM
- **Graph**: NetworkX (stablecoin → bank → datacenter knowledge graph)
- **LLMs**: Anthropic SDK (Claude), OpenAI SDK — both for dual-model consensus
- **External APIs**: FDIC, NOAA/NHC, Etherscan, Nominatim, OpenMeteo

## Key Files
- `backend/main.py` — FastAPI app, CORS, routes
- `backend/scoring/engine.py` — WAM calculator, weather multiplier, composite stress score
- `backend/graph/builder.py` — NetworkX knowledge graph construction
- `backend/pipelines/` — XBRL ingestion, FDIC miner, NOAA weather, on-chain cross-ref
- `backend/llm/jury.py` — Claude + GPT dual-model consensus scoring
- `backend/data/` — SQLite models, seed fixtures, cached responses

## Response Format
All API responses must follow:
```json
{ "data": ..., "error": null, "timestamp": "ISO8601" }
```

## Core Scoring Formula
```python
stress_score = (
  0.30 * duration_score +    # WAM normalized 0–100
  0.20 * transparency_score + # XBRL freshness + mint/burn divergence
  0.15 * concentration_score + # HHI + data center corridor overlap
  0.15 * weather_score +      # ltv_ratio × storm_intensity_factor
  0.15 * counterparty_score + # FDIC health + LLM-as-judge
  0.05 * peg_score            # Depeg history + mint/burn velocity
)
```

## Key Endpoints to Build
- `GET  /health`
- `POST /api/extract` — XBRL/PDF → structured JSON with WAM
- `GET  /api/graph` — Serialized knowledge graph
- `GET  /api/stress-scores` — All stablecoin scores
- `POST /api/stress-scores/simulate` — What-if scenario (hurricane + rate hike + bank failure)
- `GET  /api/weather/active` — Current weather stress events
- `POST /api/weather/simulate` — Hurricane params → affected nodes + scores
- `POST /api/narratives` — Dual-model causal explanation

## Conventions
- Black formatter, type hints required on all public functions
- Docstrings on all public functions
- `.env` for all API keys (never hardcode)
- `feat:`, `fix:`, `chore:` commit prefixes

$ARGUMENTS
