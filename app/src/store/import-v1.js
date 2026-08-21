/* ============================================================================
   IMPORTING THE KEEPER'S V1 HISTORY
   ----------------------------------------------------------------------------
   Six months of a real tank, exported from V1. It is real data and it comes
   across truthfully — not quarantined, not manufactured, and not silently
   promoted to evidence it cannot support.

   THE RULE THAT GOVERNS EVERYTHING — TIME PROVENANCE
   --------------------------------------------------

   Most of these readings are date-only. They must stay date-only forever.

   Never assign a time to a reading that did not have one. Not noon, not
   midnight, not the keeper's current timezone, not inferred from a testing
   routine and not inferred from the order rows appear in the file. Canon
   `SHARED-LEGACY-TIME-001` and `DATA-PROVENANCE.md` §2 forbid all of it.

   The failure mode is silent and total: a fabricated timestamp is
   indistinguishable from a real one afterwards, and the reading then becomes
   eligible for trend arithmetic it should never have entered. There is no way
   to detect or undo it later.

   So this module has exactly two ways to build a time, both of them `time.js`'s
   own constructors, and neither of them reads a clock. A row with no `time`
   field gets `dateOnly()`. A row with one gets `localTimeZoneUnknown()` —
   because the export records a wall-clock time and NO timezone, and treating a
   local `HH:MM` as an absolute instant is the fabrication named above. There is
   no third branch and no default.

   WHAT IS ELIGIBLE FOR WHAT
   -------------------------

   Every reading imports. They are real measurements: they chart, they appear
   in history, they are part of the record.

   Analytical eligibility is separate and narrower, and this module does not
   decide it. Readings are imported with their true provenance and the engine's
   existing rules decide what may be done with them. Nothing here filters, and
   nothing here marks a reading as usable or unusable.

   WHAT IS NOT RECONSTRUCTED
   -------------------------

   The dose history before 11 August is absent. `DATA-PROVENANCE.md` §3:
   "Absence of a recorded dose change is not evidence that no dose change
   occurred." So no dose is back-projected from the tank's current settings, no
   interval before the first recorded change is invented, and the settings
   block is imported as what it is — an end state, dated as of the export, with
   no backdating.

   IDENTITY
   --------

   V1's reading ids do not survive an export/restore round trip: two
   consecutive exports of the same data share zero ids. So nothing here keys on
   one. The natural key is what the row actually says — what was measured, on
   what day, at what time if any, and what the value was — and it is counted as
   a multiset, so two genuinely identical readings on one day both import and a
   second run of the import adds neither.
   ========================================================================= */

import { KIND, SOURCE, PARAMETERS } from "./ledger.js";
import { dateOnly, localTimeZoneUnknown, reconstructedInstant, resolveLocalInZone } from "./time.js";
import { makeTask, TASK_KIND } from "./schedule.js";
import { t } from "../strings.js";

export const FORMAT = "dans-tank-backup";
export const VERSION = 1;

/* V1's parameter names, mapped onto this store's keys. A name not on this list
   is reported rather than dropped: a reading whose parameter the app cannot
   name is a reading it cannot store truthfully, and silently losing it would
   be the import quietly deciding what counts. */
const PARAMETER_OF = {
  alkalinity: "ALK",
  calcium: "CA",
  magnesium: "MG",
  nitrate: "NO3",
  phosphate: "PO4",
  salinity: "SAL",
  ph: "PH",
  potassium: "K",
};

/* Which V1 element a dose row is for. The Alk engine has no vocabulary for any
   other, and `toEngineEvents` sends it only alkalinity's — so a calcium dose
   change is stored as history and is never read as an alkalinity delivery. */
const DOSE_PARAMETER_OF = {
  alkalinity: "ALK",
  calcium: "CA",
  magnesium: "MG",
};

/* Provenance marks carried on imported records. These are field values, not
   sentences: what the keeper reads is looked up in the strings file like
   everything else. */
export const ORIGIN = Object.freeze({
  /* The keeper's own measurements, confirmed by him. `V1-DATA-PROVENANCE.md`
     §1 withdraws the earlier finding that they were synthetic. */
  KEEPER: "V1_KEEPER_RECORD",
  /* Records the V1 salvage reconnaissance found byte-identical to named V1
     source constants, and which the owner has not confirmed either way.
     `V1-DATA-PROVENANCE.md` §5 records the disagreement and does not settle
     it, so neither does this: the records import, flagged, and the question is
     surfaced rather than answered. */
  UNCONFIRMED: "V1_SEED_UNCONFIRMED",
  /* Configuration carried across from the old app, where which values the
     keeper chose and which he simply never changed is not recorded anywhere.
     `V1-DATA-PROVENANCE.md` §2.4: "The edits are the owner's; the defaults are
     the app's" — and the export does not say which is which. Marked as
     unverified rather than attributed to him. */
  CONFIGURATION: "V1_CONFIGURATION_UNVERIFIED",
});

