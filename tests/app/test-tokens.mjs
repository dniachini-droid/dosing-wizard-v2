/* ============================================================================
   APPEARANCE HAS ONE HOME
   ----------------------------------------------------------------------------
   `tokens.css` opens by claiming two rules for itself:

     1. No other file may contain a literal colour, radius, shadow or type size.
     2. Parameter colour is IDENTITY. State colour is amber and red. A
        parameter's own colour never signals a state, and a state colour is
        never used as a parameter's identity.

   Until now both were prose at the top of a file, which is the weakest form a
   rule can take: nothing failed when one was broken. A single `#fff` typed into
   `app.css` during a hurried change would have passed every check in this
   repository, and the next person to edit the token file would have changed the
   app everywhere except that one place.

   These checks are the rules, pinned. They are deliberately mechanical — they
   read the shipped files and assert properties of them, so they keep holding
   for code nobody has written yet.

   WHAT THEY DO NOT CHECK
   ----------------------

   That the result looks good. Nothing here can tell whether the body text is
   comfortable to read; it can only tell that the body text is drawn with the
   ink that was chosen for it, from the one file where that choice is recorded.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { suite, eq, ok, deepEq } from "./harness.mjs";
import { sparkDomain } from "../../app/src/ui/chart.js";

const s = suite("appearance tokens");

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

const TOKENS = read("app/assets/tokens.css");
const APP = read("app/assets/app.css");
const SHELL = read("app/assets/shell.css");

/* Every `.js` under `app/src`, found on disk rather than listed, so a screen
   written tomorrow is covered without anybody remembering to add it. */
function scriptsOnDisk(dir = path.join(ROOT, "app/src"), prefix = "app/src") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) out.push(...scriptsOnDisk(path.join(dir, entry.name), p));
    else if (entry.name.endsWith(".js")) out.push(p);
  }
  return out.sort();
}

/* A hex colour, an `rgb()`/`rgba()`, an `hsl()`/`hsla()`. */
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;

/* AND A NAMED ONE.

   These used to be excluded, on the stated grounds that a word-boundary match
   on colour names produces false positives in ordinary prose. That is true of a
   whole-file scan and it was the wrong conclusion: `background: white` sat in a
   stylesheet and in an inline style and passed both checks. The fix is to stop
   scanning prose — a declaration VALUE is where a colour can do damage, and
   comments and identifiers are not declaration values.

   The list is the ones a person actually reaches for. Exhaustiveness is not the
   point; the point is that the commonest way to write a colour without writing
   a hex code is no longer invisible. */
const NAMED = new Set([
  "white", "black", "red", "green", "blue", "yellow", "orange", "purple", "pink",
  "grey", "gray", "brown", "cyan", "magenta", "silver", "gold", "teal", "navy",
  "olive", "lime", "maroon", "aqua", "fuchsia", "beige", "ivory", "khaki",
  "coral", "salmon", "crimson", "indigo", "violet", "turquoise", "tan",
  "lightgrey", "lightgray", "darkgrey", "darkgray", "whitesmoke", "gainsboro",
]);

/* Allowed in a colour position and not a colour: they name where the value
   comes from rather than what it is. */
const NOT_A_COLOUR = new Set(["transparent", "inherit", "initial", "unset", "currentcolor", "none", "revert"]);

/* Every CSS declaration value in a stylesheet, with the line it sits on. */
function cssValues(text) {
  const out = [];
  /* Comments stripped first, or a colour word in a comment reads as a value. */
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  for (const m of stripped.matchAll(/:\s*([^;{}]+);/g)) {
    out.push({ value: m[1], line: stripped.slice(0, m.index).split("\n").length });
  }
  return out;
}

