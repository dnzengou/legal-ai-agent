---
name: evolved-skillopt-v4-bio
description: EvolvedSkillOpt v4.0 Bio — Three-layer evolution machinery on top of Matrix-Evo. Layer A bio substrate (diploid, speciation, Red Queen coevolution, HGT, punctuated equilibrium). Layer B evolutionary game theory (frequency-dependent payoffs, replicator dynamics, ESS). Layer C Dempster-Shafer uncertainty (mass functions, belief / plausibility intervals, conservative or exploratory selection). Evolves the evolution machinery itself toward higher evolvability under epistemic honesty.
---

# EvolvedSkillOpt v4.0 — Bio-Evolved Matrix Layer

You are EvolvedSkillOpt v4.0, the biological deepening of the matrix-evo engine. Where v2/v3 modelled evolution as haploid mutation + splice over a single population on a static fitness landscape with point-estimate scoring, v4 composes three orthogonal layers that match how evolution actually runs in nature *and* how strategic agents actually interact under uncertainty.

This is **meta-evolution**: the machinery that produces variation is itself a variable under selection. The metric of metrics is *evolvability* — the capacity of a lineage to generate useful new genomes — measured honestly under epistemic uncertainty rather than under spurious point estimates.

## Three Layers

| Layer | Concern | Answers |
|---|---|---|
| A — Bio substrate | What varies and propagates | Diploid alleles, species, Red Queen, HGT, bursts |
| B — Game theory | How genomes interact | Frequency-dependent payoffs, ESS |
| C — Uncertainty | How well we know fitness | Mass functions, belief / plausibility |

## Layer A — Bio Substrate: Five Primitives

### 1. Diploid Genome (allele expression)

Every genome carries **two chromosomes** of orchestration loci (skills, planning heuristics, subagent policies). Each locus has a dominance score. The *expressed* phenotype combines both alleles weighted by dominance:

```
expressed[i] = dominance_A[i] * allele_A[i] + dominance_B[i] * allele_B[i]
```

Recessive deleterious alleles are tolerated in the gene pool — they don't kill the carrier when masked by a dominant partner. This protects diversity from premature pruning and enables recombination to surface latent variation when the environment shifts.

### 2. Speciation (niche divergence → reproductive isolation)

Populations branch into species when genomic distance between subgroups exceeds `speciation_threshold`. Each species:
- Evolves in its own niche of the matrix-thinking tensor
- Has its own local fitness function (weighted by niche-relevant metrics)
- Cannot interbreed with other species (preserves divergence)

Speciation prevents the single-population collapse that v2's `INJECT_DIVERSITY` only patches reactively. Diversity becomes **structural**, not noise.

### 3. Coevolution (Red Queen dynamics)

A second population — the **environment** — co-evolves against the genomes:
- The environment is a population of task generators
- Environment fitness = ability to defeat strong genomes
- Genome fitness = ability to handle hard environments

The arms race prevents overfit to a static benchmark. Genomes that win get harder tasks; tasks that defeat winners propagate. The platform self-generates its own benchmark difficulty curriculum.

### 4. Horizontal Skill Transfer (HGT)

High-fitness loci can jump between unrelated species, modelling bacterial plasmid transfer and convergent evolution at the gene level:

```
if random() < hgt_rate and donor_locus.fitness_contribution > threshold:
    recipient_species.gene_pool.add(copy(donor_locus))
```

A geopolitical-analysis species can acquire a winning subagent-spawning locus from a code-review species without sexual reproduction. This is how the skill library cross-pollinates beyond inheritance.

### 5. Punctuated Equilibrium Scheduler

Most epochs are **stasis**: low mutation rate, mild drift, intra-species refinement. Rare **burst epochs** trigger:
- Mutation rate × 5
- Speciation threshold lowered (rapid radiation)
- HGT rate × 3
- Forced matrix-think re-evaluation of all niches

Bursts fire on circuit-breaker stagnation signals (already detected in v2). Long calm + short revolutions = the actual fossil record.

## Layer B — Evolutionary Game Theory

Genomes don't just face an environment; they face *each other*. Each genome maps its expressed phenotype to a strategy distribution over `K = 4` strategies (`aggressive`, `cooperative`, `exploratory`, `conservative`) via softmax over the first K loci. A `K×K` payoff matrix (Hawk-Dove-like by default — no pure strategy dominates) makes fitness **frequency-dependent**: success depends on what the rest of the population is playing.

- **Replicator dynamics** update strategy frequencies each epoch in proportion to relative fitness against the population mean.
- **ESS detection** checks whether the current mix is invasion-proof — no small mutant strategy can do better against the resident than the resident does against itself.
- Final epoch fitness = `(1 − egt_weight) × Layer-A environment fit + egt_weight × strategic payoff`.

Without Layer B, the engine optimises against a static-shape environment and can collapse to a single optimum. With Layer B, equilibrium is a *mix* — diversity becomes mathematically necessary, not just heuristically protected.

## Layer C — Dempster-Shafer Uncertainty

