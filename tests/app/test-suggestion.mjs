/* ============================================================================
   THE SUGGESTED TEST
   ----------------------------------------------------------------------------
   `docs/implementation/app/TASKS-AND-SCHEDULING.md`, owner-approved
   21 August 2026.

   The specification's "WHAT THIS RULES OUT" section is a list of four
   behaviours that must not happen. Each has a test here, because a rule about
   what a system must NOT do is exactly the kind that decays quietly.
   ========================================================================= */

import { suite, eq, ok, deepEq, throws } from "./harness.mjs";
import { createMemoryStore } from "../../app/src/store/index.js";
import { TASK_KIND, makeTask, taskState } from "../../app/src/store/schedule.js";
import {
  APP_ASK_EXPIRY_DAYS,
  PREFERENCE,
  SUGGESTION_STATE,
  applyAddExtra,
  applyReplace,
  askIsLive,
  decline,
  forgetPreference,
  outstandingExtras,
  readExtras,
  readPreference,
  rememberPreference,
  readApplied,
  resolve,
  suggestionFrom,
} from "../../app/src/store/suggestion.js";

const s = suite("the suggested test");

const TODAY = "2026-08-20";

/* A POST-CHANGE retest, which is the only kind that is an offer.

   `TASKS-AND-SCHEDULING.md:47` scopes the suggested test to "after a dose
   change". These fixtures used to carry `RETEST_SIGNAL_ACCUMULATION`, and the
   tests passed — because the code accepted ANY `recommendedAt` as an offer and
   so raised a "suggested test" row on every assessment the app ever ran,
   including one whose whole content was the routine two-day cadence. */
const engineResult = (at = "2026-08-22T07:40:00+00:00", code = "RETEST_POST_CHANGE_FIRST") => ({
  retest: {
    recommendedAt: at,
    earliestUsefulAt: at,
    selectedReasonCode: code,
    selectedAction: "TEST_AT",
  },
});

const alkTask = (over = {}) =>
  makeTask({
    id: "alk",
    label: "Test alkalinity",
    kind: TASK_KIND.TEST,
    parameter: "ALK",
    intervalDays: 4,
    startDate: "2026-08-24",
    ...over,
  });

/* -------------------------------------------------------------------------
   Reading the suggestion.
   ---------------------------------------------------------------------- */

s.test("SUG-01", "the suggestion IS the engine's retest output — nothing here picks a date", () => {
  const sug = suggestionFrom(engineResult("2026-08-22T07:40:00+00:00"));
  eq(sug.date, "2026-08-22", "the day comes from the engine");
  eq(sug.at, "2026-08-22T07:40:00+00:00", "the instant is the engine's, unaltered");
  eq(sug.reasonCode, "RETEST_POST_CHANGE_FIRST", "and so is the reason");

  /* THE ROUTINE CADENCE IS NOT AN OFFER. `ROUTINE_CADENCE` is a standing
     candidate, so `recommendedAt` is present on nearly every assessment. If
     that counted, the app would raise a "suggested test" row every time it was
     opened, for the news that the usual gap between tests is the usual gap. */
  eq(
    suggestionFrom(engineResult("2026-08-22T07:40:00+00:00", "RETEST_ROUTINE_CADENCE")),
    null,
    "the routine cadence is not a suggestion"
  );
  eq(
    suggestionFrom(engineResult("2026-08-22T07:40:00+00:00", "RETEST_SIGNAL_ACCUMULATION")),
    null,
    "nor is waiting for the signal to accumulate"
  );
  ok(
    suggestionFrom(engineResult("2026-08-22T07:40:00+00:00", "RETEST_POST_CHANGE_SECOND")) !== null,
    "the second post-change test IS an offer"
  );

  /* A refusal is not a suggestion. */
  eq(suggestionFrom({ retest: { recommendedAt: "NOT_RUN" } }), null, "a NOT_RUN retest suggests nothing");
  eq(suggestionFrom({ retest: {} }), null, "an empty retest suggests nothing");
  eq(suggestionFrom({}), null, "an empty result suggests nothing");
  eq(suggestionFrom(null), null, "no result suggests nothing");
});

/* -------------------------------------------------------------------------
   RULED OUT: the engine silently moving a keeper's scheduled test.
   ---------------------------------------------------------------------- */

