/* ============================================================================
   TODAY
   ----------------------------------------------------------------------------
   One ranked list — due tests, due tasks and the alkalinity assessment
   together — and a stepper over the days.

   The stepper's three states are different screens, not one screen with a
   different date:

     forward   what is DUE. No assessment: the engine has not been asked about
               a day that has not happened, and showing today's answer under
               tomorrow's date would be a lie about when it was worked out.
     today     everything, including the assessment.
     back      what was DONE. The assessment shown is the one that was STORED
               that day, replayed from the record — not today's engine run
               dressed in an old date.

   That last point is why assessments are stored records. A live view would
   show what the engine thinks NOW under a heading that says three weeks ago.
   ========================================================================= */

import { h } from "../ui/dom.js";
import { addDays, daysBetween, hasExactInstant, todayLocal } from "../store/time.js";
import { fmtDayName, fmtRelative, fmtShort, fmtTimeOfDay } from "../ui/format.js";
import { buildAttention } from "../present/attention.js";
import { computeSchedule } from "../store/schedule.js";
import { renderAssessment, renderDeveloperView } from "./assessment.js";
import { logReading, timeControl } from "./entry.js";
import { parameterDefs, parameterDef, KIND } from "../store/ledger.js";
import { instructsDoseChange, isPresent, selectCard } from "../present/cards.js";
import { sayCapability, sayParameterMid, num } from "../present/wording.js";
import { t } from "../strings.js";
import { ENGINE_STATE } from "../engine/client.js";
import { SUGGESTION_STATE, outstandingExtras, askIsLive } from "../store/suggestion.js";

export async function renderToday(ctx) {
  const { store, state } = ctx;
  const today = todayLocal();
  const day = state.stepperDay || today;
  const offset = daysBetween(today, day);

  const [projected, tasks, completions, config, assessmentsForDay, latestAssessment] = await Promise.all([
    store.ledger.projection(),
    store.tasks.tasks(),
    store.tasks.completions(),
    store.config.current(),
    store.assessments.forDay(day),
    store.assessments.latest(),
  ]);

  const schedule = computeSchedule(tasks, completions, day);
  const screen = h("main", { class: "screen" });

  screen.append(
    h(
      "header",
      { class: "topbar with-gear" },
      h(
        "div",
        null,
        h("h1", null, t("today.title")),
        h("p", { class: "sub" }, subtitle(config, latestAssessment))
      ),
      h(
        "button",
        { class: "gear", type: "button", "aria-label": t("action.settings"), onclick: () => ctx.go("settings") },
        "⚙"
      )
    )
  );

  /* --- the day stepper -------------------------------------------------- */
  screen.append(
    h(
      "nav",
      { class: "stepper", "aria-label": t("today.stepper.aria") },
      h(
        "button",
        { class: "arrow", type: "button", "aria-label": t("today.stepper.back"), onclick: () => ctx.setDay(addDays(day, -1)) },
        "‹"
      ),
      h(
        "span",
        { class: "when" },
        h("span", { class: "d" }, fmtDayName(day)),
        h("span", { class: "r" }, offset === 0 ? t("today.stepper.today") : fmtRelative(day, today))
      ),
      h(
        "button",
        { class: "arrow", type: "button", "aria-label": t("today.stepper.forward"), onclick: () => ctx.setDay(addDays(day, 1)) },
        "›"
      )
    )
  );

  if (!config) {
    screen.append(renderSetupNeeded(ctx));
    return screen;
  }

  /* --- past, future, today ---------------------------------------------- */
  if (offset > 0) {
    screen.append(renderDayAhead(schedule, day));
    return screen;
  }
  if (offset < 0) {
    screen.append(await renderDayPast(store, day, assessmentsForDay, projected));
    return screen;
  }

  /* --- today ------------------------------------------------------------ */
  const engineResult = state.assessment?.engineResult || null;
  const recordNotices = buildRecordNotices(projected);
  const pendingConfirmation = findPendingConfirmation(projected, engineResult, today, state.doseAsks);
  /* The four kinds the specification names, gathered here and ordered by
     `attention.js`. The suggestion arrives already resolved against the
     keeper's own schedule; nothing on this screen resolves it. */
  const suggestion = state.suggestion;
  const extras = outstandingExtras(state.extras, projected, today);

  const items = buildAttention({
    engineResult,
    schedule,
    pendingConfirmation,
    recordNotices,
    suggestion,
    extras,
  });

  screen.append(renderAttentionList(ctx, items, day));

  /* --- the assessment ---------------------------------------------------- */
  if (state.storage && state.storage.ok === false) {
    /* Ahead of the engine states, because it is a different failure with a
       different remedy, and because the one thing that must never appear here
       is a confident assessment computed from records that could not be
       read. */
    screen.append(renderStorageFailed(state.storage.reason));
  } else if (state.engine.state === ENGINE_STATE.FAILED) {
    screen.append(renderEngineFailed(state.engine.error));
  } else if (!engineResult) {
    screen.append(renderEngineStarting(state.engine.state));
  } else {
    const readings = alkTrace(projected, engineResult);
    screen.append(
      renderAssessment(engineResult, {
        readings,
        config,
        onOpenDetail: () => ctx.go("assessment-detail"),
      })
    );
    screen.append(renderDeveloperView(engineResult, state.assessment.record));
  }

  /* --- logged-only parameters ------------------------------------------- */
  screen.append(h("p", { class: "seclabel" }, t("today.inert.label")), renderInertTiles(ctx, projected));

  return screen;
}

