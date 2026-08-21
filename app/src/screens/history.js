/* ============================================================================
   HISTORY
   ----------------------------------------------------------------------------
   One chart per parameter. The keeper's own range shaded behind the trace where
   he has set one. Every event family marked. Repeats shown as one observation.
   Points the engine cannot use drawn so they are visibly excluded rather than
   silently missing, WITH THE REASON. Tapping a point opens its entry.

   WHOSE RANGE IS SHADED
   ---------------------

   The keeper's, and only ever the keeper's. Alkalinity's is the range the
   engine reads from his configuration; every other parameter's is a range he
   set himself and which this app carried across from his own settings. Neither
   is a canon band edge, neither governs any behaviour, and the legend says
   whose numbers they are. A band the APP chose would be asserting a chemistry
   rule on a chart, and there is none here.

   WHY A READING IS EXCLUDED, SAID OUT LOUD
   ----------------------------------------

   A point drawn hollow is a point the engine cannot use for trend arithmetic,
   and the keeper is owed the reason rather than a shape. Both reasons are
   facts about the RECORD, not judgements about the reading: it has no time of
   day, or it has a time with no timezone behind it. `time.js` owns the test;
   this screen renders what it says.

   REPEATS
   -------

   Readings taken close together are one observation, and the engine says so —
   it emits a notice naming how many measurements were combined. This screen
   groups repeats FOR DISPLAY using the same window the engine reported, and
   says it is doing so. It does not decide the window.
   ========================================================================= */

import { h, svg } from "../ui/dom.js";
import { parameterDefs, KIND } from "../store/ledger.js";
import { fmtShort, fmtDayName, fmtEventTime } from "../ui/format.js";
import { addDays, hasExactInstant, todayLocal } from "../store/time.js";
import { t } from "../strings.js";

const EVENT_MARKS = Object.freeze({
  DOSE_CHANGE: { label: "history.event.doseChange", cls: "ev-dose" },
  DOSE_STATE: { label: "history.event.doseState", cls: "ev-dose" },
  WATER_CHANGE: { label: "history.event.waterChange", cls: "ev-water" },
  MANUAL_CORRECTION: { label: "history.event.manual", cls: "ev-manual" },
  DELIVERY_ANOMALY: { label: "history.event.anomaly", cls: "ev-anomaly" },
  CONSUMPTION_CONTEXT_EVENT: { label: "history.event.context", cls: "ev-context" },
  ICP_PANEL: { label: "history.event.icp", cls: "ev-icp" },
  HUSBANDRY: { label: "history.event.husbandry", cls: "ev-husbandry" },
});

export async function renderHistory(ctx) {
  const { store, state } = ctx;
  const [projected, config, latestAssessment] = await Promise.all([
    store.ledger.projection(),
    store.config.current(),
    store.assessments.latest(),
  ]);

  const only = state.historyParameter || null;
  const windowDays = state.historyWindow || 60;

  const screen = h("main", { class: "screen" });
  screen.append(
    h(
      "header",
      { class: "topbar with-gear" },
      h("div", null, h("h1", null, t("history.title")), h("p", { class: "sub" }, t("history.subtitle"))),
      h("button", { class: "gear", type: "button", "aria-label": t("action.settings"), onclick: () => ctx.go("settings") }, "⚙")
    )
  );

  /* Named window. V1's steadiness panel graded the window the keeper selected
     and named it, which stops a surface silently grading a different window
     from the engine. The name is here for the same reason. */
  const bar = h("div", { class: "windowbar" });
  [30, 60, 90, 365].forEach((d) => {
    bar.append(
      h(
        "button",
        { class: "opt" + (windowDays === d ? " on" : ""), type: "button", onclick: () => ctx.setHistoryWindow(d) },
        d === 365 ? t("history.windowYear") : t("history.windowDaysWord", { days: d })
      )
    );
  });
  screen.append(bar);
  screen.append(
    h(
      "p",
      { class: "meta" },
      t("history.windowNote", {
        window:
          windowDays === 365
            ? t("history.windowYearWord")
            : t("history.windowDaysWord", { days: windowDays }),
      })
    )
  );

  const params = only ? parameterDefs().filter((p) => p.key === only) : parameterDefs();
  const events = projected.filter((r) => r.state !== "INVALID" && EVENT_MARKS[r.event.kind]);

  /* WHERE DOSE HISTORY BEGINS.

     One boundary, derived from the record rather than chosen: the first moment
     anything says what the pump was set to. Before it the readings are
     measurements with no delivery context — true, and not interpretable as
     evidence about consumption, because what was going into the tank between
     them is not written down anywhere.

     The owner's decision, already taken: the readings before it are drawn at
     FULL COLOUR like every other, with one vertical marker and a short note.
     The exclusion is a property of the PERIOD, not of each reading, so dimming
     them individually would say something false about each one. */
  const doseBoundary = firstDoseDate(projected);

  for (const def of params) {
    screen.append(
      renderParameterChart(ctx, def, projected, events, config, windowDays, latestAssessment, doseBoundary)
    );
  }

  if (only) {
    screen.append(
      h("div", { class: "btn-row" }, h("button", { class: "btn btn-quiet", type: "button", onclick: () => ctx.setHistoryParameter(null) }, t("history.showAll")))
    );
  }
  return screen;
}

