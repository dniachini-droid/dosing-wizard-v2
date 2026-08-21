import { useState } from 'react'
import { Btn, FindingList, PARAM_ICON, SectionTitle } from './DoseExpectation.jsx'
import { Card } from './ErrorBoundary.jsx'
import { Beaker, ChevronDown, ChevronUp, X } from '../icons.jsx'
import { fmtAmount, fmtVal, fmtInstant } from '../lib/format.js'
import { positionTone } from '../present/position.js'
import { isPresent, isAbsent, selectCard, safetyWorthSaying } from '../present/cards.js'
import {
  num, signed, valueOrAbsence, sayAction, sayEvidence, sayUncertaintyLimited, sayOuter, sayPosition,
  sayReason, sayResponseClass, sayTrajectory, saySeverity, sayVerb,
  sayPayloadKey, sayPayloadValue, sayParameter,
} from '../present/wording.js'

/* ---------------------------------- Dosing ---------------------------------- */

/* V1's Dosing Wizard layout, with V2's content underneath it.

   THE LAYOUT IS V1'S. Three summary boxes across the top — alkalinity,
   calcium, magnesium — each showing its state at a glance, expandable,
   selectable, with the detail for the selected one below. V1's own reason for
   that shape still holds: the three sit side by side "so the question 'does
   anything need doing?' is answered by glancing at the colours, not by reading
   three assessments."

   THE CONTENT IS NOT. V1's `AlkAssessmentBlock` worked out the dose here, in
   the component, from V1's own alkalinity engine. What sits below the boxes
   now is what V2's engine returned and nothing else: the position, the
   evidence, the consumption, the arithmetic, what was capped and why, the
   response classification, and every reason code with its payload. It is more
   than V1 displayed and it is not laid out the same way, but it is drawn with
   the same components, spacing and styling as the rest of the app.

   CALCIUM AND MAGNESIUM ARE PRESENT AND VISIBLY NOT READY. Canon `X-002` makes
   this build alkalinity-only. V1 had four dose engines; none crossed, and no
   replacement exists for two of them, so their boxes say so rather than
   showing a figure nothing produced. */

/* A summary box. `content` is the card selection and the wording that came out
   of the engine result; this reads it and decides nothing. */
export function DoseElementCard({ def, summary, open, onToggle }) {
  const Icon = PARAM_ICON[def.key] || Beaker;
  const tone = summary ? summary.tone : "#5F7575";

  return (
    <button onClick={onToggle} className="w-full text-left">
      <Card className="p-3 h-full flex flex-col overflow-hidden transition-all"
        style={{ borderColor: open ? tone + "66" : undefined,
                 boxShadow: open ? `0 0 0 2px ${tone}22` : undefined }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{ background: def.color + "22" }}>
            <Icon size={11} style={{ color: def.color }} strokeWidth={2.6} />
          </span>
          <span className="text-[11px] font-black text-ink truncate flex-1 min-w-0">{def.label}</span>
          {open ? <ChevronUp size={13} className="text-ink2 shrink-0" />
                : <ChevronDown size={13} className="text-ink2 shrink-0" />}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-[14px] font-black leading-none tabular-nums" style={{ color: tone }}>
            {summary ? summary.headline : "No engine"}
          </span>
        </div>
        <div className="text-[9px] font-bold text-ink2 mt-0.5 truncate">
          {summary ? summary.sub : "not assessed in this build"}
        </div>

        {summary && summary.value != null && (
          <div className="mt-2">
            <div className="text-[9px] font-bold text-ink2 mt-1 truncate">
              {fmtVal(def, summary.value)}{def.unit}
            </div>
          </div>
        )}
      </Card>
    </button>
  );
}

/* One labelled figure. `valueOrAbsence` is the single owner of "the engine
   declined to produce this": a `NOT_RUN` or a `WITHHELD` is a real value in
   the contract, and rendering one as a blank would drop most of what the
   engine said. */
function Fig({ label, v, decimals = 2, unit = null }) {
  const r = valueOrAbsence(v, { decimals, unit });
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5 border-t border-app first:border-0">
      <span className="text-[11px] font-bold text-ink2 shrink-0">{label}</span>
      <span className="text-[12px] font-black text-right min-w-0"
        style={{ color: r.present ? "#08191D" : "#5F7575" }}>
        {r.text}
      </span>
    </div>
  );
}

