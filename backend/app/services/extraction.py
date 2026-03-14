"""Claude-based extraction service for OCC XBRL and PDF attestation reports."""

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import aiosqlite

from app.models.reserve import ReserveData

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_DB_PATH = _REPO_ROOT / "data" / "extracted.sqlite"
_FIXTURES_DIR = _REPO_ROOT / "data" / "fixtures"

# ---------------------------------------------------------------------------
# JSON schema passed to Claude — illustrative example so it understands
# the exact shape we expect back.
# ---------------------------------------------------------------------------
_RESERVE_SCHEMA = json.dumps(
    {
        "stablecoin": "USDC",
        "issuer": "Circle",
        "report_date": "2026-02-28",
        "data_source": "genius_act_attestation",
        "total_reserves": 42000000000,
        "weighted_avg_maturity_days": 45.0,
        "counterparties": [
            {
                "bank_name": "BNY Mellon",
                "city": "New York",
                "state": "NY",
                "percentage": 35.0,
                "asset_class": "t_bills",
                "maturity_days": 30,
                "fdic_ltv_ratio": 0.62,
                "data_center_corridor": "us-east-1",
            }
        ],
        "onchain_cross_check": {
            "burn_7d_usd": 850000000,
            "custodian_cash_delta": -840000000,
            "divergence_pct": 1.2,
        },
    },
    indent=2,
)

# ---------------------------------------------------------------------------
# Claude prompt templates
# ---------------------------------------------------------------------------
XBRL_PROMPT = """You are a financial data extraction specialist. Parse this OCC XBRL filing into structured JSON.

Extract:
- issuer name and stablecoin ticker
- report date
- total reserve value
- for each counterparty bank: name, city, state, percentage of reserves, asset class (t_bills/repo/mmf/deposits/commercial_paper), maturity in days, FDIC LTV ratio if available
- weighted average maturity (WAM) in days
- data center corridor (us-east-1, us-east-2, us-west-1, us-west-2) if mentioned

Respond with ONLY valid JSON matching this schema:
{schema}

XBRL Content:
{content}"""