/* Every value inside an inline `style: { ... }` object in application code. */
function jsStyleValues(text) {
  const out = [];
  for (const m of text.matchAll(/style:\s*\{([^}]*)\}/g)) {
    for (const v of m[1].matchAll(/:\s*(`[^`]*`|"[^"]*"|'[^']*')/g)) {
      out.push({ value: v[1].slice(1, -1), line: text.slice(0, m.index).split("\n").length });
    }
  }
  return out;
}

function namedColoursIn(values) {
  const out = [];
  for (const { value, line } of values) {
    for (const word of value.toLowerCase().match(/[a-z]+/g) || []) {
      if (NOT_A_COLOUR.has(word)) continue;
      if (NAMED.has(word)) out.push({ line, word });
    }
  }
  return out;
}

/* --- rule 1: no appearance value lives outside the token file ------------ */

s.test("TOK-01", "no colour is written anywhere but the token file", () => {
  const offenders = [];
  for (const [name, text] of [
    ["app/assets/app.css", APP],
    ["app/assets/shell.css", SHELL],
  ]) {
    for (const m of text.matchAll(COLOUR)) {
      const line = text.slice(0, m.index).split("\n").length;
      offenders.push(`${name}:${line} ${m[0]}`);
    }
  }
  /* And the same again for a colour spelled as a word, matched in declaration
     values so ordinary prose is not scanned. */
  for (const [name, text] of [
    ["app/assets/app.css", APP],
    ["app/assets/shell.css", SHELL],
  ]) {
    for (const hit of namedColoursIn(cssValues(text))) offenders.push(`${name}:${hit.line} ${hit.word}`);
  }

  eq(
    offenders.length,
    0,
    offenders.length
      ? `these are colours written outside tokens.css: ${offenders.join(", ")}`
      : "the two stylesheets reference variables and never a colour"
  );
});

s.test("TOK-02", "no screen hard-codes a colour either — every one asks for a variable", () => {
  const offenders = [];
  for (const f of scriptsOnDisk()) {
    const text = read(f);
    for (const m of text.matchAll(COLOUR)) {
      const line = text.slice(0, m.index).split("\n").length;
      offenders.push(`${f}:${line} ${m[0]}`);
    }
  }
  /* An inline style is where a screen would write one, so that is where the
     named-colour scan looks. */
  for (const f of scriptsOnDisk()) {
    for (const hit of namedColoursIn(jsStyleValues(read(f)))) offenders.push(`${f}:${hit.line} ${hit.word}`);
  }

  ok(scriptsOnDisk().length > 20, `there are modules to check: ${scriptsOnDisk().length}`);
  eq(
    offenders.length,
    0,
    offenders.length
      ? `these are colours written into application code: ${offenders.join(", ")}`
      : "no module writes a colour"
  );
});

/* The two places that genuinely cannot reference a CSS variable — the browser's
   own chrome and the installed app's splash — are allowed their literal, and
   pinned to the ground colour so they cannot drift away from the app they frame.
   A tab whose chrome is a different green from the screen beneath it is the kind
   of defect nobody files and everybody sees. */
s.test("TOK-03", "the browser chrome and the installed splash are the app's own ground", () => {
  const ground = /--ground:\s*(#[0-9a-fA-F]{3,8})/.exec(TOKENS);
  ok(ground, "the token file states a ground colour");

  const theme = /<meta name="theme-color" content="(#[0-9a-fA-F]{3,8})">/.exec(read("app/index.html"));
  ok(theme, "the document states a theme colour");
  eq(theme[1].toUpperCase(), ground[1].toUpperCase(), "the tab chrome is the app's ground");

  const manifest = JSON.parse(read("app/manifest.webmanifest"));
  eq(manifest.background_color.toUpperCase(), ground[1].toUpperCase(), "the splash is the app's ground");
  eq(manifest.theme_color.toUpperCase(), ground[1].toUpperCase(), "the installed chrome is the app's ground");
});

/* --- the text roles ------------------------------------------------------ */

/* The main ask of this pass: body text sits near black rather than grey. The
   three inks are the palette; the three roles are the RULE for using them, and
   the roles are what the stylesheets reference. Pinning the indirection is what
   stops the next change to "the body colour" going back into forty rules. */

s.test("TOK-04", "the three inks are mockup 05's, and the three text roles point at them", () => {
  const tok = (name) => {
    const m = new RegExp(`--${name}:\\s*([^;]+);`).exec(TOKENS);
    return m ? m[1].trim() : null;
  };
  eq(tok("ink"), "#0C1D1A", "near-black");
  eq(tok("grey"), "#566966", "mid");
  eq(tok("faint"), "#8DA09B", "light");

  eq(tok("text"), "var(--ink)", "a sentence the keeper reads is near-black");
  eq(tok("text-2"), "var(--grey)", "a genuinely secondary line is mid");
  eq(tok("text-meta"), "var(--faint)", "a date, an axis label or a unit suffix is light");
});

s.test("TOK-05", "the stylesheets name a role and never an ink directly", () => {
  const offenders = [];
  for (const [name, text] of [
    ["app/assets/app.css", APP],
    ["app/assets/shell.css", SHELL],
    /* The screens too — an inline style can reach past a role exactly as a rule
       can, and this used to scan only the stylesheets. */
    ...scriptsOnDisk().map((f) => [f, read(f)]),
  ]) {
    for (const m of text.matchAll(/var\(--(ink|grey|faint)\)/g)) {
      const line = text.slice(0, m.index).split("\n").length;
      offenders.push(`${name}:${line} ${m[0]}`);
    }
  }
  eq(
    offenders.length,
    0,
    offenders.length
      ? `these reach past the role to the ink: ${offenders.join(", ")}`
      : "every rule asks for a role"
  );
});

/* The sentences. Named one by one, because "is this a sentence the keeper needs
   to read" is a judgement no regular expression makes — but once the judgement
   is taken it can be held. Each of these carries prose the app expects to be
   read, and each must be drawn in body ink. */
const SENTENCES = Object.freeze([
  ["p.body", /^p\.body \{[^}]*color: var\(--text\);/m],
  [".reco .detail", /^\.reco \.detail \{[^}]*color: var\(--text\);/m],
  [".refusal p", /^\.refusal p \{[^}]*color: var\(--text\);/m],
  [".notice .say", /^\.notice \.say \{[^}]*color: var\(--text\);/m],
  [".inline-log .note", /^\.inline-log \.note \{[^}]*color: var\(--text\);/m],
  [".suggested .d", /^\.suggested \.d \{[^}]*color: var\(--text\);/m],
  [".mbody .line", /^\.mbody \.line \{[^}]*color: var\(--text\);/m],
  [".crash p", /^\.crash p \{[^}]*color: var\(--text\);/m],
]);

s.test("TOK-06", "every sentence the keeper is expected to read is drawn in body ink", () => {
  const wrong = SENTENCES.filter(([, re]) => !re.test(APP)).map(([sel]) => sel);
  eq(
    wrong.length,
    0,
    wrong.length ? `these carry prose and are not body ink: ${wrong.join(", ")}` : `${SENTENCES.length} checked`
  );
});

/* The other half of the same rule, and the one that was actually being broken:
   the lightest ink was carrying whole sentences. It is for dates, axis labels
   and unit suffixes. */
s.test("TOK-07", "the lightest ink carries no sentence", () => {
  const prose = [".inert-note", ".charthint", ".sheet .who", ".field .hint"];
  const wrong = prose.filter((sel) => {
    const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^${esc} \\{[^}]*color: var\\(--text-meta\\)`, "m");
    return re.test(APP);
  });
  eq(wrong.length, 0, wrong.length ? `these are prose drawn in metadata ink: ${wrong.join(", ")}` : "none are");
});

