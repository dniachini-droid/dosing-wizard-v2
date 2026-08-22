import { useState } from 'react'
import { Btn, Field, inputCls } from './DoseExpectation.jsx'
import { fmtDate } from '../lib/dates.js'
import { DeleteControl } from './DeleteControl.jsx'
import { SheetClose } from './SheetClose.jsx'
import { PROVENANCE } from '../store/time.js'
import { t } from '../strings.js'

/* ============================================================================
   FIXING A READING THAT WAS TYPED WRONG
   ----------------------------------------------------------------------------
   `PORT-OMISSIONS.md` records this as the most serious loss in the interface
   port: "Type 89 instead of 8.9 and it is in the ledger permanently, skewing
   every chart and every assessment." V1's `WaterLog` carried the edit and
   delete affordances and they did not cross.

   The surface was missing. This is that surface and nothing more: it computes
   nothing, decides nothing, and holds no rule of its own.

   TWO DIFFERENT ACTS, AND THEY ARE NOT THE SAME ONE.

     Correcting  — the measurement happened and the number is wrong. The record
                   holds the corrected value (owner finding 17).
     Deleting    — the reading should never have been counted at all: a botched
                   test, or one entered twice. It is GONE (owner decision 32).

   BOTH OF THESE CHANGED THIS ROUND, AND THE SCREEN'S WORDING WITH THEM.

   The previous version superseded on a correction and annotated `MARK_INVALID`
   on a delete, and said so on the face of the sheet — "neither erases
   anything". The owner asked for the opposite of both. There is no supersede
   chain and no annotation now, so the sentences that promised them have gone
   rather than being softened. A screen that explained an audit trail the store
   no longer keeps would be the same class of fault as a screen showing a number
   the engine is not using.

   NO TIME BOX ON A DATE-ONLY READING. Correcting a NUMBER is not new
   information about WHEN, and a form that asked would be inviting a
   fabrication. Under owner decision 31 such a reading is assigned 09:00 when it
   is written, so what this branch now suppresses is an offer to state an hour
   the keeper still does not know.
   ========================================================================= */

export function CorrectReadingSheet({ reading, def, onCorrect, onDelete, onClose }) {
  const dateOnly = reading.provenance === PROVENANCE.DATE_ONLY
    || reading.provenance === PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN
    || !reading.time;

  const [value, setValue] = useState(String(reading.value));
  const [msg, setMsg] = useState("");

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sheet-layer"
      onClick={onClose}>
      {/* `relative` on the sheet, so the close control sits against the sheet
          and not against the content scrolling inside it (finding 6). The
          scroll region is the inner box. */}
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl relative sheet-panel flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <SheetClose onClose={onClose} label={t("correct.title")} />
        <div className="p-4 overflow-y-auto">
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

        <Btn className="w-full" onClick={save}>{t("correct.save")}</Btn>
        {msg && <p className="text-[11px] font-extrabold text-rose-600 mt-2">{msg}</p>}

        <div className="border-t border-app mt-4 pt-3">
          <h4 className="text-[13px] font-black text-ink mb-1">{t("correct.deleteHead")}</h4>
          <p className="text-[12px] font-medium text-ink2 leading-relaxed mb-2">
            {t("correct.deleteBody")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-extrabold text-rose-600 flex-1">{t("correct.delete")}</span>
            <DeleteControl
              onDelete={async () => { await onDelete(reading.id); onClose(); }}
              label={t("delete.aria.reading", { date: fmtDate(reading.date) })}
              ask={t("delete.confirm.reading")} />
          </div>
        </div>

        <button className="w-full mt-3 py-2 text-[12px] font-extrabold text-ink2" onClick={onClose}>
          {t("correct.cancel")}
        </button>
        </div>
      </div>
    </div>
  );
}

/* THE RAW VALUES LIST — EVERY READING, EACH WITH A TRASH ICON.

   It sits under the chart in the parameter view, which is where a keeper who
   has just SEEN a wrong point on the chart is already looking, and it is reached
   from the Test tab and from tapping a parameter card on the dashboard. Owner
   finding 16 names all three.

   The row itself opens the correction sheet; the trash icon deletes without
   opening anything, because "this one should not be there" does not need a form
   to say it. The icon is its own button rather than a swipe or a long press:
   both of those are gestures a keeper has to be taught, and neither survives
   being described in a sentence.

   NO STATE BADGES. There used to be an INVALID badge and a SUPERSEDED one.
   Neither state is reachable any more — a deleted record is gone rather than
   annotated (owner decision 32) and a correction rewrites the record rather
   than superseding it (finding 17) — so a badge for either would be a label
   nothing can produce. */
export function ReadingList({ rows, def, onPick, onDelete = null }) {
  if (!rows.length) return null;
  return (
    <div className="mt-4">
      <h4 className="text-[13px] font-black text-ink mb-1">{t("correct.readingsHead")}</h4>
      <p className="text-[11px] font-medium text-ink2 mb-2">{t("correct.tapToFix")}</p>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-app px-2.5 py-2">
            <button onClick={() => onPick(r)} className="flex items-center gap-2 flex-1 text-left active:opacity-70">
              <span className="text-[13px] font-black text-ink tabular-nums">
                {r.value}<span className="text-ink2 font-bold text-[11px] ml-0.5">{def ? def.unit : ""}</span>
              </span>
              <span className="text-[11px] font-bold text-ink2 flex-1 truncate">
                {fmtDate(r.date)}{r.time ? ` · ${r.time}` : ""}
              </span>
            </button>
            <DeleteControl
              onDelete={() => onDelete(r.id)}
              label={t("delete.aria.reading", { date: fmtDate(r.date) })}
              ask={t("delete.confirm.reading")} />
          </div>
        ))}
      </div>
    </div>
  );
}