PDF_PROMPT = """You are a financial data extraction specialist. Parse this stablecoin reserve attestation PDF into structured JSON.
The PDF may be from any issuer (Circle, Tether, Paxos, etc.). Extract all counterparty and maturity data you can find.
If data is missing, use null. Always compute weighted_avg_maturity_days from the individual maturity values.
Respond with ONLY valid JSON matching this schema: {schema}

PDF Text:
{content}"""


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------
class ExtractionService:
    """Extracts structured reserve data from XBRL/PDF attestations using Claude."""

    def __init__(self) -> None:
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self.available = bool(self.anthropic_key)

    # ------------------------------------------------------------------
    # Public extraction entry-points
    # ------------------------------------------------------------------

    async def extract_reserve_data(self, content: str, source_type: str) -> ReserveData:
        """Route to XBRL or PDF extractor based on source_type.

        Gracefully degrades to a seed fixture when ANTHROPIC_API_KEY is not set.
        """
        if not self.available:
            fallback = self._load_fixture("usdc")
            if fallback:
                fallback.resolution_source = "fixture"
                return fallback
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set and no fixture fallback is available"
            )

        if source_type == "xbrl":
            return await self.extract_from_xbrl(content)
        elif source_type == "pdf":
            return await self.extract_from_pdf(content)
        else:
            raise ValueError(
                f"Unknown source_type '{source_type}' — must be 'xbrl' or 'pdf'"
            )

    async def extract_from_xbrl(self, xbrl_content: str) -> ReserveData:
        """Parse an OCC XBRL filing into ReserveData using Claude."""
        prompt = XBRL_PROMPT.format(schema=_RESERVE_SCHEMA, content=xbrl_content)
        raw = await self._call_claude(prompt)
        data = self._parse_json_from_response(raw)
        return self._build_reserve_data(data, source_type="genius_act_attestation")

    async def extract_from_pdf(self, pdf_text: str) -> ReserveData:
        """Parse an attestation PDF into ReserveData using Claude."""
        prompt = PDF_PROMPT.format(schema=_RESERVE_SCHEMA, content=pdf_text)
        raw = await self._call_claude(prompt)
        data = self._parse_json_from_response(raw)
        return self._build_reserve_data(data, source_type="pdf_attestation")

    # ------------------------------------------------------------------
    # Claude API call
    # ------------------------------------------------------------------

    async def _call_claude(self, prompt: str) -> str:
        """Call Claude Sonnet and return the text response."""
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=self.anthropic_key)
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

    # ------------------------------------------------------------------
    # Parsing + building
    # ------------------------------------------------------------------

    def _parse_json_from_response(self, text: str) -> dict:
        """Robustly extract a JSON object from Claude's response.

        Handles markdown code fences, leading/trailing whitespace, and
        responses where the JSON is embedded in prose.
        """
        # Strip markdown code fences (```json ... ``` or ``` ... ```)
        cleaned = re.sub(r"```(?:json)?\s*", "", text).strip().strip("`").strip()

        # Direct parse
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Extract first top-level {...} block
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        raise ValueError(
            f"Could not parse JSON from Claude response. First 300 chars: {text[:300]}"
        )

    def _compute_wam(self, counterparties: list[dict]) -> float:
        """Compute Weighted Average Maturity (days) from counterparty list."""
        total_weight = 0.0
        weighted_sum = 0.0
        for cp in counterparties:
            pct = float(cp.get("percentage") or 0)
            mat = float(cp.get("maturity_days") or 0)
            weighted_sum += pct * mat
            total_weight += pct
        if total_weight == 0:
            return 0.0
        return round(weighted_sum / total_weight, 2)

    def _build_reserve_data(self, data: dict, source_type: str) -> ReserveData:
        """Validate extracted dict into a ReserveData model, recomputing WAM if needed."""
        counterparties = data.get("counterparties") or []

        # Recompute WAM from counterparties if the field is absent or zero
        wam = data.get("weighted_avg_maturity_days")
        if not wam and counterparties:
            wam = self._compute_wam(counterparties)
        data["weighted_avg_maturity_days"] = wam or 0.0

        # Stamp source metadata
        data["data_source"] = source_type
        data["resolution_source"] = "live"
        data.setdefault(
            "source_timestamp", datetime.now(timezone.utc).isoformat()
        )

        return ReserveData(**data)

    # ------------------------------------------------------------------
    # SQLite persistence
    # ------------------------------------------------------------------

    async def _init_db(self) -> None:
        """Create the reserve_data table if it does not already exist."""
        _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        async with aiosqlite.connect(_DB_PATH) as db:
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS reserve_data (
                    id           INTEGER PRIMARY KEY AUTOINCREMENT,
                    stablecoin   TEXT    NOT NULL,
                    extracted_at TEXT    NOT NULL,
                    source_type  TEXT    NOT NULL,
                    data_json    TEXT    NOT NULL
                )
                """
            )
            await db.commit()

    async def store_reserve_data(self, data: ReserveData, source_type: str) -> None:
        """Persist a ReserveData record to SQLite."""
        await self._init_db()
        async with aiosqlite.connect(_DB_PATH) as db:
            await db.execute(
                """
                INSERT INTO reserve_data (stablecoin, extracted_at, source_type, data_json)
                VALUES (?, ?, ?, ?)
                """,
                (
                    data.stablecoin.upper(),
                    datetime.now(timezone.utc).isoformat(),
                    source_type,
                    data.model_dump_json(),
                ),
            )
            await db.commit()

    async def get_all_reserves(self) -> list[ReserveData]:
        """Return the latest extracted record per stablecoin.

        Falls back to seed fixtures when the DB is empty or unavailable.
        """
        await self._init_db()
        try:
            async with aiosqlite.connect(_DB_PATH) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(
                    """
                    SELECT data_json FROM reserve_data
                    WHERE id IN (
                        SELECT MAX(id) FROM reserve_data GROUP BY stablecoin
                    )
                    ORDER BY stablecoin
                    """
                ) as cursor:
                    rows = await cursor.fetchall()
                    if rows:
                        return [
                            ReserveData(**json.loads(row["data_json"])) for row in rows
                        ]
        except Exception:
            pass
        return self._load_all_fixtures()

    async def get_reserve_by_stablecoin(self, stablecoin: str) -> Optional[ReserveData]:
        """Return the latest extracted record for one stablecoin.

        Falls back to the seed fixture for that symbol if nothing is stored.
        """
        await self._init_db()
        try:
            async with aiosqlite.connect(_DB_PATH) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute(
                    """
                    SELECT data_json FROM reserve_data
                    WHERE stablecoin = ?
                    ORDER BY id DESC LIMIT 1
                    """,
                    (stablecoin.upper(),),
                ) as cursor:
                    row = await cursor.fetchone()
                    if row:
                        return ReserveData(**json.loads(row["data_json"]))
        except Exception:
            pass
        return self._load_fixture(stablecoin)

    # ------------------------------------------------------------------
    # Fixture fallback helpers
    # ------------------------------------------------------------------

    def _load_fixture(self, stablecoin: str) -> Optional[ReserveData]:
        """Load seed fixture for a stablecoin (tries *_baseline.json then *.json)."""
        symbol = stablecoin.lower()
        for name in [f"{symbol}_baseline.json", f"{symbol}.json"]:
            path = _FIXTURES_DIR / name
            if path.exists():
                try:
                    with open(path) as f:
                        data = json.load(f)
                    data["resolution_source"] = "fixture"
                    return ReserveData(**data)
                except Exception:
                    continue
        return None

    def _load_all_fixtures(self) -> list[ReserveData]:
        """Load all seed fixtures in /data/fixtures/ that contain a stablecoin field."""
        results: list[ReserveData] = []
        if not _FIXTURES_DIR.exists():
            return results
        for path in sorted(_FIXTURES_DIR.glob("*.json")):
            try:
                with open(path) as f:
                    data = json.load(f)
                if "stablecoin" not in data:
                    continue
                data["resolution_source"] = "fixture"
                results.append(ReserveData(**data))
            except Exception:
                continue
        return results
