/* ============================================================================
   THE APPLICATION SHELL
   ----------------------------------------------------------------------------
   Five tabs — Today, Test Lab, Tasks, History, Tools — with Tools present and
   disabled, and Settings behind a gear.

   The shell holds the store, the current screen and the last assessment. It
   holds no chemistry: every number that reaches a screen came out of the
   engine, and the shell's only job with a result is to keep hold of it.

   ORDER OF STARTUP, AND WHY
   -------------------------

   1. The store opens and the shell paints. Logging a reading, completing a
      task and reading history all work from this moment.
   2. The service worker registers, so the next open is offline.
   3. The engine starts in the background. It is a 12 MB Python runtime and
      takes a few seconds; nothing waits for it, and the assessment card says
      "working it out" until it answers rather than showing an empty box.
   4. An assessment runs and is stored.

   A screen that blocked on step 3 would be a screen that fails to open in a
   fishroom with no signal, on a phone that has just been updated.
   ========================================================================= */

import { h, mount } from "./ui/dom.js";
import { runAssessment, nowAsOf } from "./assess.js";
import { onEngineState, warmUp, ENGINE_STATE } from "./engine/client.js";
import { todayLocal } from "./store/time.js";
import { keeperRange } from "./store/config.js";
import { fmtDayName } from "./ui/format.js";
import {
  currentMode,
  enterTestMode,
  isTestMode,
  leaveTestMode,
  resetTestData,
  setTestInstant,
  stepTestDays,
  storeForMode,
  testInstant,
  useSlots,
} from "./store/mode.js";
import { applySeries } from "./store/seed.js";
import { isPresent } from "./present/cards.js";
import { KIND } from "./store/ledger.js";
import { taskState } from "./store/schedule.js";
import {
  PREFERENCE,
  SUGGESTION_STATE,
  applyAddExtra,
  applyReplace,
  decline as declineSuggestion,
  readExtras,
  readApplied,
  readPreference,
  resolve as resolveSuggestion,
  suggestionFrom,
} from "./store/suggestion.js";
import { t } from "./strings.js";

import { renderToday } from "./screens/today.js";
import { renderTestLab } from "./screens/testlab.js";
import { renderTestMode } from "./screens/testmode.js";
import { renderImportV1 } from "./screens/importv1.js";
import { renderTasks, openSuggestionSheet } from "./screens/tasks.js";
import { renderHistory } from "./screens/history.js";
import { renderSettings, renderSetup, renderTools } from "./screens/settings.js";
import { renderLogEntry, renderIcpEntry } from "./screens/logentry.js";
import { openEntrySheet } from "./screens/entrydetail.js";
import { renderAssessmentDetail } from "./screens/detail.js";
import {
  momentDoseExpectation,
  momentIcpArrival,
  momentReadingArrival,
  momentTaskCompletion,
} from "./moments/present.js";

const TABS = [
  { id: "today", label: "tab.today" },
  { id: "testlab", label: "tab.testlab" },
  { id: "tasks", label: "tab.tasks" },
  { id: "history", label: "tab.history" },
  { id: "tools", label: "tab.tools", off: true },
];

/* The mode is read BEFORE anything else, because it decides what "today" is.
   `useSlots()` installs the clock, so every `todayLocal()` below — and every
   one in every screen — already answers with the keeper's chosen instant by
   the time the first line of state is built. */
useSlots();

const state = {
  screen: "today",
  stepperDay: todayLocal(),
  calendarMonth: todayLocal().slice(0, 7),
  historyParameter: null,
  historyWindow: 60,
  assessment: null,
  engine: { state: ENGINE_STATE.NOT_STARTED, error: null },
  declinedSuggestions: [],
  /* The engine's suggestion, already resolved against the keeper's own
     schedule and their stored preference. `null` until an assessment exists. */
  suggestion: null,
  suggestionPreference: PREFERENCE.ASK,
  extras: [],
};

/* THE STORE IS CHOSEN BY THE MODE, IN ONE PLACE.

   `storeForMode` is the only thing that decides which database the app is
   speaking to. Switching modes rebuilds it; it never copies anything from the
   one it is leaving, and there is no path in this file or any other that reads
   both at once. */
let store = storeForMode(currentMode());
const root = document.getElementById("app");
const tabbar = document.getElementById("tabbar");
const marker = document.getElementById("modemarker");

