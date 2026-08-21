# 2026-08-21 — The first engine: the alkalinity normal path

Run type: attended application work under `/implement`. **Not canon-changing** —
no rule, threshold, band edge or equation was added, removed or altered.

Branch: `claude/alkalinity-engine-normal-path-ue1lee` · Base commit: `d21acc8`

This is the first engine code in the project. Everything before it was
documents, fixtures and a harness with nothing to run against.

---

## What was built

Three stages, in order, each reported complete before the next began.

1. **Stage one** — readings in, through testing episodes, position, segment,
   independent selection, trend, uncertainty, supported trajectory, consumption
   and the `ALK-049` maintenance pipeline, to a retest date and a structured
   result with reason codes. Configured potency only.
2. **Stage two** — the potency learner (`ALK-016`…`ALK-020`), which remains
   `CAPABILITY_GATED` as canon states. It observes and reports; it never
   promotes, and `selectedPotency` stays on the configured figure.
3. **Stage three** — the response classifier
   (`ALK-RESPONSE-CLASSIFIER-001`), its three gates, its six classes and the
   immutable prediction snapshot captured at the moment of a dose change.

Two owner decisions were encoded first, before any engine code: `DEC-021`
(closing `OD-008` — the default assessment instant) and `DEC-022` (closing
`OD-012` — the retest vocabulary the five converted retest fixtures need).

---

## The reviews

`test-engineer`, then `normal-operation-reviewer`, then `jake` over both.
`breaker` was deliberately not run.

`normal-operation-reviewer` holds `Read`/`Grep`/`Glob` only, so all eleven of
its findings were hand-traces and it asked for them to be executed. Every one
was executed against the real engine and **every one was confirmed**. That is
the first time the reviewer's hand-trace has been checked against real engine
output, which is what it was built for.

`jake` triaged both sets against `PRODUCT-REVIEW-CRITERIA.md`: 20 BUG (15 about
the engine's answers, 5 about the harness's ability to prove them), 2 EDGE
CASE, 1 ALREADY COVERED, and five items raised for the owner rather than
classified.

---

## The one implementation-fix pass

Applied in `jake`'s ranked order. Each was verified against real engine output
before and after.

| # | Finding | What was wrong | What it does now |
|---|---|---|---|
| 1 | F1 | The confounder scan read the **whole** ledger with no lower bound and no upper bound at `asOf`, so one unmeasured water change made `movementEvidence: CONFOUNDED` permanent. | `A7`'s boundary sources cut the segment; the confounder scan reads only `(segmentStart, asOf]`. |
| 2 | F5 | `ALK-033` known-input normalization was not implemented, so a **measured** water change was read as tank movement — the engine told a keeper to cut their dose on a tank whose consumption never changed. | The known step is computed and removed from the analytical series when material; a sub-floor step is retained; an un-computable one falls to the unknown branch. |
| 3 | §2b | A reading the ledger could not parse was deleted from the assessment in silence. | Each is reported as its catalogued validation refusal; unread event kinds are named. |
| 4 | §2e | Per-entity reason codes were collapsed to the first entity — six resolved episodes produced one `EPISODE_RESOLVED` carrying episode 1. | Only genuine umbrella codes merge; per-entity codes repeat once per entity. |
| 5 | F3 | The insufficiency umbrella fired on a fully-evidenced tank, listing eleven internal dotted paths including `capabilities[1].outcome`. | `capabilities[]` and `reasonCodes[]` are out of the sweep (neither is an output); the HOLD path states its own delta, effect and predicted post slope. Eleven entries became four, all declared debt. |
| 6 | F2 | Short or confounded **trend** evidence emitted `CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE`, a `REFUSAL` meaning "dose state unknown or missing", to keepers whose dosing record was complete. | The evidence gate that established the cause names `consumption` among the outputs it withholds. One owner, true wording. |
| 7 | F4 | Five call sites hard-coded `nextUsefulTestAt = asOf` while `retest.recommendedAt` said something else. | Every one is filled from the scheduler's decision. `X-INV-004` gives it sole ownership. |
| 8 | F7 | Any `DOSE_STATE` inside the window declared the interval **mixed**, withholding consumption on the commonest first-run ledger there is. | Mixed means the delivered **rate** changed, not that a rate was stated. |
| 9 | F6 | `POST_CHANGE_FIRST` and `POST_CHANGE_SECOND` were implemented in the scheduler and never submitted. | Both are submitted from the latest confirmed dose change inside the attribution horizon. |
| 10 | F10, §2g, F11, episode-UTC | Empty `holdReasons[]`; the 14-day cap blamed for a dose-change trim; `sigmaS` published under the name `pairwiseSlopeMad`; a multi-member episode's instant re-spelled to UTC. | Each corrected. |
| 12 | §3 | The advisory boundary was built and compared in binary64 where `ALK-DECIMAL-THRESHOLD-001` names it as one of five exact-decimal predicates: `8.2 − 1.0` is `7.199999999999999`, so a reading of exactly `7.2` failed to raise the warning. | Both the construction and both comparisons run through `kernel.dec()`. |
| 13 | §1a | The mutation harness credited a mutation when **any** newly-red subject's text named the mechanism — including subjects the mutation never declared. | The mechanism must be named by a **declared** subject's own failure text. |

