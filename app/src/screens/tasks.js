/* ============================================================================
   TASKS AND THE CALENDAR
   ----------------------------------------------------------------------------
   A month grid where completed and scheduled are counted separately and shown
   separately, "so the month reads as a plan and not only a record" — V1's
   `CompletionCalendar`, rebuilt (`V1-APPLICATION-SALVAGE.md` §2.2).

   One reschedule sheet, shared by the calendar and the list, so a task can be
   moved from wherever you happen to be looking at it.

   The engine's suggested test sits alongside everything else and behaves
   differently: it is accepted or declined, never rescheduled, and accepting it
   shows what it does to the keeper's own schedule first.
   ========================================================================= */

import { h } from "../ui/dom.js";
import { addDays, daysBetween, isoLocalDate, parseLocalDate, todayLocal } from "../store/time.js";
import { computeSchedule, intervalLabel, makeTask, projectOccurrences, TASK_KIND } from "../store/schedule.js";
import { fmtDayName, fmtShort } from "../ui/format.js";
import { openSheet, timeControl } from "./entry.js";
import { parameterDefs, parameterDef, KIND } from "../store/ledger.js";
import { sayReason, sayParameterMid } from "../present/wording.js";
import { isPresent } from "../present/cards.js";
import { t } from "../strings.js";
import {
  PREFERENCE,
  SUGGESTION_STATE,
  applyAddExtra,
  applyReplace,
  decline,
  rememberPreference,
} from "../store/suggestion.js";
import {
  whyRetestCandidates,
  whyRetestNotRun,
  whyRetestRows,
  whyRetestUnavailable,
} from "../present/why-retest.js";

export async function renderTasks(ctx) {
  const { store, state } = ctx;
  const today = todayLocal();
  const [tasks, completions, projected] = await Promise.all([
    store.tasks.tasks(),
    store.tasks.completions(),
    store.ledger.projection(),
  ]);
  const schedule = computeSchedule(tasks, completions, today);
  const month = state.calendarMonth || today.slice(0, 7);

  const screen = h("main", { class: "screen" });
  screen.append(
    h(
      "header",
      { class: "topbar with-gear" },
      h("div", null, h("h1", null, t("tasks.title")), h("p", { class: "sub" }, t("tasks.subtitle"))),
      h("button", { class: "gear", type: "button", "aria-label": t("action.settings"), onclick: () => ctx.go("settings") }, "⚙")
    )
  );

  screen.append(renderCalendar(ctx, { month, today, tasks, completions, projected, suggestion: state.suggestion }));

  const active = tasks.filter((t) => t.enabled !== false);
  if (!active.length) {
    screen.append(
      h(
        "section",
        { class: "card" },
        h("div", { class: "card-head" }, h("h2", null, t("tasks.empty.title"))),
        h("p", { class: "body" }, t("tasks.empty.body")),
        h("p", { class: "body" }, t("tasks.empty.body2")),
        h(
          "button",
          { class: "btn btn-primary", type: "button", onclick: () => openTaskSheet(ctx, null) },
          t("tasks.empty.add")
        )
      )
    );
  } else {
    screen.append(renderGroup(ctx, t("tasks.group.tests"), schedule.states.filter((s) => s.task.kind === TASK_KIND.TEST), today));
    screen.append(
      renderGroup(ctx, t("tasks.group.husbandry"), schedule.states.filter((s) => s.task.kind !== TASK_KIND.TEST), today)
    );
  }

  screen.append(
    h(
      "section",
      { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, t("tasks.add"))),
      h(
        "div",
        { class: "btn-row" },
        h("button", { class: "btn btn-primary", type: "button", onclick: () => openTaskSheet(ctx, null) }, t("tasks.add.new")),
        h("button", { class: "btn btn-quiet", type: "button", onclick: () => openOneOffSheet(ctx) }, t("tasks.add.oneOff"))
      )
    )
  );

  return screen;
}

/* --- the month grid ------------------------------------------------------ */

