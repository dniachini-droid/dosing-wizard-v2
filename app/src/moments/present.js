/* ============================================================================
   THE MOMENTS, WITH REAL DATA BEHIND THEM
   ----------------------------------------------------------------------------
   `moments.js` next to this file is the ported motion: V1's geometry, V1's
   progress loop, V1's timing constants, all reading their durations from
   `tokens.css`. This file builds the markup that motion expects and fills it
   with what actually happened.

   THE THREE MOMENTS
   -----------------

   a. THE READING ARRIVES. The new value drawn onto its own recent history,
      with the chart draw, the travelling dot and the counting number all read
      from ONE progress value. That single shared value is the fix that stopped
      the dot running ahead of its own line, and it is preserved exactly.

   b. THE DOSE EXPECTATION. A dose change is a prediction as much as an action.
      The engine produces the immutable prediction snapshot; this renders it and
      computes nothing. Where the snapshot is absent the moment says so rather
      than predicting something itself — a prediction the app invented would be
      graded later as though the engine had made it.

   c. TASK COMPLETION. The run of completions and the ACTUAL intervals between
      them, which is often not the interval that was set. Shown without comment.

   WHAT IS NOT HERE
   ----------------

   Any chemistry. V1's versions of all three computed their own verdicts inside
   the presentation layer — `readingVerdict` was a chemistry classifier living
   in a UI component, which is the exact violation `X-INV-004` forbids. The
   moments here render sentences and figures the engine supplied, or say
   plainly that it has not supplied them yet.
   ========================================================================= */

import { h } from "../ui/dom.js";
import { playMoments } from "./moments.js";
import { attachGestures } from "../ui/chart.js";
import { daysBetween } from "../store/time.js";
import { fmtDayName, fmtShort } from "../ui/format.js";
import { isPresent } from "../present/cards.js";
import { num, sayReason, signed } from "../present/wording.js";
import { t } from "../strings.js";

function scrim(onClose) {
  const wrap = h("div", { class: "moment" });
  wrap.addEventListener("click", (e) => {
    if (e.target === wrap) close();
  });
  function close() {
    wrap.remove();
    if (onClose) onClose();
  }
  return { wrap, close };
}

function countdownFoot(token) {
  return h(
    "div",
    { class: "mcap" },
    h("span", { "data-countdown": token }, "")
  );
}

/* --- a. the reading arrives ---------------------------------------------- */

export function momentReadingArrival({ def, series, onClose }) {
  const { wrap, close } = scrim(onClose);
  const uid = "m" + Date.now();

  const counterId = "count-" + uid;
  const card = h("div", { class: "mcard" });

  /* The moment needs at least two points to draw a line through. With one
     reading there is no history to arrive onto, so the value is stated plainly
     instead — a one-point chart would be a line to nowhere. */
  const rows = series.map((r) => ({ value: r.value }));

  card.append(
    h(
      "div",
      { class: "mcap alk" },
      h(
        "div",
        { class: "mval" },
        h("span", { id: counterId, class: "rc-sheen" }, rows[rows.length - 1].value.toFixed(def.decimals)),
        h("span", { class: "unit" }, def.unit)
      ),
      h("div", { class: "mlabel" }, def.label),
      h("div", { class: "rc-host" })
    ),
    h(
      "div",
      { class: "mbody stagger" },
      h(
        "p",
        { class: "mhead" },
        series.length > 1 ? t("moment.reading.loggedWithRun") : t("moment.reading.logged")
      ),
      h(
        "p",
        { class: "body" },
        series.length > 1
          ? t("moment.reading.range", {
              n: series.length,
              from: fmtShort(series[0].date),
              to: fmtShort(series[series.length - 1].date),
            })
          : t("moment.reading.first")
      ),
      h("p", { class: "inert-note" }, t("moment.reading.note"))
    ),
    countdownFoot("--ma-autoclose")
  );

  const host = h("div", {
    "data-moment": series.length > 1 ? "reading" : "none",
    "data-uid": uid,
    "data-counter": counterId,
    "data-def": JSON.stringify({
      key: def.key,
      decimals: def.decimals,
      tone: def.tone,
      /* The moment's geometry takes a min and a max to pad the axis with. For
         alkalinity those are the keeper's configured target range, which the
         engine also uses. For a parameter with no range they are the data's own
         extremes, and no band is drawn — there is no canon range to draw. */
      min: def.min,
      max: def.max,
    }),
    "data-rows": JSON.stringify(rows),
  });
  host.append(card);
  wrap.append(host);
  document.body.append(wrap);
  playMoments(wrap);
  /* The moment's chart is a chart, and the keeper asked for every chart to be
     touchable. `moments.js` is ported V1 motion code carried unchanged on
     purpose, so nothing is done to it: the gestures are attached from out
     here, to the host it drew into, by the same `attachGestures` the ported
     chart uses. Two implementations of how a chart answers a finger would be
     two owners of one behaviour, and `MASTER RULE 1` calls that a defect. */
  makeMomentChartInteractive(host, { def, series });
  return { close };
}

