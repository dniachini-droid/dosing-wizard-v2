/* ============================================================================
   IMPORT — A ONE-TIME FLOW, NOT A MIGRATION
   ----------------------------------------------------------------------------
   The keeper chooses to run this, and sees exactly what it will do before any
   of it happens. It is not an automatic migration on first launch: a migration
   that runs itself is a migration nobody read the report of.

   The report is the point of the screen. It says how many of each kind, how
   many readings carry a time and how many do not, where dose history begins
   and what that means for the period before it, and which records the salvage
   inventory calls into question. Then the keeper presses the button, or does
   not.

   Running it twice changes nothing. The second run's report says so — every
   count is zero and the screen says the record already holds them — rather
   than the button doing nothing with no explanation.
   ========================================================================= */

import { h } from "../ui/dom.js";
import { fmtDayName, fmtShort } from "../ui/format.js";
import { parameterDef } from "../store/ledger.js";
import { ASSUMPTION, localZone, localOffsetMinutes, nowIso } from "../store/time.js";
import {
  applyImport,
  checkCounts,
  describePlan,
  parseBackup,
  planImport,
} from "../store/import-v1.js";
import { t } from "../strings.js";

/* The owner's stated correction to the solution strength. It is a KEEPER FACT
   — the strength of the solution in his own dosing container — and it is his
   to state, exactly like the tank's volume. It is not a canon value and
   governs no rule; the engine reads it as configuration.

   Held on the screen rather than in the importer because it is the keeper
   answering a question, and he can change it before pressing the button. */
const STATED_POTENCY_DKH_PER_ML = "0.0693";

/* WHAT IS ASSUMED ABOUT THE RECORDED CLOCK TIMES, AND WHO ASSUMED IT.

   OWNER DECISION, 2026-08-21. An earlier build asked the keeper which timezone
   his old clock readings were in and recorded the answer as his statement. It
   was removed: the tank does not travel, so one offset applied to every row
   leaves every elapsed interval between them exactly right, and elapsed
   interval is all the engine computes from these times. There is nothing worth
   asking him.

   So the device's offset is applied, and the record says plainly that it was
   ASSUMED. `assumedLocalInstant` writes `assumed: true` and
   `statedByKeeper: false` onto every record it builds. That distinction is
   jake's, and it is the load-bearing part: a default nobody typed must never be
   stored as something the keeper said. It is not silent either — the screen
   states it, with the offset, before anything is written.

   Where this sits against canon `SHARED-LEGACY-TIME-001` is recorded as an open
   item, not argued away. See `store/time.js`. */
const ASSUMPTION_BASIS = ASSUMPTION.DEVICE_ZONE;

function assumptionNow() {
  return {
    basis: ASSUMPTION_BASIS,
    zoneId: localZone() || null,
    offsetMinutes: localOffsetMinutes(),
    appliedAt: nowIso(),
  };
}

export async function renderImportV1(ctx) {
  const screen = h("main", { class: "screen" });
  screen.append(
    h(
      "header",
      { class: "topbar" },
      h("div", null, h("h1", null, t("import.title")), h("p", { class: "sub" }, t("import.subtitle"))),
      h("button", { class: "backlink", type: "button", onclick: () => ctx.go("settings") }, t("action.done"))
    )
  );

  /* What the last run of this actually did, if it has just happened. Shown
     ahead of everything else, because it is the answer to the question the
     keeper pressed a button to ask. */
  const justDone = ctx.state.lastImport;
  if (justDone) {
    ctx.state.lastImport = null;
    screen.append(doneCard(justDone));
  }

  const already = await ctx.store.kvGet("v1Import");
  if (already && !justDone) screen.append(previouslyCard(already));

  const report = h("div");

  const potency = h("input", {
    class: "input",
    inputmode: "decimal",
    value: STATED_POTENCY_DKH_PER_ML,
    "aria-label": t("import.potency.label"),
  });

  const file = h("input", {
    class: "input",
    type: "file",
    accept: "application/json,.json",
    "aria-label": t("import.chooseFile"),
    onchange: async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      report.replaceChildren(h("p", { class: "body" }, t("import.reading")));
      let text;
      try {
        text = await f.text();
      } catch (err) {
        report.replaceChildren(h("p", { class: "body" }, err.message));
        return;
      }
      await showReport(ctx, report, { text, filename: f.name, potency });
    },
  });

  screen.append(
    h(
      "section",
      { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, t("import.chooseTitle"))),
      h("p", { class: "body" }, t("import.chooseBody")),
      h("div", { class: "field" }, h("span", { class: "flabel" }, t("import.chooseFile")), file),
      h(
        "div",
        { class: "field" },
        h("span", { class: "flabel" }, t("import.potency.label")),
        potency,
        h("p", { class: "hint" }, t("import.potency.hint"))
      )
    )
  );

  screen.append(report);
  return screen;
}

