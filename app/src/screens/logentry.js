/* ============================================================================
   RECORDING THE THINGS THAT ARE NOT READINGS
   ----------------------------------------------------------------------------
   Dose changes, water changes, one-off additions, dosing problems, things that
   change what the tank demands, and ICP panels.

   Every one of them carries the same time control as a reading, for the same
   reason. A dose change's time is the most load-bearing time in the app —
   V1 put it well: "Setting a dose at 9am and testing the next morning gives
   the tank a full day, while setting it at 9pm gives it twelve hours, and the
   engine measures from that moment."

   Which is why the dose-change form has a third option the others do not: "I
   made the change but I'm not sure exactly when." That is a real answer, the
   contract has a shape for it, and the alternative — making the keeper pick a
   time they do not know — produces a confident wrong number instead of an
   honest uncertain one.
   ========================================================================= */

import { h } from "../ui/dom.js";
import { KIND, SOURCE, parameterDefs } from "../store/ledger.js";
import { timeControl } from "./entry.js";
import { todayLocal } from "../store/time.js";
import { t } from "../strings.js";

export function renderLogEntry(ctx) {
  const screen = h("main", { class: "screen" });
  screen.append(
    h(
      "header",
      { class: "topbar" },
      h("div", null, h("h1", null, t("log.title")), h("p", { class: "sub" }, t("log.subtitle"))),
      h("button", { class: "backlink", type: "button", onclick: () => ctx.go("testlab") }, t("action.back"))
    )
  );

  screen.append(doseChangeForm(ctx));
  screen.append(waterChangeForm(ctx));
  screen.append(manualCorrectionForm(ctx));
  screen.append(anomalyForm(ctx));
  screen.append(contextEventForm(ctx));
  return screen;
}

function formCard(title, why, fields, onSave, saveLabel) {
  const msg = h("p", { class: "hint" });
  const card = h("section", { class: "card" });
  card.append(h("div", { class: "card-head" }, h("h2", null, title)));
  if (why) card.append(h("p", { class: "body" }, why));
  fields.forEach((f) => card.append(f));
  card.append(msg);
  card.append(
    h(
      "button",
      {
        class: "btn btn-primary",
        type: "button",
        onclick: async () => {
          try {
            const r = await onSave();
            msg.textContent = r === false ? msg.textContent : "Recorded.";
          } catch (e) {
            msg.textContent = e.message;
          }
        },
      },
      saveLabel
    )
  );
  return { card, msg };
}

function field(label, control, hint) {
  return h("div", { class: "field" }, h("span", { class: "flabel" }, label), control, hint ? h("p", { class: "hint" }, hint) : null);
}

function doseChangeForm(ctx) {
  const from = h("input", { class: "input", inputmode: "decimal", "aria-label": t("log.dose.from") });
  const to = h("input", { class: "input", inputmode: "decimal", "aria-label": t("log.dose.to") });
  const tc = timeControl({ initialDate: todayLocal() });

  const uncertain = h("input", { type: "checkbox", id: "dc-uncertain" });
  const earliest = h("input", { class: "input", type: "datetime-local", "aria-label": t("log.dose.earliest") });
  const latest = h("input", { class: "input", type: "datetime-local", "aria-label": t("log.dose.latest") });
  const window = h(
    "div",
    { class: "field", hidden: true },
    h("span", { class: "flabel" }, t("log.dose.between")),
    h("div", { class: "inline" }, earliest, latest),
    h("p", { class: "hint" }, t("log.dose.betweenHint"))
  );
  uncertain.addEventListener("change", () => { window.hidden = !uncertain.checked; });

  let msgRef;
  const { card, msg } = formCard(
    t("log.dose.title"),
    t("log.dose.why"),
    [
      field(t("log.dose.from"), from),
      field(t("log.dose.to"), to),
      tc.node,
      h("label", { class: "field" }, uncertain, t("log.dose.uncertain")),
      window,
    ],
    async () => {
      const when = tc.read();
      if (!when.ok) { msgRef.textContent = when.why; return false; }
      const f = Number(from.value), tt = Number(to.value);
      if (!Number.isFinite(f) || !Number.isFinite(tt)) { msgRef.textContent = t("log.dose.needNumbers"); return false; }
      const detail = { fromMlPerDay: f, toMlPerDay: tt, effectiveAtConfidence: uncertain.checked ? "UNCERTAIN" : "EXACT" };
      if (uncertain.checked) {
        if (!earliest.value || !latest.value) { msgRef.textContent = t("log.dose.needWindow"); return false; }
        detail.effectiveAtEarliest = new Date(earliest.value).toISOString();
        detail.effectiveAtLatest = new Date(latest.value).toISOString();
      }
      await ctx.store.ledger.append({
        kind: KIND.DOSE_CHANGE,
        time: when.time,
        recordedAt: new Date().toISOString(),
        detail,
      });
      ctx.afterDoseChange({ from: f, to: tt, time: when.time });
      return true;
    }
  );
  msgRef = msg;
  return card;
}