function subtitle(config, latest) {
  const parts = [];
  if (config?.netVolumeL != null) parts.push(t("today.subtitle.volume", { volume: config.netVolumeL }));
  if (latest?.asOf) {
    /* A TIME ON ITS OWN IS ONLY HONEST IF IT IS TODAY'S.

       This showed the time of day and nothing else, whatever day the
       assessment was from. So when the engine failed to start — no network for
       the runtime, an offline cold cache — the header read "assessed 08:05"
       beside a card saying the engine could not run, and 08:05 was three days
       ago. A stale answer presented as a current one, at exactly the moment
       something else had already gone wrong. */
    const day = latest.asOf.slice(0, 10);
    parts.push(
      day === todayLocal()
        ? t("today.subtitle.assessed", { time: fmtTimeOfDay(latest.asOf) })
        : t("today.subtitle.assessedOn", { when: fmtShort(day), time: fmtTimeOfDay(latest.asOf) })
    );
  }
  return parts.length ? t("today.subtitle.join", { parts }) : t("today.subtitle.none");
}

/* --- the ranked list ----------------------------------------------------- */

function renderAttentionList(ctx, items, day) {
  const card = h("section", { class: "card" });
  card.append(
    h(
      "div",
      { class: "card-head" },
      h("h2", null, t("today.attention.title")),
      h(
        "span",
        { class: "aside" },
        items.length ? t("today.attention.count", { n: items.length }) : t("today.attention.none")
      )
    )
  );

  if (!items.length) {
    card.append(
      h("p", { class: "body" }, t("today.attention.empty")),
      h("p", { class: "inert-note" }, t("today.attention.emptyNote"))
    );
    return card;
  }

  const list = h("ul", { class: "attention-list" });
  items.forEach((it, i) => {
    list.append(h("li", null, renderAttentionItem(ctx, it, i + 1, day)));
  });
  card.append(list);
  card.append(
    h(
      "p",
      { class: "inert-note" },
      t("today.attention.note")
    )
  );
  return card;
}

function renderAttentionItem(ctx, it, rank, day) {
  if (it.kind === "task") return renderTaskItem(ctx, it, rank, day);
  if (it.kind === "confirmation") return renderConfirmationItem(ctx, it, rank);
  if (it.kind === "suggestion") return renderSuggestionItem(ctx, it, rank);
  if (it.kind === "extra") return renderExtraItem(ctx, it, rank, day);
  if (it.kind === "record") return renderRecordItem(ctx, it, rank);
  return renderAssessmentItem(ctx, it, rank);
}

function itemHead(rank, title, detail, chev) {
  return [
    h("span", { class: "rank" }, String(rank)),
    h("span", null, h("span", { class: "t" }, title), h("span", { class: "d" }, detail)),
    chev ? h("span", { class: "chev" }) : null,
  ];
}

