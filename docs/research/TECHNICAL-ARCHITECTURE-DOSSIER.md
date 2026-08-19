# Dosing Wizard V2 — Technical Architecture Decision Dossier

**Status: RESEARCH. NOT A DECISION.**

This document synthesises ten research reports, an adversarial review of those reports, and
an orchestrator audit of the frozen canon into one dossier for the owner. It **recommends**
an architecture. It does **not** select one.

- `DECISIONS.md` is deliberately untouched. No `DEC-0xx` entry has been added, amended or
  implied. Nothing here is marked "selected", "chosen" or "decided".
- `PROJECT-STATE.md`, `ROADMAP.md`, `PRODUCT-VISION.md` and everything in `docs/canon/`
  are likewise untouched.
- The choice belongs to the owner, after review. If the owner accepts a recommendation, the
  correct next act is a new `DEC-0xx` entry written by the owner, not an edit to this file.

**Evidence labelling.** Every substantive claim is labelled:

| Label | Meaning |
|---|---|
| **FACT** | Directly supported by a primary source that was actually fetched in this research, or by the frozen canon at a cited line/section. |
| **INFERENCE** | A reasoned conclusion from facts. May be wrong. |
| **RECOMMENDATION** | A judgement call. Owned by this document, not by any source. |
| **UNRESOLVED** | Not established. Stated as a question with a way to close it. |

**Two corrections to prior material, carried forward.**

1. The adversarial review's first finding — that `research/verify-a-web-platform.md` §§2–9 were
   `STATUS: pending` and the web-platform verification never happened — is **STALE**. The critic
   read that file while it was being written. It is now complete: all nine items executed, zero
   pending. Its findings are used here as primary evidence. Every *other* entry on the critic's
   "claims the adjudicator must not repeat as fact" list stands and has been honoured.
2. `verify-a` §5 **partially refutes** a sibling claim about service-worker staleness. Update
   checks are **not** navigation-gated (subresource requests and functional events both trigger
   Soft Update once a registration is stale). The real hazard is the **waiting-worker rule**. This
   dossier follows `verify-a`.

**A research-integrity note that must not be lost.** No vendor pricing page was reachable in this
session. Consequently **this document states no vendor price as fact, anywhere.** §11 gives a
relative, structural cost analysis instead. The research corpus additionally documents an
in-session incident in which a fetch returned empty and the summarising tool **hallucinated
plausible Firestore prices**. That is why absolute figures are absent rather than estimated: the
failure mode is not "we lacked a number", it is "a number appears that nobody sourced".

---

## 1. EXECUTIVE RECOMMENDATION

**RECOMMENDATION — Candidate A− ("A-minus"): a static installable PWA over a durable local
event ledger, syncing through the owner's own small versioned API into managed Postgres, with
the deterministic engine running on the client and the server *not* re-executing it.**

Data authority is split deliberately and each half is stated:

| Concern | Authority |
|---|---|
| Chemistry verdicts | The deterministic engine, wherever it runs. Never a surface. |
| Capture of events | The client. Fully offline. |
| Durability, admission, total replication order, identity, entitlement | The server. |
| "What the app said then" | The persisted audit record, pinned to its input set. |

**The five reasons, in order of weight.**

1. **It is the only shape that survives the failure mode most likely to kill this product**
   (§17, and the critic's Q15): silent divergence between what the app said and what the system
   can reproduce. That requires a server-assigned dense total order, a single admission point, a
   versioned API that can accept an old client's events, and server-side visibility so the owner
   discovers divergence before a customer does. A−, A, D and M have all four. B has none reliably.
   C cannot even define the question.
2. **A server is required at launch regardless.** This is not a preference. **FACT:** a PWA
   cannot schedule a future local notification without a server (Notification Triggers is
   abandoned in Chrome's own docs; never implemented in WebKit; Periodic Background Sync's spec
   declares timed firing a non-goal). **FACT:** AI keys, Stripe secrets and the VAPID private key
   must never reach a client bundle. Any candidate sold on "no server" is deferring a cost, not
   removing one.
3. **Offline capture is a chemistry-data-quality requirement, not a UX nicety.** A
   cloud-authoritative write path forces the keeper to log from memory later, and canon §2.3A
   plus `DATA-PROVENANCE.md` §2 forbid fabricating the time — so the honest record is
   permanently degraded in precision class. Every network-required write systematically destroys
   the analytical eligibility of the product's own core data.
4. **Server-side engine re-execution is not canon-mandated and should not be built first.**
   Canon §47/M-10 requires an audit record to be *persisted **or** deterministically
   reconstructable*. It does not require the server to verify it. Building verification on day one
   buys an integrity property that is weak in a single-user-per-tank consumer product — the
   "attacker" forging their own audit record is the person the record is for — and costs
   permanently-runnable engine artifacts plus an undesigned MISMATCH remediation path. **A− keeps
   the door open: it is a strict subset of A, and A can be added later without a schema change,
   provided the audit record pins its input set from day one.**
5. **It is the smallest bespoke surface consistent with the above.** Three moving parts: a static
   bundle, one server application, one Postgres database.

**Second choice: Candidate D (edge shard-per-user).** Named triggers in §19.

**Explicitly rejected: B** (RLS-as-sole-isolation carries the only FATAL security finding in the
corpus, and the schema-as-API property jams the offline queues of exactly the users who are most
offline) **and C as presented** (durability rests on an undocumented WebKit implementation detail;
the Safari→Home-Screen install transition forks or destroys the system of record with no merge
path; it cannot deliver the reminder workflow the vision names as core).

**Three things must happen before scaffolding, and none is expensive.** They are named as
P1/P3/P4 in §21. The critic's P2 (audit the canon's mathematics) has already been closed
favourably by the orchestrator — see §3.4 — and converts into a *standing* CI obligation rather
than a gate.

**The honest caveat.** A− has the largest bespoke-code surface of any candidate here, owned by
one person, with a bus factor of one. That is a real cost and §17 does not hide it. The judgement
is that a bespoke protocol you can read, test and version is a better risk for this product than
an off-the-shelf conflict model that is documented to be wrong for it, or a platform whose
migration primitive is a distributed transaction nobody can make atomic.

---

## 2. PRODUCT REQUIREMENTS

Drawn from `PRODUCT-VISION.md`, `ROADMAP.md`, `DECISIONS.md` and the research brief. These are
the requirements the architecture is measured against; §3 covers the constraints it must not
violate.

### 2.1 Functional

| # | Requirement | Source |
|---|---|---|
| R1 | Deterministic per-parameter chemistry engines; Alk first, other domains independently revalidated | `PRODUCT-VISION.md` pillar 1; DEC-003, DEC-004 |
| R2 | A whole-tank coordinator above the domain engines | pillar 2; DEC-005 |
| R3 | A large versioned reef-calculator library, arithmetic separated from advice; manufacturer formulas are versioned first-class **data** with brand/product/version/source/source-date | pillar 3; DEC-006 |
| R4 | Tank workflow: logging, charts, calendar, tasks, reminders, retest scheduling, ICP records, equipment, audit history, deterministic replay, backup/migration | pillar 4 |
| R5 | Minimal friction at the aquarium; **logging directly from due-test reminders** | pillar 4 |
| R6 | Optional AI strictly above the engines; never overrides HOLD/NOT_RUN/insufficient evidence/refusal; credentials server-side; product fully useful without it | pillar 6; DEC-009 |
| R7 | Multiple tanks; multiple devices | pillar 5 |

### 2.2 Distribution and commercial

| # | Requirement | Source |
|---|---|---|
| R8 | Paid **installable PWA/web app** first; native later, optional, must not be precluded | DEC-007 |
| R9 | Mobile-first; excellent iPhone Home Screen behaviour; desktop/web too | pillar 5 |
| R10 | **Offline-capable core workflows** | DEC-007, DEC-008 |
| R11 | Secure accounts, durable cloud data, multi-device, account recovery, device migration | DEC-008; ROADMAP Phase 8 |
| R12 | Subscription entitlement, billing portal, payment provider | ROADMAP Phase 8 |
| R13 | Export, backup, restore, schema migration, deletion policy; **never silently lose user tank history** | ROADMAP Phase 8 |

### 2.3 Owner constraints

| # | Requirement | Source |
|---|---|---|
| R14 | Essentially solo owner, building with Claude Code | brief |
| R15 | **Operational burden and long-term maintainability outrank development speed and novelty** | brief |
| R16 | The product may give consequential reef-management advice; correctness, reproducibility and safe migrations dominate | brief |
| R17 | Ten-year data horizon: the ledger must outlive any vendor in this document | INFERENCE from R13 + DEC-010 |

### 2.4 What "core workflow" means, concretely

The scenario used throughout this dossier, and the one the architecture is actually for:

> The keeper is at the tank, in a garage, on one bar of LTE with no wifi. They run an Alk test,
> read 7.4 dKH, and want to (a) log it, (b) log the 8 mL they just dosed, (c) be told whether to
> change the maintenance dose.

**INFERENCE.** All three of (a), (b) and (c) are core workflows and must work offline. (c) is the
contested one; §3.5 establishes that the canon does **not** forbid it.

---

## 3. NON-NEGOTIABLE ARCHITECTURAL CONSTRAINTS

This section is the most valuable thing in the dossier, because the research corpus repeatedly
presented **inferences as canon**. Over-constraint is as damaging as under-constraint. Three
tiers follow, and the tier matters.

### 3.1 Tier 1 — imposed by the FROZEN CANON (`SHARED_V2_FREEZE_2` / `ALK_V2_FREEZE_4`)

These are not tradeoffs. A candidate that cannot satisfy them is disqualified.

| # | Constraint | Canon citation | Architectural consequence |
|---|---|---|---|
| K1 | **Immutable chronological event ledger**, seven event families with mandated minimum fields; *"Every actual dose change creates a new event. Never overwrite dose history."* | §9 (L808–889), §9.2 | Persistence is append-dominant with explicit supersession. Any store whose primitive is "mutable row, last writer wins" is fighting the domain. |
| K2 | **Effective-dated configuration** — `SHARED-CONFIG-VERSION-001`. Every version stores `configVersionId, recordedAt, effectiveFrom, changedFields, source`. A derived assessment resolves the config effective at its explicit `assessmentAsOf`. Missing historical config ⇒ `NOT_RUN` / `HISTORICAL_CONFIGURATION_UNAVAILABLE`. | §2.2A (L504–537) | Configuration is a bitemporal event stream (recorded-at vs effective-from). A settings row UPDATEd in place is a canon violation. |
| K3 | **Deterministic replay.** Same ledger + same config versions + same engine/canon version ⇒ same result. No unseeded randomness, no current-clock dependence without explicit `asOf`, no UI-dependent rounding, no iteration-order dependence. Every analysis function accepts an explicit `asOf`. | §64 (L4149–4166) | Clock is injected. Total order over events required. Every collection sorted before consumption. Engine version *and* canon version are replay inputs. |
| K4 | **Audit record per actionable assessment** — ~35 mandated retained fields including engine version, canon version, available/used/excluded clusters and exclusion reasons, segment, slope, trend confidence, selected potency, potency confidence, constraints applied, final recommendation, expected post-change slope, next-test recommendation, recommendation confidence. Reinforced at M-10: the ledger alone does not make the bracket executable *"unless these historical derived assessments/provenance are actually persisted **or** deterministically reconstructable."* | §47 (L1754–1787); M-10 (L14520–14545) | A second durable write path with its own volume, retention and sync story — **or** a guarantee of exact reconstructability. §9.4 argues for persisting. |
| K5 | **History truthfulness.** Changing target range, product, potency calibration or algorithm version must not silently rewrite historical recommendations. Retrospective re-analysis, if shown, must be separate from "what the app said then". | §46 (L1738–1752) | Stored past assessments are immutable records. Forbids a design where the UI always recomputes from current config. This is precisely V1's defect (§16). |
| K6 | **Canonical time.** Offset-aware instant or UTC with retained local zone metadata; all elapsed time from seconds, never calendar-day subtraction; display rounding never enters calculations; `SHARED-LEGACY-TIME-001` carries a per-record precision enum `EXACT_ABSOLUTE / RECONSTRUCTED_WITH_PROVENANCE / LOCAL_TIME_ZONE_UNKNOWN / DATE_ONLY`; forbidden to silently assign noon, apply the current timezone to old local timestamps, or treat a local HH:MM as an absolute instant; event ordering at identical timestamps must be **explicit**, with pre-event measurement → intervention → post-event measurement precedence, otherwise **mark ambiguity**. | Part II §2 (L2230–2317), §2.3A, §2.4; also L9663 | A single `timestamp` column is insufficient. Time precision class is first-class. The store must be able to represent *unknown order* rather than inventing one. A sync model that orders by arrival or `updated_at` cannot satisfy §2.4. |
| K7 | **Measurement event model and validity states.** `rawValue`, `canonicalUnit`, `baseUncertainty`, `source`, `repeatGroupId?`, `prePostEventRelation?`, `status`, `invalidReason?`, `createdAt`, `editedAt?`. Never overwrite the original with a rounded display value, cluster median, fitted value or corrected value. Status `VALID / SUSPECT / INVALID / SUPERSEDED`; SUSPECT and INVALID are **retained**. | Part II §3–4 (L2318–2418), §3.1, §4.4 | Delete is not an operation on the ledger. Supersede, never remove. (See §3.5 for what this does **not** mean.) |
| K8 | **Four kinds of truth kept separate**: recorded facts / configuration / derived estimates / recommendations. *"A recommendation is not an implemented action. Only a confirmed actual action changes the event timeline."* | §2 (L476–560) | The schema must make it impossible to mistake a recommendation for an event. |
| K9 | **Capability and degradation contract** — `ALK-CAPABILITY-CONTRACT-001`. A rule is not implementation-ready unless every required datum has a capture source, a stored representation and a defined missing-data behaviour. *"No implementation may silently manufacture a missing input."* Outcomes `DEGRADE / REFUSE / NOT_RUN`. | L14154+ | Every field needs an explicit missing-representation. Forbids ORM defaults that substitute 0 or null-as-zero, and forbids a migration that backfills a new NOT NULL column with a default for historical rows. |
| K10 | **Surfaces never recompute chemistry.** Structured domain state in, presentation out. A notification surface may render `recommendedAt`, `earliestUsefulAt`, `latestSafeAt?`, `reasonCode` but *"must not independently calculate chemistry/retest dates."* | §50 (L1833–1856); invariant 12 (L2078); handoff | The retest scheduler is upstream of notifications. A push scheduler consumes scheduler **output**, never recomputes it. |
| K11 | **Non-negotiable invariants** (architecture-relevant subset): (2) a recommendation is never treated as implemented without an actual event; (5) a suspect measurement is never silently deleted; (12) surfaces never recompute verdicts; (13) **a field never stores different physical dimensions by state**; (14) historical recommendations remain what was actually recommended then; (16) safety constraints cannot be bypassed by presentation code. | §57 (L2062–2083) | (13) makes unit/dimension safety a schema- and type-level requirement, not a convention. |
| K12 | **Suggested shared interfaces** all take `policy` and an explicit `asOf`, and take plain event collections — `buildMeasurementClusters(events, policy, asOf)`, `buildAnalyticalSegments(...)`. | §65 (L4168+) | The canon already describes a **pure functional core over plain data**. The engine is a pure TypeScript package: no I/O, no ORM entities, no ambient clock. |
| K13 | **Mutually exclusive current dose state.** *"If records imply two mutually exclusive maintenance doses are simultaneously current: mark dosing state invalid; do not guess; request reconciliation."* | §70.5 | Config conflict resolution is a **refusal**, not a merge. This single sentence disqualifies every last-write-wins sync engine for the configuration category. |
| K14 | **Unmodellable interventions may not be ignored.** A logged intervention must be modelled, normalised or marked as a confounder, *"but never simply pretend it did not occur."* | §1.5 | An event type an old client does not understand must be preserved and must force refusal of analyses whose window contains it. §12 and §17 cost this. |
| K15 | **Migration methodology**: run V1 and V2 side by side against the same datasets with a comparison harness; classify differences; switch only after review. | §54 (L1980–2002) | **Substantially narrowed by the decision ledger** — see §3.3. |

### 3.2 Tier 2 — imposed by the DECISION LEDGER and migration record (not canon, but already decided)

| # | Constraint | Source |
|---|---|---|
| D1 | No UI component may recompute chemistry; every recommendation reproducible by replaying its inputs; uncertainty and missing evidence are engine outputs, not UI copy | DEC-003 |
| D2 | First distribution is a **paid installable PWA**; platform capabilities unavailable to web apps must not become load-bearing; native must not be precluded | DEC-007 |
| D3 | Persistence must not assume a single device or browser profile. Core workflows must still function offline. **"This decision permits, but does not by itself select, any particular cloud technology."** | DEC-008 |
| D4 | AI receives compact structured domain context, not unrestricted raw history by default; credentials server-side; every core workflow degrades cleanly when AI is unavailable | DEC-009 |
| D5 | **Four independent properties per record**: measurement truth / time precision / intervention-context completeness / analytical eligibility. The product may **display** more history than its engines may **reason over**, and must be able to explain the difference. Missing times, timezones, dose history are never manufactured. | DEC-010; `docs/migration/DATA-PROVENANCE.md` §§1–4 |
| D6 | Migration tooling is written against the **export format**, not a one-off snapshot; the cutover baseline is a fresh export at cutover | DEC-011 |
| D7 | V1's storage implementation is not carried forward by default; familiarity with it is **not** an argument | DEC-012 |
| D8 | V2 goldens derive from the canon, not from V1 runs. A V1/V2 difference is never by itself evidence of a V2 defect. | DEC-013 |
| D9 | Unsupported causal speculation is prohibited across product surfaces **and** the AI layer | DEC-015 |

**INFERENCE — D5 is an architectural constraint, not a data-quality note.** Eligibility is a
*computed, explainable* property. It must not be a `WHERE` clause or a stored boolean, because
either will drift from the engine's own judgement and the explanation will stop matching the
behaviour. This means **two read paths over the same data**: a permissive display path and a
strict analytical path. No candidate description in the corpus accounted for this doubling.

### 3.3 Tier 3 — RESEARCH INFERENCES that were presented as constraints, and are not

Each of these appears somewhere in the corpus with the authority of the frozen document. Getting
this boundary right prevents both a bad architecture and a wasted year.

| # | Claim as it appears | Verdict | Correct statement |
|---|---|---|---|
| X1 | "The cloud must be the system of record; this is forced by the canon." | **NOT A CANON CONSTRAINT** | K1–K15 say nothing about *where* data lives. DEC-008 permits but does not select cloud technology. The cloud-authority conclusion is a **durability-risk argument** derived from iOS storage behaviour — much of which is itself UNRESOLVED (§10.6, §17). Honest form: *the canon is location-agnostic; the evidence about iOS storage durability argues strongly for a server-held second copy.* Different claims, different strengths. This dossier relies on the second, not the first. |
| X2 | "An offline app that produced a chemistry verdict would violate the frozen documentation" — i.e. assessments must be network-only. | **THE MOST DAMAGING OVER-READ IN THE CORPUS** | K10 constrains **who computes** (the engine, not a surface), not **where the engine executes**. K12 describes a pure core taking plain data with injected `policy` and `asOf` — designed to run anywhere. K9's refusal rules are about *missing inputs*, not network availability. Adopting the over-read would delete the primary use case in every candidate. What the canon *does* require: the output is stamped with engine and canon version, pins its input set, and is presented as an assessment made from the ledger prefix that device held. All achievable offline. |
| X3 | "Deterministic replay forbids running the engine in two JS engines." | **OVER-READ** | K3 forbids implementation-approximated mathematics and iteration-order dependence. `+ − × ÷` and `Math.sqrt` are **exactly specified** by ECMAScript. The constraint is *audit the maths*, not *never run in two engines*. See §3.4 — the audit has now been done. |
| X4 | "K7 means the operator may never erase a user's account, so GDPR is in irreconcilable conflict." | **OVER-READ that manufactures a legal conflict** | K7 is a **measurement-lifecycle** rule: a suspect or invalid reading is retained and marked rather than quietly removed, because removing it hides evidence from the analysis. It says nothing about honouring a departing user's erasure request for their whole dataset. The straightforward answer is pseudonymisation by construction (§10.5). **UNRESOLVED:** the legal sufficiency of that strategy needs a lawyer; the GDPR text was never fetched and nothing here is legal advice. |
| X5 | "Every assessment the user ever sees must be persisted as an audit record." | **OVER-READ that inflates the entire cost model** | K4's trigger is *every **actionable** assessment* — one that yields an action the keeper could take (a dose change, a HOLD they were shown, a refusal that changed what the app offered). A chart re-render, a scroll, a passive history view is not one. **Defining "actionable" narrowly and explicitly is a legitimate, canon-faithful design decision that may reduce the audit write path by an order of magnitude.** It should be made deliberately (§21, PRE-7), not maximised by default. |
| X6 | "`UNREVIEWED` config states, `POSSIBLE_DUPLICATE` markers, `ledgerPrefixSeq`/`ledgerPrefixHash`, and the `(hlc, deviceId, eventId)` ordering tuple are canon requirements." | **RECOMMENDATIONS, correctly labelled in the source, laundered downstream** | Canon §70.5, §2.4 and §47 support the *shape* of these. The specific mechanisms are proposals and must be adopted on their merits. This dossier adopts most of them and says so as RECOMMENDATION, not FACT. |
| X7 | "Retest schedules must never be stored anywhere, only recomputed." vs "the dispatcher stores due instants verbatim." | **A WORDING CONFLICT between two reports, not a constraint conflict** | The correct rule, stated once: **the retest scheduler is the sole *computer* of due instants; any other component may store and render its output verbatim, and may never derive one.** Left unstated, this will be implemented twice. See §12. |
| X8 | "The canon requires a V1/V2 dual-run comparison harness." | **TRUE OF THE CANON, SUBSTANTIALLY NARROWED BY THE DECISION LEDGER** | K15 is real. But DEC-001 owes V1 no compatibility contract, DEC-011 takes the baseline as a fresh export at cutover, and DEC-013 says *"V1's outputs are not V2 expectations"* and *"a V1/V2 difference is never by itself evidence of a V2 defect."* Building and maintaining a full dual-run harness against a system whose outputs are explicitly non-authoritative is a large piece of work whose value the ledger has already reduced. **Flag for the owner (§24, Q11); do not assume it.** |
| X9 | "The canon requires the server to re-execute the engine and verify the client's audit record." | **NOT A CANON CONSTRAINT** | K4 requires the record to be persisted **or** reconstructable. Server-side verification is an *invented* requirement, imported from an integrity argument with no canon backing. This is the entire difference between candidates A and A− (§4, §6A). |