function renderCalendar(ctx, { month, today, tasks, completions, projected, suggestion }) {
  const card = h("section", { class: "card" });
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const monthName = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const step = (n) => {
    const d = new Date(y, m - 1 + n, 1);
    ctx.setMonth(isoLocalDate(d).slice(0, 7));
  };

  card.append(
    h(
      "div",
      { class: "cal-head" },
      h("button", { class: "arrow", type: "button", "aria-label": t("tasks.calendar.prev"), onclick: () => step(-1) }, "‹"),
      h("span", { class: "m" }, monthName),
      h("button", { class: "arrow", type: "button", "aria-label": t("tasks.calendar.next"), onclick: () => step(1) }, "›")
    )
  );

  /* Per day: what was completed, and what is scheduled. Counted separately. */
  const doneByDay = new Map();
  for (const c of completions) doneByDay.set(c.date, (doneByDay.get(c.date) || 0) + 1);

  const schedByDay = new Map();
  const horizon = isoLocalDate(new Date(y, m, 0));
  for (const t of tasks.filter((t) => t.enabled !== false)) {
    for (const d of projectOccurrences(t, completions, today, horizon)) {
      schedByDay.set(d, (schedByDay.get(d) || 0) + 1);
    }
  }

  const monthDone = [...doneByDay.entries()].filter(([d]) => d.startsWith(month)).reduce((a, [, n]) => a + n, 0);
  const monthSched = [...schedByDay.entries()].filter(([d]) => d.startsWith(month)).reduce((a, [, n]) => a + n, 0);
  card.append(
    h(
      "p",
      { class: "meta", style: { margin: "0 0 var(--sp-3)" } },
      t("tasks.calendar.counts", { done: monthDone, scheduled: monthSched })
    )
  );

  const dow = h("div", { class: "cal-dow" });
  ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].forEach((d) =>
    dow.append(h("span", null, t(`tasks.calendar.${d}`)))
  );
  card.append(dow);

  const grid = h("div", { class: "cal-grid" });
  /* Monday-start, as V1's was. */
  const lead = (first.getDay() + 6) % 7;
  for (let i = 0; i < lead; i++) grid.append(h("span", { class: "cal-cell blank" }));

  for (let d = 1; d <= last.getDate(); d++) {
    const iso = isoLocalDate(new Date(y, m - 1, d));
    const cls =
      "cal-cell" + (iso === today ? " is-today" : iso < today ? " is-past" : "");
    const dots = h("span", { class: "dots" });
    for (let i = 0; i < Math.min(3, doneByDay.get(iso) || 0); i++) dots.append(h("span", { class: "dot done" }));
    const overdueHere = iso < today && (schedByDay.get(iso) || 0) > 0;
    for (let i = 0; i < Math.min(3, schedByDay.get(iso) || 0); i++)
      dots.append(h("span", { class: "dot " + (overdueHere ? "attention" : "sched") }));
    if (suggestion && suggestion.date === iso) dots.append(h("span", { class: "dot suggest" }));

    grid.append(
      h(
        "button",
        { class: cls, type: "button", "aria-label": fmtDayName(iso), onclick: () => openDaySheet(ctx, iso) },
        h("span", { class: "dn" }, String(d)),
        dots
      )
    );
  }
  card.append(grid);

  const legend = h("div", { class: "legend" });
  legend.append(
    h("span", null, h("span", { class: "swatch", style: { background: "var(--done-ink)" } }), t("tasks.calendar.legendDone")),
    h("span", null, h("span", { class: "swatch", style: { background: "var(--card-top)", border: "1px solid var(--faint)" } }), t("tasks.calendar.legendScheduled")),
    h("span", null, h("span", { class: "swatch", style: { background: "var(--suggest-edge)" } }), t("tasks.calendar.legendSuggested")),
    h("span", null, h("span", { class: "swatch", style: { background: "var(--attention)" } }), t("tasks.calendar.legendOverdue"))
  );
  card.append(legend);
  card.append(
    h(
      "p",
      { class: "inert-note" },
      t("tasks.calendar.note")
    )
  );
  return card;
}

/* --- a group of task rows ------------------------------------------------ */

