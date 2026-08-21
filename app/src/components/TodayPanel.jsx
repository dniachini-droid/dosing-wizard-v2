import { useState } from 'react'
import { Card } from './ErrorBoundary.jsx'
import { Bell, Check, ChevronDown, ChevronUp, ListChecks } from '../icons.jsx'
import { fmtShort, todayStr } from '../lib/dates.js'
import { nowTime } from '../lib/clock.js'
import { intervalLabel } from '../store/schedule.js'

/* --- What needs doing today ---
 * Sits directly under the tank assessment and shows only what is overdue or due
 * now. It disappears entirely when there's nothing to do, so its presence alone
 * means something needs attention.
 */
/* One row of the today panel. Test reminders take the reading inline: going to
   another tab to type one number was the most repeated friction in the app. */
export function TodayRow({ s: st, onOpenTest, onComplete, onNudge, onPickTask, def, onAddReading }) {
  const [value, setValue] = useState("");
  const isTest = st.task.kind === "TEST" && st.task.parameter;
  const late = st.status === "overdue";
  const canLogHere = isTest && def && onAddReading;

  const save = async () => {
    const v = parseFloat(value);
    if (!isFinite(v)) return;
    /* Value, date, time — the three the brief allows, with date and time
       filled from now. There is no fourth question here and there is not one
       anywhere else either. */
    await onAddReading({ param: def.key, value: v, date: todayStr(), time: nowTime() });
    setValue("");
  };

  return (
    <div className="rounded-xl bg-white border border-app p-2.5">
      <div className="flex items-center justify-between gap-2">
        <button className="min-w-0 text-left flex-1"
          onClick={() => (isTest ? onOpenTest(st.task.parameter) : onComplete(st.task.id))}>
          <div className="text-[14px] font-black text-ink truncate">{st.task.label}</div>
          <div className="text-[11px] font-bold"
            style={{ color: late ? "#A2621B" : st.daysOut === 0 ? "#0B7C86" : "#45605F" }}>
            {late ? `${Math.abs(st.daysOut)} day${Math.abs(st.daysOut) === 1 ? "" : "s"} overdue`
              : st.daysOut === 0 ? "due today"
              : `in ${st.daysOut} day${st.daysOut === 1 ? "" : "s"} · ${fmtShort(st.due)}`}
            {/* V1 appended why a test had been pinned off its usual rhythm.
                That pin was V1's own protocol writing a retest date into the
                schedule; in V2 the retest date is the engine's and is never
                written into a task behind the keeper's back. So a row states
                its interval, which is the keeper's own number, and nothing
                else. */}
            {` · ${intervalLabel(st.task.intervalDays)}`}
                      </div>
        </button>

        {canLogHere ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <input type="number" inputMode="decimal" step={def.step} value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); }}
              placeholder={def.unit}
              className="w-16 rounded-lg border border-app bg-white px-2 py-1.5 text-[13px] font-bold text-ink text-right" />
            <button onClick={save} disabled={value === ""}
              className="rounded-lg px-3 py-2 text-[12px] font-extrabold transition-colors"
              style={{ background: value === "" ? "#EDF3F2" : "#0B7C86", color: value === "" ? "#9FB0AE" : "#fff" }}>
              Log
            </button>
          </div>
        ) : (
          <button onClick={() => onComplete(st.task.id)}
            className="shrink-0 rounded-lg px-3 py-2 text-[12px] font-extrabold text-white"
            style={{ background: "#0B7C86" }}>
            Done
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <NudgeButton onClick={() => onNudge(st.task.id, 1 - Math.min(0, st.daysOut))} label="Snooze until tomorrow" />
          {onPickTask && <NudgeButton onClick={() => onPickTask(st.task.id)} label="Change schedule…" />}
          {canLogHere && (
            <button onClick={() => onOpenTest(st.task.parameter)}
              className="rounded-lg border border-app px-2 py-1 text-[10px] font-extrabold text-ink2 active:bg-app">
              Open in Test Lab
            </button>
          )}
      </div>
    </div>
  );
}