function renderAssessmentItem(ctx, it, rank) {
  const r = it.engineResult;
  const d = r.doseRecommendation || {};
  const card = selectCard(r);
  let title, detail;

  /* WHY THE ACTION IS TESTED AND NOT THE PRESENCE OF A DOSE
     -------------------------------------------------------
     `recommendedDoseMlPerDay` is PRESENT on results that recommend no change
     at all. Canon puts `D_current` in that field on the insufficient,
     confounded, anomalous, uncertainty-limited and stable branches
     (`dosing.py:386-388, 393-395, 400-402, 436-438, 446-448`) so the card can
     say what it is holding AGAINST. It is a statement of the standing dose,
     not an instruction.

     An earlier version of this function tested `isPresent(recommendedDose)`
     first, and so told the keeper to "set the maintenance dose to 12.0
     mL/day, up 0.0 from 12.0" on a hold, and to set a dose on a day whose own
     assessment card said there was not enough evidence to size one. Reading a
     standing value as a command is `PRC-005`'s second clause exactly.

     `SET_MAINTENANCE_DOSE` is the one action that means "change it". */
  const instructsChange = instructsDoseChange(r);

  if (card === "SAFETY_RETURN") {
    title = t("today.item.safety.title");
    detail = t("today.item.safety.detail");
  } else if (instructsChange) {
    title = t("today.item.dose.title", { dose: num(d.recommendedDoseMlPerDay, 1) });
    detail = isPresent(d.deltaDoseMlPerDay)
      ? t("today.item.dose.detail", {
          direction: d.deltaDoseMlPerDay >= 0 ? t("today.item.dose.up") : t("today.item.dose.down"),
          delta: num(Math.abs(d.deltaDoseMlPerDay), 1),
          from: num(d.currentDoseMlPerDay, 1),
        })
      : t("today.item.dose.detailPlain");
  } else if (card === "HOLD") {
    /* Named with the dose it is holding, because "hold" on its own does not
       tell the keeper what they are holding at. */
    title = isPresent(d.currentDoseMlPerDay)
      ? t("today.item.hold.titleAt", { dose: num(d.currentDoseMlPerDay, 1) })
      : t("today.item.hold.title");
    detail = t("today.item.hold.detail");
  } else if (card === "INSUFFICIENT") {
    title = t("today.item.insufficient.title");
    detail = nextUsefulText(r) || t("today.item.insufficient.detail");
  } else if (card === "CAPABILITY_REFUSAL") {
    title = t("today.item.refusal.title");
    detail = missingText(r);
  } else {
    title = t("today.item.generic.title");
    detail = t("today.item.generic.detail");
  }

  return h(
    "button",
    { class: "attention-item", type: "button", onclick: () => ctx.go("assessment-detail") },
    ...itemHead(rank, title, detail, false)
  );
}

function nextUsefulText(r) {
  for (const rc of r.reasonCodes || []) {
    const at = rc.payload && rc.payload.nextUsefulTestAt;
    if (at) return t("today.item.nextUseful", { date: fmtDayName(at.slice(0, 10)) });
  }
  return null;
}

function missingText(r) {
  const names = (r.capabilities || [])
    .filter((c) => c.outcome === "NOT_RUN" && c.affectedOutputs?.length)
    .map((c) => sayCapability(c.capabilityId));
  return names.length
    ? t("today.item.refusal.detail", { list: names.join("; ") })
    : t("today.item.refusal.detailPlain");
}

/* An expandable row that takes the reading IN THE ROW. V1's single best
   interaction decision: "going to another tab to type one number was the most
   repeated friction in the app." (`V1-APPLICATION-SALVAGE.md` §2.2.) */
