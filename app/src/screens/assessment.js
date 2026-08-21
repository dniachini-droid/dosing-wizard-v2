/* ============================================================================
   THE ALKALINITY ASSESSMENT CARD
   ----------------------------------------------------------------------------
   This file renders. It does not decide.

   Search it for a comparison against a band edge, a slope calculation, a dose
   arithmetic, a retest date computed from a cadence: there is none. Every
   number below is read straight out of the engine result, and every state word
   is looked up in the wording table by the value the engine produced.

   `DEC-003` and canon `X-INV-004` require exactly that, and the conformance
   gate exists partly to check it. `ALK-V2-MODULE-DESIGN.md` §2: presentation
   "renders `recommendedAt`, `earliestUsefulAt`, `latestSafeAt` and `reasonCode`
   and computes no chemistry or timing of its own."

   The one arithmetic in this file is a chart's pixel geometry, which is where
   a point sits on screen and is not a fact about alkalinity.
   ========================================================================= */

import { h } from "../ui/dom.js";
import { interactiveChart } from "../ui/chart.js";
import { parameterDef } from "../store/ledger.js";
import { keeperRange } from "../store/config.js";
import { fmtShort, fmtTimeOfDay, fmtDayName } from "../ui/format.js";
import { instructsDoseChange, selectCard, isAbsent, isPresent } from "../present/cards.js";
import {
  num,
  signed,
  sayAbsent,
  sayVerb,
  sayCapability,
  sayConstraint,
  sayEvidence,
  sayOuter,
  sayOutput,
  sayPayloadKey,
  sayPayloadValue,
  sayPosition,
  sayReason,
  sayResponseClass,
  saySeverity,
  sayTrajectory,
  valueOrAbsence,
  whyAbsent,
} from "../present/wording.js";
import { t } from "../strings.js";

/* Card class → the headline register. Data, keyed on what `cards.js` selected;
   this table adds no condition of its own. */
export const CARD_TONE = Object.freeze({
  SAFETY_RETURN: "is-safety",
  CAPABILITY_REFUSAL: "",
  INSUFFICIENT: "",
  NOT_ATTRIBUTABLE_SMALL_SIGNAL: "",
  UNCERTAINTY_LIMITED: "",
  DOSE_CHANGE: "",
  HOLD: "",
  UNCLASSIFIED: "is-attention",
});

export function renderAssessment(result, { onOpenDetail, onOpenEntry, readings, config } = {}) {
  const card = selectCard(result);
  /* `param-card` earns the notice strip along the bottom edge. Its COLOUR is
     the line below — `CARD_TONE` maps the engine's own output class to
     `is-attention` or `is-safety` and to nothing else, so the strip reports a
     state this file was told, never one it worked out. */
  const box = h("section", { class: "card param-card" });

  box.append(
    h(
      "div",
      { class: "card-head" },
      h("span", { class: "pmark p-alk" }, t("assessment.mark")),
      h("h2", null, t("assessment.parameter")),
      h("span", { class: "aside" }, assessedAt(result))
    )
  );

  /* --- the value ------------------------------------------------------- */
  const latest = result.latestValidValueDkh;
  if (isPresent(latest)) {
    box.append(
      h("div", null, h("span", { class: "hero" }, num(latest, 2)), h("span", { class: "unit" }, "dKH")),
      h("p", { class: "caption" }, t("assessment.latestCaption"))
    );
  } else {
    /* NOT_RUN rendered as a designed state, not a blank. */
    box.append(
      h("div", null, h("span", { class: "hero" }, sayAbsent(latest))),
      h("p", { class: "caption" }, whyAbsent(latest))
    );
  }

  /* The parameter's own identity, passed to the chart. V1's component never
     received it at any call site — a recorded defect — so this one does, and
     `interactiveChart` refuses without it. */
  if (readings && readings.length >= 2) {
    box.append(renderTrace(readings, config, result, parameterDef("ALK"), onOpenEntry));
  }

  /* --- the six dimensions, kept separate ------------------------------- */
  box.append(h("p", { class: "seclabel" }, t("assessment.dimsLabel")), renderDims(result));
  box.append(
    h(
      "p",
      { class: "inert-note" },
      t("assessment.dimsNote")
    )
  );

  /* --- observed AND supported slope ------------------------------------
     `WG-ALK-002` requires both to be shown wherever uncertainty limited the
     answer. Showing both always is simpler and never wrong. */
  box.append(renderSlopes(result));

  /* --- the recommendation ---------------------------------------------- */
  box.append(renderRecommendation(result, card));

  /* --- next test -------------------------------------------------------- */
  box.append(h("p", { class: "seclabel" }, t("assessment.retest.label")), renderRetest(result));

  /* --- capabilities the engine is missing ------------------------------- */
  const missing = (result.capabilities || []).filter((c) => c.outcome !== "OK");
  if (missing.length) box.append(renderMissing(missing));

  /* --- the ordered notice list ------------------------------------------ */
  box.append(renderNotices(result));

  if (onOpenDetail) {
    box.append(
      h(
        "button",
        { class: "btn", style: { marginTop: "var(--sp-4)" }, onclick: onOpenDetail },
        t("assessment.seeWorking")
      )
    );
  }

  box.classList.add(...(CARD_TONE[card] ? [CARD_TONE[card]] : []));
  return box;
}

