/* ============================================================================
   THE MOMENTS — PORTED MOTION
   ----------------------------------------------------------------------------
   The rest of this mockup set is static HTML with no script. These three
   moments are the exception, and deliberately so: their value IS the tuning,
   and a still frame cannot carry it.

   Nothing here is reimplemented from a description. The geometry and the
   progress loop are transcribed from the V1 repository
   (`dniachini-droid/tank-wizard`) at commit
   `9276a2ca254e88d19e0f02dced42a1b896499780`:

     - `readingGeometry`  <- src/components/ReadingContext.jsx:26
     - the progress loop  <- src/components/ReadingConfirmation.jsx:482-508
     - the star run       <- src/components/TaskCompletion.jsx:32-41
     - the dose phases    <- src/components/DoseExpectation.jsx:24-28
     - the ICP count-in   <- src/components/IcpConfirmation.jsx:49-71

   React state and V1's chemistry imports are gone; the arithmetic and the
   ordering are not. Every duration, delay, easing exponent and geometric
   constant is READ FROM tokens.css at run time, so the owner retunes a moment
   by editing one number in that file and nothing here.

   There is no chemistry in this file. It draws a line through points it is
   given and moves a dot along it.
   ========================================================================= */

(function () {
  "use strict";

  var css = getComputedStyle(document.documentElement);

  /* Tokens. A number token is read bare; a duration token carries its unit. */
  function n(name) { return parseFloat(css.getPropertyValue(name)); }
  function ms(name) {
    var v = css.getPropertyValue(name).trim();
    var f = parseFloat(v);
    return v.slice(-2) === "ms" ? f : f * 1000;
  }

  var reduced = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================================
     GEOMETRY — ReadingContext.jsx:26 `readingGeometry`, transcribed.
     --------------------------------------------------------------------------
     Pure geometry. The salvage inventory records this component as having no
     chemistry in it, which is why the motion is portable as-is.
     ====================================================================== */

  function readingGeometry(def, rows, W, H, PAD) {
    var vals = rows.map(function (r) { return r.value; });
    var lo = Math.min.apply(null, vals.concat([def.min]));
    var hi = Math.max.apply(null, vals.concat([def.max]));
    var span = (hi - lo) || 1;
    var pad = span * n("--ma-band-pad");
    var yMin = lo - pad, yMax = hi + pad;

    /* Room on the left for axis labels. Without them the line has shape but no
       scale, and you cannot tell a 0.2 dKH move from a 2 dKH one. */
    var AXIS = n("--ma-axis");
    var x = function (i) { return AXIS + (i / (rows.length - 1)) * (W - AXIS - PAD); };
    var y = function (v) { return H - PAD - ((v - yMin) / (yMax - yMin)) * (H - PAD * 2); };
    var pts = rows.map(function (r, i) { return [x(i), y(r.value)]; });

    /* Cumulative arc length, so the drawn line can be cut at exactly the point
       the dot has reached rather than at a proportional guess. */
    var seg = [], cum = [0];
    for (var i = 1; i < pts.length; i++) {
      var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(d); cum.push(cum[i - 1] + d);
    }
    var total = cum[cum.length - 1] || 1;

    /* Position at progress p, interpolated between readings — so between an
       8.9 and a 9.1 the counter runs through the values between rather than
       jumping. */
    var at = function (p) {
      var t = Math.max(0, Math.min(1, p)) * (rows.length - 1);
      var i = Math.min(rows.length - 2, Math.floor(t));
      var f = rows.length > 1 ? t - i : 0;
      return {
        value: rows[i].value + (rows[i + 1].value - rows[i].value) * f,
        px: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f,
        py: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f,
        drawn: cum[i] + seg[i] * f,
        index: i, frac: f
      };
    };

    var d = pts.map(function (p, i) {
      return (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1);
    }).join(" ");

    /* Axis labels: the band edges plus the highest and lowest readings actually
       plotted, so a peak on the line can be read off the left rather than
       guessed at. Anything closer than the gap token to a label already chosen
       is dropped, since two overlapping numbers are worse than one. */
    var gap = n("--ma-tick-gap");
    var dataMax = Math.max.apply(null, vals), dataMin = Math.min.apply(null, vals);
    var candidates = [dataMax, def.max, def.min, dataMin]
      .filter(function (v, i, a) { return a.indexOf(v) === i; })
      .sort(function (a, b) { return b - a; });
    var ticks = [];
    candidates.forEach(function (val) {
      var clear = ticks.every(function (t) { return Math.abs(y(t) - y(val)) > gap; });
      if (clear) ticks.push(val);
    });

    return { pts: pts, total: total, at: at, d: d, y: y, yMin: yMin, yMax: yMax,
             AXIS: AXIS, ticks: ticks,
             bandTop: y(def.max), bandBottom: y(def.min), W: W, H: H };
  }

  var SVGNS = "http://www.w3.org/2000/svg";
  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    return e;
  }
  function fmt(def, v) { return v.toFixed(def.decimals); }

  /* ==========================================================================
     MOMENT A — THE READING ARRIVES ON ITS OWN HISTORY
     ====================================================================== */

  function readingArrival(host) {
    var mount = host.querySelector(".rc-host") || host;
    mount.textContent = "";          /* replayable: nothing from a previous run survives */
    var def = JSON.parse(host.getAttribute("data-def"));
    var rows = JSON.parse(host.getAttribute("data-rows"));
    var counter = document.getElementById(host.getAttribute("data-counter"));
    var valueBox = counter ? counter.closest(".mval") : null;

    if (valueBox) valueBox.classList.remove("landed");
    var W = n("--ma-w"), H = n("--ma-h"), PAD = n("--ma-pad");
    var geo = readingGeometry(def, rows, W, H, PAD);

    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, class: "rc-chart",
                          "aria-hidden": "true" });
    svg.style.height = H + "px";

    var uid = host.getAttribute("data-uid") || "m";
    var defs = el("defs");

    var glow = el("filter", { id: "glow-" + uid, x: "-60%", y: "-60%", width: "220%", height: "220%" });
    glow.appendChild(el("feGaussianBlur", { stdDeviation: n("--ma-glow-blur"), result: "b" }));
    var merge = el("feMerge");
    merge.appendChild(el("feMergeNode", { in: "b" }));
    merge.appendChild(el("feMergeNode", { in: "b" }));
    glow.appendChild(merge);
    defs.appendChild(glow);

    var headBlur = el("filter", { id: "head-" + uid, x: "-300%", y: "-300%", width: "700%", height: "700%" });
    headBlur.appendChild(el("feGaussianBlur", { stdDeviation: n("--ma-head-blur") }));
    defs.appendChild(headBlur);

    var tone = css.getPropertyValue("--" + def.tone).trim();

    var grad = el("linearGradient", { id: "area-" + uid, x1: "0", y1: "0", x2: "0", y2: "1" });
    grad.appendChild(el("stop", { offset: "0%", "stop-color": tone, "stop-opacity": n("--ma-area-alpha") }));
    grad.appendChild(el("stop", { offset: "100%", "stop-color": tone, "stop-opacity": "0" }));
    defs.appendChild(grad);

    /* The fill is revealed by a rectangle that tracks the head, so it can never
       run ahead of the line above it. */
    var clip = el("clipPath", { id: "clip-" + uid });
    var clipRect = el("rect", { x: 0, y: 0, width: 0, height: H });
    clip.appendChild(clipRect);
    defs.appendChild(clip);
    svg.appendChild(defs);

    /* Scale: band edges, plus the peak and trough of what is plotted. Band
       lines are drawn more strongly, since those are the thresholds. */
    geo.ticks.forEach(function (val) {
      var isBand = val === def.max || val === def.min;
      var g = el("g", { class: "rc-band" });
      g.appendChild(el("line", {
        x1: geo.AXIS - 4, x2: W, y1: geo.y(val), y2: geo.y(val),
        stroke: isBand ? tone : css.getPropertyValue("--faint").trim(),
        "stroke-opacity": isBand ? 0.32 : 0.22,
        "stroke-width": 1,
        "stroke-dasharray": isBand ? "3 3" : "2 4"
      }));
      var t = el("text", { x: geo.AXIS - 7, y: geo.y(val) + 3.6, "text-anchor": "end", class: "axis" });
      t.textContent = fmt(def, val);
      g.appendChild(t);
      svg.appendChild(g);
    });

    /* Area beneath the line, filling in behind the head. */
    var area = el("path", {
      d: geo.d + " L" + geo.pts[geo.pts.length - 1][0] + "," + H + " L" + geo.pts[0][0] + "," + H + " Z",
      fill: "url(#area-" + uid + ")",
      "clip-path": "url(#clip-" + uid + ")"
    });
    svg.appendChild(area);

    /* The target band. It pulses once, quietly, if the reading lands inside. */
    var last = rows[rows.length - 1].value;
    var inBand = last >= def.min && last <= def.max;
    var band = el("rect", {
      x: geo.AXIS,
      y: Math.min(geo.bandTop, geo.bandBottom),
      width: W - geo.AXIS,
      height: Math.max(2, Math.abs(geo.bandBottom - geo.bandTop)),
      fill: tone,
      class: "rc-band"
    });
    svg.appendChild(band);

    /* Both strokes are cut at the dot's exact position along the path. */
    var glowLine = el("path", {
      d: geo.d, fill: "none", stroke: tone,
      "stroke-width": css.getPropertyValue("--ma-glow-w").trim(),
      "stroke-linecap": "round", "stroke-linejoin": "round",
      opacity: n("--ma-glow-alpha"), filter: "url(#glow-" + uid + ")",
      "stroke-dasharray": geo.total, "stroke-dashoffset": geo.total
    });
    var line = el("path", {
      d: geo.d, fill: "none", stroke: tone,
      "stroke-width": css.getPropertyValue("--ma-line-w").trim(),
      "stroke-linecap": "round", "stroke-linejoin": "round",
      "stroke-dasharray": geo.total, "stroke-dashoffset": geo.total
    });
    svg.appendChild(glowLine);
    svg.appendChild(line);

    /* A reading's dot lights up as the head passes it. Nothing is drawn before
       the travel starts: the first dot otherwise appeared with the empty chart
       and the falling head then landed on top of it, which drew the eye to the
       wrong thing. */
    var dots = geo.pts.slice(0, -1).map(function (p) {
      var c = el("circle", { cx: p[0], cy: p[1], r: n("--ma-point-r"), fill: tone, opacity: 0 });
      c.style.transition = "opacity " + ms("--ma-point-fade") + "ms "
        + css.getPropertyValue("--ma-point-ease").trim();
      svg.appendChild(c);
      return c;
    });

    /* The head itself — the same coordinates the counter is reading from.
       Before the travel begins it drops onto the first point. */
    var headG = el("g", { class: "rc-drop" });
    var halo = el("circle", { r: n("--ma-head-r"), fill: tone,
                              opacity: n("--ma-head-alpha"), filter: "url(#head-" + uid + ")" });
    var core = el("circle", { r: n("--ma-head-core-r"), fill: css.getPropertyValue("--card-top").trim(), opacity: 0.95 });
    headG.appendChild(halo); headG.appendChild(core);
    svg.appendChild(headG);

    mount.appendChild(svg);

    var lastPt = geo.pts[geo.pts.length - 1];

    function placeHead(p) {
      halo.setAttribute("cx", p.px); halo.setAttribute("cy", p.py);
      core.setAttribute("cx", p.px); core.setAttribute("cy", p.py);
    }

    function land() {
      headG.remove();
      var mk = function (attrs, cls) {
        var c = el("circle", attrs); c.setAttribute("class", cls); svg.appendChild(c); return c;
      };
      mk({ cx: lastPt[0], cy: lastPt[1], r: n("--ma-ring-r"), fill: "none", stroke: tone,
           "stroke-width": css.getPropertyValue("--ma-ring-w").trim() }, "rc-ring");
      mk({ cx: lastPt[0], cy: lastPt[1], r: n("--ma-ring-r"), fill: "none", stroke: tone,
           "stroke-width": css.getPropertyValue("--ma-ring2-w").trim() }, "rc-ring rc-ring2");
      mk({ cx: lastPt[0], cy: lastPt[1], r: n("--ma-new-halo-r"), fill: tone,
           opacity: n("--ma-new-halo-a") }, "rc-new");
      mk({ cx: lastPt[0], cy: lastPt[1], r: n("--ma-new-r"), fill: tone }, "rc-new");
      mk({ cx: lastPt[0], cy: lastPt[1], r: n("--ma-new-core-r"),
           fill: css.getPropertyValue("--card-top").trim() }, "rc-new");

      /* A single acknowledging pulse of the band when a reading lands inside
         it. Once, quietly — confirmation, not celebration. */
      if (inBand) band.setAttribute("class", "rc-band-hit");

      /* The sweep leaves the gradient clipped to the text, so the number keeps
         a faint sheen forever unless the class is removed once it has
         finished. */
      if (valueBox) {
        valueBox.classList.add("landed");
        setTimeout(function () { valueBox.classList.remove("landed"); }, ms("--ma-sheen-clear"));
      }
    }

    /* One clock for everything. The dot's position, the length of drawn line
       and the number on screen are all read from this single progress value,
       so they move as one rather than as three animations that happen to start
       together. */
    function apply(progress) {
      var head = geo.at(progress);
      placeHead(head);
      clipRect.setAttribute("width", head.px);
      glowLine.setAttribute("stroke-dashoffset", geo.total - head.drawn);
      line.setAttribute("stroke-dashoffset", geo.total - head.drawn);
      if (counter) counter.textContent = fmt(def, head.value);
      if (progress > 0) {
        dots.forEach(function (c, i) {
          c.setAttribute("opacity", progress * (rows.length - 1) >= i ? n("--ma-point-alpha") : 0);
        });
      }
    }

    if (reduced) { apply(1); land(); return; }

    apply(0);

    /* The chart bounces in, then the dot falls onto the first point, and only
       then does the travel begin — so nothing moves along the line until there
       is a line to move along. */
    var DURATION = ms("--ma-travel-dur"), DELAY = ms("--ma-travel-delay");
    var EXP = n("--ma-travel-exp");
    var start = 0;
    function step(ts) {
      if (!start) start = ts;
      var elapsed = ts - start - DELAY;
      if (elapsed < 0) { requestAnimationFrame(step); return; }
      /* Eased so it sets off briskly and settles onto the final reading. */
      var t = Math.min(1, elapsed / DURATION);
      apply(1 - Math.pow(1 - t, EXP));
      if (t < 1) requestAnimationFrame(step); else land();
    }
    requestAnimationFrame(step);
  }

  /* ==========================================================================
     MOMENT B — THE DOSE EXPECTATION
     --------------------------------------------------------------------------
     Two phases: the new figure lands, then the expectation unfolds beneath it.
     DoseExpectation.jsx:24-28.
     ====================================================================== */

  function doseExpectation(host) {
    var figure = host.querySelector(".mval");
    var body = host.querySelector(".mbody");
    if (reduced) { if (body) body.hidden = false; return; }
    if (body) body.hidden = true;
    setTimeout(function () { if (figure) figure.classList.add("landed"); }, ms("--mb-phase-1"));
    setTimeout(function () { if (body) body.hidden = false; }, ms("--mb-phase-2"));
  }

  /* ==========================================================================
     MOMENT C — TASK COMPLETION
     --------------------------------------------------------------------------
     Stars light one at a time, most recent last, so the run reads left to
     right. TaskCompletion.jsx:32-41.
     ====================================================================== */

  function taskCompletion(host) {
    var stars = Array.prototype.slice.call(host.querySelectorAll(".starrun .st"));
    stars.forEach(function (s) { s.style.animation = "none"; void s.offsetWidth; s.style.animation = ""; });
    var max = n("--mc-star-max");
    var shown = stars.slice(0, max);
    if (reduced) { shown.forEach(function (s) { s.style.opacity = 1; s.style.animation = "none"; }); return; }
    shown.forEach(function (s) { s.style.visibility = "hidden"; });
    var base = ms("--mc-star-base"), stepMs = ms("--mc-star-step");
    shown.forEach(function (s, i) {
      setTimeout(function () { s.style.visibility = "visible"; }, base + (i + 1) * stepMs);
    });
  }

  /* ==========================================================================
     THE ICP ARRIVAL — the element count ticks up rather than appearing, so the
     size of the panel registers before the detail does.
     IcpConfirmation.jsx:49-71.
     ====================================================================== */

  function icpArrival(host) {
    var counter = host.querySelector("[data-icp-count]");
    var detail = host.querySelector("[data-icp-detail]");
    var total = parseInt(counter.getAttribute("data-icp-count"), 10);
    if (reduced) { counter.textContent = total; if (detail) detail.hidden = false; return; }
    if (detail) detail.hidden = true;
    var DUR = ms("--md-count-dur"), DELAY = ms("--md-count-delay"), EXP = n("--md-count-exp");
    var start = 0;
    function step(ts) {
      if (!start) start = ts;
      var e = ts - start - DELAY;
      if (e < 0) { requestAnimationFrame(step); return; }
      var t = Math.min(1, e / DUR);
      counter.textContent = Math.round((1 - Math.pow(1 - t, EXP)) * total);
      if (t < 1) requestAnimationFrame(step);
      else setTimeout(function () { if (detail) detail.hidden = false; }, ms("--md-detail-delay"));
    }
    requestAnimationFrame(step);
  }

  /* ==========================================================================
     A card that vanishes without warning feels like a glitch, and one that
     vanishes while you are still reading is worse. The countdown says what will
     happen, and touching the card stops it. Here it only counts — a mockup has
     nowhere to close to.
     ====================================================================== */

  function countdown(host) {
    var out = host.querySelector("[data-countdown]");
    if (!out) return;
    if (host.__ticker) { clearInterval(host.__ticker); host.__ticker = 0; }
    var left = Math.round(ms(out.getAttribute("data-countdown")) / 1000);
    var held = false;
    var card = host.querySelector(".mcard") || host;
    function draw() {
      out.textContent = held
        ? "Staying open — tap Done when you're finished"
        : "Closes in " + left + "s · tap to keep open";
    }
    if (!card.__holdBound) {
      card.__holdBound = true;
      card.addEventListener("click", function () { held = true; draw(); });
    }
    draw();
    host.__ticker = setInterval(function () {
      if (held) return;
      left -= 1;
      if (left <= 0) { clearInterval(host.__ticker); host.__ticker = 0; left = 0; }
      draw();
    }, 1000);
  }

  function play(root) {
    (root || document).querySelectorAll("[data-moment]").forEach(function (host) {
      var kind = host.getAttribute("data-moment");
      if (kind === "reading") readingArrival(host);
      if (kind === "dose") doseExpectation(host);
      if (kind === "task") taskCompletion(host);
      if (kind === "icp") icpArrival(host);
      countdown(host);
    });
  }

  window.playMoments = play;
  play(document);
})();
