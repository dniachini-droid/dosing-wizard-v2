/* ============================================================================
   HOW WIDE A TARGET RANGE IS, GRADED — OWNER FINDING 18
   ----------------------------------------------------------------------------
   "The width of the range is itself the thing being judged, and the bar says so
   as it moves."

       under 0.5 dKH   green   tight control
       0.5 to 1.0      amber   acceptable control
       over 1.0        red     loose — a tighter range is worth considering

   WHOSE NUMBERS THESE ARE. The owner's, stated by him for ALKALINITY, in dKH,
   on 22 August. They are NOT canon figures: no freeze states them, no fixture
   covers them and no engine reads one. They govern a sentence and a colour on
   one screen and nothing else — which is the only reason they may live in the
   application at all.

   They do not transfer to calcium or magnesium. `graded` is false unless the
   caller states that they apply to the parameter in hand, and generalising them
   is an owner decision that has not been taken.

   It is here rather than in the component because it decides something, and
   what it decides has to be testable by a runner that is Node and nothing else.
   ========================================================================= */

export function gradeWidth(width, graded) {
  if (!graded || !Number.isFinite(width)) return null;
  /* Boundaries stated the way the owner stated them: "under 0.5", "0.5 to 1.0",
     "over 1.0". So exactly 0.5 is acceptable rather than tight, and exactly 1.0
     is acceptable rather than loose. */
  if (width < 0.5) return { key: "tight", tone: "#0B7C86" };
  if (width <= 1.0) return { key: "fair", tone: "#A2621B" };
  return { key: "loose", tone: "#C4285B" };
}
