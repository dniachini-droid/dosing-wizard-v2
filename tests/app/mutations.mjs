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
    find: "    const sameAsOf = list.filter((r) => r.asOf === asOf).length;\n    const assessmentId = sameAsOf ? `ASSESS-${asOf}#${sameAsOf}` : `ASSESS-${asOf}`;",
    replace: "    const assessmentId = `ASSESS-${asOf}`;",
    breaks: ["ASS-03"],
  },
  {
    id: "AM-14",
    why: "an existing assessment id is silently overwritten rather than refused",
    file: "app/src/store/assessments.js",
    find: "    if (await backend.get(ASSESSMENTS, rec.assessmentId)) {",
    replace: "    if (false) {",
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
      '    id: "DOSE_CHANGE",\n    rank: 60,\n    when: (r) =>\n      !(outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH") &&\n      action(r) === "SET_MAINTENANCE_DOSE" &&',
    replace:
      '    id: "DOSE_CHANGE",\n    rank: 60,\n    when: (r) =>\n      true &&\n      action(r) === "SET_MAINTENANCE_DOSE" &&',
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
    replace: "      const id = `${taskId}|${date}|${completionSeq++}`;",
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
    find: "  if ((declined || []).includes(suggestion.at)) {",
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
];
