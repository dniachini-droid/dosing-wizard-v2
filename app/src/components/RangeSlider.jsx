import { useMemo } from 'react'
import { gradeWidth } from '../present/range-grade.js'
import { fmtQty } from '../lib/format.js'
import { t } from '../strings.js'

/* ============================================================================
   THE TARGET RANGE, AS A BAR WITH TWO HANDLES — OWNER FINDING 18
   ----------------------------------------------------------------------------
   Two number boxes do not scale: every parameter eventually needs a range, and
   eight pairs of boxes is a form nobody fills in. One bar, two handles.

   THE WIDTH OF THE RANGE IS ITSELF THE THING BEING JUDGED, and the bar says so
   as it moves. A keeper who sets 7.0–11.0 has not set a target, he has set a
   band nothing will ever fall outside; the app takes his word for it either
   way, and tells him what he has done.

   WHOSE NUMBERS THESE ARE. The three widths below are the OWNER'S, stated by
   him for ALKALINITY, in dKH:

       under 0.5 dKH   green   tight control
       0.5 to 1.0      amber   acceptable control
       over 1.0        red     loose — a tighter range is worth considering

   They are not canon figures. They do not transfer to calcium or magnesium and
   this component must never be handed a parameter they have not been stated
   for: `graded` is false unless the caller says otherwise, and the bar then
   drags without grading itself. Generalising them is an owner decision and has
   not been taken.

   THE EXTENT OF THE BAR IS NOT A LIMIT ON THE TANK. It is how far the handles
   travel, and it is wide enough to contain any alkalinity range a reef keeper
   would set. It states no threshold, nothing reads it back, and no engine sees
   it.
   ========================================================================= */

export function RangeSlider({
  min, max, onChange, floor = 5, ceiling = 15, step = 0.1,
  unit = "dKH", graded = false, disabled = false,
}) {
  const span = ceiling - floor;
  const lo = Number.isFinite(min) ? min : floor + span * 0.3;
  const hi = Number.isFinite(max) ? max : floor + span * 0.5;
  const pct = (v) => ((v - floor) / span) * 100;
  const width = hi - lo;
  const grade = useMemo(() => gradeWidth(width, graded), [width, graded]);

  /* The handles cannot cross. Nudged by one step rather than swapped, because a
     handle that jumps past the one it met is a handle the thumb has lost. */
  const setLo = (v) => onChange(Math.min(v, hi - step), hi);
  const setHi = (v) => onChange(lo, Math.max(v, lo + step));

  /* WHICH HANDLE IS ON TOP WHERE THEY MEET — REEFKEEPER FINDING 12.

     Two inputs stacked on one another, and one step apart the two 26px thumbs
     overlap almost exactly. The one later in the document wins the touch, and
     that is the HIGH handle. Drag them both up against the ceiling and the high
     handle can go no further right, is blocked from going left by the low one,
     and the low one is underneath it: the bar is stuck and the only way out is
     to leave the screen and come back.

     So the handle with room to move is the one on top. Past the middle of the
     travel that is the LOW handle — it has the whole left of the bar — and
     below the middle it is the high handle. Reachability, not decoration: at
     either end of the bar exactly one of them can still move, and that is the
     one the thumb lands on. */
  const loOnTop = lo > floor + span / 2;

  return (
    <div className={disabled ? "opacity-60" : undefined}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-[15px] font-black text-ink tabular-nums">
          {fmtQty(lo, "dkh")} – {fmtQty(hi, "dkh")}
          <span className="text-[11px] font-bold text-ink2 ml-1">{unit}</span>
        </span>
        <span className="text-[11px] font-extrabold tabular-nums"
          style={{ color: grade ? grade.tone : "#45605F" }}>
          {t("range.width", { width: fmtQty(width, "dkh"), unit })}
        </span>
      </div>

      <div className="relative h-8 select-none">
        <div className="absolute inset-x-0 top-3.5 h-1.5 rounded-full bg-app" />
        <div className="absolute top-3.5 h-1.5 rounded-full"
          style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%`,
                   background: grade ? grade.tone : "#0B7C86" }} />
        <input type="range" className="tw-range" aria-label={t("range.lowAria")}
          style={{ zIndex: loOnTop ? 3 : 2 }}
          min={floor} max={ceiling} step={step} value={lo} disabled={disabled}
          onChange={(e) => setLo(parseFloat(e.target.value))} />
        <input type="range" className="tw-range" aria-label={t("range.highAria")}
          style={{ zIndex: loOnTop ? 2 : 3 }}
          min={floor} max={ceiling} step={step} value={hi} disabled={disabled}
          onChange={(e) => setHi(parseFloat(e.target.value))} />
      </div>

      {/* The line that changes as the handles move. Absent, rather than
          neutral, where the thresholds have not been stated for this
          parameter — a grade nobody decided is worse than no grade. */}
      {grade && (
        <p className="text-[12px] font-bold leading-relaxed mt-1" style={{ color: grade.tone }}>
          {t(`range.grade.${grade.key}`)}
        </p>
      )}
    </div>
  );
}