s.test("SUG-02", "resolving a suggestion writes NOTHING to the keeper's schedule", async () => {
  const store = createMemoryStore();
  const task = alkTask();
  await store.tasks.saveTask(task);
  const before = JSON.stringify(await store.tasks.tasks());

  const resolved = resolve({
    suggestion: suggestionFrom(engineResult()),
    tasks: [task],
    completions: [],
    today: TODAY,
    preference: PREFERENCE.ASK,
    declined: [],
    extras: [],
  });

  eq(resolved.state, SUGGESTION_STATE.ASK, "it asks");
  eq(JSON.stringify(await store.tasks.tasks()), before, "and the schedule is untouched");
});

s.test("SUG-03", "the keeper's schedule moves only when the keeper says replace", async () => {
  const store = createMemoryStore();
  const task = alkTask();
  await store.tasks.saveTask(task);

  const suggestion = suggestionFrom(engineResult());
  const resolved = resolve({
    suggestion, tasks: [task], completions: [], today: TODAY,
    preference: PREFERENCE.ASK, declined: [], extras: [],
  });
  eq(resolved.scheduledDate, "2026-08-24", "their next test, before");

  const out = await applyReplace(store, { ...resolved, today: TODAY });
  eq(out.applied, PREFERENCE.REPLACE, "replace was applied");
  eq(out.movedFrom, "2026-08-24", "from their date");
  eq(out.movedTo, "2026-08-22", "to the engine's");

  const [saved] = await store.tasks.tasks();
  eq(taskState(saved, [], TODAY).due, "2026-08-22", "their next test now falls on the suggested day");
  eq(saved.intervalDays, 4, "and their interval is untouched");
});

s.test("SUG-04", "replace moves only the NEXT occurrence — the rhythm survives", async () => {
  const store = createMemoryStore();
  const task = alkTask();
  await store.tasks.saveTask(task);

  const suggestion = suggestionFrom(engineResult());
  const resolved = resolve({
    suggestion, tasks: [task], completions: [], today: TODAY,
    preference: PREFERENCE.ASK, declined: [], extras: [],
  });
  await applyReplace(store, { ...resolved, today: TODAY });

  /* They test on the suggested day. The one after is anchored to that
     completion plus their own interval — not to the engine's suggestion. */
  const [saved] = await store.tasks.tasks();
  const completions = [{ completionId: "alk|2026-08-22", taskId: "alk", date: "2026-08-22" }];
  const next = taskState(saved, completions, "2026-08-22").due;
  eq(next, "2026-08-26", "four days after they actually tested, plus the standing nudge");
});

/* -------------------------------------------------------------------------
   Adding it as an extra.
   ---------------------------------------------------------------------- */

s.test("SUG-05", "an extra test is a one-off, and does not touch the schedule", async () => {
  const store = createMemoryStore();
  const task = alkTask();
  await store.tasks.saveTask(task);
  const before = JSON.stringify(await store.tasks.tasks());

  const suggestion = suggestionFrom(engineResult());
  await applyAddExtra(store, { suggestion });

  eq(JSON.stringify(await store.tasks.tasks()), before, "the schedule is untouched");
  const extras = await readExtras(store);
  eq(extras.length, 1, "one extra was added");
  eq(extras[0].date, "2026-08-22", "on the suggested day");
  eq(extras[0].source, "ENGINE_SUGGESTION", "and it says where it came from");
  eq("intervalDays" in extras[0], false, "an extra has no interval — it never repeats");
});

s.test("SUG-06", "adding the same extra twice adds one", async () => {
  const store = createMemoryStore();
  const suggestion = suggestionFrom(engineResult());
  await applyAddExtra(store, { suggestion });
  await applyAddExtra(store, { suggestion });
  eq((await readExtras(store)).length, 1, "one extra");
});

s.test("SUG-07", "an extra is completed by logging the reading, like any other test", () => {
  const extras = [{ id: "ALK|2026-08-22", parameter: "ALK", date: "2026-08-22" }];
  const noReading = [];
  eq(outstandingExtras(extras, noReading, TODAY).length, 1, "outstanding before the reading");

  const logged = [
    {
      state: "CURRENT",
      event: { kind: "READING", parameter: "ALK", time: { localDate: "2026-08-22" } },
    },
  ];
  eq(outstandingExtras(extras, logged, "2026-08-23").length, 0, "cleared by the reading itself");

  /* A reading of a different parameter does not clear it. */
  const other = [
    { state: "CURRENT", event: { kind: "READING", parameter: "CA", time: { localDate: "2026-08-22" } } },
  ];
  eq(outstandingExtras(extras, other, "2026-08-23").length, 1, "a calcium reading does not clear an alkalinity extra");
});

/* -------------------------------------------------------------------------
   "That's already your scheduled test day. Nothing to change."
   ---------------------------------------------------------------------- */

