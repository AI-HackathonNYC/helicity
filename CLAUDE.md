# Katabatic — The System of Record for Stablecoin Reserve Risk

> Cornell AI Hackathon 2026 · Programmable Capital Track · 36 Hours · Mar 13–15

## Product Summary

Katabatic is **the system of record for stablecoin reserve risk** — a reserve risk data platform that continuously scores the structural fragility of stablecoin reserve portfolios and exposes that data via API. Not a rating agency (NRSRO liability avoided) and not a dashboard product — an **infrastructure layer** whose risk scores are consumed by DAO governance systems, DeFi protocol rebalancing logic, institutional risk desks, and (aspirationally) Chainlink oracle feeds.

The business model mirrors on-chain data infrastructure platforms: API-first, enterprise contracts, multi-modal delivery (REST API scores, warehouse delivery, real-time streaming). The GENIUS Act (Jul 2025) is to Katabatic what blockchain growth was to on-chain data platforms — the regulatory catalyst that forced stablecoin issuers to disclose reserve composition, asset maturities, and custodian identities for the first time via XBRL-formatted filings and OCC API feeds mandated for all PPSIs.

### Why "System of Record" Framing

On-chain data platforms became the authoritative source for on-chain behavioral data — the single source of truth that Visa, a16z, and Grayscale integrate into their own systems. Katabatic occupies the equivalent position for **off-chain reserve risk**: when a DAO treasury, DeFi protocol, or institutional risk desk needs to know the structural fragility of a stablecoin reserve, Katabatic is the authoritative score they integrate — not one of many dashboards they view.

**Output is consumed by systems, not just viewed by humans:**
- DAO governance contracts that auto-rebalance stablecoin exposure
- DeFi protocols that gate borrowing against a reserve health score
- Risk desks that embed the score into portfolio monitoring infrastructure
- Oracle feeds (Chainlink) for on-chain risk-gating (aspirational/demo mock layer)
- AI trading agents that query reserve risk via MCP tool calls before executing stablecoin positions

### Stack Positioning

Katabatic is to stablecoin reserve risk what on-chain data infrastructure platforms are to on-chain behavioral data — the authoritative, API-first data layer that systems integrate rather than humans browse. The business model is identical: API subscriptions, enterprise data contracts, warehouse delivery, real-time streaming. The GENIUS Act (Jul 2025) is the regulatory catalyst that forced standardized reserve disclosure for the first time — XBRL + OCC API feeds mandated for all PPSIs, with monthly attestation reports covering reserve composition, maturity data, and custodian identities. We structure that mandated data into programmable risk intelligence.

| Layer | What it does |
|-------|--------------|
| On-chain data (Dune, Nansen, Chainalysis) | Mint/burn flows, wallet balances, transaction history |
| Off-chain regulatory (GENIUS Act attestations, FDIC) | WAM, LTV ratios, bank health, reserve composition |
| **Reserve Risk — Katabatic** | **Stress Score = WAM × weather multiplier × concentration. API + streaming.** |
| Downstream consumers | DAO governance · DeFi protocols · Risk desks · Oracle feeds · AI agents (MCP) |

On-chain data platforms have no WAM duration engine, no FDIC Call Report mining, no weather tail-risk model, no reserve stress scoring. Katabatic ingests on-chain mint/burn data as *one input* into a multi-signal scoring engine combining off-chain regulatory filings + macroeconomic signals. **Complementary, not competing.**

**The key analogy (use this in pitches):** On-chain data platforms became the single source of truth for on-chain behavior — the data layer that Visa, a16z, and Grayscale integrate into their own systems. Katabatic is building the equivalent layer for off-chain reserve risk. When a DAO treasury or DeFi protocol needs to know the structural fragility of a stablecoin reserve, Katabatic is the score they integrate — not one of many dashboards they view.

### Core Insight

Stablecoin risk is a **duration mismatch problem** (SVB failure mode), not a credit problem. Weather and geopolitical events are *tail-risk multipliers* on an already-fragile balance sheet — the catalyst, not the cause.

**Output framing (legal-safe):** Instead of letter grades (requires NRSRO status), the API returns:
- `liquidity_stress_score` (0–100)
- `redemption_latency_hours` (e.g., 72 under stress)
- `liquidity_coverage_ratio` (e.g., 0.88 under Cat 4 + 50bps hike)
- `causal_narrative` (LLM-generated, multi-model consensus)

**Delivery modes:**
- REST API (score on demand, <2s re-score)
- Webhook/streaming (real-time score updates on new data)
- Data-driven risk modeling dashboard (live data → projected impact on reserve liquidity)
- Oracle mock (Chainlink-ready; scores pinned to IPFS via Pinata with verifiable CID)
- MCP server (AI-agent-native; risk scores as MCP tool calls for trading bots and agent frameworks)

