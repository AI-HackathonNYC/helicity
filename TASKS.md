# Katabatic — Master Task List

> **IMPORTANT:** This file is the source of truth for all project work. Update task status (`[ ]` → `[x]`) immediately when completed. Claude must edit this file every time a task is finished.

**Legend:** `[ ]` = pending · `[x]` = done · `[~]` = in progress · `[!]` = blocked

---

## Phase 1: Foundation (Hours 0–4) · Fri Evening

### Monorepo & Scaffold
- [ ] Create `/backend` directory with FastAPI skeleton (`main.py`, `requirements.txt`, `.env.example`)
- [ ] Create `/frontend` directory with Vite + React 18 (`npm create vite@latest`)
- [ ] Create `/data` directory with subdirs: `/data/extracted/`, `/data/fixtures/`, `/data/call_reports/`
- [ ] Create `/scripts` directory for one-off processing scripts
- [ ] Add root-level `.gitignore` (env files, `__pycache__`, `node_modules`, `.DS_Store`, `*.sqlite`)
- [ ] Create `dev` branch from `main`, push scaffold commits

### Backend Bootstrap
- [ ] Install FastAPI, uvicorn, python-dotenv, httpx, networkx, anthropic, openai into `requirements.txt`
- [ ] Implement `/health` endpoint returning `{ "status": "ok", "timestamp": "..." }`
- [ ] Configure CORS middleware (allow all origins for dev, restrict to frontend origin in prod)
- [ ] Set up `.env` loading with `python-dotenv` — all API keys read from env
- [ ] Create `app/` package structure: `app/routers/`, `app/services/`, `app/models/`, `app/db/`
- [ ] Set up SQLite with `app/db/database.py` — tables: `reserve_data`, `stress_scores`, `api_cache`
- [ ] Implement API response envelope: `{ "data": ..., "error": null, "timestamp": "..." }` as a shared utility
- [ ] Write `app/models/reserve.py` — Pydantic models for the reserve JSON schema (stablecoin, counterparties, onchain_cross_check)
- [ ] Write `app/models/stress.py` — Pydantic models for stress score output (score, latency, coverage, dimensions)

### Frontend Bootstrap
- [ ] Install dependencies: `tailwindcss`, `recharts`, `leaflet`, `react-leaflet`, `react-router-dom`
- [ ] Configure Tailwind CSS — add `tailwind.config.js` with Katabatic color palette (`#7b6fc4` purple accent, `#f4f3fa` light bg)
- [ ] Create layout shell: `src/components/Layout.tsx` — sidebar nav + main content area
- [ ] Create route structure: `/` (dashboard), `/simulator` (what-if map), `/backtests` (SVB + Ian), `/stablecoin/:id` (detail view)
- [ ] Create `src/lib/api.ts` — typed fetch wrapper pointing to backend base URL, handles response envelope unwrapping
- [ ] Add `.env` for `VITE_API_BASE_URL`

### Seed Data / Fixtures
- [ ] Author `data/fixtures/usdc_baseline.json` — USDC reserve data with BNY Mellon (35%, NY), State Street (30%, Boston), BlackRock (20%, Chicago), other (15%). WAM = 45 days.
- [ ] Author `data/fixtures/usdt_baseline.json` — USDT reserve data (less transparent; higher opacity score). WAM = 90 days.
- [ ] Author `data/fixtures/dai_baseline.json` — DAI with mixed collateral, lower WAM, higher peg stability risk.
- [ ] Author `data/fixtures/frax_baseline.json` — FRAX algorithmic component, moderate stress.
- [ ] Author `data/fixtures/busd_baseline.json` — BUSD with Paxos (regulatory action scenario).
- [ ] Author `data/fixtures/pyusd_baseline.json` — PayPal USDC-like, newer issuer, moderate transparency.
- [ ] Author `data/fixtures/svb_march2023.json` — SVB scenario: WAM ~730 days (2-year treasuries), high duration mismatch, $209B assets, Silicon Valley Bank, Santa Clara CA.
- [ ] Author `data/fixtures/hurricane_ian_sept2022.json` — Ian scenario: Cat 4, Gulf coast landfall, FL bank LTV exposure, ops risk to Atlanta data corridor.
- [ ] Author `data/fixtures/hurricane_nova_scenario.json` — Synthetic Cat 4 hitting Northern Virginia — triggers AWS us-east-1 ops risk for USDC/Circle.
- [ ] Tag `v0.1-foundation`