/* --- making the moment's chart touchable --------------------------------- */

/* Pinch, pan, double-tap and tap-a-point, over the animation rather than
   instead of it. The animation owns the drawing and is untouched; this owns
   the view and the readout.

   Zoom is a uniform viewBox transform. `moments.js` draws into a fixed
   `0 0 W H` box and the SVG has a fixed CSS height, so scaling the box about
   the pinch centre magnifies exactly what is there. Nothing about the series
   is recomputed, resampled or clipped — as on every other chart in the app,
   zoom and pan do not touch the data. */
function makeMomentChartInteractive(host, { def, series }) {
  const mount = host.querySelector(".rc-host");
  if (!mount || !series.length) return;

  const readout = h("div", { class: "chartread moment", role: "status", "aria-live": "polite" });
  mount.after(readout);
  mount.append(h("span", { class: "charthint moment" }, t("chart.hint")));

  /* The chart ARRIVES — `--ma-chart-in` translates it as it lands — so its
     painted box and its layout box are not the same rectangle. A tap inside
     the chart the keeper can see could therefore land outside `.rc-host`'s
     layout box and hit whatever lays out there instead, which was the readout
     directly beneath it. Nothing happened, and nothing said why.

     So the tap is taken by the SVG itself, whose hit area follows the
     transform, and the readout is made untouchable in CSS. The gestures stay
     on the host: a touch on the SVG bubbles to it. */
  const svgOf = () => mount.querySelector(".rc-chart");

  let range = { start: 0, end: 1 };

  const view = () => {
    const svg = mount.querySelector(".rc-chart");
    if (!svg) return null;
    const box = svg.getAttribute("data-basebox") || svg.getAttribute("viewBox");
    svg.setAttribute("data-basebox", box);
    const [bx, by, bw, bh] = box.split(/\s+/).map(Number);
    return { svg, bx, by, bw, bh };
  };

  attachGestures(mount, {
    getRange: () => range,
    onChange: (r) => {
      range = r;
      const v = view();
      if (!v) return;
      const span = Math.max(0.04, r.end - r.start);
      const w = v.bw * span;
      const hgt = v.bh * span;
      const cx = v.bx + v.bw * (r.start + span / 2);
      const cy = v.by + v.bh / 2;
      v.svg.setAttribute("viewBox", `${cx - w / 2} ${cy - hgt / 2} ${w} ${hgt}`);
    },
  });

  /* Tap a point. `moments.js` spaces readings evenly across the plot — its
     `readingGeometry` is `AXIS + (i / (n - 1)) * (W - AXIS - PAD)` — so the
     reading under a finger is found from where the finger is, without a second
     copy of that geometry living here. */
  const onTap = (e) => {
    const v = view();
    if (!v) return;
    const rect = v.svg.getBoundingClientRect();
    if (!rect.width) return;
    const css = getComputedStyle(document.documentElement);
    const axis = Number(css.getPropertyValue("--ma-axis"));
    const pad = Number(css.getPropertyValue("--ma-pad"));
    const [vx, , vw] = v.svg.getAttribute("viewBox").split(/\s+/).map(Number);
    const inBox = vx + ((e.clientX - rect.left) / rect.width) * vw;
    const plot = v.bw - axis - pad;
    const frac = plot > 0 ? (inBox - axis) / plot : 0;
    const i = Math.round(frac * (series.length - 1));
    const p = series[Math.max(0, Math.min(series.length - 1, i))];
    if (!p) return;
    readout.replaceChildren(
      h("span", { class: "v" }, p.value.toFixed(def.decimals)),
      h("span", { class: "u" }, def.unit),
      h("span", { class: "d" }, fmtDayName(p.date))
    );
  };

  const svg = svgOf();
  if (svg) svg.addEventListener("click", onTap);
  mount.addEventListener("click", onTap);
}

