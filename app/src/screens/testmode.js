/* ============================================================================
   TEST MODE — THE CONTROLS
   ----------------------------------------------------------------------------
   Behind Settings rather than on the tab bar, because it is not part of
   keeping a tank. Off by default; nothing here runs until the keeper turns it
   on, and turning it on is one deliberate act with a date attached.

   Everything on this screen is a statement of fact by the keeper: this is the
   date, these were the readings, this is what the doser was set to. Nothing
   here generates a reading, models a tank or predicts anything. The app's only
   contribution is to run the engine over what it is told and show the answer.
   ========================================================================= */

import { h } from "../ui/dom.js";
import { openSheet } from "./entry.js";
import { knownDose, parseSeries, plan, summarise } from "../store/seed.js";
import { KIND } from "../store/ledger.js";
import { MODE, DB_NAME, TEST_DB_NAME } from "../store/mode.js";
import { fmtDayName } from "../ui/format.js";
import { t } from "../strings.js";

export async function renderTestMode(ctx) {
  const on = ctx.mode() === MODE.TEST;
  const at = ctx.testInstant();

  const screen = h("main", { class: "screen" });
  screen.append(
    h(
      "header",
      { class: "topbar" },
      h("div", null, h("h1", null, t("testmode.title")), h("p", { class: "sub" }, t("testmode.subtitle"))),
      h("button", { class: "backlink", type: "button", onclick: () => ctx.go("settings") }, t("action.done"))
    )
  );

  screen.append(on ? whenCard(ctx, at) : offCard(ctx, at));

  if (on) {
    screen.append(await seriesCard(ctx));
    screen.append(await separationCard(ctx));
    screen.append(resetCard(ctx));
  } else {
    screen.append(
      h(
        "section",
        { class: "card" },
        h("div", { class: "card-head" }, h("h2", null, t("testmode.whatItIsTitle"))),
        h("p", { class: "body" }, t("testmode.whatItIs")),
        h("p", { class: "body" }, t("testmode.whatItIsNot")),
        h("p", { class: "inert-note" }, t("testmode.samePathNote"))
      )
    );
  }

  return screen;
}

/* --- off ----------------------------------------------------------------- */

function offCard(ctx, at) {
  const date = h("input", { class: "input", type: "date", value: at.date, "aria-label": t("testmode.startDate") });
  const time = h("input", { class: "input", type: "time", value: at.time, "aria-label": t("testmode.startTime") });

  return h(
    "section",
    { class: "card" },
    h("div", { class: "card-head" }, h("h2", null, t("testmode.offTitle")), h("span", { class: "pill pill-neutral" }, t("testmode.off"))),
    h("p", { class: "body" }, t("testmode.offBody")),
    h(
      "div",
      { class: "field" },
      h("span", { class: "flabel" }, t("testmode.startAt")),
      h("div", { class: "inline" }, date, time)
    ),
    h("p", { class: "hint" }, t("testmode.startHint")),
    h(
      "button",
      {
        class: "btn btn-primary",
        type: "button",
        onclick: () => ctx.enterTest({ date: date.value, time: time.value }),
      },
      t("testmode.turnOn")
    )
  );
}

/* --- on: the instant, and stepping it ------------------------------------ */

function whenCard(ctx, at) {
  const date = h("input", { class: "input", type: "date", value: at.date, "aria-label": t("testmode.jumpTo") });
  const time = h("input", { class: "input", type: "time", value: at.time, "aria-label": t("testmode.timeOfDay") });

  return h(
    "section",
    { class: "card is-testmode" },
    h("div", { class: "card-head" }, h("h2", null, t("testmode.onTitle")), h("span", { class: "pill pill-test" }, t("testmode.on"))),
    h("p", { class: "body" }, t("testmode.onBody")),
    h(
      "nav",
      { class: "stepper", "aria-label": t("testmode.stepper.aria") },
      h("button", { class: "arrow", type: "button", "aria-label": t("testmode.stepper.back"), onclick: () => ctx.stepTest(-1) }, "‹"),
      h(
        "span",
        { class: "when" },
        h("span", { class: "d" }, fmtDayName(at.date)),
        h("span", { class: "r" }, at.time)
      ),
      h("button", { class: "arrow", type: "button", "aria-label": t("testmode.stepper.forward"), onclick: () => ctx.stepTest(1) }, "›")
    ),
    h(
      "div",
      { class: "field" },
      h("span", { class: "flabel" }, t("testmode.jumpTo")),
      h("div", { class: "inline" }, date, time)
    ),
    h(
      "div",
      { class: "btn-row" },
      h(
        "button",
        { class: "btn", type: "button", onclick: () => ctx.setTestInstant({ date: date.value, time: time.value }) },
        t("testmode.goTo")
      ),
      h("button", { class: "btn btn-quiet", type: "button", onclick: () => ctx.leaveTest() }, t("testmode.turnOff"))
    ),
    h("p", { class: "inert-note" }, t("testmode.stepNote"))
  );
}

/* --- on: bulk entry ------------------------------------------------------ */

