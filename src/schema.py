from typing import Literal
from pydantic import BaseModel, Field


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


class ContractReview(BaseModel):
    summary: str = Field(description="2-3 sentence executive summary of the contract")
    parties: list[str] = Field(description="Legal names of all parties")
    effective_date: str | None = Field(default=None, description="ISO date or null if not stated")
    term: str | None = Field(default=None, description="Duration / term description or null")
    key_clauses: list[KeyClause]
    risks: list[Risk]
    recommendations: list[str] = Field(description="Actionable recommendations for the reviewing party")


class ReviewRequest(BaseModel):
    contract_text: str = Field(min_length=50, max_length=500_000)
    jurisdiction: str | None = None
    party_role: str | None = Field(default=None, description="Which party the reviewer represents")


class ReviewPdfRequest(BaseModel):
    pdf_base64: str = Field(min_length=100, description="Base64-encoded PDF, max 32MB decoded")
    jurisdiction: str | None = None
    party_role: str | None = None