/* The earliest dose event the record holds for the assessed parameter. An
   event with no parameter is alkalinity's, which is what every dose the app's
   own forms write means. */
function firstDoseDate(projected) {
  let first = null;
  for (const r of projected) {
    if (r.state === "SUPERSEDED" || r.state === "INVALID") continue;
    const e = r.event;
    if (e.kind !== KIND.DOSE_STATE && e.kind !== KIND.DOSE_CHANGE) continue;
    if (e.parameter != null && e.parameter !== "ALK") continue;
    const d = e.time.localDate;
    if (!first || d < first) first = d;
  }
  return first;
}

function renderParameterChart(ctx, def, projected, events, config, windowDays, latestAssessment, doseBoundary) {
  const card = h("section", { class: "card" });
  /* Counted back from the application's clock in whole calendar days, not from
     `Date.now()` in milliseconds. Two reasons, and both were real: 86400000 is
     the wrong length of day twice a year, and the wall clock is the wrong
     "now" whenever the keeper has set the assessment instant by hand — the
     chart would then show a window ending today under an app that is otherwise
     three weeks earlier. */
  const cutoff = addDays(todayLocal(), -windowDays);

  const raw = projected
    .filter(
      (r) =>
        r.state !== "INVALID" &&
        r.event.kind === KIND.READING &&
        r.event.parameter === def.key &&
        r.event.time.localDate >= cutoff
    )
    .map((r) => ({
      row: r,
      date: r.event.time.localDate,
      at: r.event.time.absoluteInstant || null,
      value: r.event.normalizedValue,
      eligible: hasExactInstant(r.event.time),
      superseded: r.state === "SUPERSEDED",
      suspect: r.state === "SUSPECT",
    }));

  /* Repeats grouped for display, using the window the engine reported it used.
     If the engine reported none, nothing is grouped — the screen does not pick
     a window of its own. */
  const combineMinutes = reportedRepeatWindow(latestAssessment);
  const points = combineMinutes ? groupRepeats(raw, combineMinutes) : raw.map((p) => ({ ...p, members: [p] }));

  card.append(
    h(
      "div",
      { class: "card-head" },
      h("span", { class: "pmark p-" + def.tone }, def.label.slice(0, 3)),
      h("h2", null, def.label),
      h("span", { class: "aside" }, t("history.observations", { n: points.length }))
    )
  );

  if (!points.length) {
    card.append(h("p", { class: "body" }, t("history.emptyWindow")));
    return card;
  }

  /* The latest value, stated. A chart alone shows a shape and not a number,
     and the number is what the keeper came for. */
  const newest = points[points.length - 1];
  card.append(
    h(
      "div",
      null,
      h("span", { class: "value" }, newest.value.toFixed(def.decimals)),
      h("span", { class: "unit" }, def.unit),
      h("span", { class: "when" }, " " + fmtShort(newest.date))
    )
  );

  /* The band drawn behind the trace is the KEEPER's own range: alkalinity's
     from the configuration the engine reads, and every other parameter's from
     the ranges he set himself. Neither is a canon band edge and neither
     governs anything — they are drawn because he asked to see where he likes
     to keep the tank, and the legend says whose numbers they are. */
  const range = rangeFor(def, config);
  /* The boundary belongs on the assessed parameter's chart, because it is
     about what can be analysed and only alkalinity is analysed in this
     build. */
  const boundary = def.assessed && doseBoundary && doseBoundary > points[0].date ? doseBoundary : null;
  card.append(chart(ctx, def, points, events, range, windowDays, boundary));

  if (boundary) {
    card.append(h("p", { class: "meta" }, t("history.boundary.note", { date: fmtDayName(boundary) })));
  }

  const legend = h("div", { class: "legend" });
  if (range) {
    legend.append(
      h(
        "span",
        null,
        h("span", { class: "swatch", style: { background: `var(--${def.tone}-bg)` } }),
        t("history.legend.yourRange", { min: range.min, max: range.max, unit: def.unit })
      )
    );
  }
  /* WHY, NOT JUST THAT.

     A hollow point used to say only "excluded". The keeper is owed the reason,
     and after an import there are two different ones in the same chart — a
     reading with no time of day, and a reading whose time has no timezone
     behind it. Both are facts about the record. Counted and named. */
  const noTime = points.filter((p) => !p.eligible && !p.row.event.time.localTime).length;
  const noZone = points.filter((p) => !p.eligible && p.row.event.time.localTime).length;
  if (noTime) {
    legend.append(
      h(
        "span",
        null,
        h("span", { class: "swatch", style: { background: "var(--card-top)", border: "1px dashed var(--faint)" } }),
        t("history.legend.noTime", { n: noTime })
      )
    );
  }
  if (noZone) {
    legend.append(
      h(
        "span",
        null,
        h("span", { class: "swatch", style: { background: "var(--card-top)", border: "1px dashed var(--faint)" } }),
        t("history.legend.noZone", { n: noZone })
      )
    );
  }
  if (points.some((p) => p.members.length > 1)) {
    legend.append(
      h(
        "span",
        null,
        h("span", { class: "swatch", style: { background: "var(--faint)" } }),
        t("assessment.legend.repeats")
      )
    );
  }
  const kinds = new Set(events.map((e) => e.event.kind));
  for (const k of kinds) {
    legend.append(
      h(
        "span",
        null,
        h("span", { class: "swatch", style: { background: "var(--faint)" } }),
        t(EVENT_MARKS[k].label)
      )
    );
  }
  card.append(legend);

  if (!def.assessed) {
    card.append(
      h(
        "p",
        { class: "inert-note" },
        t("history.inertNote")
      )
    );
  } else if (combineMinutes) {
    card.append(
      h(
        "p",
        { class: "inert-note" },
        t("history.repeatNote", { minutes: combineMinutes })
      )
    );
  }

  card.append(renderEntryList(ctx, points, def));
  return card;
}

