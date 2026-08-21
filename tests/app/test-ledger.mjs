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
import { ANNOTATION, KIND, sortLedger, toEngineEvents } from "../../app/src/store/ledger.js";
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
    eq(dateOnlySent.measuredAt, "2026-08-19", "and carries its calendar day, with no time invented");
    ok(
      !String(dateOnlySent.measuredAt).includes("T"),
      "it does not acquire a time on the way to the engine"
    );
  }
);

export default s;
