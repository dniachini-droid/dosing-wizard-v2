/* ============================================================================
   SETTINGS, SETUP, TOOLS AND THE PLATFORM
   ----------------------------------------------------------------------------
   "Setup asks for facts, not judgements." (V1 canon `wizard-states.md` §21,
   carried across as a principle.) Facts are what only the keeper knows — net
   volume, solution strength, target range, pump step. Judgements are opinions
   about how the app should behave, and there are none here: no tolerance
   setting, no cadence setting, no confidence threshold. V1 rejected a tolerance
   setting on the grounds that one input reaching three arrival points has no
   single owner, which is `MASTER RULE 1` in different words.

   The canon-stated constants are read from
   `docs/implementation/alk-v2/fixtures/config-defaults.json` at setup time
   rather than copied into this file. `CLAUDE.md`: outside `docs/research/` and
   `docs/canon/`, no number governs behaviour. A copy here would be a second
   owner of every one of them.
   ========================================================================= */

import { h } from "../ui/dom.js";
import { KEEPER_FACTS, CANON_DEFAULT_KEYS } from "../store/config.js";
import { openSheet } from "./entry.js";
import { fmtDayName } from "../ui/format.js";
import { describe } from "../engine/client.js";
import { nowIso } from "../store/time.js";
import { MODE } from "../store/mode.js";
import { t } from "../strings.js";
import { PREFERENCE, readPreference } from "../store/suggestion.js";

const DEFAULTS_URL = new URL(
  "../../../docs/implementation/alk-v2/fixtures/config-defaults.json",
  import.meta.url
);

/* Read, never copied. If this file cannot be reached the app says so and
   refuses to continue setup, rather than falling back to numbers it made up. */
export async function canonDefaults() {
  const res = await fetch(DEFAULTS_URL, { cache: "force-cache" });
  if (!res.ok) throw new Error(t("setup.defaultsUnreadable"));
  const doc = await res.json();
  const src = doc.configurations && doc.configurations.CANON_DEFAULT;
  if (!src) throw new Error(t("setup.defaultsShape"));
  const out = {};
  for (const k of CANON_DEFAULT_KEYS) {
    if (src[k] !== undefined) out[k] = src[k];
  }
  return out;
}

/* --- setup --------------------------------------------------------------- */

