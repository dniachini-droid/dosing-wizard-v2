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
import { createStore } from "./store/index.js";
import { runAssessment, nowAsOf } from "./assess.js";
import { onEngineState, warmUp, ENGINE_STATE } from "./engine/client.js";
import { todayLocal } from "./store/time.js";
import { KIND } from "./store/ledger.js";
import { taskState } from "./store/schedule.js";
import {
  PREFERENCE,
  SUGGESTION_STATE,
  applyAddExtra,
  applyReplace,
  decline as declineSuggestion,
  readExtras,
  readPreference,
  resolve as resolveSuggestion,
  suggestionFrom,
} from "./store/suggestion.js";
import { t } from "./strings.js";

import { renderToday } from "./screens/today.js";
import { renderTestLab } from "./screens/testlab.js";
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

const store = createStore();
const root = document.getElementById("app");
const tabbar = document.getElementById("tabbar");

const ctx = {
  store,
  state,

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
    /* The axis pad wants a low and a high. Alkalinity has the keeper's own
       configured range; nothing else has a range at all, so its own extremes
       are used and no band is drawn. */
    const min = def.assessed && config?.targetRangeMinDkh != null ? config.targetRangeMinDkh : Math.min(...vals);
    const max = def.assessed && config?.targetRangeMaxDkh != null ? config.targetRangeMaxDkh : Math.max(...vals);

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

  async completeTask(task, time, volume) {
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
        await store.ledger.append({
          kind: KIND.WATER_CHANGE,
          time,
          recordedAt: new Date().toISOString(),
          detail: { changedFraction: fraction, volumeL: Number(volume) },
        });
      }
    }
    await ctx.afterCompletion(task);
  },

  async confirmDose(detail, answer) {
    if (answer === "UNKNOWN") return;
    if (answer === "NOT_MADE") {
      await store.kvSet("declinedDose", detail.recommendedDoseMlPerDay);
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
};

/* --- assessment ---------------------------------------------------------- */

let assessing = null;

async function reassess() {
  if (assessing) return assessing;
  assessing = (async () => {
    try {
      const res = await runAssessment(store, nowAsOf());
      state.assessment = res.state === "ASSESSED" ? res : null;
      state.suggestion = null;

      const [tasks, completions, extras, preference, declined] = await Promise.all([
        store.tasks.tasks(),
        store.tasks.completions(),
        readExtras(store),
        readPreference(store),
        store.kvGet("declinedSuggestions"),
      ]);
      state.extras = extras;
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
    window.scrollTo(0, 0);
  } catch (e) {
    /* A crash in one screen used to render nothing at all: a blank page with no
       clue what happened. This names the fault and leaves navigation working.
       Ported in behaviour from V1's `TabErrorBoundary` (`ErrorBoundary.jsx`),
       `PORT_WITH_CLEANUP`. */
    mount(root, renderCrash(e));
    renderTabs();
  } finally {
    rendering = false;
  }
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
