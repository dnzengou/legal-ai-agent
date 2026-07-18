import os
import time
import uuid
import logging
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from anthropic import APIError, AuthenticationError, RateLimitError, BadRequestError

from api.auth import require_api_key
from api.rate_limit import rate_limit
from src.agent import LegalAgent
from src.schema import ContractReview, ReviewRequest, ReviewPdfRequest

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

VERSION = "0.7.2"

app = FastAPI(
    title="legal-ai-agent",
    version=VERSION,
    description="Contract review API powered by Claude — clauses, risk flags, safety score, and compliance.",
)

# Compress large JSON responses (reviews can be sizable).
app.add_middleware(GZipMiddleware, minimum_size=1024)

_cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
if _cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "X-API-Key"],
        allow_credentials=False,
        max_age=600,
    )
    logger.info("CORS enabled for %d origin(s)", len(_cors_origins))

# Conservative security headers for a JSON API (no HTML, so CSP stays minimal).
_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
}


@app.middleware("http")
async def observability(request: Request, call_next):
    """Attach a request id, log method/path/status/latency, and stamp security headers.

    The request id is read from an inbound X-Request-ID (so a proxy's id is honored)
    or generated, and echoed back on the response for client-side correlation."""
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    request.state.request_id = request_id  # so the exception handler can echo it on 500s
    start = time.monotonic()
    try:
        response = await call_next(request)
    except Exception:
        # Unhandled errors are turned into a sanitized 500 by the handler below;
        # log here so the request id is associated with the failure.
        elapsed_ms = (time.monotonic() - start) * 1000
        logger.exception("rid=%s %s %s -> 500 (%.1fms)",
                         request_id, request.method, request.url.path, elapsed_ms)
        raise
    elapsed_ms = (time.monotonic() - start) * 1000
    logger.info("rid=%s %s %s -> %d (%.1fms)",
                request_id, request.method, request.url.path, response.status_code, elapsed_ms)
    response.headers["X-Request-ID"] = request_id
    for name, value in _SECURITY_HEADERS.items():
        response.headers.setdefault(name, value)
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Never leak internals: every unhandled error becomes a generic 500.

    Echo the request id (set by the observability middleware) so the sanitized
    response still correlates to the logged stack trace."""
    request_id = getattr(request.state, "request_id", None)
    logger.exception("rid=%s Unhandled error on %s %s", request_id, request.method, request.url.path)
    headers = {"X-Request-ID": request_id} if request_id else None
    return JSONResponse(status_code=500, content={"detail": "Internal server error"}, headers=headers)


agent = LegalAgent()


@app.get("/")
def root() -> dict:
    return {
        "name": "legal-ai-agent",
        "version": VERSION,
        "docs": "/docs",
        "endpoints": ["/health", "/review", "/review-pdf"],
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": VERSION}


@app.post("/review", response_model=ContractReview, dependencies=[Depends(rate_limit), Depends(require_api_key)])
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


@app.post("/review-pdf", response_model=ContractReview, dependencies=[Depends(rate_limit), Depends(require_api_key)])
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
