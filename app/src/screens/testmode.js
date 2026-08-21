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
import { doseContext, parseSeries, plan, summarise } from "../store/seed.js";
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
    screen.append(await factsCard(ctx, at));
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

/* --- on: the tank facts, and the date they take effect --------------------

   Canon §518 resolves the configuration version effective at the assessment
   instant, and the engine refuses outright when none is effective by then. In
   test mode that is easy to walk into: the facts are stamped at the app's date
   when they are saved, so stepping back BEFORE that date leaves the engine
   with no configuration to resolve and a refusal the keeper cannot read as
   anything but a fault.

   So the date is stated, and when the app is standing before it the screen
   says exactly what is wrong and offers the one move that fixes it. A refusal
   the keeper cannot act on is the failure this project has ruled out
   repeatedly, and it applies here as much as anywhere. */
async function factsCard(ctx, at) {
  const config = await ctx.store.config.current();
  const card = h("section", { class: "card" });
  card.append(h("div", { class: "card-head" }, h("h2", null, t("testmode.facts.title"))));

  if (!config) {
    card.append(
      h("p", { class: "body" }, t("testmode.facts.none")),
      h("button", { class: "btn btn-primary", type: "button", onclick: () => ctx.go("setup") }, t("testmode.facts.set"))
    );
    return card;
  }

  const from = config.effectiveFrom.slice(0, 10);
  card.append(
    h("div", { class: "kv" },
      h("div", { class: "kv-row" },
        h("span", { class: "kv-k" }, t("testmode.facts.effectiveFrom")),
        h("span", { class: "kv-v" }, fmtDayName(from)))
    )
  );

  if (at.date < from) {
    card.append(
      h(
        "div",
        { class: "callout attention" },
        h("p", null, t("testmode.facts.beforeHead")),
        h("p", null, t("testmode.facts.beforeBody", { date: fmtDayName(from) })),
        h(
          "button",
          { class: "btn", type: "button", onclick: () => ctx.setTestInstant({ date: from }) },
          t("testmode.facts.moveTo", { date: fmtDayName(from) })
        )
      )
    );
  }

  card.append(
    h("button", { class: "btn btn-quiet", type: "button", onclick: () => ctx.go("setup") }, t("testmode.facts.change")),
    h("p", { class: "inert-note" }, t("testmode.facts.note"))
  );
  return card;
}

/* --- on: bulk entry ------------------------------------------------------ */

async function seriesCard(ctx) {
  const card = h("section", { class: "card" });
  /* Read once, at render, and handed to the planner — so the preview counts
     exactly what the write will produce, and refuses exactly what the write
     will refuse, rather than guessing at either. */
  const ledgerDose = await doseContext(ctx.store);
  const config = await ctx.store.config.current();
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
    const parsed = parseSeries(box.value);
    const rows = parsed.rows;
    /* Planned here as well as at write time, and by the same function — so
       every refusal the write would make is on screen before the keeper
       presses anything. */
    const { planned, problems: planProblems } = plan(rows, { ...ledgerDose, config });
    const problems = [...parsed.problems, ...planProblems].sort((a, b) => a.line - b.line);
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
    const s = summarise(planned);
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
  const msg = h("p", { class: "hint" });
  return h(
    "section",
    { class: "card" },
    h("div", { class: "card-head" }, h("h2", null, t("testmode.reset.title"))),
    h("p", { class: "body" }, t("testmode.reset.body")),
    msg,
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
                    try {
                      await ctx.resetTest();
                    } catch (e) {
                      /* Said out loud. A clear that did not clear must never
                         look like one that did. */
                      msg.textContent = e.message;
                    }
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
