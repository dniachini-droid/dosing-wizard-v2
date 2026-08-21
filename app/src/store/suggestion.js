/* ============================================================================
   THE ENGINE'S SUGGESTED TEST
   ----------------------------------------------------------------------------
   Implements `docs/implementation/app/TASKS-AND-SCHEDULING.md`, the owner's
   approved scheduling design of 21 August 2026.

   The rule the whole module exists to hold:

     THE KEEPER'S SCHEDULE IS THEIRS. THE ENGINE NEVER CHANGES IT.

   Separately, after a dose change the engine works out when a test would be
   informative and OFFERS it. The keeper decides how it fits — replace their
   next scheduled test, or add it as an extra. Nothing here writes to their
   schedule unless they said so.

   FOUR KINDS OF ITEM, ONE LIST
   ----------------------------

   The specification's table, which `present/attention.js` renders into one
   ranked list:

     yours          a chore. Tick to complete.
     your test      opens the reading entry; logging the reading completes it.
     the app's ask  doing the thing resolves it. Never ticked by hand, and it
                    EXPIRES quietly rather than sitting there forever.
     the app's      accept or decline. Never rescheduled, because moving it
     suggested test would change what it was for.

   WHAT THIS RULES OUT, AND THE CODE THAT RULES IT OUT
   ---------------------------------------------------

   - The engine silently moving a keeper's scheduled test. `resolve()` returns
     an intent; only `applyReplace()` writes, and only the keeper calls it.
   - Rescheduling the suggestion as though it were a keeper task. There is no
     function here that moves one.
   - Inferring a preference from behaviour. `PREFERENCE` is written only by
     `rememberPreference()`, which the checkbox calls and nothing else does.
   - A prompt that explains the reasoning inline. `whySelected()` is a separate
     read, for a separate view, one tap away.
   ========================================================================= */

import { addDays, daysBetween, todayLocal } from "./time.js";
import { TASK_KIND, taskState } from "./schedule.js";
import { KV } from "./db.js";
import { isAbsent } from "../present/cards.js";

/* How long one of the app's own asks sits in the list before it expires.

   NOT A CHEMISTRY CONSTANT, and it is worth saying why it is allowed to be
   here. The specification says an unacted ask "expires quietly after a
   reasonable interval and the app treats the underlying state as unconfirmed,
   which it already handles". Unconfirmed is what the engine already sees
   before the ask and after it; expiring changes nothing the engine reads. It
   decides only how long a row stays on a screen, which is a product interval
   and not a rule about alkalinity. */
export const APP_ASK_EXPIRY_DAYS = 14;

/* The keeper's stored answer to "how should a suggested test be scheduled?".
   Opt-in, explicit, and only ever written by the checkbox. */
export const PREFERENCE = Object.freeze({
  ASK: "ASK",
  REPLACE: "REPLACE",
  ADD_EXTRA: "ADD_EXTRA",
});

const PREFERENCE_KEY = "suggestedTestPreference";
const DECLINED_KEY = "declinedSuggestions";
const EXTRAS_KEY = "extraTests";

/* --- reading the engine's suggestion ------------------------------------
   The suggestion IS the engine's retest output. Nothing here decides a date. */
export function suggestionFrom(engineResult) {
  const rt = engineResult?.retest;
  const at = rt?.recommendedAt;
  if (typeof at !== "string") return null;
  /* A refusal is not a suggestion. Testing for a "T" is not enough — the
     contract's own `NOT_RUN` contains one, which is exactly the kind of thing
     a shape test catches and a substring test does not. */
  if (isAbsent(at) || Number.isNaN(Date.parse(at))) return null;
  return Object.freeze({
    parameter: "ALK",
    at,
    date: at.slice(0, 10),
    reasonCode: rt.selectedReasonCode || rt.reasonCode || null,
    earliestUsefulAt: typeof rt.earliestUsefulAt === "string" ? rt.earliestUsefulAt : null,
  });
}

/* --- what to show ---------------------------------------------------------

   Four outcomes, and which one applies is decided from the keeper's own
   schedule and their own stored preference. No chemistry enters. */
export const SUGGESTION_STATE = Object.freeze({
  NONE: "NONE",
  ALREADY_SCHEDULED: "ALREADY_SCHEDULED",
  ASK: "ASK",
  APPLIED_BY_PREFERENCE: "APPLIED_BY_PREFERENCE",
  DECLINED: "DECLINED",
});

export function resolve({ suggestion, tasks, completions, today, preference, declined, extras }) {
  if (!suggestion) return { state: SUGGESTION_STATE.NONE };
  const day = today || todayLocal();

  if ((declined || []).includes(suggestion.at)) {
    return { state: SUGGESTION_STATE.DECLINED, suggestion };
  }

  const alkTask = (tasks || []).find(
    (t) => t.enabled !== false && t.kind === TASK_KIND.TEST && t.parameter === suggestion.parameter
  );
  const scheduledDate = alkTask ? taskState(alkTask, completions || [], day).due : null;

  /* "That's already your scheduled test day. Nothing to change." Also true
     when the keeper has already added it as an extra. */
  const alreadyExtra = (extras || []).some(
    (e) => e.parameter === suggestion.parameter && e.date === suggestion.date
  );
  if (scheduledDate === suggestion.date || alreadyExtra) {
    return { state: SUGGESTION_STATE.ALREADY_SCHEDULED, suggestion, alkTask, scheduledDate };
  }

  if (preference === PREFERENCE.REPLACE || preference === PREFERENCE.ADD_EXTRA) {
    return {
      state: SUGGESTION_STATE.APPLIED_BY_PREFERENCE,
      suggestion,
      alkTask,
      scheduledDate,
      preference,
    };
  }

  return { state: SUGGESTION_STATE.ASK, suggestion, alkTask, scheduledDate };
}