/* --- what a well-formed row looks like ------------------------------------

   A date the keeper never recorded is the same defect as a TIME he never
   recorded, reached through the other field, and it was unguarded: a row with
   no date stored the string "undefined" as its calendar day, which sorts ahead
   of every real date and lands at the head of his history. A row with a
   garbage time was worse — `if (row.time)` is a truthiness test, so
   `time: "banana"` climbed the provenance ladder and produced a record
   claiming the time of day was known.

   Both are refused, by shape and then by round trip: `2026-13-45` parses as a
   date and rolls over to 2027, so matching the pattern is not enough. */
const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_SHAPE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validDate(text) {
  const iso = String(text == null ? "" : text).slice(0, 10);
  if (!DATE_SHAPE.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  /* Round-tripped, so a day that does not exist in its month is refused rather
     than silently rolled into the next one. */
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    return null;
  }
  return iso;
}

export function validTime(text) {
  if (text == null || text === "") return { ok: true, time: null };
  const hhmm = String(text).slice(0, 5);
  return TIME_SHAPE.test(hhmm) ? { ok: true, time: hhmm } : { ok: false, time: null };
}

/* --- reading the file ----------------------------------------------------- */

export function parseBackup(text) {
  let doc;
  try {
    doc = typeof text === "string" ? JSON.parse(text) : text;
  } catch (e) {
    return { ok: false, why: t("import.err.notJson", { error: (e && e.message) || "" }) };
  }
  if (!doc || typeof doc !== "object") return { ok: false, why: t("import.err.notJson", { error: "" }) };
  if (doc.format !== FORMAT) return { ok: false, why: t("import.err.wrongFormat", { format: String(doc.format) }) };
  if (doc.version !== VERSION) return { ok: false, why: t("import.err.wrongVersion", { version: String(doc.version) }) };
  if (!doc.data || typeof doc.data !== "object") return { ok: false, why: t("import.err.noData") };
  return { ok: true, doc };
}

/* --- what the file says about itself, against what it contains -------------

   The export states its own counts. If they disagree with what is actually in
   the file, the import stops: a count that does not match is a file that is
   not what it claims to be, and importing it anyway would be guessing which
   half to believe. */
export function checkCounts(doc) {
  const d = doc.data || {};
  const stated = doc.counts || {};
  const actual = {
    readings: len(d.readings),
    icps: len(d["icp-tests"]),
    waterChanges: len(d["water-changes"]),
    doseChanges: len(d["dose-log"]),
    taskLog: len(d["task-log"]),
    lighting: len(d["lighting-log"]),
  };
  const disagreements = [];
  for (const [key, n] of Object.entries(actual)) {
    if (stated[key] === undefined) {
      /* A file that makes no claim about its own size has not been checked
         against anything. Reported as its own state rather than passing
         silently: a truncated export with its counts block removed used to
         import as though it were whole. */
      disagreements.push({ key, stated: null, actual: n, unstated: true });
      continue;
    }
    if (stated[key] !== n) disagreements.push({ key, stated: stated[key], actual: n });
  }
  return { actual, stated, disagreements };
}

function len(v) {
  return Array.isArray(v) ? v.length : 0;
}

/* --- the plan --------------------------------------------------------------

   Everything the import would do, worked out before anything is written, so
   the keeper reads it and chooses. Pure: it reads no store and no clock. */