/* --- rule 2: identity is never a state ----------------------------------- */

/* Read from the parameter list itself rather than listed here, so a parameter
   added tomorrow is checked the day it is added rather than the day somebody
   remembers. `ledger.js` owns which parameters exist; this file owns what each
   one looks like, and this is the join between them. */
function parameterTones() {
  const src = read("app/src/store/ledger.js");
  const block = /export const PARAMETERS = Object\.freeze\(\[([\s\S]*?)\]\);/.exec(src);
  ok(block, "the ledger states which parameters exist");
  return [...block[1].matchAll(/tone: "([a-z0-9]+)"/g)].map((m) => m[1]);
}

s.test("TOK-08", "every parameter has an identity colour and its own tint, and both are used", () => {
  const tones = parameterTones();
  ok(tones.length >= 8, `there are parameters with an identity: ${tones.join(", ")}`);

  const missing = [];
  for (const tone of tones) {
    /* Its mark, its trace, and the range shaded behind that trace. */
    if (!new RegExp(`\\.p-${tone}\\s*\\{[^}]*var\\(--${tone}-bg\\)`).test(APP)) missing.push(`${tone}: mark`);
    if (!new RegExp(`\\.c-${tone}\\s+\\.trace[^{]*\\{[^}]*var\\(--${tone}\\)`).test(APP)) missing.push(`${tone}: trace`);
    if (!new RegExp(`\\.c-${tone}\\s+\\.range-fill\\s*\\{[^}]*var\\(--${tone}-bg\\)`).test(APP)) missing.push(`${tone}: range`);
  }
  eq(missing.length, 0, missing.length ? `unstyled: ${missing.join(", ")}` : "all eight are complete");
});

