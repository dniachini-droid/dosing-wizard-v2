/* ============================================================================
   THE EVENT LEDGER — append-only, and time provenance that never improves
   ----------------------------------------------------------------------------
   These are the two rules that cannot be retrofitted. An edit in place destroys
   the input a stored assessment was computed from; a time provenance that
   improves fabricates a precision the record never had, and afterwards nothing
   can tell the fabricated ones from the real ones.

   Each check here is named in `mutations.mjs`, which states the source change
   that must turn it red. `run-app-tests.mjs --mutations` proves each one does.
   ========================================================================= */

import { suite, eq, ok, deepEq, throws } from "./harness.mjs";
import { createMemoryStore } from "../../app/src/store/index.js";
import { EVENTS } from "../../app/src/store/db.js";
import { ANNOTATION, KIND, makeEvent, sortLedger, toEngineEvents } from "../../app/src/store/ledger.js";
import { dateOnly, exactInstant, PROVENANCE, assertProvenanceNotImproved } from "../../app/src/store/time.js";

const s = suite("the event ledger");

const AT = (d, t) => exactInstant(d, t, 600, "Australia/Sydney");
const reading = (v, time, extra = {}) => ({
  kind: KIND.READING,
  parameter: "ALK",
  rawValue: String(v),
  normalizedValue: v,
  unit: "dKH",
  time,
  recordedAt: "2026-08-20T09:00:00Z",
  ...extra,
});

/* -------------------------------------------------------------------------
   A stored record survives a round trip byte for byte.
   ---------------------------------------------------------------------- */

s.test(
  "LED-01",
  "an event round-trips through storage unchanged",
  async () => {
    const store = createMemoryStore();
    const written = await store.ledger.append(reading(8.7, AT("2026-08-20", "07:40")));
    const [read] = await store.ledger.allEvents();
    deepEq(read, JSON.parse(JSON.stringify(written)), "the stored event");
    eq(read.rawValue, "8.7", "the raw value, as typed");
    eq(read.normalizedValue, 8.7, "the normalized value");
    eq(read.unit, "dKH", "the unit");
    eq(read.schemaVersion, 1, "the schema version");
    ok(read.eventId, "an event id");
    ok(Number.isInteger(read.eventOrdinal), "an append ordinal");
    ok(read.recordedAt, "a recorded time");
  }
);

/* -------------------------------------------------------------------------
   Nothing is ever overwritten.
   ---------------------------------------------------------------------- */

s.test(
  "LED-02",
  "a correction appends and leaves the original exactly as it was",
  async () => {
    const store = createMemoryStore();
    const first = await store.ledger.append(reading(8.7, AT("2026-08-20", "07:40")));
    const before = JSON.stringify(await store.backend.get(EVENTS, first.eventId));

    await store.ledger.append(
      reading(8.9, AT("2026-08-20", "07:40"), {
        supersedes: first.eventId,
        recordedAt: "2026-08-21T09:00:00Z",
      })
    );

    const after = JSON.stringify(await store.backend.get(EVENTS, first.eventId));
    eq(after, before, "the superseded event, byte for byte");

    const events = await store.ledger.allEvents();
    eq(events.length, 2, "both events are in the ledger");

    const rows = await store.ledger.projection();
    eq(rows.find((r) => r.event.eventId === first.eventId).state, "SUPERSEDED", "the original's state");
    eq(rows.filter((r) => r.state === "CURRENT").length, 1, "how many are current");
  }
);

s.test(
  "LED-03",
  "marking an entry suspect adds an annotation and touches the entry not at all",
  async () => {
    const store = createMemoryStore();
    const ev = await store.ledger.append(reading(8.7, AT("2026-08-20", "07:40")));
    const before = JSON.stringify(await store.backend.get(EVENTS, ev.eventId));

    await store.ledger.annotate({
      type: ANNOTATION.MARK_SUSPECT,
      targetEventId: ev.eventId,
      recordedAt: "2026-08-21T09:00:00Z",
      note: "kit looked off",
    });

    eq(JSON.stringify(await store.backend.get(EVENTS, ev.eventId)), before, "the annotated event");
    const rows = await store.ledger.projection();
    eq(rows[0].state, "SUSPECT", "the derived state");
    deepEq(rows[0].notes, ["kit looked off"], "the note");

    /* And it can be withdrawn, which is another append rather than a delete. */
    await store.ledger.annotate({
      type: ANNOTATION.WITHDRAW,
      targetEventId: ev.eventId,
      recordedAt: "2026-08-22T09:00:00Z",
    });
    eq((await store.ledger.projection())[0].state, "CURRENT", "after withdrawing the mark");
    eq((await store.ledger.allAnnotations()).length, 2, "both annotations are kept");
  }
);