function renderGroup(ctx, title, states, today) {
  const card = h("section", { class: "card" });
  card.append(
    h("div", { class: "card-head" }, h("h2", null, title), h("span", { class: "aside" }, `${states.length}`))
  );
  if (!states.length) {
    card.append(h("p", { class: "body" }, t("tasks.group.empty")));
    return card;
  }
  const list = h("ul", { class: "tasklist" });
  for (const st of states) {
    list.append(
      h(
        "li",
        null,
        h(
          "button",
          { class: "taskrow", type: "button", onclick: () => openRescheduleSheet(ctx, st) },
          h("span", { class: "tick" + (st.doneToday ? " done" : "") }, st.doneToday ? "✓" : ""),
          h(
            "span",
            null,
            h("span", { class: "t" }, st.task.label),
            h(
              "span",
              { class: "d" },
              t("tasks.row.detail", {
                interval: intervalLabel(st.task.intervalDays),
                last: st.lastDone
                  ? t("tasks.row.lastDone", { date: fmtShort(st.lastDone) })
                  : t("tasks.row.never"),
              })
            )
          ),
          h("span", { class: "when" }, st.status === "overdue" ? t("tasks.row.late", { days: -st.daysOut }) : fmtShort(st.due))
        )
      )
    );
  }
  card.append(list);
  return card;
}

/* --- the shared reschedule sheet ---------------------------------------- */

export function openRescheduleSheet(ctx, st) {
  const task = st.task;
  const dueInput = h("input", { class: "input", type: "date", value: st.due, "aria-label": t("tasks.reschedule.nextDue") });
  const intervalInput = h("input", {
    class: "input",
    type: "number",
    min: "1",
    value: String(task.intervalDays),
    "aria-label": t("tasks.reschedule.intervalAria"),
  });
  const msg = h("p", { class: "hint" });

  const body = h(
    "div",
    null,
    h(
      "div",
      { class: "kv" },
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("tasks.reschedule.lastDone")), h("span", { class: "kv-v" }, st.lastDone ? fmtDayName(st.lastDone) : t("tasks.reschedule.never"))),
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("tasks.reschedule.nextDue")), h("span", { class: "kv-v" }, fmtDayName(st.due)))
    ),
    h("div", { class: "field" }, h("span", { class: "flabel" }, t("tasks.reschedule.moveTo")), dueInput,
      h("p", { class: "hint" }, t("tasks.reschedule.moveHint"))),
    h("div", { class: "field" }, h("span", { class: "flabel" }, t("tasks.reschedule.howOften")), intervalInput,
      h("p", { class: "hint" }, t("tasks.reschedule.howOftenHint"))),
    msg
  );

  openSheet({
    title: task.label,
    body,
    actions: (close) => [
      h(
        "button",
        {
          class: "btn btn-primary",
          type: "button",
          onclick: async () => {
            const days = Number(intervalInput.value);
            if (!(days > 0)) {
              msg.textContent = t("tasks.reschedule.needInterval");
              return;
            }
            const shift = daysBetween(st.due, dueInput.value);
            await ctx.store.tasks.saveTask({
              ...task,
              intervalDays: days,
              adjustDays: (task.adjustDays || 0) + shift,
              /* Anchored to the completion it was made against, so it lapses
                 the next time the task is done rather than skewing the rhythm
                 for good. */
              adjustAnchor: st.lastDone ?? null,
            });
            close();
            ctx.refresh();
          },
        },
        t("action.save")
      ),
      h(
        "button",
        {
          class: "btn",
          type: "button",
          onclick: async () => {
            await ctx.store.tasks.complete({ taskId: task.id, date: todayLocal() });
            close();
            ctx.afterCompletion(task);
          },
        },
        t("tasks.reschedule.markDone")
      ),
      h(
        "button",
        {
          class: "btn btn-quiet",
          type: "button",
          onclick: async () => {
            /* Skip moves the next occurrence on by one interval and records
               nothing as done — a skipped task is not a completed one, and
               anchoring the following one to a completion that never happened
               would be a lie the calendar then repeats forever. */
            await ctx.store.tasks.saveTask({
              ...task,
              adjustDays: (task.adjustDays || 0) + task.intervalDays,
              adjustAnchor: st.lastDone ?? null,
            });
            close();
            ctx.refresh();
          },
        },
        t("tasks.reschedule.skip")
      ),
      h(
        "button",
        {
          class: "btn btn-quiet",
          type: "button",
          onclick: async () => {
            await ctx.store.tasks.removeTask(task.id);
            close();
            ctx.refresh();
          },
        },
        t("tasks.reschedule.turnOff")
      ),
    ],
  });
}

/* --- one day ------------------------------------------------------------- */

