import { useState } from 'react'
import { Btn, Field, SectionTitle, inputCls } from './DoseExpectation.jsx'
import { Card } from './ErrorBoundary.jsx'
import { Check, Plus, SunMedium, StickyNote, X } from '../icons.jsx'
import { CompletionCalendar, ReminderRow, ReminderSheet } from '../lib/backup.jsx'
import { uid } from '../lib/constants.js'
import { todayStr } from '../lib/dates.js'
import { nowTime } from '../lib/clock.js'
import { taskState, TASK_KIND } from '../store/schedule.js'

/* ---------------------------------- Tasks ---------------------------------- */

/* V1's Tasks screen, ported, and the home for everything unscheduled.

   WHAT CAME OUT. V1 previewed what a water change would do to every parameter
   — `predictAfterChange`, a dilution model, computed in this component. That is
   chemistry: it says what a reading will be. The water-change flow asks for
   litres and records them, which is what the brief specifies and all the
   engine needs.

   WHAT WENT IN. The three unscheduled things the brief puts here: a one-off
   addition by hand, a lighting change, and a short note with a date for
   anything that changed what the tank uses — new corals, a loss.

   V1's `REMINDER_GROUPS` — test schedule and husbandry — is not ported as
   data, because it was keyed to V1's own reminder kinds. The grouping is the
   same idea over `TASK_KIND`, which is V2's. */

const GROUPS = [
  { id: "test", label: "Test schedule", kinds: [TASK_KIND.TEST] },
  { id: "husbandry", label: "Husbandry & maintenance", kinds: [TASK_KIND.HUSBANDRY, TASK_KIND.CUSTOM] },
];

