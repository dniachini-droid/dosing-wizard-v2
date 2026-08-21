/* ============================================================================
   THE RANKED LIST ON TODAY
   ----------------------------------------------------------------------------
   One list: due tests, due tasks and the alkalinity assessment together,
   ordered by what matters most.

   AN HONEST NOTE ABOUT WHERE THE ORDER COMES FROM
   -----------------------------------------------

   The brief says the order comes from the engine. It cannot come entirely from
   the engine, and pretending otherwise would put a false caption on the screen
   — which is what `mockups/CONTRACT-GAPS.md` gap 2 already records:

     "`EngineResult` has no ordering field for anything user-facing. ... So the
     list has no owner. The mockups render rank numbers and a caption claiming
     the engine supplied them. That caption is currently false."

   Gap 17 adds that a due water change and an assessment item "come from
   different places and share no scale".

   So here is exactly what this module does and does not do, stated rather than
   blurred:

     - The SEVERITY of anything the engine said comes from the engine. Every
       reason code carries a catalogued `severity`, and the card class comes
       from `cards.js` reading engine fields. Nothing here re-derives either.

     - The RANK BETWEEN CLASSES is a product ordering declared as data in the
       table below. It is not chemistry: it says a safety return outranks a due
       water change, which is a statement about attention, not about
       alkalinity. It asserts no threshold, no band edge and no cadence.

     - Within a class, ties break on how overdue something is — calendar
       arithmetic over dates the KEEPER set, not over anything the engine
       decided.

   The screen says this in plain words rather than claiming an authority the
   contract does not grant. Gaps 2 and 17 stay open; this is not a resolution
   of them and is not recorded as one.
   ========================================================================= */

import { selectCard } from "./cards.js";

/* The declared order. Data, in one place, editable without touching code that
   walks it. `why` is a strings key: the explanation the keeper reads lives in
   the strings file like every other sentence. */
export const ATTENTION_RANKS = Object.freeze([
  { class: "SAFETY", rank: 100, why: "rank.SAFETY" },
  { class: "ASSESSMENT_ACTION", rank: 200, why: "rank.ASSESSMENT_ACTION" },
  { class: "CONFIRMATION_PENDING", rank: 300, why: "rank.CONFIRMATION_PENDING" },
  { class: "OVERDUE_TEST", rank: 400, why: "rank.OVERDUE_TEST" },
  { class: "DUE_TEST", rank: 500, why: "rank.DUE_TEST" },
  { class: "SUGGESTED_TEST", rank: 550, why: "rank.SUGGESTED_TEST" },
  { class: "EXTRA_TEST", rank: 560, why: "rank.EXTRA_TEST" },
  { class: "OVERDUE_TASK", rank: 600, why: "rank.OVERDUE_TASK" },
  { class: "DUE_TASK", rank: 700, why: "rank.DUE_TASK" },
  { class: "ASSESSMENT_BLOCKED", rank: 800, why: "rank.ASSESSMENT_BLOCKED" },
  { class: "RECORD_QUALITY", rank: 900, why: "rank.RECORD_QUALITY" },
]);

const rankOf = (cls) => ATTENTION_RANKS.find((r) => r.class === cls)?.rank ?? 9999;

/* Build the list. Everything passed in has already been decided elsewhere:
   `engineResult` by the engine, `schedule` by the completion-anchored
   scheduler, `pendingConfirmation` by whether an event exists. This function
   places them in an order and does nothing else. */
export function buildAttention({
  engineResult,
  schedule,
  pendingConfirmation,
  recordNotices,
  suggestion,
  extras,
}) {
  const items = [];

  if (engineResult) {
    const card = selectCard(engineResult);

    if (card === "SAFETY_RETURN") {
      items.push({ cls: "SAFETY", kind: "assessment", card, engineResult });
    } else if (card === "DOSE_CHANGE") {
      items.push({ cls: "ASSESSMENT_ACTION", kind: "assessment", card, engineResult });
    } else if (card === "INSUFFICIENT" || card === "CAPABILITY_REFUSAL" || card === "UNCLASSIFIED") {
      items.push({ cls: "ASSESSMENT_BLOCKED", kind: "assessment", card, engineResult });
    } else {
      /* HOLD, UNCERTAINTY_LIMITED, NOT_ATTRIBUTABLE_SMALL_SIGNAL — all full
         recommendations, all worth the keeper's attention, none of them an
         action to take right now. They sit where a recommendation sits. */
      items.push({ cls: "ASSESSMENT_ACTION", kind: "assessment", card, engineResult });
    }
  }

  if (pendingConfirmation) {
    items.push({ cls: "CONFIRMATION_PENDING", kind: "confirmation", detail: pendingConfirmation });
  }

  /* THE APP'S SUGGESTED TEST. One of the four kinds
     `docs/implementation/app/TASKS-AND-SCHEDULING.md` names; it differs from
     the others in what tapping it does, not in where it lives. */
  if (suggestion) {
    items.push({ cls: "SUGGESTED_TEST", kind: "suggestion", detail: suggestion });
  }

  /* AN EXTRA TEST the keeper accepted. A one-off occurrence, ranked with the
     due tests because that is what it is. */
  for (const e of extras || []) {
    items.push({ cls: "EXTRA_TEST", kind: "extra", detail: e });
  }

  for (const st of schedule?.overdue || []) {
    items.push({
      cls: st.task.kind === "TEST" ? "OVERDUE_TEST" : "OVERDUE_TASK",
      kind: "task",
      state: st,
    });
  }
  for (const st of schedule?.dueToday || []) {
    items.push({
      cls: st.task.kind === "TEST" ? "DUE_TEST" : "DUE_TASK",
      kind: "task",
      state: st,
    });
  }

  for (const n of recordNotices || []) {
    items.push({ cls: "RECORD_QUALITY", kind: "record", detail: n });
  }

  return items
    .map((it, i) => ({ ...it, rank: rankOf(it.cls), seq: i }))
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        /* Within a class: the more overdue first. Calendar arithmetic over the
           keeper's own dates. */
        (a.state?.daysOut ?? 0) - (b.state?.daysOut ?? 0) ||
        a.seq - b.seq
    );
}
