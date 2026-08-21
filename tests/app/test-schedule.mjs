/* ============================================================================
   COMPLETION-ANCHORED SCHEDULING, AND WHAT COMPLETES A TEST
   ----------------------------------------------------------------------------
   The rule V1 got right and this build carries across: a task is due a fixed
   interval after it was last COMPLETED, not after it was last DUE. Test three
   days late and the next one falls three days later too, so being behind never
   compounds into a backlog that cannot be cleared.

   And its companion: logging the reading IS the completion.
   ========================================================================= */

import { suite, eq, ok, deepEq } from "./harness.mjs";
import { createMemoryStore } from "../../app/src/store/index.js";
import {
  TASK_KIND,
  autoCompletions,
  computeSchedule,
  intervalLabel,
  makeTask,
  projectOccurrences,
  taskState,
} from "../../app/src/store/schedule.js";
import { addDays } from "../../app/src/store/time.js";

const s = suite("scheduling");

const task = (over = {}) =>
  makeTask({
    id: "t1",
    label: "Test nitrate",
    kind: TASK_KIND.TEST,
    parameter: "NO3",
    intervalDays: 7,
    startDate: "2026-08-01",
    ...over,
  });

const done = (date) => ({ completionId: `t1|${date}`, taskId: "t1", date });

s.test("SCH-01", "being late does not compound — the next one is anchored to the completion", () => {
  const t = task();
  /* Due 1 Aug, done 4 Aug: three days late. */
  const st = taskState(t, [done("2026-08-04")], "2026-08-04");
  eq(st.due, "2026-08-11", "the next one is seven days after it was DONE, not after it was due");
  eq(st.lastDone, "2026-08-04", "the last completion");

  /* Late again, and again it does not stack. */
  const st2 = taskState(t, [done("2026-08-04"), done("2026-08-15")], "2026-08-15");
  eq(st2.due, "2026-08-22", "still seven days from the latest completion");

  /* And the backlog is never more than one item, however far behind. */
  const far = taskState(t, [done("2026-08-04")], "2026-10-01");
  eq(far.status, "overdue", "it is overdue");
  eq(far.due, "2026-08-11", "with exactly one occurrence outstanding, not eight");
});

s.test("SCH-02", "done early also re-anchors — the rhythm follows the keeper, not the calendar", () => {
  const t = task();
  const st = taskState(t, [done("2026-07-28")], "2026-07-28");
  eq(st.due, "2026-08-04", "seven days from the early completion");
});

s.test("SCH-03", "a nudge moves only the next occurrence, and then lapses", () => {
  const t = task({ intervalDays: 7 });
  const history = [done("2026-08-04")];
  eq(taskState(t, history, "2026-08-05").due, "2026-08-11", "before the nudge");

  /* A nudge as the app writes one: the shift, plus the completion it was made
     against. */
  const nudged = { ...t, adjustDays: 2, adjustAnchor: "2026-08-04" };
  eq(taskState(nudged, history, "2026-08-05").due, "2026-08-13", "the nudged occurrence moves");

  /* Complete it. `lastDone` moves past the anchor, the nudge lapses, and the
     one after is seven days from when they ACTUALLY did it — not seven days
     plus a shift that would otherwise persist forever. */
  const after = taskState(nudged, [...history, done("2026-08-13")], "2026-08-13");
  eq(after.due, "2026-08-20", "seven days from the completion, with the nudge gone");

  /* And two completions later it is still gone, rather than reappearing. */
  const later = taskState(nudged, [...history, done("2026-08-13"), done("2026-08-20")], "2026-08-20");
  eq(later.due, "2026-08-27", "still unskewed");
});

s.test("SCH-03b", "a nudge made before the task was ever completed lapses on the first completion", () => {
  const t = task({ intervalDays: 7, startDate: "2026-08-10" });
  const nudged = { ...t, adjustDays: 2, adjustAnchor: null };
  eq(taskState(nudged, [], "2026-08-05").due, "2026-08-12", "the nudge applies while nothing is done");
  eq(
    taskState(nudged, [done("2026-08-12")], "2026-08-12").due,
    "2026-08-19",
    "and lapses once it has been done"
  );
});

