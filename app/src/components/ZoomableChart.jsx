import { useEffect, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RotateCcw } from '../icons.jsx'
import { daysBetween } from '../lib/dates.js'
import { groupWordKey } from '../present/episodes.js'
import { t } from '../strings.js'

/* ---------------------------------- zoomable / pannable chart ---------------------------------- */

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

/* ONE V1 DEFECT, FIXED ON THE WAY ACROSS.

   The salvage inventory records it: this component "never received or
   displayed a unit or a parameter name at any call site". Four call sites, no
   unit anywhere, so a tooltip read `8.72` and an axis read `450` with nothing
   on screen saying of what, in what.

   `unit` and `paramName` are therefore REQUIRED, and the component refuses to
   render without them rather than falling back to a blank. A default would
   have reproduced the defect at any call site that forgot — which is how it
   survived four of them in V1. `unit` may be an empty string, because pH
   genuinely has no unit; it may not be absent. */
/* ============================================================================
   A TEST RUN MORE THAN ONCE, DRAWN AS ONE TEST
   ----------------------------------------------------------------------------
   Six readings typed inside a minute used to draw six points spread along the
   axis, which told the keeper he had tested six times over an hour. He tested
   once, six times over, and the chart said something that did not happen.

   So a group occupies ONE x-position — the instant the engine resolved it to —
   and its measurements are stacked vertically there. They are drawn small and
   quiet because they are not the answer; the resolved value is drawn as a ring
   against them because it is, and the trend line passes through it alone.

   HOW THE STACK IS PLACED. Each measurement slot is its own `Line` with no
   stroke, so recharts positions every dot through the same two axes the trace
   uses. Reading the chart's internal scales and doing the pixel arithmetic here
   would be a second implementation of "where does this value sit", and it would
   be the one that drifted the day a margin changed.

   A test run once is a stack of one and takes exactly this shape, so there is
   one kind of point on the chart rather than two.
   ========================================================================= */

/* How many measurements the busiest visible group holds. */
function maxMembers(rows) {
  let n = 1;
  for (const r of rows) {
    const c = r && Array.isArray(r.members) ? r.members.length : 1;
    if (c > n) n = c;
  }
  return n;
}

/* One measurement in a stack. Small, low-contrast, and never connected to
   anything — a line through the members would be a trend nobody claimed. */
function MemberDot({ cx, cy, payload, fill }) {
  if (cx == null || cy == null) return null;
  if (!payload || !payload.grouped) return null;
  return <circle cx={cx} cy={cy} r={2.6} fill={fill} fillOpacity={0.45} stroke="none" />;
}

/* The value the engine used. A ring where the test was run more than once, so
   it is unmistakable against the members stacked behind it; an ordinary dot
   where there is only one measurement and nothing to distinguish it from. */
function ResolvedDot({ cx, cy, payload, stroke, showPlainDots }) {
  if (cx == null || cy == null) return null;
  if (payload && payload.grouped) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={5.5} fill="#fff" stroke={stroke} strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={1.8} fill={stroke} />
      </g>
    );
  }
  if (!showPlainDots) return null;
  return <circle cx={cx} cy={cy} r={3} fill={stroke} stroke="none" />;
}

/* What a group says when it is tapped. Names how many measurements it holds
   and which figure was used, because those are the two things a keeper looking
   at a stack of dots wants to know. */
function GroupTooltip({ active, payload, paramName, unit, formatValue }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  if (!row) return null;
  const box = {
    background: "#fff", border: "1px solid #DCE7E5", borderRadius: 10,
    padding: "8px 10px", maxWidth: 236,
  };
  if (!row.grouped) {
    return (
      <div style={box}>
        <div className="text-[12px] font-extrabold text-ink">
          {formatValue(row.value)}{unit ? ` ${unit}` : ""}
        </div>
        <div className="text-[11px] font-bold text-ink2">{paramName} · {row.label}</div>
      </div>
    );
  }
  const key = groupWordKey(row.count);
  return (
    <div style={box}>
      <div className="text-[12px] font-extrabold text-ink leading-snug">
        {t(`group.${key}`, { count: row.count, value: formatValue(row.value), unit })}
      </div>
      <div className="text-[11px] font-bold text-ink2 mt-1 leading-snug">
        {t("group.median")}
      </div>
      {row.spread != null && row.spread > 0 && (
        <div className="text-[11px] font-bold mt-1 leading-snug"
          style={{ color: row.anomalous ? "#A2621B" : "#45605F" }}>
          {t(row.anomalous ? "group.wideSpread" : "group.spread",
            { spread: formatValue(row.spread), unit })}
        </div>
      )}
    </div>
  );
}