const ctx = {
  /* A getter, because the store is replaced when the mode changes and a screen
     that captured it at import time would keep writing to the store the keeper
     has just left. */
  get store() {
    return store;
  },
  state,

  mode: currentMode,
  testInstant,

  go(screen, opts = {}) {
    state.screen = screen;
    if (opts.parameter !== undefined) state.historyParameter = opts.parameter;
    if (screen === "today") state.stepperDay = todayLocal();
    render();
  },

  setDay(day) {
    state.stepperDay = day;
    render();
  },

  setMonth(month) {
    state.calendarMonth = month;
    render();
  },

  setHistoryWindow(days) {
    state.historyWindow = days;
    render();
  },

  setHistoryParameter(p) {
    state.historyParameter = p;
    render();
  },

  refresh() {
    reassess().then(render);
  },

  /* Recompute, THEN go. `refresh()` redraws whatever screen is showing, which
     is right for a reading logged inline and wrong after an action whose whole
     result is a new screen — the redraw arrives and wipes the outcome. */
  async reassessAndGo(screen) {
    await reassess();
    ctx.go(screen);
  },

  openEntry(eventId) {
    openEntrySheet(ctx, eventId);
  },

  /* Moment (a). The reading is already stored by the time this runs — the
     moment celebrates a fact, it does not create one. */
  async afterReading(res, def) {
    const projected = await store.ledger.projection();
    const series = projected
      .filter(
        (r) => r.state === "CURRENT" && r.event.kind === KIND.READING && r.event.parameter === def.key
      )
      .slice(-12)
      .map((r) => ({ date: r.event.time.localDate, value: r.event.normalizedValue }));

    const config = await store.config.current();
    const vals = series.map((s) => s.value);
    /* The axis pad wants a low and a high, and the band is drawn between them.
       This file used to pick the range itself, and only knew about alkalinity's
       — so a calcium reading arrived on a chart with no band while History drew
       one from the very same configuration. `keeperRange` is the one owner of
       that choice now. Where he has set no range the readings' own extremes are
       used and no band is drawn. */
    const range = keeperRange(def, config);
    const min = range ? range.min : Math.min(...vals);
    const max = range ? range.max : Math.max(...vals);

    momentReadingArrival({
      def: { ...def, min, max },
      series,
      onClose: () => ctx.refresh(),
    });
  },

  async afterDoseChange({ from, to }) {
    /* Reassess FIRST, so the moment renders the engine's own prediction
       snapshot rather than a guess made while waiting for it. */
    await reassess();
    const r = state.assessment?.engineResult;
    const iv = r && typeof r.activeIntervention === "object" ? r.activeIntervention : null;
    momentDoseExpectation({
      from,
      to,
      snapshot: iv ? iv.predictionSnapshot : null,
      retest: r ? r.retest : null,
      onClose: () => ctx.refresh(),
    });
  },

  async afterCompletion(task) {
    const completions = await store.tasks.completions();
    const history = completions.filter((c) => c.taskId === task.id).map((c) => c.date);
    const st = taskState(task, completions, todayLocal());
    momentTaskCompletion({ task, history, nextDue: st.due, onClose: () => ctx.refresh() });
  },

  async afterIcp({ count }) {
    momentIcpArrival({ count, onClose: () => ctx.go("testlab") });
  },

  async completeTask(task, time, volume, replacementAlkalinityDkh = null) {
    await store.tasks.complete({
      taskId: task.id,
      date: time.localDate,
      detail: volume ? { volume: Number(volume), unit: task.unit || "L" } : null,
    });
    /* A water-change task also writes the water change itself into the ledger,
       because the engine needs the event and the completion is only the app's
       record that a chore was done. Two records, because they are two facts. */
    if (task.needsVolume && volume) {
      const config = await store.config.current();
      const fraction = config?.netVolumeL ? Number(volume) / config.netVolumeL : null;
      if (fraction) {
        const detail = { changedFraction: fraction, volumeL: Number(volume) };
        if (replacementAlkalinityDkh != null) {
          /* Same fields and same confidence value as the manual water-change
             form. Recorded only when the keeper actually measured it — absent
             stays absent, and the engine takes its own unknown-replacement
             branch, which is the correct answer to "we do not know". */
          detail.replacementAlkalinityDkh = replacementAlkalinityDkh;
          detail.replacementAlkalinityConfidence = "MEASURED_SAME_BATCH";
        }
        await store.ledger.append({
          kind: KIND.WATER_CHANGE,
          time,
          recordedAt: new Date().toISOString(),
          detail,
        });
      }
    }
    await ctx.afterCompletion(task);
  },

  async confirmDose(detail, answer) {
    if (answer === "UNKNOWN") return;
    if (answer === "NOT_MADE") {
      /* Recorded against the ask that was asked, so the row goes away and
         stays away. This used to write `declinedDose`, which nothing read: the
         keeper answered "no" and was asked again on the next launch. */
      await rememberDoseAsk(detail.recommendedDoseMlPerDay, { declined: true });
      state.doseAsks = await store.kvGet("doseAsks");
      ctx.refresh();
      return;
    }
    /* "Yes" routes to the dose-change form rather than writing a record here,
       because a dose change needs its own time and its own provenance and this
       row cannot ask for them properly. */
    state.pendingDose = detail;
    ctx.go("log-entry");
  },

  async acceptSuggestion(resolved) {
    openSuggestionSheet(ctx, resolved);
  },

  async declineSuggestion(suggestion) {
    await declineSuggestion(store, suggestion);
    ctx.refresh();
  },

  /* The setting: "Ask me each time". Clearing a preference is a keeper action
     like setting one, and it never happens on its own. */
  async setSuggestionPreference(how) {
    await store.kvSet("suggestedTestPreference", how);
    ctx.refresh();
  },

  /* --- test mode --------------------------------------------------------
     Four verbs, and between them they change exactly two things: what the
     clock says and which store `storeForMode` hands back. Nothing here calls
     the engine differently, and nothing here moves a record between the two
     stores in either direction. */

  async enterTest(at) {
    enterTestMode(at);
    await switchedMode();
  },

  async leaveTest() {
    leaveTestMode();
    await switchedMode();
  },

  async setTestInstant(at) {
    setTestInstant(at);
    await movedInstant();
  },

  async stepTest(n) {
    stepTestDays(n);
    await movedInstant();
  },

  /* Bulk entry, and only in test mode. The guard is here rather than in the
     screen because a screen is a thing you can navigate to by accident and a
     store is a thing you cannot un-write. */
  async seedSeries(rows) {
    if (!isTestMode()) throw new Error(t("testmode.err.notInTestMode"));
    const config = await store.config.current();
    const r = await applySeries(store, rows, { config });
    await reassess();
    render();
    return r;
  },

  async resetTest() {
    if (!isTestMode()) throw new Error(t("testmode.err.notInTestMode"));
    const r = await resetTestData();
    /* A clear that did not clear is reported. Another tab holding the database
       open blocks the delete, and the previous version showed the keeper an
       emptied screen over a store that still held the last run — so the next
       series he seeded landed on top of it. */
    if (!r || !r.ok) throw new Error(t("testmode.reset.failed", { reason: (r && r.reason) || "" }));
    await switchedMode();
  },
};