s.test(
  "LED-04",
  "an event id is never reused, and a collision refuses rather than overwriting",
  async () => {
    const store = createMemoryStore();
    const a = await store.ledger.append(reading(8.7, AT("2026-08-20", "07:40")));
    const b = await store.ledger.append(reading(8.8, AT("2026-08-21", "07:40")));
    ok(a.eventId !== b.eventId, "two events recorded in the same millisecond differ");
    ok(a.eventId < b.eventId, "ids sort in creation order");
  }
);

/* -------------------------------------------------------------------------
   Time provenance never improves in place.
   ---------------------------------------------------------------------- */

s.test(
  "TIME-01",
  "a date-only record carries no time at all — not midnight, not midday, not now",
  async () => {
    const d = dateOnly("2026-08-15");
    eq(d.timeProvenance, PROVENANCE.DATE_ONLY, "the provenance");
    eq("absoluteInstant" in d, false, "there is no instant field to read");
    eq("localTime" in d, false, "there is no time-of-day field to read");
    ok(Object.isFrozen(d), "and it cannot be given one afterwards");

    /* Frozen means a later line cannot quietly add what the constructor
       refused to invent. */
    try {
      d.absoluteInstant = "2026-08-15T12:00:00Z";
    } catch {
      /* strict mode throws; sloppy mode silently ignores. Either is fine. */
    }
    eq(d.absoluteInstant, undefined, "still no instant after trying to add one");
  }
);

s.test(
  "TIME-02",
  "a correction may not turn a date-only record into a timed one",
  async () => {
    const store = createMemoryStore();
    const first = await store.ledger.append(reading(8.9, dateOnly("2026-08-15")));

    await throws(
      () =>
        store.ledger.append(
          reading(8.95, AT("2026-08-15", "07:40"), {
            supersedes: first.eventId,
            recordedAt: "2026-08-21T09:00:00Z",
          })
        ),
      "provenance may not improve",
      "correcting a date-only reading with a timed one"
    );

    /* The refusal is total: nothing was written. */
    eq((await store.ledger.allEvents()).length, 1, "events in the ledger after the refusal");
  }
);

s.test(
  "TIME-03",
  "a correction that keeps the same provenance is allowed, and downgrading is allowed",
  async () => {
    const store = createMemoryStore();

    const dateOnlyEvent = await store.ledger.append(reading(8.9, dateOnly("2026-08-15")));
    await store.ledger.append(
      reading(8.95, dateOnly("2026-08-15"), {
        supersedes: dateOnlyEvent.eventId,
        recordedAt: "2026-08-21T09:00:00Z",
      })
    );
    eq((await store.ledger.allEvents()).length, 2, "a same-provenance correction is accepted");

    /* Downgrading is honest — the keeper realising they did not know the time
       after all — and must not be blocked. */
    const timed = await store.ledger.append(reading(8.7, AT("2026-08-20", "07:40")));
    await store.ledger.append(
      reading(8.7, dateOnly("2026-08-20"), {
        supersedes: timed.eventId,
        recordedAt: "2026-08-21T09:00:00Z",
      })
    );
    eq((await store.ledger.allEvents()).length, 4, "a downgrade is accepted");
  }
);

s.test(
  "TIME-04",
  "the rule holds for every pair in the vocabulary, not just the pair the app happens to write",
  async () => {
    const P = PROVENANCE;
    const rank = {
      [P.DATE_ONLY]: 0,
      [P.LOCAL_TIME_ZONE_UNKNOWN]: 1,
      [P.RECONSTRUCTED_WITH_PROVENANCE]: 2,
      [P.EXACT_ABSOLUTE]: 2,
    };
    const all = Object.values(P);
    let allowed = 0;
    let refused = 0;
    for (const before of all) {
      for (const after of all) {
        const shouldRefuse = rank[after] > rank[before];
        let didRefuse = false;
        try {
          assertProvenanceNotImproved({ timeProvenance: before }, { timeProvenance: after });
        } catch {
          didRefuse = true;
        }
        eq(didRefuse, shouldRefuse, `${before} -> ${after}`);
        if (didRefuse) refused += 1;
        else allowed += 1;
      }
    }
    eq(allowed + refused, all.length * all.length, "every pair was checked");
    ok(refused > 0, "some pairs are genuinely refused");
  }
);

/* -------------------------------------------------------------------------
   Ordering, and what the engine is given.
   ---------------------------------------------------------------------- */

