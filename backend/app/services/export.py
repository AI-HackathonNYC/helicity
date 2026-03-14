"""Warehouse delivery — bulk score export for enterprise clients.

Writes computed StressScoreResults to a SQLite stress_scores table and
exposes them for bulk export as JSON or CSV (Snowflake/BigQuery/Databricks).

CSV columns:
    date, stablecoin, score, level, latency_hours, coverage_ratio,
    dim_duration, dim_transparency, dim_concentration, dim_weather,
    dim_counterparty, dim_peg, ipfs_cid
"""

import csv
import io
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import aiosqlite

from app.models.stress import StressScoreResult

# ---------------------------------------------------------------------------
# DB path
# ---------------------------------------------------------------------------
_DB_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "scores.sqlite"

# Dimension name → CSV column mapping (order matters for CSV header)
_DIM_COLUMNS = [
    ("Duration Risk (WAM)", "dim_duration"),
    ("Reserve Transparency", "dim_transparency"),
    ("Geographic Concentration", "dim_concentration"),
    ("Weather Tail-Risk", "dim_weather"),
    ("Counterparty Health", "dim_counterparty"),
    ("Peg Stability", "dim_peg"),
]


# ---------------------------------------------------------------------------
# DB lifecycle
# ---------------------------------------------------------------------------

async def _init_db() -> None:
    """Create stress_scores table if it does not exist."""
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(_DB_PATH) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS stress_scores (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                scored_at       TEXT    NOT NULL,
                stablecoin      TEXT    NOT NULL,
                score           REAL    NOT NULL,
                level           TEXT    NOT NULL,
                latency_hours   TEXT    NOT NULL,
                coverage_ratio  TEXT    NOT NULL,
                dim_duration    REAL,
                dim_transparency REAL,
                dim_concentration REAL,
                dim_weather     REAL,
                dim_counterparty REAL,
                dim_peg         REAL,
                ipfs_cid        TEXT
            )
            """
        )
        await db.commit()


# ---------------------------------------------------------------------------
# Write side — called by scoring engine after every run
# ---------------------------------------------------------------------------

async def store_score(result: StressScoreResult) -> None:
    """Persist a StressScoreResult to the stress_scores SQLite table.

    Extracts the 6 dimension scores by name so they land in typed columns
    for efficient querying and CSV export.
    """
    await _init_db()

    # Index dimensions by name for safe lookup
    dim_map = {d.name: d.score for d in result.dimensions}

    row = (
        result.source_timestamp or datetime.now(timezone.utc).isoformat(),
        result.stablecoin.upper(),
        result.stress_score,
        result.stress_level,
        result.redemption_latency_hours,
        result.liquidity_coverage_ratio,
        dim_map.get("Duration Risk (WAM)"),
        dim_map.get("Reserve Transparency"),
        dim_map.get("Geographic Concentration"),
        dim_map.get("Weather Tail-Risk"),
        dim_map.get("Counterparty Health"),
        dim_map.get("Peg Stability"),
        result.ipfs_cid,
    )

    async with aiosqlite.connect(_DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO stress_scores (
                scored_at, stablecoin, score, level, latency_hours, coverage_ratio,
                dim_duration, dim_transparency, dim_concentration, dim_weather,
                dim_counterparty, dim_peg, ipfs_cid
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            row,
        )
        await db.commit()


# ---------------------------------------------------------------------------
# Read side — JSON export
# ---------------------------------------------------------------------------

async def export_scores_json(
    stablecoins: Optional[list[str]],
    start_date: str,
    end_date: str,
    limit: int = 1000,
    offset: int = 0,
) -> list[dict]:
    """Query historical scores from SQLite and return as a list of dicts.

    Args:
        stablecoins: filter to these symbols (None = all).
        start_date:  ISO date string "YYYY-MM-DD" (inclusive).
        end_date:    ISO date string "YYYY-MM-DD" (inclusive).
        limit:       max rows per page (default 1000, max 10000).
        offset:      rows to skip for pagination.

    Returns:
        List of score dicts; empty list if no rows match.
    """
    await _init_db()

    # Clamp limit
    limit = min(limit, 10000)

    # Build WHERE clause
    conditions = ["scored_at >= ?", "scored_at <= ?"]
    # Extend end_date to end of day so "2026-03-10" includes 23:59:59
    params: list = [f"{start_date}T00:00:00", f"{end_date}T23:59:59"]

    if stablecoins:
        placeholders = ",".join("?" * len(stablecoins))
        conditions.append(f"stablecoin IN ({placeholders})")
        params.extend([s.upper() for s in stablecoins])

    where = " AND ".join(conditions)
    params.extend([limit, offset])

    query = f"""
        SELECT
            scored_at   AS date,
            stablecoin,
            score,
            level,
            latency_hours,
            coverage_ratio,
            dim_duration,
            dim_transparency,
            dim_concentration,
            dim_weather,
            dim_counterparty,
            dim_peg,
            ipfs_cid
        FROM stress_scores
        WHERE {where}
        ORDER BY scored_at DESC, stablecoin ASC
        LIMIT ? OFFSET ?
    """

    try:
        async with aiosqlite.connect(_DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(query, params) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]
    except Exception:
        return []