export function planImport(doc, { existing = [], existingCompletions = [], reconstruction = null, config = null } = {}) {
  const d = doc.data || {};
  const problems = [];
  /* The volume the ledger's own water changes were recorded against, so the
     plan keys them the same way the store does. Taken from the store's current
     configuration where there is one, and from the export otherwise — the two
     are the same number in the ordinary case, and where they differ the plan
     says what it used. */
  const volumeL = Number(
    (config && config.netVolumeL) || (d["tank-settings"] && d["tank-settings"].volumeL) || 0
  );

  /* One place that reads a row's WHEN, so a missing or malformed date or time
     is refused once and in the same way for every kind of record. Returns null
     and reports; the caller skips the row. */
  const when = (row, what) => {
    const date = validDate(row.date);
    if (!date) {
      problems.push({ why: t("import.err.badDate", { what, text: String(row.date) }) });
      return null;
    }
    const time = validTime(row.time);
    if (!time.ok) {
      problems.push({ why: t("import.err.badTime", { what, date, text: String(row.time) }) });
      return null;
    }
    return { date, time: time.time };
  };

  const list = (value, name) => {
    if (value == null) return [];
    if (Array.isArray(value)) return value;
    problems.push({ why: t("import.err.notAList", { name }) });
    return [];
  };

  /* The multiset of natural keys already in the record. Counted rather than
     set-membership, because two identical readings on one day are two
     readings — a repeat test is a real thing — and a second run of the import
     must add neither of them. */
  const held = new Map();
  for (const row of existing) {
    /* SUPERSEDED AND INVALID RECORDS STILL HOLD THEIR KEY.

       They used to be skipped, so a second import re-wrote as a fresh CURRENT
       record every reading the keeper had corrected or explicitly disowned.
       A correction would come back beside its own correction — one real
       measurement as two live observations, inflating the cluster count that
       is an evidence minimum — and a reading he had marked invalid would
       simply return.

       The record HAS this measurement. What he later said about it is a
       separate fact, and re-importing the file he imported it from is not him
       changing his mind. */
    const k = naturalKeyOfEvent(row.event);
    if (k) held.set(k, (held.get(k) || 0) + 1);
  }
  const taken = new Map();

  const claim = (key) => {
    const already = held.get(key) || 0;
    const used = taken.get(key) || 0;
    taken.set(key, used + 1);
    return used >= already; /* true = this one is new */
  };

  const readings = [];
  const skippedReadings = [];
  for (const r of list(d.readings, "readings")) {
    const parameter = PARAMETER_OF[String(r.param || "").toLowerCase()];
    if (!parameter) {
      problems.push({ why: t("import.err.unknownParameter", { text: String(r.param) }) });
      continue;
    }
    const w = when(r, t("import.what.readings"));
    if (!w) continue;
    const value = Number(r.value);
    if (!Number.isFinite(value)) {
      problems.push({ why: t("import.err.notANumber", { text: String(r.value), date: w.date }) });
      continue;
    }
    const row = {
      parameter,
      value,
      /* The value as the file carries it. It is NOT the string the keeper
         typed: this export stores values as JSON numbers, so 8.70 arrived as
         8.7 and the trailing zero is gone before this module ever sees it.
         Carried as its own field anyway, because a later format may preserve
         it and because the two must not merge. */
      rawValue: String(r.value),
      date: w.date,
      time: w.time,
      note: r.note || null,
    };
    const key = naturalKey(KIND.READING, parameter, row.date, row.time, value);
    if (claim(key)) readings.push(row);
    else skippedReadings.push(row);
  }

  const doses = [];
  const skippedDoses = [];
  for (const r of list(d["dose-log"], "dose-log")) {
    const parameter = DOSE_PARAMETER_OF[String(r.element || "").toLowerCase()];
    const ml = Number(r.ml);
    if (!parameter || !Number.isFinite(ml)) {
      problems.push({ why: t("import.err.badDose", { text: String(r.element), date: String(r.date) }) });
      continue;
    }
    const w = when(r, t("import.what.doses"));
    if (!w) continue;
    const row = {
      parameter,
      mlPerDay: ml,
      date: w.date,
      time: w.time,
      note: r.note || null,
    };
    const key = naturalKey(KIND.DOSE_STATE, parameter, row.date, row.time, ml);
    if (claim(key)) doses.push(row);
    else skippedDoses.push(row);
  }

  const waterChanges = [];
  const skippedWater = [];
  for (const r of list(d["water-changes"], "water-changes")) {
    const w = when(r, t("import.what.water"));
    if (!w) continue;
    const litres = Number(r.litres);
    if (!Number.isFinite(litres) || litres <= 0) {
      problems.push({ why: t("import.err.badWater", { date: w.date }) });
      continue;
    }
    const row = { litres, date: w.date, note: r.note || null };
    /* Keyed the way the ledger keys it, so a water change the keeper typed
       here and the same one arriving from the export are one record. */
    const key = naturalKey(
      KIND.WATER_CHANGE,
      null,
      row.date,
      null,
      volumeL > 0 ? round6(litres / volumeL) : `L${litres}`
    );
    if (claim(key)) waterChanges.push(row);
    else skippedWater.push(row);
  }

  const icps = [];
  const skippedIcps = [];
  for (const r of list(d["icp-tests"], "icp-tests")) {
    const w = when(r, t("import.what.icps"));
    if (!w) continue;
    if (!r.elements || typeof r.elements !== "object" || !Object.keys(r.elements).length) {
      problems.push({ why: t("import.err.emptyIcp", { date: w.date }) });
      continue;
    }
    const row = {
      date: w.date,
      lab: r.lab || null,
      ref: r.ref || null,
      elements: r.elements,
    };
    const key = naturalKey(KIND.ICP_PANEL, null, row.date, null, row.ref || `n${Object.keys(row.elements).length}`);
    if (claim(key)) icps.push(row);
    else skippedIcps.push(row);
  }

  const lighting = [];
  const skippedLighting = [];
  for (const r of list(d["lighting-log"], "lighting-log")) {
    const w = when(r, t("import.what.lighting"));
    if (!w) continue;
    const row = { date: w.date, note: String(r.note || "") };
    const key = naturalKey(KIND.HUSBANDRY, null, row.date, null, row.note);
    if (claim(key)) lighting.push(row);
    else skippedLighting.push(row);
  }

  /* Reminders and their completions are not ledger events — they are the
     keeper's schedule and its history, and the task store keys both by an id
     it builds itself, so re-running writes the same rows rather than new
     ones. */
  const tasks = [];
  for (const r of list(d.reminders, "reminders")) {
    const interval = Number(r.intervalDays);
    if (!(interval > 0)) {
      problems.push({ why: t("import.err.badReminder", { text: String(r.label || r.id) }) });
      continue;
    }
    tasks.push({
      id: String(r.id),
      label: String(r.label || r.id),
      /* The interval the FILE carries, which is the configuration he actually
         has in front of him — `V1-DATA-PROVENANCE.md` §2.4: "import the edited
         configuration, not the seed defaults". His alkalinity interval is
         every two days because he changed it to that.

         What the file does NOT record is which of the eleven he changed. §2.4
         says one was edited and the rest are the old app's shipped defaults,
         and nothing in the export distinguishes them. So they come across
         marked `V1_CONFIGURATION_UNVERIFIED`, the report says plainly that
         some of these numbers are the old app's rather than his, and he can
         change any of them. Attributing all eleven to him would be the app
         asserting something it cannot know. */
      intervalDays: interval,
      startDate: String(r.startDate || "").slice(0, 10) || null,
      parameter: PARAMETER_OF[String(r.paramKey || "").toLowerCase()] || null,
      kind: r.kind === "test" ? TASK_KIND.TEST : TASK_KIND.HUSBANDRY,
      needsVolume: !!r.needsVolume,
      enabled: r.enabled !== false,
    });
  }

  const completionsHeld = new Set((existingCompletions || []).map((c) => c.completionId));
  const completions = [];
  const skippedCompletions = [];
  for (const r of list(d["task-log"], "task-log")) {
    const w = when(r, t("import.what.completions"));
    if (!w) continue;
    const row = { taskId: String(r.taskId), date: w.date, auto: !!r.auto };
    if (completionsHeld.has(`${row.taskId}|${row.date}`)) skippedCompletions.push(row);
    else completions.push(row);
  }

  return {
    problems,
    readings,
    doses,
    waterChanges,
    icps,
    lighting,
    tasks,
    completions,
    skipped: {
      readings: skippedReadings.length,
      doses: skippedDoses.length,
      waterChanges: skippedWater.length,
      icps: skippedIcps.length,
      lighting: skippedLighting.length,
      completions: skippedCompletions.length,
    },
    configuration: planConfiguration(d, problems),
    /* Recorded so the report can name it, and NOT imported. */
    notImported: {
      dismissedFindings: Object.keys(d["findings-dismissed"] || {}).length,
      dosingPlans: ["alk-plan", "ca-plan", "mg-plan"].filter((k) => d[k]).length,
    },
  };
}