function doneCard(record) {
  const w = record.written;
  return h(
    "section",
    { class: "card" },
    h("div", { class: "card-head" }, h("h2", null, t("import.done.title"))),
    h(
      "p",
      { class: "body" },
      t("import.done.body", { n: w.readings + w.doses + w.waterChanges + w.icps + w.lighting })
    ),
    h(
      "div",
      { class: "kv" },
      kv(t("import.what.readings"), String(w.readings)),
      kv(t("import.what.doses"), String(w.doses)),
      kv(t("import.what.water"), String(w.waterChanges)),
      kv(t("import.what.icps"), String(w.icps)),
      kv(t("import.what.lighting"), String(w.lighting)),
      kv(t("import.what.tasks"), String(w.tasks)),
      kv(t("import.what.completions"), String(w.completions))
    ),
    h("p", { class: "inert-note" }, t("import.done.note"))
  );
}

function previouslyCard(record) {
  const incomplete = record.state === "INCOMPLETE" || record.state === "STARTED";
  return h(
    "section",
    { class: "card" },
    h(
      "div",
      { class: "card-head" },
      h("h2", null, incomplete ? t("import.previously.incompleteTitle") : t("import.previously.title")),
      incomplete ? h("span", { class: "pill pill-attention" }, t("import.previously.incompletePill")) : null
    ),
    incomplete
      ? h("div", { class: "callout attention" }, h("p", null, t("import.previously.incompleteBody")))
      : null,
    h(
      "div",
      { class: "kv" },
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("import.previously.when")), h("span", { class: "kv-v" }, fmtDayName(record.at.slice(0, 10)))),
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("import.previously.file")), h("span", { class: "kv-v" }, record.filename || "—")),
      record.written
        ? h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("import.previously.readings")), h("span", { class: "kv-v" }, String(record.written.readings)))
        : null
    ),
    h("p", { class: "inert-note" }, t("import.previously.note"))
  );
}

/* --- the report ---------------------------------------------------------- */

