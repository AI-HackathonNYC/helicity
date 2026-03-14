# Helicity — Master Task List

> **IMPORTANT:** This file is the source of truth for all project work. Update task status (`[ ]` → `[x]`) immediately when completed. Claude must edit this file every time a task is finished.

**Legend:** `[ ]` = pending · `[x]` = done · `[~]` = in progress · `[!]` = blocked

### Product Positioning — API-First Infrastructure + Data-Driven Risk Modeling

Helicity is an **API-first data infrastructure product** with a **data-driven risk modeling sandbox** for humans. The dashboard surfaces real-world data (live NOAA weather, FDIC bank health, on-chain flows) and projects how current events will impact stablecoin reserve liquidity. AI agents handle deeper modeling via API/MCP.

**Three delivery modes:**
1. **Risk Modeling Dashboard** — Data-driven sandbox for humans to see how real-world events impact reserve risk
2. **REST API** — Programmatic access for DAO governance, DeFi protocols, risk desks
3. **MCP Server** — AI-agent-native delivery for trading bots and agent frameworks

**Priority order for hackathon:** REST API endpoints → Scoring Engine → Dashboard → MCP server → IPFS pinning → Chainlink oracle mock

---

## Phase 1: Foundation (Hours 0–4) · Fri Evening

### Monorepo & Scaffold
- [x] Create `/backend` directory with FastAPI skeleton (`main.py`, `requirements.txt`, `.env.example`)
- [x] Create `/frontend` directory with Vite + React (`npm create vite@latest`)
- [x] Create `/data` directory with subdirs: `/data/extracted/`, `/data/fixtures/`, `/data/call_reports/`
- [x] Create `/scripts` directory for one-off processing scripts
- [x] Add root-level `.gitignore` (env files, `__pycache__`, `node_modules`, `.DS_Store`, `*.sqlite`)
- [ ] Create `dev` branch from `main`, push scaffold commits

### Backend Bootstrap
- [x] Install FastAPI, uvicorn, python-dotenv, httpx, networkx, anthropic, google-genai into `requirements.txt`
- [x] Implement `/health` endpoint returning `{ "status": "ok", "timestamp": "..." }`
- [x] Configure CORS middleware (allow all origins for dev, restrict to frontend origin in prod)
- [x] Set up `.env` loading with `python-dotenv` — all API keys read from env
- [x] Create `app/` package structure: `app/routers/`, `app/services/`, `app/models/`, `app/db/`
- [ ] Set up SQLite with `app/db/database.py` — tables: `reserve_data`, `stress_scores`, `api_cache`
- [x] Implement API response envelope: `{ "data": ..., "error": null, "timestamp": "...", "resolution_source": "live|cache|fixture" }` as a shared utility
- [x] Write `app/models/reserve.py` — Pydantic models for the reserve JSON schema (stablecoin, counterparties, onchain_cross_check)
- [x] Write `app/models/stress.py` — Pydantic models for stress score output (score, latency, coverage, dimensions)

### Frontend Bootstrap
- [x] Install dependencies: `tailwindcss`, `recharts`, `leaflet`, `react-leaflet`, `react-router-dom`
- [x] Configure Tailwind CSS with Helicity color palette (see Design System in CLAUDE.md)
- [x] Create layout shell with header nav + main content area
- [x] Create route structure: `/` (dashboard), `/stablecoin/:symbol` (detail view), `/map` (full map)
- [x] Create `src/lib/api.ts` — typed fetch wrapper pointing to backend base URL
- [x] Add `.env` for `VITE_API_URL`

### Data Provider Layer + Fixtures

> **Architecture:** Every data source follows a 3-tier resolution pattern: **Live API → SQLite Cache (TTL) → Fixture Fallback**. Every API response includes a `data_source` field (`"live"`, `"cache"`, `"fixture"`) so the UI shows data provenance.

