/* ============================================================================
   THE PORTED CHART
   ----------------------------------------------------------------------------
   Three claims, and the first is the one with teeth:

     1. Zoom and pan do not alter the underlying data. A chart that rounded,
        resampled or clipped its input while zooming would show the keeper a
        number he never measured — which is the third defect `niceAxis` exists
        to prevent, arriving by a different route.
     2. Tapping a point reports the right value and the right date. A chart
        that snapped a reading to its nearest gridline displayed 9.3 as 9.5 in
        V1, and the comment beside the branch that fixes it says so.
     3. A chart always receives its unit and its parameter name. V1's component
        received neither at any call site — a defect the salvage inventory
        records — and the fix is that it now refuses without them.

   `niceAxis` is ported verbatim from V1 `src/components/ZoomableChart.jsx` at
   commit `9276a2ca254e88d19e0f02dced42a1b896499780`. The cases below are the
   defects its own comments name, pinned so the port cannot quietly lose one.

   These run in Node, which has no DOM. `niceAxis` and the gesture arithmetic
   are pure and are exercised directly; the rendering is exercised in a real
   browser by `tools/app/smoke.mjs`, and that split is stated rather than
   papered over.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { suite, eq, ok, deepEq, throws } from "./harness.mjs";
import { attachGestures, niceAxis } from "../../app/src/ui/chart.js";

const s = suite("the ported chart");

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const CHART = fs.readFileSync(path.join(ROOT, "app/src/ui/chart.js"), "utf8");

/* -------------------------------------------------------------------------
   The axis, and the three defects its comments name.
   ---------------------------------------------------------------------- */

s.test("CH-01", "the axis snaps to 1, 2, 5 or 10 and never prints a floating-point tail", () => {
  /* V1: "Padding a domain by a percentage produces values like
     8.591999999999999, and a numeric domain is printed verbatim by the chart
     library — which is where the long strings of 9s on the y-axis came
     from." */
  /* V1'S OWN DEFECT, WITH AN INPUT THAT PRODUCES IT.

     The comment above was here and the cases below it were not: `[8.6, 9.2]`,
     `[400, 450]` and the rest all come out clean whether the trimming happens
     or not, so the named defect was documented and never reproduced. A real
     phosphate span does produce it — 0.14 to 0.235 pads and snaps to a high
     bound of 0.30000000000000004 before it is trimmed. */
  const po4 = niceAxis(0.14, 0.235);
  for (const bound of po4.domain) {
    eq(
      String(bound).length <= 6,
      true,
      `the domain bound ${bound} carries no floating-point tail`
    );
  }
  eq(po4.domain[1], 0.3, "and it is the number it should be, not a near miss");

  const a = niceAxis(8.6, 9.2);
  for (const tick of a.ticks) {
    const printed = a.format(tick);
    ok(printed.length <= 6, `a tick prints short and clean: "${printed}"`);
    ok(!/\d{6,}/.test(printed), `no floating-point tail in "${printed}"`);
  }
  for (const bound of a.domain) {
    ok(!/\.\d{7,}/.test(String(bound)), `no tail on the domain bound ${bound}`);
  }

  /* The property the snapping actually provides, and the reason the tail
     disappeared: both bounds sit exactly ON a step, so the top and bottom
     gridlines land on the edges of the plot instead of somewhere near them. */
  for (const [lo, hi] of [[8.6, 9.2], [400, 450], [0.01, 0.23], [1200, 1560], [6, 15]]) {
    const axis = niceAxis(lo, hi);
    for (const bound of axis.domain) {
      const steps = bound / axis.step;
      ok(
        Math.abs(steps - Math.round(steps)) < 1e-6,
        `the bound ${bound} is a whole number of ${axis.step} steps, not ${steps}`
      );
    }
  }

  /* The step is 1, 2, 5 or 10 times a power of ten, and never 2.5 — V1:
     "Allowing 2.5 produced ticks like 8.00, 8.03, 8.05, 8.07 where the printed
     gaps look uneven once rounded." */
  for (const [lo, hi] of [[8.6, 9.2], [0, 1], [400, 450], [1200, 1560], [0.01, 0.23], [6, 15]]) {
    const axis = niceAxis(lo, hi);
    const mag = Math.pow(10, Math.floor(Math.log10(axis.step)));
    const norm = +(axis.step / mag).toFixed(10);
    ok([1, 2, 5, 10].includes(norm), `step ${axis.step} normalises to ${norm}, one of 1/2/5/10`);
  }
});