function assessedAt(result) {
  const at = result.assessmentAsOf;
  if (!at) return "";
  return `${fmtShort(at.slice(0, 10))} ${fmtTimeOfDay(at)}`;
}

/* --- dimensions ---------------------------------------------------------- */

function dim(label, valueText, why, cls) {
  return h(
    "div",
    { class: "dim" + (cls ? " " + cls : "") },
    h("dt", null, label),
    h("dd", null, valueText, h("span", { class: "why" }, why))
  );
}

function renderDims(r) {
  const dl = h("dl", { class: "dims" });

  dl.append(
    dim(
      t("assessment.dim.position"),
      sayPosition(r.position),
      isPresent(r.latestValidValueDkh)
        ? t("assessment.dim.positionWhy", { value: num(r.latestValidValueDkh, 2) })
        : whyAbsent(r.position)
    )
  );

  const obs = r.observedTrajectory;
  dl.append(
    dim(
      t("assessment.dim.trajectory"),
      sayTrajectory(r.trajectory),
      typeof obs === "object" && obs
        ? t("assessment.dim.trajectoryWhy")
        : whyAbsent(obs)
    )
  );

  const facts = r.evidenceFacts || {};
  dl.append(
    dim(
      t("assessment.dim.evidence"),
      sayEvidence(r.movementEvidence),
      isPresent(facts.independentClusters)
        ? t("assessment.dim.evidenceWhy", {
            tests: facts.independentClusters,
            days: num(facts.spanDays, 2),
          })
        : t("assessment.dim.evidenceWhyNone")
    )
  );

  const iv = r.activeIntervention;
  dl.append(
    dim(
      t("assessment.dim.running"),
      iv === "NONE"
        ? t("assessment.dim.runningNone")
        : isAbsent(iv)
          ? sayAbsent(iv)
          : t("assessment.dim.runningOpen"),
      iv === "NONE" ? t("assessment.dim.runningWhyNone") : whyAbsent(iv)
    )
  );

  const resp = r.responseAssessment;
  const respClass = typeof resp === "object" && resp ? resp.responseClass : resp;
  dl.append(
    dim(
      t("assessment.dim.response"),
      sayResponseClass(respClass),
      iv === "NONE" ? t("assessment.dim.responseWhyNone") : whyAbsent(respClass)
    )
  );

  const over = typeof resp === "object" && resp ? resp.positionEvent : null;
  dl.append(
    dim(
      t("assessment.dim.overshoot"),
      over && over !== "NONE" ? t("assessment.dim.overshootYes") : t("assessment.dim.overshootNo"),
      over && over !== "NONE"
        ? t("assessment.dim.overshootWhyYes")
        : t("assessment.dim.overshootWhyNo")
    )
  );

  const ob = r.safety?.outerBoundState ?? r.outerBoundState;
  if (ob === "BREACHED_LOW" || ob === "BREACHED_HIGH") {
    dl.prepend(
      dim(t("assessment.dim.outer"), sayOuter(ob), t("assessment.dim.outerWhy"), "is-safety")
    );
  }
  return dl;
}

