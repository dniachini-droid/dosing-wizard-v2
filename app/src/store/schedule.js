/* ============================================================================
   TASKS AND SCHEDULING
   ----------------------------------------------------------------------------
   The scheduling machinery is ported from V1 `src/lib/reminders.js`, which
   `docs/migration/V1-APPLICATION-SALVAGE.md` §2.1 calls "the strongest generic
   asset in the V1 application" and dispositions `PORT_WITH_CLEANUP`. It has no
   chemistry coupling at all.

   The one rule worth stating in full, because it is the reason the model is
   shaped this way:

     A task is due a fixed interval after it was last COMPLETED, not after it
     was last DUE. Test three days late and the next one falls three days later
     too, so being behind never compounds into a backlog that can't be cleared.

   And its companion:

     Logging the reading IS the completion. There is no separate tick to
     remember, because the act of recording the reading is the completion.

   WHAT IS DELIBERATELY NOT PORTED
   -------------------------------

   V1's `REMINDER_SEED` carries a test interval per parameter. Those are
   cadences. A cadence is chemistry, `CLAUDE.md` says chemistry comes from the
   canon and from nothing else, and the salvage inventory says so too: "Port the
   scheduling machinery; take the intervals from canon."

   The canon supplies exactly one cadence, alkalinity's, and it supplies it as
   an ENGINE OUTPUT — the retest scheduler's `recommendedAt` — not as a number
   to seed a task with. For every other parameter the canon says nothing.

   So this build ships NO seeded test schedule. A keeper who wants a nitrate
   test every week creates that task and types "7", and seven is then their
   number, entered by them, not a rule the app asserted. The app never
   pre-fills an interval it cannot source. That is a visible consequence — a
   new install's Tasks screen starts empty and says why — and it is the honest
   one. Recorded as an open item in `docs/implementation/app/OPEN-ITEMS.md`.
   ========================================================================= */

import { TASKS, COMPLETIONS } from "./db.js";
import { addDays, daysBetween, todayLocal } from "./time.js";

import { t } from "../strings.js";

export const TASK_SCHEMA_VERSION = 1;

export const TASK_KIND = Object.freeze({
  TEST: "TEST",           /* completed by logging a reading of its parameter */
  HUSBANDRY: "HUSBANDRY", /* water change, media, anything with a rhythm */
  CUSTOM: "CUSTOM",
});

/* Interval shown the way it was entered: 42 days reads better as 6 weeks.
   Ported verbatim from V1 `reminders.js:40` (`PORT_AS_IS`). */
export function intervalLabel(days) {
  if (days % 7 === 0 && days >= 7) {
    const w = days / 7;
    return w === 1 ? t("tasks.interval.week") : t("tasks.interval.weeks", { n: w });
  }
  return days === 1 ? t("tasks.interval.day") : t("tasks.interval.days", { n: days });
}

export function makeTask({ id, label, kind, parameter = null, intervalDays, startDate, needsVolume = false, unit = null }) {
  if (!TASK_KIND[kind]) throw new Error(t("tasks.interval.unknownKind", { kind }));
  if (!(intervalDays > 0)) throw new Error(t("tasks.interval.needChosen"));
  return {
    id,
    schemaVersion: TASK_SCHEMA_VERSION,
    label,
    kind,
    parameter,
    intervalDays,
    startDate,
    enabled: true,
    needsVolume,
    unit,
    /* A nudge that moves only the NEXT occurrence. The one after it is still
       scheduled from the actual completion, so a nudge never permanently skews
       the rhythm. V1 `reminders.js:66` — with `adjustAnchor` added, which V1
       lacked: V1's shift stayed on the task and applied to every occurrence
       after it too. */
    adjustDays: 0,
    adjustAnchor: null,
    createdAt: new Date().toISOString(),
  };
}

/* One task's state: when it was last done, when it is next due, and how that
   reads today. Ported from V1 `reminderState`.

   V1's `dueOverride`/`dueReason` — the protocol pin that moved the next test
   after a dose change — is NOT ported as wiring. The salvage inventory is
   explicit: "in V2 the retest date is the engine's". So the engine's suggestion
   is a separate object that sits beside the schedule and never writes into it
   unless the keeper accepts it. See `suggestion.js`. */