---

## Phase 2: Pipeline & Knowledge Graph (Hours 4–12) · Sat Morning

### feat/data-ingestion

#### Claude Extraction Pipeline
- [ ] Write `app/services/extractor.py` — async function `extract_xbrl(feed_url: str) -> ReserveData`
- [ ] Build Claude API prompt chain for OCC XBRL parsing: system prompt instructs extraction of bank names, deposit %, asset classes, WAM per tranche, jurisdictions into structured JSON
- [ ] Build PDF fallback parser: `extract_pdf(pdf_bytes: bytes) -> ReserveData` — uses Claude vision/text on PDF content when XBRL not available
- [ ] Write prompt template `app/prompts/xbrl_extraction.txt` — few-shot examples with USDC XBRL fixture
- [ ] Write prompt template `app/prompts/pdf_extraction.txt` — few-shot examples with USDT PDF fixture
- [ ] Implement extraction retry logic: if Claude response fails JSON validation, retry with error context appended (max 3 attempts)
- [ ] Cache extraction results in SQLite `api_cache` table keyed on source URL + hash

#### On-Chain Cross-Reference
- [ ] Write `app/services/onchain.py` — `get_mint_burn_7d(token_address: str) -> MintBurnData` using Etherscan API
- [ ] USDC contract address hardcoded: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- [ ] USDT contract address: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- [ ] Parse Transfer events from Etherscan to compute 7-day net burn/mint volume in USD
- [ ] Write `cross_reference(reserve_data: ReserveData, mint_burn: MintBurnData) -> float` — returns divergence % between on-chain burn and custodian cash delta
- [ ] Flag divergence > 5% as transparency anomaly (contributes to Reserve Transparency dimension score)

#### Endpoints
- [ ] `POST /api/extract` — accepts `{ "source_url": str, "source_type": "xbrl" | "pdf" }`, returns structured ReserveData JSON with WAM
- [ ] `GET /api/stablecoins` — returns list of all tracked stablecoins with latest reserve data (loaded from fixtures if extraction not run)

---

### feat/knowledge-graph

#### Graph Construction
- [ ] Write `app/services/graph.py` — `build_graph(reserve_data_list: list[ReserveData]) -> nx.DiGraph`
- [ ] Node types and attributes:
  - `Stablecoin`: name, issuer, total_reserves, stress_score
  - `Bank`: name, city, state, lat, lng, fdic_id, wam_days, ltv_ratio, liquidity_coverage, fdic_watch_list
  - `DataCenterCorridor`: name, aws_region, azure_region, lat_bbox, lng_bbox (e.g., us-east-1 = 38.8–39.1°N, 77.0–77.5°W)
  - `City`: name, state, lat, lng
  - `Jurisdiction`: name, country, regulatory_body
- [ ] Edge types: `holds_reserves_at` (Stablecoin→Bank, attrs: percentage, asset_class, maturity_days), `processes_ops_via` (Bank→DataCenterCorridor), `located_in` (Bank→City), `governed_by` (City→Jurisdiction)
- [ ] Hardcode data center corridor bounding boxes:
  - `us-east-1` (Northern Virginia): 38.6–39.4°N, 77.0–78.1°W
  - `us-east-2` (Ohio): 39.9–42.3°N, 80.5–84.8°W
  - `us-west-2` (Oregon): 43.9–46.3°N, 116.5–124.6°W
  - `us-central` (Iowa/Chicago): 40.0–43.0°N, 87.5–96.0°W
  - `eu-west-1` (Ireland): 51.3–55.4°N, 6.0°W–0.0°
