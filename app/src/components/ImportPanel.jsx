import { useState } from 'react'
import { Btn, Field, inputCls } from './DoseExpectation.jsx'
import { Upload, AlertTriangle, Check } from '../icons.jsx'
import {
  applyImport, checkCounts, describePlan, parseBackup, planImport,
} from '../store/import-v1.js'
import { ASSUMPTION, localOffsetMinutes, localZone, nowIso } from '../store/time.js'
import { sayParameter } from '../present/wording.js'
import { t } from '../strings.js'

/* ============================================================================
   THE IMPORT, GIVEN A SURFACE AGAIN
   ----------------------------------------------------------------------------
   The brief keeps V2's import — "Keep V2's storage layer entirely ... the
   import" — and says the owner will re-import his history from Settings
   afterwards. The import MODULE (`app/src/store/import-v1.js`, a thousand
   lines) was never in question and is untouched. Its SCREEN was V2's
   `app/src/screens/importv1.js`, and that went with the rest of the V2
   interface.

   This is that screen, in V1's visual language, inside the ported Setup. It
   calls the same four functions in the same order the deleted screen did —
   `parseBackup`, `checkCounts`, `planImport`, `describePlan`, then
   `applyImport` — and adds no rule of its own.

   THE PART THAT MATTERS, STATED BEFORE ANYTHING IS WRITTEN

   A reading recorded with a date and no time keeps a date and no time. The
   assumption applied to the ones that DO have a wall-clock time is the
   device's own offset, it is carried on every record it touches, and it is
   named on screen with its offset before the keeper presses anything. Where
   that sits against canon `SHARED-LEGACY-TIME-001` is an open item in
   `app/src/store/time.js`, recorded rather than argued away.
   ========================================================================= */

const ASSUMPTION_BASIS = ASSUMPTION.DEVICE_ZONE;

function assumptionNow() {
  return {
    basis: ASSUMPTION_BASIS,
    zoneId: localZone() || null,
    offsetMinutes: localOffsetMinutes(),
    appliedAt: nowIso(),
  };
}