- [x] Build `app/services/data_provider.py` — abstract base class with `Live→Cache→Fixture` resolution pattern + `DataResult` model carrying `source` provenance field
- [x] Build `app/services/cache.py` — async SQLite cache with TTL-based `get`/`set`/`invalidate`
- [x] Build `app/services/fdic_provider.py` — FDIC BankFind API client (no auth needed). Derives WAM proxy and LTV proxy
- [x] Build `app/services/weather_provider.py` — NOAA NWS alerts + Open-Meteo historical weather
- [x] Build `app/services/etherscan_provider.py` — Etherscan V2 API for mint/burn cross-reference
- [x] Build `app/services/nominatim_provider.py` — Nominatim geocoding (1 req/sec rate limit)
- [x] Validate existing fixtures as fallback layer (`usdc_baseline.json`, `usdt_baseline.json`, `svb_march2023.json`)
- [ ] Author `data/fixtures/dai_baseline.json` — DAI with mixed collateral
- [ ] Author additional stablecoin fixtures (FRAX, BUSD, PYUSD)
- [x] Build `backend/scripts/warm_cache.py` — one-shot script to pre-populate SQLite cache
- [x] Add `data_source` provenance field to all API response models
- [ ] Tag `v0.1-foundation`

---

## Phase 2: Pipeline & Knowledge Graph (Hours 4–12) · Sat Morning

### feat/data-ingestion

#### Unsiloed AI + Claude Extraction Pipeline (Sponsor Integration)
- [ ] Create Unsiloed AI account + get API credentials from Discord
- [ ] Write `app/services/unsiloed_provider.py` — Unsiloed vision model client for PDF table extraction
- [ ] Write `app/services/extractor.py` — async function `extract_xbrl(feed_url: str) -> ReserveData`
- [ ] Pipeline: PDF → Unsiloed AI (table/visual extraction) → structured JSON → Claude (risk signal interpretation)
- [ ] Build Claude API prompt chain for OCC XBRL parsing
- [ ] Build PDF fallback parser for non-GENIUS-Act-compliant stablecoins
- [ ] Implement extraction retry logic (max 3 attempts)
- [ ] Cache extraction results in SQLite
- [ ] Add `UNSILOED_API_KEY` to `.env.example` and backend startup validation
- [ ] Graceful fallback: if Unsiloed unavailable, fall back to Claude-only extraction

#### On-Chain Cross-Reference
- [ ] Write `app/services/onchain.py` — `get_mint_burn_7d(token_address: str) -> MintBurnData`
- [ ] Parse Transfer events from Etherscan to compute 7-day net burn/mint volume
- [ ] Cross-reference divergence calculator (flag >5% as transparency anomaly)

#### Endpoints
- [ ] `POST /api/extract` — accepts attestation source, returns structured ReserveData JSON
- [ ] `GET /api/stablecoins` — returns list of all tracked stablecoins with latest reserve data

---

### feat/knowledge-graph

#### Graph Construction
- [x] Write `app/services/knowledge_graph.py` — `KnowledgeGraphService` with `build_from_reserves()`
- [x] Node types: Stablecoin, Bank, DataCenterCorridor, State
- [x] Edge types: `holds_reserves_at`, `processes_ops_via`, `located_in`
- [x] Hardcode data center corridor definitions (us-east-1, us-east-2, us-west-2, us-central, eu-west-1)

#### Graph Query Functions
- [x] `get_exposed_stablecoins(state)` — returns stablecoins with counterparties in state
- [x] `get_duration_risk(symbol)` — weighted average maturity across counterparties
- [x] `get_concentration_hhi(symbol)` — Herfindahl-Hirschman Index
- [x] `get_ops_risk_by_state(state)` — find affected data center corridors
- [x] `get_corridors_in_radius(lat, lng, radius)` — corridors within storm radius
- [x] `serialize()` — JSON-serializable graph for frontend

#### Stablecoin Registry
- [x] Write `app/services/registry.py` — single source of truth for tracked stablecoins
- [x] USDC and USDT configs with contract addresses, FDIC certs, fixture paths
- [x] Helper functions: `get_all_symbols()`, `get_reserve_data()`, `get_fdic_certs_for()`

#### Endpoints
- [x] `GET /api/graph` — returns full serialized graph for frontend Leaflet rendering

---

### feat/scoring-engine

#### Dimension Calculators
- [x] Write `app/services/scoring_engine.py` — `ScoringEngine` class with 6 dimension methods

- [x] **Dimension 1 — Duration Risk (30% weight):** `score = min(100, wam_days / 365 * 100)`
- [x] **Dimension 2 — Reserve Transparency (20% weight):** source type + staleness + divergence + opacity
- [x] **Dimension 3 — Geographic Concentration (15% weight):** HHI + corridor concentration + ops risk
- [x] **Dimension 4 — Weather Tail-Risk (15% weight):** live NOAA alerts × LTV × state weight
- [x] **Dimension 5 — Counterparty Health (15% weight):** FDIC data + LLM jury (optional)
- [x] **Dimension 6 — Peg Stability (5% weight):** on-chain divergence + burn velocity