s.test("SCH-04", "logging a reading completes its test task, and only its test task", async () => {
  const alk = makeTask({
    id: "alk", label: "Test alkalinity", kind: TASK_KIND.TEST, parameter: "ALK",
    intervalDays: 3, startDate: "2026-08-01",
  });
  const no3 = task();
  const chore = makeTask({
    id: "wc", label: "Water change", kind: TASK_KIND.HUSBANDRY,
    intervalDays: 7, startDate: "2026-08-01",
  });

  const made = autoCompletions([alk, no3, chore], [], "ALK", "2026-08-20");
  eq(made.length, 1, "one completion was made");
  eq(made[0].taskId, "alk", "for the alkalinity test");
  eq(made[0].date, "2026-08-20", "on the day of the reading");
  eq(made[0].auto, true, "and marked as automatic, so the calendar can say why");

  /* Logging the same parameter twice on one day does not double-complete. */
  const again = autoCompletions([alk, no3, chore], made, "ALK", "2026-08-20");
  eq(again.length, 0, "a second reading the same day adds nothing");
});

s.test("SCH-05", "a disabled task is never due and never auto-completes", () => {
  const t = { ...task(), enabled: false };
  const sched = computeSchedule([t], [], "2026-09-01");
  eq(sched.states.length, 0, "it is not in the schedule");
  eq(autoCompletions([t], [], "NO3", "2026-09-01").length, 0, "and it does not auto-complete");
});

s.test("SCH-06", "projection is projection — it reschedules from the completion, and is bounded", () => {
  const t = task({ intervalDays: 7 });
  const occ = projectOccurrences(t, [done("2026-08-04")], "2026-08-05", "2026-09-05");
  deepEq(occ, ["2026-08-11", "2026-08-18", "2026-08-25", "2026-09-01"], "the projected occurrences");

  /* A one-day interval over a long horizon terminates rather than running away. */
  const daily = task({ intervalDays: 1 });
  const many = projectOccurrences(daily, [], "2026-01-01", "2030-01-01");
  ok(many.length > 0 && many.length <= 400, `it is guarded: ${many.length} occurrences`);
});

s.test("SCH-07", "buckets are what they say: overdue, today, upcoming, later", () => {
  const mk = (id, due) =>
    makeTask({ id, label: id, kind: TASK_KIND.CUSTOM, intervalDays: 30, startDate: due });
  const sched = computeSchedule(
    [mk("a", "2026-08-15"), mk("b", "2026-08-20"), mk("c", "2026-08-25"), mk("d", "2026-09-30")],
    [],
    "2026-08-20"
  );
  deepEq(sched.overdue.map((x) => x.task.id), ["a"], "overdue");
  deepEq(sched.dueToday.map((x) => x.task.id), ["b"], "due today");
  deepEq(sched.upcoming.map((x) => x.task.id), ["c"], "upcoming inside the window");
  deepEq(sched.later.map((x) => x.task.id), ["d"], "later");
  deepEq(sched.actionable.map((x) => x.task.id), ["a", "b"], "actionable is overdue plus today");
  eq(sched.allClear, false, "not all clear");
  eq(computeSchedule([mk("z", "2026-09-30")], [], "2026-08-20").allClear, true, "all clear when nothing is due");
});

s.test("SCH-08", "a task cannot be created without an interval the keeper chose", () => {
  let refused = 0;
  for (const bad of [0, -1, null, undefined, NaN]) {
    try {
      makeTask({ id: "x", label: "x", kind: TASK_KIND.CUSTOM, intervalDays: bad, startDate: "2026-08-01" });
    } catch {
      refused += 1;
    }
  }
  eq(refused, 5, "every invalid interval was refused");
});

s.test("SCH-09", "completion is idempotent — a second tick on the same day does not stack", async () => {
  const store = createMemoryStore();
  await store.tasks.saveTask(task());
  const a = await store.tasks.complete({ taskId: "t1", date: "2026-08-20" });
  const b = await store.tasks.complete({ taskId: "t1", date: "2026-08-20" });
  eq(a.completionId, b.completionId, "the same completion came back");
  eq((await store.tasks.completions()).length, 1, "one completion is stored, not two");
});