export function TodayPanel({ view, onOpenTest, onComplete, onNudge, onPickTask, paramDefs = [], onAddReading = null }) {
  /* Collapsed to one line by default so it never crowds the dashboard, but
     always present: hiding it entirely when nothing was due made it look like
     the reminders had disappeared. When you're clear it shows what's next
     instead of vanishing. */
  const [open, setOpen] = useState(false);
  if (!view) return null;

  const actionable = view.actionable;
  const soon = view.upcoming.slice(0, 4);
  const rows = actionable.length ? actionable : soon;
  if (!rows.length) return null;

  const overdue = view.overdue.length;
  const clear = actionable.length === 0;
  const tone = overdue ? "#A2621B" : clear ? "#45605F" : "#0B7C86";

  const headline = overdue
    ? `${overdue} overdue`
    : actionable.length
    ? `${actionable.length} due today`
    : "Nothing due today";

  const preview = clear
    ? (soon[0] ? `next ${soon[0].task.label.replace(/^Test /, "")} in ${soon[0].daysOut}d` : "")
    : rows.slice(0, 2).map((s) => s.task.label.replace(/^Test /, "")).join(", ") +
      (rows.length > 2 ? ` +${rows.length - 2}` : "");

  return (
    <div className="rounded-2xl border-2 mb-4"
      style={{ borderColor: overdue ? "#D9832555" : clear ? "#E3ECEA" : "#0B7C8640",
               background: overdue ? "#A2621B10" : clear ? "#fff" : "#0B7C860A" }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 p-4 text-left">
        <Bell size={15} style={{ color: tone }} className="shrink-0" />
        <span className="text-[11px] font-extrabold uppercase tracking-[0.13em] shrink-0" style={{ color: tone }}>
          {headline}
        </span>
        <span className="text-[11px] font-bold text-ink2 truncate flex-1 min-w-0 text-right">{preview}</span>
        {open ? <ChevronUp size={15} style={{ color: tone }} className="shrink-0" />
              : <ChevronDown size={15} style={{ color: tone }} className="shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {rows.map((st) => (
              <TodayRow key={st.task.id} s={st} onOpenTest={onOpenTest} onComplete={onComplete}
                onNudge={onNudge} onPickTask={onPickTask} onAddReading={onAddReading}
                def={paramDefs.find((d) => d.key === st.task.parameter)} />
            ))}
          </div>
          <p className="text-[10px] text-ink2 font-medium mt-2.5 leading-relaxed">
            {clear
              ? "Nothing needs doing right now — these are what's coming. Type a reading straight in when you test."
              : "Type the reading in and it saves, completes the reminder, and schedules the next one from today."}
          </p>
        </div>
      )}
    </div>
  );
}

export function NudgeButton({ onClick, label }) {
  return (
    <button onClick={onClick}
      className="rounded-lg border border-app px-2 py-1 text-[10px] font-extrabold text-ink2 active:bg-app">
      {label}
    </button>
  );
}

/* The fuller picture: what's coming, and what's recently been done. The window
   is adjustable because a two-day alkalinity rhythm and a six-week ICP cycle
   want very different horizons. */
