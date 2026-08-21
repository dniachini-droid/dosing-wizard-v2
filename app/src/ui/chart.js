/* ============================================================================
   THE INTERACTIVE CHART — PORTED FROM V1
   ----------------------------------------------------------------------------
   Ported from V1 `src/components/ZoomableChart.jsx` at commit
   `9276a2ca254e88d19e0f02dced42a1b896499780`.
   `docs/migration/V1-APPLICATION-SALVAGE.md` §5 dispositions `niceAxis`
   `PORT_AS_IS` and `ZoomableLineChart` `GENERIC_COMPONENT_SAFE_TO_PORT`.

   WHY IT IS PORTED AND NOT REWRITTEN
   ----------------------------------

   `niceAxis` is a solved problem with every defect it fixes written down
   beside the branch that fixes it: a long floating-point tail printed verbatim
   on the axis, a negative gridline drawn beneath an all-zero trace element,
   and a reading DISPLAYED AS THE WRONG VALUE because it had been snapped to
   its nearest gridline. The function below is V1's, unchanged, comments and
   all. Reimplementing it from a description would mean rediscovering those
   three defects in production.

   The gesture arithmetic is V1's too, and for the same reason: the clamp, the
   0.04 minimum span, the 300 ms double-tap window, the 1.15/0.87 wheel factors
   and the centre-preserving pinch were tuned by hand against a real phone.

   WHAT CHANGED ON THE WAY ACROSS

   1. **The recorded V1 defect is fixed.** The salvage inventory records that
      `ZoomableLineChart` "never received or displayed a unit or a parameter
      name at any call site" — verified: `Dashboard.jsx:593`,
      `AllParametersSheet.jsx:285` and `IcpPanel.jsx:168` pass a colour and a
      target range and no name. So `label` and `unit` are REQUIRED here, and
      the component refuses to render without them. A chart of an unnamed
      quantity in unnamed units is a picture, not a measurement.

   2. **Recharts is gone.** `V1-APPLICATION-SALVAGE.md` §5 marks the dependency
      `REFERENCE_ONLY` — it was the bulk of a bundle 60% over its budget. This
      draws SVG directly, which the rest of this application already does.

   3. **The trace and the points are V2's.** Which readings the engine could
      use is the ENGINE's statement, rendered here; V1 had no such concept.

   WHAT ZOOM AND PAN DO NOT DO
   ---------------------------

   They do not touch the data. `points` is read and never written; the visible
   window is a slice taken at draw time, exactly as V1 did it. A chart that
   rounded, resampled or clipped its input while zooming would be a chart that
   showed the keeper a number he never measured — which is the third defect
   `niceAxis` exists to prevent, arriving by a different route.
   ========================================================================= */

import { h, svg } from "./dom.js";
import { fmtShort, fmtDayName } from "./format.js";
import { t } from "../strings.js";

/* --- Axis scaling ---
 *
 * Padding a domain by a percentage produces values like 8.591999999999999,
 * and a numeric domain is printed verbatim by the chart library — which is
 * where the long strings of 9s on the y-axis came from. Snap the bounds to a
 * round step instead, and format every tick to a sensible number of decimals.
 */
export function niceAxis(min, max, padFrac = 0.18) {
  if (!isFinite(min) || !isFinite(max)) return { domain: [0, 1], ticks: undefined, format: (v) => v };
  if (min === max) {
    /* A flat line still needs a range. For an all-zero trace element, expand
       upward only — a negative concentration axis is meaningless. */
    if (min === 0) { max = 1; }
    else { const w = Math.abs(min) * 0.05; min -= w; max += w; }
  }

  const span = (max - min) * (1 + padFrac * 2);
  // Choose a step that gives roughly 4-6 gridlines at a human-friendly size.
  const rawStep = span / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  /* 1/2/5/10 only. Allowing 2.5 produced ticks like 8.00, 8.03, 8.05, 8.07
     where the printed gaps look uneven once rounded. */
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;

  let lo = Math.floor((min - (max - min) * padFrac) / step) * step;
  const hi = Math.ceil((max + (max - min) * padFrac) / step) * step;
  /* Concentrations can't be negative, so don't scale below zero just to make
     room — an all-zero trace element was drawing a -0.10 gridline. */
  if (min >= 0 && lo < 0) lo = 0;

  // Decimals needed to express the step exactly, capped for readability.
  const decimals = Math.min(6, Math.max(0, -Math.floor(Math.log10(step)) + (step < 1 ? 0 : 0)));

  const ticks = [];
  for (let v = lo; v <= hi + step / 1000; v += step) {
    ticks.push(+(Math.round(v / step) * step).toFixed(10));
  }
  /* Axis ticks are snapped to the step so gridline labels read cleanly. */
  const format = (v) => {
    if (v == null || isNaN(v)) return "";
    const r = +(Math.round(v / step) * step).toFixed(10);
    return decimals > 0 ? r.toFixed(decimals) : String(r);
  };

  /* Data values must NOT be snapped — doing so displayed a reading of 9.3 as
     9.5, because 9.3 is nearer the 9.5 gridline than the 9.0 one. Show the
     actual number, trimmed only of floating-point noise. */
  const formatValue = (v) => {
    if (v == null || isNaN(v)) return "";
    const a = Math.abs(v);
    const dp = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a >= 0.01 ? 3 : 4;
    return String(+v.toFixed(dp));
  };

  /* Trim floating-point noise off the bounds themselves: repeated multiplication
     produced domains like 0.30000000000000004. */
  const clean = (v) => +v.toFixed(10);
  return { domain: [clean(lo), clean(hi)], ticks, format, formatValue, step, decimals };
}

