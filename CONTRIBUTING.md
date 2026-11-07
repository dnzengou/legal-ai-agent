# Contributing

Thanks for considering a contribution. This project optimises for subtraction — the shortest code that ships, the fewest abstractions, and the smallest surface that stays correct.

## Before you start

1. **Read [`CLAUDE.md`](./CLAUDE.md)** — it holds the repo conventions, layout, and the DevFlow short-command grammar.
2. **Read [`BLUEPRINT.md`](./BLUEPRINT.md)** — architecture, roadmap, and what is explicitly out of scope.
3. **Read [`POSITIONING.md`](./POSITIONING.md)** — what this tool is and is not relative to adjacent tools.
4. **Search [open issues](https://github.com/dnzengou/legal-ai-agent/issues)** before filing a new one.

## Setup

```bash
git clone https://github.com/dnzengou/legal-ai-agent.git
cd legal-ai-agent
cp .env.example .env         # add your ANTHROPIC_API_KEY
pip install -r requirements-dev.txt
pytest -q                     # 72 tests, no network
uvicorn api.app:app --reload --port 8000
```

## What we accept

- **Bug fixes** with a regression test.
- **Correctness or safety improvements** to the anti-hallucination gate (`src/agent.py`, `src/confidence.py`).
- **New compliance frameworks** in `src/prompts.py` when the contract pattern is common and the status check is well-defined.
- **Deployment recipes** that are zero-config for a mainstream host and don't require a signup wall.
- **Documentation fixes** that improve accuracy. No marketing copy.

## What we typically decline

- New features without a clear anti-hallucination story (how is a fabricated output caught?).
- Dependency additions that don't carry a lot of weight for their install cost.
- Abstractions "in case we need them later."
- Half-finished implementations behind a feature flag.

If you're unsure whether a change fits, open an issue first with a short rationale.

## Style

- **Python:** PEP 8 with 100-char lines. No type stubs for internal functions where the types are obvious.
- **FastAPI:** validate at the boundary (Pydantic), trust internal calls.
- **Tests:** mock the Anthropic client. No test may require network. Aim for tests that prove behaviour, not implementation details.
- **Commits:** imperative mood, lowercase first word, scope prefix when useful (`api:`, `agent:`, `confidence:`). One logical change per commit.

## Pull request checklist

- [ ] `pytest -q` passes locally.
- [ ] New code has a test that would fail without the change.
- [ ] `BLUEPRINT.md` updated if roadmap, API contract, or architecture changed.
- [ ] No secrets, API keys, or personal information in the diff.
- [ ] No new dependencies without a one-line justification in the PR description.

## Security

Never open a public issue for a vulnerability. Use [private vulnerability reporting](https://github.com/dnzengou/legal-ai-agent/security/advisories/new). See [`SECURITY.md`](./SECURITY.md).

## Code of Conduct

By participating you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md). In short: be kind, assume good faith, and keep the technical signal high.

## License

By contributing, you agree your contributions will be licensed under the project's MIT license.
