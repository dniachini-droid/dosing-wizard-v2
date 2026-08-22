import { useEffect, useState } from 'react'
import { Card } from './ErrorBoundary.jsx'
import { Activity, AlertTriangle, ArrowDown, ArrowUp, Beaker, Droplets, FlaskConical, Gauge, Plus, Scale, Target, Waves } from '../icons.jsx'
import { fmtQty, fmtVal, fmtTime, fmtFriendly } from '../lib/format.js'
import { ParamGauge, useEscape } from '../lib/backup.jsx'
import { fmtShort } from '../lib/dates.js'
import { positionTone } from '../present/position.js'
import { t } from '../strings.js'

/* --- The dose-change moment ---
 *
 * V1's words, and they are still the reason it exists: "A dose change is a
 * prediction as much as an action: it says the tank should move a certain way
 * over a certain time. Stating that up front means the next test either
 * confirms it or doesn't, rather than being read from scratch."
 *
 * The component is V1's — the timing, the easing, the two-phase reveal, the
 * closing countdown with its shrinking bar, the tap-to-keep-open. What it SAYS
 * is not.
 *
 * V1 computed its own prediction: an expected value, a per-day movement and a
 * retest date, worked out in the component from V1's alkalinity engine. In V2
 * the prediction is an immutable engine artefact — the intervention prediction
 * snapshot, canon `M-7` / `ALK-PREDICTION-SNAPSHOT-001` — and it is written
 * onto the dose-change event, read back by the engine, and not available at
 * the instant this moment appears. The retest date is the engine\'s too.
 *
 * So the moment states what was RECORDED, which the app does know: the change
 * itself, and when it takes effect. What it no longer states is what the tank
 * will do, and the reason is that nothing here is entitled to an opinion about
 * that. Both omissions are in `docs/migration/PORT-OMISSIONS.md`. */
