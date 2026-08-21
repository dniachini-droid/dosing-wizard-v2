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

/* CONFIGURATION FIELDS THAT ARE THE APPLICATION'S, NOT THE CONTRACT'S.

   Kept in the configuration record because they are effective-dated keeper
   settings and belong in the same append-only history as the rest — a range
   the keeper set in August is not a range that was in force in March. Stripped
   on the way to the engine because the engine has no input named by any of
   them, and handing it a field it does not declare would be inventing an
   input.

   `parameterRanges` is a map of parameter key to `{min, max}` for the
   parameters this build does not assess. They are the KEEPER's own numbers,
   typed by him or carried across from his own V1 settings, and they govern
   nothing: they are drawn on his charts and stated in his history. No engine
   reads them, no recommendation depends on one, and none of them is a canon
   band edge. A target range that governed behaviour would have to come from
   the canon and from nowhere else (`CLAUDE.md`); one that only says "this is
   where I like to keep it" is a keeper fact, like the tank's volume.

   `importedFrom` records where a configuration version came from, and what it
   superseded. It is provenance, not a setting. */
const APP_ONLY_KEYS = new Set(["parameterRanges", "importedFrom"]);

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
     stripped. `schemaVersion` is the app's, not the contract's; so are the
     fields in `APP_ONLY_KEYS` below. */
  async function forEngine() {
    return (await history()).map((c) => {
      const out = {};
      for (const [k, v] of Object.entries(c)) {
        if (k === "schemaVersion" || APP_ONLY_KEYS.has(k)) continue;
        out[k] = v;
      }
      return out;
    });
  }

  /* The configuration history AS IT STOOD when a given version was current.

     Canon §64 conditions deterministic replay on the same event ledger, the
     same CONFIGURATION VERSIONS and the same engine/canon version. Replaying
     against the configuration the keeper has today satisfies two of those
     three: change the target range, replay an old assessment, and the engine
     honestly returns a different answer, which the app then reports as the
     engine disagreeing with itself.

     Because the history is append-only and ids are issued in sequence, "as it
     stood" is the prefix ending at that version. */
  async function forEngineUpTo(configVersionId) {
    const h = await history();
    const cut = h.findIndex((c) => c.configVersionId === configVersionId);
    if (cut < 0) return null; /* Named a version this device does not hold. */
    /* Stripped exactly as `forEngine` strips, and by the same rule — a replay
       that handed the engine a different shape from the original run would
       report a divergence caused by this function. */
    const all = await forEngine();
    return all.slice(0, cut + 1);
  }

  /* Which keeper facts are still missing. The setup screen renders this, and so
     does the assessment card when it has to explain why it cannot answer. */
  async function missingFacts() {
    const c = await current();
    if (!c) return KEEPER_FACTS.map((f) => f.key);
    return KEEPER_FACTS.filter((f) => c[f.key] == null || c[f.key] === "").map((f) => f.key);
  }

  return { history, current, append, forEngine, forEngineUpTo, missingFacts };
}

/* ============================================================================
   THE KEEPER'S OWN RANGE, FOR DISPLAY
   ----------------------------------------------------------------------------
   The band shaded behind a trace, wherever a trace is drawn. It is here, in the
   configuration module, because more than one screen shades it — History draws
   a full chart per parameter and Today shades the same band behind each
   parameter card's sparkline — and two implementations of "which range is his"
   is precisely the defect canon `MASTER RULE 1` calls a defect rather than a
   coincidence. Once they agreed by luck; the moment his own imported ranges
   arrived they would not have.

   Alkalinity's range lives in the two fields the engine reads, because the
   engine reads them. Every other parameter's lives in `parameterRanges`, which
   `forEngine` strips before the engine ever sees it: those are the keeper's own
   preference, they are display, and they govern nothing.

   Neither is a canon band edge. Nothing in this function decides chemistry —
   it reads back a number the keeper typed, and the screens that draw it say
   whose numbers they are.
   ========================================================================= */

export function keeperRange(def, config) {
  if (!def || !config) return null;
  if (def.assessed) {
    return config.targetRangeMinDkh != null && config.targetRangeMaxDkh != null
      ? { min: config.targetRangeMinDkh, max: config.targetRangeMaxDkh }
      : null;
  }
  const r = config.parameterRanges && config.parameterRanges[def.key];
  return r && Number.isFinite(r.min) && Number.isFinite(r.max) ? r : null;
}