/* --- slopes -------------------------------------------------------------- */

function renderSlopes(r) {
  const obs = r.observedTrajectory;
  const sup = r.supportedTrajectory;
  const oVal = typeof obs === "object" && obs ? obs.observedSlopeDkhPerDay : obs;
  const sVal = typeof sup === "object" && sup ? sup.supportedSlopeDkhPerDay : sup;

  const boxOf = (label, v, sub) =>
    h(
      "div",
      { class: "slopebox" },
      h("span", { class: "lbl" }, label),
      h("span", { class: "n" }, isPresent(v) ? signed(v, 4) : sayAbsent(v)),
      h("span", { class: "sub" }, isPresent(v) ? sub : whyAbsent(v))
    );

  const pair = h(
    "div",
    { class: "slopepair" },
    boxOf(t("assessment.slope.observed"), oVal, t("assessment.slope.observedSub")),
    boxOf(t("assessment.slope.supported"), sVal, t("assessment.slope.supportedSub"))
  );

  const note =
    isPresent(oVal) && isPresent(sVal)
      ? t("assessment.slope.note")
      : t("assessment.slope.noteAbsent");

  return h("div", null, pair, h("p", { class: "inert-note" }, note));
}

/* --- recommendation ------------------------------------------------------ */

function renderRecommendation(r, card) {
  const d = r.doseRecommendation || {};
  const cls = card === "SAFETY_RETURN" ? "reco is-safety" : card === "UNCLASSIFIED" ? "reco is-attention" : "reco";
  const box = h("div", { class: cls });

  box.append(
    h("p", { class: "verb" }, d.action || card ? sayVerb(card, d.action) : t("assessment.reco.none"))
  );

  if (card === "UNCLASSIFIED") {
    box.append(
      h("p", { class: "headline" }, t("assessment.reco.unclassified.head")),
      h("p", { class: "detail" }, t("assessment.reco.unclassified.body"))
    );
    return box;
  }

  if (card === "SAFETY_RETURN") {
    const s = r.safety || {};
    box.append(
      h("p", { class: "headline" }, sayOuter(s.outerBoundState ?? r.outerBoundState)),
      h("p", { class: "detail" }, t("assessment.reco.safety.body"))
    );
    const rate = valueOrAbsence(s.temporarySafetyRateRecommendationMlPerDay, { decimals: 2, unit: "mL/day" });
    box.append(
      h("div", { class: "kv" },
        kvRow(t("assessment.reco.safety.rate"), rate.text, rate.present ? null : rate.why),
        kvRow(t("assessment.reco.safety.destination"),
          valueOrAbsence(s.safetyDestinationDkh ?? "NOT_RUN", { decimals: 2, unit: "dKH" }).text)
      )
    );
  }

  const recommended = d.recommendedDoseMlPerDay;
  const current = d.currentDoseMlPerDay;

  /* The same rule as Today's ranked row, for the same reason: a present
     `recommendedDoseMlPerDay` on a hold is the standing dose, not a command.
     Only `SET_MAINTENANCE_DOSE` instructs a change. */
  const instructsChange = instructsDoseChange(r);

  if (instructsChange) {
    const delta = d.deltaDoseMlPerDay;
    const direction = isPresent(delta)
      ? delta > 0
        ? t("assessment.reco.dose.increase")
        : delta < 0
          ? t("assessment.reco.dose.reduce")
          : t("assessment.reco.dose.keep")
      : t("assessment.reco.dose.set");
    box.append(
      h("p", { class: "headline" }, t("assessment.reco.dose", { direction, dose: num(recommended, 1) })),
      h(
        "p",
        { class: "detail" },
        isPresent(current) ? t("assessment.reco.from", { dose: num(current, 1) }) : "",
        isPresent(d.deltaEffectDkhPerDay)
          ? t("assessment.reco.adds", { effect: num(d.deltaEffectDkhPerDay, 4) })
          : "",
        isPresent(d.predictedPostSlopeDkhPerDay)
          ? t("assessment.reco.thenDrift", { slope: signed(d.predictedPostSlopeDkhPerDay, 4) })
          : ""
      )
    );
  } else if (d.action === "HOLD_CURRENT_DOSE" && isPresent(recommended)) {
    /* A hold IS a recommendation — the engine emits
       `OUTPUT_HOLD_IS_A_RECOMMENDATION` to say so — and the dose it is holding
       at is the substance of it. A capability refusal takes the same action
       but withholds the dose, so it falls through to the branch below and is
       named as a refusal rather than dressed as a hold. */
    const holdingAt = isPresent(current) ? current : recommended;
    box.append(
      h("p", { class: "headline" }, t("assessment.reco.hold.head")),
      h(
        "p",
        { class: "detail" },
        t("assessment.reco.hold.staying", { dose: num(holdingAt, 1) }),
        t("assessment.reco.hold.body")
      )
    );
  } else {
    /* WITHHELD / NOT_RUN. Named, with the reason, never blank. */
    box.append(
      h("p", { class: "headline" }, sayAbsent(recommended)),
      h("p", { class: "detail" }, whyAbsent(recommended), " ", whatWouldFixIt(r))
    );
  }

  if (d.constraintsApplied && d.constraintsApplied.length) {
    box.append(
      h(
        "p",
        { class: "detail" },
        t("assessment.reco.constraints", { list: d.constraintsApplied.map(sayConstraint).join(", ") })
      )
    );
  }

  box.append(
    h(
      "p",
      { class: "inert-note" },
      t("assessment.reco.note")
    )
  );
  return box;
}

