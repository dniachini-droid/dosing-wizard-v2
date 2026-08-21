import React, { useEffect, useState } from 'react'
import { Btn } from './DoseExpectation.jsx'
import { AlertTriangle, RotateCcw, Trash2 } from '../icons.jsx'
import { notify } from '../lib/storage.js'

/* --- Error boundary ---
 *
 * A crash in one tab used to render nothing at all: a blank page with no clue
 * what happened, and no way to reach the rest of the app. This catches it,
 * names it, and leaves the navigation working so the other tabs are still
 * usable while the fault is fixed.
 */
export class TabErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) {
    /* Moving to another tab should clear a previous tab's failure. */
    if (prev.tabKey !== this.props.tabKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    const e = this.state.error;
    return (
      <Card className="p-4 mb-6" style={{ borderColor: "#C4285B55" }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} color="#C4285B" />
          <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "#C4285B" }}>
            This tab hit an error
          </span>
        </div>
        <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
          Something in this screen failed to display. Your data is untouched — the other tabs still
          work, and nothing has been lost.
        </p>
        <div className="rounded-lg p-2.5 mb-3" style={{ background: "#F7FAFA" }}>
          <p className="text-[11px] font-mono text-ink2 leading-relaxed break-words">
            {String(e && e.message ? e.message : e)}
          </p>
        </div>
        <Btn variant="ghost" className="w-full" onClick={() => this.setState({ error: null })}>
          <span className="flex items-center justify-center gap-1.5"><RotateCcw size={13} /> Try again</span>
        </Btn>
      </Card>
    );
  }
}

export function Card({ children, className = "", style }) {
  return <div style={style} className={`bg-white border border-app rounded-2xl shadow-[0_1px_2px_rgba(15,40,45,0.04)] ${className}`}>{children}</div>;
}

/* Deleting a reading or an ICP panel was a single tap on a 13px icon with no
   confirmation and no undo. Two taps, with the second clearly labelled, costs
   almost nothing and prevents losing data to a mis-tap. */
export function DeleteButton({ onDelete, label = "Delete", size = 15, confirmMessage = "Entry removed" }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);

  if (armed) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation(); setArmed(false);
          onDelete();
          /* The row vanishes on delete, so without this there is no sign it
             worked rather than silently failing. */
          notify(confirmMessage);
        }}
        className="shrink-0 px-2.5 py-2 -my-1 rounded-lg text-[11px] font-extrabold"
        style={{ background: "#C4285B", color: "#fff" }}>
        {label}?
      </button>
    );
  }
  return (
    <button
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); setArmed(true); }}
      className="shrink-0 p-2 -m-1 rounded-lg text-ink2 hover:text-rose-700 active:bg-app">
      <Trash2 size={size} />
    </button>
  );
}

/* V1's `AlkAssessmentBlock` stood here — 264 lines of it, and it is deleted
   rather than ported.

   It imported `SAFE_DAILY_RISE` from V1's safe-rate module and `alkStamp` from
   V1's alkalinity dosing engine, and it rendered a dose figure, a staged step,
   a rate rail and a retest date from them. Every one of those is chemistry
   computed inside a presentation component, which is the single-source
   violation canon `X-INV-004` forbids by name and which the salvage inventory
   lists under "surfaces that compute chemistry — rebuild, do not port".

   Its replacement is not a rewrite of it. The Dosing tab renders what V2's
   engine returned — the reason codes, the evidence, the arithmetic, what was
   capped and why — through `app/src/present/`, and computes none of it. */
