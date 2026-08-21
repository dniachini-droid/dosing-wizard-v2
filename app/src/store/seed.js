/* ============================================================================
   BULK ENTRY FOR TEST MODE
   ----------------------------------------------------------------------------
   Entering a fortnight of readings one form at a time defeats the purpose of
   being able to move the date at all: the keeper would spend longer typing
   than the tank would have taken to drift. So a series goes in as text, one
   record per line, in one action.

   THE GRAMMAR
   -----------

       2026-03-01        alk     8.6      a reading, date only
       2026-03-03 09:15  alk     8.4      a reading with a stated time
       2026-03-05        dose    8.8      what the doser is set to, or changed to
       2026-03-06        water   0.13     a water change, as a fraction
       2026-03-06        water   10L      a water change, in litres
       2026-03-07        manual  20       a one-off addition, in mL
       2026-03-08        note    skimmer overflowed

   Blank lines are skipped. A line beginning `#` is a comment.

   WHAT IT WILL NOT DO
   -------------------

   Give a reading a time it was not given. A line with no `HH:MM` produces a
   `DATE_ONLY` record with no instant in it — the same object `time.js`'s
   `dateOnly()` returns for a hand-typed one, from the same function, with no
   branch that could produce anything else. There is no default time, and the
   parser cannot be made to emit one by leaving a field out.

   Guess a dose history. The first `dose` line in a ledger that has never been
   told a dose is recorded as a standing dose — "the pump is set to this" —
   because a CHANGE needs a previous value and inventing one would be
   fabricating delivery history. Every `dose` line after it is a change from
   the value before it, which is a fact the batch actually contains.

   Half-apply a batch. Every line is parsed AND planned first, and planning
   raises every problem that is knowable before a write — a value that is not a
   number, a date that is not a date, a water change in litres with no tank
   volume on record, a dose line that would have to slip underneath dose
   history the ledger already holds. If any line is bad, nothing is written and
   every problem is reported with its line number, so the keeper fixes the text
   rather than hunting for which of fourteen readings landed.

   A delivery anomaly is deliberately not in the grammar: it carries a span
   with two instants, and a line format that could express one would be a line
   format nobody could read. It has a form of its own.
   ========================================================================= */

import { KIND, SOURCE, PARAMETERS } from "./ledger.js";
import { dateOnly, exactInstant, localZone } from "./time.js";
import { t } from "../strings.js";

/* Spellings accepted for each parameter. The keys are the store's own; the
   longer spellings are there because a keeper pasting a series types the word
   rather than the code. Identifiers, not prose. */
const PARAMETER_WORDS = {
  alk: "ALK",
  alkalinity: "ALK",
  dkh: "ALK",
  ca: "CA",
  calcium: "CA",
  mg: "MG",
  magnesium: "MG",
  no3: "NO3",
  nitrate: "NO3",
  po4: "PO4",
  phosphate: "PO4",
  sal: "SAL",
  salinity: "SAL",
};

const RECORD_WORDS = new Set(["dose", "water", "manual", "note"]);

/* A dose line before it is known whether it states a standing dose or a
   change. Not an event kind — the ledger never sees this value. */
export const DOSE_LINE = "DOSE";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

/* --- parsing -------------------------------------------------------------- */

/* Text in, rows and problems out. Reads no clock, touches no store and writes
   nothing: a caller can show the keeper exactly what a batch would do before
   any of it happens. */
