import { useEffect, useMemo, useState } from 'react'
import { Btn } from './DoseExpectation.jsx'
import { ReadingSparkline, buildReadingSeries, readingGeometry } from './ReadingContext.jsx'
import { Check } from '../icons.jsx'
import { fmtVal, fmtFriendly, fmtWithUnit } from '../lib/format.js'
import { useEscape } from '../lib/backup.jsx'
import { intervalLabel } from '../store/schedule.js'

/* --- Reading confirmation ---
 *
 * Logging a test is the thing you do most often, so it's worth making it feel
 * like something happened. The tone stays honest: a reading outside its band
 * gets a calm, useful line rather than an alarm, and one inside gets
 * acknowledgement rather than confetti.
 */

/* V1's `readingVerdict` stood here — 390 lines of it, and it is the single
   clearest example of what this port exists to stop.

   It was a chemistry classifier living inside a UI component. Given a reading
   it decided whether the tank was fine, drifting, out of band, mid-correction
   or in trouble; it imported `SAFE_BOUNDS`, `STABILITY_RULES` and
   `isCorrectionState`; it carried V1's only ammonia branch, written before
   V1's own ammonia canon existed and never reconciled with it. The salvage
   inventory names it as "the exact single-source violation `X-INV-004`
   forbids", and its instruction is "Keep the moment; rebuild the reasoning."

   That is what has happened. The moment is here in full — the timing, the
   easing, the one progress value driving the chart and the dot, the closing
   countdown with its shrinking bar, the tap-to-keep-open. Every word it says
   arrives as a prop, from `app/src/present/`, out of what V2's engine
   returned. This file no longer contains a single sentence about what a
   reading means. */

/* V1's `SplashBurst` stood here too: eighteen animated water drops for a
   correction arriving. The brief for this port: "No emojis. No green tick, no
   confetti, no stars. Keep it professional." The burst is confetti with a
   reef theme, and the salvage inventory had already put it under
   `LEAVE_BEHIND` — "decoration without function. The arrival moment above is
   the part worth keeping; the confetti is not." */

/* `verdict` is what the moment SAYS, and it arrives already worded. The shell
   builds it from the engine result that follows the reading, through
   `app/src/present/`; until that result exists it is the plain acknowledgement
   below, which is true and says nothing it cannot support. */