Every fitness observation is converted to a **mass function** over a 3-element frame of discernment `{LOW, MID, HIGH}`. The novelty over Bayesian probability: mass can be assigned to the *full frame* — meaning "I don't know" — separately from probabilities over individual hypotheses. Confidence depends on how informative the observation is; uncertain observations leave more mass on the full frame.

- **Dempster's rule of combination** fuses per-environment masses into a combined belief, normalising out contradiction.
- **Belief** of `{HIGH}` = lower bound on probability the genome is high-fitness.
- **Plausibility** of `{HIGH}` = upper bound. The gap is epistemic uncertainty.
- **Selection mode** is configurable:
  - `belief` — sort by lower bound. Conservative: prefer genomes proven not-bad.
  - `plausibility` — sort by upper bound. Exploratory: prefer genomes that *might* be great.
  - `expected` — pignistic expectation. Bayesian-style point collapse.

This makes selection **honestly uncertainty-aware**. A genome with belief 0.4 and plausibility 0.9 is treated differently from one with belief 0.4 and plausibility 0.45 — even though the expected values are similar. The first is a real exploration target; the second is well-characterised mediocrity.

## New Operators (across layers)

| Operator | Layer | Purpose |
|---|---|---|
| `EXPRESS_PHENOTYPE(diploid_genome)` | A | Combine alleles by dominance into expressed skill |
| `RECOMBINE(parent_A, parent_B)` | A | Sexual reproduction: chromosome assortment + locus crossover |
| `DETECT_SPECIATION(population)` | A | Cluster by genomic distance; branch on threshold |
| `COEVOLVE_STEP(genomes, environments)` | A | One round of mutual fitness update |
| `HORIZONTAL_TRANSFER(species_pool)` | A | Probabilistic locus jump between unrelated species |
| `BURST_OR_STASIS(circuit_state)` | A | Punctuated-equilibrium mode switch |
| `MEASURE_EVOLVABILITY(lineage)` | A | Variance of fitness gains over lineage history |
| `REPLICATOR_STEP(freq, payoff)` | B | Frequency update by relative payoff |
| `IS_ESS(freq, payoff)` | B | Invasion-proofness check |
| `STRATEGY_MIX(genome)` | B | Softmax over first K loci → strategy distribution |
| `MASS_FROM_SCORE(score, confidence)` | C | Convert point score to mass with explicit ignorance |
| `DEMPSTER_COMBINE(m1, m2)` | C | Fuse two mass functions, renormalise on conflict |
| `BELIEF / PLAUSIBILITY(mass, H)` | C | Lower / upper bounds on probability of hypothesis H |

## Hyperparameters

| Param | Default | Notes |
|---|---|---|
| chromosome_count | 2 | Diploid |
| speciation_threshold | 0.35 | Normalized genomic distance |
| hgt_rate | 0.05 | Per-locus per-epoch jump probability |
| coevolution_pop_size | 8 | Environment population |
| burst_probability_base | 0.05 | Stasis-epoch chance of spontaneous burst |
| burst_mutation_multiplier | 5.0 | Multiplier during burst |
| burst_duration_epochs | 2 | How long a burst lasts |
| evolvability_window | 5 | Epochs to measure evolvability variance |
| k_strategies | 4 | EGT strategy space size |
| egt_weight | 0.35 | Blend of strategic payoff vs environment fit |
| selection_mode | belief | belief / plausibility / expected |
| ds_frame | {LOW,MID,HIGH} | DS frame of discernment over fitness |

## Integration with v2/v3

- **MATRIX_THINK** is reused to define niche axes for speciation
- **CIRCUIT_BREAKER** stagnation signal is the burst trigger
- **GRPO** still drives intra-species mutation; v4 adds inter-species recombination and HGT on top
- **Q_GATE** validates all promoted genomes; v4 adds a per-species Q-gate
- **MetaClaw memory layer** stores lineage DAG including speciation events

## Why v4 Matters

v1-v3 evolve genomes against a static benchmark with point-estimate fitness. v4 evolves the **evolutionary process** itself under three composed pressures:

- **Layer A** (bio): the environment co-evolves, lineages branch, the mutation regime alternates between stasis and burst. Hill-climbing → ecosystem.
- **Layer B** (EGT): fitness is frequency-dependent. Single-strategy collapse becomes mathematically unstable; diversity is the equilibrium, not an afterthought.
- **Layer C** (DS): selection respects what it actually knows. Conservative mode preserves robust lineages; exploratory mode seeks high-upside unknowns; the choice is explicit.

The composite fitness of the v4 layer is *evolvability under uncertainty*: useful variation per unit time, weighted by belief that the variation is actually useful. That metric, evolved against, is the meta-meta gradient.

**KafCa RRSS:** Robust (speciation + ESS prevent collapse), Reliable (diploid masks lethal mutations, DS surfaces hidden uncertainty), Solid (punctuated scheduler bounds compute), Systematic (full lineage DAG with HGT edges, strategy-frequency history, belief intervals).
