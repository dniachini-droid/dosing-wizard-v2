/* ============================================================================
   ONE TEST, RUN MORE THAN ONCE — AND ONE OWNER OF "THE CURRENT VALUE"
   ----------------------------------------------------------------------------
   Owner findings 26, 28 and 29.

   The keeper logged five 9.0 readings through the Test tab's "Again" button
   and then a 10.0, all inside a minute, against a range of 8.6–9.2. The
   dashboard card read `10.00` and, beside it, `IN RANGE`. The Dosing tab said
   "hold the dose where it is". Both were drawing on the same tank and
   disagreeing in view at the same time.

   Neither was stale. Canon groups measurements of one parameter taken within
   thirty minutes into one testing episode and resolves it to the MEDIAN of its
   members, so six measurements — 9, 9, 9, 9, 9, 10 — are one test whose value
   is 9.0. Every WORD on those screens came from that resolved observation and
   was right. Every NUMBER came straight from the ledger's last row and was a
   measurement, not the answer.

   These checks pin the fix, and they pin the thing that makes it safe: the
   grouping is READ from the engine's own reason codes and never recomputed.
   A second implementation of the thirty-minute window or of the median here
   would be exactly what canon `MASTER RULE 1` calls a defect rather than a
   coincidence.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { suite, eq, ok } from "./harness.mjs";
import {
  chartGroupsFrom,
  currentObservationFor,
  episodeForReading,
  episodesFrom,
  groupWordKey,
  latestEpisode,
} from "../../app/src/present/episodes.js";

const s = suite("episodes");
const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const code = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

/* An engine answer shaped exactly as the real one: a repeat test of three on
   22 August, resolved to its middle value, and a single test a week earlier. */
function engineWith({ members = ["r1", "r2", "r3"], value = 9.1, count = 3, spread = 1 } = {}) {
  return {
    reasonCodes: [
      { code: "EPISODE_RESOLVED", payload: {
        episodeId: "EP-2026-08-15T09:00:00+00:00",
        episodeAt: "2026-08-15T09:00:00+00:00",
        episodeValueDkh: 8.9, combinedMeasurementCount: 1 } },
      { code: "EPISODE_RESOLVED", payload: {
        episodeId: "EP-2026-08-22T09:07:00+00:00",
        episodeAt: "2026-08-22T09:07:00+00:00",
        episodeValueDkh: value, combinedMeasurementCount: count } },
      { code: "EPISODE_MEASUREMENTS_COMBINED", payload: {
        episodeId: "EP-2026-08-22T09:07:00+00:00",
        combinedMeasurementCount: count,
        memberMeasurementIds: members,
        episodeValueDkh: value, episodeSpreadDkh: spread } },
      { code: "CLUSTER_ANOMALOUS_SPREAD", payload: {
        clusterId: "CL-2026-08-22T09:07:00+00:00", spreadDkh: spread } },
    ],
  };
}

const ROWS = [
  { id: "r0", param: "ALK", value: 8.9, date: "2026-08-15", time: "09:00" },
  { id: "r1", param: "ALK", value: 9.0, date: "2026-08-22", time: "09:06" },
  { id: "r2", param: "ALK", value: 9.1, date: "2026-08-22", time: "09:07" },
  { id: "r3", param: "ALK", value: 10.0, date: "2026-08-22", time: "09:08" },
];

const ALK = { key: "ALK", assessed: true, unit: "dKH" };
const shortLabel = (d) => d.slice(5);

s.test("EP-01", "a repeat test is one chart point, not one per measurement", () => {
  /* FINDING 29. Three measurements typed within two minutes drew three points
     spread along the x-axis, which told the keeper he had tested three times
     over an hour. He tested once, three times over. */
  const index = episodesFrom(engineWith());
  const points = chartGroupsFrom(ROWS, index, shortLabel);
  eq(points.length, 2, "four measurements, two tests");
  const group = points[1];
  eq(group.count, 3, "the group knows how many measurements it holds");
  eq(group.members.length, 3, "and carries every one of them, to be stacked");
  ok(group.grouped, "and says it is a group");
});

s.test("EP-02", "the trend point of a group is the value the engine used, not any measurement", () => {
  const index = episodesFrom(engineWith());
  const points = chartGroupsFrom(ROWS, index, shortLabel);
  eq(points[1].value, 9.1, "the point the line runs through is the resolved value");
  /* The wild 10.0 is on the chart — as a member, stacked — and is not what the
     line is drawn through. Both halves matter: hiding it would be hiding a
     reading the keeper took. */
  ok(points[1].members.some((m) => m.value === 10.0), "the outlying measurement is still drawn");
});