async function showReport(ctx, host, { text, filename, potency }) {
  host.replaceChildren();

  const parsed = parseBackup(text);
  if (!parsed.ok) {
    host.append(refusal(t("import.refused.title"), parsed.why));
    return;
  }

  /* THE FILE'S OWN COUNTS, AGAINST WHAT IS IN IT.

     A file whose stated counts disagree with its contents is not the file it
     claims to be, and importing it anyway would be guessing which half to
     believe. Stopped and reported. */
  const counts = checkCounts(parsed.doc);
  if (counts.disagreements.length) {
    const list = h("ul", { class: "tasklist" });
    for (const d of counts.disagreements) {
      list.append(
        h("li", null, h("span", { class: "taskrow" }, h("span", { class: "tick" }, "·"),
          h("span", null, h("span", { class: "t" }, d.key),
            h("span", { class: "d" }, d.unstated
              ? t("import.countUnstated", { actual: d.actual })
              : t("import.countMismatch", { stated: d.stated, actual: d.actual })))))
      );
    }
    const allUnstated = counts.disagreements.every((d) => d.unstated);
    host.append(
      refusal(
        t("import.refused.counts"),
        allUnstated ? t("import.refused.countsUnstated") : t("import.refused.countsBody")
      ),
      list
    );
    return;
  }

  const [projected, completions, config] = await Promise.all([
    ctx.store.ledger.projection(),
    ctx.store.tasks.completions(),
    ctx.store.config.current(),
  ]);
  const planned = planImport(parsed.doc, {
    existing: projected,
    existingCompletions: completions,
    config,
    assumption: assumptionNow(),
  });
  const described = describePlan(planned, assumptionNow());

  if (planned.problems.length) {
    const list = h("ul", { class: "tasklist" });
    for (const p of planned.problems.slice(0, 20)) {
      list.append(h("li", null, h("span", { class: "taskrow" }, h("span", { class: "tick" }, "·"), h("span", null, h("span", { class: "d" }, p.why)))));
    }
    host.append(refusal(t("import.refused.rows"), t("import.refused.rowsBody", { n: planned.problems.length })), list);
    return;
  }

  const nothingNew =
    planned.readings.length === 0 &&
    planned.doses.length === 0 &&
    planned.waterChanges.length === 0 &&
    planned.icps.length === 0 &&
    planned.lighting.length === 0 &&
    planned.completions.length === 0;

  if (nothingNew) {
    host.append(
      h(
        "section",
        { class: "card" },
        h("div", { class: "card-head" }, h("h2", null, t("import.nothingNew.title"))),
        h("p", { class: "body" }, t("import.nothingNew.body")),
        h(
          "div",
          { class: "kv" },
          kv(t("import.alreadyHeld.readings"), String(planned.skipped.readings)),
          kv(t("import.alreadyHeld.doses"), String(planned.skipped.doses)),
          kv(t("import.alreadyHeld.water"), String(planned.skipped.waterChanges)),
          kv(t("import.alreadyHeld.icps"), String(planned.skipped.icps)),
          kv(t("import.alreadyHeld.completions"), String(planned.skipped.completions))
        ),
        h("p", { class: "inert-note" }, t("import.nothingNew.note"))
      )
    );
    return;
  }

  host.append(whatComesAcross(planned, described));
  host.append(timeCard(described));
  host.append(assumptionCard(described));
  host.append(eligibilityCard(described));
  host.append(provenanceCard(planned));
  host.append(remindersCard(planned));
  host.append(configurationCard(planned, potency));

  const msg = h("p", { class: "hint" });
  host.append(
    h(
      "section",
      { class: "card" },
      h("div", { class: "card-head" }, h("h2", null, t("import.run.title"))),
      h("p", { class: "body" }, t("import.run.body")),
      msg,
      h(
        "div",
        { class: "btn-row" },
        h(
          "button",
          {
            class: "btn btn-primary",
            type: "button",
            onclick: async (e) => {
              e.target.disabled = true;
              msg.textContent = t("import.run.working");
              const at = nowIso();
              /* THE FILE IS KEPT BEFORE ANYTHING IS WRITTEN, NOT AFTER.

                 Kept afterwards, it was kept only on the runs that succeeded —
                 and the run where the record most needs checking against the
                 file is the one that failed halfway. It is written first, with
                 what it is about to attempt, and the outcome is filled in when
                 there is one. */
              await ctx.store.kvSet("v1Import", {
                at,
                filename,
                state: "STARTED",
                potencyDkhPerMl: potency.value.trim() === "" ? null : Number(potency.value),
                assumption: assumptionNow(),
                originalFile: text,
              });
              try {
                const written = await applyImport(ctx.store, planned, {
                  asOf: at,
                  correctedPotencyDkhPerMl: potency.value.trim() === "" ? null : Number(potency.value),
                  assumption: assumptionNow(),
                });
                /* THE ORIGINAL FILE IS PRESERVED, VERBATIM.

                   Nothing is overwritten in place and nothing is discarded:
                   the text that was imported is kept exactly as it arrived,
                   beside a record of what was made from it. If a later
                   question arises about what the file actually said, the file
                   is still there to answer it. */
                await ctx.store.kvSet("v1Import", {
                  at,
                  filename,
                  state: "DONE",
                  written,
                  potencyDkhPerMl: potency.value.trim() === "" ? null : Number(potency.value),
                  assumption: assumptionNow(),
                  originalFile: text,
                });
                /* WHAT HAPPENED, ON A SCREEN THAT SURVIVES THE REDRAW.

                   Setting a message and then asking the shell to refresh was
                   a message the refresh destroyed: the keeper pressed the
                   button, the screen redrew, and nothing anywhere said whether
                   353 records had arrived or none had. The outcome is state
                   now, so the redraw renders it. */
                ctx.state.lastImport = { at, filename, written };
                await ctx.reassessAndGo("import");
              } catch (err) {
                /* A partial write is a real state and it is recorded as one.
                   The natural-key dedupe means running the import again
                   finishes what this one started rather than duplicating it,
                   and the screen says so instead of leaving a raw error. */
                await ctx.store.kvSet("v1Import", {
                  at,
                  filename,
                  state: "INCOMPLETE",
                  reason: err.message,
                  potencyDkhPerMl: potency.value.trim() === "" ? null : Number(potency.value),
                  assumption: assumptionNow(),
                  originalFile: text,
                });
                e.target.disabled = false;
                msg.textContent = t("import.run.failed", { reason: err.message });
              }
            },
          },
          t("import.run.action")
        ),
        h("button", { class: "btn btn-quiet", type: "button", onclick: () => ctx.go("settings") }, t("action.close"))
      ),
      h("p", { class: "inert-note" }, t("import.run.note"))
    )
  );
}