async function seriesCard(ctx) {
  const card = h("section", { class: "card" });
  /* Read once, at render, and handed to the planner — so the preview counts
     exactly what the write will produce rather than guessing at it. */
  const startingDose = await knownDose(ctx.store);
  const box = h("textarea", {
    class: "input series",
    rows: "10",
    spellcheck: "false",
    "aria-label": t("testmode.series.aria"),
    placeholder: t("testmode.series.placeholder"),
  });
  const report = h("div", { class: "seedreport" });
  const msg = h("p", { class: "hint" });

  function preview() {
    report.replaceChildren();
    const { rows, problems } = parseSeries(box.value);
    if (problems.length) {
      const list = h("ul", { class: "tasklist" });
      for (const p of problems) {
        list.append(
          h(
            "li",
            null,
            h(
              "span",
              { class: "taskrow" },
              h("span", { class: "tick" }, "·"),
              h(
                "span",
                null,
                h("span", { class: "t" }, t("testmode.series.problemLine", { n: p.line })),
                h("span", { class: "d" }, p.why)
              )
            )
          )
        );
      }
      report.append(h("p", { class: "body" }, t("testmode.series.problems", { n: problems.length })), list);
      return null;
    }
    if (!rows.length) {
      report.append(h("p", { class: "body" }, t("testmode.series.nothing")));
      return null;
    }
    const s = summarise(plan(rows, { knownDose: startingDose }));
    const kv = h("div", { class: "kv" });
    for (const [kind, n] of Object.entries(s.counts)) {
      kv.append(
        h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, kindWords(kind)), h("span", { class: "kv-v" }, String(n)))
      );
    }
    kv.append(
      h(
        "div",
        { class: "kv-row" },
        h("span", { class: "kv-k" }, t("testmode.series.dateOnly")),
        h("span", { class: "kv-v" }, t("testmode.series.dateOnlyCount", { n: s.dateOnly, total: s.total }))
      )
    );
    report.append(h("p", { class: "body" }, t("testmode.series.willAdd", { n: s.total })), kv);
    return rows;
  }

  box.addEventListener("input", () => {
    msg.textContent = "";
    preview();
  });

  card.append(
    h("div", { class: "card-head" }, h("h2", null, t("testmode.series.title"))),
    h("p", { class: "body" }, t("testmode.series.body")),
    h("pre", { class: "code" }, t("testmode.series.grammar")),
    box,
    report,
    msg,
    h(
      "div",
      { class: "btn-row" },
      h(
        "button",
        {
          class: "btn btn-primary",
          type: "button",
          onclick: async () => {
            const rows = preview();
            if (!rows) {
              msg.textContent = t("testmode.series.fixFirst");
              return;
            }
            try {
              const r = await ctx.seedSeries(rows);
              box.value = "";
              report.replaceChildren();
              msg.textContent = t("testmode.series.added", { n: r.written });
            } catch (e) {
              msg.textContent = e.message;
            }
          },
        },
        t("testmode.series.add")
      )
    ),
    h("p", { class: "inert-note" }, t("testmode.series.note"))
  );
  return card;
}

function kindWords(kind) {
  return (
    {
      [KIND.READING]: t("log.event.reading"),
      [KIND.DOSE_STATE]: t("log.event.doseState"),
      [KIND.DOSE_CHANGE]: t("log.event.doseChange"),
      [KIND.WATER_CHANGE]: t("log.event.waterChange"),
      [KIND.MANUAL_CORRECTION]: t("log.event.manual"),
      [KIND.NOTE]: t("log.event.note"),
    }[kind] || kind
  );
}

/* --- on: what is where --------------------------------------------------- */

async function separationCard(ctx) {
  const events = await ctx.store.ledger.allEvents();
  return h(
    "section",
    { class: "card" },
    h("div", { class: "card-head" }, h("h2", null, t("testmode.separation.title"))),
    h(
      "div",
      { class: "kv" },
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("testmode.separation.reading")), h("span", { class: "kv-v" }, TEST_DB_NAME)),
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("testmode.separation.real")), h("span", { class: "kv-v" }, DB_NAME)),
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("testmode.separation.held")), h("span", { class: "kv-v" }, String(events.length)))
    ),
    h("p", { class: "body" }, t("testmode.separation.body")),
    h("p", { class: "inert-note" }, t("testmode.separation.note"))
  );
}

/* --- on: reset ----------------------------------------------------------- */

function resetCard(ctx) {
  return h(
    "section",
    { class: "card" },
    h("div", { class: "card-head" }, h("h2", null, t("testmode.reset.title"))),
    h("p", { class: "body" }, t("testmode.reset.body")),
    h(
      "button",
      {
        class: "btn",
        type: "button",
        onclick: () =>
          openSheet({
            title: t("testmode.reset.confirmTitle"),
            body: h(
              "div",
              null,
              h("p", { class: "body" }, t("testmode.reset.confirmBody")),
              h("p", { class: "inert-note" }, t("testmode.reset.confirmNote"))
            ),
            actions: (close) => [
              h(
                "button",
                {
                  class: "btn btn-primary",
                  type: "button",
                  onclick: async () => {
                    close();
                    await ctx.resetTest();
                  },
                },
                t("testmode.reset.confirmAction")
              ),
              h("button", { class: "btn btn-quiet", type: "button", onclick: close }, t("action.close")),
            ],
          }),
      },
      t("testmode.reset.action")
    )
  );
}