export async function renderSetup(ctx) {
  const screen = h("main", { class: "screen" });
  screen.append(
    h(
      "header",
      { class: "topbar" },
      h("div", null, h("h1", null, t("setup.title")), h("p", { class: "sub" }, t("setup.subtitle")))
    )
  );

  let defaults = null;
  let defaultsError = null;
  try {
    defaults = await canonDefaults();
  } catch (e) {
    defaultsError = e.message;
  }

  const current = await ctx.store.config.current();
  const inputs = new Map();
  const card = h("section", { class: "card" });
  card.append(h("div", { class: "card-head" }, h("h2", null, t("setup.yourTank"))));

  for (const f of KEEPER_FACTS) {
    const input = h("input", {
      class: "input",
      inputmode: "decimal",
      value: current && current[f.key] != null ? String(current[f.key]) : "",
      "aria-label": t(f.label),
    });
    inputs.set(f.key, input);
    card.append(
      h(
        "div",
        { class: "field" },
        h("span", { class: "flabel" }, t("setup.fieldLabel", { label: t(f.label), unit: f.unit })),
        input,
        h("p", { class: "hint" }, t(f.hint))
      )
    );
  }

  const msg = h("p", { class: "hint" });
  card.append(msg);

  if (defaultsError) {
    card.append(
      h(
        "div",
        { class: "callout safety" },
        h("p", null, t("setup.defaultsFailedHead")),
        h("p", { class: "meta" }, defaultsError),
        h("p", null, t("setup.defaultsFailedBody"))
      )
    );
  } else {
    card.append(
      h(
        "button",
        {
          class: "btn btn-primary",
          type: "button",
          onclick: async () => {
            const values = {};
            for (const f of KEEPER_FACTS) {
              const raw = inputs.get(f.key).value.trim();
              if (raw === "") {
                msg.textContent = t("setup.needed", { label: t(f.label) });
                return;
              }
              const n = Number(raw);
              if (!Number.isFinite(n)) {
                msg.textContent = t("entry.notANumber", { text: raw });
                return;
              }
              values[f.key] = n;
            }
            if (values.targetRangeMinDkh >= values.targetRangeMaxDkh) {
              msg.textContent = t("setup.rangeOrder");
              return;
            }
            /* THE APPLICATION'S CLOCK, NOT THE WALL CLOCK.

               Canon §518 makes an assessment resolve the configuration version
               effective at its `assessmentAsOf`, and the engine refuses with
               `M-12` when no version is effective by then. Stamped from the
               wall clock, a configuration created inside test mode is
               effective at the real instant it was typed — so every assessment
               the keeper backdates finds no configuration at all and refuses,
               with a reason about historical configuration that reads as
               nonsense to someone who set the tank up two minutes ago. The
               feature did not work on its own primary path.

               This is not a fabricated date. In test mode the application's
               "now" IS the chosen instant; the keeper is stating the tank
               facts as of the moment the app is standing at, in a store that
               is a hypothetical by construction and can never reach the real
               tank. In normal operation the two clocks are the same value, so
               nothing about real use changes. */
            await ctx.store.config.append(
              { ...defaults, ...values, selectedPotencySource: "THEORETICAL_OR_CONFIGURED" },
              nowIso()
            );
            ctx.go("today");
          },
        },
        current ? t("setup.saveExisting") : t("setup.save")
      )
    );
  }
  screen.append(card);

  screen.append(
    h(
      "section",
      { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, t("setup.decidesTitle"))),
      h("p", { class: "body" }, t("setup.decidesBody")),
      h("p", { class: "inert-note" }, t("setup.decidesNote"))
    )
  );

  return screen;
}

/* --- settings ------------------------------------------------------------ */

