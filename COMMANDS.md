# Short-command grammar

This repo installs composable Claude Code skills under [`.claude/skills/`](./.claude/skills/)
so terse commands are interpreted consistently — in this session and in any future
session that loads this repo. Source: EvoForge + Claude Skills SDK.

A bare command (single letters, or letters joined by `+`, space, `,`, or `→`) is
parsed as a pipeline and dispatched to the matching skill instead of being read as prose.
Commands are case-insensitive; the separators are equivalent.

## DevFlow commands (`devflow`)

| Cmd | Name | Action |
|-----|------|--------|
| `B` | Build | Implement the next roadmap item or a specified feature |
| `I` | Integrate | Reflect on changes; sync code ↔ docs ↔ state |
| `Im` | Improve | Refactor / optimise / harden — no new features |
| `E` | Evaluate | Audit: quality · security · performance · consistency |
| `C` | Consolidate | Dedupe, remove dead code, reorganise |
| `Bl` | Blueprint | Update `BLUEPRINT.md` (never delete past changelogs) |
| `P` | Push | Staged commit (smart message) + push |
| `D` | Deploy | Deploy to the detected target; confirm live |
| `CI` | Continuous Improve | `I → Im → E → C → Bl → P → D` |

Aliases: `full` = `B+I+Im+E+C+Bl+P+D`. Example: `B+Bl+P+D` runs left-to-right.

## Overlays

- **KafCa** (`kafca`) — token-efficiency mode: **Ka**rpathy code style + **f**ixClaude
  anti-bloat + **Ca**veman communication (no preamble, no filler, minimal code).
  Prefix any command: `kafca E+Im`, `kafca ARM`.
- **RRSS / R²S²** (`rrss`) — quality gates applied to every output: Robust · Reliable ·
  Solid · Stable · Resistant · Scalable · Secure · Systematic.
- **ARM** (`arm`) — Acceleration · Resilience · Maturity sprint cadence (commercial workstreams).

## Workflow & evolution skills

- **KafCade** (`kafcade`) — multi-project DevFlow cascade; spawns a focused subagent per step
  (`kc B`, `kc CI`, `kc full`). KafCa always on.
- **EvoMetaClaw** (`evo-metaclaw`) — evolutionary meta-learning: population dynamics,
  matrix-thinking, circuit breaker, skill injection, memory layer, smart scheduler.
- **EvolvedSkillOpt** — the evolutionary engine, three depths:
  - `evolved-skillopt-v2` — matrix-thinking + circuit-breaker self-evolution
  - `evolved-skillopt-v3-agentic` — matrix-informed subagent spawning & coordination
  - `evolved-skillopt-v4-bio` — diploid/speciation/coevolution + game theory + Dempster-Shafer

## Retroactive decode

The original session command:

> **`KafCa E+Im + Bl. Evolve evo-metaclaw.`**

decodes as: *in terse **KafCa** mode — **E**valuate → **Im**prove → update the **Bl**ueprint,
then **Evolve** the app using **evo-metaclaw** (evolutionary meta-learning, drawing on the
EvoForge/MetaClaw concepts).* That is what shipped in **v0.6.0** (safety scoring, compliance
flags, production hardening, BLUEPRINT update).

## Installed where

- **Project (committed, durable):** `.claude/skills/<name>/SKILL.md` — travels with this repo.
- **User (this environment):** `~/.claude/skills/<name>/SKILL.md` — available to other
  workspaces in the same environment.
- Skill registry/manifest: `.claude/skills/index.json`.

To install into another repo, copy the `.claude/skills/` directory into it (or copy to
`~/.claude/skills/` for a machine that persists the home directory).
