import { useEffect, useMemo, useState } from 'react'
import { Btn, ParamCard, SectionTitle, inputCls } from './DoseExpectation.jsx'
import { Card } from './ErrorBoundary.jsx'
import { QuickLog } from './LogReadingSheet.jsx'
import { RemindersPanel, TodayPanel } from './TodayPanel.jsx'
import { ZoomableLineChart } from './ZoomableChart.jsx'
import { ChevronDown, ChevronUp, RotateCcw, Save, Settings2, X } from '../icons.jsx'
import { fmtVal } from '../lib/format.js'
import { CalendarModal, ReminderSheet, useEscape } from '../lib/backup.jsx'
import { addDaysFromToday, fmtShort, todayStr } from '../lib/dates.js'
import { chartDataFrom, rowsFor, untimedCount } from '../lib/adapt.js'
import { taskState } from '../store/schedule.js'
import { cardContent } from '../present/card-content.js'
import { describeRows } from '../present/spread.js'

/* ---------------------------------- Dashboard ---------------------------------- */

/* WHAT LEFT THE DASHBOARD, AND ON WHOSE SAY-SO.

   V1's dashboard opened with `OverviewCard`: a tank assessment score, a
   "N things to look at" list and a headline sentence composed by
   `narrative-engine.js`. The brief for this port removes all three. The
   headline in particular "is a real feature and needs engine support that does
   not exist; it is recorded for later and absent for now."

   The out-of-range alert strip went with them. It read `paramStatus` over every
   parameter — the position classifier this port deleted — and there is no
   replacement for seven of the eight parameters, because there is no engine for
   them. Each card carries the engine's own notice instead.

   `deriveTankState` in V1's `App.jsx` fed all of it: sixteen classifiers, four
   dose engines and a stability engine, called from the app root. None of it
   crossed. What the engine says now arrives as one `EngineResult`, and this
   screen reads fields off it without deciding anything.

   All of it is in `docs/migration/PORT-OMISSIONS.md`. */