export function ZoomableLineChart({ data, color, paramName, unit, targetRangeMin, targetRangeMax, height = 280, events = [] }) {
  const containerRef = useRef(null);
  const [range, setRange] = useState({ start: 0, end: 1 });
  const gestureRef = useRef(null);
  const lastTapRef = useRef(0);

  const total = data.length;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

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
        gestureRef.current = { mode: "pinch", startDist: dist(e.touches), startRange: { ...range } };
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          setRange({ start: 0, end: 1 });
          gestureRef.current = null;
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;
        gestureRef.current = { mode: "pan", startX: e.touches[0].clientX, startRange: { ...range } };
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
        let newSpan = Math.max(0.04, Math.min(1, span / scale));
        setRange(clampRange(center - newSpan / 2, center + newSpan / 2));
      } else if (gestureRef.current.mode === "pan" && e.touches.length === 1) {
        const dx = e.touches[0].clientX - gestureRef.current.startX;
        const { start, end } = gestureRef.current.startRange;
        const span = end - start;
        const deltaFrac = -(dx / rect.width) * span;
        setRange(clampRange(start + deltaFrac, end + deltaFrac));
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length === 0) gestureRef.current = null;
      else if (e.touches.length === 1) {
        gestureRef.current = { mode: "pan", startX: e.touches[0].clientX, startRange: { ...range } };
      }
    };

    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const scale = e.deltaY < 0 ? 1.15 : 0.87;
      setRange((r) => {
        const span = r.end - r.start;
        const center = r.start + span / 2;
        const newSpan = Math.max(0.04, Math.min(1, span / scale));
        return clampRange(center - newSpan / 2, center + newSpan / 2);
      });
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, [range]);

  /* Refused after the hooks, never before one: bailing out above `useState`
     and `useEffect` would change the hook order between renders, which React
     treats as a fault of its own. */
  const described = typeof paramName === "string" && paramName.length > 0 && typeof unit === "string";

  const startIdx = total > 0 ? Math.max(0, Math.floor(range.start * (total - 1))) : 0;
  const endIdx = total > 0 ? Math.min(total - 1, Math.ceil(range.end * (total - 1))) : 0;
  const visible = total > 0 ? data.slice(startIdx, endIdx + 1) : [];
  const isZoomed = range.start > 0.001 || range.end < 0.999;

  const values = visible.map((d) => d.value);
  /* Include the target range in the scale so the shaded area is never clipped. */
  const scaleVals = values.slice();
  if (targetRangeMin != null) scaleVals.push(targetRangeMin);
  if (targetRangeMax != null) scaleVals.push(targetRangeMax);
  const axis = niceAxis(
    scaleVals.length ? Math.min(...scaleVals) : 0,
    scaleVals.length ? Math.max(...scaleVals) : 1);

  /* Snap each event to the nearest visible reading so the marker lands on a
     real x-axis category, then drop any that fall outside the zoom window. */
  /* One slot per measurement position, so the busiest visible group has a
     line to draw every one of its members through. */
  const memberSlots = useMemo(() => {
    const n = maxMembers(visible);
    return Array.from({ length: n }, (_, i) => i);
  }, [visible]);

  const visibleEvents = useMemo(() => {
    if (!events.length || !visible.length) return [];
    const out = [];
    const seen = new Set();
    for (const ev of events) {
      let best = null, bestGap = Infinity;
      for (const d of visible) {
        const gap = Math.abs(daysBetween(d.date, ev.date));
        if (gap < bestGap) { bestGap = gap; best = d; }
      }
      if (best && bestGap <= 4) {
        const k = best.label + ev.icon;
        if (!seen.has(k)) { seen.add(k); out.push({ ...ev, label: best.label }); }
      }
    }

    /* ROUND THREE, ITEM 6 — MARKER DENSITY.

       Every water change in the imported history drew its own dashed vertical
       line. On a 7-day view that is one or two and they are useful; on the
       90-day view it was roughly twenty, and twenty dashed lines across a
       chart obscure the trace they are annotating. The markers stopped being
       annotation and became the picture.

       So they thin as the window widens. The rule is a budget rather than a
       cutoff date: a chart gets about one marker per eight visible readings,
       never fewer than four and never more than twelve, and when there are
       more than the budget the ones kept are spread evenly across the window
       rather than taken from one end — a chart that drew every marker in
       February and none in August would misrepresent the history worse than
       drawing none at all.

       Nothing is hidden that the keeper cannot reach: the full list is his
       history, and this is one chart's annotation layer. */
    const budget = Math.max(4, Math.min(12, Math.round(visible.length / 8)));
    if (out.length <= budget) return out;
    const step = out.length / budget;
    const thinned = [];
    for (let i = 0; i < budget; i += 1) thinned.push(out[Math.floor(i * step)]);
    return thinned;
  }, [events, visible]);

  if (!described) {
    return (
      <div className="rounded-xl border-2 border-dashed border-app p-4 text-[12px] font-bold text-ink2">
        This chart was asked to draw a trace without saying what it is or what
        it is measured in, so it has not drawn one.
      </div>
    );
  }

  return (
    <div>
      <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">
        {paramName}{unit ? ` \u00b7 ${unit}` : ""}
      </div>
      <div ref={containerRef} style={{ height, touchAction: "none" }} className="select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visible} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#E3ECEA" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#5C7876" fontSize={11} fontWeight={600} minTickGap={24} />
            <YAxis stroke="#5C7876" fontSize={11} fontWeight={600} domain={axis.domain} ticks={axis.ticks} tickFormatter={axis.format} width={46} />
            {targetRangeMin != null && <ReferenceArea y1={targetRangeMin} y2={targetRangeMax} fill={color} fillOpacity={0.10} />}
            {visibleEvents.map((ev, i) => (
              <ReferenceLine key={i} x={ev.label} stroke={ev.color} strokeDasharray="4 3" strokeWidth={1.5}
                label={{ value: ev.icon, position: "top", fontSize: 11, fill: ev.color }} />
            ))}
            <Tooltip cursor={{ stroke: "#C7D6D3", strokeWidth: 1 }}
              content={<GroupTooltip paramName={paramName} unit={unit} formatValue={axis.formatValue} />} />
            {/* The measurements, stacked at their group's position and drawn
                first so the trace and its resolved value sit over them. */}
            {memberSlots.map((i) => (
              <Line key={`m${i}`} type="linear" isAnimationActive={false} legendType="none"
                dataKey={(row) => (row && row.grouped && row.members && row.members[i]
                  ? row.members[i].value : null)}
                stroke="none" connectNulls={false} activeDot={false}
                dot={<MemberDot fill={color} />} />
            ))}
            {/* The trend runs through the resolved value and nothing else. */}
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.75}
              isAnimationActive={false}
              dot={<ResolvedDot stroke={color} showPlainDots={visible.length < 50} />}
              activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Legend: the dashed markers were unlabelled, so a line on the chart
          gave no clue what it represented. Only kinds actually present are
          listed, so it stays out of the way on a chart with no events. */}
      {(() => {
        const kinds = [];
        const seen = new Set();
        for (const ev of visibleEvents) {
          if (seen.has(ev.kind)) continue;
          seen.add(ev.kind);
          kinds.push({ kind: ev.kind, color: ev.color, icon: ev.icon });
        }
        const hasBand = targetRangeMin != null && targetRangeMax != null;
        /* Only where a repeat test is actually on screen. A legend explaining
           stacked measurements on a chart that has none is noise. */
        const hasGroup = visible.some((d) => d && d.grouped);
        if (!kinds.length && !hasBand && !hasGroup) return null;
        return (
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
            {hasGroup && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block rounded-full" aria-hidden="true"
                    style={{ width: 6, height: 6, background: color, opacity: 0.45 }} />
                  <span className="text-[10px] font-bold text-ink2">{t("group.legend.measurement")}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block rounded-full" aria-hidden="true"
                    style={{ width: 10, height: 10, background: "#fff", border: `2.5px solid ${color}` }} />
                  <span className="text-[10px] font-bold text-ink2">{t("group.legend.used")}</span>
                </span>
              </>
            )}
            {hasBand && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-2.5 rounded-sm" style={{ background: color, opacity: 0.18 }} />
                <span className="text-[10px] font-bold text-ink2">target range</span>
              </span>
            )}
            {kinds.map((k) => (
              <span key={k.kind} className="flex items-center gap-1.5">
                <span className="inline-block" style={{ color: k.color, fontSize: 11, lineHeight: 1 }}>{k.icon}</span>
                <span className="inline-block w-3 border-t-2 border-dashed" style={{ borderColor: k.color }} />
                <span className="text-[10px] font-bold text-ink2">
                  {k.kind === "Dose" ? "dose change" : k.kind === "Lighting" ? "lighting change" : k.kind.toLowerCase()}
                </span>
              </span>
            ))}
          </div>
        );
      })()}

      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-ink2 font-semibold">Pinch to zoom · drag to pan · double-tap to reset</span>
        {isZoomed && (
          <button onClick={() => setRange({ start: 0, end: 1 })} className="text-[11px] font-bold text-teal-brand flex items-center gap-1">
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}