s.test("EP-03", "a group sits at one x-position — the engine's own instant", () => {
  const index = episodesFrom(engineWith());
  const points = chartGroupsFrom(ROWS, index, shortLabel);
  eq(points[1].date, "2026-08-22", "the group's day");
  eq(points[1].time, "09:07", "and the instant the engine resolved it to");
  /* Every member shares that position; none of them keeps its own. */
  eq(new Set(points.map((p) => p.label)).size, points.length, "one label per test");
});

s.test("EP-04", "the card's number and the card's words come from one place", () => {
  /* FINDINGS 26 and 28, in one assertion. The current value is the engine's
     resolved observation — 9.1 — and never the ledger's last row, which is
     10.0 and which is what used to be printed next to "IN RANGE". */
  const index = episodesFrom(engineWith());
  const obs = currentObservationFor(ALK, engineWith(), index, ROWS[ROWS.length - 1]);
  eq(obs.value, 9.1, "the value shown is the value assessed");
  eq(obs.count, 3, "and it says how many measurements stand behind it");
  ok(obs.resolved, "and that the engine resolved it");
});

s.test("EP-05", "a parameter the engine does not assess shows its own last reading, and says so", () => {
  /* Calcium has no engine in this build. The honest answer is the raw record,
     and the caller is told it is raw rather than left to assume it was
     assessed. */
  const CA = { key: "CA", assessed: false, unit: "ppm" };
  const obs = currentObservationFor(CA, engineWith(), episodesFrom(engineWith()),
    { id: "c1", value: 430, date: "2026-08-22", time: "09:00" });
  eq(obs.value, 430, "the reading itself");
  eq(obs.resolved, false, "and it does not claim to have been resolved");
});

s.test("EP-06", "deleting one of a pair recomputes the group from the engine's next answer", () => {
  /* The group is not a stored thing. It is whatever measurements exist inside
     that half hour, and it is read afresh every time. Delete one of two and
     the engine re-forms the episode from the ledger: a group of one, resolved
     to the survivor's value, everywhere. Nothing here patches a cached group,
     which is why this works at all. */
  const pair = episodesFrom(engineWith({ members: ["r2", "r3"], value: 9.55, count: 2, spread: 0.9 }));
  eq(latestEpisode(pair).count, 2, "two measurements before the deletion");

  /* r3 deleted: the engine's next answer names one measurement and its value. */
  const after = episodesFrom({
    reasonCodes: [
      { code: "EPISODE_RESOLVED", payload: {
        episodeId: "EP-2026-08-22T09:07:00+00:00",
        episodeAt: "2026-08-22T09:07:00+00:00",
        episodeValueDkh: 9.1, combinedMeasurementCount: 1 } },
    ],
  });
  const rows = ROWS.filter((r) => r.id !== "r3");
  eq(latestEpisode(after).count, 1, "one measurement after it");
  eq(currentObservationFor(ALK, {}, after, rows[rows.length - 1]).value, 9.1,
    "and the value used is the survivor's");
  const points = chartGroupsFrom(rows, after, shortLabel);
  ok(!points[points.length - 1].grouped, "the chart draws a plain point, not a stack");
});

s.test("EP-07", "the wide spread the engine flagged reaches the group", () => {
  const index = episodesFrom(engineWith());
  const ep = episodeForReading(index, "r2");
  ok(ep.anomalous, "the engine said these repeats disagreed by more than its limit");
  eq(ep.spreadDkh, 1, "and by how much");
});

s.test("EP-08", "the thirty-minute window and the median are the engine's, and are nowhere in this file", () => {
  /* The whole safety of the fix. `MASTER RULE 1`: two implementations that
     agree today are a defect, not a coincidence. If a window or a median ever
     appears here, the app has become a second owner of a canon rule and the
     day the two disagree there is no way to say which is right. */
  const src = fs.readFileSync(path.join(ROOT, "app/src/present/episodes.js"), "utf8");
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "");
  ok(!/\b(30|1800)\b/.test(code), "no window length is written here");
  /* Ordering members is fine — it is what order they were typed in. Doing
     ARITHMETIC over their values is not: that is resolving the group, and the
     engine has already done it. */
  ok(!/\bMath\.|\breduce\(/.test(code), "no arithmetic over the measurements");
  ok(/episodeValueDkh/.test(code) && /combinedMeasurementCount/.test(code),
    "the value and the count are read off the engine's own payload");
});