### 3.4 The determinism constraint, now closed for the frozen Alk canon

**FACT (orchestrator audit of the frozen canon, 2026-08-19, method reproducible).** The adversarial
review's most under-examined risk was that the frozen alkalinity canon might prescribe
implementation-approximated operations (`exp`, `log`, `pow`, `**`, trig), which ECMAScript permits
engines to compute differently — meaning a golden recorded on V8 could return a different last
digit on JavaScriptCore, and near a threshold, a different verdict. Nobody had checked.

The check was run directly against `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md`
(`SHARED_V2_FREEZE_2` / `ALK_V2_FREEZE_4`). **Method:** grep the full 15,948-line canon for LaTeX
and prose forms of every implementation-approximated operation named in the ECMAScript
specification — `\log`, `\ln`, `\exp`, `log10`, `log2`, `e^{...}`, `10^{...}`, `\sin`, `\cos`,
`\tan`, `\arctan`, `erf`, inverse-normal/percentile language — plus an enumeration of every
exponent actually used. The owner can re-run it.

**Result (FACT):**

| Operation | In the frozen canon? | ECMAScript determinism |
|---|---|---|
| `+ − × ÷` | Yes, pervasively | **Exact**, IEEE-754 binary64 |
| Squaring `^2` | Yes — the **only** exponent used | Exact, if written `x * x` |
| `sqrt` | Yes, pervasively (uncertainty combination) | **Exactly rounded**, IEEE-754 |
| Comparison / ordering | Yes | Exact |
| Median / sort (Theil–Sen) | Yes | Deterministic given a total comparator |
| Logarithm (any base) | **Zero occurrences** | (would be approximated) |
| Exponential | **No** | (would be approximated) |
| Trigonometric | **No** | (would be approximated) |
| `pow` with non-integer or non-2 exponent | **No** | (would be approximated) |

Exponent census across the whole document: `^2` (23), `^2}` (8), `^{2}` (6). Nothing else. The one
apparent exception, `\sigma_s^{MAD}` (L3045), is a superscript **label** (median absolute
deviation), not an exponent. The single distributional constant `ALK_SLOPE_SUPPORT_K = 1.28`
(L5986, L8580) is hardcoded and described at L8613 as *"a fixed-but-reviewable engineering
constant, not a user setting"* — it is **not** computed from an inverse normal CDF at runtime.

**Conclusion (FACT for the frozen Alk domain).** The canon's mathematics lies wholly within the
exactly-specified subset of IEEE-754 / ECMAScript. **Bit-identical results across V8 (Chrome,
Node, Cloudflare Workers) and JavaScriptCore (Safari/iOS) are achievable**, provided the
implementation:

- writes squaring as `x * x`, never `Math.pow(x, 2)` or `x ** 2`;
- uses `Math.sqrt` and no other `Math.*`;
- fixes accumulation and iteration order (binary64 addition is not associative, so sum order
  changes the result even with exact operations);
- supplies a **total** deterministic comparator for the Theil–Sen median.

**What this changes, stated carefully.**

1. The critic's blocking precondition P2 is **closed for what is frozen today**. Do not repeat
   the claim that "no candidate has a verified determinism story".
2. The **cross-engine determinism objection to candidate A's server-side re-execution falls
   away.** But the critic's two *other* objections to A-as-specified — permanent retention of
   runnable engine artifacts, and an undesigned MISMATCH remediation path — are independent and
   **still stand**. P2 removes one of three arguments; it does not decide A vs A−. §18 and §20
   adjudicate the remaining two on their merits.
3. **This becomes a standing obligation, not a one-off clearance.** It covers only the Alk canon.
   Future domains are a live risk: **pH is natively logarithmic**, carbonate-system and salinity
   conversions commonly use logs and non-integer powers, and ICP correction maths may too. The
   guard must therefore be a permanent lint ban on `Math.pow / Math.exp / Math.log / Math.log10 /
   Math.log2` and the `**` operator inside the engine package, plus a cross-engine golden test in
   CI — **enforced from the first commit**, and re-run whenever a new parameter canon is frozen.
   See §13.4, §21 (PRE-2) and §24 (Q4).

**UNRESOLVED (carried).** This audit covers mathematical *notation in the canon*. If an
implementer chooses an algorithm the canon does not prescribe — a solver, a curve fit, a
statistical function — that introduces transcendentals, the guarantee lapses. The lint plus the
cross-engine golden job is what makes that detectable rather than silent.

### 3.5 Constraints this dossier explicitly declines to impose

**RECOMMENDATION.** Record these as deliberate non-constraints so they are not re-derived later:

- The engine **may** run on the device. (X2.)
- The engine **may** run in two different JS engines. (X3, §3.4.)
- The cloud is the durable second copy and the order authority; it is **not** required by canon to
  be the "system of record", and the phrase should be retired in favour of the precise split in §1.
- A user's account **may** be erased on request without violating K7. (X4.)
- Not every assessment needs an audit record — only actionable ones. (X5.)

---

## Candidate set — how it was adjudicated

The candidate set inherited from the research phase was five (A, B, C, D, E, with E declared a
strawman). The adversarial review attacked the set itself and it was right on three counts, all of
which are honoured here:

1. **"A-minus" — A without server-side engine re-execution — is a genuinely distinct and better
   candidate that was missing.** It is promoted to first-class status at **§6A**.
2. **C is really two mutually contradictory candidates**, and both of its named implementations
   violate K1/K7 in their default configuration. §6 presents both the disqualified default form
   and the steel-manned form, separately.
3. **B is dominated by A rather than a trade against it.** §5 shows why B's two advertised
   advantages do not survive the requirements.

One further gap the critic named is also filled: **the boring monolith (§6C)** — one process, one
database, one host — which the original set dropped despite a brief that says operational burden
and long-term maintainability outrank development speed.

Seven candidates follow. They span **four distinct data-authority models** and **six distinct
runtime shapes**:

| Data-authority model | Candidates |
|---|---|
| Hybrid: client authoritative for capture, server authoritative for durability + admission + total order | A, A−, D, M |
| Cloud-authoritative with the **database itself as the API** (no admission tier) | B |
| Local store is the system of record; cloud is a replica/peer | C |
| Cloud-authoritative thin client; network required for writes | E |

| Runtime shape | Candidate |
|---|---|
| Static SPA + own API service + managed Postgres, engine on both sides | A |
| Static SPA + own API service + managed Postgres, engine client-side only | A− |
| Static SPA + BaaS reached directly from the browser + edge functions for secrets | B |
| Static SPA + no server (or a sync vendor), accounts bolted on later | C |
| Static SPA + edge workers + one database/Durable Object **per user** | D |
| **One** process serving the static bundle and the API, one host, one Postgres | M |
| Server-rendered or API-driven app, minimal offline | E |

---

## 4. CANDIDATE ARCHITECTURE A — Ledger-on-Postgres, own API tier, **server re-executes the engine**

> Read §6A immediately after this one. A and A− are the same architecture except for one
> subsystem, and that subsystem is the single most consequential optional cost in the dossier.

**Data authority.** Hybrid. Server authoritative for durability, admission, total replication
order (`serverSeq`), identity and entitlement. Client authoritative for capture and fully
offline-capable. Engines authoritative for chemistry.

**Runtime shape.**

| Layer | Design |
|---|---|
| Client | Static precached SPA shell (Vite build; React or Svelte — see §22, DEF-1). No SSR. IndexedDB via a thin adapter: `events` store (append-only) + durable `outbox` + rebuildable projections. Service worker in **prompt** update mode. |
| Server | One small own API service (Node) in front of managed Postgres. Table-level `REVOKE UPDATE, DELETE` enforces append-only **at the database**. `numeric` for chemistry values; `jsonb` for audit records. Blobs in S3-compatible object storage. |
| Sync | Transactional outbox → dense server-assigned `serverSeq` → cursor pull → idempotent `PUT` keyed by client-generated `eventId` (ULID). No tombstones. Per-category conflict rules (§8). Config conflicts become `CONFIGURATION_CONTESTED` ⇒ `NOT_RUN`, surfaced to the user. |
| Engine | **One** isomorphic pure-TypeScript package. Runs client-side for offline immediacy **and is re-executed server-side** at the pinned `engineVersion` on sync. Divergence is recorded as an append-only verification record `MATCH / MISMATCH(diff) / UNVERIFIABLE`, never silently corrected. |
| Auth | Own or off-the-shelf session layer; `Secure; HttpOnly; SameSite=Lax` cookie sessions. |
| Billing | Provider (Stripe or merchant-of-record) is commercial truth; server DB holds an entitlement **event ledger** plus a derived current-state row; client holds a short-lived signed entitlement token. |
| Notifications | Own scheduler consuming retest-scheduler **output** verbatim, plus Web Push with self-managed VAPID keys. |

**What A buys that A− does not.** A server-side detector for engine divergence across a
multi-JS-engine client fleet, and a defensible answer to "the ledger records what a client
*claims* the engine said". §3.4 establishes that for the frozen Alk canon that divergence is
avoidable in principle; A detects it in practice, including the cases §3.4 does **not** cover
(a future domain that needs logarithms; an implementer-chosen algorithm the canon does not
prescribe; a client running a corrupted cache).

**What A costs that A− does not, and these are permanent.**

1. **Every historical engine version must remain runnable, forever.** To verify or replay an
   assessment stamped `engine 1.4.2` you must be able to *execute* `engine 1.4.2` — an immutable
   content-addressed artifact **and** a runtime that can run it, in 2035. npm packages get
   unpublished, Node LTS lines EOL, toolchains rot. Either you pay this forever or
   "deterministic replay" quietly becomes "deterministic replay for the last two years".
2. **An undesigned remediation path.** The keeper dosed 8 mL at 21:40 on the client's answer. At
   09:00 the server records `MISMATCH`. The product now holds an audit record saying "we told you
   8 mL" and a verification record saying "that was wrong", with **no defined remediation** — no
   user notification design, no reason code, no rule about whether dependent analyses must refuse.
   None of the ten research reports specifies this path. **A safety feature with an undefined
   failure branch is a liability, not a feature.**
3. A materially larger bespoke server surface for a solo owner.

**Verdict on A.** Correct on every Tier-1 constraint. Its verification layer is genuinely
valuable, **conditionally**: it is worth building once the MISMATCH path is designed (cheap now —
a first-class ledger event with a reason code that forces `NOT_RUN` on dependent analyses until
reviewed — and expensive later, because the schema must carry it) and once a domain exists whose
mathematics §3.4 cannot clear. Until then it is an unmandated permanent obligation. **Treat A not
as a rival to A−, but as a later increment on top of it.** §20 develops this.

---

## 5. CANDIDATE ARCHITECTURE B — Managed BaaS, client-direct via row-level security

**Data authority.** Cloud-authoritative, **with the database itself as the API**.

**Runtime shape.** Supabase (or equivalent) provides Postgres + RLS + Auth + Storage + Edge
Functions. The client talks **directly** to Postgres via PostgREST using the publishable key;
tenant isolation is enforced entirely by RLS policies. Offline is "client cache + queue replayed
on reconnect". A thin Edge Function layer exists only for things that need secrets. The engine
runs client-side only; the server does not re-execute it.

**The pitch.** Fastest path to a working product; smallest amount of owner-written server code.

**Neither claim survives the requirements.**

- **"Smallest amount of owner-written server code" is false.** Stripe webhooks, entitlement token
  issuance, the push dispatcher, the AI proxy and the daily reconciliation sweep all require
  server code holding secrets. B's "thin Edge Function layer" is the API tier arriving by
  accretion, in a different runtime, without shared middleware — while the database remains
  directly exposed. And the canon's **admission** invariants (`eventId` client-generated and
  unique; `occurredAt` never substituted from server receipt time; `timePrecision` one of four
  enum values and matching the shape of the timestamp; `inputEventIds` referencing events that
  exist and belong to the same tank; `basedOnVersion` referencing a real ancestor;
  `schemaVersion` one the server understands) are **semantic**. RLS expresses none of them. You
  get them back only as PL/pgSQL triggers — the codebase's least tested, least typed, least
  reviewed language, sharing no code with the engine and unrunnable in the client's unit tests.
- **"Fastest path to a working product" is false once offline is honoured**, which DEC-007 makes
  non-negotiable. B's offline story is a two-word placeholder — "queue replayed on reconnect" —
  for the single largest piece of client work in the project: a durable IndexedDB outbox with
  client-generated idempotency keys, ordered drain, rejection quarantine, per-user partitioning,
  retry/backoff and conflict surfacing. `supabase-js` is a PostgREST/HTTP client; nothing in the
  fetched Supabase documentation describes an offline write queue, and none of the ten reports
  found one. **B does not remove that work; it just does not mention it.**

**Therefore: B ≈ A− + PostgREST exposed to the internet + no versioned API + no admission tier.
B is *dominated* by A−, not a trade against it.** Its one genuine advantage is time-to-first-demo,
which is the least valuable property on this brief (R15).

**Two findings against B that are on their own close to disqualifying.** Both are developed in
§17; stated here because they belong in the candidate's description, not its footnotes.

- **FATAL — RLS as sole isolation.** Supabase's own documentation carries a `danger` admonition,
  verbatim: *"A table in an exposed schema without RLS is readable and writable by anyone with
  your publishable key."* And: *"RLS is enabled by default on tables created with the Table
  Editor… If you create a table in raw SQL or with the SQL editor, enable RLS yourself."* Every
  migration file you write is raw SQL. And on existing projects a new table in `public` starts
  with every privilege already granted to all three roles, `anon` included. One migration that
  omits one line publishes the complete event ledger of every user — **world-readable and
  world-writable** — to anyone who reads the publishable key out of your JavaScript bundle. No
  error, no warning, no log entry. The *write* half is a physical-harm path, not a privacy
  incident: an attacker inserts fabricated dose and measurement events, the deterministic engine
  consumes them exactly as it consumes real ones, and emits a maintenance-dose change that the
  keeper — who trusts the product *because* it is deterministic and auditable — acts on.
- **FATAL at scale — the schema is the API.** A service-worker-cached client can be running code
  from a month ago. If your schema is your API, a schema migration silently breaks it. A device
  offline for three weeks with 40 queued events meets a tightened CHECK and a new column; every
  queued event fails with a Postgres error string; there is no versioned API, no server-side
  upconverter, no protocol negotiation and no rejection vocabulary the user can act on. Either 40
  irreplaceable events are lost or the queue is permanently stuck. **This is not fixable within
  B's defining constraint,** and adding an API tier later is the most expensive refactor in the
  set — it arrives precisely when you have paying users, and it means changing every client data
  path while keeping the direct-DB contract alive throughout.

**Verdict on B. RECOMMENDATION: reject.**

---

## 6. CANDIDATE ARCHITECTURE C — Strongly local-first, cloud as replica

C is presented in two forms because the original candidate conflated them.

### 6.0.1 C-default (as originally drafted) — DISQUALIFIED

**Data authority.** The local store is the system of record; the cloud is a sync peer or replica.
The app is fully functional with no account. Sync uses an off-the-shelf engine (PowerSync as the
leading structural fit) or a CRDT layer (Automerge/Yjs). Accounts and subscription bolt on later.

**Both named implementations violate the frozen canon in their default configuration.**

- **PowerSync.** Documented default is *"essentially 'last write wins'… for multiple concurrent
  updates, the last update (as received by the server) to each individual field wins"*, and
  *"Deletes always win"*. K1 says the primitive must not be mutable-row-last-writer-wins; K7 says
  delete is not an operation; K13 says a contested dose state must be **refused**, not resolved.
  A dose schedule resolved by arrival order is the difference between a controlled correction and
  an alkalinity spike in a live reef.
- **CRDTs.** Automerge's own documentation states it *"stores the full history"*; Yjs documents
  that *"the document only grows in size. We can't garbage collect deleted structs
  (tombstones)"*. A multi-year reef ledger inside a growth-only CRDT, on a phone with an
  eviction-prone quota, is a slow-motion failure. And map conflicts are documented as resolved
  arbitrarily — for a dose schedule, arbitrary is the one answer the canon forbids.

**Three further failures independent of the sync engine.**

1. **It cannot ship the workflow the vision names as core.** `PRODUCT-VISION.md` pillar 4 names
   "logging directly from due-test reminders". **FACT:** a PWA cannot schedule a future local
   notification without a server. On iOS, push additionally requires Home Screen installation and
   **every** push must render a visible notification or Safari revokes the permission — so push
   cannot even be used as a silent wake-up. C either launches without reminders, and is not the
   product in the vision document, or it requires accounts + a server + a push dispatcher at
   launch, i.e. it is not C.
2. **Its durability rests on something Apple has never documented.** See §17, F-2. The mitigation
   C would reach for — "drive Home Screen install, because installed apps are exempt" — depends on
   an undocumented WebKit implementation detail populated by a closed-source embedder. **You
   cannot build a paid product's durability on that.** Worse, the Safari-tab → Home-Screen install
   transition does not copy IndexedDB, so a user who installs "to make it more reliable" arrives
   in an empty app with an orphan store that the eviction sweep will collect — and there is no way
   to merge two WebKit storage partitions from the client.
3. **Support is blind and the migration is unbounded.** At 2am the data the owner needs is on a
   stranger's phone: no server copy, no admission log, no canonical prefix, no way to reproduce
   the user's state. And the day accounts are needed — which a **paid** product needs on day one —
   the owner must merge N independently-evolved local ledgers into a cloud model, once,
   irreversibly, while customers are paying. C's cheapness is entirely front-loaded and its costs
   entirely back-loaded: the worst possible shape for a solo owner who cannot afford a bad year
   three.

**Verdict on C-default. RECOMMENDATION: reject.**

### 6.0.2 C-steel — local append-only log + hand-rolled push/pull to a dumb durable store

**This form is legitimate and deserves saying plainly.** Local IndexedDB append-only event log;
no off-the-shelf sync engine and therefore none of their conflict models; a hand-rolled
append-only push/pull against a dumb durable store; the cloud as a **backup replica** rather than
an authority.

C-steel satisfies K1, K7 and K13, because the owner writes the conflict rules rather than
inheriting them. **But notice what happens: once the disqualified conflict models are removed,
C-steel converges on A−.** The remaining difference is *which side owns the total order* — and
that is precisely the thing A− gets right and C cannot. Without a server-assigned dense position,
`ledgerPrefixSeq` in the audit record has no meaning, and the pin degrades to a content hash with
no total order behind it. Two devices' contradictory audit records are then equally "true" with
no way to say which prefix produced which.

**Verdict on C-steel. RECOMMENDATION: not a separate destination — it is A− with the order
authority removed, which is a strict loss.** However, **C's phase-1 form is the best available
first move** and is treated as a sequencing question, not an architecture: see §21 (SEQ) and §22.

---

## 6A. CANDIDATE ARCHITECTURE A− ("A-minus") — same as A, **without server-side engine re-execution**

**Relationship to A, stated exactly.** A− is A with exactly one subsystem removed. Everything
else is byte-for-byte the same design: static shell, IndexedDB ledger + durable outbox, own
versioned API, managed Postgres with `REVOKE UPDATE, DELETE`, server-assigned dense `serverSeq`,
idempotent `PUT` by client-generated `eventId`, cookie sessions, server-held secrets, entitlement
ledger, own push dispatcher. **A− is a strict subset of A.** Nothing in A− has to be undone to
become A later, *provided* the audit record pins its input set from day one (§9.3).

**What A− does instead of verifying.** The server **stores the client's audit record as an
attested assertion**, with `engineVersion`, `canonVersion`, the pinned input set, and the
authenticating session/device stamped at admission. That is exactly what K4 requires: the record
is *persisted*.

**Data authority.**

| Concern | Authority | Why |
|---|---|---|
| Chemistry verdicts | The engine | K10, D1 |
| Event capture | Client, offline | R10, §2.4 |
| Durability, admission, total order, identity, entitlement | Server | §17 F-2, F-6; §11 |
| "What the app said then" | The persisted audit record, pinned to its input set | K4, K5 |

**Runtime shape.** Three moving parts and no more: **a static PWA bundle, one server application,
one Postgres database.** Object storage for blobs is a fourth surface but a trivially replaceable
one (content-addressed, hash-keyed).

**What removing verification deletes.**

| Deleted obligation | Why it mattered |
|---|---|
| Permanent retention of runnable engine artifacts and their runtimes | §4, cost 1 — unbounded, forever |
| The isomorphic bit-determinism obligation across JavaScriptCore and V8 | Now avoidable in principle (§3.4) but still an obligation A must *guarantee*; A− need only *not depend on it* |
| The entire undesigned MISMATCH remediation problem | §4, cost 2 — a safety feature with an undefined failure branch |
| A large slice of bespoke server code | §17 F-9 — the owner's time is the dominant cost |

