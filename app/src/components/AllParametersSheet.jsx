import { useMemo, useState } from 'react'
import { DeleteControl } from './DeleteControl.jsx'
import { Card } from './ErrorBoundary.jsx'
import { ZoomableLineChart } from './ZoomableChart.jsx'
import { Check, ChevronDown, ChevronUp, X } from '../icons.jsx'
import { fmtVal, fmtTime } from '../lib/format.js'
import { nowTime } from '../lib/clock.js'
import { useEscape } from '../lib/backup.jsx'
import { addDaysFromToday, fmtShort, todayStr } from '../lib/dates.js'
import { rowsFor } from '../lib/adapt.js'
import { chartGroupsFrom, currentObservationFor, episodeForReading, groupWordKey } from '../present/episodes.js'
import { t } from '../strings.js'

/* --- Enter every parameter on one screen ---
 *
 * The old form had a dropdown, so recording six tests meant six round trips
 * through a select. Every parameter is listed instead: type the value, press
 * Log, move on. The date applies to all of them, since a testing session
 * happens at one sitting.
 */
/* This parameter's readings, newest first.

   `rowsFor` is the app's one answer to "this parameter's readings, in order",
   and the ledger's order is the app's one answer to which is most recent — so
   this reverses that rather than sorting on a date, which is the mistake that
   put the dose history in the wrong order. */
function readingsNewestFirst(readings, key) {
  return [...rowsFor(readings, key)].reverse();
}

/* Value, date, time and a trash icon each — the owner's own list.

   A reading that was one of several taken close together says so, because
   otherwise the keeper sees three rows at 09:07 and cannot tell why the card
   above shows a figure that is none of them. Deleting one recomputes the group
   from the ledger: the engine forms the episode again from what is left, and
   every surface follows. Nothing here is cached and nothing is patched. */
