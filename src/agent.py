import os
import logging
from anthropic import Anthropic
from .schema import ContractReview
from .prompts import SYSTEM_PROMPT, build_user_prompt
from .scoring import compute_safety_score, letter_grade

logger = logging.getLogger(__name__)

MODEL = "claude-opus-4-8"
MAX_TOKENS = 16000
MAX_PDF_BYTES = 32 * 1024 * 1024  # 32MB decoded


def _anchor_clauses(review: ContractReview, source: str) -> ContractReview:
    """Set char_start/char_end on each KeyClause by exact substring match into source.
    Excerpts not found in source get null offsets and a logged warning."""
    unanchored = 0
    for clause in review.key_clauses:
        idx = source.find(clause.text_excerpt)
        if idx >= 0:
            clause.char_start = idx
            clause.char_end = idx + len(clause.text_excerpt)
        else:
            clause.char_start = None
            clause.char_end = None
            unanchored += 1
    if unanchored:
        logger.warning("%d/%d key clauses had non-verbatim excerpts and could not be anchored",
                       unanchored, len(review.key_clauses))
    return review


def _apply_score(review: ContractReview) -> ContractReview:
    """Set safety_score (0-100) and letter_grade (A-F) from the review's risks.

    Server-owned, deterministic: the model surfaces the risks, the server computes the
    number. See src/scoring.py for the rationale."""
    review.safety_score = compute_safety_score(review.risks)
    review.letter_grade = letter_grade(review.safety_score)
    logger.info("Safety score %d (%s) from %d risk(s)",
                review.safety_score, review.letter_grade, len(review.risks))
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
        return _apply_score(response.parsed_output)