**What A− keeps, which is everything that actually matters.** Durability. Admission control. A
canonical dense total order. A versioned API with a server-side upconverter for old clients.
Server-held secrets. A real backup and per-user restore story. Full offline capture *and* full
offline assessment.

**The integrity argument A− gives up, assessed honestly.** In A−, the ledger records what a
client *claims* the engine said. In a multi-user or adversarial system that would matter. In a
single-user-per-tank consumer product, the person who could forge their own audit record is the
person the record is for. The residual risks are (a) a stale or corrupted client producing a
wrong assessment that nothing catches, and (b) version skew across a client fleet accumulating
invisibly. Both are **mitigable without a server engine**: a server-authoritative minimum-version
check on every assessment-bearing write path (refuse to admit an audit record from a shell older
than a declared minimum), plus the cross-engine golden job in CI (§13.4), plus the
`computedOnDeviceId` + `engineVersion` stamp making skew *queryable* even though it is not
*verified*. That is a materially weaker guarantee than A's, and it is stated as such.

**Verdict on A−. RECOMMENDED — see §18.**

---

## 6B. CANDIDATE ARCHITECTURE D — Edge shard-per-user

**Data authority.** Cloud-authoritative, **partitioned per user at the storage layer**. Client
authoritative for capture, as in A/A−.

**Runtime shape.** Cloudflare Workers + one D1 database **or** one Durable Object per user + R2
for blobs. The engine runs in Workers (V8) server-side and in the browser client-side. Per-user
point-in-time restore is a native platform feature.

**Genuine, and under-credited, strengths.**

- **The best isolation model in the set.** One database or Durable Object per user is *physical*
  partitioning, not a predicate. The failure mode is "the Worker resolved the wrong shard id" — a
  code bug, in TypeScript, that you can unit-test and that fails loudly. Compare B's failure mode:
  "a policy was never written", which is silent configuration. For a solo owner who will read the
  repository many times and RLS policies approximately never, that is a real advantage.
- **The best per-user recovery in the set.** Restoring one user is one API call touching nobody
  else. In A/A− it is a several-hour procedure (§17, F-13); in B it is a whole-project restore.
- **The best cost curve at scale**, and the most homogeneous runtime (Workers are V8, the same
  family as Chrome and Node).

**Two structural, recurring costs.**

1. **FATAL at scale — the fan-out migration.** 3,000 users means 3,000 independent SQLite
   databases. A schema change means applying the same DDL to all of them, idempotently, with
   retries and progress tracking, under a **30-second maximum query duration**, in a database
   whose `ALTER TABLE` is limited to add-column and rename (anything else is the
   create-new-table/copy/rename dance — a full table rewrite, per shard, inside 30 seconds). There
   is no transaction spanning them. **Partial failure is the normal outcome**, producing a
   heterogeneous fleet with clients arriving at both schema versions. When a fan-out goes wrong,
   the recovery primitive is D1 Time Travel — **destructive, full-database, in place**, cancelling
   in-flight queries, rate-limited to 10 restores per 10 minutes per database. Restoring 3,000
   shards is a multi-hour, rate-limited, hand-written job in which every restored shard loses
   every write since its restore point. In a brief that says *safe migrations dominate*, this is
   the wrong recurring risk, and it is paid on **every** schema change, forever, by one person.
2. **SEVERE — the export path can silently lose numeric fidelity.** Cloudflare's own docs on
   `wrangler d1 export`: numeric values are *"subject to JavaScript's 52-bit precision limit on
   export — potentially causing precision loss for very large integers"*, and virtual tables
   cannot be exported at all. D also forces chemistry values into scaled integers or decimal
   strings, because SQLite has no exact decimal type. **Data lock-in that manifests as silent
   numeric drift is worse than data lock-in that manifests as "no export".** Fixable — export
   decimals as TEXT, keep every identifier a string, verify the round trip with a hash comparison
   in CI — but it must be decided before the first row is written. (**UNRESOLVED:** `sqlite.org`
   was blocked, so "SQLite has no decimal type" and "SQLite's `ALTER TABLE` is limited", though
   long-established, are formally unverified in this corpus, and D's numeric strategy rests on
   them.)

**A third cost that is easy to miss.** The thing that makes D cheap at scale must be built
*before* scale. The shard-per-user commitment is not retrofittable cheaply, and the fan-out
runner must exist before there are enough shards to need it — i.e. the cost is paid at the point
of least revenue and least schema certainty, by an owner migrating a schema he has not yet
validated against a chemistry engine that does not yet exist.

**Verdict on D. SECOND CHOICE — with named triggers, §19.**

---

## 6C. CANDIDATE ARCHITECTURE M — The boring monolith

**Data authority.** Identical to A−. This candidate differs in **runtime shape and operational
topology**, not in who owns the data.

**Runtime shape.** **One** process, on **one** host, serving both the static PWA bundle and the
versioned JSON API, in front of **one** Postgres database, with object storage for blobs. A
managed container or VM (Fly / Render / Railway / a plain box) rather than a split of managed
Postgres vendor + separate API host + separate static host.

**Why it belongs in the set.** The brief says *"operational burden and long-term maintainability
matter more than development speed or novelty"*, with a ten-year horizon and one owner. Against
that brief, **one process, one database, one host, one `pg_dump` to a second vendor** is a serious
contender, and its absence from the original set was a real gap. It is also the shape that best
satisfies the corpus's own strongest operational rule — **three moving parts maximum, one host if
possible** — because splitting the static app and the API across two vendors doubles the billing
relationships, the incident surface and the CORS configuration.

**What it gives up relative to A− on managed Postgres.**

- **Branch-from-a-past-instant.** The single strongest operational feature in the whole comparison
  is a managed Postgres that can branch from a historical instant: it makes migration rehearsal
  and one-user recovery cheap and non-disruptive (extract that user's rows from a branch, merge
  them back as corrective events, production never goes offline). A self-run Postgres gives you
  base backups and WAL, which is *restorable* but not *branchable*, and the recovery runbook is
  materially longer.
- **Patching, upgrades and on-call.** You now own Postgres minor upgrades, disk growth, and
  whatever the host does at 3am.

**Where M and A− meet.** They are the same architecture at different deployment topologies, and
the choice between them is genuinely deferrable **provided** the API is a plain versioned JSON
service with no vendor-specific primitives in the data path (§22, DEF-3). That is a real and
useful piece of optionality; it is why this dossier recommends A− as the *architecture* and treats
"single host vs split managed vendors" as a **hosting decision the owner can make later**.

**Verdict on M. Not a separate recommendation — the preferred *deployment shape* for A− if the
owner values one host over branchable Postgres.** §18 states the tradeoff.

---

## 6D. CANDIDATE ARCHITECTURE E — Conventional cloud-authoritative thin client (baseline)

**Data authority.** Cloud-authoritative. Network required for writes. Minimal offline.

Included to show the space was covered and rejected explicitly, not to pad the count.

**Rejected, and for a better reason than "it isn't offline".** In the garage scenario, "log 7.4
dKH" fails, and the keeper logs it two hours later from memory. That is not a UX cost, it is a
**chemistry-data-quality** cost: K6 and `DATA-PROVENANCE.md` §2 forbid fabricating the time, so
the honest record is `LOCAL_TIME_ZONE_UNKNOWN` or `DATE_ONLY` — **permanently ineligible** for
exact-elapsed-time analysis. Every network-required write systematically degrades the analytical
eligibility of the product's own core data, in a product whose differentiator is the integrity of
that data. It also contradicts DEC-007 and DEC-008 outright.

**Verdict on E. Correctly rejected.**

---

## 7. TRADEOFF MATRIX

Rating key: **++** strong · **+** adequate · **~** mixed / conditional · **−** weak ·
**−−** disqualifying on this axis. Cells are deliberately terse; the reasoning is in the prose
below and the evidence is in §17.

| # | Axis | A | A− | B | C | D | M | E |
|---|---|---|---|---|---|---|---|---|
| 1 | Complexity for a **solo owner using Claude Code** | − two engines to keep in lockstep | **+** one engine, plain TS, LLM-friendly | ~ fast start, SQL/PLpgSQL tail | − blind support model | − distributed-systems reasoning | **+** one repo, one process | ++ but wrong product |
| 2 | Implementation complexity | − largest bespoke surface | ~ large but bounded | ~ outbox + triggers + edge fns | − hand-rolled everything, no order authority | − shard router + fan-out runner | ~ = A− minus vendor glue | ++ |
| 3 | Operational complexity | − API + engine artifacts + dispatcher | ~ three moving parts | − 6 surfaces, 1 bill | −− N un-inspectable clients | − Workers + N shards + R2 + runner | **+** one host, one DB | + |
| 4 | Mobile / PWA quality | ++ | ++ | ++ | ++ | ++ | ++ | −− no install value |
| 5 | Offline quality (capture **and** assessment) | ++ | ++ | ~ queue undesigned, no admission | ++ best, but nothing to sync to | ++ | ++ | −− |
| 6 | **Data integrity** (canon K1–K14) | ++ verified assertions | **+** attested assertions | −− LWW-shaped, no admission tier | −− vendor conflict models violate K1/K7/K13 | + | + | ~ integrity intact, provenance degraded |
| 7 | Sync complexity | − bespoke + verification | ~ bespoke, one protocol | − same outbox, worse rejection path | −− no total order at all | ~ bespoke, per-shard | ~ = A− | ++ none |
| 8 | Multi-device | ++ | ++ | ~ session races, token in JS | −− divergent islands | ++ | ++ | ++ |
| 9 | Security burden | + secrets server-side | + secrets server-side | −− RLS is the only wall | ~ small surface, no recovery | ++ physical partitioning | + | + |
| 10 | Migration complexity (server) | + versioned API absorbs old clients | + same | −− schema **is** the API | ~ no server schema; local one is worse | −− fan-out, no transaction | + | + |
| 11 | Migration complexity (local ledger) | − unrecoverable on-device if wrong | − same, but re-pullable | − same, re-pullable | −− no second copy | − same, re-pullable | − same | ++ trivial |
| 12 | Testing | ~ cross-engine goldens required | **+** goldens + replay only | − PLpgSQL untestable client-side | − nothing reproducible remotely | ~ shard fixtures | + | + |
| 13 | Data longevity (10 yr) | ~ depends on artifact retention | **+** plain SQL + ledger export | + `pg_dump` fine | − CRDT growth / eviction | ~ export can lose precision | ++ plain Postgres you own | + |
| 14 | Vendor lock-in | + low (plain Postgres) | + low | ~ low data, high operational+architectural | ~ licence + sync vendor | − Durable Objects port nowhere | ++ lowest | + |
| 15 | Failure modes | + detected, many refusal states | **+** detected, one fewer detector | −− silent (missing policy, jammed queue) | −− silent and unattributable | ~ loud but distributed | + | ~ silent provenance loss |
| 16 | Backup / recovery | + branchable PG; per-user = hours | + same | − whole-project restore, product offline | −− none | ++ per-user PITR, one call | ~ own base+WAL, no branching | + |
| 17 | Subscription integration | + own entitlement ledger | + same | − entitlement drifts into RLS/JWT | − no server to gate | + | + | + |
| 18 | Optional AI integration | ++ proxy already exists | ++ same | ~ another edge fn runtime | −− no server for the key | ++ streaming-native | ++ | ++ |
| 19 | Future native path | ++ engine is plain TS | ++ same | + | + | ++ | ++ | −− SSR kills Tauri |
| 20 | Likely performance | ++ local reads, no round trip | ++ same | + | ++ | ++ | ++ | − round trip per verdict |
| 21 | Cost trajectory (structural — see §11) | ~ + permanent artifact storage | **+** dominated by audit-record size | ~ egress + PITR add-on | ? no cost story exists | + best at scale, worst at small | + flat and predictable | + |

### 7.1 Reading the matrix

**The matrix does not decide this on its own, and it should not.** Four observations do most of
the work.

1. **Axes 6, 10 and 15 are the ones the brief says dominate** (R15, R16: correctness,
   reproducibility, safe migrations, operational burden). On those three axes B and C are
   disqualifying, D is mixed-to-bad on migration, and A/A−/M are the only survivors. Axes 1–3
   (complexity) then separate A− and M from A.
2. **B's only winning axis is one the brief explicitly deprioritises.** B is fastest to a first
   demo. Every other cell is equal-or-worse than A−, which is the definition of domination.
3. **C wins axis 5 and loses everything that makes axis 5 worth having.** Best offline capture,
   nothing durable to sync to, no reminder delivery, no support visibility, no total order.
4. **D's two ++ cells (9, 16) are real and should not be dismissed.** If per-user
   point-in-time restore ever becomes a *promise* to customers, D's case changes materially. §19
   makes that a named trigger rather than a vibe.

### 7.2 The axis the matrix cannot score: the owner's time

The original candidate set charged D, explicitly and repeatedly, with "build and forever maintain
a fan-out schema-migration runner". That is honest. But A was charged with nothing comparable,
despite requiring the owner to personally build and forever maintain: an API tier; an auth system;
a bespoke append-only sync protocol (outbox, `serverSeq` assignment, cursor pull, idempotent PUT,
rejection quarantine); server-side engine re-execution with permanent artifact retention; a push
dispatcher with VAPID custody and subscription pruning; entitlement issuance plus a daily
reconciliation sweep; an independent cross-vendor encrypted backup with a monthly restore
rehearsal; and a manual iPhone release checklist every release.

**INFERENCE.** The comparison table makes A look cheap because it prices servers, not people. The
honest statement is that **A has the largest bespoke-code surface of any candidate, owned by one
person, with a bus factor of one.** The single most valuable deletion available is server-side
engine re-execution — which is exactly what A− deletes, and is the main reason A− ranks above A
in §18.

### 7.3 A cost variable nobody has measured, which could move several cells

Every cost cell in row 21 rests on an assumed workload of roughly 1,500 events/user/year at **~4 KB
average including the audit JSON**, with the source report itself conceding: *"Change '4 KB per
event' to '40 KB per event' (entirely plausible if the audit record embeds the full cluster set)
and the storage lines go up 10×."* K4 mandates ~35 retained fields **including
available/used/excluded cluster sets and exclusion reasons** — i.e. the audit record embeds
collections, not scalars.

**The backend is being chosen before the dominant cost variable is known.** Closing this is a
morning's work and it is PRE-1 in §21.

---

## 8. OFFLINE / SYNC ANALYSIS

**The instruction not to answer "last write wins" is correct, and the canon independently forbids
it in the place it matters most (K13).** What follows is the per-category rule set. It is written
for A/A−/M/D; where a category behaves differently under B or C that is stated.

### 8.0 The two orders — conflating them is a defect

There are **two** orders and they must be different fields with different types:

- **Analytical order**, used by the engines. Keyed on `occurredAt` — the physical time of the
  real-world act — with canon §2.4's domain precedence at identical timestamps (pre-event
  measurement → intervention → post-event measurement; otherwise preserve order metadata and
  **mark ambiguity**). Canon §2.4 forbids assuming a pre/post relation the record does not
  establish; §70.4 says corrupt ordering ⇒ refuse.
- **Replication order**, used for convergence, cursors, hashing and dedupe. Keyed on a
  server-assigned dense monotonic `serverSeq` that the engines never see.

**RECOMMENDATION.** Never use replication order as physical time; never use `occurredAt` as the
replication cursor. A **backdated measurement** — canon §71 edge case 31 — is precisely an event
whose analytical position is early and whose replication position is late. The design must make
that a normal expressible case, not an anomaly.

**Three times per event, never collapsed:**

| Field | Meaning | Who may read it |
|---|---|---|
| `occurredAt` + `timePrecision` + `tzId` + `offsetMinutes` + the local wall-clock string the user saw | When it happened, user-asserted | **Engines only** |
| `recordedAt` + `deviceId` + `clockTrust` | When it was captured on a device | Diagnostics, never presented as `occurredAt` |
| `receivedAt` + `serverSeq` | When the server took durable custody | **Replication cursors only** |