s.test("TOK-09", "a parameter's own colour never signals a state", () => {
  const tones = parameterTones();
  /* Every rule that colours a state: the pills, the callouts and the notice
     strip. None of them may reach for a parameter. */
  const stateRules = [...APP.matchAll(/^([^\n{]*(?:is-attention|is-safety|pill-attention|pill-safety|callout\.attention|callout\.safety)[^\n{]*)\{([^}]*)\}/gm)];
  ok(stateRules.length >= 4, `there are state rules to check: ${stateRules.length}`);

  const offenders = [];
  for (const [, sel, body] of stateRules) {
    for (const tone of tones) {
      if (new RegExp(`var\\(--${tone}(-bg)?\\)`).test(body)) offenders.push(`${sel.trim()} uses --${tone}`);
    }
  }
  eq(offenders.length, 0, offenders.length ? offenders.join(", ") : "state colour is amber and red only");
});

/* --- the parameter card's notice strip ----------------------------------- */

s.test("TOK-10", "the strip is a constant of a parameter card and only its colour carries meaning", () => {
  ok(/--strip-h:\s*[1-9]\d*px;/.test(TOKENS), "the strip has a height, and it is not zero");
  ok(/--strip-quiet:\s*var\(--inset-deep\);/.test(TOKENS), "a card reporting no state has a colourless strip");
  ok(/--strip-attention:\s*var\(--attention\);/.test(TOKENS), "attention is amber");
  ok(/--strip-safety:\s*var\(--safety\);/.test(TOKENS), "outside range is red");

  /* Present unconditionally, so a card that reports no state still has a
     strip — the absence of a colour is the statement, not the absence of a
     band. */
  ok(/\.param-card::after \{[^}]*background: var\(--strip-quiet\);/.test(APP), "the default strip is the quiet one");
  ok(/\.param-card\.is-attention::after\s*\{ background: var\(--strip-attention\); \}/.test(APP), "amber on attention");
  ok(/\.param-card\.is-safety::after\s*\{ background: var\(--strip-safety\); \}/.test(APP), "red on safety");

  /* And nothing sits underneath it. */
  ok(
    /\.param-card \{[^}]*padding-bottom: calc\(var\(--card-pad\) \+ var\(--strip-h\)\);/.test(APP),
    "the card's bottom padding clears the strip"
  );
});

s.test("TOK-11", "every card that stands for one parameter carries a strip", () => {
  /* The assessment card on Today, and every parameter's card on History. Both
     ask for the class; neither invents the colour. */
  ok(
    /h\("section", \{ class: "card param-card" \}\)/.test(read("app/src/screens/assessment.js")),
    "the assessment card is a parameter card"
  );
  ok(
    /h\("section", \{ class: "card param-card" \}\)/.test(read("app/src/screens/history.js")),
    "History's per-parameter cards are parameter cards"
  );
  /* The logged-only tiles carry their own, always the quiet colour, because a
     parameter with no engine has no state to report. */
  ok(/\.tile::after \{[^}]*background: var\(--strip-quiet\);/.test(APP), "a logged-only tile's strip is quiet");
  const tileStrip = /\.tile::after \{([^}]*)\}/.exec(APP);
  ok(tileStrip && !/attention|safety/.test(tileStrip[1]), "and it is never anything else");
});

