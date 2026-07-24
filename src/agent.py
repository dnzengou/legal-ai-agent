import os
import logging
from anthropic import Anthropic
from .schema import ContractReview
from .prompts import SYSTEM_PROMPT, build_user_prompt
from .scoring import compute_safety_score, letter_grade
from .confidence import compute_overall_confidence, confidence_level, downgrade_unanchored

logger = logging.getLogger(__name__)

MODEL = "claude-opus-4-8"
MAX_TOKENS = 16000
MAX_PDF_BYTES = 32 * 1024 * 1024  # 32MB decoded


def _anchor_excerpt(excerpt: str, source: str) -> tuple[int | None, int | None, bool]:
    """Return (char_start, char_end, anchored) for an excerpt within source by exact substring match."""
    if not excerpt:
        return None, None, False
    idx = source.find(excerpt)
    if idx < 0:
        return None, None, False
    return idx, idx + len(excerpt), True


def _anchor_clauses(review: ContractReview, source: str) -> ContractReview:
    """Anchor every quoted excerpt in the review back to the source by exact substring match.

    Covers KeyClause.text_excerpt AND every Risk.provenance / ComplianceFlag.provenance —
    the anti-hallucination gate. A finding whose excerpt is not present verbatim gets:
      - `provenance.anchored = False` (already the default)
      - `char_start` / `char_end` = None
      - self-reported `confidence` overridden to 'low' (see confidence.downgrade_unanchored)
    so the model cannot invent a citation without the server catching it.

    Source may be empty (PDF path) — in that case every excerpt is left unanchored."""
    # 1) KeyClause excerpts (unchanged behavior)
    unanchored_clauses = 0
    for clause in review.key_clauses:
        cs, ce, ok = _anchor_excerpt(clause.text_excerpt, source)
        clause.char_start, clause.char_end = cs, ce
        if not ok:
            unanchored_clauses += 1
    if unanchored_clauses:
        logger.warning("%d/%d key clauses had non-verbatim excerpts and could not be anchored",
                       unanchored_clauses, len(review.key_clauses))

    # 2) Risk + ComplianceFlag provenance excerpts (anti-hallucination)
    findings = list(review.risks) + list(review.compliance_flags)
    unanchored_findings = 0
    for f in findings:
        if f.provenance is None:
            unanchored_findings += 1
            continue
        cs, ce, ok = _anchor_excerpt(f.provenance.text_excerpt, source)
        f.provenance.char_start = cs
        f.provenance.char_end = ce
        f.provenance.anchored = ok
        if not ok:
            unanchored_findings += 1
    if unanchored_findings and findings:
        logger.warning("%d/%d findings had missing or non-verbatim provenance — confidence downgraded",
                       unanchored_findings, len(findings))
    return review


def _apply_score(review: ContractReview) -> ContractReview:
    """Set the two server-owned scores: safety (from risks) + confidence (from provenance).

    Both are deterministic — the model proposes, the server owns the numbers.
    Confidence is the anti-hallucination signal: it drops the moment any finding
    can't cite the source verbatim."""
    # 1) Safety score (existing)
    review.safety_score = compute_safety_score(review.risks)
    review.letter_grade = letter_grade(review.safety_score)

    # 2) Anti-hallucination gate: downgrade unanchored findings before scoring confidence
    all_findings = list(review.risks) + list(review.compliance_flags)
    downgraded = downgrade_unanchored(all_findings)
    if downgraded:
        logger.warning("Downgraded confidence on %d finding(s) with missing/unanchored provenance", downgraded)

    # 3) Overall confidence + bucketed level
    review.overall_confidence = compute_overall_confidence(all_findings)
    review.confidence_level = confidence_level(review.overall_confidence)

    logger.info(
        "Safety %d (%s) · Confidence %d (%s) from %d risk(s) + %d compliance flag(s), %d downgraded",
        review.safety_score, review.letter_grade,
        review.overall_confidence, review.confidence_level,
        len(review.risks), len(review.compliance_flags), downgraded,
    )
    return review


class LegalAgent:
    def __init__(self, client: Anthropic | None = None):
        self.client = client or Anthropic()

    def review(
        self,
        contract_text: str,
        jurisdiction: str | None = None,
        party_role: str | None = None,
    ) -> ContractReview:
        logger.info("Reviewing text contract (%d chars)", len(contract_text))
        response = self.client.messages.parse(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            thinking={"type": "adaptive"},
            output_config={"effort": "high"},
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": build_user_prompt(contract_text, jurisdiction, party_role)}
            ],
            output_format=ContractReview,
        )
        return _apply_score(_anchor_clauses(response.parsed_output, contract_text))

    def review_pdf(
        self,
        pdf_base64: str,
        jurisdiction: str | None = None,
        party_role: str | None = None,
    ) -> ContractReview:
        # Defensive size check (Pydantic already enforces min, not max — base64 is ~1.37x decoded size)
        approx_decoded = (len(pdf_base64) * 3) // 4
        if approx_decoded > MAX_PDF_BYTES:
            raise ValueError(f"PDF exceeds {MAX_PDF_BYTES // (1024*1024)}MB limit")

        logger.info("Reviewing PDF contract (~%d KB decoded)", approx_decoded // 1024)

        context_parts = []
        if jurisdiction:
            context_parts.append(f"Jurisdiction: {jurisdiction}")
        if party_role:
            context_parts.append(f"Reviewing party role: {party_role}")
        instruction = "\n".join(context_parts)
        if instruction:
            instruction += "\n\n---\n\n"
        instruction += "Review the attached contract PDF."

        response = self.client.messages.parse(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            thinking={"type": "adaptive"},
            output_config={"effort": "high"},
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": "application/pdf",
                                "data": pdf_base64,
                            },
                        },
                        {"type": "text", "text": instruction},
                    ],
                }
            ],
            output_format=ContractReview,
        )
        # PDF path: no plain-text source, so anchoring can't run against a string.
        # We honestly report low confidence for the un-anchored findings by running
        # anchor with an empty source (every provenance stays unanchored) — this is
        # the right signal for the client (they should either extract text first or
        # accept the lower confidence baseline).
        return _apply_score(_anchor_clauses(response.parsed_output, ""))
