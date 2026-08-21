/* ============================================================================
   CONFIGURATION — A HISTORY, NOT A SNAPSHOT
   ----------------------------------------------------------------------------
   `ALK-V2-IMPLEMENTATION-CONTRACT.md` §4 makes configuration a history, and
   canon §518 makes an assessment resolve the version effective at its
   `assessmentAsOf`. So changing the target range does not edit the current
   configuration — it appends a new version with an `effectiveFrom`, and every
   assessment already stored keeps pointing at the version it actually used.

   The engine resolves which version applies. This module never does: it hands
   over the whole list.

   WHAT SETUP ASKS FOR
   -------------------

   V1 canon `wizard-states.md` §21, carried across as a principle by the
   salvage inventory: "Setup asks for facts, not judgements." Facts are what
   only the keeper knows and the app cannot default — net volume, solution
   strength, target range, the pump's step. Judgements are opinions about how
   the app should behave, and "if a default is not good enough to ship
   unattended, the defect is in the default, not in the absence of a question."

   Which is why the fields below split into two groups, and why the second
   group is not on the setup screen. Every value in `CANON_DEFAULTS` is a
   constant the canon itself states; every value in `KEEPER_FACTS` is one only
   the keeper can supply, and the app refuses rather than guessing.
   ========================================================================= */

import { CONFIGURATIONS } from "./db.js";

import { t } from "../strings.js";

export const CONFIG_SCHEMA_VERSION = 1;

/* Facts only the keeper knows. There is no default for any of them; an absent
   one is absent, and the engine says what it cannot do without it. */
export const KEEPER_FACTS = Object.freeze([
  { key: "netVolumeL", label: "fact.netVolume", unit: "L", hint: "fact.netVolumeHint" },
  { key: "targetRangeMinDkh", label: "fact.rangeLow", unit: "dKH", hint: "fact.rangeLowHint" },
  { key: "targetRangeMaxDkh", label: "fact.rangeHigh", unit: "dKH", hint: "fact.rangeHighHint" },
  { key: "selectedPotencyDkhPerMl", label: "fact.potency", unit: "dKH/mL", hint: "fact.potencyHint" },
  { key: "recommendationPrecisionMlPerDay", label: "fact.pumpStep", unit: "mL/day", hint: "fact.pumpStepHint" },
]);

/* Values the canon states, carried here so the engine receives them and the
   keeper is not asked to invent one. Every one of these is quoted from
   `docs/implementation/alk-v2/fixtures/config-defaults.json`, which is the
   canon's own worked default configuration — not from this file's judgement.

   This module holds no number the canon does not state. If a field is needed
   and the canon has none, it is absent and the engine refuses. */
export const CANON_DEFAULT_KEYS = Object.freeze([
  "sigmaAlkBaseDkh",
  "alkSlopeSupportK",
  "alkResponseK",
  "ordinaryStepCapFraction",
  "exceptionalStepCapFraction",
  "alkRateRailDkhPerDay",
  "routineCadenceHours",
  "outerMinDkh",
  "outerMaxDkh",
  "bSafetyDkh",
  "safetyDestinationLowDkh",
  "safetyDestinationHighDkh",
  "magnesiumGateState",
  "potencyLearning",
]);

export function createConfigStore(backend) {
  async function history() {
    const list = await backend.all(CONFIGURATIONS);
    return list.sort((a, b) =>
      a.effectiveFrom < b.effectiveFrom ? -1 : a.effectiveFrom > b.effectiveFrom ? 1 : 0
    );
  }

  async function current() {
    const h = await history();
    return h.length ? h[h.length - 1] : null;
  }

  /* A change appends. It never edits, because an assessment stored last week
     names the version it used and that version has to still be there. */
  async function append(values, effectiveFrom) {
    const h = await history();
    const configVersionId = `CFG-V${h.length + 1}`;
    const rec = {
      ...values,
      schemaVersion: CONFIG_SCHEMA_VERSION,
      configVersionId,
      effectiveFrom,
    };
    if (await backend.get(CONFIGURATIONS, configVersionId)) {
      throw new Error(t("err.configExists", { id: configVersionId }));
    }
    await backend.put(CONFIGURATIONS, configVersionId, rec);
    return rec;
  }

  /* What the engine is handed: the list, with the application's own bookkeeping
     stripped. `schemaVersion` is the app's, not the contract's. */
  async function forEngine() {
    return (await history()).map(({ schemaVersion, ...rest }) => rest);
  }

  /* Which keeper facts are still missing. The setup screen renders this, and so
     does the assessment card when it has to explain why it cannot answer. */
  async function missingFacts() {
    const c = await current();
    if (!c) return KEEPER_FACTS.map((f) => f.key);
    return KEEPER_FACTS.filter((f) => c[f.key] == null || c[f.key] === "").map((f) => f.key);
  }

  return { history, current, append, forEngine, missingFacts };
}