export function DoseChangePopup({ result, onClose }) {
  useEscape(onClose);
  const AUTO = 14;
  const [left, setLeft] = useState(AUTO);
  const [held, setHeld] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!result) return;
    setPhase(0);
    const t = [setTimeout(() => setPhase(1), 420), setTimeout(() => setPhase(2), 900)];
    return () => t.forEach(clearTimeout);
  }, [result]);

  useEffect(() => {
    if (!result || held) return;
    if (left <= 0) { onClose(); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [result, left, held]);

  if (!result) return null;
  const { def, from, to, date, time } = result;
  const up = to > from;
  const tone = "#0B7C86";

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
      style={{ background: "rgba(8,25,29,0.45)", zIndex: 70 }}>
      <div onClick={(e) => { e.stopPropagation(); setHeld(true); }}
        className="w-full max-w-xs rounded-3xl bg-white overflow-hidden"
        style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>

        <div className="px-5 pt-6 pb-5 text-center" style={{ background: tone + "12" }}>
          {/* V1 put a chart emoji here, up or down. The brief for this port is
              explicit: "No emojis. No green tick, no confetti, no stars. Keep
              it professional." The arrow carries the direction and is part of
              the icon set the rest of the app is drawn in. */}
          <div className="flex items-center justify-center" style={{ color: tone }}>
            {up ? <ArrowUp size={30} strokeWidth={2.6} /> : <ArrowDown size={30} strokeWidth={2.6} />}
          </div>
          <div className="mt-3 flex items-baseline justify-center gap-1.5">
            <span className="text-[19px] font-black text-ink2 tabular-nums">{fmtQty(from, "mlPerDay")}</span>
            <span className="text-[15px] font-bold text-ink2">{"\u2192"}</span>
            <span className={`rc-value text-[32px] font-black leading-none tabular-nums${phase >= 1 ? " landed" : ""}`}
              style={{ color: tone }}>
              <span className="rc-sheen">{fmtQty(to, "mlPerDay")}</span>
            </span>
            <span className="text-[12px] font-bold text-ink2">mL/day</span>
          </div>
          <div className="text-[12px] font-black text-ink mt-1">
            {def.label} · from {fmtFriendly(date)}{fmtTime(time) ? ` at ${fmtTime(time)}` : ""}
          </div>
        </div>

        {phase >= 2 && (
          <div className="px-5 py-4 rc-stagger">
            <div className="text-center" style={{ animationDelay: "0ms" }}>
              <div className="text-[15px] font-black" style={{ color: tone }}>Recorded</div>
              <p className="text-[13px] text-ink font-medium leading-relaxed mt-1">
                The change is in your record from the date and time above. The next
                assessment measures from that moment.
              </p>
            </div>

            <div className="mt-3 rounded-xl p-3" style={{ background: "#F7FAFA", animationDelay: "150ms" }}>
              <div className="flex items-center justify-between gap-2 py-1">
                <span className="text-[11px] font-bold text-ink2">Was</span>
                <span className="text-[12px] font-black text-ink">{fmtQty(from, "mlPerDay")} mL/day</span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1 border-t border-app">
                <span className="text-[11px] font-bold text-ink2">Now</span>
                <span className="text-[12px] font-black" style={{ color: tone }}>{fmtQty(to, "mlPerDay")} mL/day</span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1 border-t border-app">
                <span className="text-[11px] font-bold text-ink2">Effective from</span>
                <span className="text-[12px] font-black text-ink">
                  {fmtFriendly(date)}{fmtTime(time) ? ` at ${fmtTime(time)}` : ""}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2" style={{ animationDelay: "300ms" }}>
              Don\'t change the dose again before the next test — the reading is only
              meaningful if this dose has run undisturbed.
            </p>

            <button onClick={onClose}
              className="mt-4 w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white"
              style={{ background: tone, animationDelay: "450ms" }}>
              Done
            </button>
            <div className="mt-2 text-center" style={{ animationDelay: "560ms" }}>
              <span className="text-[10px] font-bold text-ink2">
                {held ? "Staying open — tap Done when you\'re finished" : `Closes in ${left}s · tap to keep open`}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* DoseAdviceRow lived here. It was the dose UI before the Dosing Wizard, and
   the wizard renders AlkAssessmentBlock directly, so nothing referenced it any
   more — an old screen kept alive only by being defined. */

/* THE STABLE IDENTITY OF A NOTICE.

   V1 called these findings and computed them itself. In V2 a notice IS a
   reason code the engine emitted, with the payload the engine attached; the
   interface neither raises one nor decides what it means.

   The identity mechanism is V1\'s and it was right: keying on the id alone let
   the same claim be dismissed in one place and stay visible in another,
   because two surfaces had built two different keys for it. One key, built
   here, used everywhere.

   The SIGNATURE is what has to still hold for a dismissal to stay in force.
   V1 folded the reading into it for urgent findings, "so a worse number brings
   it straight back". The same rule applies, over the engine\'s own payload:
   put a blocking notice away and it returns the moment the engine emits it
   with different numbers. */
export function findingKey(f) {
  return "finding|" + f.id;
}

export function findingSignature(f) {
  return f.severity === "REFUSAL" || f.severity === "GATING"
    ? `${f.id}|${f.title}|${JSON.stringify(f.payload || {})}`
    : `${f.id}|${f.title}`;
}

/* Shared by every surface: is this finding currently put away? */
export function findingHidden(f, dismissed) {
  const e = (dismissed || {})[findingKey(f)];
  if (e == null) return false;
  const sig = e && typeof e === "object" ? e.sig : null;
  /* A bare date is the old format and lapses rather than sticking forever. */
  return sig != null && sig === findingSignature(f);
}

export function FindingList({ items, compact = false, onDismiss = null }) {
  if (!items || !items.length) return null;
  /* V1\'s three tones, against the contract\'s three severities. The severity is
     stamped on the code by the frozen catalogue (`adapter.py` reads it), so
     this is a lookup of something the engine decided and not a judgement made
     here. An unrecognised severity gets the quiet tone rather than the loud
     one — a value the catalogue adds later must not arrive shouting. */
  const tone = (sev) => (sev === "REFUSAL" ? "#C4285B" : sev === "GATING" ? "#A2621B" : "#45605F");
  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {items.map((f) => (
        <div key={f.id} className="rounded-lg p-2.5" style={{ background: tone(f.severity) + "10", border: `1px solid ${tone(f.severity)}30` }}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tone(f.severity) }} />
            <span className="text-[11px] font-extrabold uppercase tracking-wide flex-1" style={{ color: tone(f.severity) }}>
              {f.title}
            </span>
          </div>
          <p className="text-[12px] text-ink font-medium leading-relaxed">{f.detail}</p>
          {onDismiss && (
            <div className="flex justify-end mt-1.5">
              <button onClick={() => onDismiss(f)}
                className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-1 rounded-md"
                style={{ color: tone(f.severity), background: tone(f.severity) + "14" }}>
                Got it — hide this
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* A small badge for dashboard cards, so a card looks as interesting as it is. */
/* An icon per parameter, so a card is recognisable before it is read. Reusing
   the icon set already imported keeps the weight and stroke consistent with
   the rest of the app. */
/* Keyed by the parameter keys `app/src/store/ledger.js` declares, which are
   the contract\'s. V1\'s keys were its own spellings — `alkalinity`, `ph` — and
   there is no ammonia row because this build has no ammonia parameter: the
   keeper\'s record contains none, and the ledger carries no parameter nobody
   measures. */
export const PARAM_ICON = {
  ALK: Waves, SAL: Droplets, CA: Scale, MG: Gauge,
  K: Target, PO4: Beaker, NO3: FlaskConical, PH: Activity,
};

/* A short trace of where the parameter has been. It replaces a second bar with
   something that carries more information in the same space. */
export function MicroSpark({ rows, def, colour }) {
  if (!rows || rows.length < 3) return <div style={{ height: 20 }} />;
  const W = 100, H = 20, P = 2;
  const vals = rows.map((r) => r.value);
  /* The keeper\'s range is drawn where he has one and simply is not where he
     does not. V1 could assume both bounds existed because it shipped a range
     for every parameter; those ranges were band edges and did not come across,
     so the absence is now the ordinary case rather than an error. */
  const banded = Number.isFinite(def.min) && Number.isFinite(def.max);
  const lo = banded ? Math.min(...vals, def.min) : Math.min(...vals);
  const hi = banded ? Math.max(...vals, def.max) : Math.max(...vals);
  const span = (hi - lo) || 1;
  const x = (i) => (i / (rows.length - 1)) * W;
  const y = (v) => H - P - ((v - lo) / span) * (H - P * 2);
  const d = rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(r.value).toFixed(1)}`).join(" ");
  const bandTop = banded ? y(def.max) : null, bandBot = banded ? y(def.min) : null;
  const last = [x(rows.length - 1), y(rows[rows.length - 1].value)];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 20 }}>
      {banded && (
        <rect x="0" y={Math.min(bandTop, bandBot)} width={W}
          height={Math.max(1, Math.abs(bandBot - bandTop))} fill={colour} opacity="0.10" />
      )}
      <path d={d} fill="none" stroke={colour} strokeWidth="1.6" strokeLinecap="round"
        strokeLinejoin="round" opacity="0.75" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={colour} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* THE PARAMETER CARD.

   The layout is V1\'s, unchanged: a tinted header strip in the parameter\'s own
   colour with its icon, its name, a trend arrow and a `+` to log; the reading,
   large, with its unit; the range bar; the sparkline; the status line with the
   reading\'s date on the right; and a tinted strip when there is something to
   say.

   What changed is where the words come from. V1 worked out the position, the
   direction and the stability grade inside this component. Every one of those
   is now a PROP:

     position    the engine\'s `EngineResult.position`, or null
     statusLine  the sentence the engine\'s answer produced, through
                 `app/src/present/`
     direction   the engine\'s trajectory — "RISING", "FALLING" — or null
     notice      one engine notice, already selected and worded

   All four are null for every parameter this build does not assess, and the
   card is written to read properly with all four missing: reading, unit, range
   bar, trace, date. That is not a degraded state to be apologised for, it is
   what the app honestly knows about calcium.

   THE TREND ARROW, AND WHY IT IS NOT COMPUTED HERE

   V1 subtracted the previous reading from the latest and drew an arrow when
   the difference cleared `def.step`. That is a noise floor — a number that
   decides whether movement counts — and a noise floor is chemistry: it comes
   from the canon and from nowhere else. So the arrow follows the engine\'s
   trajectory where there is one, and there is no arrow anywhere else.
   Recorded in `docs/migration/PORT-OMISSIONS.md`. */
export function ParamCard({ def, reading, recent, position = null, statusLine = null,
  direction = null, notice = null, rows, onOpen, onLog = null, observation = null }) {
  /* The number and the words describe the same test. `observation` is the one
     owner of "the current value" (`present/episodes.js`); `reading` is kept
     only for the callers that have not been given one yet. */
  const shown = observation || (reading
    ? { value: reading.value, date: reading.date, count: 1, resolved: false }
    : null);
  const tone = positionTone(position);
  const Icon = PARAM_ICON[def.key] || Beaker;

  const moved = direction === "RISING" || direction === "FALLING";

  return (
    <div className="relative h-full">
      <button onClick={onOpen} className="text-left h-full w-full">
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-all cursor-pointer"
        style={{ borderColor: status === "ok" ? undefined : tone + "55" }}>

        {/* A tinted cap in the parameter's own colour, which is what makes the
            grid scannable rather than eight identical white boxes. */}
        <div className="flex items-center gap-1.5 px-3 py-2"
          style={{ background: def.color + "14" }}>
          <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{ background: def.color + "26" }}>
            <Icon size={11} style={{ color: def.color }} strokeWidth={2.6} />
          </span>
          <span className="text-[12px] font-black truncate flex-1 min-w-0" style={{ color: "#08191D" }}>
            {def.label}
          </span>
          {moved && (
            <span className="shrink-0" style={{ color: tone, opacity: 0.8 }}>
              {direction === "RISING" ? <ArrowUp size={11} strokeWidth={3} /> : <ArrowDown size={11} strokeWidth={3} />}
            </span>
          )}
          {/* Sits in the header row rather than floating over the card, so it
              cannot land on top of the trend arrow. Nested inside the card's
              own button, so it stops the event to log rather than open. */}
          {onLog && (
            <span role="button" tabIndex={0}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onLog(def.key); }}
              aria-label={`Log a ${def.label.toLowerCase()} reading`}
              className="shrink-0 rounded-md flex items-center justify-center cursor-pointer"
              style={{ width: 18, height: 18, background: def.color + "26", color: def.color }}>
              <Plus size={11} strokeWidth={3} />
            </span>
          )}
        </div>

        <div className="px-3 pt-2 pb-2.5 flex flex-col gap-1.5 flex-1">
          <div className="flex items-baseline gap-1">
            <span className="font-black text-[24px] leading-none tabular-nums" style={{ color: tone }}>
              {shown ? fmtVal(def, shown.value) : "\u2014"}
            </span>
            <span className="text-[10px] font-bold text-ink2">{def.unit}</span>
            {/* A test run more than once says so, because otherwise the figure
                shown is not one the keeper ever typed and nothing on the card
                explains where it came from. */}
            {shown && shown.count > 1 && (
              <span className="text-[9px] font-extrabold rounded px-1 py-[1px] shrink-0"
                style={{ background: def.color + "1F", color: def.color }}>
                {t("group.badgeShort", { count: shown.count })}
              </span>
            )}
          </div>

          <ParamGauge def={def} value={shown ? shown.value : null} recent={recent}
            position={position} compact />

          <MicroSpark rows={rows} def={def} colour={def.color} />

          {/* The status line. Position always, once the engine has one;
              trajectory alongside it as soon as the engine can state one. It
              is never blank and it never leads with a refusal — where there is
              no engine the line says what the app does with the readings
              instead, which is true and is not an apology. */}
          <div className="flex items-center justify-between gap-1 mt-auto pt-0.5">
            <span className="text-[9px] font-extrabold uppercase tracking-wide truncate"
              style={{ color: statusLine ? tone : "#5F7575" }}>
              {statusLine || ""}
            </span>
            <span className="text-[9px] font-bold text-ink2 shrink-0">
              {shown && shown.date ? fmtShort(shown.date) : ""}
            </span>
          </div>

          {/* The notification strip is where the engine speaks, and it is
              absent when the engine has nothing to say. */}
          {notice && (
            <div className="flex items-center gap-1 rounded-md px-1.5 py-1"
              style={{ background: notice.tone + "14" }}>
              <span className="w-1 h-1 rounded-full shrink-0" style={{ background: notice.tone }} />
              <span className="text-[9px] font-extrabold uppercase tracking-wide truncate"
                style={{ color: notice.tone }}>
                {notice.text}
              </span>
            </div>
          )}
        </div>
      </Card>
      </button>
    </div>
  );
}

export function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
      <div>
        {eyebrow && <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold mb-1">{eyebrow}</div>}
        <h2 className="text-2xl font-display text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", type = "button", className = "", disabled }) {
  const styles = {
    primary: "bg-teal-brand text-white hover:brightness-110 font-bold shadow-sm",
    ghost: "bg-white border-2 border-app text-ink hover:border-teal-brand font-bold",
    danger: "bg-transparent text-rose-700 hover:bg-rose-50 font-bold",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`px-3.5 py-2 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Field({ label, children, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="block text-xs font-bold text-ink2 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full min-w-0 max-w-full bg-white border-2 border-app rounded-lg px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink2/50 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-teal-brand/40 focus:border-teal-brand";