#### Composite Scoring
- [x] `compute_stress_score(symbol)` — runs all 6 dimensions, weighted sum composite
- [x] Score mapping: 0-25 Low, 26-50 Moderate, 51-75 Elevated, 76-100 Critical
- [x] `compute_all_scores()` — batch scoring for all tracked stablecoins

#### LLM Jury
- [x] Write `app/services/llm_jury.py` — `LLMJuryService`
- [x] Claude + Gemini consensus scoring with `asyncio.gather`
- [x] Delta detection (flag if >15 points divergence)
- [x] Narrative generation
- [x] Graceful fallback when API keys not set

#### Endpoints
- [x] `GET /api/stress-scores` — returns all stablecoin stress scores with dimension breakdowns
- [x] `GET /api/stress-scores/{stablecoin}` — returns detailed stress score for one stablecoin

- [ ] Tag `v0.2-pipeline`

---

### feat/mcp-server — Core Delivery Channel

> **This is a core delivery channel, equal to REST API.** AI trading bots and agent frameworks query risk scores as MCP tool calls before executing stablecoin positions.

#### MCP Server Implementation
- [ ] Add `fastmcp` SDK to `requirements.txt`
- [ ] Write `backend/mcp_server.py` — standalone MCP server module
- [ ] Implement tool: `get_stress_scores` — returns all stablecoin stress scores
- [ ] Implement tool: `get_stablecoin_detail(stablecoin)` — returns WAM, dimensions, narrative
- [ ] Implement tool: `simulate_scenario(stablecoin, ...)` — scenario-based re-scoring
- [ ] Implement tool: `get_active_alerts` — returns weather events + anomalies
- [ ] Implement tool: `get_score_history(stablecoin)` — returns historical scores with IPFS CIDs
- [ ] Support stdio transport for local AI agent integration
- [ ] Support streamable-http transport for Blaxel deployment
- [ ] All tool outputs use standard response envelope
- [ ] Write `backend/tests/test_mcp_server.py` — unit tests for all tools

#### Blaxel Deployment (Sponsor Integration)
- [ ] Create `backend/blaxel.toml` — Blaxel config (`type = "function"`, runtime transport = `http-stream`)
- [ ] Create `backend/Dockerfile` — containerized MCP server for Blaxel deployment
- [ ] Configure MCP server to read `HOST`/`PORT` env vars for Blaxel compatibility
- [ ] Install Blaxel CLI (`brew tap blaxel-ai/blaxel && brew install blaxel`)
- [ ] Authenticate with `bl login`
- [ ] Deploy MCP server to Blaxel with `bl deploy`
- [ ] Verify live endpoint: `https://run.blaxel.ai/{workspace}/functions/helicity-mcp/mcp`
- [ ] Add Blaxel API keys to `.env` if needed (`BL_WORKSPACE`, `BL_API_KEY`)

---

## Phase 3: Data-Driven Risk Modeling Dashboard (Hours 12–20) · Sat Afternoon

> **The dashboard is a data-driven modeling sandbox** — it surfaces real-world data (live NOAA weather, FDIC bank health, on-chain flows) and shows how current events will impact stablecoin reserve liquidity. Not arbitrary user-defined scenarios, but projections grounded in live data.

### feat/dashboard

#### Stress Score Table (Main Dashboard)
- [x] Create `StressScoreTable.tsx` — table with score bar, level badge, latency, coverage, source
- [x] Color coding: green 0–25, orange 26–75, red 76–100
- [x] Clickable rows navigate to `/stablecoin/:symbol`
- [x] Auto-refreshes via `usePolling` hook (60s interval)

#### Alert Banner
- [x] Create `AlertBanner.tsx` — shows active NOAA weather alerts with ops impact
- [x] Fetches from `GET /api/weather/active` every 5 minutes
- [x] Highlights severe alerts and affected data center corridors

#### Stablecoin Detail View
- [x] Create `StressScoreDetail.tsx` — full detail for a single stablecoin
- [x] Hero score card with latency and coverage
- [x] 6-dimension breakdown chart (Recharts BarChart)
- [x] Model consensus panel (Claude vs Gemini)
- [x] Causal narrative section
- [x] Data source badge on every data point