s.test("SCH-10", "turning a task off keeps its completion history readable", async () => {
  const store = createMemoryStore();
  await store.tasks.saveTask(task());
  await store.tasks.complete({ taskId: "t1", date: "2026-08-20" });
  await store.tasks.removeTask("t1");

  const tasks = await store.tasks.tasks();
  eq(tasks.length, 1, "the task record is kept");
  eq(tasks[0].enabled, false, "and is disabled rather than deleted");
  eq((await store.tasks.completions()).length, 1, "the completion history survives");
});

s.test("SCH-11", "an interval reads the way it was entered", () => {
  eq(intervalLabel(1), "every day", "one day");
  eq(intervalLabel(3), "every 3 days", "three days");
  eq(intervalLabel(7), "every week", "seven days");
  eq(intervalLabel(42), "every 6 weeks", "forty-two days reads as six weeks");
  eq(intervalLabel(10), "every 10 days", "ten days is not a whole number of weeks");
});

s.test("SCH-12", "no test schedule is seeded, because no cadence exists to seed it with", async () => {
  /* The canon states one cadence, alkalinity's, and states it as an ENGINE
     OUTPUT rather than as a number to seed a task with. Everything else has
     none. So a fresh install has an empty schedule and says why, and the app
     never pre-fills an interval it cannot source. */
  const store = createMemoryStore();
  deepEq(await store.tasks.tasks(), [], "a fresh install has no tasks");
  deepEq(await store.tasks.completions(), [], "and no completions");
});

/* ---------------------------------------------------------------------------
   THE `recent` BUCKET — ADDED BY THE V1 INTERFACE PORT, AND UNTESTED UNTIL A
   REVIEW SAID SO.
   ---------------------------------------------------------------------------
   V1's `computeReminders` returned it and V2's port of this file left it out;
   the ported reminders panel reads it, so it went back in. It went back in
   with no test, no mutation and no boundary case — in the layer the port's own
   report claimed was untouched. Both of those were wrong and both are fixed
   here.

   The rule: a completion counts as recent when it falls WITHIN the window,
   inclusive of the far edge. `<= windowDays` is the whole of it, and which
   side that edge belongs to is the thing a boundary test exists to pin.
   ------------------------------------------------------------------------ */

s.test("SCHED-13", "recently done is the completions inside the window, far edge included", () => {
  const today = "2026-03-20";
  const task = makeTask({
    id: "wc", label: "Water change", kind: TASK_KIND.HUSBANDRY,
    intervalDays: 7, startDate: "2026-03-01",
  });

  const at = (daysAgo) => [{ completionId: `c-${daysAgo}`, taskId: "wc", date: addDays(today, -daysAgo) }];

  /* Inside, on the edge, and one day past it. */
  eq(computeSchedule([task], at(13), today, 14).recent.length, 1, "13 days ago is recent");
  eq(computeSchedule([task], at(14), today, 14).recent.length, 1, "14 days ago is recent — the far edge is included");
  eq(computeSchedule([task], at(15), today, 14).recent.length, 0, "15 days ago is not");

  /* Today, and a completion dated ahead of today. Neither is a reason to drop
     it: `daysBetween` is signed and a negative gap is still inside a window. */
  eq(computeSchedule([task], at(0), today, 14).recent.length, 1, "done today is recent");
  eq(computeSchedule([task], at(-1), today, 14).recent.length, 1, "and a completion dated tomorrow is not silently lost");

  /* Never done is not recent, and does not throw. */
  eq(computeSchedule([task], [], today, 14).recent.length, 0, "never done is not recent");

  /* Most recent first, and one row per task however many completions it has —
     "a new completion replaces the previous one rather than stacking up". */
  const many = [
    { completionId: "a", taskId: "wc", date: addDays(today, -9) },
    { completionId: "b", taskId: "wc", date: addDays(today, -2) },
    { completionId: "c", taskId: "wc", date: addDays(today, -5) },
  ];
  const view = computeSchedule([task], many, today, 14);
  eq(view.recent.length, 1, "one row per task, not one per completion");
  eq(view.recent[0].lastDone, addDays(today, -2), "and it is the most recent one");

  /* A task the keeper turned off is not in any bucket, recent included. */
  const off = { ...task, enabled: false };
  eq(computeSchedule([off], at(2), today, 14).recent.length, 0, "a task turned off is not reported as recently done");
});

export default s;