function renderTaskItem(ctx, it, rank, day) {
  const st = it.state;
  const task = st.task;
  const det = h("details", { class: "expandable" });
  const overdue = st.status === "overdue";
  const detail = overdue
    ? t("today.task.overdue", { days: -st.daysOut, last: lastDoneText(st) })
    : t("today.task.dueToday", { last: lastDoneText(st) });

  det.append(h("summary", null, ...itemHead(rank, task.label, detail, true)));

  const body = h("div", { class: "inline-log" });

  if (task.kind === "TEST" && task.parameter) {
    const def = parameterDef(task.parameter);
    const input = h("input", {
      class: "input",
      inputmode: "decimal",
      "aria-label": def.label,
      placeholder: "",
    });
    const tc = timeControl({ initialDate: day });
    const msg = h("p", { class: "hint" });
    const btn = h(
      "button",
      {
        class: "btn btn-primary",
        type: "button",
        onclick: async () => {
          const when = tc.read();
          if (!when.ok) {
            msg.textContent = when.why;
            return;
          }
          try {
            const res = await logReading(ctx.store, {
              parameter: task.parameter,
              rawValue: input.value,
              time: when.time,
            });
            ctx.afterReading(res, def);
          } catch (e) {
            msg.textContent = e.message;
          }
        },
      },
      "Log"
    );
    body.append(
      h("div", { class: "row" }, input, h("span", { class: "suffix" }, def.unit), btn),
      tc.node,
      msg,
      h(
        "p",
        { class: "note" },
        t("today.task.readingNote")
      )
    );
  } else {
    const input = task.needsVolume
      ? h("input", { class: "input", inputmode: "decimal", "aria-label": "Volume" })
      : null;

    /* THE ALKALINITY OF THE WATER GOING IN.

       An unknown-replacement water change at or above the break fraction ends
       the analytical stretch of history (`ALK-WATERCHANGE-UNKNOWN-001`). On a
       tank of ordinary size a routine weekly change clears that, so completing
       this task week after week reset the analysis week after week — and the
       app never mentioned that measuring the new saltwater once would prevent
       it.

       The measured path already existed, at `logentry.js`'s water-change form,
       reachable only by NOT using the task the app itself put in the list. The
       keeper's own route was silently the worse one. Same fields, same
       confidence value, offered where the work actually happens. */
    const measured = task.needsVolume ? h("input", { type: "checkbox" }) : null;
    const replacement = task.needsVolume
      ? h("input", { class: "input", inputmode: "decimal", "aria-label": t("log.water.replacement") })
      : null;
    const replacementRow = task.needsVolume
      ? h(
          "div",
          { class: "field", hidden: true },
          h("span", { class: "flabel" }, t("log.water.replacement")),
          h("div", { class: "row" }, replacement, h("span", { class: "suffix" }, "dKH")),
          h("p", { class: "hint" }, t("today.task.replacementHint"))
        )
      : null;
    if (measured) {
      measured.addEventListener("change", () => {
        replacementRow.hidden = !measured.checked;
      });
    }

    const tc = timeControl({ initialDate: day });
    const msg = h("p", { class: "hint" });
    const btn = h(
      "button",
      {
        class: "btn btn-primary",
        type: "button",
        onclick: async () => {
          const when = tc.read();
          if (!when.ok) {
            msg.textContent = when.why;
            return;
          }
          let replacementDkh = null;
          if (measured && measured.checked) {
            const v = Number(replacement.value);
            if (!Number.isFinite(v)) {
              msg.textContent = t("log.water.needReplacement");
              return;
            }
            replacementDkh = v;
          }
          await ctx.completeTask(task, when.time, input ? input.value : null, replacementDkh);
        },
      },
      "Log"
    );
    body.append(
      h("div", { class: "row" }, input, input ? h("span", { class: "suffix" }, task.unit || "L") : null, btn),
      measured ? h("label", { class: "field" }, measured, t("log.water.measured")) : null,
      replacementRow,
      tc.node,
      msg,
      h(
        "p",
        { class: "note" },
        t("today.task.choreNote")
      )
    );
  }

  det.append(body);
  return det;
}

function lastDoneText(st) {
  if (!st.lastDone) return t("today.task.never");
  return t("today.task.lastDone", { date: fmtShort(st.lastDone) });
}

function renderConfirmationItem(ctx, it, rank) {
  const det = h("details", { class: "expandable" });
  det.append(
    h(
      "summary",
      null,
      ...itemHead(
        rank,
        t("today.confirm.title"),
        t("today.confirm.detail"),
        true
      )
    )
  );
  const body = h("div", { class: "inline-log" });
  const seg = h("div", { class: "seg stack-opts" });
  const OPTS = [
    ["today.confirm.yesKnown", "today.confirm.yesKnownWhy", "EXACT"],
    ["today.confirm.yesUnsure", "today.confirm.yesUnsureWhy", "UNCERTAIN"],
    ["today.confirm.no", "today.confirm.noWhy", "NOT_MADE"],
    ["today.confirm.later", "today.confirm.laterWhy", "UNKNOWN"],
  ];
  OPTS.forEach(([labelKey, whyKey, key]) => {
    const label = t(labelKey);
    const why = t(whyKey);
    seg.append(
      h(
        "button",
        { class: "opt" + (key === "UNKNOWN" ? " on" : ""), type: "button", onclick: () => ctx.confirmDose(it.detail, key) },
        label,
        h("span", { class: "oz" }, why)
      )
    );
  });
  body.append(
    seg,
    h(
      "p",
      { class: "note" },
      t("today.confirm.note")
    ),
    h("p", { class: "note" }, t("ask.expiresQuietly"))
  );
  det.append(body);
  return det;
}

