"""Extraction API endpoints — XBRL and PDF reserve data parsing."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.extraction import ExtractionService

router = APIRouter(prefix="/api", tags=["extraction"])

# Module-level service instance (shared across requests)
_extraction_service = ExtractionService()


class ExtractRequest(BaseModel):
    content: str
    source_type: str  # "xbrl" or "pdf"


@router.post("/extract")
async def extract_reserve_data(body: ExtractRequest):
    """Parse XBRL or PDF attestation content into structured ReserveData.

    - source_type "xbrl": OCC XBRL filing (primary path, GENIUS Act compliant issuers)
    - source_type "pdf": Unstructured PDF text (fallback for non-compliant issuers)

    Returns the extracted ReserveData in the standard API envelope.
    Extracted data is also persisted to SQLite for subsequent GET /api/reserves calls.
    """
    from main import envelope

    if body.source_type not in ("xbrl", "pdf"):
        raise HTTPException(
            status_code=400,
            detail="source_type must be 'xbrl' or 'pdf'",
        )

    try:
        result = await _extraction_service.extract_reserve_data(
            body.content, body.source_type
        )
        await _extraction_service.store_reserve_data(result, body.source_type)
        return envelope(data=result.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@router.get("/reserves")
async def get_all_reserves():
    """Return all stored reserve data.

    Returns the latest extracted record per stablecoin.
    Falls back to seed fixtures when no extracted data is available.
    """
    from main import envelope

    try:
        results = await _extraction_service.get_all_reserves()
        return envelope(data=[r.model_dump() for r in results])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reserves/{stablecoin}")
async def get_reserve_by_stablecoin(stablecoin: str):
    """Return reserve data for a single stablecoin.

    Returns the latest extracted record, or the seed fixture if no extraction
    has been run for this symbol yet.
    """
    from main import envelope

    result = await _extraction_service.get_reserve_by_stablecoin(stablecoin.upper())
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No reserve data found for {stablecoin.upper()}",
        )
    return envelope(data=result.model_dump())