export async function openDaySheet(ctx, iso) {
  const [tasks, completions, projected, assessments] = await Promise.all([
    ctx.store.tasks.tasks(),
    ctx.store.tasks.completions(),
    ctx.store.ledger.projection(),
    ctx.store.assessments.forDay(iso),
  ]);
  const today = todayLocal();
  const schedule = computeSchedule(tasks, completions, today);

  const body = h("div");

  const doneHere = completions.filter((c) => c.date === iso);
  body.append(h("p", { class: "seclabel" }, t("tasks.day.done")));
  if (!doneHere.length) body.append(h("p", { class: "body" }, t("tasks.day.doneEmpty")));
  else {
    const list = h("ul", { class: "tasklist" });
    for (const c of doneHere) {
      const task = tasks.find((x) => x.id === c.taskId);
      list.append(
        h("li", null,
          h("span", { class: "taskrow" },
            h("span", { class: "tick done" }, "✓"),
            h("span", null,
              h("span", { class: "t" }, task ? task.label : c.taskId),
              h("span", { class: "d" }, c.auto ? t("tasks.day.autoCompleted") : t("tasks.day.markedDone")))))
      );
    }
    body.append(list);
  }

  const stillDue = schedule.states.filter((s) => s.due === iso);
  body.append(h("p", { class: "seclabel" }, iso < today ? t("tasks.day.wasDue") : t("tasks.day.due")));
  if (!stillDue.length) body.append(h("p", { class: "body" }, t("tasks.day.dueEmpty")));
  else {
    const list = h("ul", { class: "tasklist" });
    for (const st of stillDue) {
      list.append(
        h("li", null,
          h("button", { class: "taskrow", type: "button", onclick: () => openRescheduleSheet(ctx, st) },
            h("span", { class: "tick" }, ""),
            h("span", null,
              h("span", { class: "t" }, st.task.label),
              h("span", { class: "d" }, intervalLabel(st.task.intervalDays)))))
      );
    }
    body.append(list);
  }

  const recorded = projected.filter((r) => r.event.time.localDate === iso);
  if (recorded.length) {
    body.append(h("p", { class: "seclabel" }, t("tasks.day.recorded")));
    const list = h("ul", { class: "tasklist" });
    for (const r of recorded) {
      const def = r.event.parameter ? parameterDef(r.event.parameter) : null;
      list.append(
        h("li", null,
          h("button", { class: "taskrow", type: "button", onclick: () => ctx.openEntry(r.event.eventId) },
            h("span", { class: "tick done" }, "·"),
            h("span", null,
              h("span", { class: "t" }, def ? def.label : r.event.kind),
              h("span", { class: "d" }, r.event.rawValue != null ? `${r.event.rawValue} ${r.event.unit || ""}` : ""))))
      );
    }
    body.append(list);
  }

  if (assessments.length) {
    body.append(
      h("p", { class: "seclabel" }, t("tasks.day.saidLabel")),
      h("p", { class: "body" }, t("tasks.day.saidCount", { n: assessments.length }))
    );
  }

  openSheet({ title: fmtDayName(iso), body, actions: (close) => [h("button", { class: "btn", type: "button", onclick: close }, t("action.close"))] });
}

/* --- creating a task ----------------------------------------------------- */