/* The engine's suggested retest. It behaves differently from a scheduled task
   on purpose: it is accepted or declined, never rescheduled, and accepting it
   shows what it does to the keeper's own schedule first. */
/* THE APP'S SUGGESTED TEST. Accept or decline — never rescheduled, because
   moving it would change what it was for. Tapping it opens the prompt in
   `tasks.js`, which is where the specification's copy lives. */
function renderSuggestionItem(ctx, it, rank) {
  const resolved = it.detail;
  const s = resolved.suggestion;
  const parameter = sayParameterMid(s.parameter);
  const day = fmtDayName(s.date);

  const detail =
    resolved.state === SUGGESTION_STATE.ALREADY_SCHEDULED
      ? resolved.applied
        ? t("suggest.appliedByPreference")
        : t("suggest.alreadyScheduled", { day })
      : t("suggest.itemDetail");

  return h(
    "button",
    { class: "attention-item suggested", type: "button", onclick: () => ctx.acceptSuggestion(resolved) },
    ...itemHead(rank, t("suggest.title", { parameter, day }), detail, false)
  );
}

/* AN EXTRA TEST the keeper accepted. A one-off: it has no interval, it never
   reschedules itself, and logging the reading completes it like any other
   test. */
function renderExtraItem(ctx, it, rank, day) {
  const e = it.detail;
  const def = parameterDef(e.parameter);
  const det = h("details", { class: "expandable suggested" });
  det.append(
    h(
      "summary",
      null,
      ...itemHead(
        rank,
        t("extra.label", { parameter: sayParameterMid(e.parameter) }),
        t("extra.detail", { day: fmtDayName(e.date) }),
        true
      )
    )
  );

  const input = h("input", { class: "input", inputmode: "decimal", "aria-label": def.label });
  const tc = timeControl({ initialDate: day });
  const msg = h("p", { class: "hint" });
  det.append(
    h(
      "div",
      { class: "inline-log" },
      h(
        "div",
        { class: "row" },
        input,
        h("span", { class: "suffix" }, def.unit),
        h(
          "button",
          {
            class: "btn btn-primary",
            type: "button",
            onclick: async () => {
              const when = tc.read();
              if (!when.ok) {
                msg.textContent = when.why;
                return;
              }
              try {
                const res = await logReading(ctx.store, {
                  parameter: e.parameter,
                  rawValue: input.value,
                  time: when.time,
                });
                ctx.afterReading(res, def);
              } catch (err) {
                msg.textContent = err.message;
              }
            },
          },
          t("action.log")
        )
      ),
      tc.node,
      msg,
      h("p", { class: "note" }, t("today.task.readingNote"))
    )
  );
  return det;
}

function renderRecordItem(ctx, it, rank) {
  return h(
    "button",
    {
      class: "attention-item",
      type: "button",
      onclick: () => ctx.openEntry(it.detail.eventId),
    },
    ...itemHead(rank, it.detail.title, it.detail.detail, false)
  );
}

/* --- forward and back ---------------------------------------------------- */

function renderDayAhead(schedule, day) {
  const card = h("section", { class: "card" });
  card.append(h("div", { class: "card-head" }, h("h2", null, t("today.ahead.title"))));
  const due = schedule.states.filter((s) => s.due === day);
  if (!due.length) {
    card.append(h("p", { class: "body" }, t("today.ahead.empty")));
  } else {
    const list = h("ul", { class: "tasklist" });
    due.forEach((st) =>
      list.append(
        h(
          "li",
          null,
          h(
            "span",
            { class: "taskrow" },
            h("span", { class: "tick" }, ""),
            h("span", null, h("span", { class: "t" }, st.task.label), h("span", { class: "d" }, t("today.ahead.scheduled")))
          )
        )
      )
    );
    card.append(list);
  }
  card.append(
    h(
      "p",
      { class: "inert-note" },
      t("today.ahead.note")
    )
  );
  return card;
}