- [ ] Assign data center corridors to banks: BNY Mellon NY → us-east-1, State Street Boston → us-east-1, JPMorgan Chicago → us-central, etc.

#### Geocoding
- [ ] Write `app/services/geocoder.py` — `geocode_bank(bank_name: str, city: str, state: str) -> tuple[float, float]` using Nominatim (OSM)
- [ ] Rate limit: 1 request/second (Nominatim ToS)
- [ ] Cache geocoding results in SQLite to avoid repeated lookups
- [ ] Bulk geocode all fixture bank nodes on startup

#### Graph Query Functions
- [ ] `get_exposed_stablecoins(region: str) -> list[str]` — returns stablecoins with any bank or data center in region
- [ ] `get_duration_risk(stablecoin: str) -> float` — weighted average maturity across all counterparties
- [ ] `get_ops_risk(storm_lat: float, storm_lng: float, radius_km: float) -> list[DataCenterCorridor]` — returns corridors inside storm radius
- [ ] `get_concentration_hhi(stablecoin: str) -> float` — Herfindahl-Hirschman Index of geographic bank concentration
- [ ] `get_bank_subgraph(stablecoin: str) -> dict` — returns serializable subgraph of all banks for a stablecoin

#### Endpoints
- [ ] `GET /api/graph` — returns full serialized graph as `{ "nodes": [...], "edges": [...] }` for frontend Leaflet rendering
- [ ] `GET /api/graph/stablecoin/{name}` — returns subgraph for a specific stablecoin

---

### feat/weather-pipeline

#### NOAA Integration
- [ ] Write `app/services/weather.py` — `get_active_alerts(state: str | None = None) -> list[WeatherAlert]` using NOAA API v3 (`https://api.weather.gov/alerts/active`)
- [ ] Parse NHC hurricane track: `get_nhc_active_tracks() -> list[HurricaneTrack]` — fetch from NHC GeoJSON feed, parse cone of uncertainty polygon + forecast path
- [ ] `HurricaneTrack` model: id, name, category, forecast_points (list of lat/lng/timestamp), cone_polygon, intensity_kt, pressure_mb

#### OpenMeteo Historical
- [ ] Write `get_historical_weather(lat: float, lng: float, start: str, end: str) -> WeatherHistory` using Open-Meteo API (free, no key needed)
- [ ] Used for SVB (March 2023 Bay Area conditions) and Hurricane Ian (Sept 2022 Gulf conditions) backtests

#### FDIC Call Report Mining
- [ ] Write `app/services/fdic.py` — `get_bank_financials(fdic_cert: int) -> BankFinancials` using FDIC API (`https://banks.data.fdic.gov/api/financials`)
- [ ] Fields to extract: total assets, total deposits, mortgage loans, LTV ratios, liquidity ratios, net interest margin
- [ ] Write `mine_ltv_from_call_report(fdic_cert: int) -> float` — calls FDIC API, uses Claude to parse LTV ratio from narrative fields if not in structured data
- [ ] Write `app/prompts/fdic_ltv_extraction.txt` — prompt for Claude to extract LTV ratio from Call Report text
- [ ] Attach LTV ratios to bank nodes in knowledge graph

#### Storm Overlay Logic
- [ ] Write `compute_ltv_stress(bank: BankNode, storm: HurricaneTrack) -> float`:
  - `distance_km` = geodesic distance from bank lat/lng to storm center
  - `impact_factor` = `max(0, 1 - distance_km / 500)` (decay over 500km)
  - `intensity_factor` = storm category / 5
  - Returns `bank.ltv_ratio × impact_factor × intensity_factor`
- [ ] Write `check_ops_risk(storm: HurricaneTrack, corridors: list[DataCenterCorridor]) -> list[OpsRiskResult]`:
  - For each forecast point in storm track, check if point falls inside corridor bounding box
  - Return list of `{ corridor, hours_to_impact, confidence }`