Item 11 — F9, the intervention window's bounds — was **not** applied. See
below: choosing them is not the implementation's to do.

Fixing §1a immediately turned the mutation set RED by exposing `E-15`, which
had been credited on `WG-ALK-002` while declaring only `AD-RET-001` and
`AD-RET-003` — neither of which asserts `movementEvidence`. `E-15`'s
declaration was corrected to name the fixture that actually carries the
mechanism. The headline number is unchanged; it is now true.

---

## Findings recorded and left open

Nothing below was fixed. Each is recorded here so it is not rediscovered as new.

### Raised for the owner — decisions, not defects

1. **F9 — the intervention window's bounds.** `intervention.build` forms the
   pre-change window as every episode between the previous dose change and this
   one, with no 14-day cap and no 24-hour independence selection, while the
   ordinary trend path applies both. That is one inference with two
   implementations, which `MASTER RULE 1` calls a defect. But whether the
   answer is "the intervention window uses the trend's rules" or "canon must
   state its own" is a **chemistry** decision, and `CLAUDE.md` forbids the
   implementation making it. `sigma_pre` decides whether a keeper is told their
   change worked, and it is frozen into the prediction snapshot as historical
   fact, so this is not cosmetic.
2. **The accept-and-blank cadence.** Every accepted recommendation is a segment
   boundary (`A7`) and the evidence minimum is three independent clusters over
   four days (`ALK-011`), so a maturing tank gets roughly one usable assessment
   per five to six days. Both halves are canon's. Fixing F1 removed the part
   that was a defect — the blanking was *permanent*, not five days — and what
   remains is canon working as written. If that is wrong the exit is a canon
   reissue.
3. **Two dose numbers on one card**, and "insufficient data" beside "it worked
   as expected" on day +4. Both are card composition, which `X-INV-004` and
   `DEC-003` put outside the domain engine. Needs a presentation owner.
4. **`OI-EPISODEINTERVENTION-001`** — an open `CANON_DEFECT`. Canon and the
   algorithm contract retain Part II §5.3's "no relevant intervention between
   them" episode separator; the engine does not implement it. The engine
   therefore deviates from canon as it stands, while the underlying question is
   itself undecided. Owner's, by governed reissue.
5. **`OD-009`'s scope.** POTENCY path coverage is being deferred in `OD-009`'s
   name, but `OD-009` blocks *converting the existing fixtures* — whose inputs
   are computed quantities — not *covering the path*. An ordinary event ledger
   reaches the SNR partition, the plausibility envelope and the confidence
   ladder today, so a new `CANON_DERIVED` fixture is unblocked now. One line
   from the owner closes it. Mutations `E-21` and `E-22` are recorded BLOCKED
   on this and should not stay so.

New open decisions filed this pass: **`OD-024`** (what tank alkalinity a
water-change step subtracts from) and **`OD-025`** (the catalogue has no code
for "not built in this release", so declared debt must borrow an insufficiency
code). Both in `docs/process/OPEN-OWNER-DECISIONS.md`.

### Edge cases

- **§2d** — an intervention logged between two readings under 30 minutes apart.
  Subject of `OI-EPISODEINTERVENTION-001` above.