/* --- what the record will say about itself --------------------------------

   Counts, and what each one means for what may be done with it. Every line
   here is a statement about the RECORD — how well its time is known, and
   whether anything says what was being dosed around it. None of it is a
   decision about eligibility: the engine owns that, and `TREND_ELIGIBLE` in
   `time.js` is the app's one place for saying what a provenance can support.

   The dose boundary is derived from the file, not chosen. It is the first
   moment anything in the record says what the pump was set to, and before it
   the readings are measurements with no delivery context —
   `V1-DATA-PROVENANCE.md` §1: "true measurements with no delivery history
   attached. That is the whole of the limitation. It is not a doubt about the
   numbers." */
export function describePlan(planned, reconstruction = null) {
  const byParameter = new Map();
  let withTime = 0;
  for (const r of planned.readings) {
    if (!byParameter.has(r.parameter)) {
      byParameter.set(r.parameter, { parameter: r.parameter, total: 0, withTime: 0, from: r.date, to: r.date });
    }
    const p = byParameter.get(r.parameter);
    p.total += 1;
    if (r.time) {
      p.withTime += 1;
      withTime += 1;
    }
    if (r.date < p.from) p.from = r.date;
    if (r.date > p.to) p.to = r.date;
  }

  /* Where the assessed parameter's dose history begins. Only alkalinity has an
     engine in this build, so only alkalinity has a period whose analysis this
     could be about.

     SORTED, because the keeper's own export lists its dose log NEWEST FIRST.
     Read in file order the last dose becomes the boundary and the first
     becomes a change away from a value not yet established — his dose history
     inverted, and the boundary drawn a week late on both the import report and
     the History chart. */
  const alkDoses = planned.doses.filter((d) => d.parameter === "ALK").sort(byWhen);
  const doseHistoryFrom = alkDoses.length ? alkDoses[0].date : null;

  const alk = planned.readings.filter((r) => r.parameter === "ALK");
  const afterBoundary = doseHistoryFrom ? alk.filter((r) => r.date >= doseHistoryFrom).length : 0;

  /* How many timed rows the keeper's stated zone can actually resolve, and how
     many it cannot. An hour daylight saving skipped never happened and an hour
     it repeated happened twice; neither is reconstructed, and the count says
     so rather than the keeper discovering it afterwards. */
  let reconstructed = 0;
  let unreconstructable = 0;
  for (const r of [...planned.readings, ...planned.doses]) {
    if (!r.time) continue;
    const built = timeFor(r, reconstruction);
    if (built.absoluteInstant) reconstructed += 1;
    else if (reconstruction) unreconstructable += 1;
  }

  return {
    parameters: [...byParameter.values()].sort((a, b) => b.total - a.total),
    total: planned.readings.length,
    withTime,
    dateOnly: planned.readings.length - withTime,
    doseHistoryFrom,
    alkTotal: alk.length,
    alkAfterBoundary: afterBoundary,
    alkBeforeBoundary: alk.length - afterBoundary,
    /* DERIVED, NOT ASSERTED.

       This was a literal zero, which was true while nothing could reconstruct
       an instant and became a second owner of "how many records have a provable
       instant" the moment something could. It is now counted the same way the
       write counts it — by building each row's time through `timeFor` and
       asking what came back. The report and the record cannot disagree. */
    exactElapsedAvailable: reconstructed,
    unreconstructable,
    reconstructedZone: reconstruction ? reconstruction.zoneId : null,
  };
}