#### Endpoints
- [ ] `GET /api/weather/active` — returns active NOAA alerts + NHC hurricane tracks with ops impact assessment
- [ ] `POST /api/weather/simulate` — accepts `{ "hurricane": { "lat": float, "lng": float, "category": int }, "stablecoin": str }`, returns `{ "affected_banks": [...], "affected_corridors": [...], "ltv_stress_scores": {...}, "ops_risk_flag": bool }`

---

### feat/scoring-engine

#### Dimension Calculators
- [ ] Write `app/services/scoring.py` — one function per dimension, all return 0–100 float

- [ ] **Dimension 1 — Duration Risk (30% weight):**
  - `score_duration(wam_days: float) -> float`
  - `wam_days = 0` → score 0 (no risk). `wam_days = 365` → score 100 (maximum risk)
  - Linear: `min(100, wam_days / 365 * 100)`

- [ ] **Dimension 2 — Reserve Transparency (20% weight):**
  - `score_transparency(source_type: str, freshness_days: int, divergence_pct: float) -> float`
  - XBRL < 7 days old + divergence < 1% → score 0
  - PDF > 30 days old + divergence > 5% → score 100
  - Weighted formula across the three sub-factors

- [ ] **Dimension 3 — Geographic Concentration (15% weight):**
  - `score_concentration(hhi: float, ops_risk: bool) -> float`
  - HHI ranges 0–10000 (standard). Normalize to 0–100
  - `+20` flat bonus if ops_risk flag is True (data center corridor overlap)

- [ ] **Dimension 4 — Weather Tail-Risk (15% weight):**
  - `score_weather(ltv_stress_scores: dict[str, float], concentration: float) -> float`
  - Average ltv_stress across all affected banks weighted by reserve percentage
  - Multiply by concentration HHI factor: `× (1 + hhi / 20000)`

- [ ] **Dimension 5 — Counterparty Health (15% weight):**
  - `score_counterparty(banks: list[BankNode], llm_scores: dict[str, float]) -> float`
  - Average FDIC health proxies (LTV, liquidity coverage) across banks weighted by reserve %
  - Blend with LLM jury score (50/50)
  - Flag if Claude vs GPT delta > 15 points — surface as "Models disagree" warning

- [ ] **Dimension 6 — Peg Stability (5% weight):**
  - `score_peg(depeg_events_90d: int, current_spread_bps: float, mint_burn_velocity: float) -> float`
  - `depeg_events_90d > 0` → base score 40+
  - `current_spread_bps > 10` → score 60+
  - `mint_burn_velocity > 2× 30d avg` → score 70+

#### Composite Scoring
- [ ] Write `compute_stress_score(stablecoin: str, scenario: ScenarioParams | None = None) -> StressScoreResult`:
  - Run all 6 dimension functions
  - Composite: `Σ(weight_i × dimension_i)` per weights table
  - Map composite to latency + coverage:
    - 0–25: latency `<4h`, coverage `100%+`
    - 26–50: latency `4–24h`, coverage `95–100%`
    - 51–75: latency `24–72h`, coverage `85–95%`
    - 76–100: latency `72h+`, coverage `<85%`

#### LLM Jury
- [ ] Write `app/services/llm_jury.py` — `get_jury_score(context: str) -> JuryResult`
- [ ] Send identical prompt to Claude (anthropic SDK) and GPT (openai SDK) concurrently using `asyncio.gather`
- [ ] Prompt: "Given the following reserve data and market context, score the counterparty health risk from 0–100 where 0 = no risk and 100 = imminent failure. Respond with only a JSON object: { score: int, rationale: str }"
- [ ] Parse both responses, compute delta
- [ ] If delta ≤ 15: return `{ score: avg, consensus: true, claude_score, gpt_score, delta }`
- [ ] If delta > 15: return `{ score: avg, consensus: false, claude_score, gpt_score, delta, warning: "Models disagree — review manually" }`

#### Endpoints
- [ ] `GET /api/stress-scores` — returns all stablecoin stress scores with all 6 dimension breakdowns
- [ ] `POST /api/stress-scores/simulate` — accepts `ScenarioParams { rate_hike_bps: int, hurricane: HurricaneParams | null, bank_failure: str | null, stablecoin: str }`, returns `StressScoreResult` with scenario-adjusted dimensions
- [ ] `GET /api/stress-scores/{stablecoin}` — returns detailed stress score for one stablecoin

