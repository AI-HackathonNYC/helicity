"""Unsiloed AI vision extraction client.

Pipeline:
  PDF bytes → Unsiloed AI (table/visual extraction) → structured JSON
                        → Claude (risk signal interpretation) → ReserveData

Unsiloed AI is a hackathon sponsor whose SOTA vision models are purpose-built
for multimodal unstructured → structured conversion.  Their API handles the
heavy visual parsing of PDF tables; Claude then focuses exclusively on semantic
risk interpretation, saving tokens and producing a cleaner extraction story.

API docs:  https://www.unsiloed.ai/
Discord:   https://discord.gg/FrKjCfZx  (obtain API key here)

NOTE: Update _BASE_URL and _EXTRACT_PATH below once you have the actual
      endpoint from their Discord/docs.  Everything else is wired up.
"""

import asyncio
import base64
import os
from typing import Any, Optional

import httpx

# ---------------------------------------------------------------------------
# API config — update these once you have Unsiloed's actual endpoint
# ---------------------------------------------------------------------------
_BASE_URL = os.getenv("UNSILOED_BASE_URL", "https://api.unsiloed.ai/v1")
_EXTRACT_PATH = "/extract"          # POST endpoint for PDF extraction
_TIMEOUT_SECONDS = 60               # Vision models can be slow on large PDFs


class UnsIloedClient:
    """Async HTTP client for the Unsiloed AI document extraction API.

    Handles auth, request building, and raw response parsing.
    All public methods are async-safe and share a single httpx.AsyncClient.
    """

    def __init__(self) -> None:
        self.api_key: Optional[str] = os.getenv("UNSILOED_API_KEY")
        self.available: bool = bool(self.api_key)
        self._client: Optional[httpx.AsyncClient] = None

    # ------------------------------------------------------------------
    # Lifecycle helpers
    # ------------------------------------------------------------------

    def _get_client(self) -> httpx.AsyncClient:
        """Return a lazily-created shared AsyncClient."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=_BASE_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Accept": "application/json",
                },
                timeout=_TIMEOUT_SECONDS,
            )
        return self._client

    async def close(self) -> None:
        """Close the underlying HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ------------------------------------------------------------------
    # Low-level API call
    # ------------------------------------------------------------------

    async def _call_api(self, endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
        """POST to a Unsiloed API endpoint and return the parsed JSON response.

        Raises:
            RuntimeError: if the API key is not set.
            httpx.HTTPStatusError: on non-2xx responses.
        """
        if not self.available:
            raise RuntimeError(
                "UNSILOED_API_KEY is not set — cannot call Unsiloed AI API"
            )

        client = self._get_client()
        response = await client.post(endpoint, json=payload)
        response.raise_for_status()
        return response.json()

    # ------------------------------------------------------------------
    # PDF table extraction
    # ------------------------------------------------------------------

    async def extract_pdf_tables(self, pdf_bytes: bytes) -> dict[str, Any]:
        """Send a PDF to Unsiloed AI and return extracted tables and text.

        Encodes the PDF as base64 and POSTs it to the extraction endpoint.
        The response is expected to contain:
          - "tables": list of table objects (rows, headers, page numbers)
          - "text":   full text content of the document
          - "metadata": document-level metadata (issuer, date, etc.)

        Args:
            pdf_bytes: raw bytes of the PDF file.

        Returns:
            Raw API response dict with at minimum a "tables" key.

        Raises:
            RuntimeError: if UNSILOED_API_KEY is not configured.
            httpx.HTTPStatusError: on API errors.
        """
        encoded = base64.b64encode(pdf_bytes).decode("utf-8")
        payload = {
            "document": encoded,
            "type": "pdf",
            "extract_tables": True,
            "extract_text": True,
        }
        return await self._call_api(_EXTRACT_PATH, payload)

    async def extract_pdf_tables_from_url(self, pdf_url: str) -> dict[str, Any]:
        """Send a PDF URL to Unsiloed AI for extraction (alternative to raw bytes).

        Args:
            pdf_url: publicly accessible URL pointing to the PDF.

        Returns:
            Raw API response dict with at minimum a "tables" key.
        """
        payload = {
            "url": pdf_url,
            "type": "pdf",
            "extract_tables": True,
            "extract_text": True,
        }
        return await self._call_api(_EXTRACT_PATH, payload)