/* --- the gestures ---------------------------------------------------------

   V1's `ZoomableLineChart` effect body, lifted out so there is ONE owner of
   how a chart responds to a finger. The moment charts use it too; two
   implementations that agreed today would be a defect rather than a
   coincidence (canon `MASTER RULE 1`).

   `onChange({start, end})` is called with the visible window as two fractions
   of the whole series. The caller decides what to do with it — slice a series,
   move a viewBox — and this decides nothing about the data. */
export function attachGestures(el, { onChange, getRange }) {
  const gestureRef = { current: null };
  const lastTapRef = { current: 0 };

  const dist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const clampRange = (start, end) => {
    if (start < 0) { end -= start; start = 0; }
    if (end > 1) { start -= (end - 1); end = 1; }
    return { start: Math.max(0, start), end: Math.min(1, end) };
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      gestureRef.current = { mode: "pinch", startDist: dist(e.touches), startRange: { ...getRange() } };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        onChange({ start: 0, end: 1 });
        gestureRef.current = null;
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
      gestureRef.current = { mode: "pan", startX: e.touches[0].clientX, startRange: { ...getRange() } };
    }
  };

  const onTouchMove = (e) => {
    if (!gestureRef.current) return;
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    if (gestureRef.current.mode === "pinch" && e.touches.length === 2) {
      const newDist = dist(e.touches);
      const scale = newDist / gestureRef.current.startDist;
      const { start, end } = gestureRef.current.startRange;
      const span = end - start;
      const center = start + span / 2;
      const newSpan = Math.max(0.04, Math.min(1, span / scale));
      onChange(clampRange(center - newSpan / 2, center + newSpan / 2));
    } else if (gestureRef.current.mode === "pan" && e.touches.length === 1) {
      const dx = e.touches[0].clientX - gestureRef.current.startX;
      const { start, end } = gestureRef.current.startRange;
      const span = end - start;
      const deltaFrac = -(dx / rect.width) * span;
      onChange(clampRange(start + deltaFrac, end + deltaFrac));
    }
  };

  const onTouchEnd = (e) => {
    if (e.touches.length === 0) gestureRef.current = null;
    else if (e.touches.length === 1) {
      gestureRef.current = { mode: "pan", startX: e.touches[0].clientX, startRange: { ...getRange() } };
    }
  };

  const onWheel = (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const scale = e.deltaY < 0 ? 1.15 : 0.87;
    const r = getRange();
    const span = r.end - r.start;
    const center = r.start + span / 2;
    const newSpan = Math.max(0.04, Math.min(1, span / scale));
    onChange(clampRange(center - newSpan / 2, center + newSpan / 2));
  };

  /* A trackpad and a mouse have no pinch, and a desktop browser is where this
     gets developed. `dblclick` is the double-tap's equivalent there. */
  const onDoubleClick = () => onChange({ start: 0, end: 1 });

  el.addEventListener("touchstart", onTouchStart, { passive: true });
  el.addEventListener("touchmove", onTouchMove, { passive: false });
  el.addEventListener("touchend", onTouchEnd, { passive: true });
  el.addEventListener("wheel", onWheel, { passive: false });
  el.addEventListener("dblclick", onDoubleClick);

  return () => {
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("touchend", onTouchEnd);
    el.removeEventListener("wheel", onWheel);
    el.removeEventListener("dblclick", onDoubleClick);
  };
}

/* --- the chart ----------------------------------------------------------- */

const W = 320, H = 168, T = 12, B = 132;

/* `label` and `unit` are required, and that is the V1 defect being fixed.
   `unit` may be an empty string — pH has no unit, and "no unit" is a real
   answer — but it must be SUPPLIED, so a call site cannot forget it by
   omission. */