- [ ] Tag `v0.2-pipeline`

---

## Phase 3: Dashboard & What-If Simulator (Hours 12–20) · Sat Afternoon

### feat/dashboard

#### Stress Score Table (Main Dashboard)
- [ ] Create `src/pages/Dashboard.tsx` — main page component
- [ ] Create `src/components/StressScoreTable.tsx`:
  - Columns: Stablecoin, Score (colored pill), Latency, Coverage, WAM, Trend (sparkline)
  - Color coding: green 0–25, yellow 26–50, orange 51–75, red 76–100
  - Sortable by score column
  - Clicking row navigates to `/stablecoin/:id`
- [ ] Create `src/components/ScoreGauge.tsx` — semicircular gauge component (Recharts RadialBar) showing 0–100 score with color gradient
- [ ] Create `src/components/AlertBanner.tsx`:
  - Fetches `GET /api/weather/active` on mount
  - Shows dismissible alert cards for active weather events, mint/burn anomalies, FDIC watch list triggers
  - Auto-refreshes every 5 minutes

#### Stablecoin Detail View
- [ ] Create `src/pages/StablecoinDetail.tsx` — fetches `GET /api/stress-scores/{name}`
- [ ] Create `src/components/WAMChart.tsx` — Recharts BarChart showing WAM in days per counterparty bank, color-coded by maturity bucket (<30d green, 30–90d yellow, 90–365d orange, 365d+ red)
- [ ] Create `src/components/DimensionBreakdown.tsx` — Recharts RadarChart showing all 6 dimension scores (0–100) on a hexagonal radar, with dimension labels
- [ ] Create `src/components/MintBurnSparkline.tsx` — Recharts AreaChart showing 7-day mint/burn volume with divergence annotation line
- [ ] Create `src/components/ConsensusPanel.tsx` — shows "Claude: 68 | GPT: 71 | Delta: 3 → CONSENSUS" or "Models disagree" warning
- [ ] Create `src/components/CounterpartyList.tsx` — table of banks with: name, city, %, WAM, LTV, FDIC status, geographic stress contribution

#### UI Polish
- [ ] Add Katabatic logo/wordmark to sidebar (SVG, purple `#7b6fc4`)
- [ ] Implement dark/light mode toggle (default: light `#f4f3fa` bg)
- [ ] Loading skeleton components for all data-fetching states (use `src/components/Skeleton.tsx`)
- [ ] Empty state component for no-data scenarios
- [ ] Error boundary with friendly error message and retry button
- [ ] Global font: Inter (import from Google Fonts or bundle locally)
- [ ] Never use "rating" or "grade" in any UI copy — always "Liquidity Stress Score" or "stress level"

---

### feat/what-if-simulator

#### Leaflet Map
- [ ] Create `src/pages/Simulator.tsx` — what-if simulator page
- [ ] Create `src/components/StressMap.tsx` — Leaflet map base layer (OpenStreetMap tiles)
- [ ] Map layer: bank markers — circle markers sized by reserve % held, colored by counterparty health score
- [ ] Map layer: data center corridor overlays — semi-transparent shaded rectangles for each corridor (us-east-1, us-east-2, etc.) with labels
- [ ] Map layer: hurricane cone — render cone of uncertainty as a polygon from NHC data, with track line showing forecast path
- [ ] Map layer: storm impact radius — circle overlay when simulating, showing 500km impact decay zone
- [ ] Implement map legend component in bottom-left corner

#### Hurricane Drop Interaction
- [ ] On map click: open a popover "Drop hurricane here? Category: [1–5 slider]" with confirm button
- [ ] On confirm: POST to `/api/stress-scores/simulate` with hurricane lat/lng/category + selected stablecoin
- [ ] Animate affected bank markers turning red (transition over 500ms)
- [ ] Highlight affected data center corridors with red border + flashing animation
- [ ] Update stress score display in right panel in real-time
- [ ] Show output panel: "Under this scenario: Redemption latency: 72h | Liquidity coverage: 88%"

