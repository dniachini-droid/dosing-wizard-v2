/* ============================================================================
   ENTRY AND EDITING — ONE SHEET, REACHABLE FROM ANYWHERE
   ----------------------------------------------------------------------------
   One item, one shared edit sheet, reachable from Today's stepper, from Test
   Lab, from Tasks or from the calendar — because a task should be editable
   from wherever the keeper happens to be looking at it. That is V1's
   `ReminderSheet` idea (`V1-APPLICATION-SALVAGE.md` §2.2), carried across.

   THE TIME CONTROL
   ----------------

   This is the part that cannot be got wrong twice. The picker below has FIVE
   states and NONE of them is the default. A keeper who does not know the time
   picks "date only" and the app stores a record with no time in it at all —
   not midnight, not midday, not now.

   The default matters more than the options. If the control opened pre-filled
   with the current clock, then every reading entered from memory would
   silently acquire a precision it never had, and afterwards nothing could tell
   those apart from real ones. So the control opens on nothing selected and the
   form will not submit until the keeper has said which it is.

   "Now" is a button, not a default. Pressing it fills the time from the clock
   VISIBLY, and the keeper can still change it before saving. That is the
   keeper asserting a fact about when this happened. The forbidden version is
   the one where the field is already full when the form opens.
   ========================================================================= */

import { h, onEscape } from "../ui/dom.js";
import {
  PROVENANCE,
  dateOnly,
  exactInstant,
  localOffsetMinutes,
  localTimeZoneUnknown,
  localZone,
  now,
  todayLocal,
  describeTime,
} from "../store/time.js";
import { KIND, SOURCE, parameterDef, parameterDefs } from "../store/ledger.js";
import { fmtEventTime, fmtShort } from "../ui/format.js";
import { t } from "../strings.js";

/* --- the time control ---------------------------------------------------- */