/* What the keeper could do about a withheld answer. Read from the engine's own
   `affectedOutputs` and capability list — not inferred here. */
function whatWouldFixIt(r) {
  const wants = new Set();
  for (const c of r.capabilities || []) {
    if (c.outcome !== "OK" && c.affectedOutputs && c.affectedOutputs.length) {
      wants.add(sayCapability(c.capabilityId));
    }
  }
  for (const rc of r.reasonCodes || []) {
    if (rc.severity === "REFUSAL" || rc.severity === "GATING") {
      const at = rc.payload && rc.payload.nextUsefulTestAt;
      if (at) wants.add(t("assessment.reco.wouldFixTest", { date: fmtDayName(at.slice(0, 10)) }));
    }
  }
  if (!wants.size) return t("assessment.reco.wouldFixNone");
  return t("assessment.reco.wouldFix", { list: [...wants].join("; ") });
}

/* --- retest -------------------------------------------------------------- */

function kvRow(k, v, sub) {
  return h(
    "div",
    { class: "kv-row" },
    h("span", { class: "kv-k" }, k),
    h(
      "span",
      { class: "kv-v" + (sub ? " is-absent" : "") },
      v,
      sub ? h("span", { class: "sub" }, sub) : null
    )
  );
}

function renderRetest(r) {
  /* `rt` rather than `t`: `t` is the string lookup and shadowing it here would
     make every label in this function silently unreachable. */
  const rt = r.retest || {};
  const kv = h("div", { class: "kv" });

  const rec = rt.recommendedAt;
  kv.append(
    isPresent(rec)
      ? kvRow(
          t("assessment.retest.recommended"),
          t("assessment.retest.at", { date: fmtDayName(rec.slice(0, 10)), time: fmtTimeOfDay(rec) })
        )
      : kvRow(t("assessment.retest.recommended"), sayAbsent(rec), whyAbsent(rec))
  );

  const early = rt.earliestUsefulAt;
  kv.append(
    isPresent(early)
      ? kvRow(
          t("assessment.retest.earliest"),
          t("assessment.retest.at", { date: fmtDayName(early.slice(0, 10)), time: fmtTimeOfDay(early) })
        )
      : kvRow(t("assessment.retest.earliest"), sayAbsent(early), whyAbsent(early))
  );

  kv.append(kvRow(t("assessment.retest.why"), sayReason(rt.selectedReasonCode || rt.reasonCode)));

  const latest = rt.latestSafeAt;
  kv.append(
    isPresent(latest)
      ? kvRow(
          t("assessment.retest.latest"),
          t("assessment.retest.at", { date: fmtDayName(latest.slice(0, 10)), time: fmtTimeOfDay(latest) })
        )
      : kvRow(
          t("assessment.retest.latest"),
          t("assessment.retest.latestNone"),
          t("assessment.retest.latestNoneSub")
        )
  );

  /* Timings the scheduler could not consider, named rather than dropped. */
  if (rt.candidatesNotRun && rt.candidatesNotRun.length) {
    const list = h("ul", { class: "notice-list" });
    for (const code of rt.candidatesNotRun) {
      list.append(
        h(
          "li",
          { class: "notice rows-1" },
          h("span", { class: "pill pill-neutral sev" }, t("assessment.retest.notRunPill")),
          h("span", { class: "say" }, sayReason(code))
        )
      );
    }
    return h("div", null, kv, h("p", { class: "seclabel" }, t("assessment.retest.notConsidered")), list);
  }
  return kv;
}