export function Dashboard({ latestByParam, readings, paramDefs,
  saveRange, resetRange, customRanges, chartEvents, config,
  engineResult, assessmentState = null, scheduleView, tasks = [], completions = [],
  onOpenParam, onOpenTest, onCompleteTask, onNudgeTask,
  remWindow = 14, setRemWindow = () => {},
  onSetTaskDue, onSetTaskInterval, onSkipTask, onUpdateTask,
  onAddReading = null, waterChanges = [] }) {

  const [calOpen, setCalOpen] = useState(false);

  /* A short tail per parameter for the card sparklines — computed once here
     rather than filtering the whole log inside each of eight cards. */
  const sparkRowsByParam = useMemo(() => {
    const m = {};
    for (const d of paramDefs) m[d.key] = rowsFor(readings, d.key).slice(-14);
    return m;
  }, [readings, paramDefs]);

  /* Where each parameter has been lately, so the range bar can show its recent
     travel rather than only where it is now. The window is a fixed number of
     the most recent readings rather than a number of days: a count of rows is
     a fact about the record, where "the last 30 days" would be a cadence
     judgement and cadences are canon's. */
  const recentRangeByParam = useMemo(() => {
    const out = {};
    for (const def of paramDefs) {
      const rows = sparkRowsByParam[def.key] || [];
      if (rows.length < 2) { out[def.key] = null; continue; }
      const vals = rows.map((r) => r.value);
      out[def.key] = { lo: Math.min(...vals), hi: Math.max(...vals), n: vals.length };
    }
    return out;
  }, [sparkRowsByParam, paramDefs]);

  /* The same reschedule sheet the Tasks tab uses, so a task seen on the
     dashboard calendar can be moved without navigating away. */
  const [sheetId, setSheetId] = useState(null);
  const sheetTask = sheetId ? (tasks || []).find((r) => r.id === sheetId) : null;
  const sheetState = sheetTask ? taskState(sheetTask, completions, todayStr()) : null;

  return (
    <div>
      <SectionTitle eyebrow="Reef status" title="Dashboard" />

      {/* The due bar. Collapsed to one line, expanding into a row per due or
          upcoming item, each of which takes its reading in place. V1's own
          note on why: "going to another tab to type one number was the most
          repeated friction in the app." */}
      <TodayPanel view={scheduleView} onOpenTest={onOpenTest}
        onComplete={onCompleteTask} onNudge={onNudgeTask} onPickTask={setSheetId}
        paramDefs={paramDefs} onAddReading={onAddReading} />

      {/* Cards vary in height — some have a notice, some have no data at all —
          so the grid items stretch and each card fills its cell. The date is
          pushed to the bottom so it sits on one line across the row rather
          than floating wherever the content above happens to end.

          Alkalinity is first because it is first in the ledger's parameter
          list, and it is a tile like the others rather than a full-width card. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8 items-stretch">
        {paramDefs.map((def) => {
          const content = cardContent(def, engineResult, assessmentState);
          return (
            <ParamCard key={def.key} def={def} reading={latestByParam[def.key]}
              recent={recentRangeByParam[def.key]}
              position={content.position}
              statusLine={content.statusLine}
              direction={content.direction}
              notice={content.notice}
              rows={sparkRowsByParam[def.key]}
              onLog={onOpenTest}
              onOpen={() => onOpenParam(def.key)} />
          );
        })}
      </div>

      <SectionTitle eyebrow="Schedule" title="Reminders" />
      <RemindersPanel view={scheduleView} windowDays={remWindow} setWindowDays={setRemWindow}
        onOpenTest={onOpenTest} onComplete={onCompleteTask} onNudge={onNudgeTask}
        onPickTask={setSheetId}
        onOpenCalendar={() => setCalOpen(true)} />

      {calOpen && (
        <CalendarModal taskLog={completions} reminders={tasks} waterChanges={waterChanges}
          onPickTask={setSheetId}
          onClose={() => setCalOpen(false)} />
      )}

      {sheetTask && (
        <ReminderSheet rem={sheetTask} state={sheetState} onClose={() => setSheetId(null)}
          onSetDue={(id, d) => { onSetTaskDue(id, d); setSheetId(null); }}
          onSetInterval={(id, n) => { onSetTaskInterval(id, n); setSheetId(null); }}
          onComplete={(id) => { onCompleteTask(id); setSheetId(null); }}
          onSkip={(id) => { onSkipTask(id); setSheetId(null); }}
          onToggleEnabled={(id, on) => { onUpdateTask(id, { enabled: on }); setSheetId(null); }} />
      )}

    </div>
  );
}

/* ---------------------------------- the parameter detail sheet ---------------------------------- */

/* V1's `ParamHistoryModal`, ported, and identical for every parameter.

   Three things left it, each for a stated reason.

   THE WEEKLY-DRIFT ROW. Removed by the brief: "it is a trend claim and the
   engine owns trends". V1 computed it from `computeRates` and narrated it in
   two paragraphs; both went with it. The statistics box has two rows now, not
   three.

   THE CONSUMPTION AND DOSING BLOCK. V1's own `computeElementConsumption`
   worked out what the tank was using and what to dose about it, inside this
   component. That belongs in Dosing, where V2's engine says it.

   `computeControl`. V1's verdict engine — a headline, a graded consistency, a
   pattern classification, a paragraph and a proposed replacement target range,
   all decided here. Deleted. What is left is `describeRows` in
   `app/src/present/spread.js`: minimum, maximum, median, spread and a count
   against the keeper's own range, with no grade and no sentence.

   `docs/migration/PORT-OMISSIONS.md` records all of it. */
export function ParamHistoryModal({ def, readings, onClose, onSaveRange, onResetRange, isCustom,
  chartEvents = [], onAddReading = null, notice = null, onGoDosing = null }) {
  const [editing, setEditing] = useState(false);
  const [minVal, setMinVal] = useState(def.min == null ? "" : String(def.min));
  const [maxVal, setMaxVal] = useState(def.max == null ? "" : String(def.max));
  const [rangeMsg, setRangeMsg] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => {
    setMinVal(def.min == null ? "" : String(def.min));
    setMaxVal(def.max == null ? "" : String(def.max));
  }, [def.min, def.max]);

  const commitRange = async () => {
    const lo = parseFloat(minVal), hi = parseFloat(maxVal);
    if (isNaN(lo) || isNaN(hi)) { setRangeMsg("Enter two numbers."); return; }
    if (lo >= hi) { setRangeMsg("Minimum must be below maximum."); return; }
    await onSaveRange(def.key, lo, hi);
    setRangeMsg("Target range updated.");
    setEditing(false);
    setTimeout(() => setRangeMsg(""), 2500);
  };

  const revert = async () => {
    await onResetRange(def.key);
    setRangeMsg("Range cleared.");
    setEditing(false);
    setTimeout(() => setRangeMsg(""), 2500);
  };

  const [winDays, setWinDays] = useState(null);

  const allRows = useMemo(() => rowsFor(readings, def.key), [readings, def.key]);

  /* Four windows, always four, so the strip's layout never changes. V1 picked
     between two sets of windows using `def.freqDays` — a per-parameter test
     cadence, which is chemistry and did not come across. One set is used for
     every parameter now, and "All" still covers the long view. */
  const WINDOWS = [[7, "7d"], [30, "30d"], [90, "90d"], [99999, "All"]];

  const rowsInWindow = (days) => {
    if (days >= 99999) return allRows;
    const cutoff = addDaysFromToday(-days);
    return allRows.filter((r) => r.date >= cutoff);
  };

  const range = def.min != null && def.max != null ? { min: def.min, max: def.max } : null;

  /* Every window at once, so "tight recently, wide historically" reads as one
     story rather than two boxes appearing to disagree. */
  const windowStats = useMemo(
    () => WINDOWS.map(([d, label]) => ({ days: d, label, c: describeRows(rowsInWindow(d), range) })),
    [allRows, def.key, def.min, def.max]);

  /* Open on the shortest window that has anything in it. Testing cadence
     changes over time, so a fixed default can land on an empty view. */
  const defaultWin = useMemo(() => {
    const usable = windowStats.find((w) => w.c);
    return usable ? usable.days : WINDOWS[1][0];
  }, [windowStats]);

  const [detailOpen, setDetailOpen] = useState(false);
  const activeWin = winDays == null ? defaultWin : winDays;
  const winLabel = activeWin >= 99999 ? "your whole log"
    : activeWin === 7 ? "the last 7 days"
    : `the last ${activeWin} days`;

  useEffect(() => { setWinDays(null); }, [def.key]);

  /* Everything below is scoped to the selected window, so the figures and the
     chart describe the same slice of time. */
  const rows = useMemo(() => rowsInWindow(activeWin), [allRows, activeWin]);
  const stats = useMemo(() => describeRows(rows, range), [rows, def.min, def.max]);

  /* Dose markers are tagged with their parameter, so a calcium doser change
     does not clutter the alkalinity chart. Untagged events — water changes,
     lighting, ICP — remain relevant to every parameter. */
  const relevantEvents = useMemo(
    () => chartEvents.filter((ev) => !ev.param || ev.param === def.key),
    [chartEvents, def.key]);

  const chartData = chartDataFrom(rows, fmtShort);
  const untimed = untimedCount(rows);

  useEscape(onClose);

  return (
    <div className="fixed inset-0 bg-[#08191D]/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
        <Card className="p-5 max-h-[85vh] overflow-y-auto">

          {/* The notice sits at the top, as V1's dose banner did, and carries
              V2's wording: the engine's own reason code, worded by the strings
              file. Expandable, because the strip has room for a line and the
              engine often has more than a line to say. */}
          {notice && (
            <div className="rounded-xl p-3 mb-4"
              style={{ background: notice.tone + "10", border: `1px solid ${notice.tone}33` }}>
              <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1"
                style={{ color: notice.tone }}>
                {notice.severityWord}
              </div>
              <div className="text-[13px] font-black text-ink mb-1">{notice.title}</div>
              {noticeOpen && (
                <p className="text-[12px] text-ink font-medium leading-relaxed">{notice.detail}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5">
                <button onClick={() => setNoticeOpen((v) => !v)}
                  className="text-[11px] font-extrabold" style={{ color: notice.tone }}>
                  {noticeOpen ? "Hide detail" : "What this means"}
                </button>
                {/* Only where the engine's own output identifies a dose
                    recommendation. Anything else has no destination, and the
                    strip is inert rather than guessing one. */}
                {notice.goDosing && onGoDosing && (
                  <button onClick={onGoDosing}
                    className="text-[11px] font-extrabold" style={{ color: notice.tone }}>
                    Open Dosing →
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold mb-1">History</div>
              <h2 className="text-2xl font-display text-ink">{def.label}</h2>
              <div className="text-[11px] text-ink2 font-bold mt-0.5">
                {range
                  ? `target range ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}${def.unit}`
                  : "no target range set"} · {rows.length} of {allRows.length} readings
                {isCustom && <span className="ml-1 text-teal-brand">· custom</span>}
              </div>
              <button onClick={() => setEditing((v) => !v)} className="mt-1.5 text-[11px] font-extrabold text-teal-brand flex items-center gap-1">
                <Settings2 size={12} /> {editing ? "Cancel" : "Edit target range"}
              </button>
            </div>
            <button aria-label="Close" onClick={onClose} className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-app"><X size={22} /></button>
          </div>

          {editing && (
            <div className="rounded-xl bg-app border border-app p-3 mb-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-2">Set target range ({def.unit || "value"})</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="min-w-0">
                  <span className="block text-[11px] font-bold text-ink2 mb-1">Minimum</span>
                  <input type="number" inputMode="decimal" step={def.step} value={minVal} onChange={(e) => setMinVal(e.target.value)} className={inputCls} />
                </label>
                <label className="min-w-0">
                  <span className="block text-[11px] font-bold text-ink2 mb-1">Maximum</span>
                  <input type="number" inputMode="decimal" step={def.step} value={maxVal} onChange={(e) => setMaxVal(e.target.value)} className={inputCls} />
                </label>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Btn onClick={commitRange} className="flex-1 sm:flex-none"><span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span></Btn>
                {isCustom && <Btn variant="ghost" onClick={revert} className="flex-1 sm:flex-none"><span className="flex items-center justify-center gap-1.5"><RotateCcw size={13} /> Clear</span></Btn>}
              </div>
              {/* V1 said this changed "the in-range check, the dashboard gauge
                  and the shaded band". Two of those three no longer exist as
                  V1 meant them: the range is the keeper's own and governs
                  nothing outside alkalinity, where it is an engine input. */}
              <p className="text-[11px] text-ink2 font-medium mt-2">
                {def.assessed
                  ? "This is one of the numbers the engine works from, so changing it changes what it recommends. Every assessment already stored keeps the range it was made against."
                  : "This is your own range. It is drawn on the charts and counted in the figures above, and nothing else reads it."}
              </p>
            </div>
          )}

          {rangeMsg && <div className="text-[11px] font-extrabold text-teal-brand mb-3">{rangeMsg}</div>}

          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-[0.13em] font-extrabold text-ink2 mb-1.5">
              Movement by period · tap to view
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {windowStats.map(({ days, label, c }) => {
                const active = activeWin === days;
                return (
                  <button key={label} onClick={() => setWinDays(days)}
                    className={`text-left px-2.5 py-2 rounded-xl border-2 transition-colors ${
                      active ? "border-teal-brand bg-teal-50" : "border-app bg-white"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c ? def.color : "#C7D6D3" }} />
                      <span className={`text-[11px] font-extrabold ${active ? "text-teal-brand" : "text-ink"}`}>{label}</span>
                    </div>
                    <div className="text-[11px] font-bold text-ink mt-0.5 truncate">
                      {c ? `${fmtVal(def, c.spread)}${def.unit} spread` : "no data"}
                    </div>
                    <div className="text-[10px] font-semibold text-ink2">
                      {c ? (c.pct == null ? `${c.n} reading${c.n === 1 ? "" : "s"}` : `${c.pct}% in range`) : "—"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="py-10 text-center text-ink2 font-semibold text-sm">No readings for {def.labelMid || def.label.toLowerCase()} in this window</div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[["Latest", stats.latest], ["Min", stats.min], ["Max", stats.max], ["Median", stats.median]].map(([label, v]) => (
                  <div key={label} className="text-center min-w-0">
                    <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">{label}</div>
                    <div className="text-lg font-black text-ink mt-0.5 truncate">{fmtVal(def, v)}{def.unit}</div>
                  </div>
                ))}
              </div>

              {/* TWO ROWS. V1 had three, and the third — weekly drift — was a
                  trend claim. Neither row here carries a grade: the spread is
                  the spread, and the count is a count. */}
              <div className="rounded-xl p-3 mb-4" style={{ background: def.color + "12", border: `1px solid ${def.color}40` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: def.color }}>
                    {winLabel}
                  </span>
                  <span className="text-[12px] font-black text-ink">
                    usually {fmtVal(def, stats.p05)}–{fmtVal(def, stats.p95)}{def.unit}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Consistency</span>
                  <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
                    <div className="h-full rounded-full" style={{ width: "100%", background: def.color + "55" }} />
                  </div>
                  <span className="text-[10px] font-bold w-24 text-right shrink-0" style={{ color: def.color }}>
                    {fmtVal(def, stats.spread)}{def.unit} spread
                  </span>
                </div>

                {stats.pct == null ? (
                  <div className="text-[10px] text-ink2 font-semibold mt-1">
                    No target range set for {def.labelMid || def.label.toLowerCase()}, so there is nothing to count these against.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">In range</span>
                      <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
                        <div className="h-full rounded-full" style={{ width: `${stats.pct}%`, background: def.color }} />
                      </div>
                      <span className="text-[10px] font-bold text-ink2 w-16 text-right shrink-0">{stats.pct}%</span>
                    </div>
                    <div className="text-[10px] text-ink2 font-semibold mt-1 ml-[88px]">
                      {stats.inRange} of {stats.n} inside your own range{stats.below > 0 && ` · ${stats.below} below`}{stats.above > 0 && ` · ${stats.above} above`}
                    </div>
                  </>
                )}

                <button onClick={() => setDetailOpen((v) => !v)}
                  className="w-full flex items-center justify-center gap-1 mt-2 pt-2 border-t"
                  style={{ borderColor: def.color + "26" }}>
                  <span className="text-[11px] font-extrabold" style={{ color: def.color }}>
                    {detailOpen ? "Hide detail" : "Where these figures come from"}
                  </span>
                  {detailOpen
                    ? <ChevronUp size={12} style={{ color: def.color }} />
                    : <ChevronDown size={12} style={{ color: def.color }} />}
                </button>

                {detailOpen && (
                  <p className="text-[12px] text-ink font-medium leading-relaxed mt-2">
                    These are counted straight off your readings for {winLabel} — the spread is the
                    highest minus the lowest, and the range count is against the two numbers you set.
                    {def.assessed
                      ? " What the readings mean is on the Dosing tab, where the engine says it."
                      : " Nothing here says what they mean; there is no engine for this parameter yet."}
                  </p>
                )}
              </div>

              {/* Logging sits between the figures and the chart: you read where
                  it stands, record the new reading, and see it land. */}
              {onAddReading && (
                <QuickLog def={def} onAdd={onAddReading} />
              )}

              <ZoomableLineChart data={chartData} color={def.color}
                paramName={def.label} unit={def.unit}
                targetRangeMin={range ? def.min : null} targetRangeMax={range ? def.max : null}
                height={280} events={relevantEvents} />

              {/* ONE note, beneath the chart, and never a marker per point. The
                  readings are drawn as ordinary points on an ordinary line
                  because that is what they are; whether the engine can use one
                  for a trend is the engine's business, not the chart's. */}
              {untimed > 0 && (
                <p className="text-[11px] text-ink2 font-medium mt-2">
                  {untimed} of these {rows.length} readings were recorded with a date and no time.
                </p>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
