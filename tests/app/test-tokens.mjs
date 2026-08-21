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
import { suite, eq, ok } from "./harness.mjs";
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

/* A hex colour, an `rgb()`/`rgba()` or an `hsl()`/`hsla()`. Deliberately not
   named colours: `white` and `black` do not appear and a word-boundary match on
   colour names produces false positives on ordinary prose. */
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;

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
  [".field .hint", /^\.field \.hint \{[^}]*color: var\(--text\);/m],
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
  const prose = [".inert-note", ".charthint", ".sheet .who"];
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
  ok(/--strip-h:\s*\d+px;/.test(TOKENS), "the strip has a height, stated once");
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

s.test("TOK-12", "the strip's colour is chosen by the engine's answer and by nothing else", () => {
  const src = read("app/src/screens/assessment.js");
  /* `CARD_TONE` maps an engine output class to a strip colour. If a screen ever
     starts deciding the tone from a reading, this is where it would appear. */
  const map = /const CARD_TONE = Object\.freeze\(\{([^}]*)\}\)/.exec(src);
  ok(map, "there is one map from the engine's answer to a card tone");
  const values = [...map[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  const allowed = new Set(["", "is-attention", "is-safety"]);
  const bad = values.filter((v) => !allowed.has(v));
  eq(bad.length, 0, bad.length ? `these are not states: ${bad.join(", ")}` : "amber, red, or nothing");
  ok(
    /box\.classList\.add\(\.\.\.\(CARD_TONE\[card\] \? \[CARD_TONE\[card\]\] : \[\]\)\);/.test(src),
    "and the card takes its tone from that map alone"
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

s.test("TOK-16", "which range is the keeper's has one owner", () => {
  /* It had two, briefly, and they would have disagreed the moment his own
     imported ranges arrived: `MASTER RULE 1`. */
  const cfg = read("app/src/store/config.js");
  ok(/export function keeperRange\(def, config\)/.test(cfg), "the configuration module owns it");
  for (const f of ["app/src/screens/history.js", "app/src/screens/today.js"]) {
    ok(new RegExp(`import \\{ keeperRange \\} from "\\.\\./store/config\\.js";`).test(read(f)), `${f} asks it`);
  }
  /* The test is not "who mentions the fields" — setup writes them and the
     import maps V1's into them. It is who reads a CONFIGURATION to choose which
     range is his, which is the branch that drifted: `main.js` knew only about
     alkalinity's, so a calcium reading arrived on a chart with no band while
     History drew one from the very same configuration. */
  const others = scriptsOnDisk().filter(
    (f) =>
      f !== "app/src/store/config.js" &&
      /\bconfig\??\.(parameterRanges|targetRangeM(in|ax)Dkh)/.test(read(f))
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
