# Round five — what was built, and what is left open

Branch `claude/round-5-instructions-95ii21`, based on round four's head
`2bc6df5`. Round four was an open pull request when this round started, so
branching off `main` as the brief said would have discarded it; `main` has since
merged it (PR #19) and this branch has merged `main` back in twice.

---

## The one rule for this round

> Nothing may be reported fixed on the basis of reading the code.

Every item below that is visible on a screen was reproduced in a real Chromium
at a 390×844 viewport before it was touched, and watched again afterwards.
`tools/app/check-viewport.mjs` is the check that stayed behind; it was watched
going RED with the defect reintroduced before it was kept.

---

## Two structural facts found on the first day

**The findings are not about `tank-wizard`.** The session was pointed at it and
nothing in it matches the report — no `PORT-13`, no deletion code, no Dosing tab
of the kind described. The app is `dosing-wizard-v2`.

**Round four was unmerged.** It was PR #19, open. "Work on a fresh branch off
main" taken literally would have re-broken everything round four fixed.

---

## Open, recorded rather than fixed

### The register sweep — the largest single thing left

`app/src/strings.js` holds roughly **180** sentences that name the software:
"the app", "the engine", "we". The owner's items 10 and 14 named specific ones
and those are fixed, along with every sentence on a surface this round touched.
The rest is a language pass in its own right — it is `jake`'s job across the
whole file, and doing it in a tail-end sweep would produce 180 sentences nobody
read carefully.

**What it needs:** one pass, one reviewer, one commit, with the register stated
once at the top and each sentence rewritten to say the same thing about the tank
rather than about the software.

### Item 1 — the deletion test's blind spot, half closed

The owner's concern was that the test proves a deleted reading is gone by asking
the store whether it is gone. `COR-03` already reads `store.backend`, one layer
below the store's own report, so it does not take the store's word for it.

**What is still missing:** it runs against the memory backend. The real one is
IndexedDB, and a backend that reports a delete correctly while IndexedDB does
not would still pass. The honest closure is a browser check that deletes a
reading, hard-reloads, and confirms it is still gone — which is also the
reefkeeper's own rule ("a thing is only gone when it is still gone after a
reload"). Not built.

### Target ranges for parameters other than alkalinity

Owner finding 18 asked for a two-handled bar and said, in the same breath, that
the three width thresholds are his, for alkalinity, in dKH, and do not transfer.
The bar is built and it refuses to grade any parameter it has not been told the
thresholds for. The other seven parameters still use the older editor in their
own sheet.

**This is an owner decision, not an omission:** generalising the thresholds
needs figures for calcium, magnesium and the nutrients that nobody has stated.

### Two things the owner should know were judgement calls

**The delivered dose is not locked** (finding 16 said locking applies to the
whole of Setup). It is the one field designed to be used repeatedly, and it
already answers the question locking exists to answer — a toast, an entry in the
history beneath it, and the dose-change moment. Say the word and it will lock
like the rest.

**"How close is close" is not stated** in the potency box's new sentence. The
owner's wording said the estimate was "close to" the figure entered. How close
is close enough is a threshold, thresholds about strength are the canon's, and
there is none — so both numbers are stated side by side and the keeper judges
the gap himself.

---

## Answered by measurement, where the brief demanded it

**Item 3 — the water-change markers are REAL.** Imported a V1 backup shaped like
the owner's and counted what the import wrote: 25 `WATER_CHANGE` events. They
are not invented and they are not another kind mislabelled. They came from his
own V1 backup, where V1 seeded them on first run — which is why he never logged
one.

Why they appeared nowhere else: the calendar folded a water change into a day
that already had a task completion on it, and did nothing where there was none.
None of his 25 has a matching completion, so every one was skipped, while the
charts read the ledger directly and drew all 25.

**Item 4 — the calendar was not the problem.** It walks back month by month and
holds the whole record; six months of it, measured. The reminders panel was what
he was reading: 14 days by default, nothing past 30.

**Item 26/28 — the assessment never stopped recomputing.** Canon groups
measurements taken within thirty minutes into one test and resolves it to the
median. The words came from that resolved observation and were right; the
numbers came from the ledger's last row and were a measurement. Two sources on
one card.

**Item 9 — the calendar's trash deleted a tick.** Not a reading. One surface
read ticks and noticed; five read readings and had nothing to notice.

---

## The conformance gate

**RED, unchanged.** Baseline taken before any work: 31 fixture failures, 5 check
failures, 8 invariant failures, reporting `NO ENGINE SUPPLIED` because it is run
without the `--engine` argument. This round changed none of those counts. The
application suite is the gate this round moved: 259 checks green, 281 mutations
defined and all caught.