/* --- the natural key ------------------------------------------------------

   What the row says, and nothing about where it came from. V1's own merge
   logic keyed on parameter, date and value for exactly this reason: its ids do
   not survive a round trip. The time is part of the key when the row has one,
   because two readings of the same value on one day at different times are two
   readings. */
export function naturalKey(kind, parameter, date, time, value) {
  return [kind, parameter || "", date, time || "", String(value)].join("|");
}

/* THE SAME RECORD KEYS THE SAME WAY HOWEVER IT WAS WRITTEN.

   The keeper is still running V1 alongside V2 until cutover, so a dose change
   or a water change can reach this store twice — once typed into a form here,
   once through an import of the file he exported there. Three shapes made
   those two spellings of one fact key differently, and every one of them was a
   duplicate the dedupe could not see:

     - the app's dose forms set no parameter (`ledger.js`: "an event with no
       parameter is alkalinity's") and the importer sets `"ALK"`;
     - the app's water-change form stores a fraction and the importer stores
       litres;
     - the app's ICP form stores `measurements` and the importer `elements`;
       its one-off husbandry note stores `what` and the importer `note`.

   Each is normalised here, in the one function that decides identity. */
export function naturalKeyOfEvent(e) {
  const date = e.time && e.time.localDate;
  if (!date) return null;
  const time = (e.time && e.time.localTime) || "";
  const detail = e.detail || {};

  if (e.kind === KIND.READING) return naturalKey(KIND.READING, e.parameter, date, time, e.normalizedValue);

  if (e.kind === KIND.DOSE_STATE || e.kind === KIND.DOSE_CHANGE) {
    /* A change and a standing dose at the same value on the same day are the
       same fact about the pump arriving twice, so they share a key. Without
       that, re-running the import would write a change beside the standing
       dose it had already written. An event with no parameter is
       alkalinity's. */
    const dose = e.kind === KIND.DOSE_STATE ? detail.doseMlPerDay : detail.toMlPerDay;
    return naturalKey(KIND.DOSE_STATE, e.parameter || "ALK", date, time, dose);
  }

  if (e.kind === KIND.WATER_CHANGE) {
    /* Keyed on the fraction, because that is the field every water change
       has however it was written — the importer computes one where the tank's
       volume is known, and the app's form asks for one directly. Litres are
       kept alongside and are not the identity. */
    const fraction = detail.changedFraction;
    if (fraction != null) return naturalKey(KIND.WATER_CHANGE, null, date, "", round6(fraction));
    const litres = detail.volumeL;
    return litres == null ? null : naturalKey(KIND.WATER_CHANGE, null, date, "", `L${litres}`);
  }

  if (e.kind === KIND.ICP_PANEL) {
    const elements = detail.elements || detail.measurements || {};
    /* The lab's own reference, where there is one, because two panels on one
       date with the same number of elements are two panels. */
    return naturalKey(KIND.ICP_PANEL, null, date, "", detail.ref || `n${Object.keys(elements).length}`);
  }

  if (e.kind === KIND.HUSBANDRY) {
    return naturalKey(KIND.HUSBANDRY, null, date, "", detail.note || detail.what || "");
  }
  return null;
}

function round6(v) {
  return Number(v).toFixed(6);
}

/* --- the configuration ----------------------------------------------------

   Imported as CURRENT configuration with an explicit as-of date and no
   backdating. Canon `WG-ALK-065` forbids backfilling a legacy target range
   into historical assessment, and `V1-DATA-PROVENANCE.md` §2.5 records that
   the settings block is an end state rather than a history — its values
   differed between two exports three days apart with nothing recording the
   change. */
