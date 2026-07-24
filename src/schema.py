from typing import Literal
from pydantic import BaseModel, Field


Confidence = Literal["high", "medium", "low"]


class Provenance(BaseModel):
    """A verbatim excerpt from the source that justifies a finding.

    Anti-hallucination invariant: the server anchors `text_excerpt` back to the
    source by exact substring match. If the excerpt is not present verbatim,
    `anchored` is False and the server treats the finding as low-confidence —
    the model cannot invent a citation without being caught."""

    text_excerpt: str = Field(
        description="Verbatim excerpt from the source that justifies this finding. Max 500 chars. Must be present character-for-character in the source or the finding is downgraded to low confidence.",
        max_length=500,
    )
    char_start: int | None = Field(default=None, description="Server-filled: start offset in source; null if not anchored or if PDF input.")
    char_end: int | None = Field(default=None, description="Server-filled: end offset in source; null if not anchored or if PDF input.")
    anchored: bool = Field(default=False, description="Server-filled: True if text_excerpt was found verbatim in the source.")


class KeyClause(BaseModel):
    type: str = Field(description="Clause type, e.g. 'termination', 'indemnification', 'limitation_of_liability'")
    summary: str = Field(description="Plain-English summary of the clause")
    text_excerpt: str = Field(description="Verbatim excerpt from the contract, max 500 chars")
    char_start: int | None = Field(default=None, description="Server-filled: start offset of text_excerpt in source contract (null for PDFs or non-verbatim quotes)")
    char_end: int | None = Field(default=None, description="Server-filled: end offset of text_excerpt in source contract")


class Risk(BaseModel):
    severity: Literal["low", "medium", "high"]
    category: str = Field(description="Risk category, e.g. 'unlimited_liability', 'auto_renewal', 'ip_assignment'")
    description: str = Field(description="What the risk is and why it matters")
    clause_ref: str = Field(description="Reference to the source clause (section number or heading)")
    provenance: Provenance | None = Field(
        default=None,
        description="Required for anti-hallucination: verbatim excerpt from source that justifies this risk.",
    )
    confidence: Confidence | None = Field(
        default=None,
        description="Model self-report: 'high' if explicitly stated in source, 'medium' if reasonable interpretation, 'low' if inferred. The server downgrades to 'low' if provenance did not anchor.",
    )


class ComplianceFlag(BaseModel):
    framework: str = Field(description="Regulatory framework, e.g. 'GDPR', 'CCPA', 'HIPAA', 'PCI-DSS', 'SOC2'")
    status: Literal["compliant", "gap", "not_applicable", "unclear"] = Field(
        description="Whether the contract satisfies, gaps, or does not implicate this framework"
    )
    note: str = Field(description="What was found (or missing) and why it matters for this framework")
    provenance: Provenance | None = Field(
        default=None,
        description="Verbatim excerpt from source that supports the framework assessment. Optional for 'not_applicable' status.",
    )
    confidence: Confidence | None = Field(
        default=None,
        description="Model self-report; server downgrades to 'low' if provenance did not anchor.",
    )


class ContractReview(BaseModel):
    summary: str = Field(description="2-3 sentence executive summary of the contract")
    parties: list[str] = Field(description="Legal names of all parties")
    effective_date: str | None = Field(default=None, description="ISO date or null if not stated")
    term: str | None = Field(default=None, description="Duration / term description or null")
    key_clauses: list[KeyClause]
    risks: list[Risk]
    compliance_flags: list[ComplianceFlag] = Field(
        default_factory=list,
        description="Regulatory compliance assessment across frameworks implicated by the contract",
    )
    recommendations: list[str] = Field(description="Actionable recommendations for the reviewing party")
    safety_score: int | None = Field(
        default=None,
        description="Server-filled: 0-100 safety score computed from risks (null in model output; the server sets it)",
    )
    letter_grade: str | None = Field(
        default=None,
        description="Server-filled: A-F grade derived from safety_score (null in model output; the server sets it)",
    )
    overall_confidence: int | None = Field(
        default=None,
        description="Server-filled: 0-100 confidence score derived from per-finding anchoring + self-reported confidence. High = every finding is verbatim-cited to source.",
    )
    confidence_level: Literal["high", "medium", "low"] | None = Field(
        default=None,
        description="Server-filled: bucketed from overall_confidence (>=80 high, >=60 medium, else low).",
    )


class ReviewRequest(BaseModel):
    contract_text: str = Field(min_length=50, max_length=500_000)
    jurisdiction: str | None = None
    party_role: str | None = Field(default=None, description="Which party the reviewer represents")


class ReviewPdfRequest(BaseModel):
    pdf_base64: str = Field(min_length=100, description="Base64-encoded PDF, max 32MB decoded")
    jurisdiction: str | None = None
    party_role: str | None = None