s.test(
  "LED-05",
  "the total order is (instant, append ordinal, id) and does not depend on insertion order",
  async () => {
    const mk = (instant, ordinal, id) => ({
      eventId: id,
      eventOrdinal: ordinal,
      time: { timeProvenance: "EXACT_ABSOLUTE", absoluteInstant: instant, localDate: instant.slice(0, 10) },
    });
    const a = mk("2026-08-20T07:40:00Z", 1, "b");
    const b = mk("2026-08-20T07:40:00Z", 0, "a");
    const c = mk("2026-08-19T07:40:00Z", 5, "z");

    deepEq(
      sortLedger([a, b, c]).map((e) => e.eventId),
      ["z", "a", "b"],
      "sorted one way"
    );
    deepEq(
      sortLedger([c, b, a]).map((e) => e.eventId),
      ["z", "a", "b"],
      "sorted from a different starting order"
    );
    deepEq(
      sortLedger([b, c, a]).map((e) => e.eventId),
      ["z", "a", "b"],
      "and from a third"
    );
  }
);

s.test(
  "LED-06",
  "superseded and invalid events are not sent to the engine; suspect ones are",
  async () => {
    const store = createMemoryStore();
    const kept = await store.ledger.append(reading(8.7, AT("2026-08-18", "07:40")));
    const replaced = await store.ledger.append(reading(8.6, AT("2026-08-19", "07:40")));
    const invalid = await store.ledger.append(reading(99, AT("2026-08-20", "07:40")));
    const suspect = await store.ledger.append(reading(8.8, AT("2026-08-21", "07:40")));

    await store.ledger.append(
      reading(8.65, AT("2026-08-19", "07:40"), { supersedes: replaced.eventId, recordedAt: "2026-08-22T09:00:00Z" })
    );
    await store.ledger.annotate({
      type: ANNOTATION.MARK_INVALID,
      targetEventId: invalid.eventId,
      recordedAt: "2026-08-22T09:00:00Z",
    });
    await store.ledger.annotate({
      type: ANNOTATION.MARK_SUSPECT,
      targetEventId: suspect.eventId,
      recordedAt: "2026-08-22T09:00:00Z",
    });

    const sent = toEngineEvents(await store.ledger.projection());
    const values = sent.map((e) => e.rawValueDkh);
    ok(values.includes(8.7), "the plain reading is sent");
    ok(values.includes(8.65), "the correction is sent");
    ok(!values.includes(8.6), "the superseded reading is not sent");
    ok(!values.includes(99), "the invalid reading is not sent");
    ok(
      values.includes(8.8),
      "the suspect reading IS sent — the keeper doubting a reading is not a statement that it did not happen, " +
        "and eligibility is the engine's"
    );
    /* Nothing was written to the ledger by asking what to send. */
    eq((await store.ledger.allEvents()).length, 5, "the ledger is unchanged by projecting it");
  }
);

s.test(
  "LED-07",
  "a date-only reading reaches the engine WITH its provenance rather than being dropped",
  async () => {
    const store = createMemoryStore();
    await store.ledger.append(reading(8.7, AT("2026-08-18", "07:40")));
    await store.ledger.append(reading(8.9, dateOnly("2026-08-19")));

    const sent = toEngineEvents(await store.ledger.projection());
    eq(sent.length, 2, "both readings are sent");
    const dateOnlySent = sent.find((e) => e.timeProvenance === "DATE_ONLY");
    ok(dateOnlySent, "the date-only reading is sent");

    /* Owner decision 30 amended `ALK-V2-DATA-CONTRACT.md` §1: a record with no
       usable instant carries its day in `calendarDate`, and `measuredAt` — the
       instant field — is ABSENT. This check used to assert the opposite, and
       the opposite is what made the engine call each of the owner's 325
       date-only readings malformed (`AI-014`). */
    eq(dateOnlySent.calendarDate, "2026-08-19", "and carries its calendar day, with no time invented");
    eq(dateOnlySent.measuredAt, undefined, "and carries no instant at all — not null, absent");
    ok(
      !String(dateOnlySent.calendarDate).includes("T"),
      "it does not acquire a time on the way to the engine"
    );

    const timed = sent.find((e) => e.timeProvenance !== "DATE_ONLY");
    eq(timed.calendarDate, undefined, "a reading WITH an instant carries no calendar day");
    ok(String(timed.measuredAt).includes("T"), "it carries its instant, in the instant field");
  }
);

