/* ============================================================================
   THE NEGATIVE CONTROLS
   ----------------------------------------------------------------------------
   The pattern is `tools/conformance/run-mutations.py`'s, applied to the
   application layer: each mutation is a named change to a source file that
   MUST turn a named test red. A test nobody has seen fail is a test nobody has
   seen work.

   Each entry states:

     id       so a failure can be talked about
     why      what defect this mutation impersonates. Every one of these is a
              real mistake somebody could make, not a contrived edit
     file     relative to the repository root
     find     the exact source text to replace
     replace  what to replace it with
     breaks   the test ids that must go red. If any of them still passes, the
              mutation is reported as MISSED and the run fails
   ========================================================================= */

export const MUTATIONS = [
  /* --- the append-only ledger -------------------------------------------- */
  {
    id: "AM-01",
    why: "a correction overwrites the record it replaces, instead of appending beside it",
    file: "app/src/store/ledger.js",
    find: "    await backend.put(EVENTS, ev.eventId, ev);",
    replace:
      "    if (ev.supersedes) await backend.put(EVENTS, ev.supersedes, ev);\n" +
      "    await backend.put(EVENTS, ev.eventId, ev);",
    breaks: ["LED-02"],
  },
  {
    id: "AM-02",
    why: "marking an entry suspect writes a status onto the entry rather than appending an annotation",
    file: "app/src/store/ledger.js",
    find: "    const ann = makeAnnotation({ ...spec, ordinal });\n    await backend.put(ANNOTATIONS, ann.annotationId, ann);",
    replace:
      "    const ann = makeAnnotation({ ...spec, ordinal });\n" +
      "    await backend.put(EVENTS, target.eventId, { ...target, status: spec.type });\n" +
      "    await backend.put(ANNOTATIONS, ann.annotationId, ann);",
    breaks: ["LED-03"],
  },
  {
    id: "AM-03",
    why: "the event id counter resets on a new millisecond, so an out-of-order append collides with an earlier id — the defect a test found during the build",
    file: "app/src/store/ledger.js",
    find: "  if (recordedAtMs > highestMs) {\n    highestMs = recordedAtMs;\n    withinMs = 0;\n  } else {\n    withinMs += 1;\n  }",
    replace:
      "  if (recordedAtMs !== highestMs) {\n    highestMs = recordedAtMs;\n    withinMs = 0;\n  } else {\n    withinMs += 1;\n  }",
    breaks: ["TIME-03"],
  },
  {
    id: "AM-04",
    why: "the total order falls back to insertion order rather than (instant, ordinal, id)",
    file: "app/src/store/ledger.js",
    find: "  return [...events].sort(\n    (a, b) =>\n      key(a) - key(b) ||\n      a.eventOrdinal - b.eventOrdinal ||",
    replace: "  return [...events].sort(\n    (a, b) =>\n      0 ||\n      0 ||",
    breaks: ["LED-05"],
  },
  {
    id: "AM-05",
    why: "a reading the keeper flagged as suspect is quietly withheld from the engine, which puts an eligibility rule in the interface",
    file: "app/src/store/ledger.js",
    find: '    if (row.state === "SUPERSEDED" || row.state === "INVALID") continue;',
    replace: '    if (row.state !== "CURRENT") continue;',
    breaks: ["LED-06"],
  },
  {
    id: "AM-06",
    why: "a date-only reading is dropped on the way to the engine instead of being sent with its provenance",
    file: "app/src/store/ledger.js",
    find: '    if (e.kind === KIND.READING && e.parameter === "ALK") {',
    replace: '    if (e.kind === KIND.READING && e.parameter === "ALK" && at) {',
    breaks: ["LED-07"],
  },

  /* --- time provenance ---------------------------------------------------- */
  {
    id: "AM-07",
    why: "a date-only record is given a midday time, which is the exact fabrication the contract forbids by name",
    file: "app/src/store/time.js",
    find: "    localDate: String(localDate).slice(0, 10),\n    /* No absoluteInstant. Not null, not midnight, not noon — absent. */",
    replace:
      "    localDate: String(localDate).slice(0, 10),\n" +
      "    absoluteInstant: String(localDate).slice(0, 10) + \"T12:00:00Z\",",
    breaks: ["TIME-01"],
  },
  {
    id: "AM-08",
    why: "the provenance rule is relaxed so a correction may improve it",
    file: "app/src/store/time.js",
    find: "  if (a > b) {",
    replace: "  if (false) {",
    breaks: ["TIME-02", "TIME-04"],
  },
  {
    id: "AM-09",
    why: "the provenance rule is tightened to equality, so an honest downgrade is refused too",
    file: "app/src/store/time.js",
    find: "  if (a > b) {",
    replace: "  if (a !== b) {",
    breaks: ["TIME-03", "TIME-04"],
  },
  {
    id: "AM-10",
    why: "a date-only time is left unfrozen, so a later line can add the instant the constructor refused to invent",
    file: "app/src/store/time.js",
    find: "  if (!localDate) throw new Error(t(\"err.dateOnlyNeedsDate\"));\n  return Object.freeze({",
    replace: "  if (!localDate) throw new Error(t(\"err.dateOnlyNeedsDate\"));\n  return ({",
    breaks: ["TIME-01"],
  },

  /* --- stored assessments ------------------------------------------------- */
  {
    id: "AM-11",
    why: "the canon version stamp is dropped from the stored record",
    file: "app/src/store/assessments.js",
    find: "      canonVersion: (describe && describe.canonVersion) || engineResult.canonVersion || null,",
    replace: "      canonVersion: null,",
    breaks: ["ASS-01"],
  },
  {
    id: "AM-12",
    why: "the input event set is not recorded, so a stored assessment can never be replayed",
    file: "app/src/store/assessments.js",
    find: "      inputEventIds: [...inputEventIds],",
    replace: "      inputEventIds: [],",
    breaks: ["ASS-01"],
  },
  {
    id: "AM-13",
    why: "a re-analysis overwrites the earlier record instead of becoming a new one",
    file: "app/src/store/assessments.js",
    find: "    let asOfOrdinal = list.filter((r) => r.asOf === asOf).length;",
    replace: "    let asOfOrdinal = 0; return { stored: false, record: previous };",
    breaks: ["ASS-03"],
  },
  {
    id: "AM-14",
    why: "an id is assumed free rather than claimed, so a new assessment writes straight over an existing record",
    file: "app/src/store/assessments.js",
    find: "    for (let tries = 0; (await backend.get(ASSESSMENTS, idFor(asOfOrdinal))) != null; tries += 1) {",
    replace: "    for (let tries = 0; false; tries += 1) {",
    breaks: ["ASS-04"],
  },
  {
    id: "AM-15",
    why: "the engine result is summarised rather than stored verbatim, and the reason codes are dropped",
    file: "app/src/store/assessments.js",
    find: "      engineResult,\n      auditTrace,",
    replace: "      engineResult: { ...engineResult, reasonCodes: [] },\n      auditTrace,",
    breaks: ["ASS-02"],
  },
  {
    id: "AM-16",
    why: "a configuration change edits the current version instead of appending a new one",
    file: "app/src/store/config.js",
    find: "    const configVersionId = `CFG-V${h.length + 1}`;",
    replace: "    const configVersionId = `CFG-V1`;",
    breaks: ["ASS-07"],
  },

  /* --- card selection ------------------------------------------------------ */
  {
    id: "AM-17",
    why: "V1's shadowing defect, reintroduced: the ordinary dose-change row no longer excludes a safety breach, so two rows match one result",
    file: "app/src/present/cards.js",
    find:
      '    id: "DOSE_CHANGE",\n    rank: 60,\n    when: (r) =>\n      !(outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH") &&\n      !withheld(r) &&\n      action(r) === "SET_MAINTENANCE_DOSE" &&',
    replace:
      '    id: "DOSE_CHANGE",\n    rank: 60,\n    when: (r) =>\n      true &&\n      !withheld(r) &&\n      action(r) === "SET_MAINTENANCE_DOSE" &&',
    breaks: ["CARD-02"],
  },
  {
    id: "AM-18",
    why: "the safety row stops matching a HIGH breach, so alkalinity above the safe upper limit renders as an ordinary refusal",
    file: "app/src/present/cards.js",
    find: '    when: (r) => outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH",',
    replace: '    when: (r) => outer(r) === "BREACHED_LOW",',
    breaks: ["CARD-01"],
  },
  {
    id: "AM-19",
    why: "the fallback row is removed, so an unrecognised result selects nothing and renders a blank",
    file: "app/src/present/cards.js",
    find: "    when: () => true,\n    fallback: true,",
    replace: "    when: () => false,\n    fallback: true,",
    breaks: ["CARD-01", "CARD-03"],
  },
  {
    id: "AM-20",
    why: "two rows share a rank, so the declared order stops being total",
    file: "app/src/present/cards.js",
    find: '    id: "HOLD",\n    rank: 70,',
    replace: '    id: "HOLD",\n    rank: 60,',
    breaks: ["CARD-05"],
  },
  {
    id: "AM-21",
    why: "NOT_RUN is treated as an ordinary value, so a refusal renders as though it were a number",
    file: "app/src/present/cards.js",
    find: 'export const ABSENT = Object.freeze(["NOT_RUN", "WITHHELD", "NONE", "UNKNOWN", "NOT_APPLICABLE"]);',
    replace: 'export const ABSENT = Object.freeze(["WITHHELD"]);',
    breaks: ["CARD-06"],
  },

  /* --- scheduling ---------------------------------------------------------- */
  {
    id: "AM-22",
    why: "scheduling is anchored to the due date rather than the completion, so being late compounds",
    file: "app/src/store/schedule.js",
    find: "  let due = lastDone ? addDays(lastDone, task.intervalDays) : task.startDate;",
    replace: "  let due = addDays(task.startDate, task.intervalDays);",
    breaks: ["SCH-01", "SCH-02"],
  },
  {
    id: "AM-23",
    why: "a nudge is no longer anchored to the completion it was made against, so it persists into every later occurrence and permanently skews the rhythm",
    file: "app/src/store/schedule.js",
    find:
      "  const nudgeStillApplies =\n    task.adjustDays && (task.adjustAnchor ?? null) === (lastDone ?? null);",
    replace: "  const nudgeStillApplies = !!task.adjustDays;",
    breaks: ["SCH-03"],
  },
  {
    id: "AM-24",
    why: "logging a reading completes every test task rather than the one for its parameter",
    file: "app/src/store/schedule.js",
    find: "    (t) => t.enabled !== false && t.kind === TASK_KIND.TEST && t.parameter === parameter",
    replace: "    (t) => t.enabled !== false && t.kind === TASK_KIND.TEST",
    breaks: ["SCH-04"],
  },
  {
    id: "AM-25",
    why: "a disabled task is still scheduled and still auto-completes",
    file: "app/src/store/schedule.js",
    find: "  const active = (tasks || []).filter((t) => t.enabled !== false);",
    replace: "  const active = tasks || [];",
    breaks: ["SCH-05"],
  },
  {
    id: "AM-26",
    why: "the projection guard is removed, so a one-day interval over a long horizon runs away",
    file: "app/src/store/schedule.js",
    find: "  while (d <= untilDate && guard++ < 400) {",
    replace: "  while (d <= untilDate && guard++ < 100000) {",
    breaks: ["SCH-06"],
  },
  {
    id: "AM-27",
    why: "a task can be created with no interval, so the app asserts a cadence nobody chose",
    file: "app/src/store/schedule.js",
    find: '  if (!(intervalDays > 0)) throw new Error(t("tasks.interval.needChosen"));',
    replace: "  if (false) throw new Error();",
    breaks: ["SCH-08"],
  },
  {
    id: "AM-28",
    why: "a completion is given a fresh identity each time, so ticking twice on one day stacks two",
    file: "app/src/store/schedule.js",
    find: "      const id = `${taskId}|${date}`;",
    /* Reachable without help from production source. The variable this used to
       increment was declared in `schedule.js` FOR this mutation and read by
       nothing else — production code existing to make a test go red, which is
       the wrong way round. */
    replace: "      const id = `${taskId}|${date}|${Math.random()}`;",
    breaks: ["SCH-09"],
  },
  {
    id: "AM-29",
    why: "turning a task off deletes it, taking its completion history with it",
    file: "app/src/store/schedule.js",
    find: "      const existing = await backend.get(TASKS, id);\n      if (existing) await backend.put(TASKS, id, { ...existing, enabled: false });",
    replace: "      await backend.del(TASKS, id);",
    breaks: ["SCH-10"],
  },

  /* --- the suggested test --------------------------------------------------- */
  {
    id: "AM-30",
    why: "the engine's suggestion silently moves the keeper's scheduled test, which the specification rules out by name",
    file: "app/src/store/suggestion.js",
    find: "  if (preference === PREFERENCE.REPLACE || preference === PREFERENCE.ADD_EXTRA) {",
    replace: "  if (true) {",
    breaks: ["SUG-02"],
  },
  {
    id: "AM-31",
    why: "replace rewrites the keeper's interval rather than nudging the next occurrence, so their rhythm is destroyed",
    file: "app/src/store/suggestion.js",
    find: "    adjustAnchor: lastCompletionOf(alkTask, completions),",
    replace:
      "    intervalDays: Math.max(1, daysBetween(day, suggestion.date)),\n" +
      "    startDate: suggestion.date,\n" +
      "    adjustDays: 0,\n" +
      "    adjustAnchor: null,",
    breaks: ["SUG-03", "SUG-04"],
  },
  {
    id: "AM-32",
    why: "an extra test is stored as a repeating task, so a one-off becomes a rhythm the keeper never asked for",
    file: "app/src/store/suggestion.js",
    find: "      source: \"ENGINE_SUGGESTION\",",
    replace: "      source: \"ENGINE_SUGGESTION\",\n      intervalDays: 4,",
    breaks: ["SUG-05"],
  },
  {
    id: "AM-33",
    why: "a preference is inferred from behaviour rather than from the checkbox",
    file: "app/src/store/suggestion.js",
    find: "  await store.kvSet(\"lastAcceptedSuggestion\", { at: suggestion.at, how, on: new Date().toISOString() });",
    replace:
      "  await store.kvSet(\"lastAcceptedSuggestion\", { at: suggestion.at, how, on: new Date().toISOString() });\n" +
      "  await store.kvSet(PREFERENCE_KEY, how);",
    breaks: ["SUG-10"],
  },
  {
    id: "AM-34",
    why: "a decline is remembered as a standing preference",
    file: "app/src/store/suggestion.js",
    find: "  if (how !== PREFERENCE.REPLACE && how !== PREFERENCE.ADD_EXTRA) {",
    replace: "  if (false) {",
    breaks: ["SUG-11"],
  },
  {
    id: "AM-35",
    why: "declining one suggestion silences the engine for every later one too",
    file: "app/src/store/suggestion.js",
    find: "  if ((declined || []).includes(suggestionKey(suggestion))) {",
    replace: "  if ((declined || []).length > 0) {",
    breaks: ["SUG-13"],
  },
  {
    id: "AM-36",
    why: "an app ask never expires, so an unanswered question sits in the list forever",
    file: "app/src/store/suggestion.js",
    find: "  return daysBetween(ask.raisedOn, today || todayLocal()) <= APP_ASK_EXPIRY_DAYS;",
    replace: "  return true;",
    breaks: ["SUG-15"],
  },
  {
    id: "AM-37",
    why: "an extra test is not cleared by logging its reading, so it nags after it has been done",
    file: "app/src/store/suggestion.js",
    find: "    return !logged && e.date >= addDays(day, -APP_ASK_EXPIRY_DAYS);",
    replace: "    return e.date >= addDays(day, -APP_ASK_EXPIRY_DAYS);",
    breaks: ["SUG-07"],
  },
  {
    id: "AM-38",
    why: "an extra test never ages out, so one the keeper ignored in July is still on the list in September",
    file: "app/src/store/suggestion.js",
    find: "    return !logged && e.date >= addDays(day, -APP_ASK_EXPIRY_DAYS);",
    replace: "    return !logged;",
    breaks: ["SUG-16"],
  },
  {
    id: "AM-39",
    why: "a suggestion is offered again on a day the keeper is already testing, which is a question with no answer",
    file: "app/src/store/suggestion.js",
    find: "  if (scheduledDate === suggestion.date || alreadyExtra) {",
    replace: "  if (false) {",
    breaks: ["SUG-08", "SUG-09"],
  },

  /* --- the strings file ----------------------------------------------------- */
  {
    id: "AM-40",
    why: "a reason code loses its sentence, so the interface falls back to the general wording",
    file: "app/src/strings.js",
    find: '"reason.TRAJECTORY_FALLING":',
    replace: '"reason.TRAJECTORY_FALLING_RENAMED_BY_MUTATION":',
    breaks: ["STR-01"],
  },
  {
    id: "AM-41",
    why: "contract vocabulary is written into a visible string",
    file: "app/src/strings.js",
    find: '  "trajectory.FALLING": "Falling",',
    replace: '  "trajectory.FALLING": "Falling (TRAJECTORY_FALLING)",',
    breaks: ["STR-02"],
  },
  {
    id: "AM-42",
    why: "an untranslated payload value is printed verbatim — the leak that reached a real screen during the build",
    file: "app/src/present/wording.js",
    find: "  if (CONTRACT_SHAPED.test(s)) return null; /* to the developer view instead */",
    replace: "  /* mutation: print it anyway */",
    breaks: ["STR-03"],
  },
  {
    id: "AM-43",
    why: "an unknown reason code renders as its own identifier",
    file: "app/src/present/wording.js",
    find: '  return code && has(`reason.${code}`) ? t(`reason.${code}`) : t("reason.fallback");',
    replace: "  return code && has(`reason.${code}`) ? t(`reason.${code}`) : String(code);",
    breaks: ["STR-04"],
  },
  {
    id: "AM-44",
    why: "a missing string renders as a blank rather than naming the key",
    file: "app/src/strings.js",
    find: '  if (entry === undefined) return `⟨missing string: ${key}⟩`;',
    replace: '  if (entry === undefined) return "";',
    breaks: ["STR-07"],
  },
  {
    id: "AM-45",
    why: "a parameterised sentence is reduced to a value stuck on the end, which is what the whole rule exists to prevent",
    file: "app/src/strings.js",
    find: '  "assessment.reco.dose": ({ direction, dose }) => `${direction} the dose to ${dose} mL/day`,',
    replace: '  "assessment.reco.dose": ({ direction, dose }) => `${direction} the dose mL/day ${dose}`,',
    breaks: ["STR-08"],
  },
  /* ---------------------------------------------------------------------
     The fixes from the first review pass. Each of these reintroduces a defect
     a reviewer actually found in this build, so the test that now catches it
     is proved to be the thing that would have caught it.
     ------------------------------------------------------------------- */
  {
    id: "AM-46",
    why: "the hold row tests an action the engine never emits, so every hold falls to UNCLASSIFIED and the keeper is told not to act on the card",
    file: "app/src/present/cards.js",
    find: '      action(r) === "HOLD_CURRENT_DOSE" &&',
    replace: '      action(r) === "HOLD" &&',
    breaks: ["CARD-01", "CARD-08"],
  },
  {
    id: "AM-47",
    why: "the refusal row keys on the action again, which cannot distinguish a refusal from a hold because both are HOLD_CURRENT_DOSE",
    file: "app/src/present/cards.js",
    find: "const withheld = (r) => WITHHELD_STATUSES.includes(maintenanceStatus(r));",
    replace: 'const withheld = (r) => action(r) === "REFUSE";',
    breaks: ["CARD-01", "CARD-08"],
  },
  {
    id: "AM-48",
    why: "a present standing dose is read as an instruction, so a hold tells the keeper to change to the dose they are already on",
    file: "app/src/present/cards.js",
    find: '  return action(engineResult) === "SET_MAINTENANCE_DOSE" && isPresent(d?.recommendedDoseMlPerDay);',
    replace: "  return isPresent(d?.recommendedDoseMlPerDay);",
    breaks: ["CARD-09"],
  },
  {
    id: "AM-49",
    why: "a failed storage read reports as an empty tank, so an assessment is computed and stored from no history",
    file: "app/src/store/db.js",
    find: '    if (!r.ok) throw new Error(r.reason || t("err.notRead"));\n    return r.value || [];\n  },\n  async all(store) {',
    replace: "    return r.ok ? r.value || [] : [];\n  },\n  async all(store) {",
    breaks: ["ASS-12"],
  },
  {
    id: "AM-50",
    why: "the assessment runs on through a storage failure instead of stopping, and stores what it finds",
    file: "app/src/assess.js",
    find: '      state: "STORAGE_UNAVAILABLE",',
    replace: '      state: "ASSESSED",',
    breaks: ["ASS-08"],
  },
  {
    id: "AM-51",
    why: "a replay is handed today's configuration rather than the one the assessment named, so a settings change reads as the engine disagreeing with itself",
    file: "app/src/store/config.js",
    find: "    if (cut < 0) return null; /* Named a version this device does not hold. */\n    return h.slice(0, cut + 1)",
    replace: "    if (cut < 0) return null; /* Named a version this device does not hold. */\n    return h.slice(0)",
    breaks: ["ASS-09"],
  },
  {
    id: "AM-52",
    why: "a version the device does not hold is silently replaced by today's settings instead of refusing",
    file: "app/src/store/config.js",
    find: "    if (cut < 0) return null; /* Named a version this device does not hold. */",
    replace: "    if (cut < 0) return h.map(({ schemaVersion, ...rest }) => rest);",
    breaks: ["ASS-09"],
  },
  {
    id: "AM-53",
    why: "dedup compares the clock again, so every open of the app writes another stored assessment and the history becomes a launch counter",
    file: "app/src/store/assessments.js",
    find: "    if (previous && previous.answerprint === answerprint) {",
    replace: "    if (previous && previous.fingerprint === fingerprint && previous.asOf === asOf) {",
    breaks: ["ASS-10"],
  },
  {
    id: "AM-55",
    why: "records are ordered by their id as text rather than by when they were made",
    file: "app/src/store/assessments.js",
    find: "      if (a.asOf !== b.asOf) return a.asOf < b.asOf ? -1 : 1;\n      return (a.asOfOrdinal || 0) - (b.asOfOrdinal || 0);",
    replace: "      return a.assessmentId < b.assessmentId ? -1 : 1;",
    breaks: ["ASS-11"],
  },
  {
    id: "AM-56",
    why: "an accepted offer re-applies on every launch, pushing the keeper's own test further out each time so it never comes due",
    file: "app/src/store/suggestion.js",
    find: "  if ((applied || []).includes(suggestionKey(suggestion))) {",
    replace: "  if (false) {",
    breaks: ["SUG-17"],
  },
  {
    id: "AM-57",
    why: "any retest timing counts as an offer again, so a routine cadence tick raises a suggested-test row on every assessment",
    file: "app/src/store/suggestion.js",
    find: "  if (!SUGGESTION_REASON_CODES.includes(code)) return null;",
    replace: "  if (code === null) return null;",
    breaks: ["SUG-01"],
  },
  {
    id: "AM-58",
    why: "declining is keyed on the instant again, which is recomputed every run, so 'no thanks' is inert and the stored list grows without bound",
    file: "app/src/store/suggestion.js",
    find: "export function suggestionKey(suggestion) {\n  return `${suggestion.parameter}|${suggestion.date}`;",
    replace: "export function suggestionKey(suggestion) {\n  return suggestion.at;",
    breaks: ["SUG-13"],
  },
  {
    id: "AM-59",
    why: "a module drops off the precache list, so an offline open 404s it and the module graph fails to resolve",
    file: "app/sw.js",
    find: '  "./src/strings.js",\n',
    replace: "",
    breaks: ["SHELL-01"],
  },
  {
    id: "AM-60",
    why: "an engine value loses its wording and renders to the keeper as an absence instead of as what the engine said",
    file: "app/src/strings.js",
    find: '  "evidence.HIGH_CONFIDENCE": "A long clean run to work from",\n',
    replace: "",
    breaks: ["STR-06"],
  },
  /* NOT A MUTATION, AND WORTH SAYING WHY.

     Four capability labels named a DIFFERENT capability's meaning, and no test
     can catch that. `STR-06` checks every `M-1`..`M-13` renders as words and
     is not the catch-all, which a wrong-but-plausible sentence passes. The
     mapping from a capability id to a plain-English sentence is a translation,
     and nothing in the repository holds both halves in a form that can be
     compared automatically.

     So this one is verified by eye against `ALK-V2-DATA-CONTRACT.md:844-856`,
     and that is recorded in `docs/implementation/app/OPEN-ITEMS.md` rather
     than papered over with a mutation that no test would catch.
     ------------------------------------------------------------------- */
  {
    id: "AM-62",
    why: "a dose event is allowed to omit how sure it is of its effective time, and the app asserts EXACT on the keeper's behalf",
    file: "app/src/store/ledger.js",
    find: '    if (c !== "EXACT" && c !== "UNCERTAIN") {',
    replace: "    if (false) {",
    breaks: ["LED-08"],
  },
  {
    id: "AM-63",
    why: "assessment writes stop being serialised, so two started in the same second collide on one id and one silently overwrites the other",
    file: "app/src/store/assessments.js",
    find: "    const run = writeQueue.then(fn, fn);",
    replace: "    const run = Promise.resolve().then(fn);",
    breaks: ["ASS-13"],
  },

  /* --- test mode ---------------------------------------------------------
     Every one of these is a real mistake with an irreversible consequence:
     seeded readings in the keeper's own tank history, an assessment stamped
     with the wrong instant, a stepper that moves a label and nothing else, or
     a reset aimed at the wrong database.
     -------------------------------------------------------------------- */
  {
    id: "AM-64",
    why: "test mode uses the real tank's database, so every seeded reading lands in the keeper's own history",
    file: "app/src/store/mode.js",
    find: "  return mode === MODE.TEST ? testBackend() : idbBackend;",
    replace: "  return idbBackend;",
    breaks: ["TM-01"],
  },
  {
    id: "AM-65",
    why: "the test database is named the same as the real one, which is the same defect spelled differently",
    file: "app/src/store/db.js",
    find: 'export const TEST_DB_NAME = "dosing-wizard-v2-testmode";',
    replace: "export const TEST_DB_NAME = DB_NAME;",
    breaks: ["TM-01"],
  },
  {
    id: "AM-66",
    why: "the chosen instant never reaches the clock, so the engine is asked about today under the keeper's chosen date",
    file: "app/src/store/mode.js",
    find: "  const { date, time } = testInstant();\n  setClock(() => localDateTime(date, time));",
    replace: "  setClock(null);",
    breaks: ["TM-04", "TM-06", "TM-07"],
  },
  {
    id: "AM-67",
    why: "the assessment instant is read from the wall clock again, so test mode moves the label and nothing behind it",
    file: "app/src/assess.js",
    find: "export function nowAsOf() {\n  return nowIso();\n}",
    replace:
      "export function nowAsOf() {\n" +
      '  return new Date().toISOString().replace(/\\.\\d{3}Z$/, "Z");\n' +
      "}",
    breaks: ["TM-05"],
  },
  {
    id: "AM-68",
    why: "stepping moves the stored date but never reinstalls the clock, so the stepper moves a label on screen and the engine keeps being asked about the day before it",
    file: "app/src/store/mode.js",
    find: "  slots.set(KEY_DATE, addDays(at.date, n));\n  applyClock();",
    replace: "  slots.set(KEY_DATE, addDays(at.date, n));",
    breaks: ["TM-06", "TM-07"],
  },
  {
    id: "AM-68b",
    why: "the step direction is ignored, so 'a day earlier' goes forward and the keeper cannot get back to the day they were looking at",
    file: "app/src/store/mode.js",
    find: "export function stepTestDays(n) {\n  const at = testInstant();",
    replace: "export function stepTestDays(n) {\n  n = 1;\n  const at = testInstant();",
    breaks: ["TM-06"],
  },
  {
    id: "AM-68c",
    why: "a jump to a chosen date is stored but never reaches the clock, so the app says one date and assesses another",
    file: "app/src/store/mode.js",
    find: "  if (!date && !time) return at;\n  applyClock();",
    replace: "  if (!date && !time) return at;",
    breaks: ["TM-06"],
  },
  {
    id: "AM-69",
    why: "a seeded line with no time is given midnight, and the fabricated precision is afterwards indistinguishable from a real one",
    file: "app/src/store/seed.js",
    find: "  return row.time\n    ? exactInstant(row.date, row.time, undefined, localZone())\n    : dateOnly(row.date);",
    replace: '  return exactInstant(row.date, row.time || "00:00", undefined, localZone());',
    breaks: ["TM-09"],
  },
  {
    id: "AM-70",
    why: "an unreadable line is dropped instead of reported, so a batch half-applies and the keeper never learns which lines were lost",
    file: "app/src/store/seed.js",
    find: '      problems.push({ line: lineNo, text: line, why: t("seed.err.badDate", { text: date }) });\n      return;',
    replace: "      return;",
    breaks: ["TM-10"],
  },
  {
    id: "AM-71",
    why: "the first dose line is recorded as a change from a dose nobody ever gave, which is fabricated delivery history",
    file: "app/src/store/seed.js",
    find: "    const kind = runningDose == null ? KIND.DOSE_STATE : KIND.DOSE_CHANGE;",
    replace: "    const kind = KIND.DOSE_CHANGE;",
    breaks: ["TM-11"],
  },
  {
    id: "AM-72",
    why: "clearing the test data is a no-op, so the keeper believes a run has been reset and reads the next one against the last one's records",
    file: "app/src/store/db.js",
    find: "    async destroy() {\n      m.clear();\n      return { ok: true, reason: null };\n    },",
    replace: "    async destroy() {\n      return { ok: true, reason: null };\n    },",
    breaks: ["TM-08"],
  },
  {
    id: "AM-73",
    why: "bulk entry and reset lose their guard, so either can be reached while the app is pointed at the real tank",
    file: "app/src/main.js",
    find: "  async seedSeries(rows) {\n    if (!isTestMode()) throw new Error(t(\"testmode.err.notInTestMode\"));",
    replace: "  async seedSeries(rows) {",
    breaks: ["TM-12"],
  },
];
