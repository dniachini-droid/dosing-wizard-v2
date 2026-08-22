/* ============================================================================
   DESCRIPTIVE STATISTICS OF THE RECORD — AND THE LINE THIS FILE SITS ON
   ----------------------------------------------------------------------------
   The parameter detail sheet shows, per period: the spread of the readings,
   how many of them fell inside the keeper's own range, and the latest, lowest,
   highest and median. This module is the one place any of that is worked out.

   IT IS WORTH BEING PRECISE ABOUT WHY THIS IS ALLOWED, BECAUSE IT IS CLOSE
   TO A LINE.

   V1 had `computeControl`, and it did far more than this: it graded the spread
   as "tight" or "loose", coloured the grade, wrote a paragraph about what the
   tank was doing, proposed a different target range, and classified the
   pattern as climbing or settling. Every one of those is a verdict — a
   statement about what the readings MEAN — and every one is deleted. None of
   it is reproduced here in any form.

   What is here is arithmetic over two things the app already holds:

     the readings          the keeper's own record, unmodified
     the keeper's range    `keeperRange` in `app/src/store/config.js`, which
                           that file documents as the KEEPER's own numbers,
                           governing nothing, "drawn on his charts and stated
                           in his history"

   A minimum, a maximum, a median and a count of how many readings fell between
   two numbers the keeper typed are facts about the record. They assert nothing
   about the tank, they use no canon threshold, and changing one would change
   no recommendation, because no recommendation reads them.

   WHERE THE LINE IS, STATED SO IT CAN BE ARGUED WITH

   This module will count readings against the keeper's range. It will NOT say
   what the current reading means — that is `position`, it belongs to the
   engine, and the parameter card leaves the word off entirely for every
   parameter the engine does not assess. The difference is between counting a
   record against a preference the keeper stated, and telling him his tank is
   out of range. The first is his own arithmetic handed back to him; the second
   is a chemistry claim.

   `docs/migration/PORT-OMISSIONS.md` records this line explicitly, so that if
   the owner wants it drawn somewhere else he can see exactly where it is.

   There is no grading here, no colour by verdict, no narrative, no suggested
   range and no threshold of any kind. A test asserts that this file names no
   numeric constant.
   ========================================================================= */

/* Percentiles by nearest rank on the sorted values. No interpolation, because
   an interpolated percentile invents a value that was never measured, and
   every number this module returns should be one the keeper actually recorded
   — or, for the count, one he can check by looking at the chart. */
function nearestRank(sorted, fraction) {
  if (!sorted.length) return null;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round(fraction * (sorted.length - 1))));
  return sorted[i];
}

/* THE MIDDLE VALUE, AND FOR AN EVEN COUNT THAT IS THE MIDPOINT OF THE TWO.

   Nearest rank is right for `p05` and `p95` above: a percentile that
   interpolates invents a value nobody measured, and "usually 8.6 to 9.0" reads
   better as two real readings. The MEDIAN is different, because the word on the
   screen makes a promise about what the number is.

   The reefkeeper caught this by checking the arithmetic: two nitrate readings
   of 5.00 and 7.00 showed a "median" of 7.00, out by a full ppm. And the app
   already holds the correct answer elsewhere — delete one of three measurements
   and the engine resolves the remaining pair by averaging them, so two medians
   in one app disagreed, which is `MASTER RULE 1`'s defect in a statistic.

   This does not touch the engine's median and could not: that one is canon's,
   it resolves a testing episode, and it is in `engine/alk_v2/kernel.py`. This
   is the descriptive figure on the history sheet, and it now agrees with it. */
function middleValue(sorted) {
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/* One window's figures. `range` is the keeper's own `{min, max}` or null; with
   no range there is no in-range count, and the caller renders the spread
   alone. */
export function describeRows(rows, range) {
  if (!rows || !rows.length) return null;
  const values = rows.map((r) => r.value);
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  let inRange = null, below = null, above = null, pct = null;
  if (range && Number.isFinite(range.min) && Number.isFinite(range.max)) {
    below = values.filter((v) => v < range.min).length;
    above = values.filter((v) => v > range.max).length;
    inRange = values.length - below - above;
    pct = Math.round((inRange / values.length) * 100);
  }

  return {
    n: values.length,
    latest: rows[rows.length - 1].value,
    min,
    max,
    median: middleValue(sorted),
    p05: nearestRank(sorted, 0.05),
    p95: nearestRank(sorted, 0.95),
    /* The measure V1 graded and this does not. It is `max - min` and it is
       reported as itself, in the parameter's own unit. */
    spread: max - min,
    inRange,
    below,
    above,
    pct,
  };
}
