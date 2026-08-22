import { useState } from 'react'
import { Btn, PARAM_ICON, SectionTitle } from './DoseExpectation.jsx'
import { Card } from './ErrorBoundary.jsx'
import { ZoomableLineChart } from './ZoomableChart.jsx'
import { Beaker, ChevronDown, ChevronUp } from '../icons.jsx'
import { fmtDate } from '../lib/dates.js'
import { fmtQty } from '../lib/format.js'
import { positionTone } from '../present/position.js'
import {
  PILL, boxes, potencySentence, reasonRows, recommendation, spanInWords,
  statusParts, whyPanel, working,
} from '../present/dosing-tab.js'
import { sayPayloadKey, sayPayloadValue, sayReason } from '../present/wording.js'
import { t } from '../strings.js'

/* ============================================================================
   THE DOSING TAB
   ----------------------------------------------------------------------------
   `17-DOSING-TAB-SPEC.md`, owner-approved line by line, with `jake`'s wording.

   WHAT CHANGED, AND WHY IT NEEDED TO. The ported tab rendered the engine's
   answer as a wall of labelled figures: nine `Block`s, a row per contract
   field, and every reason code the engine emitted with its payload printed
   underneath. On the owner's real tank that was sixty-three reason codes,
   twenty-eight of them the same one, and the most important thing on the
   screen — what to do about his alkalinity — was a row reading "What to do".

   This screen says it in sentences instead, in V1's shape, and puts the
   arithmetic behind one tap.

   IT STILL COMPUTES NOTHING. Canon `X-INV-004`: the domain engine owns
   chemistry, presentation renders structured output, and "no UI component
   independently calculates slope, dose, response class or retest time." Every
   figure below comes from `present/dosing-tab.js`, which reads the engine's
   fields and chooses which sentence fits. There is no threshold in this file
   and no equation in it.
   ========================================================================= */

/* ---- the three summary boxes -------------------------------------------
   V1's, ported. The three sit side by side so the question "does anything need
   doing?" is answered by glancing at the colours rather than by reading three
   assessments.

   Calcium and magnesium show "No engine yet" AND NOTHING ELSE. Canon `X-002`
   makes this build alkalinity-only; a box that also showed a last value
   dressed up as a status would be implying an assessment nothing produced. */
export function DoseElementCard({ def, summary, selected, onSelect }) {
  const Icon = PARAM_ICON[def.key] || Beaker;
  const tone = def.assessed && summary ? summary.tone : "#5F7575";

  return (
    <button onClick={onSelect} className="w-full text-left">
      <Card className="p-3 h-full flex flex-col overflow-hidden transition-all"
        style={{ borderColor: selected ? tone + "66" : undefined,
                 boxShadow: selected ? `0 0 0 2px ${tone}22` : undefined }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{ background: def.color + "22" }}>
            <Icon size={11} style={{ color: def.color }} strokeWidth={2.6} />
          </span>
          <span className="text-[11px] font-black text-ink truncate flex-1 min-w-0">{def.label}</span>
        </div>

        {def.assessed ? (
          <>
            <span className="text-[14px] font-black leading-none tabular-nums" style={{ color: tone }}>
              {summary ? summary.headline : "—"}
            </span>
            <span className="text-[9px] font-bold text-ink2 mt-0.5 truncate">
              {summary ? summary.sub : ""}
            </span>
          </>
        ) : (
          <span className="text-[11px] font-bold text-ink2 leading-tight">
            {t("dosing.summary.noEngine")}
          </span>
        )}
      </Card>
    </button>
  );
}

/* ---- a light-teal information panel, V1's surface ---------------------- */
function Panel({ children, className = "" }) {
  return (
    <div className={`rounded-2xl p-3.5 ${className}`}
      style={{ background: "#F3F7F6", border: "1px solid #E3ECEA" }}>
      {children}
    </div>
  );
}

/* ---- a grey secondary box, V1's surface -------------------------------- */
function Box({ label, value, sub, prose = false, tone = null }) {
  return (
    <div className="rounded-xl p-3 bg-app border border-app">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-ink2 leading-tight">
        {label}
      </div>
      <div className={`${prose ? "text-[13px]" : "text-[18px] tabular-nums"} font-black mt-1 leading-tight`}
        style={{ color: tone || "#12312F" }}>
        {value == null ? t("dosing.boxes.notWorkedOut") : value}
      </div>
      {sub && <div className="text-[10px] font-bold text-ink2 mt-0.5 leading-snug">{sub}</div>}
    </div>
  );
}

/* ---- the severity pill -------------------------------------------------
   `INFO`, `LIMITING` and `BLOCKING` are programming language and meant nothing
   to a reef keeper. `jake`'s names answer the question the keeper actually
   has — what did this do to the answer? — and they render as pills rather than
   as coloured text with a dot beside it. */
