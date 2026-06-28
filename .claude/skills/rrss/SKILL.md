---
name: rrss
description: R-squared S-squared quality discipline — Robust, Reliable, Solid, Stable, Resistant, Scalable, Secure, Systematic. Overlay on any code or design output.
---

# RRSS — R²S² Quality Discipline
## Version 1.0 · Overlay Mode

Every output from RRSS-tagged work must be:

| Principle | Meaning |
|-----------|---------|
| **Robust** | Handles errors gracefully; never crashes silently |
| **Reliable** | Produces consistent, predictable results |
| **Solid** | No half-measures; complete implementations only |
| **Stable** | Does not break existing functionality |
| **Resistant** | Fault-tolerant; degrades gracefully under failure |
| **Scalable** | Code patterns support growth without rewrite |
| **Secure** | No exposed secrets · XSS-safe · CSP-compliant |
| **Systematic** | Follows established project conventions |

## Activation

```
rrss              ← apply discipline overlay
rrss B+P+D        ← run DevFlow pipeline under RRSS checks
rrss E            ← evaluate any artifact against RRSS axes
```

## Quality Gates (per axis)

- **Robust**: every async has try/catch; every external call has timeout; every parser has fallback.
- **Reliable**: same inputs → same outputs; no hidden globals; deterministic where claimed.
- **Solid**: no TODO/FIXME in shipped code; no `pass` stubs; no half-built endpoints.
- **Stable**: regression tests for previously-fixed bugs; semver respected.
- **Resistant**: rate limits enforced; circuit breakers on flaky deps; graceful degradation.
- **Scalable**: no O(n²) where O(n) fits; pagination on lists; no full-table-scan defaults.
- **Secure**: no secrets in source; CSP set; user input escaped; dependencies audited.
- **Systematic**: matches project style guide; passes linter; reuses existing helpers.

## Composability

`rrss` overlays on KafCa, DevFlow, KafCade, EvoMetaClaw without conflict. Order does not matter:

```
kafca rrss B+P+D    ≡    rrss kafca B+P+D
```

## Why It Works

R²S² is the dimension along which engineers tend to under-deliver under time pressure. Naming the eight axes turns implicit standards into explicit gates that the AI assistant checks before declaring "done."
