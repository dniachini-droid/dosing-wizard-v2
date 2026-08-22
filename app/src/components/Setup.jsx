import { useEffect, useMemo, useRef, useState } from 'react'
import { Btn, Field, SectionTitle, inputCls } from './DoseExpectation.jsx'
import { Card, DeleteButton } from './ErrorBoundary.jsx'
import {
  Beaker, Bell, ChevronDown, ChevronUp, Download, Plus, Save, Settings2, SunMedium, Upload, Waves,
} from '../icons.jsx'
import { fmtAmount, fmtPotency, fmtTime } from '../lib/format.js'
import { todayStr, fmtDate } from '../lib/dates.js'
import { nowTime } from '../lib/clock.js'
import { CHEMICALS, KEEPER_FACTS, POTENCY_FORM, potencyForThisTank } from '../store/config.js'
import { ImportPanel } from './ImportPanel.jsx'
import { TestMode } from './TestMode.jsx'
import { MODE, currentMode } from '../store/mode.js'
import { t } from '../strings.js'

/* ---------------------------------- Setup ---------------------------------- */

/* THE CARD PATTERN, AND AN HONEST NOTE ABOUT WHERE IT CAME FROM.

   The brief asks for "V1's expandable card pattern, ported: icon in a tinted
   square, small coloured category label, bold black heading, grey subtitle
   with a count or status, chevron on the right in the category colour,
   expanding in place."

   That pattern is not in V1's source. V1's `Setup.jsx` at `9276a2c` is a flat
   list of plain `Card`s with no icon square, no category label and no
   expansion; `original-artifact.html`, V1's single-file ancestor, does not
   have it either. It was searched for rather than assumed.

   So `SetupSection` below is written to the brief's description, in V1's
   visual language — V1's `Card`, V1's icon set, V1's type scale and V1's
   colours. It is NOT in `docs/migration/PORT-MANIFEST.md`, because there is no
   V1 original to diff it against and listing it as a port would be the exact
   claim this port exists to stop being made without evidence. It is recorded
   in `docs/migration/PORT-OMISSIONS.md` instead.

   WHAT ELSE LEFT V1's SETUP. It was 931 lines and imported the magnesium gate,
   a settle-window function, kit-noise figures and a correction calculator —
   V1's FOURTH implementation of that calculator. None of it crossed. The
   correction calculator is recorded for later and is not built now; the
   opening animation is out by the brief and was `LEAVE_BEHIND` in the salvage
   inventory anyway. */

function SetupSection({ icon: Icon, category, colour, heading, subtitle, open, onToggle, children }) {
  return (
    <Card className="mb-3 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: colour + "1A" }}>
          <Icon size={18} style={{ color: colour }} strokeWidth={2.4} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.13em]"
            style={{ color: colour }}>
            {category}
          </span>
          <span className="block text-[15px] font-black text-ink truncate">{heading}</span>
          <span className="block text-[11px] font-bold text-ink2 truncate">{subtitle}</span>
        </span>
        {open
          ? <ChevronUp size={18} style={{ color: colour }} className="shrink-0" />
          : <ChevronDown size={18} style={{ color: colour }} className="shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-app pt-3">{children}</div>}
    </Card>
  );
}

/* ============================================================================
   WHAT SETUP SHOWS IS READ FROM THE CONFIGURATION, EVERY TIME IT CHANGES
   ----------------------------------------------------------------------------
   The screen used to take one copy of the configuration when it mounted and
   hold it for the rest of its life. Every field below was a `useState`
   initialiser, and a `useState` initialiser runs ONCE. Saving appends a new
   configuration version and the `config` prop changes; the screen went on
   rendering the copy it took at the start.

   That is a screen and an engine reading from two different places, which is
   the fault this round exists to remove: a number the app is not using is worse
   than a wrong one, because nothing beside it can be trusted either.

   So the readers are named functions rather than inline initialisers, and the
   effect below re-runs every one of them whenever the configuration VERSION
   changes. Keying on `configVersionId` rather than on the object is what makes
   typing survive: the version changes when something is stored, and not when a
   parent happens to re-render.

   Nothing here derives a value. Each function reads one stored field and turns
   it into the string an input renders, and `derived` below still renders the
   ENGINE's own figure for the grams-per-litre form. `ALK-014` keeps its one
   owner. */