/* --- the two ways the keeper can take it --------------------------------

   REPLACE is the recommended one, and the specification says why: it gets the
   same information without asking for an extra test, and completion-anchored
   scheduling right-sizes everything afterwards.

   Neither of these functions is called by anything but a keeper action. */

function lastCompletionOf(task, completions) {
  const done = (completions || [])
    .filter((c) => c.taskId === task.id)
    .map((c) => c.date)
    .sort();
  return done.length ? done[done.length - 1] : null;
}

export async function applyReplace(store, { suggestion, alkTask, scheduledDate, today }) {
  if (!alkTask) {
    /* No test task of their own to replace. Adding it is the only thing
       "replace" can mean, and it changes nothing they had set. */
    return applyAddExtra(store, { suggestion });
  }
  const day = today || todayLocal();
  const current = scheduledDate ?? taskState(alkTask, await store.tasks.completions(), day).due;
  const shift = daysBetween(current, suggestion.date);
  const completions = await store.tasks.completions();
  await store.tasks.saveTask({
    ...alkTask,
    adjustDays: (alkTask.adjustDays || 0) + shift,
    /* The completion the nudge was made against. Once the keeper tests again,
       `lastDone` moves past this and the nudge stops applying — which is what
       "a nudge moves only the next occurrence" means. Without it the shift
       persists into every later occurrence and permanently skews the rhythm. */
    adjustAnchor: lastCompletionOf(alkTask, completions),
  });
  await recordAccepted(store, suggestion, PREFERENCE.REPLACE);
  return { applied: PREFERENCE.REPLACE, movedFrom: current, movedTo: suggestion.date };
}

export async function applyAddExtra(store, { suggestion }) {
  const extras = await readExtras(store);
  const id = `${suggestion.parameter}|${suggestion.date}`;
  if (!extras.some((e) => e.id === id)) {
    extras.push({
      id,
      parameter: suggestion.parameter,
      date: suggestion.date,
      at: suggestion.at,
      reasonCode: suggestion.reasonCode,
      source: "ENGINE_SUGGESTION",
      addedAt: new Date().toISOString(),
    });
    await store.kvSet(EXTRAS_KEY, extras);
  }
  await recordAccepted(store, suggestion, PREFERENCE.ADD_EXTRA);
  return { applied: PREFERENCE.ADD_EXTRA, date: suggestion.date };
}

export async function decline(store, suggestion) {
  const declined = (await store.kvGet(DECLINED_KEY)) || [];
  if (!declined.includes(suggestion.at)) declined.push(suggestion.at);
  await store.kvSet(DECLINED_KEY, declined);
  return { declined: suggestion.at };
}

async function recordAccepted(store, suggestion, how) {
  await store.kvSet("lastAcceptedSuggestion", { at: suggestion.at, how, on: new Date().toISOString() });
}

/* --- the preference ------------------------------------------------------
   Opt-in and explicit. The app never infers it from repeated taps, which is
   why there is no counter anywhere in this module and no call site that writes
   it except the checkbox. */

export async function readPreference(store) {
  const p = await store.kvGet(PREFERENCE_KEY);
  return p === PREFERENCE.REPLACE || p === PREFERENCE.ADD_EXTRA ? p : PREFERENCE.ASK;
}

export async function rememberPreference(store, how) {
  if (how !== PREFERENCE.REPLACE && how !== PREFERENCE.ADD_EXTRA) {
    throw new Error("only an explicit replace-or-add answer may be remembered");
  }
  await store.kvSet(PREFERENCE_KEY, how);
}

export async function forgetPreference(store) {
  await store.kvSet(PREFERENCE_KEY, PREFERENCE.ASK);
}

/* --- extra tests ---------------------------------------------------------
   A one-off occurrence, not a repeating task. It has no interval, it never
   reschedules itself, and completing it is completing a test — which happens
   by logging the reading, like every other test. */

export async function readExtras(store) {
  const list = await store.kvGet(EXTRAS_KEY);
  return Array.isArray(list) ? [...list] : [];
}

export async function clearExtra(store, id) {
  const extras = (await readExtras(store)).filter((e) => e.id !== id);
  await store.kvSet(EXTRAS_KEY, extras);
}

/* An extra is outstanding until a reading of its parameter is logged on or
   after its day. It is not "completed" separately — the reading is the
   completion, exactly as for a scheduled test. */
export function outstandingExtras(extras, projected, today) {
  const day = today || todayLocal();
  return (extras || []).filter((e) => {
    const logged = (projected || []).some(
      (r) =>
        r.state === "CURRENT" &&
        r.event.kind === "READING" &&
        r.event.parameter === e.parameter &&
        r.event.time.localDate >= e.date
    );
    return !logged && e.date >= addDays(day, -APP_ASK_EXPIRY_DAYS);
  });
}

/* --- the app's own asks --------------------------------------------------
   "An app ask that is never acted on must not sit in the list forever. It
   expires quietly after a reasonable interval and the app treats the
   underlying state as unconfirmed, which it already handles."

   Quietly is the operative word: nothing is announced, nothing is written, and
   the engine's view does not change. The row simply stops appearing. */
export function askIsLive(ask, today) {
  if (!ask || !ask.raisedOn) return false;
  return daysBetween(ask.raisedOn, today || todayLocal()) <= APP_ASK_EXPIRY_DAYS;
}

export { KV };
