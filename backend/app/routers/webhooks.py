"""Webhook registration and management endpoints.

Allows external systems (DAO governance, risk desks, trading agents) to
register HTTP endpoints that receive signed real-time notifications whenever
a stablecoin's Liquidity Stress Score changes by more than a configured delta.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, HttpUrl

from app.services.webhooks import (
    DEFAULT_DB_PATH,
    _build_payload,
    _deliver,
    delete_webhook,
    get_webhook,
    list_webhooks,
    register_webhook,
)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class RegisterRequest(BaseModel):
    url: str = Field(description="HTTPS endpoint to receive score update notifications")
    stablecoins: list[str] = Field(
        default=[],
        description="Stablecoin filter (e.g. ['USDC', 'USDT']). Empty = all stablecoins.",
    )
    threshold_delta: float = Field(
        default=5.0,
        ge=0.1,
        le=100.0,
        description="Minimum absolute score change required to trigger delivery.",
    )
    secret: str = Field(
        min_length=8,
        description="HMAC-SHA256 signing key. Use this to verify X-Helicity-Signature on delivery.",
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/")
async def create_webhook(body: RegisterRequest):
    """Register a new webhook endpoint for score update notifications.

    Returns the webhook ID and a reminder of how to verify the HMAC signature.
    The secret is stored server-side and never returned after registration.
    """
    from main import envelope

    webhook_id = await register_webhook(
        url=body.url,
        stablecoins=body.stablecoins,
        threshold_delta=body.threshold_delta,
        secret=body.secret,
        db_path=DEFAULT_DB_PATH,
    )

    return envelope(
        data={
            "id": webhook_id,
            "status": "active",
            "url": body.url,
            "stablecoins": [s.upper() for s in body.stablecoins] or ["ALL"],
            "threshold_delta": body.threshold_delta,
            "verification": (
                "Verify deliveries by computing HMAC-SHA256 of the raw JSON body "
                "with your secret and comparing to the X-Helicity-Signature header."
            ),
        }
    )


@router.get("/")
async def get_webhooks():
    """List all registered webhooks. Secrets and full URLs are redacted."""
    from main import envelope

    webhooks = await list_webhooks(db_path=DEFAULT_DB_PATH)
    return envelope(data={"webhooks": webhooks, "count": len(webhooks)})


@router.delete("/{webhook_id}")
async def remove_webhook(webhook_id: str):
    """Unregister a webhook by its ID.

    Returns 404 if the webhook ID is not found.
    """
    from main import envelope

    deleted = await delete_webhook(webhook_id, db_path=DEFAULT_DB_PATH)
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=f"Webhook '{webhook_id}' not found.",
        )
    return envelope(data={"id": webhook_id, "status": "deleted"})


@router.post("/test/{webhook_id}")
async def test_webhook(webhook_id: str):
    """Fire a test notification to verify the registered endpoint is reachable.

    Sends a canned 'score_update.test' payload signed with the webhook's secret.
    Returns the delivery outcome so callers can confirm their endpoint is working.
    """
    from main import envelope

    hook = await get_webhook(webhook_id, db_path=DEFAULT_DB_PATH)
    if hook is None:
        raise HTTPException(
            status_code=404,
            detail=f"Webhook '{webhook_id}' not found.",
        )

    test_payload = _build_payload(
        event="score_update.test",
        stablecoin="USDC",
        previous_score=32.0,
        current_score=68.0,
    )
    test_payload["stress_level"] = "Elevated Stress"
    test_payload["redemption_latency_hours"] = "24-72h"
    test_payload["liquidity_coverage_ratio"] = "85-95%"
    test_payload["note"] = "This is a test notification. No real score change occurred."

    try:
        await _deliver(
            url=hook["url"],
            payload=test_payload,
            secret=hook["secret"],
            webhook_id=webhook_id,
            stablecoin="USDC",
            db_path=DEFAULT_DB_PATH,
        )
        status = "delivered"
    except Exception as exc:
        status = f"failed: {exc}"

    return envelope(
        data={
            "webhook_id": webhook_id,
            "status": status,
            "payload_sent": test_payload,
        }
    )