export function openTaskSheet(ctx, existing) {
  const label = h("input", { class: "input", value: existing?.label || "", "aria-label": t("tasks.new.what") });
  const every = h("input", {
    class: "input", type: "number", min: "1",
    value: existing ? String(existing.intervalDays) : "",
    "aria-label": t("tasks.new.howOften"),
  });
  const unitSel = h("select", { class: "input", "aria-label": t("tasks.new.howOften") },
    h("option", { value: "1" }, t("tasks.new.days")), h("option", { value: "7" }, t("tasks.new.weeks")));
  const start = h("input", { class: "input", type: "date", value: todayLocal(), "aria-label": t("tasks.new.firstDue") });
  const paramSel = h("select", { class: "input", "aria-label": t("tasks.new.isTest") },
    h("option", { value: "" }, t("tasks.new.notATest")),
    ...parameterDefs().map((p) => h("option", { value: p.key }, p.label)));
  const msg = h("p", { class: "hint" });

  const body = h(
    "div",
    null,
    h("div", { class: "field" }, h("span", { class: "flabel" }, t("tasks.new.what")), label),
    h("div", { class: "field" }, h("span", { class: "flabel" }, t("tasks.new.howOften")), h("div", { class: "inline" }, every, unitSel),
      h("p", { class: "hint" }, t("tasks.new.howOftenHint"))),
    h("div", { class: "field" }, h("span", { class: "flabel" }, t("tasks.new.firstDue")), start),
    h("div", { class: "field" }, h("span", { class: "flabel" }, t("tasks.new.isTest")), paramSel,
      h("p", { class: "hint" }, t("tasks.new.isTestHint"))),
    msg
  );

  openSheet({
    title: existing ? t("tasks.new.editTitle") : t("tasks.new.title"),
    body,
    actions: (close) => [
      h(
        "button",
        {
          class: "btn btn-primary",
          type: "button",
          onclick: async () => {
            const n = Number(every.value) * Number(unitSel.value);
            if (!label.value.trim()) return void (msg.textContent = t("tasks.new.needName"));
            if (!(n > 0)) return void (msg.textContent = t("tasks.new.needInterval"));
            const param = paramSel.value || null;
            const task = makeTask({
              id: existing?.id || `task-${Date.now()}`,
              label: label.value.trim(),
              kind: param ? TASK_KIND.TEST : TASK_KIND.CUSTOM,
              parameter: param,
              intervalDays: n,
              startDate: start.value,
            });
            await ctx.store.tasks.saveTask(existing ? { ...existing, ...task, id: existing.id } : task);
            close();
            ctx.refresh();
          },
        },
        t("action.save")
      ),
    ],
  });
}

/* Recording something that was not scheduled: a husbandry job done on a whim,
   a water change nobody asked for. It is a completion with no task behind it,
   so it needs a home of its own rather than being forced into the schedule. */
export function openOneOffSheet(ctx) {
  const what = h("input", { class: "input", "aria-label": t("tasks.oneOff.what") });
  const tc = timeControl({ initialDate: todayLocal() });
  const msg = h("p", { class: "hint" });
  const body = h(
    "div",
    null,
    h("div", { class: "field" }, h("span", { class: "flabel" }, t("tasks.oneOff.what")), what),
    tc.node,
    h("p", { class: "hint" }, t("tasks.oneOff.hint")),
    msg
  );
  openSheet({
    title: t("tasks.oneOff.title"),
    body,
    actions: (close) => [
      h(
        "button",
        {
          class: "btn btn-primary",
          type: "button",
          onclick: async () => {
            const when = tc.read();
            if (!when.ok) return void (msg.textContent = when.why);
            if (!what.value.trim()) return void (msg.textContent = t("tasks.oneOff.needWhat"));
            await ctx.store.ledger.append({
              kind: KIND.HUSBANDRY,
              time: when.time,
              recordedAt: new Date().toISOString(),
              detail: { what: what.value.trim(), oneOff: true },
            });
            close();
            ctx.refresh();
          },
        },
        t("log.record")
      ),
    ],
  });
}

/* --- the engine's suggested test ----------------------------------------
   `docs/implementation/app/TASKS-AND-SCHEDULING.md`.

   The keeper's schedule is theirs; the engine never changes it. What the
   engine does is OFFER a day, and the keeper decides how it fits: replace
   their next scheduled test, or add it as an extra.

   Three things the specification rules out, and where each is ruled out:

     - naming the keeper's other test dates. Neither option below mentions
       one. "They know their own schedule, and naming a third date made the
       choice harder to read."
     - explaining the reasoning inline. "Why Saturday" is a link to a separate
       sheet. "The keeper is deciding a schedule, not evaluating an argument."
     - inferring a preference from behaviour. The checkbox is the only thing
       that writes one, and it is unticked every time.
   ------------------------------------------------------------------------ */

