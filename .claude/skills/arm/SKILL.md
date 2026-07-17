---
name: arm
description: ARM sprint methodology — Acceleration, Resilience, Maturity. Three-phase commercial workstream cadence. Overlay on BizFlow or DevFlow for shipping cycles.
---

# ARM — Acceleration · Resilience · Maturity
## Version 1.0 · Sprint Methodology · Overlay

Three-phase cadence for shipping a workstream from concept to compounding asset.

## The Three Phases

### A — Acceleration
**Goal:** prove the idea works under real conditions, fast.

- Build the smallest end-to-end slice that produces a verifiable output.
- Skip non-blocking polish; ship daily.
- Validate with one real user / one real dataset / one real run before scaling.
- Output: a working demo + one validation signal.

### R — Resilience
**Goal:** make the demo survive contact with reality.

- Add error handling on every external dependency.
- Add observability: structured logs, health endpoint, latency metric.
- Run the system against adversarial inputs; fix what breaks.
- Document the failure modes that remain known-and-accepted.
- Output: a system that recovers from common failures and tells you when it didn't.

### M — Maturity
**Goal:** convert the resilient system into a compounding asset.

- Replace bespoke pieces with reusable modules; extract a library where it pays back.
- Write the runbook so someone else can operate it.
- Add the cost/value metric — what does each run cost, what does each run produce.
- Move from "a thing that works" to "a thing the team relies on."
- Output: a runbook, a metric, a maintainer-other-than-you.

## Activation

```
arm                ← apply sprint discipline
arm B+P+D          ← run a DevFlow build under ARM phasing
kafca arm          ← terse ARM-phased output
arm E              ← evaluate which ARM phase a workstream is in
```

## Phase Transitions (gates)

| Gate | Test |
|------|------|
| A → R | One real output validated against a real user. No more. Stop adding features. |
| R → M | Three weeks of operation with no surprise incident. Failure modes are documented. |
| M → archive | A different person has operated it for a full cycle without you. |

## Why It Works

Most ambitious work dies between "the demo works" and "the team relies on it." Naming the three phases turns the messy middle into a tracked transition with explicit exit criteria.

## Composability

ARM is an overlay. It pairs naturally with KafCa (terse phase reports), RRSS (per-phase quality gates), DevFlow (phase-aware commands), and KafCade (multi-project ARM tracking).