s.test("LED-08", "a dose event must say how sure it is of when it took effect", async () => {
  /* `effectiveAtConfidence` is `REQ` (`ALK-V2-DATA-CONTRACT.md:250`) and it
     decides something real: `UNCERTAIN` confounds every straddling interval
     (`M-5`), which is the difference between a response the engine will
     attribute and one it will not.

     `toEngineEvents` used to supply `|| "EXACT"` when it was absent — the app
     asserting certainty the keeper never expressed, which is the same class of
     defect as giving a date-only reading a midnight timestamp. The fix is not
     a better default: it is that an event without it cannot be made. */
  const time = dateOnly("2026-08-20");
  const recordedAt = "2026-08-20T09:00:00Z";

  for (const kind of [KIND.DOSE_STATE, KIND.DOSE_CHANGE]) {
    await throws(
      () => makeEvent({ kind, time, recordedAt, ordinal: 0, detail: { doseMlPerDay: 12 } }),
      "exact or uncertain",
      `a ${kind} with no confidence is refused rather than defaulted`
    );
    await throws(
      () => makeEvent({ kind, time, recordedAt, ordinal: 0, detail: { effectiveAtConfidence: "PROBABLY" } }),
      "exact or uncertain",
      `a ${kind} with a confidence outside the contract's two values is refused`
    );
    /* UNCERTAIN without its bounds gives the engine nothing to resume a clean
       stretch of history after (`REQ*`, contract line 251). */
    await throws(
      () => makeEvent({ kind, time, recordedAt, ordinal: 0, detail: { effectiveAtConfidence: "UNCERTAIN" } }),
      "earliest and a latest",
      `a ${kind} that is UNCERTAIN without bounds is refused`
    );

    const ok1 = makeEvent({
      kind, time, recordedAt, ordinal: 0,
      detail: { doseMlPerDay: 12, effectiveAtConfidence: "EXACT" },
    });
    eq(ok1.detail.effectiveAtConfidence, "EXACT", `an explicit EXACT ${kind} is accepted`);

    const ok2 = makeEvent({
      kind, time, recordedAt, ordinal: 0,
      detail: {
        doseMlPerDay: 12,
        effectiveAtConfidence: "UNCERTAIN",
        effectiveAtEarliest: "2026-08-18T00:00:00Z",
        effectiveAtLatest: "2026-08-20T00:00:00Z",
      },
    });
    eq(ok2.detail.effectiveAtConfidence, "UNCERTAIN", `a bounded UNCERTAIN ${kind} is accepted`);
  }

  /* And the rule applies only where the contract puts it: a reading has no
     effective-time confidence and must not be asked for one. */
  const reading = makeEvent({
    kind: KIND.READING, parameter: "ALK", normalizedValue: 8.4,
    time, recordedAt, ordinal: 0,
  });
  eq(reading.kind, KIND.READING, "a reading is unaffected");
});

/* -------------------------------------------------------------------------
   Correcting and deleting a reading — `PORT-OMISSIONS.md`'s most serious loss
   in the interface port. The mechanism existed; the surface did not.
   ---------------------------------------------------------------------- */

s.test(
  "COR-01",
  "a correction supersedes the original, and the original survives byte for byte",
  async () => {
    const { correctReading } = await import("../../app/src/lib/record.js");
    const store = createMemoryStore();
    /* The defect this exists for: 89 typed where 8.9 was meant. */
    const wrong = await store.ledger.append(reading(89, AT("2026-08-18", "07:40")));
    const before = JSON.stringify(await store.backend.get(EVENTS, wrong.eventId));

    await correctReading(store, {
      eventId: wrong.eventId, param: "ALK", value: 8.9,
      date: "2026-08-18", time: "07:40",
    });

    eq(JSON.stringify(await store.backend.get(EVENTS, wrong.eventId)), before,
      "the original reading, untouched");
    eq((await store.ledger.allEvents()).length, 2, "the correction is an append, not an edit");

    const rows = await store.ledger.projection();
    eq(rows.find((r) => r.event.eventId === wrong.eventId).state, "SUPERSEDED",
      "the original folds to superseded");

    /* And the engine is handed the corrected number, not the typo. */
    const sent = toEngineEvents(rows, "2026-08-20T00:00:00Z");
    eq(sent.length, 1, "one reading reaches the engine, not two");
    eq(sent[0].rawValueDkh, 8.9, "and it is the corrected value");
  }
);

