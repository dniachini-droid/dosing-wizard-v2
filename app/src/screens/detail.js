/* ============================================================================
   THE ASSESSMENT, IN FULL
   ----------------------------------------------------------------------------
   The working shown so it can be checked by hand, and the record it was
   written into so it can be replayed.

   Everything here is read from the engine result and from the stored record.
   The arithmetic the "how this was worked out" section shows is the ENGINE's
   arithmetic, quoted back with the engine's own numbers on both sides — it is
   not recomputed here, and if it were the two could disagree.
   ========================================================================= */

import { h } from "../ui/dom.js";
import { renderAssessment, renderDeveloperView } from "./assessment.js";
import { alkTrace } from "./today.js";
import { isPresent } from "../present/cards.js";
import { num, signed, sayAbsent, whyAbsent } from "../present/wording.js";
import { fmtDayName, fmtTimeOfDay } from "../ui/format.js";
import { replay } from "../assess.js";
import { t } from "../strings.js";

export async function renderAssessmentDetail(ctx) {
  const { store, state } = ctx;
  const [projected, config] = await Promise.all([store.ledger.projection(), store.config.current()]);
  const rec = state.assessment?.record || (await store.assessments.latest());
  const result = state.assessment?.engineResult || rec?.engineResult;

  const screen = h("main", { class: "screen" });
  screen.append(
    h(
      "header",
      { class: "topbar" },
      h("div", null, h("h1", null, t("working.title")), h("p", { class: "sub" }, t("working.subtitle"))),
      h("button", { class: "backlink", type: "button", onclick: () => ctx.go("today") }, t("action.back"))
    )
  );

  if (!result) {
    screen.append(
      h(
        "section",
        { class: "card" },
        h("p", { class: "body" }, t("working.none")),
        h("p", { class: "inert-note" }, t("working.noneNote"))
      )
    );
    return screen;
  }

  screen.append(renderAssessment(result, { readings: alkTrace(projected, result), config }));
  screen.append(renderWorking(result));
  if (rec) screen.append(renderRecord(ctx, rec));
  screen.append(renderDeveloperView(result, rec));
  return screen;
}

function row(k, v, sub) {
  return h(
    "div",
    { class: "kv-row" },
    h("span", { class: "kv-k" }, k),
    h("span", { class: "kv-v" + (sub ? " is-absent" : "") }, v, sub ? h("span", { class: "sub" }, sub) : null)
  );
}

function figure(label, v, decimals, unit) {
  return isPresent(v)
    ? row(label, `${num(v, decimals)}${unit ? " " + unit : ""}`)
    : row(label, sayAbsent(v), whyAbsent(v));
}