/* --- missing capabilities ------------------------------------------------ */

function renderMissing(missing) {
  const list = h("ul", { class: "notice-list" });
  for (const c of missing) {
    list.append(
      h(
        "li",
        { class: "notice rows-2" },
        h(
          "span",
          { class: "pill pill-attention sev" },
          c.outcome === "DEGRADE" ? t("assessment.missing.limits") : t("assessment.missing.notRun")
        ),
        h("span", { class: "say" }, sayCapability(c.capabilityId)),
        h(
          "span",
          { class: "payload" },
          c.affectedOutputs && c.affectedOutputs.length
            ? [
                h("span", { class: "k" }, t("assessment.missing.holds")),
                " ",
                h("b", null, c.affectedOutputs.map(sayOutput).join(", ")),
              ]
            : [
                h("span", { class: "k" }, t("assessment.missing.effect")),
                " ",
                h("b", null, t("assessment.missing.noEffect")),
              ]
        )
      )
    );
  }
  return h("div", null, h("p", { class: "seclabel" }, t("assessment.missing.label")), list);
}

/* --- notices ------------------------------------------------------------- */

const SEV_ORDER = { REFUSAL: 0, GATING: 1, INFO: 2 };

function renderNotices(r) {
  const codes = [...(r.reasonCodes || [])].sort(
    (a, b) => (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3)
  );
  const counts = codes.reduce((m, c) => ((m[c.severity] = (m[c.severity] || 0) + 1), m), {});

  const det = h("details", { class: "notices" });
  const sum = h("summary", null, h("span", { class: "lbl" }, t("assessment.notices.summary")));
  const sc = h("span", { class: "sevcount" });
  if (counts.REFUSAL) {
    sc.append(h("span", { class: "pill pill-safety" }, t("assessment.notices.blocking", { n: counts.REFUSAL })));
  }
  if (counts.GATING) {
    sc.append(h("span", { class: "pill pill-attention" }, t("assessment.notices.limiting", { n: counts.GATING })));
  }
  if (counts.INFO) {
    sc.append(h("span", { class: "pill pill-neutral" }, t("assessment.notices.info", { n: counts.INFO })));
  }
  sum.append(sc, h("span", { class: "chev" }));
  det.append(sum);

  const list = h("ul", { class: "notice-list" });
  for (const c of codes) {
    const payload = renderPayload(c.payload);
    list.append(
      h(
        "li",
        { class: "notice " + (payload ? "rows-2" : "rows-1") },
        h(
          "span",
          {
            class:
              "pill sev " +
              (c.severity === "REFUSAL" ? "pill-safety" : c.severity === "GATING" ? "pill-attention" : "pill-neutral"),
          },
          saySeverity(c.severity)
        ),
        h("span", { class: "say" }, sayReason(c.code)),
        payload
      )
    );
  }
  det.append(list);
  return det;
}

/* Payload figures, beside the sentence. Only keys with a plain-English name are
   shown; the rest are in the developer view, where owner decision 9 allows the
   contract's own vocabulary. */