s.test("CH-02", "an all-zero series does not draw a negative gridline", () => {
  /* V1: "Concentrations can't be negative, so don't scale below zero just to
     make room — an all-zero trace element was drawing a -0.10 gridline." */
  const a = niceAxis(0, 0);
  eq(a.domain[0], 0, "the axis starts at zero");
  ok(a.domain[1] > 0, "and still has a range to draw in");
  ok(!a.ticks.some((v) => v < 0), "no tick is below zero");

  /* And the same for a series that is merely near zero — phosphate at 0.01. */
  const b = niceAxis(0.01, 0.04);
  ok(b.domain[0] >= 0, `a near-zero series does not go negative: ${b.domain[0]}`);
  ok(!b.ticks.some((v) => v < 0), "and neither do its ticks");

  /* A genuinely negative series is left alone: the rule is about concentrations,
     not about arithmetic. */
  const c = niceAxis(-5, 5);
  ok(c.domain[0] < 0, "a series that really is negative keeps its negative axis");
});

s.test("CH-03", "a data value is NEVER snapped to a gridline", () => {
  /* The defect this is the fix for, in V1's own words: "doing so displayed a
     reading of 9.3 as 9.5, because 9.3 is nearer the 9.5 gridline than the 9.0
     one. Show the actual number, trimmed only of floating-point noise."

     This is the one that reaches the keeper as a wrong number on his own
     screen, so it is pinned with the exact case named. */
  const a = niceAxis(8.6, 10.4);
  eq(a.formatValue(9.3), "9.3", "9.3 reads as 9.3, not as the nearest gridline");
  eq(a.formatValue(9.5), "9.5", "and 9.5 reads as 9.5");

  /* Across the magnitudes this app actually holds. */
  eq(niceAxis(400, 500).formatValue(437), "437", "calcium, whole numbers");
  eq(niceAxis(0.01, 0.23).formatValue(0.095), "0.095", "phosphate, three decimals");
  eq(niceAxis(1200, 1560).formatValue(1407), "1407", "magnesium");
  eq(niceAxis(33, 36).formatValue(34.6), "34.6", "salinity");
  eq(niceAxis(7.8, 8.4).formatValue(8.12), "8.12", "pH");

  /* And floating-point noise IS trimmed, which is the other half of the same
     sentence. */
  eq(niceAxis(0, 1).formatValue(0.30000000000000004), "0.3", "noise is trimmed off a value");
});

s.test("CH-04", "the tick decimals come from the step, not from the data", () => {
  /* V1: "format every tick to a sensible number of decimals", derived from the
     step. A step of 0.5 prints one decimal; a step of 50 prints none. */
  const coarse = niceAxis(0, 500);
  ok(coarse.decimals === 0, `a large step prints no decimals: ${coarse.decimals}`);
  const fine = niceAxis(0.01, 0.05);
  ok(fine.decimals >= 2, `a small step prints enough decimals: ${fine.decimals}`);
  for (const tick of fine.ticks) {
    const printed = fine.format(tick);
    if (fine.decimals > 0) {
      eq(printed.split(".")[1].length, fine.decimals, `every tick prints ${fine.decimals} decimals`);
    }
  }
});