function Row({ label, value, tone = null }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5 border-t border-app first:border-0">
      <span className="text-[11px] font-bold text-ink2 shrink-0">{label}</span>
      <span className="text-[12px] font-black text-right min-w-0" style={{ color: tone || "#08191D" }}>
        {value}
      </span>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div className="rounded-xl border border-app p-3 mt-3">
      <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">{title}</div>
      {children}
    </div>
  );
}

/* ---- THE WORKING ---------------------------------------------------------
   Everything below reads fields off one `EngineResult`. There is no branch
   here that compares a value to a band edge, computes a difference or decides
   a class — every one of those has already been decided, and this renders the
   decision. */
export function EngineWorking({ def, result }) {
  const [rawOpen, setRawOpen] = useState(false);
  if (!result) return null;

  const card = selectCard(result);
  const dose = result.doseRecommendation || {};
  const cons = result.consumption || {};
  const pot = result.potency || {};
  const supported = result.supportedTrajectory;
  const observed = result.observedTrajectory;
  const response = result.responseAssessment;
  const safety = result.safety || {};
  const retest = result.retest || {};

  const codes = Array.isArray(result.reasonCodes) ? result.reasonCodes : [];
  /* A cap is a reason code that names what it capped. The engine says which
     ones those are through the payload it attaches; nothing here works out
     whether a cap applied. */
  const capped = codes.filter((c) => c.payload && ("cappedDelta" in c.payload || "uncappedDelta" in c.payload));

  return (
    <div>
      {/* WHAT THE TESTS SHOW */}
      <Block title="What the tests show">
        <Row label="Where it sits" value={sayPosition(result.position)}
          tone={positionTone(result.position)} />
        <Fig label="Latest reading" v={result.latestValidValueDkh} decimals={def.decimals} unit={def.unit} />
        <Row label="Which way it is going" value={sayTrajectory(result.trajectory)} />
        {safetyWorthSaying(result) && (
          <Row label="Safety" value={sayOuter(result.outerBoundState)} tone="#C4285B" />
        )}
        <Row label="Assessed at" value={fmtInstant(result.assessmentAsOf)} />
      </Block>

      {/* WHAT IS CERTAIN ENOUGH TO ACT ON */}
      <Block title="What is certain enough to act on">
        <Row label="Evidence" value={sayEvidence(result.movementEvidence)} />
        {supported && typeof supported === "object" ? (
          <>
            {/* `observedTrajectory` is an object in the contract, not a
                number; reading it as a fallback printed `[object Object]` on
                the first run against the real engine. Its slope is the field
                worth showing. */}
            <Fig label="Movement seen"
              v={observed && typeof observed === "object" ? observed.slope : observed}
              decimals={4} unit={`${def.unit}/day`} />
            <Fig label="Movement supported" v={supported.slope} decimals={4} unit={`${def.unit}/day`} />
            {supported.limitedByUncertainty && (
              <Row label="Limited by" value={sayUncertaintyLimited()} tone="#A2621B" />
            )}
          </>
        ) : (
          <Fig label="Movement supported" v={supported} decimals={4} />
        )}
        {response && typeof response === "object" && (
          <Row label="Response to the last change" value={sayResponseClass(response.responseClass)} />
        )}
      </Block>

      {/* CONSUMPTION */}
      <Block title="What the tank is using">
        <Fig label="Consumption" v={cons.consumptionDkhPerDay ?? cons} decimals={4} unit={`${def.unit}/day`} />
        <Fig label="Delivery" v={cons.D} decimals={2} unit="mL/day" />
        <Fig label="Solution strength used" v={cons.P} decimals={4} unit={`${def.unit}/mL`} />
        {isPresent(cons.deliveryBasis) && (
          <Row label="Delivery worked out from" value={sayPayloadValue(cons.deliveryBasis, "deliveryBasis") || "—"} />
        )}
      </Block>

      {/* THE DOSE ARITHMETIC */}
      <Block title="The dose">
        <Row label="What to do" value={sayVerb(card, dose.action)} />
        <Fig label="Dose now" v={dose.currentDoseMlPerDay ?? dose.currentDose} decimals={2} unit="mL/day" />
        <Fig label="Recommended" v={dose.recommendedDoseMlPerDay ?? dose.recommendedDose} decimals={2} unit="mL/day" />
        <Fig label="Change" v={dose.deltaDoseMlPerDay ?? dose.deltaDose} decimals={2} unit="mL/day" />
        {isPresent(dose.maintenanceActionStatus) && (
          <Row label="Status" value={sayPayloadValue(dose.maintenanceActionStatus, "maintenanceActionStatus") || "—"} />
        )}
      </Block>

      {/* WHAT WAS CAPPED, AND WHY */}
      {capped.length > 0 && (
        <Block title="What was capped, and why">
          {/* Keyed by position, not by code. The engine can emit the same
              reason code more than once in one result — `EPISODE_RESOLVED`
              does, once per episode — and keying on the code silently drops
              all but one of them. */}
          {capped.map((c, i) => (
            <div key={`${c.code}-${i}`} className="py-1.5 border-t border-app first:border-0">
              <div className="text-[12px] font-bold text-ink leading-relaxed">{sayReason(c.code)}</div>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <span className="text-[11px] font-bold text-ink2">
                  {sayPayloadKey("uncappedDelta") || "before"}
                </span>
                <span className="text-[12px] font-black text-ink2">
                  {num(c.payload.uncappedDelta, 2) ?? "—"} mL/day
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-bold text-ink2">
                  {sayPayloadKey("cappedDelta") || "after"}
                </span>
                <span className="text-[12px] font-black text-ink">
                  {num(c.payload.cappedDelta, 2) ?? "—"} mL/day
                </span>
              </div>
            </div>
          ))}
        </Block>
      )}

      {/* WHEN TO TEST AGAIN */}
      {retest && Object.keys(retest).length > 0 && (
        <Block title="When to test again">
          {isPresent(retest.nextUsefulTestAt) && (
            <Row label="Next useful test" value={fmtInstant(retest.nextUsefulTestAt)} />
          )}
          {isPresent(retest.decision) && (
            <Row label="Decision" value={sayPayloadValue(retest.decision, "decision") || "—"} />
          )}
        </Block>
      )}

      {/* EVERY REASON CODE, WITH ITS PAYLOAD */}
      {codes.length > 0 && (
        <Block title="Why it said that">
          {codes.map((c, i) => {
            const pairs = Object.entries(c.payload || {})
              /* The KEY travels with the value. Some payload keys carry engine
                 output names rather than values, and only the key can say
                 which — see `sayPayloadValue`. */
              .map(([k, v]) => [sayPayloadKey(k), sayPayloadValue(v, k)])
              .filter(([k, v]) => k != null && v != null);
            return (
              <div key={`${c.code}-${i}`} className="py-2 border-t border-app first:border-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: c.severity === "REFUSAL" ? "#C4285B" : c.severity === "GATING" ? "#A2621B" : "#45605F" }} />
                  <span className="text-[10px] font-extrabold uppercase tracking-wide"
                    style={{ color: c.severity === "REFUSAL" ? "#C4285B" : c.severity === "GATING" ? "#A2621B" : "#45605F" }}>
                    {saySeverity(c.severity)}
                  </span>
                </div>
                <p className="text-[12px] text-ink font-medium leading-relaxed">{sayReason(c.code)}</p>
                {pairs.length > 0 && (
                  <div className="mt-1">
                    {pairs.map(([k, v]) => (
                      <div key={k} className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] font-bold text-ink2">{k}</span>
                        <span className="text-[11px] font-black text-ink text-right">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </Block>
      )}

      {/* THE DEVELOPER VIEW. Owner decision 9 makes this the one place
          contract vocabulary may appear verbatim, which is why the raw result
          is here and behind a tap rather than anywhere else. */}
      <button onClick={() => setRawOpen((v) => !v)}
        className="w-full text-center mt-3 text-[11px] font-extrabold text-ink2">
        {rawOpen ? "Hide the raw result" : "Show the raw result"}
      </button>
      {rawOpen && (
        <pre className="mt-2 rounded-xl p-2.5 text-[10px] leading-relaxed overflow-x-auto"
          style={{ background: "#F7FAFA", color: "#3D5654" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* ---- THE POTENCY ESTIMATOR ----------------------------------------------
   Built, capability-gated, and until now with no screen anywhere. It shows
   what the engine has learned about the real strength of the solution, how
   confident it is, and — plainly — that this is not what is being used to size
   the dose. */
export function PotencyEstimator({ def, result }) {
  const pot = result && result.potency ? result.potency : null;
  if (!pot) return null;
  const learned = pot.learnedDkhPerMl;
  const theoretical = pot.theoreticalDkhPerMl;
  const selected = pot.selectedPotencyDkhPerMl;

  return (
    <Block title="What the solution actually seems to be">
      <Fig label="Learned from your tank" v={learned} decimals={4} unit={`${def.unit}/mL`} />
      <Fig label="From the bottle" v={theoretical} decimals={4} unit={`${def.unit}/mL`} />
      <Fig label="Being used" v={selected} decimals={4} unit={`${def.unit}/mL`} />
      {isPresent(pot.potencyConfidence ?? pot.confidence) && (
        <Row label="Confidence" value={sayPayloadValue(pot.potencyConfidence ?? pot.confidence, "potencyConfidence") || "—"} />
      )}
      {isPresent(pot.n) && <Fig label="Observations" v={pot.n} decimals={0} />}
      <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
        The learned figure is not what the dose is worked out from. The figure being used
        is the one above it, and it stays that way until the canon says otherwise.
      </p>
    </Block>
  );
}

export function DosingWizard({ paramDefs, engineResult, summaries = {}, latestByParam = {},
  onDismissFinding, notices = [] }) {

  /* The three boxes V1 had. Two of them have no engine, and say so. */
  const KEYS = ["ALK", "CA", "MG"];
  const items = KEYS.map((key) => ({ key, def: paramDefs.find((d) => d.key === key) })).filter((x) => x.def);

  const [openKey, setOpenKey] = useState("ALK");
  const active = items.find((x) => x.key === openKey);

  return (
    <div>
      <SectionTitle eyebrow="Two-part" title="Dosing" />

      <div className="rounded-2xl p-3.5 mb-4"
        style={{ background: "#F3F7F6", border: "1px solid #E3ECEA" }}>
        <p className="text-[13px] text-ink font-medium leading-relaxed">
          Everything below this line is what the engine returned. Nothing on this screen works
          any of it out — tap a parameter for its full working, including what it could not
          conclude and why.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 items-stretch">
        {items.map(({ key, def }) => (
          <DoseElementCard key={key} def={def} summary={summaries[key] || null}
            open={openKey === key}
            onToggle={() => setOpenKey(openKey === key ? null : key)} />
        ))}
      </div>

      {active && (
        <Card key={active.key} className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: active.def.color }} />
            <span className="text-[15px] font-black text-ink flex-1">{active.def.label}</span>
            <button onClick={() => setOpenKey(null)} aria-label="Close"
              className="text-ink2 p-1 -m-1"><X size={16} /></button>
          </div>

          {active.def.assessed && engineResult ? (
            <>
              <EngineWorking def={active.def} result={engineResult} />
              <PotencyEstimator def={active.def} result={engineResult} />
            </>
          ) : active.def.assessed ? (
            <p className="text-[13px] text-ink2 font-medium leading-relaxed">
              No assessment yet. It needs your net volume, your target range, how strong your
              solution is and what your pump can step by — all in Setup — and some readings.
            </p>
          ) : (
            <p className="text-[13px] text-ink2 font-medium leading-relaxed">
              There is no {active.def.labelMid || active.def.label.toLowerCase()} engine in this build.
              Readings are logged, charted and scheduled exactly as alkalinity's are, and none of
              them is assessed. Nothing here will guess at a dose, because a dose is chemistry and
              chemistry comes from the canon.
            </p>
          )}

          {notices.length > 0 && (
            <div className="mt-3">
              <FindingList items={notices} compact onDismiss={onDismissFinding} />
            </div>
          )}
        </Card>
      )}

      {!active && (
        <p className="text-[12px] text-ink2 font-medium leading-relaxed text-center px-6">
          Tap any of the three above to see how its figure was reached.
        </p>
      )}
    </div>
  );
}