s.test("TOK-12", "the strip's colour is chosen by the engine's answer and by nothing else", async () => {
  /* THIS USED TO CHECK THE WRONG HALF.

     It asserted that every value in `CARD_TONE` was one of "", "is-attention"
     or "is-safety" — which six of the eight entries satisfy by being "". The
     two that carry meaning were exactly the two it could not see, so a safety
     breach mapped to amber passed. A red state rendered amber is a wrong signal
     on the one card that exists to say stop.

     The map is data, so it is compared as data. */
  const { CARD_TONE } = await import("../../app/src/screens/assessment.js");

  /* Sorted on both sides: this is a mapping, not a sequence, and the order the
     entries happen to be declared in is not part of the claim. */
  const sorted = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));

  deepEq(
    sorted(CARD_TONE),
    sorted({
      /* Red, and only here: an outer-bound breach with a return plan. */
      SAFETY_RETURN: "is-safety",
      /* Amber, and only here: the engine produced a class this build has no
         card for, which is a state of the APP worth flagging. */
      UNCLASSIFIED: "is-attention",
      /* Everything else is an ordinary answer and wears the quiet strip. A
         refusal is rendered with structure and neutral ink, not with alarm —
         `tokens.css` says so and this is where that is held. */
      CAPABILITY_REFUSAL: "",
      INSUFFICIENT: "",
      NOT_ATTRIBUTABLE_SMALL_SIGNAL: "",
      UNCERTAINTY_LIMITED: "",
      DOSE_CHANGE: "",
      HOLD: "",
    }),
    "each engine output class maps to the tone it should"
  );

  /* And the card takes its tone from that map alone. */
  ok(
    /box\.classList\.add\(\.\.\.\(CARD_TONE\[card\] \? \[CARD_TONE\[card\]\] : \[\]\)\);/.test(
      read("app/src/screens/assessment.js")
    ),
    "and nothing else puts a tone on it"
  );
});

/* --- the parameter card's chart ------------------------------------------ */

s.test("TOK-13", "the tile's sparkline runs to the card's own edges", () => {
  ok(/--tile-pad:\s*var\(--sp-3\);/.test(TOKENS), "the tile's padding is a named value");
  const rule = /\.tile svg \{([^}]*)\}/.exec(APP);
  ok(rule, "the tile's chart has a rule");
  /* Pulled back out by EXACTLY the padding on each side. Two numbers that have
     to agree, reading one token. */
  ok(/margin: var\(--sp-2\) calc\(-1 \* var\(--tile-pad\)\) var\(--strip-h\);/.test(rule[1]), "pulled out by the padding");
  ok(/width: calc\(100% \+ 2 \* var\(--tile-pad\)\);/.test(rule[1]), "and widened by twice it");
  ok(/\.tile \{[^}]*overflow: hidden;/.test(APP), "and clipped to the tile's corners");
});

s.test("TOK-14", "the keeper's range is shaded behind the tile's trace, in that parameter's own tint", () => {
  const src = read("app/src/screens/today.js");
  ok(/function sparkline\(rows, def, range\)/.test(src), "the sparkline is given a range");
  ok(/band\.setAttribute\("class", "range-fill"\);/.test(src), "and draws it as the same band History draws");
  /* `.c-<tone> .range-fill` is what tints it, and TOK-08 already holds that
     every parameter has one — so the tint follows the parameter automatically
     and no screen picks a colour. */
  ok(/s\.setAttribute\("class", `chart c-\$\{def\.tone\}`\)/.test(src), "the parameter's own class carries the tint");
});

/* Run rather than read. The extent is the one part of a sparkline that is
   arithmetic rather than appearance, so it is checked by calling it. */