async function renderDayPast(store, day, assessmentsForDay, projected) {
  const frag = h("div");

  const card = h("section", { class: "card" });
  card.append(h("div", { class: "card-head" }, h("h2", null, t("today.past.title"))));
  const rows = projected.filter((r) => r.event.time.localDate === day);
  if (!rows.length) {
    card.append(h("p", { class: "body" }, t("today.past.empty")));
  } else {
    const list = h("ul", { class: "tasklist" });
    rows.forEach((r) => {
      const def = r.event.parameter ? parameterDef(r.event.parameter) : null;
      const value =
        r.event.kind === KIND.READING && def
          ? `${r.event.rawValue} ${def.unit}`
          : eventWords(r.event);
      list.append(
        h(
          "li",
          null,
          h(
            "span",
            { class: "taskrow" + (r.state !== "CURRENT" ? " is-replaced" : "") },
            h("span", { class: "tick done" }, "✓"),
            h(
              "span",
              null,
              h("span", { class: "t" }, def ? def.label : eventWords(r.event)),
              h("span", { class: "d" }, value + (r.state !== "CURRENT" ? ` · ${stateWords(r.state)}` : ""))
            )
          )
        )
      );
    });
    card.append(list);
  }
  frag.append(card);

  const past = h("section", { class: "card" });
  past.append(h("div", { class: "card-head" }, h("h2", null, t("today.past.assessTitle"))));
  if (!assessmentsForDay.length) {
    past.append(
      h("p", { class: "body" }, t("today.past.assessEmpty")),
      h("p", { class: "inert-note" }, t("today.past.assessEmptyNote"))
    );
  } else {
    for (const rec of assessmentsForDay) {
      const d = rec.engineResult.doseRecommendation || {};
      past.append(
        h(
          "div",
          { class: "kv" },
          h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("today.past.savedAt")), h("span", { class: "kv-v" }, fmtTimeOfDay(rec.asOf))),
          h(
            "div",
            { class: "kv-row" },
            h("span", { class: "kv-k" }, t("today.past.itSaid")),
            h(
              "span",
              { class: "kv-v" },
              /* Same rule as the live row above: only `SET_MAINTENANCE_DOSE`
                 is a change. A stored hold said "hold", however present its
                 dose field is. */
              instructsDoseChange(r)
                ? t("today.past.saidDose", { dose: num(d.recommendedDoseMlPerDay, 1) })
                : d.action === "HOLD_CURRENT_DOSE"
                  ? t("today.past.saidHold")
                  : t("today.past.saidNothing")
            )
          ),
          h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("today.past.engine")), h("span", { class: "kv-v" }, rec.engineVersion || "—")),
          h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("today.past.canon")), h("span", { class: "kv-v" }, rec.canonVersion || "—")),
          h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("today.past.settings")), h("span", { class: "kv-v" }, rec.configVersionId || "—"))
        )
      );
    }
    past.append(
      h(
        "p",
        { class: "inert-note" },
        t("today.past.note")
      )
    );
  }
  frag.append(past);
  return frag;
}

function stateWords(s) {
  return {
    SUPERSEDED: t("today.state.superseded"),
    SUSPECT: t("today.state.suspect"),
    INVALID: t("today.state.invalid"),
  }[s] || "";
}

function eventWords(e) {
  return {
    READING: t("log.event.reading"),
    DOSE_STATE: t("log.event.doseState"),
    DOSE_CHANGE: t("log.event.doseChange"),
    WATER_CHANGE: t("log.event.waterChange"),
    MANUAL_CORRECTION: t("log.event.manual"),
    DELIVERY_ANOMALY: t("log.event.anomaly"),
    CONSUMPTION_CONTEXT_EVENT: t("log.event.context"),
    ICP_PANEL: t("log.event.icp"),
    HUSBANDRY: t("log.event.husbandry"),
    NOTE: t("log.event.note"),
  }[e.kind] || e.kind;
}

/* --- storage as a designed state ------------------------------------------

   A read that fails is not an empty tank, and it is not an engine fault. It
   gets its own panel saying so, because the two have different remedies and
   sending the keeper to the wrong one wastes their evening. */
function renderStorageFailed(reason) {
  return h(
    "section",
    { class: "card is-attention" },
    h("div", { class: "card-head" }, h("h2", null, t("today.storage.title"))),
    h("div", { class: "card-body" },
      h("p", null, t("today.storage.body")),
      h("p", null, t("today.storage.safe")),
      reason ? h("p", { class: "meta" }, t("today.storage.what", { reason })) : null
    )
  );
}

/* --- engine states as designed states ------------------------------------ */

function renderEngineStarting(state) {
  const card = h("section", { class: "card" });
  card.append(
    h(
      "div",
      { class: "card-head" },
      h("span", { class: "pmark p-alk" }, t("assessment.mark")),
      h("h2", null, t("today.engine.startingTitle"))
    ),
    h(
      "p",
      { class: "body" },
      state === ENGINE_STATE.STARTING ? t("today.engine.starting") : t("today.engine.notRun")
    ),
    h("p", { class: "inert-note" }, t("today.engine.startingNote"))
  );
  return card;
}