/* The mode changed: the store is a different database, so everything the shell
   was holding about the last one — the assessment, the suggestion, the asks —
   is about a tank this store has never heard of and is dropped rather than
   carried across. */
async function switchedMode() {
  store = storeForMode(currentMode());
  state.assessment = null;
  state.suggestion = null;
  state.doseAsks = {};
  state.extras = [];
  state.declinedSuggestions = [];
  state.storage = null;
  await movedInstant();
}

/* The instant moved: the same store, a different "now". The day stepper
   follows it, and the assessment is recomputed so the keeper sees what the
   engine says about the day they have just stepped to. */
async function movedInstant() {
  state.stepperDay = todayLocal();
  state.calendarMonth = todayLocal().slice(0, 7);
  const config = await store.config.current();
  if (!config && state.screen !== "testmode" && state.screen !== "settings") {
    /* A store with no configuration has nothing for the engine to resolve
       against. Test mode does not borrow the real tank's facts, so the first
       visit lands on setup — which is the honest consequence of the two stores
       never copying from each other. */
    state.screen = "setup";
  }
  if (config) await reassess();
  await render();
}

/* --- assessment ---------------------------------------------------------- */

/* The app's memory of a dose-confirmation ask: the day it was first raised,
   and whether it has been declined. Persisted, because an ask that only exists
   for the lifetime of one render can neither expire nor be answered. */
