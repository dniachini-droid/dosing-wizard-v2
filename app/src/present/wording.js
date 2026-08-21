/* ============================================================================
   WHICH STRING APPLIES
   ----------------------------------------------------------------------------
   This module decides WHICH key to look up. It contains no text.

   Every sentence the keeper can read lives in `app/src/strings.js`. What lives
   here is the mapping from an engine value to a key — `movementEvidence` of
   `SUFFICIENT` becomes `evidence.SUFFICIENT`, reason code `TRAJECTORY_FALLING`
   becomes `reason.TRAJECTORY_FALLING` — plus the number formatting, which is
   arithmetic rather than language.

   Owner decision 9 still governs what may appear on screen: no reason-code
   identifier and no canon variable name outside a developer view. That rule is
   enforced by the two functions at the bottom, which refuse to print a value
   that has no wording rather than printing it raw.

   `mockups/CONTRACT-GAPS.md` gaps 4 and 23 — that nobody owns the plain-English
   sentence under a reason code — stay open. The sentences in `strings.js` are
   presentation's and are not authority for anything.
   ========================================================================= */

import { isAbsent } from "./cards.js";
import { t, has } from "../strings.js";

/* --- numbers -------------------------------------------------------------
   Formatting, not language. `ALK-V2-DATA-CONTRACT.md` §0: display rounding
   never enters calculation, and nothing here is fed back anywhere. */

export function num(v, decimals = 2) {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v.toFixed(decimals);
}

export function signed(v, decimals = 4) {
  const s = num(Math.abs(v), decimals);
  if (s == null) return null;
  return (v < 0 ? "−" : "+") + s;
}

/* --- absent values ------------------------------------------------------- */

export function sayAbsent(v) {
  return has(`absent.${v}`) ? t(`absent.${v}`) : t("absent.other");
}

export function whyAbsent(v) {
  return has(`absentWhy.${v}`) ? t(`absentWhy.${v}`) : t("absentWhy.other");
}

/* A value or its refusal, always one or the other, never a blank. */
export function valueOrAbsence(v, { decimals = 2, unit = null } = {}) {
  if (isAbsent(v)) return { present: false, text: sayAbsent(v), why: whyAbsent(v), raw: v };
  if (typeof v === "number") {
    return { present: true, text: num(v, decimals) + (unit ? " " + unit : ""), raw: v };
  }
  if (v == null) {
    return { present: false, text: t("absent.notRecorded"), why: t("absentWhy.notRecorded"), raw: null };
  }
  return { present: true, text: String(v), raw: v };
}

/* --- the six dimensions --------------------------------------------------
   Each is a namespace in the strings file. The engine's value is the key
   inside it, so adding a value to the contract shows up as a missing string
   rather than as a silently blank cell. */

export const sayPosition = (v) => fromNamespace("position", v);
export const sayTrajectory = (v) => fromNamespace("trajectory", v);
export const sayEvidence = (v) => fromNamespace("evidence", v);
export const sayOuter = (v) => fromNamespace("outer", v);
export const sayResponseClass = (v) => fromNamespace("response", v);
export const sayAction = (v) => fromNamespace("action", v);

/* The verb a card shows.

   Normally the engine's action IS the verb. The exception is the capability
   refusal, which arrives as `HOLD_CURRENT_DOSE` — the same action as an
   ordinary hold, because holding the current rate is what the engine does in
   both cases. The card class is what distinguishes them, so where a card
   declares its own verb, the card wins. */
export function sayVerb(cardId, actionValue) {
  if (cardId && has(`verb.${cardId}`)) return t(`verb.${cardId}`);
  return sayAction(actionValue);
}

function fromNamespace(ns, v, fallback) {
  if (v == null) return fallback || t("absent.notRecorded");
  if (typeof v === "string" && has(`${ns}.${v}`)) return t(`${ns}.${v}`);
  if (isAbsent(v)) return sayAbsent(v);
  return fallback || t("absent.notRecorded");
}

export { fromNamespace };

/* --- severity ------------------------------------------------------------
   `GATING`, `REFUSAL` and `INFO` are contract values that happen to look like
   English (`CONTRACT-GAPS.md` gap 26), so they are translated rather than
   printed. */
export function saySeverity(s) {
  return has(`severity.${s}`) ? t(`severity.${s}`) : t("severity.INFO");
}

/* --- reason codes --------------------------------------------------------
   A lookup, always. The code that emits a reason carries no sentence, no
   screen writes one, and a code with no wording yet gets the honest fallback
   rather than leaking its identifier. */
export function sayReason(code) {
  return code && has(`reason.${code}`) ? t(`reason.${code}`) : t("reason.fallback");
}

export function hasWording(code) {
  return has(`reason.${code}`);
}

/* --- payload keys and values ---------------------------------------------
   Both halves have to be translatable. Rendering the key in English while
   printing the value verbatim puts contract vocabulary on screen just as
   surely as printing the key would; owner decision 9 does not distinguish
   between the two halves of a pair. */

export function sayPayloadKey(k) {
  return has(`payload.${k}`) ? t(`payload.${k}`) : null;
}

/* A value with no wording is not printed at all — it goes to the developer
   view with the rest of the payload. Printing an untranslated value is the
   leak; omitting it is not.

   The test is SHAPE, not a list, so a value the contract adds tomorrow cannot
   leak by being forgotten. */
const CONTRACT_SHAPED = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/;

export function sayPayloadValue(v) {
  if (Array.isArray(v)) {
    const parts = v.map(sayPayloadValue).filter((x) => x != null);
    return parts.length === v.length ? parts.join(", ") : null;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v == null) return null;
  const s = String(v);
  if (has(`value.${s}`)) return t(`value.${s}`);
  if (CONTRACT_SHAPED.test(s)) return null; /* to the developer view instead */
  return s;
}

/* --- capabilities, constraints and outputs ------------------------------- */

export function sayCapability(id) {
  return has(`capability.${id}`) ? t(`capability.${id}`) : t("capability.other");
}

export function sayConstraint(c) {
  return has(`constraint.${c}`) ? t(`constraint.${c}`) : t("constraint.other");
}

export function sayOutput(o) {
  return has(`output.${o}`) ? t(`output.${o}`) : t("output.other");
}

export function sayParameter(key) {
  return has(`parameter.${key}`) ? t(`parameter.${key}`) : key;
}

/* The same name where it appears inside a sentence rather than at the head of
   one. Falls back to the heading form, so a parameter added without a
   mid-sentence entry still reads. */
export function sayParameterMid(key) {
  return has(`parameterMid.${key}`) ? t(`parameterMid.${key}`) : sayParameter(key);
}
