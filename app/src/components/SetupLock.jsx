import { Pencil, Save } from '../icons.jsx'
import { Btn } from './DoseExpectation.jsx'
import { t } from '../strings.js'

/* ============================================================================
   A SAVED VALUE LOOKS SAVED — OWNER FINDING 16
   ----------------------------------------------------------------------------
   "Save a value and the field still looks and behaves like an input. Nothing
   tells the keeper it took."

   A message that fades is not an answer to that. The field itself has to change
   state, because the question the keeper is asking is not "did the save
   succeed" — it is "is this what the app is now using". So a saved value
   renders as text rather than as a box, the box does not accept typing, and the
   button that saved it becomes Edit.

   Pressing Edit puts the boxes back and the button returns to Save. Nothing is
   written on Edit and nothing is written on cancel; the record changes when the
   keeper saves and at no other moment.

   WHAT IS DELIBERATELY NOT LOCKED. The delivered dose. It is the one field in
   Setup designed to be used again and again — every time the dial moves — and
   it already answers the question this exists to answer, three times over: a
   toast, an entry appearing in the history beneath it, and the dose-change
   moment. Locking it would put a tap in front of the app's most repeated
   action to solve a problem it does not have.
   ========================================================================= */

/* One saved value, rendered as a fact rather than as a form.

   `text` is what to show. It is passed in already formatted, because how a
   volume, a range and a strength are written are three different rules with
   three different owners and none of them belongs here. */
export function LockedValue({ label, text }) {
  return (
    <div className="mb-2">
      <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2">{label}</div>
      <div className="text-[15px] font-black text-ink mt-0.5 tabular-nums">{text}</div>
    </div>
  );
}

/* The button that is Save while the group is open and Edit once it is saved.

   One control rather than two, because two would let a screen show both at
   once — and a screen offering to save a field it is also offering to unlock is
   a screen that cannot say which state it is in. */
export function SaveOrEdit({ locked, onEdit, onSave, saveLabel = null }) {
  if (locked) {
    return (
      <Btn variant="ghost" className="w-full" onClick={onEdit}>
        <span className="flex items-center justify-center gap-1.5">
          <Pencil size={14} /> {t("setup.edit")}
        </span>
      </Btn>
    );
  }
  return (
    <Btn className="w-full" onClick={onSave}>
      <span className="flex items-center justify-center gap-1.5">
        <Save size={14} /> {saveLabel || t("setup.save")}
      </span>
    </Btn>
  );
}
