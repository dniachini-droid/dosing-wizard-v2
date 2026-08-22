import { useEffect, useRef, useState } from 'react'
import { Save } from '../icons.jsx'
import { Btn, inputCls } from './DoseExpectation.jsx'
import { DeleteControl } from './DeleteControl.jsx'
import { fmtQty, fmtTime } from '../lib/format.js'
import { fmtDate, todayStr } from '../lib/dates.js'
import { nowTime } from '../lib/clock.js'
import { originOf, originSentence } from '../present/dose-origin.js'
import { t } from '../strings.js'

/* ============================================================================
   THE DELIVERED DOSE — ONE FIELD, FOREVER
   ----------------------------------------------------------------------------
   Owner finding 19, and the owner's own framing of it.

   Setup used to carry three things for what is a single act: "what your pump is
   running now", a history, and a "record a dose change" form with FROM and TO.
   The keeper filled the first with 9.0, was told it was saved, and read
   "on record: 8.8 mL/day" underneath it — because the first field wrote one
   kind of record and the third wrote another, and neither knew about the other.

   There is one field. It is not a setup field: it is the dose the pump is
   delivering. The first time it is filled it establishes the dose; every time
   after, it records a change. There is no separate concept of setting up
   versus changing.

   THE KEEPER NEVER TYPES EITHER HALF OF A CHANGE. The "to" is what he just
   typed. The "from" is whatever the dose was before it, which the application
   recorded and can read. So the FROM/TO form is gone, not rearranged — asking
   for a number the record already holds is asking him to restate a fact and to
   get it wrong.

   DATE AND TIME ARE ASKED FOR, defaulting to now, because a change made at 9am
   and one made at 9pm are genuinely different — the response is measured from
   the moment the change took effect — and nobody turns the dial at the moment
   they open the app.

   THREE WAYS IN, ONE WAY THROUGH. This component is the field, and it is the
   same component in Setup and on the Dosing tab. What differs between the
   three is one thing only: what the entry afterwards says about where the
   figure came from.
   ========================================================================= */

export function DeliveredDoseField({
  standing = null, suggested = null, onSave, autoFocus = false, compact = false,
}) {
  /* Prefilled with the figure being offered, or with the dose in force. A blank
     box on a screen whose whole subject is a number the app already knows is a
     box that invites a typo. */
  const initial = suggested != null ? fmtQty(suggested, "mlPerDay")
    : standing != null ? fmtQty(standing, "mlPerDay") : "";
  const [value, setValue] = useState(initial);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTime());
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  /* Re-read when the record moves underneath the field — a dose changed from
     another surface, or a new recommendation arrived. Keyed on the figures
     themselves, so typing is never interrupted by a re-render. */
  const synced = useRef(initial);
  useEffect(() => {
    if (initial === synced.current) return;
    synced.current = initial;
    setValue(initial);
  }, [initial]);

  const submit = async () => {
    const to = parseFloat(value);
    if (!Number.isFinite(to)) { setMsg(t("dose.delivered.needNumber")); return; }
    if (to < 0) { setMsg(t("dose.delivered.needPositive")); return; }
    setBusy(true);
    try {
      await onSave({ toMlPerDay: to, date, time, origin: originOf(suggested, to) });
      setMsg(standing == null ? t("dose.delivered.recorded") : t("dose.delivered.changed"));
      setDate(todayStr());
      setTime(nowTime());
    } finally {
      setBusy(false);
    }
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div>
      {!compact && (
        <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-2">
          {standing == null ? t("dose.delivered.leadFirst") : t("dose.delivered.lead")}
        </p>
      )}
      <label className="block mb-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink2">
          {t("dose.delivered.field")}
        </span>
        <input type="number" inputMode="decimal" step="0.01" autoFocus={autoFocus}
          className={inputCls} value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
      </label>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink2">
            {t("dose.delivered.date")}
          </span>
          <input type="date" value={date} max={todayStr()} className={inputCls}
            onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink2">
            {t("dose.delivered.time")}
          </span>
          <input type="time" value={time} className={inputCls}
            onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      <Btn className="w-full" onClick={submit} disabled={busy}>
        <span className="flex items-center justify-center gap-1.5">
          <Save size={14} /> {standing == null ? t("dose.delivered.saveFirst") : t("dose.delivered.save")}
        </span>
      </Btn>
      {msg && <p className="text-[11px] font-extrabold text-teal-brand mt-2">{msg}</p>}
    </div>
  );
}

/* ============================================================================
   THE HISTORY, WHICH WRITES ITSELF
   ----------------------------------------------------------------------------
   Newest first, and in the ORDER IT CLAIMS. It used to sort on the date alone,
   so two changes made on one day kept the order they came out of storage in —
   oldest at the top — and the keeper's 8.8 sat above the 9.0 that replaced it
   on a list headed "newest first". The ledger already holds one total order and
   this reads it rather than forming a second opinion.

   No entry can be edited. A dose change is a fact about a moment; correcting it
   means deleting it and entering it again with the right date, exactly as a
   reading does.
   ========================================================================= */
export function DoseHistory({ entries, onDelete = null }) {
  if (!entries.length) {
    return <p className="text-[13px] text-ink2 font-medium">{t("dose.history.none")}</p>;
  }
  return (
    <div className="space-y-1.5">
      {entries.map((d) => (
        <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-app px-2.5 py-2">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-black text-ink">
              {d.isStart
                ? t("dose.history.start", { dose: fmtQty(d.to, "mlPerDay") })
                : t("dose.history.moved", {
                    from: fmtQty(d.from, "mlPerDay"), to: fmtQty(d.to, "mlPerDay") })}
            </div>
            <div className="text-[11px] font-bold text-ink2">
              {fmtDate(d.date)}{fmtTime(d.time) ? ` · ${fmtTime(d.time)}` : ""}
              {!d.isStart && ` · ${originSentence(d.origin)}`}
              {d.fromDerived ? ` · ${t("dose.history.fromDerived")}` : ""}
            </div>
          </div>
          {onDelete && (
            <DeleteControl onDelete={() => onDelete(d.id)}
              label={t("dose.history.deleteAria", { date: fmtDate(d.date) })}
              ask={t("delete.confirm.dose")} />
          )}
        </div>
      ))}
    </div>
  );
}
