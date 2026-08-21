import { useMemo, useState } from 'react'
import { Btn, Field, SectionTitle, inputCls } from './DoseExpectation.jsx'
import { Card, DeleteButton } from './ErrorBoundary.jsx'
import {
  Beaker, Bell, ChevronDown, ChevronUp, Download, Plus, Save, SunMedium, Upload, Waves,
} from '../icons.jsx'
import { fmtAmount, fmtVal, fmtTime } from '../lib/format.js'
import { todayStr, fmtDate } from '../lib/dates.js'
import { nowTime } from '../lib/clock.js'
import { KEEPER_FACTS } from '../store/config.js'
import { ImportPanel } from './ImportPanel.jsx'
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

export function Setup({ config, onSaveConfig, paramDefs = [],
  doseChanges = [], onAddDoseChange, onDeleteEvent,
  lightingChanges = [], hiddenNotices = [], onRestoreNotice, onRestoreAllNotices,
  onExport, store = null, onImported = null,
  storageHealth = null }) {

  const [openId, setOpenId] = useState(null);
  const toggle = (id) => setOpenId(openId === id ? null : id);

  /* ---- the keeper's facts ---------------------------------------------- */
  const [facts, setFacts] = useState(() => {
    const out = {};
    for (const f of KEEPER_FACTS) out[f.key] = config && config[f.key] != null ? String(config[f.key]) : "";
    return out;
  });
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

  const missing = KEEPER_FACTS.filter((f) => !config || config[f.key] == null).length;

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

  /* ---- dosing setup ----------------------------------------------------- */
  const DOSED = ["ALK", "CA", "MG"];
  const [dosedKey, setDosedKey] = useState("ALK");
  const dosedDef = paramDefs.find((d) => d.key === dosedKey);

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
        {KEEPER_FACTS.filter((f) => f.key === "netVolumeL" || f.key.startsWith("targetRange")).map((f) => (
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

      {/* ---- dose changes, ABOVE dosing setup ---------------------------- */}
      <SetupSection icon={Plus} category="Dosing" colour="#1D6FA5"
        heading="Dose changes"
        subtitle={newestFirst.length ? `${newestFirst.length} recorded` : "none recorded"}
        open={openId === "dosechanges"} onToggle={() => toggle("dosechanges")}>
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
                    {fmtAmount(d.from)} → {fmtAmount(d.to)} mL/day
                    <span className="text-ink2 font-bold ml-1">
                      ({d.to > d.from ? "+" : ""}{fmtAmount(d.to - d.from)})
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-ink2">
                    {fmtDate(d.date)}{fmtTime(d.time) ? ` · ${fmtTime(d.time)}` : ""}
                  </div>
                </div>
                <DeleteButton onDelete={() => onDeleteEvent(d.id)} confirmMessage="Dose change removed" />
              </div>
            ))}
          </div>
        )}
      </SetupSection>

      {/* ---- dosing setup, collapsed by default, set once ---------------- */}
      <SetupSection icon={Beaker} category="Dosing" colour="#1D6FA5"
        heading="Dosing setup"
        subtitle="solution strength and pump increment"
        open={openId === "dosingsetup"} onToggle={() => toggle("dosingsetup")}>
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

        {dosedDef && dosedDef.assessed ? (
          <>
            {KEEPER_FACTS.filter((f) => f.key === "selectedPotencyDkhPerMl" || f.key === "recommendationPrecisionMlPerDay").map((f) => (
              <Field key={f.key} label={`${t(f.label)}${f.unit ? ` (${f.unit})` : ""}`} className="mb-2">
                <input type="number" inputMode="decimal" className={inputCls}
                  value={facts[f.key]} onChange={(e) => setFacts({ ...facts, [f.key]: e.target.value })}
                  placeholder={t(f.hint)} />
              </Field>
            ))}
            <Btn className="w-full mt-2"
              onClick={() => saveFacts(["selectedPotencyDkhPerMl", "recommendationPrecisionMlPerDay"])}>
              <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span>
            </Btn>
          </>
        ) : (
          <p className="text-[13px] text-ink2 font-medium leading-relaxed">
            There is no {dosedDef ? (dosedDef.labelMid || dosedDef.label.toLowerCase()) : ""} engine in this
            build, so there is nothing here to set up yet. Its readings are logged and charted like
            every other parameter's.
          </p>
        )}
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
