# The Alk V2 domain engine

The first engine code in the project. It implements the alkalinity domain of
`docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md` under `SHARED_V2_FREEZE_2` /
`ALK_V2_FREEZE_5`, and nothing else.

```bash
# run it against the conformance corpus
python3 tools/conformance/run-conformance.py --engine 'python3 engine/alk-v2-engine.py'

# the negative controls, including the engine arm
python3 tools/conformance/run-mutations.py
```

No dependencies beyond the Python 3 standard library.

---

## What this is not

**It is not a stack selection.** `ROADMAP.md` Phase 1 is unstarted,
`ALK-V2-MODULE-DESIGN.md` still chooses no language, and `DECISIONS.md` records
no stack decision. What exists here is a conformant reference implementation of
the domain, behind the process boundary the conformance harness already
documents: one JSON object per line in, one out. An engine in any other language
that speaks the same protocol is interchangeable with this one, which is the
point of the boundary.

**It is not an application.** There is no persistence, no user interface, no
scheduler and no notification. `alk.assess` in `ALK-V2-MODULE-DESIGN.md` §2 — the
impure orchestration that loads a ledger and stores a result — does not exist
either. What exists is the pure pipeline it would call.

---

## The one law

```text
adapter.py          reads one document at startup; speaks the wire protocol
   |  calls inward only
   v
engine.py           the pure pipeline: assess(events, configurationHistory, asOf)
   |
   v
everything else     pure, total, no I/O, no clock, no randomness, no globals
```

`catalogue.py` and `adapter.py` are the only modules that touch anything outside
their arguments, and between them they do exactly two impure things: read the
frozen reason-code catalogue, and read and write the standard streams.

Every other module is pure and total. Same arguments, same result; no exception
used for control flow — a refusal is a returned `Computed.NotRun` or
`Computed.Withheld`, never a raised error. That is what makes canon §64's replay
contract achievable: replay is calling `assess` again.

## Layer map

| Module | Layer | Owns |
|---|---|---|
| `constants.py` | — | every numeric constant the domain may use, each with the canon rule that owns it |
| `kernel.py` | shared | instants, elapsed time, median/MAD/Theil-Sen/Sxx, exact-decimal comparison, `Computed<T>` |
| `ledger.py` | L1 | the totally ordered event ledger; the configuration effective at `asOf` |
| `observation.py` | L2 | testing episodes, their pooled clusters, independent selection, position |
| `trajectory.py` | L4 | trend, uncertainty, supported slope, movement evidence, rapid, forecast |
| `dosing.py` | L5/L7 | delivery basis, consumption, the maintenance pipeline |
| `intervention.py` | L6 | the lifecycle around a dose change, and the immutable prediction snapshot |
| `potency.py` | L5 | theoretical potency, observation, plausibility, pool, confidence ladder |
| `response.py` | L6 | the three gates and the six deterministic response classes |
| `retest.py` | L7 | the single retest scheduler |
| `capability.py` | L7 | `M-1` … `M-13` |
| `engine.py` | L8 | the pipeline in `ALK-V2-IMPLEMENTATION-CONTRACT.md` §4's order, and result assembly |

`kernel.stats` holds **no chemistry**: `median` does not know what a dKH is.
Part II §65 forbids importing an alkalinity constant into a future calcium
calculation, and an estimator that never saw one cannot leak one.

`trajectory.supported_slope` is three lines and has its own function because
`S_supported` must never be reachable from the forecast or the consumption
estimate (`INV-B2`). Physical separation makes the prohibition checkable by
reading the imports rather than by remembering it.

## Dependency direction, and why stage two can move

```text
stage one  (trend, uncertainty, support, consumption, maintenance, retest)
     ^
     |  reads
stage two  (potency)  ---- reads ---->  intervention
     ^                                      ^
     |  reads                               |  reads
stage three (response)  ----------------------
```

Nothing in stage one imports `potency` or `response`. The potency learner reads
stage one's output and produces an estimate; it never reaches back into trend or
consumption. So if a potency figure looks wrong, the trend that fed it is
already pinned by stage one's own fixtures, and the two layers stay separable —
which is the whole reason the stages were built in this order.

## What is deliberately unbuilt

Each of these presents as the canon's stated `NOT_RUN` / `WITHHELD` / `NONE`
with a reason code. None of them returns a plausible number.

| Unbuilt | How it presents |
|---|---|
| safety-return **sizing** (`A39`, `A40`) | the outer-bound **state** is classified and reported; `temporarySafetyRateRecommendationMlPerDay` and `safetyCorrectionVolumeMl` are `NOT_RUN` and named |
| return **plans** (`A44`) | `returnPlan` is `NONE`; the offer's *eligibility* is computed, because `ALK-049` P1 makes it an outcome of the ordinary path |
| correction plans, episode resolution beyond these paths | no event of that kind is read; unread kinds are reported |
| the empirical potency **promotion** | `CAPABILITY_GATED`: the learner observes and reports, and `selectedPotency` stays on the configured figure |
| `REASSESSING` detection | `NOT_RUN` — canon defines entry against an object `OI-POTENCYSNAP-001` says is undefined, and defines no exit at all |
| `T_detect` and the return-plan arrival cadence | canonically `NOT_RUN`; reported in `candidatesNotRun[]` |
| `READING_SERIES` expansion | not read. `OD-014` records that its expansion has no owner and says in terms not to write a fourth expander |

## Reading the source

Every module's docstring states the canon rule it implements and, where the rule
was ambiguous, the open issue it declined to settle. Where a comment explains why
something is *not* done a particular way, that is usually because doing it the
other way was tried somewhere and produced a wrong number; the comment is the
record, not decoration.