#### Scenario Control Panel
- [ ] Create `src/components/ScenarioPanel.tsx` — right-side panel with all controls
- [ ] Rate hike slider: 0–200bps, step 25bps. On change: debounce 300ms → POST simulate → update scores
- [ ] Stablecoin selector: dropdown to pick which stablecoin to stress-test
- [ ] Bank failure toggle: dropdown of all banks in graph → toggle failure → recompute without that bank's liquidity contribution
- [ ] Reset button: clears all scenario overrides, reloads baseline scores
- [ ] "Scenario Summary" text area at bottom: always shows human-readable description of current scenario ("Simulating Cat 3 hurricane at 27.8°N 82.6°W + 50bps rate hike on USDC portfolio")

#### Output Panel
- [ ] Create `src/components/ScenarioOutput.tsx`:
  - Large score number with color
  - Latency badge: "Redemption latency: Xh"
  - Coverage badge: "Liquidity coverage: Y%"
  - Dimension delta table: shows how each of the 6 dimensions changed from baseline (+ or − arrows)
  - Confidence indicator: "High confidence" if models agree, "Review recommended" if delta > 15

---

### feat/narratives

#### Multi-Model Narrative Generation
- [ ] Write `app/services/narratives.py` — `generate_narrative(stress_context: StressContext) -> NarrativeResult`
- [ ] Build narrative prompt `app/prompts/narrative_generation.txt`:
  - Include: stablecoin name, stress score, top 3 contributing dimensions, affected banks with LTV, affected data center corridors, scenario params
  - Instruct: "Generate a 3–5 sentence causal explanation of the stress score. Focus on the chain of causation: duration mismatch → weather multiplier → operational risk. Be specific about bank names, percentages, and data center corridors."
- [ ] Call Claude and GPT concurrently with identical prompt
- [ ] Compare narratives: extract key claims from each (use a short Claude call: "List the top 3 causal claims in this narrative as JSON array of strings")
- [ ] Compute claim overlap: if > 70% claims match → consensus = True
- [ ] `NarrativeResult`: `{ narrative_claude: str, narrative_gpt: str, consensus_narrative: str, consensus: bool, agreement_score: float }`
- [ ] Consensus narrative: use Claude narrative if consensus, else display both side-by-side

#### Endpoint
- [ ] `POST /api/narratives` — accepts `StressContext` (stress score + all dimensions + scenario), returns `NarrativeResult`

#### Frontend Integration
- [ ] Create `src/components/NarrativeCard.tsx`:
  - Shows consensus narrative text in a styled card
  - "Consensus" badge (green checkmark) if `consensus: true`, else "Model Divergence" badge (yellow warning)
  - Agreement score shown as "X% agreement"
  - Expandable to show both model narratives side-by-side for comparison
- [ ] Integrate NarrativeCard into StablecoinDetail page below DimensionBreakdown
- [ ] Integrate NarrativeCard into ScenarioOutput panel in Simulator

- [ ] Tag `v0.3-simulator`

---

## Phase 4: Backtests & Trust Layer (Hours 20–26) · Sat Night

### feat/svb-backtest

#### SVB Data & Timeline
- [ ] Create `data/fixtures/svb_timeline.json` — day-by-day data from Feb 1 – Mar 17 2023:
  - `date`, `wam_days` (starts at ~730, stays high), `fed_funds_rate`, `unrealized_losses_bn`, `stress_score_computed`
  - Key dates: Mar 8 (stock drop), Mar 9 (bank run begins), Mar 10 (FDIC seizure)
  - Annotation events: `{ date: "2023-03-08", label: "SVB stock drops 60%", type: "trigger" }`
- [ ] Write `app/services/backtests/svb.py` — `run_svb_backtest() -> BacktestResult`
  - Iterate timeline JSON, compute stress score for each day using scoring engine with historical params
  - Identify the day stress score first crossed 75 ("Critical")
  - Return full timeline with scores + annotations

