"""Webhook delivery service for real-time Liquidity Stress Score notifications.

When a stress score changes beyond a configurable threshold, registered webhook
endpoints receive a signed HTTP POST containing the score update payload.

Features:
  - HMAC-SHA256 payload signing via X-Helicity-Signature header
  - Retry logic: 3 attempts with exponential backoff (1s → 4s → 16s)
  - Per-stablecoin filtering and per-webhook delta threshold
  - Delivery log stored in SQLite for audit trail
  - Secret redacted from all list/get responses
"""

import asyncio
import hashlib
import hmac
import json
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import aiosqlite
import httpx

from app.models.stress import StressScoreResult

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEFAULT_DB_PATH = (
    Path(__file__).resolve().parent.parent.parent / "data" / "webhooks.sqlite"
)

_BACKOFF_SECONDS = [1, 4, 16]  # exponential backoff delays for retries
_DELIVERY_TIMEOUT = 10.0  # seconds per attempt


# ---------------------------------------------------------------------------
# Database initialisation
# ---------------------------------------------------------------------------


async def initialize_db(db_path: Path = DEFAULT_DB_PATH) -> None:
    """Create webhook tables if they do not already exist.

    Args:
        db_path: Path to the SQLite database file.
    """
    db_path.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(str(db_path)) as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS webhooks (
                id            TEXT PRIMARY KEY,
                url           TEXT NOT NULL,
                stablecoins   TEXT NOT NULL DEFAULT '[]',
                threshold_delta REAL NOT NULL DEFAULT 5.0,
                secret        TEXT NOT NULL,
                created_at    REAL NOT NULL
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS webhook_deliveries (
                id          TEXT PRIMARY KEY,
                webhook_id  TEXT NOT NULL,
                stablecoin  TEXT NOT NULL,
                payload     TEXT NOT NULL,
                status      TEXT NOT NULL,
                attempts    INTEGER NOT NULL DEFAULT 0,
                timestamp   TEXT NOT NULL
            )
            """
        )
        await db.commit()


# ---------------------------------------------------------------------------
# Registration CRUD
# ---------------------------------------------------------------------------


async def register_webhook(
    url: str,
    stablecoins: list[str],
    threshold_delta: float,
    secret: str,
    db_path: Path = DEFAULT_DB_PATH,
) -> str:
    """Store a new webhook registration and return its UUID.

    Args:
        url: HTTPS endpoint to deliver score update notifications to.
        stablecoins: List of stablecoin tickers to filter on (empty = all).
        threshold_delta: Minimum absolute score change required to fire (default 5.0).
        secret: HMAC-SHA256 signing key for payload verification.
        db_path: Path to the SQLite database file.

    Returns:
        UUID string identifying this registration.
    """
    webhook_id = str(uuid.uuid4())
    async with aiosqlite.connect(str(db_path)) as db:
        await db.execute(
            """
            INSERT INTO webhooks (id, url, stablecoins, threshold_delta, secret, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                webhook_id,
                url,
                json.dumps([s.upper() for s in stablecoins]),
                threshold_delta,
                secret,
                time.time(),
            ),
        )
        await db.commit()
    return webhook_id


async def list_webhooks(db_path: Path = DEFAULT_DB_PATH) -> list[dict]:
    """Return all registered webhooks with secrets redacted.

    Args:
        db_path: Path to the SQLite database file.

    Returns:
        List of webhook dicts. The secret field is replaced with "***".
    """
    async with aiosqlite.connect(str(db_path)) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, url, stablecoins, threshold_delta, created_at FROM webhooks"
        ) as cursor:
            rows = await cursor.fetchall()

    result = []
    for row in rows:
        result.append(
            {
                "id": row["id"],
                "url": _redact_url(row["url"]),
                "stablecoins": json.loads(row["stablecoins"]),
                "threshold_delta": row["threshold_delta"],
                "secret": "***",
                "created_at": datetime.fromtimestamp(
                    row["created_at"], tz=timezone.utc
                ).isoformat(),
            }
        )
    return result


async def delete_webhook(
    webhook_id: str,
    db_path: Path = DEFAULT_DB_PATH,
) -> bool:
    """Delete a webhook registration by ID.

    Args:
        webhook_id: UUID of the webhook to remove.
        db_path: Path to the SQLite database file.

    Returns:
        True if a row was deleted, False if the ID was not found.
    """
    async with aiosqlite.connect(str(db_path)) as db:
        cursor = await db.execute(
            "DELETE FROM webhooks WHERE id = ?", (webhook_id,)
        )
        await db.commit()
        return cursor.rowcount > 0


async def get_webhook(
    webhook_id: str,
    db_path: Path = DEFAULT_DB_PATH,
) -> Optional[dict]:
    """Fetch a single webhook registration including its secret (internal use only).

    Args:
        webhook_id: UUID of the webhook.
        db_path: Path to the SQLite database file.

    Returns:
        Full webhook dict (with secret), or None if not found.
    """
    async with aiosqlite.connect(str(db_path)) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM webhooks WHERE id = ?", (webhook_id,)
        ) as cursor:
            row = await cursor.fetchone()

    if row is None:
        return None
    return {
        "id": row["id"],
        "url": row["url"],
        "stablecoins": json.loads(row["stablecoins"]),
        "threshold_delta": row["threshold_delta"],
        "secret": row["secret"],
        "created_at": row["created_at"],
    }


# ---------------------------------------------------------------------------
# Delivery
# ---------------------------------------------------------------------------


