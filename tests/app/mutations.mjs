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
  /* MUTATIONS RETIRED WITH THE SURFACES THEY TESTED.

     54 mutations were removed when the V1 interface port deleted the files
     they mutated — `app/src/ui/chart.js`, `app/src/screens/*`, `app/sw.js`,
     `app/assets/tokens.css` and `app/assets/app.css`. Their tests went in the
     same change (`tests/app/test-chart.mjs`, `test-shell.mjs`,
     `test-tokens.mjs`).

     THE FIRST VERSION OF THIS NOTE CLAIMED "no surviving test lost its
     negative control: each pair was retired together." That was false, and a
     review said so. Four surviving tests — `IMP-35`, `TM-12`, `TM-24` and
     `TM-25` — were RE-POINTED at new assertions and their old mutations went
     with the code they mutated, leaving each of them with none. `TM-25` was
     the worst of the four: its own comment records that the re-pointing caught
     a real defect during the port, and no control was written for it.

     They have controls again: `AM-P30`…`AM-P33` below. `META-01` in
     `tests/app/test-port.mjs` now fails if any test has none, which is what
     should have caught this instead of a person reading two files side by
     side.

     Of the 54 that were genuinely retired, every one targets a file that no
     longer exists.

     Retired: AM-105, AM-106, AM-107, AM-108, AM-109, AM-110, AM-111, AM-112, AM-113, AM-114, AM-115, AM-116, AM-117, AM-118, AM-119, AM-120, AM-121, AM-141, AM-142, AM-148, AM-149, AM-151, AM-152, AM-153, AM-154, AM-155, AM-156, AM-157, AM-157b, AM-158, AM-159, AM-160, AM-161, AM-162, AM-163, AM-164, AM-165, AM-178, AM-179, AM-179b, AM-180, AM-180b, AM-182, AM-182b, AM-183, AM-184, AM-185, AM-185b, AM-186, AM-59, AM-73, AM-84, AM-85, AM-86
  */

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

  /* --- the dosing tab ----------------------------------------------------- */
  {
    id: "AM-D1",
    why: "an unknown trend goes back to saying `not clear yet` — a phrase that never names what is not clear, which is the defect the spec calls out by name",
    file: "app/src/strings.js",
    find: '"dosing.status.trend.uncertain": "no clear alkalinity trend yet",',
    replace: '"dosing.status.trend.uncertain": "not clear yet",',
    breaks: ["DOS-01"],
  },
  {
    id: "AM-D2",
    why: "safety returns to the wide status box, where it is redundant with position and renders as an alarm for good news",
    file: "app/src/present/dosing-tab.js",
    find: "  parts.push(trendPhrase(result));",
    replace: "  parts.push(trendPhrase(result));\n  if (result.outerBoundState) parts.push(String(result.outerBoundState));",
    breaks: ["DOS-02"],
  },
  {
    id: "AM-D3",
    why: "prose prints a signed slope, so the keeper reads `falling -0.030 dKH a day` — a magnitude with a direction word AND a minus sign in front of it",
    file: "app/src/lib/format.js",
    find: "    : fmtQty(Math.abs(v), kind);",
    replace: "    : fmtQty(v, kind);",
    breaks: ["DOS-03"],
  },
  {
    id: "AM-D4",
    why: "the `Change the dose anyway` button is dropped from a hold, so a keeper who disagrees with the app has nowhere to go — V1 had it",
    file: "app/src/present/dosing-tab.js",
    find: "      offerChangeAnyway: true,",
    replace: "      offerChangeAnyway: false,",
    breaks: ["DOS-04"],
  },
  {
    id: "AM-D5",
    why: "the difference box prints a bare signed number instead of naming the gap, so `-0.030` has to be interpreted by the keeper",
    file: "app/src/present/dosing-tab.js",
    find: '    difference = matching\n      ? { label: t("dosing.boxes.difference"), value: t("dosing.boxes.diff.matching"),',
    replace: '    difference = false\n      ? { label: t("dosing.boxes.difference"), value: t("dosing.boxes.diff.matching"),',
    breaks: ["DOS-05"],
  },
  {
    id: "AM-D6",
    why: "a span renders as a raw decimal again — `4 readings over 4.99 days`, the round-three defect verbatim",
    file: "app/src/present/dosing-tab.js",
    find: "  const half = Math.round(d * 2) / 2;",
    replace: "  return t(\"dosing.span.numeric\", { n: d });\n  const half = Math.round(d * 2) / 2;",
    breaks: ["DOS-06"],
  },
  {
    id: "AM-D11",
    why: "a long span is rounded twice — to the nearest half day and then to the nearest whole — so 20.4 days renders as 21, a 3% error introduced by the formatter that item 4 exists to prevent",
    file: "app/src/present/dosing-tab.js",
    find: '  if (whole > 14) return t("dosing.span.numeric", { n: Math.round(d) });',
    replace: '  if (whole > 14) return t("dosing.span.numeric", { n: Math.round(half) });',
    breaks: ["DOS-06"],
  },
  {
    id: "AM-D7",
    why: "every INFO code reaches the screen again, including the engine narrating its own filing — CONFIG_VERSION_RESOLVED, AUDIT_TRACE_WRITTEN and the rest",
    file: "app/src/present/dosing-tab.js",
    find: "    if (c.severity === \"INFO\") continue;\n    if (LEARNER_ONLY.has(c.code) || SAYS_NOTHING.has(c.code)) continue;",
    replace: "    if (false) continue;\n    if (LEARNER_ONLY.has(c.code) || SAYS_NOTHING.has(c.code)) continue;",
    breaks: ["DOS-07", "DOS-08"],
  },
  {
    id: "AM-L20",
    why: "a deletion removes the event and leaves its annotations dangling — the tombstone owner decision 32 says must not remain",
    file: "app/src/store/ledger.js",
    find: "      if (a.targetEventId === eventId) await backend.del(ANNOTATIONS, a.annotationId);",
    replace: "      if (false) await backend.del(ANNOTATIONS, a.annotationId);",
    breaks: ["COR-03"],
  },
  {
    id: "AM-L23",
    why: "a deleted record's assessments survive it, so a stored answer goes on describing a past that no longer exists — owner decision 32 names this half explicitly, and AM-L20 only covers the annotations",
    file: "app/src/lib/record.js",
    find: "  const assessments = await store.assessments.forgetEvent(eventId);",
    replace: "  const assessments = [];",
    breaks: ["COR-03"],
  },
  {
    id: "AM-L21",
    why: "only the most recent record can be deleted — a reading from three days ago silently survives, so the keeper's delete appears to do nothing",
    file: "app/src/store/ledger.js",
    find: "    const event = await backend.get(EVENTS, eventId);\n    if (!event) return { removed: false };",
    replace: "    const event = await backend.get(EVENTS, eventId);\n    if (!event) return { removed: false };\n    const newest = (await backend.all(EVENTS)).slice(-1)[0];\n    if (newest && newest.eventId !== eventId) return { removed: false };",
    breaks: ["COR-04"],
  },
  {
    id: "AM-L22",
    why: "a correction appends a superseding event again instead of rewriting the record, so the keeper's typo stays in the ledger and finding 17's \"the record holds the corrected value\" is false",
    file: "app/src/lib/record.js",
    find: "  return store.ledger.replace(eventId, {",
    replace: "  return store.ledger.append({ kind: KIND.READING, parameter: param, supersedes: eventId, recordedAt: nowIsoExact(),",
    breaks: ["COR-01"],
  },
  {
    id: "AM-T15",
    why: "the import report counts readings the way it did before owner decision 31, so it promises the keeper N records with no time and then writes N records carrying an assigned 09:00 — the report and the record disagree, which is worse than no report because he agreed to something that did not happen",
    file: "app/src/store/import-v1.js",
    find: "      if (timeFor(r, assumption, { assignTimeOfDay: true }).absoluteInstant) withInstant += 1;",
    replace: "      if (timeFor(r, assumption, { assignTimeOfDay: false }).absoluteInstant) withInstant += 1;",
    breaks: ["IMP-21", "IMP-24"],
  },
  {
    id: "AM-T14",
    why: "owner decision 31 is applied to doses as well as readings, so a dose change dated 11 August asserts it took effect at nine in the morning — turning UNCERTAIN into EXACT and giving the response classifier an instant nobody stated",
    file: "app/src/store/import-v1.js",
    find: "    return assignTimeOfDay\n      ? assignedDayInstant(row.date, assumption.offsetMinutes, assumption)\n      : dateOnly(row.date);",
    replace: "    return assignedDayInstant(row.date, assumption.offsetMinutes, assumption);",
    breaks: ["IMP-01b", "IMP-23"],
  },
  {
    id: "AM-P40",
    why: "the estimator says nothing at all when it has no measurement yet, so the box goes blank rather than saying what it is waiting for",
    file: "app/src/present/dosing-tab.js",
    find: "  if (learned == null) {\n    return { ...base, state: \"notYet\", offersChoice: false };\n  }",
    replace: "  if (learned == null) {\n    return null;\n  }",
    breaks: ["DOS-10b"],
  },
  {
    id: "AM-P41",
    why: "the choice is offered at any confidence, so a keeper is asked to re-size his dose from an EXPLORATORY estimate the canon's own ladder would not act on",
    file: "app/src/present/dosing-tab.js",
    find: 'const CONFIDENT_ENOUGH = new Set(["CALIBRATED", "STRONGLY_CALIBRATED"]);',
    replace: 'const CONFIDENT_ENOUGH = new Set(["CALIBRATED", "STRONGLY_CALIBRATED", "EXPLORATORY", "PROVISIONAL", "THEORETICAL_ONLY", "UNRESOLVED"]);',
    breaks: ["DOS-10c"],
  },
  {
    id: "AM-P42",
    why: "the box claims the measurement disagrees with a RECIPE even where the keeper typed a dKH/mL figure straight in and the app holds no recipe at all",
    file: "app/src/present/dosing-tab.js",
    find: "  return !!(config && config.chemical != null && config.stockConcentrationGPerL != null);",
    replace: "  return true;",
    breaks: ["DOS-10d"],
  },
  {
    id: "AM-P43",
    why: "an accepted measurement and a kept figure carry the same provenance line, so the keeper cannot tell a number measured from his tank from one he typed",
    file: "app/src/present/dosing-tab.js",
    find: '  return d.accepted\n    ? { key: "dosing.potency.fromMeasured", value, date: d.on }\n    : { key: "dosing.potency.fromKept", value, date: d.on };',
    replace: '  return { key: "dosing.potency.fromKept", value, date: d.on };',
    breaks: ["DOS-10e"],
  },
  {
    id: "AM-P44",
    why: "the estimator stops watching once the keeper has decided, so a solution that turns out to be a different strength later is never mentioned again",
    file: "app/src/present/dosing-tab.js",
    find: "    asksAgain: !!(decided && decided.learned != null\n      && fmtPotency(decided.learned) !== fmtPotency(learned)),",
    replace: "    asksAgain: false,",
    breaks: ["DOS-10f"],
  },
  {
    id: "AM-P45",
    why: "the estimator's working shows the pooled figure with none of the dose changes it was pooled from, so the keeper is given a number and no way to check it",
    file: "app/src/present/dosing-tab.js",
    find: "    lines.push(t(\"dosing.potency.working.observation\", {",
    replace: "    if (true) continue;\n    lines.push(t(\"dosing.potency.working.observation\", {",
    breaks: ["DOS-10g"],
  },
  {
    id: "AM-P50",
    why: "the 100vh floor is restored beside the dynamic height, so on iOS Safari the shell overhangs the visual viewport, the document scrolls as a whole and the tab bar rides below the fold again (finding 5)",
    file: "app/src/App.jsx",
    /* Re-anchored in round five: a third declaration joined the rule, so the
       shell also takes the visible viewport. The floor this restores is the
       same floor, and it still wins over every height beside it. */
    find: ".app-shell { height: 100vh; height: 100dvh; height: var(--app-vh, 100dvh); overflow: hidden; }",
    replace: ".app-shell { min-height: 100vh; height: 100dvh; height: var(--app-vh, 100dvh); }",
    breaks: ["PORT-20"],
  },
  {
    id: "AM-P51",
    why: "the Dosing tab builds its own chart point shape again, so the x-axis has no dates on it and not one of the keeper's dose changes is marked (finding 9)",
    file: "app/src/components/DosingWizard.jsx",
    find: "  const data = chartGroupsFrom(shown, episodes, fmtShort);",
    replace: "  const data = shown.map((r, i) => ({ i, value: r.value, date: r.date, time: r.time }));",
    breaks: ["PORT-21"],
  },
  {
    id: "AM-P52",
    why: "Setup's tank section counts every keeper fact again, including the solution strength that is legitimately absent for a grams-per-litre keeper — so \"one more left\" never clears however many times he saves (finding 4)",
    file: "app/src/components/Setup.jsx",
    find: "  const missing = ASKED_HERE.filter((f) => !config || config[f.key] == null).length;",
    replace: "  const missing = KEEPER_FACTS.filter((f) => !config || config[f.key] == null).length;",
    breaks: ["PORT-22"],
  },
  {
    id: "AM-P53",
    why: "a new service worker claims a page that is still loading the previous deploy's hashed assets, so every module it has not yet fetched 404s and the app renders without its tab bar (finding 2)",
    file: "app/sw.js",
    find: "      if (superseded.length) {",
    replace: "      if (false) {",
    breaks: ["PORT-23"],
  },
  {
    id: "AM-P54",
    why: "`MARK_INVALID` is back in the ledger's vocabulary, so a screen can offer to annotate a record the owner asked to have deleted",
    file: "app/src/store/ledger.js",
    find: '  MARK_SUSPECT: "MARK_SUSPECT",',
    replace: '  MARK_SUSPECT: "MARK_SUSPECT",\n  MARK_INVALID: "MARK_INVALID",',
    breaks: ["PORT-24"],
  },
  {
    id: "AM-P55",
    why: "the precache list names a path by hand that the build renames, so it 404s on every install and is skipped in silence — the same two-spellings-of-one-path defect as AI-018",
    file: "vite.config.js",
    find: "        const precache = [\n          '/app/index.html',",
    replace: "        const precache = [\n          '/app/index.html',\n          '/app/manifest.webmanifest',",
    breaks: ["PORT-25"],
  },
  {
    id: "AM-P56",
    why: "a response classification the engine can reach falls out of CORRECTION_STATE, so `correctionPanel` returns null and the keeper who changed his dose is shown no panel at all — indistinguishable from having no active intervention",
    file: "app/src/present/dosing-tab.js",
    find: "  NO_DETECTABLE_RESPONSE: \"noMovement\",",
    replace: "",
    breaks: ["DOS-11"],
  },
  {
    id: "AM-P57",
    why: "an absent POTENCY_DISCREPANCY_BAND is read as disagreement again, so silence from ALK-021's owner offers the keeper a dose change on the same screen as a stated, measured disagreement",
    file: "app/src/present/dosing-tab.js",
    find: "  if (!band || !confident) return { ...base, state: \"notConfident\", offersChoice: false };",
    replace: "  if (!confident) return { ...base, state: \"notConfident\", offersChoice: false };",
    breaks: ["DOS-10h"],
  },
  {
    id: "AM-P58",
    why: "REASSESSING joins the states that offer the choice, so a learner re-examining a figure it previously stood behind asks the keeper to re-size his dose from it",
    file: "app/src/present/dosing-tab.js",
    find: 'const CONFIDENT_ENOUGH = new Set(["CALIBRATED", "STRONGLY_CALIBRATED"]);',
    replace: 'const CONFIDENT_ENOUGH = new Set(["CALIBRATED", "STRONGLY_CALIBRATED", "REASSESSING"]);',
    breaks: ["DOS-10i"],
  },
  {
    id: "AM-P59",
    why: "a string declares a parameter and drops it — the caller computes a figure, passes it, and the sentence never mentions it, which is the fmtVal swap's own class of defect",
    file: "app/src/strings.js",
    find: '  "dosing.potency.working.against": ({ learned, entered }) =>',
    replace: '  "dosing.potency.working.against": ({ learned, entered: _e }) =>',
    breaks: ["STR-10"],
  },
  {
    id: "AM-P60",
    why: "a value is handed to `fmtVal` where a parameter definition belongs, so the screen renders the decimal count instead of the number — the defect that showed the owner 4.00 dKH/mL for a 77 L tank",
    file: "app/src/components/Dashboard.jsx",
    /* Re-anchored: the Latest/Min/Max/Median row was rebuilt for owner
       finding 25 — the unit moved to its own line so the figures stopped being
       clipped — so the old anchor text no longer exists. The check it guards
       has not moved. */
    find: "                      {fmtVal(def, v)}",
    replace: "                      {fmtVal(v.value, 4)}",
    breaks: ["PORT-26"],
  },
  {
    id: "AM-D12",
    why: "the potency learner's own capability rows are shown as limits on the dose again — the keeper is told the app has not been told which solution he is dosing, on a screen that is sizing his dose correctly (finding 7)",
    file: "app/src/present/dosing-tab.js",
    find: "    if (LEARNER_ONLY.has(c.code) || SAYS_NOTHING.has(c.code)) continue;",
    replace: "    if (SAYS_NOTHING.has(c.code)) continue;",
    breaks: ["DOS-07b"],
  },
  {
    id: "AM-D13",
    why: "`CAPABILITY_PROGRAMMED_DOSE_STATE_UNCONFIRMED` maps back to \"what your pump is set to\", so a hard-coded NOT_RUN emitted on every assessment tells the keeper his entered dose is missing",
    file: "app/src/present/dosing-tab.js",
    find: "const MISSING_FOR = {\n  CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE: \"dosing.why.item.doseState\",",
    replace: "const MISSING_FOR = {\n  CAPABILITY_PROGRAMMED_DOSE_STATE_UNCONFIRMED: \"dosing.why.item.doseState\",\n  CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE: \"dosing.why.item.doseState\",",
    breaks: ["DOS-07c"],
  },
  {
    id: "AM-D8",
    why: "identical reason codes stop collapsing, so 28 EPISODE_RESOLVED events become 28 rows on one screen",
    file: "app/src/present/dosing-tab.js",
    find: "    if (row) { row.count += 1; continue; }",
    replace: "    if (row) { continue; }",
    breaks: ["DOS-08"],
  },
  {
    id: "AM-D9",
    why: "the working stops showing the consumption sum, so the keeper is given a figure and no way to check it — which is the point of the product",
    file: "app/src/present/dosing-tab.js",
    find: "      slope < 0 ? t(\"dosing.working.uses.falling\", args)",
    replace: "      slope < 0 ? \"\"",
    breaks: ["DOS-09"],
  },
  {
    id: "AM-D10",
    why: "the estimator promotes the learned figure into the one the dose is sized from, so the keeper's solution strength changes underneath him without his ever being asked — the one thing finding 13 says it must never do",
    file: "app/src/present/dosing-tab.js",
    find: "  const entered = num(pot.selectedPotencyDkhPerMl) ?? num(pot.theoreticalPotencyDkhPerMl);\n  if (entered == null) return null;",
    replace: "  const entered = num(pot.learnedPotencyDkhPerMl) ?? num(pot.selectedPotencyDkhPerMl) ?? num(pot.theoreticalPotencyDkhPerMl);\n  if (entered == null) return null;",
    breaks: ["DOS-10"],
  },

  {
    id: "AM-C11",
    why: "the Python runtime is reached by a relative path again, which agrees with the indexURL in the dev server and resolves one directory too high in a BUILT app — the engine then cannot start in production at all, silently, and every assessment returns a transport failure",
    file: "app/src/engine/worker.js",
    find: '  const { loadPyodide } = await import(/* @vite-ignore */ new URL("pyodide.mjs", RUNTIME).href);',
    replace: '  const { loadPyodide } = await import(/* @vite-ignore */ "../../vendor/pyodide/pyodide.mjs");',
    breaks: ["PORT-19"],
  },

  {
    id: "AM-C10",
    why: "the standing dose is stamped from the wall clock instead of the app's clock, so inside test mode it is effective months away from the instant being assessed, `happenedBy` filters it out, and the engine reports it has no record of what is being dosed — measured: zero events reaching it",
    file: "app/src/lib/record.js",
    find: "  const instant = at || nowIso();",
    replace: "  const instant = at || nowIsoExact();",
    breaks: ["PORT-17"],
  },

  {
    id: "AM-C6",
    why: "a LOCAL_TIME_ZONE_UNKNOWN reading is sent as a calendar day — the wrong field for its provenance, which the engine refuses as malformed. AI-014 under the other provenance",
    file: "app/src/store/ledger.js",
    find: "  if (time.timeProvenance === PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN) {",
    replace: "  if (false) {",
    breaks: ["LED-11"],
  },
  {
    id: "AM-C7",
    why: "the local date-time is sent as the day alone, dropping the time of day the record does hold",
    file: "app/src/store/ledger.js",
    find: "      localDateTime: time.localTime ? `${time.localDate}T${time.localTime}` : time.localDate,",
    replace: "      localDateTime: time.localDate,",
    breaks: ["LED-11"],
  },
  {
    id: "AM-C8",
    why: "a date-only water change puts its calendar day in `occurredAt`, an Instant field — the engine reads no time, drops the event, and the step a 30% change caused is absorbed into the consumption estimate as though the tank had done it",
    file: "app/src/store/ledger.js",
    find: "        ...(at ? { occurredAt: at } : {}),\n        changedFraction: e.detail.changedFraction,",
    replace: "        occurredAt: at || e.time.localDate,\n        changedFraction: e.detail.changedFraction,",
    breaks: ["LED-12"],
  },
  {
    id: "AM-C9",
    why: "the correction's volume is sent under a name the engine has no input for, so a keeper who TOLD the app he dosed 40 mL has his trajectory and his whole consumption estimate confounded for it — measured: consumption NOT_RUN instead of 0.639",
    file: "app/src/store/ledger.js",
    find: "        ...(e.detail.amountMl != null ? { actualVolumeMl: e.detail.amountMl } : {}),",
    replace: "        ...(e.detail.amountMl != null ? { amountMl: e.detail.amountMl } : {}),",
    breaks: ["LED-13"],
  },
  {
    id: "AM-N1",
    why: "the safety strip goes back to a vocabulary the engine does not emit, so a breach of the safe outer limits is silent on every screen — while OPEN-ITEMS cites that strip as the reason a breach is not silent",
    file: "app/src/present/card-content.js",
    find: '  if (outer === "BREACHED_LOW" || outer === "BREACHED_HIGH") {',
    replace: '  if (outer === "BREACH_LOW" || outer === "BREACH_HIGH") {',
    breaks: ["NOT-01"],
  },
  {
    id: "AM-N1b",
    why: "the strip reads the outer-bound state from the top level only, where the engine does not put it",
    file: "app/src/present/card-content.js",
    find: "  const outer = engineResult.safety?.outerBoundState ?? engineResult.outerBoundState ?? null;",
    replace: "  const outer = engineResult.outerBoundState ?? null;",
    breaks: ["NOT-01"],
  },
  {
    id: "AM-N2",
    why: "the strip is built by ranking reason codes again, so `A RECORD CARRIES A TIME ...` returns to the face of the Today card",
    file: "app/src/present/card-content.js",
    find: "  const dose = engineResult.doseRecommendation;\n  /* THE SPELLING",
    replace: "  const first = (engineResult.reasonCodes || [])[0];\n  if (first) return { id: first.code, title: sayReason(first.code), text: first.code, detail: first.code, severity: first.severity, severityWord: saySeverity(first.severity), payload: first.payload || {}, tone: SEVERITY_TONE.INFO, goDosing: false };\n  const dose = engineResult.doseRecommendation;\n  /* THE SPELLING",
    breaks: ["NOT-02"],
  },
  {
    id: "AM-N3",
    why: "the keeper's own range decides the position of an ASSESSED parameter too, making the application a second owner of alkalinity's position",
    file: "app/src/present/card-content.js",
    find: "  const position = assessed\n    ? (result && knownPosition(result.position) ? result.position : null)",
    replace: "  const position = false\n    ? (result && knownPosition(result.position) ? result.position : null)",
    breaks: ["KP-02"],
  },
  {
    id: "AM-N4",
    why: "a reading exactly on the keeper's minimum is reported as below his range, so a tank held precisely at target reads as failing",
    file: "app/src/present/position.js",
    find: '  if (value < range.min) return "BELOW_RANGE";',
    replace: '  if (value <= range.min) return "BELOW_RANGE";',
    breaks: ["KP-01"],
  },

  {
    id: "AM-C0",
    why: "the pre-amendment wire shape returns: a record with no usable instant puts its calendar day in `measuredAt`, the instant field, and the engine calls all 325 of the owner's date-only readings malformed (AI-014)",
    file: "app/src/store/ledger.js",
    find: "        ...(at ? { measuredAt: at } : dayFields(e.time)),",
    replace: "        measuredAt: at || e.time.localDate,",
    breaks: ["LED-07"],
  },
  {
    id: "AM-C1",
    why: "a correction reissues the record under a new id and ordinal, so it stops being the same record — every index that named it dangles, and finding 17's \"the record holds the corrected value\" becomes a delete-and-re-add wearing its name",
    file: "app/src/store/ledger.js",
    find: "    const next = Object.freeze({ ...prior, ...changes, eventId, eventOrdinal: prior.eventOrdinal });",
    replace: "    const next = Object.freeze({ ...prior, ...changes, eventId, eventOrdinal: prior.eventOrdinal + 1000 });",
    breaks: ["COR-01"],
  },
  {
    id: "AM-C2",
    why: "the correction form offers a time for a date-only reading, fabricating a precision the record never had",
    file: "app/src/lib/record.js",
    find: "    time: time ? stamp(date, time) : undatedReading(date),",
    replace: "    time: stamp(date, time || \"12:00\"),",
    breaks: ["COR-02"],
  },
  {
    id: "AM-C3",
    why: "a deleted reading is still sent to the engine, because the delete left the event in storage and only removed what pointed at it — the keeper's trend still moves on a reading he deleted",
    file: "app/src/store/ledger.js",
    find: "    await backend.del(EVENTS, eventId);\n    return { removed: true, event };",
    replace: "    return { removed: true, event };",
    breaks: ["COR-03", "LED-06"],
  },
  {
    id: "AM-C4",
    why: "a DOSE_STATE with an UNCERTAIN effective time is sent without the bounds the contract makes REQ*, so M-5 cannot tell where a clean segment resumes",
    file: "app/src/store/ledger.js",
    find: "      if (ev.effectiveAtConfidence === \"UNCERTAIN\") {\n        ev.effectiveAtEarliest = e.detail.effectiveAtEarliest;\n        ev.effectiveAtLatest = e.detail.effectiveAtLatest;\n      }\n      out.push(ev);\n    } else if (e.kind === KIND.DOSE_CHANGE && isAlkalinityDose(e)) {",
    replace: "      out.push(ev);\n    } else if (e.kind === KIND.DOSE_CHANGE && isAlkalinityDose(e)) {",
    breaks: ["LED-09"],
  },
  {
    id: "AM-C5",
    why: "a calcium hand-dose is handed to the alkalinity engine as alkalinity entering the tank — manufactured delivery history, which DATA-PROVENANCE.md forbids by name",
    file: "app/src/store/ledger.js",
    find: "    } else if (e.kind === KIND.MANUAL_CORRECTION && isAlkalinityDose(e)) {",
    replace: "    } else if (e.kind === KIND.MANUAL_CORRECTION) {",
    breaks: ["LED-10"],
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
    find: "    const all = await forEngine();\n    return all.slice(0, cut + 1);",
    replace: "    const all = await forEngine();\n    return all.slice(0);",
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
    find: "  return backendFor(mode === MODE.TEST ? TEST_DB_NAME : DB_NAME);",
    replace: "  return backendFor(DB_NAME);",
    breaks: ["TM-01", "TM-02", "TM-03"],
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
    why: "a seeded reading with no time is given midnight as an EXACT_ABSOLUTE, so the hour the app supplied is afterwards indistinguishable from one the keeper measured — owner decision 31 assigns an hour, it does not licence hiding that it was assigned",
    file: "app/src/store/seed.js",
    find: "  if (row.time) return exactInstant(row.date, row.time, undefined, localZone());",
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
    id: "AM-72b",
    why: "the reset is aimed at the real tank's database rather than the test one — one line, and the button wipes the keeper's whole history",
    file: "app/src/store/mode.js",
    find: "export async function resetTestData() {\n  const b = testBackend();",
    replace: "export async function resetTestData() {\n  const b = backendFor(DB_NAME);",
    breaks: ["TM-08"],
  },

  {
    id: "AM-72c",
    why: "a reset that could not run is reported as success, so the keeper reads the next run against the last one's records",
    file: "app/src/store/mode.js",
    find: "  if (r && r.ok) backends.delete(TEST_DB_NAME);\n  return r;",
    replace: "  backends.delete(TEST_DB_NAME);\n  return { ok: true, reason: null };",
    breaks: ["TM-08b"],
  },

  {
    id: "AM-74",
    why: "the whole app is pointed at the real database whatever the mode, so every seeded reading lands in the keeper's own ledger",
    file: "app/src/store/mode.js",
    find: "export function storeForMode(mode) {\n  return createStore(backendForMode(mode));",
    replace: "export function storeForMode(mode) {\n  return createStore(backendForMode(MODE.REAL));",
    breaks: ["TM-02", "TM-03"],
  },

  {
    id: "AM-75",
    why: "a relaunch already in test mode never installs the chosen clock, so the marker names one day and the engine is asked about another — on the path every launch after the first takes",
    file: "app/src/store/mode.js",
    find: "export function useSlots(custom) {\n  slots = custom || browserSlots() || memorySlots();\n  applyClock();",
    replace: "export function useSlots(custom) {\n  slots = custom || browserSlots() || memorySlots();",
    breaks: ["TM-14"],
  },

  {
    id: "AM-76",
    why: "stepping adds a fixed number of milliseconds rather than a calendar day, so a step skips or repeats a date across a daylight-saving boundary",
    file: "app/src/store/time.js",
    find: "export function addDays(iso, n) {\n  const d = parseLocalDate(iso);\n  d.setDate(d.getDate() + n);\n  return isoLocalDate(d);",
    replace: "export function addDays(iso, n) {\n  const d = new Date(parseLocalDate(iso).getTime() + n * 86400000);\n  return isoLocalDate(d);",
    breaks: ["TM-16"],
  },

  {
    id: "AM-77",
    why: "a stored date that rolls over is printed on the marker verbatim, so the marker names one day and the engine is asked about another",
    file: "app/src/store/mode.js",
    find: "    date: normaliseDate(slots.get(KEY_DATE) || isoLocalDate(new Date())),",
    replace: "    date: slots.get(KEY_DATE) || isoLocalDate(new Date()),",
    breaks: ["TM-17"],
  },

  {
    id: "AM-78",
    why: "a water change in litres with no tank volume is discovered halfway through the write, leaving the batch half-applied and a re-paste duplicating everything above it",
    file: "app/src/store/seed.js",
    find: "    if (row.kind === KIND.WATER_CHANGE && row.fraction == null && !haveVolume) {",
    replace: "    if (false) {",
    breaks: ["TM-19"],
  },

  {
    id: "AM-79",
    why: "a planning problem is reported and then written anyway, which is the same half-applied batch by another route",
    file: "app/src/store/seed.js",
    find: "  if (problems.length) {\n    const e = new Error(problems[0].why);",
    replace: "  if (false) {\n    const e = new Error(problems[0].why);",
    breaks: ["TM-19", "TM-21"],
  },

  {
    id: "AM-80",
    why: "dose lines are resolved in the order they were typed, so a later dose pasted above an earlier one records a change from a value that had not yet been set — fabricated delivery history",
    file: "app/src/store/seed.js",
    find: "  const doseRows = rows.filter((r) => r.kind === DOSE_LINE).sort((a, b) => (orderKey(a) < orderKey(b) ? -1 : orderKey(a) > orderKey(b) ? 1 : 0));",
    replace: "  const doseRows = rows.filter((r) => r.kind === DOSE_LINE);",
    breaks: ["TM-20"],
  },

  {
    id: "AM-81",
    why: "a dose dated before dose history the ledger already holds is accepted, and its `from` is taken from a record that comes after it",
    file: "app/src/store/seed.js",
    find: "    if (knownDoseAt && orderKey(row) < knownDoseAt) {",
    replace: "    if (false) {",
    breaks: ["TM-21"],
  },

  {
    id: "AM-82",
    why: "a seeded record claims it was entered on the day it happened, so a fortnight pasted this evening reads as a fortnight of entries made at the time",
    file: "app/src/store/seed.js",
    find: "    const recordedAt = new Date().toISOString();",
    replace: "    const recordedAt = timeFor(row).absoluteInstant || row.date + \"T00:00:00Z\";",
    breaks: ["TM-22"],
  },

  {
    id: "AM-83",
    why: "the task store reads the wall clock again, so what is due stops following the chosen instant and the keeper steps to March with August's task list on screen",
    file: "app/src/store/schedule.js",
    find: "    async today() {\n      return todayLocal();",
    replace: "    async today() {\n      return new Date().toISOString().slice(0, 10);",
    breaks: ["TM-23"],
  },

  /* --- importing the keeper's V1 history ---------------------------------
     The first four are one defect wearing different clothes, and it is the
     defect in this application that cannot be undone: a time nobody recorded,
     stored as though somebody had.
     -------------------------------------------------------------------- */
  {
    id: "AM-87",
    why: "the assigned hour is recorded as a time the keeper stated — `assumedLocalInstant` rather than `assignedDayInstant`, so nothing on the record says the hour was supplied and it is afterwards indistinguishable from a measured one",
    file: "app/src/store/import-v1.js",
    find: "      ? assignedDayInstant(row.date, assumption.offsetMinutes, assumption)",
    replace: '      ? assumedLocalInstant(row.date, "09:00", assumption.offsetMinutes, assumption)',
    breaks: ["IMP-01", "IMP-03"],
  },

  {
    id: "AM-88",
    why: "the assigned hour is midnight rather than the 09:00 the owner decided, so every assigned reading sits on the boundary between two of his calendar days",
    file: "app/src/store/time.js",
    find: 'export const ASSIGNED_TIME_OF_DAY = "09:00";',
    replace: 'export const ASSIGNED_TIME_OF_DAY = "00:00";',
    breaks: ["IMP-01", "TM-09"],
  },

  {
    id: "AM-89",
    why: "the assumed offset is dropped and UTC used instead, so the whole run moves and any reading whose local time crosses midnight lands on the wrong day",
    file: "app/src/store/time.js",
    find: "  const off = offsetMinutes;",
    replace: "  const off = 0;",
    breaks: ["IMP-02", "IMP-03"],
  },

  {
    id: "AM-90",
    why: "an imported time is left unfrozen, so a later line can add or change what the constructor decided",
    file: "app/src/store/time.js",
    find: '  if (!localDate) throw new Error(t("err.dateOnlyNeedsDate"));\n  return Object.freeze({',
    replace: '  if (!localDate) throw new Error(t("err.dateOnlyNeedsDate"));\n  return ({',
    breaks: ["IMP-04"],
  },

  {
    id: "AM-91",
    why: "a reading of a parameter the store cannot name is dropped instead of reported, so the keeper silently loses part of his own history",
    file: "app/src/store/import-v1.js",
    find: '      problems.push({ why: t("import.err.unknownParameter", { text: String(r.param) }) });\n      continue;',
    replace: "      continue;",
    breaks: ["IMP-06"],
  },

  {
    id: "AM-92",
    why: "pH loses its place in the store, so seventeen of the keeper's real measurements have nowhere to go",
    file: "app/src/store/ledger.js",
    find: '  { key: "PH", unit: "", decimals: 2, tone: "ph", assessed: false },\n',
    replace: "",
    breaks: ["IMP-05"],
  },

  {
    id: "AM-93",
    why: "the dose history is back-projected from the tank's current settings, so the whole six months looks analysable and the engine attributes movement to a delivery nobody recorded",
    file: "app/src/store/import-v1.js",
    find: "    const prior = running.get(r.parameter);",
    replace: "    const prior = running.get(r.parameter) ?? 8.8;",
    breaks: ["IMP-07"],
  },

  {
    id: "AM-94",
    why: "a calcium dose change is sent to the alkalinity engine, which then reads 14 mL/day of calcium solution as the alkalinity dose",
    file: "app/src/store/ledger.js",
    find: 'function isAlkalinityDose(e) {\n  return e.parameter == null || e.parameter === "ALK";',
    replace: "function isAlkalinityDose(e) {\n  return true;",
    breaks: ["IMP-08"],
  },

  {
    id: "AM-95",
    why: "the imported settings are backdated to the oldest reading, applying today's target range to six months of history — WG-ALK-065 forbids exactly this",
    file: "app/src/store/import-v1.js",
    find: "  await store.config.append(values, asOf);",
    replace: '  await store.config.append(values, "2026-02-13T00:00:00Z");',
    breaks: ["IMP-09"],
  },

  {
    id: "AM-96",
    why: "the keeper's own display ranges are handed to the engine as configuration it never declared",
    file: "app/src/store/config.js",
    find: '        if (k === "schemaVersion" || APP_ONLY_KEYS.has(k)) continue;',
    replace: '        if (k === "schemaVersion") continue;',
    breaks: ["IMP-09"],
  },

  {
    id: "AM-97",
    why: "the file's stated counts are not checked against its contents, so a truncated export imports as though it were whole",
    file: "app/src/store/import-v1.js",
    find: "    if (stated[key] !== n) disagreements.push({ key, stated: stated[key], actual: n });",
    replace: "",
    breaks: ["IMP-10"],
  },

  {
    id: "AM-98",
    why: "any JSON is accepted as an export, so a file from somewhere else is read as the keeper's history",
    file: "app/src/store/import-v1.js",
    find: '  if (doc.format !== FORMAT) return { ok: false, why: t("import.err.wrongFormat", { format: String(doc.format) }) };\n',
    replace: "",
    breaks: ["IMP-11"],
  },

  {
    id: "AM-99",
    why: "the import keys on the file's own ids, which do not survive an export — so re-importing duplicates the keeper's entire history",
    file: "app/src/store/import-v1.js",
    find: "    const key = naturalKey(KIND.READING, parameter, row.date, row.time, value);",
    replace: "    const key = String(r.id);",
    breaks: ["IMP-13"],
  },

  {
    id: "AM-100",
    why: "already-held records are counted by membership rather than as a multiset, so the second of two repeat tests on one day is silently dropped",
    find: "    const already = held.get(key) || 0;\n    const used = taken.get(key) || 0;\n    taken.set(key, used + 1);\n    return used >= already;",
    file: "app/src/store/import-v1.js",
    replace: "    const already = held.get(key) || 0;\n    return already === 0;",
    breaks: ["IMP-14"],
  },

  {
    id: "AM-101",
    why: "the dedup key ignores the time, so two readings of one value at two times on one day are treated as the same reading",
    file: "app/src/store/import-v1.js",
    find: '  return [kind, parameter || "", date, time || "", String(value)].join("|");',
    replace: '  return [kind, parameter || "", date, String(value)].join("|");',
    breaks: ["IMP-15"],
  },

  {
    id: "AM-102",
    why: "records the salvage inventory could not confirm are imported as the keeper's own, settling a question the owner has not answered",
    file: "app/src/store/import-v1.js",
    find: "      origin: ORIGIN.UNCONFIRMED,\n    };\n    await store.ledger.append({\n      kind: KIND.WATER_CHANGE,",
    replace: "      origin: ORIGIN.KEEPER,\n    };\n    await store.ledger.append({\n      kind: KIND.WATER_CHANGE,",
    breaks: ["IMP-17"],
  },

  {
    id: "AM-103",
    why: "the reminders come across with the old app's shipped defaults rather than the intervals the keeper actually set",
    file: "app/src/store/import-v1.js",
    find: "      intervalDays: interval,",
    replace: "      intervalDays: 7,",
    breaks: ["IMP-19"],
  },

  {
    id: "AM-104",
    why: "a reading the importer judges ineligible is withheld from the engine, which puts an eligibility rule in the importer and makes the record on screen disagree with the record the engine saw",
    file: "app/src/store/import-v1.js",
    find: "  for (const r of planned.readings) {\n    const def = PARAMETERS.find((p) => p.key === r.parameter);",
    replace:
      "  for (const r of planned.readings) {\n" +
      "    if (!r.time) continue;\n" +
      "    const def = PARAMETERS.find((p) => p.key === r.parameter);",
    breaks: ["IMP-05", "IMP-20"],
  },

  /* --- reconstruction, and what the two reviews found ---------------------
     The first is the whole reason the addition exists; the rest are defects
     found by review, each impersonated by the mistake that would restore it.
     -------------------------------------------------------------------- */
  {
    id: "AM-122",
    why: "the record no longer says the hour was assigned — `assignedTimeOfDay` is dropped from the reconstruction, so the natural key stops excluding it and every re-import writes the keeper's whole history a second time",
    file: "app/src/store/time.js",
    find: "    assignedTimeOfDay: ASSIGNED_TIME_OF_DAY,",
    replace: "",
    breaks: ["IMP-01", "IMP-12"],
  },

  {
    id: "AM-123",
    why: "the offset is taken from each row's own date rather than applied uniformly, so two readings either side of a daylight-saving change are an hour apart in an interval that never had one",
    file: "app/src/store/import-v1.js",
    find: "  return assumedLocalInstant(row.date, row.time, assumption.offsetMinutes, assumption);",
    replace:
      "  const seasonal = Number(String(row.date).slice(5, 7)) <= 3 ? assumption.offsetMinutes + 60 : assumption.offsetMinutes;\n" +
      "  return assumedLocalInstant(row.date, row.time, seasonal, { ...assumption, offsetMinutes: seasonal });",
    breaks: ["IMP-22"],
  },

  {
    id: "AM-124",
    why: "an hour daylight saving skipped or repeated is set aside instead of imported, restoring machinery the owner ruled out and losing a real reading",
    file: "app/src/store/import-v1.js",
    find: "  if (!assumption) throw new Error(t(\"err.assumptionNeedsRecord\"));",
    replace:
      '  if (!assumption) throw new Error(t("err.assumptionNeedsRecord"));\n' +
      '  if (row.time === "02:30") return dateOnly(row.date);',
    breaks: ["IMP-24"],
  },

  {
    id: "AM-125",
    why: "the stronger provenance is written without the assumption that justifies it, so a record claims a precision and does not say what it rests on",
    file: "app/src/store/time.js",
    find: "  if (!assumption || !assumption.basis || !assumption.appliedAt) {",
    replace: "  if (false) {",
    breaks: ["IMP-25"],
  },

  {
    id: "AM-126",
    why: "the assumption is recorded as something the keeper stated — jake's finding, and the one thing about this design that must not slip",
    file: "app/src/store/time.js",
    find: "      assumed: true,\n      statedByKeeper: false,",
    replace: "      assumed: assumption.assumed !== false,\n      statedByKeeper: assumption.statedByKeeper === true,",
    breaks: ["IMP-25"],
  },

  {
    id: "AM-127",
    why: "the assumption is dropped from the record entirely, so nothing downstream can see the time was worked out rather than measured",
    file: "app/src/store/time.js",
    find: "    reconstruction: Object.freeze({",
    replace: "    notReconstruction: Object.freeze({",
    breaks: ["IMP-02", "IMP-03"],
  },

  {
    id: "AM-128",
    why: "a dose asserts EXACT certainty about when it took effect whatever the record says, suppressing the straddling-interval confounding M-5 exists for",
    file: "app/src/store/import-v1.js",
    find: '  if (time.absoluteInstant) return { level: "EXACT", bounds: {} };',
    replace: '  return { level: "EXACT", bounds: {} };',
    breaks: ["IMP-28"],
  },

  {
    id: "AM-129",
    why: "dose rows are read in the order the file lists them — and the keeper's export lists them newest-first, so his dose history is inverted and the boundary drawn a week late",
    file: "app/src/store/import-v1.js",
    find: "  for (const r of [...planned.doses].sort(byWhen)) {",
    replace: "  for (const r of planned.doses) {",
    breaks: ["IMP-07"],
  },

  {
    id: "AM-130",
    why: "the dose-history boundary is taken from the file's order rather than from event time, so the report and the chart mark it a week late",
    file: "app/src/store/import-v1.js",
    find: '  const alkDoses = planned.doses.filter((d) => d.parameter === "ALK").sort(byWhen);',
    replace: '  const alkDoses = planned.doses.filter((d) => d.parameter === "ALK");',
    breaks: ["IMP-07"],
  },

  {
    id: "AM-131",
    why: "a row with no date imports as the literal string 'undefined', which sorts ahead of every real date and lands at the head of the keeper's history",
    file: "app/src/store/import-v1.js",
    find: "  if (!DATE_SHAPE.test(iso)) return null;",
    replace: "  if (!DATE_SHAPE.test(iso)) return iso;",
    breaks: ["IMP-29"],
  },

  {
    id: "AM-132",
    why: "a date that does not exist in its month rolls silently into the next one, so a reading moves day without anything saying so",
    file: "app/src/store/import-v1.js",
    find: "  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {\n    return null;\n  }",
    replace: "  if (false) {\n    return null;\n  }",
    breaks: ["IMP-29"],
  },

  {
    id: "AM-133",
    why: "a garbage time field climbs the provenance ladder, so a row with time 'banana' claims the time of day is known",
    file: "app/src/store/import-v1.js",
    find: "  return TIME_SHAPE.test(hhmm) ? { ok: true, time: hhmm } : { ok: false, time: null };",
    replace: "  return { ok: true, time: hhmm };",
    breaks: ["IMP-29"],
  },

  {
    id: "AM-134",
    why: "a record the keeper corrected or marked invalid is re-imported as a fresh live one, so one real measurement becomes two live observations",
    file: "app/src/store/import-v1.js",
    find: "    const k = naturalKeyOfEvent(row.event);\n    if (k) held.set(k, (held.get(k) || 0) + 1);",
    replace: '    if (row.state === "SUPERSEDED" || row.state === "INVALID") continue;\n    const k = naturalKeyOfEvent(row.event);\n    if (k) held.set(k, (held.get(k) || 0) + 1);',
    breaks: ["IMP-30"],
  },

  {
    id: "AM-135",
    why: "a dose typed into this app and the same dose arriving from the export key differently, so running both apps until cutover duplicates every dose change",
    file: "app/src/store/import-v1.js",
    find: '    return naturalKey(KIND.DOSE_STATE, e.parameter || "ALK", date, time, dose);',
    replace: "    return naturalKey(KIND.DOSE_STATE, e.parameter, date, time, dose);",
    breaks: ["IMP-31"],
  },

  {
    id: "AM-136",
    why: "a second import restarts the dose record rather than continuing it, writing a change as a standing dose and losing what it changed from",
    file: "app/src/store/import-v1.js",
    find: "  for (const [parameter, dose] of Object.entries(await ledgerDoses(store))) running.set(parameter, dose);",
    replace: "",
    breaks: ["IMP-32"],
  },

  {
    id: "AM-137",
    why: "a blank solution strength stores zero and marks it configured, in the one field every dose recommendation scales linearly in",
    file: "app/src/store/import-v1.js",
    find: "  if (correctedPotencyDkhPerMl != null && Number.isFinite(potency) && potency > 0) {",
    replace: "  if (Number.isFinite(potency)) {",
    breaks: ["IMP-33"],
  },

  {
    id: "AM-138",
    why: "an export with no tank volume stores NaN, which missingFacts reports as supplied — so the app believes it knows the tank's size",
    file: "app/src/store/import-v1.js",
    find: "    ...(Number.isFinite(volume) && volume > 0 ? { netVolumeL: volume } : {}),",
    replace: "    netVolumeL: volume,",
    breaks: ["IMP-33"],
  },

  {
    id: "AM-139",
    why: "a file that states no counts passes unchecked, so a truncated export imports as though it were whole",
    file: "app/src/store/import-v1.js",
    find: "    if (stated[key] === undefined) {",
    replace: "    if (false) {",
    breaks: ["IMP-34"],
  },

  {
    id: "AM-140",
    why: "a section that is not a list throws out of the report, leaving the keeper on 'Reading…' with a console error",
    file: "app/src/store/import-v1.js",
    find: '    problems.push({ why: t("import.err.notAList", { name }) });\n    return [];',
    replace: "    throw new TypeError(name);",
    breaks: ["IMP-34"],
  },

  {
    id: "AM-143",
    why: "the reminders are attributed to the keeper, when the file does not record which of them he chose and which are the old app's defaults",
    file: "app/src/store/import-v1.js",
    find: "      createdAt: existing ? existing.createdAt : made.createdAt,\n      origin: ORIGIN.CONFIGURATION,",
    replace: "      createdAt: existing ? existing.createdAt : made.createdAt,\n      origin: ORIGIN.KEEPER,",
    breaks: ["IMP-19"],
  },

  {
    id: "AM-144",
    why: "a water-change reminder stops asking for its volume, so completing it writes no water-change event and the engine's segmentation loses it",
    file: "app/src/store/import-v1.js",
    find: "      needsVolume: !!r.needsVolume,",
    replace: "      needsVolume: false,",
    breaks: ["IMP-19"],
  },

  {
    id: "AM-145",
    why: "the keeper's existing tank facts are wiped by the import rather than carried forward, taking the pump step with them",
    file: "app/src/store/import-v1.js",
    find: "    ...(await carriedForward(store)),",
    replace: "",
    breaks: ["IMP-33"],
  },

  {
    id: "AM-146",
    why: "a water change loses the fraction the engine reads, so 25 of them become invisible to segmentation",
    file: "app/src/store/import-v1.js",
    find: "            changedFraction: r.litres / volumeL,",
    replace: "",
    breaks: ["IMP-36"],
  },

  {
    id: "AM-147b",
    why: "an ICP panel with no results at all imports as an empty record standing in for a real panel",
    file: "app/src/store/import-v1.js",
    find: '    if (!r.elements || typeof r.elements !== "object" || !Object.keys(r.elements).length) {',
    replace: "    if (false) {",
    breaks: ["IMP-36"],
  },

  {
    id: "AM-147",
    why: "an ICP panel is identified by how many results it carries rather than by the lab's own reference, so the same panel re-exported with one more element imports a second time",
    file: "app/src/store/import-v1.js",
    find: '    return naturalKey(KIND.ICP_PANEL, null, date, "", detail.ref || `n${Object.keys(elements).length}`);',
    replace: '    return naturalKey(KIND.ICP_PANEL, null, date, "", Object.keys(elements).length);',
    breaks: ["IMP-36"],
  },

  /* AM-150 was retired with the V1 interface port. It anchored on the V2
     shell's `theme-color` and guarded `TOK-03`, in `tests/app/test-tokens.mjs`
     — a suite that tested `app/assets/tokens.css`, which the port deleted
     along with the rest of the V2 interface. The pair went together, which is
     the only way a mutation may leave. */
  /* --- what the review found after the import was built ------------------ */
  {
    id: "AM-166",
    why: "a water change is keyed on the fraction derived from today's tank volume, so correcting net volume once makes all twenty-five import again",
    file: "app/src/store/import-v1.js",
    find: "    const litres = detail.volumeL;\n    if (litres != null) return naturalKey(KIND.WATER_CHANGE, null, date, \"\", `L${round6(litres)}`);",
    replace: "    const litres = null;\n    if (litres != null) return naturalKey(KIND.WATER_CHANGE, null, date, \"\", `L${round6(litres)}`);",
    breaks: ["IMP-37", "IMP-38"],
  },

  {
    id: "AM-166b",
    why: "the import side keys a water change its own way again, so the ledger and the importer disagree about what a duplicate is",
    file: "app/src/store/import-v1.js",
    find: '    const key = naturalKey(KIND.WATER_CHANGE, null, row.date, "", `L${round6(litres)}`);',
    replace: '    const key = naturalKey(KIND.WATER_CHANGE, null, row.date, "", volumeL > 0 ? round6(litres / volumeL) : `L${litres}`);',
    breaks: ["IMP-38"],
  },

  {
    id: "AM-167",
    why: "the derived dose 'from' is stored without its mark, so a number this app worked out is indistinguishable from one the keeper wrote down",
    file: "app/src/store/import-v1.js",
    find: "        detail: { ...detail, fromMlPerDay: prior, fromMlPerDayDerived: true, toMlPerDay: r.mlPerDay },",
    replace: "        detail: { ...detail, fromMlPerDay: prior, toMlPerDay: r.mlPerDay },",
    breaks: ["IMP-39"],
  },

  {
    id: "AM-168",
    why: "the water change's fraction is stored without saying which volume it came from, so a fraction derived from today's tank reads as a fact about February",
    file: "app/src/store/import-v1.js",
    find: "            changedFractionDerived: true,\n            changedFractionFromVolumeL: volumeL,",
    replace: "",
    breaks: ["IMP-39"],
  },

  {
    id: "AM-169",
    why: "the reminders go uncounted again, so a truncated reminders block passes the file's own self-consistency gate in silence",
    file: "app/src/store/import-v1.js",
    find: "    reminders: len(d.reminders),",
    replace: "",
    breaks: ["IMP-40"],
  },

  {
    id: "AM-170",
    why: "a collection the format does not state a count for is reported as a disagreement, so every genuine file raises an alarm and the alarm stops meaning anything",
    file: "app/src/store/import-v1.js",
    find: "      if (STATED_COLLECTIONS.has(key)) disagreements.push({ key, stated: null, actual: n, unstated: true });\n      else unverified.push({ key, actual: n });",
    replace: "      disagreements.push({ key, stated: null, actual: n, unstated: true });",
    breaks: ["IMP-40"],
  },
  /* --- what an independent test review found surviving --------------------
     Every one of these passed the whole gate before the check beside it was
     written. They are grouped so the next reader can see what a review of the
     TESTS, rather than of the code, is worth. */
  {
    id: "AM-171",
    why: "the keeper's chosen time of day is dropped on the way to the clock, so the marker says 09:30 and the engine is asked about midnight",
    file: "app/src/store/mode.js",
    find: "  return new Date(y, (mo || 1) - 1, d || 1, h || 0, mi || 0, 0, 0);",
    replace: "  return new Date(y, (mo || 1) - 1, d || 1, 0, 0, 0, 0);",
    breaks: ["TM-26"],
  },

  {
    id: "AM-171b",
    why: "stepping a day resets the time of day, so a step is silently a new instant rather than a step",
    file: "app/src/store/mode.js",
    find: "export function stepTestDays(n) {",
    replace: 'export function stepTestDays(n) {\n  slots.set(KEY_TIME, "09:00");',
    breaks: ["TM-26"],
  },

  {
    id: "AM-172",
    why: "a pasted alkalinity series is recorded as calcium, so the keeper seeds a fortnight and the alkalinity engine sees an empty history",
    file: "app/src/store/seed.js",
    find: '  alk: "ALK",',
    replace: '  alk: "CA",',
    breaks: ["TM-27"],
  },

  {
    id: "AM-173",
    why: "an exact instant is written as bare UTC, throwing away the offset that made it provable — canon SHARED-LEGACY-TIME-001 by name",
    file: "app/src/store/time.js",
    find: "    absoluteInstant: shiftIso(iso, off) + offset,",
    replace: '    absoluteInstant: iso + "Z",',
    breaks: ["TM-28"],
  },

  {
    id: "AM-173b",
    why: "the offset's sign is flipped, putting every recorded moment twice its offset away from where it happened",
    file: "app/src/store/time.js",
    find: "  const utcMs = Date.UTC(y, mo - 1, d, h, mi) - off * 60000;",
    replace: "  const utcMs = Date.UTC(y, mo - 1, d, h, mi) + off * 60000;",
    breaks: ["TM-28"],
  },

  {
    id: "AM-174",
    why: "the uncertain bound shrinks to an hour, so the engine reads a dose as unambiguously inside an interval when it was not and attributes a response it should have refused",
    file: "app/src/store/import-v1.js",
    find: "const OFFSET_EAST_MAX_HOURS = 14;",
    replace: "const OFFSET_EAST_MAX_HOURS = 1;",
    breaks: ["IMP-41"],
  },

  {
    id: "AM-174b",
    why: "the western bound shrinks the same way, from the other side",
    file: "app/src/store/import-v1.js",
    find: "const OFFSET_WEST_MAX_HOURS = 12;",
    replace: "const OFFSET_WEST_MAX_HOURS = 2;",
    breaks: ["IMP-41"],
  },

  {
    id: "AM-175",
    why: "where dose history begins stops filtering to alkalinity, so a keeper who dosed calcium first gets the boundary drawn months before any alkalinity dose was recorded",
    file: "app/src/store/import-v1.js",
    find: '    if ((e.parameter || "ALK") !== "ALK") continue;',
    replace: "",
    breaks: ["IMP-42"],
  },

  {
    id: "AM-175b",
    why: "a superseded dose record draws the boundary, so a correction moves where analysis is said to begin",
    file: "app/src/store/import-v1.js",
    find: '    if (r.state === "SUPERSEDED" || r.state === "INVALID") continue;\n    const e = r.event;\n    if (e.kind !== KIND.DOSE_STATE && e.kind !== KIND.DOSE_CHANGE) continue;',
    replace: "    const e = r.event;\n    if (e.kind !== KIND.DOSE_STATE && e.kind !== KIND.DOSE_CHANGE) continue;",
    breaks: ["IMP-42"],
  },

  {
    id: "AM-176",
    why: "an import re-enables a reminder the keeper had turned off, so the app starts asking him for a test he decided to stop doing",
    file: "app/src/store/import-v1.js",
    find: "      enabled: r.enabled !== false,",
    replace: "      enabled: true,",
    breaks: ["IMP-43"],
  },

  {
    id: "AM-176b",
    why: "the reminder's enabled state is dropped at the write, so the task store's own default silently overrides what the file said",
    file: "app/src/store/import-v1.js",
    find: "      enabled: task.enabled,",
    replace: "",
    breaks: ["IMP-43"],
  },

  {
    id: "AM-177",
    why: "the keeper's own note on a reading is dropped on the way in — data loss, silent, and not recoverable from the record afterwards",
    file: "app/src/store/import-v1.js",
    find: "      detail: { origin: ORIGIN.KEEPER, ...(r.note ? { note: r.note } : {}) },",
    replace: "      detail: { origin: ORIGIN.KEEPER },",
    breaks: ["IMP-43"],
  },

  {
    id: "AM-181",
    why: "the keeper's band is dropped from the one parameter that has an engine, so alkalinity's chart loses the range every other parameter keeps",
    file: "app/src/store/config.js",
    find: "  if (def.assessed) {",
    replace: "  if (false) {",
    /* Re-pointed by the V1 interface port. `TOK-16` lived in
       `tests/app/test-tokens.mjs` and went with the V2 interface; the RULE it
       guarded — one owner for the keeper's band — is now `PORT-13`, and the
       ported range bar and sparkline both depend on it. */
    breaks: ["PORT-13"],
  },

  {
    id: "AM-181b",
    why: "a half-written range is accepted, so a parameter with a minimum and no maximum shades a band with no top edge",
    file: "app/src/store/config.js",
    find: "  return r && Number.isFinite(r.min) && Number.isFinite(r.max) ? r : null;",
    replace: "  return r || null;",
    breaks: ["PORT-13"],
  },

  /* --- the V1 interface port ---------------------------------------------
     Each of these is a real mistake somebody could make while porting a screen
     — reintroducing a classifier, reaching for storage directly, letting a
     form invent a time — not a contrived edit. */
  {
    id: "AM-P1",
    why: "a ported component works out the position itself again, which is precisely V1's `paramStatus`",
    file: "app/src/lib/backup.jsx",
    find: "  const color = positionTone(position);",
    replace:
      "  const paramStatus = (d, v) => (v == null ? \"unknown\" : v < d.min ? \"low\" : v > d.max ? \"high\" : \"ok\");\n" +
      "  const color = positionTone(position) || paramStatus(def, value);",
    breaks: ["PORT-01", "PORT-04"],
  },
  {
    id: "AM-P2",
    why: "a component tests the engine's position vocabulary itself, so the mapping has two owners",
    file: "app/src/components/DoseExpectation.jsx",
    find: "  const tone = positionTone(position);",
    replace: "  const tone = position === \"BELOW_RANGE\" ? \"#926A09\" : positionTone(position);",
    breaks: ["PORT-02"],
  },
  {
    id: "AM-P3",
    why: "a screen decides for itself whether the engine instructed a change, rather than asking the one owner",
    file: "app/src/App.jsx",
    find: "      goto: instructsDoseChange(engineResult) ? \"dosing\" : null,",
    replace:
      "      goto: engineResult.doseRecommendation\n" +
      "        && engineResult.doseRecommendation.action === \"SET_MAINTENANCE_DOSE\" ? \"dosing\" : null,",
    breaks: ["PORT-03"],
  },
  {
    id: "AM-P4",
    why: "a screen keeps its own copy of state in localStorage beside the ledger, which is a second record of the same tank",
    file: "app/src/components/Setup.jsx",
    find: "  const [openId, setOpenId] = useState(null);",
    replace: "  const [openId, setOpenId] = useState(localStorage.getItem(\"setup-open\"));",
    breaks: ["PORT-05"],
  },
  {
    id: "AM-P5",
    why: "a component builds and appends its own ledger event instead of going through the write adapter",
    file: "app/src/components/Tasks.jsx",
    find: "    await onAddWaterChange({ date: todayStr(), time: nowTime(), litres: L });",
    replace:
      "    await onAddWaterChange({ date: todayStr(), time: nowTime(), litres: L });\n" +
      "    if (false) await store.ledger.append({});",
    breaks: ["PORT-06"],
  },
  {
    id: "AM-P6",
    why: "the shell stops reading the configuration history, so screens render against a stale copy",
    file: "app/src/App.jsx",
    find: "      store.config.current(),",
    replace: "      Promise.resolve(null),",
    breaks: ["PORT-07"],
  },
  {
    id: "AM-P7",
    why: "the stored assessment stops carrying the engine version that produced it, so a replay cannot tell an upgrade from a disagreement",
    file: "app/src/store/assessments.js",
    find: "      engineVersion:",
    replace: "      engineVersionRemoved:",
    breaks: ["PORT-08"],
  },
  {
    id: "AM-P10",
    why: "the read adapter substitutes midday for a reading that has no wall-clock time, so a date-only record reads as a timed one",
    file: "app/src/lib/adapt.js",
    find: "      time: e.time.localTime || null,",
    replace: "      time: e.time.localTime || \"12:00\",",
    breaks: ["PORT-11"],
  },
  {
    id: "AM-P11",
    why: "a correction is allowed to strengthen a record's time provenance, which cannot be told from a real offset afterwards",
    file: "app/src/store/time.js",
    find: "export function assertProvenanceNotImproved(before, after) {",
    replace: "export function assertProvenanceNotImproved(before, after) {\n  if (true) return;",
    breaks: ["PORT-12"],
  },

  {
    id: "AM-P12",
    why: "a canon rule identifier reaches the screen because the shape that keeps it off is dropped — `M.2, M.3, M.5` is what the keeper then reads",
    file: "app/src/present/wording.js",
    find: "  if (CANON_ID.test(s)) return null;",
    replace: "  if (false) return null;",
    breaks: ["PORT-14"],
  },
  {
    id: "AM-P13",
    why: "a stored instant is printed in the contract's own spelling, which the brief rules out by name",
    file: "app/src/present/wording.js",
    find: "  if (INSTANT.test(s)) return sayInstant(s);",
    replace: "  if (false) return sayInstant(s);",
    breaks: ["PORT-14"],
  },
  {
    id: "AM-P14",
    why: "a payload key carrying engine output names stops routing through their wording, so the identifiers go to the screen",
    file: "app/src/present/wording.js",
    find: '  if (key && OUTPUT_KEYS.has(key)) return has(`output.${s}`) ? t(`output.${s}`) : null;',
    replace: "  if (false) return null;",
    breaks: ["PORT-14"],
  },

  /* `AM-P8` and `AM-P9` were retired here when `PORT-09` and `PORT-10` were
     rewritten. Both mutated a source spelling that the old, source-scanning
     versions of those tests pinned — `describe: versions` and `|| "12:00"` —
     and neither spelling exists any more, because the tests that named them
     were replaced by ones that drive the code and read what it wrote. Their
     replacements are `AM-P18` and `AM-P15`/`AM-P16` below, which are
     behavioural in the same way. */
  {
    id: "AM-P15",
    why: "the write adapter fills a missing time with midday through a nullish default rather than `||` — the spelling the first version of PORT-10 could not see",
    file: "app/src/lib/record.js",
    find: "function undated(date) {\n  return dateOnly(date);\n}",
    replace: "function undated(date) {\n  return stamp(date, \"12:00\");\n}",
    breaks: ["PORT-10"],
  },
  {
    id: "AM-P16",
    why: "one recorder alone starts fabricating a time, which is how the defect arrived the first time — three did and four did not",
    file: "app/src/lib/record.js",
    find: "    kind: KIND.NOTE,\n    /* Date only. The form asks for a date and nothing else, so the record says\n       a date and nothing else. */\n    time: undated(date),",
    replace: "    kind: KIND.NOTE,\n    time: stamp(date, date ? \"12:00\" : \"12:00\"),",
    breaks: ["PORT-10"],
  },
  {
    id: "AM-P17",
    why: "a SECOND reader appears in the read adapter and substitutes midday, beside the one the old test pinned",
    file: "app/src/lib/adapt.js",
    find: "export function latestByParamFrom(rows, defs) {",
    replace:
      "export function readingsForDisplay(projection) {\n" +
      "  return readingsFrom(projection).map((r) => ({ ...r, time: r.time || \"12:00\" }));\n" +
      "}\n\n" +
      "export function latestByParamFrom(rows, defs) {",
    breaks: ["PORT-11"],
  },
  {
    id: "AM-P18",
    why: "the version stamps are fabricated in the assessment path while both source literals the old test pinned stay byte-identical",
    file: "app/src/assess.js",
    find: "    versions = await describe0();",
    replace: "    versions = { engineVersion: \"v2\", canonVersion: \"ALK_V2_FREEZE_5\" };",
    breaks: ["PORT-08"],
  },
  {
    id: "AM-P19",
    why: "an engine that cannot start is reported as a record that cannot be read — the defect a review found, restored",
    file: "app/src/assess.js",
    find: '      state: "ENGINE_UNAVAILABLE",',
    replace: '      state: "STORAGE_UNAVAILABLE",',
    breaks: ["PORT-09"],
  },
  {
    id: "AM-P20",
    why: "a replay folds an engine upgrade into a plain disagreement, so the keeper is given the wrong explanation",
    file: "app/src/assess.js",
    find: "  const sameEngineVersion = versions.engineVersion === rec.engineVersion;",
    replace: "  const sameEngineVersion = true;",
    breaks: ["PORT-15"],
  },
  {
    id: "AM-P21",
    why: "a replay against a configuration this device does not hold silently uses today's instead, and blames the difference on the engine",
    file: "app/src/assess.js",
    find: "    return { state: \"CONFIGURATION_UNAVAILABLE\", record: rec, configVersionId: rec.configVersionId };",
    replace: "    return { state: \"REPLAYED\", record: rec, identical: true };",
    breaks: ["PORT-15"],
  },
  {
    id: "AM-P22",
    why: "a component maps the position vocabulary to a colour using UNQUOTED object keys, which a quoted-literal scan cannot see",
    file: "app/src/components/DoseExpectation.jsx",
    find: "  const tone = positionTone(position);",
    replace:
      "  const TONES = { BELOW_RANGE: \"#926A09\", ABOVE_RANGE: \"#C4285B\" };\n" +
      "  const tone = TONES[position] || positionTone(position);",
    breaks: ["PORT-02"],
  },
  {
    id: "AM-P23",
    why: "a component tests a contract action through a computed lookup rather than a quoted comparison",
    file: "app/src/App.jsx",
    find: "      goto: instructsDoseChange(engineResult) ? \"dosing\" : null,",
    replace:
      "      goto: ({ SET_MAINTENANCE_DOSE: \"dosing\" })[engineResult.doseRecommendation?.action] || null,",
    breaks: ["PORT-03"],
  },
  {
    id: "AM-P24",
    why: "a component classifies a reading against the keeper's range under a name that is not on any V1 blocklist",
    file: "app/src/components/DoseExpectation.jsx",
    find: "  const moved = direction === \"RISING\" || direction === \"FALLING\";",
    replace:
      "  const band = (v, r) => (v < r.lo ? \"low\" : v > r.hi ? \"high\" : \"ok\");\n" +
      "  const moved = direction === \"RISING\" || direction === \"FALLING\" || band === null;",
    breaks: ["PORT-04"],
  },
  {
    id: "AM-P25",
    why: "the present layer reaches browser storage directly, which the first scope of PORT-05 did not cover",
    file: "app/src/present/cards.js",
    find: "export function selectCard(engineResult) {",
    replace:
      "export function selectCard(engineResult) {\n" +
      "  if (typeof localStorage !== \"undefined\") localStorage.getItem(\"card\");",
    breaks: ["PORT-05"],
  },
  {
    id: "AM-P26",
    why: "a component appends its own ledger event through a destructured reference, so the literal `ledger.append` never appears",
    file: "app/src/components/Tasks.jsx",
    find: "  const confirmWaterChange = async () => {",
    replace:
      "  const confirmWaterChange = async () => {\n" +
      "    const { append } = (window.__store || {}).ledger || {};\n" +
      "    if (append) await append({});",
    breaks: ["PORT-06"],
  },
  {
    id: "AM-P27",
    why: "a component holds a second reader of the keeper's band, so which range is his has two owners",
    file: "app/src/components/ZoomableChart.jsx",
    find: "export function niceAxis(min, max, padFrac = 0.18) {",
    replace:
      "export function myBand(config, key) {\n" +
      "  return config.parameterRanges ? config.parameterRanges[key] : null;\n" +
      "}\n\n" +
      "export function niceAxis(min, max, padFrac = 0.18) {",
    breaks: ["PORT-13"],
  },
  {
    id: "AM-P28",
    why: "the ledger stops calling alkalinity assessed, which breaks every real caller while a hand-written literal in a test would not notice",
    file: "app/src/store/ledger.js",
    find: '  { key: "ALK", unit: "dKH", decimals: 2, tone: "alk", assessed: true },',
    replace: '  { key: "ALK", unit: "dKH", decimals: 2, tone: "alk", assessed: false },',
    breaks: ["PORT-13"],
  },
  {
    id: "AM-P29",
    why: "the `recent` bucket's far edge moves, so a completion exactly at the window is silently dropped",
    file: "app/src/store/schedule.js",
    find: "    .filter((s) => s.lastDone && daysBetween(s.lastDone, today) <= windowDays)",
    replace: "    .filter((s) => s.lastDone && daysBetween(s.lastDone, today) < windowDays)",
    breaks: ["SCHED-13"],
  },

  /* --- the four re-pointed tests, given back the controls they lost ------- */
  {
    id: "AM-P30",
    why: "setup stamps the configuration version from the wall clock again — the defect the port found, which was fixed and never pinned",
    file: "app/src/App.jsx",
    find: "    await store.config.append({ ...(config || {}), ...values }, nowIso());",
    replace: "    await store.config.append({ ...(config || {}), ...values }, new Date().toISOString());",
    breaks: ["TM-25"],
  },
  {
    id: "AM-P31",
    why: "a second definition of where dose history begins appears, which is what IMP-35 exists to forbid",
    file: "app/src/lib/adapt.js",
    find: "export function rowsFor(rows, key) {",
    replace:
      "export function firstDoseDate(projected) {\n" +
      "  return projected.length ? projected[0].event.time.localDate : null;\n" +
      "}\n\n" +
      "export function rowsFor(rows, key) {",
    breaks: ["IMP-35"],
  },
  {
    id: "AM-P32",
    why: "the store stops refusing a strengthened time provenance, so a correction can turn a date-only record into a timed one",
    file: "app/src/store/time.js",
    /* The refusal itself, not the call site. `IMP-35` checks the ledger still
       calls it and `PORT-12` checks it still refuses; gutting the function
       leaves the call in place and is the way the rule dies quietly. */
    find: "export function assertProvenanceNotImproved(before, after) {",
    replace: "export function assertProvenanceNotImproved(before, after) {\n  if (true) return;",
    breaks: ["PORT-12", "TIME-04"],
  },
  {
    /* RE-POINTED WITH `TM-24` ITSELF, IN ROUND THREE.

       This used to add an import of the mode module, because `TM-24` then
       asserted that the ported shell had NO route into test mode and the
       omission was recorded. Round three item 9 restores the surface, so
       acquiring a route is now the correct state and mutating towards it
       proves nothing.

       What `TM-24` pins now is the property whose absence made the port's
       version of this a real loss, and this is the mutation for it: the shell
       goes back to building the real store unconditionally. A screen would
       still open, test mode would still say it was on, the clock would still
       move — and every reading entered would land in the KEEPER'S OWN TANK.
       That is the single failure the whole real/test separation exists to
       prevent, and it is invisible from the interface. */
    id: "AM-P33",
    why: "the shell builds the real store whatever the mode says, so a test reading lands in the keeper's own tank — silently, with test mode still reporting itself on",
    file: "app/src/App.jsx",
    find: "    storeRef.current = mode === MODE.TEST ? storeForMode(mode) : createStore();",
    replace: "    storeRef.current = createStore();",
    breaks: ["TM-24"],
  },
  {
    id: "AM-P34",
    why: "bulk entry stops refusing outside test mode, which is the guard TM-12's surviving half exists for",
    file: "app/src/store/mode.js",
    find: "export function isTestMode() {",
    replace: "export function isTestMode() {\n  if (true) return true;",
    breaks: ["TM-12"],
  },

  {
    id: "AM-P35",
    why: "a file is quietly dropped from the two declarations, so a file lifted from V1 and never entered in the manifest becomes invisible — the hole a review demonstrated by copying V1's WaterLog.jsx in and watching the manifest stay green",
    file: "tools/port/v2-original.json",
    find: '    "app/src/lib/adapt.js",\n',
    replace: "",
    breaks: ["META-02"],
  },
  {
    id: "AM-P36",
    why: "an exemption is left on META-01's list after the test it covers has acquired a control, so the list grows instead of shrinking",
    file: "tests/app/test-port.mjs",
    find: '    ["LED-01", "pre-dates the port"], ["LED-04", "pre-dates the port"],',
    replace: '    ["LED-01", "pre-dates the port"], ["LED-04", "pre-dates the port"], ["LED-02", "stale"],',
    breaks: ["META-01"],
  },

  /* ---- ROUND FIVE: one test run more than once, and one owner of the
         current value (owner findings 25, 26, 28, 29 and 20) --------------- */
  {
    id: "AM-R01",
    why: "every measurement gets its own chart point again, so a test run three times reads as three tests spread over an hour (finding 29)",
    file: "app/src/present/episodes.js",
    find: "    if (!ep || ep.count <= 1) {",
    replace: "    if (true) {",
    breaks: ["EP-01"],
  },
  {
    id: "AM-R02",
    why: "the trend line is drawn through a raw measurement instead of the value the engine resolved the test to",
    file: "app/src/present/episodes.js",
    find: "        /* The figure the engine used, and the only one the trend line reads. */\n        value: ep.valueDkh,",
    replace: "        value: r.value,",
    breaks: ["EP-02"],
  },
  {
    id: "AM-R03",
    why: "a group takes one member's clock time rather than the instant the engine resolved the test to, so the stack sits where no test happened",
    file: "app/src/present/episodes.js",
    find: "      const time = ep.at ? ep.at.slice(11, 16) : r.time;",
    replace: "      const time = r.time;",
    breaks: ["EP-03"],
  },
  {
    id: "AM-R04",
    why: "the card takes the ledger's last row as the current value again, so five 9.0s and a 10.0 typed in one minute print \"10.00\" beside the words \"in range\" (findings 26 and 28)",
    file: "app/src/present/episodes.js",
    find: "  const ep = def && def.assessed && engineResult ? latestEpisode(index) : null;",
    replace: "  const ep = null;",
    breaks: ["EP-04"],
  },
  {
    id: "AM-R05",
    why: "a parameter with no engine claims its raw reading was resolved by one",
    file: "app/src/present/episodes.js",
    find: "    resolved: false,",
    replace: "    resolved: true,",
    breaks: ["EP-05"],
  },
  {
    id: "AM-R06",
    why: "the group is cached instead of being read afresh, so deleting one measurement of a pair leaves the old group standing everywhere — the exact fault the owner reported after deleting a reading",
    file: "app/src/present/episodes.js",
    find: "  index.list.sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? -1 : 1));\n  return index;",
    replace: "  index.list.sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? -1 : 1));\n  if (globalThis.__epCache) return globalThis.__epCache;\n  globalThis.__epCache = index;\n  return index;",
    breaks: ["EP-06"],
  },
  {
    id: "AM-R07",
    why: "the engine's finding that repeats of one test disagreed by more than its limit is dropped on the way to the screen",
    file: "app/src/present/episodes.js",
    find: "      anomalous: anomalous.has(clusterId),",
    replace: "      anomalous: false,",
    breaks: ["EP-07"],
  },
  {
    id: "AM-R08",
    why: "the thirty-minute window is written into the application, making it a second owner of a canon rule the engine already owns",
    file: "app/src/present/episodes.js",
    find: "function emptyIndex() {",
    replace: "const WINDOW_MINUTES = 30;\nfunction emptyIndex() {",
    breaks: ["EP-08"],
  },
  {
    id: "AM-R09",
    why: "a test run twice stops being called a duplicate, so the sentence explaining the group no longer names how many measurements it holds",
    file: "app/src/present/episodes.js",
    find: '  if (count === 2) return "duplicate";',
    replace: '  if (count === 2) return "many";',
    breaks: ["EP-09"],
  },
  {
    id: "AM-R10",
    why: "a test run once is drawn as a stack, so the chart claims a repeat that did not happen",
    file: "app/src/present/episodes.js",
    find: "        grouped: false,",
    replace: "        grouped: true,",
    breaks: ["EP-10"],
  },
  {
    id: "AM-R11",
    why: "the shell switches to a tab id that does not exist, so the screen goes blank with only the bar on it — finding 20, where \"Change the dose anyway\" set the tab to \"settings\"",
    file: "app/src/App.jsx",
    /* Re-anchored: "Change the dose anyway" no longer navigates anywhere — it
       opens the delivered-dose field on the tab the keeper is already reading
       (finding 19's clarification). The check it guards is unchanged and still
       the right one: every tab this shell switches to must exist. */
    find: '            onOpenDosing={() => setTab("dosing")} />',
    replace: '            onOpenDosing={() => setTab("settings")} />',
    breaks: ["EP-11"],
  },

  /* ---- ROUND FIVE: the screen is as tall as the screen (findings 21, 7,
         22 and 6) ------------------------------------------------------- */
  {
    id: "AM-R12",
    why: "a sheet sizes itself in vh again, so on a phone it is taller than the screen and its lower portion is unreachable behind the tab bar (findings 7 and 22)",
    file: "app/src/components/Dashboard.jsx",
    find: '        <Card className="p-5 sheet-panel overflow-y-auto">',
    replace: '        <Card className="p-5 max-h-[85vh] overflow-y-auto">',
    breaks: ["VP-01", "VP-02"],
  },
  {
    id: "AM-R13",
    why: "a sheet is measured against the large viewport rather than the visible one, and stops leaving the tab bar's row clear",
    file: "app/src/App.jsx",
    find: "          max-height: calc(var(--app-vh, 100dvh) - var(--app-nav-h, 4rem) - 1.5rem);",
    replace: "          max-height: calc(100vh - 1.5rem);",
    breaks: ["VP-03"],
  },
  {
    id: "AM-R14",
    why: "the live measurement is put FIRST, so the dvh declaration overrides it and the shell stops tracking the toolbar",
    file: "app/src/App.jsx",
    find: "        .app-shell { height: 100vh; height: 100dvh; height: var(--app-vh, 100dvh); overflow: hidden; }",
    replace: "        .app-shell { height: var(--app-vh, 100dvh); height: 100vh; height: 100dvh; overflow: hidden; }",
    breaks: ["VP-04"],
  },
  {
    id: "AM-R15",
    why: "a min-height is put back on the shell — round four's own defect, where a FLOOR wins over the height beside it and forces the bar below the fold (finding 21)",
    file: "app/src/App.jsx",
    find: '    <div className="bg-app text-ink font-body flex flex-col app-shell">',
    replace: '    <div className="bg-app text-ink font-body flex flex-col app-shell min-h-screen">',
    breaks: ["VP-05"],
  },
  {
    id: "AM-R16",
    why: "the watcher listens only for a resize, so it misses the toolbar's whole travel — which iOS reports as the visual viewport scrolling, and which is the gesture the owner said moves the bar",
    file: "app/src/lib/viewport.js",
    find: '  vv.addEventListener("scroll", apply);',
    replace: "",
    breaks: ["VP-06"],
  },
  {
    id: "AM-R17",
    why: "the bar's height is written into the stylesheet instead of measured, so it is a second statement of a number with one owner and it is wrong on a screen where the bar is not rendered at all",
    file: "app/src/lib/viewport.js",
    find: '    const nav = document.querySelector("nav[data-app-nav]");\n    root.style.setProperty(APP_NAV_H, `${nav ? Math.ceil(nav.offsetHeight) : 0}px`);',
    replace: '    root.style.setProperty(APP_NAV_H, "62px");',
    breaks: ["VP-08"],
  },
  {
    id: "AM-R18",
    why: "the close control is moved inside the box that scrolls, so it rides away with the content — finding 6, reported twice",
    file: "app/src/components/SheetClose.jsx",
    find: "absolute",
    replace: "static",
    breaks: ["VP-09"],
  },

  {
    id: "AM-R19",
    why: "the viewport watcher loses its guard, so it throws where there is no window — and the application's own suite, which is Node and nothing else, goes down with it",
    file: "app/src/lib/viewport.js",
    find: '  if (typeof window === "undefined" || typeof document === "undefined") return () => {};',
    replace: "",
    breaks: ["VP-07"],
  },

  /* ---- ROUND FIVE: the delivered dose (owner finding 19) ------------- */
  {
    id: "AM-R20",
    why: "the FROM/TO form comes back to Setup, so the keeper is asked to restate a figure the record already holds — and gets it wrong, which is how he came to read \"on record: 8.8\" under a field he had just filled with 9.0",
    file: "app/src/components/Setup.jsx",
    find: '              <DeliveredDoseField standing={standingDose} onSave={onSetDeliveredDose} />',
    replace: '              <Field label="From (mL/day)"><input value={dcFrom} /></Field>\n              <Field label="To (mL/day)"><input value={dcTo} /></Field>',
    breaks: ["DD-01", "DD-02"],
  },
  {
    id: "AM-R21",
    why: "the Dosing tab records a dose itself instead of going through the shell's one path, so two surfaces can disagree about what the previous dose was",
    file: "app/src/components/DosingWizard.jsx",
    find: "                    <DeliveredDoseField standing={standingDose}",
    replace: "                    {recordDoseChange && null}\n                    <DeliveredDoseField standing={standingDose}",
    breaks: ["DD-03"],
  },
  {
    id: "AM-R22",
    why: "a second writer of a dose appears in the shell, which is how the standing-dose field and the dose-change form came to write two kinds of record that did not know about each other",
    file: "app/src/App.jsx",
    find: "  const addWaterChange = async ({ date, time, litres }) => {",
    replace: "  const alsoSetDose = async (ml) => recordDoseChange(store, { fromMlPerDay: 0, toMlPerDay: ml, date: todayStr(), time: \"09:00\" });\n  const addWaterChange = async ({ date, time, litres }) => {",
    breaks: ["DD-04"],
  },
  {
    id: "AM-R23",
    why: "a dosing screen asks for the previous figure again",
    file: "app/src/components/DeliveredDose.jsx",
    find: "      await onSave({ toMlPerDay: to, date, time, origin: originOf(suggested, to) });",
    replace: "      await onSave({ fromMlPerDay: standing, toMlPerDay: to, date, time, origin: originOf(suggested, to) });",
    breaks: ["DD-05"],
  },
  {
    id: "AM-R24",
    why: "every save through a recommendation is recorded as taken-as-offered, so a keeper who changed the figure is told he accepted it",
    file: "app/src/present/dose-origin.js",
    find: "  return same ? DOSE_ORIGIN.RECOMMENDATION : DOSE_ORIGIN.RECOMMENDATION_ADJUSTED;",
    replace: "  return DOSE_ORIGIN.RECOMMENDATION;",
    breaks: ["DD-06"],
  },
  {
    id: "AM-R25",
    why: "the offered figure is compared exactly rather than at the precision it is shown in, so a keeper who accepted 9.00 as offered is told he adjusted it",
    file: "app/src/present/dose-origin.js",
    find: '  const same = fmtQty(suggested, "mlPerDay") === fmtQty(saved, "mlPerDay");',
    replace: "  const same = suggested === saved;",
    breaks: ["DD-07"],
  },
  {
    id: "AM-R26",
    why: "the dose history is re-sorted by date, so two changes made on one day keep storage order and the older sits at the top of a list headed newest first (finding 19)",
    file: "app/src/App.jsx",
    find: "  const doseChangesNewestFirst = useMemo(() => [...doseChanges].reverse(), [doseChanges]);",
    replace: "  const doseChangesNewestFirst = useMemo(() => [...doseChanges].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)), [doseChanges]);",
    breaks: ["DD-08"],
  },
  {
    id: "AM-R27",
    why: "the first dose is stamped from the clock while every change after it is stamped from the form, putting two precisions on one timeline — so a standing dose carrying seconds sorts after a change made a minute later and the history reads backwards",
    file: "app/src/App.jsx",
    find: "        await recordDoseState(store, { doseMlPerDay: toMlPerDay, date, atTime: time });",
    replace: "        await recordDoseState(store, { doseMlPerDay: toMlPerDay });",
    breaks: ["DD-09"],
  },
  {
    id: "AM-R28",
    why: "the screen stops saying a dose change cannot be edited, so the keeper has no way to know that correcting one means deleting it",
    file: "app/src/components/Setup.jsx",
    find: '                {t("dose.history.noEdit")}',
    replace: '                {t("dose.history.head")}',
    breaks: ["DD-10"],
  },
  {
    id: "AM-R29",
    why: "\"the app\" returns to the delivered-dose wording — the fifth surface it has appeared on, and the register forbids any observer",
    file: "app/src/strings.js",
    find: '  "dose.delivered.field": "mL per day",',
    replace: '  "dose.delivered.field": "mL per day — the app records the change",',
    breaks: ["DD-11"],
  },
  {
    id: "AM-R30",
    why: "where the figure came from is handed to the engine, so which button the keeper pressed becomes an input to his chemistry",
    file: "app/src/store/ledger.js",
    find: "        from: e.detail.fromMlPerDay,\n        to: e.detail.toMlPerDay,",
    replace: "        from: e.detail.fromMlPerDay,\n        to: e.detail.toMlPerDay,\n        origin: e.detail.origin,",
    breaks: ["DD-12"],
  },

];
