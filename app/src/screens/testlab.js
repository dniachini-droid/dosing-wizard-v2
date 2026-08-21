/* ============================================================================
   TEST LAB — a checklist, not a form
   ----------------------------------------------------------------------------
   V1's entry form had a dropdown, so recording six tests meant six round trips
   through a select (`V1-APPLICATION-SALVAGE.md` §3). Every parameter is a row:
   type the value, press Log, move down the page.

   One date and one time-provenance answer for the whole sitting, because a
   testing session happens at one sitting — and asking "how well do you know
   the time?" once per row would train the keeper to click past it.

   The checklist rail counts what is DUE, not what exists. Logging something
   that was not due does not move it, because the rail is about the schedule.
   ========================================================================= */

import { h } from "../ui/dom.js";
import { todayLocal } from "../store/time.js";
import { computeSchedule } from "../store/schedule.js";
import { parameterDefs, KIND } from "../store/ledger.js";
import { logReading, timeControl } from "./entry.js";
import { fmtShort } from "../ui/format.js";
import { t } from "../strings.js";

export async function renderTestLab(ctx) {
  const { store } = ctx;
  const today = todayLocal();
  const [projected, tasks, completions] = await Promise.all([
    store.ledger.projection(),
    store.tasks.tasks(),
    store.tasks.completions(),
  ]);
  const schedule = computeSchedule(tasks, completions, today);
  const dueParams = new Set(
    schedule.actionable.filter((s) => s.task.kind === "TEST" && s.task.parameter).map((s) => s.task.parameter)
  );

  const screen = h("main", { class: "screen" });
  screen.append(
    h(
      "header",
      { class: "topbar with-gear" },
      h("div", null, h("h1", null, t("testlab.title")), h("p", { class: "sub" }, t("testlab.subtitle"))),
      h("button", { class: "gear", type: "button", "aria-label": t("action.settings"), onclick: () => ctx.go("settings") }, "⚙")
    )
  );

  /* --- the sitting ------------------------------------------------------ */
  const sitting = h("section", { class: "card" });
  const tc = timeControl({ initialDate: today });
  const rail = h("i");
  const railBox = h("div", { class: "progressrail" }, rail);
  const railNote = h("p", { class: "meta" });
  const countAside = h("span", { class: "aside" });

  sitting.append(
    h("div", { class: "card-head" }, h("h2", null, t("testlab.sitting")), countAside),
    tc.node,
    h(
      "p",
      { class: "hint" },
      t("testlab.sittingNote")
    ),
    railBox,
    railNote
  );
  screen.append(sitting);

  /* --- the rows --------------------------------------------------------- */
  const loggedToday = new Set(
    projected
      .filter(
        (r) => r.state === "CURRENT" && r.event.kind === KIND.READING && r.event.time.localDate === today
      )
      .map((r) => r.event.parameter)
  );

  function refreshRail() {
    const done = [...dueParams].filter((p) => loggedToday.has(p)).length;
    const total = dueParams.size;
    rail.style.width = total ? `${Math.round((done / total) * 100)}%` : "0%";
    countAside.textContent = total ? t("testlab.count", { done, total }) : t("testlab.countNone");
    railNote.textContent = total ? t("testlab.rail", { done, total }) : t("testlab.railNone");
  }

  const rowsCard = h("section", { class: "card" });
  rowsCard.append(h("div", { class: "card-head" }, h("h2", null, t("testlab.parameters"))));

  for (const def of parameterDefs()) {
    rowsCard.append(renderRow(ctx, def, { projected, loggedToday, dueParams, tc, refreshRail }));
  }
  screen.append(rowsCard);

  screen.append(
    h(
      "section",
      { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, t("testlab.somethingElse"))),
      h(
        "div",
        { class: "btn-row" },
        h("button", { class: "btn", type: "button", onclick: () => ctx.go("log-entry") }, t("testlab.recordOther")),
        h("button", { class: "btn btn-quiet", type: "button", onclick: () => ctx.go("icp-entry") }, t("testlab.recordIcp"))
      )
    )
  );

  refreshRail();
  return screen;
}

function renderRow(ctx, def, s) {
  const row = h("div", { class: "labrow" + (s.loggedToday.has(def.key) ? " is-logged" : "") });
  const prior = s.projected.filter(
    (r) => r.state === "CURRENT" && r.event.kind === KIND.READING && r.event.parameter === def.key
  );
  const last = prior[prior.length - 1];

  const input = h("input", { class: "input", inputmode: "decimal", "aria-label": def.label });
  const msg = h("span", { class: "hint" });

  const btn = h(
    "button",
    {
      class: "btn btn-primary",
      type: "button",
      onclick: async () => {
        const when = s.tc.read();
        if (!when.ok) {
          msg.textContent = when.why;
          return;
        }
        try {
          const res = await logReading(ctx.store, { parameter: def.key, rawValue: input.value, time: when.time });
          s.loggedToday.add(def.key);
          row.classList.add("is-logged");
          input.value = "";
          msg.textContent = t("testlab.logged");
          s.refreshRail();
          ctx.afterReading(res, def);
        } catch (e) {
          msg.textContent = e.message;
        }
      },
    },
    t("action.log")
  );

  row.append(
    h("span", { class: "pmark p-" + def.tone }, def.label.slice(0, 3)),
    h(
      "span",
      { class: "labmeta" },
      h("span", { class: "t" }, def.label),
      h(
        "span",
        { class: "d" },
        last
          ? t("testlab.lastReading", {
              value: last.event.rawValue,
              unit: def.unit,
              date: fmtShort(last.event.time.localDate),
            })
          : t("testlab.neverTested"),
        s.dueParams.has(def.key) ? t("testlab.due") : ""
      )
    ),
    h("span", { class: "labentry" }, input, h("span", { class: "suffix" }, def.unit), btn),
    msg
  );

  if (!def.assessed) {
    row.append(
      h("span", { class: "meta" }, t("testlab.inertRow"))
    );
  }
  return row;
}
