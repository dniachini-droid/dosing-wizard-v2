import { X } from '../icons.jsx'

/* ============================================================================
   THE CLOSE CONTROL ON A SHEET, PINNED
   ----------------------------------------------------------------------------
   Owner finding 6: "The × at the top right of a sheet scrolls out of view with
   the content. It should stay pinned as a floating control so a sheet can be
   closed from anywhere in it."

   WHY ABSOLUTE AND NOT STICKY. Two of the app's sheets already put their whole
   header in a `sticky top-0` bar, and for those it works. It does not
   generalise: a sheet whose first element is a notice, or whose header is a
   two-column block with the title wrapping under it, has nothing sensible to
   make sticky — and making the entire header sticky on a phone spends a third
   of a short screen on a title the keeper has already read.

   So the control is positioned against the SHEET, which does not scroll, rather
   than against the content, which does. It sits above the scroll region in the
   stacking order and stays exactly where it was put however far the content
   moves under it.

   IT IS OPAQUE AND IT HAS A SHADOW, on purpose. A floating control over
   scrolling text is unreadable the moment a line of text passes behind it, and
   an × the keeper cannot see is an × he cannot find.

   The parent must be `relative`. That is the one thing this cannot do for
   itself, and it is stated on every caller.
   ========================================================================= */

export function SheetClose({ onClose, label = "Close" }) {
  return (
    <button
      aria-label={label}
      onClick={onClose}
      /* REEFKEEPER FINDING 21: 36px, and it is the control every sheet is
         escaped by. The circle is still 36 — the padding around it carries the
         target to 44 without moving anything. */
      className="absolute top-1.5 right-1.5 z-30 w-11 h-11 flex items-center justify-center rounded-full bg-card text-ink2 shadow-md border border-app active:opacity-70">
      <X size={18} />
    </button>
  );
}