function planConfiguration(d, problems) {
  const settings = d["tank-settings"] || {};
  const ranges = d["custom-ranges"] || {};
  const volume = Number(settings.volumeL);
  const out = {
    /* Absent rather than NaN. A NaN volume passed `missingFacts()`'s
       `== null` test as though it had been supplied, so the app believed it
       knew the tank's size and every water-change fraction silently vanished.
       An absent value is absent, and the keeper is asked for it. */
    ...(Number.isFinite(volume) && volume > 0 ? { netVolumeL: volume } : {}),
    /* The two figures the file carries that are NOT written as settings. The
       standing dose is already in the ledger, put there by the dose log, and a
       second copy in the configuration would be a second owner of what the
       pump is set to. The solution strength is superseded by the keeper's own
       correction. Both are kept as provenance — what the file said — and
       neither is used to compute anything. */
    importedDailyDoseMlPerDay: Number(settings.dailyDoseMl),
    importedDkhPerMlPer100L: Number(settings.dkhPerMlPer100L),
    parameterRanges: {},
  };
  for (const [name, r] of Object.entries(ranges)) {
    const key = PARAMETER_OF[String(name).toLowerCase()];
    if (!key) {
      /* Reported, not dropped — the same rule a reading of an unknown
         parameter follows. A range silently discarded is a setting the keeper
         believes he still has. */
      problems.push({ why: t("import.err.unknownRange", { text: String(name) }) });
      continue;
    }
    if (!r || !Number.isFinite(Number(r.min)) || !Number.isFinite(Number(r.max))) {
      problems.push({ why: t("import.err.badRange", { text: String(name) }) });
      continue;
    }
    out.parameterRanges[key] = { min: Number(r.min), max: Number(r.max) };
  }
  /* Alkalinity's range is not a display range: it is a configuration INPUT the
     engine reads (`targetRangeMinDkh` / `targetRangeMaxDkh`), so it is lifted
     out of the display map into the field the contract names. */
  if (out.parameterRanges.ALK) {
    out.targetRangeMinDkh = out.parameterRanges.ALK.min;
    out.targetRangeMaxDkh = out.parameterRanges.ALK.max;
    delete out.parameterRanges.ALK;
  }
  return out;
}

/* --- writing it -----------------------------------------------------------

   Sequential, because the ledger's ordinal is the count of what is already
   there. Every record carries where it came from. */