#### Hurricane Ian Backtest
- [ ] Create `data/fixtures/ian_timeline.json` — Sept 24–30, 2022 timeline:
  - Hurricane Ian track coordinates (from NHC historical data)
  - FL bank LTV ratios from FDIC Call Reports (Q2 2022)
  - Day-by-day stress score for USDC under Ian scenario
- [ ] Write `app/services/backtests/ian.py` — `run_ian_backtest() -> BacktestResult`

#### Endpoints
- [ ] `GET /api/backtests/svb` — returns SVB timeline + stress scores + annotations
- [ ] `GET /api/backtests/ian` — returns Hurricane Ian timeline + stress scores

#### Frontend — Backtest Pages
- [ ] Create `src/pages/Backtests.tsx` — tabbed page with SVB and Hurricane Ian tabs
- [ ] Create `src/components/BacktestTimeline.tsx`:
  - Recharts LineChart with stress score on Y-axis, date on X-axis
  - Reference lines at score = 50 (Moderate), score = 75 (Critical)
  - ReferenceDot annotations for key events (SVB stock drop, FDIC seizure, depeg)
  - Color fill under curve: green < 50, yellow 50–75, red > 75
- [ ] Create `src/components/TimelineScrubber.tsx`:
  - Slider over the date range
  - On scrub: updates a "current date" state, filters all chart data to that date
  - Shows summary card on right: "On Mar 9, 2023: WAM = 730 days. Score = 78 (Critical). Rate hike catalyst."
- [ ] SVB annotated insights panel:
  - "WAM was 730 days from Feb–Mar 2023 — 2-year treasuries"
  - "Duration mismatch score was already at 92/100 before the bank run"
  - "Rate hike (+475bps over 12 months) was the catalyst, not the cause"
  - "Stress score crossed 75 (Critical) on March 8 — 48 hours before FDIC seizure"
- [ ] Hurricane Ian annotated insights panel:
  - FL bank LTV ratios (0.71 avg) amplified storm impact
  - Show which USDC counterparties had FL exposure
  - Show how far storm was from us-east-1 corridor (no ops risk in Ian case — ops risk demo uses synthetic scenario)

---

### feat/demo-polish

#### Trust Layer Mock
- [ ] Create `src/components/TrustBadge.tsx`:
  - Shows "Model Consensus: Claude 68 | GPT 71 | Delta: 3 → SIGNAL CONFIRMED" when consensus = true
  - Shows mock verification hash: `katabatic-proof-0x{first8ofsha256(score+timestamp)}`
  - Tooltip: "In production: computed inside a Trusted Execution Environment (TEE) and published to Chainlink oracle"
  - "TEE-Ready" label with lock icon
- [ ] Integrate TrustBadge into: StablecoinDetail page, ScenarioOutput panel, NarrativeCard

#### Demo Mode
- [ ] Add `VITE_DEMO_MODE=true` env flag
- [ ] When demo mode on: all API calls return from local fixture JSON (no network latency)
- [ ] Write `src/lib/demoData.ts` — exports all demo fixture responses for each endpoint
- [ ] Create demo mode banner: "Running in Demo Mode — cached data loaded"
- [ ] Pre-wire 3 demo scenarios in demo mode:
  - **Scenario A** (primary): Cat 4 hurricane at 38.9°N 77.2°W (Northern Virginia) → USDC ops risk + FL bank LTV stress → score jumps to 68
  - **Scenario B**: SVB backtest replay — score crosses 75 on Mar 8 2023
  - **Scenario C**: 100bps rate hike → WAM sensitivity for all 6 stablecoins → sorted by impact

#### End-to-End Wiring
- [ ] Wire Scenario A end-to-end: click map → hurricane drop → bank markers turn red → corridor highlights → score updates → narrative generates → trust badge shows "CONFIRMED"
- [ ] Wire Scenario B end-to-end: navigate to Backtests → SVB tab → scrub to Mar 8 → score crosses red line → annotation appears
- [ ] Wire Scenario C end-to-end: open Simulator → rate hike slider to 100bps → all stablecoin scores update → detail view shows WAM sensitivity chart
- [ ] Test all 3 paths on local dev before deploy
- [ ] Add loading states and error handling for all async operations
- [ ] Empty state components for: no active weather alerts, no stablecoin selected, no scenario run yet