s.test(
  "COR-02",
  "correcting a date-only reading produces a date-only reading, and cannot produce a timed one",
  async () => {
    /* Correcting a NUMBER is not new information about WHEN. The store already
       refuses an improvement (`TIME-02`); this pins that the correction path
       does not try to make one, which is the thing a form with a time box on
       it would do. */
    const { correctReading } = await import("../../app/src/lib/record.js");
    const store = createMemoryStore();
    const original = await store.ledger.append(reading(89, dateOnly("2026-08-19")));

    const fixed = await correctReading(store, {
      eventId: original.eventId, param: "ALK", value: 8.9, date: "2026-08-19", time: null,
    });
    eq(fixed.time.timeProvenance, PROVENANCE.DATE_ONLY, "the correction keeps the provenance");
    eq(fixed.time.absoluteInstant, undefined, "and gains no instant");

    await throws(
      () => correctReading(store, {
        eventId: original.eventId, param: "ALK", value: 8.9,
        date: "2026-08-19", time: "07:40",
      }),
      "provenance may not improve",
      "a correction that tries to add a time"
    );
  }
);

s.test(
  "COR-03",
  "taking a reading out stops it counting, and does not erase it",
  async () => {
    const { markInvalid } = await import("../../app/src/lib/record.js");
    const store = createMemoryStore();
    const ev = await store.ledger.append(reading(8.9, AT("2026-08-18", "07:40")));
    const before = JSON.stringify(await store.backend.get(EVENTS, ev.eventId));

    await markInvalid(store, ev.eventId);

    eq(JSON.stringify(await store.backend.get(EVENTS, ev.eventId)), before,
      "the reading itself is untouched");
    const rows = await store.ledger.projection();
    eq(rows[0].state, "INVALID", "it folds to invalid");
    eq(toEngineEvents(rows, "2026-08-20T00:00:00Z").length, 0,
      "and it is not sent to the engine");
  }
);

s.test(
  "LED-09",
  "a DOSE_STATE that is uncertain when it took effect carries the bounds the contract requires",
  async () => {
    /* `ALK-V2-DATA-CONTRACT.md` §3 makes `effectiveAtEarliest`/`Latest` `REQ*`
       — required exactly when `effectiveAtConfidence` is `UNCERTAIN` — because
       `M-5` reads them to decide when a clean segment resumes. The importer
       computed them, stored them, and `toEngineEvents` dropped them on the
       way out for `DOSE_STATE` while sending them for `DOSE_CHANGE`. */
    const store = createMemoryStore();
    await store.ledger.append({
      kind: KIND.DOSE_STATE,
      parameter: "ALK",
      time: dateOnly("2026-08-10"),
      recordedAt: "2026-08-20T09:00:00Z",
      detail: {
        doseMlPerDay: 8.8,
        effectiveAtConfidence: "UNCERTAIN",
        effectiveAtEarliest: "2026-08-09T10:00:00Z",
        effectiveAtLatest: "2026-08-11T11:59:00Z",
      },
    });

    const [sent] = toEngineEvents(await store.ledger.projection(), "2026-08-20T00:00:00Z");
    eq(sent.kind, "DOSE_STATE", "the dose state is sent");
    eq(sent.effectiveAtConfidence, "UNCERTAIN", "with its confidence");
    eq(sent.effectiveAtEarliest, "2026-08-09T10:00:00Z", "and its earliest bound");
    eq(sent.effectiveAtLatest, "2026-08-11T11:59:00Z", "and its latest bound");
  }
);

s.test(
  "LED-10",
  "a hand-dosed correction for another parameter is never handed to the alkalinity engine",
  async () => {
    /* `DATA-PROVENANCE.md` §3 forbids manufactured delivery history. A calcium
       correction sent unmarked is read as alkalinity entering the tank, and the
       engine then attributes movement to a delivery that never touched it. The
       dose branches already asked whose event it was; this one did not. */
    const store = createMemoryStore();
    const base = {
      time: AT("2026-08-18", "07:40"),
      recordedAt: "2026-08-20T09:00:00Z",
      detail: { amountMl: 40 },
    };
    await store.ledger.append({ kind: KIND.MANUAL_CORRECTION, parameter: "ALK", ...base });
    await store.ledger.append({ kind: KIND.MANUAL_CORRECTION, parameter: "CA", ...base });
    /* An event with no parameter is alkalinity's — that is what every
       correction this app has ever written means, and nothing about existing
       records may change. */
    await store.ledger.append({ kind: KIND.MANUAL_CORRECTION, ...base });

    const sent = toEngineEvents(await store.ledger.projection(), "2026-08-20T00:00:00Z");
    eq(sent.length, 2, "alkalinity's and the unmarked one are sent; calcium's is not");
  }
);

export default s;