function refusal(title, body) {
  return h(
    "section",
    { class: "card" },
    h("div", { class: "card-head" }, h("h2", null, title)),
    h("div", { class: "callout safety" }, h("p", null, body))
  );
}

function kv(k, v) {
  return h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, k), h("span", { class: "kv-v" }, v));
}

function whatComesAcross(planned, described) {
  const card = h("section", { class: "card" });
  card.append(h("div", { class: "card-head" }, h("h2", null, t("import.what.title"))));

  const table = h("div", { class: "kv" });
  for (const p of described.parameters) {
    const def = parameterDef(p.parameter);
    table.append(
      h(
        "div",
        { class: "kv-row" },
        h("span", { class: "kv-k" }, def ? def.label : p.parameter),
        h(
          "span",
          { class: "kv-v" },
          t("import.what.readingRow", { n: p.total, withTime: p.withTime }),
          h("span", { class: "sub" }, t("import.what.span", { from: fmtShort(p.from), to: fmtShort(p.to) }))
        )
      )
    );
  }
  card.append(table);

  card.append(
    h(
      "div",
      { class: "kv" },
      kv(t("import.what.readings"), String(planned.readings.length)),
      kv(t("import.what.doses"), String(planned.doses.length)),
      kv(t("import.what.water"), String(planned.waterChanges.length)),
      kv(t("import.what.icps"), String(planned.icps.length)),
      kv(t("import.what.lighting"), String(planned.lighting.length)),
      kv(t("import.what.tasks"), String(planned.tasks.length)),
      kv(t("import.what.completions"), String(planned.completions.length))
    )
  );

  if (planned.notImported.dismissedFindings || planned.notImported.dosingPlans) {
    card.append(
      h(
        "p",
        { class: "inert-note" },
        t("import.what.notImported", {
          findings: planned.notImported.dismissedFindings,
          plans: planned.notImported.dosingPlans,
        })
      )
    );
  }
  return card;
}

/* WHAT WAS ASSUMED ABOUT THE RECORDED TIMES, SAID BEFORE ANYTHING IS WRITTEN.

   The keeper is not asked anything here. He is TOLD what will be assumed, what
   it does and does not change, and that the assumption goes on the record as an
   assumption rather than as something he said. */
function assumptionCard(described) {
  const card = h("section", { class: "card" });
  card.append(h("div", { class: "card-head" }, h("h2", null, t("import.assumed.title"))));
  card.append(
    h(
      "div",
      { class: "kv" },
      kv(t("import.assumed.offset"), offsetWords(described.assumedOffsetMinutes, described.assumedZoneId)),
      kv(t("import.assumed.applies"), String(described.exactElapsedAvailable)),
      kv(t("import.assumed.untouched"), String(described.dateOnly))
    ),
    h("p", { class: "body" }, t("import.assumed.body", { n: described.withTime })),
    h("p", { class: "body" }, t("import.assumed.elapsed")),
    h("p", { class: "body" }, t("import.assumed.recorded")),
    h("p", { class: "inert-note" }, t("import.assumed.note"))
  );
  return card;
}

/* `+10:00`, with the zone's own name beside it where the device has one. */
function offsetWords(offsetMinutes, zoneId) {
  if (!Number.isFinite(offsetMinutes)) return t("import.assumed.noOffset");
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  const pad = (n) => String(n).padStart(2, "0");
  const off = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return zoneId ? t("import.assumed.offsetWith", { offset: off, zone: zoneId }) : off;
}

function timeCard(described) {
  return h(
    "section",
    { class: "card" },
    h("div", { class: "card-head" }, h("h2", null, t("import.time.title"))),
    h(
      "div",
      { class: "kv" },
      kv(t("import.time.dateOnly"), t("import.time.of", { n: described.dateOnly, total: described.total })),
      kv(t("import.time.withTime"), t("import.time.of", { n: described.withTime, total: described.total })),
      kv(t("import.time.exact"), t("import.time.of", { n: described.exactElapsedAvailable, total: described.total }))
    ),
    h("p", { class: "body" }, t("import.time.body")),
    h("p", { class: "body" }, t("import.time.local")),
    h("p", { class: "inert-note" }, t("import.time.note"))
  );
}