export function parseSeries(text) {
  const rows = [];
  const problems = [];
  const lines = String(text == null ? "" : text).split(/\r?\n/);

  lines.forEach((raw, i) => {
    const lineNo = i + 1;
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;

    /* Commas and tabs are separators too, so a spreadsheet column pastes in
       without being reformatted first. */
    const parts = line.split(/[\s,\t]+/).filter(Boolean);
    if (parts.length < 3) {
      problems.push({ line: lineNo, text: line, why: t("seed.err.tooShort") });
      return;
    }

    let at = 0;
    const date = parts[at++];
    if (!DATE.test(date) || !Number.isFinite(Date.parse(date + "T00:00:00Z"))) {
      problems.push({ line: lineNo, text: line, why: t("seed.err.badDate", { text: date }) });
      return;
    }

    /* The time is optional and it is the ONLY way a record gets one. */
    let time = null;
    if (TIME.test(parts[at])) time = parts[at++];

    const word = String(parts[at++] || "").toLowerCase();
    const rest = parts.slice(at);

    if (PARAMETER_WORDS[word]) {
      const parameter = PARAMETER_WORDS[word];
      if (!rest.length) {
        problems.push({ line: lineNo, text: line, why: t("seed.err.needValue") });
        return;
      }
      const rawValue = rest[0];
      const value = Number(rawValue);
      if (!Number.isFinite(value)) {
        problems.push({ line: lineNo, text: line, why: t("entry.notANumber", { text: rawValue }) });
        return;
      }
      rows.push({ line: lineNo, kind: KIND.READING, parameter, rawValue, value, date, time });
      return;
    }

    if (!RECORD_WORDS.has(word)) {
      problems.push({ line: lineNo, text: line, why: t("seed.err.unknownWord", { text: word }) });
      return;
    }

    if (word === "note") {
      const note = rest.join(" ").trim();
      if (!note) {
        problems.push({ line: lineNo, text: line, why: t("seed.err.needNote") });
        return;
      }
      rows.push({ line: lineNo, kind: KIND.NOTE, note, date, time });
      return;
    }

    const rawValue = rest[0];
    if (rawValue === undefined) {
      problems.push({ line: lineNo, text: line, why: t("seed.err.needValue") });
      return;
    }

    if (word === "water") {
      /* Litres carry an `L`; anything else is read as a fraction of the tank.
         Both are what the keeper actually knows, and neither is inferred from
         the other without the volume being on record. */
      const litres = /^[0-9.]+\s*[lL]$/.test(rawValue);
      const n = Number(String(rawValue).replace(/[lL]\s*$/, ""));
      if (!Number.isFinite(n) || n <= 0) {
        problems.push({ line: lineNo, text: line, why: t("entry.notANumber", { text: rawValue }) });
        return;
      }
      if (!litres && n >= 1) {
        problems.push({ line: lineNo, text: line, why: t("seed.err.fractionRange") });
        return;
      }
      rows.push({ line: lineNo, kind: KIND.WATER_CHANGE, litres: litres ? n : null, fraction: litres ? null : n, date, time });
      return;
    }

    const n = Number(rawValue);
    if (!Number.isFinite(n) || n < 0) {
      problems.push({ line: lineNo, text: line, why: t("entry.notANumber", { text: rawValue }) });
      return;
    }
    /* A dose line's KIND is not decided here, because it cannot be: whether it
       is a standing dose or a change depends on what the ledger already knows.
       `plan()` decides, once, for both the preview and the write. */
    if (word === "dose") rows.push({ line: lineNo, kind: DOSE_LINE, value: n, date, time });
    else rows.push({ line: lineNo, kind: KIND.MANUAL_CORRECTION, amountMl: n, date, time });
  });

  return { rows, problems };
}

/* The time object for a row. Two constructors, no third path: a row with a
   time gets an exact instant, a row without one gets a date and no instant at
   all. The offset is left to `exactInstant` to derive from the local moment
   itself rather than passed in from the device's offset today, because a date
   six months away can sit on the other side of a daylight-saving change. */
export function timeFor(row) {
  return row.time
    ? exactInstant(row.date, row.time, undefined, localZone())
    : dateOnly(row.date);
}