s.test("EP-09", "how many measurements a test holds is named, not counted at the reader", () => {
  eq(groupWordKey(2), "duplicate", "two");
  eq(groupWordKey(3), "triplicate", "three");
  eq(groupWordKey(6), "many", "more than three");
});

s.test("EP-10", "a group of one is drawn as an ordinary point", () => {
  const index = episodesFrom(engineWith());
  const points = chartGroupsFrom(ROWS, index, shortLabel);
  ok(!points[0].grouped, "the single test on 15 August is not a stack");
  eq(points[0].members.length, 1, "and holds only itself");
});

s.test("EP-11", "\"Change the dose anyway\" names a tab that exists", () => {
  /* FINDING 20. It set the tab to `"settings"`; `NAV` calls it `"setup"`, so
     nothing matched and the screen went blank with only the bar on it. */
  const app = fs.readFileSync(path.join(ROOT, "app/src/App.jsx"), "utf8");
  const constants = fs.readFileSync(path.join(ROOT, "app/src/lib/constants.js"), "utf8");
  const ids = new Set([...constants.matchAll(/\{ id: "([a-z]+)"/g)].map((m) => m[1]));
  for (const m of app.matchAll(/setTab\("([a-z]+)"\)/g)) {
    ok(ids.has(m[1]), `setTab("${m[1]}") names a tab that exists`);
  }
});

/* ============================================================================
   THE RAW READINGS LIST — OWNER FINDINGS 8, 11 AND 27
   ----------------------------------------------------------------------------
   "There is no list of raw readings anywhere in the app." The calendar answers
   "what did I do on this day"; it does not answer "where is that reading I
   typed wrong", and its trash icon deletes the TICK rather than the reading —
   which is why deleting from it changed the due list and nothing else.
   ========================================================================= */

s.test("RL-01", "the Test tab can show every reading of a parameter", () => {
  const lab = code("app/src/components/AllParametersSheet.jsx");
  ok(/readingsNewestFirst\(readings, def\.key\)/.test(lab), "grouped by parameter, as asked");
  ok(/testlab\.showReadings/.test(lab), "with a control that opens it");
  ok(/<ReadingRows/.test(lab), "and a list to open");
});

s.test("RL-02", "every reading in it carries value, date, time and a trash icon", () => {
  const lab = code("app/src/components/AllParametersSheet.jsx");
  const rows = lab.slice(lab.indexOf("function ReadingRows"), lab.indexOf("export function TestLab"));
  ok(/fmtVal\(def, r\.value\)/.test(rows), "the value");
  ok(/fmtShort\(r\.date\)/.test(rows), "the date");
  ok(/fmtTime\(r\.time\)/.test(rows), "the time");
  ok(/<DeleteControl/.test(rows), "and a trash icon");
});

s.test("RL-03", "deleting a reading uses the one control, with its confirmation", () => {
  /* Three implementations of "trash icon, then a confirmation" is three chances
     for one of them to skip the confirmation. */
  const lab = code("app/src/components/AllParametersSheet.jsx");
  ok(!/confirm\(/.test(lab), "no confirmation of its own");
  ok(/delete\.confirm\.reading/.test(lab), "the shared wording");
  const app = code("app/src/App.jsx");
  ok(/onDeleteReading=\{dropReading\}/.test(app), "and the shell's one delete path");
});

s.test("RL-04", "the list is newest first from the ledger, never sorted by date", () => {
  /* The mistake that put the dose history in the wrong order, not repeated. */
  const lab = code("app/src/components/AllParametersSheet.jsx");
  const fn = lab.slice(lab.indexOf("function readingsNewestFirst"), lab.indexOf("function ReadingRows"));
  ok(/rowsFor\(readings, key\)\]\.reverse\(\)/.test(fn), "the ledger's own order, reversed");
  ok(!/\.sort\(/.test(fn), "and no second opinion about which is most recent");
});

s.test("RL-05", "a reading that was one of several says so, and names the figure used", () => {
  /* Otherwise the keeper sees three rows at 09:07 and cannot tell why the card
     above them shows a figure that is none of the three. */
  const lab = code("app/src/components/AllParametersSheet.jsx");
  ok(/episodeForReading\(episodes, r\.id\)/.test(lab), "each row asks whether it was grouped");
  ok(/testlab\.partOf\./.test(lab), "and says so where it was");
  ok(/ep\.valueDkh/.test(lab), "naming the figure the engine used");
});

export default s;
