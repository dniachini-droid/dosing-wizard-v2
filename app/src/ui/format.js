/* ============================================================================
   Display formatting
   ----------------------------------------------------------------------------
   Presentation only. `ALK-V2-DATA-CONTRACT.md` §0: all stored numerics are full
   precision, and display rounding never enters calculation. Nothing here is
   ever fed back into anything.
   ========================================================================= */

import { parseLocalDate, todayLocal, daysBetween } from "../store/time.js";
import { t } from "../strings.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function fmtDate(iso) {
  if (!iso) return "";
  const d = parseLocalDate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtShort(iso) {
  if (!iso) return "";
  const d = parseLocalDate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function fmtDayName(iso) {
  if (!iso) return "";
  const d = parseLocalDate(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/* "Today", "Yesterday", "in 3 days" — friendlier than a date for anything
   close, and a date for anything not. */
export function fmtRelative(iso, today = todayLocal()) {
  const n = daysBetween(today, iso);
  if (n === 0) return t("rel.today");
  if (n === 1) return t("rel.tomorrow");
  if (n === -1) return t("rel.yesterday");
  if (n > 1 && n <= 6) return t("rel.inDays", { n });
  if (n < -1 && n >= -6) return t("rel.daysAgo", { n: -n });
  return fmtShort(iso);
}

/* An instant, shown in the keeper's own local terms. Only ever called for a
   record that HAS an instant — a date-only record has no time to show, and the
   caller must not ask for one. */
export function fmtTimeOfDay(absoluteInstant) {
  if (!absoluteInstant) return "";
  const d = new Date(absoluteInstant);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* How a stored time reads on screen: a date, plus a time only if there was
   one. There is deliberately no branch that supplies a time when none exists. */
export function fmtEventTime(time) {
  if (!time) return t("time.describe.none");
  const date = fmtShort(time.localDate);
  if (time.absoluteInstant) {
    const clock = time.localTime || fmtTimeOfDay(time.absoluteInstant);
    return clock ? `${date} ${clock}` : date;
  }
  /* A record with a wall-clock time and no proven offset HAS a time, and this
     used to call it "date only" — which is a different, weaker fact than the
     one the record carries, and it told the keeper his imported reading was
     less precise than it is. The time is shown, and what is unknown about it
     is said rather than hidden. */
  if (time.localTime) return t("time.fmt.localOnly", { date, time: time.localTime });
  return t("time.fmt.dateOnly", { date });
}

export function fmtNumber(v, decimals) {
  return typeof v === "number" && Number.isFinite(v) ? v.toFixed(decimals) : null;
}