export async function renderSettings(ctx) {
  const [config, history, health, witness, assessments, preference] = await Promise.all([
    ctx.store.config.current(),
    ctx.store.config.history(),
    ctx.store.health(),
    ctx.store.witness(),
    ctx.store.assessments.all(),
    readPreference(ctx.store),
  ]);

  const screen = h("main", { class: "screen" });
  screen.append(
    h(
      "header",
      { class: "topbar" },
      h("div", null, h("h1", null, t("settings.title"))),
      h("button", { class: "backlink", type: "button", onclick: () => ctx.go("today") }, t("action.done"))
    )
  );

  /* Tank facts */
  const tank = h("section", { class: "card" });
  tank.append(h("div", { class: "card-head" }, h("h2", null, t("settings.yourTank"))));
  if (config) {
    const kv = h("div", { class: "kv" });
    for (const f of KEEPER_FACTS) {
      kv.append(
        h("div", { class: "kv-row" },
          h("span", { class: "kv-k" }, t(f.label)),
          h(
            "span",
            { class: "kv-v" },
            config[f.key] != null
              ? t("settings.factValue", { value: config[f.key], unit: f.unit })
              : t("settings.notSet")
          ))
      );
    }
    tank.append(kv);
  }
  tank.append(h("button", { class: "btn", type: "button", onclick: () => ctx.go("setup") }, t("settings.change")));
  tank.append(
    h(
      "p",
      { class: "inert-note" },
      t("settings.changeNote")
    )
  );
  screen.append(tank);

  /* Solution strength provenance — V1 backlog TW-061, unbuilt in V1. */
  screen.append(
    h(
      "section",
      { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, t("settings.strengthTitle"))),
      h(
        "p",
        { class: "body" },
        config?.selectedPotencyDkhPerMl != null
          ? t("settings.strengthBody", { value: config.selectedPotencyDkhPerMl })
          : t("settings.strengthNone")
      ),
      h("p", { class: "inert-note" }, t("settings.strengthNote"))
    )
  );

  /* What happens when a test is suggested.

     `docs/implementation/app/TASKS-AND-SCHEDULING.md`: the setting "must state
     what is actually happening, not just name a preference, and must be
     findable by someone who ticked the box months ago and has forgotten". So
     it is a sentence about behaviour rather than a labelled switch, and the
     way out of it is the only control on the row. */
  const pref = h("section", { class: "card" });
  pref.append(
    h("div", { class: "card-head" }, h("h2", null, t("pref.title"))),
    h(
      "p",
      { class: "body" },
      preference === PREFERENCE.REPLACE
        ? t("pref.currentlyReplace")
        : preference === PREFERENCE.ADD_EXTRA
          ? t("pref.currentlyExtra")
          : t("pref.currentlyAsk")
    )
  );
  if (preference !== PREFERENCE.ASK) {
    pref.append(
      h(
        "button",
        {
          class: "btn",
          type: "button",
          onclick: () => ctx.setSuggestionPreference(PREFERENCE.ASK),
        },
        t("pref.askEachTime")
      )
    );
  }
  screen.append(pref);

  /* Configuration history */
  const hist = h("section", { class: "card" });
  hist.append(h("div", { class: "card-head" }, h("h2", null, t("settings.historyTitle")), h("span", { class: "aside" }, String(history.length))));
  const hl = h("ul", { class: "tasklist" });
  for (const c of history) {
    hl.append(
      h("li", null,
        h("span", { class: "taskrow" },
          h("span", { class: "tick done" }, "·"),
          h("span", null,
            h("span", { class: "t" }, c.configVersionId),
            h(
              "span",
              { class: "d" },
              t("settings.historyRow", {
                date: fmtDayName(c.effectiveFrom.slice(0, 10)),
                min: c.targetRangeMinDkh,
                max: c.targetRangeMaxDkh,
              })
            ))))
    );
  }
  hist.append(hl);
  screen.append(hist);

  /* Durability, honestly */
  const dur = h("section", { class: "card" });
  dur.append(h("div", { class: "card-head" }, h("h2", null, t("settings.dataTitle"))));
  dur.append(
    h("div", { class: "kv" },
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("settings.storage")), h("span", { class: "kv-v" }, health.ok ? t("settings.storageOk") : health.reason || t("settings.storageBad"))),
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("settings.assessmentsSaved")), h("span", { class: "kv-v" }, String(assessments.length))),
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("settings.thisInstall")), h("span", { class: "kv-v" }, witnessWords(witness)))
    )
  );
  dur.append(
    h("div", { class: "btn-row" },
      h("button", { class: "btn", type: "button", onclick: () => exportEverything(ctx) }, t("settings.export")),
      h("button", { class: "btn btn-quiet", type: "button", onclick: () => openWipeInfo() }, t("settings.whatSurvives"))
    )
  );
  dur.append(
    h(
      "p",
      { class: "inert-note" },
      t("settings.dataNote")
    )
  );
  screen.append(dur);

  /* Test mode.

     Here rather than on the tab bar, because it is not part of keeping a tank
     — it is a way of asking the engine what it would say on a day that has not
     happened. Off unless the keeper turned it on, and the row says which. */
  const testing = ctx.mode ? ctx.mode() === MODE.TEST : false;
  screen.append(
    h(
      "section",
      { class: "card" + (testing ? " is-testmode" : "") },
      h(
        "div",
        { class: "card-head" },
        h("h2", null, t("testmode.title")),
        h("span", { class: testing ? "pill pill-test" : "pill pill-neutral" }, testing ? t("testmode.on") : t("testmode.off"))
      ),
      h("p", { class: "body" }, testing ? t("settings.testmode.onBody") : t("settings.testmode.offBody")),
      h(
        "button",
        { class: "btn", type: "button", onclick: () => ctx.go("testmode") },
        testing ? t("settings.testmode.open") : t("settings.testmode.setUp")
      ),
      h("p", { class: "inert-note" }, t("settings.testmode.note"))
    )
  );

  /* Platform */
  screen.append(await renderPlatform(ctx));

  /* Tools, present and disabled */
  screen.append(
    h(
      "section",
      { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, t("tools.title")), h("span", { class: "pill pill-neutral" }, t("tab.later"))),
      h("p", { class: "body" }, t("tools.settingsBody")),
      h("p", { class: "inert-note" }, t("tools.settingsNote"))
    )
  );

  return screen;
}