/* --- b. the dose expectation --------------------------------------------- */

export function momentDoseExpectation({ from, to, snapshot, retest, onClose }) {
  const { wrap, close } = scrim(onClose);
  const card = h("div", { class: "mcard" });

  card.append(
    h(
      "div",
      { class: "mcap alk" },
      h(
        "div",
        { class: "mval" },
        h("span", { class: "mfrom" }, num(from, 1)),
        h("span", { class: "marrow" }, "→"),
        h("span", { class: "rc-sheen" }, num(to, 1)),
        h("span", { class: "unit" }, "mL/day")
      ),
      h("div", { class: "mlabel" }, t("moment.dose.label"))
    )
  );

  const body = h("div", { class: "mbody stagger" });

  if (snapshot && isPresent(snapshot.predictedPostSlope)) {
    body.append(
      h("p", { class: "mhead" }, t("moment.dose.recordedExpect")),
      h(
        "p",
        { class: "body" },
        t("moment.dose.expectation", { slope: num(snapshot.predictedPostSlope, 4) }) +
          (isPresent(snapshot.expectedSlopeChange)
            ? t("moment.dose.expectationValue", { value: signed(snapshot.expectedSlopeChange, 4) })
            : t("moment.dose.expectationEnd"))
      )
    );
  } else {
    /* No snapshot. The moment says so. It does not predict anything of its own
       — a prediction from the interface would be graded later as though the
       engine had made it, and the engine would then be blamed for it. */
    body.append(
      h("p", { class: "mhead" }, t("moment.dose.recorded")),
      h("p", { class: "body" }, t("moment.dose.noSnapshot")),
      h("p", { class: "inert-note" }, t("moment.dose.noSnapshotNote"))
    );
  }

  const kv = h("div", { class: "kv" });
  if (retest && isPresent(retest.recommendedAt)) {
    const d = retest.recommendedAt.slice(0, 10);
    kv.append(
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("moment.dose.testAgain")), h("span", { class: "kv-v" }, fmtDayName(d))),
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("moment.dose.testAgainWhy")), h("span", { class: "kv-v" }, sayReason(retest.selectedReasonCode || retest.reasonCode)))
    );
  } else {
    kv.append(
      h(
        "div",
        { class: "kv-row" },
        h("span", { class: "kv-k" }, t("moment.dose.testAgain")),
        h("span", { class: "kv-v is-absent" }, t("moment.dose.testAgainNone"))
      )
    );
  }
  body.append(kv);
  body.append(
    h(
      "p",
      { class: "inert-note" },
      t("moment.dose.note")
    )
  );

  card.append(body, countdownFoot("--mb-autoclose"));

  const host = h("div", { "data-moment": "dose" });
  host.append(card);
  wrap.append(host);
  document.body.append(wrap);
  playMoments(wrap);
  return { close };
}