export async function applyImport(store, planned, { asOf, correctedPotencyDkhPerMl, reconstruction = null } = {}) {
  const written = { readings: 0, doses: 0, waterChanges: 0, icps: 0, lighting: 0, tasks: 0, completions: 0 };
  const recordedAt = new Date().toISOString();

  for (const r of planned.readings) {
    const def = PARAMETERS.find((p) => p.key === r.parameter);
    await store.ledger.append({
      kind: KIND.READING,
      parameter: r.parameter,
      rawValue: r.rawValue,
      normalizedValue: r.value,
      unit: def ? def.unit : null,
      time: timeFor(r, reconstruction),
      recordedAt,
      source: SOURCE.KEEPER_ENTRY,
      detail: { origin: ORIGIN.KEEPER, ...(r.note ? { note: r.note } : {}) },
    });
    written.readings += 1;
  }

  /* Dose rows in the order they happened, so the first is the standing dose
     and every one after it is a change from the value before it. A change
     needs a previous value, and there is none before the first recorded row —
     inventing one would be manufacturing the delivery history
     `DATA-PROVENANCE.md` §3 forbids. */
  const running = new Map();
  /* Seeded from what the ledger ALREADY knows, so a second import — the
     documented cutover path, since the keeper re-exports — writes a dose
     CHANGE from the value in the record rather than a second standing dose. */
  for (const [parameter, dose] of Object.entries(await ledgerDoses(store))) running.set(parameter, dose);

  for (const r of [...planned.doses].sort(byWhen)) {
    const prior = running.get(r.parameter);
    const time = timeFor(r, reconstruction);

    /* HOW SURE THE RECORD IS OF WHEN THE DOSE TOOK EFFECT.

       `ALK-V2-DATA-CONTRACT.md:250` makes this required, and it matters: an
       `EXACT` the record does not support suppresses `M-5`'s straddling-
       interval confounding, and the engine then attributes a response it
       should have refused. `ledger.js` names this defect class in its own
       words — a supplied `EXACT` "asserts certainty the keeper never
       expressed".

       So it is derived from what the record actually carries, never asserted:
       a resolved instant is exact; a row with a wall-clock time and no proven
       offset is uncertain within the bounds of that clock reading; a row with
       no time at all is uncertain within its day. Where the bounds cannot be
       stated, the row is refused rather than downgraded silently. */
    const confidence = effectiveConfidence(r, time);
    if (!confidence) {
      throw new Error(t("import.err.doseNoBounds", { date: r.date }));
    }

    const detail = { effectiveAtConfidence: confidence.level, origin: ORIGIN.KEEPER, ...confidence.bounds };
    if (prior == null) {
      await store.ledger.append({
        kind: KIND.DOSE_STATE,
        parameter: r.parameter,
        time,
        recordedAt,
        detail: { ...detail, doseMlPerDay: r.mlPerDay },
      });
    } else {
      await store.ledger.append({
        kind: KIND.DOSE_CHANGE,
        parameter: r.parameter,
        time,
        recordedAt,
        /* `fromMlPerDay` is the value the RECORD establishes was running, not
           an assertion that nothing else happened in between. What is unknown
           about the gaps is stated on the import report and drawn as a period
           boundary on the chart; it is not asserted away here. */
        detail: { ...detail, fromMlPerDay: prior, toMlPerDay: r.mlPerDay },
      });
    }
    running.set(r.parameter, r.mlPerDay);
    written.doses += 1;
  }

  const config = await store.config.current();
  const volumeL = Number((config && config.netVolumeL) || planned.configuration.netVolumeL || 0);
  for (const r of planned.waterChanges) {
    const detail = {
      volumeL: r.litres,
      /* The engine's input is a fraction of the system, so the volume is
         divided by the tank's. Where no volume is on record the litres are
         kept and no fraction is invented — the engine then has no water change
         it can read, which is the correct answer to "we do not know how big
         the tank was". */
      ...(volumeL > 0 ? { changedFraction: r.litres / volumeL } : {}),
      /* `V1-DATA-PROVENANCE.md` §5: the salvage reconnaissance found these
         byte-identical to a named V1 source constant, and the owner's
         confirmation of his readings has not been extended to them. Both
         readings are live. Imported with the disagreement recorded on each
         row rather than resolved. */
      origin: ORIGIN.UNCONFIRMED,
    };
    await store.ledger.append({
      kind: KIND.WATER_CHANGE,
      time: timeFor(r, reconstruction),
      recordedAt,
      detail,
    });
    written.waterChanges += 1;
  }

  for (const r of planned.icps) {
    await store.ledger.append({
      kind: KIND.ICP_PANEL,
      time: timeFor(r, reconstruction),
      recordedAt,
      detail: { lab: r.lab, ref: r.ref, elements: r.elements, origin: ORIGIN.UNCONFIRMED },
    });
    written.icps += 1;
  }

  for (const r of planned.lighting) {
    await store.ledger.append({
      kind: KIND.HUSBANDRY,
      time: timeFor(r, reconstruction),
      recordedAt,
      detail: { note: r.note, origin: ORIGIN.UNCONFIRMED },
    });
    written.lighting += 1;
  }

  for (const task of planned.tasks) {
    const existing = (await store.tasks.tasks()).find((x) => x.id === task.id);
    const made = makeTask({
      id: task.id,
      label: task.label,
      kind: task.kind,
      parameter: task.parameter,
      intervalDays: task.intervalDays,
      startDate: task.startDate || asOf.slice(0, 10),
      needsVolume: task.needsVolume,
    });
    await store.tasks.saveTask({
      ...made,
      enabled: task.enabled,
      /* An id the keeper already has keeps its creation date; only the settings
         he edited come across. */
      createdAt: existing ? existing.createdAt : made.createdAt,
      origin: ORIGIN.CONFIGURATION,
    });
    written.tasks += 1;
  }

  for (const c of planned.completions) {
    await store.tasks.complete({ taskId: c.taskId, date: c.date, auto: c.auto });
    written.completions += 1;
  }

  /* The configuration, LAST, and as CURRENT — one new version effective as of
     the import, with no backdating of any kind. */
  const cfg = planned.configuration;
  const values = {
    ...(await carriedForward(store)),
    netVolumeL: cfg.netVolumeL,
    ...(cfg.targetRangeMinDkh != null ? { targetRangeMinDkh: cfg.targetRangeMinDkh } : {}),
    ...(cfg.targetRangeMaxDkh != null ? { targetRangeMaxDkh: cfg.targetRangeMaxDkh } : {}),
    parameterRanges: cfg.parameterRanges,
    importedFrom: {
      format: FORMAT,
      version: VERSION,
      at: asOf,
      /* The correction the owner stated, and the figure it replaced. Recorded
         rather than reconciled: nothing is recomputed with either number, and
         no assessment already stored is touched. */
      supersededDkhPerMlPer100L: cfg.importedDkhPerMlPer100L,
      statedDailyDoseMlPerDay: cfg.importedDailyDoseMlPerDay,
    },
  };
  /* Stated, or left alone. `Number("")` is 0 and `Number.isFinite(0)` is true,
     so a blank field used to store a solution strength of zero and mark it as
     configured — asserting the keeper had told the app something he had left
     empty, in the one field every dose recommendation scales linearly in. */
  const potency = Number(correctedPotencyDkhPerMl);
  if (correctedPotencyDkhPerMl != null && Number.isFinite(potency) && potency > 0) {
    values.selectedPotencyDkhPerMl = potency;
    values.selectedPotencySource = "THEORETICAL_OR_CONFIGURED";
  }
  await store.config.append(values, asOf);

  return written;
}

/* Whatever the keeper already configured and the export does not carry. The
   pump's step is the one that matters: it is a keeper fact with no default and
   the export has no field for it, so it is carried forward rather than lost or
   invented. */
async function carriedForward(store) {
  const current = await store.config.current();
  if (!current) return {};
  const { configVersionId, effectiveFrom, schemaVersion, ...rest } = current;
  return rest;
}

/* What the ledger already believes each pump is set to. Read before the first
   write, so a second import continues the record rather than restarting it. */
