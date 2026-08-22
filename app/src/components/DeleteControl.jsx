import { useState } from 'react'
import { Trash2 } from '../icons.jsx'
import { t } from '../strings.js'

/* ============================================================================
   DELETING SOMETHING THE KEEPER RECORDED — ONE CONTROL, EVERY SURFACE
   ----------------------------------------------------------------------------
   Owner decision 32 and finding 16. A deleted record is gone: from the ledger,
   from storage, from every screen. What this file owns is the ASKING, and it is
   one component because the owner specified one interaction and three places to
   reach it from — the raw values list, the calendar, and the correction sheet.
   Three implementations of "trash icon, then a confirmation" is three chances
   for one of them to skip the confirmation.

   THE INTERACTION, AS SPECIFIED. "Trash icon → a confirmation asking plainly
   whether to delete this entry → on confirm, the dark pill toast at the
   bottom." The toast is the shell's (`Toast` in `ReadingConfirmation.jsx`) and
   is raised by the caller, because only the caller knows whether what went was
   a reading, a dose change or a task.

   THE CONFIRMATION IS INLINE, NOT A DIALOG. A modal over a list loses the row
   it is asking about, and "delete this entry?" with the entry no longer on
   screen is a question a keeper cannot answer. It opens under the row it
   belongs to.

   IT DOES NOT PROMISE AN UNDO, because there is not one. The wording says the
   record will be gone and that everything is worked out again without it.
   ========================================================================= */

export function DeleteControl({ onDelete, label, ask = null, size = 15, className = "" }) {
  const [asking, setAsking] = useState(false);
  if (!onDelete) return null;

  return (
    <>
      <button
        aria-label={label || t("delete.aria.entry")}
        onClick={() => setAsking((v) => !v)}
        className={`shrink-0 p-1.5 rounded-lg text-rose-600 active:opacity-70 ${className}`}>
        <Trash2 size={size} />
      </button>
      {asking && (
        <div className="w-full mt-1.5">
          <p className="text-[12px] font-bold text-ink leading-relaxed mb-1.5">
            {ask || t("delete.confirm.entry")}
          </p>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-xl py-1.5 text-[12px] font-extrabold text-white bg-rose-600"
              onClick={async () => { setAsking(false); await onDelete(); }}>
              {t("delete.confirm.yes")}
            </button>
            <button
              className="flex-1 rounded-xl py-1.5 text-[12px] font-extrabold text-ink2 border-2 border-app"
              onClick={() => setAsking(false)}>
              {t("delete.confirm.no")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