const PILL_STYLE = {
  REFUSAL: { bg: "#FBE9EF", fg: "#C4285B" },
  BLOCKING: { bg: "#FBE9EF", fg: "#C4285B" },
  GATING: { bg: "#FBF1E4", fg: "#A2621B" },
  LIMITING: { bg: "#FBF1E4", fg: "#A2621B" },
  INFO: { bg: "#EDF3F2", fg: "#45605F" },
};

function Pill({ severity }) {
  const st = PILL_STYLE[severity] || PILL_STYLE.INFO;
  return (
    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
      style={{ background: st.bg, color: st.fg }}>
      {t(PILL[severity] || "dosing.pill.info")}
    </span>
  );
}

/* ---- show working ------------------------------------------------------
   EXPANDS IN PLACE, collapsed by default. Not a sheet: the number being
   explained stays visible while the explanation is read.

   The button reads "Show working" where the app can state something and
   "Why?" where it cannot — the second is a different promise and the label
   should not pretend otherwise. */
function ShowWorking({ result, config, canExplain }) {
  const [open, setOpen] = useState(false);
  const sections = canExplain ? working(result, config) : [];
  const why = canExplain ? [] : whyPanel(result);
  const rows = reasonRows(result);

  return (
    <div className="mt-2">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[12px] font-extrabold text-teal-brand">
        {canExplain ? t("dosing.reco.showWorking") : t("dosing.reco.why")}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-app p-3">
          {sections.map((s) => (
            <div key={s.title} className="mb-3 last:mb-0">
              <h5 className="text-[12px] font-black text-ink mb-1">{s.title}</h5>
              {s.lines.map((line, i) => (
                <p key={i} className="text-[12px] text-ink font-medium leading-relaxed mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
          ))}

          {why.map((line, i) => (
            <p key={i} className="text-[12px] text-ink font-medium leading-relaxed">{line}</p>
          ))}

          {/* The reason codes sit LAST and inside the working. Never on the
              face of the screen, never in a notification strip. Identical
              codes are already collapsed to one row with a count, and INFO
              codes that carry no calculation never got here at all. */}
          {rows.length > 0 && (
            <div className="mt-3 pt-2 border-t border-app">
              {rows.map((r) => (
                <div key={r.code} className="py-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Pill severity={r.severity} />
                    {r.count > 1 && (
                      <span className="text-[10px] font-extrabold text-ink2">× {r.count}</span>
                    )}
                  </div>
                  <p className="text-[12px] text-ink font-medium leading-relaxed">{sayReason(r.code)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- correction in progress --------------------------------------------
   V1's panel, above the recommendation. THERE IS NO CANCEL LINK: a correction
   is a fact about what the keeper did, not a mode he is in. It ends when the
   app determines the dose has settled, or when a new dose change starts a new
   one — and the panel says so rather than offering to undo a thing that
   already happened. */
function CorrectionInProgress({ result }) {
  const iv = result && result.activeIntervention;
  if (!iv || typeof iv !== "object") return null;
  const at = iv.actualStartTime || iv.effectiveAt;
  if (!at) return null;

  const from = typeof iv.fromMlPerDay === "number" ? fmtQty(iv.fromMlPerDay, "mlPerDay") : null;
  const to = typeof iv.toMlPerDay === "number" ? fmtQty(iv.toMlPerDay, "mlPerDay") : null;
  const next = result.retest && result.retest.recommendedAt;

  return (
    <Panel className="mb-3">
      <h4 className="text-[13px] font-black text-ink mb-1">{t("dosing.correction.title")}</h4>
      {from && to && (
        <p className="text-[12px] text-ink font-medium leading-relaxed">
          {t("dosing.correction.body", { date: fmtDate(String(at).slice(0, 10)), from, to })}
        </p>
      )}
      {next && (
        <p className="text-[12px] text-ink font-medium leading-relaxed mt-1">
          {t("dosing.correction.nextTest", { date: fmtDate(String(next).slice(0, 10)) })}
        </p>
      )}
      <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-1.5">
        {t("dosing.correction.ends")}
      </p>
    </Panel>
  );
}

/* ---- the chart ---------------------------------------------------------
   7 and 14 day tabs. NO DOTTED MARKERS AND NO "NOT ELIGIBLE" LEGEND: every
   reading is an ordinary point on an ordinary line, because that is what it
   is. Which readings the engine could use is the engine's statement and it
   belongs in the working, where it is named in words — a second, weaker
   version of it drawn on the chart is exactly the duplicate ownership
   `MASTER RULE 1` forbids. */
function DosingChart({ def, rows, chartEvents }) {
  const [days, setDays] = useState(7);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const shown = rows.filter((r) => r.date >= cutoff);
  const data = shown.map((r, i) => ({ i, value: r.value, date: r.date, time: r.time }));

  return (
    <div className="mb-4">
      <div className="flex gap-1.5 mb-2" role="group" aria-label={t("dosing.graph.aria")}>
        {[[7, t("dosing.graph.7")], [14, t("dosing.graph.14")]].map(([d, label]) => (
          <button key={d} onClick={() => setDays(d)}
            className="rounded-lg px-3 py-1.5 text-[11px] font-extrabold border-2"
            style={{ borderColor: days === d ? def.color : "#E3ECEA",
                     color: days === d ? def.color : "#45605F" }}>
            {label}
          </button>
        ))}
      </div>
      <ZoomableLineChart data={data} color={def.color} paramName={def.label} unit={def.unit}
        targetRangeMin={def.min} targetRangeMax={def.max} height={220} events={chartEvents} />
    </div>
  );
}

/* ---- the tab ------------------------------------------------------------ */
export function DosingWizard({ paramDefs, engineResult, summaries = {}, latestByParam = {},
  config = null, readings = [], chartEvents = [], onChangeDoseAnyway = null }) {

  const KEYS = ["ALK", "CA", "MG"];
  const items = KEYS.map((key) => ({ key, def: paramDefs.find((d) => d.key === key) })).filter((x) => x.def);
  const [selected, setSelected] = useState("ALK");
  const active = items.find((x) => x.key === selected) || items[0];
  const def = active ? active.def : null;

  const rows = readings.filter((r) => def && r.param === def.key);
  const latest = def ? latestByParam[def.key] : null;
  const assessed = def && def.assessed && engineResult;

  const status = assessed ? statusParts(engineResult) : null;
  const rec = assessed ? recommendation(engineResult, rows.length) : null;
  const three = assessed ? boxes(engineResult) : null;
  const potency = assessed ? potencySentence(engineResult) : null;

  return (
    <div>
      <SectionTitle eyebrow="Two-part" title="Dosing" />

      <div className="grid grid-cols-3 gap-2 mb-4 items-stretch">
        {items.map(({ key, def: d }) => (
          <DoseElementCard key={key} def={d} summary={summaries[key] || null}
            selected={selected === key} onSelect={() => setSelected(key)} />
        ))}
      </div>

      {!def ? null : !def.assessed ? (
        <Panel>
          <p className="text-[13px] text-ink font-medium leading-relaxed">
            There is no {def.labelMid || def.label.toLowerCase()} engine in this build. Readings are
            logged, charted and scheduled exactly as alkalinity's are, and none of them is assessed.
            Nothing here will guess at a dose, because a dose is chemistry and chemistry comes from
            the canon.
          </p>
        </Panel>
      ) : !engineResult ? (
        <Panel>
          <p className="text-[13px] text-ink font-medium leading-relaxed">
            {t("dosing.fresh.sentence")}
          </p>
        </Panel>
      ) : (
        <>
          {/* ONE WIDE BOX, spanning both columns. Four rows that used to be
              separate — where it sits, the latest reading, which way it is
              going, and when it was measured — said as one line in which every
              phrase names its own subject. Safety is gone from here: it is
              redundant with position, and it rendered in red, which read as an
              alarm for good news. */}
          <Panel className="mb-3">
            <p className="text-[15px] font-black text-ink leading-snug"
              style={{ color: positionTone(engineResult.position) }}>
              {status ? t("dosing.status.join", { parts: status }) : t("dosing.status.noReading")}
            </p>
            <p className="text-[11px] font-bold text-ink2 mt-1">
              {latest
                ? latest.time
                  ? t("dosing.status.measured", { date: fmtDate(latest.date), time: latest.time })
                  : t("dosing.status.measuredDateOnly", { date: fmtDate(latest.date) })
                : t("dosing.status.noReadingSub")}
            </p>
          </Panel>

          <CorrectionInProgress result={engineResult} />

          {/* THE RECOMMENDATION. The most important thing on the screen, and it
              reads as sentences. */}
          {rec && (
            <Card className="p-4 mb-4">
              <h3 className="text-[17px] font-black text-ink leading-tight mb-1.5">{rec.head}</h3>
              <p className="text-[13px] text-ink font-medium leading-relaxed">{rec.body.join("")}</p>
              <ShowWorking result={engineResult} config={config} canExplain={rec.canExplain} />
              <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
                {t("dosing.reco.note")}
              </p>
              {/* V1's, kept where a hold is recommended: a hold is advice, and
                  the keeper is allowed to disagree with it. */}
              {rec.offerChangeAnyway && onChangeDoseAnyway && (
                <Btn className="w-full mt-3" onClick={onChangeDoseAnyway}>
                  {t("dosing.reco.changeAnyway")}
                </Btn>
              )}
            </Card>
          )}

          <DosingChart def={def} rows={rows} chartEvents={chartEvents} />

          {three && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Box {...three[0]} />
              <Box {...three[1]} />
              <div className="col-span-2"><Box {...three[2]} /></div>
            </div>
          )}

          {/* THE POTENCY ESTIMATOR, its own box below everything, as a
              sentence rather than four labelled figures. */}
          {potency && (
            <Panel>
              <h4 className="text-[13px] font-black text-ink mb-1">{t("dosing.potency.title")}</h4>
              <p className="text-[12px] text-ink font-medium leading-relaxed">{potency}</p>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

export { spanInWords, sayPayloadKey, sayPayloadValue };
