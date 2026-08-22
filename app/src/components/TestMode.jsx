import { useState } from 'react'
import { Btn, Field, inputCls } from './DoseExpectation.jsx'
import { ChevronDown, ChevronUp } from '../icons.jsx'
import { todayStr } from '../lib/dates.js'
import { nowTime } from '../lib/clock.js'
import {
  MODE, currentMode, enterTestMode, leaveTestMode, resetTestData,
  setTestInstant, stepTestDays, testInstant,
} from '../store/mode.js'
import { applySeries, parseSeries, plan, summarise } from '../store/seed.js'
import { t } from '../strings.js'

/* ============================================================================
   TEST MODE — THE SCREEN
   ----------------------------------------------------------------------------
   ROUND THREE, ITEM 9: "test mode has no screen. The mechanism survived the
   port, the surface did not."

   That is exactly what had happened. `store/mode.js` came across whole — two
   databases, one clock, `enterTestMode`, `stepTestDays`, `resetTestData` — and
   so did every one of its sixty-six strings. Nothing imported any of it. The
   mechanism was reachable only from a test.

   This file is the surface and nothing else. It holds no second copy of the
   real/test separation, no second clock and no second seeding grammar: every
   button below calls the module that already owns the thing it does.

   WHY IT LIVES IN SETUP. `settings.testmode.note`, written for it during the
   port: "Off by default, and here rather than on the tab bar, because it is
   not part of keeping a tank."
   ========================================================================= */

