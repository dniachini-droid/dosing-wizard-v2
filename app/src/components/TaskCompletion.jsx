import { useEffect, useState } from 'react'
import { Check } from '../icons.jsx'
import { fmtFriendly } from '../lib/format.js'
import { useEscape } from '../lib/backup.jsx'
import { intervalLabel } from '../store/schedule.js'

/* --- Task completion ---
 *
 * Ticking off a chore used to move a row quietly. This marks it.
 *
 * WHAT THIS MOMENT NO LONGER SAYS, AND WHY
 *
 * V1 showed the run of past completions and the actual intervals between them
 * — "3 times now · you do this about every 6 days" — which the salvage
 * inventory called exemplary restraint: "it shows the fact and offers no
 * judgement."
 *
 * The brief for this port keeps the moment and removes that content: "The
 * streak content ... is liked but the engine does not produce it. Record it
 * for later; do not synthesise it in the interface." So the counting, the
 * average gap and the against-schedule comparison are gone rather than
 * reimplemented here, and the row of stars that displayed them went with them
 * — the brief rules out stars anyway.
 *
 * It is a real loss and it is recorded as one, with what would be needed to
 * restore it, in `docs/migration/PORT-OMISSIONS.md`.
 */
export function TaskDonePopup({ result, onClose }) {
  useEscape(onClose);
  const AUTO_SECONDS = 10;
  const [left, setLeft] = useState(AUTO_SECONDS);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!result || held) return;
    if (left <= 0) { onClose(); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [result, left, held]);

  if (!result) return null;
  const tone = "#0B7C86";

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
      style={{ background: "rgba(8,25,29,0.45)", zIndex: 70 }}>
      <div onClick={(e) => { e.stopPropagation(); setHeld(true); }}
        className="w-full max-w-xs rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>

        <div className="px-5 pt-6 pb-5 text-center" style={{ background: tone + "12" }}>
          {/* V1 used a green tick emoji. The brief rules them out; the icon
              set the rest of the app is drawn in does the same job. */}
          <div className="flex items-center justify-center" style={{ color: tone }}>
            <Check size={30} strokeWidth={3} />
          </div>
          <div className="text-[17px] font-black text-ink mt-3">{result.label}</div>
          <div className="text-[12px] font-bold text-ink2 mt-0.5">
            done {fmtFriendly(result.date)}
          </div>
        </div>

        <div className="px-5 py-4 text-center rc-stagger">
          <div className="text-[15px] font-black" style={{ color: tone, animationDelay: "260ms" }}>
            Logged
          </div>
          <p className="text-[13px] text-ink font-medium leading-relaxed mt-1"
            style={{ animationDelay: "380ms" }}>
            The next one is scheduled from today, not from when it was due.
          </p>

          {result.nextDue && (
            <div className="mt-3 pt-3 border-t border-app" style={{ animationDelay: "500ms" }}>
              <div className="text-[11px] font-bold text-ink2">Next due</div>
              <div className="text-[13px] font-black text-ink">
                {fmtFriendly(result.nextDue)}
                {result.intervalDays
                  ? <span className="text-ink2 font-bold"> · {intervalLabel(result.intervalDays)}</span>
                  : null}
              </div>
            </div>
          )}

          <button onClick={onClose}
            className="mt-4 w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white"
            style={{ background: tone, animationDelay: "620ms" }}>
            Done
          </button>
          <div className="mt-2" style={{ animationDelay: "740ms" }}>
            {held
              ? <span className="text-[10px] font-bold text-ink2">Staying open — tap Done when you're finished</span>
              : <span className="text-[10px] font-bold text-ink2">Closes in {left}s · tap to keep open</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