export function Tasks({ tasks = [], completions = [], scheduleView = null, paramDefs = [],
  onMarkDone, onAddTask, onDeleteTask, onUpdateTask,
  onSetTaskDue, onSetTaskInterval, onSkipTask,
  onAddWaterChange, onAddOneOff, onAddLightingChange, onAddNote,
  waterChanges = [], onOpenTest = () => {}, onDeleteDone = null }) {

  /* ---- the water-change prompt: litres, and nothing else ---------------- */
  const [wcOpen, setWcOpen] = useState(null);
  const [wcLitres, setWcLitres] = useState("");

  const confirmWaterChange = async () => {
    const L = parseFloat(wcLitres);
    if (!L || L <= 0) return;
    await onAddWaterChange({ date: todayStr(), time: nowTime(), litres: L });
    await onMarkDone(wcOpen, todayStr(), { litres: L });
    setWcOpen(null);
    setWcLitres("");
  };

  /* ---- a custom task ---------------------------------------------------- */
  const [label, setLabel] = useState("");
  const [freq, setFreq] = useState(14);
  const [newUnit, setNewUnit] = useState("days");
  const [newStart, setNewStart] = useState(todayStr());
  const [oneOffTask, setOneOffTask] = useState(false);

  const submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const name = label.trim();
    if (!name) return;
    const n = Math.max(1, parseInt(freq, 10) || 7);
    await onAddTask({
      id: uid(), label: name, kind: TASK_KIND.CUSTOM, parameter: null,
      intervalDays: newUnit === "weeks" ? n * 7 : n,
      startDate: newStart || todayStr(),
      /* A one-off is a task that is turned off once it has been done, rather
         than a second kind of thing with its own storage and its own calendar
         behaviour. V1's own reasoning for one model, applied again. */
      oneOff: oneOffTask,
    });
    setLabel(""); setFreq(14); setNewUnit("days"); setNewStart(todayStr()); setOneOffTask(false);
  };

  /* ---- the three unscheduled records ------------------------------------ */
  const [ooOpen, setOoOpen] = useState(false);
  const [ooMl, setOoMl] = useState("");
  const [ooDate, setOoDate] = useState(todayStr());
  const [ooTime, setOoTime] = useState(nowTime());

  const [lightOpen, setLightOpen] = useState(false);
  const [lightDate, setLightDate] = useState(todayStr());
  const [lightNote, setLightNote] = useState("");

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDate, setNoteDate] = useState(todayStr());
  const [noteText, setNoteText] = useState("");

  const alk = paramDefs.find((d) => d.assessed);

  /* One sheet, shared by the calendar below and the task list above, so a task
     can be moved from wherever you happen to be looking at it. */
  const [sheetId, setSheetId] = useState(null);
  const sheetTask = sheetId ? tasks.find((r) => r.id === sheetId) : null;
  const sheetState = sheetTask ? taskState(sheetTask, completions, todayStr()) : null;
  const closeSheet = () => setSheetId(null);
  const onPickTask = (id) => setSheetId(id);

  return (
    <div>
      <SectionTitle eyebrow="Schedule" title="Tasks" />

      {/* Water change volume prompt. Litres, and nothing else. */}
      {wcOpen && (
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[14px] font-black text-ink">How much did you change?</span>
            <button aria-label="Close" onClick={() => setWcOpen(null)} className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-app"><X size={20} /></button>
          </div>
          <Field label="Litres">
            <input type="number" inputMode="decimal" min="0" step="0.5" value={wcLitres}
              onChange={(e) => setWcLitres(e.target.value)} className={inputCls} autoFocus />
          </Field>
          {/* V1 previewed what this would do to every parameter. That was a
              dilution model in a UI component; the engine owns what a water
              change does, and it is told the litres. */}
          <Btn className="w-full mt-2" onClick={confirmWaterChange}>
            <span className="flex items-center justify-center gap-1.5"><Check size={14} /> Log water change</span>
          </Btn>
        </Card>
      )}

      {/* One list, one set of controls. Tests and husbandry used to be separate
          sections with different capabilities, so the same concept behaved
          differently depending on where you found it. */}
      <Card className="p-4 mb-4">
        <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
          Everything here repeats on a schedule you set. Tap one to change how often it repeats,
          when it starts, or to nudge the next occurrence. Tests complete themselves when you log
          that reading; the rest you tick off.
        </p>

        {tasks.length === 0 && (
          <p className="text-[13px] text-ink2 font-medium leading-relaxed">
            Nothing is scheduled yet. This build ships no test schedule of its own — a test
            cadence is chemistry, and the only one the canon states is alkalinity's, which the
            engine gives as a recommendation rather than a rhythm. Add what you actually do
            below and the intervals are yours.
          </p>
        )}

        {GROUPS.map((g) => {
          const list = tasks.filter((r) => g.kinds.includes(r.kind));
          if (!list.length) return null;
          return (
            <div key={g.id} className="mb-4 last:mb-0">
              <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
                {g.label}
              </div>
              <div className="space-y-2">
                {list.map((r) => (
                  <ReminderRow key={r.id} rem={r}
                    state={scheduleView && scheduleView.states.find((x) => x.task.id === r.id)}
                    onReschedule={() => onPickTask(r.id)}
                    onComplete={r.needsVolume ? () => setWcOpen(r.id)
                      : r.kind === TASK_KIND.TEST && r.parameter ? () => onOpenTest(r.parameter)
                      : () => onMarkDone(r.id, todayStr())}
                    completeLabel={r.needsVolume ? "Log change" : r.kind === TASK_KIND.TEST ? "Log test" : "Mark done"} />
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      {/* The add form uses the same fields as editing, so what you fill in
          matches what you'll see afterwards. */}
      <Card className="p-4 mb-4">
        <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-2">Add a task</div>
        <Field label="Name">
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            className={inputCls} placeholder="e.g. Clean filter sock" />
        </Field>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Field label="Repeat every">
            <div className="flex gap-1.5">
              <input type="number" inputMode="decimal" min="1" value={freq} onChange={(e) => setFreq(e.target.value)} className={inputCls} />
              <select className={inputCls} value={newUnit} onChange={(e) => setNewUnit(e.target.value)}>
                <option value="days">days</option>
                <option value="weeks">weeks</option>
              </select>
            </div>
          </Field>
          <Field label="Starting from">
            <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <label className="flex items-center gap-2 mt-2">
          <input type="checkbox" checked={oneOffTask} onChange={(e) => setOneOffTask(e.target.checked)} />
          <span className="text-[12px] font-bold text-ink2">Just the once — turn it off after it is done</span>
        </label>
        <Btn onClick={submit} className="w-full mt-3">
          <span className="flex items-center justify-center gap-1.5"><Plus size={14} /> Add task</span>
        </Btn>
      </Card>

      {/* ---- everything unscheduled ---------------------------------------
          The brief puts these here: "a one-off addition by hand, and anything
          that changed what the tank uses — new corals, a loss, a lighting
          change. A short free-text note with a date." */}
      <Card className="p-4 mb-4">
        <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-2">
          Record something that happened
        </div>

        {/* A ONE-OFF ADDITION. Alkalinity only, and it says so.

            The brief requires that a one-off addition states which parameter it
            was. It can be recorded for alkalinity because that is the parameter
            the engine reads corrections for. For anything else the engine has
            no input at all: `toEngineEvents` sends every `MANUAL_CORRECTION`
            without a parameter, so a calcium one-off would arrive as an
            alkalinity one and confound a segment that nothing touched. Offering
            it would create a wrong record rather than an incomplete one.
            Recorded as open in `docs/migration/PORT-OMISSIONS.md`. */}
        <button onClick={() => setOoOpen((v) => !v)}
          className="w-full flex items-center gap-2 py-2 text-left border-t border-app first:border-0">
          <Plus size={14} className="text-ink2 shrink-0" />
          <span className="text-[13px] font-black text-ink flex-1">A one-off addition by hand</span>
        </button>
        {ooOpen && (
          <div className="pb-3">
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mb-2">
              {alk ? `${alk.label} only in this build.` : ""} Millilitres of your usual solution, added
              by hand rather than by the pump.
            </p>
            <Field label="Millilitres">
              <input type="number" inputMode="decimal" min="0" step="0.5" value={ooMl}
                onChange={(e) => setOoMl(e.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Field label="Date">
                <input type="date" value={ooDate} max={todayStr()} onChange={(e) => setOoDate(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Time">
                <input type="time" value={ooTime} onChange={(e) => setOoTime(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Btn className="w-full mt-3" disabled={!parseFloat(ooMl)}
              onClick={async () => {
                const ml = parseFloat(ooMl);
                if (!ml || ml <= 0) return;
                await onAddOneOff({ amountMl: ml, date: ooDate, time: ooTime });
                setOoMl(""); setOoOpen(false);
              }}>
              Record it
            </Btn>
          </div>
        )}

        <button onClick={() => setLightOpen((v) => !v)}
          className="w-full flex items-center gap-2 py-2 text-left border-t border-app">
          <SunMedium size={14} className="text-ink2 shrink-0" />
          <span className="text-[13px] font-black text-ink flex-1">A lighting change</span>
        </button>
        {lightOpen && (
          <div className="pb-3">
            <div className="grid grid-cols-1 gap-2">
              <Field label="Date">
                <input type="date" value={lightDate} max={todayStr()} onChange={(e) => setLightDate(e.target.value)} className={inputCls} />
              </Field>
              <Field label="What changed">
                <input type="text" value={lightNote} onChange={(e) => setLightNote(e.target.value)}
                  className={inputCls} placeholder="e.g. blues up 10%" />
              </Field>
            </div>
            <Btn className="w-full mt-3"
              onClick={async () => {
                await onAddLightingChange({ date: lightDate, note: lightNote.trim() });
                setLightNote(""); setLightOpen(false);
              }}>
              Record it
            </Btn>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
              This marks every chart, because a lighting change touches everything.
            </p>
          </div>
        )}

        <button onClick={() => setNoteOpen((v) => !v)}
          className="w-full flex items-center gap-2 py-2 text-left border-t border-app">
          <StickyNote size={14} className="text-ink2 shrink-0" />
          <span className="text-[13px] font-black text-ink flex-1">Something that changed what the tank uses</span>
        </button>
        {noteOpen && (
          <div className="pb-3">
            <div className="grid grid-cols-1 gap-2">
              <Field label="Date">
                <input type="date" value={noteDate} max={todayStr()} onChange={(e) => setNoteDate(e.target.value)} className={inputCls} />
              </Field>
              <Field label="What happened">
                <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)}
                  className={inputCls} placeholder="e.g. four new frags in" />
              </Field>
            </div>
            <Btn className="w-full mt-3" disabled={!noteText.trim()}
              onClick={async () => {
                if (!noteText.trim()) return;
                await onAddNote({ date: noteDate, note: noteText.trim() });
                setNoteText(""); setNoteOpen(false);
              }}>
              Record it
            </Btn>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
              New corals, a loss, anything that changes demand. It is kept with the date and
              shown against your history; nothing works out what it means.
            </p>
          </div>
        )}
      </Card>

      {/* The calendar: every completed task, not one kind, and the month at a
          glance. */}
      <SectionTitle eyebrow="History" title="Done & coming up" />
      <CompletionCalendar taskLog={completions} reminders={tasks} waterChanges={waterChanges}
        onPickTask={onPickTask} onDeleteDone={onDeleteDone} />

      {sheetTask && (
        <ReminderSheet rem={sheetTask} state={sheetState} onClose={closeSheet}
          onSetDue={(id, d) => { onSetTaskDue(id, d); closeSheet(); }}
          onSetInterval={(id, n) => { onSetTaskInterval(id, n); closeSheet(); }}
          onComplete={(id) => { onMarkDone(id, todayStr()); closeSheet(); }}
          onSkip={(id) => { onSkipTask(id); closeSheet(); }}
          onToggleEnabled={(id, on) => { onUpdateTask(id, { enabled: on }); closeSheet(); }}
          onDelete={(id) => { onDeleteTask(id); closeSheet(); }} />
      )}

    </div>
  );
}