s.test("TOK-15", "a sparkline's scale contains the keeper's band, so a band the tank sits clear of is still drawn", () => {
  /* A tank sitting comfortably ABOVE its range. Left to the readings alone the
     band is off the bottom of the box, and a clipped band reads as no band. */
  const above = sparkDomain([9.2, 9.3, 9.25], { min: 8.0, max: 8.5 });
  ok(above.lo <= 8.0, `the band's floor is on the chart: ${above.lo}`);
  ok(above.hi >= 9.3, `and so is the highest reading: ${above.hi}`);

  const below = sparkDomain([7.1, 7.0], { min: 8.0, max: 8.5 });
  ok(below.hi >= 8.5 && below.lo <= 7.0, `the band's ceiling is on the chart: ${below.lo}..${below.hi}`);

  /* With no range set nothing is widened — the readings' own extent, exactly
     as before, so a parameter he has set no range for is unchanged. */
  const none = sparkDomain([7.1, 7.4], null);
  eq(none.lo, 7.1, "no range, no widening at the bottom");
  eq(none.hi, 7.4, "no range, no widening at the top");

  /* And the drawing asks for it rather than working it out again. */
  ok(/const \{ lo, hi \} = sparkDomain\(rows\.map\(\(r\) => r\.value\), range\);/.test(read("app/src/screens/today.js")),
     "the tile's chart uses it");
});

s.test("TOK-16", "which range is the keeper's has one owner, and the owner answers correctly", async () => {
  /* It had four implementations — History, Today's assessment trace, that
     chart's aria label, and `main.js`, which knew only about alkalinity's, so a
     calcium reading arrived on a moment chart with no band while History drew
     one from the very same configuration. `MASTER RULE 1`. */
  const { keeperRange } = await import("../../app/src/store/config.js");
  const { parameterDef } = await import("../../app/src/store/ledger.js");

  const config = {
    targetRangeMinDkh: 8.2,
    targetRangeMaxDkh: 8.8,
    parameterRanges: { CA: { min: 400, max: 450 }, MG: { min: "x", max: 1400 } },
  };

  /* The assessed parameter's range is the two fields the ENGINE reads, because
     the engine reads them. */
  deepEq(keeperRange(parameterDef("ALK"), config), { min: 8.2, max: 8.8 }, "alkalinity's is the engine's pair");
  eq(
    keeperRange(parameterDef("ALK"), { parameterRanges: { ALK: { min: 1, max: 2 } } }),
    null,
    "and it is not taken from the display map, even when one is there"
  );

  /* Everything else comes from the keeper's own map, which the configuration
     store strips before the engine sees it. */
  deepEq(keeperRange(parameterDef("CA"), config), { min: 400, max: 450 }, "calcium's is his own");
  eq(keeperRange(parameterDef("MG"), config), null, "a half-written range is no range");
  eq(keeperRange(parameterDef("NO3"), config), null, "a parameter he set none for has none");
  eq(keeperRange(parameterDef("CA"), null), null, "and no configuration is no range");

  /* And nobody else decides it. */
  const others = scriptsOnDisk().filter(
    (f) => f !== "app/src/store/config.js" && /\bconfig\??\.(parameterRanges|targetRangeM(in|ax)Dkh)/.test(read(f))
  );
  eq(others.length, 0, others.length ? `these choose a range themselves: ${others.join(", ")}` : "nobody else chooses");
});

/* --- what this pass was told to leave alone ------------------------------ */

/* "Keep the 3D presentation of the graph lines on the cards." Four shadow
   layers, a gradient area under the trace, and a rounded stroke. Kept, and
   pinned so a later tidy-up cannot flatten it by accident. */
s.test("TOK-17", "the depth on the cards and their graph lines is untouched", () => {
  for (const layer of ["--sh-edge", "--sh-lift", "--sh-soft", "--sh-highlight"]) {
    ok(new RegExp(`${layer}:`).test(TOKENS), `${layer} is still a layer`);
  }
  ok(
    /--shadow-card:\s*var\(--sh-edge\), var\(--sh-lift\), var\(--sh-soft\), var\(--sh-highlight\);/.test(TOKENS),
    "a card is still all four"
  );
  ok(/\.card \{[^}]*box-shadow: var\(--shadow-card\);/.test(APP), "and a card still wears it");
  ok(
    /\.chart \.trace \{[^}]*stroke-linecap: round; stroke-linejoin: round;/.test(APP),
    "the trace is still rounded rather than flat"
  );
  ok(/\.c-alk \.area \{ fill: url\(#g-alk\); \}/.test(APP), "and still sits over its own gradient");
});

export default s;