async function rememberDoseAsk(dose, patch) {
  const asks = (await store.kvGet("doseAsks")) || {};
  const key = String(dose);
  asks[key] = { raisedOn: todayLocal(), ...asks[key], ...patch };
  await store.kvSet("doseAsks", asks);
  return asks;
}

let assessing = null;

async function reassess() {
  if (assessing) return assessing;
  assessing = (async () => {
    try {
      const res = await runAssessment(store, nowAsOf());
      state.assessment = res.state === "ASSESSED" ? res : null;
      state.suggestion = null;

      if (res.state === "STORAGE_UNAVAILABLE") {
        /* Named as what it is. Telling the keeper the engine failed when what
           failed was reading their records sends them looking in the wrong
           place, and showing them an empty tank would be a lie. */
        state.storage = { ok: false, reason: res.error };
        return;
      }
      state.storage = { ok: true, reason: null };

      const [tasks, completions, extras, preference, declined] = await Promise.all([
        store.tasks.tasks(),
        store.tasks.completions(),
        readExtras(store),
        readPreference(store),
        store.kvGet("declinedSuggestions"),
      ]);
      state.extras = extras;
      state.doseAsks = (await store.kvGet("doseAsks")) || {};

      /* Stamp the day an ask was FIRST raised, here rather than in a render.
         `rememberDoseAsk` keeps an existing `raisedOn`, so this is idempotent:
         the first launch that sees a recommendation sets the clock, and every
         launch after it leaves the clock alone. That is what lets the ask
         expire. */
      const rec = state.assessment?.engineResult?.doseRecommendation;
      if (
        rec &&
        isPresent(rec.recommendedDoseMlPerDay) &&
        isPresent(rec.deltaDoseMlPerDay) &&
        rec.deltaDoseMlPerDay !== 0
      ) {
        state.doseAsks = await rememberDoseAsk(rec.recommendedDoseMlPerDay, {});
      }
      state.suggestionPreference = preference;
      state.declinedSuggestions = Array.isArray(declined) ? declined : [];

      if (state.assessment) {
        const suggestion = suggestionFrom(state.assessment.engineResult);
        const resolved = resolveSuggestion({
          suggestion,
          tasks,
          completions,
          today: todayLocal(),
          preference,
          declined: state.declinedSuggestions,
          extras,
          applied: await readApplied(store),
        });

        /* A stored preference applies itself. The keeper asked for that in so
           many words — "Remember this and don't ask again" — and the setting
           says what it is doing, so it is not a silent change. */
        if (resolved.state === SUGGESTION_STATE.APPLIED_BY_PREFERENCE) {
          if (preference === PREFERENCE.REPLACE) await applyReplace(store, resolved);
          else await applyAddExtra(store, resolved);
          state.extras = await readExtras(store);
          state.suggestion = { ...resolved, state: SUGGESTION_STATE.ALREADY_SCHEDULED, applied: preference };
        } else if (resolved.state !== SUGGESTION_STATE.NONE) {
          state.suggestion = resolved;
        }
      }
    } catch (e) {
      /* The engine failed. That is a state the interface renders, with the
         reason; it is never a blank card and never a fabricated answer. */
      state.assessment = null;
      state.engine = { state: ENGINE_STATE.FAILED, error: e.message };
    } finally {
      assessing = null;
    }
  })();
  return assessing;
}

/* --- rendering ----------------------------------------------------------- */

const SCREENS = {
  today: renderToday,
  testlab: renderTestLab,
  testmode: renderTestMode,
  import: renderImportV1,
  tasks: renderTasks,
  history: renderHistory,
  tools: renderTools,
  settings: renderSettings,
  setup: renderSetup,
  "log-entry": renderLogEntry,
  "icp-entry": renderIcpEntry,
  "assessment-detail": renderAssessmentDetail,
};

let rendering = false;

