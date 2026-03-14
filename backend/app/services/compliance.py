"""GENIUS Act compliance checking service.

Validates a stablecoin issuer's reserve report against the 7 core requirements
of the GENIUS Act (Jul 2025), which mandates standardized reserve disclosure for
all Permitted Payment Stablecoin Issuers (PPSIs).

Usage:
    from app.services.compliance import check_compliance
    result = await check_compliance(reserve_data)
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.reserve import ReserveData

# ---------------------------------------------------------------------------
# GENIUS Act requirement registry
# ---------------------------------------------------------------------------
GENIUS_ACT_REQUIREMENTS: dict[str, str] = {
    "xbrl_format": "Reserve report must be in XBRL format (not PDF-only)",
    "update_frequency": "Reports must be updated at least monthly",
    "asset_disclosure": "Each reserve asset class must be disclosed individually",
    "custodian_disclosure": "All custodian banks must be named with percentages",
    "maturity_disclosure": "Weighted average maturity must be reported",
    "liquidity_coverage": "Liquid assets must cover at least 100% of outstanding tokens",
    "audit_attestation": "Independent auditor attestation required quarterly",
}

# Liquid asset classes for the liquidity coverage check
_LIQUID_ASSET_CLASSES = {"t_bills", "money_market", "mmf", "demand_deposits", "repo"}


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ComplianceCheck(BaseModel):
    requirement: str
    description: str
    passed: bool
    details: str


class ComplianceResult(BaseModel):
    score: float  # 0–100 — percentage of requirements met
    compliant: bool  # True only if all 7 requirements pass
    checks: list[ComplianceCheck]
    recommendations: list[str]  # Actionable fix list for non-compliant items


# ---------------------------------------------------------------------------
# Per-requirement evaluation logic
# ---------------------------------------------------------------------------

def evaluate_requirement(req_id: str, reserve: ReserveData) -> bool:
    """Return True if the reserve data satisfies the given GENIUS Act requirement."""

    if req_id == "xbrl_format":
        return reserve.data_source == "genius_act_attestation"

    if req_id == "update_frequency":
        try:
            report_dt = datetime.strptime(reserve.report_date, "%Y-%m-%d")
            days_old = (datetime.now() - report_dt).days
            return days_old <= 31
        except ValueError:
            return False

    if req_id == "asset_disclosure":
        # Every counterparty must have a non-empty, non-"mixed" asset class
        if not reserve.counterparties:
            return False
        return all(
            cp.asset_class and cp.asset_class.lower() not in ("mixed", "unknown", "other")
            for cp in reserve.counterparties
        )

    if req_id == "custodian_disclosure":
        # Every counterparty must have a real bank name and a positive percentage
        if not reserve.counterparties:
            return False
        opaque_names = {"undisclosed", "unknown", "other", "n/a", ""}
        return all(
            cp.bank_name.lower().strip() not in opaque_names and cp.percentage > 0
            for cp in reserve.counterparties
        )

    if req_id == "maturity_disclosure":
        return (
            reserve.weighted_avg_maturity_days is not None
            and reserve.weighted_avg_maturity_days > 0
        )

    if req_id == "liquidity_coverage":
        # Liquid % = sum of percentages for liquid asset classes
        liquid_pct = sum(
            cp.percentage
            for cp in reserve.counterparties
            if cp.asset_class and cp.asset_class.lower() in _LIQUID_ASSET_CLASSES
        )
        return liquid_pct >= 100.0

    if req_id == "audit_attestation":
        # GENIUS Act source implies certified accounting firm attestation
        return reserve.data_source == "genius_act_attestation"

    return False


def get_details(req_id: str, reserve: ReserveData, passed: bool) -> str:
    """Return a human-readable explanation of why a check passed or failed."""

    if req_id == "xbrl_format":
        if passed:
            return "Data source is 'genius_act_attestation' — XBRL/OCC feed confirmed."
        return f"Data source is '{reserve.data_source}'. GENIUS Act requires XBRL-formatted OCC API feed."

    if req_id == "update_frequency":
        try:
            report_dt = datetime.strptime(reserve.report_date, "%Y-%m-%d")
            days_old = (datetime.now() - report_dt).days
            if passed:
                return f"Report dated {reserve.report_date} is {days_old} days old — within 31-day limit."
            return f"Report dated {reserve.report_date} is {days_old} days old — exceeds 31-day monthly update requirement."
        except ValueError:
            return f"Could not parse report_date '{reserve.report_date}' — must be YYYY-MM-DD."

    if req_id == "asset_disclosure":
        opaque = [
            cp.bank_name for cp in reserve.counterparties
            if not cp.asset_class or cp.asset_class.lower() in ("mixed", "unknown", "other")
        ]
        if passed:
            return f"All {len(reserve.counterparties)} counterparties have individually disclosed asset classes."
        return f"{len(opaque)} counterparties have undisclosed or mixed asset classes: {', '.join(opaque[:3])}."

    if req_id == "custodian_disclosure":
        opaque_names = {"undisclosed", "unknown", "other", "n/a", ""}
        opaque = [
            cp.bank_name for cp in reserve.counterparties
            if cp.bank_name.lower().strip() in opaque_names or cp.percentage <= 0
        ]
        if passed:
            return f"All {len(reserve.counterparties)} custodians named with positive reserve percentages."
        return f"{len(opaque)} counterparties lack proper custodian disclosure: {', '.join(opaque[:3])}."

    if req_id == "maturity_disclosure":
        wam = reserve.weighted_avg_maturity_days
        if passed:
            return f"WAM reported as {wam} days."
        return "weighted_avg_maturity_days is missing or zero — GENIUS Act requires WAM disclosure."

    if req_id == "liquidity_coverage":
        liquid_pct = sum(
            cp.percentage
            for cp in reserve.counterparties
            if cp.asset_class and cp.asset_class.lower() in _LIQUID_ASSET_CLASSES
        )
        if passed:
            return f"Liquid assets cover {liquid_pct:.1f}% of reserves — meets 100% floor."
        illiquid = [
            f"{cp.bank_name} ({cp.asset_class}, {cp.percentage}%)"
            for cp in reserve.counterparties
            if cp.asset_class and cp.asset_class.lower() not in _LIQUID_ASSET_CLASSES
        ]
        return (
            f"Only {liquid_pct:.1f}% in liquid assets. "
            f"Illiquid positions: {', '.join(illiquid[:3])}."
        )

    if req_id == "audit_attestation":
        if passed:
            return "GENIUS Act attestation source confirms independent auditor certification."
        return (
            f"Data source '{reserve.data_source}' does not confirm auditor attestation. "
            "GENIUS Act requires quarterly independent audit."
        )

    return "Unknown requirement."
