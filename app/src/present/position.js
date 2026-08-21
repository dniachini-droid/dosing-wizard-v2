/* ============================================================================
   THE ENGINE'S POSITION, GIVEN A COLOUR
   ----------------------------------------------------------------------------
   V1 decided position in the interface — `paramStatus(def, value)` in
   `src/lib/dates.js`, called from eight surfaces, plus fifteen more classifiers
   scattered through the analytics modules. Canon `X-INV-004` allows one
   analytical owner and `DEC-003` forbids a UI component recomputing chemistry,
   so none of that crossed.

   What crossed is V1's palette, which was never chemistry. This module maps a
   position the ENGINE decided onto one of V1's colours, and it decides nothing:
   give it a value the engine did not emit and it returns the unknown tone.

   There is no branch here that compares a reading to a band edge. If you are
   looking for one, the reason it is not here is that it belongs to the engine.
   ========================================================================= */

import { STATUS_COLOR } from "../lib/dates.js";
import { t, has } from "../strings.js";

/* The contract's `Position` vocabulary, each against one of V1's four status
   colours. A value not in this table gets the unknown tone rather than a
   guess, so a position the contract adds tomorrow is SEEN as unstyled instead
   of being quietly coloured as something it is not. */
const TONE = Object.freeze({
  IN_RANGE: STATUS_COLOR.ok,
  BELOW_RANGE: STATUS_COLOR.low,
  ABOVE_RANGE: STATUS_COLOR.high,
  ALERT_LOW: STATUS_COLOR.high,
  ALERT_HIGH: STATUS_COLOR.high,
});

export function positionTone(position) {
  return TONE[position] || STATUS_COLOR.unknown;
}

export function knownPosition(position) {
  return typeof position === "string" && position in TONE;
}

/* "Did the engine say this is in range?" — asked by the range bar, which fills
   its band only when it did, and by the reading moment, which lights the band
   as the trace lands inside it.

   It is a function here rather than an `=== "IN_RANGE"` at those two call
   sites for a reason that is tested rather than asserted: the position
   vocabulary lives in this file and nowhere else. `tests/app/test-port.mjs`
   fails if any of its five values appears outside `app/src/present/`, which
   is what makes "the engine owns position" checkable instead of promised. */
export function positionIsInRange(position) {
  return position === "IN_RANGE";
}

/* The short form the parameter card centres on its range bar: `IN RANGE`,
   `ABOVE RANGE`, `BELOW RANGE`. The brief is explicit that it is not "in
   band". The words themselves live in the strings file, keyed by the engine's
   own value; this looks one up and adds nothing to it.

   Returns null where the engine emitted no position — which is every parameter
   this build does not assess. The card then shows no status word at all, which
   is the honest rendering of "no engine has an opinion about this". */
export function positionWord(position) {
  if (!knownPosition(position)) return null;
  return has(`positionShort.${position}`) ? t(`positionShort.${position}`) : null;
}