#### Reserve Network Map
- [x] Create `ReserveMap.tsx` — Leaflet map (view-only, data-driven)
- [x] Bank markers: circle markers sized by reserve %, colored by health
- [x] Data center corridor overlays: shaded rectangles with labels
- [x] Popup details on hover: bank name, state, LTV, maturity, reserves

#### Layout & Navigation
- [x] Create `Header.tsx` with nav links + live status indicator
- [x] Create `DashboardLayout.tsx` wrapping Header + Outlet
- [x] Routes: `/` (dashboard), `/stablecoin/:symbol` (detail), `/map` (full map)

#### UI Polish
- [ ] Loading skeleton components for all data-fetching states
- [ ] Empty state component for no-data scenarios
- [ ] Error boundary with retry button
- [ ] Never use "rating" or "grade" in any UI copy

---

### feat/narratives

#### Multi-Model Narrative Generation
- [x] Write `app/services/narratives.py` — `generate_narrative(stress_context) -> NarrativeResult`
- [x] Build narrative prompt with causal chain focus
- [x] Call Claude and Gemini concurrently, compare claim overlap
- [x] Consensus narrative if >70% claims match

#### Endpoint
- [x] `POST /api/narratives` — accepts stress context, returns narrative + consensus

#### Frontend Integration
- [x] Create `NarrativeCard.tsx` with consensus badge
- [x] Integrate into StablecoinDetail page

- [ ] Tag `v0.3-dashboard`

---

## Phase 4: Backtests & Trust Layer (Hours 20–26) · Sat Night

### feat/svb-backtest

#### SVB Data & Timeline
- [x] Create `data/backtests/svb_timeline.json` — 15 daily data points, March 1–15, 2023
- [x] Write `app/services/backtest_svb.py` — `run_svb_backtest() -> BacktestResult` with dimension breakdowns
- [x] Identify day stress score first crossed 75 ("Critical") — March 8, 48h before depeg

#### Endpoints
- [x] `GET /api/backtests/svb` — returns SVB timeline + stress scores + dimension breakdowns
- [x] `GET /api/backtests/svb/summary` — returns key insight: "Flagged critical 48h before depeg"

#### Frontend — Backtest Timeline
- [ ] Create `BacktestTimeline.tsx` — Recharts LineChart with annotations
- [ ] Create `TimelineScrubber.tsx` — date slider with summary card

### feat/hurricane-ian-backtest

#### Hurricane Ian Data & Timeline
- [x] Create `data/backtests/hurricane_ian.json` — 16 daily data points, Sept 20 – Oct 5, 2022
- [x] Write `app/services/backtest_ian.py` — `run_ian_backtest() -> BacktestResult` with dimension breakdowns
- [x] Track Cat 4 landfall stress: USDC 28→61, TUSD 31→71, FL bank LTV 0.68→0.76

#### Endpoints
- [x] `GET /api/backtests/hurricane-ian` — returns Hurricane Ian timeline + stress scores + dimensions
- [x] `GET /api/backtests/hurricane-ian/summary` — returns key insight: weather tail-risk as primary driver
- [x] Updated `GET /api/backtests/` list to include both SVB and Hurricane Ian

#### Tests
- [x] 13 backtest tests passing (6 SVB + 7 Hurricane Ian)

---

### feat/ipfs-pinning — Core Infrastructure (Pinata API)

**Backend — IPFS Pinning**
- [ ] Write `app/services/ipfs.py` — `pin_score_to_ipfs(score_data) -> PinResult`
- [ ] Endpoint: `POST /api/publish-score` — pins to Pinata, returns CID + gateway URL
- [ ] Endpoint: `GET /api/score-history/{stablecoin}` — returns historical pinned scores
- [ ] Auto-pin after every scoring run
- [ ] Graceful degradation if `PINATA_API_KEY` missing

**Frontend — IPFS Verification Display**
- [ ] Create `TrustBadge.tsx` — consensus badge + IPFS CID link + "TEE-Ready" label

---

### feat/chainlink-mock — Oracle-Ready Output

- [ ] Write `app/services/oracle.py` — Chainlink External Adapter compatible output
- [ ] Endpoint: `GET /api/oracle/{stablecoin}` — oracle-formatted score with IPFS CID

