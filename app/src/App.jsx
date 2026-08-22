import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dashboard, ParamHistoryModal } from './components/Dashboard.jsx'
import { DoseChangePopup, findingHidden, findingKey, findingSignature } from './components/DoseExpectation.jsx'
import { DosingWizard } from './components/DosingWizard.jsx'
import { TabErrorBoundary } from './components/ErrorBoundary.jsx'
import { IcpPanel } from './components/IcpPanel.jsx'
import { LogResultPopup, Toast } from './components/ReadingConfirmation.jsx'
import { Setup } from './components/Setup.jsx'
import { TaskDonePopup } from './components/TaskCompletion.jsx'
import { Tasks } from './components/Tasks.jsx'
import { TestLab, AllGraphsModal } from './components/AllParametersSheet.jsx'
import { AlertTriangle, Beaker, FlaskConical, LayoutDashboard, ListChecks, Settings2, Waves, X } from './icons.jsx'
import { NAV } from './lib/constants.js'
import { todayStr, fmtShort } from './lib/dates.js'
import { onStorageError, onToast, notify } from './lib/storage.js'
import {
  chartEventsFrom, latestByParamFrom, paramDefsFrom, readingsFrom, rowsFor,
} from './lib/adapt.js'
import {
  correctReading, markInvalid,
  recordDoseChange, recordDoseState, recordIcpPanel, recordLightingChange, recordNote, recordOneOff,
  recordReading, recordWaterChange, markInvalid,
} from './lib/record.js'
import { createStore } from './store/index.js'
import { KIND } from './store/ledger.js'
import { autoCompletions, computeSchedule, makeTask, TASK_KIND } from './store/schedule.js'
import { runAssessment, nowAsOf } from './assess.js'
import { nowIso } from './store/time.js'
import { ENGINE_STATE, onEngineState, warmUp } from './engine/client.js'
import { cardContent, cardStatusLine } from './present/card-content.js'
import { selectCard, instructsDoseChange } from './present/cards.js'
import { positionTone } from './present/position.js'
import { sayVerb, sayAction, sayPosition } from './present/wording.js'
import { fmtAmount } from './lib/format.js'
import { t } from './strings.js'

/* The tab set is data in `lib/constants.js`, which imports nothing so it stays
   loadable by a test runner that is Node and nothing else. The glyph each tab
   is drawn with is bound here. */
const NAV_ICON = {
  dashboard: LayoutDashboard, flask: FlaskConical, beaker: Beaker,
  checks: ListChecks, settings: Settings2,
};

/* ---------------------------------- main app ---------------------------------- */

/* WHAT USED TO BE HERE.

   V1's `App.jsx` was 1,468 lines and the largest single thing in it was
   `deriveTankState` — "everything the app believes about the tank, computed
   once". It called `buildFindings`, `assessAlkalinity`, `assessCalcium`,
   `assessMagnesium`, `doseStatus`, `computeStability`, `buildOverview`,
   `buildBriefing`, `explainScore` and `proposeCorrection`, and handed the
   result down to every screen.

   Its instinct was right and V2 already holds it as canon: `MASTER RULE 1`,
   one owner for each inference. What V1 got wrong was WHERE that owner lived.
   Nine chemistry engines running inside a React component is nine owners of
   nine rules the canon owns, and `X-INV-004` and `DEC-003` forbid it.

   So the derivation is gone, all of it, and one call replaced it:

       runAssessment(store, nowAsOf())

   which loads the ledger and the configuration history through V2's store,
   hands the engine `(events, configurationHistory, asOf)`, stores the result
   with its version stamps, and returns what came back. The shell reads no
   field of it that it does not simply pass on.

   THE CLOCK. `INV-A2` puts the assessment instant in the application and makes
   it an explicit argument. `nowAsOf()` reads it, once, here. Nothing below
   this line invents one. */

/* Whatever came out of storage, as a list of usable records. Kept from V1
   because the reasoning still applies to a restored file: "a record the app
   cannot read is worse than no record, because it poisons everything derived
   from it." */
export function toRecords(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const r of value) {
    if (r && typeof r === "object" && !Array.isArray(r)) out.push(r);
  }
  return out;
}

/* The three summary boxes on Dosing, worded from the engine's own answer.
   Alkalinity's comes from the result; calcium's and magnesium's do not exist,
   and the box says so rather than showing a figure nothing produced. */
