/* ---------------------------------- constants ---------------------------------- */

/* THIS MODULE IMPORTS NOTHING, AND THAT IS DELIBERATE.

   V1's version imported five icon components so `NAV` could carry them. That
   made a file of constants loadable only through a bundler — and the test
   runner is Node with no dependencies, so anything importing this transitively
   could not be tested at all. `PORT-11` hit it: it drives the read adapter,
   the read adapter reads `PARAM_STYLE`, and Node stopped at `icons.jsx`.

   So `NAV` carries an icon KEY and the shell binds it to a component. The tab
   set is data; which glyph draws it is the shell's business. */

/* V1's `PARAM_DEFS` stood here, and most of it is gone.

   It carried a target range, a test cadence and an "ideal at" direction for
   every parameter, with a long comment arguing the ranges against hobby
   consensus. Every one of those is chemistry: a band edge, a cadence, a
   direction of preference. `CLAUDE.md` is unambiguous that chemistry "may not
   arrive by invention, by task instruction, by `DECISIONS.md`, by an
   owner-decision entry, by `docs/research/`, or by V1", and V1 is precisely
   where those numbers came from.

   So what remains is the part that was never chemistry: the colour each
   parameter is drawn in, and the icon that makes a card recognisable before it
   is read.

   Where the rest now comes from:

     the parameter list  `app/src/store/ledger.js` — `PARAMETERS`
     the display range   `app/src/store/config.js` — `keeperRange`, which is
                         the KEEPER's own number, drawn on his charts and
                         governing nothing
     the test cadence    the keeper's own tasks (`app/src/store/schedule.js`),
                         which ship with no seeded interval at all, and — for
                         alkalinity only — the engine's retest recommendation

   THE COLOURS ARE V1'S, MEASURED

   Carried across unchanged, including the two that were measured rather than
   eyeballed. V1's note on them is worth keeping because it is the reason they
   are these exact values: a brand colour may never be byte-identical to a
   severity colour, because potassium at `#926A09` and phosphate at `#C4285B`
   meant "a perfect phosphate reading charted in the danger red". The
   replacements were checked at 4.54:1 and 5.76:1 on the page.

   ONE DISCREPANCY, RECORDED RATHER THAN RESOLVED

   The brief for this port lists "pH olive, potassium teal-cyan". V1's source
   has them the other way round — potassium olive `#5F7A12`, pH teal-cyan
   `#2AA7B0`. The instruction was to take the colours from V1, so V1's actual
   assignment is what is here. See `docs/migration/PORT-OMISSIONS.md`. */
export const PARAM_STYLE = {
  ALK: { color: "#0B7C86", icon: "alkalinity" },
  SAL: { color: "#1D6FA5", icon: "salinity" },
  CA:  { color: "#B8541A", icon: "calcium" },
  MG:  { color: "#7B4FCB", icon: "magnesium" },
  K:   { color: "#5F7A12", icon: "potassium" },
  PO4: { color: "#9B3A8C", icon: "phosphate" },
  NO3: { color: "#2A8050", icon: "nitrate" },
  PH:  { color: "#2AA7B0", icon: "ph" },
};

/* Five tabs. V1 shipped six — Dashboard, Test Lab, Dosing, Insights, Tasks,
   Setup — and Insights is not carried: it was 1,114 lines importing fourteen
   analytics modules, every one of them a second owner of something the engine
   owns in V2. The salvage inventory dispositions it
   `TANGLED_WITH_V1_DOMAIN_LOGIC_REBUILD_LATER`. */
export const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "log", label: "Test", icon: "flask" },
  { id: "dosing", label: "Dosing", icon: "beaker" },
  { id: "tasks", label: "Tasks", icon: "checks" },
  { id: "setup", label: "Setup", icon: "settings" },
];

/* An id, not a moment. V1 built it from `Date.now()`, which made it a module
   that reads the wall clock — and V2 has one clock, which `TM-23` enforces by
   finding every module that reaches past it. A counter does the same job here:
   the value only has to be unique within a session, because everything that
   needs an ORDER gets it from the ledger's own `(instant, ordinal, id)`. */
let uidCounter = 0;
export const uid = () => Math.random().toString(36).slice(2, 10) + (uidCounter++).toString(36);