/* The band this parameter is drawn with, if the keeper set one.

   Alkalinity's lives in the two fields the engine reads, because the engine
   reads them. Every other parameter's lives in `parameterRanges`, which the
   configuration store strips before the engine ever sees it — they are the
   keeper's own preference, they are display, and they govern nothing. */
function rangeFor(def, config) {
  if (!config) return null;
  if (def.assessed) {
    return config.targetRangeMinDkh != null && config.targetRangeMaxDkh != null
      ? { min: config.targetRangeMinDkh, max: config.targetRangeMaxDkh }
      : null;
  }
  const r = config.parameterRanges && config.parameterRanges[def.key];
  return r && Number.isFinite(r.min) && Number.isFinite(r.max) ? r : null;
}

function reportedRepeatWindow(latestAssessment) {
  const codes = latestAssessment?.engineResult?.reasonCodes || [];
  for (const c of codes) {
    const m = c.payload && c.payload.repeatClusterWindowMinutes;
    if (typeof m === "number") return m;
  }
  return null;
}

function groupRepeats(points, minutes) {
  const out = [];
  for (const p of points) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.at &&
      p.at &&
      Math.abs(Date.parse(p.at) - Date.parse(prev.at)) <= minutes * 60000
    ) {
      prev.members.push(p);
      /* Shown at the mean of the sitting, which is a display choice about where
         to draw one dot for two readings. The engine computes its own episode
         value and this chart does not claim to reproduce it. */
      prev.value = prev.members.reduce((a, m) => a + m.value, 0) / prev.members.length;
      continue;
    }
    out.push({ ...p, members: [p] });
  }
  return out;
}

