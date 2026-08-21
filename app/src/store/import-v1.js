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
import { dateOnly, localTimeZoneUnknown } from "./time.js";
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
});

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
    if (stated[key] !== undefined && stated[key] !== n) {
      disagreements.push({ key, stated: stated[key], actual: n });
    }
  }
  return { actual, stated, disagreements };
}

function len(v) {
  return Array.isArray(v) ? v.length : 0;
}

/* --- the plan --------------------------------------------------------------

   Everything the import would do, worked out before anything is written, so
   the keeper reads it and chooses. Pure: it reads no store and no clock. */
export function planImport(doc, { existing = [], existingCompletions = [] } = {}) {
  const d = doc.data || {};
  const problems = [];

  /* The multiset of natural keys already in the record. Counted rather than
     set-membership, because two identical readings on one day are two
     readings — a repeat test is a real thing — and a second run of the import
     must add neither of them. */
  const held = new Map();
  for (const row of existing) {
    if (row.state === "SUPERSEDED" || row.state === "INVALID") continue;
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
  for (const r of d.readings || []) {
    const parameter = PARAMETER_OF[String(r.param || "").toLowerCase()];
    if (!parameter) {
      problems.push({ why: t("import.err.unknownParameter", { text: String(r.param) }) });
      continue;
    }
    const value = Number(r.value);
    if (!Number.isFinite(value)) {
      problems.push({ why: t("import.err.notANumber", { text: String(r.value), date: String(r.date) }) });
      continue;
    }
    const row = {
      parameter,
      value,
      /* As the keeper's own file wrote it. `rawValue` is what was typed and is
         never re-rendered from the number. */
      rawValue: String(r.value),
      date: String(r.date).slice(0, 10),
      time: r.time ? String(r.time).slice(0, 5) : null,
      note: r.note || null,
    };
    const key = naturalKey(KIND.READING, parameter, row.date, row.time, value);
    if (claim(key)) readings.push(row);
    else skippedReadings.push(row);
  }

  const doses = [];
  const skippedDoses = [];
  for (const r of d["dose-log"] || []) {
    const parameter = DOSE_PARAMETER_OF[String(r.element || "").toLowerCase()];
    const ml = Number(r.ml);
    if (!parameter || !Number.isFinite(ml)) {
      problems.push({ why: t("import.err.badDose", { text: String(r.element), date: String(r.date) }) });
      continue;
    }
    const row = {
      parameter,
      mlPerDay: ml,
      date: String(r.date).slice(0, 10),
      time: r.time ? String(r.time).slice(0, 5) : null,
      note: r.note || null,
    };
    const key = naturalKey(KIND.DOSE_STATE, parameter, row.date, row.time, ml);
    if (claim(key)) doses.push(row);
    else skippedDoses.push(row);
  }

  const waterChanges = [];
  const skippedWater = [];
  for (const r of d["water-changes"] || []) {
    const litres = Number(r.litres);
    if (!Number.isFinite(litres) || litres <= 0) {
      problems.push({ why: t("import.err.badWater", { date: String(r.date) }) });
      continue;
    }
    const row = { litres, date: String(r.date).slice(0, 10), note: r.note || null };
    const key = naturalKey(KIND.WATER_CHANGE, null, row.date, null, litres);
    if (claim(key)) waterChanges.push(row);
    else skippedWater.push(row);
  }

  const icps = [];
  const skippedIcps = [];
  for (const r of d["icp-tests"] || []) {
    const row = {
      date: String(r.date).slice(0, 10),
      lab: r.lab || null,
      ref: r.ref || null,
      elements: r.elements && typeof r.elements === "object" ? r.elements : {},
    };
    const key = naturalKey(KIND.ICP_PANEL, null, row.date, null, Object.keys(row.elements).length);
    if (claim(key)) icps.push(row);
    else skippedIcps.push(row);
  }

  const lighting = [];
  const skippedLighting = [];
  for (const r of d["lighting-log"] || []) {
    const row = { date: String(r.date).slice(0, 10), note: String(r.note || "") };
    const key = naturalKey(KIND.HUSBANDRY, null, row.date, null, row.note);
    if (claim(key)) lighting.push(row);
    else skippedLighting.push(row);
  }

  /* Reminders and their completions are not ledger events — they are the
     keeper's schedule and its history, and the task store keys both by an id
     it builds itself, so re-running writes the same rows rather than new
     ones. */
  const tasks = [];
  for (const r of d.reminders || []) {
    const interval = Number(r.intervalDays);
    if (!(interval > 0)) {
      problems.push({ why: t("import.err.badReminder", { text: String(r.label || r.id) }) });
      continue;
    }
    tasks.push({
      id: String(r.id),
      label: String(r.label || r.id),
      /* The EDITED configuration, which is what the keeper actually has —
         `V1-DATA-PROVENANCE.md` §2.4: "import the edited configuration, not the
         seed defaults". His alkalinity interval is every two days because he
         changed it to that. */
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
  for (const r of d["task-log"] || []) {
    const row = { taskId: String(r.taskId), date: String(r.date).slice(0, 10), auto: !!r.auto };
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
    configuration: planConfiguration(d),
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
export function describePlan(planned) {
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
     could be about. */
  const alkDoses = planned.doses.filter((d) => d.parameter === "ALK").sort(byWhen);
  const doseHistoryFrom = alkDoses.length ? alkDoses[0].date : null;

  const alk = planned.readings.filter((r) => r.parameter === "ALK");
  const afterBoundary = doseHistoryFrom ? alk.filter((r) => r.date >= doseHistoryFrom).length : 0;

  return {
    parameters: [...byParameter.values()].sort((a, b) => b.total - a.total),
    total: planned.readings.length,
    withTime,
    dateOnly: planned.readings.length - withTime,
    doseHistoryFrom,
    alkTotal: alk.length,
    alkAfterBoundary: afterBoundary,
    alkBeforeBoundary: alk.length - afterBoundary,
    /* Not one of these carries a proven offset, because the export records no
       timezone anywhere. Counted separately from the date-only ones because
       they are a different fact about the record, even though they reach the
       same place: `SHARED-LEGACY-TIME-001` makes neither eligible for a
       calculation over exact elapsed time. */
    exactElapsedAvailable: 0,
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

export function naturalKeyOfEvent(e) {
  const date = e.time && e.time.localDate;
  if (!date) return null;
  const time = (e.time && e.time.localTime) || "";
  if (e.kind === KIND.READING) return naturalKey(KIND.READING, e.parameter, date, time, e.normalizedValue);
  if (e.kind === KIND.DOSE_STATE) {
    return naturalKey(KIND.DOSE_STATE, e.parameter, date, time, e.detail.doseMlPerDay);
  }
  if (e.kind === KIND.DOSE_CHANGE) {
    /* A change and a standing dose at the same value on the same day are the
       same fact about the pump arriving twice, so they share a key. Without
       that, re-running the import would write a change beside the standing
       dose it had already written. */
    return naturalKey(KIND.DOSE_STATE, e.parameter, date, time, e.detail.toMlPerDay);
  }
  if (e.kind === KIND.WATER_CHANGE) {
    const litres = e.detail.volumeL;
    return litres == null ? null : naturalKey(KIND.WATER_CHANGE, null, date, "", litres);
  }
  if (e.kind === KIND.ICP_PANEL) {
    return naturalKey(KIND.ICP_PANEL, null, date, "", Object.keys(e.detail.elements || {}).length);
  }
  if (e.kind === KIND.HUSBANDRY) {
    return naturalKey(KIND.HUSBANDRY, null, date, "", e.detail.note || "");
  }
  return null;
}

/* --- the configuration ----------------------------------------------------

   Imported as CURRENT configuration with an explicit as-of date and no
   backdating. Canon `WG-ALK-065` forbids backfilling a legacy target range
   into historical assessment, and `V1-DATA-PROVENANCE.md` §2.5 records that
   the settings block is an end state rather than a history — its values
   differed between two exports three days apart with nothing recording the
   change. */
function planConfiguration(d) {
  const settings = d["tank-settings"] || {};
  const ranges = d["custom-ranges"] || {};
  const out = {
    netVolumeL: Number(settings.volumeL),
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
    if (!key || !r || !Number.isFinite(Number(r.min)) || !Number.isFinite(Number(r.max))) continue;
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
export async function applyImport(store, planned, { asOf, correctedPotencyDkhPerMl } = {}) {
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
      time: timeFor(r),
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
  for (const r of [...planned.doses].sort(byWhen)) {
    const prior = running.get(r.parameter);
    const time = timeFor(r);
    if (prior == null) {
      await store.ledger.append({
        kind: KIND.DOSE_STATE,
        parameter: r.parameter,
        time,
        recordedAt,
        detail: {
          doseMlPerDay: r.mlPerDay,
          /* The export records the time to the minute and the keeper stated
             it, so the effective time is as exact as the record it came from —
             which is a local time with no proven offset, and is stored as
             one. */
          effectiveAtConfidence: "EXACT",
          origin: ORIGIN.KEEPER,
        },
      });
    } else {
      await store.ledger.append({
        kind: KIND.DOSE_CHANGE,
        parameter: r.parameter,
        time,
        recordedAt,
        detail: {
          fromMlPerDay: prior,
          toMlPerDay: r.mlPerDay,
          effectiveAtConfidence: "EXACT",
          origin: ORIGIN.KEEPER,
        },
      });
    }
    running.set(r.parameter, r.mlPerDay);
    written.doses += 1;
  }

  const config = await store.config.current();
  for (const r of planned.waterChanges) {
    const detail = {
      volumeL: r.litres,
      /* The engine's input is a fraction of the system, so the volume is
         divided by the tank's. Where no volume is on record the litres are
         kept and no fraction is invented — the engine then has no water change
         it can read, which is the correct answer to "we do not know how big
         the tank was". */
      ...(config && config.netVolumeL ? { changedFraction: r.litres / config.netVolumeL } : {}),
      /* `V1-DATA-PROVENANCE.md` §5: the salvage reconnaissance found these
         byte-identical to a named V1 source constant, and the owner's
         confirmation of his readings has not been extended to them. Both
         readings are live. Imported with the disagreement recorded on each
         row rather than resolved. */
      origin: ORIGIN.UNCONFIRMED,
    };
    await store.ledger.append({
      kind: KIND.WATER_CHANGE,
      time: timeFor(r),
      recordedAt,
      detail,
    });
    written.waterChanges += 1;
  }

  for (const r of planned.icps) {
    await store.ledger.append({
      kind: KIND.ICP_PANEL,
      time: timeFor(r),
      recordedAt,
      detail: { lab: r.lab, ref: r.ref, elements: r.elements, origin: ORIGIN.UNCONFIRMED },
    });
    written.icps += 1;
  }

  for (const r of planned.lighting) {
    await store.ledger.append({
      kind: KIND.HUSBANDRY,
      time: timeFor(r),
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
      origin: ORIGIN.KEEPER,
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
  if (Number.isFinite(Number(correctedPotencyDkhPerMl))) {
    values.selectedPotencyDkhPerMl = Number(correctedPotencyDkhPerMl);
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

function byWhen(a, b) {
  const k = (r) => `${r.date} ${r.time || "00:00"}`;
  return k(a) < k(b) ? -1 : k(a) > k(b) ? 1 : 0;
}

/* THE TWO CONSTRUCTORS, AND NOTHING ELSE.

   A row with no `time` field has no time, and gets a record with no instant in
   it. A row with one has a local wall-clock time and no timezone — the export
   records none anywhere — so it gets `LOCAL_TIME_ZONE_UNKNOWN`, which keeps the
   time it actually has without claiming an offset nobody wrote down.

   There is no third branch. A caller cannot obtain an instant from here by any
   spelling. */
export function timeFor(row) {
  return row.time ? localTimeZoneUnknown(row.date, row.time) : dateOnly(row.date);
}