async function ledgerDoses(store) {
  const projected = await store.ledger.projection();
  const out = {};
  const at = {};
  for (const row of projected) {
    if (row.state === "SUPERSEDED" || row.state === "INVALID") continue;
    const e = row.event;
    if (e.kind !== KIND.DOSE_STATE && e.kind !== KIND.DOSE_CHANGE) continue;
    const parameter = e.parameter || "ALK";
    const key = `${e.time.localDate} ${e.time.localTime || "00:00"}`;
    if (at[parameter] && key < at[parameter]) continue;
    at[parameter] = key;
    out[parameter] = e.kind === KIND.DOSE_STATE ? e.detail.doseMlPerDay : e.detail.toMlPerDay;
  }
  return out;
}

/* How sure the record is of the moment a dose took effect, derived from the
   record and never asserted.

   `ALK-V2-DATA-CONTRACT.md:250` makes this required, and it matters: an
   `EXACT` the record does not support suppresses `M-5`'s straddling-interval
   confounding, and the engine then attributes a response it should have
   refused. `ledger.js` names the class in its own words — a supplied `EXACT`
   "asserts certainty the keeper never expressed".

   Three answers, and every one of them is true of the row it describes:

     a resolved instant                 EXACT
     a wall-clock time, no proven zone  UNCERTAIN, bounded by that clock
                                        reading across every real offset
     no time at all                     UNCERTAIN, bounded by its day

   The last two need no timezone. Every inhabited offset lies between UTC-12
   and UTC+14, so a wall time W happened somewhere in [W-14h, W+12h] wherever
   the keeper was standing. That is a bound rather than a guess, and a bound is
   exactly what `UNCERTAIN` is for. */
const OFFSET_EAST_MAX_HOURS = 14; /* UTC+14, Kiritimati */
const OFFSET_WEST_MAX_HOURS = 12; /* UTC-12 */

export function effectiveConfidence(row, time) {
  if (time.absoluteInstant) return { level: "EXACT", bounds: {} };

  const from = Date.parse(`${row.date}T${row.time || "00:00"}:00Z`);
  const to = Date.parse(`${row.date}T${row.time || "23:59"}:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null;

  return {
    level: "UNCERTAIN",
    bounds: {
      effectiveAtEarliest: iso(from - OFFSET_EAST_MAX_HOURS * 3600000),
      effectiveAtLatest: iso(to + OFFSET_WEST_MAX_HOURS * 3600000),
    },
  };
}

function iso(ms) {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/* THE ONE OWNER of where dose history begins, over a stored projection rather
   than over a plan. History draws its boundary from this; `describePlan`
   reports the same date from the same rule applied to the rows about to be
   written. An event with no parameter is alkalinity's, which is what every
   dose the app's own forms write means. */
export function firstDoseDate(projected) {
  let first = null;
  for (const r of projected || []) {
    if (r.state === "SUPERSEDED" || r.state === "INVALID") continue;
    const e = r.event;
    if (e.kind !== KIND.DOSE_STATE && e.kind !== KIND.DOSE_CHANGE) continue;
    if ((e.parameter || "ALK") !== "ALK") continue;
    const d = e.time.localDate;
    if (!first || d < first) first = d;
  }
  return first;
}

function byWhen(a, b) {
  const k = (r) => `${r.date} ${r.time || "00:00"}`;
  return k(a) < k(b) ? -1 : k(a) > k(b) ? 1 : 0;
}

/* WHAT A ROW'S TIME BECOMES.

   A row with no `time` field has no time, and gets a record with no instant in
   it — always, and whatever else is going on. The 325 date-only readings gain
   NOTHING from a reconstruction: there is no wall-clock time to reconstruct,
   and supplying one would be the fabrication this whole module exists to
   refuse.

   A row WITH a time has a local wall-clock reading and the export records no
   timezone anywhere, so on its own it can only be `LOCAL_TIME_ZONE_UNKNOWN`.

   The third branch exists only when the keeper has stated which zone those
   clock readings were in. Canon `SHARED-LEGACY-TIME-001` allows
   `RECONSTRUCTED_WITH_PROVENANCE` "only when the historical timezone/offset is
   independently proven and the reconstruction is recorded", and what it
   forbids is the SILENT version. His statement is neither silent nor inferred:
   he says it, it is recorded with its reasoning, and it travels on every
   record it touched.

   Even then it can fail, and where it fails it does not fall through to
   something stronger. An hour daylight saving skipped never happened; an hour
   it repeated happened twice. `reconstructedInstant` returns null for both, and
   the row stays `LOCAL_TIME_ZONE_UNKNOWN` — the truth about a record whose
   instant cannot be established. */
export function timeFor(row, reconstruction = null) {
  if (!row.time) return dateOnly(row.date);
  if (reconstruction && reconstruction.zoneId) {
    const built = reconstructedInstant(row.date, row.time, reconstruction.zoneId, reconstruction);
    if (built) return built;
  }
  return localTimeZoneUnknown(row.date, row.time);
}