export function RemindersPanel({ view, windowDays, setWindowDays, onOpenTest, onComplete, onNudge, onPickTask, onOpenCalendar = null }) {
  if (!view) return null;
  const Row = ({ s, tone, right }) => (
    <div className="flex items-center justify-between gap-2 py-2 border-t border-app first:border-0">
      <div className="min-w-0">
        <div className="text-[13px] font-black text-ink truncate">{s.task.label}</div>
        <div className="text-[10px] font-bold text-ink2">{intervalLabel(s.task.intervalDays)}</div>
      </div>
      <div className="text-right shrink-0">{right}</div>
    </div>
  );
  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        {onOpenCalendar ? (
          <button onClick={onOpenCalendar}
            className="flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-[11px] font-extrabold"
            style={{ borderColor: "#E3ECEA", color: "#45605F" }}>
            <ListChecks size={13} /> Calendar
          </button>
        ) : <span />}
        <div className="flex gap-1">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setWindowDays(d)}
              className="rounded-lg px-2 py-1 text-[11px] font-extrabold border-2"
              style={{ borderColor: windowDays === d ? "#0B7C86" : "#E3ECEA",
                       color: windowDays === d ? "#0B7C86" : "#45605F" }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {view.actionable.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Needs doing</div>
          {view.actionable.map((s) => (
            <div key={s.task.id} className="py-2.5 border-t border-app first:border-0">
              <div className="flex items-center justify-between gap-2">
                <button className="min-w-0 text-left flex-1"
                  onClick={() => (s.task.kind === "TEST" && s.task.parameter ? onOpenTest(s.task.parameter) : onComplete(s.task.id))}>
                  <div className="text-[13px] font-black text-ink truncate">{s.task.label}</div>
                  <div className="text-[10px] font-bold" style={{ color: s.status === "overdue" ? "#A2621B" : "#0B7C86" }}>
                    {s.status === "overdue" ? `${Math.abs(s.daysOut)} day${Math.abs(s.daysOut) === 1 ? "" : "s"} overdue` : "due today"}
                  </div>
                </button>
                <button onClick={() => (s.task.kind === "TEST" && s.task.parameter ? onOpenTest(s.task.parameter) : onComplete(s.task.id))}
                  className="shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-extrabold text-white" style={{ background: "#0B7C86" }}>
                  {s.task.kind === "TEST" && s.task.parameter ? "Log" : "Done"}
                </button>
              </div>
              {/* Snooze stays as a one-tap shortcut; anything more than that
                  opens the same sheet the calendar uses, so there is one way to
                  change a schedule however you got here. */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <NudgeButton onClick={() => onNudge(s.task.id, 1 - Math.min(0, s.daysOut))} label="Snooze until tomorrow" />
                {onPickTask && <NudgeButton onClick={() => onPickTask(s.task.id)} label="Change schedule…" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {view.upcoming.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Coming up</div>
          {view.upcoming.map((s) => (
            <div key={s.task.id} className="py-2 border-t border-app first:border-0">
              <div className="flex items-center justify-between gap-2">
                <button className="min-w-0 text-left flex-1"
                  onClick={() => (s.task.kind === "TEST" && s.task.parameter ? onOpenTest(s.task.parameter) : onComplete(s.task.id))}>
                  <div className="text-[13px] font-black text-ink truncate">{s.task.label}</div>
                  <div className="text-[10px] font-bold text-ink2">
                    in {s.daysOut} day{s.daysOut === 1 ? "" : "s"} · {fmtShort(s.due)} · {intervalLabel(s.task.intervalDays)}
                  </div>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => (s.task.kind === "TEST" && s.task.parameter ? onOpenTest(s.task.parameter) : onComplete(s.task.id))}
                    className="rounded-lg border-2 px-3 py-1.5 text-[11px] font-extrabold"
                    style={{ borderColor: "#0B7C8640", color: "#0B7C86" }}>
                    {s.task.kind === "TEST" && s.task.parameter ? "Log" : "Done"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view.recent.length > 0 && (
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Recently done</div>
          {view.recent.map((s) => (
            <Row key={s.task.id} s={s} right={
              <>
                <div className="text-[12px] font-black flex items-center gap-1 justify-end" style={{ color: "#0B7C86" }}>
                  <Check size={12} /> {s.doneToday ? "today" : fmtShort(s.lastDone)}
                </div>
                <div className="text-[10px] font-bold text-ink2">next {fmtShort(s.due)}</div>
              </>
            } />
          ))}
        </div>
      )}

      {view.actionable.length === 0 && view.upcoming.length === 0 && view.recent.length === 0 && (
        <p className="text-[13px] text-ink2 font-medium">Nothing due in the next {windowDays} days.</p>
      )}

      {/* Say what sits beyond the window. Without this the selector looks
          broken whenever everything happens to be due at once — there is no
          visible difference between "nothing further out" and "not shown". */}
      <p className="text-[11px] text-ink2 font-medium mt-2.5 pt-2.5 border-t border-app leading-relaxed">
        Showing what's due and what was done within {windowDays} days.
        {view.later.length > 0
          ? ` ${view.later.length} further ${view.later.length === 1 ? "reminder falls" : "reminders fall"} beyond that — next is ${view.later[0].task.label.toLowerCase()} on ${fmtShort(view.later[0].due)}.`
          : " Nothing falls outside it."}
      </p>
    </Card>
  );
}


/* ===========================================================================
   FOUR SURFACES STOOD HERE AND NONE OF THEM CROSSED
   ===========================================================================
   `StabilityStrip`, `ScoreBreakdown`, `SnoozeSheet`, `Briefing` and
   `OverviewCard` — around 400 lines — are deleted rather than ported.

   `StabilityStrip` drew a spread against a band and called the result settled
   or travelling. `Briefing` and `OverviewCard` carried the tank assessment
   score and the headline sentence. `ScoreBreakdown` explained a number built
   from nineteen constants that, in the salvage inventory's words, "a keeper
   could not check against anything on screen". `SnoozeSheet` took a chemistry
   claim and a parameter and decided how long to hide it for.

   Two separate reasons, and either would be enough:

   The brief for this port removes the score, the "N things to look at" list
   and the headline sentence outright — the headline "is a real feature and
   needs engine support that does not exist; it is recorded for later and
   absent for now".

   And every one of them computed chemistry inside a presentation component,
   which canon `X-INV-004` and `DEC-003` forbid. The salvage inventory lists
   the whole file under "surfaces that compute chemistry — rebuild, do not
   port", and lists the health score under `LEAVE_BEHIND` by name.

   What replaced them: nothing on the dashboard, deliberately. The engine's
   answer is on the Dosing tab in full, and each parameter card carries the one
   notice the engine raised for it. See `docs/migration/PORT-OMISSIONS.md`.
   ========================================================================= */