function Refusal({ title, body, items = [] }) {
  return (
    <div className="rounded-xl p-3 mb-3" style={{ background: "#C4285B10", border: "1px solid #C4285B44" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <AlertTriangle size={14} color="#C4285B" />
        <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "#C4285B" }}>{title}</span>
      </div>
      <p className="text-[12px] text-ink font-medium leading-relaxed">{body}</p>
      {items.length > 0 && (
        <ul className="mt-1.5 space-y-0.5">
          {items.slice(0, 20).map((x, i) => (
            <li key={i} className="text-[11px] text-ink2 font-semibold">· {x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ImportPanel({ store, onImported }) {
  const [stage, setStage] = useState("idle");
  const [refusal, setRefusal] = useState(null);
  const [plan, setPlan] = useState(null);
  const [report, setReport] = useState(null);
  const [written, setWritten] = useState(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setStage("idle"); setRefusal(null); setPlan(null); setReport(null); setWritten(null); };

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    reset();
    setBusy(true);
    try {
      const text = await file.text();

      const parsed = parseBackup(text);
      if (!parsed.ok) {
        setRefusal({ title: t("import.refused.title"), body: parsed.why });
        setStage("refused");
        return;
      }

      /* THE FILE'S OWN COUNTS, AGAINST WHAT IS IN IT. A file whose stated
         counts disagree with its contents is not the file it claims to be, and
         importing it anyway would be guessing which half to believe. */
      const counts = checkCounts(parsed.doc);
      if (counts.disagreements.length) {
        const allUnstated = counts.disagreements.every((d) => d.unstated);
        setRefusal({
          title: t("import.refused.counts"),
          body: allUnstated ? t("import.refused.countsUnstated") : t("import.refused.countsBody"),
          items: counts.disagreements.map((d) =>
            d.unstated
              ? `${d.key}: ${t("import.countUnstated", { actual: d.actual })}`
              : `${d.key}: ${t("import.countMismatch", { stated: d.stated, actual: d.actual })}`),
        });
        setStage("refused");
        return;
      }

      const [projected, completions, config] = await Promise.all([
        store.ledger.projection(),
        store.tasks.completions(),
        store.config.current(),
      ]);
      const assumption = assumptionNow();
      const planned = planImport(parsed.doc, {
        existing: projected, existingCompletions: completions, config, assumption,
      });
      setPlan({ planned, assumption });
      setReport(describePlan(planned, assumption));
      setStage("preview");
    } catch (err) {
      setRefusal({ title: t("import.refused.title"), body: (err && err.message) || String(err) });
      setStage("refused");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const commit = async () => {
    if (!plan) return;
    setBusy(true);
    try {
      const w = await applyImport(store, plan.planned, {
        asOf: nowIso(),
        assumption: plan.assumption,
      });
      setWritten(w);
      setStage("done");
      if (onImported) await onImported();
    } catch (err) {
      setRefusal({ title: t("import.refused.title"), body: (err && err.message) || String(err) });
      setStage("refused");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
        Bring in a backup from the old app. Every reading comes across as the measurement it
        actually was, with the time precision it actually had — a reading recorded with a date
        and no time keeps a date and no time, and nothing invents one for it.
      </p>

      <label className="cursor-pointer block">
        <span className="flex items-center justify-center gap-1.5 w-full px-3.5 py-2 rounded-lg text-sm bg-white border-2 border-app text-ink font-bold">
          <Upload size={14} /> {busy ? "reading…" : "Choose a backup file"}
        </span>
        <input type="file" accept="application/json,.json" onChange={onFile} className="hidden" />
      </label>

      {stage === "refused" && refusal && (
        <div className="mt-3">
          <Refusal title={refusal.title} body={refusal.body} items={refusal.items || []} />
          <Btn variant="ghost" className="w-full" onClick={reset}>Try another file</Btn>
        </div>
      )}

      {stage === "preview" && report && (
        <div className="mt-3">
          {plan.planned.problems.length > 0 && (
            <Refusal
              title="Some rows could not be read"
              body="These are skipped. Everything else below is still importable."
              items={plan.planned.problems.map((p) => p.why)} />
          )}

          <div className="rounded-xl border border-app p-3 mb-3">
            <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
              What this file holds
            </div>
            {report.parameters.map((p) => (
              <div key={p.parameter} className="flex items-baseline justify-between gap-2 py-1 border-t border-app first:border-0">
                <span className="text-[12px] font-bold text-ink">{sayParameter(p.parameter)}</span>
                <span className="text-[12px] font-black text-ink2 text-right">
                  {p.total} · {p.from} to {p.to}
                </span>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-2 py-1 border-t border-app mt-1">
              <span className="text-[11px] font-bold text-ink2">With a time</span>
              <span className="text-[12px] font-black text-ink">{report.withTime}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 py-1 border-t border-app">
              <span className="text-[11px] font-bold text-ink2">Date only</span>
              <span className="text-[12px] font-black text-ink">{report.dateOnly}</span>
            </div>
          </div>

          {/* THE ASSUMPTION, NAMED, WITH ITS OFFSET, BEFORE ANYTHING IS
              WRITTEN. This is the whole of what makes the reconstruction
              legitimate rather than a fabrication. */}
          <div className="rounded-xl p-3 mb-3" style={{ background: "#A2621B10", border: "1px solid #A2621B44" }}>
            <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1" style={{ color: "#A2621B" }}>
              What is being assumed
            </div>
            <p className="text-[12px] text-ink font-medium leading-relaxed">
              The {report.withTime} readings that carry a wall-clock time have no record of which
              offset was in force. This device's offset is applied to all of them —
              {" "}{report.assumedZoneId || "your timezone"}, {report.assumedOffsetMinutes} minutes
              from UTC — and every record it touches carries that assumption with it.
              The {report.dateOnly} readings with no time are left with no time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Btn variant="ghost" onClick={reset}>Cancel</Btn>
            <Btn onClick={commit} disabled={busy}>
              <span className="flex items-center justify-center gap-1.5">
                <Check size={14} /> {busy ? "Importing…" : "Import"}
              </span>
            </Btn>
          </div>
        </div>
      )}

      {stage === "done" && written && (
        <div className="mt-3 rounded-xl p-3" style={{ background: "#0B7C8610", border: "1px solid #0B7C8644" }}>
          <div className="text-[10px] font-extrabold uppercase tracking-wide text-teal-brand mb-1.5">
            Imported
          </div>
          {Object.entries(written).map(([k, n]) => (
            <div key={k} className="flex items-baseline justify-between gap-2 py-0.5">
              <span className="text-[11px] font-bold text-ink2">{k}</span>
              <span className="text-[12px] font-black text-ink">{n}</span>
            </div>
          ))}
          <Btn variant="ghost" className="w-full mt-2" onClick={reset}>Import another file</Btn>
        </div>
      )}
    </div>
  );
}