function doseSummaries(engineResult, paramDefs, assessmentState) {
  const out = {};
  for (const def of paramDefs) {
    if (def.key !== "ALK" && def.key !== "CA" && def.key !== "MG") continue;
    if (!def.assessed) { out[def.key] = null; continue; }
    if (!engineResult) {
      /* Alkalinity, with no answer yet. The box says which of the reasons it
         is rather than reading as "there is no engine for this", which is the
         true statement about calcium and a false one about this. */
      out[def.key] = {
        tone: "#5F7575",
        headline: cardStatusLine(null, { assessed: true, assessmentState }),
        sub: "",
        value: null,
      };
      continue;
    }
    const card = selectCard(engineResult);
    const dose = engineResult.doseRecommendation || {};
    const rec = dose.recommendedDoseMlPerDay ?? dose.recommendedDose;
    const cur = dose.currentDoseMlPerDay ?? dose.currentDose;
    out[def.key] = {
      tone: positionTone(engineResult.position),
      /* "Does this instruct a change?" has one owner, in `present/cards.js`,
         because two screens ask it. Its note says why: a recommended dose is
         PRESENT on results that recommend nothing at all, so reading its
         presence as a command turned a hold into "up 0.0 mL/day from 12.0". */
      headline: typeof rec === "number" && typeof cur === "number" && instructsDoseChange(engineResult)
        ? `${fmtAmount(cur)} → ${fmtAmount(rec)}`
        : sayVerb(card, dose.action),
      sub: sayPosition(engineResult.position),
      value: typeof engineResult.latestValidValueDkh === "number" ? engineResult.latestValidValueDkh : null,
    };
  }
  return out;
}