function renderEngineFailed(error) {
  const card = h("section", { class: "card" });
  card.append(
    h(
      "div",
      { class: "card-head" },
      h("span", { class: "pmark p-alk" }, t("assessment.mark")),
      h("h2", null, t("today.engine.startingTitle"))
    ),
    h(
      "div",
      { class: "callout safety" },
      h("p", null, t("today.engine.failed")),
      h("p", null, t("today.engine.failedSafe")),
      error ? h("p", { class: "meta" }, t("today.engine.failedWhat", { error })) : null
    ),
    h("p", { class: "inert-note" }, t("today.engine.failedNote"))
  );
  return card;
}

function renderSetupNeeded(ctx) {
  const card = h("section", { class: "card" });
  card.append(
    h("div", { class: "card-head" }, h("h2", null, t("today.setup.title"))),
    h("p", { class: "body" }, t("today.setup.body")),
    h(
      "button",
      { class: "btn btn-primary", type: "button", onclick: () => ctx.go("setup") },
      t("today.setup.action")
    )
  );
  return card;
}

/* --- inert parameters ---------------------------------------------------
   A visibly different class of card: value, date, chart. No status, no range
   position, no notice — because there is no engine for them and the app will
   not imply one. */
function renderInertTiles(ctx, projected) {
  const card = h("section", { class: "card" });
  const grid = h("div", { class: "tilegrid" });

  for (const def of parameterDefs().filter((p) => !p.assessed)) {
    const rows = projected
      .filter((r) => r.state === "CURRENT" && r.event.kind === KIND.READING && r.event.parameter === def.key)
      .map((r) => ({ date: r.event.time.localDate, value: r.event.normalizedValue }));
    const last = rows[rows.length - 1];
    grid.append(
      h(
        "button",
        { class: "tile", type: "button", onclick: () => ctx.go("history", { parameter: def.key }) },
        h(
          "span",
          { class: "name", style: { color: `var(--${def.tone})` } },
          h("span", { class: "dot", style: { background: `var(--${def.tone})` } }),
          def.label
        ),
        h(
          "span",
          { class: "n" },
          last ? last.value.toFixed(def.decimals) : "—",
          h("span", { class: "unit" }, def.unit)
        ),
        h("span", { class: "when" }, last ? fmtShort(last.date) : t("today.inert.never")),
        rows.length >= 3 ? sparkline(rows, def) : h("span", { class: "sparkgap" })
      )
    );
  }
  card.append(grid);
  card.append(
    h(
      "p",
      { class: "inert-note" },
      t("today.inert.note")
    )
  );
  return card;
}

/* Inline sparkline. Ported in shape from V1's `MicroSpark`
   (`DoseExpectation.jsx:197`), `GENERIC_COMPONENT_SAFE_TO_PORT` — with V1's
   band removed, because these parameters have no canon range to draw. */