- [ ] Tag `v0.4-backtests`

---

## Phase 5: Ship (Hours 26–36) · Sun Morning

### Deployment
- [ ] Configure Vercel project for `/frontend` — set `VITE_API_BASE_URL` and `VITE_DEMO_MODE` env vars
- [ ] Configure Railway/Render project for `/backend` — set all API keys as env vars
- [ ] Update frontend `.env.production` with deployed backend URL
- [ ] Configure CORS in backend to allow Vercel frontend origin
- [ ] Run full deploy: `vercel --prod` (frontend) + Railway deploy (backend)
- [ ] Smoke test all 3 demo scenarios on deployed URLs
- [ ] Verify `/health` endpoint returns 200 on deployed backend

### Final Polish
- [ ] Code freeze at Hour 30 — no new features after this
- [ ] Run `black .` on all Python files
- [ ] Run `eslint` and `tsc --noEmit` on frontend — fix all errors
- [ ] Remove all `console.log` debug statements from frontend
- [ ] Remove all `print()` debug statements from backend
- [ ] Verify all API keys are in `.env` and not committed to git
- [ ] Check `.gitignore` covers all `.env` files

### Demo Prep
- [ ] Rehearse 5-beat demo script 5× (target: < 2 minutes total)
- [ ] Record screen capture backup of full demo (OBS or QuickTime)
- [ ] Prepare fallback: browser tab pre-loaded with demo mode on, all 3 scenarios pre-run and cached
- [ ] Print cheat sheet: bullet points for each of the 5 demo beats

### Final Git
- [ ] Merge `dev` → `main`
- [ ] Tag `v1.0-demo`
- [ ] Confirm GitHub repo is public (or accessible to judges)

---

## Cross-Cutting Concerns (Do Throughout)

### Testing
- [ ] Write `backend/tests/test_scoring.py` — unit tests for all 6 dimension calculators with known inputs/outputs
- [ ] Write `backend/tests/test_graph.py` — unit tests for graph query functions
- [ ] Write `backend/tests/test_cross_reference.py` — unit test for mint/burn divergence calculator
- [ ] Write `frontend/src/__tests__/StressScoreTable.test.tsx` — render test with fixture data
- [ ] All tests pass in CI before merge to `dev`

### API Key Validation
- [ ] On backend startup: validate all required env vars are set, log warning if any missing
- [ ] Graceful degradation: if NOAA key missing → skip weather data, log warning, continue with baseline scores
- [ ] Graceful degradation: if Etherscan key missing → skip on-chain cross-reference, set divergence_pct = null

### Documentation
- [ ] `backend/README.md` — setup instructions, env vars table, how to run locally
- [ ] `frontend/README.md` — setup instructions, env vars, how to run locally
- [ ] `README.md` (root) — project overview, links to both READMEs, deployed URLs, demo video link

---

## Environment Variables Checklist

- [ ] `ANTHROPIC_API_KEY` — obtained and set in `.env`
- [ ] `OPENAI_API_KEY` — obtained and set in `.env`
- [ ] `NOAA_API_TOKEN` — obtained from api.weather.gov (free registration)
- [ ] `ETHERSCAN_API_KEY` — obtained from etherscan.io (free tier)
- [ ] `VITE_API_BASE_URL` — set to backend URL (local: `http://localhost:8000`, prod: Railway URL)
- [ ] `VITE_DEMO_MODE` — set to `true` for demo, `false` for live data

---

## Progress Tracker

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | `[ ]` | |
| Phase 2: Pipeline & Knowledge Graph | `[ ]` | |
| Phase 3: Dashboard & Simulator | `[ ]` | |
| Phase 4: Backtests & Trust Layer | `[ ]` | |
| Phase 5: Ship | `[ ]` | |

**Last updated:** 2026-03-04