export function LogResultPopup({ result, onClose, readings = [], onOpenDosing, verdict = null }) {
  useEscape(onClose);
  /* The full sequence runs to about 6.8 seconds; the countdown leaves roughly
     eight more to actually look at the result. */
  const AUTO_SECONDS = 15;
  const [left, setLeft] = useState(AUTO_SECONDS);
  const [held, setHeld] = useState(false);

  /* A card that vanishes without warning feels like a glitch, and one that
     vanishes while you're still reading is worse. The countdown says what will
     happen, and touching the card stops it — so it only closes itself when
     you've clearly moved on. */
  useEffect(() => {
    if (!result) return;
    setLeft(AUTO_SECONDS); setHeld(false);
  }, [result]);

  useEffect(() => {
    if (!result || held) return;
    if (left <= 0) { onClose(); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [result, left, held]);

  const series = useMemo(
    () => (result && result.def ? buildReadingSeries(result.def, readings, result) : []),
    [result, readings]);

  const geo = useMemo(
    () => (result && result.def && series.length >= 2
      ? readingGeometry(result.def, series, 260, 108, 12) : null),
    [result, series]);

  /* One clock for the DRAWING. The dot's position and the length of drawn line
     are read from this single progress value, so they move as one rather than
     as two animations that happen to start together.

     The figure on screen is deliberately not on this clock — see finding 11
     below. V1 counted it up along the line and it was one of the things this
     rebuild was told to keep; it turned out to be one of the things worth
     losing. */
  const [progress, setProgress] = useState(0);
  const [sheenDone, setSheenDone] = useState(false);
  const landed = progress >= 1;

  /* The sweep leaves the gradient clipped to the text, so the number keeps a
     faint sheen forever unless the class is removed once it has finished. */
  useEffect(() => {
    if (!landed) { setSheenDone(false); return; }
    const t = setTimeout(() => setSheenDone(true), 1250);
    return () => clearTimeout(t);
  }, [landed]);

  useEffect(() => {
    if (!result || !geo) { setProgress(1); return; }
    const reduced = typeof window !== "undefined" && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setProgress(1); return; }

    /* The chart bounces in, then the dot falls onto the first point, and only
       then does the travel begin — so nothing moves along the line until there
       is a line to move along. */
    /* Chart lands by 460ms and the scale by 640ms; a beat of stillness, then
       the dot falls from 900ms to 1340ms. The travel starts as it settles. */
    const DURATION = 4600, DELAY = 1340;
    let raf = 0, start = 0, cancelled = false;
    setProgress(0);
    const step = (ts) => {
      if (cancelled) return;
      if (!start) start = ts;
      const elapsed = ts - start - DELAY;
      if (elapsed < 0) { raf = requestAnimationFrame(step); return; }
      /* Eased so it sets off briskly and settles onto the final reading. */
      const t = Math.min(1, elapsed / DURATION);
      const eased = 1 - Math.pow(1 - t, 2.4);
      setProgress(eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [result, geo]);

  if (!result || !result.def) return null;

  const { def, value, prev, nextDue, interval } = result;
  /* No headline is ever composed here. Where the engine has not answered yet —
     it runs in a worker and takes a moment — the moment acknowledges the save
     and claims nothing about the tank. */
  const v = verdict || { tone: def.color, headline: "Reading saved", line: null, goto: null };
  /* V1 drew an arrow when the change from the previous reading cleared
     `def.step`. That step was a noise floor and a noise floor is chemistry, so
     the comparison is gone: the previous reading is stated as a fact and the
     difference is left to the eye and to the chart above it. */
  const showPrev = prev != null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
      style={{ background: "rgba(8,25,29,0.45)", zIndex: 70 }}>
      <div onClick={(e) => { e.stopPropagation(); setHeld(true); }}
        className="w-full max-w-xs rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>

        {/* A tinted cap so the result reads before any words do. */}
        <div className="px-5 pt-6 pb-5 text-center relative" style={{ background: v.tone + "12" }}>
          <div className="flex items-baseline justify-center gap-1">
            <span className={`rc-value text-[34px] font-black leading-none tabular-nums${landed && !sheenDone ? " landed" : ""}`}
              style={{ color: v.tone }}>
              {/* REEFKEEPER FINDING 11. This number used to travel along the
                  sparkline with the dot, so for four and a half seconds the
                  headline figure on a confirmation popup counted through
                  readings from weeks ago — in the tank's colour, at 34px, under
                  the words "Reading saved". He watched it settle and could not
                  say what it had settled on.

                  A LINE MOVING IS A DRAWING. A NUMBER MOVING IS A CLAIM. The
                  dot still travels; the figure is the reading he just typed and
                  it does not move, because that is the one thing this moment
                  exists to confirm. */}
              <span className="rc-sheen">
                {fmtVal(def, value)}
              </span>
            </span>
            <span className="text-[14px] font-bold text-ink2">{def.unit}</span>
          </div>
          <div className="text-[13px] font-black text-ink mt-1">{def.label}</div>
          {showPrev && (
            <div className="text-[11px] font-bold text-ink2 mt-1">
              previous {fmtWithUnit(def, prev)}
            </div>
          )}

          {geo && (
            <div className="mt-2 -mx-1">
              <ReadingSparkline def={def} rows={series} result={result}
                progress={progress} geo={geo} />
            </div>
          )}
        </div>

        <div className="px-5 py-4 text-center rc-stagger">
          <div className="text-[15px] font-black" style={{ color: v.tone, animationDelay: "260ms" }}>
            {v.headline}
          </div>
          {v.line && (
            <p className="text-[13px] text-ink font-medium leading-relaxed mt-1"
              style={{ animationDelay: "380ms" }}>{v.line}</p>
          )}

          {/* Any actionable outcome hands off to the Dosing Wizard rather than
              being acted on here. One place changes doses, so this window can
              never drift out of step with it. */}
          {v.goto === "dosing" && onOpenDosing && (
            <div className="mt-3">
              <Btn variant="ghost" onClick={() => { onClose(); onOpenDosing(def.key); }}>
                Open Dosing
              </Btn>
            </div>
          )}

          {nextDue && (
            <div className="mt-3 pt-3 border-t border-app" style={{ animationDelay: "500ms" }}>
              <div className="text-[11px] font-bold text-ink2">
                Next {def.labelMid || def.label.toLowerCase()} test
              </div>
              <div className="text-[13px] font-black text-ink">
                {fmtFriendly(nextDue)}
                {interval ? <span className="text-ink2 font-bold"> · {intervalLabel(interval)}</span> : null}
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="mt-4 w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white"
            style={{ background: v.tone, animationDelay: "620ms" }}>
            Done
          </button>

          {held ? (
            <div className="mt-2 text-[10px] font-bold text-ink2" style={{ animationDelay: "740ms" }}>
              Staying open — tap Done when you're finished
            </div>
          ) : (
            <div className="mt-2" style={{ animationDelay: "740ms" }}>
              <div className="text-[10px] font-bold text-ink2">Closes in {left}s · tap to keep open</div>
              {/* A bar as well as a number, so the time left is legible at a glance. */}
              <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: v.tone + "1F" }}>
                <div className="h-full rounded-full"
                  style={{ width: `${(left / AUTO_SECONDS) * 100}%`, background: v.tone,
                           transition: "width 1s linear" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* A brief, unobtrusive confirmation. Sits above the nav bar and clears itself. */
export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <div className="fixed left-0 right-0 px-4 pointer-events-none flex justify-center"
      style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))", zIndex: 80 }}>
      <div className="pointer-events-auto rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2"
        style={{ background: "#08191D" }}>
        <Check size={14} color="#7FE3D4" strokeWidth={3} />
        <span className="text-[12px] font-bold text-white">{message}</span>
      </div>
    </div>
  );
}