function witnessWords(w) {
  if (w.state === "FRESH") return t("settings.witness.fresh");
  if (w.state === "SUSPECT") return t("settings.witness.suspect");
  return t("settings.witness.known", { date: fmtDayName(w.since.slice(0, 10)) });
}

function openWipeInfo() {
  openSheet({
    title: t("survives.title"),
    body: h(
      "div",
      null,
      h("p", { class: "body" }, t("survives.intro")),
      h("p", { class: "seclabel" }, t("survives.yes")),
      h("p", { class: "body" }, t("survives.yesBody")),
      h("p", { class: "seclabel" }, t("survives.no")),
      h("p", { class: "body" }, t("survives.noBody")),
      h("p", { class: "inert-note" }, t("survives.note"))
    ),
    actions: (close) => [h("button", { class: "btn", type: "button", onclick: close }, t("action.close"))],
  });
}

async function exportEverything(ctx) {
  const [events, annotations, assessments, tasks, completions, config] = await Promise.all([
    ctx.store.ledger.allEvents(),
    ctx.store.ledger.allAnnotations(),
    ctx.store.assessments.all(),
    ctx.store.tasks.tasks(),
    ctx.store.tasks.completions(),
    ctx.store.config.history(),
  ]);
  const doc = {
    exportSchemaVersion: 1,
    exportedAt: new Date().toISOString(),
    events,
    annotations,
    assessments,
    tasks,
    completions,
    configurations: config,
  };
  const blob = new Blob([JSON.stringify(doc, null, 1)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dosing-wizard-v2-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* --- the platform card --------------------------------------------------- */

async function renderPlatform(ctx) {
  const card = h("section", { class: "card" });
  card.append(h("div", { class: "card-head" }, h("h2", null, t("platform.title"))));

  const kv = h("div", { class: "kv" });
  kv.append(
    h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("platform.network")), h("span", { class: "kv-v" }, navigator.onLine ? t("platform.online") : t("platform.offline"))),
    h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("platform.installed")), h("span", { class: "kv-v" },
      window.matchMedia("(display-mode: standalone)").matches ? t("platform.installedYes") : t("platform.installedNo")))
  );

  const engineRow = h("span", { class: "kv-v" }, t("platform.checking"));
  kv.append(h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("platform.engine")), engineRow));
  describe().then(
    (d) => {
      engineRow.textContent = t("platform.engineVersions", {
        engine: d.engineVersion,
        canon: d.canonVersion,
      });
    },
    (e) => {
      engineRow.textContent = t("platform.engineFailed", { error: e.message });
    }
  );

  const swRow = h("span", { class: "kv-v" }, t("platform.checking"));
  kv.append(h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("platform.offlineCopy")), swRow));
  if (ctx.state.offlineCopyError) {
    swRow.textContent = t("platform.offlineCopyFailed", { error: ctx.state.offlineCopyError });
  } else if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistration().then((reg) => {
      swRow.textContent = reg
        ? reg.waiting
          ? t("platform.updateReady")
          : t("platform.offlineReady")
        : t("platform.notInstalled");
    });
  } else {
    swRow.textContent = t("platform.noServiceWorker");
  }

  card.append(kv);
  card.append(
    h(
      "p",
      { class: "inert-note" },
      t("platform.note")
    )
  );
  return card;
}

/* --- tools, disabled ----------------------------------------------------- */

export function renderTools(ctx) {
  const screen = h("main", { class: "screen" });
  screen.append(
    h(
      "header",
      { class: "topbar" },
      h("div", null, h("h1", null, t("tools.title")), h("p", { class: "sub" }, t("tools.subtitle")))
    )
  );
  screen.append(
    h(
      "section",
      { class: "card" },
      h("p", { class: "body" }, t("tools.body")),
      h("p", { class: "inert-note" }, t("tools.note"))
    )
  );
  return screen;
}