function chart(ctx, def, points, events, range, windowDays, boundary) {
  const W = 296, H = 150, L = 26, R = 290, T = 14, B = 118;
  const vals = points.map((p) => p.value);
  const lo = Math.min(...vals, range ? range.min : Infinity);
  const hi = Math.max(...vals, range ? range.max : -Infinity);
  const span = hi - lo || 1;
  const pad = span * 0.2;
  const yMin = lo - pad, yMax = hi + pad;

  const t0 = Date.parse(points[0].date + "T00:00:00Z");
  const t1 = Date.parse(points[points.length - 1].date + "T00:00:00Z");
  const tspan = t1 - t0 || 86400000;
  const x = (iso) => L + ((Date.parse(iso.slice(0, 10) + "T00:00:00Z") - t0) / tspan) * (R - L);
  const y = (v) => B - ((v - yMin) / (yMax - yMin)) * (B - T);

  const g = svg("svg", {
    class: "chart c-" + def.tone,
    viewBox: `0 0 ${W} ${H}`,
    role: "img",
    "aria-label": t("history.chart.aria", { label: def.label, days: windowDays, n: points.length }),
  });

  if (range) {
    const yTop = y(range.max), yBot = y(range.min);
    g.append(
      svg("rect", { class: "range-fill", x: L, y: Math.min(yTop, yBot), width: R - L, height: Math.abs(yBot - yTop) }),
      svg("line", { class: "range-edge", x1: L, y1: yTop, x2: R, y2: yTop }),
      svg("line", { class: "range-edge", x1: L, y1: yBot, x2: R, y2: yBot }),
      svg("text", { class: "axis", x: 1, y: yTop + 3.5 }, String(range.max)),
      svg("text", { class: "axis", x: 1, y: yBot + 3.5 }, String(range.min))
    );
  }

  /* Event markers, drawn behind the trace so the readings stay readable. */
  for (const e of events) {
    const d = e.event.time.localDate;
    if (d < points[0].date || d > points[points.length - 1].date) continue;
    const px = x(d);
    g.append(
      svg("line", { class: "evline " + EVENT_MARKS[e.event.kind].cls, x1: px, y1: T, x2: px, y2: B }),
      svg("polygon", { class: "evmark", points: `${px - 4},${T - 7} ${px + 4},${T - 7} ${px},${T - 1}` })
    );
  }

  /* ONE MARKER, ONE NOTE. The readings on either side of it are drawn exactly
     alike, because the difference between them is a property of the period and
     not of any single reading. */
  if (boundary) {
    const bx = x(boundary);
    g.append(
      svg("line", { class: "boundary", x1: bx, y1: T - 6, x2: bx, y2: B }),
      svg("text", { class: "boundary-label", x: bx + 3, y: T - 1 }, t("history.boundary.mark"))
    );
  }

  const eligible = points.filter((p) => p.eligible && !p.superseded);
  if (eligible.length >= 2) {
    g.append(
      svg("path", {
        class: "trace",
        d: eligible.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(" "),
      })
    );
  }

  points.forEach((p, i) => {
    const cls = p.superseded
      ? "pt-excluded"
      : !p.eligible
        ? "pt-excluded"
        : i === points.length - 1
          ? "pt-last"
          : "pt";
    const c = svg("circle", {
      class: cls + (p.members.length > 1 ? " pt-repeat" : ""),
      cx: x(p.date),
      cy: y(p.value),
      r: i === points.length - 1 ? 4.5 : 4,
      tabindex: "0",
      role: "button",
      "aria-label": t("history.point.aria", { value: p.value, unit: def.unit, date: fmtDayName(p.date) }),
      onclick: () => ctx.openEntry(p.members[0].row.event.eventId),
      onkeydown: (e) => {
        if (e.key === "Enter" || e.key === " ") ctx.openEntry(p.members[0].row.event.eventId);
      },
    });
    g.append(c);
  });

  g.append(
    svg("text", { class: "axis", x: L, y: 140 }, fmtShort(points[0].date)),
    svg("text", { class: "axis", x: R, y: 140, "text-anchor": "end" }, fmtShort(points[points.length - 1].date))
  );
  return h("div", { class: "scroll-x" }, g);
}

function renderEntryList(ctx, points, def) {
  const det = h("details", { class: "notices" });
  det.append(h("summary", null, h("span", { class: "lbl" }, t("history.everyEntry")), h("span", { class: "chev" })));
  const list = h("ul", { class: "tasklist" });
  for (const p of [...points].reverse()) {
    for (const m of p.members) {
      const e = m.row.event;
      list.append(
        h(
          "li",
          null,
          h(
            "button",
            { class: "taskrow", type: "button", onclick: () => ctx.openEntry(e.eventId) },
            h("span", { class: "tick" + (m.eligible ? " done" : "") }, m.eligible ? "✓" : "·"),
            h(
              "span",
              null,
              h("span", { class: "t" }, t("entry.detail.value", { value: e.rawValue, unit: def.unit })),
              h(
                "span",
                { class: "d" },
                fmtEventTime(e.time) +
                  (m.superseded ? t("history.entry.replaced") : "") +
                  (m.suspect ? t("history.entry.suspect") : "") +
                  /* The reason this one cannot enter a trend, on the row
                     itself. "Excluded" alone told the keeper a fact about the
                     app rather than a fact about his reading. */
                  (!m.eligible
                    ? e.time.localTime
                      ? t("history.entry.noZone")
                      : t("history.entry.noTime")
                    : "")
              )
            )
          )
        )
      );
    }
  }
  det.append(list);
  return det;
}
