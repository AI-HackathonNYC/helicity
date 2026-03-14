"""Real-time SSE streaming for live score updates."""

import asyncio
import json
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter(tags=["streaming"])

# ---------------------------------------------------------------------------
# In-memory pub/sub — one asyncio.Queue per connected subscriber.
# publish_score_update() fans out to every queue; each SSE connection drains
# its own queue via score_event_generator().
# ---------------------------------------------------------------------------
score_subscribers: list[asyncio.Queue] = []


async def publish_score_update(update: dict) -> None:
    """Broadcast a score update to all active SSE subscribers.

    Called by the scoring engine after every scoring run.
    update must contain at least: stablecoin, score, level,
    latency_hours, coverage_ratio, timestamp.
    """
    for queue in score_subscribers:
        await queue.put(update)


async def score_event_generator(
    stablecoins: list[str] | None = None,
) -> AsyncGenerator[str, None]:
    """Async generator that yields SSE-formatted score update events.

    Registers a queue, waits for published updates, applies an optional
    per-stablecoin filter, and yields each update as an SSE data line.
    A heartbeat is sent every 30 seconds to keep the connection alive
    through proxies and load balancers.
    """
    queue: asyncio.Queue = asyncio.Queue()
    score_subscribers.append(queue)

    try:
        while True:
            try:
                # Wait for the next update, but time out every 30s for heartbeat
                update = await asyncio.wait_for(queue.get(), timeout=30.0)

                # Apply stablecoin filter if requested
                if stablecoins and update.get("stablecoin") not in stablecoins:
                    continue

                yield f"data: {json.dumps(update)}\n\n"

            except asyncio.TimeoutError:
                # Send a heartbeat so the client knows the connection is alive
                heartbeat = {
                    "type": "heartbeat",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                yield f"data: {json.dumps(heartbeat)}\n\n"

    finally:
        # Always clean up the subscriber queue on disconnect
        if queue in score_subscribers:
            score_subscribers.remove(queue)


@router.get("/api/stream/scores")
async def stream_scores(stablecoins: str | None = None) -> StreamingResponse:
    """SSE endpoint for real-time Liquidity Stress Score updates.

    Opens a persistent connection and streams score events as they are
    computed by the scoring engine.  A heartbeat event is sent every 30
    seconds to keep the connection alive through proxies.

    Query params:
        stablecoins: comma-separated filter, e.g. ?stablecoins=USDC,USDT
                     Omit to receive updates for all tracked stablecoins.

    Event format:
        data: {"stablecoin":"USDC","score":68,"level":"elevated",
               "latency_hours":72,"coverage_ratio":0.88,"timestamp":"..."}

    Heartbeat format:
        data: {"type":"heartbeat","timestamp":"..."}
    """
    coin_list = [c.strip().upper() for c in stablecoins.split(",")] if stablecoins else None
    return StreamingResponse(
        score_event_generator(coin_list),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