**Target customers:** DAO Treasuries (MakerDAO, Aave, Compound), DeFi protocols holding stablecoin positions, institutional risk desks, stablecoin issuers needing GENIUS Act compliance tooling.

---

## Strategic Improvements Over Original Brief

### Hole 1: Data Opacity (30+ day PDF lag)
**Fix:** Under the 2025 GENIUS Act, PPSIs (Permitted Payment Stablecoin Issuers) must publish monthly attestation reports certified by registered accounting firms, disclosing reserve composition, asset types, maturities, and custodian identities. The Act mandates **XBRL-formatted filings and OCC API feeds** for all PPSIs — meaning reserve data is now machine-readable at the source, not locked in PDFs. We ingest these structured feeds (with Claude LLM extraction as fallback for non-compliant issuers) and cross-reference with FDIC Call Reports — turning compliance filings into programmable risk intelligence. Cross-reference attestation data with on-chain Mint/Burn flows — if $1B USDC is burned, the engine checks for a corresponding decrease in cash at BNY Mellon or State Street.

### Hole 2: Causal Gap (hurricane → bank → downgrade is too blunt)
**Fix — two sub-signals:**
1. **Operational Risk:** Track Data Center Corridors, not bank branches. Treasury ops run on AWS/Azure. A hurricane hitting Northern Virginia (US-East-1) can freeze redemption processing even if the bank is fine.
2. **Credit Risk:** Use LLM to mine FDIC Call Reports. If a FL bank has high mortgage LTV ratios and a hurricane hits, the risk is a *liquidity squeeze from LTV deterioration*, not the bank physically flooding.

### Hole 3: Weather as Primary Signal (should be a multiplier)
**Fix:** Primary engine computes **Weighted Average Maturity (WAM)** of the treasury bond portfolio. Weather is a tail-risk multiplier:
```
Stress Score = Base Duration Risk × Weather Multiplier × Concentration Factor
```
This is why the SVB backtest works: SVB had extreme duration mismatch → weather/rate hike was just the catalyst for a run on an already-fragile balance sheet.

### Hole 4: "Rating Agency" Framing (NRSRO liability)
**Fix:** "Risk-as-a-Service." UI output is a data-driven risk modeling dashboard, not a grade. Sell to DAO treasuries who see real-world data and projected operational outputs (latency, coverage ratio), not grades they could be sued over.

### Hole 5: Single-Source Trust Problem
**Fix:** Multi-model LLM consensus (Claude + Gemini) run inside a TEE (Trusted Execution Environment). If all three models agree a stress threshold is crossed, the signal is pushed to a Chainlink oracle — making it grade-A data for DeFi protocols to automatically rebalance. **Score snapshots are pinned to IPFS via Pinata after each scoring run**, producing a content-addressable CID that serves as an immutable, verifiable proof of the score at a given timestamp. Downstream consumers (DAOs, DeFi protocols, Chainlink oracles) can independently verify the score was not tampered with by resolving the CID. *For the hackathon: demo with Claude + one other model as a "jury"; pin consensus scores to IPFS via Pinata API; display the IPFS CID alongside the mock TEE/Chainlink proof.*

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Pitch Deck** | React 19 + Vite 7 + TypeScript 5.9 | 10-slide presentation SPA (`/slides-app`) |
| **Slide Animations** | Framer Motion 12 | Transitions, staggered reveals, animated counters |
| **Slide UI** | CVA + clsx + tailwind-merge + Lucide React | Component variants, conditional styling, icons |
| **Frontend (Dashboard)** | React 19 + Vite | Data-driven risk modeling dashboard (`/frontend`) |
| **Charts** | Recharts | Stress score timelines, WAM breakdowns (dashboard) |
| **Maps** | Leaflet + React-Leaflet (OpenStreetMap) | Geographic exposure map, hurricane overlay, data center corridors |
| **Styling** | Tailwind CSS 4 | Utility-first styling across slides + dashboard |
| **Typography** | Sora (Google Fonts, 300–700) | Primary font across all UI |
| **Backend** | FastAPI (Python 3.11+) | REST API, scoring engine, data pipelines |
| **Knowledge Graph** | NetworkX | Stablecoin → Bank → DataCenter → Jurisdiction graph |
| **LLM (Primary)** | Claude API (Anthropic SDK) | Attestation/PDF extraction, FDIC Call Report mining, stress narratives |
| **LLM (Jury)** | Gemini API (Google GenAI) | Second model for consensus scoring |
| **Weather Data** | NOAA NWS API (no auth, User-Agent only), NHC, Open-Meteo (no auth) | Tail-risk weather multipliers |
| **Bank Data** | FDIC BankFind API (`api.fdic.gov`, no auth) | ASSET/DEP/EQ/SC/NIMY/ROA — derive WAM & LTV proxies |
| **On-Chain Data** | Etherscan V2 API (`api.etherscan.io/v2/api?chainid=1`) | Mint/Burn flow cross-reference |
| **Regulatory Data** | GENIUS Act XBRL feeds / OCC API / FDIC filings | Reserve composition, maturities, custodians (LLM-extracted) |
| **Geocoding** | Nominatim (OpenStreetMap) | Bank + data center → lat/lng resolution |
| **Database** | SQLite (dev) | Reserve data, stress history, cached API responses |
| **IPFS Pinning** | Pinata API | Pin score snapshots to IPFS for verifiable, immutable score provenance |
| **MCP Server** | FastMCP (Python SDK) | AI-agent-native delivery of risk scores as tool calls |
| **Deployment** | Vercel (frontend/slides) + Railway/Render (backend) | Demo hosting |