async function render() {
  if (rendering) return;
  rendering = true;
  try {
    const fn = SCREENS[state.screen] || renderToday;
    const node = await fn(ctx);
    mount(root, node);
    renderTabs();
    renderMarker();
    window.scrollTo(0, 0);
  } catch (e) {
    /* A crash in one screen used to render nothing at all: a blank page with no
       clue what happened. This names the fault and leaves navigation working.
       Ported in behaviour from V1's `TabErrorBoundary` (`ErrorBoundary.jsx`),
       `PORT_WITH_CLEANUP`. */
    mount(root, renderCrash(e));
    renderTabs();
    renderMarker();
  } finally {
    rendering = false;
  }
}

/* THE MARKER — THE THING THE KEEPER CANNOT MISS.

   The failure this guards against has two halves and both are expensive:
   entering a real reading into test data, where it is lost; and reading a test
   recommendation as advice about the actual tank, where it is acted on. Either
   one is a mistake made in a second and discovered much later.

   So it is not a discreet badge on Settings. It is a bar pinned above every
   screen, in a colour used nowhere else in the app, it names the date the app
   is pretending it is, and it is rendered on EVERY render including the crash
   screen — the one screen where the keeper is least sure what is going on. It
   is also the way back to the controls, so the answer to "how do I get out of
   this" is the thing already in front of them.

   `document.body` carries the mode as a class as well, so the tint reaches the
   chrome the bar itself does not cover. */
function renderMarker() {
  if (!marker) return;
  const on = isTestMode();
  document.body.classList.toggle("is-testmode", on);
  if (!on) {
    marker.replaceChildren();
    marker.hidden = true;
    return;
  }
  const at = testInstant();
  marker.hidden = false;
  mount(
    marker,
    h(
      "button",
      {
        class: "modemarker",
        type: "button",
        onclick: () => ctx.go("testmode"),
      },
      h("span", { class: "tag" }, t("testmode.marker.tag")),
      h("span", { class: "det" }, t("testmode.marker.detail", { date: fmtDayName(at.date), time: at.time })),
      h("span", { class: "go" }, "›")
    )
  );
}

function renderCrash(err) {
  return h(
    "main",
    { class: "screen" },
    h("header", { class: "topbar" }, h("div", null, h("h1", null, t("crash.title")))),
    h(
      "section",
      { class: "card crash" },
      h("p", { class: "body" }, t("crash.body")),
      h("p", { class: "meta" }, String((err && err.message) || err)),
      h(
        "div",
        { class: "btn-row" },
        h("button", { class: "btn btn-primary", type: "button", onclick: () => ctx.go("today") }, t("crash.toToday")),
        h("button", { class: "btn btn-quiet", type: "button", onclick: () => ctx.go("settings") }, t("crash.toSettings"))
      ),
      h(
        "details",
        { class: "devview" },
        h("summary", null, t("crash.dev")),
        h("pre", { class: "code" }, String((err && err.stack) || err))
      )
    )
  );
}

function renderTabs() {
  const bar = h("nav", { class: "tabbar", "aria-label": t("tab.aria") });
  for (const tab of TABS) {
    const on = state.screen === tab.id;
    bar.append(
      h(
        "button",
        {
          class: "tab" + (on ? " on" : "") + (tab.off ? " off" : ""),
          type: "button",
          "aria-current": on ? "page" : null,
          onclick: () => (tab.off ? ctx.go("tools") : ctx.go(tab.id)),
        },
        t(tab.label),
        tab.off ? h("span", { class: "later" }, t("tab.later")) : null
      )
    );
  }
  mount(tabbar, bar);
}

/* --- startup ------------------------------------------------------------- */

async function start() {
  onEngineState((s) => {
    state.engine = s;
    if (state.screen === "today") render();
  });

  const declined = await store.kvGet("declinedSuggestions");
  if (Array.isArray(declined)) state.declinedSuggestions = declined;

  const config = await store.config.current();
  if (!config) state.screen = "setup";

  await render();

  if ("serviceWorker" in navigator) {
    /* The failure is recorded rather than swallowed. Without an offline copy
       the app still works, but the keeper is entitled to know that opening it
       in a fishroom with no signal will not work, so Settings reads this. */
    navigator.serviceWorker
      .register(new URL("../sw.js", import.meta.url), { scope: "./" })
      .catch((e) => {
        state.offlineCopyError = (e && e.message) || String(e);
      });
  }

  if (config) {
    warmUp();
    await reassess();
    await render();
  }
}

start();
