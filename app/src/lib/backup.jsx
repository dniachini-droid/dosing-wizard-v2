import { useEffect, useMemo, useState } from 'react'
import { Btn, Field, inputCls } from '../components/DoseExpectation.jsx'
import { Card } from '../components/ErrorBoundary.jsx'
import { Check, ChevronDown, Save, Settings2, X } from '../icons.jsx'
import { DeleteControl } from '../components/DeleteControl.jsx'
import { fmtVal, fmtFriendly } from './format.js'
import { t } from '../strings.js'
import { positionTone, positionWord, positionIsInRange } from '../present/position.js'
import { todayStr, fmtShort } from './dates.js'
import { addDays, now as appNow } from '../store/time.js'
import { intervalLabel, projectOccurrences } from '../store/schedule.js'

/* ============================================================================
   WHAT IS LEFT OF V1's `backup.jsx`
   ----------------------------------------------------------------------------
   The first 344 lines of V1's file were backup, restore and merge:
   `BACKUP_KEYS`, `NATURAL_KEYS`, `planMerge`, `rangeConflicts`,
   `inspectBackup`, `restoreBackup`, `downloadJson`, `downloadCsv`. None of it
   crossed. It reads and writes V1's own `localStorage` keys, and V2's storage
   is not going anywhere — the brief keeps "the append-only event ledger,
   stored assessments with their version stamps, the configuration versioning,
   and the import" exactly as they are.

   What is here is the part that was never about backup at all, and only lived
   in this file because that is where somebody put it. The salvage inventory
   makes the point in its own words: these components are "scattered across four
   files whose names describe something else entirely — a component's home file
   says nothing about what it is."

   They are kept under V1's path so the port is a port. That the path is a
   misnomer is V1's, and moving them would have made every line of every one of
   them a difference with no reason.
   ========================================================================= */

/* THE RANGE BAR.

   V1 called `paramStatus(def, value)` on its first line and coloured itself
   from the answer — a position classifier inside a presentation component,
   which is the violation canon `X-INV-004` names. It is gone. `position` is
   now a PROP: the value V2's engine emitted, passed down, or `null` where no
   engine has an opinion.

   That null is the ordinary case rather than the exception. This build
   assesses alkalinity; for calcium, magnesium, nitrate, phosphate, salinity,
   pH and potassium there is no engine, so there is no position, and the bar
   draws the keeper's own range and the reading's place in it without saying a
   word about what that means. Inventing the word here would be inventing
   chemistry. Recorded in `docs/migration/PORT-OMISSIONS.md`.

   `def.min` and `def.max` may also be absent, because this build ships no
   range it cannot source. With no range there is no band to draw, and the bar
   falls back to the span of what has actually been measured. */