function waterChangeForm(ctx) {
  const fraction = h("input", { class: "input", inputmode: "decimal", "aria-label": t("log.water.fraction") });
  const replacement = h("input", { class: "input", inputmode: "decimal", "aria-label": t("log.water.replacement") });
  const measured = h("input", { type: "checkbox", id: "wc-measured" });
  const tc = timeControl({ initialDate: todayLocal() });
  let msgRef;
  const { card, msg } = formCard(
    t("log.water.title"),
    t("log.water.why"),
    [
      field(t("log.water.fraction"), fraction),
      h("label", { class: "field" }, measured, t("log.water.measured")),
      field(t("log.water.replacement"), replacement, t("log.water.replacementHint")),
      tc.node,
    ],
    async () => {
      const when = tc.read();
      if (!when.ok) { msgRef.textContent = when.why; return false; }
      const f = Number(fraction.value);
      if (!Number.isFinite(f) || f <= 0 || f >= 1) { msgRef.textContent = t("log.water.needFraction"); return false; }
      const detail = { changedFraction: f };
      if (measured.checked) {
        const r = Number(replacement.value);
        if (!Number.isFinite(r)) { msgRef.textContent = t("log.water.needReplacement"); return false; }
        detail.replacementAlkalinityDkh = r;
        detail.replacementAlkalinityConfidence = "MEASURED_SAME_BATCH";
      }
      await ctx.store.ledger.append({ kind: KIND.WATER_CHANGE, time: when.time, recordedAt: new Date().toISOString(), detail });
      ctx.refresh();
      return true;
    }
  );
  msgRef = msg;
  return card;
}

function manualCorrectionForm(ctx) {
  const amount = h("input", { class: "input", inputmode: "decimal", "aria-label": t("log.manual.amount") });
  const tc = timeControl({ initialDate: todayLocal() });
  let msgRef;
  const { card, msg } = formCard(
    t("log.manual.title"),
    t("log.manual.why"),
    [field(t("log.manual.amount"), amount), tc.node],
    async () => {
      const when = tc.read();
      if (!when.ok) { msgRef.textContent = when.why; return false; }
      const detail = {};
      if (amount.value.trim() !== "") {
        const a = Number(amount.value);
        if (!Number.isFinite(a)) { msgRef.textContent = t("log.manual.notANumber"); return false; }
        detail.amountMl = a;
      }
      await ctx.store.ledger.append({ kind: KIND.MANUAL_CORRECTION, time: when.time, recordedAt: new Date().toISOString(), detail });
      ctx.refresh();
      return true;
    }
  );
  msgRef = msg;
  return card;
}

function anomalyForm(ctx) {
  const type = h(
    "select",
    { class: "input", "aria-label": t("log.anomaly.what") },
    h("option", { value: "PUMP_STOPPED" }, t("log.anomaly.pumpStopped")),
    h("option", { value: "CONTAINER_EMPTY" }, t("log.anomaly.containerEmpty")),
    h("option", { value: "TUBE_BLOCKED" }, t("log.anomaly.tubeBlocked")),
    h("option", { value: "OTHER" }, t("log.anomaly.other"))
  );
  const fromAt = h("input", { class: "input", type: "datetime-local", "aria-label": t("log.anomaly.from") });
  const toAt = h("input", { class: "input", type: "datetime-local", "aria-label": t("log.anomaly.until") });
  const tc = timeControl({ initialDate: todayLocal() });
  let msgRef;
  const { card, msg } = formCard(
    t("log.anomaly.title"),
    t("log.anomaly.why"),
    [field(t("log.anomaly.what"), type), field(t("log.anomaly.from"), fromAt), field(t("log.anomaly.until"), toAt), tc.node],
    async () => {
      const when = tc.read();
      if (!when.ok) { msgRef.textContent = when.why; return false; }
      if (!fromAt.value || !toAt.value) { msgRef.textContent = t("log.anomaly.needSpan"); return false; }
      await ctx.store.ledger.append({
        kind: KIND.DELIVERY_ANOMALY,
        time: when.time,
        recordedAt: new Date().toISOString(),
        detail: {
          anomalyType: type.value,
          fromAt: new Date(fromAt.value).toISOString(),
          toAt: new Date(toAt.value).toISOString(),
          quantifiedEffect: null,
        },
      });
      ctx.refresh();
      return true;
    }
  );
  msgRef = msg;
  return card;
}