/* --- c. task completion --------------------------------------------------
   The one arithmetic here is the gap in days between two completions. That is
   subtraction over dates the keeper's own actions produced. It is not a
   chemistry inference and there is no rule being applied to it — the numbers
   are shown, and nothing is concluded from them. */
export function momentTaskCompletion({ task, history, nextDue, onClose }) {
  const { wrap, close } = scrim(onClose);
  const card = h("div", { class: "mcard" });

  const dates = [...history].sort().slice(-12);
  const gaps = [];
  for (let i = 1; i < dates.length; i++) gaps.push(daysBetween(dates[i - 1], dates[i]));
  const avg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;

  const run = h("div", { class: "starrun" });
  dates.forEach((d, i) => {
    const latest = i === dates.length - 1;
    run.append(
      h(
        "span",
        {
          class: "st",
          style: { fontSize: latest ? "var(--sz-star-latest)" : "var(--sz-star)", animationDelay: `${i * 40}ms` },
          title: fmtShort(d),
        },
        latest ? "⭐" : "✦"
      )
    );
  });

  card.append(
    h(
      "div",
      { class: "mcap done" },
      h("div", { class: "mtick" }, "✅"),
      h("div", { class: "mlabel" }, task.label),
      h("div", { class: "meta" }, t("moment.task.doneOn", { date: fmtDayName(dates[dates.length - 1]) })),
      run
    )
  );

  const body = h("div", { class: "mbody stagger" });
  body.append(
    h(
      "p",
      { class: "mhead" },
      history.length === 1 ? t("moment.task.first") : t("moment.task.count", { n: history.length })
    )
  );

  if (avg != null) {
    /* The actual intervals, and the one that was set, side by side. Shown
       without comment — V1's restraint here is the point of the moment. */
    body.append(
      h(
        "p",
        { class: "body" },
        t("moment.task.rhythm", { actual: Math.round(avg), set: task.intervalDays })
      ),
      renderGaps(gaps)
    );
  } else {
    body.append(h("p", { class: "body" }, t("moment.task.scheduled")));
  }

  if (nextDue) {
    body.append(
      h(
        "div",
        { class: "kv" },
        h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("moment.task.nextDue")), h("span", { class: "kv-v" }, fmtDayName(nextDue)))
      )
    );
  }

  card.append(body, countdownFoot("--mc-autoclose"));

  const host = h("div", { "data-moment": "task" });
  host.append(card);
  wrap.append(host);
  document.body.append(wrap);
  playMoments(wrap);
  return { close };
}

/* The gaps drawn to scale, one bar per interval. `--mc-gap-unit` is one day of
   interval as bar height, so the chart is data drawn to scale rather than a
   decoration. */
function renderGaps(gaps) {
  const row = h("div", { class: "gaps" });
  for (const g of gaps) {
    row.append(
      h("span", {
        class: "gapbar",
        style: { height: `calc(${g} * var(--mc-gap-unit))` },
        title: t("moment.task.gapTitle", { days: g }),
      })
    );
  }
  return row;
}

/* --- the ICP arrival, the fourth of the family --------------------------- */

export function momentIcpArrival({ count, onClose }) {
  const { wrap, close } = scrim(onClose);
  const card = h("div", { class: "mcard" });
  card.append(
    h(
      "div",
      { class: "mcap alk" },
      h("div", { class: "mval" }, h("span", { "data-icp-count": String(count) }, "0"), h("span", { class: "unit" }, t("log.icp.elements"))),
      h("div", { class: "mlabel" }, t("log.icp.title"))
    ),
    h(
      "div",
      { class: "mbody stagger", "data-icp-detail": "" },
      h("p", { class: "mhead" }, t("log.icp.stored")),
      h("p", { class: "body" }, t("log.icp.storedBody"))
    ),
    countdownFoot("--md-autoclose")
  );
  const host = h("div", { "data-moment": "icp" });
  host.append(card);
  wrap.append(host);
  document.body.append(wrap);
  playMoments(wrap);
  return { close };
}