export function ParamGauge({ def, value, recent, position = null, compact = false }) {
  const color = positionTone(position);
  const word = positionWord(position);
  const has = value != null && !isNaN(value);
  const banded = Number.isFinite(def.min) && Number.isFinite(def.max);

  /* The scale must contain the band, the current value and the recent range,
     with a little air so a marker at the extreme isn't clipped. */
  const pts = banded ? [def.min, def.max] : [];
  if (has) pts.push(value);
  if (recent && recent.lo != null) pts.push(recent.lo, recent.hi);
  if (!pts.length) pts.push(0, 1);
  const rawLo = Math.min(...pts), rawHi = Math.max(...pts);
  const span = rawHi - rawLo || Math.abs(rawHi) * 0.2 || 1;
  const lo = rawLo - span * 0.18, hi = rawHi + span * 0.18;
  const pos = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));

  const bandL = banded ? pos(def.min) : null, bandR = banded ? pos(def.max) : null;
  const valPos = has ? pos(value) : null;

  return (
    <div className="w-full">
      {/* The card draws its own value now, so the gauge does not repeat it. */}
      {!compact && (
        <div className="flex items-baseline justify-center gap-1 mb-2">
          <span className="font-black text-[26px] text-ink leading-none tabular-nums">
            {has ? fmtVal(def, value) : "\u2014"}
          </span>
          <span className="text-[11px] font-bold text-ink2">{def.unit}</span>
        </div>
      )}

      <div className="relative w-full" style={{ height: compact ? 16 : 22 }}>
        {/* Full scale */}
        <div className="absolute rounded-full" style={{ left: 0, right: 0, top: compact ? 6 : 9, height: compact ? 4 : 5, background: "#E9EFEE" }} />

        {/* Target range — the only region that should read as "good" */}
        {banded && (
          <div className="absolute rounded-full"
            style={{ left: `${bandL}%`, width: `${Math.max(2, bandR - bandL)}%`,
                     top: compact ? 6 : 9, height: compact ? 4 : 5,
                     background: has && positionIsInRange(position) ? color + "55" : "#C8D6D4" }} />
        )}

        {/* Where the parameter has been recently, so spread is visible at a glance */}
        {recent && recent.lo != null && recent.hi > recent.lo && (
          <div className="absolute rounded-full"
            style={{ left: `${pos(recent.lo)}%`, width: `${Math.max(1.5, pos(recent.hi) - pos(recent.lo))}%`,
                     top: compact ? 4 : 6, height: compact ? 8 : 11, background: color + "22" }} />
        )}

        {/* Current reading */}
        {valPos != null && (
          <div className="absolute" style={{ left: `${valPos}%`, top: compact ? 1 : 2, transform: "translateX(-50%)" }}>
            <div className="rounded-full ring-2 ring-white shadow-sm"
              style={{ width: compact ? 9 : 11, height: compact ? 14 : 17, background: color }} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[9px] font-bold text-ink2 tabular-nums">{banded ? fmtVal(def, def.min) : ""}</span>
        {/* The word is the ENGINE's position, looked up in the strings file —
            `IN RANGE`, `ABOVE RANGE`, `BELOW RANGE`. V1 said "in band" here
            and worked the answer out itself. Where there is no position there
            is no word, and the row still reads because the two range labels
            hold its ends. */}
        <span className="text-[9px] font-extrabold uppercase tracking-wide" style={{ color: word ? color : "#5F7575" }}>
          {word || ""}
        </span>
        <span className="text-[9px] font-bold text-ink2 tabular-nums">{banded ? fmtVal(def, def.max) : ""}</span>
      </div>
    </div>
  );
}


/* V1's `StatusPill` stood here: a pill reading "In range" / "Low" / "High"
   from the same `paramStatus` vocabulary `ParamGauge` used. Its callers all
   went with the surfaces that computed chemistry, and a pill that renders a
   classification nothing produces is not worth carrying. */


/* V1's `pinReasonLabel` stood here. It named why a task had been moved off its
   rhythm — "to check the new dose", "to check the correction" — and it went
   with the mechanism it labelled.

   That mechanism was `dueOverride`/`dueReason` in V1's `reminders.js`: after a
   dose change, V1's own protocol pinned the next test to a day it chose. In V2
   the retest date is the ENGINE's, produced by the Retest Scheduler, and
   `app/src/store/schedule.js` says so where it declines to port the wiring.
   A label in the interface asserting why a test is due would be the interface
   claiming an inference it does not make. */

export function ReminderRow({ rem, state, onComplete, onReschedule, completeLabel = "Mark done" }) {
  /* This row used to expand into its own editor — interval, start date, nudge
     buttons — which was a second, older way of changing a schedule than the
     sheet the calendar opens. The two drifted: the sheet could move a task with
     completion history, the inline editor's "starting from" silently could not.
     The row is now purely a display that opens the same sheet, so there is one
     way to change a schedule regardless of where you tapped it. */
  const off = !rem.enabled;
  const due = state ? state.daysOut : null;
  const tone = off ? "#5F7575"
    : due != null && due < 0 ? "#A2621B"
    : due === 0 ? "#0B7C86" : "#45605F";

  return (
    <div className="rounded-xl border border-app overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <button onClick={onReschedule} className="flex-1 min-w-0 text-left">
          <div className="text-[14px] font-black truncate" style={{ color: off ? "#5F7575" : "#08191D" }}>
            {rem.label}
          </div>
          <div className="text-[11px] font-bold" style={{ color: tone }}>
            {off ? "turned off"
              : `${intervalLabel(rem.intervalDays)}${state ? ` · ${due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? "due today" : `next ${fmtShort(state.due)}`}` : ""}`}
          </div>
        </button>
        {!off && state && due <= 0 && (
          <button onClick={onComplete}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold text-white"
            style={{ background: "#0B7C86" }}>
            {completeLabel}
          </button>
        )}
        <button aria-label="Change schedule" onClick={onReschedule}
          className="shrink-0 p-2 -m-1 text-ink2">
          <Settings2 size={15} />
        </button>
      </div>
    </div>
  );
}

/* Escape closes an overlay. One modal of ten had this and the other nine did
   not, so a keyboard user could open a sheet and have no way out of it — every
   other route to closing was a click on a button or a backdrop.

   Written once as a hook rather than copied ten times, because the copy is how
   nine of them came to be missing it in the first place. Guarded on `active`
   so a modal that is rendered but hidden does not swallow the key from one
   that is actually open. */
export function useEscape(onClose, active = true) {
  useEffect(() => {
    if (!active || typeof onClose !== "function") return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, active]);
}

export function ReminderSheet({ rem, state, onClose, onSetDue, onSetInterval, onComplete, onSkip,
  onToggleEnabled = null, onDelete = null }) {
  useEscape(onClose);
  const [date, setDate] = useState(state && state.due ? state.due : todayStr());
  const [every, setEvery] = useState(String(rem ? rem.intervalDays : 7));
  const [tab, setTab] = useState("when");
  if (!rem) return null;

  const daysOut = state ? state.daysOut : null;
  const late = daysOut != null && daysOut < 0;
  const tone = late ? "#A2621B" : daysOut === 0 ? "#0B7C86" : "#45605F";
  const quick = [
    { label: "Today", iso: todayStr() },
    { label: "Tomorrow", iso: addDays(todayStr(), 1) },
    { label: "In 3 days", iso: addDays(todayStr(), 3) },
    { label: "Next week", iso: addDays(todayStr(), 7) },
  ];
  const intervalNum = parseInt(every, 10);
  const intervalOk = isFinite(intervalNum) && intervalNum >= 1 && intervalNum <= 365;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sheet-layer"
      style={{ background: "rgba(8,25,29,0.5)" }} onClick={onClose}>
      {/* Bounded to the screen and scrollable, like every other sheet — owner
          finding 22. It was `overflow-hidden` with no height limit, so on a
          short viewport its lower half was simply not reachable: the controls
          were rendered, they were off the bottom, and nothing scrolled. */}
      <div onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-y-auto sheet-panel"
        style={{ boxShadow: "0 -8px 40px rgba(8,25,29,0.3)" }}>

        <div className="px-4 pt-4 pb-3" style={{ background: tone + "10" }}>
          <div className="text-[15px] font-black text-ink">{rem.label}</div>
          <div className="text-[12px] font-bold mt-0.5" style={{ color: tone }}>
            {!rem.enabled ? "Turned off — no reminders until you turn it back on"
              : late ? `${Math.abs(daysOut)} day${Math.abs(daysOut) === 1 ? "" : "s"} overdue · was due ${fmtFriendly(state.due)}`
              : daysOut === 0 ? "Due today"
              : `Due ${fmtFriendly(state.due)}`}
          </div>
          <div className="text-[11px] font-semibold text-ink2 mt-0.5">
            {intervalLabel(rem.intervalDays)}
            {state && state.lastDone ? ` · last done ${fmtFriendly(state.lastDone)}` : " · never done"}
          </div>
        </div>

        <div className="flex border-b border-app">
          {[["when", "Reschedule"], ["how", "How often"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className="flex-1 py-2.5 text-[12px] font-extrabold"
              style={{ color: tab === k ? "#0B7C86" : "#5F7575",
                       borderBottom: tab === k ? "2px solid #0B7C86" : "2px solid transparent" }}>
              {l}
            </button>
          ))}
        </div>

        {tab === "when" ? (
          <div className="px-4 py-3">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {quick.map((q) => (
                <Btn key={q.label} variant="ghost" onClick={() => onSetDue(rem.id, q.iso)}>
                  {q.label}
                </Btn>
              ))}
            </div>
            <Field label="Or pick a date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </Field>
            <Btn className="w-full mt-2" onClick={() => onSetDue(rem.id, date)}>
              <span className="flex items-center justify-center gap-1.5"><Save size={13} /> Move to {fmtShort(date)}</span>
            </Btn>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
              Moving a task changes only this occurrence. Once you complete it, the normal
              {" "}{intervalLabel(rem.intervalDays).toLowerCase()} rhythm picks up from the day you did it.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-app">
              <Btn variant="ghost" onClick={() => onSkip(rem.id)}>Skip this one</Btn>
              <Btn onClick={() => onComplete(rem.id)}>
                <span className="flex items-center justify-center gap-1.5"><Check size={13} /> Mark done</span>
              </Btn>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[1, 2, 3, 7, 14, 21, 30, 42].map((d) => (
                <button key={d} onClick={() => setEvery(String(d))}
                  className="rounded-lg py-2 text-[12px] font-extrabold"
                  style={{ background: intervalNum === d ? "#0B7C86" : "#F1F5F4",
                           color: intervalNum === d ? "#fff" : "#45605F" }}>
                  {d}d
                </button>
              ))}
            </div>
            <Field label="Or every N days">
              <input type="number" min="1" max="365" value={every}
                onChange={(e) => setEvery(e.target.value)} className={inputCls} />
            </Field>
            <Btn className="w-full mt-2" disabled={!intervalOk}
              onClick={() => onSetInterval(rem.id, intervalNum)}>
              <span className="flex items-center justify-center gap-1.5">
                <Save size={13} /> {intervalOk ? intervalLabel(intervalNum) : "Enter 1–365"}
              </span>
            </Btn>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
              Changing how often also moves the next one, counted from when you last did it. Testing
              less often is not a failure — a settled tank genuinely needs fewer readings than one
              you are still working out.
            </p>
          </div>
        )}

        {(onToggleEnabled || onDelete) && (
          <div className="px-4 pb-3 pt-3 border-t border-app flex items-center gap-2">
            {onToggleEnabled && (
              <Btn variant="ghost" className="flex-1" onClick={() => onToggleEnabled(rem.id, !rem.enabled)}>
                {rem.enabled ? "Turn off" : "Turn back on"}
              </Btn>
            )}
            {onDelete && !rem.builtin && (
              <Btn variant="danger" className="flex-1" onClick={() => onDelete(rem.id)}>Delete</Btn>
            )}
          </div>
        )}

        <button onClick={onClose} className="w-full py-3 text-[12px] font-extrabold text-ink2 border-t border-app">
          Close
        </button>
      </div>
    </div>
  );
}