function ReadingRows({ rows, def, episodes, onDelete }) {
  if (!rows.length) {
    return (
      <p className="text-[12px] font-medium text-ink2 px-1 pb-2 pt-1">
        {t("testlab.noReadings", { parameter: def.labelMid || def.label.toLowerCase() })}
      </p>
    );
  }
  return (
    <div className="space-y-1 pt-2 pb-1">
      {rows.map((r) => {
        const ep = episodeForReading(episodes, r.id);
        const grouped = !!(ep && ep.count > 1);
        return (
          <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-app px-2.5 py-2">
            <span className="text-[13px] font-black text-ink tabular-nums shrink-0">
              {fmtVal(def, r.value)}
              <span className="text-ink2 font-bold text-[11px] ml-0.5">{def.unit}</span>
            </span>
            <span className="text-[11px] font-bold text-ink2 flex-1 min-w-0">
              {fmtShort(r.date)}{fmtTime(r.time) ? ` · ${fmtTime(r.time)}` : ""}
              {grouped && (
                <span className="block text-[10px] font-bold" style={{ color: def.color }}>
                  {t(`testlab.partOf.${groupWordKey(ep.count)}`, {
                    count: ep.count, value: fmtVal(def, ep.valueDkh), unit: def.unit })}
                </span>
              )}
            </span>
            {onDelete && (
              <DeleteControl onDelete={() => onDelete(r.id)}
                label={t("delete.aria.reading", { date: fmtShort(r.date) })}
                ask={t("delete.confirm.reading")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TestLab({ paramDefs, readings, onAdd, onOpenParam, scheduleView = null,
  episodes = null, onDeleteReading = null }) {
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTime());
  const [values, setValues] = useState({});
  /* Which parameter's readings are showing. One at a time: eight open lists on
     a phone is a page nobody can find anything in. */
  const [openKey, setOpenKey] = useState(null);

  const setVal = (k, v) => setValues((p) => ({ ...p, [k]: v }));

  const latest = useMemo(() => {
    const m = {};
    for (const d of paramDefs) {
      const rows = rowsFor(readings, d.key);
      m[d.key] = rows.length ? rows[rows.length - 1] : null;
    }
    return m;
  }, [readings, paramDefs]);

  const log = async (def) => {
    const raw = values[def.key];
    if (raw === undefined || raw === "") return;
    const v = parseFloat(raw);
    if (!isFinite(v)) return;
    await onAdd({ param: def.key, value: v, date, time });
    setVal(def.key, "");

  };

  /* Progress for the chosen date: how many parameters that were due have been
     tested. Anything not due doesn't count against you. */
  const { sessionDue, sessionDone } = useMemo(() => {
    let due = 0, done = 0;
    for (const def of paramDefs) {
      const st = scheduleView && scheduleView.states.find(
        (x) => x.task.parameter === def.key && x.task.kind === "TEST");
      const rows = rowsFor(readings, def.key);
      const testedOnDate = rows.some((r) => r.date === date);
      const wasDue = st && st.daysOut <= 0;
      if (wasDue || testedOnDate) due += 1;
      if (testedOnDate) done += 1;
    }
    return { sessionDue: due, sessionDone: done };
  }, [paramDefs, readings, date, scheduleView]);

  const dueFor = (key) => {
    if (!scheduleView) return null;
    const st = scheduleView.states.find((x) => x.task.parameter === key && x.task.kind === "TEST");
    return st || null;
  };

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="p-4 border-b border-app">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="text-[13px] font-black text-ink">Log your readings</div>
            <div className="text-[11px] text-ink2 font-semibold">Tap a name to see its graph</div>
          </div>
          {/* How much of this session is done. Only the parameters that were
              actually due count, so a full bar means finished rather than
              "everything tested regardless of schedule". */}
          {sessionDue > 0 && (
            <div className="shrink-0 text-right">
              <div className="text-[13px] font-black" style={{ color: sessionDone >= sessionDue ? "#0B7C86" : "#45605F" }}>
                {sessionDone}/{sessionDue}
              </div>
              <div className="text-[9px] font-extrabold uppercase tracking-wide text-ink2">due done</div>
            </div>
          )}
        </div>

        {sessionDue > 0 && (
          <div className="h-1.5 rounded-full overflow-hidden mb-2.5" style={{ background: "#0B7C8618" }}>
            <div className="h-full rounded-full"
              style={{ width: `${(sessionDone / sessionDue) * 100}%`, background: "#0B7C86",
                       transition: "width 600ms cubic-bezier(.2,.8,.3,1)" }} />
          </div>
        )}

        {sessionDue > 0 && sessionDone < sessionDue && (
          <div className="flex items-center gap-3 mb-2.5">
            {[["#1D6FA5", "due today"], ["#A2621B", "overdue"], ["#0B7C86", "done"]].map(([c, label]) => (
              <span key={label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm" style={{ background: c }} />
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-ink2">{label}</span>
              </span>
            ))}
          </div>
        )}

        {sessionDue > 0 && sessionDone >= sessionDue && (
          <div className="rounded-lg px-3 py-2 mb-2.5 flex items-center gap-2" style={{ background: "#0B7C8614" }}>
            {/* V1 put a party emoji here. The brief: "No emojis. No green
                tick, no confetti, no stars. Keep it professional." The
                completion state stays; the confetti does not. */}
            <Check size={14} strokeWidth={3} style={{ color: "#0B7C86" }} />
            <span className="text-[12px] font-extrabold" style={{ color: "#0B7C86" }}>
              Everything due today is done.
            </span>
          </div>
        )}
        {/* One date and time for the whole session, on their own row so both
            are comfortably usable. Editable because a reading written down at
            10pm and entered next morning belongs at 10pm — alkalinity moves
            through the day. */}
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-ink2">Date</span>
            <input type="date" value={date} max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-0.5 rounded-lg border border-app bg-white px-2 py-2 text-[13px] font-bold text-ink" />
          </label>
          <label className="block">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-ink2">Time</span>
            <input type="time" value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full mt-0.5 rounded-lg border border-app bg-white px-2 py-2 text-[13px] font-bold text-ink" />
          </label>
        </div>
      </div>

      <div className="divide-y divide-app">
        {paramDefs.map((def) => {
          const last = latest[def.key];
          const st = dueFor(def.key);
          const filled = values[def.key] !== undefined && values[def.key] !== "";
          /* Tested today: the row reads as ticked off rather than merely
             carrying a small line of grey text saying when it last was. */
          const doneToday = last && last.date === date;
          /* Three states worth telling apart at a glance: waiting for you,
             already done, and not on today's list at all. A left stripe marks
             the first two so the "due done" count has something to point at. */
          const overdue = !doneToday && st && st.daysOut < 0;
          const dueNow = !doneToday && st && st.daysOut === 0;
          const stripe = doneToday ? "#0B7C86" : overdue ? "#A2621B" : dueNow ? "#1D6FA5" : "transparent";
          const rowBg = doneToday ? "#0B7C860E" : overdue ? "#A2621B0D" : dueNow ? "#1D6FA50A" : undefined;
          const idle = !doneToday && !overdue && !dueNow;
          return (
            <div key={def.key} className="px-3 py-2.5 transition-colors"
              style={{ background: rowBg, borderLeft: `3px solid ${stripe}`,
                       opacity: idle ? 0.62 : 1 }}>
              <div className="flex items-center gap-2">
                <button onClick={() => onOpenParam(def.key)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    {doneToday ? (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 tp-tick"
                        style={{ background: "#0B7C86" }}>
                        <Check size={10} strokeWidth={4} color="#fff" />
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full shrink-0 ml-1" style={{ background: def.color }} />
                    )}
                    <span className="text-[14px] font-black truncate"
                      style={{ color: doneToday ? "#0B7C86" : "#08191D" }}>{def.label}</span>
                    {(overdue || dueNow) && (
                      <span className="shrink-0 rounded-full px-1.5 py-[1px] text-[9px] font-extrabold uppercase tracking-wide"
                        style={{ background: overdue ? "#A2621B22" : "#1D6FA51F",
                                 color: overdue ? "#A2621B" : "#1D6FA5" }}>
                        {overdue ? `${Math.abs(st.daysOut)}d late` : "Due"}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-semibold truncate"
                    style={{ color: doneToday ? "#0B7C86" : "#45605F" }}>
                    {doneToday ? (
                      <span className="font-extrabold">
                        Done · {fmtVal(def, last.value)}{def.unit}
                        {fmtTime(last.time) ? ` at ${fmtTime(last.time)}` : ""}
                      </span>
                    ) : (
                      <>
                        {last
                          ? `last ${fmtVal(def, last.value)}${def.unit} · ${fmtShort(last.date)}${fmtTime(last.time) ? ` ${fmtTime(last.time)}` : ""}`
                          : "no readings yet"}
                        {st && st.daysOut > 0 && (
                          <span className="ml-1">· next {fmtShort(st.due)}</span>
                        )}
                      </>
                    )}
                  </div>
                </button>

                <input type="number" inputMode="decimal" step={def.step}
                  value={values[def.key] ?? ""} onChange={(e) => setVal(def.key, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") log(def); }}
                  placeholder={def.unit}
                  className="w-20 shrink-0 rounded-lg border border-app bg-white px-2 py-1.5 text-[14px] font-bold text-ink text-right" />

                <button onClick={() => log(def)} disabled={!filled}
                  className="shrink-0 rounded-lg px-3 py-2 text-[12px] font-extrabold transition-colors"
                  style={filled
                    ? { background: def.color, color: "#fff" }
                    : doneToday
                    ? { background: "transparent", color: "#0B7C8699", border: "1px solid #0B7C8633" }
                    : { background: "#EDF3F2", color: "#9FB0AE" }}>
                  {doneToday && !filled ? "Again" : "Log"}
                </button>

                {/* OWNER FINDINGS 8, 11 AND 27 — THE RAW READINGS, REACHABLE.

                    There was no list of readings anywhere he could get to. The
                    calendar answers "what did I do on this day"; it does not
                    answer "where is that reading I typed wrong", and its trash
                    icon deletes the TICK rather than the reading — which is why
                    deleting from it changed one surface and nothing else.

                    So the readings live here, under the parameter they belong
                    to, which is how he asked for them: expand a parameter, see
                    its own readings newest first. */}
                <button onClick={() => setOpenKey(openKey === def.key ? null : def.key)}
                  aria-label={t(openKey === def.key ? "testlab.hideReadings" : "testlab.showReadings",
                    { parameter: def.labelMid || def.label.toLowerCase() })}
                  aria-expanded={openKey === def.key}
                  className="shrink-0 p-1.5 rounded-lg text-ink2 active:bg-app">
                  {openKey === def.key ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>

              {openKey === def.key && (
                <ReadingRows rows={readingsNewestFirst(readings, def.key)} def={def}
                  episodes={episodes} onDelete={onDeleteReading} />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* Every chart in one place, stripped of commentary — for when you want to scan
   the tank's whole history rather than study one parameter. */
export function AllGraphsModal({ paramDefs, readings, chartEvents, onClose, onOpenParam, episodes = null }) {
  useEscape(onClose);
  /* One window setting for every chart, so they're comparable at a glance —
     charts on different timescales invite the wrong conclusion. */
  const [win, setWin] = useState(30);
  const cutoff = win >= 9999 ? null : addDaysFromToday(-win);

  const series = paramDefs
    .map((def) => ({
      def,
      data: chartGroupsFrom(
        rowsFor(readings, def.key).filter((r) => !cutoff || r.date >= cutoff), episodes, fmtShort),
    }))
    .filter((x) => x.data.length >= 2);

  return (
    <div className="fixed inset-0 bg-[#08191D]/60 z-50 flex items-end sm:items-center justify-center sm:p-4 sheet-layer"
      onClick={onClose}>
      <div className="bg-app w-full sm:max-w-2xl sheet-panel overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {/* The header sticks, so the window control stays reachable however far
            you scroll without floating over the charts. */}
        <div className="sticky top-0 bg-app px-4 pt-4 pb-2.5 z-10 border-b border-app">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold">At a glance</div>
              <h2 className="text-xl font-display text-ink">Parameter overview</h2>
            </div>
            <button aria-label="Close" onClick={onClose}
              className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-white/60"><X size={20} /></button>
          </div>
          <div className="flex gap-1.5">
            {[[7, "7d"], [14, "14d"], [30, "30d"], [90, "90d"], [9999, "All"]].map(([d, lbl]) => (
              <button key={d} onClick={() => setWin(d)}
                className="flex-1 rounded-lg py-1.5 text-[11px] font-extrabold border-2 transition-colors"
                style={{ borderColor: win === d ? "#0B7C86" : "#E3ECEA",
                         color: win === d ? "#0B7C86" : "#45605F",
                         background: win === d ? "#0B7C8610" : "#fff" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {series.length === 0 ? (
            <p className="text-[13px] text-ink2 font-medium">
              Nothing has two or more readings in the last {win >= 9999 ? "of your log" : `${win} days`}. Try a wider window.
            </p>
          ) : series.map(({ def, data }) => (
            <Card key={def.key} className="p-3">
              <button onClick={() => { onClose(); onOpenParam(def.key); }}
                className="flex items-center justify-between w-full gap-2 mb-1">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: def.color }} />
                  <span className="text-[13px] font-black text-ink truncate">{def.label}</span>
                </span>
                <span className="text-[11px] font-bold text-ink2 shrink-0">
                  {fmtVal(def, data[data.length - 1].value)}{def.unit}
                  {def.min != null && def.max != null
                    ? ` · target range ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}`
                    : ""}
                </span>
              </button>
              <ZoomableLineChart data={data} color={def.color}
                paramName={def.label} unit={def.unit}
                targetRangeMin={def.min} targetRangeMax={def.max}
                height={150} events={chartEvents.filter((ev) => !ev.param || ev.param === def.key)} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