---

## Design System

> **Source of truth:** `slides-app/src/index.css` — all design tokens are defined as CSS custom properties via Tailwind CSS 4's `@theme` directive.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent` | `#6c5ce7` | Primary purple accent (buttons, links, highlights) |
| `--color-accent-light` | `#a29bfe` | Gradient endpoints, secondary highlights |
| `--color-accent-dark` | `#4834d4` | Hover states, emphasis |
| `--color-bg` | `#fafafa` | Default slide/page background |
| `--color-bg-alt` | `#f3f2f7` | Alternate section background |
| `--color-bg-dark` | `#0c0a14` | Dark variant slides (hero, close) |
| `--color-card` | `#ffffff` | Card surfaces |
| `--color-success` | `#00b894` | Positive indicators (low stress, consensus confirmed) |
| `--color-warn` | `#e17055` | Warning indicators (moderate stress, model divergence) |
| `--color-danger` | `#e84393` | Critical indicators (high stress, depeg events) |
| `--color-text-primary` | `#0f0f0f` | Headlines, primary copy |
| `--color-text-secondary` | `#555555` | Body text, descriptions |
| `--color-text-tertiary` | `#888888` | Labels, captions |
| `--color-text-muted` | `#bbbbbb` | Disabled states, subtle annotations |

### Visual Patterns

- **Gradient text:** `linear-gradient(135deg, #6c5ce7, #a29bfe)` with `-webkit-background-clip: text`
- **Glass morphism:** `backdrop-filter: blur(36px)` with semi-transparent backgrounds (`.glass`, `.glass-dark`)
- **Borders:** Subtle `border-black/7` or `border-black/10` for light mode separation
- **Hurricane rings:** Animated concentric rings (custom keyframes) used on hero + close slides
- **Animated numbers:** Counters that animate from 0 to target value (e.g., 68/100 stress score)
- **Pipeline visualization:** Numbered circles with connecting line, step-by-step flow

### Typography Scale

- Hero headlines: `clamp(1.9rem, 3vw, 2.6rem)`
- Large displays: `2.2rem`–`3.2rem`
- Body: `0.95rem`–`1.15rem`
- UI labels: `0.7rem`–`0.85rem`, uppercase with `letter-spacing: 0.08em`
- Monospace (code/data): IBM Plex Mono

---