---

### feat/demo-polish

#### Graceful Degradation
- [x] Data source badge component (Live/Cached/Fixture)
- [x] Automatic 3-tier fallback (Live→Cache→Fixture)

#### End-to-End Wiring
- [ ] Wire dashboard end-to-end: live NOAA → scoring engine → scores update → dashboard reflects
- [x] Wire detail view: click stablecoin → all 6 dimensions rendered → narrative if LLM keys set
- [ ] Wire map: graph data → bank markers + corridor overlays rendered correctly
- [ ] Test all paths on local dev before deploy
- [ ] Add loading states and error handling for all async operations

- [ ] Tag `v0.4-backtests`

---

## Phase 5: Ship (Hours 26–36) · Sun Morning

### Deployment
- [ ] Configure Vercel project for `/frontend` — set `VITE_API_URL` env var
- [ ] Configure Railway/Render project for `/backend` — set all API keys as env vars
- [ ] Update frontend `.env.production` with deployed backend URL
- [ ] Configure CORS in backend to allow Vercel frontend origin
- [ ] Run full deploy
- [ ] Smoke test on deployed URLs
- [ ] Verify `/health` endpoint returns 200 on deployed backend

### Final Polish
- [ ] Code freeze at Hour 30
- [ ] Run `black .` on all Python files
- [ ] Run `eslint` and `tsc --noEmit` on frontend — fix all errors
- [ ] Remove all `console.log` and `print()` debug statements
- [ ] Verify all API keys are in `.env` and not committed to git

### Portal Submission (Required for Webapp)
- [ ] Create Portal account at https://www.makeportals.com/ (same email as hackathon signup)
- [ ] Create Portal link pointing to deployed dashboard URL
- [ ] Verify judges can interact with: stress score table, detail view, map, developer portal
- [ ] Include Portal link in video demo submission
- [ ] Add Portal link to README

### Demo Prep
- [ ] Rehearse 10-slide presentation 5× (target: < 4 minutes total)
- [ ] Record screen capture backup of full demo
- [ ] Prepare fallback: browser tab pre-loaded with cached data

### Final Git
- [ ] Merge `dev` → `main`
- [ ] Tag `v1.0-demo`
- [ ] Confirm GitHub repo is accessible to judges

---

## Cross-Cutting Concerns (Do Throughout)

### Testing
- [ ] Write `backend/tests/test_scoring.py` — unit tests for all 6 dimension calculators
- [ ] Write `backend/tests/test_graph.py` — unit tests for graph query functions
- [ ] Write `frontend/src/__tests__/StressScoreTable.test.tsx` — render test with fixture data

### API Key Validation
- [x] On backend startup: validate all required env vars are set, log warning if any missing
- [x] Graceful degradation: if NOAA API unreachable → skip, continue with baseline scores
- [x] Graceful degradation: if Etherscan key missing → skip on-chain cross-reference

---

## Environment Variables Checklist

- [ ] `ANTHROPIC_API_KEY` — obtained and set in `.env` (required for LLM jury + narratives)
- [ ] `GEMINI_API_KEY` — obtained and set in `.env` (required for multi-model consensus)
- [ ] `ETHERSCAN_API_KEY` — obtained from etherscan.io (required for on-chain cross-reference)
- [ ] `PINATA_API_KEY` — obtained from pinata.cloud (required for IPFS score pinning)
- [ ] `PINATA_SECRET_API_KEY` — obtained from pinata.cloud

> **No API key needed for:** NOAA NWS (User-Agent header only), Open-Meteo (fully public), FDIC BankFind (fully public), Nominatim (User-Agent only)

**Frontend config:**
- [ ] `VITE_API_URL` — set to backend URL (local: `http://localhost:8000`, prod: Railway URL)

---

## Progress Tracker

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | `[x]` | Scaffold, providers, fixtures, models done |
| Phase 2: Pipeline & Knowledge Graph | `[~]` | Scoring engine, graph, registry, routers done. MCP + extraction pending. |
| Phase 3: Data-Driven Risk Modeling Dashboard | `[~]` | Core components built. Narratives complete (17 tests passing). Polish pending. |
| Phase 4: Backtests & Trust Layer | `[ ]` | |
| Phase 5: Ship | `[ ]` | |

**Last updated:** 2026-03-14 (Hurricane Ian backtest + API portal route — issues #16 + #32)