s.test("SUG-08", "when the suggested day is already their test day, there is nothing to ask", () => {
  const task = alkTask({ startDate: "2026-08-22" });
  const resolved = resolve({
    suggestion: suggestionFrom(engineResult()),
    tasks: [task],
    completions: [],
    today: TODAY,
    preference: PREFERENCE.ASK,
    declined: [],
    extras: [],
  });
  eq(resolved.state, SUGGESTION_STATE.ALREADY_SCHEDULED, "nothing to change");
});

s.test("SUG-09", "and when they have already added it as an extra, likewise", () => {
  const task = alkTask();
  const resolved = resolve({
    suggestion: suggestionFrom(engineResult()),
    tasks: [task],
    completions: [],
    today: TODAY,
    preference: PREFERENCE.ASK,
    declined: [],
    extras: [{ id: "ALK|2026-08-22", parameter: "ALK", date: "2026-08-22" }],
  });
  eq(resolved.state, SUGGESTION_STATE.ALREADY_SCHEDULED, "nothing to change");
});

/* -------------------------------------------------------------------------
   RULED OUT: inferring a scheduling preference from behaviour.
   ---------------------------------------------------------------------- */

s.test("SUG-10", "a preference is written only by an explicit answer, and defaults to asking", async () => {
  const store = createMemoryStore();
  eq(await readPreference(store), PREFERENCE.ASK, "a fresh install asks");

  /* Accepting, repeatedly, without ticking the box, changes nothing. */
  const suggestion = suggestionFrom(engineResult());
  const task = alkTask();
  await store.tasks.saveTask(task);
  for (let i = 0; i < 5; i++) {
    const resolved = resolve({
      suggestion, tasks: [task], completions: [], today: TODAY,
      preference: await readPreference(store), declined: [], extras: [],
    });
    if (resolved.state === SUGGESTION_STATE.ASK) await applyReplace(store, { ...resolved, today: TODAY });
  }
  eq(await readPreference(store), PREFERENCE.ASK, "five acceptances did not become a preference");
});

s.test("SUG-11", "only an explicit replace-or-add may be remembered — not a decline", async () => {
  const store = createMemoryStore();
  await rememberPreference(store, PREFERENCE.REPLACE);
  eq(await readPreference(store), PREFERENCE.REPLACE, "an explicit answer is remembered");

  await forgetPreference(store);
  eq(await readPreference(store), PREFERENCE.ASK, "and can be cleared");

  await throws(
    () => rememberPreference(store, PREFERENCE.ASK),
    "explicit",
    "remembering 'ask' as a preference"
  );
  await throws(() => rememberPreference(store, "DECLINE"), "explicit", "remembering a decline");
  await throws(() => rememberPreference(store, null), "explicit", "remembering nothing");
});

s.test("SUG-12", "a stored preference applies without asking, and says which one it is", async () => {
  const store = createMemoryStore();
  await rememberPreference(store, PREFERENCE.REPLACE);
  const task = alkTask();

  const resolved = resolve({
    suggestion: suggestionFrom(engineResult()),
    tasks: [task],
    completions: [],
    today: TODAY,
    preference: await readPreference(store),
    declined: [],
    extras: [],
  });
  eq(resolved.state, SUGGESTION_STATE.APPLIED_BY_PREFERENCE, "it applies itself");
  eq(resolved.preference, PREFERENCE.REPLACE, "and names which way");
});

/* -------------------------------------------------------------------------
   Declining.
   ---------------------------------------------------------------------- */

s.test("SUG-13", "a declined suggestion stays declined, and does not come back", async () => {
  const store = createMemoryStore();
  const suggestion = suggestionFrom(engineResult());
  await decline(store, suggestion);

  const declined = await store.kvGet("declinedSuggestions");
  deepEq(declined, ["ALK|2026-08-22"], "the declined DAY is remembered, not the instant");

  /* THE DEFECT THIS TEST EXISTS FOR.

     The engine recomputes `recommendedAt` as `asOf + hours` on every
     assessment, so the instant is different every time the app is opened. A
     declined list keyed on the instant therefore never matched again: "No
     thanks" was inert, and the list grew by one entry per decline forever.

     So: the SAME offer, seen a few seconds later at a different instant, must
     still be declined. */
  const sameOfferLater = suggestionFrom(engineResult("2026-08-22T07:41:33+00:00"));
  eq(
    resolve({
      suggestion: sameOfferLater, tasks: [alkTask()], completions: [], today: TODAY,
      preference: PREFERENCE.ASK, declined, extras: [],
    }).state,
    SUGGESTION_STATE.DECLINED,
    "the same day, offered again at a new instant, is still declined"
  );

  const resolved = resolve({
    suggestion, tasks: [alkTask()], completions: [], today: TODAY,
    preference: PREFERENCE.ASK, declined, extras: [],
  });
  eq(resolved.state, SUGGESTION_STATE.DECLINED, "and it is not asked again");

  /* A LATER suggestion, at a different instant, is a different offer and IS
     asked. Declining once must not silence the engine for good. */
  const later = suggestionFrom(engineResult("2026-08-26T07:40:00+00:00"));
  const next = resolve({
    suggestion: later, tasks: [alkTask()], completions: [], today: TODAY,
    preference: PREFERENCE.ASK, declined, extras: [],
  });
  eq(next.state, SUGGESTION_STATE.ASK, "a new offer is a new question");
});

