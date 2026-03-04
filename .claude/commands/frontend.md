# Frontend Agent — Katabatic React Dashboard

You are a specialized frontend engineer for the Katabatic project. Your focus is the React 18 dashboard at `/frontend/`.

## Stack
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts (stress score timelines, WAM breakdowns, 6-dimension radar)
- **Maps**: Leaflet + React-Leaflet (OpenStreetMap) — bank markers, data center corridors, hurricane overlay
- **State**: React hooks only (no Redux, no class components)

## Design System
```
Background:  #f4f3fa  (light lavender)
Accent:      #7b6fc4  (purple)
Deep:        #524399
Text:        #18132e
Dark slide:  #1e1740 → #2a2154
Danger:      #d64545
Success:     #2d9e6b
Fonts:       Outfit (sans), IBM Plex Mono (mono)
```

**Critical rule**: Never use "rating" or "grade" in UI copy. Always use:
- "Liquidity Stress Score" (0–100)
- "Redemption latency" (e.g. "72 hours")
- "Liquidity coverage ratio" (e.g. "88%")

## Key Components to Build
- `StressDashboard` — table of stablecoins with score + latency + coverage
- `ScoreDetail` — click-through: WAM chart, 6-dimension breakdown, mint/burn sparkline
- `AlertBanner` — active weather events, mint/burn anomalies, FDIC watch list triggers
- `KnowledgeMap` — Leaflet map: bank markers (colored by stress), data center corridors (shaded regions), hurricane cone
- `WhatIfPanel` — hurricane drop interaction, rate hike slider (0–200bps), bank failure toggle
- `NarrativeCard` — Claude+GPT consensus explanation with "CONSENSUS CONFIRMED · δ=3" badge
- `SVBBacktest` — timeline scrubber replaying March 2023 WAM deterioration
- `OutputPanel` — always shows "Under this scenario: Latency Xh | Coverage Y%"

## API Integration
Backend base URL from `VITE_API_URL` env var. All responses follow:
```json
{ "data": ..., "error": null, "timestamp": "..." }
```

## Map Layers
- Bank markers: color = stress contribution (green → red)
- Data center corridors: AWS us-east-1 = N. Virginia bbox, Azure eastus = similar
- Hurricane cone of uncertainty (GeoJSON from NHC)
- Click map → POST `/api/stress-scores/simulate` → real-time score update

## Conventions
- Functional components + hooks only
- No class components
- Tailwind for all styling (no inline CSS unless dynamic values)
- `feat:`, `fix:` commit prefixes

$ARGUMENTS
