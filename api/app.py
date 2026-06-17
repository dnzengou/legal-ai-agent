import os
import logging
from fastapi import Depends, FastAPI, HTTPException
from anthropic import APIError, AuthenticationError, RateLimitError, BadRequestError

from api.auth import require_api_key
from src.agent import LegalAgent
from src.schema import ContractReview, ReviewRequest, ReviewPdfRequest

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="legal-ai-agent",
    version="0.1.0",
    description="Contract review API powered by Claude",
)

agent = LegalAgent()


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": "0.1.0"}


@app.post("/review", response_model=ContractReview, dependencies=[Depends(require_api_key)])
def review(req: ReviewRequest) -> ContractReview:
    try:
        return agent.review(req.contract_text, req.jurisdiction, req.party_role)
    except AuthenticationError:
        logger.exception("Anthropic auth failed")
        raise HTTPException(status_code=500, detail="Upstream auth error")
    except RateLimitError:
        raise HTTPException(status_code=429, detail="Rate limited; retry later")
    except BadRequestError as e:
        raise HTTPException(status_code=400, detail=f"Invalid request: {e.message}")
    except APIError as e:
        logger.exception("Anthropic API error")
        raise HTTPException(status_code=502, detail=f"Upstream error: {e.message}")


@app.post("/review-pdf", response_model=ContractReview, dependencies=[Depends(require_api_key)])
def review_pdf(req: ReviewPdfRequest) -> ContractReview:
    try:
        return agent.review_pdf(req.pdf_base64, req.jurisdiction, req.party_role)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except AuthenticationError:
        logger.exception("Anthropic auth failed")
        raise HTTPException(status_code=500, detail="Upstream auth error")
    except RateLimitError:
        raise HTTPException(status_code=429, detail="Rate limited; retry later")
    except BadRequestError as e:
        raise HTTPException(status_code=400, detail=f"Invalid request: {e.message}")
    except APIError as e:
        logger.exception("Anthropic API error")
        raise HTTPException(status_code=502, detail=f"Upstream error: {e.message}")
