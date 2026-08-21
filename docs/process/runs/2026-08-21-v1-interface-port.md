# 2026-08-21 — Replacing the V2 interface with V1's

Run type: attended application work. **Not canon-changing** — no rule,
threshold, band edge or equation was added, removed or altered. `engine/`,
`docs/canon/` and `tools/conformance/` are byte-identical to the base commit,
verified by hash.

Branch: `claude/replace-v2-with-v1-interface-sv0cey` · Base commit: `6477ead`
V1 read at `9276a2ca254e88d19e0f02dced42a1b896499780`, read-only.

---

## Why this run happened

The owner used the V2 interface and rejected it. The instruction was to bring
V1's across — and, the part that mattered, to bring it across as **code**:

> Previous briefs said "port from V1 source, do not reimplement." Nothing
> checked it. Every other rule in this project carries a mechanical test that
> fails when the rule is broken; that instruction carried nothing, so the build
> wrote its own version of everything and the result was worse than the thing
> it replaced.

So the deliverable was never only a working app. It was a working app plus a
mechanism that makes "this is a port" checkable by somebody who was not here.

---

## The mechanism

`docs/migration/PORT-MANIFEST.md` records, for every file taken from V1: the V1
path and commit, the SHA-256 of the original and of the ported file, and the
complete unified diff with a reason on every hunk drawn from the five the brief
fixed.

`tools/port/check-port-manifest.mjs` reverse-applies the recorded diff to the
ported file and hashes the result. If that hash equals the recorded V1 hash,
the recorded diff is the **whole** difference — a changed line that is not
recorded would survive the reverse-apply and change the hash. It needs no V1
checkout, so it runs on any tree, forever.

`tools/port/mutate-manifest.mjs` proves all five arms of that check can fail,
on V1's own rule that a check that cannot fail is worse than no check.

It earned its place during the run: it went red on three files after a
late fix and refused until the manifest was rebuilt.

**25 files taken. 5 byte-identical. 112 differences: 41 chemistry removed, 47
data source rewired, 18 wording replaced with engine output, 6 defect fixed.**

---

## What crossed, and what did not

**From V1: the interface.** Five tabs. The due bar that expands into rows that
take a reading in place; the two-column parameter grid; the detail sheet with
its four period boxes; the Test Lab checklist; the month calendar and the
shared reschedule sheet; the three moments; the toast; and `ZoomableChart.jsx`
with `niceAxis` and the gesture handling, verbatim apart from one named defect
fix — it never received a unit or a parameter name at any of V1's four call
sites, and now requires both and refuses to draw without them.

**From V2: the engine, the canon and the gate, untouched and byte-identical.**
The ledger, stored assessments, the configuration history and the import kept
their shapes and their rules.

**And a correction to what this record first said.** It claimed the storage
layer was "verified byte-identical by hash" too. That was wrong, and a test
review caught it. Three storage files changed:
`store/schedule.js` gained V1's `recent` bucket, which the V2 port of that file
had dropped and the ported reminders panel reads; `assess.js` had `describe()`
moved out of the storage try and gained an injection point so canon §64's
version stamping could be tested at all; and `store/ledger.js` is unchanged but
is now covered by more of them. Only `engine/`, `docs/canon/` and
`tools/conformance/` are byte-identical, and that is what the claim should have
said. The `recent` bucket now has a boundary test and a control (`SCHED-13`,
`AM-P29`).