export function TestMode({ onModeChange }) {
  const mode = currentMode();
  const on = mode === MODE.TEST;
  const at = testInstant();

  const [date, setDate] = useState(at.date || todayStr());
  const [time, setTime] = useState(at.time || nowTime());
  const [series, setSeries] = useState("");
  const [grammarOpen, setGrammarOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const refresh = () => { if (onModeChange) onModeChange(); };

  const turnOn = () => { enterTestMode({ date, time }); refresh(); };
  const turnOff = () => { leaveTestMode(); refresh(); };
  const step = (n) => { const next = stepTestDays(n); setDate(next.date); refresh(); };
  const goTo = () => { const next = setTestInstant({ date, time }); setDate(next.date); setTime(next.time); refresh(); };

  /* The series is PREVIEWED before it is written. `plan` and `summarise` are
     the seeding module's own; nothing here decides what a line means. */
  const look = () => {
    const { rows, problems } = parseSeries(series);
    if (problems.length) { setPreview({ problems }); return; }
    const planned = plan(rows);
    setPreview({ planned, summary: summarise(planned) });
  };

  const add = async (store) => {
    const { rows, problems } = parseSeries(series);
    if (problems.length) { setMsg(t("testmode.series.fixFirst")); return; }
    const written = await applySeries(store, rows, { config: null });
    setMsg(t("testmode.series.added", { n: written.length }));
    setSeries(""); setPreview(null);
    refresh();
  };

  return (
    <div>
      <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">{t("testmode.subtitle")}</p>

      {!on ? (
        <>
          <div className="rounded-xl p-3 mb-3" style={{ background: "#F3F7F6", border: "1px solid #E3ECEA" }}>
            <h4 className="text-[13px] font-black text-ink mb-1">{t("testmode.offTitle")}</h4>
            <p className="text-[12px] text-ink font-medium leading-relaxed">{t("testmode.offBody")}</p>
          </div>

          <h4 className="text-[13px] font-black text-ink mb-1">{t("testmode.startAt")}</h4>
          <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-2">{t("testmode.startHint")}</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Field label={t("testmode.startDate")}>
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={t("testmode.startTime")}>
              <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </div>
          <Btn className="w-full" onClick={turnOn}>{t("testmode.turnOn")}</Btn>

          <div className="border-t border-app mt-4 pt-3">
            <h4 className="text-[13px] font-black text-ink mb-1">{t("testmode.whatItIsTitle")}</h4>
            <p className="text-[12px] text-ink font-medium leading-relaxed mb-1.5">{t("testmode.whatItIs")}</p>
            <p className="text-[12px] text-ink font-medium leading-relaxed mb-1.5">{t("testmode.whatItIsNot")}</p>
            <p className="text-[11px] text-teal-brand font-bold leading-relaxed">{t("testmode.samePathNote")}</p>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl p-3 mb-3" style={{ background: "#FBF1E4", border: "1px solid #E8D6BC" }}>
            <h4 className="text-[13px] font-black text-ink mb-1">{t("testmode.onTitle")}</h4>
            <p className="text-[12px] text-ink font-medium leading-relaxed">{t("testmode.onBody")}</p>
            <p className="text-[15px] font-black text-ink mt-2 tabular-nums">{at.date} · {at.time}</p>
          </div>

          <div className="flex items-center gap-2 mb-3" role="group" aria-label={t("testmode.stepper.aria")}>
            <button onClick={() => step(-1)} aria-label={t("testmode.stepper.back")}
              className="flex-1 rounded-xl border-2 border-app py-2.5 text-[13px] font-extrabold text-ink2">
              ← {t("testmode.stepper.back")}
            </button>
            <button onClick={() => step(1)} aria-label={t("testmode.stepper.forward")}
              className="flex-1 rounded-xl border-2 border-app py-2.5 text-[13px] font-extrabold text-ink2">
              {t("testmode.stepper.forward")} →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Field label={t("testmode.jumpTo")}>
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={t("testmode.timeOfDay")}>
              <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </div>
          <Btn className="w-full mb-3" onClick={goTo}>{t("testmode.goTo")}</Btn>

          {/* ---- enter a series ---------------------------------------- */}
          <div className="border-t border-app pt-3">
            <h4 className="text-[13px] font-black text-ink mb-1">{t("testmode.series.title")}</h4>
            <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-2">{t("testmode.series.body")}</p>

            <button onClick={() => setGrammarOpen((v) => !v)}
              className="flex items-center gap-1 text-[12px] font-extrabold text-teal-brand mb-2">
              {t("testmode.series.title")}
              {grammarOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {grammarOpen && (
              <pre className="rounded-xl p-2.5 text-[10px] leading-relaxed overflow-x-auto mb-2"
                style={{ background: "#F7FAFA", color: "#3D5654" }}>
                {t("testmode.series.grammar")}
              </pre>
            )}

            <textarea className={`${inputCls} font-mono text-[12px]`} rows={8}
              aria-label={t("testmode.series.aria")} placeholder={t("testmode.series.placeholder")}
              value={series} onChange={(e) => { setSeries(e.target.value); setPreview(null); }} />
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-1.5 mb-2">
              {t("testmode.series.note")}
            </p>

            <button onClick={look}
              className="w-full rounded-xl border-2 border-app py-2 text-[12px] font-extrabold text-ink2 mb-2">
              {t("testmode.series.willAdd", { n: preview && preview.planned ? preview.planned.length : 0 })}
            </button>

            {preview && preview.problems && (
              <div className="rounded-xl p-2.5 mb-2" style={{ background: "#FBE9EF", border: "1px solid #F0C8D6" }}>
                <p className="text-[12px] font-bold text-ink mb-1">
                  {t("testmode.series.problems", { n: preview.problems.length })}
                </p>
                {preview.problems.map((pr, i) => (
                  <p key={i} className="text-[11px] text-ink2 font-medium">
                    {t("testmode.series.problemLine", { n: pr.line })} — {pr.why}
                  </p>
                ))}
              </div>
            )}

            <SeriesAdd onAdd={add} disabled={!series.trim()} />
            {msg && <p className="text-[11px] font-extrabold text-teal-brand mt-2">{msg}</p>}
          </div>

          {/* ---- where this is being kept ------------------------------- */}
          <div className="border-t border-app mt-4 pt-3">
            <h4 className="text-[13px] font-black text-ink mb-1">{t("testmode.separation.title")}</h4>
            <p className="text-[12px] text-ink font-medium leading-relaxed mb-1.5">{t("testmode.separation.body")}</p>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed">{t("testmode.separation.note")}</p>
          </div>

          {/* ---- clear the test data ------------------------------------ */}
          <div className="border-t border-app mt-4 pt-3">
            <h4 className="text-[13px] font-black text-ink mb-1">{t("testmode.reset.title")}</h4>
            <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-2">{t("testmode.reset.body")}</p>
            {confirmReset ? (
              <>
                <p className="text-[12px] font-bold text-ink mb-1">{t("testmode.reset.confirmBody")}</p>
                <p className="text-[11px] text-ink2 font-medium mb-2">{t("testmode.reset.confirmNote")}</p>
                <button
                  className="w-full rounded-xl py-2.5 text-[13px] font-extrabold text-white bg-rose-600"
                  onClick={async () => {
                    try { await resetTestData(); setMsg(t("testmode.reset.title")); }
                    catch (e) { setMsg(t("testmode.reset.failed", { error: (e && e.message) || "" })); }
                    setConfirmReset(false);
                    refresh();
                  }}>
                  {t("testmode.reset.confirmAction")}
                </button>
              </>
            ) : (
              <button
                className="w-full rounded-xl py-2.5 text-[13px] font-extrabold text-rose-600 border-2 border-rose-200"
                onClick={() => setConfirmReset(true)}>
                {t("testmode.reset.action")}
              </button>
            )}
          </div>

          <div className="border-t border-app mt-4 pt-3">
            <button className="w-full rounded-xl border-2 border-app py-2.5 text-[13px] font-extrabold text-ink2"
              onClick={turnOff}>
              {t("testmode.turnOff")}
            </button>
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">{t("testmode.stepNote")}</p>
          </div>
        </>
      )}
    </div>
  );
}

/* The add button needs the TEST store, and the test store is the one
   `storeForMode` returns for the mode that is actually current. Asking for it
   at the moment of the click rather than holding one is what keeps this
   surface from being a second owner of which store is in force. */
function SeriesAdd({ onAdd, disabled }) {
  const [busy, setBusy] = useState(false);
  return (
    <Btn className="w-full" disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        const { storeForMode, currentMode: cm } = await import("../store/mode.js");
        try { await onAdd(storeForMode(cm())); } finally { setBusy(false); }
      }}>
      {t("testmode.series.add")}
    </Btn>
  );
}

/* The marker that says this is not the keeper's tank. It is deliberately loud
   and deliberately always visible while test mode is on: the one failure this
   whole separation exists to prevent is a keeper reading a test answer as his
   own tank's. */
export function TestModeMarker() {
  if (currentMode() !== MODE.TEST) return null;
  const at = testInstant();
  return (
    <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2"
      style={{ background: "#A2621B", color: "#fff" }}>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">
        {t("testmode.marker.tag")}
      </span>
      <span className="text-[11px] font-bold opacity-90">
        {t("testmode.marker.detail", { date: at.date, time: at.time })}
      </span>
    </div>
  );
}