function renderPayload(payload) {
  if (!payload) return null;
  const parts = [];
  for (const [k, v] of Object.entries(payload)) {
    const word = sayPayloadKey(k);
    if (!word) continue;
    /* Both halves have to be translatable. A pair whose value is contract
       vocabulary with no wording is dropped here and stays in the developer
       view, rather than being half-translated onto the screen. */
    const shown = sayPayloadValue(v);
    if (shown == null) continue;
    parts.push(h("span", { class: "k" }, word), " ", h("b", null, shown), " ");
  }
  return parts.length ? h("span", { class: "payload" }, parts) : null;
}

/* --- the trend trace -----------------------------------------------------
   The chart is `ui/chart.js`'s, ported from V1 `ZoomableChart.jsx`. This
   function turns the engine's own view of the readings into the shape it
   takes and does nothing else: no geometry, no gesture, no arithmetic.

   The shaded band is the keeper's own configured target range, read from the
   configuration the engine resolved — not a band this file chose. Points the
   engine could not use are drawn hollow, so an excluded reading is visibly
   present rather than silently missing.

   The Today card is where the keeper looks most, and it was the one chart he
   could not touch. It has the same gestures as every other now. */
function renderTrace(readings, config, result, def, onOpenEntry) {
  /* The keeper's own band, from the one function that decides which range is
     his. It used to be decided here as well, and in `main.js`, and in History —
     three readings of the same configuration, which `MASTER RULE 1` calls a
     defect rather than a coincidence. */
  const range = keeperRange(def, config);

  const { node } = interactiveChart({
    points: readings.map((r) => ({
      date: r.date,
      time: r.time || null,
      value: r.value,
      eligible: r.eligible,
      eventId: r.eventId,
    })),
    tone: def.tone,
    /* Both required, and both absent at every V1 call site — the defect the
       salvage inventory recorded against this component. */
    label: def.label,
    unit: def.unit,
    decimals: def.decimals,
    range,
    /* `onOpenEntry` was accepted by this component and used by nothing, so a
       point on the Today card could not be opened. It can now: a tap says what
       the reading is, and a second tap on the same point opens it. */
    onPointTap: onOpenEntry ? (p) => onOpenEntry(p.eventId) : null,
    ariaLabel: traceLabel(readings, def, config),
  });

  const legend = h("div", { class: "legend" });
  if (range) {
    legend.append(
      h(
        "span",
        null,
        h("span", { class: "swatch", style: { background: `var(--${def.tone}-bg)` } }),
        t("assessment.legend.range", { min: range.min, max: range.max, unit: def.unit })
      )
    );
  }
  if (readings.some((r) => !r.eligible)) {
    legend.append(
      h(
        "span",
        null,
        h("span", { class: "swatch", style: { background: "var(--card-top)", border: "1px dashed var(--text-meta)" } }),
        t("assessment.legend.excluded")
      )
    );
  }
  return h("div", null, node, legend);
}

function traceLabel(readings, def, config) {
  const first = readings[0], last = readings[readings.length - 1];
  const band = keeperRange(def, config);
  const range = band ? t("assessment.chart.ariaRange", { min: band.min, max: band.max }) : "";
  return t("assessment.chart.aria", {
    from: first.value,
    fromDate: fmtShort(first.date),
    to: last.value,
    toDate: fmtShort(last.date),
    range,
  });
}

/* --- the developer view --------------------------------------------------
   The one place a reason-code identifier, a canon variable name or a raw
   payload key may appear on screen. Owner decision 9 permits it here and
   nowhere else, and it is behind a closed disclosure so it cannot be mistaken
   for the interface. */
export function renderDeveloperView(result, record) {
  const det = h("details", { class: "devview" });
  det.append(h("summary", null, t("assessment.dev.summary")));
  det.append(h("p", { class: "meta" }, t("assessment.dev.note")));
  if (record) {
    det.append(
      h(
        "div",
        { class: "kv" },
        kvRow("assessmentId", record.assessmentId),
        kvRow("engineVersion", record.engineVersion || "—"),
        kvRow("canonVersion", record.canonVersion || "—"),
        kvRow("configVersionId", record.configVersionId || "—"),
        kvRow("asOf", record.asOf),
        kvRow("inputEventCount", String(record.inputEventCount))
      )
    );
  }
  det.append(h("pre", { class: "code" }, JSON.stringify(result, null, 1)));
  return det;
}