function contextEventForm(ctx) {
  const what = h("input", { class: "input", "aria-label": t("log.context.what") });
  const tc = timeControl({ initialDate: todayLocal() });
  let msgRef;
  const { card, msg } = formCard(
    t("log.context.title"),
    t("log.context.why"),
    [field(t("log.context.what"), what), tc.node],
    async () => {
      const when = tc.read();
      if (!when.ok) { msgRef.textContent = when.why; return false; }
      if (!what.value.trim()) { msgRef.textContent = t("log.context.needWhat"); return false; }
      await ctx.store.ledger.append({
        kind: KIND.CONSUMPTION_CONTEXT_EVENT,
        time: when.time,
        recordedAt: new Date().toISOString(),
        detail: { classification: "KEEPER_REPORTED", materiality: "UNKNOWN", source: SOURCE.KEEPER_ENTRY, what: what.value.trim() },
      });
      ctx.refresh();
      return true;
    }
  );
  msgRef = msg;
  return card;
}

/* --- ICP -----------------------------------------------------------------
   An ICP panel is a lab result covering many elements at once. It is stored as
   one event with its measurements inside, because that is what it is: one
   sample, one date, one report. It is not sent to the alkalinity engine —
   there is no input vocabulary for it in the contract, and inventing one would
   be inventing an input the contract does not declare. */
export function renderIcpEntry(ctx) {
  const screen = h("main", { class: "screen" });
  screen.append(
    h(
      "header",
      { class: "topbar" },
      h("div", null, h("h1", null, t("log.icp.title")), h("p", { class: "sub" }, t("log.icp.subtitle"))),
      h("button", { class: "backlink", type: "button", onclick: () => ctx.go("testlab") }, t("action.back"))
    )
  );

  const lab = h("input", { class: "input", "aria-label": t("log.icp.lab") });
  const tc = timeControl({ initialDate: todayLocal() });
  const rows = [];
  const grid = h("div", { class: "elgrid" });

  /* The elements a panel routinely carries. Their reference ranges are NOT
     here: a reference range is a band edge, band edges are chemistry, and
     there is no canon for any of these. The values are recorded and shown; no
     status is attached to any of them. */
  const ELEMENTS = ["Ca", "Mg", "K", "Sr", "B", "Na", "S", "Li", "Ba", "Br", "I", "F", "Fe", "Cu", "Zn", "Mn", "Ni", "Al", "P", "Si"];
  for (const el of ELEMENTS) {
    const input = h("input", { class: "input", inputmode: "decimal", "aria-label": el });
    rows.push([el, input]);
    grid.append(h("label", { class: "elcell" }, h("span", null, el), input));
  }

  const msg = h("p", { class: "hint" });
  const card = h("section", { class: "card" });
  card.append(
    h("div", { class: "card-head" }, h("h2", null, t("log.icp.panel"))),
    field(t("log.icp.lab"), lab),
    tc.node,
    grid,
    h("p", { class: "inert-note" }, t("log.icp.note")),
    msg,
    h(
      "button",
      {
        class: "btn btn-primary",
        type: "button",
        onclick: async () => {
          const when = tc.read();
          if (!when.ok) return void (msg.textContent = when.why);
          const measurements = {};
          for (const [el, input] of rows) {
            const v = input.value.trim();
            if (v === "") continue;
            const n = Number(v);
            if (!Number.isFinite(n)) return void (msg.textContent = t("log.icp.notANumber", { element: el }));
            measurements[el] = n;
          }
          if (!Object.keys(measurements).length) return void (msg.textContent = t("log.icp.needOne"));
          await ctx.store.ledger.append({
            kind: KIND.ICP_PANEL,
            time: when.time,
            recordedAt: new Date().toISOString(),
            detail: { lab: lab.value.trim() || null, measurements },
          });
          ctx.afterIcp({ count: Object.keys(measurements).length, measurements });
        },
      },
      t("log.icp.record")
    )
  );
  screen.append(card);
  return screen;
}

export { parameterDefs };