function eligibilityCard(described) {
  const card = h("section", { class: "card" });
  card.append(h("div", { class: "card-head" }, h("h2", null, t("import.eligibility.title"))));
  card.append(h("p", { class: "body" }, t("import.eligibility.everything")));

  if (described.doseHistoryFrom) {
    card.append(
      h(
        "div",
        { class: "kv" },
        kv(t("import.eligibility.doseFrom"), fmtDayName(described.doseHistoryFrom)),
        kv(t("import.eligibility.before"), String(described.alkBeforeBoundary)),
        kv(t("import.eligibility.after"), String(described.alkAfterBoundary))
      ),
      h("p", { class: "body" }, t("import.eligibility.beforeBody", { date: fmtDayName(described.doseHistoryFrom) })),
      h("p", { class: "body" }, t("import.eligibility.afterBody"))
    );

    /* THE THING THE KEEPER MOST NEEDS TO READ.

       The period with dose records either side of it is the part worth
       analysing, and whether it CAN be analysed turns on how many of its
       readings carry an instant behind them. That is counted rather than
       assumed — and where the answer is none, he is told here, before the
       import runs, rather than left to discover it as a refusal afterwards. */
    if (described.exactElapsedAvailable === 0 && described.alkAfterBoundary > 0) {
      card.append(
        h(
          "div",
          { class: "callout attention" },
          h("p", null, t("import.eligibility.noInstantHead")),
          h("p", null, t("import.eligibility.noInstantBody", { date: fmtDayName(described.doseHistoryFrom) }))
        )
      );
    }
  } else {
    card.append(h("p", { class: "body" }, t("import.eligibility.noDoseHistory")));
  }

  card.append(h("p", { class: "inert-note" }, t("import.eligibility.note")));
  return card;
}

function provenanceCard(planned) {
  const n = planned.waterChanges.length + planned.icps.length + planned.lighting.length;
  if (!n) return h("div");
  return h(
    "section",
    { class: "card" },
    h("div", { class: "card-head" }, h("h2", null, t("import.provenance.title")), h("span", { class: "pill pill-attention" }, String(n))),
    h("p", { class: "body" }, t("import.provenance.body")),
    h(
      "div",
      { class: "kv" },
      kv(t("import.what.water"), String(planned.waterChanges.length)),
      kv(t("import.what.icps"), String(planned.icps.length)),
      kv(t("import.what.lighting"), String(planned.lighting.length))
    ),
    h("p", { class: "body" }, t("import.provenance.question")),
    h("p", { class: "inert-note" }, t("import.provenance.note"))
  );
}

function remindersCard(planned) {
  if (!planned.tasks.length) return h("div");
  const list = h("div", { class: "kv" });
  for (const task of planned.tasks) {
    list.append(kv(task.label, t("import.reminders.row", { label: "", interval: task.intervalDays }).trim()));
  }
  return h(
    "section",
    { class: "card" },
    h("div", { class: "card-head" }, h("h2", null, t("import.reminders.title")), h("span", { class: "aside" }, String(planned.tasks.length))),
    h("p", { class: "body" }, t("import.reminders.body", { n: planned.tasks.length })),
    list,
    h("p", { class: "body" }, t("import.reminders.unverified"))
  );
}

function configurationCard(planned, potency) {
  const cfg = planned.configuration;
  const rows = h("div", { class: "kv" });
  rows.append(kv(t("import.config.volume"), t("import.config.litres", { n: cfg.netVolumeL })));
  if (cfg.targetRangeMinDkh != null) {
    rows.append(kv(t("import.config.alkRange"), t("import.config.range", { min: cfg.targetRangeMinDkh, max: cfg.targetRangeMaxDkh, unit: "dKH" })));
  }
  for (const [key, r] of Object.entries(cfg.parameterRanges)) {
    const def = parameterDef(key);
    rows.append(kv(def ? def.label : key, t("import.config.range", { min: r.min, max: r.max, unit: def ? def.unit : "" })));
  }

  return h(
    "section",
    { class: "card" },
    h("div", { class: "card-head" }, h("h2", null, t("import.config.title"))),
    h("p", { class: "body" }, t("import.config.body")),
    rows,
    h(
      "div",
      { class: "callout attention" },
      h("p", null, t("import.config.potencyHead")),
      h(
        "p",
        null,
        t("import.config.potencyBody", { imported: cfg.importedDkhPerMlPer100L, corrected: potency.value })
      ),
      h("p", null, t("import.config.potencyKept"))
    ),
    h("p", { class: "inert-note" }, t("import.config.note"))
  );
}