s.test("CH-05", "an axis with nothing to draw returns a usable domain rather than NaN", () => {
  const a = niceAxis(NaN, NaN);
  deepEq(a.domain, [0, 1], "a domain that can be drawn in");
  const b = niceAxis(Infinity, 5);
  deepEq(b.domain, [0, 1], "and the same for an infinite bound");
});

/* -------------------------------------------------------------------------
   Zoom and pan touch the view, never the data.
   ---------------------------------------------------------------------- */

/* V1's window arithmetic, as the component applies it. Reproduced here rather
   than imported because it lives inside a closure that needs a DOM; the SOURCE
   is checked below so the two cannot drift apart unnoticed. */
function windowOf(total, range) {
  const startIdx = total > 0 ? Math.max(0, Math.floor(range.start * (total - 1))) : 0;
  const endIdx = total > 0 ? Math.min(total - 1, Math.ceil(range.end * (total - 1))) : 0;
  return [startIdx, endIdx];
}

s.test("CH-06", "the visible window is a slice, and the series is never written to", () => {
  const points = Array.from({ length: 20 }, (_, i) => ({
    date: `2026-08-${String(i + 1).padStart(2, "0")}`,
    value: 8.5 + i * 0.05,
  }));
  const before = JSON.stringify(points);

  for (const range of [
    { start: 0, end: 1 },
    { start: 0.25, end: 0.75 },
    { start: 0, end: 0.04 },
    { start: 0.96, end: 1 },
  ]) {
    const [a, b] = windowOf(points.length, range);
    const visible = points.slice(a, b + 1);
    ok(visible.length >= 1, `a window always has something in it: ${visible.length}`);
    ok(a >= 0 && b <= points.length - 1, "and stays inside the series");
    for (const p of visible) {
      const original = points.find((o) => o.date === p.date);
      eq(p.value, original.value, `${p.date} is the value it always was`);
    }
  }

  eq(JSON.stringify(points), before, "and the series is byte-for-byte what it was");

  /* The component slices; it does not filter, round or resample. Checked in
     the source, because that is where a future edit would break it. */
  ok(
    /const visible = total > 0 \? points\.slice\(startIdx, endIdx \+ 1\) : \[\];/.test(CHART),
    "the visible window is a slice of the points array"
  );
  ok(
    !/points\.(push|splice|sort|reverse|fill|shift|pop|unshift)\(/.test(CHART),
    "and nothing in the chart mutates it"
  );
});

s.test("CH-07", "zooming never leaves the series, and never zooms past the floor", () => {
  /* V1's `clampRange`, and its 0.04 minimum span. A window that ran off either
     end would show empty space where the keeper expects readings; a span with
     no floor would let a pinch divide by nearly nothing. */
  /* DRIVEN, NOT COPIED.

     This used to re-implement `clampRange` in the test and assert that the
     copy clamped — which proved a property of the test. `attachGestures` needs
     no DOM beyond four methods, so the real one is driven instead, and the
     defect the copy could not see shows up immediately: without the upper
     clamp, panning to the end of the series silently SHRINKS the keeper's
     window instead of stopping at the edge. */
  const drive = () => {
    const on = {};
    let range = { start: 0, end: 1 };
    const el = {
      addEventListener: (k, f) => { on[k] = f; },
      removeEventListener: () => {},
      getBoundingClientRect: () => ({ width: 320, left: 0, top: 0, height: 200 }),
    };
    attachGestures(el, { onChange: (r) => { range = r; }, getRange: () => range });
    const fire = (k, e) => on[k]({ preventDefault() {}, stopPropagation() {}, ...e });
    return { fire, get: () => range, set: (r) => { range = r; } };
  };

  /* Pan left from a half-width window: it stops at the end and KEEPS its
     width. */
  const pan = drive();
  pan.set({ start: 0.4, end: 0.9 });
  pan.fire("touchstart", { touches: [{ clientX: 300, clientY: 0 }] });
  pan.fire("touchmove", { touches: [{ clientX: 0, clientY: 0 }] });
  const panned = pan.get();
  ok(panned.end <= 1 + 1e-9, `the window does not run off the end: ${panned.end}`);
  ok(panned.start >= -1e-9, `nor off the start: ${panned.start}`);
  ok(
    Math.abs(panned.end - panned.start - 0.5) < 1e-9,
    `and it keeps the width it had: ${(panned.end - panned.start).toFixed(4)}`
  );

  /* Pan right the same way, against the other edge. */
  const back = drive();
  back.set({ start: 0.1, end: 0.6 });
  back.fire("touchstart", { touches: [{ clientX: 0, clientY: 0 }] });
  back.fire("touchmove", { touches: [{ clientX: 300, clientY: 0 }] });
  const b2 = back.get();
  ok(b2.start >= -1e-9 && b2.end <= 1 + 1e-9, `stays inside: ${b2.start}..${b2.end}`);
  ok(Math.abs(b2.end - b2.start - 0.5) < 1e-9, `and keeps its width: ${(b2.end - b2.start).toFixed(4)}`);

  /* And a pinch cannot go below the floor, however hard it is pinched. */
  const pinch = drive();
  pinch.fire("touchstart", { touches: [{ clientX: 0, clientY: 0 }, { clientX: 300, clientY: 0 }] });
  for (let i = 0; i < 12; i++) {
    pinch.fire("touchmove", { touches: [{ clientX: 148, clientY: 0 }, { clientX: 152, clientY: 0 }] });
    pinch.fire("touchstart", { touches: [{ clientX: 0, clientY: 0 }, { clientX: 300, clientY: 0 }] });
  }
  const zoomed = pinch.get();
  ok(
    zoomed.end - zoomed.start >= 0.04 - 1e-9,
    `V1's 0.04 floor holds however hard it is pinched: ${(zoomed.end - zoomed.start).toFixed(4)}`
  );

  /* On EVERY path that zooms, not just one of them. There are two — a pinch
     and a wheel — and a floor on one of them is a floor a keeper can get past
     by using the other. */
  const floors = [...CHART.matchAll(/Math\.max\(0\.04, Math\.min\(1, span \/ scale\)\)/g)];
  const zooms = [...CHART.matchAll(/span \/ scale/g)];
  eq(floors.length, zooms.length, `every zoom path has V1's 0.04 floor (${floors.length} of ${zooms.length})`);
  ok(zooms.length >= 2, `and there is more than one zoom path to check: ${zooms.length}`);
  ok(/now - lastTapRef\.current < 300/.test(CHART), "the 300ms double-tap window is V1's");
  ok(/e\.deltaY < 0 \? 1\.15 : 0\.87/.test(CHART), "and so are the wheel factors");
  ok(/onChange\(\{ start: 0, end: 1 \}, \{ reset: true \}\)/.test(CHART), "a double-tap resets to the whole series, and says so");
});

s.test("CH-08", "the gesture arithmetic has ONE owner, and the moment chart uses it", () => {
  /* The moment's chart is drawn by ported V1 motion code that is carried
     unchanged. Its gestures therefore come from outside that code — from the
     same `attachGestures` every other chart uses. Two implementations of how a
     chart answers a finger would be two owners of one behaviour, which canon
     `MASTER RULE 1` calls a defect rather than a coincidence. */
  const present = fs.readFileSync(path.join(ROOT, "app/src/moments/present.js"), "utf8");
  ok(/import \{ attachGestures \} from "\.\.\/ui\/chart\.js";/.test(present), "the moment imports the shared gestures");
  ok(/attachGestures\(mount, \{/.test(present), "and attaches them to the chart it drew");

  const moments = fs.readFileSync(path.join(ROOT, "app/src/moments/moments.js"), "utf8");
  ok(
    !/touchstart|touchmove|pinch/.test(moments),
    "and the ported motion code has no gesture handling of its own"
  );

  /* Exactly one place defines the pinch. */
  const files = [];
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = `${prefix}/${entry.name}`;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs, rel);
      else if (entry.name.endsWith(".js") && /addEventListener\("touchmove"/.test(fs.readFileSync(abs, "utf8"))) {
        files.push(rel);
      }
    }
  };
  walk(path.join(ROOT, "app/src"), ".");
  deepEq(files, ["./ui/chart.js"], "one file handles a moving finger");
});

/* -------------------------------------------------------------------------
   The V1 defect the salvage inventory recorded: no unit, no name.
   ---------------------------------------------------------------------- */

s.test("CH-09", "a chart cannot be drawn without its parameter name and its unit", async () => {
  /* `V1-APPLICATION-SALVAGE.md` §5, against `ZoomableLineChart`: "One V1 defect
     to fix on the way across: it never received or displayed a unit or a
     parameter name at any call site." Verified in V1 source at
     `Dashboard.jsx:593`, `AllParametersSheet.jsx:285` and `IcpPanel.jsx:168`,
     each of which passes a colour and a range and no name.

     Fixed by refusal rather than by a default: a chart that fell back to "" or
     to the parameter key would render, and nobody would notice for months. */
  const { interactiveChart } = await import("../../app/src/ui/chart.js");
  const points = [{ date: "2026-08-01", value: 8.7 }];

  await throws(
    () => interactiveChart({ points, tone: "alk", unit: "dKH" }),
    "which parameter",
    "a chart with no parameter name refuses"
  );
  await throws(
    () => interactiveChart({ points, tone: "alk", label: "Alkalinity" }),
    "unit",
    "a chart with no unit refuses"
  );

  /* An EMPTY unit is a real answer — pH has no unit — and must be accepted.
     Leaving the argument out is not the same thing, and is not. */
  ok(/typeof unit !== "string"/.test(CHART), "an empty unit is accepted; an absent one is not");
  ok(/typeof label !== "string" \|\| !label/.test(CHART), "and a name must be a non-empty string");
});

s.test("CH-10", "every call site passes both, and the readout shows them", () => {
  /* The other half of CH-09: the component refusing is worthless if a call
     site passes a placeholder. Each is checked where it is written. */
  const history = fs.readFileSync(path.join(ROOT, "app/src/screens/history.js"), "utf8");
  const assessment = fs.readFileSync(path.join(ROOT, "app/src/screens/assessment.js"), "utf8");

  for (const [name, src] of [["history.js", history], ["assessment.js", assessment]]) {
    /* Sliced to the `interactiveChart` call itself. Searching the whole file
       found `unit: def.unit` in an aria string and a legend, so a call site
       that stopped passing the unit to the CHART stayed green — the very
       omission this pins. */
    const start = src.indexOf("interactiveChart({");
    ok(start > 0, `${name} calls the ported chart`);
    const call = src.slice(start, src.indexOf("\n  });", start));
    /* Line-anchored on the chart's OWN arguments. An unanchored search matched
       `unit: def.unit` inside the `ariaLabel` string in the same call, so a
       chart drawn with no unit still passed. */
    ok(/^ {4}label: def\.label,$/m.test(call), `${name} passes the parameter's own name to the chart`);
    ok(/^ {4}unit: def\.unit,$/m.test(call), `${name} passes the parameter's own unit to the chart`);
    ok(/^ {4}decimals: def\.decimals,$/m.test(call), `${name} passes its decimals, so the value reads correctly`);
  }

  /* And the readout renders the unit beside the value rather than dropping
     it — which is the visible half of the V1 defect. */
  ok(/h\("span", \{ class: "u" \}, unit\)/.test(CHART), "the readout prints the unit");
  ok(/h\("span", \{ class: "d" \}, fmtDayName\(p\.date\)/.test(CHART), "and the date the reading was taken");
  ok(/p\.value\.toFixed\(decimals\)/.test(CHART), "and the value at the parameter's own precision");
});

s.test("CH-11", "tapping a point reports that point's own value and date", () => {
  /* The rendering needs a DOM and is driven in a browser by
     `tools/app/smoke.mjs`. What is checkable here is that the readout is built
     from the TAPPED point and from nothing else — no nearest-gridline snap, no
     index arithmetic, no last-value fallback. */
  const tap = CHART.slice(CHART.indexOf("function tap(p)"), CHART.indexOf("function defaultAria"));
  ok(/p\.value\.toFixed\(decimals\)/.test(tap), "the value comes from the tapped point");
  ok(/fmtDayName\(p\.date\)/.test(tap), "the date comes from the tapped point");
  ok(!/visible\[|points\[|selected\.point\.value/.test(tap), "and nothing is read from an index or a neighbour");

  /* A second tap on the SAME point is what opens it, so a tap that only wanted
     to read the value does not navigate away. */
  ok(/if \(selected && selected\.key === key && onPointTap\)/.test(tap), "a second tap on the same point opens it");

  /* And the point carries its own identity, so two readings of one value on
     one day are two points. */
  ok(/\$\{p\.date\}\|\$\{p\.value\}\|\$\{p\.eventId \|\| ""\}/.test(CHART), "a point is identified by what it is");
});

s.test("CH-13", "the tap goes to the nearest point, at any density", () => {
  /* Per-point tap targets looked right and were wrong. A finger needs about 14
     of this chart's 320 units; six months of alkalinity is 93 readings roughly
     three units apart, so every disc covered eight neighbours and the tap went
     to whichever was drawn last — consistently the wrong one, and consistently
     the one to the right. The keeper would have tapped 9.3 and been told 9.4.

     One surface takes the pointer and resolves it to the nearest point, which
     is unambiguous at any density. The per-point handles remain for a keyboard
     and are invisible to the pointer so they cannot take the tap back. */
  ok(/class: "pt-surface"/.test(CHART), "one surface takes the pointer");
  ok(/const gap = Math\.abs\(x\(i\) - inView\);/.test(CHART), "and resolves the tap by distance");
  ok(/if \(gap < bestGap\)/.test(CHART), "to the nearest point");
  ok(/tap\(visible\[best\]\)/.test(CHART), "which is the one reported");

  /* The keyboard handles carry no click handler, so they cannot re-introduce
     the overlap. */
  const handles = CHART.slice(CHART.indexOf('class: "pt-hit"'), CHART.indexOf("g.append(\n      svg(\"text\""));
  ok(!/onclick:/.test(handles), "the per-point handles take no pointer event");
  ok(/tabindex: "0"/.test(handles), "but remain reachable by keyboard");

  const css = fs.readFileSync(path.join(ROOT, "app/assets/app.css"), "utf8");
  ok(/\.chart \.pt-hit \{[^}]*pointer-events: none/.test(css), "and are invisible to the pointer in CSS too");

  /* The resolver, run over a realistic density: 93 points across the plot, and
     a tap anywhere lands on the point actually nearest it. */
  const L = 40, R = 310, n = 93;
  const x = (i) => L + (i / (n - 1)) * (R - L);
  const nearest = (inView) => {
    let best = 0, bestGap = Infinity;
    for (let i = 0; i < n; i += 1) {
      const gap = Math.abs(x(i) - inView);
      if (gap < bestGap) { bestGap = gap; best = i; }
    }
    return best;
  };
  for (const i of [0, 1, 30, 46, 91, 92]) {
    eq(nearest(x(i)), i, `a tap exactly on point ${i} selects point ${i}`);
    eq(nearest(x(i) + 1.0), i, `and a tap a unit to the right of it still does`);
    eq(nearest(x(i) - 1.0), i, `and a unit to the left`);
  }
});

/* -------------------------------------------------------------------------
   Every chart surface uses the ported component.
   ---------------------------------------------------------------------- */

s.test("CH-12", "the ported chart is what every chart surface draws", () => {
  /* The keeper noticed the Today card first — "which is where he will look
     most" — and asked for every chart, not only History. A surface still
     drawing its own SVG trace would be a surface he cannot touch. */
  for (const file of ["app/src/screens/history.js", "app/src/screens/assessment.js"]) {
    const src = fs.readFileSync(path.join(ROOT, file), "utf8");
    ok(/import \{ interactiveChart \} from "\.\.\/ui\/chart\.js";/.test(src), `${file} draws the ported chart`);
    ok(
      !/svg\("path", \{ class: "trace"/.test(src),
      `${file} no longer draws a trace of its own`
    );
  }

  /* `niceAxis` is the ported function and not a rewrite of it: the three
     comments naming the three defects it fixes came across with it. */
  ok(/8\.591999999999999/.test(CHART), "the floating-point-tail defect is documented where it is fixed");
  ok(/an all-zero trace element was drawing a -0\.10 gridline/.test(CHART), "and the negative-gridline one");
  ok(/displayed a reading of 9\.3 as\s+9\.5/.test(CHART), "and the snapped-value one");
  ok(/9276a2ca254e88d19e0f02dced42a1b896499780/.test(CHART), "and the V1 commit it came from is named");
});

s.test("CH-14", "a double-tap resets the zoom and does NOT open a reading", () => {
  /* The hint under every chart says "double-tap to reset". On a touch screen a
     double-tap also produces a `click`, and the tap surface reads a click on an
     already-selected point as "open this entry" — so the keeper following the
     app's own instruction got an entry sheet every time he reset the zoom.

     `attachGestures` reports the reset; the chart ignores the click that
     belongs to it. Driven through the real gesture code. */
  const on = {};
  const seen = [];
  let range = { start: 0.3, end: 0.6 };
  const el = {
    addEventListener: (k, f) => { on[k] = f; },
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ width: 320, left: 0, top: 0, height: 200 }),
  };
  attachGestures(el, {
    onChange: (r, meta) => { range = r; seen.push(meta || null); },
    getRange: () => range,
  });
  const fire = (k, e) => on[k]({ preventDefault() {}, stopPropagation() {}, ...e });

  /* Two taps inside V1's 300 ms window. */
  fire("touchstart", { touches: [{ clientX: 160, clientY: 100 }] });
  fire("touchend", { touches: [] });
  fire("touchstart", { touches: [{ clientX: 160, clientY: 100 }] });

  deepEq(range, { start: 0, end: 1 }, "the whole series is back");
  eq(seen[seen.length - 1] && seen[seen.length - 1].reset, true, "and the change says it was a reset");

  /* A single tap is not a reset, so an ordinary tap still reaches the caller
     as an ordinary change. */
  const second = [];
  let r2 = { start: 0.3, end: 0.6 };
  const el2 = {
    addEventListener: (k, f) => { on[k] = f; },
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ width: 320, left: 0, top: 0, height: 200 }),
  };
  attachGestures(el2, { onChange: (r, m) => { r2 = r; second.push(m || null); }, getRange: () => r2 });
  fire("touchstart", { touches: [{ clientX: 160, clientY: 100 }] });
  fire("touchmove", { touches: [{ clientX: 120, clientY: 100 }] });
  ok(second.length > 0, "a pan reports a change");
  ok(!second.some((m) => m && m.reset), "and none of them claims to be a reset");

  /* And the chart acts on it: the tap surface refuses the click that belongs to
     a reset, which is what stops the sheet opening. */
  ok(/if \(Date\.now\(\) - lastResetAt < 400\) return;/.test(CHART), "the reset's own click is ignored");
  ok(/if \(meta && meta\.reset\) lastResetAt = Date\.now\(\);/.test(CHART), "and it is the gesture that says so");
});

export default s;