**No V1 chemistry crossed.** `readingVerdict` (390 lines of classifier inside a
UI component, carrying V1's only ammonia branch), `paramStatus`,
`computeControl`, `computeStability`, `deriveTankState`'s nine engines, the four
dose engines, the dilution preview and the ICP reference bands are deleted
rather than ported.

---

## What the run found that it did not go looking for

Six things, each recorded rather than argued away. The last two came from an
independent test review and are the reason there was a fix pass.

1. **The existing suite caught two real defects in the wiring.** `TM-25` found
   configuration versions being stamped from the wall clock instead of the
   application clock — which would have made every backdated assessment refuse.
   `TM-23` found four modules reaching past the one clock. Both fixed before
   anything shipped.

2. **`assess.js` reports an engine that cannot start as an unreadable record.**
   `describe()` sits inside the same `Promise.all` as the two storage reads,
   inside the try whose catch returns `STORAGE_UNAVAILABLE`. The interface no
   longer repeats it — it prefers the engine client's own state — but the
   mislabelling is still there. Recorded open.

3. **`toEngineEvents` does not filter `MANUAL_CORRECTION` by parameter**, so a
   calcium one-off would arrive as an alkalinity one. The one-off form is
   alkalinity-only and says so, rather than creating a wrong record. Recorded
   open.

4. **The Setup card pattern the brief asked to port is not in V1's source.**
   V1's `Setup.jsx` is a flat list of plain cards; `original-artifact.html` has
   nothing like it either. Both were searched. It is built to the brief's
   description in V1's visual language and is deliberately **absent from the
   manifest**, because there is no original to diff it against.

5. **A fabricated noon, and a test that forbade its repair.** The lighting,
   note and ICP recorders wrote `stamp(date, "12:00")` — `EXACT_ABSOLUTE` on
   forms with no time box — which `DATA-PROVENANCE.md` §61 forbids by name and
   which the append-only ledger would have made permanent. A regression this
   port introduced. `PORT-10`, the test named for the rule, was green while it
   existed and **red when it was fixed**. Both are fixed; the test now drives
   every recorder and reads what it wrote.

6. **Rule 3 was not enforced at all.** `PORT-08` handed the version stamps in
   and asserted they came out, and `replay()` — canon §64's implementation —
   had no test that called it. A single hardcoded line in `assess.js` could
   have made every stored stamp a fiction with the whole suite green.
   `PORT-08` now runs the real path against a sentinel, and `PORT-15` drives
   replay's three conditions separately.

---

## What was lost

`docs/migration/PORT-OMISSIONS.md`, in full, is the deliverable the brief calls
second most important. The three that matter most:

- **There is no way to correct or delete a reading.** V1's affordance was on a
  screen that did not cross; V2's was on a screen that was deleted. The store's
  rule — a correction may not improve a record's time provenance — still holds
  and is tested. Only the surface is missing.
- **Test mode kept its mechanism and lost its surface.** `store/mode.js` and
  `TM-01`…`TM-25` are intact; nothing reaches them. `TM-24` now asserts exactly
  that rather than passing quietly.
- **The offline shell is gone.** `app/sw.js` precached a hand-written list of
  files that no longer exist.

---

## The gate

The conformance harness's output is **byte-identical to the base commit** —
same 11 fixture, 5 check and 3 invariant failures, all pre-existing and all
documented. `run-mutations.py` is green. `DEC-016`'s test is "the change must
not make it worse", and it does not.

Application layer: **165 checks, 180 mutations, all caught** — after a fix pass
that rewrote six of the port's own tests. The first versions of `PORT-01`…
`PORT-07` were spelling pins, and a review walked nine realistic evasions
through them; each is closed and each has a control.

The port manifest is now the first check the application run performs. It had
been an npm script nothing called, and it sat red across two commits of this
run without anyone noticing — a gate that can do that is a gate in name.

---

## The two meta-checks, and why they exist

`META-01` fails when a test has no mutation that turns it red. It found
twenty-five on the day it was written; twenty-three pre-date this port and are
on a named exemption list that can only shrink. Four of the twenty-five were
this port's — tests it re-pointed and left without controls, under a note in
`mutations.mjs` asserting that had not happened. That note was false and is
corrected.

`META-02` requires every file under `app/src` to be either in the port manifest
or declared V2's own. Without it a file lifted from V1 and never entered in the
map was invisible, which a review demonstrated by copying one in and watching
the manifest stay green.

---

## Decisions recorded

`DEC-024` — the interface is V1's, and it brings V1's toolchain with it. React,
recharts, Vite and Tailwind enter the repository as a consequence of the
decision to port rather than reimplement, not as a preference about frameworks.