export function timeControl({ initialDate, initialTime, initialProvenance, onChange }) {
  const state = {
    date: initialDate || todayLocal(),
    time: initialTime || "",
    /* Deliberately null. Nothing is chosen until the keeper chooses. */
    provenance: initialProvenance || null,
    choice: null,
  };

  const dateInput = h("input", {
    class: "input",
    type: "date",
    value: state.date,
    "aria-label": t("time.date"),
    oninput: (e) => {
      state.date = e.target.value;
      emit();
    },
  });

  const timeInput = h("input", {
    class: "input",
    type: "time",
    value: state.time,
    "aria-label": t("time.timeOfDay"),
    oninput: (e) => {
      state.time = e.target.value;
      emit();
    },
  });

  const timeWrap = h("div", { class: "inline" }, dateInput, timeInput);

  const OPTIONS = [
    {
      /* "It is happening now" is the commonest honest answer at a tank, and it
         is genuinely exact. It gets its own button, which FILLS THE FIELD from
         the clock so the keeper can see the time being saved before they save
         it.

         This is not the same thing as defaulting to now. Nothing is selected
         until it is pressed, the value it writes is visible and editable
         afterwards, and it is the keeper asserting a fact rather than the app
         assuming one. The forbidden version is the one where the field is
         already full when the form opens and a distracted keeper logging
         yesterday's reading never notices. */
      p: PROVENANCE.EXACT_ABSOLUTE,
      key: "NOW",
      label: "time.opt.now",
      hint: "time.opt.nowHint",
      needsTime: true,
      fillsFromClock: true,
    },
    {
      p: PROVENANCE.EXACT_ABSOLUTE,
      key: "EXACT",
      label: "time.opt.exact",
      hint: "time.opt.exactHint",
      needsTime: true,
    },
    {
      p: PROVENANCE.RECONSTRUCTED_WITH_PROVENANCE,
      key: "RECONSTRUCTED",
      label: "time.opt.reconstructed",
      hint: "time.opt.reconstructedHint",
      needsTime: true,
    },
    {
      p: PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN,
      key: "LOCAL",
      label: "time.opt.local",
      hint: "time.opt.localHint",
      needsTime: true,
    },
    {
      p: PROVENANCE.DATE_ONLY,
      key: "DATE_ONLY",
      label: "time.opt.dateOnly",
      hint: "time.opt.dateOnlyHint",
      needsTime: false,
    },
  ];

  const seg = h("div", { class: "seg" });
  const buttons = OPTIONS.map((o) => {
    const b = h(
      "button",
      {
        class: "opt",
        type: "button",
        onclick: () => {
          state.provenance = o.p;
          state.choice = o.key;
          buttons.forEach((x, i) => x.classList.toggle("on", OPTIONS[i].key === o.key));
          if (o.fillsFromClock) {
            /* Read once, here, at the moment of the press. Visible in the field
               immediately, and the keeper can still change it.

               It reads the APPLICATION's clock rather than the wall clock, so
               that in test mode "now" is the instant the keeper set. A button
               labelled "now" that stamped the real time while the whole rest
               of the app was three weeks earlier would file the reading
               outside the window being examined, which is the one thing this
               button must not do. */
            const at = now();
            const p = (n) => String(n).padStart(2, "0");
            state.date = `${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())}`;
            state.time = `${p(at.getHours())}:${p(at.getMinutes())}`;
            dateInput.value = state.date;
          }
          /* When the answer is "date only" the time field is removed, not
             merely ignored. A disabled field still holds a value, and a value
             that is held is a value that can be saved by accident. */
          timeInput.value = o.needsTime ? state.time : "";
          timeInput.hidden = !o.needsTime;
          if (!o.needsTime) state.time = "";
          emit();
        },
      },
      t(o.label),
      h("span", { class: "oz" }, t(o.hint))
    );
    seg.append(b);
    return b;
  });

  const note = h("p", { class: "hint" });

  function emit() {
    note.textContent = describe();
    if (onChange) onChange(read());
  }

  function describe() {
    if (!state.provenance) return t("time.unanswered");
    if (state.provenance === PROVENANCE.DATE_ONLY) return t("time.dateOnlyNote");
    if (!state.time) return t("time.needTime");
    return describeTime({ timeProvenance: state.provenance });
  }

  /* The only way this control yields a time. There is no branch that returns
     an instant when the keeper said "date only", and no branch that invents
     one when they have not answered. */
  function read() {
    if (!state.provenance) return { ok: false, why: t("time.needAnswer") };
    if (state.provenance === PROVENANCE.DATE_ONLY) {
      return { ok: true, time: dateOnly(state.date) };
    }
    if (!state.time) return { ok: false, why: t("time.needTime") };
    if (state.provenance === PROVENANCE.EXACT_ABSOLUTE) {
      return {
        ok: true,
        time: exactInstant(state.date, state.time, localOffsetMinutes(), localZone()),
      };
    }
    /* The other two provenances are honest weaker answers. This build stores
       the wall-clock reading the keeper gave and labels it for what it is; it
       does NOT convert it into an absolute instant, because converting it
       would be exactly the fabrication this control exists to prevent.

       `LOCAL_TIME_ZONE_UNKNOWN` goes through `time.js`'s constructor, so this
       control and the importer build that record the same way and by the same
       code. `RECONSTRUCTED_WITH_PROVENANCE` deliberately does not: the
       contract's `RECONSTRUCTED` means the historical offset was independently
       proven AND the proof recorded, and this control records no proof. It
       stores the wall-clock reading and its label, which is the honest thing a
       control with no proof can do. */
    if (state.provenance === PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN) {
      return { ok: true, time: localTimeZoneUnknown(state.date, state.time) };
    }
    return {
      ok: true,
      time: Object.freeze({
        timeProvenance: state.provenance,
        localDate: state.date,
        localTime: state.time,
      }),
    };
  }

  /* Remove every option stronger than the one given, by KEY rather than by
     rendered text. A correction sheet uses this so a date-only record cannot
     be offered a time; matching on the visible label would break the moment
     someone rewords it in the strings file. Removed rather than disabled: a
     disabled control still tells the keeper the app could do it if they
     insisted. */
  function removeOptionsAbove(provenance) {
    const rank = {
      [PROVENANCE.DATE_ONLY]: 0,
      [PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN]: 1,
      [PROVENANCE.RECONSTRUCTED_WITH_PROVENANCE]: 2,
      [PROVENANCE.EXACT_ABSOLUTE]: 2,
    };
    const ceiling = rank[provenance];
    OPTIONS.forEach((o, i) => {
      if (rank[o.p] > ceiling) buttons[i].remove();
    });
  }

  emit();
  return {
    removeOptionsAbove,
    node: h(
      "div",
      { class: "field" },
      h("span", { class: "flabel" }, t("time.when")),
      timeWrap,
      h("span", { class: "flabel", style: { marginTop: "var(--sp-3)" } }, t("time.howWell")),
      seg,
      note
    ),
    read,
  };
}