function sparkline(rows, def) {
  const W = 100, H = 30, P = 2;
  const vals = rows.map((r) => r.value);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const span = hi - lo || 1;
  const x = (i) => (i / (rows.length - 1)) * W;
  const y = (v) => H - P - ((v - lo) / span) * (H - P * 2);
  const d = rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(r.value).toFixed(1)}`).join(" ");
  const ns = "http://www.w3.org/2000/svg";
  const s = document.createElementNS(ns, "svg");
  s.setAttribute("viewBox", `0 0 ${W} ${H}`);
  s.setAttribute("preserveAspectRatio", "none");
  s.setAttribute("class", `chart c-${def.tone}`);
  s.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(ns, "path");
  p.setAttribute("class", "trace");
  p.setAttribute("d", d);
  p.setAttribute("vector-effect", "non-scaling-stroke");
  s.append(p);
  return s;
}

/* --- inputs to the ranked list ------------------------------------------- */

/* Facts about the RECORD, not about chemistry: a reading the keeper entered
   with no time, an entry they marked suspect. Each is a statement about the
   ledger that the app can make without deciding anything. */
function buildRecordNotices(projected) {
  const out = [];
  for (const r of projected) {
    if (r.state !== "CURRENT") continue;
    if (r.event.kind !== KIND.READING) continue;
    if (r.event.time.timeProvenance === "DATE_ONLY") {
      const def = parameterDef(r.event.parameter);
      out.push({
        eventId: r.event.eventId,
        title: t("today.record.dateOnly.title"),
        detail: t("today.record.dateOnly.detail", {
          date: fmtShort(r.event.time.localDate),
          value: r.event.rawValue,
          unit: def ? def.unit : "",
        }),
      });
    }
  }
  for (const r of projected) {
    if (r.state === "SUSPECT") {
      out.push({
        eventId: r.event.eventId,
        title: t("today.record.suspect.title"),
        detail: t("today.record.suspect.detail", { date: fmtShort(r.event.time.localDate) }),
      });
    }
  }
  return out.slice(0, 4);
}

/* One of the app's own asks. It is resolved by DOING the thing — recording
   the dose change — never by a tick, and it expires quietly rather than
   sitting in the list forever. On expiry the app carries on treating the dose
   as unconfirmed, which is what it was doing all along, so nothing the engine
   reads changes. */
/* `doseAsks` is the app's memory of this ask: when it was FIRST raised, and
   whether the keeper has answered "no". Both have to be persisted, because
   both are facts about a conversation that spans app launches. */
function findPendingConfirmation(projected, engineResult, today, doseAsks) {
  if (!engineResult) return null;
  const d = engineResult.doseRecommendation || {};
  if (!isPresent(d.recommendedDoseMlPerDay)) return null;
  if (!isPresent(d.deltaDoseMlPerDay) || d.deltaDoseMlPerDay === 0) return null;
  /* Has the keeper already told us what they did about a recommendation at
     this dose? A dose change or dose state at the recommended figure counts. */
  const answered = projected.some(
    (r) =>
      r.state === "CURRENT" &&
      (r.event.kind === KIND.DOSE_CHANGE || r.event.kind === KIND.DOSE_STATE) &&
      Math.abs((r.event.detail.toMlPerDay ?? r.event.detail.doseMlPerDay ?? NaN) - d.recommendedDoseMlPerDay) < 1e-9
  );
  if (answered) return null;

  /* WHEN THIS ASK WAS RAISED — not when this assessment ran.

     `assessmentAsOf` is recomputed every time the app is opened, so anchoring
     `raisedOn` to it made `askIsLive` permanently true and put
     `APP_ASK_EXPIRY_DAYS` out of reach. The specification is explicit that an
     unanswered ask "must not sit in the list forever … it expires quietly
     after a reasonable interval" (`TASKS-AND-SCHEDULING.md:20-22`), and this
     one never did.

     The ask is identified by the dose it is about, so that is the key. */
  const key = String(d.recommendedDoseMlPerDay);
  const remembered = (doseAsks || {})[key];

  /* "No, I didn't." Answering must end the conversation. It used to write a
     value nothing ever read, so the row came back unchanged and the keeper was
     asked the same question again on the next launch. */
  if (remembered && remembered.declined) return null;

  const raisedOn = remembered ? remembered.raisedOn : today;
  if (!askIsLive({ raisedOn }, today)) return null;

  return {
    recommendedDoseMlPerDay: d.recommendedDoseMlPerDay,
    currentDoseMlPerDay: d.currentDoseMlPerDay,
    raisedOn,
    /* Told to the caller so the first sighting can be recorded. Nothing is
       written from inside a render. */
    firstSeen: !remembered,
  };
}

/* The trace the assessment card draws. Which readings the engine could use is
   the ENGINE's statement — read from its own evidence facts and the time
   provenance it was given, not decided here. */
function alkTrace(projected, engineResult) {
  return projected
    .filter((r) => r.state === "CURRENT" && r.event.kind === KIND.READING && r.event.parameter === "ALK")
    .slice(-12)
    .map((r) => ({
      date: r.event.time.localDate,
      value: r.event.normalizedValue,
      eventId: r.event.eventId,
      /* Eligibility is a property of the record's time, and `time.js` owns the
         test. This line used to check the PROVENANCE ALONE, while History
         checked provenance AND the presence of an instant — so one reading was
         drawn as an included point on the assessment chart and as an excluded
         one on History, in the same app, on the same day.

         `hasExactInstant` is the right test of the two: an elapsed-time
         calculation needs an instant, not a label saying one could exist, and
         the engine rejects a time it cannot parse (`kernel.parse_instant`).
         One owner, per canon `MASTER RULE 1`. */
      eligible: hasExactInstant(r.event.time),
    }));
}

export { alkTrace };