**Hard rule (from K6's forbidden list).** The server's `receivedAt` may **never** be substituted
for a missing `occurredAt`. If `occurredAt` is unknown it stays unknown, with the appropriate
precision class, and exact-elapsed-time analyses refuse.

### 8.1 Per-category conflict rules

#### (a) Append-only observation events (measurements, doses, water changes, equipment, potency context)

**Rule: union by immutable client-generated `eventId`. Never merge, never LWW. Never delete.**

Two devices appending different events are not in conflict — "I tested at 09:00 and got 8.4 dKH"
and "I dosed 6 mL at 09:05" are both true. Union is commutative, associative and idempotent, so it
converges with no coordination. **This is already a grow-only-set CRDT; no CRDT library is needed
to obtain it.**

The real risk is **duplication, not conflict** — see (i).

*Where the user must resolve:* nowhere, for storage. But see K13 in (d): a maintenance-dose event
carries **interval semantics** ("from `effectiveFrom` the running dose is X"), and two such
appends with overlapping validity and different X are a contradiction in the physical world. The
union is still the correct storage result; the **derived dosing state** must go invalid and ask.

#### (b) Amendments and supersessions of an existing event

**Rule: causal parent pointer. Concurrent divergent amendments become `CONTESTED` and are not
analytically eligible. The user resolves.**

K7 permits no overwrite: `rawValue` is preserved, measurement events carry an edit audit, and
`SUPERSEDED` exists precisely so product behaviour can replace an earlier record *while retaining
it*. Therefore an "edit" is itself an append:
`AmendmentEvent { targetEventId, field, oldValue, newValue, reason, basedOnVersion }`.

- Every amendment carries `basedOnVersion` — the version identifier of the record state the
  editing device actually saw (a git-style parent pointer).
- If B's `basedOnVersion` is A or a descendant, B is causally later ⇒ B wins automatically, A
  retained. This is *sequential editing*, not conflict.
- If two amendments to the **same field** share a `basedOnVersion`, neither is an ancestor of the
  other, and their `newValue`s differ, the record is **`CONTESTED`**.
- A `CONTESTED` measurement is **not analytically eligible** — engines refuse dependent analyses
  with an explicit reason code — but stays fully visible in history and charts. That asymmetry is
  exactly D5's "display more than you reason over".
- **USER RESOLVES.** The resolution is itself an appended amendment naming both parents. Nothing
  is discarded.

*Why not LWW:* the two values are two different claims about what the test kit read. Choosing by
whichever device had the later clock chooses by an irrelevant variable, and the losing value
silently disappears from the analytical path. A mistyped 8.4→18.4 corrected two different ways can
drive a dose recommendation. **Cost of asking: one prompt. Cost of guessing: a wrong dose.**

*Why parent pointers rather than version vectors:* a single `basedOnVersion` gives exactly the
discrimination needed — "did this editor see that edit?" — at constant size, because amendments
form a per-record DAG and ancestry is computable from it. Version vectors grow with device count
and must be garbage-collected.

#### (c) Validity-state changes (`VALID / SUSPECT / INVALID / SUPERSEDED`)

**Rule: a safety-biased *join* over a small lattice, not LWW. Un-flagging requires causal
knowledge.**

| Concurrent pair | Result |
|---|---|
| `VALID` vs `SUSPECT` | **SUSPECT** |
| `VALID` vs `INVALID` | **INVALID** |
| `SUSPECT` vs `INVALID` | **INVALID** |
| flag vs un-flag | **the flag wins**, unless the un-flag causally follows the flag (its `basedOnVersion` is the flagging assertion) |

*Why:* these states exist to keep bad data out of dosing decisions, and the two error directions
are **not symmetric**. Wrongly excluding a good reading costs an unnecessary retest; wrongly
including a bad one costs a wrong dose. LWW is symmetric and therefore wrong here. **"You may only
clear a flag you have seen"** turns un-flagging into a deliberate, informed act rather than an
accident of sync ordering.

`SUPERSEDED` is different — it is a *relationship*, not a flag. Two devices superseding the same
record with **different** replacements is a genuine contradiction ⇒ `CONTESTED` ⇒ **USER
RESOLVES**, both replacements retained. Note canon §4.4's warning that a differing repeat test
should normally **not** supersede but form a measurement cluster, so supersession should be rare
and deliberate, making the cost of asking negligible.

#### (d) Effective-dated configuration (target range, product, potency calibration, dose schedule, net volume, pump resolution)

**Rule: NO automatic resolution. This is the one place the canon has already decided.**

- Config versions are **append-only records**, exactly like events. Union on merge. Never
  overwrite, never delete. (K2.)
- Resolution at instant *T* for field *F* = the version with the greatest `effectiveFrom ≤ T`
  among versions touching *F*.
- If two or more versions touch *F*, set **different** values, have **equal** `effectiveFrom`, and
  are **concurrent**, the config is **`CONFIGURATION_CONTESTED`** for that field over that
  interval. The engine returns `NOT_RUN` / dosing-state-invalid, and the coordinator surfaces a
  reconciliation prompt naming both values, both devices and both times. **This is canon §70.5
  (K13), essentially verbatim.**
- **USER RESOLVES.** The resolution is a **new config version** whose `basedOnVersion` names both
  contested parents. History still shows that the ambiguity existed — which is exactly K5.
- **A subtle second case (RECOMMENDATION, not canon — see X6).** Device A sets dose 8 effective
  09:00; device B, offline and unaware, sets dose 6 effective 10:00. "Latest `effectiveFrom` wins"
  is arguably right, but B never intended to *follow* A — B believed it was changing from the
  previous dose. When a newly-arrived config version's `basedOnVersion` is **not** an ancestor of
  the currently-resolved version for that field, mark it `UNREVIEWED` and require a one-tap
  confirmation before it becomes effective **for dosing purposes**. Reads, history and charts are
  unaffected.

*Why LWW here is not merely suboptimal but unsafe:* LWW picks by clock. If one device's clock is
90 seconds fast, the *older* human decision wins; if it is a year off, it wins forever. 12 mL/day
versus 6 mL/day of a carbonate supplement is the difference between a controlled correction and an
alkalinity spike in a live reef. **There is no tie-break rule available to the system that is
correlated with which value the keeper actually intends.** Asking is the only defensible
behaviour.

*Candidate delta:* under **B**, the natural BaaS shape is a `tank_config` row updated in place —
two `UPDATE`s, second wins by arrival. Under **C**, PowerSync's documented per-field LWW or
Automerge's arbitrary map-conflict resolution applies. Both are silent, and the failure is
*physical*: the tank gets the dose nobody chose.

#### (e) Task / reminder state

Split into two things that behave differently:

- **Completion is an observation.** `TaskCompletionEvent { taskId, occurrenceId, completedAt,
  deviceId }`, append-only. Two devices completing the same occurrence is a **duplicate, not a
  conflict** — dedupe on `(taskId, occurrenceId)`. Completion is monotone. Un-completing is a
  distinct retraction event carrying `basedOnVersion` (same "you may only undo what you have
  seen" rule as (c)).
- **Snooze / dismiss / notification-read state** has no safety consequence and no historical
  value. **Treat as device-local; do not sync at all, or sync LWW as a best-effort convenience.
  This is the one place in the entire design where LWW is genuinely appropriate**, because losing
  the write costs the user a redundant notification and nothing else.

#### (f) Derived assessments and audit records

**This is the sharpest distinction in the design, and it is not where it first appears.**

- **Current derived view** (present position, current trend, today's recommendation, retest
  times, coordinator plan): **DO NOT SYNC. RECOMPUTE from the ledger on each device.** Syncing it
  creates a second source of truth that can disagree with the ledger.
- **An assessment that was actually displayed and could have been acted upon is NOT derived
  state. It is a historical fact**, it is *not* recomputable, and it must be persisted as an
  immutable append-only audit event and synced like any other observation.

**The trap this exposes.** Device A, offline, holds 6 measurements and displays a recommendation.
Device B holds 7. Later they converge. If the audit record pins only `asOf` + engine/canon
version, replaying it against the *converged* ledger yields a **different** result — the product
has silently rewritten what it said, violating K5 and canon §46 directly, **through ordinary
multi-device use.**

**Rule:** every audit record pins `inputEventIds`, `ledgerPrefixSeq` + a hash over the ordered
event ids actually considered, `configVersionIds`, `engineVersion`, `canonVersion`,
`upcasterChainVersion`, and `computedOnDeviceId`. **Nearly free now; effectively impossible
later.**

**Conflict rule:** two devices producing different assessments concurrently is **not a conflict**
— it is two true historical records. **Never dedupe or merge them.** Union, both retained, both
replayable.

*Candidate delta:* in **C** there is no server-assigned prefix position at all, so
`ledgerPrefixSeq` has no meaning and the pin degrades to a content hash with no total order behind
it. That is why C is the hardest place to make this guarantee real.

#### (g) User profile, subscription entitlement

**Server-authoritative by necessity.** The client cannot be trusted to assert plan state and there
is no meaningful offline write. Server is truth; client holds a **short-lived signed entitlement
token** with a bounded offline grace period (§11.4).

**Product invariant (RECOMMENDATION, and it is a safety statement, not a UX one):** entitlement
gates **sync and server-side features**, never **local read and local write of the user's own tank
data**. A keeper standing at a tank with a lapsed card must still be able to log a test and read
their history.

#### (h) Binary attachments (ICP PDFs, test photos, label photos)

**Content-addressed by cryptographic hash. Immutable by construction, therefore conflict-free by
construction** — two devices uploading the same file produce the same address. The referencing
event stores the hash; the blob syncs on a separate, resumable, lower-priority channel. Blobs are
**evictable from the local cache** while the referencing event is not; a missing blob is a "not
downloaded" state, never an integrity failure. Deleting a blob retracts the *attachment*, never
the event. **Present blob quota separately from ledger quota, because blobs are the only safely
prunable thing.**

#### (i) Duplicate events — two different problems, two different defences

**Layer 1 — transport duplicates. Solvable.** The client generates `eventId` (ULID) **at the
moment of user capture**, before any network attempt, and stores it in the durable outbox. It is
the idempotency key. The upload endpoint is `PUT`-shaped on `eventId`. Re-delivering the same
`eventId` returns the original result and creates no second row. **Exactly-once *delivery* is not
achievable; exactly-once *effect* is.** Say it that way in the protocol spec.

**Layer 2 — human/semantic duplicates. NOT solvable by idempotency keys, and must not be
auto-resolved.** The keeper doses 8 mL and logs it on the phone; the spouse logs the same 8 mL on
the iPad. Two distinct `eventId`s, two genuine user assertions, one physical dose. A double-counted
dose inflates apparent delivery, deflates apparent consumption and drives the maintenance dose the
wrong way — the exact class of error the canon's refusal posture exists to prevent — and because
the ledger is append-only you cannot fix it by deleting one.

**Rule:** detect and ask. A near-duplicate detector raises `POSSIBLE_DUPLICATE` on the later
event; analyses that would double-count it (consumption inference, potency learning,
dose-response reconstruction) **refuse** until answered; position and trend, which do not consume
dose events, are unaffected. **USER RESOLVES**, and the answer is appended as an assertion
(`CONFIRMED_DISTINCT` / `RETRACTED_AS_DUPLICATE`) with both events retained.

**UNRESOLVED (§24, Q6).** The detection window and criteria are an open chemistry/product
question with no owner. Canon §5.3's 30-minute measurement-cluster window is explicitly a
data-model convenience, **not** a chemistry threshold, and must not be borrowed for this.

### 8.2 Where the user must resolve — the complete list

Everything else in §8.1 resolves deterministically without asking. These do not, and each needs
designed copy or it becomes a support ticket:

| State | Trigger | What refuses |
|---|---|---|
| `CONTESTED` (amendment) | Concurrent divergent amendments to the same field | Analyses depending on that measurement |
| `CONTESTED` (supersession) | Two different replacements for one record | As above |
| `CONFIGURATION_CONTESTED` | K13 — two mutually exclusive currently-effective doses | Dosing state invalid; `NOT_RUN` |
| `UNREVIEWED` config | New config version whose parent is not an ancestor of the resolved value | Nothing reads-side; dosing effect gated on one tap |
| `POSSIBLE_DUPLICATE` | Semantic near-duplicate dose | Consumption inference, potency learning, dose-response |
| `REJECTED` event | Server admission refused the event | That event only; stays in the outbox, visible and exportable |
| `UNKNOWN_EVENT_IN_ANALYSIS_WINDOW` | Old client sees an event type it does not understand (K14) | Analyses whose window contains it |
| `TIME_UNCONFIRMED` | Device clock skew detected at admission on an event whose `occurredAt` was defaulted from that clock | Exact-elapsed-time analyses until confirmed |

**INFERENCE — and this is the honest cost of A/A−.** Every one of these is a support
conversation, and A− has the most of them **because it is the only shape that detects them**.
That is the right trade — detected problems are cheaper than undetected ones — but it must be
budgeted as support capacity, and each state needs excellent self-serve copy or it becomes a
ticket.

### 8.3 The offline realities that bind every candidate

**On iOS there is no Background Sync.** The outbox drains only while the app is open and
foregrounded. The keeper queues three events in the garage, pockets the phone, walks into wifi,
and does not open the app for nine days: nothing syncs. And you **cannot** fix this with a silent
push wake-up — **FACT**, Apple's own documentation: *"Safari doesn't support invisible push
notifications… If you don't [present it], Safari revokes the push notification permission for your
site."* The one mechanism that could drain the outbox from outside costs a user-visible
notification every time, or the permission.

**Not technically fixable. Behaviourally mitigable, and every candidate must build this:**

- aggressive drain on `visibilitychange → visible` and on `online`;
- an honest **per-event** badge: "on this device" vs "confirmed on server";
- a loud, non-dismissible banner when the outbox has been non-empty for more than N hours;
- **an "export outbox to a file" path that works even if the app shell is assumed compromised**
  (a separate minimal page, not the app) — this doubles as the incident-response tool in §10.7.

**C is hit worst**, because there the unsynced state is not a lag, it is the system of record.

**Quota exhaustion must fail loudly on the ledger path.** `QuotaExceededError` detection must be
by `err.name` (the typed subclass with `.quota`/`.requested` is recent-Chrome-only). **Hard-fail
the UI action on a ledger-write quota error**; degrade silently only on cache/projection writes;
keep blobs out of the ledger store entirely.

**A shipping Safari defect will eat readings today.** **FACT**, Apple's Safari 27.0 **beta**
release notes list as *resolved*: *"Fixed an issue where the `change` event was not fired on
`<input>` and `<textarea>` elements when they lost focus while another application was in the
foreground."* Fixed in beta ⇒ **present in all shipping Safari 26.x**, i.e. every iPhone in the
field. The keeper types `7.4`, a call comes in, iOS terminates the app, `change` never fires. The
reading is gone — and if re-entered later its capture instant is a reconstruction, which under
`DATA-PROVENANCE.md` §2 must not be fabricated, so the record is **degraded in precision class
forever**. Mitigation: persist drafts on `input` (debounced) to IndexedDB, flush on
`visibilitychange → hidden` and `pagehide`, never rely on `change` or `beforeunload`, and **a
resumed draft must carry the original capture instant, not the resume instant**.

---

## 9. DATA MODEL / EVENT-HISTORY IMPLICATIONS

### 9.1 The shape the canon already dictates

K1, K2, K7, K8 and K12 together describe a system that is not a CRUD application with an audit
log bolted on. It is an **append-only event ledger with rebuildable projections**, plus a
**second** append-only stream of derived assessments, plus a **bitemporal** configuration stream.
Three write paths, one of which (the ledger) is the only source of truth.

```
                 ┌──────────────────────────────────────────┐
                 │  EVENT LEDGER (append-only, immutable)   │  ← the only source of truth
                 │  7 event families + amendments +         │
                 │  validity assertions + config versions   │
                 └───────────────┬──────────────────────────┘
                                 │ replay (pure, ordered, asOf-injected)
                 ┌───────────────▼──────────────────────────┐
                 │  @app/engine  (pure, zero-dependency)    │
                 │  clusters · segments · slope · potency   │
                 │  safety · retest scheduler · coordinator │
                 └───────┬───────────────────────┬──────────┘
                         │                       │
     ┌───────────────────▼──────┐   ┌────────────▼─────────────────────┐
     │ PROJECTIONS (disposable) │   │ AUDIT RECORDS (append-only)      │
     │ charts, lists, current   │   │ "what the app said then", pinned │
     │ state — DROP & REBUILD   │   │ to its exact input set           │
     └──────────────────────────┘   └──────────────────────────────────┘
```

**The single most important structural rule:** projections are **disposable and rebuildable**;
the ledger and the audit records are **not**. Every migration question in §13.6 resolves from
that one distinction.

### 9.2 Field-level requirements that must exist from day one

These are cheap now and effectively unrecoverable later. Track 5's finding is the right frame:
**if these exist from day one, sync becomes an additive capability rather than a rewrite.**

| # | Property | Why | Recoverable later? |
|---|---|---|---|
| 1 | Client-generated immutable `eventId` (ULID), created at capture before any network attempt | Idempotency key; dedupe key; union key (§8.1a) | No |
| 2 | `deviceId` + `schemaVersion` + `payloadVersion` on every event | Schema evolution, upcasting, skew diagnosis | No |
| 3 | Three times, never collapsed: `occurredAt` (+ `timePrecision` enum + `tzId` + `offsetMinutes` + the local wall string the user saw), `recordedAt` (+ `clockTrust`), `receivedAt` (+ `serverSeq`) | K6, D5, §8.0 | No |
| 4 | `basedOnVersion` on every amendment, validity assertion and config version | Concurrency **detection** (§8.1b–d). Without it, contested states are undetectable | No |
| 5 | Audit records pin `inputEventIds` + `ledgerPrefixSeq` + `ledgerPrefixHash` + `configVersionIds` + `engineVersion` + `canonVersion` + `upcasterChainVersion` + `computedOnDeviceId` | K4, K5, §8.1f. Without it, ordinary multi-device use rewrites history | No |
| 6 | Nothing is ever mutated in place — including config, task state and aggregates | K1, K2 | No |
| 7 | Unknown fields and unknown event types preserved **verbatim** | K14, §12.4 | No |
| 8 | The authenticating **session/device stamped on every event at admission** | The only way a compromise window can later be identified as a batch (§10.7). **Unrecoverable if omitted** | No |
| 9 | `rawValue` stored as the **string the user actually typed**, alongside the parsed number | K7 ("never overwrite the original with a rounded display value"); survives JSON/structured-clone round trips and a future store migration | No |
| 10 | Opaque `userId` / `tankId` in the ledger; **all personal data, free text and blobs in a separate mutable store referenced by id, never embedded** | Makes erasure a deletion of the identity mapping rather than surgery on the ledger (§10.5). **Not retrofittable once users have written free text into event payloads** | No |

### 9.3 Time is a tagged union, not a nullable column

**K6 and D5 make a single `timestamp` column a canon violation.** The representation must make
"date-only" and "absolute instant" **different types**, and "no proven absolute instant" a
first-class state:

```
ObservedAt =
  | { kind: "instant";  epochMs; tzId; offsetMinutes; precision: "second" }
  | { kind: "dateOnly"; isoDate: "YYYY-MM-DD"; tzId: string | null }
  | { kind: "unknown";  knownBeforeInstantMs?; knownAfterInstantMs? }
```

`kind` is part of the data, not a nullability convention. An engine requiring an instant
**refuses** on `dateOnly` and `unknown`. Elapsed time is computed only from `epochMs` deltas in
seconds. Retaining `tzId` alongside the instant is what lets the app re-render "the evening of the
4th" correctly after the keeper moves timezone, **without the instant ever changing**.

This is also the shape that makes DEC-010 mechanical rather than aspirational: 325 of 336 of the
owner's real V1 readings have no time at all, and V1 fabricated midday for them and fed it to a
regression. In V2 those records are `kind: "dateOnly"` and the regression **cannot** consume them.

### 9.4 Store the audit record. Do not rely on reconstruction

K4 permits *persisted **or** deterministically reconstructable*. **RECOMMENDATION: persist.**

Reconstruction requires **six** things to hold simultaneously, a decade later: the exact ledger
prefix that device could see; the exact engine artifact; the exact canon version; the exact
**upcaster chain**; a compatible JS engine; and no intervening bug fix in any of them. Every one
decays. Reconstruction is not a storage optimisation — it is a promise to keep six independent
things frozen for ten years, and the first time any of them slips, "what the app said then"
becomes unanswerable **silently**, because the reconstruction still returns a number.

**Storage is a fixed, boundable cost. Reconstruction is an unbounded one.**

### 9.5 The upcaster problem, which nobody in the corpus named

Read-time upcasting (`v1→v2→…→current` pure functions over stored payloads, never written back)
is the correct migration discipline for an append-only ledger. **But upcasters are inside the
determinism boundary.** A replay of a 2027 assessment performed in 2031 runs the *2031* upcaster
chain over the stored 2027 payload. A bug or a behavioural change in any upcaster silently changes
what history says the app said — violating K5 through a path nothing in the corpus names.

**Rule:** pin `upcasterChainVersion` in the audit record alongside engine and canon version, and
**freeze each upcaster the moment it ships**, with its own goldens. They accumulate forever; that
is the price of never rewriting a stored payload, and it is the cheaper side of that trade.

### 9.6 Two read paths, because D5 requires it

- **Display path** — permissive. Shows everything, including `SUSPECT`, `INVALID`, `CONTESTED`,
  date-only and context-incomplete records, each visibly labelled.
- **Analytical path** — strict. Eligibility is **computed and explainable by the engine**, never a
  `WHERE` clause and never a stored boolean. If eligibility is ever persisted as a flag it will
  drift from the engine's judgement and the explanation will stop matching the behaviour.

**This doubling is a real implementation cost that no candidate description accounted for**, and
it is architecture-neutral: every candidate pays it.

### 9.7 Numeric representation

- **Server:** Postgres `numeric` for chemistry values; `jsonb` for audit payloads. Exact decimal,
  hard CHECK constraints, and range types with exclusion constraints for effective-dated config
  are the reasons Postgres is the right data model for this domain. (D forces scaled integers or
  decimal strings instead — §6B.)
- **Client:** store the raw typed string plus the parsed number. Never round at the save site
  (V1 did — `DoseChangeSheet.jsx:90` — and display rounding entered stored values, violating K6
  §2.3).
- **Engine:** binary64 is *sufficient* given §3.4, provided accumulation order is fixed. **If** a
  fixed-point/decimal representation is later judged necessary for threshold comparisons, it must
  be **vendored into the engine package** (the zero-dependency rule) and its version stamped into
  every audit record as a replay input. **Decide this explicitly (§21, PRE-5); do not leave it to
  be discovered during implementation.** Note the corpus contains a direct contradiction here —
  "`@app/engine` has zero runtime dependencies" and "use a decimal library for threshold
  comparisons" are incompatible as stated.

### 9.8 Ordering determinism is a hard architectural rule, not a style preference

Floating-point addition is **not associative**. Summing a dose history in ledger order and in
database-return order gives different numbers, and near a threshold, different verdicts —
non-reproducibly, with no error. Postgres returns rows in **unspecified** order without `ORDER BY`.

**Rules:** every query feeding the engine carries an explicit `ORDER BY` on a total-order key; the
engine sorts every collection on `(primaryKey, eventId)` before consuming it; every sum is over an
explicitly sorted sequence. **And a property test that shuffles equal-timestamp events and asserts
the result is unchanged** — which is simultaneously the mechanical test of K6 §2.4's ordering rule.

---

## 10. AUTH / SECURITY

### 10.1 Session model

**RECOMMENDATION: `Secure; HttpOnly; SameSite=Lax` cookie sessions, not a bearer token in
JS-reachable storage.** Three independent reasons, all of them specific to this product:

1. **FACT (Apple, WWDC23 s10120):** when a site is added to the iOS Home Screen, **cookies are
   copied at creation time; after creation, cookies and storage are separate.** IndexedDB is
   **not** copied. A cookie session therefore survives the install transition; a token in
   `localStorage` does not — **installing the app logs the user out.** If the app then runs the
   near-universal `SIGNED_OUT → clear local database` handler, the Safari-side outbox is destroyed
   on the way past.
2. XSS with an `HttpOnly` cookie is same-origin request forgery; XSS with a bearer token in JS is
   full account takeover across every device.
3. Refresh-token reuse detection races. A user with the app on the Home Screen **and** open in a
   Safari tab has two contexts that will race a refresh; tripping reuse detection signs out every
   device.

**Three rules that follow, and they are absolute:**

- **Never clear local data on sign-out.** Ever. In an audit ledger that is destruction of primary
  evidence, and it is silent.
- **Never gate local reads or writes on auth.** Partition the outbox by `userId`.
- **Treat 401 as "needs re-auth", never as "signed out".** Single-flight refresh lock across tabs
  and the service worker.

### 10.2 Isolation model

| Candidate | Isolation primitive | Failure mode |
|---|---|---|
| A / A− / M | Application-layer authorization in the API tier, in TypeScript, unit-testable, sharing types with the engine | A missing check — a code bug you can test for |
| D | **Physical** partitioning: one database/Durable Object per user | "Resolved the wrong shard id" — a code bug that fails loudly |
| B | RLS predicates only | **"A policy was never written"** — silent configuration, no error, no log entry |

**RECOMMENDATION.** Use `REVOKE UPDATE, DELETE` on the ledger tables **in every Postgres-based
candidate, including A−**. It genuinely enforces append-only at the privilege level and costs
nothing. But do not mistake it for admission control: the canon's real invariants are semantic
(§5) and belong in typed application code.

### 10.3 Secrets

The following must never reach a client bundle: AI provider key; payment secret key and webhook
signing secret; service-role/DB credentials; SMTP credentials; **VAPID private key**; any
ledger-signing key; write-scoped object-storage credentials.

**A CI step that greps the built bundle for known secret patterns and fails the build is ten lines
and belongs in week one.** Vite inlines every `import.meta.env.VITE_*` at build time; this is the
single easiest catastrophic mistake to make and the single cheapest to prevent.

### 10.4 Two one-way doors that must be decided before the first user

1. **The passkey Relying Party ID.** Passkeys are bound to the RP ID. Launch on
   `app.dosingwizard.com`, later want `dosingwizard.com`, and **every enrolled passkey dies.**
   Related Origin Requests mitigate on some platforms only. Note the live tension: the frontend
   research recommends splitting the marketing site and the app onto separate origins (which is
   right for manifest `scope` and for stopping a marketing page being installable), and that
   choice **is** the RP-ID choice. Decide them together (§21, PRE-6).
2. **The VAPID private key.** Rotating it invalidates **every** existing push subscription. It is
   a permanent secret that must be backed up out-of-band; losing it means every user must re-grant
   notification permission — which on iOS may require deleting and re-adding the Home Screen app.

**UNRESOLVED (§24, Q8).** The passkey device-support matrix is **in dispute inside the corpus**:
one report quotes it as FACT with a file path, the verification worker says it was **not**
retrieved and that its numbers must not be cited. The load-bearing claim — whether a major desktop
platform lacks synced passkeys — drives the entire account-recovery design. **Do not design
passkey-only recovery until this is re-verified on an unrestricted network.**

### 10.5 Erasure versus an immutable ledger

**RECOMMENDATION: pseudonymise by construction, and make it a day-one schema discipline.**
Opaque `userId`/`tankId` in the ledger; all personal data, free text and blobs in a separate
mutable store referenced by id, never embedded. Erasure then deletes the identity mapping and the
personal-data store, and the ledger — which contains no personal data — is unaffected. This is
also why §9.2 item 10 is on the unrecoverable list: **it is not retrofittable once users have
written free-text notes into event payloads.**

Note X4: K7 is a measurement-lifecycle rule, not a prohibition on honouring an erasure request.
The corpus manufactured a conflict here that does not exist.

**UNRESOLVED (§24, Q9).** The **legal sufficiency** of pseudonymisation-by-construction is not
established. The GDPR text was never fetched; the research is explicit that it is not legal
advice. This needs a lawyer, not an architect.

Note also, as a warning against the client-direct pattern: Supabase's own docs prescribe FK
references to `auth.users` with `on delete cascade`, note that you **cannot** delete a user who
owns Storage objects, and state that deleting a *project* *"permanently removes all associated
data, including any backups stored in S3. This action is irreversible."* One-click account deletion
in that model is a cascade that physically removes ledger rows; one-click project deletion is total
unrecoverable product loss.

### 10.6 iOS platform risk, stated at its true strength

This is where the corpus is thinnest and where two reports **contradict each other about whether
the claims are established at all**. The honest position:

| Claim | Status |
|---|---|
| Home Screen web apps are exempt from script-writable-storage eviction | **No Apple documentation exists, anywhere.** `developer.apple.com` has nothing; `support.apple.com` was blocked. The mechanism *was* verified from WebKit engine source (`persist()` succeeds only for origins on `domainsExemptFromWebsiteDataDeletion`; the set is `appBound ∪ managed ∪ persisted ∪ standaloneApplicationDomain`) — **but `standaloneApplicationDomain` is left empty in the open-source tree and populated by the embedder, and Apple's embedder is closed.** There is no Apple statement you could put in a risk register. |
| `navigator.storage.persist()` confers durability on WebKit for a normal origin | **Not established.** Per the engine-source read, a normal website cannot earn it at all. |
| The eviction window is 7 days / 30 operating days | **Not established.** Both numbers are open-source ITP defaults about *operating days*, unconfirmed against shipping Safari. Treat 7 operating days as the floor you must survive. |
| Storage survives deleting the Home Screen app | **No statement, no spec requirement. Assume removal destroys it.** |
| When iOS terminates a backgrounded web app, and whether it restores from bfcache or reloads | **No Apple documentation.** Design as if termination happens at any moment with no callback. |
| Push subscriptions survive re-install or prolonged inactivity | **Apple's push documentation does not address deletion, re-install, expiry or renewal.** Treat subscription loss as **normal**, not exceptional. |

**INFERENCE — the architectural consequence, and it is the whole argument for a server.** For
A/A−/D/M the cloud is the second copy and Home Screen install is an *optimisation*. For C it is
the entire durability story. **This is a risk argument, not a canon derivation** (X1), and it is
strong enough on its own.

**Also note (from `verify-a`, and it is genuinely useful):** WebKit's IndexedDB was still shipping
correctness and liveness fixes five months ago — Safari 26.4 fixed *"IndexedDB databases with
mismatched metadata version and database name encoding format"*, and Safari 27 beta fixes three
more including transactions blocked for extended periods and worker connections failing to recover
after a network-process crash. **Keep a hash-chain integrity check over the local ledger and
re-hydrate from the server on mismatch — never "start fresh".**

### 10.7 The threat nobody in the corpus addressed: XSS forging events into the outbox

One XSS on the origin — a dependency compromise, a markdown renderer, a chart library. The script
does not need to steal a token; it is already same-origin. It writes 500 fabricated dose and
measurement events into the durable outbox with well-formed client-generated ULIDs. They drain
normally, pass every idempotency check, get `serverSeq` assigned, and become part of an immutable
ledger. **K1 and K7 then protect the attacker**, because nothing may be deleted.

**RECOMMENDATION — cheap now, expensive after the incident:**

- A first-class **`QUARANTINE` / bulk-supersession event** carrying a reason code and an
  **admission-batch identifier**, so a compromise window can be marked analytically ineligible
  without deleting anything and without silently rewriting history.
- **Stamp every admitted event with the authenticating session/device** (§9.2 item 8) so a batch
  is identifiable at all. This field is unrecoverable if omitted.
- A **versioned kill-switch endpoint** the service worker checks on every `activate`, plus the
  standalone outbox-export page from §8.3. `Clear-Site-Data` wipes IndexedDB: **your incident
  response tool is also your data-destruction tool**, and it destroys precisely the unsynced
  outbox that has no other copy. Never run it while the outbox is non-empty without exporting
  first.

**Candidate delta.** B is worst: the bearer token is in JS-reachable storage by construction, so
XSS is also full account takeover. A/A−/D/M with `HttpOnly` cookies stop exfiltration but not
same-origin request forgery. C is worst for *recovery*: with no server copy there is no clean
prefix to compare against.

### 10.8 Offline entitlement tokens are forgeable-by-clock, and that is acceptable

The signed short-lived entitlement token is the right pattern. It is defeatable by setting the
device clock back, mitigated (not solved) by storing a monotonic "highest server time ever
observed". Residual risk is bounded to one token lifetime for a determined user.

**RECOMMENDATION: do not try to fix it further.** Every additional hardening step costs offline
reliability, which is the product's actual requirement. Gate only what is *server-side and
costly*. Treat client-side gating as cosmetic and do not spend effort obfuscating it.

---

## 11. COMMERCIAL / BILLING

### 11.0 Why this section contains no prices

**Every vendor pricing page in this research was blocked by the session's egress policy** —
Stripe, every merchant-of-record, Supabase, Neon, Firebase, Cloudflare's live pricing page, and
every local-first sync vendor. Two secondary summaries **disagreed** on whether one provider's
billing surcharge is tiered or flat, which at a low monthly price point is not a rounding error.
One vendor's figures were hallucinated outright by a summarising tool from an empty response.

**Therefore: no absolute figure appears in this dossier, and none should appear in a decision
record until PRE-3 (§21) is done.** What follows is the structural analysis, which is the part
that is actually decision-relevant and which does not depend on the numbers.

### 11.1 What actually drives cost, ranked

| Rank | Driver | Scales with | Notes |
|---|---|---|---|
| 1 | **The owner's time** | Bespoke surface area, permanently | Dwarfs infrastructure at every scale contemplated here. §7.2. |
| 2 | **Audit-record size × event rate × retention** | Users × years | The dominant *infrastructure* variable, currently a guess with a stated **10× uncertainty** (§7.3). Drives storage, sync payload, mobile bandwidth, IndexedDB quota pressure and export size simultaneously. |
| 3 | **Payment processing** | Revenue | At a low monthly price, the **fixed per-transaction component** is the dominant term, not the percentage. Annual billing materially changes this by reducing transaction count. |
| 4 | **Point-in-time-recovery / backup add-ons** | Flat per month | The one line item the research says can **invert** the ranking between managed-Postgres options. |
| 5 | **Egress** | Client behaviour, not user count | A naive client version that re-fetches full history on every app open burns egress across the whole fleet. In B this cannot be rate-limited per query shape without a proxy. |
| 6 | Compute | Requests | Negligible at every scale contemplated. This product is storage-and-correctness-bound, not compute-bound. |

### 11.2 How each candidate's cost behaves at four scales — structurally

| Scale | A / A− / M | B | C | D |
|---|---|---|---|---|
| Personal (1 user) | Small flat floor: one DB + one app host. Dominated by the floor, not by usage | Lowest floor if a free tier is used — but a free tier here means **no automated backups** and a project that pauses after inactivity | Nearly zero infra, **no cost story exists in the corpus** — every vendor price unobtainable | Lowest floor (generous request-based free tiers), but the shard runner must already exist |
| 100 users | Still floor-dominated. Predictable | Floor + MAU-based auth pricing begins to bite | Same as personal, plus a sync-vendor licence review | Still floor-dominated; per-user shards are cheap |
| 1,000 users | Storage begins to matter; **audit-record size decides whether this is noise or the dominant line** | Egress and MAU both matter; PITR add-on is mandatory from the first paying customer | Not applicable — C does not reach 1,000 paying users without becoming A− | Cheapest of the set; per-user isolation and free egress compound |
| 10,000 users | Storage-dominated; a per-GB-month difference between managed-Postgres options becomes the biggest single number | Egress + storage overage; the migration campaign cost is now the real expense | n/a | Cheapest, **provided** the fan-out migration runner is mature. Within D, the D1-vs-Durable-Object sub-choice flips on audit-record size |

**INFERENCE.** Two conclusions survive the missing numbers:

1. **"Cheapest at scale" (D) and "cheapest to start" (B) are both narrative, not arithmetic**, and
   both rest on the unmeasured audit record. Treat each as a **risk**, not a neutral gap.
2. **The floor matters more than the slope for years.** At the scales this product will plausibly
   see in its first 24 months, all candidates' infrastructure bills are small compared to one
   person's time. That is an argument for the shape that minimises bespoke work and operational
   surface, not the shape with the best asymptotic curve.

### 11.3 Entitlement architecture

**Three layers, each explicitly named:**

1. **Payment provider = commercial truth.** Money state lives there. Never duplicate its business
   rules.
2. **App server DB = the authoritative entitlement projection.** An append-only ledger of
   entitlement events (`granted / renewed / lapsed / revoked / comped`) plus a derived current-state
   row rebuilt from that ledger. Every server-side check reads this. It is deterministically
   replayable — matching the product's own doctrine rather than fighting it.
3. **Client = a cache with an expiry. Never an authority.**

**The webhook is an optimisation; the nightly reconciliation sweep is the guarantee.** The sweep
re-fetches all subscriptions modified since the last run, recomputes expected entitlement, and
reports three buckets: paying-but-not-entitled (auto-heal + alert), entitled-but-not-paying
(auto-heal + alert), unmatched provider customer (**never** auto-heal, always alert). **Email the
report to the owner even when it is clean** — "0 drift" arriving every morning is how you notice
the day it stops arriving. A monitor that only alerts on failure is indistinguishable from a
broken monitor.

**Key nothing on email.** Bind the provider customer to an opaque app `userId` with a unique index.
An email change must break nothing.

### 11.4 Offline entitlement, and the lapse policy

**Product invariant, stated as such:**

> **A lapsed subscription must never destroy, hide, or make un-exportable a single logged
> measurement, dose event, or audit record.**

| Capability | Active | Lapsed |
|---|---|---|
| View full history, charts, calendar | yes | **yes — read-only, always** |
| Export complete data | yes | **yes — always, no gate, no throttle** |
| Log a new measurement locally | yes | **yes** (stored locally, synced on resubscribe) |
| Engine recommendations | yes | gated |
| Cloud sync / multi-device | yes | gated (local data untouched) |
| Retest and maintenance push reminders | yes | gated (in-app due list still renders) |
| AI layer | yes | gated |

**Candidate delta — this is a structural finding against B.** In a client-direct model,
entitlement naturally lands in a JWT claim and an RLS predicate. A card fails; on the next token
refresh the predicate stops matching; `SELECT` on the user's own ledger returns zero rows. **The
keeper opens the app at the tank and their multi-year history is gone from the UI.** The invariant
above is violated *by construction*, and the failure is invisible until a real card fails. In
A/A−/D/M, entitlement and row visibility are separate by default.

**RECOMMENDATION: ship export before you ship billing.** It is the credibility anchor for a paid
app holding irreplaceable personal records, the disaster-recovery backstop, the migration path off
whichever provider is chosen, and the strongest answer to "what if you shut down".

**Never hard-delete a lapsed user's cloud data on a timer.** If storage cost ever forces a policy,
cold-archive and state the policy plainly at signup.

### 11.5 Merchant-of-record vs direct processing

**UNRESOLVED, and deliberately left so.** The research recommends a merchant-of-record primarily
to move VAT/sales-tax liability off a solo owner — which is a *legal and administrative* argument,
not a fee argument. But **all** MoR fee data and terms in the corpus are secondary and one
provider's post-acquisition commercial status is unverified. **Design so the payment provider is
replaceable** (entitlement ledger + adapter; nothing keyed on the provider's identifiers outside
one table) and defer the choice (§22, DEF-6).

### 11.6 If a native wrapper ever ships

**Flag, not a decision.** Distributing through an app store may bring the store's in-app-purchase
rules into scope for digital subscriptions, which is a different commercial architecture from web
checkout. This interacts with §15. It does not affect the recommendation, because the recommended
architecture keeps entitlement server-side behind an adapter — but it must not be discovered
after the fact.

---

## 12. NOTIFICATIONS

### 12.1 The headline fact, and it forecloses one candidate

**FACT.** A PWA **cannot** schedule a local notification for a future time without a server.

- Notification Triggers / `TimestampTrigger`: Chrome's own documentation states *"The development
  of Notification Triggers API… **is no longer pursued**."* Origin trials ran in Chrome 80–83 and
  86–88; launch step "Not started". Never implemented in WebKit.
- Periodic Background Sync's specification declares timed firing an explicit non-goal.

**Therefore every scheduled reminder in this product requires server-side push infrastructure**,
and R5 ("logging directly from due-test reminders") is a server requirement, not a UI feature.
This is one of the two independent reasons a server exists at launch (the other is secrets, §10.3).

### 12.2 iOS specifics (all FACT, from Apple's own documentation)

- *"Add web push to **Home Screen web apps in iOS 16.4 or later**"* — on iOS, **push requires
  installation**. A page in a Safari tab cannot receive push. This makes Home Screen install a
  functional requirement, not a preference.
- Permission must be requested **synchronously inside a user-gesture handler**; a prompt on page
  load or after an `await` fails.
- *"**Safari doesn't support invisible push notifications.** Present push notifications to the
  user immediately after your service worker receives them. **If you don't, Safari revokes the
  push notification permission for your site.**"* — push cannot be used as a silent sync trigger,
  and abusing it costs the permission.
- Payload limit **4 KB**. Badging is supported (`navigator.setAppBadge`). **No Apple Developer
  Program membership is required for web push** — relevant to a solo owner.
- Safari 18.4 added Declarative Web Push (a payload format that can display a notification without
  waking a service worker).

**UNRESOLVED.** Whether push subscriptions survive deleting and re-adding a Home Screen web app.
Apple's documentation does not address deletion, re-install, expiry or renewal. Secondary reports
say subscriptions are lost on delete, that a denied permission can only be re-prompted by removing
and re-adding the app, and that subscriptions are sometimes silently lost after inactivity.
**Design for subscription loss as the normal case.**

### 12.3 The architecture, and the boundary that K10 draws

```
        DETERMINISTIC ENGINE (authoritative) — the canonical retest scheduler
                                   │
        emits per tank/task: { taskId, recommendedAt, earliestUsefulAt,
                               latestSafeAt, reasonCode, scheduleVersion,
                               engineVersion, canonVersion }
                                   │
        ┌──────────────────────────┴──────────────────────────┐
   CLIENT: due list                                    SERVER: reminder dispatcher
   offline-capable, renders scheduler                  owns DELIVERY ONLY
   output verbatim, NEVER recomputes                   - stores due instants VERBATIM
                                                       - stores push subscriptions
                                                       - cron tick: who is due now?
                                                       - encrypt + VAPID-sign → push service
                                                       - prune 404/410 subscriptions
```

**This resolves X7, the wording conflict between two reports, and it must be stated once in the
decision record or it will be implemented twice:**

> **The retest scheduler is the sole *computer* of due instants. Any other component may store and
> render its output verbatim, and may never derive one.**

The notification layer may do arithmetic on those instants **only** for display ("due in 6 hours")
and for delivery timing (send at local 08:00 on the day of `recommendedAt`). It chooses copy,
channel, quiet hours, batching and throttling. **If the scheduler emits no date — a refusal, or
insufficient evidence — the notification layer sends nothing. Silence is the correct rendering of
a refusal**; it must never substitute a default interval.

**Completion-anchored scheduling by construction:** completing a task appends a completion event →
the engine recomputes the next due instant → the dispatcher's pending row is **replaced** (not
edited), keyed by `(taskId, scheduleVersion)`. Because the engine is the only writer of due
instants, "next due is computed from actual completion, not the calendar" is enforced structurally
rather than by convention.

**Never let a scheduled push outlive the schedule that produced it.** Store `scheduleVersion` on
every pending reminder and drop any whose version no longer matches at send time. A user who
tested this morning receiving "you're overdue" is, in a product giving consequential advice, worse
than no notification at all.

### 12.4 The cost nobody costed: shipping a new event type

K14 requires that an old client receiving an unknown event type store it verbatim, include it in
ordering and prefix hashes, and **refuse analyses whose window contains it**
(`UNKNOWN_EVENT_IN_ANALYSIS_WINDOW`). This is correct — ignoring a future `PumpFailureEvent` would
produce a confidently wrong dose increase.

**The consequence nobody stated: every time you ship a new event type, every device that has not
updated stops producing recommendations.** On iOS, where a new service worker sits in **waiting**
for as long as any client is using the registration, and an installed app may keep its window
alive for weeks, that is potentially weeks of "the app won't tell me anything" for a paying user
who did nothing wrong.

**A correct rule with a product-killing UX consequence is still a product-killing UX consequence.**
It must be designed, not discovered:

- scope the refusal to the **specific** analyses that could be confounded, not blanket;
- ship a hard **version check at app boot** with a forced-update prompt;
- keep API version negotiation strict;
- **stage new event types behind a server-side flag** until client adoption crosses a threshold.

This is a real, recurring release-engineering discipline for a solo owner, and it is a permanent
line in the operational budget.

### 12.5 Service-worker freshness — the corrected mechanism

**FACT (Service Worker specification, normative source).** A registration is **stale** if its last
update check was more than **86400 s** ago. Soft Update is triggered by (a) any **non-subresource
request**, i.e. a navigation, unconditionally, and (b) any **subresource request** *or* **any
functional event** (push, sync, notificationclick, message) once the registration is stale. **So
update checks are not navigation-gated** — the widely-repeated claim that an installed PWA which
never navigates can run a stale shell *because no update check happens* is **refuted by the
specification**.

**The real hazard is activation, not detection.** A new worker downloads, installs, and then sits
in **waiting** while any client is using the registration. An installed PWA whose window is never
closed can keep serving the OLD active worker and OLD cached shell indefinitely.

**Therefore the correct levers are:**

1. `vite-plugin-pwa`-style **`prompt` mode** with an explicit "a new version is ready — reload"
   flow driven by `updatefound` / `registration.waiting`. **Prefer this over bare `skipWaiting`**,
   which can swap code out from under a page mid-session — its own hazard in a dosing app.
2. Call `registration.update()` explicitly on `visibilitychange → visible`. It is not
   staleness-gated.
3. **A server-authoritative minimum-version check on every assessment-bearing write path**, which
   refuses to admit an audit record produced by a shell older than a declared minimum. This is the
   lever that matters, it is the same lever §12.4 needs, and it exists only in candidates that
   have an admission tier.

---

## 13. TESTING / DEPLOYMENT / OPERATIONS

### 13.1 The operational rule this dossier adopts as a hard constraint

**Three moving parts maximum: a static PWA bundle, one server application, one database.** One
host if possible. Everything reproducible from a git tag; no manual dashboard configuration that
is not also in the repo. Resist queues, workers, caches and microservices until a *measured*
problem demands one.

Measured against that rule: **A− and M pass. A passes if the API tier and static hosting share a
vendor. B fails quietly** (Postgres + PostgREST + Edge Functions + Storage + Realtime + Auth are
separate surfaces to reason about even though one vendor bills them). **D fails loudly** (Workers
+ N shards + object storage + a migration runner). **C fails in a different direction** (no server,
but a sync service, a licence, and N un-inspectable clients).

### 13.2 Engine isolation, enforced mechanically

`@app/engine`: pure TypeScript, **zero runtime dependencies** — `"dependencies": {}` as a
machine-checkable fact, not a convention. No Node built-ins, no DOM, no framework, no I/O. Every
export is `(input: PlainData) => PlainData`, **total** (typed refusals, never throwing for domain
reasons), free of ambient state.

Four independent enforcement mechanisms, because each catches what the others miss:

1. **`package.json#exports`** with exactly one public entry — deep imports become impossible at
   the runtime and bundler level, not the linter level.
2. **TypeScript project references** — a `composite` project can only *type-see* what it
   references; the engine's tsconfig references nothing.
3. **ESLint `no-restricted-imports` / `no-restricted-globals` / `no-restricted-syntax`** over
   `packages/engine/**`: ban all bare specifiers, ban `node:*`, and ban `Date`, `Math.random`,
   `performance`, `process`, `Intl`, **`Math.pow` / `Math.exp` / `Math.log` / `Math.log10` /
   `Math.log2` / trig / `Math.cbrt` / `Math.hypot`**, and the **`**` operator**.
4. **`dependency-cruiser`** in CI, forbidding any module under `packages/engine` from depending on
   anything outside it, and any outside module from reaching engine internals. Plus a one-line CI
   assertion that the engine's `dependencies` object is empty.

**The boundary that matters most:** the **canonical retest scheduler belongs inside the engine**;
the notification surface belongs outside and only renders its output (§12.3).

### 13.3 The injected clock, because discipline already failed once

Time is a **parameter**, never an ambient read. Production passes `Date.now()`; tests pass a fixed
instant; **replay passes the historical instant recorded in the audit record.** That last one is
the entire point — replay is possible only if the engine never asked for the time itself.

**This is not theoretical. V1 did exactly this and it is documented with file and line
references:** V1's `assess*` functions *accepted* a `now` parameter, and yet `todayStr()` was
called directly inside `alkalinity.js`, `calcium.js`, `helpers.js` and `state.js`, while
`stability-engine.js` took no `now` at all. V1's own replay report shows identical inputs at the
same nominal instant returning green *"Rock steady"* versus amber *"Some movement"* depending on
the system clock. **The single most clock-tempting code in any system is a scheduler, and this
design puts the scheduler inside the engine.** The guard must be mechanical, because discipline
demonstrably failed once already.

### 13.4 The determinism CI job — a standing obligation (see §3.4)

**RECOMMENDATION — from the first commit, not later:**

| Check | What it enforces |
|---|---|
| The `Math.*` / `**` lint ban above | §3.4's clearance is only valid while the implementation stays inside the exactly-specified subset |
| **Cross-engine golden test**: run the same frozen fixtures under **V8** (Node) and **JavaScriptCore** (a real WebKit build, or the closest available), assert **byte-identical** output digests | Catches the case §3.4 cannot: an implementer-chosen algorithm the canon does not prescribe |
| Byte-identical **replay** test against frozen fixtures | K3 |
| **Shuffle test**: permute equal-timestamp events, assert the result is unchanged | K6 §2.4's ordering rule, mechanically |
| **Accumulation-order test**: sum a dose history in ledger order vs a shuffled order, assert equality is *not* silently assumed | §9.8 |
| **Re-run the §3.4 canon grep whenever a new parameter canon is frozen** | pH is natively logarithmic; carbonate/salinity/ICP maths commonly use logs and non-integer powers. **This is where the guarantee will lapse if anywhere.** |

### 13.5 Testing the platform that cannot be tested

**FACT (Playwright's own documentation):** *"Playwright doesn't work with the branded version of
Safari since it relies on patches"*, and device descriptors only *"simulate the browser behavior
such as userAgent, screenSize, viewport"*. **`devices['iPhone 13']` on Linux is a Linux build of
WebKit trunk with an iPhone user-agent string.** It does not reproduce standalone display mode,
iOS storage eviction, the iOS service-worker lifecycle, the install flow, safe-area behaviour, or
Web Push on iOS.

**Consequence:** every iOS-specific risk in §10.6 — which is most of the product's risk — is
verifiable only by a human with a real iPhone, every release, forever.

**RECOMMENDATION — a short, written, mandatory manual iPhone release checklist**, and it belongs
in the operational budget, not a footnote:

> install → launch offline → log an event offline → compute an assessment offline → background for
> a day → relaunch → confirm data survived → confirm sync reconciles → confirm a push arrives →
> confirm the update prompt appears and applies.

**UNRESOLVED (§24, Q10).** Real-device cloud testing services: no pricing and no iOS coverage data
was obtainable.

### 13.6 Migrations — the discipline, per store

**Server (Postgres).** Plain reviewed SQL files plus a small runner. **Never** a declarative diff
against the ledger: a declarative tool's instinct is "make the database match the model", which on
an append-only ledger means generating `ALTER`/`UPDATE`/drop statements that mutate recorded
history. **K9 forbids the two things every migration tool does by default** — backfilling a new
NOT NULL column with a default for historical rows, and substituting 0 or null-as-zero. One
auto-generated migration that backfills `source = 'manual'` onto pre-provenance rows is a
**fabrication of provenance**, indistinguishable forever from a real recording — precisely what
`DATA-PROVENANCE.md` §3 exists to prevent.

**A CI check that fails any migration touching a ledger table with `UPDATE` or `DELETE` is
mandatory.** NULL always means "not recorded".

**Client (IndexedDB).** The rule set, and it must exist before the first user:

- never rewrite a stored event payload;
- version **payloads** (`payloadVersion`), not the store;
- read-time **upcaster chain** of pure functions, never written back (and see §9.5 — upcasters are
  inside the determinism boundary and must be frozen and goldened when shipped);
- bump the IndexedDB version only to create a store or index, or to drop a projection — **never**
  to touch `events`;
- migrate projections by **dropping and rebuilding via replay**;
- write `onupgradeneeded` as a fall-through `switch (oldVersion)` with no `break`s, so a device
  many versions behind upgrades in one step;
- handle `blocked` (`db.onversionchange = () => db.close()`), or a second tab hangs the upgrade
  forever;
- **frozen fixture databases per historical version in CI, exercised in a real WebKit browser.**

**Rollback does not exist, and the runbook must say so.** Once new-shaped data is written by real
users, a "down" migration destroys it. Restoring a backup is not a rollback — in a multi-tenant
live system it discards every user's writes since that point. The only real escape hatch is
**application-code rollback**, available only if expand/contract kept both shapes readable for
several releases. **Down migrations are a pre-deploy convenience; forward-fix is the production
discipline.**

### 13.7 Backup, restore, and the number that is the real RTO

- **An independent, cross-vendor, encrypted backup of the ledger export**, taken on a schedule the
  owner controls, is not optional. It is simultaneously the disaster-recovery backstop, the
  portability obligation, and the migration path off whichever provider is chosen (§23).
- **A monthly restore rehearsal with a ledger hash comparison.** Write the runbook and *execute*
  it once on a scratch project before launch, and record the wall-clock time. **That number is
  the real RTO**, and it is the only honest one.
- "Restore one user" is a several-hour manual procedure in A/A−/M unless the Postgres provider
  supports branch-from-a-past-instant (branch → extract that user's rows → merge back as
  corrective events → production never offline). It is one API call in D. It is a whole-project
  restore in B, which takes the product offline and rolls back every other user.
- Object-storage blobs are **not** in a database backup. Separate restore path, separately
  rehearsed.

### 13.8 Observability

Error reporting is necessary but **it fails exactly when you need it**: reserved-volume budgets
are exhausted by the incident that generates the most errors, after which reporting stops for the
remainder of the billing cycle. **Cap noisy error classes client-side, alert on quota burn rate,
and keep a server-side log path that is not the error-reporting vendor.**

### 13.9 The standing operational load, listed so it can be budgeted

Manual iPhone release checklist, every release · VAPID key custody and out-of-band backup · push
subscription churn and pruning of 404/410 endpoints · the daily billing reconciliation report
(which must arrive even when clean) · monthly restore rehearsal with ledger hash comparison ·
secret-scanning the built bundle in CI · the cross-engine golden job · dependency triage · support
conversations for each designed refusal state in §8.2.

**This list is the honest cost of the recommendation, and it does not shrink under any candidate.**
Under B it grows (RLS CI checks); under D it grows more (fan-out runner maintenance); under C it
is replaced by something worse (blind support).

---

## 14. OPTIONAL AI COMPATIBILITY

DEC-009 and `PRODUCT-VISION.md` pillar 6 already fix the semantics. What the architecture must
provide is narrower than it looks, and the recommendation costs almost nothing extra.

### 14.1 What the architecture must guarantee

| # | Guarantee | Provided by |
|---|---|---|
| 1 | AI provider credentials never reach a client bundle | The server tier that already exists for push and billing (§10.3). **This is the second of the two independent reasons a server exists at launch.** |
| 2 | The AI consumes a **compact, versioned structured domain-state summary**, not raw history by default | A dedicated projection derived from engine output — not a new source of truth |
| 3 | The AI structurally **cannot** override `HOLD` / `NOT_RUN` / insufficient-evidence / refusal | It is never in the authoritative path. It receives the engine's *output* and may only phrase it. |
| 4 | The core product is fully useful when AI is unavailable | The AI is an adapter above the engine; removing it removes a surface, not a capability |
| 5 | Usage and cost controls exist | Server-side, per user, against the entitlement projection |

### 14.2 The one place AI touches the write path, and how to make it safe

Natural-language logging ("I dosed 8 mL this morning") is the only proposed AI capability that
creates data. **RECOMMENDATION:** the AI produces a *draft* event that is:

- parsed and validated at the same boundary as any other untrusted input;
- **presented to the user for explicit confirmation** before it is appended;
- stamped with a provenance marker recording that it originated from an AI draft, and **carrying
  the user's confirmation as the assertion** — the AI is never the asserting party;
- subject to the same `timePrecision` rules as anything else. **"This morning" is not an absolute
  instant.** If the user does not supply one, the record is `DATE_ONLY` or `LOCAL_TIME_ZONE_UNKNOWN`
  and permanently ineligible for exact-elapsed-time analysis. **The AI must never manufacture a
  time to make its draft look complete** — that is the exact failure `DATA-PROVENANCE.md` §2 and
  K9 exist to prevent, arriving through a new door.

### 14.3 Candidate delta

| Candidate | AI compatibility |
|---|---|
| A / A− / M / D | Already have the server tier and the secret store. Adding AI is one route plus one projection. Streaming responses are natural. |
| B | Needs another Edge Function in another runtime — the API tier arriving by accretion again |
| C | **Has nowhere to put the key.** Adding AI means adding the server, i.e. ceasing to be C. |

**INFERENCE.** AI compatibility is *not* a discriminating axis between the serious candidates — it
is a discriminating axis between "has a server" and "does not". It reinforces §12.1 rather than
adding a new consideration. **Nothing about AI should be built in phase 1.** The only phase-1
obligation is that the engine emits structured domain state rather than prose, which K10 and D1
already require for entirely different reasons.

---

## 15. FUTURE NATIVE PATH

DEC-007 requires that native clients "remain a later option that architecture should not
preclude". The recommended architecture preserves that option at essentially zero cost, and one
common choice would destroy it.

### 15.1 What preserves the native path

- **`@app/engine` as pure, zero-dependency TypeScript with no DOM and no I/O** is the whole
  answer. A native client re-implements the shell, not the chemistry. The engine, the event
  schema, the sync protocol and the audit-record shape all travel unchanged.
- **A versioned JSON API** rather than a database-shaped client contract. A native client is
  simply another API consumer. In **B**, a native client would have to speak PostgREST and hold
  the publishable key — i.e. inherit the same architectural lock-in as the web client.
- **A static SPA shell with no SSR.** SSR is not merely unhelpful here; **it eliminates the
  wrapper-based native path outright** (a Tauri-style wrapper needs static assets), and it creates
  a second rendering path for authoritative verdicts — two places that can drift about whether the
  answer was HOLD, which is a genuinely bad failure mode for this product. Server-render the
  marketing site only, from a separate deployable.

### 15.2 What the native path would actually buy, and when

| Motivation | Does native solve it? |
|---|---|
| Background outbox drain on iOS | **Yes — and it is the only thing that does.** This is the strongest technical argument for native, and it directly addresses §8.3's unbounded silent-non-durability window. |
| Local scheduled notifications without a server | Yes — but the server already exists for other reasons, so the saving is small |
| Storage durability guarantees | Yes — native app storage is not subject to §10.6's undocumented eviction behaviour |
| Distribution reach | Yes, at the cost of store review and possibly store IAP rules (§11.6) |

**INFERENCE.** The native case is a *durability and background-execution* case, not a performance
or UX case. It becomes compelling if §8.3's outbox-drain window turns out to cause real data loss
in practice. **That is a measurable thing**, and the per-event "confirmed on server" badge plus a
server-side metric on time-to-admission is how you would measure it. Instrument it from launch;
decide later.

### 15.3 What would destroy the path

Choosing SSR; letting the client speak the database's schema; putting domain logic in the view
layer; or letting any chemistry threshold live in a component (V1 did — §16, item 30).

**INFERENCE.** The recommended architecture does none of these, so **the native path is preserved
by default rather than by effort.** No phase-1 work is required, and none should be done.

---

## 16. V1 LESSONS

V1 is a ~19k-line React 18 + Vite PWA whose data layer is a key/value store of whole
JSON-serialised arrays, whose timestamps are local wall-clock strings with no zone and a
fabricated midday for the **96.7% of real readings that have no time**, whose verdicts exist only
for the duration of a render pass, and whose migration framework was specified in its own canon
and never written.

**Its architectural failures all reduce to one sentence: V1 recomputes rather than records.**
Because it recomputes, editing a target rewrites six months of history. Because it recomputes from
a clock read through side channels, it cannot reproduce its own outputs. **K4, K5 and K3 exist
because of exactly this**, and the recommended architecture's audit-record-with-pinned-inputs
is the direct structural answer.

The V1 report classified ~95 items. The architecturally significant selection follows. Classes are
`KEEP_CONCEPT` / `RECONSIDER_FOR_V2` / `REFERENCE_ONLY` / `LEAVE_BEHIND`. **No code is proposed for
porting; DEC-002 makes "V1 did it this way" insufficient justification, and these are concepts.**

### 16.1 Persistence and the storage seam

| # | V1 idea | Class | Reason | Citation |
|---|---|---|---|---|
| 1 | `loadKey`/`saveKey` repository seam | **KEEP_CONCEPT** | The backend was swapped twice with zero caller changes. This is the seam that makes §23's exit path real | `src/lib/storage.js:172,222` |
| 2 | One DB, one connection, one version constant | **KEEP_CONCEPT** | Two modules at two versions produce `VersionError` and permanent degradation | `src/lib/idb.js:1-21` |
| 3 | `{ok, value, reason}` results instead of throwing | **KEEP_CONCEPT** | Quota lands on `tx.onabort`, not `req.onerror`; both must be caught. Matches the engine's total-function discipline (§13.2) | `src/lib/idb.js:118-144` |
| 4 | Timeout race on `indexedDB.open` | **KEEP_CONCEPT** | `onblocked` never settles; without the race the app hangs | `src/lib/idb.js:32-37` |
| 5 | Confirm-before-delete on every move | **KEEP_CONCEPT** | The only reason V1's double-prefix key mess was recoverable | `src/lib/storage.js:66-70,268` |
| 6 | Whole arrays as one JSON string per key | **LEAVE_BEHIND** | No append, no atomicity, no ordering, no query. Directly incompatible with K1 | `src/lib/storage.js:269` |
| 7 | Three hand-maintained key lists | **LEAVE_BEHIND** | Drift silently lost `correction-plans` from every backup | `backup.jsx:30` vs `App.jsx:496` |
| 8 | `DB_VERSION` as a store-creation counter | **LEAVE_BEHIND** | Looks like a schema version, migrates no data. §13.6's payload-versioning rule replaces it | `src/lib/idb.js:86-93` |
| 9 | Global keys with no tank/user identity | **LEAVE_BEHIND** | Multi-tank and multi-device become a schema rewrite. R7/R11 require identity in the key from day one | `src/App.jsx:496-516` |
| 10 | Lazy read-through migration | **RECONSIDER_FOR_V2** | Self-healing, but runs forever in a mixed-schema state. §13.6's read-time upcaster chain is the disciplined form of the same instinct | `src/lib/storage.js:144-154` |

### 16.2 History truthfulness — the failure V2 exists to fix

| # | V1 idea | Class | Reason | Citation |
|---|---|---|---|---|
| 11 | Append-only dose log kept separate from the live dose | **KEEP_CONCEPT** | Right instinct — undermined by an overwritten settings object beside it. K1 formalises it | `src/App.jsx:431-437` |
| 12 | Dosed mL stored with no tank volume baked in | **KEEP_CONCEPT** | Changing net volume must not rescale a past dose | `src/test/spec/history/dose-log-immutability.test.js:36-67` |
| 13 | **Persisting the verdict rather than recomputing it per render** | **KEEP_CONCEPT** (absent in V1) | The mechanical root of both the history rewrite and the replay failure. This is K4/K5 | `docs/spec/wizard-states.md` §1 |
| 14 | Recomputing classification from current settings on every render | **LEAVE_BEHIND** | Rewrites six months of history on a target edit. V1's own `target-change-immutability` test asserted the correct behaviour **and failed** | `src/components/WaterLog.jsx:186`; `.agent/items/TW-013.md` |
| 15 | Single overwritten config objects | **LEAVE_BEHIND** | No effective-dating, no change event, no explanation for step changes in a chart. K2 forbids it | `src/App.jsx:426,450,839` |
| 16 | Regenerating ids on restore | **LEAVE_BEHIND** | **0 of 325 ids survived a round trip.** Ids must be immutable and client-generated (§9.2 item 1) | `src/lib/backup.jsx:225` |
| 17 | Rounding applied at the save site | **LEAVE_BEHIND** | Display rounding entered stored values — a direct K6 §2.3 violation | `src/components/DoseChangeSheet.jsx:90` |

### 16.3 Time

| # | V1 idea | Class | Reason | Citation |
|---|---|---|---|---|
| 18 | Never derive a calendar day from `toISOString()` | **KEEP_CONCEPT** | The lesson is right, even though V1's fix threw away the absolute instant | `src/lib/dates.js:1-8` |
| 19 | DST / late-night date regression tests | **KEEP_CONCEPT** | Reimplement against absolute instants | `src/test/spec/history/timezone-dst.test.js` |
| 20 | Wall-clock `date` + optional `time`, no zone | **LEAVE_BEHIND** | No absolute instant is recoverable. §9.3's tagged union replaces it | `src/lib/dates.js:9-12` |
| 21 | Midday substituted for a missing time | **LEAVE_BEHIND** | 96.7% of real readings were fitted against invented instants and fed to a regression slope. This is the single worst V1 defect | `src/lib/analytics/time-of-day.js:31` |
| 22 | Adding a `time` field with no provenance marker | **LEAVE_BEHIND** | "unknown" became indistinguishable from "pre-field". K6's precision enum is the fix | real fixture: 11 timed / 325 not |
| 23 | Never-invalidated global date cache | **RECONSIDER_FOR_V2** | Real performance need; stale across a timezone change | `src/lib/analytics/water-changes.js:71-80` |

### 16.4 Backup, restore and refusal

| # | V1 idea | Class | Reason | Citation |
|---|---|---|---|---|
| 24 | Idempotent merge restore | **KEEP_CONCEPT** | Same file twice is a no-op; an old file never removes newer data. Exactly the union semantics of §8.1a | `src/lib/backup.jsx:191-193` |
| 25 | One merge function shared by preview and execution | **KEEP_CONCEPT** | The previewed number *is* the delivered number | `src/lib/backup.jsx:100-119` |
| 26 | Refusing to resolve a target-range conflict silently | **KEEP_CONCEPT** | Throws before writing anything unless the caller decided. This is §8.1d's `CONFIGURATION_CONTESTED` in embryo | `src/lib/backup.jsx:184-208` |
| 27 | Counting and reporting unusable rows | **KEEP_CONCEPT** | The difference between a trustworthy restore and a quiet loss | `src/lib/backup.jsx:88-96` |
| 28 | Snapshot ring that refuses empty-over-full | **KEEP_CONCEPT** | Stops an undo history becoming a delete amplifier | `src/lib/auto-backup.js:73-84` |
| 29 | Wipe detection (install witness + shape-of-a-wipe) and the `maySeed` verdict | **KEEP_CONCEPT** | *"A missing list can be retyped; 25 invented maintenance events cannot be told from real ones."* Directly serves K9 and D5 | `src/lib/install-witness.js:1-35,126-133` |
| 30 | Deleting seed data outright rather than flagging it | **KEEP_CONCEPT** | 325 invented readings once fed every rate and were exported as real | `src/lib/seed-data.js:1-11` |
| 31 | Export format version that never changes and nothing reads | **LEAVE_BEHIND** | Import cannot tell what it is reading. §9.2 item 2 replaces it | `src/lib/backup.jsx:47,153` |
| 32 | Content stored separately from its owning list, joined at the seam | **KEEP_CONCEPT** | Backup format and all callers survived a storage migration unchanged. This is §8.1h | `src/lib/photo-store.js:15-21` |

### 16.5 PWA, notifications and offline

| # | V1 idea | Class | Reason | Citation |
|---|---|---|---|---|
| 33 | Precache everything, zero runtime network | **KEEP_CONCEPT** | The simplest correct answer for an offline core | `vite.config.js:36-40` |
| 34 | `autoUpdate` with no prompt and no version surface | **LEAVE_BEHIND** | Silent engine swaps in an app that persists no engine version. §12.5 requires `prompt` mode plus a version check | `vite.config.js:8` |
| 35 | Manifest with no `id`/`scope` | **RECONSIDER_FOR_V2** | Never bit V1; V2 has routes, accounts, a separate marketing origin and possible native clients. Also relevant to §10.4's RP-ID decision | `vite.config.js:12-27` |
| 36 | One live notice per topic, with supersession | **KEEP_CONCEPT** | Solves stacking, contradiction and the unbounded hidden list at once | `docs/journeys/journey-4-notifications.md` |
| 37 | Reminders scheduled from last completion, not from a calendar | **KEEP_CONCEPT** | Being behind never compounds into an unclearable backlog. §12.3 makes this structural | `src/lib/reminders.js:6-14` |
| 38 | Logging the test **is** the completion | **KEEP_CONCEPT** | Removes "I did it but the app doesn't know". Directly serves R5 | `src/lib/reminders.js:121-132` |
| 39 | `dueOverride` vs `adjustDays` as separate concepts | **KEEP_CONCEPT** | Separates "chemistry says test then" from "I'm away Thursday" — i.e. keeps K10's boundary intact | `src/lib/reminders.js:60-64` |
| 40 | Every surface computing its own notices | **LEAVE_BEHIND** | Produced two contradictory live opinions about one parameter, side by side. K10/invariant 12 | `docs/journeys/journey-4-notifications.md` §4 |
| 41 | Fixed-interval scheduling as the retest mechanism | **RECONSIDER_FOR_V2** | Fine for husbandry tasks; wrong for chemistry-driven retest, which the engine owns | `src/lib/reminders.js:53-77` |
| 42 | Any inherited background-notification capability | **LEAVE_BEHIND** | There is none — zero `Notification`/Push/Periodic-Sync usage in V1. §12.1 must be built from scratch | grep over `src/` |

### 16.6 Testing, CI and boundaries

| # | V1 idea | Class | Reason | Citation |
|---|---|---|---|---|
| 43 | Golden corpus + stored digest + an explicit update flag | **KEEP_CONCEPT** | 5,940 rows; the right instrument for "this refactor changed nothing" | `tests/legacy-port/golden.js:1-14` |
| 44 | Injecting the clock **everywhere**, not just at the entry point | **KEEP_CONCEPT** | V1's golden fingerprint disagreed with itself across 20:00 | `tests/legacy-port/golden.js:20-40` |
| 45 | `mutate` — proving the gate itself can fail | **KEEP_CONCEPT** | Two legacy checks were green while covering nothing | `scripts/verify/mutate.mjs:1-14` |
| 46 | `livecheck` — a config field only tests read is a lie | **KEEP_CONCEPT** | No off-the-shelf equivalent, and critical for R3's versioned formula data | `scripts/verify/livecheck.mjs:1-12` |
| 47 | `wordingcheck` — surfaces must quote the engine's words | **KEEP_CONCEPT** | The only mechanical enforcement of the single-source rule ever built. Directly enforces K10 | `scripts/verify/wordingcheck.mjs:1-10` |
| 48 | `consistencycheck` — canon enums are closed and the build proves it | **KEEP_CONCEPT** | Generalises to reason codes, validity states and exclusion reasons | `scripts/verify/consistencycheck.mjs:1-8` |
| 49 | Excluding the main test suite from the merge gate | **LEAVE_BEHIND** | 62–69 red, including **every history-truthfulness test**. A gate that excludes the failing tests is not a gate | `scripts/verify/run.mjs:63-76` |
| 50 | One workflow, one job, one required check | **KEEP_CONCEPT** | "The owner reads one red or green" is right for a solo owner | `.github/workflows/verify.yml` |
| 51 | ~600 lines reimplementing a type checker and a hooks lint rule by tag-name matching | **LEAVE_BEHIND** | TypeScript and standard lint rules do this properly | `scripts/verify/propcheck.mjs:1-10` |
| 52 | Domain modules importing UI modules | **LEAVE_BEHIND** | Needs a **mechanical** boundary check; prose did not hold it. §13.2 item 4 | `src/lib/narrative-engine.js:1` |
| 53 | Domain orchestration inside the root component | **LEAVE_BEHIND** | Not runnable, replayable or testable without a render. K12 forbids it | `src/App.jsx:69` |
| 54 | Chemistry thresholds as literals in JSX | **LEAVE_BEHIND** | Invisible to every chemistry review and every golden test. K11 invariant 16 | `Insights.jsx:162`, `ErrorBoundary.jsx:321`, `IcpConfirmation.jsx:42` |
| 55 | Runtime type coercion at the domain boundary because nothing validates | **RECONSIDER_FOR_V2** | V1 coerced strings→numbers because six record types crashed on shapes its own backup permitted. V2 validates **at the seam with a schema** (§13.2), not by defending in fifty display sites | `src/App.jsx:80-125` |
| 56 | A budgets file that nothing enforces | **LEAVE_BEHIND** | Bundle size, coverage and suite runtime were declared and never read by CI | `.agent/budgets.json` |

### 16.7 Process and provenance

| # | V1 idea | Class | Reason | Citation |
|---|---|---|---|---|
| 57 | Real-tank fixtures as an acceptance corpus | **REFERENCE_ONLY** | Six months of genuine data with genuinely degraded provenance — valuable precisely *because* it is degraded (it is the D5 test case) | `fixtures/real-tank/*.json` |
| 58 | The `real-history-replay` failure catalogue | **REFERENCE_ONLY** | Eight dated, file:line-cited findings; the best document in the V1 repo, and the evidence base for most of this section | `.agent/real-history-replay.md` |
| 59 | "Offline-only, no sync, no accounts" | **REFERENCE_ONLY** | An explicit V1 non-goal that DEC-008 reverses. Keep it visible so it is not re-derived | `docs/spec/wizard-states.md` §18 |
| 60 | The §18 storage contract (schema-version key, per-version fixtures, read-only on failure) | **KEEP_CONCEPT** | A correct specification that was **never implemented and never enforced** — `grep` for its schema-version key returns nothing. The lesson is that a written contract without a CI check is a rule guarding a mechanism that does not exist | `docs/spec/wizard-states.md` §18; `AGENTS.md` #5 |
| 61 | "A failing test is information" / "work up a contradiction rather than resolving it" | **KEEP_CONCEPT** | Directly produced the tests that prove V1's worst defects, and made 55k lines of agent prose decision-supporting for a non-coding owner | `AGENTS.md` #4, #10, #11 |
| 62 | One-file-per-backlog-item plus a checker in the gate | **KEEP_CONCEPT** | A single backlog file was "surviving on luck" under concurrent agent runs | `.agent/items/TW-042.md` |

**Tally of the selection: KEEP_CONCEPT 33 · LEAVE_BEHIND 20 · RECONSIDER_FOR_V2 6 ·
REFERENCE_ONLY 3.**

### 16.8 The one V1 lesson that outranks the rest

Item 60. **V1's own canon specified the storage contract that would have prevented its worst data
losses, and nobody implemented it, and nothing checked.** The lesson is not "write better specs" —
V1's specs were good. The lesson is that **every constraint in §3 and §21 of this dossier needs a
mechanical enforcement mechanism named alongside it**, or it will be documentation that made
everyone feel safe.

---

## 17. FAILURE-MODE REVIEW

This section incorporates the adversarial review's FATAL and SEVERE findings, **including those
against the recommended architecture**. A failure-mode review that spares the winner is worthless.

### 17.1 The single failure mode most likely to kill this product

> **Silent divergence between "what the app said then" and what the system can reproduce now —
> discovered by a user, in public.**

Not a breach, not a bill, not iOS eviction. Those are survivable, apologisable, insurable. This one
is not, because it destroys the product's only differentiator.

**The concrete scenario.** A keeper opens the alkalinity history for 14 March. The audit record
says the app recommended 10.7 mL/day. They tap "explain" — or a support request triggers a replay —
and the system produces 8.9 mL/day for the same instant. **There are at least six causes, none
exotic, and each is addressed somewhere in this dossier:**

| # | Cause | Addressed in |
|---|---|---|
| 1 | The audit record pinned only `asOf`, and the ledger prefix has since grown | §8.1f, §9.2 item 5 |
| 2 | A transcendental produced a different last digit on JavaScriptCore than on V8, near a threshold | §3.4 — **closed for the frozen Alk canon**, standing obligation for future domains |
| 3 | A sum accumulated in database-return order rather than ledger order | §9.8 |
| 4 | An upcaster shipped later subtly changed how an old payload deserialises | §9.5 |
| 5 | A migration backfilled a default onto historical rows | §13.6 |
| 6 | A clock leak inside the retest scheduler | §13.3 |

**Why it is lethal rather than embarrassing.** `PRODUCT-VISION.md` states the pitch plainly: *"Its
central value is a deterministic reef-management system whose recommendations can be reproduced,
inspected and tested"*, for *"serious reef keepers [who] trust [it] because it does more than store
numbers or generate plausible advice."* A forum thread demonstrating that the app's history changed
retroactively removes the only reason to pay for this rather than use a free calculator — and the
audience is exactly the population that will check.

**It is not hypothetical: V1 already did it, three ways** (§16 items 14, 21, 44). This is the
failure mode V2 exists to fix, and the one V2 is most likely to reproduce in a new costume.

**Ranking against this failure specifically: A− ≈ A > D > M > B > C > E.** The four properties it
requires are a server-assigned dense total order, a single admission point, a versioned API with a
server-side upconverter, and server-side visibility so the owner catches divergence before a
customer does. A−, A, D and M have all four. B has an order only if the client remembers to write
it and nothing enforces it. **C cannot even define the question** — no canonical prefix, no
authority, two devices' contradictory audit records equally "true".

### 17.2 Runner-up: silent loss of unsynced data on iPhone

More *frequent*, less *fatal*. A user who loses three days is angry; a user who proves the history
changed is gone, and takes the forum with them. A−/A/D/M survive it best for the same reason: the
server is the second copy. C does not survive it at all.

### 17.3 FATAL findings, by candidate

| ID | Finding | Candidate(s) | Fixable? |
|---|---|---|---|
| **F-1** | **RLS as sole isolation.** One migration missing `ENABLE ROW LEVEL SECURITY` publishes every user's ledger world-readable **and world-writable**. The write half is a **physical-harm** path: forged dose and measurement events are consumed by the deterministic engine exactly as real ones and produce a maintenance-dose change the keeper acts on. No error, no warning, no log entry. | **B** | Only by discipline the architecture does not enforce — default-deny, a CI check on `relrowsecurity`, revoke-then-regrant, `security_invoker` views, a written `SECURITY DEFINER` inventory. **Note what that list is:** server-side authorization logic, in SQL and CI shell, written by a TypeScript solo owner, in the least reviewable form available — to replace an API tier he was told he could skip. |
| **F-2** | **Storage eviction destroys the system of record.** WebKit's sweep deletes **all** script-written storage for a non-exempt origin — IndexedDB, Cache API, localStorage, OPFS *and the service-worker registration*. In C there is no second copy: a two-week holiday can silently erase a multi-year tank history, and the app reopens looking like a fresh install. Not recoverable, not detectable, not attributable. | **C** (fatal); A/A−/B/D/M (bounded to the unsynced outbox — which on iOS may be days of the newest data) | In C: only by making the cloud durable, i.e. by not being C. The mitigation C would reach for rests on an undocumented WebKit field populated by a closed-source embedder (§10.6). |
| **F-3** | **The install transition forks or destroys the ledger.** Cookies are copied at Home Screen creation; **IndexedDB is not.** A keeper who installs "to make it more reliable" arrives in an empty app, with an orphan store the eviction sweep will collect. There is **no way to merge two WebKit storage partitions from the client.** | **C** (fatal); B (severe — the session is a bearer token in JS-reachable storage, so installing logs the user out, and the standard `SIGNED_OUT → clear local state` handler then destroys the Safari-side outbox on the way past) | A/A−/D/M: yes — cookie session plus an explicit, tested first-run cold-sync path. |
| **F-4** | **Contested configuration resolved silently.** K13 requires refusal. B's natural shape is a row updated in place (second `UPDATE` wins by arrival). C's named engines document per-field last-write-wins, "deletes always win", or arbitrary map-conflict resolution. **The failure is silent and physical: the tank gets 6 mL/day when the keeper decided 12.** | **B, C** | In B, only by adding an admission tier (becoming A−). In C, only by refusing every off-the-shelf conflict model and hand-writing the resolution — at which point the sync engine buys transport only, while charging a licence review and a long-term upgrade dependency. |
| **F-5** | **The schema is the API.** A device offline three weeks meets a tightened CHECK and a new column; every queued event fails with a Postgres error string; no versioned API, no upconverter, no negotiation. Either 40 irreplaceable events are lost or the queue is permanently stuck. | **B** | **Not fixable within B's defining constraint.** |
| **F-6** | **The fan-out migration is a distributed transaction nobody can make atomic**, run by one person, under a 30-second query cap, in a database with limited `ALTER TABLE`, whose recovery primitive is destructive full-database restore rate-limited to 10 per 10 minutes. **Partial failure is the normal outcome.** | **D at scale** | Only by building and rehearsing the runner *before* it is needed — which is the cost D is already charged with, paid on every schema change, forever. |
| **F-7** | **The 2am support model.** In C there is no server copy, no admission log, no canonical prefix, no way to reproduce a user's state. The only diagnostic path is asking the user to export a file — presuming the export works, the data still exists, and they can perform it on an iPhone. | **C, for a solo owner** | Only by building all the diagnostic tooling C requires — i.e. paying most of A−'s cost while keeping none of its visibility. |

### 17.4 SEVERE findings **against the recommended architecture (A−)**

These are the honest costs of the recommendation. None is disqualifying; all must be believed.

| ID | Finding | Mitigation, and its residual |
|---|---|---|
| **S-1** | **A− has the largest bespoke-code surface of any candidate, owned by one person, with a bus factor of one.** API tier, auth, a bespoke append-only sync protocol (outbox, `serverSeq`, cursor advance, idempotent PUT, rejection quarantine, contested-config ancestry, duplicate detection), a push dispatcher with VAPID custody, entitlement issuance plus a daily sweep, an independent cross-vendor backup with a monthly rehearsal, and a manual iPhone checklist. | Ruthless scope discipline: A− already deletes the single largest optional piece (server-side re-execution). **And the cheapest insurance available: the protocol spec, its invariants, and a conformance test suite are *artifacts* that belong in the repo beside the canon, written before the code.** Residual: bespoke correctness decays, and in three years reconstructing *why* the cursor advances only after durable persistence, from a partially-updated design doc, is a real risk. |
| **S-2** | **At 2am the owner *is* the vendor.** "My last two weeks of tests aren't on my iPad" means: pull the user's outbox export (a feature he had to build), read his own `serverSeq` stream, query his own rejected-events table, decide whether a rejection was a client bug or a schema violation, and — if it was a client bug — **hand-admit events into an append-only ledger**, which requires an admin path that is itself audited, or he has just written unaudited events into the audit ledger. There is no support ticket he can file with anyone. | Design the admin admission path as a first-class, audited, reason-coded event type **before launch**, not during the incident. Residual: unavoidable. It is the price of owning the tier. |
| **S-3** | **Support volume from designed refusal states.** A− has the most of them (§8.2) **because it is the only shape that detects them.** Each is a support conversation. | Budget it as support capacity; give every refusal state excellent self-serve copy. Residual: this scales with users and is a permanent tax. |
| **S-4** | **On iOS the outbox drains only while the app is foregrounded** (§8.3), and this hits A− exactly as it hits everything else. | Behavioural mitigation only (§8.3). Residual: an unbounded silent non-durability window for the newest and most safety-relevant data, on the primary platform. **This is the strongest argument for the future native path (§15.2), and it should be instrumented from launch.** |
| **S-5** | **The local-ledger migration is unrecoverable on a device you cannot inspect.** V1 already did this: `drainLegacyStore` passed six unit tests, was never wired into a production path, a stale storage mirror shadowed good values, and **the owner's custom phosphate target band silently reverted to the shipped default.** | §13.6's rule set, plus frozen fixture databases per historical version exercised in a real WebKit browser in CI. Residual: bounded — in A− the recovery is a re-pull from `serverSeq = 0`, which is exactly what C does not have. |
| **S-6** | **XSS forges events into an append-only ledger that then protects the attacker** (§10.7). No report in the corpus addressed this. | The `QUARANTINE` / bulk-supersession event, the admission-batch identifier, and the session/device stamp — **all of which are schema decisions that must be made before the first row is written.** Residual: same-origin request forgery is not prevented, only made recoverable. |
| **S-7** | **The audit-record write path is the thing that actually grows**, and its size is unmeasured with a stated 10× uncertainty. It drives storage cost, sync payload, mobile bandwidth, IndexedDB quota pressure and export size **simultaneously**. | PRE-1 (§21) — measure it before choosing. Plus X5: define "actionable" narrowly and deliberately, which may reduce the path by an order of magnitude. |
| **S-8** | **A− accepts unverified assertions.** The ledger records what a client *claims* the engine said. A stale or corrupted client can write a wrong assessment and nothing catches it. | Server-authoritative minimum-version check on assessment-bearing writes; `engineVersion` + `computedOnDeviceId` stamps make skew queryable; the cross-engine golden job (§13.4). **Residual: materially weaker than A's guarantee, and this is the deliberate trade.** If it later proves wrong, §23.3 is the upgrade path and it requires no schema change. |
| **S-9** | **Shipping a new event type stops recommendations on every un-updated device** (§12.4). This is correct-by-canon and product-killing if undesigned. | Scoped refusal, boot-time version check with forced-update prompt, server-side staging of new event types. Residual: a permanent release-engineering discipline. |

### 17.5 SEVERE findings that bind every candidate

| ID | Finding | Notes |
|---|---|---|
| **U-1** | **The primary platform is the one CI cannot test** (§13.5). | Permanent recurring manual cost. Belongs in the operational budget. |
| **U-2** | **The Safari 26.x `change`-event defect will eat readings on every shipping iPhone today** (§8.3). | And a re-entered reading is a *reconstruction*, permanently degraded in precision class. Draft-persistence is mandatory, and a resumed draft must carry the original capture instant. |
| **U-3** | **`Clear-Site-Data` is simultaneously the incident-response tool and the data-destruction tool** (§10.7). | Needs the standalone export page and the versioned kill switch, designed before launch. |
| **U-4** | **Two one-way doors: the passkey RP ID and the VAPID private key** (§10.4). | Both cheap to get wrong on day one, both impossible to walk back. |
| **U-5** | **Account deletion versus the ledger** (§10.5). | Pseudonymise by construction, day one, or it is not retrofittable. |
| **U-6** | **The observability budget fails exactly when you need it** (§13.8). | Cap noisy classes; keep a non-vendor log path. |
| **U-7** | **The four-property provenance model means two read paths, and only one is deterministic** (§9.6). | Architecture-neutral; every candidate pays it; no candidate description accounted for it. |

### 17.6 A finding about the research corpus itself

**Two reports directly contradict each other** on WebKit storage eviction (one asserts FACT from
engine source; the other marks the identical claims UNRESOLVED and declines to assert them) **and
on the passkey device-support matrix** (one quotes it as FACT with a file path; the verification
worker states it was not retrieved and must not be cited).

**Neither contradiction is resolved.** §10.6 and §10.4 state both sides rather than picking one.
An adjudication that laundered either into a clean FACT would be building on sand — and the
passkey one is load-bearing for the entire account-recovery design.

---

## 18. RECOMMENDED ARCHITECTURE

**RECOMMENDATION — Candidate A− .** Restated concretely, so that "recommended" means something a
reader can act on or argue with:

| Layer | Shape | Why this and not the alternative |
|---|---|---|
| Client | Static installable PWA. No SSR, no server-rendered HTML. Built as a precached shell. | SSR is consumed once at install, conflicts with the precached shell, and creates a second render path for authoritative verdicts. It also forecloses a Tauri-style wrapper later. |
| Framework | A mainstream reactive framework, chosen for ecosystem depth and LLM-assistance quality, **not** for its data layer. | The decision that matters is that chemistry never enters a component (§15, K10/K12). Which framework holds the buttons is genuinely second-order and is listed as deferrable in §22. |
| Domain engine | One `engine` package. Plain TypeScript, **zero runtime dependencies**, no I/O, no clock, no `Intl`, no `Math.*` except `sqrt`. Pure functions taking `(events, policy, asOf)`. | Canon §65 already specifies this shape. It is what makes unit tests, browser, server, replay tooling and future native clients the same code. |
| Local store | IndexedDB behind a thin wrapper: append-only ledger store + durable outbox + **rebuildable** projections. Ledger writes use `durability:"strict"` and `add()` so a duplicate `eventId` raises rather than overwrites. | K1/K7. A merge-patch update API is the exact shape that destroys "absent ≠ zero", so the wrapper must not offer one. |
| Sync | Bespoke, small: transactional outbox → server-assigned dense `serverSeq` → cursor pull → idempotent `PUT` by client `eventId`. No tombstones. | The hard parts of general sync engines — mutable-row merge, tombstones, GC, LWW policy — are all **absent** here because the canon forbids deletion and mutation. This is the rare case where hand-rolling is genuinely smaller than adopting. |
| Server | One small application behind a **versioned API**. Single admission point: validates, stamps, assigns order, makes immutable. | The versioned API is what lets a three-week-old offline client upload without its events being reinterpreted (§8, K14). It is also the only place secrets can live. |
| Database | Managed Postgres. `numeric` for chemistry values. Table-level `REVOKE UPDATE, DELETE` on ledger tables. | Exact decimals, real constraints, transactional DDL, and — decisively — append-only becomes a **DB-enforced guarantee** rather than a convention the application promises. |
| Blobs | S3-compatible object storage, referenced by id from a separate mutable store. Never embedded in ledger payloads. | Makes erasure a deletion of the identity mapping rather than surgery on an immutable ledger (§10.5), and keeps blob backup on its own path. |
| Engine execution | **Client-side only.** The server stores the client's attested audit record; it does not re-execute to verify it. | See §20's treatment of A. This is the single deletion that most reduces the owner's permanent burden, and canon §47/M-10 does not require verification. |

**Why A− wins, compressed.** It is the only candidate that simultaneously (a) gives a
server-assigned total order and single admission point, which is what makes "what the app said
then" a provable claim rather than a hope; (b) keeps full offline capture, which is a
*data-quality* requirement under §2.3A and `DATA-PROVENANCE.md`, not a convenience; (c) puts
secrets and the push dispatcher server-side, which is mandatory anyway; and (d) does all of that
with three moving parts.

**What A− costs, stated plainly.** The largest bespoke-code surface in the set, owned by one
person. §7.2 enumerates it and §17 does not spare it. The judgement — and it is a judgement, not
a finding — is that a small protocol the owner can read, test, version and export from is a
better long-term risk than an off-the-shelf conflict model whose documented defaults violate K1,
K7 or K13, or a platform whose migration primitive is a distributed transaction that cannot be
made atomic.

**One standing obligation, not a gate.** The orchestrator's canon audit (§3.4) established that
the frozen Alk mathematics needs only `+ − × ÷`, squaring, `sqrt`, comparison and median — all
exactly specified. That is true of what is frozen **today**. It must be enforced permanently by a
lint ban on `Math.pow/exp/log/**` inside the engine package plus a cross-engine golden test in
CI, and re-checked whenever a new parameter canon is frozen. pH is natively logarithmic;
carbonate, salinity and ICP mathematics commonly use logarithms and fractional powers. This
obligation belongs in CI from the first commit, because retrofitting it after a domain has
shipped is how the guarantee dies quietly.

---

## 19. SECOND-CHOICE ARCHITECTURE

**Candidate D — edge shard-per-user.**

D is second not because it is a diluted A−, but because it is genuinely better on two axes that
could plausibly become decisive, and worse on one that currently is.

**What D wins on.**

- **Per-user point-in-time restore as a platform primitive.** Restoring one user's data is an API
  call, not an hours-long operation against a whole-project backup. No other candidate offers
  this.
- **Physical per-user partitioning.** Cross-tenant leakage is a routing bug, not a missing
  authorization policy — structurally stronger than any policy-based isolation.
- **Best cost curve at scale**, and a server runtime in the same engine family as the browser.

**What keeps it second.** Its migration story is a distributed migration across thousands of
independent shards with no enclosing transaction, executed under a serverless execution limit, in
a SQLite dialect with restricted `ALTER TABLE`. That cost is paid on **every schema change,
forever, by one person** — and a partially-applied fan-out leaves the fleet in mixed schema
states, which for this product means some users' engines refuse while others do not. For a
correctness-critical product with a bus factor of one, a recurring distributed-migration risk is
worse than a recurring line item.

**Named triggers that should promote D over A−** — these are conditions, not vibes:

1. **Per-user point-in-time restore becomes a product promise** (e.g. it appears in marketing, in
   support policy, or in a paid tier).
2. **P1 shows the audit record is very large** (the 10× case), making per-user storage isolation
   and the cost curve dominant.
3. **The managed-Postgres backup/PITR line item is confirmed to be a large fixed cost** that
   materially delays profitability at low user counts — a question P3 must close, since no pricing
   page was reachable in this session.
4. **Multi-tenant blast radius becomes the primary risk** in the owner's own judgement after a
   security review.

---

## 20. WHY THE OTHER CANDIDATES LOST

**Candidate A (A− plus server-side engine re-execution) — lost narrowly, on cost/benefit, not on
correctness.** A is architecturally sound and canon-compliant. The determinism objection against
it has been withdrawn: §3.4 establishes that bit-identical cross-engine results are achievable for
the frozen Alk canon, so re-execution would not be a mismatch generator today. It lost on three
remaining grounds. First, canon §47/M-10 requires the audit record to be persisted **or**
deterministically reconstructable — it does not require the server to verify it, so this is an
elective obligation. Second, verification defends weakly against the only realistic adversary in a
single-user-per-tank consumer product: the person forging their own audit record is the person the
record exists for. Third, it imports two permanent costs — every historical engine build must stay
runnable forever, and a MISMATCH outcome needs a remediation path nobody has designed. **A is a
strict superset of A−, and can be added later without a schema change provided the audit record
pins its input set from day one (§9.2, item 5).** That is why A− is framed as a deferral, not a
rejection.

**Candidate B (managed BaaS, client-direct via RLS) — rejected.** It carries the corpus's only
FATAL security finding: one migration that omits `ENABLE ROW LEVEL SECURITY` on a new table
publishes every user's ledger as world-**writable**, and forged dose events then feed a
deterministic engine that cannot distinguish them from real ones. In this product that is a
physical-harm path, not a privacy incident. Second, the schema **is** the API, so a migration jams
the offline upload queues of precisely the users who have been offline longest — the failure lands
hardest on the people it hurts most. Third, its advertised advantages (least server code, fastest
start) do not survive requirements B already has to meet: secrets must be server-side and push
requires a dispatcher, so the server appears anyway. B is therefore **dominated by A−** rather
than a trade against it — equal-or-worse on every axis except time-to-first-demo, which is the
least valuable property on this brief.

**Candidate C (strongly local-first, cloud as replica) — rejected as presented.** Its durability
rests on an undocumented implementation detail: the exemption that would let an installed web app
escape eviction is visible in WebKit source but Apple publishes **no** user- or developer-facing
statement of it (`verify-a` §1). Building a paid product's system of record on an unpublished
engine behaviour is not a risk this owner should carry. Beyond durability: the Safari-tab →
Home-Screen install transition copies cookies but not IndexedDB, forking or destroying the system
of record with no merge path; C cannot deliver the retest-reminder workflow the vision names as
core, because no PWA can schedule a future local notification without a server; both of its
candidate sync implementations violate K1/K7/K13 in their **documented default** conflict modes;
and support is blind, because at 2am the only copy of the data is on a stranger's phone. **The
steel-manned C — an append-only local log with hand-rolled push/pull to a dumb durable store — is
legitimate, and it converges on A−.** That is the honest reading: C's good idea is already inside
the recommendation.

**Candidate M (the boring monolith) — lost, but it is the closest runner-up on operational
burden and deserves to be re-read before scaffolding.** M is A− with the vendor glue removed: one
repo, one process, one Postgres, self-hosted. It scores best in the matrix on operational
simplicity, data longevity and lock-in, and it is the only candidate with no vendor dependency to
exit from. It lost because it moves work the owner currently gets for free — patching, TLS,
backup scheduling and verification, uptime, scaling — onto the one person whose time is the
binding constraint, and because managed Postgres preserves M's exit path anyway (§23). **If P3
reveals that managed hosting and backup costs are materially worse than expected, M is the
fallback, and the switch is cheap precisely because A− keeps the data in plain Postgres.**

**Candidate E (conventional cloud-authoritative thin client) — correctly rejected, and for a
better reason than "it isn't offline".** E fails DEC-007/DEC-008 on its face. The deeper objection
is that it **systematically degrades the analytical eligibility of the product's own data**: a
keeper in a garage with no signal logs from memory later, the capture instant becomes a
reconstruction, and §2.3A plus `DATA-PROVENANCE.md` §2 forbid fabricating it. E would therefore
manufacture, as normal operation, exactly the category of degraded record that V2 exists to stop
manufacturing.

---

## 21. DECISIONS THAT MUST BE MADE BEFORE SCAFFOLDING

### 21.1 Three cheap evidence-closing actions

None of these is expensive; all three change decisions if they come back unexpectedly.

**P1 — Measure a real audit record.** Hand-build one representative audit record against canon
§47's ~35 mandated fields, **including the available/used/excluded cluster sets and the exclusion
reasons**. Serialise it. Measure it. Every storage, sync-payload and cost conclusion in this
dossier rests on an assumed ~4 KB/event that the source report itself concedes could be 40 KB. A
10× miss moves several matrix cells and is one of D's named promotion triggers. *(Referenced as
PRE-1 in §7.3.)*

**P2 — CLOSED.** Audit the canon's mathematics for implementation-approximated operations. Done;
see §3.4. Converts to the standing CI obligation described in §18.

**P3 — Close the blocked sources from an unrestricted network.** This session's egress policy
blocked essentially every vendor pricing page and most specification sites (§25). At minimum,
before committing money or a provider: the managed-Postgres backup/PITR pricing and plan
requirements; payment-provider fees including any billing surcharge; and the merchant-of-record
comparison. Also re-verify the handful of platform claims marked UNRESOLVED in §12 and §10.

**P4 — Resolve the two direct contradictions in the corpus** rather than picking a side by
preference: the passkey device-support matrix (load-bearing for the entire account-recovery
design) and the WebKit storage-eviction claim. §10.4/§10.6 currently state both sides.

### 21.2 Design decisions that are unrecoverable if deferred

These are cheap now and impossible or very expensive later. They are the real content of this
section.

1. **Freeze the event envelope** — all ten properties in §9.2. Items 1, 3, 4, 5, 8, 9 and 10 are
   individually unrecoverable: a ledger written without `basedOnVersion` cannot detect contested
   states, and one written without a pinned input set on audit records will silently rewrite
   history the first time a second device syncs.
2. **Time is a tagged union, never a nullable timestamp column.** Date-only stays date-only, at
   every layer (§9.3, K6, D5).
3. **Pseudonymisation by construction.** Opaque `userId`/`tankId` in the ledger; all personal
   data, free text and blobs in a separate mutable store referenced by id. **Not retrofittable**
   once users have typed free text into event payloads — and it is what makes erasure compatible
   with an immutable ledger.
4. **Numeric representation at rest.** Exact decimal, plus the raw string the user typed. Never a
   binary float as the stored truth.
5. **The engine is its own package with `"dependencies": {}`**, enforced mechanically (package
   exports, TS project references, lint rules, a dependency checker) so the boundary is a
   CI-assertable fact rather than a convention.
6. **Service-worker update strategy: `prompt`, not auto-update**, decided before first production
   deploy. Auto-update can discard a half-entered reading, and the tooling's own documentation
   notes that switching strategies later is painful.
7. **Input handling for numeric entry.** Own the parsing; do not rely on `<input type=number>`,
   which sets `value` to `""` on unparseable input — indistinguishable from empty, and `Number("")`
   is `0`. Persist drafts on debounced `input` and on `visibilitychange`/`pagehide`, never on
   `change`, and a resumed draft must carry its **original** capture instant.
8. **Entitlement modelled as grants with a `source` discriminator**, even if only one source
   exists at launch. This is the cheap hedge that keeps a future App Store in-app-purchase grant
   from requiring a data migration.
9. **The client never talks directly to the database.** Settled by three independent requirements:
   server-side secrets, a versioned API that decouples schema from a possibly-month-old cached
   shell, and httpOnly cookie sessions.
10. **Never clear local data on sign-out**, and never gate local reads/writes on auth state. The
    catastrophic bug in this product is not a spurious logout; it is a logout handler that
    destroys days of unsynced dose events.

### 21.3 Vendor decisions that must be taken (but only after P3)

- Managed Postgres provider — evaluate primarily on **restore**, not on write throughput:
  can the owner recover one user's data, and can migrations be rehearsed against realistic volumes?
- Identity approach — evaluate primarily on **exit**: can users and their password hashes be
  exported? Only self-hosted-in-your-own-database options answer this unambiguously.
- Payment — Stripe-direct versus a merchant of record. For a solo owner selling worldwide, the
  question is not the fee spread but **who owns worldwide tax registration and filing**.

---

## 22. DECISIONS THAT CAN SAFELY BE DEFERRED

Each of these is genuinely reversible, provided §21.2 is honoured.

| Deferred decision | Why it is safe to defer | What keeps it safe |
|---|---|---|
| **AI vendor and whether AI ships at all** | AI sits above the engine and writes nothing to the ledger. | The proxy endpoint pattern and a versioned "domain state summary" contract; AI proposes a draft that goes through the *same* validation as manual entry. |
| **Server-side engine re-execution (candidate A)** | Strict superset of A−. | Audit records pin their input set from day one (§9.2 item 5). |
| **Native clients** | The engine is plain TypeScript; a wrapper or native shell consumes the same package and API. | Chemistry never enters a component — enforced in CI from commit one. |
| **Adopting an off-the-shelf sync engine** | The protocol is small and replaceable behind the outbox boundary. | Conflict semantics stay in owner-written code, because no engine implements K13. |
| **Frontend framework specifics, charting library, component library** | None of them touch the ledger or the engine. | The engine/UI boundary. |
| **Push delivery provider** | The scheduler output is the contract; delivery is interchangeable. | Notifications render scheduler output verbatim and never compute chemistry dates (K10). |
| **Multi-tank UI, sharing, export formats beyond the canonical one** | Additive product surface. | `tankId` present in the ledger from day one. |
| **Calculator/product catalogue storage** | Versioned reference data, separate from the ledger. | Brand/product/version/source/source-date carried as data (DEC-006). |
| **Observability vendor** | Swappable. | Privacy scrubbing decided as policy, not as a vendor feature. |

**Explicitly NOT deferrable, despite looking like it:** the push/notification *server*. It is
required at launch because no PWA can schedule a future local notification without one.

---

## 23. MIGRATION / EXIT PATH IF THE RECOMMENDATION PROVES WRONG

**The single thing that makes this reversible: build the canonical ledger export in the first
month.** Full events plus blobs, canonical JSON, hash-chained, with the schema version and
upcaster-chain version recorded. It is simultaneously the data-portability obligation, the
disaster-recovery backstop, the migration path off any provider, and the artefact that turns the
provider choice from permanent into merely inconvenient. **RECOMMENDATION: treat it as part of the
first milestone, not a later feature.** A product that cannot export its ledger has already chosen
its vendor forever.

**What is portable, and what is not.**

| Asset | Portability | Notes |
|---|---|---|
| Event ledger | **High** | Append-only, delete-free, plain data. This is the product's actual value. |
| Audit records | **High**, if stored | The argument for storing rather than reconstructing (§9.4) is also a portability argument. |
| Blobs | High | Object storage is commodity; S3-compatible APIs are near-universal. |
| Postgres schema | High | Plain SQL migrations; `pg_dump` is a real exit. |
| Auth/user records | **Medium to low** | Depends entirely on password-hash exportability — the reason §21.3 says to choose identity on exit terms. |
| Sync protocol | High (it is yours) | Bespoke code is portable code. |
| Entitlement/billing state | Medium | Reconstructable from the payment provider, which is why entitlement must derive from the provider's subscription object rather than from accumulated webhook side-effects. |

**Exit costs by scenario.**

- **A− → A (add server verification).** Cheapest path; no schema change; additive. Requires
  retaining engine build artifacts from the point verification begins.
- **A− → M (self-host).** Low. Same code, same Postgres; the owner takes over operations.
  Managed Postgres deliberately preserves this.
- **A− → D (edge shards).** Moderate. Same engine and event model; new storage topology, new
  migration tooling, and a numeric-fidelity check on export. Triggered by §19's conditions.
- **A− → a sync vendor.** Moderate, and deliberately bounded: the outbox is the seam. Conflict
  logic stays owner-written under any engine.
- **Provider swap within A−.** Low, and this is the point of the design.

**The one genuinely irreversible thing** is not a vendor. It is the event envelope (§21.2 item 1).
Get that wrong and no exit path helps, because the history itself will be missing the fields that
make it interpretable.

---

## 24. OPEN QUESTIONS

Owner decisions and unresolved evidence, separated because they close differently.

### 24.1 Requires owner judgement (no amount of research closes these)

1. **Is per-user point-in-time restore a product promise?** Answering yes materially strengthens D.
2. **Stripe-direct or merchant of record?** Really a question about how much tax-compliance
   administration the owner is willing to personally own.
3. **What happens to a lapsed subscriber's data?** This dossier recommends read-only history plus
   unrestricted export always, and continued local logging — but the policy is the owner's.
4. **Maximum supported offline period.** It bounds session/refresh design and must be a stated
   product property rather than an emergent one.
5. **Does the V1→V2 dual-run comparison harness (canon §54) still apply**, given DEC-001 and
   DEC-011 changed the repository and cutover model? The methodology may still be wanted even
   though the structure has changed.

### 24.2 Unresolved evidence (closable by research, mostly by P3/P4)

6. **All vendor pricing.** Nothing in this document states a price. §11 is structural only.
7. **The audit record's real size** (P1) — the dominant cost variable, currently a guess.
8. **Passkey device-support matrix** and **WebKit storage-eviction behaviour** — the corpus
   contradicts itself on both (P4).
9. **Whether Apple documents the Home Screen storage exemption anywhere citable.** Currently the
   claim rests solely on engine source. Nothing publishable in a risk register.
10. **iOS push subscription persistence across app delete/re-add** — Apple's documentation is
    silent; only field reports exist.
11. **Whether a future iOS client would need in-app-purchase parity** for a web-purchased
    subscription outside the US storefront. §21.2 item 8 is the hedge, not the answer.
12. **Google Play's Health/Medical and wrapper policies** as applied to a dosing calculator —
    unreachable in this session, and nobody has assessed the regulatory question at all.
13. **Whether hand-rolling the sync protocol is genuinely lower long-term burden** than adopting
    an engine. This dossier says yes, on the reasoning that append-only removes the hard parts.
    It deserves a time-boxed spike rather than permanent confidence.
14. **The near-duplicate-dose detection window** — a chemistry/product question with no owner yet,
    and it belongs to a canon, not to this document.

---

## 25. PRIMARY SOURCES

### 25.1 SOURCE ACCESS LIMITATIONS — read before trusting any citation here

**This session's egress policy blocked most of the intended primary sources.** Attempts returned
HTTP 403 on CONNECT (organisational policy denial). The proxy documentation instructs that such
denials be reported rather than routed around, and they were not routed around.

**Blocked (not fetched):** `developer.mozilla.org`, `w3.org`, `webkit.org`, `web.dev`,
`developer.chrome.com`, `caniuse.com`, `tc39.es`, `sqlite.org`, and essentially every vendor
site and **every pricing page** — including the payment providers, the database and hosting
providers, and the identity providers.

**Reachable and actually used as primary sources:** `developer.apple.com` (including its
documentation JSON API and Safari release notes), `developer.android.com`,
`raw.githubusercontent.com`, `registry.npmjs.org`, and `nodejs.org`.

**The mitigation, and why it is legitimate.** GitHub hosts the *authoritative source* of most
W3C/WHATWG/WICG specifications (Bikeshed `.bs` and `index.html` source), and most vendors keep
their documentation source and release history in their own public repositories. Reading
`w3c/ServiceWorker/index.bs` is reading the specification, not a summary of it. For Safari
behaviour, the `WebKit/WebKit` engine source is stronger evidence than the (blocked) engineering
blog. Package identity, versions and publish timestamps came from the npm registry, which is
publisher-controlled.

**What this materially limits:**

- **All cost analysis.** No price is stated as fact anywhere in this dossier. §11 is structural.
- **Confidence in browser-support breadth**, since `caniuse.com` and much of MDN were unreachable;
  `mdn/browser-compat-data` was used where possible.
- **Two contradictions in the corpus remain unresolved** (passkeys; WebKit eviction) — P4.

**A research-integrity incident, recorded deliberately.** During the research one fetch returned
an empty body and the summarising tool **generated plausible-looking Firestore prices that no
source supported**. It was caught by a guarded re-fetch and quarantined. It is recorded here
because it is the precise reason this dossier prefers a stated gap to an estimated number: the
danger is not a missing figure, it is a figure that appears with no provenance and is then
trusted.

### 25.2 Load-bearing primary sources

Retrieved 2026-08-19 unless noted. The full corpus cites ~400 distinct URLs across ten reports in
`docs/research/` working material; the following are the ones that decisions actually rest on.

**Web platform specifications (source repositories)**

- Service Workers — `https://raw.githubusercontent.com/w3c/ServiceWorker/main/index.bs`
- Storage Standard — `whatwg/storage` (persistence and eviction; note the "may be cleared without
  user consent" language is a **non-normative note**, and the eviction clause is *should*)
- IndexedDB — `https://raw.githubusercontent.com/w3c/IndexedDB/main/index.bs` (`durability` hints)
- Push API — `https://raw.githubusercontent.com/w3c/push-api/master/index.html`
- Web App Manifest — `https://raw.githubusercontent.com/w3c/manifest/main/index.html`
- HTML Standard — `whatwg/html` (floating-point value sanitisation; `beforeunload` sticky activation)
- ECMAScript — `https://raw.githubusercontent.com/tc39/ecma262/main/spec.html` (IEEE-754
  guarantees; the "implementation-approximated" latitude for transcendental `Math` functions)
- WCAG 2.2 — `https://raw.githubusercontent.com/w3c/wcag/main/guidelines/index.html`
- Notification Triggers — `WICG/notification-triggers` and Chrome's own documentation source
  (`GoogleChrome/developer.chrome.com/.../notification-triggers/index.md`), establishing abandonment
- Periodic Background Sync — `https://raw.githubusercontent.com/WICG/periodic-background-sync/main/explainer/explainer.md`
  (timed firing declared an explicit non-goal)

**Engine source (stronger than blocked vendor blogs)**

- `WebKit/WebKit` — `Source/WebKit/NetworkProcess/storage/NetworkStorageManager.cpp`,
  `.../Classifier/ResourceLoadStatisticsStore.{h,cpp}`, `Source/WebKit/UIProcess/WebsiteData/WebsiteDataStore.cpp`
  (persistence exemption list; the 30-day/7-day *operating-day* windows)
- `chromium/chromium` — `components/webapps/browser/installable/installable_evaluator.cc`
  (installability criteria; no service-worker requirement)

**Apple (reachable, and the only first-party source for iOS behaviour)**

- App Store Review Guidelines — `https://developer.apple.com/app-store/review/guidelines`
- Safari 26 release notes — `https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes`
- Sending web push notifications in web apps and browsers (Home Screen requirement; gesture
  requirement; badging; the rule that a push must display a notification)
- WWDC23 session 10120 (storage separation at install)
- DMA / alternative browser engines support pages

**Vendor documentation source repositories**

- `supabase/supabase` → `apps/docs/` (row-level security and its danger admonition; backups and
  point-in-time recovery plan requirements; free-tier pausing; CLI migrations)
- `cloudflare/cloudflare-docs` → D1 limits, Durable Objects storage and PITR, R2 pricing model,
  Workers limits
- `automerge/automerge.github.io` (storage/history growth), `yjs/yjs` (tombstone growth)
- `electric-sql/electric` (read-path sync only; write path explicitly out of scope),
  `powersync-ja/powersync-*` (client Apache-2.0, service FSL), `rocicorp/mono` (Zero status),
  `pubkey/rxdb` (default conflict handler), `aspen-cloud/triplit` (AGPL)
- `OWASP/CheatSheetSeries` — HTML5 security cheat sheet

**Package identity and maintenance evidence**

- `registry.npmjs.org` — versions, publish timestamps and declared licences for every candidate
  dependency (the primary evidence for "is this project alive").

**Project-internal authority (not external, but binding)**

- `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md` — `SHARED_V2_FREEZE_2` / `ALK_V2_FREEZE_4`.
  Cited throughout by section and line: §2.2A, §9, §13, §46, §47, §50, §54, §57, §64, §65,
  Part II §2–§5, and the Part III capability contract.
- `docs/migration/DATA-PROVENANCE.md`; `DECISIONS.md` DEC-001 … DEC-015.
- **Orchestrator canon audit, 2026-08-19** (§3.4, §18): method and results recorded in the
  research working material; re-runnable by grepping the canon for logarithm, exponential,
  trigonometric and non-integer-power notation. Result: none present; the only exponent in the
  document is `^2`.

---

*End of dossier. This document recommends; it does not decide. `DECISIONS.md` remains untouched.*