- **`_content_ordinal`** — the contract names `eventOrdinal` as the insertion
  sequence; the engine substitutes a content hash so the tie-break survives
  Python's per-process string-hash randomisation. Deterministic today, but a
  content hash also changes when an event is *edited*, which could reorder
  same-instant events on a retro-edit.

### Coverage gaps the gate cannot currently see

Recorded, not fixed. These are about the harness's ability to prove the engine
right, not about the engine's answers.

- **§2a** — thirteen frozen chemistry constants can be made arbitrarily more
  permissive with the gate staying green, including `B_SAFETY`,
  `ADVISORY_OFFSET`, `REPEAT_SPREAD_LIMIT`, `MAX_CONTROL_LOOKBACK_DAYS`, both
  evidence minima and the 24-hour independence spacing. The gate cannot notice
  canon being loosened, which is the thing it most needs to notice.
- **§5b** — `forbidden` blocks compare at `1e-12` while positive expectations
  compare at `1e-9`, so five of the corpus's six multi-decimal forbidden values
  can never fire. `E-8` and `E-10` cite forbidden entries that are structurally
  incapable of firing.
- **§5c** — a fixture declaring no `documentType` silently leaves the
  executable set, and there is no floor on the executable count. One typo
  reduces coverage with no signal.
- **§1b–§1d, §2f, §2i** — no fixture asserts `position`, `capApplied` or
  `bindingConstraint`; rounding is covered down but not up and not at the tie;
  nine of thirteen capability rows return constants untested; five of six
  response classes and thirteen gate/lifecycle states have no fixture.

---

## Gate results

Three arms, all run at the work commit.

| Arm | Result |
|---|---|
| **No engine** | RED — 23 fixture failures (`ENGINE_ABSENT`), 5 check failures, 6 invariant failures. Every executable fixture reports FAIL rather than skipping, which is the point. |
| **Against the engine** | RED — 11 fixture failures, 5 check failures, 3 invariant failures. 12 of 23 executable fixtures pass. |
| **Mutations** | GREEN — 80 defined, 69 caught, **0 missed**, 11 blocked with their unblocking condition stated. |

The 5 check and 3 invariant failures are **pre-existing and unchanged** by this
work: they are the same rows that fail in the no-engine arm, and they are
document-level (reason-code catalogue counts, traceability owner conflicts,
fixture-index integrity, dimension-suffix naming).

Every one of the 11 fixture failures is a recorded open question, not an engine
defect: `OD-018` through `OD-023`, plus the six goldens whose stated values are
written to a last place coarser than the tolerance they are compared at
(`OD-021`) and the two round-1 goldens whose retest expectations predate the
Freeze-5 scheduler (`OD-019`).

**Determinism** was re-verified after this pass: byte-identical output across
five fresh processes with randomised `PYTHONHASHSEED`, a reversed event array,
five timezones and a non-English locale — one md5.

---

## What is deliberately unbuilt, and how it presents

Each presents as canon's stated `NOT_RUN` / `WITHHELD` / `NONE` with a reason
code. None returns a plausible number.

- Safety-return **sizing** (`A39`, `A40`) — the outer-bound **state** is
  classified and reported; the sized response is `NOT_RUN` and named.
- Return **plans** (`A44`) — `returnPlan` is `NONE`; the offer's eligibility is
  computed, because `ALK-049` P1 makes it an outcome of the ordinary path.
- Correction plans and episode resolution beyond these paths — no event of that
  kind is read, and unread kinds are now reported.
- Empirical potency **promotion** — `CAPABILITY_GATED`, as canon states.
- `REASSESSING` detection — `NOT_RUN`; canon defines entry against an object
  `OI-POTENCYSNAP-001` says is undefined, and defines no exit at all.
- `T_detect` and the return-plan arrival cadence — canonically `NOT_RUN`.
- `READING_SERIES` expansion — not read. `OD-014` says in terms not to write a
  fourth expander.

---

## Not merged

Claude never merges. `OD-001` — GitHub branch protection — is still open, and
until it is configured and verified, `docs/process/AUTONOMY-AND-CONTROLS.md`
prohibits unattended merge-capable work.