export async function openSuggestionSheet(ctx, resolved) {
  const { suggestion, state } = resolved;
  const day = fmtDayName(suggestion.date);
  const parameter = sayParameterMid(suggestion.parameter);
  const body = h("div");

  body.append(h("p", { class: "mhead" }, t("suggest.title", { parameter, day })));
  body.append(h("p", { class: "body" }, sayReason(suggestion.reasonCode)));
  body.append(
    h(
      "button",
      { class: "backlink", type: "button", onclick: () => openWhySheet(ctx, suggestion) },
      t("suggest.whyLink", { day })
    )
  );

  /* "That's already your scheduled test day. Nothing to change." */
  if (state === SUGGESTION_STATE.ALREADY_SCHEDULED) {
    body.append(h("p", { class: "body" }, t("suggest.alreadyScheduled", { day })));
    openSheet({
      title: t("tasks.suggestion.title"),
      body,
      actions: (close) => [h("button", { class: "btn", type: "button", onclick: close }, t("action.close"))],
    });
    return;
  }

  body.append(h("p", { class: "seclabel" }, t("suggest.howToSchedule")));

  const remember = h("input", { type: "checkbox", id: "suggest-remember" });
  const rememberRow = h("label", { class: "field" }, remember, " " + t("suggest.remember"));

  /* Assigned by `openSheet` below; the handlers only run after a tap, by
     which time it exists. */
  let handle = null;

  const take = async (how) => {
    if (handle) handle.close();
    /* The checkbox is read at the moment of the choice, and only an explicit
       replace-or-add answer can be remembered. Declining never becomes a
       standing preference — that would be inferring one from a refusal. */
    if (remember.checked) await rememberPreference(ctx.store, how);
    if (how === PREFERENCE.REPLACE) await applyReplace(ctx.store, resolved);
    else await applyAddExtra(ctx.store, resolved);
    ctx.refresh();
  };

  const seg = h("div", { class: "seg stack-opts" });
  seg.append(
    h(
      "button",
      { class: "opt", type: "button", onclick: () => take(PREFERENCE.REPLACE) },
      t("suggest.replace"),
      h("span", { class: "oz" }, t("suggest.replaceRecommended"))
    ),
    h(
      "button",
      { class: "opt", type: "button", onclick: () => take(PREFERENCE.ADD_EXTRA) },
      t("suggest.addExtra")
    )
  );
  body.append(seg, rememberRow);

  handle = openSheet({
    title: t("tasks.suggestion.title"),
    body,
    actions: (close) => [
      h(
        "button",
        {
          class: "btn btn-quiet",
          type: "button",
          onclick: async () => {
            await decline(ctx.store, suggestion);
            close();
            ctx.refresh();
          },
        },
        t("suggest.decline")
      ),
    ],
  });
}

/* --- why that day --------------------------------------------------------
   A separate sheet, reached by a link. Every row is the engine's; this file
   computes nothing, and where the engine did not supply a figure the sheet
   says so rather than working it out. */
export function openWhySheet(ctx, suggestion) {
  const result = ctx.state.assessment?.engineResult;
  const body = h("div");

  if (!result) {
    body.append(h("p", { class: "body" }, t("working.none")));
  } else {
    const kv = h("div", { class: "kv" });
    for (const row of whyRetestRows(result)) {
      kv.append(
        h(
          "div",
          { class: "kv-row" },
          h("span", { class: "kv-k" }, row.key),
          h("span", { class: "kv-v" }, row.value)
        )
      );
    }
    body.append(kv);

    const candidates = whyRetestCandidates(result);
    if (candidates.length) {
      body.append(h("p", { class: "seclabel" }, t("why.candidates")));
      const list = h("ul", { class: "tasklist" });
      for (const c of candidates) {
        list.append(
          h(
            "li",
            null,
            h(
              "span",
              { class: "taskrow" },
              h("span", { class: "tick" + (c.selected ? " done" : "") }, c.selected ? "✓" : ""),
              h(
                "span",
                null,
                h("span", { class: "t" }, c.label),
                h(
                  "span",
                  { class: "d" },
                  c.at && c.hours
                    ? t("why.candidateAt", { day: fmtDayName(c.at.slice(0, 10)), hours: c.hours })
                    : c.reason || t("why.candidateNotSubmitted")
                )
              )
            )
          )
        );
      }
      body.append(list);
    }

    const notRun = whyRetestNotRun(result);
    if (notRun.length) {
      body.append(h("p", { class: "seclabel" }, t("why.notRun")));
      notRun.forEach((n) => body.append(h("p", { class: "body" }, n)));
    }

    body.append(h("p", { class: "inert-note" }, whyRetestUnavailable()));
  }

  openSheet({
    title: t("why.title", { day: fmtDayName(suggestion.date) }),
    body,
    actions: (close) => [h("button", { class: "btn", type: "button", onclick: close }, t("action.close"))],
  });
}
