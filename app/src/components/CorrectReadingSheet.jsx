import { useState } from 'react'
import { Btn, Field, inputCls } from './DoseExpectation.jsx'
import { fmtDate } from '../lib/dates.js'
import { PROVENANCE } from '../store/time.js'
import { t } from '../strings.js'

/* ============================================================================
   FIXING A READING THAT WAS TYPED WRONG
   ----------------------------------------------------------------------------
   `PORT-OMISSIONS.md` records this as the most serious loss in the interface
   port: "Type 89 instead of 8.9 and it is in the ledger permanently, skewing
   every chart and every assessment." V1's `WaterLog` carried the edit and
   delete affordances and they did not cross.

   The mechanism already existed — the canon's supersede rule, the store's
   append-only ledger, and its refusal to let a correction improve a record's
   time provenance. Only the surface was missing. This is that surface and
   nothing more: it computes nothing, decides nothing, and holds no rule of its
   own.

   TWO DIFFERENT ACTS, AND THEY ARE NOT THE SAME ONE.

     Correcting  — the measurement happened and the number is wrong. A new
                   reading supersedes the old one, and the old one stays.
     Taking out  — the reading should never have been counted at all: a botched
                   test, or one entered twice. It is annotated invalid. The
                   record still holds it.

   Neither erases anything, and the screen says so in both cases rather than
   letting "delete" imply something the ledger will not do.

   NO TIME BOX ON A DATE-ONLY READING. The store would refuse it
   (`assertProvenanceNotImproved`), but the reason it would refuse is the
   reason the box is not offered: correcting a NUMBER is not new information
   about WHEN, and a form that asked would be inviting a fabrication.
   ========================================================================= */

export function CorrectReadingSheet({ reading, def, onCorrect, onDelete, onClose }) {
  const dateOnly = reading.provenance === PROVENANCE.DATE_ONLY
    || reading.provenance === PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN
    || !reading.time;

  const [value, setValue] = useState(String(reading.value));
  const [msg, setMsg] = useState("");
  const [confirming, setConfirming] = useState(false);

  const save = async () => {
    const v = parseFloat(value);
    if (!Number.isFinite(v)) { setMsg("Enter a number."); return; }
    await onCorrect({
      eventId: reading.id,
      param: reading.param,
      value: v,
      date: reading.date,
      /* The original's own time, unchanged and unimproved. */
      time: dateOnly ? null : reading.time,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-4 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[16px] font-black text-ink mb-1">{t("correct.title")}</h3>
        <p className="text-[12px] font-bold text-ink2 mb-3">
          {t("correct.original", {
            value: reading.value,
            unit: def ? def.unit : "",
            date: fmtDate(reading.date),
            time: dateOnly ? null : reading.time,
          })}
        </p>

        <Field label={`${t("correct.newValue")}${def && def.unit ? ` (${def.unit})` : ""}`} className="mb-2">
          <input type="number" inputMode="decimal" step="0.01" className={inputCls}
            value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        </Field>

        {dateOnly && (
          <p className="text-[11px] font-medium text-ink2 leading-relaxed mb-2">
            {t("correct.dateOnlyNote")}
          </p>
        )}

        {/* THE AUDIT CONSEQUENCE, STATED PLAINLY. Not implied, not in a
            tooltip, and not left for the keeper to discover afterwards. */}
        <p className="text-[11px] font-medium text-teal-brand leading-relaxed mb-3">
          {t("correct.audit")}
        </p>

        <Btn className="w-full" onClick={save}>{t("correct.save")}</Btn>
        {msg && <p className="text-[11px] font-extrabold text-rose-600 mt-2">{msg}</p>}

        <div className="border-t border-app mt-4 pt-3">
          <h4 className="text-[13px] font-black text-ink mb-1">{t("correct.deleteHead")}</h4>
          <p className="text-[12px] font-medium text-ink2 leading-relaxed mb-2">
            {t("correct.deleteBody")}
          </p>
          <p className="text-[11px] font-medium text-teal-brand leading-relaxed mb-2">
            {t("correct.deleteAudit")}
          </p>
          {confirming ? (
            <button
              className="w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white bg-rose-600"
              onClick={async () => { await onDelete(reading.id); onClose(); }}>
              {t("correct.delete")}
            </button>
          ) : (
            <button
              className="w-full rounded-xl py-2.5 text-[13px] font-extrabold text-rose-600 border-2 border-rose-200"
              onClick={() => setConfirming(true)}>
              {t("correct.delete")}
            </button>
          )}
        </div>

        <button className="w-full mt-3 py-2 text-[12px] font-extrabold text-ink2" onClick={onClose}>
          {t("correct.cancel")}
        </button>
      </div>
    </div>
  );
}

/* The list the sheet is reached from. It sits under the chart in the parameter
   view, which is where a keeper who has just SEEN a wrong point on the chart is
   already looking. Superseded and invalid readings are shown too, marked —
   otherwise "I corrected that" has no visible consequence. */
export function ReadingList({ rows, def, onPick }) {
  if (!rows.length) return null;
  return (
    <div className="mt-4">
      <h4 className="text-[13px] font-black text-ink mb-1">{t("correct.readingsHead")}</h4>
      <p className="text-[11px] font-medium text-ink2 mb-2">{t("correct.tapToFix")}</p>
      <div className="space-y-1">
        {rows.map((r) => (
          <button key={r.id} onClick={() => onPick(r)}
            className="w-full flex items-center gap-2 rounded-lg bg-app px-2.5 py-2 text-left active:opacity-70">
            <span className="text-[13px] font-black text-ink tabular-nums">
              {r.value}<span className="text-ink2 font-bold text-[11px] ml-0.5">{def ? def.unit : ""}</span>
            </span>
            <span className="text-[11px] font-bold text-ink2 flex-1 truncate">
              {fmtDate(r.date)}{r.time ? ` · ${r.time}` : ""}
            </span>
            {r.state === "SUPERSEDED" && (
              <span className="text-[10px] font-extrabold text-ink2 uppercase tracking-wide">
                {t("correct.superseded")}
              </span>
            )}
            {r.state === "INVALID" && (
              <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wide">
                {t("correct.invalid")}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