def _build_payload(
    event: str,
    stablecoin: str,
    previous_score: float,
    current_score: float,
    result: Optional[StressScoreResult] = None,
) -> dict:
    """Construct the webhook notification payload.

    Args:
        event: Event type string (e.g. "score_update" or "score_update.test").
        stablecoin: Stablecoin ticker.
        previous_score: Score before the latest computation.
        current_score: Score after the latest computation.
        result: Full StressScoreResult for additional fields (optional).

    Returns:
        Dict ready to be JSON-serialised and POSTed.
    """
    payload: dict = {
        "event": event,
        "stablecoin": stablecoin,
        "previous_score": previous_score,
        "current_score": current_score,
        "delta": round(current_score - previous_score, 1),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if result is not None:
        payload["stress_level"] = result.stress_level
        payload["redemption_latency_hours"] = result.redemption_latency_hours
        payload["liquidity_coverage_ratio"] = result.liquidity_coverage_ratio
    return payload


def _sign_payload(payload: dict, secret: str) -> str:
    """Compute HMAC-SHA256 signature for a payload dict.

    Args:
        payload: The dict that will be JSON-serialised and sent.
        secret: The webhook's signing key.

    Returns:
        Signature string in the form "sha256=<hex-digest>".
    """
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    digest = hmac.new(
        secret.encode(), body.encode(), hashlib.sha256
    ).hexdigest()
    return f"sha256={digest}"


async def _log_delivery(
    webhook_id: str,
    stablecoin: str,
    payload: dict,
    status: str,
    attempts: int,
    db_path: Path,
) -> None:
    """Write a delivery attempt record to the webhook_deliveries table.

    Args:
        webhook_id: ID of the webhook that was triggered.
        stablecoin: Stablecoin that triggered the delivery.
        payload: The payload dict that was sent (or attempted).
        status: "delivered" or "failed".
        attempts: Total number of delivery attempts made.
        db_path: Path to the SQLite database file.
    """
    async with aiosqlite.connect(str(db_path)) as db:
        await db.execute(
            """
            INSERT INTO webhook_deliveries
                (id, webhook_id, stablecoin, payload, status, attempts, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                webhook_id,
                stablecoin,
                json.dumps(payload),
                status,
                attempts,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        await db.commit()


async def _deliver(
    url: str,
    payload: dict,
    secret: str,
    webhook_id: str,
    stablecoin: str,
    db_path: Path,
) -> None:
    """POST the payload to the registered URL with HMAC signing and retry logic.

    Attempts delivery up to 3 times with exponential backoff (1s, 4s, 16s).
    Logs the final outcome to webhook_deliveries regardless of success or failure.

    Args:
        url: The webhook endpoint URL.
        payload: The dict to POST as JSON.
        secret: HMAC-SHA256 signing key.
        webhook_id: ID of the webhook registration.
        stablecoin: Stablecoin that triggered this delivery.
        db_path: Path to the SQLite database file.
    """
    signature = _sign_payload(payload, secret)
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    headers = {
        "Content-Type": "application/json",
        "X-Helicity-Signature": signature,
        "User-Agent": "Helicity-Webhook/1.0",
    }

    last_exc: Optional[Exception] = None
    for attempt, backoff in enumerate(_BACKOFF_SECONDS, start=1):
        try:
            async with httpx.AsyncClient(timeout=_DELIVERY_TIMEOUT) as client:
                resp = await client.post(url, content=body, headers=headers)
                resp.raise_for_status()
            await _log_delivery(
                webhook_id, stablecoin, payload, "delivered", attempt, db_path
            )
            return
        except Exception as exc:
            last_exc = exc
            if attempt < len(_BACKOFF_SECONDS):
                await asyncio.sleep(backoff)

    # All retries exhausted
    await _log_delivery(
        webhook_id, stablecoin, payload, "failed", len(_BACKOFF_SECONDS), db_path
    )


async def fire_webhooks(
    stablecoin: str,
    old_score: float,
    new_score: float,
    result: StressScoreResult,
    db_path: Path = DEFAULT_DB_PATH,
) -> None:
    """Trigger delivery to all registered webhooks that match this score update.

    Filters by:
      - stablecoin: if the webhook has a non-empty stablecoin filter, the
        updated stablecoin must be in it.
      - threshold_delta: |new_score - old_score| must meet or exceed the
        webhook's configured minimum delta.

    Fires deliveries concurrently; individual failures don't affect others.

    Args:
        stablecoin: The stablecoin whose score changed.
        old_score: Previous Liquidity Stress Score.
        new_score: Current Liquidity Stress Score.
        result: Full StressScoreResult for the current run.
        db_path: Path to the SQLite database file.
    """
    delta = abs(new_score - old_score)
    sym = stablecoin.upper()

    # Load all registrations
    async with aiosqlite.connect(str(db_path)) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, url, stablecoins, threshold_delta, secret FROM webhooks"
        ) as cursor:
            rows = await cursor.fetchall()

    tasks = []
    for row in rows:
        filter_list: list[str] = json.loads(row["stablecoins"])
        # Empty filter = subscribe to all stablecoins
        if filter_list and sym not in filter_list:
            continue
        if delta < row["threshold_delta"]:
            continue

        payload = _build_payload("score_update", sym, old_score, new_score, result)
        tasks.append(
            _deliver(
                row["url"],
                payload,
                row["secret"],
                row["id"],
                sym,
                db_path,
            )
        )

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _redact_url(url: str) -> str:
    """Return a partially-redacted URL safe for public listing.

    Preserves the scheme and host; replaces the path with "/***.

    Args:
        url: Full webhook URL.

    Returns:
        Redacted URL string, e.g. "https://api.example.com/***".
    """
    try:
        from urllib.parse import urlparse

        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}/***"
    except Exception:
        return "***"