## Architecture (6 Layers)

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 0: DATA PROVIDERS (3-Tier Resolution)                     │
│  Every data source: Live API → SQLite Cache (TTL) → Fixture      │
│  FDIC BankFind API (no auth) → bank financials, derive WAM/LTV  │
│  NOAA NWS (User-Agent only) → active weather alerts              │
│  Etherscan V2 (API key) → mint/burn cross-reference              │
│  Open-Meteo (no auth) → historical weather for backtests         │
│  Nominatim (User-Agent, 1req/s) → geocoding                     │
│  All responses carry data_source: "live" | "cache" | "fixture"  │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: INGESTION                                              │
│  GENIUS Act attestation reports / PDFs → Claude extraction → JSON│
│  On-chain Mint/Burn flows → cross-reference custodian cash       │
│  NOAA/NHC forecasts → geocoded weather tail-risk events          │
│  FDIC Call Reports → WAM proxy, LTV ratios, liquidity signals    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: KNOWLEDGE GRAPH                                        │
│  Stablecoin → Custodian Bank → City/State → Jurisdiction         │
│  Bank nodes carry: WAM, LTV, liquidity coverage, health scores   │
│  Data Center Corridor nodes (AWS/Azure zones) for ops risk       │
│  Weather events attach as stress multipliers on bank + DC nodes  │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: DURATION + STRESS ENGINE                               │
│  Pipeline: Resolve Entities → Build Graph → Compute WAM →        │
│           Apply Stress → Output LCR → Pin to IPFS                │
│  Primary: WAM of treasury portfolio (duration mismatch score)    │
│  Multiplier: Weather tail-risk × Geographic concentration        │
│  Operational: Data center corridor overlap with storm track       │
│  LLM jury: Claude + Gemini consensus on qualitative signals      │
│  Output: Liquidity Stress Score (0–100) + redemption latency     │
│  MCP Server: 5 tools for AI agent consumption (stdio + SSE)      │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: DATA-DRIVEN RISK MODELING DASHBOARD                     │
│  Live map: bank markers + data center corridors + weather overlay│
│  Real-time stress scores from NOAA/FDIC/Etherscan data feeds     │
│  Output: "Redemption latency: 72h. Liquidity coverage: 88%"      │
├─────────────────────────────────────────────────────────────────┤
│  Layer 5: TRUST + VERIFICATION LAYER                             │
│  Multi-model consensus hash (Claude + Gemini agree → signal)     │
│  Score snapshot pinned to IPFS via Pinata → verifiable CID       │
│  CID serves as immutable proof for Chainlink oracle integration  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scoring Engine: 6 Dimensions → Liquidity Stress Score

Each dimension scores 0–100. Weighted composite = final Liquidity Stress Score.

| # | Dimension | Method | Weight |
|---|-----------|--------|--------|
| 1 | **Duration Risk (WAM)** | Weighted Average Maturity of portfolio; longer = more fragile | 30% |
| 2 | **Reserve Transparency** | Attestation report freshness + mint/burn cross-reference divergence | 20% |
| 3 | **Geographic + Operational Concentration** | HHI of bank locations + data center corridor overlap | 15% |
| 4 | **Weather Tail-Risk Multiplier** | Storm track × bank LTV exposure (FDIC Call Reports) | 15% |
| 5 | **Counterparty Health** | FDIC watch list status, LTV ratios, liquidity coverage (LLM-as-judge) | 15% |
| 6 | **Peg Stability** | Historical depeg events, current spread, mint/burn velocity | 5% |

**Final output mapping:**
```
Stress Score 0–25   → "Low Stress. Redemption latency: <4h. Coverage: 100%+"
Stress Score 26–50  → "Moderate Stress. Latency: 4–24h. Coverage: 95–100%"
Stress Score 51–75  → "Elevated Stress. Latency: 24–72h. Coverage: 85–95%"
Stress Score 76–100 → "Critical Stress. Latency: 72h+. Coverage: <85%"
```

---

## Competitive Positioning (Slide 6)

