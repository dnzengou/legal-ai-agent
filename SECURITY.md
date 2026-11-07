# Security Policy

## Supported versions

This project tracks `main`. Security fixes are issued against the latest release and backported to the previous minor only when the fix is non-trivial.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Use GitHub's [private vulnerability reporting](https://github.com/dnzengou/legal-ai-agent/security/advisories/new) — the maintainer is notified privately and can discuss, patch, and coordinate disclosure with you.

### What to include

- A clear description of the issue and its impact.
- Steps to reproduce (minimal example preferred).
- Affected version or commit SHA.
- Your preferred disclosure timeline (we default to 90 days).

### What to expect

- Acknowledgement within 72 hours.
- Fix timeline communicated within 7 days of triage.
- Credit in the release notes if you'd like it (see [Acknowledgments](#acknowledgments)).

## Scope

**In scope:**

- The FastAPI service (`api/`), agent code (`src/`), and example client (`examples/`).
- Container image at `ghcr.io/dnzengou/legal-ai-agent`.
- The landing page at `legal-ai-agent.netlify.app`.

**Out of scope:**

- Third-party services (Anthropic, Netlify, GHCR, Fly.io) — report to the respective vendor.
- Issues requiring access to a user's already-compromised machine.
- Social engineering of the maintainer.
- Rate-limit avoidance via IP rotation (the limiter is best-effort, not a security boundary).

## Hardening already in place

- API key check uses `hmac.compare_digest` (constant-time).
- Per-IP token-bucket rate limiting before auth; `X-Forwarded-For` only trusted when `TRUST_PROXY_HEADERS` is set.
- No persistence — contracts are processed in memory only and discarded after the response.
- **Server-owned truth:** safety score, letter grade, and overall confidence are computed server-side from the model's output; the model cannot inflate them.
- **Provenance anchoring:** every quoted excerpt is verified by exact substring match; findings with fabricated citations are auto-downgraded to low confidence.
- Security headers on every response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy: default-src 'none'`, `Referrer-Policy`.
- Unhandled errors return a generic 500 with no internals, tagged with `X-Request-ID` for log correlation.
- CI builds non-root, multi-arch (ARM64 + AMD64) images with a `/health` HEALTHCHECK probe.
- GZip compression on responses over 500 bytes.
- PDF inputs are size-capped at 32 MB decoded.

## Disclosure policy

We follow a coordinated 90-day disclosure window by default, shortened when a user-facing exploit is already public. Attribution, scope, and timeline are negotiated privately before any public advisory.

## Acknowledgments

We will list security researchers who responsibly disclosed vulnerabilities here, with their permission.

*None yet — be the first.*
