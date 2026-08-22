import { useState } from 'react'
import { Btn, PARAM_ICON, SectionTitle } from './DoseExpectation.jsx'
import { Card } from './ErrorBoundary.jsx'
import { ZoomableLineChart } from './ZoomableChart.jsx'
import { DeliveredDoseField } from './DeliveredDose.jsx'
import { Beaker, ChevronDown, ChevronUp } from '../icons.jsx'
import { fmtDate, fmtShort } from '../lib/dates.js'
import { chartGroupsFrom } from '../present/episodes.js'
import { fmtPotency, fmtQty } from '../lib/format.js'
import { positionTone } from '../present/position.js'
import {
  PILL, boxes, correctionPanel, potencyBox, reasonRows, recommendation, spanInWords,
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
/* A PANEL STANDS OUT FROM THE PAGE — owner finding 10.

   It was `#F3F7F6` on a `#F3F7F6` page: the same pale teal as the ground behind
   it, so nothing on this tab read as a distinct element and the screen looked
   flat rather than designed. The owner's instruction is a choice between two
   schemes — "either a white page with teal boxes, or a teal page with white
   boxes, not teal on teal" — and the page is already the teal one, so the
   panels are the white ones.

   White, a border and a soft shadow, which is the same surface `Card` uses.
   Two definitions of "a raised surface" would drift apart, so this is deliberately
   the same three values. */
function Panel({ children, className = "" }) {
  return (
    <div className={`rounded-2xl p-3.5 bg-card border border-app shadow-[0_1px_2px_rgba(15,40,45,0.04)] ${className}`}>
      {children}
    </div>
  );
}

/* THE THREE CONSUMPTION BOXES, RAISED — owner finding 10, in his own terms:
   "darker teal, a shadow, and text chosen for contrast against whatever ground
   they sit on."

   They were `bg-app` on a `bg-app` page, which is why they disappeared into it.
   They are the most-looked-at figures on the tab — what the tank uses, what the
   dose supplies, and the difference — so they are the one surface here that is
   deeper than the page rather than lighter than it, and they carry their own
   shadow.

   THE TEXT IS CHOSEN FOR THE GROUND, and that is not decoration. `tone` is
   passed in by `boxes()` for a figure that carries a position colour, and a
   position colour picked for dark text on a pale card is not legible on deep
   teal. So a toned value keeps a pale card to sit on and an untoned one takes
   the deep ground — rather than printing the engine's own colour on a
   background it was never chosen against. */
const DEEP_TEAL = "#0A6570";

function Box({ label, value, sub, prose = false, tone = null }) {
  const onDeep = !tone;
  return (
    <div className="rounded-xl p-3 border shadow-[0_2px_6px_rgba(8,25,29,0.12)] h-full"
      style={{
        background: onDeep ? DEEP_TEAL : "#FFFFFF",
        borderColor: onDeep ? "#08525C" : "#E3ECEA",
      }}>
      <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] leading-tight"
        style={{ color: onDeep ? "#B7E2E3" : "#45605F" }}>
        {label}
      </div>
      <div className={`${prose ? "text-[13px]" : "text-[18px] tabular-nums"} font-black mt-1 leading-tight`}
        style={{ color: onDeep ? "#FFFFFF" : (tone || "#12312F") }}>
        {value == null ? t("dosing.boxes.notWorkedOut") : value}
      </div>
      {sub && (
        <div className="text-[10px] font-bold mt-0.5 leading-snug"
          style={{ color: onDeep ? "#CDEBEB" : "#45605F" }}>
          {sub}
        </div>
      )}
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
/* THE CHANGE YOU MADE, AND WHAT CAME OF IT.

   Finding 12. It renders `correctionPanel()`'s output and holds no rule: which
   state applies, whether the engine has finished with it, and whether a test is
   due now are all decided in `present/dosing-tab.js` from what the engine said.
   This component chooses a sentence per state and draws a button. */
function CorrectionPanel({ result, asOf, dismissed, onDismiss }) {
  const p = correctionPanel(result, asOf);
  if (!p) return null;
  if (p.canDismiss && dismissed === p.signature) return null;

  const stateLine =
    p.state === "tooEarly"
      ? (p.posts != null ? t("dosing.correction.tooEarly", { posts: p.posts })
                         : t("dosing.correction.tooEarlyPlain"))
      : t(`dosing.correction.${p.state}`);

  return (
    <Panel className="mb-3">
      <h4 className="text-[13px] font-black text-ink mb-1">{t("dosing.correction.title")}</h4>
      {p.from != null && p.to != null && (
        <p className="text-[12px] text-ink font-medium leading-relaxed">
          {t("dosing.correction.body", {
            date: fmtDate(p.changedOn),
            from: fmtQty(p.from, "mlPerDay"),
            to: fmtQty(p.to, "mlPerDay"),
          })}
        </p>
      )}

      <p className="text-[12px] text-ink font-bold leading-relaxed mt-1">{stateLine}</p>

      {/* The next test, and never as a date the keeper has already met. */}
      {!p.terminal && p.nextTest && (
        <p className="text-[12px] text-ink font-medium leading-relaxed mt-1">
          {p.nextTest.now
            ? t("dosing.correction.nextTestNow")
            : t("dosing.correction.nextTest", { date: fmtDate(String(p.nextTest.at).slice(0, 10)) })}
        </p>
      )}

      {p.offersNewDose && (
        <p className="text-[12px] text-ink font-medium leading-relaxed mt-1">
          {t("dosing.correction.newDose", { dose: fmtQty(p.recommendedDose, "mlPerDay") })}
        </p>
      )}

      {p.canDismiss ? (
        <button
          onClick={() => onDismiss && onDismiss(p.signature)}
          className="w-full mt-2.5 rounded-xl py-2 text-[12px] font-extrabold text-teal-brand border-2 border-app">
          {t("dosing.correction.close")}
        </button>
      ) : (
        <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-1.5">
          {t("dosing.correction.ends")}
        </p>
      )}
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
function DosingChart({ def, rows, chartEvents, episodes = null }) {
  const [days, setDays] = useState(7);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const shown = rows.filter((r) => r.date >= cutoff);

  /* THE DATES AND THE DOSE-CHANGE MARKERS — owner finding 9, and one cause.

     This built its own point shape: `{ i, value, date, time }`. The chart's
     x-axis is `dataKey="label"` and its event markers place themselves by
     matching an event's date to a point's `label`. Neither could find one, so
     the axis drew no dates and the owner's four imported dose changes drew
     nothing — on a chart that was already being handed them.

     `chartGroupsFrom` is the shape every other chart in the app uses, and it
     is where the point rule lives: one x-position per TEST, with the
     measurements of a repeat test stacked on it rather than spread along the
     axis as if they were separate tests. Building a second point shape here
     was the defect; there is one now. */
  const data = chartGroupsFrom(shown, episodes, fmtShort);

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

/* YOUR SOLUTION'S REAL STRENGTH — finding 13, owner-approved.

   Renders `potencyBox()` and holds no rule: which sentence applies, whether the
   estimate is confident enough to act on and whether the two figures agree are
   all decided in `present/dosing-tab.js` from what the engine said.

   THE TWO BUTTONS ARE THE WHOLE POINT AND THEY ARE NEVER PRE-PRESSED. Neither
   is styled as the safe one, because neither is: the keeper's own figure may be
   right and so may the tank's. Where the box does not offer them, nothing has
   changed and nothing needs his attention. */
function PotencyBox({ box, onAccept, onKeep }) {
  const [open, setOpen] = useState(false);
  const args = {
    learned: box.learned == null ? "—" : fmtPotency(box.learned),
    entered: fmtPotency(box.entered),
    accepted: fmtPotency(box.entered),
    /* The engine's own observed figure, for the state where it has read a
       strength but not gathered enough to be confident in one (finding 12). */
    observed: box.observed == null ? "—" : fmtPotency(box.observed),
    count: box.observations,
  };

  return (
    <Panel>
      <h4 className="text-[13px] font-black text-ink mb-1">{t("dosing.potency.title")}</h4>

      <p className="text-[12px] text-ink font-medium leading-relaxed">
        {box.asksAgain ? t("dosing.potency.asksAgain", args) : t(`dosing.potency.${box.state}`, args)}
      </p>

      {/* Where the figure in use came from, once there is more than one place
          it could have come from. The same line Setup shows. */}
      {box.provenance && (
        <p className="text-[11px] font-bold text-teal-brand leading-relaxed mt-1.5">
          {t(box.provenance.key, {
            value: fmtPotency(box.provenance.value),
            date: fmtDate(box.provenance.date),
          })}
        </p>
      )}

      {box.working.length > 0 && (
        <div className="mt-2">
          <button onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-[12px] font-extrabold text-teal-brand">
            {t("dosing.reco.showWorking")}
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {open && (
            <div className="mt-2 rounded-xl border border-app p-3">
              {box.working.map((line, i) => (
                <p key={i} className="text-[12px] text-ink font-medium leading-relaxed mb-1 last:mb-0">
                  {line}
                </p>
              ))}
              {box.limits.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-[12px] font-black text-ink mb-1">{t("dosing.potency.limitsHead")}</h5>
                  {box.limits.map((r) => (
                    <p key={r.code} className="text-[12px] text-ink2 font-medium leading-relaxed mb-1 last:mb-0">
                      {sayReason(r.code)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {box.offersChoice && (
        <div className="flex gap-2 mt-3">
          <button
            className="flex-1 rounded-xl py-2 text-[12px] font-extrabold text-white bg-teal-brand"
            onClick={() => onAccept && onAccept(box.learned)}>
            {t("dosing.potency.useMeasured")}
          </button>
          <button
            className="flex-1 rounded-xl py-2 text-[12px] font-extrabold text-teal-brand border-2 border-app"
            onClick={() => onKeep && onKeep(box.learned)}>
            {t("dosing.potency.keepEntered")}
          </button>
        </div>
      )}
    </Panel>
  );
}

/* ---- the tab ------------------------------------------------------------ */
export function DosingWizard({ paramDefs, engineResult, summaries = {}, latestByParam = {},
  config = null, readings = [], chartEvents = [], onChangeDoseAnyway = null,
  asOf = null, correctionDismissed = null, onDismissCorrection = null,
  onAcceptPotency = null, onKeepPotency = null, episodes = null,
  standingDose = null, onSetDeliveredDose = null }) {
  /* Whether the delivered-dose field is open on this tab. One flag: there is
     one field, and it is the same field however it was reached. */
  const [doseOpen, setDoseOpen] = useState(false);

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
  const potency = assessed ? potencyBox(engineResult, config) : null;

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

          <CorrectionPanel result={engineResult} asOf={asOf}
            dismissed={correctionDismissed} onDismiss={onDismissCorrection} />

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
              {/* THE DOSE IS SET FROM HERE, AND IT IS THE SAME FIELD SETUP USES
                  (owner finding 19).

                  Two ways in, one of them opening with the engine's figure and
                  one with nothing suggested, both writing through the shell's
                  single path. Whether the keeper took the recommendation or
                  changed it is decided from the figure he saved, not from which
                  button he pressed, so the history is right either way.

                  It opens HERE rather than sending him to Setup: a
                  recommendation he is acting on is on this screen, and a button
                  that navigates away from it loses the thing he was reading. It
                  also used to navigate to a tab that did not exist and leave
                  him on a blank page (finding 20). */}
              {onSetDeliveredDose && (rec.suggestedDose != null || rec.offerChangeAnyway) && (
                doseOpen ? (
                  <div className="mt-3 rounded-xl border border-app p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="text-[13px] font-black text-ink">{t("dose.delivered.head")}</h4>
                      <button onClick={() => setDoseOpen(false)}
                        className="text-[11px] font-extrabold text-ink2">
                        {t("dose.change.close")}
                      </button>
                    </div>
                    <DeliveredDoseField standing={standingDose}
                      suggested={rec.suggestedDose} autoFocus compact
                      onSave={async (args) => { await onSetDeliveredDose(args); setDoseOpen(false); }} />
                  </div>
                ) : (
                  <Btn className="w-full mt-3" onClick={() => setDoseOpen(true)}>
                    {rec.suggestedDose != null
                      ? t("dosing.reco.setDose", { dose: fmtQty(rec.suggestedDose, "mlPerDay") })
                      : t("dosing.reco.changeAnyway")}
                  </Btn>
                )
              )}
            </Card>
          )}

          <DosingChart def={def} rows={rows} chartEvents={chartEvents} episodes={episodes} />

          {three && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Box {...three[0]} />
              <Box {...three[1]} />
              <div className="col-span-2"><Box {...three[2]} /></div>
            </div>
          )}

          {/* THE POTENCY ESTIMATOR, its own box below everything (finding 13). */}
          {potency && (
            <PotencyBox box={potency} onAccept={onAcceptPotency} onKeep={onKeepPotency} />
          )}
        </>
      )}
    </div>
  );
}

export { spanInWords, sayPayloadKey, sayPayloadValue };
