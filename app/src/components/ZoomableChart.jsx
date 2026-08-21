import { useEffect, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RotateCcw } from '../icons.jsx'
import { daysBetween } from '../lib/dates.js'

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
    return out.slice(0, 25);
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
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #DCE7E5", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#08191D" }}
              formatter={(v) => [`${axis.formatValue(v)}${unit ? ` ${unit}` : ""}`, paramName]} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.75} dot={visible.length < 50} activeDot={{ r: 5 }} />
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
        if (!kinds.length && !hasBand) return null;
        return (
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
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