function renderWorking(r) {
  const card = h("section", { class: "card" });
  card.append(h("div", { class: "card-head" }, h("h2", null, t("working.head"))));

  const obs = typeof r.observedTrajectory === "object" ? r.observedTrajectory : null;
  const sup = typeof r.supportedTrajectory === "object" ? r.supportedTrajectory : null;
  const con = typeof r.consumption === "object" ? r.consumption : null;
  const d = r.doseRecommendation || {};
  const p = r.potency || {};

  card.append(h("p", { class: "seclabel" }, t("working.fromReadings")));
  const a = h("div", { class: "kv" });
  if (obs) {
    a.append(
      row(t("working.testsUsed"), String(obs.independentClusters)),
      row(t("working.daysCovered"), num(obs.spanDays, 2)),
      figure(t("working.measuredDrift"), obs.observedSlopeDkhPerDay, 4, "dKH/day"),
      figure(t("working.scatterLine"), obs.sigmaResidDkh, 4, "dKH"),
      figure(t("working.scatterPoint"), obs.sigmaPointDkh, 4, "dKH"),
      figure(t("working.driftUncertainty"), obs.sigmaSDkhPerDay, 4, "dKH/day")
    );
  } else {
    a.append(row(t("working.trend"), sayAbsent(r.observedTrajectory), whyAbsent(r.observedTrajectory)));
  }
  card.append(a);

  card.append(h("p", { class: "seclabel" }, t("working.standBehind")));
  const b = h("div", { class: "kv" });
  if (sup) {
    b.append(
      figure(t("working.supportedDrift"), sup.supportedSlopeDkhPerDay, 4, "dKH/day"),
      figure(t("working.takenOff"), sup.supportSubtractionDkhPerDay, 4, "dKH/day"),
      row(t("working.limitedBy"), sup.limitedByUncertainty ? t("working.yes") : t("working.no"))
    );
    if (obs && isPresent(obs.observedSlopeDkhPerDay) && isPresent(sup.supportedSlopeDkhPerDay)) {
      b.append(
        row(
          t("working.whichIs"),
          t("working.whichIsValue", {
            observed: signed(obs.observedSlopeDkhPerDay, 4),
            subtracted: num(sup.supportSubtractionDkhPerDay, 4),
          })
        )
      );
    }
  } else {
    b.append(row(t("working.supportedLabel"), sayAbsent(r.supportedTrajectory), whyAbsent(r.supportedTrajectory)));
  }
  card.append(b);

  card.append(h("p", { class: "seclabel" }, t("working.tankUses")));
  const c = h("div", { class: "kv" });
  if (con) {
    c.append(
      figure(t("working.perDay"), con.consumptionDkhPerDay, 4, "dKH/day"),
      figure(t("working.avgDose"), con.doseHistoryMeanMlPerDay, 2, "mL/day"),
      figure(t("working.perMl"), con.selectedPotencyDkhPerMl, 4, "dKH")
    );
  } else {
    c.append(row(t("working.dailyUse"), sayAbsent(r.consumption), whyAbsent(r.consumption)));
  }
  card.append(c);

  card.append(h("p", { class: "seclabel" }, t("working.dose")));
  const e = h("div", { class: "kv" });
  e.append(
    figure(t("working.doseNow"), d.currentDoseMlPerDay, 1, "mL/day"),
    figure(t("working.doseSteady"), d.maintenanceEstimateMlPerDay, 3, "mL/day"),
    figure(t("working.beforeRounding"), d.continuousActionCandidateMlPerDay, 3, "mL/day"),
    figure(t("working.recommended"), d.recommendedDoseMlPerDay, 1, "mL/day"),
    figure(t("working.change"), d.deltaDoseMlPerDay, 1, "mL/day"),
    figure(t("working.whatAdds"), d.deltaEffectDkhPerDay, 4, "dKH/day"),
    figure(t("working.expectedDrift"), d.predictedPostSlopeDkhPerDay, 4, "dKH/day")
  );
  card.append(e);

  card.append(h("p", { class: "seclabel" }, t("working.strength")));
  const f = h("div", { class: "kv" });
  f.append(
    figure(t("working.inUse"), p.selectedPotencyDkhPerMl, 4, "dKH/mL"),
    row(
      t("working.strengthFrom"),
      p.selectedPotencySource === "THEORETICAL_OR_CONFIGURED"
        ? t("working.strengthTheoretical")
        : t("working.strengthLearned")
    ),
    isPresent(p.learnedPotencyDkhPerMl)
      ? figure(t("working.strengthLearnedLabel"), p.learnedPotencyDkhPerMl, 4, "dKH/mL")
      : row(
          t("working.strengthLearnedLabel"),
          sayAbsent(p.learnedPotencyDkhPerMl),
          t("working.strengthLearnedOff")
        )
  );
  card.append(f);

  card.append(
    h(
      "p",
      { class: "inert-note" },
      t("working.note")
    )
  );
  return card;
}

function renderRecord(ctx, rec) {
  const card = h("section", { class: "card" });
  card.append(h("div", { class: "card-head" }, h("h2", null, t("record.title"))));
  card.append(
    h(
      "div",
      { class: "kv" },
      row(t("record.saved"), t("record.savedAt", { date: fmtDayName(rec.localDate), time: fmtTimeOfDay(rec.asOf) })),
      row(t("record.engine"), rec.engineVersion || "—"),
      row(t("record.canon"), rec.canonVersion || "—"),
      row(t("record.config"), rec.configVersionId || "—"),
      row(t("record.inputs"), String(rec.inputEventCount))
    )
  );

  const out = h("p", { class: "meta" });
  card.append(
    h(
      "div",
      { class: "btn-row" },
      h(
        "button",
        {
          class: "btn",
          type: "button",
          onclick: async () => {
            out.textContent = t("record.replaying");
            const r = await replay(ctx.store, rec.assessmentId);
            if (r.state !== "REPLAYED") return void (out.textContent = t("record.replayMissing"));
            out.textContent = r.identical
              ? t("record.replaySame")
              : r.sameVersions
                ? t("record.replayDiffers", {
                    present: r.inputEventsStillPresent,
                    named: r.inputEventsNamed,
                  })
                : t("record.replayVersion");
          },
        },
        t("record.replay")
      )
    ),
    out
  );

  card.append(
    h(
      "p",
      { class: "inert-note" },
      t("record.note")
    )
  );
  return card;
}