/* -------------------------------------------------------------------------
   RULED OUT: rescheduling the suggestion as though it were a keeper task.
   ---------------------------------------------------------------------- */

s.test("SUG-14", "there is no way to move a suggestion — the module exposes none", async () => {
  const mod = await import("../../app/src/store/suggestion.js");
  const movers = Object.keys(mod).filter((k) => /resched|move|nudge|adjust|postpone|snooze/i.test(k));
  deepEq(movers, [], "no function here moves a suggestion");

  /* The two things a keeper can do with it, and nothing else that writes. */
  ok(typeof mod.applyReplace === "function", "replace");
  ok(typeof mod.applyAddExtra === "function", "add as an extra");
  ok(typeof mod.decline === "function", "decline");
});

/* -------------------------------------------------------------------------
   The app's own asks expire.
   ---------------------------------------------------------------------- */

s.test("SUG-15", "an unanswered ask expires quietly rather than sitting there forever", () => {
  const raisedOn = "2026-08-01";
  ok(askIsLive({ raisedOn }, "2026-08-01"), "live on the day it was raised");
  ok(askIsLive({ raisedOn }, "2026-08-14"), "live a fortnight later");
  ok(!askIsLive({ raisedOn }, "2026-08-16"), "gone after that");
  ok(!askIsLive(null, "2026-08-16"), "nothing is not an ask");
  ok(!askIsLive({}, "2026-08-16"), "and neither is an ask with no date");
  eq(APP_ASK_EXPIRY_DAYS, 14, "the interval is stated, not scattered");
});

s.test("SUG-16", "an extra that was never done stops being shown once it has aged out", () => {
  const old = [{ id: "ALK|2026-07-01", parameter: "ALK", date: "2026-07-01" }];
  eq(outstandingExtras(old, [], TODAY).length, 0, "an extra from seven weeks ago is gone");

  const recent = [{ id: "ALK|2026-08-18", parameter: "ALK", date: "2026-08-18" }];
  eq(outstandingExtras(recent, [], TODAY).length, 1, "a recent one is still outstanding");
});

s.test("SUG-17", "an accepted offer is applied ONCE, not once per app launch", async () => {
  /* THE DEFECT. A stored REPLACE preference re-applied on every reassessment,
     and `applyReplace` ADDS its shift to whatever is already on the task. So
     each launch pushed the keeper's own alkalinity test further out, and
     because the engine recomputes the suggested instant from the current
     `asOf`, the target moved too. A test nudged forward on every launch never
     comes due — the app quietly cancels the thing it exists to remind them
     about. */
  const store = createMemoryStore();
  const task = alkTask();
  await store.tasks.saveTask(task);
  const suggestion = suggestionFrom(engineResult());

  const first = resolve({
    suggestion, tasks: [task], completions: [], today: TODAY,
    preference: PREFERENCE.REPLACE, declined: [], extras: [], applied: [],
  });
  eq(first.state, SUGGESTION_STATE.APPLIED_BY_PREFERENCE, "the stored preference applies it");
  await applyReplace(store, first);

  const afterOnce = (await store.tasks.tasks())[0].adjustDays;
  deepEq(await readApplied(store), ["ALK|2026-08-22"], "the offer is recorded as applied");

  /* Open the app again. Same offer, same preference. */
  const second = resolve({
    suggestion, tasks: await store.tasks.tasks(), completions: [], today: TODAY,
    preference: PREFERENCE.REPLACE, declined: [], extras: [],
    applied: await readApplied(store),
  });
  eq(second.state, SUGGESTION_STATE.ALREADY_SCHEDULED, "the second time there is nothing to do");
  eq(second.appliedEarlier, true, "and it says why");

  /* And nothing moved. This is the assertion that would have caught it: the
     shift after two resolutions equals the shift after one. */
  eq((await store.tasks.tasks())[0].adjustDays, afterOnce, "the keeper's test did not move again");
});

export default s;