export function taskState(task, completions, today) {
  const done = completions
    .filter((c) => c.taskId === task.id)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const lastDone = done.length ? done[0].date : null;

  let due = lastDone ? addDays(lastDone, task.intervalDays) : task.startDate;

  /* A nudge moves ONLY the next occurrence. `adjustAnchor` is the completion
     the nudge was made against; once the keeper completes the task again,
     `lastDone` moves past it and the nudge stops applying. Without that the
     shift would be added to every future occurrence and a one-off "not this
     Tuesday" would permanently skew the rhythm.

     A nudge saved with no anchor is one made before any completion existed,
     and it lapses the first time the task is done. */
  const nudgeStillApplies =
    task.adjustDays && (task.adjustAnchor ?? null) === (lastDone ?? null);
  if (nudgeStillApplies) due = addDays(due, task.adjustDays);

  const daysOut = daysBetween(today, due);
  return {
    task,
    lastDone,
    due,
    daysOut,
    completions: done,
    status: daysOut < 0 ? "overdue" : daysOut === 0 ? "today" : "upcoming",
    doneToday: lastDone === today,
  };
}

/* Future occurrences up to a horizon, so the calendar can show what is coming
   as well as what has been done. Projection only — completing early or late
   reschedules everything after it. V1 `projectOccurrences`, `PORT_AS_IS`. */
export function projectOccurrences(task, completions, today, untilDate) {
  if (!task || task.enabled === false || !task.intervalDays) return [];
  const st = taskState(task, completions, today);
  const out = [];
  let d = st.due;
  let guard = 0;
  while (d <= untilDate && guard++ < 400) {
    if (d >= today) out.push(d);
    d = addDays(d, task.intervalDays);
  }
  return out;
}

export function computeSchedule(tasks, completions, today, windowDays = 14) {
  const active = (tasks || []).filter((t) => t.enabled !== false);
  const states = active.map((t) => taskState(t, completions, today));
  const overdue = states.filter((s) => s.status === "overdue").sort((a, b) => a.daysOut - b.daysOut);
  const dueToday = states.filter((s) => s.status === "today");
  const upcoming = states
    .filter((s) => s.status === "upcoming" && s.daysOut <= windowDays)
    .sort((a, b) => a.daysOut - b.daysOut);
  const later = states
    .filter((s) => s.status === "upcoming" && s.daysOut > windowDays)
    .sort((a, b) => a.daysOut - b.daysOut);
  return {
    states,
    overdue,
    dueToday,
    upcoming,
    later,
    actionable: [...overdue, ...dueToday],
    allClear: overdue.length === 0 && dueToday.length === 0,
  };
}

/* Logging a test IS the completion. Returns the completions to write, so the
   caller writes them alongside the reading in one update rather than leaving a
   window where the reading exists and the tick does not.
   V1 `autoCompletions`, `PORT_AS_IS` as a concept. */
export function autoCompletions(tasks, completions, parameter, date) {
  const hits = (tasks || []).filter(
    (t) => t.enabled !== false && t.kind === TASK_KIND.TEST && t.parameter === parameter
  );
  const out = [];
  for (const t of hits) {
    if ((completions || []).some((c) => c.taskId === t.id && c.date === date)) continue;
    out.push({
      completionId: `${t.id}|${date}`,
      taskId: t.id,
      date,
      auto: true,
      recordedAt: new Date().toISOString(),
    });
  }
  return out;
}

export function createTaskStore(backend) {
  return {
    async tasks() {
      return backend.all(TASKS);
    },
    async completions() {
      return backend.all(COMPLETIONS);
    },
    async saveTask(task) {
      await backend.put(TASKS, task.id, task);
      return task;
    },
    async removeTask(id) {
      /* Disabling, not deleting: the completion history stays readable, and a
         task the keeper turns off in March is still the reason March's
         calendar looks the way it does. */
      const existing = await backend.get(TASKS, id);
      if (existing) await backend.put(TASKS, id, { ...existing, enabled: false });
    },
    async complete({ taskId, date, detail = null, auto = false }) {
      const id = `${taskId}|${date}`;
      const existing = await backend.get(COMPLETIONS, id);
      if (existing) return existing;
      const rec = {
        completionId: id,
        schemaVersion: TASK_SCHEMA_VERSION,
        taskId,
        date,
        auto,
        detail,
        recordedAt: new Date().toISOString(),
      };
      await backend.put(COMPLETIONS, id, rec);
      return rec;
    },
    async uncomplete(taskId, date) {
      await backend.del(COMPLETIONS, `${taskId}|${date}`);
    },
    async writeCompletions(list) {
      for (const c of list) await backend.put(COMPLETIONS, c.completionId, c);
    },
    async today() {
      return todayLocal();
    },
  };
}