export function interactiveChart({
  points,
  tone,
  label,
  unit,
  decimals = 2,
  range = null,
  events = [],
  boundary = null,
  onPointTap = null,
  ariaLabel = null,
}) {
  if (typeof label !== "string" || !label) throw new Error(t("err.chartNeedsLabel"));
  if (typeof unit !== "string") throw new Error(t("err.chartNeedsUnit"));

  const wrap = h("div", { class: "chartwrap" });
  const plot = h("div", { class: "chartplot" });
  const readout = h("div", { class: "chartread", role: "status", "aria-live": "polite" });
  const hint = h("span", { class: "charthint" }, t("chart.hint"));
  const resetBtn = h(
    "button",
    { class: "chartreset", type: "button", hidden: true, onclick: () => setRange({ start: 0, end: 1 }) },
    t("chart.reset")
  );

  let rangeWindow = { start: 0, end: 1 };
  let selected = null;

  function setRange(r) {
    rangeWindow = r;
    draw();
  }

  /* The axis label column has to be wide enough for the widest tick the axis
     will actually print, or the numbers run into the trace. Measured from the
     formatted ticks rather than guessed. */
  function draw() {
    const total = points.length;
    const startIdx = total > 0 ? Math.max(0, Math.floor(rangeWindow.start * (total - 1))) : 0;
    const endIdx = total > 0 ? Math.min(total - 1, Math.ceil(rangeWindow.end * (total - 1))) : 0;
    /* SLICED, NEVER MUTATED. `points` is the same array it arrived as. */
    const visible = total > 0 ? points.slice(startIdx, endIdx + 1) : [];
    const isZoomed = rangeWindow.start > 0.001 || rangeWindow.end < 0.999;
    resetBtn.hidden = !isZoomed;

    plot.replaceChildren();
    if (!visible.length) {
      plot.append(h("p", { class: "body" }, t("chart.nothingHere")));
      return;
    }

    /* Include the target range in the scale so the shaded area is never
       clipped. V1 `ZoomableChart.jsx:167-170`. */
    const scaleVals = visible.map((d) => d.value);
    if (range) {
      scaleVals.push(range.min);
      scaleVals.push(range.max);
    }
    const axis = niceAxis(Math.min(...scaleVals), Math.max(...scaleVals));
    const [lo, hi] = axis.domain;

    const widest = Math.max(...axis.ticks.map((v) => axis.format(v).length));
    const L = 8 + widest * 5.2;
    const R = W - 10;

    const x = (i) => (visible.length === 1 ? (L + R) / 2 : L + (i / (visible.length - 1)) * (R - L));
    const y = (v) => B - ((v - lo) / (hi - lo || 1)) * (B - T);
    const indexOfDate = (date) => {
      let best = -1;
      for (let i = 0; i < visible.length; i += 1) if (visible[i].date <= date) best = i;
      return best;
    };

    const g = svg("svg", {
      class: "chart c-" + tone,
      viewBox: `0 0 ${W} ${H}`,
      role: "img",
      "aria-label": ariaLabel || defaultAria(visible, label, unit),
    });

    for (const tick of axis.ticks) {
      const ty = y(tick);
      if (ty < T - 1 || ty > B + 1) continue;
      g.append(
        svg("line", { class: "grid", x1: L, y1: ty, x2: R, y2: ty }),
        svg("text", { class: "axis", x: L - 4, y: ty + 3, "text-anchor": "end" }, axis.format(tick))
      );
    }

    if (range) {
      const yTop = y(range.max), yBot = y(range.min);
      g.append(
        svg("rect", {
          class: "range-fill",
          x: L,
          y: Math.min(yTop, yBot),
          width: R - L,
          height: Math.abs(yBot - yTop),
        }),
        svg("line", { class: "range-edge", x1: L, y1: yTop, x2: R, y2: yTop }),
        svg("line", { class: "range-edge", x1: L, y1: yBot, x2: R, y2: yBot })
      );
    }

    for (const e of events) {
      const i = indexOfDate(e.date);
      if (i < 0 || e.date < visible[0].date || e.date > visible[visible.length - 1].date) continue;
      const px = x(i);
      g.append(
        svg("line", { class: "evline " + (e.cls || ""), x1: px, y1: T, x2: px, y2: B }),
        svg("polygon", { class: "evmark", points: `${px - 4},${T - 7} ${px + 4},${T - 7} ${px},${T - 1}` })
      );
    }

    if (boundary) {
      const i = indexOfDate(boundary);
      if (i >= 0 && boundary >= visible[0].date && boundary <= visible[visible.length - 1].date) {
        const bx = x(i);
        g.append(
          svg("line", { class: "boundary", x1: bx, y1: T - 6, x2: bx, y2: B }),
          svg("text", { class: "boundary-label", x: bx + 3, y: T - 1 }, t("history.boundary.mark"))
        );
      }
    }

    const drawable = visible.filter((p) => p.eligible !== false && !p.superseded);
    if (drawable.length >= 2) {
      const d = visible
        .map((p, i) => (p.eligible === false || p.superseded ? null : { i, p }))
        .filter(Boolean)
        .map((s, n) => `${n ? "L" : "M"}${x(s.i).toFixed(1)},${y(s.p.value).toFixed(1)}`)
        .join(" ");
      g.append(svg("path", { class: "trace", d }));
    }

    /* ONE TAP TARGET FOR THE WHOLE PLOT, AND THE NEAREST POINT WINS.

       Per-point discs looked right and were wrong. A finger needs about 14
       units of the 320 this chart is wide; six months of alkalinity is 93
       readings about 3 units apart, so every disc covered eight of its
       neighbours and the tap went to whichever happened to be drawn last —
       consistently the wrong one, and consistently the one to the right. The
       keeper would have tapped 9.3 and been told 9.4.

       So the pointer is taken by a single transparent rectangle over the plot
       and resolved to the NEAREST point by its x. That is unambiguous at any
       density, and it degrades the way a chart should: zoom in and the points
       are further apart, so the tap is more precise. */
    g.append(
      svg("rect", {
        class: "pt-surface",
        x: L,
        y: T,
        width: R - L,
        height: B - T,
        onclick: (e) => {
          const box = g.getBoundingClientRect();
          if (!box.width) return;
          const inView = ((e.clientX - box.left) / box.width) * W;
          let best = 0;
          let bestGap = Infinity;
          visible.forEach((p, i) => {
            const gap = Math.abs(x(i) - inView);
            if (gap < bestGap) {
              bestGap = gap;
              best = i;
            }
          });
          tap(visible[best]);
        },
      })
    );

    visible.forEach((p, i) => {
      const isLast = i === visible.length - 1;
      const cls =
        p.superseded || p.eligible === false ? "pt-excluded" : isLast ? "pt-last" : "pt";
      const isSelected = selected && selected.key === keyOf(p);
      g.append(
        svg("circle", {
          class: cls + (isSelected ? " pt-selected" : ""),
          cx: x(i),
          cy: y(p.value),
          r: isLast ? 4.5 : 4,
        }),
        /* Focusable, for a keyboard and a screen reader, and deliberately
           invisible to the pointer — `pt-surface` above owns that. Focus moves
           one point at a time, so the crowding that defeats a finger does not
           arise here. */
        svg("circle", {
          class: "pt-hit",
          cx: x(i),
          cy: y(p.value),
          r: 6,
          tabindex: "0",
          role: "button",
          "aria-label": pointAria(p, label, unit, decimals),
          onkeydown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              tap(p);
            }
          },
        })
      );
    });

    g.append(
      svg("text", { class: "axis", x: L, y: H - 4 }, fmtShort(visible[0].date)),
      svg("text", { class: "axis", x: R, y: H - 4, "text-anchor": "end" }, fmtShort(visible[visible.length - 1].date))
    );

    plot.append(g);
  }

  function keyOf(p) {
    return `${p.date}|${p.value}|${p.eventId || ""}`;
  }

  /* Tapping a point says what it is, in this parameter's own name and units —
     the V1 defect, fixed. A second tap on the same point is the "open it"
     gesture where a caller has somewhere to open. */
  function tap(p) {
    const key = keyOf(p);
    if (selected && selected.key === key && onPointTap) {
      onPointTap(p);
      return;
    }
    selected = { key, point: p };
    readout.replaceChildren(
      h("span", { class: "v" }, p.value.toFixed(decimals)),
      h("span", { class: "u" }, unit),
      h("span", { class: "d" }, fmtDayName(p.date) + (p.time ? " " + p.time : "")),
      onPointTap ? h("span", { class: "go" }, t("chart.openEntry")) : null
    );
    draw();
  }

  function defaultAria(visible, label, unit) {
    const first = visible[0];
    const last = visible[visible.length - 1];
    return t("chart.aria", {
      label,
      unit,
      n: visible.length,
      from: first.value,
      fromDate: fmtShort(first.date),
      to: last.value,
      toDate: fmtShort(last.date),
    });
  }

  function pointAria(p, label, unit, decimals) {
    return t("chart.point.aria", {
      label,
      value: p.value.toFixed(decimals),
      unit,
      date: fmtDayName(p.date),
    });
  }

  attachGestures(plot, { onChange: setRange, getRange: () => rangeWindow });

  draw();
  wrap.append(plot, readout, h("div", { class: "chartfoot" }, hint, resetBtn));
  return { node: wrap, reset: () => setRange({ start: 0, end: 1 }) };
}