function factsFrom(config) {
  const out = {};
  for (const f of KEEPER_FACTS) out[f.key] = config && config[f.key] != null ? String(config[f.key]) : "";
  return out;
}

function formFrom(config) {
  return (config && config.potencyStatedAs) || POTENCY_FORM.DKH_PER_ML;
}

function chemicalFrom(config) {
  return (config && config.chemical) || "NA2CO3";
}

function gPerLFrom(config) {
  return config && config.stockConcentrationGPerL != null ? String(config.stockConcentrationGPerL) : "";
}

function per100LFrom(config) {
  return config && config.potencyStatedAs === POTENCY_FORM.DKH_PER_ML_PER_100L
    ? String(config.potencyStatedValue ?? "") : "";
}

export function Setup({ config, onSaveConfig, paramDefs = [], engineResult = null,
  doseChanges = [], onAddDoseChange, onDeleteEvent, onSetStandingDose,
  lightingChanges = [], hiddenNotices = [], onRestoreNotice, onRestoreAllNotices,
  onExport, store = null, onImported = null, onModeChange = null,
  storageHealth = null }) {

  const [openId, setOpenId] = useState(null);
  const testModeOn = currentMode() === MODE.TEST;
  const toggle = (id) => setOpenId(openId === id ? null : id);

  /* ---- the keeper's facts ---------------------------------------------- */
  const [facts, setFacts] = useState(() => factsFrom(config));
  const [factMsg, setFactMsg] = useState("");

  const saveFacts = async (keys) => {
    const values = {};
    for (const k of keys) {
      const raw = facts[k];
      if (raw === "" || raw == null) continue;
      const n = parseFloat(raw);
      if (!Number.isFinite(n)) { setFactMsg("Enter a number."); return; }
      values[k] = n;
    }
    await onSaveConfig(values);
    setFactMsg("Saved.");
    setTimeout(() => setFactMsg(""), 2500);
  };

  /* WHAT THIS SECTION IS STILL WAITING FOR — AND IT COUNTS ONLY WHAT IT ASKS.

     Owner finding 4: "'One more left' persisted; the owner had to press save
     repeatedly before the step completed." It was not a save that failed. This
     counted every one of `KEEPER_FACTS`, including `selectedPotencyDkhPerMl`,
     and this section renders three of them — the volume and the two range
     edges. The strength and the pump's step are asked for in the DOSING section
     below.

     Worse, the strength can be legitimately absent. A keeper who states his
     solution in grams per litre stores `chemical` and `stockConcentrationGPerL`
     and NO `selectedPotencyDkhPerMl`, because the engine derives the potency
     itself and the app storing one as well would override `ALK-014`'s owner
     with a copy. That is `store/config.js`'s own rule, and it made this counter
     permanently stuck at one however many times he pressed save — a screen
     telling him something was missing that he had already supplied, on the same
     screen he had supplied it. */
  const ASKED_HERE = KEEPER_FACTS.filter(
    (f) => f.key === "netVolumeL" || f.key.startsWith("targetRange")
  );
  const missing = ASKED_HERE.filter((f) => !config || config[f.key] == null).length;

  /* ---- dose changes ----------------------------------------------------- */
  const [dcOpen, setDcOpen] = useState(false);
  const [dcFrom, setDcFrom] = useState("");
  const [dcTo, setDcTo] = useState("");
  const [dcDate, setDcDate] = useState(todayStr());
  const [dcTime, setDcTime] = useState(nowTime());

  const newestFirst = useMemo(
    () => [...doseChanges].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [doseChanges]);

  const submitDoseChange = async () => {
    const from = parseFloat(dcFrom), to = parseFloat(dcTo);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return;
    await onAddDoseChange({ fromMlPerDay: from, toMlPerDay: to, date: dcDate, time: dcTime });
    setDcFrom(""); setDcTo(""); setDcDate(todayStr()); setDcTime(nowTime());
  };

  /* ---- ONE dosing section ------------------------------------------------

     "Never ask the same thing twice in different clothes." Solution strength,
     the dose in force and the pump's step used to sit in one card while the
     dose-change history sat in another, and "solution strength" was asked for
     in dKH/mL only — the one form a keeper who mixes his own soda ash does not
     have. Both are one section now, and the strength is asked for once in
     whichever of three forms he actually holds. */
  const DOSED = ["ALK", "CA", "MG"];
  const [dosedKey, setDosedKey] = useState("ALK");
  const dosedDef = paramDefs.find((d) => d.key === dosedKey);

  const [form, setForm] = useState(() => formFrom(config));
  const [chemical, setChemical] = useState(() => chemicalFrom(config));
  const [gPerL, setGPerL] = useState(() => gPerLFrom(config));
  const [per100L, setPer100L] = useState(() => per100LFrom(config));
  const [strengthMsg, setStrengthMsg] = useState("");

  /* THE RE-READ. One effect, one condition: the stored version changed.

     `standing` and `current` are handled at their own declaration below, for
     the same reason and by the same rule — the dose in force is a ledger fact,
     not a configuration field, so it has its own key. */
  const syncedVersion = useRef(config ? config.configVersionId : null);
  useEffect(() => {
    const version = config ? config.configVersionId : null;
    if (version === syncedVersion.current) return;
    syncedVersion.current = version;
    setFacts(factsFrom(config));
    setForm(formFrom(config));
    setChemical(chemicalFrom(config));
    setGPerL(gPerLFrom(config));
    setPer100L(per100LFrom(config));
  }, [config]);

  const netVolumeL = parseFloat(facts.netVolumeL);

  /* What the app can honestly show back as the derived figure, and where it
     came from. For the grams-per-litre form that is the ENGINE's own number —
     `P = factor · C / V` is `ALK-014` and has one owner, so the app renders
     what the engine returned rather than recomputing it. */
  const derived = useMemo(() => {
    if (form === POTENCY_FORM.DKH_PER_ML) return { kind: "stated" };
    if (form === POTENCY_FORM.DKH_PER_ML_PER_100L) {
      const v = potencyForThisTank(parseFloat(per100L), netVolumeL);
      if (v == null) return { kind: Number.isFinite(netVolumeL) ? "none" : "needsVolume" };
      return { kind: "fromVolume", value: v, volume: netVolumeL };
    }
    const p = engineResult && engineResult.potency;
    const v = p && typeof p.theoreticalPotencyDkhPerMl === "number"
      ? p.theoreticalPotencyDkhPerMl : null;
    return v == null ? { kind: "afterSave" } : { kind: "fromEngine", value: v };
  }, [form, per100L, netVolumeL, engineResult]);

  const saveStrength = async () => {
    const values = {};
    if (form === POTENCY_FORM.GRAMS_PER_LITRE) {
      const c = parseFloat(gPerL);
      if (!Number.isFinite(c)) { setStrengthMsg("Enter a number."); return; }
      /* The engine derives the potency from these two. Sending a
         `selectedPotencyDkhPerMl` as well would override its own derivation
         with the app's, so the app clears it rather than holding a stale one. */
      values.chemical = chemical;
      values.stockConcentrationGPerL = c;
      values.selectedPotencyDkhPerMl = null;
      values.potencyStatedValue = c;
    } else if (form === POTENCY_FORM.DKH_PER_ML_PER_100L) {
      const stated = parseFloat(per100L);
      const v = potencyForThisTank(stated, netVolumeL);
      if (v == null) { setStrengthMsg("Enter your net volume above first."); return; }
      values.selectedPotencyDkhPerMl = v;
      values.potencyStatedValue = stated;
    } else {
      const v = parseFloat(facts.selectedPotencyDkhPerMl);
      if (!Number.isFinite(v)) { setStrengthMsg("Enter a number."); return; }
      values.selectedPotencyDkhPerMl = v;
      values.potencyStatedValue = v;
    }
    values.potencyStatedAs = form;
    await onSaveConfig(values);
    setStrengthMsg("Saved.");
    setTimeout(() => setStrengthMsg(""), 2500);
  };

  /* The dose in force. This is the field whose absence stopped the engine
     working out consumption at all — see `lib/record.js` `recordDoseState`. */
  const standing = newestFirst.length ? newestFirst[0].to : null;
  const [current, setCurrent] = useState(() => (standing != null ? String(standing) : ""));
  const [currentMsg, setCurrentMsg] = useState("");

  /* The same re-read as the configuration's, keyed on the ledger fact rather
     than the configuration version, because that is where the standing dose
     lives. Without it the box went on showing the dose that was in force when
     the screen opened, however many changes had been recorded since. */
  const syncedStanding = useRef(standing);
  useEffect(() => {
    if (standing === syncedStanding.current) return;
    syncedStanding.current = standing;
    setCurrent(standing != null ? String(standing) : "");
  }, [standing]);

  /* What the card says about itself when it is shut: the two facts whose
     absence stops the engine answering, named rather than counted. */
  const dosingSubtitle = useMemo(() => {
    const bits = [];
    const hasStrength = config
      && (config.selectedPotencyDkhPerMl != null
        || (config.chemical != null && config.stockConcentrationGPerL != null));
    if (!hasStrength) bits.push("solution strength needed");
    if (standing == null) bits.push("current dose needed");
    return bits.length ? bits.join(" · ") : `${fmtAmount(standing)} mL/day`;
  }, [config, standing]);

  const saveCurrent = async () => {
    const v = parseFloat(current);
    if (!Number.isFinite(v)) { setCurrentMsg("Enter a number."); return; }
    await onSetStandingDose(v);
    setCurrentMsg(t("dosing.currentSaved"));
    setTimeout(() => setCurrentMsg(""), 2500);
  };

  return (
    <div>
      <SectionTitle eyebrow="Configuration" title="Setup" />

      {/* ---- the tank's own facts --------------------------------------- */}
      <SetupSection icon={Waves} category="Tank" colour="#0B7C86"
        heading="Your tank"
        subtitle={missing ? `${missing} still needed` : "all set"}
        open={openId === "tank"} onToggle={() => toggle("tank")}>
        {/* V1 canon's rule, carried across as a principle: "Setup asks for
            facts, not judgements." Every field here is something only the
            keeper knows and the app cannot default. Nothing here is a
            threshold, a tolerance or a cadence — those are the canon's, and
            the app does not ask because it does not get to choose. */}
        <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
          These are the things only you know. The app will not guess at any of them, and it
          says what it cannot work out without each one.
        </p>
        {ASKED_HERE.map((f) => (
          <Field key={f.key} label={`${t(f.label)}${f.unit ? ` (${f.unit})` : ""}`} className="mb-2">
            <input type="number" inputMode="decimal" className={inputCls}
              value={facts[f.key]} onChange={(e) => setFacts({ ...facts, [f.key]: e.target.value })}
              placeholder={t(f.hint)} />
          </Field>
        ))}
        <Btn className="w-full mt-2"
          onClick={() => saveFacts(["netVolumeL", "targetRangeMinDkh", "targetRangeMaxDkh"])}>
          <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span>
        </Btn>
        {factMsg && <p className="text-[11px] font-extrabold text-teal-brand mt-2">{factMsg}</p>}
      </SetupSection>

      {/* ---- ONE dosing section -----------------------------------------

           `17-DOSING-TAB-SPEC.md`'s companion rule for Setup: one dosing
           section, and never the same question twice in different clothes.
           Solution strength, the dose in force, the pump's step and the record
           of every change are one thing the keeper sets up, so they are one
           card.

           DELIVERY METHOD IS NOT ASKED. The application handles pump-delivered
           maintenance dosing only; corrections may be by hand, maintenance is
           not. There is no choice to make, so there is no question — and
           nothing that can afterwards be reported as "not recorded". */}
      <SetupSection icon={Beaker} category="Dosing" colour="#1D6FA5"
        heading="Dosing"
        subtitle={dosingSubtitle}
        open={openId === "dosing"} onToggle={() => toggle("dosing")}>

        <div className="flex gap-1.5 mb-3">
          {DOSED.map((k) => {
            const def = paramDefs.find((d) => d.key === k);
            if (!def) return null;
            return (
              <button key={k} onClick={() => setDosedKey(k)}
                className="flex-1 rounded-lg py-2 text-[12px] font-extrabold border-2"
                style={{ borderColor: dosedKey === k ? def.color : "#E3ECEA",
                         color: dosedKey === k ? def.color : "#45605F" }}>
                {def.label}
              </button>
            );
          })}
        </div>

        {!(dosedDef && dosedDef.assessed) ? (
          <p className="text-[13px] text-ink2 font-medium leading-relaxed">
            There is no {dosedDef ? (dosedDef.labelMid || dosedDef.label.toLowerCase()) : ""} engine in this
            build, so there is nothing here to set up yet. Its readings are logged and charted like
            every other parameter's.
          </p>
        ) : (
          <>
            {/* ---- solution strength: ONE fact, three ways of saying it ---- */}
            <h4 className="text-[13px] font-black text-ink mb-1">{t("dosing.strengthHead")}</h4>
            <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-2">
              {t("dosing.strengthLead")}
            </p>
            <div className="flex gap-1.5 mb-2.5">
              {Object.keys(POTENCY_FORM).map((k) => (
                <button key={k} onClick={() => setForm(POTENCY_FORM[k])}
                  className="flex-1 rounded-lg py-1.5 px-1 text-[10px] font-extrabold border-2 leading-tight"
                  style={{ borderColor: form === POTENCY_FORM[k] ? "#0B7C86" : "#E3ECEA",
                           color: form === POTENCY_FORM[k] ? "#0B7C86" : "#45605F" }}>
                  {t(`dosing.form.${POTENCY_FORM[k]}`)}
                </button>
              ))}
            </div>

            {form === POTENCY_FORM.GRAMS_PER_LITRE && (
              <>
                <Field label={t("dosing.chemical")} className="mb-2">
                  <select className={inputCls} value={chemical}
                    onChange={(e) => setChemical(e.target.value)}>
                    {CHEMICALS.map((c) => (
                      <option key={c.key} value={c.key}>{t(c.label)}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t("dosing.gPerL")} className="mb-2">
                  <input type="number" inputMode="decimal" className={inputCls}
                    value={gPerL} onChange={(e) => setGPerL(e.target.value)} />
                </Field>
              </>
            )}

            {form === POTENCY_FORM.DKH_PER_ML && (
              <Field label={t("dosing.dkhPerMl")} className="mb-2">
                <input type="number" inputMode="decimal" step="0.0001" className={inputCls}
                  value={facts.selectedPotencyDkhPerMl}
                  onChange={(e) => setFacts({ ...facts, selectedPotencyDkhPerMl: e.target.value })} />
              </Field>
            )}

            {form === POTENCY_FORM.DKH_PER_ML_PER_100L && (
              <Field label={t("dosing.dkhPerMlPer100L")} className="mb-2">
                <input type="number" inputMode="decimal" step="0.0001" className={inputCls}
                  value={per100L} onChange={(e) => setPer100L(e.target.value)} />
              </Field>
            )}

            {/* WHAT WAS DERIVED, AND FROM WHAT. Never silently. */}
            <p className="text-[11px] font-bold text-teal-brand leading-relaxed mb-2">
              {derived.kind === "stated" && t("dosing.statedDirectly")}
              {derived.kind === "fromEngine" && t("dosing.derivedFromEngine", { value: fmtPotency(derived.value) })}
              {derived.kind === "fromVolume" && t("dosing.derivedFromVolume", { value: fmtPotency(derived.value), volume: fmtAmount(derived.volume) })}
              {derived.kind === "needsVolume" && t("dosing.derivedNeedsVolume")}
              {derived.kind === "afterSave" && t("dosing.derivedAfterSave")}
            </p>
            <Btn className="w-full" onClick={saveStrength}>
              <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span>
            </Btn>
            {strengthMsg && <p className="text-[11px] font-extrabold text-teal-brand mt-2">{strengthMsg}</p>}

            {/* ---- the dose in force -------------------------------------- */}
            <div className="border-t border-app mt-4 pt-3">
              <h4 className="text-[13px] font-black text-ink mb-1">{t("dosing.currentHead")}</h4>
              <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-2">
                {t("dosing.currentLead")}
              </p>
              <Field label={t("dosing.current")} className="mb-2">
                <input type="number" inputMode="decimal" step="0.01" className={inputCls}
                  value={current} onChange={(e) => setCurrent(e.target.value)} />
              </Field>
              <p className="text-[11px] font-bold text-ink2 mb-2">
                {standing != null ? t("dosing.currentOnRecord", { dose: fmtAmount(standing) }) : t("dosing.currentNone")}
              </p>
              {standing != null && (
                <p className="text-[11px] font-medium text-ink2 leading-relaxed mb-2">
                  {t("dosing.currentUseChange")}
                </p>
              )}
              <Btn className="w-full" onClick={saveCurrent}>
                <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span>
              </Btn>
              {currentMsg && <p className="text-[11px] font-extrabold text-teal-brand mt-2">{currentMsg}</p>}
            </div>

            {/* ---- the pump's step ---------------------------------------- */}
            <div className="border-t border-app mt-4 pt-3">
              {KEEPER_FACTS.filter((f) => f.key === "recommendationPrecisionMlPerDay").map((f) => (
                <Field key={f.key} label={`${t(f.label)}${f.unit ? ` (${f.unit})` : ""}`} className="mb-2">
                  <input type="number" inputMode="decimal" className={inputCls}
                    value={facts[f.key]} onChange={(e) => setFacts({ ...facts, [f.key]: e.target.value })}
                    placeholder={t(f.hint)} />
                </Field>
              ))}
              <Btn className="w-full" onClick={() => saveFacts(["recommendationPrecisionMlPerDay"])}>
                <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span>
              </Btn>
            </div>

            {/* ---- every change to the dose ------------------------------- */}
            <div className="border-t border-app mt-4 pt-3">
              <h4 className="text-[13px] font-black text-ink mb-1">Dose changes</h4>
              <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
                Every change to the daily dose, newest first. The date and time matter: the engine
                measures the tank's response from the moment the change took effect, so a change made
                at 9am and one made at 9pm are not the same change.
              </p>
        <button onClick={() => setDcOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 rounded-xl border border-app px-3 py-2.5 mb-3">
          <span className="text-[12px] font-extrabold text-teal-brand">Record a dose change</span>
          {dcOpen ? <ChevronUp size={14} className="text-ink2" /> : <ChevronDown size={14} className="text-ink2" />}
        </button>

        {dcOpen && (
          <div className="mb-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="From (mL/day)">
                <input type="number" inputMode="decimal" step="0.1" value={dcFrom}
                  onChange={(e) => setDcFrom(e.target.value)} className={inputCls} />
              </Field>
              <Field label="To (mL/day)">
                <input type="number" inputMode="decimal" step="0.1" value={dcTo}
                  onChange={(e) => setDcTo(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Field label="Date">
                <input type="date" value={dcDate} max={todayStr()}
                  onChange={(e) => setDcDate(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Time">
                <input type="time" value={dcTime} onChange={(e) => setDcTime(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Btn className="w-full mt-3" onClick={submitDoseChange}>
              <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Record it</span>
            </Btn>
          </div>
        )}

        {newestFirst.length === 0 ? (
          <p className="text-[13px] text-ink2 font-medium">No dose changes recorded yet.</p>
        ) : (
          <div className="space-y-1.5">
            {newestFirst.map((d) => (
              <div key={d.id} className="flex items-center gap-2 rounded-lg bg-app px-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-black text-ink truncate">
                    {d.isStart ? (
                      <>{fmtAmount(d.to)} mL/day</>
                    ) : (
                      <>
                        {fmtAmount(d.from)} → {fmtAmount(d.to)} mL/day
                        <span className="text-ink2 font-bold ml-1">
                          ({d.to > d.from ? "+" : ""}{fmtAmount(d.to - d.from)})
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-ink2">
                    {fmtDate(d.date)}{fmtTime(d.time) ? ` · ${fmtTime(d.time)}` : ""}
                    {d.isStart ? " · where the record begins" : ""}
                    {d.fromDerived ? " · the earlier figure is read from the record, not typed" : ""}
                  </div>
                </div>
                <DeleteButton onDelete={() => onDeleteEvent(d.id)} confirmMessage="Dose change removed" />
              </div>
            ))}
          </div>
        )}
            </div>
          </>
        )}
      </SetupSection>

      {/* ---- test mode ---------------------------------------------------
           ROUND THREE, ITEM 9. Here rather than on the tab bar because, in the
           port's own words, "it is not part of keeping a tank". */}
      <SetupSection icon={Settings2} category="Tools" colour="#A2621B"
        heading={t("testmode.title")}
        subtitle={testModeOn ? t("testmode.on") : t("testmode.off")}
        open={openId === "testmode"} onToggle={() => toggle("testmode")}>
        <TestMode onModeChange={onModeChange} />
      </SetupSection>

      {/* ---- lighting ---------------------------------------------------- */}
      <SetupSection icon={SunMedium} category="The tank" colour="#A2621B"
        heading="Lighting changes"
        subtitle={lightingChanges.length ? `${lightingChanges.length} recorded` : "none recorded"}
        open={openId === "lighting"} onToggle={() => toggle("lighting")}>
        <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
          A lighting change marks every chart, because it touches everything. Record one from
          Tasks; this is the list.
        </p>
        {lightingChanges.length === 0 ? (
          <p className="text-[13px] text-ink2 font-medium">Nothing recorded yet.</p>
        ) : (
          <div className="space-y-1.5">
            {lightingChanges.map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg bg-app px-2.5 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-black text-ink truncate">{l.note || "Lighting changed"}</div>
                  <div className="text-[11px] font-bold text-ink2">{fmtDate(l.date)}</div>
                </div>
                <DeleteButton onDelete={() => onDeleteEvent(l.id)} confirmMessage="Lighting change removed" />
              </div>
            ))}
          </div>
        )}
      </SetupSection>

      {/* ---- hidden notices ---------------------------------------------- */}
      <SetupSection icon={Bell} category="Notices" colour="#7B4FCB"
        heading="Hidden notices"
        subtitle={hiddenNotices.length ? `${hiddenNotices.length} put away` : "none put away"}
        open={openId === "hidden"} onToggle={() => toggle("hidden")}>
        {hiddenNotices.length === 0 ? (
          <p className="text-[13px] text-ink2 font-medium">
            Nothing is hidden. A notice you put away comes back on its own if the engine raises it
            with different numbers.
          </p>
        ) : (
          <>
            <div className="space-y-1.5 mb-3">
              {hiddenNotices.map((n) => (
                <div key={n.id} className="flex items-center gap-2 rounded-lg bg-app px-2.5 py-2">
                  <span className="text-[12px] font-bold text-ink min-w-0 flex-1">{n.title}</span>
                  <button onClick={() => onRestoreNotice(n)}
                    className="shrink-0 text-[11px] font-extrabold text-teal-brand">Show again</button>
                </div>
              ))}
            </div>
            <Btn variant="ghost" className="w-full" onClick={onRestoreAllNotices}>Show all again</Btn>
          </>
        )}
      </SetupSection>

      {/* ---- backup and export ------------------------------------------- */}
      <SetupSection icon={Download} category="Your data" colour="#45605F"
        heading="Backup and export"
        subtitle={storageHealth ? storageHealth.summary : "a file you can keep"}
        open={openId === "backup"} onToggle={() => toggle("backup")}>
        <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
          Browser storage is not durable. This writes out everything this device holds — every
          event, every stored assessment with the version that produced it, and the whole
          configuration history — as one file you can keep somewhere else.
        </p>
        <Btn className="w-full" onClick={onExport}>
          <span className="flex items-center justify-center gap-1.5"><Download size={14} /> Export everything</span>
        </Btn>
      </SetupSection>

      {/* ---- the import -------------------------------------------------- */}
      <SetupSection icon={Upload} category="Your data" colour="#45605F"
        heading="Import your history"
        subtitle="from a V1 backup file"
        open={openId === "import"} onToggle={() => toggle("import")}>
        {store
          ? <ImportPanel store={store} onImported={onImported} />
          : <p className="text-[13px] text-ink2 font-medium">The import is not wired up on this screen.</p>}
      </SetupSection>

      {/* V1's opening animation is out by the brief, and the salvage inventory
          had already put it under `LEAVE_BEHIND`: "327 lines of bundle for no
          product function."

          The correction calculator is recorded for later and is not built. V1
          had four implementations of it and one of them lived in this file. */}
      <div className="h-8" />
    </div>
  );
}