/* --- planning ------------------------------------------------------------

   ONE OWNER OF WHAT EACH LINE BECOMES, AND ONE PLACE THAT CAN REFUSE.

   The preview and the write have to agree, and "they agree today" is not a
   design — canon `MASTER RULE 1`. So neither of them decides: `plan()` decides,
   `summarise()` counts a plan, and `applySeries()` writes one. A preview that
   said "dose changed" over a line that was about to be written as a standing
   dose is exactly the disagreement this shape prevents.

   `plan()` also reports every problem that is knowable BEFORE a write. That is
   the other half of the module's promise never to half-apply a batch: a
   refusal discovered in the middle of the loop has already written half the
   ledger by the time it is raised, and the keeper who fixes the cause and
   pastes the same text again then holds every earlier line twice. A litres
   water change with no tank volume on record was exactly that — knowable at
   planning time, raised at write time. It is raised here now.

   ORDER
   -----

   Dose lines are resolved in EVENT-TIME order, not in the order they were
   typed. Pasting `2026-03-05 dose 10.0` above `2026-03-01 dose 8.8` used to
   record a standing dose of 10.0 on the 5th and a change FROM 10.0 on the
   1st — a change away from a value that, in event time, had not yet been set.
   That is fabricated delivery history arriving through a different door from
   the one this module already guards.

   The sort key gives a date-only line the start of its day. That is a display
   and ordering convenience and never an instant: `sortLedger` in `ledger.js`
   does the same thing for the same reason, and nothing derived from it is
   stored or handed to the engine. */
function orderKey(row) {
  return `${row.date} ${row.time || "00:00"}`;
}

export function plan(rows, { knownDose = null, knownDoseAt = null, config = null } = {}) {
  const problems = [];
  const resolved = new Map();

  /* Dose lines, in the order they happened. */
  const doseRows = rows.filter((r) => r.kind === DOSE_LINE).sort((a, b) => (orderKey(a) < orderKey(b) ? -1 : orderKey(a) > orderKey(b) ? 1 : 0));

  let runningDose = knownDose;
  for (const row of doseRows) {
    if (knownDoseAt && orderKey(row) < knownDoseAt) {
      /* The ledger already holds a dose event later than this line. Slipping
         earlier delivery history underneath it would need the existing event
         rewritten from a standing dose into a change, and this ledger is
         append-only. Refused rather than guessed at — and in test mode the way
         through is to clear the test data and enter the series in order. */
      problems.push({ line: row.line, text: t("seed.err.doseBeforeLedgerText"), why: t("seed.err.doseBeforeLedger") });
      continue;
    }
    /* Nothing has ever said what the pump is set to, so this line is that
       statement and not a change. Recording it as a change would need a `from`
       nobody has given, and the only way to produce one would be to invent
       it. */
    const kind = runningDose == null ? KIND.DOSE_STATE : KIND.DOSE_CHANGE;
    resolved.set(row.line, { kind, fromMlPerDay: runningDose });
    runningDose = row.value;
  }

  const planned = rows.map((row) => {
    if (row.kind !== DOSE_LINE) return { ...row };
    const r = resolved.get(row.line);
    /* A dose line that was refused above keeps its unresolved kind, and the
       problem it carries stops the batch. */
    return r ? { ...row, ...r } : { ...row };
  });

  /* Knowable now, so raised now. */
  const volume = config && Number(config.netVolumeL);
  const haveVolume = Number.isFinite(volume) && volume > 0;
  for (const row of planned) {
    if (row.kind === KIND.WATER_CHANGE && row.fraction == null && !haveVolume) {
      problems.push({ line: row.line, text: t("seed.err.noVolumeText"), why: t("seed.err.noVolume") });
    }
  }

  return { planned, problems };
}

/* What a batch would do, said in counts, before anything is written. */
export function summarise(planned) {
  const counts = {};
  let dated = 0;
  for (const r of planned) {
    counts[r.kind] = (counts[r.kind] || 0) + 1;
    if (r.time) dated += 1;
  }
  return { total: planned.length, counts, withTime: dated, dateOnly: planned.length - dated };
}

/* What the ledger already believes the pump is set to, and when it last said
   so. Read once, and handed to `plan()` so the preview and the write start
   from the same place. */