export function CompletionCalendar({ taskLog, reminders, waterChanges, onPickTask = null,
  onDeleteDone = null }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [picked, setPicked] = useState(null);

  /* The month the calendar opens on follows the APPLICATION's clock, so test
     mode's chosen instant moves it too. V1 read `new Date()`; V2 has one clock
     and `TM-23` finds every module that reaches past it. */
  const now = appNow();
  const cursor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  /* A completion whose task is no longer on record — every imported one, since
     the import brings the history without recreating the tasks — used to render
     its internal id: the keeper's calendar read "t-skimmer". A database key is
     never a thing to show him. */
  const labelFor = (id) => {
    const r = (reminders || []).find((x) => x.id === id);
    if (r) return r.label;
    return t("calendar.unknownTask");
  };

  /* Completions grouped by day, with water-change volumes folded in so the
     detail can say "Water change · 10L" rather than just naming the task. */
  const byDay = useMemo(() => {
    const map = {};
    for (const l of taskLog || []) {
      if (!l.date) continue;
      (map[l.date] = map[l.date] || []).push({
        id: l.id, label: labelFor(l.taskId), taskId: l.taskId, date: l.date, auto: !!l.auto, done: true,
      });
    }
    /* OWNER FINDING 3 — WHY 25 WATER CHANGES WERE ON THE CHARTS AND NOWHERE
       ELSE.

       This folded a water change into a day that already had a task completion
       on it, and did nothing at all where there was none. The owner's imported
       history holds 25 water changes and no completion matching any of them, so
       every one of them was skipped here — while the charts, which read the
       ledger directly, drew all 25. He was looking at markers for events he
       could not find, could not check and could not delete.

       They are real: the import wrote 25 `WATER_CHANGE` events, and they came
       from his own V1 backup. So they belong on the calendar, as themselves. */
    for (const w of waterChanges || []) {
      if (!w.date) continue;
      const day = (map[w.date] = map[w.date] || []);
      const size = w.litres == null ? null : `${w.litres} L`;
      const row = day.find((x) => x.taskId === "waterchange");
      if (row) { if (size) row.detail = size; continue; }
      day.push({
        id: w.id,
        label: t("water.label"),
        taskId: "waterchange",
        date: w.date,
        detail: size,
        done: true,
        /* A ledger event rather than a task completion, so the caller deletes
           the right thing. The calendar's trash used to remove the TICK on
           every row it drew, whatever the row actually was. */
        eventId: w.id,
      });
    }
    return map;
  }, [taskLog, waterChanges, reminders]);

  /* What's scheduled ahead, so the month reads as a plan and not only a record. */
  const dueByDay = useMemo(() => {
    const map = {};
    const today = todayStr();
    const horizon = `${year}-${String(month + 1).padStart(2, "0")}-28`;
    const until = addDays(horizon, 10);
    for (const r of reminders || []) {
      for (const d of projectOccurrences(r, taskLog, today, until)) {
        (map[d] = map[d] || []).push({ id: r.id + d, label: r.label, taskId: r.id, done: false });
      }
    }
    return map;
  }, [reminders, taskLog, year, month]);

  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;          // weeks start Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ d, iso, items: byDay[iso] || [], due: dueByDay[iso] || [] });
  }

  const today = todayStr();
  const monthTotal = cells.reduce((a, c) => a + (c ? c.items.length : 0), 0);

  return (
    <Card className="p-4 mb-8">
      <div className="flex items-center justify-between gap-2 mb-3">
        <button onClick={() => { setMonthOffset(monthOffset - 1); setPicked(null); }}
          className="p-2 -m-2 rounded-lg text-ink2 active:bg-app" aria-label="Previous month">
          <ChevronDown size={16} style={{ transform: "rotate(90deg)" }} />
        </button>
        <div className="text-center">
          <div className="text-[14px] font-black text-ink">{monthLabel}</div>
          <div className="text-[10px] font-bold text-ink2">
            {monthTotal} completed · {cells.reduce((a, c) => a + (c ? c.due.length : 0), 0)} scheduled
          </div>
        </div>
        <button onClick={() => { setMonthOffset(monthOffset + 1); setPicked(null); }}
          className="p-2 -m-2 rounded-lg text-ink2 active:bg-app disabled:opacity-25" aria-label="Next month">
          <ChevronDown size={16} style={{ transform: "rotate(-90deg)" }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-extrabold uppercase text-ink2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c) return <div key={`p${i}`} />;
          const n = c.items.length, m = c.due.length;
          const isToday = c.iso === today;
          const isPicked = picked === c.iso;
          const total = n + m;
          return (
            <button key={c.iso} onClick={() => setPicked(isPicked ? null : c.iso)}
              className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 border"
              style={{
                borderColor: isPicked ? "#0B7C86" : isToday ? "#0B7C86" : "transparent",
                background: isPicked ? "#0B7C8618" : n ? "#0B7C860C" : "transparent",
              }}>
              <span className="text-[11px] font-bold leading-none"
                style={{ color: total ? "#08191D" : "#9FB0AE" }}>{c.d}</span>
              {total > 0 && (total <= 3 ? (
                <span className="flex gap-0.5">
                  {/* Solid = done, hollow = scheduled. */}
                  {Array.from({ length: n }).map((_, k) => (
                    <span key={"d" + k} className="w-1 h-1 rounded-full" style={{ background: "#0B7C86" }} />
                  ))}
                  {Array.from({ length: m }).map((_, k) => (
                    <span key={"u" + k} className="w-1 h-1 rounded-full border" style={{ borderColor: "#0B7C8699" }} />
                  ))}
                </span>
              ) : (
                <span className="text-[8px] font-extrabold leading-none"
                  style={{ color: n ? "#0B7C86" : "#5F7575" }}>{total}</span>
              ))}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="mt-3 pt-3 border-t border-app">
          <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
            {fmtFriendly(picked)}
          </div>
          {((byDay[picked] || []).length + (dueByDay[picked] || []).length) === 0 ? (
            <p className="text-[13px] text-ink2 font-medium">Nothing logged or scheduled that day.</p>
          ) : (
            <div className="space-y-1">
              {(byDay[picked] || []).map((it) => (
                <div key={it.id} className="flex flex-wrap items-center gap-2">
                  <Check size={13} style={{ color: "#0B7C86" }} className="shrink-0" />
                  <span className="text-[13px] font-bold text-ink">{it.label}</span>
                  {it.detail && <span className="text-[12px] font-bold text-ink2">· {it.detail}</span>}
                  {it.auto && <span className="text-[10px] font-bold text-ink2">· from a logged test</span>}
                  <span className="flex-1" />
                  {onDeleteDone && (
                    <DeleteControl size={13} onDelete={() => onDeleteDone(it)} />
                  )}
                </div>
              ))}
              {/* Scheduled items are tappable: seeing a task on a day you
                  cannot make it is exactly the moment you want to move it, and
                  previously the calendar could only be read. */}
              {(dueByDay[picked] || []).map((it) => (
                <button key={it.id} onClick={() => onPickTask && onPickTask(it.taskId)}
                  disabled={!onPickTask}
                  className="w-full flex items-center gap-2 text-left rounded-lg px-1 py-1 -mx-1"
                  style={{ background: onPickTask ? "transparent" : undefined }}>
                  <span className="w-3 h-3 rounded-full border-2 shrink-0" style={{ borderColor: "#0B7C8699" }} />
                  <span className="text-[13px] font-bold text-ink2 flex-1">{it.label}</span>
                  {onPickTask
                    ? <span className="text-[10px] font-extrabold" style={{ color: "#0B7C86" }}>Reschedule</span>
                    : <span className="text-[10px] font-bold text-ink2">· scheduled</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!picked && (
        <div className="flex items-center gap-3 mt-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#0B7C86" }} />
            <span className="text-[10px] font-bold text-ink2">done</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border" style={{ borderColor: "#0B7C8699" }} />
            <span className="text-[10px] font-bold text-ink2">scheduled</span>
          </span>
          <span className="text-[10px] font-medium text-ink2">Tap a day for detail</span>
        </div>
      )}
    </Card>
  );
}


/* The calendar as an overlay, so it can be reached from the dashboard without
   losing your place. */
export function CalendarModal({ taskLog, reminders, waterChanges, onClose, onPickTask = null,
  onDeleteDone = null }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 bg-[#08191D]/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 sheet-layer"
      onClick={onClose}>
      <div className="bg-app w-full sm:max-w-lg sheet-panel overflow-y-auto rounded-t-3xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="sticky top-0 bg-app px-4 pt-4 pb-2 flex items-center justify-between gap-2 z-10">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold">Calendar</div>
            <h2 className="text-xl font-display text-ink">Done &amp; coming up</h2>
          </div>
          <button aria-label="Close" onClick={onClose}
            className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-white/60"><X size={20} /></button>
        </div>
        <div className="px-4 pb-4">
          <CompletionCalendar taskLog={taskLog} reminders={reminders} waterChanges={waterChanges}
            onPickTask={onPickTask} onDeleteDone={onDeleteDone} />
        </div>
      </div>
    </div>
  );
}