> **Key pitch line:** "Onchain shows the flows. Katabatic shows what's about to break."

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 1 — Onchain Data Platforms                            │
│  Dune · Nansen · Chainalysis · Glassnode                     │
│  (Mint/burn flows, wallet balances, transaction history)     │
├───────────────────────── ▼ ──────────────────────────────────┤
│  Layer 2 — Reserve Risk Infrastructure  ★ KATABATIC ★        │
│  WAM duration engine · FDIC Call Report mining                │
│  Weather tail-risk model · Reserve stress scoring              │
│  What onchain can't see:                                     │
│    • Duration mismatch   • Bank health signals                │
│    • Data center ops risk • Weather tail-risk                 │
├───────────────────────── ▼ ──────────────────────────────────┤
│  Layer 3 — Downstream Consumers                              │
│  MakerDAO · Aave · Compound · Risk Desks · AI Agents         │
└──────────────────────────────────────────────────────────────┘
```

---

## Business Model (Slide 8)

> **Key pitch line:** "API-first infrastructure. Not a consulting fee."

| Tier | Features |
|------|----------|
| **Starter API** | REST API access · MCP for AI agents · 6 stablecoins · <2s rescore · webhook alerts |
| **Enterprise** *(featured)* | Real-time streaming · IPFS verified scores · multi-model consensus · SLA · warehouse delivery |
| **Institutional** | FDIC Call Report mining · oracle feed integration · GENIUS Act compliance · dedicated scoring pipeline |

**Target logos (Slide 9 conveyor):** MakerDAO, Aave, Compound, Chainlink, USDC, Tether, Uniswap, Ethereum

---

## Stablecoin Market (Slide 5)

The GENIUS Act (Jul 2025) is the regulatory catalyst. Market trajectory:

| Year | Market Cap | Context |
|------|-----------|---------|
| 2021 | $150B | Pre-regulation peak |
| 2023 | $125B | Post-Terra/UST crash |
| 2025 | $310B | GENIUS Act signed — XBRL + OCC API feeds mandated for all PPSIs |
| 2027 (proj.) | $500B | Institutional adoption accelerates |
| 2030 (proj.) | $700B+ | Full regulatory integration |

**Key stat:** 6 stablecoins tracked, <2s re-score time.

**The pitch (Slide 5):** "The data didn't exist. Now it does." Before 2025: PDF attestations with 30-day lag, no programmatic access. After GENIUS Act: XBRL + OCC API feeds mandated. Realtime reserve stress monitoring is now possible.

---

## GitHub Workflow & Branch Strategy

### Branch Structure

```
main                               ← Production-ready, deploy target
├── dev                            ← Integration branch
│   ├── feat/data-ingestion        ← Attestation/PDF extraction + on-chain mint/burn
│   ├── feat/knowledge-graph       ← NetworkX graph: banks + data centers + jurisdictions
│   ├── feat/weather-pipeline      ← NOAA/NHC ingestion + FDIC Call Report LTV mining
│   ├── feat/scoring-engine        ← WAM engine + weather multiplier + LLM jury
│   ├── feat/dashboard             ← React shell, stress score table, WAM charts
│   ├── feat/reserve-map           ← Leaflet map, bank markers, corridor overlays
│   ├── feat/narratives            ← Multi-model causal explanation generation
│   ├── feat/mcp-server            ← MCP server: AI-agent-native score delivery
│   ├── feat/svb-backtest          ← SVB March 2023 duration mismatch replay
│   └── feat/demo-polish           ← Final polish, trust layer mock, deploy
```

### Branch Rules

- `main`: Protected. Only merges from `dev` after team review. Tagged releases for demo checkpoints.
- `dev`: Integration branch. All `feat/*` branches merge here via PR. Must pass lint + tests.
- `feat/*`: Short-lived feature branches. One per workstream task. Squash-merge into `dev`.

### PR Workflow

1. Create `feat/*` branch from `dev`
2. Work, commit often with descriptive messages
3. Open PR to `dev` — at least 1 team member reviews
4. Squash-merge into `dev`
5. At demo checkpoints: merge `dev` → `main`, tag release

---

## Precise Actions (36-Hour Roadmap)

### Phase 1: Foundation (Fri Evening · Hours 0–4)

**Owner: Everyone (parallel setup)**

- [ ] Initialize monorepo structure:
  ```
  /backend        ← FastAPI app
  /frontend       ← React 19 + Vite dashboard SPA (demo vehicle for the API)
  /slides-app     ← React 19 + Vite + Framer Motion pitch deck (10 slides, DONE)
  /data           ← Fixture fallbacks (demo safety net), attestation samples, extracted data
  /scripts        ← One-off data processing scripts
  ```
- [ ] Set up `backend/`: FastAPI skeleton, `/health` endpoint, CORS config, `.env` for API keys
- [ ] Set up `frontend/`: Vite + React + Tailwind, basic routing, layout shell
- [ ] Create `dev` branch, push both scaffolds
- [ ] Define JSON schema for reserve data (attestation-first, PDF fallback):
  ```json
  {
    "stablecoin": "USDC",
    "issuer": "Circle",
    "report_date": "2026-02-28",
    "data_source": "genius_act_attestation",
    "total_reserves": 42000000000,
    "weighted_avg_maturity_days": 45,
    "counterparties": [
      {
        "bank_name": "BNY Mellon",
        "city": "New York",
        "state": "NY",
        "percentage": 35.0,
        "asset_class": "t_bills",
        "maturity_days": 30,
        "fdic_ltv_ratio": 0.62,
        "data_center_corridor": "us-east-1"
      }
    ],
    "onchain_cross_check": {
      "burn_7d_usd": 850000000,
      "custodian_cash_delta": -840000000,
      "divergence_pct": 1.2
    }
  }
  ```
- [ ] Build data provider layer: `data_provider.py` (Live→Cache→Fixture base), `cache.py` (async SQLite TTL cache), `fdic_provider.py`, `weather_provider.py`, `etherscan_provider.py`, `nominatim_provider.py`
- [ ] Validate existing fixture fallbacks: `usdc_baseline.json`, `usdt_baseline.json`, `svb_march2023.json`
- [ ] Tag `v0.1-foundation`

### Phase 2: Pipeline & Knowledge Graph (Sat Morning · Hours 4–12)

**feat/data-ingestion (LLM/Extraction role)**
- [ ] Build Claude API prompt chain for GENIUS Act attestation report parsing (primary path) — these are monthly reports certified by accounting firms disclosing reserve composition, asset types, maturities, and custodians
- [ ] PDF fallback parser for stablecoins not yet GENIUS Act-compliant (USDT, etc.)
- [ ] Extract: bank names, deposit percentages, asset classes, WAM per tranche, jurisdictions
- [ ] On-chain cross-reference: fetch 7-day Mint/Burn volume from Etherscan; compare to custodian cash delta in filing; flag divergences >5% as opacity signal
- [ ] Output structured JSON per stablecoin, store in `/data/extracted/`
- [ ] Endpoint: `POST /api/extract` — accepts attestation report/PDF, returns structured JSON with WAM

**feat/knowledge-graph (Graph/Weather role)**
- [ ] Build NetworkX graph nodes: `[Stablecoin, Bank, DataCenterCorridor, City, State, Jurisdiction]`
- [ ] Edges: `holds_reserves_at`, `processes_ops_via`, `located_in`, `governed_by`
- [ ] Bank nodes carry: WAM, FDIC health score, LTV ratio, liquidity coverage
- [ ] Data Center Corridor nodes: map AWS/Azure regions to lat/lng bounding boxes (us-east-1 = Northern Virginia, etc.)
- [ ] Geographic indexing: geocode all bank nodes via Nominatim
- [ ] Graph query functions: `get_exposed_stablecoins(region)`, `get_duration_risk(stablecoin)`, `get_ops_risk(storm_track)`
- [ ] Endpoint: `GET /api/graph` — returns serialized graph for frontend

**feat/weather-pipeline (Graph/Weather role)**
- [ ] NOAA API integration: fetch active weather alerts by region
- [ ] NHC hurricane track parser: cone of uncertainty, forecast path, category
- [ ] OpenMeteo historical weather for backtest scenarios
- [ ] FDIC Call Report miner: LLM extracts mortgage LTV ratios and liquidity coverage per bank; attach to bank nodes
- [ ] Storm overlay logic: for each bank in storm track, compute `ltv_stress = ltv_ratio × storm_intensity_factor`
- [ ] Operational risk: check if storm track intersects data center corridor bounding boxes
- [ ] Endpoint: `GET /api/weather/active` — returns current weather stress events with ops impact
- [ ] Endpoint: weather data is consumed by scoring engine from live NOAA/NHC feeds — no manual simulation endpoint

**feat/scoring-engine (Data/Scoring role)**
- [ ] WAM calculator: `duration_score = normalize(weighted_avg_maturity_days, 0, 365)`
- [ ] Weather multiplier: `weather_stress = ltv_stress × storm_category_factor × concentration_hhi`
- [ ] Operational risk score: binary flag if storm track hits any data center corridor serving the issuer
- [ ] LLM jury: call Claude + Gemini with same FDIC Call Report context; average their 0–100 counterparty health scores; flag if delta > 15 (models disagree)
- [ ] Composite: `stress_score = Σ(weight_i × dimension_i)` per table above
- [ ] Output mapping: stress score → redemption latency + liquidity coverage estimate
- [ ] Endpoint: `GET /api/stress-scores` — returns all stablecoin stress scores
- [ ] Endpoint: `POST /api/stress-scores/project` — system-generated scenario projection from live data feeds (NOAA forecasts, Fed/macro signals, FDIC alerts)

**feat/mcp-server (Backend role)**
- [ ] Add `fastmcp` SDK to `requirements.txt`
- [ ] Write `backend/mcp_server.py` — MCP server exposing 5 tools: `get_stress_scores`, `get_stablecoin_detail`, `project_scenario`, `get_active_alerts`, `get_score_history`
- [ ] Each tool delegates to existing scoring/weather/ipfs service functions
- [ ] Support stdio transport (local agent) and SSE transport (remote agent)
- [ ] All tool outputs use the standard `{ "data": ..., "error": null, "timestamp": "..." }` envelope
- [ ] Write `backend/tests/test_mcp_server.py` — unit tests for all 5 MCP tools

- [ ] Tag `v0.2-pipeline`

### Phase 3: Data-Driven Risk Modeling Dashboard (Sat Afternoon · Hours 12–20)

**feat/dashboard (Frontend role)**
- [x] Stress score table: all stablecoins with Liquidity Stress Score + redemption latency + coverage ratio
- [x] Detail view: click a stablecoin → 6-dimension breakdown (Recharts), model consensus, causal narrative
- [x] Alert banner: active weather events with ops impact assessment
- [x] Data-driven risk modeling: dashboard surfaces real-world data and shows projected impact on reserve liquidity
- [x] Framing copy: "Liquidity Stress Score" not "Rating" throughout all UI

**feat/reserve-map (Frontend + Graph roles)**
- [x] Leaflet map layers:
  - Custodian bank markers (colored by health, sized by reserve %)
  - Data center corridor overlays (shaded regions for AWS/Azure zones)
  - Weather alert shading for affected states
- [x] View-only map — data-driven, reflecting live state from scoring engine
- [x] Popup details: bank name, state, LTV, maturity, reserves held

**feat/narratives (LLM/Extraction role)**
- [ ] Multi-model narrative generation:
  - Send same context to Claude + Gemini
  - If both models produce consistent causal chains → display narrative with "consensus" badge
  - If models diverge → surface both interpretations as "Model A / Model B" views
- [ ] Example output: "USDC stress score elevated to 68. 35% of reserves at BNY Mellon, which processes operations via AWS us-east-1 (Northern Virginia). Hurricane tracking toward the corridor could delay redemption processing. Separately, 22% exposure to FL regional banks shows LTV ratios of 0.71 in FDIC Call Reports — elevated given hurricane-driven property value stress."
- [ ] Endpoint: `POST /api/narratives` — accepts stress context, returns consensus narrative + model agreement score
- [ ] Display in dashboard detail view with consensus badge

- [ ] Tag `v0.3-dashboard`

### Phase 4: Backtests & Trust Layer (Sat Night · Hours 20–26)

**feat/svb-backtest (Data/Scoring + LLM roles)**
- [ ] SVB time machine: load March 2023 data, replay stress scores day-by-day
- [ ] Key insight to show: SVB had a 5.6-year average WAM on treasuries (~2,040 days) → duration mismatch was the root cause; Fed rate hikes were the multiplier; the bank run was the outcome
- [ ] Show stress score crossing 75 ("Critical") ~48 hours before USDC depeg
- [ ] Annotate timeline: "Rate hike + long duration = fragile. Bank run = catalyst."
- [ ] Hurricane Ian replay (Sept 2022): show FL bank LTV stress propagation via FDIC Call Report data
- [ ] Timeline scrubber UI component for both backtests

**feat/demo-polish (Everyone)**
- [ ] Trust + Verification Layer:
  - Show "Model Consensus: Claude 68 | Gemini 71 | Delta: 3 → SIGNAL CONFIRMED" badge
  - Pin consensus score snapshot (JSON blob: score + narrative + timestamp + model scores) to IPFS via Pinata API
  - Display the returned IPFS CID: `ipfs://Qm...` (clickable, resolves to the pinned score data)
  - Endpoint: `POST /api/publish-score` — pins score to Pinata, returns `{ "cid": "Qm...", "ipfs_url": "https://gateway.pinata.cloud/ipfs/Qm...", "timestamp": "..." }`
  - Display alongside: "TEE-ready for Chainlink · Score verified on IPFS"
  - This positions Katabatic as oracle-grade infrastructure with verifiable, immutable score provenance
- [ ] Wire up all 3 demo scenarios end-to-end:
  - Scenario A: Hurricane → Northern Virginia data center corridor → ops risk + FL bank LTV stress → stress score spike (primary demo)
  - Scenario B: SVB collapse backtest — duration mismatch as root cause
  - Scenario C: 100bps rate hike → WAM sensitivity → show which stablecoins are most exposed
- [ ] Loading states, error handling, empty states
- [ ] Graceful degradation: UI shows data source badge ("Live"/"Cached"/"Fixture") on every score — no separate demo mode needed. 3-tier resolution (Live→Cache→Fixture) IS the graceful degradation

- [ ] Tag `v0.4-backtests`

### Phase 5: Ship (Sun Morning · Hours 26–36)

- [ ] Code freeze at **hour 30**
- [ ] Deploy frontend to Vercel, backend to Railway/Render
- [ ] Verify all 3 demo paths work on deployed URLs
- [ ] Rehearse 10-slide presentation 5× (target: under 4 minutes including live demo)
- [ ] Prepare backup: pre-recorded screen capture of demo in case of live failure
- [ ] Final merge `dev` → `main`, tag `v1.0-demo`

---

## Presentation: 10 Slides (~4 Minutes)

> **Full presenter script with timing cues:** `slides-app/PRESENTER-SCRIPT.md`
> **Slide source code:** `slides-app/src/slides/01-hero.tsx` through `10-close.tsx`

| # | Slide | Time | Key Line |
|---|-------|------|----------|
| 01 | **Hero** | 10s | "Liquidity stress testing for stablecoin reserves." |
| 02 | **The Problem** | 20s | "The attestation said fine. Then SVB failed." ($3.3B USDC reserves, $0.87 depeg, −13¢ in 48h) |
| 03 | **The Engine** | 20s | "From opaque PDF to realtime liquidity stress score." (4 inputs → 6-step pipeline → 68/100 score, 72h latency, 88% coverage, consensus badge) |
| 04 | **Six Dimensions** | 20s | "Duration risk is primary. Weather is the force multiplier." (formula + 6 weighted bars, SVB 2,040-day WAM) |
| 05 | **Why Now** | 20s | "The GENIUS Act just created this market." (timeline: Before 2025 → Jul 2025 GENIUS Act → Today. Market $150B→$700B+) |
| 06 | **Positioning** | 20s | "Onchain shows the flows. Katabatic shows what's about to break." (3-layer diagram + "What Onchain Can't See" panel) |
| 07 | **Live Demo** | 10s + **60s demo** | Three scenarios: hurricane ops freeze, SVB backtest, rate hike sensitivity |
| 08 | **Vision** | 20s | "Bloomberg started with terminals. We start with stress simulations." (3-phase roadmap + WAM comparison bars) |
| 09 | **Go to Market** | 15s | "API-first infrastructure. Not a consulting fee." (3 tiers + logo conveyor) |
| 10 | **The Close** | 20s | "Weather proves the engine." (72h latency, 88% coverage hero metrics + Katabatic logo) |

### Live Demo (Slide 7, ~60 seconds)

1. **Live Dashboard** — Show real-time stress scores updating from live NOAA/FDIC/Etherscan data
2. **Detail View** — Click USDC → 6-dimension breakdown, model consensus badge, causal narrative
3. **Reserve Map** — Bank markers colored by health, data center corridor overlays, active weather alerts

---

## API Keys Required (.env)

```
ANTHROPIC_API_KEY=           # Claude API for extraction, narratives, LLM jury
GEMINI_API_KEY=              # Gemini for multi-model consensus scoring
ETHERSCAN_API_KEY=           # Etherscan V2 — on-chain Mint/Burn cross-reference
PINATA_API_KEY=              # Pinata IPFS pinning for score verification
PINATA_SECRET_API_KEY=       # Pinata secret key for authenticated pinning
```

**No API key needed for:** NOAA NWS (User-Agent header only), Open-Meteo (fully public, 10k req/day), FDIC BankFind (fully public), Nominatim (User-Agent only, 1 req/sec).

---

## Collaborators

- Adi Prathapa
- Aritro Ganguly
- Connor
- Krish
- Suchit
- Vikram

---

## Task Tracking

All project work is tracked in **`TASKS.md`** at the repo root. This is the master task list.

**Claude must follow these rules without exception:**
- When any task in `TASKS.md` is completed, immediately edit `TASKS.md` to mark it `[x]`
- Update the `Progress Tracker` table at the bottom of `TASKS.md` when a phase is fully complete
- Update the `Last updated` date in `TASKS.md` whenever the file is modified
- Never mark a task complete unless the implementation is verified and working
- If a new sub-task is discovered during implementation, add it to `TASKS.md` before starting it

---

## Conventions

- Commit messages: `feat:`, `fix:`, `chore:`, `docs:` prefixes
- Python: Black formatter, type hints, docstrings on public functions
- React: Functional components, hooks only, no class components
- All API responses follow: `{ "data": ..., "error": null, "timestamp": "...", "resolution_source": "live|cache|fixture" }`
- Branch names: `feat/short-description`, `fix/short-description`
- Never use "rating" or "grade" in UI copy — always "Liquidity Stress Score" or "stress level"

### Git Commits — No AI Co-Author Tags

- **NEVER** add `Co-Authored-By` lines mentioning Claude, Claude Code, Anthropic, or any AI tool in commit messages
- **NEVER** reference AI assistance in commit messages, PR descriptions, or any committed file
- Commit messages should read as if written by a human developer — no AI attribution

### Security — THIS IS A PUBLIC REPO

**Claude must follow these rules without exception:**
- **NEVER** write API keys, tokens, passwords, or secrets into any file other than `.env` (which is gitignored)
- **NEVER** hardcode credentials in source code — always read from `os.getenv()` or `import.meta.env`
- **NEVER** commit `.env`, `.env.local`, `.env.production`, `credentials.json`, `*.pem`, `*.key`, or any file matching `*secret*`
- **NEVER** log or print API key values — only log whether a key is set or missing
- Before every commit, verify no secrets are staged: check `git diff --cached` for API keys, tokens, or passwords
- Use `.env.example` with empty values as the template — never populate it with real keys
- If you accidentally write a secret to a tracked file, **immediately** remove it and warn the user that the key must be rotated (git history preserves secrets even after deletion)