/* --- the shared sheet ---------------------------------------------------- */

export function openSheet({ title, body, actions, onClose }) {
  const wrap = h("div", { class: "sheetwrap" });
  const sheet = h("div", { class: "sheet" });
  const close = () => {
    off();
    wrap.remove();
    if (onClose) onClose();
  };
  const off = onEscape(close);

  sheet.append(
    h(
      "div",
      { class: "card-head" },
      h("h2", null, title),
      h("button", { class: "mclose", type: "button", "aria-label": t("action.close"), onclick: close }, "×")
    ),
    body
  );
  if (actions) sheet.append(h("div", { class: "btn-row" }, ...actions(close)));
  wrap.append(sheet);
  wrap.addEventListener("click", (e) => {
    if (e.target === wrap) close();
  });
  document.body.append(wrap);
  return { close, sheet };
}

/* --- logging a reading ---------------------------------------------------
   Used by Today's inline rows and by Test Lab. Both routes write the same
   record through the same function, so an entry cannot mean two things
   depending on where it was typed. */
export async function logReading(store, { parameter, rawValue, time, source = SOURCE.KEEPER_ENTRY }) {
  const def = parameterDef(parameter);
  if (!def) throw new Error(t("entry.unknownParameter", { key: parameter }));

  const text = String(rawValue).trim();
  if (text === "") {
    /* An empty field is not zero and not the previous value. It is nothing,
       and nothing is not saved. */
    throw new Error(t("entry.empty"));
  }
  const normalized = Number(text);
  if (!Number.isFinite(normalized)) throw new Error(t("entry.notANumber", { text }));

  const ev = await store.ledger.append({
    kind: KIND.READING,
    parameter,
    rawValue: text,
    normalizedValue: normalized,
    unit: def.unit,
    time,
    recordedAt: new Date().toISOString(),
    source,
  });

  /* Logging the reading IS the completion of its test task. One update, so
     there is never a window in which the reading exists and the tick does not. */
  const [tasks, completions] = await Promise.all([store.tasks.tasks(), store.tasks.completions()]);
  const { autoCompletions } = await import("../store/schedule.js");
  const made = autoCompletions(tasks, completions, parameter, time.localDate);
  await store.tasks.writeCompletions(made);

  return { event: ev, completions: made };
}

/* --- correcting one ------------------------------------------------------
   A correction appends. The original stays exactly as it was and stays
   readable; the sheet says so before the keeper commits, because "edit" in
   most applications means "destroy the previous value" and here it does not. */
export async function supersedeReading(store, { originalEventId, rawValue, time, note }) {
  const projected = await store.ledger.projection();
  const row = projected.find((r) => r.event.eventId === originalEventId);
  if (!row) throw new Error(t("entry.notInRecord"));
  const def = parameterDef(row.event.parameter);

  const text = String(rawValue).trim();
  const normalized = Number(text);
  if (!Number.isFinite(normalized)) throw new Error(t("entry.notANumber", { text }));

  return store.ledger.append({
    kind: row.event.kind,
    parameter: row.event.parameter,
    rawValue: text,
    normalizedValue: normalized,
    unit: def ? def.unit : row.event.unit,
    time,
    recordedAt: new Date().toISOString(),
    source: SOURCE.KEEPER_CORRECTION,
    supersedes: originalEventId,
    detail: note ? { note } : {},
  });
}

/* What the keeper is told before they correct something. Stated plainly,
   because the audit consequence is the point. */
export function auditConsequence(row) {
  const lines = [t("entry.audit.kept")];
  if (row.event.time.timeProvenance === PROVENANCE.DATE_ONLY) {
    lines.push(t("entry.audit.dateOnly"));
  }
  lines.push(t("entry.audit.assessments"));
  return lines;
}

export { parameterDefs, fmtEventTime, fmtShort };