export async function doseContext(store) {
  const projected = await store.ledger.projection();
  let dose = null;
  let at = null;
  for (const r of projected) {
    if (r.state === "SUPERSEDED" || r.state === "INVALID") continue;
    const e = r.event;
    if (e.kind !== KIND.DOSE_STATE && e.kind !== KIND.DOSE_CHANGE) continue;
    const key = `${e.time.localDate} ${e.time.localTime || (e.time.absoluteInstant ? e.time.absoluteInstant.slice(11, 16) : "00:00")}`;
    if (at && key < at) continue;
    at = key;
    dose = e.kind === KIND.DOSE_STATE ? e.detail.doseMlPerDay : e.detail.toMlPerDay;
  }
  return { knownDose: dose, knownDoseAt: at };
}

/* --- applying ------------------------------------------------------------- */

/* Write a parsed batch. Sequential on purpose: the ledger's ordinal is the
   count of what is already there, so two appends in flight at once would both
   read the same count and both claim it.

   Rows are planned first, against the dose the ledger already knows — so the
   first `dose` line of a SECOND batch is a change from the first batch's last
   value rather than a second standing dose. */
export async function applySeries(store, rows, { config } = {}) {
  const written = [];
  const { planned, problems } = plan(rows, { ...(await doseContext(store)), config });

  /* NOTHING IS WRITTEN UNTIL EVERY KNOWABLE PROBLEM IS CLEAR.

     Raised before the loop rather than inside it. A refusal from the middle of
     the loop leaves the ledger half-written, and the keeper who fixes the
     cause and pastes the same text again then holds every earlier line
     twice. */
  if (problems.length) {
    const e = new Error(problems[0].why);
    e.problems = problems;
    throw e;
  }

  for (const row of planned) {
    const time = timeFor(row);
    const recordedAt = new Date().toISOString();

    if (row.kind === KIND.READING) {
      const def = PARAMETERS.find((p) => p.key === row.parameter);
      written.push(
        await store.ledger.append({
          kind: KIND.READING,
          parameter: row.parameter,
          rawValue: row.rawValue,
          normalizedValue: row.value,
          unit: def ? def.unit : null,
          time,
          recordedAt,
          source: SOURCE.KEEPER_ENTRY,
        })
      );
      continue;
    }

    if (row.kind === KIND.DOSE_STATE) {
      written.push(
        await store.ledger.append({
          kind: KIND.DOSE_STATE,
          time,
          recordedAt,
          detail: { doseMlPerDay: row.value, effectiveAtConfidence: "EXACT" },
        })
      );
      continue;
    }

    if (row.kind === KIND.DOSE_CHANGE) {
      written.push(
        await store.ledger.append({
          kind: KIND.DOSE_CHANGE,
          time,
          recordedAt,
          detail: {
            fromMlPerDay: row.fromMlPerDay,
            toMlPerDay: row.value,
            effectiveAtConfidence: "EXACT",
          },
        })
      );
      continue;
    }

    if (row.kind === KIND.WATER_CHANGE) {
      /* `plan()` has already established that the volume is on record when a
         line needs one, so there is no refusal left to make here. */
      const fraction = row.fraction == null ? row.litres / Number(config.netVolumeL) : row.fraction;
      written.push(
        await store.ledger.append({
          kind: KIND.WATER_CHANGE,
          time,
          recordedAt,
          detail: { changedFraction: fraction },
        })
      );
      continue;
    }

    if (row.kind === KIND.MANUAL_CORRECTION) {
      written.push(
        await store.ledger.append({
          kind: KIND.MANUAL_CORRECTION,
          time,
          recordedAt,
          detail: { amountMl: row.amountMl },
        })
      );
      continue;
    }

    written.push(
      await store.ledger.append({
        kind: KIND.NOTE,
        time,
        recordedAt,
        detail: { note: row.note },
      })
    );
  }

  return { written: written.length, events: written };
}