export function ReefConsoleInner() {
  const storeRef = useRef(null);
  if (!storeRef.current) storeRef.current = createStore();
  const store = storeRef.current;

  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [modalParam, setModalParam] = useState(null);
  const [allGraphs, setAllGraphs] = useState(false);
  /* Which half of the Test tab is showing: the parameter checklist or the ICP
     panels. Named `testTab` rather than `testMode`, because "test mode" means
     something else entirely in this app — the assessment instant set by hand
     (`app/src/store/mode.js`) — and two things with one name is how a search
     for one of them finds the other. */
  const [testTab, setTestTab] = useState("tests");

  /* ---- what is on this device ---------------------------------------- */
  const [projection, setProjection] = useState([]);
  const [config, setConfig] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [hiddenNotices, setHiddenNotices] = useState({});

  /* ---- what the engine said ------------------------------------------- */
  const [assessment, setAssessment] = useState(null);
  const [engineState, setEngineState] = useState(null);

  /* ---- the moments ----------------------------------------------------- */
  const [logResult, setLogResult] = useState(null);
  const [doseResult, setDoseResult] = useState(null);
  const [taskResult, setTaskResult] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [storageMsg, setStorageMsg] = useState(null);
  const [remWindow, setRemWindow] = useState(14);

  useEffect(() => {
    onToast((m) => setToastMsg(m));
    onStorageError((m) => setStorageMsg(m));
    return onEngineState((s) => setEngineState(s));
  }, []);

  /* Reload everything this device holds. Called after every write, so no
     screen ever renders from a copy of the record that the record has since
     moved past. */
  const reload = useCallback(async () => {
    const [proj, cfg, ts, cs, hidden] = await Promise.all([
      store.ledger.projection(),
      store.config.current(),
      store.tasks.tasks(),
      store.tasks.completions(),
      store.kvGet("hidden-notices"),
    ]);
    setProjection(proj);
    setConfig(cfg);
    setTasks(ts);
    setCompletions(cs);
    setHiddenNotices(hidden || {});
  }, [store]);

  /* Ask the engine. Every write that could change the answer calls this, and
     nothing else calls the engine at all. */
  const assess = useCallback(async () => {
    try {
      const r = await runAssessment(store, nowAsOf());
      setAssessment(r);
    } catch (e) {
      setAssessment({ state: "ENGINE_FAILED", engineResult: null, error: e && e.message });
    }
  }, [store]);

  useEffect(() => {
    (async () => {
      await reload();
      setLoaded(true);
      /* Starting the runtime is a 12 MB decompress. Nothing else needs it, so
         it is started when the app is idle rather than blocking first paint:
         logging a reading, browsing history and completing a task all work
         before the engine has finished booting. */
      warmUp();
      assess();
    })();
  }, [reload, assess]);

  /* ---- the record, in the shape the ported screens read ---------------- */
  const paramDefs = useMemo(() => paramDefsFrom(config), [config]);
  const readings = useMemo(() => readingsFrom(projection), [projection]);
  const latestByParam = useMemo(() => latestByParamFrom(readings, paramDefs), [readings, paramDefs]);
  const chartEvents = useMemo(() => chartEventsFrom(projection), [projection]);

  const waterChanges = useMemo(() => projection
    .filter((r) => r.event.kind === KIND.WATER_CHANGE && r.state !== "SUPERSEDED" && r.state !== "INVALID")
    .map((r) => ({ id: r.event.eventId, date: r.event.time.localDate, litres: r.event.detail.litres })), [projection]);

  /* Dose CHANGES and the dose STATE the record starts from.

     The import writes the first dose row of each parameter as a `DOSE_STATE` —
     what was running when the record begins — and every later one as a
     `DOSE_CHANGE`. Listing only the changes made a freshly imported history
     read as "no dose changes recorded" while the app was assessing against a
     dose it had. A starting point has no delta and is shown as what it is. */
  const doseChanges = useMemo(() => projection
    .filter((r) => (r.event.kind === KIND.DOSE_CHANGE || r.event.kind === KIND.DOSE_STATE)
      && r.state !== "SUPERSEDED" && r.state !== "INVALID")
    .map((r) => ({
      id: r.event.eventId,
      date: r.event.time.localDate,
      time: r.event.time.localTime || null,
      from: r.event.kind === KIND.DOSE_CHANGE ? r.event.detail.fromMlPerDay : null,
      to: r.event.kind === KIND.DOSE_CHANGE ? r.event.detail.toMlPerDay : r.event.detail.doseMlPerDay,
      /* `fromMlPerDay` on an imported change is this app reading the previous
         recorded row, not something the keeper wrote down. The import marks it,
         and the list says so rather than presenting it as his figure. */
      fromDerived: !!r.event.detail.fromMlPerDayDerived,
      isStart: r.event.kind === KIND.DOSE_STATE,
      parameter: r.event.parameter || "ALK",
    })), [projection]);

  const lightingChanges = useMemo(() => projection
    .filter((r) => r.event.kind === KIND.HUSBANDRY && r.event.detail
      && r.event.detail.husbandryKind === "LIGHTING"
      && r.state !== "SUPERSEDED" && r.state !== "INVALID")
    .map((r) => ({ id: r.event.eventId, date: r.event.time.localDate, note: r.event.detail.note })), [projection]);

  const icps = useMemo(() => projection
    .filter((r) => r.event.kind === KIND.ICP_PANEL && r.state !== "SUPERSEDED" && r.state !== "INVALID")
    .map((r) => ({
      id: r.event.eventId,
      date: r.event.time.localDate,
      note: r.event.detail.note,
      elements: r.event.detail.elements || {},
    })), [projection]);

  const scheduleView = useMemo(
    () => computeSchedule(tasks, completions, todayStr(), remWindow),
    [tasks, completions, remWindow]);

  const engineResult = assessment && assessment.engineResult ? assessment.engineResult : null;
  /* Why there is no engine result, when there is none. The states are
     `assess.js`'s own — `NO_CONFIGURATION`, `STORAGE_UNAVAILABLE` — plus the
     one this shell adds when the call itself threw. Null while the first
     assessment is still running, which the screens render as "working it
     out". */
  /* `assess.js` now returns `ENGINE_UNAVAILABLE` as its own state, so the
     screens get the right label without this having to correct one.

     The client's own state still wins where it says the engine failed, because
     it knows before the first assessment is even attempted — that is what
     turns a blank card into "the engine could not start" during boot rather
     than after it. */
  const engineDown = engineState && engineState.state === ENGINE_STATE.FAILED;
  const assessmentState = engineDown ? "ENGINE_UNAVAILABLE" : assessment ? assessment.state : null;

  /* One notice per parameter, from the engine, already worded — and filtered
     by what the keeper has put away. The identity and the signature are V1's
     mechanism over V2's reason codes: put one away and it comes back the
     moment the engine raises it with different numbers. */
  const noticeFor = useCallback((def) => {
    const c = cardContent(def, engineResult, assessmentState);
    if (!c.notice) return null;
    return findingHidden(c.notice, hiddenNotices) ? null : c.notice;
  }, [engineResult, assessmentState, hiddenNotices]);

  const dismissNotice = async (f) => {
    const next = { ...hiddenNotices, [findingKey(f)]: { sig: findingSignature(f), at: new Date().toISOString(), title: f.title, id: f.id } };
    await store.kvSet("hidden-notices", next);
    setHiddenNotices(next);
    notify("Notice hidden");
  };
  const restoreNotice = async (n) => {
    const next = { ...hiddenNotices };
    delete next[findingKey(n)];
    await store.kvSet("hidden-notices", next);
    setHiddenNotices(next);
    notify("Notice shown again");
  };
  const restoreAllNotices = async () => {
    await store.kvSet("hidden-notices", {});
    setHiddenNotices({});
    notify("All notices shown again");
  };

  const hiddenList = useMemo(
    () => Object.entries(hiddenNotices).map(([k, v]) => ({ key: k, id: v.id, title: v.title })),
    [hiddenNotices]);

  /* ---- writing ---------------------------------------------------------- */

  /* A reading. Four elements went in, and the three things that follow are the
     three the brief asks for: it saves, it completes its test task, and the
     moment appears. */
  const addReading = async ({ param, value, date, time }) => {
    const def = paramDefs.find((d) => d.key === param);
    const prior = rowsFor(readings, param);
    const prev = prior.length ? prior[prior.length - 1].value : null;
    try {
      await recordReading(store, { param, value, date, time });
      /* Logging the reading IS the completion. There is no separate tick. */
      const auto = autoCompletions(tasks, completions, param, date);
      if (auto.length) await store.tasks.writeCompletions(auto);
    } catch (e) {
      setStorageMsg(e && e.message);
      return;
    }
    await reload();
    notify("Reading saved");
    setLogResult({
      at: Date.now(), def, value, prev, date, time,
      position: null,
    });
    assess();
  };

  const addDoseChange = async ({ fromMlPerDay, toMlPerDay, date, time }) => {
    try {
      await recordDoseChange(store, { fromMlPerDay, toMlPerDay, date, time });
    } catch (e) { setStorageMsg(e && e.message); return; }
    await reload();
    notify("Dose change recorded");
    const def = paramDefs.find((d) => d.key === "ALK");
    setDoseResult({ at: Date.now(), def, from: fromMlPerDay, to: toMlPerDay, date, time });
    assess();
  };

  /* FIXING A READING THAT WAS TYPED WRONG.

     `PORT-OMISSIONS.md`'s most serious loss in the port. Both of these append
     — neither edits and neither deletes — and the sheet says so before either
     runs. */
  const fixReading = async (args) => {
    try { await correctReading(store, args); }
    catch (e) { setStorageMsg(e && e.message); return; }
    await reload();
    notify(t("correct.saved"));
    assess();
  };

  const dropReading = async (eventId) => {
    try { await markInvalid(store, eventId); }
    catch (e) { setStorageMsg(e && e.message); return; }
    await reload();
    notify(t("correct.deleted"));
    assess();
  };

  /* The dose the keeper says his pump is running now. Stage 1 established, by
     measurement, that the engine had no readable record of this at all on a
     V1-imported history — and without it `consumption` is `NOT_RUN` and every
     figure that depends on it is withheld. */
  const setStandingDose = async (doseMlPerDay) => {
    try { await recordDoseState(store, { doseMlPerDay }); }
    catch (e) { setStorageMsg(e && e.message); return; }
    await reload();
    notify("Current dose recorded");
    assess();
  };

  const addWaterChange = async ({ date, time, litres }) => {
    try {
      await recordWaterChange(store, { date, time, litres, netVolumeL: config && config.netVolumeL });
    } catch (e) { setStorageMsg(e && e.message); return; }
    await reload();
    notify("Water change recorded");
    assess();
  };

  const addOneOff = async ({ amountMl, date, time }) => {
    try { await recordOneOff(store, { amountMl, date, time }); }
    catch (e) { setStorageMsg(e && e.message); return; }
    await reload();
    notify("Addition recorded");
    assess();
  };

  const addLightingChange = async ({ date, note }) => {
    try { await recordLightingChange(store, { date, note }); }
    catch (e) { setStorageMsg(e && e.message); return; }
    await reload();
    notify("Lighting change recorded");
  };

  const addNote = async ({ date, note }) => {
    try { await recordNote(store, { date, note }); }
    catch (e) { setStorageMsg(e && e.message); return; }
    await reload();
    notify("Note recorded");
  };

  const addIcp = async ({ date, note, elements }) => {
    try { await recordIcpPanel(store, { date, note, elements }); }
    catch (e) { setStorageMsg(e && e.message); return false; }
    await reload();
    notify("ICP panel saved");
    return true;
  };

  const deleteEvent = async (eventId) => {
    await markInvalid(store, eventId);
    await reload();
    assess();
  };

  /* ---- the schedule ----------------------------------------------------- */
  const markDone = async (taskId, date = todayStr(), detail = null) => {
    const task = tasks.find((t) => t.id === taskId);
    await store.tasks.complete({ taskId, date, detail });
    if (task && task.oneOff) await store.tasks.saveTask({ ...task, enabled: false });
    await reload();
    notify("Task completed");
    setTaskResult({
      at: Date.now(),
      label: task ? task.label : "Task",
      date,
      intervalDays: task ? task.intervalDays : null,
      nextDue: null,
    });
  };

  const addTask = async (spec) => {
    const task = { ...makeTask(spec), oneOff: !!spec.oneOff };
    await store.tasks.saveTask(task);
    await reload();
    notify("Task added");
  };

  const updateTask = async (id, patch) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await store.tasks.saveTask({ ...task, ...patch });
    await reload();
  };

  const deleteTask = async (id) => {
    await store.tasks.removeTask(id);
    await reload();
    notify("Task deleted");
  };

  /* A nudge moves ONLY the next occurrence, anchored to the completion it was
     made against. `schedule.js` owns that rule; this passes the anchor. */
  const nudgeTask = async (id, days) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const st = scheduleView.states.find((s) => s.task.id === id);
    await store.tasks.saveTask({ ...task, adjustDays: (task.adjustDays || 0) + days, adjustAnchor: st ? st.lastDone ?? null : null });
    await reload();
    notify("Moved to tomorrow");
  };

  const setTaskDue = async (id, date) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const st = scheduleView.states.find((s) => s.task.id === id);
    const base = st ? st.due : task.startDate;
    const shift = Math.round((new Date(date) - new Date(base)) / 86400000);
    await store.tasks.saveTask({ ...task, adjustDays: (task.adjustDays || 0) + shift, adjustAnchor: st ? st.lastDone ?? null : null });
    await reload();
    notify(`Moved to ${fmtShort(date)}`);
  };

  const setTaskInterval = async (id, n) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await store.tasks.saveTask({ ...task, intervalDays: n, adjustDays: 0, adjustAnchor: null });
    await reload();
    notify("Schedule changed");
  };

  const skipTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await store.tasks.saveTask({ ...task, adjustDays: (task.adjustDays || 0) + task.intervalDays, adjustAnchor: null });
    await reload();
    notify("Skipped once");
  };

  /* ---- configuration ---------------------------------------------------- */
  const saveConfig = async (values) => {
    /* `effectiveFrom` is stamped from the APPLICATION's clock, not the wall
       clock. Canon §518 resolves the configuration version effective at the
       assessment instant and the engine refuses outright when none is; a
       version stamped from the wall clock inside test mode is effective at the
       real instant it was typed, so every backdated assessment finds no
       configuration and refuses. `TM-25` is the test that caught exactly this
       during the port. */
    await store.config.append({ ...(config || {}), ...values }, nowIso());
    await reload();
    notify("Saved");
    assess();
  };

  const saveRange = async (key, min, max) => {
    const def = paramDefs.find((d) => d.key === key);
    if (!config && !def) return;
    const base = config || {};
    const values = def && def.assessed
      ? { ...base, targetRangeMinDkh: min, targetRangeMaxDkh: max }
      : { ...base, parameterRanges: { ...(base.parameterRanges || {}), [key]: { min, max } } };
    await store.config.append(values, nowIso());
    await reload();
    notify("Target range changed");
    if (def && def.assessed) assess();
  };

  const resetRange = async (key) => {
    const def = paramDefs.find((d) => d.key === key);
    const base = config || {};
    if (def && def.assessed) return;   /* alkalinity's range is a required fact */
    const ranges = { ...(base.parameterRanges || {}) };
    delete ranges[key];
    await store.config.append({ ...base, parameterRanges: ranges }, nowIso());
    await reload();
    notify("Range cleared");
  };

  const exportEverything = async () => {
    const [events, annotations, all, cfgs, ts, cs] = await Promise.all([
      store.ledger.allEvents(), store.ledger.allAnnotations(),
      store.assessments.all(), store.config.history(),
      store.tasks.tasks(), store.tasks.completions(),
    ]);
    const doc = {
      format: "dosing-wizard-v2-export", version: 1,
      exportedAt: new Date().toISOString(),
      events, annotations, assessments: all, configurations: cfgs, tasks: ts, completions: cs,
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dosing-wizard-v2-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify("Export saved");
  };

  const openTestFor = (key) => { setTab("log"); setModalParam(null); };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center font-body">
        <div className="flex items-center gap-3 text-teal-brand font-bold text-sm">
          <Waves className="animate-pulse" size={20} /> loading…
        </div>
      </div>
    );
  }

  const modalDef = modalParam ? paramDefs.find((d) => d.key === modalParam) : null;

  return (
    <div className="min-h-screen bg-app text-ink font-body">
      <style>{`
        .font-display { font-family: 'Avenir Next', 'Avenir', 'Futura', 'Trebuchet MS', -apple-system, 'Segoe UI', Roboto, sans-serif; letter-spacing: -0.02em; font-weight: 800; }
        .font-body { font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .bg-app { background-color: #F3F7F6; }
        .border-app { border-color: #E3ECEA; }
        .text-ink { color: #08191D; }
        .text-ink2 { color: #45605F; }
        .text-teal-brand { color: #0B7C86; }
        .bg-teal-brand { background-color: #0B7C86; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #C7D6D3; border-radius: 4px; }
        /* iOS gives date/time inputs a large intrinsic width that ignores the
           grid column, which pushed neighbouring fields past the card edge.
           Force them to size from their container instead. */
        input[type="date"] {
          -webkit-appearance: none;
          appearance: none;
          min-width: 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          text-align: left;
        }
        input, select, textarea { min-width: 0; max-width: 100%; box-sizing: border-box; }
        select { -webkit-appearance: none; appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2024%2024'%20fill%3D'none'%20stroke%3D'%2345605F'%20stroke-width%3D'3'%3E%3Cpath%20d%3D'M6%209l6%206%206-6'%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat; background-position: right 10px center; background-size: 14px;
          padding-right: 32px;
        }
      `}</style>

      <div className="flex">
        {/* Sidebar - desktop */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r border-app px-4 py-6 bg-white">
          <div className="flex items-center gap-2 px-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-teal-brand flex items-center justify-center shadow-sm">
              <Waves size={17} className="text-white" />
            </div>
            <div>
              <div className="font-display text-sm text-ink leading-tight">Dosing Wizard</div>
              <div className="text-[10px] text-ink2 font-bold">
                {config && config.netVolumeL ? `${config.netVolumeL}L` : "volume not set"}
              </div>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => {
              const Icon = NAV_ICON[n.icon];
              const active = tab === n.id;
              return (
                <button key={n.id} onClick={() => setTab(n.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors ${active ? "bg-teal-50 text-teal-brand" : "text-ink2 hover:text-ink hover:bg-app"}`}>
                  <Icon size={16} /> {n.label}
                </button>
              );
            })}
          </nav>
          {/* V1 printed its own target ranges here as a fixed block of text.
              They were band edges written into the sidebar, and they did not
              come across. What is here instead is the keeper's own alkalinity
              range, read back from his configuration. */}
          <div className="mt-auto px-3 py-3 rounded-lg bg-app border border-app">
            <div className="text-[10px] text-teal-brand uppercase tracking-wide font-extrabold mb-1">Your range</div>
            <div className="text-xs text-ink font-bold leading-relaxed">
              {config && config.targetRangeMinDkh != null
                ? `${config.targetRangeMinDkh}–${config.targetRangeMaxDkh} dKH`
                : "not set yet"}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 px-4 md:px-8 max-w-6xl"
          style={{
            paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
            paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))",
          }}>

          {storageMsg && (
            <div className="mb-4 rounded-xl p-3 border-2" style={{ background: "#C4285B12", borderColor: "#C4285B55" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" color="#C4285B" />
                  <p className="text-[13px] font-bold text-ink leading-relaxed">{storageMsg}</p>
                </div>
                <button aria-label="Dismiss" onClick={() => setStorageMsg(null)} className="text-ink2 shrink-0 p-2 -m-2 rounded-lg active:bg-app"><X size={16} /></button>
              </div>
            </div>
          )}

          <header className="md:hidden flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-teal-brand flex items-center justify-center">
              <Waves size={16} className="text-white" />
            </div>
            <div className="font-display text-ink">Dosing Wizard</div>
          </header>

          <TabErrorBoundary tabKey={tab}>
          {tab === "dashboard" && (
            <Dashboard
              latestByParam={latestByParam} readings={readings} paramDefs={paramDefs}
              saveRange={saveRange} resetRange={resetRange} customRanges={{}}
              chartEvents={chartEvents} config={config}
              engineResult={engineResult} assessmentState={assessmentState} scheduleView={scheduleView}
              tasks={tasks} completions={completions} waterChanges={waterChanges}
              onOpenParam={setModalParam} onOpenTest={openTestFor}
              onCompleteTask={markDone} onNudgeTask={nudgeTask}
              remWindow={remWindow} setRemWindow={setRemWindow}
              onSetTaskDue={setTaskDue} onSetTaskInterval={setTaskInterval}
              onSkipTask={skipTask} onUpdateTask={updateTask}
              onAddReading={addReading}
              onCorrectReading={fixReading} onDeleteReading={dropReading} />
          )}

          {tab === "log" && (
            <div>
              {/* `My tests` / `ICP panels`, with counts, and All graphs top right. */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex gap-1.5">
                  {[["tests", "My tests", readings.length], ["icp", "ICP panels", icps.length]].map(([k, label, n]) => (
                    <button key={k} onClick={() => setTestTab(k)}
                      className="rounded-lg px-3 py-1.5 text-[12px] font-extrabold border-2"
                      style={{ borderColor: testTab === k ? "#0B7C86" : "#E3ECEA",
                               color: testTab === k ? "#0B7C86" : "#45605F",
                               background: testTab === k ? "#0B7C8610" : "#fff" }}>
                      {label} <span className="opacity-70">{n}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setAllGraphs(true)}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-extrabold border-2"
                  style={{ borderColor: "#E3ECEA", color: "#45605F" }}>
                  All graphs
                </button>
              </div>

              {testTab === "tests" ? (
                <TestLab paramDefs={paramDefs} readings={readings} onAdd={addReading}
                  onOpenParam={setModalParam} scheduleView={scheduleView} />
              ) : (
                <IcpPanel icps={icps} onAdd={addIcp} />
              )}
            </div>
          )}

          {tab === "dosing" && (
            <DosingWizard paramDefs={paramDefs} engineResult={engineResult}
              summaries={doseSummaries(engineResult, paramDefs, assessmentState)}
              latestByParam={latestByParam}
              notices={[noticeFor(paramDefs.find((d) => d.key === "ALK") || {})].filter(Boolean)}
              onDismissFinding={dismissNotice} />
          )}

          {tab === "tasks" && (
            <Tasks tasks={tasks} completions={completions} scheduleView={scheduleView}
              paramDefs={paramDefs}
              onMarkDone={markDone} onAddTask={addTask} onDeleteTask={deleteTask}
              onUpdateTask={updateTask}
              onSetTaskDue={setTaskDue} onSetTaskInterval={setTaskInterval} onSkipTask={skipTask}
              onAddWaterChange={addWaterChange} onAddOneOff={addOneOff}
              onAddLightingChange={addLightingChange} onAddNote={addNote}
              waterChanges={waterChanges} onOpenTest={openTestFor} />
          )}

          {tab === "setup" && (
            <Setup config={config} onSaveConfig={saveConfig} paramDefs={paramDefs}
              engineResult={engineResult}
              doseChanges={doseChanges} onAddDoseChange={addDoseChange} onDeleteEvent={deleteEvent}
              onSetStandingDose={setStandingDose}
              lightingChanges={lightingChanges}
              hiddenNotices={hiddenList} onRestoreNotice={restoreNotice}
              onRestoreAllNotices={restoreAllNotices}
              onExport={exportEverything}
              store={store}
              onImported={async () => { await reload(); assess(); notify("History imported"); }} />
          )}
          </TabErrorBoundary>

          <DoseChangePopup key={doseResult ? "dose" + doseResult.at : "dosenone"} result={doseResult}
            onClose={() => setDoseResult(null)} />
          <LogResultPopup key={logResult ? "log" + logResult.at : "lognone"} result={logResult}
            onClose={() => setLogResult(null)} readings={readings}
            verdict={logResult && engineResult && logResult.def && logResult.def.assessed
              ? {
                  tone: positionTone(engineResult.position),
                  headline: sayPosition(engineResult.position),
                  line: sayAction(engineResult.doseRecommendation && engineResult.doseRecommendation.action),
                  goto: instructsDoseChange(engineResult) ? "dosing" : null,
                }
              : null}
            onOpenDosing={() => setTab("dosing")} />
          <TaskDonePopup key={taskResult ? "task" + taskResult.at : "tasknone"} result={taskResult}
            onClose={() => setTaskResult(null)} />
          <Toast message={toastMsg} onDone={() => setToastMsg(null)} />

          {allGraphs && (
            <AllGraphsModal paramDefs={paramDefs} readings={readings} chartEvents={chartEvents}
              onClose={() => setAllGraphs(false)} onOpenParam={setModalParam} />
          )}

          {modalDef && (
            <ParamHistoryModal def={modalDef} readings={readings}
              onClose={() => setModalParam(null)} onSaveRange={saveRange} onResetRange={resetRange}
              isCustom={!modalDef.assessed && modalDef.hasRange}
              chartEvents={chartEvents}
              onAddReading={addReading}
              notice={noticeFor(modalDef)}
              onGoDosing={() => { setModalParam(null); setTab("dosing"); }} />
          )}
        </main>
      </div>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-app flex justify-around py-2 z-20 shadow-[0_-1px_6px_rgba(15,40,45,0.06)]"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}>
        {NAV.map((n) => {
          const Icon = NAV_ICON[n.icon];
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[56px] rounded-lg active:bg-app">
              <Icon size={18} className={active ? "text-teal-brand" : "text-ink2"} />
              <span className={`text-[9px] font-bold ${active ? "text-teal-brand" : "text-ink2"}`}>{n.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* The last line before a blank screen.
 *
 * `TabErrorBoundary` covers the tab contents, but everything above it — every
 * storage load, every hook — runs outside it, and a failure in any of that
 * renders nothing at all: no tabs, no menu, and no way to reach the export
 * button.
 *
 * That matters more than it sounds. A display bug is an annoyance if you can
 * still get your data out and a disaster if you cannot.
 */
export class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, saving: false, saved: false };
  }
  static getDerivedStateFromError(error) { return { error }; }

  /* V1 called `buildBackup()`, which read its own `localStorage` keys directly
     and therefore still worked when everything above it had failed. V2's
     record is in IndexedDB, so the rescue opens its own store rather than
     reaching for component state that is not there. */
  async rescue() {
    this.setState({ saving: true });
    try {
      const store = createStore();
      const [events, annotations, assessments, configurations, tasks, completions] = await Promise.all([
        store.ledger.allEvents(), store.ledger.allAnnotations(),
        store.assessments.all(), store.config.history(),
        store.tasks.tasks(), store.tasks.completions(),
      ]);
      const doc = { format: "dosing-wizard-v2-export", version: 1,
        exportedAt: new Date().toISOString(),
        events, annotations, assessments, configurations, tasks, completions };
      const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dosing-wizard-v2-rescue-${todayStr()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.setState({ saving: false, saved: true });
    } catch (e) {
      this.setState({ saving: false, saved: false, rescueFailed: String(e && e.message) });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    const { saving, saved, rescueFailed } = this.state;
    return (
      <div style={{ minHeight: "100vh", background: "#F3F7F6", padding: "24px 18px" }}>
        <div style={{ maxWidth: 460, margin: "0 auto" }}>
          <h1 style={{ fontSize: 19, fontWeight: 900, color: "#08191D", margin: "0 0 10px" }}>
            The app could not start
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "#45605F", margin: "0 0 8px" }}>
            Something failed before any screen could be drawn. <strong>Your data has not been
            touched</strong> — it is still in storage exactly as you left it.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: "#45605F", margin: "0 0 18px" }}>
            Save a copy now, before doing anything else.
          </p>
          <button onClick={() => this.rescue()} disabled={saving}
            style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "none",
                     background: saved ? "#0B7C86" : "#08191D", color: "#fff",
                     fontSize: 15, fontWeight: 800, cursor: saving ? "default" : "pointer" }}>
            {saving ? "Saving…" : saved ? "Saved — check your downloads" : "Save my data"}
          </button>
          {rescueFailed && (
            <p style={{ fontSize: 13, color: "#C4285B", marginTop: 12, fontWeight: 700 }}>
              The rescue export also failed. {rescueFailed} Do not clear the app's storage —
              the data is still there and can be recovered another way.
            </p>
          )}
          <p style={{ fontSize: 12, color: "#5F7575", marginTop: 22, lineHeight: 1.5 }}>
            Reloading is safe and may clear a one-off failure. If it does not, the message
            below is what went wrong.
          </p>
          <pre style={{ fontSize: 11, color: "#5F7575", background: "#E3ECEA",
                        padding: 10, borderRadius: 8, overflowX: "auto", marginTop: 8 }}>
            {String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)}
          </pre>
        </div>
      </div>
    );
  }
}

/* Exported wrapped, so nothing can render the app without its last line of
   defence in place. */
export function ReefConsole() {
  return (
    <RootErrorBoundary>
      <ReefConsoleInner />
    </RootErrorBoundary>
  );
}
