# PORT MANIFEST — every line of V1's interface that changed, and why

**Generated. Do not hand-edit.** `node tools/port/build-manifest.mjs --v1 <path>`
regenerates it from the real diff; `node tools/port/manifest.mjs check` verifies it
on a tree that has never seen V1.

## What this document is for

The brief that commissioned this port says why:

> Previous briefs said "port from V1 source, do not reimplement." Nothing checked
> it. Every other rule in this project carries a mechanical test that fails when the
> rule is broken; that instruction carried nothing, so the build wrote its own
> version of everything and the result was worse than the thing it replaced.

So this one is checked. `tools/port/manifest.mjs check` reverse-applies every diff
below to the ported file and hashes the result. If that hash is the recorded V1
hash, the diff below is the **whole** difference — a changed line that is not
recorded here would survive the reverse-apply and change the hash. A file with an
unexplained difference cannot pass.

`tools/port/mutate-manifest.mjs` proves each arm of that check can actually fail.

## Checking the recorded original against V1 itself

The check above proves the recorded diff is complete. It cannot prove the
recorded ORIGINAL is V1's, because nothing in this repository knows what V1
contained — the manifest would be self-certifying without the line below.

Every entry records **V1's own git blob id**, which is git's content hash of
that file at that commit. Anybody with the V1 repository can check any entry
without trusting this document or whoever built it:

```
git -C /path/to/tank-wizard rev-parse \
  9276a2c:src/components/Dashboard.jsx
```

`node tools/port/check-port-manifest.mjs --v1 <path>` does it for all of them.

## Provenance

| | |
|---|---|
| V1 repository | `dniachini-droid/tank-wizard` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| Files taken | 25 |

## The permitted reasons

A difference may carry one of these and nothing else.

| Reason | Meaning |
|---|---|
| `chemistry removed` | A V1 classifier, verdict, threshold, dose figure or message about what a reading means, deleted on the way across. |
| `data source rewired` | V1's storage call replaced by V2's ledger, assessment store, task store or configuration store. |
| `wording replaced with engine output` | A sentence V1 composed itself, replaced by what V2's engine emitted or by V2's strings file. |
| `defect fixed` | A named V1 defect, corrected on the way across. The name is required. |
| `styling token substituted` | A V1 colour, class or spacing literal replaced by V2's equivalent token. |

## Summary

| | |
|---|---|
| Files taken from V1 | 25 |
| Taken byte-identical | 3 |
| Differences — `chemistry removed` | 40 |
| Differences — `data source rewired` | 47 |
| Differences — `wording replaced with engine output` | 19 |
| Differences — `defect fixed` | 11 |
| Differences — `styling token substituted` | 0 |

---

### `app/src/icons.jsx`

| | |
|---|---|
| V1 source | `src/icons.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `15a25d3e7b4ca5ecfbf5a5e7fa2ba29b576c695dc9a274e5beef2414722f54d1` |
| V1 blob | `632afe7013fae66e08622a2adfef71c728d895f6` |
| Ported SHA-256 | `15a25d3e7b4ca5ecfbf5a5e7fa2ba29b576c695dc9a274e5beef2414722f54d1` |
| Differences | 0 |

Byte-identical to V1.

---

### `app/src/main.jsx`

| | |
|---|---|
| V1 source | `src/main.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `9405e564c30c880232f16147c0ffc249b33bba20ae72cad200ec9203d31464b6` |
| V1 blob | `cc350595ed7caf78573ce2928c3900030a1a4d8e` |
| Ported SHA-256 | `7e2dfaa21b44fb47b8fc3627e6e2c30585ed45a9b04eec8c149ca474cfaa738a` |
| Differences | 1 |

1. **defect fixed — offline was lost when the build changed: V1's entry point registered no service worker and neither did the port, so the app needed the network to open. Round three item 10. The registration is added here, after the first render and only in a built app, and a failed registration is not fatal**

```diff
@@ -4,3 +4,28 @@
 import './index.css'
 
 createRoot(document.getElementById('root')).render(React.createElement(ReefConsole))
+
+/* ============================================================================
+   OFFLINE — ROUND THREE, ITEM 10
+   ----------------------------------------------------------------------------
+   The service worker did not survive the build change, so the app needed the
+   network to open. A reef tank is very often in a garage or a fish room with
+   no signal, and `PRODUCT-VISION.md` wants an app a keeper uses standing at
+   the tank.
+
+   Registered AFTER the first render and on `load`, so it competes with
+   nothing: the app paints, then the worker installs and precaches the shell,
+   the engine's own Python files and the frozen reason-code catalogue.
+
+   Only in a built app. The dev server has no `/app/sw.js` to register, and a
+   service worker caching a dev server's module graph makes every subsequent
+   edit invisible. A failed registration is not fatal and is not dressed up as
+   anything: the app works online exactly as it did.
+   ========================================================================= */
+if ("serviceWorker" in navigator && import.meta.env.PROD) {
+  window.addEventListener("load", () => {
+    navigator.serviceWorker.register("/app/sw.js", { scope: "/" }).catch(() => {
+      /* No offline. Everything else is unaffected. */
+    });
+  });
+}
```

---

### `app/src/index.css`

| | |
|---|---|
| V1 source | `src/index.css` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `4cc40fad1533315b6f98223ed16ab124d2e2c1ba17ccfac4e494f474007d4978` |
| V1 blob | `8c8028c2ba835989fc0287bef68f69a74cb3f485` |
| Ported SHA-256 | `4cc40fad1533315b6f98223ed16ab124d2e2c1ba17ccfac4e494f474007d4978` |
| Differences | 0 |

Byte-identical to V1.

---

### `app/src/styles/base.css`

| | |
|---|---|
| V1 source | `src/styles/base.css` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `32ffdfd42ff8a745a1f58298665fd4e606ca4da490d1686c5fbb9d6e81181a43` |
| V1 blob | `919636df1a9c02ead8aa21e8bfc8079ef5bbfcee` |
| Ported SHA-256 | `0d02fdaf76c372ad213b7e808c4a7d9f0ea62779da511f624e746c1e90cbb911` |
| Differences | 1 |

1. **defect fixed — the page's own pinch-zoom fought the chart's, which handles pinch itself to zoom a time axis, so the two competed and whichever won the race decided what the keeper got. Round three item 8. `touch-action: pan-x pan-y` withholds the browser's pinch gesture; the viewport meta tag alone does not do it, because iOS Safari has ignored `user-scalable=no` since version 10**

```diff
@@ -257,3 +257,18 @@
           font-weight:700; font-size:14px; }
   #boot .err { color:#C4285B; font-weight:600; font-size:12px; max-width:520px;
                white-space:pre-wrap; text-align:left; font-family:ui-monospace,monospace; }
+
+
+/* ROUND THREE, ITEM 8 — the page's own pinch-zoom, disabled.
+
+   iOS Safari has ignored `user-scalable=no` in the viewport meta tag since
+   version 10, so the meta tag alone does not do this. `touch-action` does:
+   `pan-x pan-y` allows scrolling in both directions and withholds the
+   pinch-zoom gesture, which is the one the chart wants for itself.
+
+   Scoped to the app shell rather than set on `html`, so a browser dialog or
+   an OS-level text size is unaffected. */
+html, body {
+  touch-action: pan-x pan-y;
+  overscroll-behavior-y: none;
+}
```

---

### `app/src/styles/aurelia-skin.css`

| | |
|---|---|
| V1 source | `src/styles/aurelia-skin.css` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `8d1cd8b3645821429ce5b9ddbc25383c1b37aa0cc3ffbcf3bd9f29add5bec10c` |
| V1 blob | `9543bb4f3c0df38d72edfe43700016ff6c937f8c` |
| Ported SHA-256 | `8d1cd8b3645821429ce5b9ddbc25383c1b37aa0cc3ffbcf3bd9f29add5bec10c` |
| Differences | 0 |

Byte-identical to V1.

---

### `app/index.html`

| | |
|---|---|
| V1 source | `index.html` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `e58e95acf9d2f8d09656bb6f06816b341bde8a927ebc23550981cdfa0a1e4b38` |
| V1 blob | `a25b1e048e3f5967a7bb61ac62178a2b2818d2bf` |
| Ported SHA-256 | `8824bacd4c250e2f5eac31ec0b596ccab2ea4273c0767715bbcadb536127ff22` |
| Differences | 1 |

1. **data source rewired — icon, manifest and entry-module paths point at V2's own assets and V2's module tree instead of V1's, and the app's name and title are V2's**

```diff
@@ -2,18 +2,31 @@
 <html lang="en">
 <head>
   <meta charset="utf-8" />
-  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
-  <link rel="apple-touch-icon" href="/icon.png" />
-  <link rel="icon" type="image/png" href="/icon.png" />
+  <!-- ROUND THREE, ITEM 8 — page pinch-zoom fought the chart's own gesture.
+       The chart handles pinch itself to zoom a time axis; the browser handled
+       the same pinch by scaling the whole page, so the two competed and the
+       keeper got whichever won the race. `maximum-scale` + `user-scalable=no`
+       stops the page one.
+
+       This is the one place it is right to do. It is a deliberate loss of a
+       browser accessibility affordance, taken because the app is a fixed-width
+       phone layout whose own controls are already at touch size, and because
+       the gesture it disables is one the app has its own meaning for. Text
+       scaling set at the OS level is untouched and still applies. -->
+  <meta name="viewport"
+    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
+  <link rel="apple-touch-icon" href="/app/assets/icon-180.png" />
+  <link rel="icon" type="image/svg+xml" href="/app/assets/icon.svg" />
   <meta name="apple-mobile-web-app-capable" content="yes" />
   <meta name="mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
-  <meta name="apple-mobile-web-app-title" content="Tank Wizard" />
+  <meta name="apple-mobile-web-app-title" content="Dosing Wizard" />
   <meta name="theme-color" content="#08191D" />
-  <title>Tank Wizard &middot; Reef Console</title>
+  <link rel="manifest" href="/app/manifest.webmanifest" />
+  <title>Dosing Wizard</title>
 </head>
 <body>
   <div id="root"></div>
-  <script type="module" src="/src/main.jsx"></script>
+  <script type="module" src="/app/src/main.jsx"></script>
 </body>
 </html>
```

---

### `app/src/lib/dates.js`

| | |
|---|---|
| V1 source | `src/lib/dates.js` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `061d83f246b3f30016bc29ddb021e782b0bbda6d42162611ca2b58bc1c336794` |
| V1 blob | `837de8424fdd6d7baf056aa92f62d5ccea535e57` |
| Ported SHA-256 | `0032240bd50d1289dc777b224c6268f30b3c75d3d8d6f068aa8cf70343fa2e4d` |
| Differences | 2 |

1. **data source rewired — the local-day helpers read the application's clock (`app/src/store/time.js`) instead of the wall clock, so test mode's chosen instant moves them**

```diff
@@ -6,6 +6,8 @@
  * this app is a calendar day in the user's own timezone, so they are formatted
  * and parsed locally throughout.
  */
+import { now } from "../store/time.js";
+
 export const isoLocal = (d) => {
   const p = (n) => String(n).padStart(2, "0");
   return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
```

2. **chemistry removed — `paramStatus`, V1's position classifier, deleted; `todayStr` and `addDaysFromToday` rewired onto the application clock in the same hunk**

```diff
@@ -14,18 +16,30 @@
   const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
   return new Date(y, (m || 1) - 1, d || 1);
 };
-export const todayStr = () => isoLocal(new Date());
+/* THE ONE CHANGE THIS FILE NEEDED.
+
+   V1 read `new Date()` here. V2 has one clock — `app/src/store/time.js` — and
+   test mode works by moving it; a screen that reached past it for the wall
+   clock would show today's date inside a March the keeper had chosen. `TM-23`
+   is the test that finds a module doing that. */
+export const todayStr = () => isoLocal(now());
 /* Shorthand for "n days from today", in local terms. */
-export const addDaysFromToday = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return isoLocal(x); };
+export const addDaysFromToday = (n) => { const x = now(); x.setDate(x.getDate() + n); return isoLocal(x); };
 export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
 export const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
 export const fmtShort = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });
 
-export function paramStatus(def, value) {
-  if (value == null || isNaN(value)) return "unknown";
-  if (value < def.min) return "low";
-  if (value > def.max) return "high";
-  return "ok";
-}
+/* V1's `paramStatus` stood here: a position classifier — below the minimum is
+   "low", above the maximum is "high" — living in a UI library and called from
+   eight surfaces. It is deleted rather than ported. Canon `X-INV-004` gives
+   the domain engine one analytical owner, and `DEC-003` forbids a UI component
+   recomputing chemistry; a function that decides what a reading MEANS is
+   exactly what neither permits.
 
+   V2's alkalinity position comes from the engine, as `EngineResult.position`,
+   and is rendered through `app/src/present/position.js`. For the parameters
+   this build does not assess there is no position at all, and the interface
+   says nothing rather than classifying them itself. That omission is recorded
+   in `docs/migration/PORT-OMISSIONS.md`. */
+
 export const STATUS_COLOR = { ok: "#0B7C86", low: "#926A09", high: "#C4285B", unknown: "#9FB0AE" };
```

---

### `app/src/lib/constants.js`

| | |
|---|---|
| V1 source | `src/lib/constants.js` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `05bb6cc96d447b1a33fa5685fa03518ab828972c25a95e6631145af21b3c5c1b` |
| V1 blob | `ea8d6ab2189ad7c1d3d01f3b5392c0b90a18d30a` |
| Ported SHA-256 | `88c95d27bbc53d8eb605b6fa7a183f7e8e9c0802271934e87f712db3c15c1c98` |
| Differences | 1 |

1. **defect fixed — a module of constants that could not be loaded outside the bundler could not be tested. V1's version imported five icon components so `NAV` could carry them, and anything importing it transitively was unreachable from a Node-only test runner; the chemistry in `PARAM_DEFS` — target ranges, cadences, ideal-at directions — is deleted in the same hunk, and `NAV` now carries an icon key the shell binds**

```diff
@@ -1,57 +1,83 @@
-import { Activity, Beaker, FlaskConical, LayoutDashboard, ListChecks, Settings2 } from '../icons.jsx'
-
 /* ---------------------------------- constants ---------------------------------- */
 
-/* Target ranges, checked against the hobby consensus rather than assumed.
-   Calcium ran 450-500 and magnesium 1450-1500, and both sat entirely ABOVE
-   every published range: natural seawater is about 420 ppm calcium and 1290
-   ppm magnesium, and the sources converge on 400-450 and 1250-1400. The effect
-   was worse than cosmetic — a tank at a textbook 435 ppm calcium and 1285 ppm
-   magnesium read as out of band on both, and the app offered to push magnesium
-   to 1475, a level the same sources describe as stressing invertebrates and
-   suppressing calcium and alkalinity uptake. The app was steering people away
-   from correct values.
+/* THIS MODULE IMPORTS NOTHING, AND THAT IS DELIBERATE.
 
-   Anyone running deliberately higher can still set their own range; these are
-   the defaults, and defaults should be the consensus. */
-/* Text colours meet 4.5:1 against the page. The warn amber was 2.69:1 and is
-   used as a tone, which becomes text in the summary and the Dosing Wizard —
-   a warning nobody can comfortably read is worse than no warning. The muted
-   ink and the parameter labels were 2.55 to 3.93. Hue is preserved; only
-   lightness moved, so the palette still reads as itself.
+   V1's version imported five icon components so `NAV` could carry them. That
+   made a file of constants loadable only through a bundler — and the test
+   runner is Node with no dependencies, so anything importing this transitively
+   could not be tested at all. `PORT-11` hit it: it drives the read adapter,
+   the read adapter reads `PARAM_STYLE`, and Node stopped at `icons.jsx`.
 
-   Chart strokes and fills keep the original values where they are purely
-   graphical: 3:1 is the bar for a graphical object and they all clear it. */
-export const PARAM_DEFS = [
-  { key: "alkalinity", label: "Alkalinity", unit: "dKH", min: 8.2, max: 8.8, step: 0.1, freqDays: 2, color: "#0B7C86" },
-  { key: "salinity", label: "Salinity", unit: "ppt", min: 34, max: 36, step: 0.1, freqDays: 3, color: "#1D6FA5" },
-  { key: "calcium", label: "Calcium", unit: "ppm", min: 400, max: 450, step: 1, freqDays: 7, color: "#B8541A" },
-  { key: "magnesium", label: "Magnesium", unit: "ppm", min: 1250, max: 1400, step: 1, freqDays: 21, color: "#7B4FCB" },
-    /* Potassium is slow-moving and monthly-tested. 380-420 is all comfortable
-     territory, so the band is wide and the cadence is 30 days rather than 7. */
-  /* Brand colours may never be byte-identical to a severity colour
-     (wizard-states.md §15, colour registry, decided 14 Aug). Potassium was
-     #926A09 (== STATUS_COLOR.low) and phosphate #C4285B (== STATUS_COLOR.high),
-     so a perfect phosphate reading charted in the danger red. The replacements
-     are measured, not eyeballed: contrast on the #F3F7F6 page 4.54:1 and
-     5.76:1 (§18 floor 4.5 text / 3 stroke), CIE76 from the severity colour
-     each replaced 32.7 and 37.9. Alkalinity's #0B7C86 (== ok) stays by
-     decision — TW-046, 2026-08-15. */
-  { key: "potassium", label: "Potassium", unit: "ppm", min: 380, max: 420, step: 5, freqDays: 30, color: "#5F7A12" },
-  { key: "phosphate", label: "Phosphate", unit: "ppm", min: 0.03, max: 0.10, step: 0.01, freqDays: 7, color: "#9B3A8C" },
-  { key: "nitrate", label: "Nitrate", unit: "ppm", min: 5, max: 15, step: 0.1, freqDays: 7, color: "#2A8050" },
-  { key: "ammonia", label: "Ammonia", unit: "ppm", min: 0, max: 0.25, step: 0.01, freqDays: null, color: "#D0342C", idealAt: "min" },
-  { key: "ph", label: "pH", unit: "", min: 7.8, max: 8.4, step: 0.01, freqDays: null, color: "#2AA7B0" },
-];
+   So `NAV` carries an icon KEY and the shell binds it to a component. The tab
+   set is data; which glyph draws it is the shell's business. */
 
+/* V1's `PARAM_DEFS` stood here, and most of it is gone.
 
+   It carried a target range, a test cadence and an "ideal at" direction for
+   every parameter, with a long comment arguing the ranges against hobby
+   consensus. Every one of those is chemistry: a band edge, a cadence, a
+   direction of preference. `CLAUDE.md` is unambiguous that chemistry "may not
+   arrive by invention, by task instruction, by `DECISIONS.md`, by an
+   owner-decision entry, by `docs/research/`, or by V1", and V1 is precisely
+   where those numbers came from.
+
+   So what remains is the part that was never chemistry: the colour each
+   parameter is drawn in, and the icon that makes a card recognisable before it
+   is read.
+
+   Where the rest now comes from:
+
+     the parameter list  `app/src/store/ledger.js` — `PARAMETERS`
+     the display range   `app/src/store/config.js` — `keeperRange`, which is
+                         the KEEPER's own number, drawn on his charts and
+                         governing nothing
+     the test cadence    the keeper's own tasks (`app/src/store/schedule.js`),
+                         which ship with no seeded interval at all, and — for
+                         alkalinity only — the engine's retest recommendation
+
+   THE COLOURS ARE V1'S, MEASURED
+
+   Carried across unchanged, including the two that were measured rather than
+   eyeballed. V1's note on them is worth keeping because it is the reason they
+   are these exact values: a brand colour may never be byte-identical to a
+   severity colour, because potassium at `#926A09` and phosphate at `#C4285B`
+   meant "a perfect phosphate reading charted in the danger red". The
+   replacements were checked at 4.54:1 and 5.76:1 on the page.
+
+   ONE DISCREPANCY, RECORDED RATHER THAN RESOLVED
+
+   The brief for this port lists "pH olive, potassium teal-cyan". V1's source
+   has them the other way round — potassium olive `#5F7A12`, pH teal-cyan
+   `#2AA7B0`. The instruction was to take the colours from V1, so V1's actual
+   assignment is what is here. See `docs/migration/PORT-OMISSIONS.md`. */
+export const PARAM_STYLE = {
+  ALK: { color: "#0B7C86", icon: "alkalinity" },
+  SAL: { color: "#1D6FA5", icon: "salinity" },
+  CA:  { color: "#B8541A", icon: "calcium" },
+  MG:  { color: "#7B4FCB", icon: "magnesium" },
+  K:   { color: "#5F7A12", icon: "potassium" },
+  PO4: { color: "#9B3A8C", icon: "phosphate" },
+  NO3: { color: "#2A8050", icon: "nitrate" },
+  PH:  { color: "#2AA7B0", icon: "ph" },
+};
+
+/* Five tabs. V1 shipped six — Dashboard, Test Lab, Dosing, Insights, Tasks,
+   Setup — and Insights is not carried: it was 1,114 lines importing fourteen
+   analytics modules, every one of them a second owner of something the engine
+   owns in V2. The salvage inventory dispositions it
+   `TANGLED_WITH_V1_DOMAIN_LOGIC_REBUILD_LATER`. */
 export const NAV = [
-  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
-  { id: "log", label: "Test Lab", icon: FlaskConical },
-  { id: "dosing", label: "Dosing", icon: Beaker },
-  { id: "insights", label: "Insights", icon: Activity },
-  { id: "tasks", label: "Tasks", icon: ListChecks },
-  { id: "setup", label: "Setup", icon: Settings2 },
+  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
+  { id: "log", label: "Test", icon: "flask" },
+  { id: "dosing", label: "Dosing", icon: "beaker" },
+  { id: "tasks", label: "Tasks", icon: "checks" },
+  { id: "setup", label: "Setup", icon: "settings" },
 ];
 
-export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
+/* An id, not a moment. V1 built it from `Date.now()`, which made it a module
+   that reads the wall clock — and V2 has one clock, which `TM-23` enforces by
+   finding every module that reaches past it. A counter does the same job here:
+   the value only has to be unique within a session, because everything that
+   needs an ORDER gets it from the ledger's own `(instant, ordinal, id)`. */
+let uidCounter = 0;
+export const uid = () => Math.random().toString(36).slice(2, 10) + (uidCounter++).toString(36);
```

---

### `app/src/lib/storage.js`

| | |
|---|---|
| V1 source | `src/lib/storage.js` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `ad27013a279585ffdd720b21ab848aaf072168ff7b5f610f4dda398a0e46e311` |
| V1 blob | `9f41072f8a0b58906cdbd9c70a317714250a2ee9` |
| Ported SHA-256 | `ac6c12bfdc000c35343b3075fe9f9a486f275bc1b7f68ac326e7c4b68683cbbd` |
| Differences | 2 |

1. **data source rewired — V1's localStorage and photo-store machinery deleted; V2's ledger, assessments and configuration are the record. Only the notification bus survives**

```diff
@@ -1,202 +1,24 @@
-import { KV_STORE, run } from './idb.js';
-import { noteCount } from './install-witness.js';
-import {
-  PHOTO_KEY, announceFallbackOnce, attachPhotos, collectOrphans, detachPhotos,
-  needsMigration, photosAreInline,
-} from './photo-store.js';
-
-/* ---------------------------------- storage helpers ---------------------------------- */
-
-/* Two storage backends, tried in order. The host bridge is preferred where it
-   exists, but it can fail in ways localStorage doesn't — a bridge that returns
-   an unexpected response would otherwise lose a change with only a red banner
-   to show for it. Falling through means the data still lands somewhere.
-
-   `window.storage` is a genuine host bridge, supplied by an environment the
-   app is embedded in. There used to be a shim here that installed a fake one
-   whenever it was absent, backed by this same localStorage under the prefix
-   below. Nothing in the shipped PWA defines `window.storage` — not
-   index.html, not main.jsx — so the shim was always installed, `saveKey`
-   always took its bridge branch, and that branch's mirror wrote a second,
-   byte-identical copy of every value into the same localStorage under a
-   second prefix. The app's effective quota was half what the browser gave it,
-   and bought nothing: the mirror exists so that a bridge failure cannot lose
-   a write, and a bridge that *is* localStorage cannot fail in any way its own
-   mirror would survive.
-
-   The shim is gone. Environments with a real bridge are untouched — the shim
-   only ever installed where there was none — and the mirror is kept for them,
-   which is the case its reasoning was written for. */
-export const LS_PREFIX = "danstank:";
-export const LEGACY_PREFIX = "reefconsole:";
-
-export function lsGet(key) {
-  try {
-    const raw = window.localStorage.getItem(LS_PREFIX + key);
-    return raw == null ? undefined : JSON.parse(raw);
-  } catch { return undefined; }
-}
-/* Why the failure is kept rather than reduced to `false`: it is the only
-   evidence of *why* a save failed, and the difference between "storage is
-   full, here is what takes up the room" and "unknown error" is the difference
-   between a user who can act and one who cannot. It used to reach `saveKey`
-   only because the shim threw it across the bridge branch first. */
-let lastLocalError = null;
-export function lsSet(key, value) {
-  try {
-    window.localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
-    lastLocalError = null;
-    return true;
-  } catch (e) { lastLocalError = e; return false; }
-}
-
-/* Devices that ran the shim hold every value under both prefixes. The legacy
-   copy is the authoritative one — `saveKey` wrote it first and `loadKey` read
-   the bridge before the mirror — so it is carried across and only then
-   removed. Reclaiming the duplicate is the point: without this an existing
-   install goes on paying the doubled footprint forever, and the fix would only
-   help devices that had never run the app.
-
-   Drained rather than merely read as a fallback, because a fallback cannot
-   work here: a stale mirror sitting under the live prefix would shadow the
-   good copy behind it, and the near-quota device where the pair diverged in
-   the first place is exactly the one that would be hurt.
-
-   Failing safely is designed in. Identical copies — every key on a device that
-   was never short of space — need no write at all, only a removal, which
-   cannot fail for want of room. A key that does need a write and cannot get
-   one keeps both copies and is recorded, so reads go on preferring the legacy
-   copy until a later run has the room to finish. Nothing is removed before its
-   replacement is known to be in place. */
-const undrained = new Set();
-
-export function drainLegacyStore() {
-  const tally = { reclaimed: 0, carried: 0, undrained: 0 };
-  const keys = [];
-  try {
-    for (let i = 0; i < window.localStorage.length; i++) {
-      const k = window.localStorage.key(i);
-      if (k && k.startsWith(LEGACY_PREFIX)) keys.push(k.slice(LEGACY_PREFIX.length));
-    }
-  } catch { return tally; }
-
-  undrained.clear();
-  for (const key of keys) {
-    const legacy = window.localStorage.getItem(LEGACY_PREFIX + key);
-    if (legacy === null) continue;
-    if (window.localStorage.getItem(LS_PREFIX + key) === legacy) {
-      tally.reclaimed++;
-    } else {
-      try {
-        window.localStorage.setItem(LS_PREFIX + key, legacy);
-        tally.carried++;
-      } catch {
-        undrained.add(key);
-        tally.undrained++;
-        continue;
-      }
-    }
-    try { window.localStorage.removeItem(LEGACY_PREFIX + key); } catch { /* keep both */ }
-  }
-  return tally;
-}
-
-function readKey(key, fallback) {
-  try {
-    if (window.storage && window.storage.get) {
-      /* The bridge is synchronous only in shape; the caller awaits this. */
-      return window.storage.get(key, false).then((res) => {
-        /* The parse is inside the fallback, not outside it: a bridge that
-           hands back something unparseable must land on the local chain the
-           same way one that throws does, rather than rejecting the load. */
-        try {
-          if (res && res.value) return JSON.parse(res.value);
-        } catch { /* fall through to the local chain */ }
-        return readStored(key, fallback);
-      }, () => readStored(key, fallback));
-    }
-  } catch (e) { /* fall through to the local chain */ }
-  return readStored(key, fallback);
-}
-
-/* Values are kept as JSON strings rather than structured clones, so what
-   IndexedDB holds is byte-for-byte what localStorage held — the migration is
-   checkable by comparing strings, and the parse behaves identically on both
-   sides of the move. */
-async function kvGet(key) {
-  const res = await run(KV_STORE, "readonly", (s) => s.get(key));
-  if (!res.ok || typeof res.value !== "string") return { found: false, value: undefined };
-  try {
-    return { found: true, value: JSON.parse(res.value) };
-  } catch {
-    /* A corrupt entry answers nothing; the localStorage chain may still hold
-       a good copy from before the migration. */
-    return { found: false, value: undefined };
-  }
-}
-
-/* IndexedDB first, then localStorage. A key found only in localStorage has
-   not been moved yet — an install from before the change, or one where an
-   earlier attempt had nowhere to write. Moving it is exactly what saving it
-   does, so that is what happens, through the one write path — and it inherits
-   the same guarantee as the photo move: a key that cannot be written stays
-   where it already works, and a later load retries. */
-async function readStored(key, fallback) {
-  const kv = await kvGet(key);
-  if (kv.found) return kv.value;
-
-  const local = readLocal(key);
-  if (local !== undefined) {
-    await saveKey(key, local);
-    return local;
-  }
-  return fallback;
-}
-
-function readLocal(key) {
-  /* A key the drain could not finish still lives under the legacy prefix, and
-     that copy is the newer of the two. Empty on every device the drain
-     completed on, which is all of them but one that was out of space at load.
-     The migration above must take this answer — the drain-aware one — or the
-     stale mirror it exists to shadow would be the copy that gets moved, and
-     the loss TW-032 was filed to stop would become permanent. */
-  if (undrained.has(key)) {
-    try {
-      const raw = window.localStorage.getItem(LEGACY_PREFIX + key);
-      if (raw != null) return JSON.parse(raw);
-    } catch { /* fall through to the mirror */ }
-  }
-  return lsGet(key);
-}
-
-export async function loadKey(key, fallback) {
-  const value = await readKey(key, fallback);
-
-  /* ICP report photos are the one thing not kept in localStorage — see
-     src/lib/photo-store.js for why, and for the shape on each side. From here
-     out the row looks exactly as it always did, with the photo inline on it,
-     which is what lets every caller of this function stay unchanged. */
-  if (key !== PHOTO_KEY || !Array.isArray(value)) return value;
+/* ============================================================================
+   WHAT IS LEFT OF V1's STORAGE MODULE
+   ----------------------------------------------------------------------------
+   V1's `src/lib/storage.js` was 316 lines: two storage backends tried in
+   order, a localStorage prefix, a photo store split underneath the key-value
+   contract, quota detection and an orphan collector. All of it is deleted.
 
-  const attached = await attachPhotos(value);
-  if (attached.missing > 0) {
-    /* A row that claims a photo the database does not have. Rendering the
-       panel with a blank space where the picture was is the one outcome this
-       whole phase exists to prevent, so it is said out loud. */
-    report(`${attached.missing === 1 ? "A report photo" : `${attached.missing} report photos`} could not be read back` +
-      (attached.reason ? ` (${attached.reason})` : "") +
-      ". The panel's readings are unaffected. Restoring a backup file will bring the photo back.");
-  }
+   V2 keeps its own storage — the append-only event ledger, stored assessments
+   with their version stamps, the configuration history and the import — and
+   the brief for this port is explicit that it stays: "Keep V2's storage layer
+   entirely." A second key-value store beside it would be a second record of
+   the same tank.
 
-  /* Photos still sitting inline in localStorage have not been moved yet: this
-     is an install from before the change, or one where an earlier attempt had
-     nowhere to write. Moving them is exactly what saving them does, so that is
-     what happens — and it inherits the same guarantee, that a photo which
-     cannot be written stays where it already works. A later load retries. */
-  if (needsMigration(attached.rows)) await saveKey(PHOTO_KEY, attached.rows);
+   What survives is the part that was never storage at all: the notification
+   bus. `notify` puts a message on screen and `onToast` is how the shell
+   subscribes to it. It sat in this file in V1 because the thing that most
+   needed to say something was a failed write; it is kept here, under V1's
+   path, so that every ported call site — `DeleteButton`, the task list, the
+   dose forms — reaches it exactly where it always did.
+   ========================================================================= */
 
-  return attached.rows;
-}
 /* Storage failures used to be swallowed, which made a full quota look like a
    successful save until the next reload. Surface them instead. */
 export let toastHandler = null;
```

2. **data source rewired — the remainder of V1's key-value store, quota handling and orphan collector deleted for the same reason**

```diff
@@ -215,102 +37,3 @@
   return n === "QuotaExceededError" || n === "NS_ERROR_DOM_QUOTA_REACHED" ||
          /quota|exceeded|storage is full|too large/i.test(m);
 }
-
-function report(message) { if (storageErrorHandler) storageErrorHandler(message); }
-
-
-export async function saveKey(key, value) {
-  /* Photos out of the row and into IndexedDB before the row is serialised.
-     Anything that cannot be moved stays inline and is written to localStorage
-     exactly as it was before this existed. */
-  if (key === PHOTO_KEY && Array.isArray(value)) {
-    const detached = await detachPhotos(value);
-    /* A fallback that works is not worth a red banner on every save, but it is
-       worth one — the photos are going somewhere much smaller than they would
-       otherwise, and that is the user's business. */
-    if (detached.inline > 0 && announceFallbackOnce()) {
-      report("Report photos are being kept in browser storage on this device" +
-        (detached.reason ? ` (${detached.reason})` : "") +
-        ", which holds far less than the photo store does. Your data is saved. " +
-        "Keeping fewer photos, or saving a backup file, will keep it that way.");
-    }
-    if (detached.moved > 0 || detached.inline === 0) await collectOrphans(detached.rows);
-    value = detached.rows;
-  }
-
-  /* How much this device has ever held, recorded as it is written rather than
-     only at startup — a session that adds 40 readings and is wiped before the
-     next launch should still be able to say so. Kept in IndexedDB, so it
-     survives a clear that takes only localStorage; it can never make a save
-     fail, and a device with no IndexedDB simply records nothing. */
-  const witnessed = Array.isArray(value) ? noteCount(key, value.length) : null;
-
-  let bridgeError = null;
-  try {
-    if (window.storage && window.storage.set) {
-      await window.storage.set(key, JSON.stringify(value), false);
-      /* Mirror to local storage as well, so a later bridge failure can still
-         read back what was written. */
-      lsSet(key, value);
-      await witnessed;
-      return true;
-    }
-  } catch (e) {
-    bridgeError = e;
-    console.error("storage bridge save failed", key, e);
-  }
-
-  /* IndexedDB is where a value lives now. On a confirmed write both
-     localStorage prefixes are cleared for the key — removals cannot fail for
-     want of room — which is what stops the next load's drain resurrecting a
-     legacy copy into a store the app no longer treats as authoritative, and
-     incidentally hands the drain the space it may have been short of. Nothing
-     is removed until the replacement is known to be in place. */
-  const kv = await run(KV_STORE, "readwrite", (s) => s.put(JSON.stringify(value), key));
-  if (kv.ok) {
-    try { window.localStorage.removeItem(LS_PREFIX + key); } catch { /* stale copy stays; the next save retries */ }
-    try { window.localStorage.removeItem(LEGACY_PREFIX + key); } catch { /* same */ }
-    undrained.delete(key);
-    await witnessed;
-    return true;
-  }
-
-  /* IndexedDB unavailable or refusing — localStorage still works, and a value
-     kept where it works beats one lost to a better store. Worth saying once,
-     through the same once-per-connection gate the photo fallback uses: both
-     messages describe the same degraded device, and whichever save trips it
-     first says so — one banner, not one per concern. */
-  if (announceFallbackOnce() && storageErrorHandler) {
-    storageErrorHandler(
-      "This device is keeping your data in the smaller browser storage" +
-      (kv.reason ? ` (${kv.reason})` : "") +
-      ". Your data is saved. Saving a backup file now and then will keep it that way."
-    );
-  }
-
-  /* In the shipped PWA this is now the fallback path; the local failure is
-     the one worth reporting, since with a bridge in play its failure came
-     first and explains more. */
-  if (lsSet(key, value)) { await witnessed; return true; }
-
-  const e = bridgeError || lastLocalError;
-  if (storageErrorHandler) {
-    storageErrorHandler(
-      /* What to delete depends on where the photos ended up. Naming them is
-         only useful advice while they are still in this store; once they are
-         in the photo database, telling someone to remove a few would send
-         them after space that was never the problem. */
-      isQuotaError(e)
-        ? "Storage is full, so that change was not saved. " + (photosAreInline()
-            ? "ICP report photos use the most space on this device — remove a few, then try again."
-            : "Removing some older entries will make room.") +
-          " Save a backup file first if you need one."
-        : "That change could not be saved (" + (e && e.message ? e.message : "unknown error") + ")."
-    );
-  }
-  return false;
-}
-
-/* Once per load, before anything reads. Cheap on a drained device: one pass
-   over the localStorage key list, finding nothing. */
-drainLegacyStore();
```

---

### `app/src/lib/backup.jsx`

| | |
|---|---|
| V1 source | `src/lib/backup.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `6a653e082be3108bada05c4945ec81b7e4ed6a44ef2886dbb8a37cd2bc9f91e7` |
| V1 blob | `797a55c25cd2a632afb85e84946fbf709759a71f` |
| Ported SHA-256 | `76b04f5e863ee3a8ec6de31963541488ff58a867d21d3d0a8a8da97e7f133ae2` |
| Differences | 11 |

1. **data source rewired — the calendar can take a completion back off the record, through V2's task store; owner decision 32 makes anything the keeper recorded deletable, and finding 16 names the calendar as one of the places he goes looking for it**

```diff
@@ -2,362 +2,72 @@
 import { Btn, Field, inputCls } from '../components/DoseExpectation.jsx'
 import { Card } from '../components/ErrorBoundary.jsx'
 import { Check, ChevronDown, Save, Settings2, X } from '../icons.jsx'
-import { fmtVal } from './analytics/time-in-range.js'
-import { addDays } from './analytics/time-of-day.js'
-import { DEFAULT_SETTINGS, fmtFriendly } from './analytics/water-changes.js'
-import { uid } from './constants.js'
-import { STATUS_COLOR, fmtShort, paramStatus, todayStr } from './dates.js'
-import { intervalLabel, projectOccurrences } from './reminders.js'
-import { loadKey, saveKey } from './storage.js'
-
-/* --- Backup and restore ---
- *
- * Browser storage is not durable. On iOS, Safari deletes a site's local storage
- * after seven days without a visit, and clearing browsing data wipes it at any
- * time. Adding the app to the home screen avoids the seven-day rule, but not a
- * lost phone or an accidental clear.
- *
- * The CSV export is for reading — open it in a spreadsheet, share it. It is not
- * a backup: it flattens ICP panels into rows and drops settings entirely, so it
- * cannot be restored from. This is the file that can.
- */
-export const BACKUP_LABELS = {
-  "readings": "Test readings", "icp-tests": "ICP panels", "water-changes": "Water changes",
-  "dose-log": "Dose changes", "lighting-log": "Lighting notes", "task-log": "Completed tasks",
-  "tasks-custom": "Custom tasks", "reminders": "Reminder schedules",
-};
-
-export const BACKUP_KEYS = [
-  "readings", "icp-tests", "tasks-custom", "task-log", "lighting-log",
-  "custom-ranges", "tank-settings", "dose-log", "water-changes", "reminders", "kit-changes",
-  "findings-dismissed", "alk-plan", "corrections", "ca-plan", "mg-plan",
-  /* An in-progress correction: the elevated dose, what it is correcting
-     toward, and the dose to go back to when it arrives. It was written by the
-     app and read by the app but collected by neither half of this file, so a
-     restore returned the dose log showing an elevated dose with nothing left
-     to explain it, and nothing to tell the user to put the dose back. */
-  "correction-plans",
-];
-
-export async function buildBackup() {
-  const data = {};
-  for (const key of BACKUP_KEYS) {
-    data[key] = await loadKey(key, null);
-  }
-  return {
-    format: "dans-tank-backup",
-    version: 1,
-    createdAt: new Date().toISOString(),
-    counts: {
-      readings: (data["readings"] || []).length,
-      icps: (data["icp-tests"] || []).length,
-      waterChanges: (data["water-changes"] || []).length,
-      doseChanges: (data["dose-log"] || []).length,
-      taskLog: (data["task-log"] || []).length,
-      lighting: (data["lighting-log"] || []).length,
-    },
-    data,
-  };
-}
-
-/* The natural key each list merges on. Merging is by natural key, never by id,
-   because ids are regenerated and would let the same reading in twice.
-
-   Written once and shared by the preview and the restore. It used to be two
-   copies of the same object literal, one in each function, which is how they
-   came to disagree about what counted as a duplicate.
-
-   Time of day is part of the key for readings and dose changes because a day
-   is not the unit either of them happens in. Two alkalinity tests, one before
-   the morning dose and one after the evening one, is the ordinary way to find
-   out what a dose did; two dose changes in a day is what a staged plan looks
-   like when you change your mind. On `param|date` alone the pair collided and
-   the second was dropped, silently, on every restore.
-
-   `r.time || ""` rather than requiring a time: rows written before times were
-   recorded have none, and they must still match themselves, or restoring an
-   old file would duplicate every row in it. */
-export const NATURAL_KEYS = {
-  "readings": (r) => `${r.param}|${r.date}|${r.time || ""}`,
-  "icp-tests": (r) => r.date,
-  "water-changes": (r) => `${r.date}|${r.litres}`,
-  "dose-log": (r) => `${r.element || "alkalinity"}|${r.date}|${r.time || ""}`,
-  "lighting-log": (r) => r.date,
-  "task-log": (r) => `${r.taskId}|${r.date}`,
-  "tasks-custom": (r) => r.id,
-  "reminders": (r) => r.id,
-};
-
-/* Only entries the app can actually use are counted. Two problems otherwise:
-   a null in any list threw while building the key, so a single bad entry
-   made the whole file unreadable with no explanation; and a string or a
-   number in the readings list was counted as an importable record, so the
-   preview promised more than the restore would deliver and the difference
-   vanished silently. */
-const usable = (rows) => (Array.isArray(rows) ? rows : [])
-  .filter((r) => r && typeof r === "object" && !Array.isArray(r));
-
-/* One merge, run by the preview and by the restore, so the number on the
-   confirmation screen is the number of rows that actually arrive.
-
-   The preview used to count the incoming rows that were absent from current
-   state, which is not the same question: it deduped the file against the
-   device but never against itself, while the restore deduped both ways. A
-   file holding the same entry twice was previewed as two recoveries and
-   delivered as one, and nothing said so. */
-export function planMerge(currentRows, incomingRows, keyFn) {
-  const merged = usable(currentRows);
-  const have = new Set(merged.map(keyFn));
-  const kept = [];
-  for (const row of usable(incomingRows)) {
-    const k = keyFn(row);
-    if (have.has(k)) continue;
-    have.add(k);
-    kept.push(row);
-  }
-  return { merged, kept };
-}
-
-const isRange = (v) => v && typeof v === "object" && !Array.isArray(v);
-const sameRange = (a, b) => (a == null && b == null)
-  || (isRange(a) && isRange(b) && a.min === b.min && a.max === b.max);
-
-/* Which parameters the file and this device disagree about, with both values,
-   so a restore can show them rather than pick one.
-
-   A target range present on one side and absent on the other is a disagreement too:
-   absent means "use the app's default band", which is a different band from
-   whatever the other side names, and history reads the same either way. */
-export function rangeConflicts(fileRanges, deviceRanges) {
-  /* A file that says nothing about target ranges is not disagreeing with anything —
-     the same reading the correction plans below get. Absence has three shapes
-     and none of them may be read as "go back to the defaults": a file written
-     before this key was collected has no member at all, a device that has
-     never customised a band writes an explicit null, and `{}` is what
-     `loadKey("custom-ranges", {})` hands back for the same device. Asking the
-     user to choose between their target ranges and no target ranges on every restore of
-     an ordinary file would be noise, and the answer that matters — keep what
-     is on this device — is the one absence already implies. */
-  if (!isRange(fileRanges) || Object.keys(fileRanges).length === 0) return [];
-  const f = fileRanges;
-  const d = isRange(deviceRanges) ? deviceRanges : {};
-  const params = [...new Set([...Object.keys(d), ...Object.keys(f)])].sort();
-  return params
-    .filter((p) => !sameRange(d[p], f[p]))
-    .map((p) => ({ param: p, device: isRange(d[p]) ? d[p] : null, file: isRange(f[p]) ? f[p] : null }));
-}
-
-/* Describe a backup file without writing anything, so the restore can be seen
-   before it happens. */
-export function inspectBackup(parsed, current, deviceRanges = null) {
-  if (!parsed || parsed.format !== "dans-tank-backup") {
-    return { ok: false, reason: "That doesn't look like a backup from this app." };
-  }
-  if (!parsed.data || typeof parsed.data !== "object") {
-    return { ok: false, reason: "The file is missing its data." };
-  }
-  const b = parsed.data;
-  /* Unusable entries are reported rather than ignored — telling someone their
-     backup had 412 readings when 9 of them cannot be read is the difference
-     between a restore they can trust and one that quietly loses data. */
-  const summary = [];
-  let skipped = 0;
-  for (const key of Object.keys(NATURAL_KEYS)) {
-    const raw = Array.isArray(b[key]) ? b[key] : [];
-    const incoming = usable(raw);
-    skipped += raw.length - incoming.length;
-    const { kept } = planMerge(current[key], incoming, NATURAL_KEYS[key]);
-    if (raw.length) summary.push({ key, total: incoming.length, fresh: kept.length, skipped: raw.length - incoming.length });
-  }
-  const hasSettings = b["tank-settings"] && typeof b["tank-settings"] === "object";
-  return {
-    ok: true, summary, hasSettings, skipped,
-    createdAt: parsed.createdAt,
-    rangeConflicts: rangeConflicts(b["custom-ranges"], deviceRanges),
-  };
-}
-
-/* Merge rather than replace. Restoring the same file twice changes nothing the
-   second time, and restoring an old backup never removes newer entries.
-
-   `options.ranges` says what to do about the target ranges, and there is no
-   default that can be applied quietly. Every band a reading is classified
-   against is computed live from `custom-ranges` — the log's colours, the
-   chart's shading, every tooltip — so writing the file's copy over the
-   device's re-labels the entire history, including readings logged after the
-   file was written, and keeping the device's copy silently discards a target range
-   the user may be restoring on purpose. Both directions change what the app
-   says about the past, so when the two disagree the caller must have asked:
-   "keep" leaves this device's target ranges alone, "file" takes the backup's.
-   Anything else is refused before a single row is written. */
-export async function restoreBackup(parsed, current, applySettings, options = {}) {
-  const b = parsed.data;
-
-  /* Read from storage rather than from `current`, which carries only the
-     eight list keys the preview counts. */
-  const deviceRanges = await loadKey("custom-ranges", null);
-  const conflicts = rangeConflicts(b["custom-ranges"], deviceRanges);
-  const choice = options.ranges;
-  if (conflicts.length && choice !== "keep" && choice !== "file") {
-    /* Refused up front, so a caller that has not been taught to ask fails
-       loudly and completely instead of writing half a restore and rewriting
-       the target ranges on its way past. */
-    throw new Error(
-      `This backup's target ranges differ from this device's for ${conflicts.map((c) => c.param).join(", ")}. `
-      + `Restoring must say which to keep — pass options.ranges as "keep" or "file".`);
-  }
-
-  /* The same guard the inspector applies. The inspector was hardened against
-     nulls and non-objects; this function, which does the actual writing, was
-     not — so a file the preview cheerfully described as ready to import threw
-     the moment the button was pressed. Four shapes did it, including a null in
-     the EXISTING data rather than the incoming file, which no amount of
-     inspecting the file would have caught.
-
-     A preview that promises what the restore cannot deliver is worse than a
-     refusal, because the refusal at least happens before anything is written. */
-  const result = {};
-  for (const key of Object.keys(NATURAL_KEYS)) {
-    const incoming = usable(b[key]);
-    if (!incoming.length) { result[key] = usable(current[key]); continue; }
-    const { merged, kept } = planMerge(current[key], incoming, NATURAL_KEYS[key]);
-    for (const row of kept) merged.push({ ...row, id: row.id || uid() });
-    merged.sort((x, y) => ((x.date || "") < (y.date || "") ? 1 : -1));
-    await saveKey(key, merged);
-    result[key] = merged;
-  }
-  if (applySettings && b["tank-settings"]) {
-    /* Same sanitisation as Setup.jsx:77's saveVolume: a backup file is not
-       trusted input any more than the manual entry field is, so an invalid
-       net volume is refused (null) rather than written through. */
-    const volNum = parseFloat(b["tank-settings"].volumeL);
-    const s = {
-      ...DEFAULT_SETTINGS, ...b["tank-settings"],
-      volumeL: volNum > 0 ? volNum : null,
-    };
-    await saveKey("tank-settings", s);
-    result["tank-settings"] = s;
-  }
-  if (b["findings-dismissed"]) {
-    await saveKey("findings-dismissed", b["findings-dismissed"]);
-    result["findings-dismissed"] = b["findings-dismissed"];
-  }
-  if (b["kit-changes"]) {
-    await saveKey("kit-changes", b["kit-changes"]);
-    result["kit-changes"] = b["kit-changes"];
-  }
-  /* Only on an explicit "use the backup's target ranges". Every parameter the two
-     agree on already holds the same band, so the file's copy IS the answer for
-     the whole set — there is nothing to merge, only a side to take. */
-  if (choice === "file" && conflicts.length) {
-    const next = isRange(b["custom-ranges"]) ? b["custom-ranges"] : {};
-    await saveKey("custom-ranges", next);
-    result["custom-ranges"] = next;
-  }
-
-  /* An in-progress correction is merged per parameter rather than replaced
-     wholesale, which is the promise the lists above already make and the one
-     the restore panel makes to the user: a restore adds what is missing and
-     leaves what you have alone. The plan on this device wins a collision,
-     because it describes the dose going into the tank right now, whereas the
-     plan in a file describes what was running when the file was written.
-
-     The current plans are read from storage rather than from `current`, which
-     carries only the eight list keys the preview counts.
-
-     Absence is the migration case, and it has three shapes: a file written
-     before this key was collected has no member at all, a file from a device
-     with no correction running carries an explicit null, and a corrupted one
-     could carry anything. None of them may be read as "cancel the correction
-     that is running here" — the only safe reading of a file that says nothing
-     about corrections is that it says nothing. */
-  const asPlans = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
-  const currentPlans = asPlans(await loadKey("correction-plans", null));
-  const mergedPlans = { ...asPlans(b["correction-plans"]), ...currentPlans };
-  /* Written only when the file actually contributed a parameter, so restoring
-     the same file twice is still a no-op the second time. */
-  if (Object.keys(mergedPlans).length !== Object.keys(currentPlans).length) {
-    await saveKey("correction-plans", mergedPlans);
-  }
-  result["correction-plans"] = mergedPlans;
-
-  return result;
-}
-
-export function downloadJson(obj, filename) {
-  const blob = new Blob([JSON.stringify(obj, null, 1)], { type: "application/json" });
-  const url = URL.createObjectURL(blob);
-  const a = document.createElement("a");
-  a.href = url; a.download = filename;
-  document.body.appendChild(a); a.click(); document.body.removeChild(a);
-  setTimeout(() => URL.revokeObjectURL(url), 1000);
-}
-
-/* Ask the browser not to evict this site's data. Apple doesn't document whether
-   this overrides the seven-day rule, but it costs nothing to request and
-   developers report it helping.
-
-   Asked once per page load, and the answer is remembered. This used to be
-   called only from Setup's mount effect, which meant two things: a user who
-   never opened that tab never asked at all, and one who opened it repeatedly
-   asked on every visit. The app now asks at launch (src/App.jsx) and Setup
-   reads the same answer to explain it, so the request happens exactly once
-   however many times either caller runs.
-
-   The memo is deliberately per page load rather than persisted. A reload is
-   the natural moment to re-ask — the user may have installed the app to the
-   home screen since, which is precisely what flips the answer on the
-   platforms where it matters. */
-let persistenceAsked = null;
+import { DeleteControl } from '../components/DeleteControl.jsx'
+import { fmtVal, fmtFriendly } from './format.js'
+import { t } from '../strings.js'
+import { positionTone, positionWord, positionIsInRange } from '../present/position.js'
+import { todayStr, fmtShort } from './dates.js'
+import { addDays, now as appNow } from '../store/time.js'
+import { intervalLabel, projectOccurrences } from '../store/schedule.js'
 
-export async function requestPersistence() {
-  if (!persistenceAsked) persistenceAsked = askForPersistence();
-  return persistenceAsked;
-}
+/* ============================================================================
+   WHAT IS LEFT OF V1's `backup.jsx`
+   ----------------------------------------------------------------------------
+   The first 344 lines of V1's file were backup, restore and merge:
+   `BACKUP_KEYS`, `NATURAL_KEYS`, `planMerge`, `rangeConflicts`,
+   `inspectBackup`, `restoreBackup`, `downloadJson`, `downloadCsv`. None of it
+   crossed. It reads and writes V1's own `localStorage` keys, and V2's storage
+   is not going anywhere — the brief keeps "the append-only event ledger,
+   stored assessments with their version stamps, the configuration versioning,
+   and the import" exactly as they are.
 
-async function askForPersistence() {
-  try {
-    if (!navigator.storage || !navigator.storage.persist) return { supported: false };
-    const already = navigator.storage.persisted ? await navigator.storage.persisted() : false;
-    if (already) return { supported: true, granted: true };
-    const granted = await navigator.storage.persist();
-    return { supported: true, granted };
-  } catch {
-    return { supported: false };
-  }
-}
+   What is here is the part that was never about backup at all, and only lived
+   in this file because that is where somebody put it. The salvage inventory
+   makes the point in its own words: these components are "scattered across four
+   files whose names describe something else entirely — a component's home file
+   says nothing about what it is."
 
-export function downloadCsv(csv, filename) {
-  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
-  const url = URL.createObjectURL(blob);
-  const a = document.createElement("a");
-  a.href = url;
-  a.download = filename;
-  document.body.appendChild(a);
-  a.click();
-  document.body.removeChild(a);
-  setTimeout(() => URL.revokeObjectURL(url), 1000);
-}
+   They are kept under V1's path so the port is a port. That the path is a
+   misnomer is V1's, and moving them would have made every line of every one of
+   them a difference with no reason.
+   ========================================================================= */
 
+/* THE RANGE BAR.
 
+   V1 called `paramStatus(def, value)` on its first line and coloured itself
+   from the answer — a position classifier inside a presentation component,
+   which is the violation canon `X-INV-004` names. It is gone. `position` is
+   now a PROP: the value V2's engine emitted, passed down, or `null` where no
+   engine has an opinion.
 
+   That null is the ordinary case rather than the exception. This build
+   assesses alkalinity; for calcium, magnesium, nitrate, phosphate, salinity,
+   pH and potassium there is no engine, so there is no position, and the bar
+   draws the keeper's own range and the reading's place in it without saying a
+   word about what that means. Inventing the word here would be inventing
+   chemistry. Recorded in `docs/migration/PORT-OMISSIONS.md`.
 
-export function ParamGauge({ def, value, recent, compact = false }) {
-  const status = paramStatus(def, value);
-  const color = STATUS_COLOR[status];
+   `def.min` and `def.max` may also be absent, because this build ships no
+   range it cannot source. With no range there is no band to draw, and the bar
+   falls back to the span of what has actually been measured. */
+export function ParamGauge({ def, value, recent, position = null, compact = false }) {
+  const color = positionTone(position);
+  const word = positionWord(position);
   const has = value != null && !isNaN(value);
+  const banded = Number.isFinite(def.min) && Number.isFinite(def.max);
 
   /* The scale must contain the band, the current value and the recent range,
      with a little air so a marker at the extreme isn't clipped. */
-  const pts = [def.min, def.max];
+  const pts = banded ? [def.min, def.max] : [];
   if (has) pts.push(value);
   if (recent && recent.lo != null) pts.push(recent.lo, recent.hi);
+  if (!pts.length) pts.push(0, 1);
   const rawLo = Math.min(...pts), rawHi = Math.max(...pts);
   const span = rawHi - rawLo || Math.abs(rawHi) * 0.2 || 1;
   const lo = rawLo - span * 0.18, hi = rawHi + span * 0.18;
   const pos = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
 
-  const bandL = pos(def.min), bandR = pos(def.max);
+  const bandL = banded ? pos(def.min) : null, bandR = banded ? pos(def.max) : null;
   const valPos = has ? pos(value) : null;
 
   return (
```

2. **chemistry removed — the target band is drawn only where the keeper has a range, and its fill follows the engine's position rather than `paramStatus`**

```diff
@@ -377,10 +87,12 @@
         <div className="absolute rounded-full" style={{ left: 0, right: 0, top: compact ? 6 : 9, height: compact ? 4 : 5, background: "#E9EFEE" }} />
 
         {/* Target range — the only region that should read as "good" */}
-        <div className="absolute rounded-full"
-          style={{ left: `${bandL}%`, width: `${Math.max(2, bandR - bandL)}%`,
-                   top: compact ? 6 : 9, height: compact ? 4 : 5,
-                   background: has && status === "ok" ? color + "55" : "#C8D6D4" }} />
+        {banded && (
+          <div className="absolute rounded-full"
+            style={{ left: `${bandL}%`, width: `${Math.max(2, bandR - bandL)}%`,
+                     top: compact ? 6 : 9, height: compact ? 4 : 5,
+                     background: has && positionIsInRange(position) ? color + "55" : "#C8D6D4" }} />
+        )}
 
         {/* Where the parameter has been recently, so spread is visible at a glance */}
         {recent && recent.lo != null && recent.hi > recent.lo && (
```

3. **chemistry removed — the centred status word is the engine's position, looked up in the strings file, instead of V1's own "in band" / "below band" verdict**

```diff
@@ -399,11 +111,16 @@
       </div>
 
       <div className="flex items-center justify-between mt-0.5">
-        <span className="text-[9px] font-bold text-ink2 tabular-nums">{fmtVal(def, def.min)}</span>
-        <span className="text-[9px] font-extrabold uppercase tracking-wide" style={{ color: has ? color : "#5F7575" }}>
-          {has ? (status === "ok" ? "in band" : status === "low" ? "below band" : "above band") : "no data"}
+        <span className="text-[9px] font-bold text-ink2 tabular-nums">{banded ? fmtVal(def, def.min) : ""}</span>
+        {/* The word is the ENGINE's position, looked up in the strings file —
+            `IN RANGE`, `ABOVE RANGE`, `BELOW RANGE`. V1 said "in band" here
+            and worked the answer out itself. Where there is no position there
+            is no word, and the row still reads because the two range labels
+            hold its ends. */}
+        <span className="text-[9px] font-extrabold uppercase tracking-wide" style={{ color: word ? color : "#5F7575" }}>
+          {word || ""}
         </span>
-        <span className="text-[9px] font-bold text-ink2 tabular-nums">{fmtVal(def, def.max)}</span>
+        <span className="text-[9px] font-bold text-ink2 tabular-nums">{banded ? fmtVal(def, def.max) : ""}</span>
       </div>
     </div>
   );
```

4. **chemistry removed — `StatusPill` deleted; it rendered the same `paramStatus` vocabulary and every caller went with the surfaces that computed chemistry**

```diff
@@ -410,27 +127,23 @@
 }
 
 
-export function StatusPill({ status }) {
-  const map = {
-    ok: { label: "In range", cls: "bg-teal-50 text-teal-800 border-teal-200" },
-    low: { label: "Low", cls: "bg-amber-50 text-amber-800 border-amber-300" },
-    high: { label: "High", cls: "bg-rose-50 text-rose-800 border-rose-300" },
-    unknown: { label: "No data", cls: "bg-slate-100 text-slate-600 border-slate-200" },
-  };
-  const m = map[status];
-  return <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${m.cls}`}>{m.label}</span>;
-}
+/* V1's `StatusPill` stood here: a pill reading "In range" / "Low" / "High"
+   from the same `paramStatus` vocabulary `ParamGauge` used. Its callers all
+   went with the surfaces that computed chemistry, and a pill that renders a
+   classification nothing produces is not worth carrying. */
 
 
-/* What moved a task off its normal rhythm. "Pinned" on its own left you unable
-   to tell an app-scheduled check from a date you chose yourself. */
-export function pinReasonLabel(reason) {
-  return reason === "dose" ? "to check the new dose"
-    : reason === "correction" ? "to check the correction"
-    : reason === "skipped" ? "skipped once"
-    : "moved by you";
-}
+/* V1's `pinReasonLabel` stood here. It named why a task had been moved off its
+   rhythm — "to check the new dose", "to check the correction" — and it went
+   with the mechanism it labelled.
 
+   That mechanism was `dueOverride`/`dueReason` in V1's `reminders.js`: after a
+   dose change, V1's own protocol pinned the next test to a day it chose. In V2
+   the retest date is the ENGINE's, produced by the Retest Scheduler, and
+   `app/src/store/schedule.js` says so where it declines to port the wiring.
+   A label in the interface asserting why a test is due would be the interface
+   claiming an inference it does not make. */
+
 export function ReminderRow({ rem, state, onComplete, onReschedule, completeLabel = "Mark done" }) {
   /* This row used to expand into its own editor — interval, start date, nudge
      buttons — which was a second, older way of changing a schedule than the
```

5. **chemistry removed — `pinReasonLabel` and its use deleted; it named why V1's own protocol had pinned a retest date, and in V2 the retest date is the engine's**

```diff
@@ -454,7 +167,6 @@
           <div className="text-[11px] font-bold" style={{ color: tone }}>
             {off ? "turned off"
               : `${intervalLabel(rem.intervalDays)}${state ? ` · ${due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? "due today" : `next ${fmtShort(state.due)}`}` : ""}`}
-            {state && state.pinned ? ` · ${pinReasonLabel(state.pinReason)}` : ""}
           </div>
         </button>
         {!off && state && due <= 0 && (
```

6. **chemistry removed — the second use of the same pin label, in the reschedule sheet's header**

```diff
@@ -526,8 +238,6 @@
           <div className="text-[15px] font-black text-ink">{rem.label}</div>
           <div className="text-[12px] font-bold mt-0.5" style={{ color: tone }}>
             {!rem.enabled ? "Turned off — no reminders until you turn it back on"
-              : state && state.pinned
-              ? `Moved to ${fmtFriendly(state.due)} — ${pinReasonLabel(state.pinReason)}`
               : late ? `${Math.abs(daysOut)} day${Math.abs(daysOut) === 1 ? "" : "s"} overdue · was due ${fmtFriendly(state.due)}`
               : daysOut === 0 ? "Due today"
               : `Due ${fmtFriendly(state.due)}`}
```

7. **data source rewired — the calendar can take a completion back off the record, through V2's task store; owner decision 32 makes anything the keeper recorded deletable, and finding 16 names the calendar as one of the places he goes looking for it**

```diff
@@ -626,11 +336,15 @@
   );
 }
 
-export function CompletionCalendar({ taskLog, reminders, waterChanges, onPickTask = null }) {
+export function CompletionCalendar({ taskLog, reminders, waterChanges, onPickTask = null,
+  onDeleteDone = null }) {
   const [monthOffset, setMonthOffset] = useState(0);
   const [picked, setPicked] = useState(null);
 
-  const now = new Date();
+  /* The month the calendar opens on follows the APPLICATION's clock, so test
+     mode's chosen instant moves it too. V1 read `new Date()`; V2 has one clock
+     and `TM-23` finds every module that reaches past it. */
+  const now = appNow();
   const cursor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
   const year = cursor.getFullYear(), month = cursor.getMonth();
   const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
```

8. **data source rewired — the calendar can take a completion back off the record, through V2's task store; owner decision 32 makes anything the keeper recorded deletable, and finding 16 names the calendar as one of the places he goes looking for it**

```diff
@@ -647,7 +361,7 @@
     for (const l of taskLog || []) {
       if (!l.date) continue;
       (map[l.date] = map[l.date] || []).push({
-        id: l.id, label: labelFor(l.taskId), taskId: l.taskId, auto: !!l.auto, done: true,
+        id: l.id, label: labelFor(l.taskId), taskId: l.taskId, date: l.date, auto: !!l.auto, done: true,
       });
     }
     for (const w of waterChanges || []) {
```

9. **data source rewired — the calendar can take a completion back off the record, through V2's task store; owner decision 32 makes anything the keeper recorded deletable, and finding 16 names the calendar as one of the places he goes looking for it**

```diff
@@ -756,11 +470,15 @@
           ) : (
             <div className="space-y-1">
               {(byDay[picked] || []).map((it) => (
-                <div key={it.id} className="flex items-center gap-2">
+                <div key={it.id} className="flex flex-wrap items-center gap-2">
                   <Check size={13} style={{ color: "#0B7C86" }} className="shrink-0" />
                   <span className="text-[13px] font-bold text-ink">{it.label}</span>
                   {it.detail && <span className="text-[12px] font-bold text-ink2">· {it.detail}</span>}
                   {it.auto && <span className="text-[10px] font-bold text-ink2">· from a logged test</span>}
+                  <span className="flex-1" />
+                  {onDeleteDone && (
+                    <DeleteControl size={13} onDelete={() => onDeleteDone(it)} />
+                  )}
                 </div>
               ))}
               {/* Scheduled items are tappable: seeing a task on a day you
```

10. **data source rewired — the calendar can take a completion back off the record, through V2's task store; owner decision 32 makes anything the keeper recorded deletable, and finding 16 names the calendar as one of the places he goes looking for it**

```diff
@@ -803,7 +521,8 @@
 
 /* The calendar as an overlay, so it can be reached from the dashboard without
    losing your place. */
-export function CalendarModal({ taskLog, reminders, waterChanges, onClose, onPickTask = null }) {
+export function CalendarModal({ taskLog, reminders, waterChanges, onClose, onPickTask = null,
+  onDeleteDone = null }) {
   useEscape(onClose);
   return (
     <div className="fixed inset-0 bg-[#08191D]/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
```

11. **data source rewired — the calendar can take a completion back off the record, through V2's task store; owner decision 32 makes anything the keeper recorded deletable, and finding 16 names the calendar as one of the places he goes looking for it**

```diff
@@ -821,7 +540,7 @@
         </div>
         <div className="px-4 pb-4">
           <CompletionCalendar taskLog={taskLog} reminders={reminders} waterChanges={waterChanges}
-            onPickTask={onPickTask} />
+            onPickTask={onPickTask} onDeleteDone={onDeleteDone} />
         </div>
       </div>
     </div>
```

### `app/src/components/ZoomableChart.jsx`

| | |
|---|---|
| V1 source | `src/components/ZoomableChart.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `263b8560aedea7eb30023c660339d57054ecee1212800425c1f7212a888e9a20` |
| V1 blob | `bdf2efcbadc8d004d41b4a28d7d683bb885ec9c4` |
| Ported SHA-256 | `ddd1eb7e1c9005499e4929024aa9e66e3bf3fa5b22d26984a34e2c20c11f79cd` |
| Differences | 7 |

1. **defect fixed — the chart never received or displayed a unit or a parameter name at any of V1's four call sites; both are now required parameters**

```diff
@@ -2,6 +2,8 @@
 import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
 import { RotateCcw } from '../icons.jsx'
 import { daysBetween } from '../lib/dates.js'
+import { groupWordKey } from '../present/episodes.js'
+import { t } from '../strings.js'
 
 /* ---------------------------------- zoomable / pannable chart ---------------------------------- */
 
```

2. **defect fixed — the same defect: the tooltip states the unit and the parameter name alongside the value**

```diff
@@ -66,7 +68,117 @@
   return { domain: [clean(lo), clean(hi)], ticks, format, formatValue, step, decimals };
 }
 
-export function ZoomableLineChart({ data, color, targetRangeMin, targetRangeMax, height = 280, events = [] }) {
+/* ONE V1 DEFECT, FIXED ON THE WAY ACROSS.
+
+   The salvage inventory records it: this component "never received or
+   displayed a unit or a parameter name at any call site". Four call sites, no
+   unit anywhere, so a tooltip read `8.72` and an axis read `450` with nothing
+   on screen saying of what, in what.
+
+   `unit` and `paramName` are therefore REQUIRED, and the component refuses to
+   render without them rather than falling back to a blank. A default would
+   have reproduced the defect at any call site that forgot — which is how it
+   survived four of them in V1. `unit` may be an empty string, because pH
+   genuinely has no unit; it may not be absent. */
+/* ============================================================================
+   A TEST RUN MORE THAN ONCE, DRAWN AS ONE TEST
+   ----------------------------------------------------------------------------
+   Six readings typed inside a minute used to draw six points spread along the
+   axis, which told the keeper he had tested six times over an hour. He tested
+   once, six times over, and the chart said something that did not happen.
+
+   So a group occupies ONE x-position — the instant the engine resolved it to —
+   and its measurements are stacked vertically there. They are drawn small and
+   quiet because they are not the answer; the resolved value is drawn as a ring
+   against them because it is, and the trend line passes through it alone.
+
+   HOW THE STACK IS PLACED. Each measurement slot is its own `Line` with no
+   stroke, so recharts positions every dot through the same two axes the trace
+   uses. Reading the chart's internal scales and doing the pixel arithmetic here
+   would be a second implementation of "where does this value sit", and it would
+   be the one that drifted the day a margin changed.
+
+   A test run once is a stack of one and takes exactly this shape, so there is
+   one kind of point on the chart rather than two.
+   ========================================================================= */
+
+/* How many measurements the busiest visible group holds. */
+function maxMembers(rows) {
+  let n = 1;
+  for (const r of rows) {
+    const c = r && Array.isArray(r.members) ? r.members.length : 1;
+    if (c > n) n = c;
+  }
+  return n;
+}
+
+/* One measurement in a stack. Small, low-contrast, and never connected to
+   anything — a line through the members would be a trend nobody claimed. */
+function MemberDot({ cx, cy, payload, fill }) {
+  if (cx == null || cy == null) return null;
+  if (!payload || !payload.grouped) return null;
+  return <circle cx={cx} cy={cy} r={2.6} fill={fill} fillOpacity={0.45} stroke="none" />;
+}
+
+/* The value the engine used. A ring where the test was run more than once, so
+   it is unmistakable against the members stacked behind it; an ordinary dot
+   where there is only one measurement and nothing to distinguish it from. */
+function ResolvedDot({ cx, cy, payload, stroke, showPlainDots }) {
+  if (cx == null || cy == null) return null;
+  if (payload && payload.grouped) {
+    return (
+      <g>
+        <circle cx={cx} cy={cy} r={5.5} fill="#fff" stroke={stroke} strokeWidth={2.5} />
+        <circle cx={cx} cy={cy} r={1.8} fill={stroke} />
+      </g>
+    );
+  }
+  if (!showPlainDots) return null;
+  return <circle cx={cx} cy={cy} r={3} fill={stroke} stroke="none" />;
+}
+
+/* What a group says when it is tapped. Names how many measurements it holds
+   and which figure was used, because those are the two things a keeper looking
+   at a stack of dots wants to know. */
+function GroupTooltip({ active, payload, paramName, unit, formatValue }) {
+  if (!active || !payload || !payload.length) return null;
+  const row = payload[0].payload;
+  if (!row) return null;
+  const box = {
+    background: "#fff", border: "1px solid #DCE7E5", borderRadius: 10,
+    padding: "8px 10px", maxWidth: 236,
+  };
+  if (!row.grouped) {
+    return (
+      <div style={box}>
+        <div className="text-[12px] font-extrabold text-ink">
+          {formatValue(row.value)}{unit ? ` ${unit}` : ""}
+        </div>
+        <div className="text-[11px] font-bold text-ink2">{paramName} · {row.label}</div>
+      </div>
+    );
+  }
+  const key = groupWordKey(row.count);
+  return (
+    <div style={box}>
+      <div className="text-[12px] font-extrabold text-ink leading-snug">
+        {t(`group.${key}`, { count: row.count, value: formatValue(row.value), unit })}
+      </div>
+      <div className="text-[11px] font-bold text-ink2 mt-1 leading-snug">
+        {t("group.median")}
+      </div>
+      {row.spread != null && row.spread > 0 && (
+        <div className="text-[11px] font-bold mt-1 leading-snug"
+          style={{ color: row.anomalous ? "#A2621B" : "#45605F" }}>
+          {t(row.anomalous ? "group.wideSpread" : "group.spread",
+            { spread: formatValue(row.spread), unit })}
+        </div>
+      )}
+    </div>
+  );
+}
+
+export function ZoomableLineChart({ data, color, paramName, unit, targetRangeMin, targetRangeMax, height = 280, events = [] }) {
   const containerRef = useRef(null);
   const [range, setRange] = useState({ start: 0, end: 1 });
   const gestureRef = useRef(null);
```

3. **defect fixed — the same defect: the refusal is computed after the hooks so the hook order cannot change between renders**

```diff
@@ -158,6 +270,11 @@
     };
   }, [range]);
 
+  /* Refused after the hooks, never before one: bailing out above `useState`
+     and `useEffect` would change the hook order between renders, which React
+     treats as a fault of its own. */
+  const described = typeof paramName === "string" && paramName.length > 0 && typeof unit === "string";
+
   const startIdx = total > 0 ? Math.max(0, Math.floor(range.start * (total - 1))) : 0;
   const endIdx = total > 0 ? Math.min(total - 1, Math.ceil(range.end * (total - 1))) : 0;
   const visible = total > 0 ? data.slice(startIdx, endIdx + 1) : [];
```

4. **defect fixed — owner findings 28 and 29: V1's chart plotted every raw measurement as its own point spread along the axis, so a repeat test read as several tests over an hour. A test is now one x-position with its measurements stacked on it and the engine's resolved value ringed against them.**

```diff
@@ -174,6 +291,13 @@
 
   /* Snap each event to the nearest visible reading so the marker lands on a
      real x-axis category, then drop any that fall outside the zoom window. */
+  /* One slot per measurement position, so the busiest visible group has a
+     line to draw every one of its members through. */
+  const memberSlots = useMemo(() => {
+    const n = maxMembers(visible);
+    return Array.from({ length: n }, (_, i) => i);
+  }, [visible]);
+
   const visibleEvents = useMemo(() => {
     if (!events.length || !visible.length) return [];
     const out = [];
```

5. **defect fixed — the same defect: it refuses to render rather than drawing an unlabelled trace, and draws the parameter's name and unit above the plot**

```diff
@@ -189,11 +313,47 @@
         if (!seen.has(k)) { seen.add(k); out.push({ ...ev, label: best.label }); }
       }
     }
-    return out.slice(0, 25);
+
+    /* ROUND THREE, ITEM 6 — MARKER DENSITY.
+
+       Every water change in the imported history drew its own dashed vertical
+       line. On a 7-day view that is one or two and they are useful; on the
+       90-day view it was roughly twenty, and twenty dashed lines across a
+       chart obscure the trace they are annotating. The markers stopped being
+       annotation and became the picture.
+
+       So they thin as the window widens. The rule is a budget rather than a
+       cutoff date: a chart gets about one marker per eight visible readings,
+       never fewer than four and never more than twelve, and when there are
+       more than the budget the ones kept are spread evenly across the window
+       rather than taken from one end — a chart that drew every marker in
+       February and none in August would misrepresent the history worse than
+       drawing none at all.
+
+       Nothing is hidden that the keeper cannot reach: the full list is his
+       history, and this is one chart's annotation layer. */
+    const budget = Math.max(4, Math.min(12, Math.round(visible.length / 8)));
+    if (out.length <= budget) return out;
+    const step = out.length / budget;
+    const thinned = [];
+    for (let i = 0; i < budget; i += 1) thinned.push(out[Math.floor(i * step)]);
+    return thinned;
   }, [events, visible]);
 
+  if (!described) {
+    return (
+      <div className="rounded-xl border-2 border-dashed border-app p-4 text-[12px] font-bold text-ink2">
+        This chart was asked to draw a trace without saying what it is or what
+        it is measured in, so it has not drawn one.
+      </div>
+    );
+  }
+
   return (
     <div>
+      <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">
+        {paramName}{unit ? ` \u00b7 ${unit}` : ""}
+      </div>
       <div ref={containerRef} style={{ height, touchAction: "none" }} className="select-none">
         <ResponsiveContainer width="100%" height="100%">
           <LineChart data={visible} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
```

6. **defect fixed — owner findings 28 and 29: V1's chart plotted every raw measurement as its own point spread along the axis, so a repeat test read as several tests over an hour. A test is now one x-position with its measurements stacked on it and the engine's resolved value ringed against them.**

```diff
@@ -205,9 +365,22 @@
               <ReferenceLine key={i} x={ev.label} stroke={ev.color} strokeDasharray="4 3" strokeWidth={1.5}
                 label={{ value: ev.icon, position: "top", fontSize: 11, fill: ev.color }} />
             ))}
-            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #DCE7E5", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#08191D" }}
-              formatter={(v) => axis.formatValue(v)} />
-            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.75} dot={visible.length < 50} activeDot={{ r: 5 }} />
+            <Tooltip cursor={{ stroke: "#C7D6D3", strokeWidth: 1 }}
+              content={<GroupTooltip paramName={paramName} unit={unit} formatValue={axis.formatValue} />} />
+            {/* The measurements, stacked at their group's position and drawn
+                first so the trace and its resolved value sit over them. */}
+            {memberSlots.map((i) => (
+              <Line key={`m${i}`} type="linear" isAnimationActive={false} legendType="none"
+                dataKey={(row) => (row && row.grouped && row.members && row.members[i]
+                  ? row.members[i].value : null)}
+                stroke="none" connectNulls={false} activeDot={false}
+                dot={<MemberDot fill={color} />} />
+            ))}
+            {/* The trend runs through the resolved value and nothing else. */}
+            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.75}
+              isAnimationActive={false}
+              dot={<ResolvedDot stroke={color} showPlainDots={visible.length < 50} />}
+              activeDot={{ r: 5 }} />
           </LineChart>
         </ResponsiveContainer>
       </div>
```

7. **defect fixed — owner findings 28 and 29: V1's chart plotted every raw measurement as its own point spread along the axis, so a repeat test read as several tests over an hour. A test is now one x-position with its measurements stacked on it and the engine's resolved value ringed against them.**

```diff
@@ -223,9 +396,26 @@
           kinds.push({ kind: ev.kind, color: ev.color, icon: ev.icon });
         }
         const hasBand = targetRangeMin != null && targetRangeMax != null;
-        if (!kinds.length && !hasBand) return null;
+        /* Only where a repeat test is actually on screen. A legend explaining
+           stacked measurements on a chart that has none is noise. */
+        const hasGroup = visible.some((d) => d && d.grouped);
+        if (!kinds.length && !hasBand && !hasGroup) return null;
         return (
           <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
+            {hasGroup && (
+              <>
+                <span className="flex items-center gap-1.5">
+                  <span className="inline-block rounded-full" aria-hidden="true"
+                    style={{ width: 6, height: 6, background: color, opacity: 0.45 }} />
+                  <span className="text-[10px] font-bold text-ink2">{t("group.legend.measurement")}</span>
+                </span>
+                <span className="flex items-center gap-1.5">
+                  <span className="inline-block rounded-full" aria-hidden="true"
+                    style={{ width: 10, height: 10, background: "#fff", border: `2.5px solid ${color}` }} />
+                  <span className="text-[10px] font-bold text-ink2">{t("group.legend.used")}</span>
+                </span>
+              </>
+            )}
             {hasBand && (
               <span className="flex items-center gap-1.5">
                 <span className="inline-block w-4 h-2.5 rounded-sm" style={{ background: color, opacity: 0.18 }} />
```

### `app/src/components/ErrorBoundary.jsx`

| | |
|---|---|
| V1 source | `src/components/ErrorBoundary.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `4d4259628e2feedbff654fc0ea4b1c1a0fa0eb6568c98520bf55a88eda525a05` |
| V1 blob | `19d77209beca9712957016e539bb16070b330274` |
| Ported SHA-256 | `0af3aa11a7e0286513a2dd870ff70004328f2b127220237c6f003bde67376d87` |
| Differences | 2 |

1. **chemistry removed — imports of V1's safe-rate module and alkalinity dosing engine deleted with the block that used them**

```diff
@@ -1,13 +1,6 @@
 import React, { useEffect, useState } from 'react'
-import { DoseChangeSheet } from './DoseChangeSheet.jsx'
 import { Btn } from './DoseExpectation.jsx'
-import { AlertTriangle, Plus, RotateCcw, Save, Trash2 } from '../icons.jsx'
-import { SAFE_DAILY_RISE } from '../lib/analytics/safe-rate.js'
-import { fmtAmount, fmtVal } from '../lib/analytics/time-in-range.js'
-import { fmtTime } from '../lib/analytics/time-of-day.js'
-import { fmtFriendly } from '../lib/analytics/water-changes.js'
-import { fmtDate } from '../lib/dates.js'
-import { alkStamp } from '../lib/dosing/alkalinity.js'
+import { AlertTriangle, RotateCcw, Trash2 } from '../icons.jsx'
 import { notify } from '../lib/storage.js'
 
 /* --- Error boundary ---
```

2. **chemistry removed — `AlkAssessmentBlock` deleted: 264 lines rendering a dose figure, a staged step, a rate rail and a retest date computed inside a presentation component**

```diff
@@ -93,274 +86,16 @@
   );
 }
 
-/* Findings render identically wherever they appear — dashboard modal, insights
-   section, tasks — so the same conclusion always looks and reads the same. */
-/* One element's dose verdict: the number you'd act on, large and legible,
-   with the reasoning tucked behind a tap. Previously the recommendation was
-   buried mid-paragraph and you had to read to find it. */
-/* The full assessment, laid out in the order the protocol asks for: what was
-   measured, what it implies, and only then what to do about it. */
-export function AlkAssessmentBlock({ a, def, onApplyDose = null, onClearPlan = null, onLogCorrection = null, onApplyEffect = null }) {
-  const [sheetOpen, setSheetOpen] = useState(false);
-  /* Which figure the sheet opens on: the staged step, the full maintenance
-     dose, or whatever the person types over it. */
-  const [prefill, setPrefill] = useState(null);
-  if (!a) return null;
-  const tone = a.action === "implausible" ? "#C4285B"
-    : a.action === "increase" || a.action === "decrease" ? "#0B7C86" : "#45605F";
-  const Row = ({ k, v, strong }) => (
-    <div className="flex items-start justify-between gap-3 py-1 border-t border-app first:border-0">
-      <span className="text-[11px] font-bold text-ink2 shrink-0">{k}</span>
-      <span className={`text-[12px] text-right ${strong ? "font-black text-ink" : "font-bold text-ink"}`}>{v}</span>
-    </div>
-  );
-
-  const headline = a.action === "implausible" ? "Check your solution strength"
-    : a.action === "increase" ? `Increase to ${fmtAmount(a.recommendedDose)} mL/day`
-    : a.action === "decrease" ? `Reduce to ${fmtAmount(a.recommendedDose)} mL/day`
-    : `Hold at ${fmtAmount(a.currentDose)} mL/day`;
-
-  return (
-    <div>
-      {/* Where the staged correction stands, carried between sessions so a plan
-          begun on Monday is still a plan on Wednesday. */}
-      {a.activePlan && (
-        <div className="rounded-xl p-3 mb-3" style={{ background: "#0B7C860F", border: "1px solid #0B7C8633" }}>
-          <div className="flex items-center justify-between gap-2 mb-1">
-            <span className="text-[10px] font-extrabold uppercase tracking-wide" style={{ color: "#0B7C86" }}>
-              Correction in progress
-              {a.stages > 1 ? ` · step ${a.stage} of ${a.stages}` : ""}
-            </span>
-            {onClearPlan && (
-              <button onClick={onClearPlan} className="text-[10px] font-extrabold text-ink2">Cancel</button>
-            )}
-          </div>
-          <p className="text-[12px] text-ink font-medium leading-relaxed">
-            You set {fmtAmount(a.activePlan.appliedDose)} mL/day on {fmtDate(String(a.activePlan.appliedAt).slice(0, 10))}
-            {a.planTarget != null && Math.abs(a.planTarget - a.activePlan.appliedDose) > 0.05
-              ? `, heading for about ${fmtAmount(a.planTarget)} mL/day once this step is confirmed.`
-              : "."}
-          </p>
-          {a.nextTestDue && (
-            <p className="text-[12px] font-black mt-1" style={{ color: "#0B7C86" }}>
-              Test {def.label.toLowerCase()} {fmtFriendly(a.nextTestDue)}
-              {a.activePlan.nextTestTime ? ` around ${fmtTime(a.activePlan.nextTestTime)}` : ""} — it's on your reminders.
-            </p>
-          )}
-        </div>
-      )}
-
-      <div className="rounded-xl p-3 mb-3" style={{ background: tone + "12", border: `1px solid ${tone}33` }}>
-        <div className="text-[14px] font-black mb-1" style={{ color: tone }}>{headline}</div>
-        <p className="text-[12px] text-ink font-medium leading-relaxed">
-          {a.explanation || a.reason}
-        </p>
-        {a.rateLimited && (
-          <div className="mt-2.5 rounded-lg px-3 py-2" style={{ background: "#1D6FA514" }}>
-            <p className="text-[11px] font-medium leading-relaxed" style={{ color: "#1D6FA5" }}>
-              Held to {fmtAmount(a.rateLimited.allowed)} mL rather than {fmtAmount(a.rateLimited.wanted)} mL:
-              the larger figure would move {def.label.toLowerCase()} faster than {fmtAmount(a.rateLimited.perDay)}{a.rateLimited.unit} a
-              day, and the speed of a change stresses corals more than the level itself does. Getting
-              there will take about {a.rateLimited.days} more {a.rateLimited.days === 1 ? "day" : "days"} this way.
-            </p>
-          </div>
-        )}
-
-        {a.caution && (
-          <div className="mt-2.5 rounded-lg px-3 py-2" style={{ background: "#A2621B14" }}>
-            <p className="text-[11px] font-medium leading-relaxed" style={{ color: "#8A5A18" }}>
-              {a.caution}
-            </p>
-          </div>
-        )}
-
-        {a.staged && a.plan && a.plan.length > 0 && (
-          <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: tone + "33" }}>
-            <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1.5" style={{ color: tone }}>
-              The plan from here
-            </div>
-            {/* Each step waits 48 hours and a re-test. Showing them makes the
-                waiting part of the plan rather than something to remember. */}
-            <div className="space-y-1">
-              <div className="flex items-center gap-2">
-                <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black text-white"
-                  style={{ background: tone }}>1</span>
-                <span className="text-[12px] font-bold text-ink">
-                  Set {fmtAmount(a.plan[0])} mL/day now
-                </span>
-              </div>
-              {a.plan.slice(1).map((step, i) => (
-                <div key={i} className="flex items-center gap-2">
-                  <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black"
-                    style={{ background: tone + "22", color: tone }}>{i + 2}</span>
-                  <span className="text-[12px] font-bold text-ink2">
-                    after 48h and a re-test, {i + 2 === a.plan.length ? "settle around" : "move to"} {fmtAmount(step)} mL/day
-                  </span>
-                </div>
-              ))}
-            </div>
-            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-1.5">
-              Staging exists because the strength figure is an estimate — each step gets checked before the
-              next, so a wrong estimate is caught early rather than compounded. If you are confident in
-              your numbers, going straight to {fmtAmount(a.maintenanceDose)} mL/day is a {fmtAmount(Math.abs(a.maintenanceDose - a.currentDose))} mL
-              jump and gets there in one move.
-            </p>
-            <div className="grid grid-cols-2 gap-2 mt-2">
-              <Btn variant="ghost" onClick={() => { setPrefill(a.recommendedDose); setSheetOpen(true); }}>
-                Step to {fmtAmount(a.recommendedDose)}
-              </Btn>
-              <Btn variant="ghost" onClick={() => { setPrefill(Math.round(a.maintenanceDose * 10) / 10); setSheetOpen(true); }}>
-                Go to {fmtAmount(a.maintenanceDose)}
-              </Btn>
-            </div>
-          </div>
-        )}
-
-        {/* The correction the protocol asks for, logged rather than left to
-            memory — and split across days, since a large single addition moves
-            alkalinity faster than is safe. */}
-        {a.correction && onLogCorrection && (
-          <div className="mt-3 pt-3 border-t" style={{ borderColor: tone + "33" }}>
-            <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1" style={{ color: tone }}>
-              One-off correction
-            </div>
-            <p className="text-[12px] text-ink font-medium leading-relaxed mb-2">
-              Raise {def.label.toLowerCase()} by about {a.correction.ppmToRaise}{def.unit} in total,
-              spread over at least {a.correction.days} days — around {fmtAmount(a.correction.ppmPerDay)}{def.unit} a
-              day. At that pace it moves no faster than {fmtAmount(SAFE_DAILY_RISE[def.key])}{def.unit} a day, which is what
-              corals tolerate; the whole amount at once would be far quicker than that.
-              {a.correction.viaMaintenance
-                ? ` With your maintenance solution that is about ${fmtAmount(a.correction.oneOffMl)} mL in total.`
-                : ` That would take about ${fmtAmount(a.correction.oneOffMl)} mL of your maintenance solution, which is more liquid than makes sense — a stronger mix or the dry salt is the usual route, and the daily dose stays as it is.`}
-              {" "}Log it once added and the rise is treated as your doing rather than as the tank needing less.
-            </p>
-            <Btn variant="ghost" className="w-full"
-              onClick={() => onLogCorrection(Math.round(a.correction.oneOffMl * 10) / 10,
-                                             a.correction.direction)}>
-              <span className="flex items-center justify-center gap-1.5">
-                <Plus size={13} /> Log a {fmtAmount(a.correction.oneOffMl)} mL correction
-              </span>
-            </Btn>
-          </div>
-        )}
-
-        {onApplyDose && a.recommendedDose != null && a.action !== "implausible" && (
-          sheetOpen ? (
-            <DoseChangeSheet def={def} element={a.element || "alkalinity"}
-              current={a.currentDose} recommended={prefill != null ? prefill : a.recommendedDose}
-              suggested={a.recommendedDose} plan={a.plan}
-              onCancel={() => setSheetOpen(false)}
-              onSave={(ml, date, time) => {
-                setSheetOpen(false);
-                onApplyDose(ml, {
-                  date, time,
-                  target: a.staged ? Math.round(a.maintenanceDose * 10) / 10 : ml,
-                  stage: a.continuingPlan && a.stage ? a.stage + 1 : 1,
-                  stages: a.staged ? ((a.plan ? a.plan.length : 1) + (a.continuingPlan && a.stage ? a.stage : 0)) : 1,
-                  fromDose: a.currentDose,
-                  maintenanceDose: a.maintenanceDose, consumption: a.consumption,
-                  effectPerMl: a.effectPerMl, currentValue: a.current ? a.current.value : null,
-                  staged: a.staged,
-                });
-              }} />
-          ) : (
-            <Btn className="w-full mt-3" onClick={() => { setPrefill(null); setSheetOpen(true); }}>
-              <span className="flex items-center justify-center gap-1.5">
-                <Save size={13} /> {a.action === "hold"
-                  ? "Change the dose anyway"
-                  : `Set the dose${a.recommendedDose != null ? ` — suggested ${fmtAmount(a.recommendedDose)} mL/day` : ""}`}
-              </span>
-            </Btn>
-          )
-        )}
-      </div>
-
-      <div className="rounded-xl p-3" style={{ background: "#F7FAFA" }}>
-        <Row k={`Current ${def.label.toLowerCase()}`} v={`${fmtVal(def, a.current.value)}${def.unit}`} strong />
-        <Row k="Target range" v={`${fmtVal(def, a.targetRange.min)}–${fmtVal(def, a.targetRange.max)}${def.unit}`} />
-        <Row k="Current dose" v={`${fmtAmount(a.currentDose)} mL/day`} />
-        <Row k="Time on this dose"
-          v={a.hoursOnDose == null ? "unchanged throughout"
-            : a.hoursOnDose < 48 ? `${Math.round(a.hoursOnDose)} hours`
-            : `${(a.hoursOnDose / 24).toFixed(1)} days`} />
-        <Row k="Readings used" v={`${a.used.length} over ${fmtAmount(
-          a.used.length >= 2
-            ? (alkStamp(a.used[a.used.length - 1]) - alkStamp(a.used[0])) : 0)} days`} />
-        {a.trendPerDay != null && (
-          <Row k="Observed trend"
-            v={`${a.trendPerWeek != null
-              ? `${a.trendPerWeek > 0 ? "+" : ""}${fmtAmount(a.trendPerWeek)}${def.unit}/week`
-              : `${a.trendPerDay > 0 ? "+" : ""}${fmtAmount(a.trendPerDay)}${def.unit}/day`
-            }${a.consistent === true ? " · consistent" : a.consistent === false ? " · mixed" : ""}`} strong />
-        )}
-        {a.supplied != null && <Row k="Your dose supplies" v={`${fmtAmount(a.supplied)}${def.unit}/day`} />}
-        {a.consumption != null && (
-          <Row k={a.gaining ? "Tank is gaining" : "Tank is using"}
-            v={a.gaining
-              ? `${fmtAmount(a.gaining)}${def.unit}/day`
-              : `${fmtAmount(a.consumption)}${def.unit}/day`} strong />
-        )}
-        {a.maintenanceDose != null && (
-          <Row k="Calculated maintenance" v={`${fmtAmount(a.maintenanceDose)} mL/day`} />
-        )}
-        <Row k="Recommended next dose"
-          v={a.recommendedDose == null ? "hold and re-test" : `${fmtAmount(a.recommendedDose)} mL/day`} strong />
-      </div>
-
-      {/* How well the one number everything rests on is actually known. */}
-      {a.effectSolved && (
-        <div className="mt-2 rounded-lg p-2.5" style={{ background: "#F7FAFA" }}>
-          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">
-            Solution strength
-          </div>
-          {a.effectSolved.status === "ok" ? (
-            <>
-              <p className="text-[12px] text-ink font-medium leading-relaxed">
-                Your tank's response across {a.effectSolved.periods} dosing periods puts the real effect at
-                about {a.effectSolved.k.toFixed(4)} {def.unit} per mL, against the {a.effectPerMl.toFixed(4)} you have entered
-                {Math.abs(a.effectSolved.pctOff) >= 10
-                  ? ` — ${fmtAmount(Math.abs(a.effectSolved.pctOff))}% ${a.effectSolved.pctOff > 0 ? "stronger" : "weaker"} than assumed, which shifts every millilitre figure above by the same proportion.`
-                  : `, which agrees closely.`}
-              </p>
-              {onApplyEffect && Math.abs(a.effectSolved.pctOff) >= 10 && a.effectSolved.suggestedPer100L && (
-                <Btn variant="ghost" className="w-full mt-2"
-                  onClick={() => onApplyEffect(a.effectSolved.suggestedPer100L)}>
-                  <span className="flex items-center justify-center gap-1.5">
-                    <Save size={13} /> Use {a.effectSolved.suggestedPer100L} {def.unit}/mL/100L
-                  </span>
-                </Btn>
-              )}
-            </>
-          ) : (
-            <p className="text-[12px] text-ink2 font-medium leading-relaxed">
-              {a.effectSolved.status === "nochanges"
-                ? `Every figure here rests on ${a.effectPerMl.toFixed(4)} ${def.unit} per mL, taken from what you entered. Once you have changed the dose once and tested either side of it, the app can solve for the real value from how the tank responded.`
-                : `Solving for the real strength needs two settled dosing periods with a millilitre or more between them. ${a.effectSolved.periods || 0} so far.`}
-            </p>
-          )}
-        </div>
-      )}
-
-      {a.used.length > 0 && (
-        <div className="mt-2">
-          <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">
-            Measurements used
-          </div>
-          <div className="space-y-0.5">
-            {a.used.map((r, i) => (
-              <div key={i} className="flex items-center justify-between gap-2">
-                <span className="text-[11px] font-bold text-ink2">
-                  {fmtDate(r.date)}{fmtTime(r.time) ? ` · ${fmtTime(r.time)}` : ""}
-                </span>
-                <span className="text-[11px] font-black text-ink">{fmtVal(def, r.value)}{def.unit}</span>
-              </div>
-            ))}
-          </div>
-        </div>
-      )}
+/* V1's `AlkAssessmentBlock` stood here — 264 lines of it, and it is deleted
+   rather than ported.
 
+   It imported `SAFE_DAILY_RISE` from V1's safe-rate module and `alkStamp` from
+   V1's alkalinity dosing engine, and it rendered a dose figure, a staged step,
+   a rate rail and a retest date from them. Every one of those is chemistry
+   computed inside a presentation component, which is the single-source
+   violation canon `X-INV-004` forbids by name and which the salvage inventory
+   lists under "surfaces that compute chemistry — rebuild, do not port".
 
-      <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">{a.nextCheck}</p>
-    </div>
-  );
-}
+   Its replacement is not a rewrite of it. The Dosing tab renders what V2's
+   engine returned — the reason codes, the evidence, the arithmetic, what was
+   capped and why — through `app/src/present/`, and computes none of it. */
```

---

### `app/src/components/DoseExpectation.jsx`

| | |
|---|---|
| V1 source | `src/components/DoseExpectation.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `39533a35e49b923ad189b1705872acd899dd9ced1933a7ad9c14d52847b9d54a` |
| V1 blob | `fea31b39ea39c2ba4b61eb30afdaf9bccf82513d` |
| Ported SHA-256 | `9150018ee0c5ecb2eff1f935f2098cc4368701b617f1038acceb2d1419cc698f` |
| Differences | 12 |

1. **data source rewired — imports repointed from V1's analytics modules onto V2's formatting and the position presenter**

```diff
@@ -1,19 +1,34 @@
 import { useEffect, useState } from 'react'
 import { Card } from './ErrorBoundary.jsx'
 import { Activity, AlertTriangle, ArrowDown, ArrowUp, Beaker, Droplets, FlaskConical, Gauge, Plus, Scale, Target, Waves } from '../icons.jsx'
-import { fmtAmount, fmtVal } from '../lib/analytics/time-in-range.js'
-import { fmtTime } from '../lib/analytics/time-of-day.js'
-import { fmtFriendly } from '../lib/analytics/water-changes.js'
+import { fmtAmount, fmtVal, fmtTime, fmtFriendly } from '../lib/format.js'
 import { ParamGauge, useEscape } from '../lib/backup.jsx'
-import { STATUS_COLOR, fmtShort, paramStatus } from '../lib/dates.js'
-import { STABILITY_COLOR } from '../lib/stability-engine.js'
+import { fmtShort } from '../lib/dates.js'
+import { positionTone } from '../present/position.js'
+import { t } from '../strings.js'
 
-/* --- What to expect after a dose change ---
+/* --- The dose-change moment ---
  *
- * A dose change is a prediction as much as an action: it says the tank should
- * move a certain way over a certain time. Stating that up front means the next
- * test either confirms it or doesn't, rather than being read from scratch.
- */
+ * V1's words, and they are still the reason it exists: "A dose change is a
+ * prediction as much as an action: it says the tank should move a certain way
+ * over a certain time. Stating that up front means the next test either
+ * confirms it or doesn't, rather than being read from scratch."
+ *
+ * The component is V1's — the timing, the easing, the two-phase reveal, the
+ * closing countdown with its shrinking bar, the tap-to-keep-open. What it SAYS
+ * is not.
+ *
+ * V1 computed its own prediction: an expected value, a per-day movement and a
+ * retest date, worked out in the component from V1's alkalinity engine. In V2
+ * the prediction is an immutable engine artefact — the intervention prediction
+ * snapshot, canon `M-7` / `ALK-PREDICTION-SNAPSHOT-001` — and it is written
+ * onto the dose-change event, read back by the engine, and not available at
+ * the instant this moment appears. The retest date is the engine\'s too.
+ *
+ * So the moment states what was RECORDED, which the app does know: the change
+ * itself, and when it takes effect. What it no longer states is what the tank
+ * will do, and the reason is that nothing here is entitled to an opinion about
+ * that. Both omissions are in `docs/migration/PORT-OMISSIONS.md`. */
 export function DoseChangePopup({ result, onClose }) {
   useEscape(onClose);
   const AUTO = 14;
```

2. **wording replaced with engine output — the dose moment no longer destructures V1's own predicted value, per-day movement, retest date and staged target; in V2 the prediction is the engine's immutable snapshot and is not available at this instant**

```diff
@@ -36,7 +51,7 @@
   }, [result, left, held]);
 
   if (!result) return null;
-  const { def, from, to, date, time, testOn, expected, perDay, days, staged, target } = result;
+  const { def, from, to, date, time } = result;
   const up = to > from;
   const tone = "#0B7C86";
 
```

3. **wording replaced with engine output — the chart emoji replaced by the icon set's arrow; the brief rules out emojis**

```diff
@@ -48,7 +63,13 @@
         style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>
 
         <div className="px-5 pt-6 pb-5 text-center" style={{ background: tone + "12" }}>
-          <div style={{ fontSize: 40, lineHeight: 1 }}>{up ? "\u{1F4C8}" : "\u{1F4C9}"}</div>
+          {/* V1 put a chart emoji here, up or down. The brief for this port is
+              explicit: "No emojis. No green tick, no confetti, no stars. Keep
+              it professional." The arrow carries the direction and is part of
+              the icon set the rest of the app is drawn in. */}
+          <div className="flex items-center justify-center" style={{ color: tone }}>
+            {up ? <ArrowUp size={30} strokeWidth={2.6} /> : <ArrowDown size={30} strokeWidth={2.6} />}
+          </div>
           <div className="mt-3 flex items-baseline justify-center gap-1.5">
             <span className="text-[19px] font-black text-ink2 tabular-nums">{fmtAmount(from)}</span>
             <span className="text-[15px] font-bold text-ink2">{"\u2192"}</span>
```

4. **wording replaced with engine output — V1's predicted-value sentence and retest date replaced by a statement of what was recorded, which is what the app knows at that moment**

```diff
@@ -68,40 +89,31 @@
             <div className="text-center" style={{ animationDelay: "0ms" }}>
               <div className="text-[15px] font-black" style={{ color: tone }}>Recorded</div>
               <p className="text-[13px] text-ink font-medium leading-relaxed mt-1">
-                {expected != null
-                  ? `If this is right, ${def.label.toLowerCase()} should move about ${fmtAmount(Math.abs(perDay))}${def.unit} a day and read near ${fmtVal(def, expected)}${def.unit} when you next test.`
-                  : `The next test will show what this dose actually does.`}
+                The change is in your record from the date and time above. The next
+                assessment measures from that moment.
               </p>
             </div>
 
             <div className="mt-3 rounded-xl p-3" style={{ background: "#F7FAFA", animationDelay: "150ms" }}>
               <div className="flex items-center justify-between gap-2 py-1">
-                <span className="text-[11px] font-bold text-ink2">Test again</span>
-                <span className="text-[12px] font-black text-ink">{fmtFriendly(testOn)}</span>
+                <span className="text-[11px] font-bold text-ink2">Was</span>
+                <span className="text-[12px] font-black text-ink">{fmtAmount(from)} mL/day</span>
               </div>
               <div className="flex items-center justify-between gap-2 py-1 border-t border-app">
-                <span className="text-[11px] font-bold text-ink2">That's in</span>
-                <span className="text-[12px] font-black text-ink">{days} day{days === 1 ? "" : "s"}</span>
+                <span className="text-[11px] font-bold text-ink2">Now</span>
+                <span className="text-[12px] font-black" style={{ color: tone }}>{fmtAmount(to)} mL/day</span>
               </div>
-              {expected != null && (
-                <div className="flex items-center justify-between gap-2 py-1 border-t border-app">
-                  <span className="text-[11px] font-bold text-ink2">Expect around</span>
-                  <span className="text-[12px] font-black" style={{ color: tone }}>
-                    {fmtVal(def, expected)}{def.unit}
-                  </span>
-                </div>
-              )}
-              {staged && target != null && (
-                <div className="flex items-center justify-between gap-2 py-1 border-t border-app">
-                  <span className="text-[11px] font-bold text-ink2">Heading for</span>
-                  <span className="text-[12px] font-black text-ink">{fmtAmount(target)} mL/day</span>
-                </div>
-              )}
+              <div className="flex items-center justify-between gap-2 py-1 border-t border-app">
+                <span className="text-[11px] font-bold text-ink2">Effective from</span>
+                <span className="text-[12px] font-black text-ink">
+                  {fmtFriendly(date)}{fmtTime(time) ? ` at ${fmtTime(time)}` : ""}
+                </span>
+              </div>
             </div>
 
             <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2" style={{ animationDelay: "300ms" }}>
-              It's on your reminders, so it'll appear when it's due. Don't change the dose again before
-              then — the reading is only meaningful if this dose has run undisturbed.
+              Don\'t change the dose again before the next test — the reading is only
+              meaningful if this dose has run undisturbed.
             </p>
 
             <button onClick={onClose}
```

5. **defect fixed — an apostrophe escaped so the string parses after the surrounding template was rewritten**

```diff
@@ -111,11 +123,12 @@
             </button>
             <div className="mt-2 text-center" style={{ animationDelay: "560ms" }}>
               <span className="text-[10px] font-bold text-ink2">
-                {held ? "Staying open — tap Done when you're finished" : `Closes in ${left}s · tap to keep open`}
+                {held ? "Staying open — tap Done when you\'re finished" : `Closes in ${left}s · tap to keep open`}
               </span>
             </div>
           </div>
         )}
+
       </div>
     </div>
   );
```

6. **wording replaced with engine output — a notice's identity and signature are keyed on the engine's reason code and its payload instead of V1's own finding id and title**

```diff
@@ -125,22 +138,29 @@
    the wizard renders AlkAssessmentBlock directly, so nothing referenced it any
    more — an old screen kept alive only by being defined. */
 
-/* A function declaration rather than a const arrow: buildBriefing calls this
-   and is defined earlier in the file, so it has to hoist. */
-/* The stable identity of a finding, used by every surface that can dismiss
-   one. Previously the parameter modal and Insights keyed on id+title while the
-   summary keyed on id alone, so the same finding had two identities and
-   dismissing it in one place left it showing in the other. */
+/* THE STABLE IDENTITY OF A NOTICE.
+
+   V1 called these findings and computed them itself. In V2 a notice IS a
+   reason code the engine emitted, with the payload the engine attached; the
+   interface neither raises one nor decides what it means.
+
+   The identity mechanism is V1\'s and it was right: keying on the id alone let
+   the same claim be dismissed in one place and stay visible in another,
+   because two surfaces had built two different keys for it. One key, built
+   here, used everywhere.
+
+   The SIGNATURE is what has to still hold for a dismissal to stay in force.
+   V1 folded the reading into it for urgent findings, "so a worse number brings
+   it straight back". The same rule applies, over the engine\'s own payload:
+   put a blocking notice away and it returns the moment the engine emits it
+   with different numbers. */
 export function findingKey(f) {
   return "finding|" + f.id;
 }
 
-/* What has to hold for that dismissal to stay in force. The title carries the
-   severity wording and, for urgent findings, the reading itself — so a worse
-   number brings it straight back. */
 export function findingSignature(f) {
-  return f.severity === "act" && f.value != null
-    ? `${f.id}|${f.title}|${f.value}`
+  return f.severity === "REFUSAL" || f.severity === "GATING"
+    ? `${f.id}|${f.title}|${JSON.stringify(f.payload || {})}`
     : `${f.id}|${f.title}`;
 }
 
```

7. **wording replaced with engine output — the tone table keys on the frozen catalogue's severity (`REFUSAL` / `GATING` / `INFO`) instead of V1's own `act` / `watch` / `info`**

```diff
@@ -155,7 +175,12 @@
 
 export function FindingList({ items, compact = false, onDismiss = null }) {
   if (!items || !items.length) return null;
-  const tone = (sev) => (sev === "act" ? "#C4285B" : sev === "watch" ? "#A2621B" : "#45605F");
+  /* V1\'s three tones, against the contract\'s three severities. The severity is
+     stamped on the code by the frozen catalogue (`adapter.py` reads it), so
+     this is a lookup of something the engine decided and not a judgement made
+     here. An unrecognised severity gets the quiet tone rather than the loud
+     one — a value the catalogue adds later must not arrive shouting. */
+  const tone = (sev) => (sev === "REFUSAL" ? "#C4285B" : sev === "GATING" ? "#A2621B" : "#45605F");
   return (
     <div className={compact ? "space-y-1.5" : "space-y-2"}>
       {items.map((f) => (
```

8. **data source rewired — the icon table is keyed by the ledger's parameter keys instead of V1's own spellings, and has no ammonia row because this build has no ammonia parameter**

```diff
@@ -186,10 +211,14 @@
 /* An icon per parameter, so a card is recognisable before it is read. Reusing
    the icon set already imported keeps the weight and stroke consistent with
    the rest of the app. */
+/* Keyed by the parameter keys `app/src/store/ledger.js` declares, which are
+   the contract\'s. V1\'s keys were its own spellings — `alkalinity`, `ph` — and
+   there is no ammonia row because this build has no ammonia parameter: the
+   keeper\'s record contains none, and the ledger carries no parameter nobody
+   measures. */
 export const PARAM_ICON = {
-  alkalinity: Waves, salinity: Droplets, calcium: Scale, magnesium: Gauge,
-  potassium: Target, phosphate: Beaker, nitrate: FlaskConical,
-  ammonia: AlertTriangle, ph: Activity,
+  ALK: Waves, SAL: Droplets, CA: Scale, MG: Gauge,
+  K: Target, PO4: Beaker, NO3: FlaskConical, PH: Activity,
 };
 
 /* A short trace of where the parameter has been. It replaces a second bar with
```

9. **chemistry removed — the sparkline's band is drawn only where the keeper has a range, because this build ships no range it cannot source**

```diff
@@ -198,17 +227,25 @@
   if (!rows || rows.length < 3) return <div style={{ height: 20 }} />;
   const W = 100, H = 20, P = 2;
   const vals = rows.map((r) => r.value);
-  const lo = Math.min(...vals, def.min), hi = Math.max(...vals, def.max);
+  /* The keeper\'s range is drawn where he has one and simply is not where he
+     does not. V1 could assume both bounds existed because it shipped a range
+     for every parameter; those ranges were band edges and did not come across,
+     so the absence is now the ordinary case rather than an error. */
+  const banded = Number.isFinite(def.min) && Number.isFinite(def.max);
+  const lo = banded ? Math.min(...vals, def.min) : Math.min(...vals);
+  const hi = banded ? Math.max(...vals, def.max) : Math.max(...vals);
   const span = (hi - lo) || 1;
   const x = (i) => (i / (rows.length - 1)) * W;
   const y = (v) => H - P - ((v - lo) / span) * (H - P * 2);
   const d = rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(r.value).toFixed(1)}`).join(" ");
-  const bandTop = y(def.max), bandBot = y(def.min);
+  const bandTop = banded ? y(def.max) : null, bandBot = banded ? y(def.min) : null;
   const last = [x(rows.length - 1), y(rows[rows.length - 1].value)];
   return (
     <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height: 20 }}>
-      <rect x="0" y={Math.min(bandTop, bandBot)} width={W}
-        height={Math.max(1, Math.abs(bandBot - bandTop))} fill={colour} opacity="0.10" />
+      {banded && (
+        <rect x="0" y={Math.min(bandTop, bandBot)} width={W}
+          height={Math.max(1, Math.abs(bandBot - bandTop))} fill={colour} opacity="0.10" />
+      )}
       <path d={d} fill="none" stroke={colour} strokeWidth="1.6" strokeLinecap="round"
         strokeLinejoin="round" opacity="0.75" vectorEffect="non-scaling-stroke" />
       <circle cx={last[0]} cy={last[1]} r="2" fill={colour} vectorEffect="non-scaling-stroke" />
```

10. **chemistry removed — `ParamCard` no longer computes position, direction or a stability grade; all four are props decided by the engine, and the noise-floor comparison behind V1's trend arrow is deleted**

```diff
@@ -216,18 +253,49 @@
   );
 }
 
-export function ParamCard({ def, reading, recent, stab, findings, rows, onOpen, onLog = null, dose = null }) {
-  const status = reading ? paramStatus(def, reading.value) : "unknown";
-  const tone = STATUS_COLOR[status] || "#45605F";
+/* THE PARAMETER CARD.
+
+   The layout is V1\'s, unchanged: a tinted header strip in the parameter\'s own
+   colour with its icon, its name, a trend arrow and a `+` to log; the reading,
+   large, with its unit; the range bar; the sparkline; the status line with the
+   reading\'s date on the right; and a tinted strip when there is something to
+   say.
+
+   What changed is where the words come from. V1 worked out the position, the
+   direction and the stability grade inside this component. Every one of those
+   is now a PROP:
+
+     position    the engine\'s `EngineResult.position`, or null
+     statusLine  the sentence the engine\'s answer produced, through
+                 `app/src/present/`
+     direction   the engine\'s trajectory — "RISING", "FALLING" — or null
+     notice      one engine notice, already selected and worded
+
+   All four are null for every parameter this build does not assess, and the
+   card is written to read properly with all four missing: reading, unit, range
+   bar, trace, date. That is not a degraded state to be apologised for, it is
+   what the app honestly knows about calcium.
+
+   THE TREND ARROW, AND WHY IT IS NOT COMPUTED HERE
+
+   V1 subtracted the previous reading from the latest and drew an arrow when
+   the difference cleared `def.step`. That is a noise floor — a number that
+   decides whether movement counts — and a noise floor is chemistry: it comes
+   from the canon and from nowhere else. So the arrow follows the engine\'s
+   trajectory where there is one, and there is no arrow anywhere else.
+   Recorded in `docs/migration/PORT-OMISSIONS.md`. */
+export function ParamCard({ def, reading, recent, position = null, statusLine = null,
+  direction = null, notice = null, rows, onOpen, onLog = null, observation = null }) {
+  /* The number and the words describe the same test. `observation` is the one
+     owner of "the current value" (`present/episodes.js`); `reading` is kept
+     only for the callers that have not been given one yet. */
+  const shown = observation || (reading
+    ? { value: reading.value, date: reading.date, count: 1, resolved: false }
+    : null);
+  const tone = positionTone(position);
   const Icon = PARAM_ICON[def.key] || Beaker;
-  const notes = findings || [];
-  const worst = notes[0];
 
-  /* Direction since the previous reading, shown as a glyph rather than a
-     sentence — enough to tell a rising tank from a falling one at a glance. */
-  const prev = rows && rows.length >= 2 ? rows[rows.length - 2].value : null;
-  const delta = reading && prev != null ? reading.value - prev : null;
-  const moved = delta != null && Math.abs(delta) >= (def.step || 0.01);
+  const moved = direction === "RISING" || direction === "FALLING";
 
   return (
     <div className="relative h-full">
```

11. **chemistry removed — the trend arrow follows the engine's trajectory instead of a delta compared against `def.step`**

```diff
@@ -248,7 +316,7 @@
           </span>
           {moved && (
             <span className="shrink-0" style={{ color: tone, opacity: 0.8 }}>
-              {delta > 0 ? <ArrowUp size={11} strokeWidth={3} /> : <ArrowDown size={11} strokeWidth={3} />}
+              {direction === "RISING" ? <ArrowUp size={11} strokeWidth={3} /> : <ArrowDown size={11} strokeWidth={3} />}
             </span>
           )}
           {/* Sits in the header row rather than floating over the card, so it
```

12. **chemistry removed — the range bar receives the engine's position, and the status line is the engine's sentence instead of V1's stability label**

```diff
@@ -268,44 +336,49 @@
         <div className="px-3 pt-2 pb-2.5 flex flex-col gap-1.5 flex-1">
           <div className="flex items-baseline gap-1">
             <span className="font-black text-[24px] leading-none tabular-nums" style={{ color: tone }}>
-              {reading ? fmtVal(def, reading.value) : "\u2014"}
+              {shown ? fmtVal(def, shown.value) : "\u2014"}
             </span>
             <span className="text-[10px] font-bold text-ink2">{def.unit}</span>
+            {/* A test run more than once says so, because otherwise the figure
+                shown is not one the keeper ever typed and nothing on the card
+                explains where it came from. */}
+            {shown && shown.count > 1 && (
+              <span className="text-[9px] font-extrabold rounded px-1 py-[1px] shrink-0"
+                style={{ background: def.color + "1F", color: def.color }}>
+                {t("group.badgeShort", { count: shown.count })}
+              </span>
+            )}
           </div>
 
-          <ParamGauge def={def} value={reading ? reading.value : null} recent={recent} compact />
+          <ParamGauge def={def} value={shown ? shown.value : null} recent={recent}
+            position={position} compact />
 
           <MicroSpark rows={rows} def={def} colour={def.color} />
 
+          {/* The status line. Position always, once the engine has one;
+              trajectory alongside it as soon as the engine can state one. It
+              is never blank and it never leads with a refusal — where there is
+              no engine the line says what the app does with the readings
+              instead, which is true and is not an apology. */}
           <div className="flex items-center justify-between gap-1 mt-auto pt-0.5">
             <span className="text-[9px] font-extrabold uppercase tracking-wide truncate"
-              style={{ color: stab ? STABILITY_COLOR[stab.grade] || "#45605F" : "#5F7575" }}>
-              {stab ? stab.label : "\u2014"}
+              style={{ color: statusLine ? tone : "#5F7575" }}>
+              {statusLine || ""}
             </span>
             <span className="text-[9px] font-bold text-ink2 shrink-0">
-              {reading ? fmtShort(reading.date) : ""}
+              {shown && shown.date ? fmtShort(shown.date) : ""}
             </span>
           </div>
 
-          {dose && dose.state !== "idle" && (
-            <div className="flex items-center gap-1 rounded-md px-1.5 py-1"
-              style={{ background: dose.tone + "14" }}>
-              <span className="w-1 h-1 rounded-full shrink-0" style={{ background: dose.tone }} />
-              <span className="text-[9px] font-extrabold uppercase tracking-wide truncate"
-                style={{ color: dose.tone }}>
-                {dose.short}
-              </span>
-            </div>
-          )}
-
-          {worst && (
+          {/* The notification strip is where the engine speaks, and it is
+              absent when the engine has nothing to say. */}
+          {notice && (
             <div className="flex items-center gap-1 rounded-md px-1.5 py-1"
-              style={{ background: (worst.severity === "act" ? "#C4285B" : worst.severity === "watch" ? "#A2621B" : "#45605F") + "14" }}>
-              <span className="w-1 h-1 rounded-full shrink-0"
-                style={{ background: worst.severity === "act" ? "#C4285B" : worst.severity === "watch" ? "#A2621B" : "#45605F" }} />
+              style={{ background: notice.tone + "14" }}>
+              <span className="w-1 h-1 rounded-full shrink-0" style={{ background: notice.tone }} />
               <span className="text-[9px] font-extrabold uppercase tracking-wide truncate"
-                style={{ color: worst.severity === "act" ? "#C4285B" : worst.severity === "watch" ? "#A2621B" : "#45605F" }}>
-                {notes.length > 1 ? `${notes.length} notes` : worst.title}
+                style={{ color: notice.tone }}>
+                {notice.text}
               </span>
             </div>
           )}
```

### `app/src/components/ReadingContext.jsx`

| | |
|---|---|
| V1 source | `src/components/ReadingContext.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `aece71fabd68e316670d86713f952dd57169c94e9cd12a4d3ecc3cd18f770009` |
| V1 blob | `e252f1d647c0ad2cf9aab6eb381f7629b78834de` |
| Ported SHA-256 | `9fdddbbd226df270e745da80db44212ec1badfbad3c56c13a9e388216cbbd01a` |
| Differences | 8 |

1. **data source rewired — imports repointed onto V2's formatting, the read adapter and the position presenter**

```diff
@@ -1,6 +1,6 @@
-import { fmtVal } from '../lib/analytics/time-in-range.js'
-import { byOldest } from '../lib/analytics/time-of-day.js'
-import { STATUS_COLOR } from '../lib/dates.js'
+import { fmtVal } from '../lib/format.js'
+import { rowsFor } from '../lib/adapt.js'
+import { positionTone, positionIsInRange } from '../present/position.js'
 
 /* --- The new reading in context ---
  *
```

2. **data source rewired — the prior readings come from the read adapter's ordering instead of a second sort in the component**

```diff
@@ -9,10 +9,7 @@
  * just logged, so the reading arrives with its own background.
  */
 export function buildReadingSeries(def, readings, result) {
-  const prior = (readings || [])
-    .filter((r) => r.param === def.key)
-    .sort(byOldest)
-    .slice(-11);
+  const prior = rowsFor(readings || [], def.key).slice(-11);
   return [...prior, { date: result.date, time: result.time, value: result.value, isNew: true }];
 }
 
```

3. **chemistry removed — the scale includes the keeper's range only where he has one**

```diff
@@ -25,7 +22,12 @@
  */
 export function readingGeometry(def, rows, W, H, PAD) {
   const vals = rows.map((r) => r.value);
-  const lo = Math.min(...vals, def.min), hi = Math.max(...vals, def.max);
+  /* The keeper's own range is included in the scale where he has one. This
+     build ships no range it cannot source, so for most parameters there is
+     none and the scale is the readings alone. */
+  const banded = Number.isFinite(def.min) && Number.isFinite(def.max);
+  const lo = banded ? Math.min(...vals, def.min) : Math.min(...vals);
+  const hi = banded ? Math.max(...vals, def.max) : Math.max(...vals);
   const span = (hi - lo) || 1;
   const pad = span * 0.22;
   const yMin = lo - pad, yMax = hi + pad;
```

4. **chemistry removed — the axis labels include the band edges only where a band exists**

```diff
@@ -67,7 +69,7 @@
      guessed at. Anything closer than 11px to a label already chosen is
      dropped, since two overlapping numbers are worse than one. */
   const dataMax = Math.max(...vals), dataMin = Math.min(...vals);
-  const candidates = [dataMax, def.max, def.min, dataMin]
+  const candidates = (banded ? [dataMax, def.max, def.min, dataMin] : [dataMax, dataMin])
     .filter((v, i, a) => a.indexOf(v) === i)
     .sort((a, b) => b - a);
   const ticks = [];
```

5. **chemistry removed — the geometry reports whether a band exists rather than assuming two bounds**

```diff
@@ -75,8 +77,8 @@
     if (ticks.every((t) => Math.abs(y(t) - y(val)) > 11)) ticks.push(val);
   }
 
-  return { pts, total, at, d, y, yMin, yMax, AXIS, ticks,
-           bandTop: y(def.max), bandBottom: y(def.min), W, H };
+  return { pts, total, at, d, y, yMin, yMax, AXIS, ticks, banded,
+           bandTop: banded ? y(def.max) : null, bandBottom: banded ? y(def.min) : null, W, H };
 }
 
 export function ReadingSparkline({ def, rows, result, progress, geo }) {
```

6. **chemistry removed — the trace's colour follows the engine's position instead of `result.status`, the verdict V1's own `readingVerdict` had just produced**

```diff
@@ -83,7 +85,11 @@
   const W = geo.W, H = geo.H;
   if (!rows || rows.length < 2) return null;
 
-  const tone = STATUS_COLOR[result.status] || def.color;
+  /* V1 read `result.status` — the verdict its own `readingVerdict` classifier
+     had just produced inside a UI component. `position` is the engine's, and
+     it is null for every parameter the engine does not assess; the parameter's
+     own colour is what the trace is drawn in then. */
+  const tone = result.position ? positionTone(result.position) : def.color;
   const head = geo.at(progress);
   const done = progress >= 1;
   const last = geo.pts[geo.pts.length - 1];
```

7. **chemistry removed — a tick is a band edge only where a band exists**

```diff
@@ -112,7 +118,7 @@
       {/* Scale: band edges, plus the peak and trough of what's plotted. Band
           lines are drawn more strongly, since those are the thresholds. */}
       {geo.ticks.map((val, i) => {
-        const isBand = val === def.max || val === def.min;
+        const isBand = geo.banded && (val === def.max || val === def.min);
         return (
           <g key={i} className="rc-band">
             <line x1={geo.AXIS - 4} x2={W} y1={geo.y(val)} y2={geo.y(val)}
```

8. **chemistry removed — the shaded band is drawn only where a band exists, and lights on the engine's position rather than V1's verdict**

```diff
@@ -131,10 +137,12 @@
       <path d={`${geo.d} L${geo.pts[geo.pts.length - 1][0]},${H} L${geo.pts[0][0]},${H} Z`}
         fill={`url(#rcArea-${def.key})`} clipPath={`url(#rcClip-${def.key})`} />
 
-      <rect x={geo.AXIS} y={Math.min(geo.bandTop, geo.bandBottom)} width={W - geo.AXIS}
-        height={Math.max(2, Math.abs(geo.bandBottom - geo.bandTop))}
-        fill={tone}
-        className={`rc-band${done && result.status === "ok" ? " rc-band-hit" : ""}`} />
+      {geo.banded && (
+        <rect x={geo.AXIS} y={Math.min(geo.bandTop, geo.bandBottom)} width={W - geo.AXIS}
+          height={Math.max(2, Math.abs(geo.bandBottom - geo.bandTop))}
+          fill={tone}
+          className={`rc-band${done && positionIsInRange(result.position) ? " rc-band-hit" : ""}`} />
+      )}
 
       {/* Both strokes are cut at the dot's exact position along the path. */}
       <path d={geo.d} fill="none" stroke={tone} strokeWidth="4.5" strokeLinecap="round"
```

---

### `app/src/components/ReadingConfirmation.jsx`

| | |
|---|---|
| V1 source | `src/components/ReadingConfirmation.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `6e3afc520f3ea9c578d157ee1f654a5cc8e5d820d0dd3ad74520c480e963c51a` |
| V1 blob | `93ec64d731adde6d4ec2173be8841468a7a03cd2` |
| Ported SHA-256 | `998d4250b8eb45d0bc4150500dcf4ac66ca5a3f9773a87beb81beeb4a40b5beb` |
| Differences | 7 |

1. **data source rewired — imports repointed onto V2's formatting and task store; V1's findings, narrative engine and stability rules deleted**

```diff
@@ -1,14 +1,10 @@
-import React, { useEffect, useMemo, useState } from 'react'
+import { useEffect, useMemo, useState } from 'react'
 import { Btn } from './DoseExpectation.jsx'
 import { ReadingSparkline, buildReadingSeries, readingGeometry } from './ReadingContext.jsx'
 import { Check } from '../icons.jsx'
-import { fmtAmount, fmtVal } from '../lib/analytics/time-in-range.js'
-import { fmtFriendly } from '../lib/analytics/water-changes.js'
+import { fmtVal, fmtFriendly } from '../lib/format.js'
 import { useEscape } from '../lib/backup.jsx'
-import { SAFE_BOUNDS } from '../lib/findings.js'
-import { isCorrectionState } from '../lib/narrative-engine.js'
-import { intervalLabel } from '../lib/reminders.js'
-import { STABILITY_RULES } from '../lib/stability-engine.js'
+import { intervalLabel } from '../store/schedule.js'
 
 /* --- Reading confirmation ---
  *
```

2. **chemistry removed — `readingVerdict` deleted (390 lines of chemistry classifier inside a UI component, carrying V1's only ammonia branch), and `SplashBurst` with it**

```diff
@@ -17,421 +13,37 @@
  * gets a calm, useful line rather than an alarm, and one inside gets
  * acknowledgement rather than confetti.
  */
-export function readingVerdict(def, result) {
-  const { value, status, delta, prev } = result;
 
-  /* A correction under way changes what this reading means. Logged mid-plan,
-     412 ppm is not "well below your target" with nothing being done — it is a
-     tank on its way somewhere, and the number climbing is the plan working.
-     The out-of-range fact stays because it is true; it is subordinated to the
-     plan rather than hidden. */
-  const ds = result.doseState;
-  const cp = ds && ds.correctionPlan;
-  if (cp) {
-    const unit = def.unit;
-    const inBand = value >= def.min && value <= def.max;
-
-    /* A dangerous reading outranks the correction narrative.
-     *
-     * Calcium at 325 — below the 350 safe floor — read "below range,
-     * correction in progress, 15ppm to go toward 425ppm". Two things wrong at
-     * once: the danger went unmentioned, and the progress figure was computed
-     * from the last LOGGED reading rather than the one being previewed, so it
-     * promised 15 ppm to go when from 325 it is a hundred.
-     *
-     * A correction running does not make a dangerous level less dangerous, and
-     * quoting stale progress against a reading that has just fallen through
-     * the floor is worse than saying nothing. */
-    const safeB = SAFE_BOUNDS[def.key];
-    if (safeB && (value < safeB.min || value > safeB.max)) {
-      const low = value < safeB.min;
-      const aimPoint = cp.target;
-      const stillToGo = aimPoint != null ? Math.abs(aimPoint - value) : null;
-      return { emoji: "\u{1F6A8}", tone: "#C4285B",
-        headline: `${fmtVal(def, value)}${unit} — dangerously ${low ? "low" : "high"}`,
-        line: `Outside ${fmtVal(def, safeB.min)}\u2013${fmtVal(def, safeB.max)}${unit}. A correction is running${aimPoint != null ? ` toward ${fmtVal(def, aimPoint)}${unit}` : ""}${stillToGo != null ? `, and from here that is ${fmtVal(def, stillToGo)}${unit} away — further than the plan assumed` : ""}. Re-test before doing anything else: if this reading is right the plan needs rebuilding from where the tank actually is, and if it is wrong you want to know before acting on it.`,
-        goto: "dosing" };
-    }
-
-    /* Arrival is the payoff of a process that can run for weeks, and it is
-       the one moment worth celebrating. Not any in-band reading — if it fires
-       on every ordinary test it stops meaning anything. */
-    if (ds.state === "correction-done") {
-      return { emoji: "\u{1F386}", tone: "#0B7C86", celebrate: true,
-        headline: `Nice work — ${def.label.toLowerCase()} is back in range`,
-        line: cp.arrived
-          ? `Two readings back near the middle of your range confirm it. Set the dose back to ${fmtAmount(cp.returnDose)} mL/day in the Dosing Wizard.`
-          : `${fmtVal(def, value)}${unit} has passed your aim point — stop pushing now and set the dose back to ${fmtAmount(cp.returnDose)} mL/day.`,
-        goto: "dosing" };
-    }
-    if (ds.state === "correction-stalled" || ds.state === "correction-due") {
-      return { emoji: "\u26A0\uFE0F", tone: "#A2621B",
-        headline: ds.state === "correction-due" ? "Correction is due a check" : "Not moving as expected",
-        line: `${fmtVal(def, value)}${unit} after ${cp.days} days of the correction. See the Dosing Wizard for what to do next.`,
-        goto: "dosing" };
-    }
-    /* Running normally. */
-    const moving = prev != null && Math.sign(value - prev) === (cp.up ? 1 : -1);
-    return { emoji: moving ? "\u{1F4C8}" : "\u{1F4CA}", tone: "#1D6FA5",
-      headline: inBand ? `In range, correction still running` : `${def.label} is ${value < def.min ? "below" : "above"} range — correction in progress`,
-      line: `${fmtVal(def, cp.remaining)}${unit} to go toward ${fmtVal(def, cp.target)}${unit}${cp.daysLeft ? `, about ${cp.daysLeft} more day${cp.daysLeft === 1 ? "" : "s"}` : ""}. ${moving ? `This ${cp.up ? "rise" : "fall"} is your correction working — nothing to change.` : `It has not moved the way the plan expects yet.`}`,
-      goto: "dosing" };
-  }
-
-  /* A reading taken after a dose change is evidence about the change. That is
-     its primary meaning, and the window used to report only where the level
-     happened to sit.
-
-     The failure that made this worth fixing: raise the dose, watch alkalinity
-     climb 2 dKH, and the app would say "far enough out that a re-test is worth
-     doing" — suggesting the READING was suspect when it was the entirely
-     predictable result of the keeper's own change, which the wizard knew about
-     and was already calling an overshoot.
-
-     The quieter failure mattered more. Seven days at a raised dose with no
-     movement means either the dose is still short or the solution strength in
-     Setup is wrong. "A little low" invites waiting longer, which is the
-     opposite of what should happen, and a wrong strength invalidates every
-     other figure the app produces.
-
-     Everything below reads the wizard's own state and figures. No new
-     thresholds: a second place for the same judgement is how the three
-     assessment engines drifted apart. */
-  /* Only when the wizard has nothing louder to say.
-   *
-   * Two overlaps, both found by comparing the two surfaces side by side rather
-   * than testing this block alone:
-   *
-   * A LOGGED correction sets the state to "correcting" without creating a
-   * correctionPlan, so guarding on `!cp` was not enough — the wizard said
-   * "alkalinity is on its way to 10.0dKH" while this said "the dose change is
-   * working, hold it here", crediting the daily dose for a rise a correction
-   * was driving and telling the keeper to hold while a correction ran.
-   *
-   * And "suggested" means the engine wants a DIFFERENT dose. Saying "hold it
-   * here" against a wizard that is asking for 9.6 mL is a flat contradiction,
-   * and the wizard is the one with the arithmetic. Where it wants a change,
-   * this stays quiet and lets it speak. */
-  /* Read from the dose state alone — the assessment is not in scope here, and
-     the state already reflects a logged correction by sitting in "correcting". */
-  const wizardBusy = ds && (isCorrectionState(ds.state) || !!ds.correctionPlan);
-  /* This applies to ONE message, not the whole block. Suppressing everything
-     when the wizard wants a change silenced the overshoot and the "it has not
-     moved" cases — which are precisely the ones worth saying, because they
-     EXPLAIN why the wizard wants a change rather than contradicting it.
-     Only "hold it here" contradicts, so only that is withheld. */
-  const wizardWantsAChange = ds && (ds.state === "suggested" || ds.state === "due");
-  if (ds && !cp && !wizardBusy
-      && ds.doseChangedDaysAgo != null && ds.doseChangedDaysAgo >= 0) {
-    const since = ds.doseChangedDaysAgo;
-    const dose = ds.doseNow;
-    const unit = def.unit;
-    const wait = ds.settleDays;
-    const at = `${fmtAmount(dose)} mL a day`;
-    const ago = since === 0 ? "today" : since === 1 ? "yesterday" : `${since} days ago`;
-    const moved = prev != null ? value - prev : null;
-    const raised = ds.doseDirection === "up";
-    /* What the tank actually uses, in millilitres — the figure that decides
-       whether a change went far enough. */
-    const a0 = ds.maintenanceNow != null ? ds.maintenanceNow : null;
-
-    /* A water change between the dose change and this reading could have done
-       the work instead, so the claim softens from "your change did this" to
-       "it has moved". Crediting the wrong cause teaches the wrong lesson. */
-    const confounded = !!ds.disturbedSinceDoseChange;
-    const credit = confounded
-      ? `${def.label} has moved`
-      : `${at} has moved ${def.label.toLowerCase()}`;
-
-    /* Danger first, cause second, in one message. Someone at 11.5 dKH needs the
-       danger before the explanation, and needs the explanation to know what to
-       do about it. */
-    const bounds = SAFE_BOUNDS[def.key];
-    const unsafe = bounds && (value < bounds.min || value > bounds.max);
-    if (unsafe) {
-      return { emoji: "\u{1F6A8}", tone: "#C4285B",
-        headline: `${fmtVal(def, value)}${unit} — dangerously ${value < bounds.min ? "low" : "high"}`,
-        line: `Outside ${fmtVal(def, bounds.min)}\u2013${fmtVal(def, bounds.max)}${unit}. You changed the dose to ${at} ${ago}, and that is what has carried it here — so the fix is the dose, not the reading. Set it back and let the level come to you; the Dosing Wizard has the figure.`,
-        goto: "dosing" };
-    }
-
-    /* Adjusting again before the last change could be read.
-     *
-     * Three changes in five days on an element that settles in two is the
-     * oscillation the whole bracketing system exists to prevent, and nothing
-     * anywhere mentioned it — not the headline, not the findings, not the
-     * wizard. The app would say "too early to tell" for the third time in a
-     * week without noticing it was the third time.
-     *
-     * This is the one thing worth saying before anything else, because every
-     * other message assumes the dose has been left alone long enough to judge.
-     * Placed above the settle-window branch for that reason. */
-    if (ds.recentChanges >= 3) {
-      return { emoji: "\u{1F504}", tone: "#A2621B",
-        headline: `That is ${ds.recentChanges} dose changes in ${ds.changeSpanDays} days`,
-        line: `${def.label} takes about ${wait} day${wait === 1 ? "" : "s"} to show what a change did, so each of these was judged before the last one could be read. The level will swing rather than settle. Pick a dose, leave it alone for ${wait * 2} days, and let this reading mean something.`,
-        goto: "dosing" };
-    }
-
-    /* Too early to read anything into it — but only for the judgements that
-       actually need the settle window.
-       
-       The window governs whether the DOSE RATE can be inferred from readings,
-       which for calcium is 17 days and magnesium 30. It does not govern
-       whether a level has visibly left its band: that is plain from a single
-       reading and needs no statistics.
-       
-       Suppressing everything behind it made calcium and magnesium say "too
-       early to tell" and nothing else, for a month, however far out they had
-       gone. Alkalinity settles in two days so this never showed there — the
-       whole feature was built and tested on the one element where the bug is
-       invisible.
-       
-       So an overshoot past the band still speaks, and so does a move in the
-       wrong direction. Only "it worked" and "it has not moved" wait, because
-       those are inferences about the rate. */
-    /* Overshot: past the band in the DIRECTION of the change. Merely being
-       out of band does not qualify — a level still below where it started is
-       exactly the case the settle window exists for, and treating it as plain
-       evidence made day one fall through every branch and say "a little low"
-       with no mention of the change at all. */
-    const plainlyOut = (raised && value > def.max) || (!raised && value < def.min);
-    const plainlyWrongWay = moved != null
-      && Math.abs(moved) > ((STABILITY_RULES[def.key] || {}).noiseFloor || 0)
-      && ((raised && moved < 0) || (!raised && moved > 0));
-    if (since < wait && !plainlyOut && !plainlyWrongWay) {
-      const left = Math.max(1, wait - since);
-      return { emoji: "\u{1F553}", tone: "#1D6FA5",
-        headline: "Too early to tell",
-        line: `You changed the dose to ${at} ${ago}. Give it ${left} more day${left === 1 ? "" : "s"} before reading anything into this — ${def.label.toLowerCase()} moves slower than the kit can see, and adjusting again now is how the dose starts swinging.` };
-    }
-
-    const inBand = value >= def.min && value <= def.max;
-    const wrongWay = moved != null && Math.abs(moved) > (STABILITY_RULES[def.key] || {}).noiseFloor
-      && ((raised && moved < 0) || (!raised && moved > 0));
-
-    /* Moved against the change — the one case where the reading really is the
-       most surprising thing on the screen. */
-    if (wrongWay) {
-      /* A reduction that was not big enough looks identical to an external
-         cause, and the app blamed the skimmer. Lowering 13 mL to 11 on a tank
-         that uses 0.62 dKH a day still supplies 0.76 — the level goes on
-         rising, nothing else is at work, and telling someone to hunt for a
-         changed reactor sends them looking for a problem that is arithmetic.
-         
-         The engine already knows: if the dose still sits the wrong side of
-         what the tank uses, the change simply did not go far enough. */
-      /* Three cases, and the app can only distinguish two of them.
-      
-         If it knows what the tank uses, it can say plainly whether the change
-         went far enough. If it does not — and after a change it often cannot,
-         because the fit needs readings on the NEW dose — then "something else
-         is at work" is a guess, and it was the guess the app made. Lowering
-         13 mL to 11 on a tank using 0.62 dKH a day still supplies 0.76, so the
-         level goes on rising with nothing else involved; sending someone to
-         inspect their skimmer is sending them after a problem that is
-         arithmetic.
-         
-         Where it cannot tell, it now says so and names both possibilities in
-         the order worth checking. */
-      const known = ds.maintenanceNow;
-      const notFarEnough = ds.doseNow != null && known != null
-        && ((raised && ds.doseNow < known) || (!raised && ds.doseNow > known));
-      const wentOn = raised ? "falling" : "rising";
-      let head, body;
-      if (notFarEnough) {
-        head = "The change did not go far enough";
-        body = `You ${raised ? "raised" : "lowered"} the dose to ${at} ${ago} and ${def.label.toLowerCase()} has gone on ${wentOn} to ${fmtVal(def, value)}${unit}. ${at} is still ${raised ? "less" : "more"} than the tank uses, so the direction cannot change until the dose does — it is the size of the change, not the fact of it.`;
-      } else if (known != null) {
-        head = "It has moved the wrong way";
-        body = `You ${raised ? "raised" : "lowered"} the dose to ${at} ${ago} and ${def.label.toLowerCase()} has gone ${raised ? "down" : "up"} to ${fmtVal(def, value)}${unit}, though ${at} should be ${raised ? "more" : "less"} than the tank uses. Something else is at work — check whether a skimmer, reactor or water change habit has altered, or whether growth is outpacing what you are replacing.`;
-      } else {
-        head = `It is still ${wentOn}`;
-        body = `You ${raised ? "raised" : "lowered"} the dose to ${at} ${ago} and ${def.label.toLowerCase()} has gone on ${wentOn} to ${fmtVal(def, value)}${unit}. There is not yet enough on the new dose to tell whether the change was simply too small or whether something else is at work — the first is far likelier, so check the arithmetic before hunting for a cause.`;
-      }
-      return { emoji: "\u{1F914}", tone: "#A2621B", headline: head, line: body, goto: "dosing" };
-    }
-
-    /* Out of band in the direction of the change: it overshot. */
-    if (!inBand && ((raised && value > def.max) || (!raised && value < def.min))) {
-      return { emoji: "\u{1F4C9}", tone: "#A2621B",
-        headline: `That is the dose change overshooting ${raised ? "upward" : "downward"}`,
-        /* Which end it overshot. An overshoot can be downward — lowering the
-           dose too far pushes the level under the band — and this said "past
-           the top of your range" either way, then told the keeper the dose was
-           "more than the tank needs" while they were staring at a reading
-           below their floor. */
-        line: `${credit} to ${fmtVal(def, value)}${unit} over ${since} day${since === 1 ? "" : "s"}, past the ${raised ? "top" : "bottom"} of your range. The reading is not suspect — ${confounded ? "though a water change in between may have helped" : `${at} is simply ${raised ? "more" : "less"} than the tank needs`}. The Dosing Wizard has a ${raised ? "smaller" : "larger"} figure to go back to.`,
-        goto: "dosing" };
-    }
-
-    /* Past the settle window and still not moving. */
-    /* "It has not moved" is an inference about the RATE, so it waits for the
-       settle window even when the level is plainly out of band. Letting the
-       out-of-band case skip the wait made this fire on day one — "1 days at
-       11.0 mL a day and it has not moved", which is true and useless. Only the
-       overshoot and wrong-way messages bypass the window, because those read a
-       movement that has already happened rather than the absence of one. */
-    const stuck = moved == null || Math.abs(moved) <= (STABILITY_RULES[def.key] || {}).noiseFloor;
-    if (!inBand && stuck && since >= wait) {
-      /* Not moving has two quite different causes and the app gave one answer
-         to both.
-         
-         If the dose does NOT match consumption, the change was too small and
-         the advice — go further, or check the strength — is right.
-         
-         If it DOES match, the level is not stuck, it is being HELD. That is
-         what a matched dose does, and it is the normal state after a
-         correction that overshot and was then cancelled: 15 mL pushed
-         alkalinity to 10.12, the dose went back to 9, and 9 holds it there
-         exactly. Telling someone their dose "needs to go further" is then both
-         wrong and, for a level above the band, pointing the wrong way. A
-         maintenance dose cannot move a level; only a correction can. */
-      const matched = ds.maintenanceNow != null && ds.doseNow > 0
-        && Math.abs(ds.maintenanceNow - ds.doseNow) / ds.doseNow <= 0.12;
-      if (matched) {
-        return { emoji: "\u{1F4CD}", tone: "#A2621B",
-          headline: `Held at ${fmtVal(def, value)}${unit}, ${value < def.min ? "below" : "above"} your range`,
-          line: `${at} is matching what the tank uses, so it is holding ${def.label.toLowerCase()} steady exactly where it is — which is ${value < def.min ? "under" : "over"} your range. A daily dose cannot move a level, only hold one. Bringing it ${value < def.min ? "up" : "down"} is a separate correction, and the Dosing Wizard has it.`,
-          goto: "dosing" };
-      }
-      return { emoji: "\u{1F6A7}", tone: "#A2621B",
-        headline: `${since} days at ${at} and it has not moved`,
-        line: `Still ${fmtVal(def, value)}${unit}, ${value < def.min ? "below" : "above"} your range. Either the dose needs to go ${value < def.min ? "higher" : "lower"} or the solution strength in Setup is wrong — check the strength first, because if it is off then every figure this app gives you is off with it.`,
-        goto: "dosing" };
-    }
-
-    /* It worked. Said out loud, because confirming a change worked is as
-       useful as flagging one that did not, and it is the message that teaches
-       what a matched dose looks like.
-
-       Withheld when the wizard is asking for a different dose: "hold it here"
-       against a wizard requesting 9.6 mL is a flat contradiction, and the
-       wizard is the one with the arithmetic. */
-    /* Said once, when it becomes true — not on every reading afterwards.
-     *
-     * On six months of real readings this fired on three quarters of them: the
-     * change stays "recent" for weeks, the level stays in band, and every
-     * test got the same congratulation. A message that appears four readings
-     * in five is wallpaper, and wallpaper is what people stop reading before
-     * the one that matters.
-     *
-     * News means the PREVIOUS reading was not yet in band. Once it is settled,
-     * silence is the reward. */
-    const wasOut = prev != null && (prev < def.min || prev > def.max);
-    if (inBand && wasOut) {
-      /* Two halves, and only one of them can contradict the wizard.
-       *
-       * "Your change brought it back" is a fact about what happened. "Hold it
-       * here" is an instruction, and it is the instruction that clashes when
-       * the engine is asking for a different dose.
-       *
-       * Suppressing the whole message made it unreachable: arriving in band
-       * means the level is MOVING, moving makes the engine want a tweak, and
-       * the tweak blocked the confirmation. The message that was explicitly
-       * asked for could almost never appear. Splitting it fixes that without
-       * putting two voices at odds. */
-      return { emoji: "\u{2705}", tone: "#0B7C86",
-        headline: "The dose change is working",
-        line: `${credit}${moved != null && Math.abs(moved) > 0 ? ` from ${fmtVal(def, prev)}${unit} to ${fmtVal(def, value)}${unit}` : ""} over ${since} day${since === 1 ? "" : "s"}, and it is back in range. ${wizardWantsAChange ? "The Dosing Wizard has a small further adjustment to hold it there." : "Hold it here — this is what a matched dose looks like."}` };
-    }
-  }
-
-  /* Some parameters have a ceiling rather than a target range — ammonia should read
-     zero, and anything measurable is worth acting on however far it sits
-     "inside" the range. */
-  if (def.idealAt === "min") {
-    if (value <= (def.step || 0.01) / 2) {
-      return { emoji: "\u{1F3AF}", tone: "#0B7C86", headline: "Undetectable",
-        line: "Exactly where it should be — an established tank should read zero." };
-    }
-    if (value <= def.max) {
-      return { emoji: "\u26A0\uFE0F", tone: "#A2621B", headline: "Detectable",
-        line: "Any measurable ammonia means something isn't being processed. Check for a dead animal, an overfeed, or a disturbed filter — and re-test today." };
-    }
-    return { emoji: "\u{1F6A8}", tone: "#C4285B", headline: "Dangerously high",
-      line: "This is harmful to livestock now. Test again to confirm, then act — water change, and find what died or overloaded the system." };
-  }
-
-  const mid = (def.min + def.max) / 2;
-  const halfBand = (def.max - def.min) / 2 || 1;
-  const fromMid = Math.abs(value - mid) / halfBand;   // 0 = dead centre, 1 = at the edge
-
-  /* "Nothing to do" is the window's own voice, and it contradicts a wizard
-     that is asking for a dose change — 4% of readings in a swept sample got
-     exactly that pair. The level being dead centre is true; "nothing to do" is
-     an instruction, and the instruction is not the window's to give when the
-     engine disagrees.
-     
-     The overlap rule built for the dose-change messages only guarded the
-     phrase "hold it here". This is the same fault in the older, generic
-     wording, which nothing was watching. */
-  const engineWantsSomething = ds
-    && /could change|needs a test|is due|needs more/i.test(`${ds.headline || ""} ${ds.detail || ""}`);
-
-  if (status === "ok") {
-    if (fromMid < 0.35) {
-      return { emoji: "\u{1F3AF}", tone: "#0B7C86",
-        headline: "Dead centre",
-        line: engineWantsSomething
-          ? "Right in the middle of your band. The Dosing Wizard still has an adjustment to suggest."
-          : prev != null && Math.abs(delta) < def.step * 1.5
-            ? "Barely moved since last time. That's the boring kind of good."
-            : "Right in the middle of your band — nothing to do." };
-    }
-    if (prev != null && Math.abs(value - mid) < Math.abs(prev - mid)) {
-      return { emoji: "\u{1F44C}", tone: "#0B7C86",
-        headline: "Heading the right way",
-        line: `In band, and closer to the middle than last time.` };
-    }
-    return { emoji: "\u2705", tone: "#0B7C86",
-      headline: "In band",
-      line: fromMid > 0.8 ? "Inside your range, though near the edge — worth watching."
-        : "Comfortably within your target range." };
-  }
-
-  if (status === "high") {
-    const far = value > def.max + halfBand;
-    return { emoji: far ? "\u{1F6A9}" : "\u{1F4C8}", tone: "#A2621B",
-      headline: far ? "Well above band" : "A little high",
-      line: far ? "Far enough out that a re-test is worth doing before you act on it."
-        : `${fmtVal(def, +(value - def.max).toFixed(4))}${def.unit} above the top of your range.` };
-  }
-
-  if (status === "low") {
-    const far = value < def.min - halfBand;
-    return { emoji: far ? "\u{1F6A9}" : "\u{1F4C9}", tone: "#A2621B",
-      headline: far ? "Well below band" : "A little low",
-      line: far ? "Far enough out that a re-test is worth doing before you act on it."
-        : `${fmtVal(def, +(def.min - value).toFixed(4))}${def.unit} below the bottom of your range.` };
-  }
+/* V1's `readingVerdict` stood here — 390 lines of it, and it is the single
+   clearest example of what this port exists to stop.
 
-  return { emoji: "\u2705", tone: "#0B7C86", headline: "Saved", line: "" };
-}
+   It was a chemistry classifier living inside a UI component. Given a reading
+   it decided whether the tank was fine, drifting, out of band, mid-correction
+   or in trouble; it imported `SAFE_BOUNDS`, `STABILITY_RULES` and
+   `isCorrectionState`; it carried V1's only ammonia branch, written before
+   V1's own ammonia canon existed and never reconciled with it. The salvage
+   inventory names it as "the exact single-source violation `X-INV-004`
+   forbids", and its instruction is "Keep the moment; rebuild the reasoning."
 
+   That is what has happened. The moment is here in full — the timing, the
+   easing, the one progress value driving chart, dot and counter, the closing
+   countdown with its shrinking bar, the tap-to-keep-open. Every word it says
+   arrives as a prop, from `app/src/present/`, out of what V2's engine
+   returned. This file no longer contains a single sentence about what a
+   reading means. */
 
-/* Water splash for a correction arriving. Deliberately reserved for that one
-   moment: a fortnight of dosing ends here, and if it fired on every in-band
-   reading it would stop meaning anything. */
-export function SplashBurst() {
-  const drops = React.useMemo(() => Array.from({ length: 18 }, (_, i) => {
-    const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.2;
-    const dist = 46 + (i % 5) * 14;
-    return { id: i, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 10,
-      size: 4 + (i % 4) * 2, delay: (i % 6) * 40 };
-  }), []);
-  return (
-    <div className="splash-wrap" aria-hidden="true">
-      {drops.map((d) => (
-        <span key={d.id} className="splash-drop"
-          style={{ "--dx": `${d.x}px`, "--dy": `${d.y}px`,
-            width: d.size, height: d.size, animationDelay: `${d.delay}ms` }} />
-      ))}
-    </div>
-  );
-}
+/* V1's `SplashBurst` stood here too: eighteen animated water drops for a
+   correction arriving. The brief for this port: "No emojis. No green tick, no
+   confetti, no stars. Keep it professional." The burst is confetti with a
+   reef theme, and the salvage inventory had already put it under
+   `LEAVE_BEHIND` — "decoration without function. The arrival moment above is
+   the part worth keeping; the confetti is not." */
 
-export function LogResultPopup({ result, onClose, readings = [], onOpenDosing }) {
+/* `verdict` is what the moment SAYS, and it arrives already worded. The shell
+   builds it from the engine result that follows the reading, through
+   `app/src/present/`; until that result exists it is the plain acknowledgement
+   below, which is true and says nothing it cannot support. */
+export function LogResultPopup({ result, onClose, readings = [], onOpenDosing, verdict = null }) {
   useEscape(onClose);
   /* The full sequence runs to about 6.8 seconds; the countdown leaves roughly
      eight more to actually look at the result. */
```

3. **wording replaced with engine output — the moment's headline and line arrive as a prop built from the engine's answer; where the engine has not answered yet it acknowledges the save and claims nothing**

```diff
@@ -510,9 +122,16 @@
 
   if (!result || !result.def) return null;
 
-  const { def, value, delta, prev, nextDue, interval } = result;
-  const v = readingVerdict(def, result);
-  const moved = prev != null && Math.abs(delta) >= (def.step || 0.01);
+  const { def, value, prev, nextDue, interval } = result;
+  /* No headline is ever composed here. Where the engine has not answered yet —
+     it runs in a worker and takes a moment — the moment acknowledges the save
+     and claims nothing about the tank. */
+  const v = verdict || { tone: def.color, headline: "Reading saved", line: null, goto: null };
+  /* V1 drew an arrow when the change from the previous reading cleared
+     `def.step`. That step was a noise floor and a noise floor is chemistry, so
+     the comparison is gone: the previous reading is stated as a fact and the
+     difference is left to the eye and to the chart above it. */
+  const showPrev = prev != null;
 
   return (
     <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
```

4. **wording replaced with engine output — the emoji and the celebration burst removed; the brief rules out emojis, ticks, confetti and stars**

```diff
@@ -523,9 +142,7 @@
 
         {/* A tinted cap so the result reads before any words do. */}
         <div className="px-5 pt-6 pb-5 text-center relative" style={{ background: v.tone + "12" }}>
-          {v.celebrate && <SplashBurst />}
-          <div style={{ fontSize: 44, lineHeight: 1 }}>{v.emoji}</div>
-          <div className="mt-3 flex items-baseline justify-center gap-1">
+          <div className="flex items-baseline justify-center gap-1">
             <span className={`rc-value text-[34px] font-black leading-none tabular-nums${landed && !sheenDone ? " landed" : ""}`}
               style={{ color: v.tone }}>
               <span className="rc-sheen">
```

5. **chemistry removed — the previous reading is stated as a fact instead of being compared against `def.step`, which is a noise floor**

```diff
@@ -535,9 +152,9 @@
             <span className="text-[14px] font-bold text-ink2">{def.unit}</span>
           </div>
           <div className="text-[13px] font-black text-ink mt-1">{def.label}</div>
-          {moved && (
+          {showPrev && (
             <div className="text-[11px] font-bold text-ink2 mt-1">
-              {delta > 0 ? "\u2191" : "\u2193"} {fmtVal(def, +Math.abs(delta).toFixed(4))}{def.unit} from {fmtVal(def, prev)}
+              previous {fmtVal(def, prev)}{def.unit}
             </div>
           )}
 
```

6. **wording replaced with engine output — the hand-off button's label and variant no longer depend on V1's celebrate verdict**

```diff
@@ -563,9 +180,8 @@
               never drift out of step with it. */}
           {v.goto === "dosing" && onOpenDosing && (
             <div className="mt-3">
-              <Btn variant={v.celebrate ? "solid" : "ghost"}
-                onClick={() => { onClose(); onOpenDosing(def.key); }}>
-                {v.celebrate ? "Set the dose back" : "Open the Dosing Wizard"}
+              <Btn variant="ghost" onClick={() => { onClose(); onOpenDosing(def.key); }}>
+                Open Dosing
               </Btn>
             </div>
           )}
```

7. **wording replaced with engine output — the parameter's mid-sentence name comes from the strings file instead of lowercasing its heading form**

```diff
@@ -573,7 +189,7 @@
           {nextDue && (
             <div className="mt-3 pt-3 border-t border-app" style={{ animationDelay: "500ms" }}>
               <div className="text-[11px] font-bold text-ink2">
-                Next {def.label.toLowerCase()} test
+                Next {def.labelMid || def.label.toLowerCase()} test
               </div>
               <div className="text-[13px] font-black text-ink">
                 {fmtFriendly(nextDue)}
```

---

### `app/src/components/TaskCompletion.jsx`

| | |
|---|---|
| V1 source | `src/components/TaskCompletion.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `4361fd72fab99083d02c8cb9c30c3b777ee93ed39a31d86158ebac87a5afdac8` |
| V1 blob | `90cfb1bd985a31d89f82d82d788d7116eb33c702` |
| Ported SHA-256 | `ebbb178419b932e695e88015c285320c13910b270a424b129ed81df11fe819c5` |
| Differences | 4 |

1. **data source rewired — imports repointed onto V2's formatting and task store, and the header records what the brief removed from this moment**

```diff
@@ -1,14 +1,29 @@
-import { useEffect, useMemo, useState } from 'react'
-import { fmtFriendly } from '../lib/analytics/water-changes.js'
+import { useEffect, useState } from 'react'
+import { Check } from '../icons.jsx'
+import { fmtFriendly } from '../lib/format.js'
 import { useEscape } from '../lib/backup.jsx'
-import { daysBetween } from '../lib/dates.js'
-import { intervalLabel } from '../lib/reminders.js'
+import { intervalLabel } from '../store/schedule.js'
 
 /* --- Task completion ---
  *
- * Ticking off a chore used to move a row quietly. This marks it, and shows the
- * run of times it has been done — the one thing the app knows that you don't
- * carry in your head.
+ * Ticking off a chore used to move a row quietly. This marks it.
+ *
+ * WHAT THIS MOMENT NO LONGER SAYS, AND WHY
+ *
+ * V1 showed the run of past completions and the actual intervals between them
+ * — "3 times now · you do this about every 6 days" — which the salvage
+ * inventory called exemplary restraint: "it shows the fact and offers no
+ * judgement."
+ *
+ * The brief for this port keeps the moment and removes that content: "The
+ * streak content ... is liked but the engine does not produce it. Record it
+ * for later; do not synthesise it in the interface." So the counting, the
+ * average gap and the against-schedule comparison are gone rather than
+ * reimplemented here, and the row of stars that displayed them went with them
+ * — the brief rules out stars anyway.
+ *
+ * It is a real loss and it is recorded as one, with what would be needed to
+ * restore it, in `docs/migration/PORT-OMISSIONS.md`.
  */
 export function TaskDonePopup({ result, onClose }) {
   useEscape(onClose);
```

2. **wording replaced with engine output — the completion count and the average interval between completions removed; the brief records the streak content for later and forbids synthesising it in the interface**

```diff
@@ -15,33 +30,8 @@
   const AUTO_SECONDS = 10;
   const [left, setLeft] = useState(AUTO_SECONDS);
   const [held, setHeld] = useState(false);
-  const [lit, setLit] = useState(0);
 
-  const stats = useMemo(() => {
-    if (!result) return null;
-    const dates = (result.history || []).slice(0, 12);
-    /* Actual interval between completions, which is often not the interval that
-       was set — worth showing without comment. */
-    const gaps = [];
-    for (let i = 1; i < dates.length; i++) gaps.push(daysBetween(dates[i], dates[i - 1]));
-    const avg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
-    return { dates, count: (result.history || []).length, avg };
-  }, [result]);
-
-  /* Stars light one at a time, most recent last, so the run reads left to right. */
   useEffect(() => {
-    if (!result || !stats) return;
-    const reduced = typeof window !== "undefined" && window.matchMedia
-      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
-    const n = Math.min(stats.dates.length, 12);
-    if (reduced) { setLit(n); return; }
-    setLit(0);
-    const timers = [];
-    for (let i = 1; i <= n; i++) timers.push(setTimeout(() => setLit(i), 380 + i * 110));
-    return () => timers.forEach(clearTimeout);
-  }, [result, stats]);
-
-  useEffect(() => {
     if (!result || held) return;
     if (left <= 0) { onClose(); return; }
     const t = setTimeout(() => setLeft((n) => n - 1), 1000);
```

3. **wording replaced with engine output — the moment renders without those statistics**

```diff
@@ -48,9 +38,8 @@
     return () => clearTimeout(t);
   }, [result, left, held]);
 
-  if (!result || !stats) return null;
+  if (!result) return null;
   const tone = "#0B7C86";
-  const shown = stats.dates.slice().reverse();   // oldest first
 
   return (
     <div className="fixed inset-0 flex items-center justify-center p-5" onClick={onClose}
```

4. **wording replaced with engine output — the green-tick emoji and the row of stars removed; the brief rules out emojis and stars, and the stars displayed the streak content above**

```diff
@@ -60,45 +49,24 @@
         style={{ boxShadow: "0 24px 60px rgba(8,25,29,0.35)" }}>
 
         <div className="px-5 pt-6 pb-5 text-center" style={{ background: tone + "12" }}>
-          <div style={{ fontSize: 42, lineHeight: 1 }}>{"\u2705"}</div>
+          {/* V1 used a green tick emoji. The brief rules them out; the icon
+              set the rest of the app is drawn in does the same job. */}
+          <div className="flex items-center justify-center" style={{ color: tone }}>
+            <Check size={30} strokeWidth={3} />
+          </div>
           <div className="text-[17px] font-black text-ink mt-3">{result.label}</div>
           <div className="text-[12px] font-bold text-ink2 mt-0.5">
             done {fmtFriendly(result.date)}
           </div>
-
-          {/* The run so far. Twelve at most, so it stays a glance not a list. */}
-          <div className="flex items-center justify-center gap-1 mt-3 flex-wrap">
-            {shown.map((d, i) => {
-              const isLatest = i === shown.length - 1;
-              return (
-                <span key={d + i}
-                  className={i < lit ? "tp-star" : undefined}
-                  style={{
-                    fontSize: isLatest ? 19 : 14,
-                    opacity: i < lit ? 1 : 0,
-                    animationDelay: `${i * 40}ms`,
-                    lineHeight: 1,
-                  }}>
-                  {isLatest ? "\u2B50" : "\u2734\uFE0F"}
-                </span>
-              );
-            })}
-          </div>
         </div>
 
         <div className="px-5 py-4 text-center rc-stagger">
           <div className="text-[15px] font-black" style={{ color: tone, animationDelay: "260ms" }}>
-            {stats.count === 1 ? "First time logged"
-              : `${stats.count} times now`}
+            Logged
           </div>
           <p className="text-[13px] text-ink font-medium leading-relaxed mt-1"
             style={{ animationDelay: "380ms" }}>
-            {stats.avg != null
-              ? `You do this about every ${Math.round(stats.avg)} days${
-                  result.intervalDays && Math.abs(stats.avg - result.intervalDays) >= 2
-                    ? `, against a schedule of ${intervalLabel(result.intervalDays).replace("every ", "")}`
-                    : " — right on schedule"}.`
-              : "The next one is scheduled from today."}
+            The next one is scheduled from today, not from when it was due.
           </p>
 
           {result.nextDue && (
```

---

### `app/src/components/TodayPanel.jsx`

| | |
|---|---|
| V1 source | `src/components/TodayPanel.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `c48cecb59afe6219f8b4ccb3bd37f8033df1d1aec52eb6e4ed3a6cdaf417f028` |
| V1 blob | `0358527fbc2eab1a0b244e928861d8c9bde826e5` |
| Ported SHA-256 | `7e377dc7d6ebd6a70d94aba3ff563323a7a90d3b5d70dec07e343e552d402540` |
| Differences | 15 |

1. **data source rewired — imports repointed onto V2's task store and application clock; V1's stability engine, narrative engine and analytics deleted**

```diff
@@ -1,14 +1,9 @@
 import { useState } from 'react'
-import { Btn } from './DoseExpectation.jsx'
 import { Card } from './ErrorBoundary.jsx'
 import { Bell, Check, ChevronDown, ChevronUp, ListChecks } from '../icons.jsx'
-import { fmtVal } from '../lib/analytics/time-in-range.js'
-import { fmtTime, nowTime, windowRows } from '../lib/analytics/time-of-day.js'
-import { pinReasonLabel, useEscape } from '../lib/backup.jsx'
 import { fmtShort, todayStr } from '../lib/dates.js'
-import { joinList } from '../lib/narrative-engine.js'
-import { intervalLabel } from '../lib/reminders.js'
-import { computeStability } from '../lib/stability-engine.js'
+import { nowTime } from '../lib/clock.js'
+import { intervalLabel } from '../store/schedule.js'
 
 /* --- What needs doing today ---
  * Sits directly under the tank assessment and shows only what is overdue or due
```

2. **data source rewired — a row reads V2's task vocabulary (`task.kind === "TEST"`, `task.parameter`) instead of V1's reminder vocabulary**

```diff
@@ -19,7 +14,7 @@
    another tab to type one number was the most repeated friction in the app. */
 export function TodayRow({ s: st, onOpenTest, onComplete, onNudge, onPickTask, def, onAddReading }) {
   const [value, setValue] = useState("");
-  const isTest = st.rem.kind === "test" && st.rem.paramKey;
+  const isTest = st.task.kind === "TEST" && st.task.parameter;
   const late = st.status === "overdue";
   const canLogHere = isTest && def && onAddReading;
 
```

3. **data source rewired — a reading logged from a due row carries value, date and time and nothing else, per the brief's logging rule**

```diff
@@ -26,7 +21,10 @@
   const save = async () => {
     const v = parseFloat(value);
     if (!isFinite(v)) return;
-    await onAddReading({ param: def.key, value: v, date: todayStr(), time: nowTime(), note: "" });
+    /* Value, date, time — the three the brief allows, with date and time
+       filled from now. There is no fourth question here and there is not one
+       anywhere else either. */
+    await onAddReading({ param: def.key, value: v, date: todayStr(), time: nowTime() });
     setValue("");
   };
 
```

4. **data source rewired — the row's label, id and interval read V2's task; the pin label is deleted because in V2 the retest date is the engine's and is never written into a task**

```diff
@@ -34,18 +32,20 @@
     <div className="rounded-xl bg-white border border-app p-2.5">
       <div className="flex items-center justify-between gap-2">
         <button className="min-w-0 text-left flex-1"
-          onClick={() => (isTest ? onOpenTest(st.rem.paramKey) : onComplete(st.rem.id))}>
-          <div className="text-[14px] font-black text-ink truncate">{st.rem.label}</div>
+          onClick={() => (isTest ? onOpenTest(st.task.parameter) : onComplete(st.task.id))}>
+          <div className="text-[14px] font-black text-ink truncate">{st.task.label}</div>
           <div className="text-[11px] font-bold"
             style={{ color: late ? "#A2621B" : st.daysOut === 0 ? "#0B7C86" : "#45605F" }}>
             {late ? `${Math.abs(st.daysOut)} day${Math.abs(st.daysOut) === 1 ? "" : "s"} overdue`
               : st.daysOut === 0 ? "due today"
               : `in ${st.daysOut} day${st.daysOut === 1 ? "" : "s"} · ${fmtShort(st.due)}`}
-            {/* A test pinned by the dosing protocol says so, since it sits off
-                the usual rhythm for a reason. */}
-            {st.pinned
-                          ? ` · ${pinReasonLabel(st.pinReason)}${st.dueTime && fmtTime(st.dueTime) ? `, around ${fmtTime(st.dueTime)}` : ""}`
-                          : ` · ${intervalLabel(st.rem.intervalDays)}`}
+            {/* V1 appended why a test had been pinned off its usual rhythm.
+                That pin was V1's own protocol writing a retest date into the
+                schedule; in V2 the retest date is the engine's and is never
+                written into a task behind the keeper's back. So a row states
+                its interval, which is the keeper's own number, and nothing
+                else. */}
+            {` · ${intervalLabel(st.task.intervalDays)}`}
                       </div>
         </button>
 
```

5. **data source rewired — the complete action reads V2's task id**

```diff
@@ -63,7 +63,7 @@
             </button>
           </div>
         ) : (
-          <button onClick={() => onComplete(st.rem.id)}
+          <button onClick={() => onComplete(st.task.id)}
             className="shrink-0 rounded-lg px-3 py-2 text-[12px] font-extrabold text-white"
             style={{ background: "#0B7C86" }}>
             Done
```

6. **data source rewired — the snooze and reschedule actions read V2's task id**

```diff
@@ -72,10 +72,10 @@
       </div>
 
       <div className="flex items-center gap-1.5 mt-2 flex-wrap">
-          <NudgeButton onClick={() => onNudge(st.rem.id, 1 - Math.min(0, st.daysOut))} label="Snooze until tomorrow" />
-          {onPickTask && <NudgeButton onClick={() => onPickTask(st.rem.id)} label="Change schedule…" />}
+          <NudgeButton onClick={() => onNudge(st.task.id, 1 - Math.min(0, st.daysOut))} label="Snooze until tomorrow" />
+          {onPickTask && <NudgeButton onClick={() => onPickTask(st.task.id)} label="Change schedule…" />}
           {canLogHere && (
-            <button onClick={() => onOpenTest(st.rem.paramKey)}
+            <button onClick={() => onOpenTest(st.task.parameter)}
               className="rounded-lg border border-app px-2 py-1 text-[10px] font-extrabold text-ink2 active:bg-app">
               Open in Test Lab
             </button>
```

7. **data source rewired — the collapsed bar's preview reads V2's task labels**

```diff
@@ -109,8 +109,8 @@
     : "Nothing due today";
 
   const preview = clear
-    ? (soon[0] ? `next ${soon[0].rem.label.replace(/^Test /, "")} in ${soon[0].daysOut}d` : "")
-    : rows.slice(0, 2).map((s) => s.rem.label.replace(/^Test /, "")).join(", ") +
+    ? (soon[0] ? `next ${soon[0].task.label.replace(/^Test /, "")} in ${soon[0].daysOut}d` : "")
+    : rows.slice(0, 2).map((s) => s.task.label.replace(/^Test /, "")).join(", ") +
       (rows.length > 2 ? ` +${rows.length - 2}` : "");
 
   return (
```

8. **data source rewired — the row list keys and looks up parameters through V2's task fields**

```diff
@@ -131,9 +131,9 @@
         <div className="px-4 pb-4">
           <div className="space-y-2">
             {rows.map((st) => (
-              <TodayRow key={st.rem.id} s={st} onOpenTest={onOpenTest} onComplete={onComplete}
+              <TodayRow key={st.task.id} s={st} onOpenTest={onOpenTest} onComplete={onComplete}
                 onNudge={onNudge} onPickTask={onPickTask} onAddReading={onAddReading}
-                def={paramDefs.find((d) => d.key === st.rem.paramKey)} />
+                def={paramDefs.find((d) => d.key === st.task.parameter)} />
             ))}
           </div>
           <p className="text-[10px] text-ink2 font-medium mt-2.5 leading-relaxed">
```

9. **data source rewired — the reminders panel's row reads V2's task label and interval**

```diff
@@ -164,8 +164,8 @@
   const Row = ({ s, tone, right }) => (
     <div className="flex items-center justify-between gap-2 py-2 border-t border-app first:border-0">
       <div className="min-w-0">
-        <div className="text-[13px] font-black text-ink truncate">{s.rem.label}</div>
-        <div className="text-[10px] font-bold text-ink2">{intervalLabel(s.rem.intervalDays)}</div>
+        <div className="text-[13px] font-black text-ink truncate">{s.task.label}</div>
+        <div className="text-[10px] font-bold text-ink2">{intervalLabel(s.task.intervalDays)}</div>
       </div>
       <div className="text-right shrink-0">{right}</div>
     </div>
```

10. **data source rewired — the needs-doing rows read V2's task vocabulary**

```diff
@@ -196,18 +196,18 @@
         <div className="mb-3">
           <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Needs doing</div>
           {view.actionable.map((s) => (
-            <div key={s.rem.id} className="py-2.5 border-t border-app first:border-0">
+            <div key={s.task.id} className="py-2.5 border-t border-app first:border-0">
               <div className="flex items-center justify-between gap-2">
                 <button className="min-w-0 text-left flex-1"
-                  onClick={() => (s.rem.kind === "test" && s.rem.paramKey ? onOpenTest(s.rem.paramKey) : onComplete(s.rem.id))}>
-                  <div className="text-[13px] font-black text-ink truncate">{s.rem.label}</div>
+                  onClick={() => (s.task.kind === "TEST" && s.task.parameter ? onOpenTest(s.task.parameter) : onComplete(s.task.id))}>
+                  <div className="text-[13px] font-black text-ink truncate">{s.task.label}</div>
                   <div className="text-[10px] font-bold" style={{ color: s.status === "overdue" ? "#A2621B" : "#0B7C86" }}>
                     {s.status === "overdue" ? `${Math.abs(s.daysOut)} day${Math.abs(s.daysOut) === 1 ? "" : "s"} overdue` : "due today"}
                   </div>
                 </button>
-                <button onClick={() => (s.rem.kind === "test" && s.rem.paramKey ? onOpenTest(s.rem.paramKey) : onComplete(s.rem.id))}
+                <button onClick={() => (s.task.kind === "TEST" && s.task.parameter ? onOpenTest(s.task.parameter) : onComplete(s.task.id))}
                   className="shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-extrabold text-white" style={{ background: "#0B7C86" }}>
-                  {s.rem.kind === "test" && s.rem.paramKey ? "Log" : "Done"}
+                  {s.task.kind === "TEST" && s.task.parameter ? "Log" : "Done"}
                 </button>
               </div>
               {/* Snooze stays as a one-tap shortcut; anything more than that
```

11. **data source rewired — the needs-doing snooze and reschedule actions read V2's task id**

```diff
@@ -214,8 +214,8 @@
                   opens the same sheet the calendar uses, so there is one way to
                   change a schedule however you got here. */}
               <div className="mt-1.5 flex items-center gap-1.5">
-                <NudgeButton onClick={() => onNudge(s.rem.id, 1 - Math.min(0, s.daysOut))} label="Snooze until tomorrow" />
-                {onPickTask && <NudgeButton onClick={() => onPickTask(s.rem.id)} label="Change schedule…" />}
+                <NudgeButton onClick={() => onNudge(s.task.id, 1 - Math.min(0, s.daysOut))} label="Snooze until tomorrow" />
+                {onPickTask && <NudgeButton onClick={() => onPickTask(s.task.id)} label="Change schedule…" />}
               </div>
             </div>
           ))}
```

12. **data source rewired — the coming-up rows read V2's task vocabulary**

```diff
@@ -226,20 +226,20 @@
         <div className="mb-3">
           <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Coming up</div>
           {view.upcoming.map((s) => (
-            <div key={s.rem.id} className="py-2 border-t border-app first:border-0">
+            <div key={s.task.id} className="py-2 border-t border-app first:border-0">
               <div className="flex items-center justify-between gap-2">
                 <button className="min-w-0 text-left flex-1"
-                  onClick={() => (s.rem.kind === "test" && s.rem.paramKey ? onOpenTest(s.rem.paramKey) : onComplete(s.rem.id))}>
-                  <div className="text-[13px] font-black text-ink truncate">{s.rem.label}</div>
+                  onClick={() => (s.task.kind === "TEST" && s.task.parameter ? onOpenTest(s.task.parameter) : onComplete(s.task.id))}>
+                  <div className="text-[13px] font-black text-ink truncate">{s.task.label}</div>
                   <div className="text-[10px] font-bold text-ink2">
-                    in {s.daysOut} day{s.daysOut === 1 ? "" : "s"} · {fmtShort(s.due)} · {intervalLabel(s.rem.intervalDays)}
+                    in {s.daysOut} day{s.daysOut === 1 ? "" : "s"} · {fmtShort(s.due)} · {intervalLabel(s.task.intervalDays)}
                   </div>
                 </button>
                 <div className="flex items-center gap-1.5 shrink-0">
-                  <button onClick={() => (s.rem.kind === "test" && s.rem.paramKey ? onOpenTest(s.rem.paramKey) : onComplete(s.rem.id))}
+                  <button onClick={() => (s.task.kind === "TEST" && s.task.parameter ? onOpenTest(s.task.parameter) : onComplete(s.task.id))}
                     className="rounded-lg border-2 px-3 py-1.5 text-[11px] font-extrabold"
                     style={{ borderColor: "#0B7C8640", color: "#0B7C86" }}>
-                    {s.rem.kind === "test" && s.rem.paramKey ? "Log" : "Done"}
+                    {s.task.kind === "TEST" && s.task.parameter ? "Log" : "Done"}
                   </button>
                 </div>
               </div>
```

13. **data source rewired — the recently-done rows key on V2's task id**

```diff
@@ -252,7 +252,7 @@
         <div>
           <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Recently done</div>
           {view.recent.map((s) => (
-            <Row key={s.rem.id} s={s} right={
+            <Row key={s.task.id} s={s} right={
               <>
                 <div className="text-[12px] font-black flex items-center gap-1 justify-end" style={{ color: "#0B7C86" }}>
                   <Check size={12} /> {s.doneToday ? "today" : fmtShort(s.lastDone)}
```

14. **data source rewired — the beyond-the-window sentence reads V2's task label**

```diff
@@ -274,7 +274,7 @@
       <p className="text-[11px] text-ink2 font-medium mt-2.5 pt-2.5 border-t border-app leading-relaxed">
         Showing what's due and what was done within {windowDays} days.
         {view.later.length > 0
-          ? ` ${view.later.length} further ${view.later.length === 1 ? "reminder falls" : "reminders fall"} beyond that — next is ${view.later[0].rem.label.toLowerCase()} on ${fmtShort(view.later[0].due)}.`
+          ? ` ${view.later.length} further ${view.later.length === 1 ? "reminder falls" : "reminders fall"} beyond that — next is ${view.later[0].task.label.toLowerCase()} on ${fmtShort(view.later[0].due)}.`
           : " Nothing falls outside it."}
       </p>
     </Card>
```

15. **chemistry removed — `StabilityStrip`, `ScoreBreakdown`, `SnoozeSheet`, `Briefing` and `OverviewCard` deleted: the tank assessment score, the headline sentence and the stability grading, all computed inside presentation components**

```diff
@@ -283,413 +283,31 @@
 
 
 /* ===========================================================================
-   StabilityStrip — the picture that replaced forty words
+   FOUR SURFACES STOOD HERE AND NONE OF THEM CROSSED
    ===========================================================================
-   The old summary described a shape in prose: "the last nine readings covered
-   a 0.7 dKH spread and is climbing steadily, so it's passing through your
-   target range rather than settling in it". This draws it.
-
-   The target range is the lit segment. The observed spread of recent readings
-   is the darker bar. Today is the dot. Where the bar sits inside the band the
-   tank is settled; where it overhangs either end, the parameter is travelling
-   through — which is the distinction the paragraph needed a whole sentence to
-   make and the eye makes instantly.
-   ========================================================================= */
-export function StabilityStrip({ def, readings }) {
-  const rows = (readings || []).filter((r) => r.param === def.key);
-  if (rows.length < 2) return null;
-  const stab = computeStability(def, readings);
-  if (!stab || stab.p05 == null || stab.p95 == null) return null;
-
-  /* The axis spans the band plus a margin, widened if the readings run past
-     it, so an excursion is visible rather than clipped at the edge. */
-  const bandW = (def.max - def.min) || 1;
-  const lo = Math.min(def.min - bandW * 0.35, stab.p05 - bandW * 0.08);
-  const hi = Math.max(def.max + bandW * 0.35, stab.p95 + bandW * 0.08);
-  /* Clamped: an excursion beyond the drawn axis used to place the marker and
-     its travel line outside the rail entirely. */
-  const at = (v) => Math.max(0, Math.min(100, ((v - lo) / ((hi - lo) || 1)) * 100));
-
-  const now = rows[rows.length - 1].value;
-  const outside = stab.p05 < def.min || stab.p95 > def.max;
-
-  /* The oldest reading in the same window the stability engine graded, so the
-     two can never tell different stories. */
-  const windowRows = rows.slice(-Math.max(2, stab.readingCount || 2));
-  const then = windowRows[0].value;
-  const travelled = Math.abs(now - then) >= (def.step || 0.01);
-
-  return (
-    <div className="strip" role="img"
-      aria-label={`${def.label}: recent readings span ${fmtVal(def, stab.p05)} to ${fmtVal(def, stab.p95)}${def.unit}, target range ${fmtVal(def, def.min)} to ${fmtVal(def, def.max)}${def.unit}`}>
-      <div className="strip-rail">
-        <div className="strip-band"
-          style={{ left: `${at(def.min)}%`, width: `${at(def.max) - at(def.min)}%`,
-                   background: def.color, opacity: 0.16 }} />
-        <div className="strip-span"
-          style={{ left: `${at(stab.p05)}%`, width: `${Math.max(1.5, at(stab.p95) - at(stab.p05))}%`,
-                   background: outside ? "#A2621B" : def.color }} />
-        {travelled && (
-          <>
-            <div className="strip-travel"
-              style={{ left: `${Math.min(at(then), at(now))}%`,
-                       width: `${Math.abs(at(now) - at(then))}%` }} />
-            <div className="strip-then" style={{ left: `${at(then)}%` }}
-              title={`${stab.readingCount} readings ago: ${fmtVal(def, then)}${def.unit}`} />
-          </>
-        )}
-        <div className="strip-now" style={{ left: `${at(now)}%` }}
-          title={`now: ${fmtVal(def, now)}${def.unit}`} />
-      </div>
-      <div className="strip-scale">
-        <span>{fmtVal(def, def.min)}</span>
-        <span className="strip-scale-mid">
-          {travelled
-            ? `${fmtVal(def, then)} \u2192 ${fmtVal(def, now)}${def.unit}`
-            : "target range"}
-        </span>
-        <span>{fmtVal(def, def.max)}</span>
-      </div>
-    </div>
-  );
-}
-
-/* ===========================================================================
-   Briefing — the summary, as a feed of claims
-   ========================================================================= */
-
-/* ===========================================================================
-   ScoreBreakdown — the score, shown working
-   ========================================================================= */
-export function ScoreBreakdown({ ex, onOpenParam }) {
-  if (!ex) return null;
-  return (
-    <div className="sb">
-      {ex.capped && (
-        <p className="sb-capped">
-          Overridden: a detectable ammonia reading caps the score regardless of
-          everything else below.
-        </p>
-      )}
-
-      {/* A parameter outside what the hobby treats as workable holds the score
-          down too. Computed but never shown, the arithmetic below simply did
-          not add up to the number on the card — which is the one thing this
-          panel exists to prevent. */}
-      {!ex.capped && ex.safetyCap != null && ex.safetyCap < ex.blended && (
-        <p className="sb-capped">
-          Held at {ex.safetyCap}: {ex.safetyLabel} is outside the range corals
-          tolerate, which caps the score whatever else reads well.
-        </p>
-      )}
-
-      <div className="sb-rows">
-        {ex.parts.map((p) => (
-          <button key={p.key} className="sb-row" onClick={() => onOpenParam(p.key)}>
-            <span className="sb-name">{p.label}</span>
-            <span className="sb-bars">
-              {/* Two bars, because the single number hid which of the two was
-                  the problem — alkalinity moves, calcium sits in the wrong
-                  place, and those need opposite responses. */}
-              <span className="sb-bar" title={`Position in range: ${p.range}`}>
-                <span className="sb-fill sb-range" style={{ width: `${p.range}%` }} />
-              </span>
-              <span className="sb-bar" title={`Steadiness: ${p.stability}`}>
-                <span className="sb-fill sb-stab" style={{ width: `${p.stability}%` }} />
-              </span>
-            </span>
-            <span className={`sb-sub ${p.sub < 70 ? "sb-low" : p.sub < 90 ? "sb-mid" : "sb-hi"}`}>{p.sub}</span>
-          </button>
-        ))}
-      </div>
+   `StabilityStrip`, `ScoreBreakdown`, `SnoozeSheet`, `Briefing` and
+   `OverviewCard` — around 400 lines — are deleted rather than ported.
 
-      <div className="sb-key">
-        <span><i className="sb-swatch sb-range" /> position in range</span>
-        <span><i className="sb-swatch sb-stab" /> steadiness</span>
-      </div>
+   `StabilityStrip` drew a spread against a band and called the result settled
+   or travelling. `Briefing` and `OverviewCard` carried the tank assessment
+   score and the headline sentence. `ScoreBreakdown` explained a number built
+   from nineteen constants that, in the salvage inventory's words, "a keeper
+   could not check against anything on screen". `SnoozeSheet` took a chemistry
+   claim and a parameter and decided how long to hide it for.
 
-      <div className="sb-maths">
-        <div className="sb-line">
-          <span>Average of all {ex.parts.length}</span><span>{ex.mean}</span>
-        </div>
-        <div className="sb-line">
-          <span>{ex.weakest.length ? `Weakest link · ${joinList(ex.weakest)}` : "Weakest link"}</span>
-          <span>{ex.worst}</span>
-        </div>
-        <div className={`sb-line ${ex.evidenceCap != null && ex.evidenceCap < ex.blended ? "" : "sb-total"}`}>
-          <span>60% average + 40% weakest</span><span>{ex.blended}</span>
-        </div>
-        {ex.evidenceCap != null && ex.evidenceCap < ex.blended && (
-          <div className="sb-line sb-total">
-            <span>Capped — only {ex.totalReadings} readings so far</span>
-            <span>{ex.evidenceCap}</span>
-          </div>
-        )}
-      </div>
+   Two separate reasons, and either would be enough:
 
-      <p className="sb-note">
-        The weakest link is weighted deliberately, so one badly-wrong parameter cannot
-        hide behind six good ones. It also means fixing a single parameter moves the
-        total only a little — the others still hold the weakest-link term down.
-      </p>
-    </div>
-  );
-}
+   The brief for this port removes the score, the "N things to look at" list
+   and the headline sentence outright — the headline "is a real feature and
+   needs engine support that does not exist; it is recorded for later and
+   absent for now".
 
+   And every one of them computed chemistry inside a presentation component,
+   which canon `X-INV-004` and `DEC-003` forbid. The salvage inventory lists
+   the whole file under "surfaces that compute chemistry — rebuild, do not
+   port", and lists the health score under `LEAVE_BEHIND` by name.
 
-/* ===========================================================================
-   SnoozeSheet — shown the first time, and when it becomes a habit
-   ===========================================================================
-   Not shown on every snooze. Putting a suggestion off is cheap and reversible,
-   and a dialog in front of a cheap reversible action is friction that teaches
-   people to dismiss dialogs. It appears twice: the first time, so the promise
-   is explicit, and again once the same suggestion has been put off three
-   times, which is the point at which the target range is more likely wrong than the
-   advice.
+   What replaced them: nothing on the dashboard, deliberately. The engine's
+   answer is on the Dosing tab in full, and each parameter card carries the one
+   notice the engine raised for it. See `docs/migration/PORT-OMISSIONS.md`.
    ========================================================================= */
-export function SnoozeSheet({ claim, param, count, onConfirm, onCancel, onOpenTargetRange }) {
-  useEscape(onCancel);
-  const habit = count >= 2;
-  return (
-    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3"
-      style={{ background: "#08191D66" }} onClick={onCancel}>
-      <div className="bg-white rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
-        <h3 className="text-base font-display text-ink mb-1">
-          {habit ? "Put this off again?" : "Put this off for now?"}
-        </h3>
-        <p className="text-[13px] text-ink2 font-medium leading-relaxed mb-3">
-          {claim}
-        </p>
-
-        <div className="rounded-xl p-3 mb-3" style={{ background: "#0B7C860D", border: "1px solid #0B7C8626" }}>
-          <div className="text-[11px] font-extrabold uppercase tracking-wide mb-1" style={{ color: "#0B7C86" }}>
-            It comes back
-          </div>
-          <p className="text-[12px] text-ink font-medium leading-relaxed">
-            As soon as you log your next {param} reading — or sooner if the
-            recommended amount changes materially. It is not switched off, just
-            not asked again until there is something new to judge it on.
-          </p>
-        </div>
-
-        {habit && (
-          /* The honest alternative. Someone content at this level does not want
-             a suppressed warning, they want a target range that matches the tank they
-             are actually keeping. */
-          <div className="rounded-xl p-3 mb-3" style={{ background: "#A2621B0D", border: "1px solid #A2621B33" }}>
-            <div className="text-[11px] font-extrabold uppercase tracking-wide mb-1" style={{ color: "#A2621B" }}>
-              You have put this off {count} times
-            </div>
-            <p className="text-[12px] text-ink font-medium leading-relaxed mb-2">
-              If you are content with {param} where it is, the target range is the thing
-              to change rather than the dose. A range you actually want beats a
-              warning you always dismiss.
-            </p>
-            {onOpenTargetRange && (
-              <Btn variant="ghost" className="w-full" onClick={onOpenTargetRange}>
-                Change the {param} target range
-              </Btn>
-            )}
-          </div>
-        )}
-
-        <div className="flex gap-2">
-          <Btn variant="ghost" className="flex-1" onClick={onCancel}>Keep showing</Btn>
-          <Btn className="flex-1" onClick={onConfirm}>Not now</Btn>
-        </div>
-      </div>
-    </div>
-  );
-}
-
-export function Briefing({ claims, readings, paramDefs, onOpenParam, onGoTo, onDismiss,
-  hiddenCount = 0, onRestoreAll, onRestoreOne, snoozeHint = false }) {
-  const [openId, setOpenId] = useState(null);
-  const [showHidden, setShowHidden] = useState(false);
-  /* Not `!claims.length` — hiding every claim is exactly when the list of
-     hidden ones has to stay reachable, and returning null there stranded
-     them. */
-  if (!claims) return null;
-  const hiddenList = claims.hidden || [];
-  if (!claims.length && !hiddenList.length) return null;
-
-  const MARK = { act: "!", warn: "\u25B2", busy: "\u25CB", watch: "\u25CF", ok: "\u2713" };
-  /* The same colours FindingList uses, so a note looks the same whether it is
-     read here or on a parameter card. */
-  const TONE_HEX = { act: "#C4285B", warn: "#A2621B", busy: "#1D6FA5", watch: "#0B7C86", ok: "#2A8050" };
-
-  return (
-    <div className="brief">
-      {claims.map((c) => {
-        const def = c.strip ? paramDefs.find((d) => d.key === c.strip.key) : null;
-        const open = openId === c.id;
-        return (
-          <div key={c.id} className={`brief-item brief-${c.tone}`}
-            style={{ background: TONE_HEX[c.tone] + "0D", borderColor: TONE_HEX[c.tone] + "33" }}>
-            {/* A claim is a pointer, not a statement: tapping it goes to the
-                place that can act on it — the dosing screen for a dose claim,
-                the parameter's own history for anything else. */}
-            <button className="brief-head"
-              onClick={() => { if (c.goto) onGoTo(c.goto); else setOpenId(open ? null : c.id); }}
-              aria-expanded={c.goto ? undefined : open}>
-              <span className="brief-mark" aria-hidden="true">{MARK[c.tone] || "\u25CF"}</span>
-              <span className="brief-claim">{c.claim}</span>
-              {c.goto && <span className="brief-go" aria-hidden="true">{"\u203A"}</span>}
-            </button>
-
-            {/* Put away, not deleted: the key carries the numbers behind the
-                claim, so a material change brings it straight back. */}
-            {c.dismissible && onDismiss && (
-              <div className="brief-actions">
-                {/* Two different promises, so they get two different words.
-                    "Hide" waits for the numbers to change; "Not now" waits for
-                    the next test, which is when there is anything new to say
-                    about a dose. */}
-                <button className="brief-hide" onClick={() => onDismiss(c)}
-                  aria-label={`${c.snoozeUntilTest ? "Not now" : "Hide"}: ${c.claim}`}>
-                  {c.snoozeUntilTest ? "Not now" : "Hide"}
-                </button>
-                <span className="brief-hint">
-                  {c.snoozeUntilTest
-                    ? "back after your next test"
-                    : "back if this changes"}
-                </span>
-              </div>
-            )}
-
-            <div className="brief-support">{c.support}</div>
-
-            {c.facts && (
-              <div className="brief-facts">
-                {c.facts.map((f, i) => <span key={i}>{f}</span>)}
-              </div>
-            )}
-
-            {def && <StabilityStrip def={def} readings={readings} />}
-
-            {def && open && (
-              <button className="brief-link" onClick={() => onOpenParam(def.key)}>
-                Open {def.label.toLowerCase()} history
-              </button>
-            )}
-          </div>
-        );
-      })}
-
-      {snoozeHint && (
-        <p className="brief-target-note">
-          Putting the same suggestion off each time usually means the target range is
-          the thing to change, not the dose — target ranges live in Setup, and a range
-          you actually want is better than a warning you always dismiss.
-        </p>
-      )}
-
-      {hiddenList.length > 0 && (
-        <div className="brief-hidden">
-          <button className="brief-restore" onClick={() => setShowHidden((v) => !v)}
-            aria-expanded={showHidden}>
-            {showHidden ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
-            {hiddenList.length === 1 ? "1 hidden note" : `${hiddenList.length} hidden notes`}
-          </button>
-
-          {showHidden && (
-            <div className="brief-hidden-list">
-              {hiddenList.map((h) => (
-                <div key={h.id} className="brief-hidden-row">
-                  <span className="brief-hidden-mark" aria-hidden="true">{MARK[h.tone] || "\u25CF"}</span>
-                  <span className="brief-hidden-claim">{h.claim}</span>
-                  {onRestoreOne && (
-                    <button className="brief-show-one" onClick={() => onRestoreOne(h)}>Show</button>
-                  )}
-                </div>
-              ))}
-              {onRestoreAll && hiddenList.length > 1 && (
-                <button className="brief-restore-all" onClick={onRestoreAll}>Show all again</button>
-              )}
-            </div>
-          )}
-        </div>
-      )}
-    </div>
-  );
-}
-
-export function OverviewCard({ overview, scoreEx, onOpenParam, claims = [], readings = [],
-  paramDefs = [], onGoTo, onDismissNote, hiddenCount = 0, onRestoreNotes,
-  onRestoreOneNote, snoozeHint = false }) {
-  const [expanded, setExpanded] = useState(false);
-  const [showMaths, setShowMaths] = useState(false);
-  const s = overview.score;
-  const scoreColor = s == null ? "#9FB0AE" : s >= 85 ? "#0B7C86" : s >= 70 ? "#2A8050" : s >= 50 ? "#A2621B" : "#C4285B";
-  return (
-    <div className="bg-white border-2 rounded-2xl p-5 mb-6 shadow-sm" style={{ borderColor: scoreColor + "40" }}>
-      <div className="flex items-start gap-4">
-        {s != null && (
-          /* The score was the one figure in the app that could not be
-             interrogated. Tapping it shows the arithmetic. */
-          <button className="shrink-0 text-center"
-            onClick={() => setShowMaths((v) => !v)}
-            aria-label="Show how the score is calculated">
-            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: scoreColor + "15", border: `2px solid ${scoreColor}` }}>
-              <span className="text-2xl font-black" style={{ color: scoreColor }}>{s}</span>
-            </div>
-            <div className="text-[9px] font-extrabold uppercase tracking-wider mt-1 text-ink2">
-              {showMaths ? "Health" : "How?"}
-            </div>
-          </button>
-        )}
-        <div className="flex-1 min-w-0">
-          <div className="text-[11px] uppercase tracking-[0.14em] font-extrabold mb-1" style={{ color: scoreColor }}>
-            Tank assessment
-          </div>
-          <h3 className="text-lg font-display text-ink leading-snug mb-2">{overview.headline}</h3>
-          {/* Collapsed by default: the headline is the answer, and most days
-              that is the whole visit. Everything behind it is one tap. */}
-        </div>
-      </div>
-
-      {/* Outside the header row: the claims, the score working and the strips
-          use the card's whole width rather than the column left over beside
-          the score tile. */}
-      <div>
-          {/* Two independent things: how the score was reached, and what the tank
-              is telling you. Tapping the score used to open both, so asking one
-              question answered a different one as well. When both are open the
-              working comes first, because it explains the number above it. */}
-          {showMaths && (
-            <>
-              <button onClick={() => setShowMaths(false)}
-                className="text-[11px] font-extrabold flex items-center gap-1 mb-2" style={{ color: scoreColor }}>
-                <ChevronUp size={12} /> Hide the score working
-              </button>
-              <ScoreBreakdown ex={scoreEx} onOpenParam={onOpenParam} />
-            </>
-          )}
-
-          {!expanded && claims.length > 0 && (
-            <button onClick={() => setExpanded(true)}
-              className="text-xs font-extrabold flex items-center gap-1 mt-1" style={{ color: scoreColor }}>
-              <ChevronDown size={13} />
-              {claims.length === 1 ? "1 thing to look at" : `${claims.length} things to look at`}
-            </button>
-          )}
-
-          {expanded && (
-            <>
-              <Briefing claims={claims} readings={readings} paramDefs={paramDefs}
-                onOpenParam={onOpenParam} onGoTo={onGoTo}
-                onDismiss={onDismissNote} hiddenCount={hiddenCount}
-                onRestoreAll={onRestoreNotes} onRestoreOne={onRestoreOneNote}
-                snoozeHint={snoozeHint} />
-
-              <button onClick={() => setExpanded(false)}
-                className="mt-1 text-xs font-extrabold flex items-center gap-1" style={{ color: scoreColor }}>
-                <ChevronUp size={13} /> Hide these
-              </button>
-            </>
-          )}
-      </div>
-
-    </div>
-  );
-}
```

---

### `app/src/components/Dashboard.jsx`

| | |
|---|---|
| V1 source | `src/components/Dashboard.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `128660561bf84a12193a3aef79ac2060b853a7407ef557c237cc0d06cb1198af` |
| V1 blob | `acff1179fce1df9ed0dc5e13ff84004207421ef3` |
| Ported SHA-256 | `529a00f8b8372501ea07aa11670b33e7c64becd372d468c6a8d7c45dd5dcd23b` |
| Differences | 11 |

1. **chemistry removed — the detail sheet's signature drops V1's settings, dose log, findings and dose state, and takes the engine's notice instead**

```diff
@@ -1,160 +1,126 @@
 import { useEffect, useMemo, useState } from 'react'
-import { Btn, FindingList, ParamCard, SectionTitle, inputCls } from './DoseExpectation.jsx'
+import { CorrectReadingSheet, ReadingList } from './CorrectReadingSheet.jsx'
+import { SheetClose } from './SheetClose.jsx'
+import { Btn, ParamCard, SectionTitle, inputCls } from './DoseExpectation.jsx'
 import { Card } from './ErrorBoundary.jsx'
 import { QuickLog } from './LogReadingSheet.jsx'
-import { OverviewCard, RemindersPanel, SnoozeSheet, TodayPanel } from './TodayPanel.jsx'
+import { RemindersPanel, TodayPanel } from './TodayPanel.jsx'
 import { ZoomableLineChart } from './ZoomableChart.jsx'
-import { AlertTriangle, ChevronDown, ChevronUp, RotateCcw, Save, Settings2, X } from '../icons.jsx'
-import { CONSUMPTION_RULES, computeElementConsumption } from '../lib/analytics/consumption.js'
-import { computeRates, rateNarrative } from '../lib/analytics/rate-analysis.js'
-import { computeControl } from '../lib/analytics/reading-meaning.js'
-import { fmtAmount, fmtVal } from '../lib/analytics/time-in-range.js'
-import { byOldest, fmtTime, windowRows } from '../lib/analytics/time-of-day.js'
-import { DEFAULT_SETTINGS, fmtFriendly } from '../lib/analytics/water-changes.js'
+import { ChevronDown, ChevronUp, RotateCcw, Save, Settings2, X } from '../icons.jsx'
+import { fmtVal } from '../lib/format.js'
 import { CalendarModal, ReminderSheet, useEscape } from '../lib/backup.jsx'
-import { addDaysFromToday, fmtShort, paramStatus, todayStr } from '../lib/dates.js'
-import { findingsFor } from '../lib/dosing/corrected-strength.js'
-import { reminderState } from '../lib/reminders.js'
-import { STABILITY_RULES } from '../lib/stability-engine.js'
+import { addDaysFromToday, fmtShort, todayStr } from '../lib/dates.js'
+import { rowsFor, untimedCount } from '../lib/adapt.js'
+import { chartGroupsFrom, currentObservationFor } from '../present/episodes.js'
+import { taskState } from '../store/schedule.js'
+import { cardContent } from '../present/card-content.js'
+import { describeRows } from '../present/spread.js'
 
 /* ---------------------------------- Dashboard ---------------------------------- */
 
-export function Dashboard({ latestByParam, dueList, alerts, readings, paramDefs, saveRange, resetRange,
-  customRanges, chartEvents, settings, doseLog, waterChanges, findings = [], icps = [],
-  reminderView, onOpenParam, onOpenTest, onCompleteReminder, onNudgeReminder,
-  remWindow = 14, setRemWindow = () => {},
-  onSetReminderDue, onSetReminderInterval, onSkipReminder, onUpdateReminder,
-  onGoTab, onDismissNote, onRestoreNotes, onRestoreOneNote, dismissedNotes = {}, tank = null,
-  onAddReading = null, reminders = [], taskLog = [], doseStates = [] }) {
-  /* Read from the app's single derivation rather than recomputing. The
-     Dashboard used to build its own overview, briefing and score working from
-     a differently-filtered findings list, which is how the box could report a
-     hidden count that did not match what was on screen. */
-  /* Rendering without the derived state is a wiring fault, not a data state —
-     an empty tank still produces a full object. Failing loudly beats a blank
-     screen with no message, which is what an undefined read would give. */
-  if (!tank) return <Card className="p-4">Tank state unavailable.</Card>;
-  const overview = tank.overview;
-  const briefing = tank.briefing;
+/* WHAT LEFT THE DASHBOARD, AND ON WHOSE SAY-SO.
 
-  /* How many of the claims this tank would produce are currently put away.
-     Recomputed from the live data rather than counted from storage, so a note
-     whose numbers have moved on is not reported as still hidden. */
-  /* Three snoozes of the same dose suggestion says the target range is wrong rather
-     than the advice. Counted from the stored keys, which carry the parameter. */
-  const snoozeHint = useMemo(() => {
-    return Object.entries(dismissedNotes || {}).some(([k, e]) =>
-      k.startsWith("dose|") && e && typeof e === "object" && (e.times || 0) >= 3);
-  }, [dismissedNotes]);
+   V1's dashboard opened with `OverviewCard`: a tank assessment score, a
+   "N things to look at" list and a headline sentence composed by
+   `narrative-engine.js`. The brief for this port removes all three. The
+   headline in particular "is a real feature and needs engine support that does
+   not exist; it is recorded for later and absent for now."
 
-  /* Reported by the engine that did the hiding, rather than recomputed here
-     from a differently-built list — the two disagreed whenever putting one
-     claim away changed what another claim said. */
-  const hiddenNotes = tank.hiddenCount;
+   The out-of-range alert strip went with them. It read `paramStatus` over every
+   parameter — the position classifier this port deleted — and there is no
+   replacement for seven of the eight parameters, because there is no engine for
+   them. Each card carries the engine's own notice instead.
 
-  const scoreEx = tank.scoreExplained;
+   `deriveTankState` in V1's `App.jsx` fed all of it: sixteen classifiers, four
+   dose engines and a stability engine, called from the app root. None of it
+   crossed. What the engine says now arrives as one `EngineResult`, and this
+   screen reads fields off it without deciding anything.
 
-  /* A claim knows where it can be acted on; this is the only place that knows
-     how to get there. */
-  const goTo = (dest) => {
-    if (!dest) return;
-    if (dest.tab === "param") onOpenParam(dest.key);
-    else if (onGoTab) onGoTab(dest.tab, dest.key);
-  };
+   All of it is in `docs/migration/PORT-OMISSIONS.md`. */
+export function Dashboard({ latestByParam, readings, paramDefs,
+  saveRange, resetRange, customRanges, chartEvents, config,
+  engineResult, assessmentState = null, scheduleView, tasks = [], completions = [],
+  onOpenParam, onOpenTest, onCompleteTask, onNudgeTask,
+  remWindow = 14, setRemWindow = () => {},
+  onSetTaskDue, onSetTaskInterval, onSkipTask, onUpdateTask,
+  onAddReading = null, waterChanges = [], episodes = null }) {
 
-  /* The last 30 days of each parameter, so the gauge can show where it has been
-     rather than only where it is. */
   const [calOpen, setCalOpen] = useState(false);
-  const [snoozing, setSnoozing] = useState(null);
 
-  /* How many times this parameter's suggestion has already been put off. */
-  const snoozeCountFor = (key) => {
-    const e = (dismissedNotes || {})[`dose|${key}`];
-    return e && typeof e === "object" && e.times ? e.times : 0;
-  };
-
-  /* The sheet appears the first time, and again once putting this off has
-     become a habit. Everywhere else the snooze is immediate — a dialog in
-     front of a cheap, reversible action only teaches people to dismiss
-     dialogs without reading them. */
-  const requestDismiss = (c) => {
-    const explained = !!(dismissedNotes || {})["__snooze-explained|" + (c.dismissKey || "")];
-    const el = c.dismissKey && c.dismissKey.startsWith("dose|") ? c.dismissKey.split("|")[1] : null;
-    const count = el ? snoozeCountFor(el) : 0;
-    if (c.snoozeUntilTest && (!explained || count >= 2)) setSnoozing({ claim: c, count, el });
-    else onDismissNote(c);
-  };
-
   /* A short tail per parameter for the card sparklines — computed once here
      rather than filtering the whole log inside each of eight cards. */
   const sparkRowsByParam = useMemo(() => {
     const m = {};
+    /* Grouped, so a repeat test is one point on the sparkline rather than
+       several — and so the last point is the figure the engine used. */
     for (const d of paramDefs) {
-      m[d.key] = readings.filter((r) => r.param === d.key).sort(byOldest).slice(-14);
+      m[d.key] = chartGroupsFrom(rowsFor(readings, d.key), episodes, (x) => x).slice(-14);
     }
     return m;
-  }, [readings, paramDefs]);
+  }, [readings, paramDefs, episodes]);
 
+  /* Where each parameter has been lately, so the range bar can show its recent
+     travel rather than only where it is now. The window is a fixed number of
+     the most recent readings rather than a number of days: a count of rows is
+     a fact about the record, where "the last 30 days" would be a cadence
+     judgement and cadences are canon's. */
   const recentRangeByParam = useMemo(() => {
     const out = {};
     for (const def of paramDefs) {
-      const rows = windowRows(readings, def.key, 30);
+      const rows = sparkRowsByParam[def.key] || [];
       if (rows.length < 2) { out[def.key] = null; continue; }
       const vals = rows.map((r) => r.value);
       out[def.key] = { lo: Math.min(...vals), hi: Math.max(...vals), n: vals.length };
     }
     return out;
-  }, [readings, paramDefs]);
+  }, [sparkRowsByParam, paramDefs]);
 
   /* The same reschedule sheet the Tasks tab uses, so a task seen on the
      dashboard calendar can be moved without navigating away. */
   const [sheetId, setSheetId] = useState(null);
-  const sheetRem = sheetId ? (reminders || []).find((r) => r.id === sheetId) : null;
-  const sheetState = sheetRem ? reminderState(sheetRem, taskLog, todayStr()) : null;
+  const sheetTask = sheetId ? (tasks || []).find((r) => r.id === sheetId) : null;
+  const sheetState = sheetTask ? taskState(sheetTask, completions, todayStr()) : null;
 
   return (
     <div>
       <SectionTitle eyebrow="Reef status" title="Dashboard" />
 
-      <OverviewCard overview={overview} scoreEx={scoreEx} onOpenParam={onOpenParam}
-        claims={briefing} readings={readings} paramDefs={paramDefs} onGoTo={goTo}
-        onDismissNote={requestDismiss} hiddenCount={hiddenNotes} onRestoreNotes={onRestoreNotes}
-        onRestoreOneNote={onRestoreOneNote} snoozeHint={snoozeHint} />
-
-      {/* Directly after the assessment: only what needs doing now. */}
-      <TodayPanel view={reminderView} onOpenTest={onOpenTest}
-        onComplete={onCompleteReminder} onNudge={onNudgeReminder} onPickTask={setSheetId}
+      {/* The due bar. Collapsed to one line, expanding into a row per due or
+          upcoming item, each of which takes its reading in place. V1's own
+          note on why: "going to another tab to type one number was the most
+          repeated friction in the app." */}
+      <TodayPanel view={scheduleView} onOpenTest={onOpenTest}
+        onComplete={onCompleteTask} onNudge={onNudgeTask} onPickTask={setSheetId}
         paramDefs={paramDefs} onAddReading={onAddReading} />
 
-      {alerts.length > 0 && (
-        <Card className="p-4 mb-6 border-rose-300">
-          <div className="flex items-center gap-2 mb-2 text-rose-800 text-sm font-extrabold">
-            <AlertTriangle size={16} /> Out of range
-          </div>
-          <div className="flex flex-wrap gap-2">
-            {alerts.map(({ def, reading }) => (
-              <span key={def.key} className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold">
-                {def.label}: {reading.value}{def.unit} ({paramStatus(def, reading.value)})
-              </span>
-            ))}
-          </div>
-        </Card>
-      )}
+      {/* Cards vary in height — some have a notice, some have no data at all —
+          so the grid items stretch and each card fills its cell. The date is
+          pushed to the bottom so it sits on one line across the row rather
+          than floating wherever the content above happens to end.
 
-      {/* Cards vary in height — some have a findings badge, some have no data at
-          all — so the grid items stretch and each card fills its cell. The date
-          is pushed to the bottom so it sits on one line across the row rather
-          than floating wherever the content above happens to end. */}
+          Alkalinity is first because it is first in the ledger's parameter
+          list, and it is a tile like the others rather than a full-width card. */}
       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8 items-stretch">
         {paramDefs.map((def) => {
-          const reading = latestByParam[def.key];
+          /* Round three, item 13: the keeper's own range and his latest
+             reading, so an unassessed parameter is placed against the two
+             numbers he typed rather than rendered grey. `def.min`/`def.max`
+             are already `keeperRange`'s answer — the one owner of "which
+             range is his". */
+          const content = cardContent(def, engineResult, assessmentState,
+            latestByParam[def.key],
+            def.min != null && def.max != null ? { min: def.min, max: def.max } : null);
+          /* The figure and the words now come from the same place. */
+          const observation = currentObservationFor(def, engineResult, episodes, latestByParam[def.key]);
           return (
-            <ParamCard key={def.key} def={def} reading={reading}
+            <ParamCard key={def.key} def={def} reading={latestByParam[def.key]}
+              observation={observation}
               recent={recentRangeByParam[def.key]}
-              stab={tank.stabilityByParam[def.key]}
-              findings={findingsFor(findings, def.key)}
+              position={content.position}
+              statusLine={content.statusLine}
+              direction={content.direction}
+              notice={content.notice}
               rows={sparkRowsByParam[def.key]}
-              dose={(doseStates || []).find((d) => d.key === def.key) || null}
               onLog={onOpenTest}
               onOpen={() => onOpenParam(def.key)} />
           );
```

2. **data source rewired — the reminders panel and calendar read V2's schedule view, tasks and completions**

```diff
@@ -162,33 +128,24 @@
       </div>
 
       <SectionTitle eyebrow="Schedule" title="Reminders" />
-      <RemindersPanel view={reminderView} windowDays={remWindow} setWindowDays={setRemWindow}
-        onOpenTest={onOpenTest} onComplete={onCompleteReminder} onNudge={onNudgeReminder}
+      <RemindersPanel view={scheduleView} windowDays={remWindow} setWindowDays={setRemWindow}
+        onOpenTest={onOpenTest} onComplete={onCompleteTask} onNudge={onNudgeTask}
+        onPickTask={setSheetId}
         onOpenCalendar={() => setCalOpen(true)} />
 
       {calOpen && (
-        <CalendarModal taskLog={taskLog} reminders={reminders} waterChanges={waterChanges}
+        <CalendarModal taskLog={completions} reminders={tasks} waterChanges={waterChanges}
           onPickTask={setSheetId}
           onClose={() => setCalOpen(false)} />
       )}
 
-      {snoozing && (
-        <SnoozeSheet
-          claim={snoozing.claim.claim}
-          param={snoozing.el || "this"}
-          count={snoozing.count}
-          onCancel={() => setSnoozing(null)}
-          onConfirm={() => { onDismissNote(snoozing.claim); setSnoozing(null); }}
-          onOpenTargetRange={snoozing.el ? () => { setSnoozing(null); onOpenParam(snoozing.el); } : null} />
-      )}
-
-      {sheetRem && (
-        <ReminderSheet rem={sheetRem} state={sheetState} onClose={() => setSheetId(null)}
-          onSetDue={(id, d) => { onSetReminderDue(id, d); setSheetId(null); }}
-          onSetInterval={(id, n) => { onSetReminderInterval(id, n); setSheetId(null); }}
-          onComplete={(id) => { onCompleteReminder(id); setSheetId(null); }}
-          onSkip={(id) => { onSkipReminder(id); setSheetId(null); }}
-          onToggleEnabled={(id, on) => { onUpdateReminder(id, { enabled: on }); setSheetId(null); }} />
+      {sheetTask && (
+        <ReminderSheet rem={sheetTask} state={sheetState} onClose={() => setSheetId(null)}
+          onSetDue={(id, d) => { onSetTaskDue(id, d); setSheetId(null); }}
+          onSetInterval={(id, n) => { onSetTaskInterval(id, n); setSheetId(null); }}
+          onComplete={(id) => { onCompleteTask(id); setSheetId(null); }}
+          onSkip={(id) => { onSkipTask(id); setSheetId(null); }}
+          onToggleEnabled={(id, on) => { onUpdateTask(id, { enabled: on }); setSheetId(null); }} />
       )}
 
     </div>
```

3. **styling token substituted — the panel and the three consumption boxes were the same pale teal as the page behind them, so nothing read as a distinct element; owner finding 10 asks for a teal page with white boxes and the consumption boxes raised in a darker teal with text chosen for the ground**

```diff
@@ -195,13 +152,44 @@
   );
 }
 
-export function ParamHistoryModal({ def, readings, onClose, onSaveRange, onResetRange, isCustom, chartEvents = [], settings = DEFAULT_SETTINGS, doseLog = [], paramDefs = [], waterChanges = [], findings = [], onAddReading = null, reminders = [], onDismissFinding = null, dose = null, onGoDosing = null }) {
+/* ---------------------------------- the parameter detail sheet ---------------------------------- */
+
+/* V1's `ParamHistoryModal`, ported, and identical for every parameter.
+
+   Three things left it, each for a stated reason.
+
+   THE WEEKLY-DRIFT ROW. Removed by the brief: "it is a trend claim and the
+   engine owns trends". V1 computed it from `computeRates` and narrated it in
+   two paragraphs; both went with it. The statistics box has two rows now, not
+   three.
+
+   THE CONSUMPTION AND DOSING BLOCK. V1's own `computeElementConsumption`
+   worked out what the tank was using and what to dose about it, inside this
+   component. That belongs in Dosing, where V2's engine says it.
+
+   `computeControl`. V1's verdict engine — a headline, a graded consistency, a
+   pattern classification, a paragraph and a proposed replacement target range,
+   all decided here. Deleted. What is left is `describeRows` in
+   `app/src/present/spread.js`: minimum, maximum, median, spread and a count
+   against the keeper's own range, with no grade and no sentence.
+
+   `docs/migration/PORT-OMISSIONS.md` records all of it. */
+export function ParamHistoryModal({ def, readings, onClose, onSaveRange, onResetRange, isCustom,
+  chartEvents = [], onAddReading = null, notice = null, onGoDosing = null,
+  onCorrectReading = null, onDeleteReading = null, episodes = null }) {
+  /* Which reading the keeper has tapped to fix. `PORT-OMISSIONS.md`: there was
+     no way to correct a mistyped reading anywhere in the build. */
+  const [fixing, setFixing] = useState(null);
   const [editing, setEditing] = useState(false);
-  const [minVal, setMinVal] = useState(String(def.min));
-  const [maxVal, setMaxVal] = useState(String(def.max));
+  const [minVal, setMinVal] = useState(def.min == null ? "" : String(def.min));
+  const [maxVal, setMaxVal] = useState(def.max == null ? "" : String(def.max));
   const [rangeMsg, setRangeMsg] = useState("");
+  const [noticeOpen, setNoticeOpen] = useState(false);
 
-  useEffect(() => { setMinVal(String(def.min)); setMaxVal(String(def.max)); }, [def.min, def.max]);
+  useEffect(() => {
+    setMinVal(def.min == null ? "" : String(def.min));
+    setMaxVal(def.max == null ? "" : String(def.max));
+  }, [def.min, def.max]);
 
   const commitRange = async () => {
     const lo = parseFloat(minVal), hi = parseFloat(maxVal);
```

4. **wording replaced with engine output — a cleared range is described as cleared rather than reverted to a default, because this build ships no default range**

```diff
@@ -215,7 +203,7 @@
 
   const revert = async () => {
     await onResetRange(def.key);
-    setRangeMsg("Reverted to default range.");
+    setRangeMsg("Range cleared.");
     setEditing(false);
     setTimeout(() => setRangeMsg(""), 2500);
   };
```

5. **chemistry removed — the four periods are one fixed set instead of being chosen by `def.freqDays`, which is a test cadence, and the rows come from the read adapter**

```diff
@@ -222,36 +210,35 @@
 
   const [winDays, setWinDays] = useState(null);
 
-  const allRows = useMemo(() =>
-    readings.filter((r) => r.param === def.key).sort(byOldest),
-  [readings, def.key]);
+  const allRows = useMemo(() => rowsFor(readings, def.key), [readings, def.key]);
 
-  /* Frequently-tested parameters get a 7-day view instead of 180d — alkalinity
-     is often tested several times a week, and "All" still covers the long view.
-     Keeping four buttons means the strip layout never changes. */
-  const WINDOWS = (def.freqDays && def.freqDays <= 3)
-    ? [[7, "7d"], [30, "30d"], [90, "90d"], [99999, "All"]]
-    : [[30, "30d"], [90, "90d"], [180, "180d"], [99999, "All"]];
+  /* Four windows, always four, so the strip's layout never changes. V1 picked
+     between two sets of windows using `def.freqDays` — a per-parameter test
+     cadence, which is chemistry and did not come across. One set is used for
+     every parameter now, and "All" still covers the long view. */
+  const WINDOWS = [[7, "7d"], [30, "30d"], [90, "90d"], [99999, "All"]];
 
-  /* One engine, one verdict per window. Showing every window at once means
-     "tight recently, wide historically" reads as a single coherent story
-     rather than two boxes appearing to disagree. */
+  const rowsInWindow = (days) => {
+    if (days >= 99999) return allRows;
+    const cutoff = addDaysFromToday(-days);
+    return allRows.filter((r) => r.date >= cutoff);
+  };
+
+  const range = def.min != null && def.max != null ? { min: def.min, max: def.max } : null;
+
+  /* Every window at once, so "tight recently, wide historically" reads as one
+     story rather than two boxes appearing to disagree. */
   const windowStats = useMemo(
-    () => WINDOWS.map(([d, label]) => ({
-      days: d, label,
-      c: computeControl(def, readings, d >= 99999 ? 100000 : d),
-    })),
-    [def, readings]);
+    () => WINDOWS.map(([d, label]) => ({ days: d, label, c: describeRows(rowsInWindow(d), range) })),
+    [allRows, def.key, def.min, def.max]);
 
-  /* Open on the shortest window that has enough readings to judge. Testing
-     cadence changes over time, so a fixed default can land on an empty view. */
+  /* Open on the shortest window that has anything in it. Testing cadence
+     changes over time, so a fixed default can land on an empty view. */
   const defaultWin = useMemo(() => {
     const usable = windowStats.find((w) => w.c);
     return usable ? usable.days : WINDOWS[1][0];
   }, [windowStats]);
 
-  /* Collapsed by default so changing the window shows the bars and the chart
-     react, rather than pushing them below prose you've already read. */
   const [detailOpen, setDetailOpen] = useState(false);
   const activeWin = winDays == null ? defaultWin : winDays;
   const winLabel = activeWin >= 99999 ? "your whole log"
```

6. **styling token substituted — the panel and the three consumption boxes were the same pale teal as the page behind them, so nothing read as a distinct element; owner finding 10 asks for a teal page with white boxes and the consumption boxes raised in a darker teal with text chosen for the ground**

```diff
@@ -260,91 +247,68 @@
 
   useEffect(() => { setWinDays(null); }, [def.key]);
 
-  // Everything below is scoped to the selected window so the stats, the chart
-  // and the verdict all describe the same slice of time.
-  const rows = useMemo(() => {
-    if (activeWin >= 99999) return allRows;
-    const cutoff = addDaysFromToday(-activeWin);
-    return allRows.filter((r) => r.date >= cutoff);
-  }, [allRows, activeWin]);
-
-
-  const control = useMemo(
-    () => computeControl(def, readings, activeWin >= 99999 ? 100000 : activeWin),
-    [def, readings, activeWin]);
-
-  const rates = useMemo(
-    () => computeRates(def, readings, activeWin >= 99999 ? 100000 : activeWin),
-    [def, readings, activeWin]);
-
-  const elementUse = useMemo(
-    () => (CONSUMPTION_RULES[def.key]
-      ? computeElementConsumption(def.key, readings, waterChanges, settings)
-      : null),
-    [def.key, readings, waterChanges, settings]);
+  /* Everything below is scoped to the selected window, so the figures and the
+     chart describe the same slice of time. */
+  const rows = useMemo(() => rowsInWindow(activeWin), [allRows, activeWin]);
+  const stats = useMemo(() => describeRows(rows, range), [rows, def.min, def.max]);
 
-  /* Dose markers are tagged with their element, so a calcium doser change
-     doesn't clutter the alkalinity chart. Untagged events (water changes,
-     lighting, ICP) remain relevant to every parameter. */
+  /* Dose markers are tagged with their parameter, so a calcium doser change
+     does not clutter the alkalinity chart. Untagged events — water changes,
+     lighting, ICP — remain relevant to every parameter. */
   const relevantEvents = useMemo(
     () => chartEvents.filter((ev) => !ev.param || ev.param === def.key),
     [chartEvents, def.key]);
 
-  /* When a day holds more than one reading, label by time so the two points
-     are distinguishable rather than both reading "10 Aug". */
-  const perDay = {};
-  for (const r of rows) perDay[r.date] = (perDay[r.date] || 0) + 1;
-  const chartData = rows.map((r) => ({
-    label: perDay[r.date] > 1 && fmtTime(r.time) ? `${fmtShort(r.date)} ${fmtTime(r.time)}` : fmtShort(r.date),
-    value: r.value, date: r.date, time: r.time,
-  }));
-  const values = rows.map((r) => r.value);
-  const latest = rows[rows.length - 1];
-  const min = values.length ? Math.min(...values) : null;
-  const max = values.length ? Math.max(...values) : null;
-  const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length) : null;
+  /* One point per TEST, not per measurement — see `present/episodes.js`. A
+     repeat test is one x-position with its measurements stacked on it. */
+  const chartData = chartGroupsFrom(rows, episodes, fmtShort);
+  const untimed = untimedCount(rows);
 
+  /* "Latest" means the same thing here as it does on the card and on Dosing:
+     the value the engine used. It read the raw last reading, so a repeat test
+     put 10.00 in this row while every word on the screen described 9.00. */
+  const latestShown = chartData.length ? chartData[chartData.length - 1].value : stats.latest;
+
   useEscape(onClose);
 
   return (
     <div className="fixed inset-0 bg-[#08191D]/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
-      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
+      {/* `relative`, so the pinned close control below has this box to sit
+          against rather than the scrolling content inside it (finding 6). */}
+      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl relative">
+        <SheetClose onClose={onClose} label={`Close ${def.label}`} />
         <Card className="p-5 max-h-[85vh] overflow-y-auto">
-          {/* Whatever the dosing wizard currently believes about this element,
-              said here too — the dashboard was previously silent about a change
-              the user had made minutes earlier. */}
-          {dose && dose.state !== "idle" && (
+
+          {/* The notice sits at the top, as V1's dose banner did, and carries
+              V2's wording: the engine's own reason code, worded by the strings
+              file. Expandable, because the strip has room for a line and the
+              engine often has more than a line to say. */}
+          {notice && (
             <div className="rounded-xl p-3 mb-4"
-              style={{ background: dose.tone + "10", border: `1px solid ${dose.tone}33` }}>
+              style={{ background: notice.tone + "10", border: `1px solid ${notice.tone}33` }}>
               <div className="text-[10px] font-extrabold uppercase tracking-wide mb-1"
-                style={{ color: dose.tone }}>
-                {dose.state === "settling" ? "Dose change settling"
-                  : dose.state === "due" ? "Waiting on a test"
-                  : dose.state === "worked" ? "Dose change complete"
-                  : dose.state === "fell-short" ? "Change didn't go far enough"
-                  : dose.state === "overshot" ? "Change went too far"
-                  : dose.state === "blocked" ? "Setup problem"
-                  /* Steady-but-out-of-range is not a dose suggestion; labelling
-                     it as one contradicted the text underneath, which says the
-                     dose is right and the level is not. */
-                  : dose.state === "off-target" ? "Level, not dose"
-                  : "Dose suggestion"}
-                {dose.stages > 1 ? ` · step ${dose.stage} of ${dose.stages}` : ""}
+                style={{ color: notice.tone }}>
+                {notice.severityWord}
               </div>
-              <div className="text-[13px] font-black text-ink mb-1">{dose.headline}</div>
-              <p className="text-[12px] text-ink font-medium leading-relaxed">{dose.detail}</p>
-              {dose.testOn && (
-                <p className="text-[12px] font-black mt-1.5" style={{ color: dose.tone }}>
-                  Next {def.label.toLowerCase()} test {fmtFriendly(dose.testOn)}
-                  {dose.expected != null ? ` — expect around ${fmtVal(def, dose.expected)}${def.unit}` : ""}
-                </p>
+              <div className="text-[13px] font-black text-ink mb-1">{notice.title}</div>
+              {noticeOpen && (
+                <p className="text-[12px] text-ink font-medium leading-relaxed">{notice.detail}</p>
               )}
-              {onGoDosing && (
-                <button onClick={onGoDosing}
-                  className="mt-2 text-[11px] font-extrabold" style={{ color: dose.tone }}>
-                  Open the dosing wizard →
+              <div className="flex items-center gap-3 mt-1.5">
+                <button onClick={() => setNoticeOpen((v) => !v)}
+                  className="text-[11px] font-extrabold" style={{ color: notice.tone }}>
+                  {noticeOpen ? "Hide detail" : "What this means"}
                 </button>
-              )}
+                {/* Only where the engine's own output identifies a dose
+                    recommendation. Anything else has no destination, and the
+                    strip is inert rather than guessing one. */}
+                {notice.goDosing && onGoDosing && (
+                  <button onClick={onGoDosing}
+                    className="text-[11px] font-extrabold" style={{ color: notice.tone }}>
+                    Open Dosing →
+                  </button>
+                )}
+              </div>
             </div>
           )}
 
```

7. **chemistry removed — the target range is stated only where the keeper has one**

```diff
@@ -353,7 +317,9 @@
               <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold mb-1">History</div>
               <h2 className="text-2xl font-display text-ink">{def.label}</h2>
               <div className="text-[11px] text-ink2 font-bold mt-0.5">
-                target range {def.min}–{def.max}{def.unit} · {rows.length} of {allRows.length} readings
+                {range
+                  ? `target range ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}${def.unit}`
+                  : "no target range set"} · {rows.length} of {allRows.length} readings
                 {isCustom && <span className="ml-1 text-teal-brand">· custom</span>}
               </div>
               <button onClick={() => setEditing((v) => !v)} className="mt-1.5 text-[11px] font-extrabold text-teal-brand flex items-center gap-1">
```

8. **styling token substituted — the panel and the three consumption boxes were the same pale teal as the page behind them, so nothing read as a distinct element; owner finding 10 asks for a teal page with white boxes and the consumption boxes raised in a darker teal with text chosen for the ground**

```diff
@@ -360,7 +326,9 @@
                 <Settings2 size={12} /> {editing ? "Cancel" : "Edit target range"}
               </button>
             </div>
-            <button aria-label="Close" onClick={onClose} className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-app"><X size={22} /></button>
+            {/* The close control is pinned outside the scroll region now, so
+                there is no second one here to scroll away. */}
+            <div className="w-9 shrink-0" />
           </div>
 
           {editing && (
```

9. **wording replaced with engine output — the range editor says what changing the range actually does in V2, which differs between the assessed parameter and the rest**

```diff
@@ -378,10 +346,16 @@
               </div>
               <div className="flex gap-2 flex-wrap">
                 <Btn onClick={commitRange} className="flex-1 sm:flex-none"><span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span></Btn>
-                {isCustom && <Btn variant="ghost" onClick={revert} className="flex-1 sm:flex-none"><span className="flex items-center justify-center gap-1.5"><RotateCcw size={13} /> Default</span></Btn>}
+                {isCustom && <Btn variant="ghost" onClick={revert} className="flex-1 sm:flex-none"><span className="flex items-center justify-center gap-1.5"><RotateCcw size={13} /> Clear</span></Btn>}
               </div>
+              {/* V1 said this changed "the in-range check, the dashboard gauge
+                  and the shaded band". Two of those three no longer exist as
+                  V1 meant them: the range is the keeper's own and governs
+                  nothing outside alkalinity, where it is an engine input. */}
               <p className="text-[11px] text-ink2 font-medium mt-2">
-                Changing this updates the in-range check, the dashboard gauge, and the shaded band on the chart. Stability scoring is unaffected — it measures how fast values move, not where they sit.
+                {def.assessed
+                  ? "This is one of the numbers the engine works from, so changing it changes what it recommends. Every assessment already stored keeps the range it was made against."
+                  : "This is your own range. It is drawn on the charts and counted in the figures above, and nothing else reads it."}
               </p>
             </div>
           )}
```

10. **chemistry removed — each period box shows the spread and the in-range count instead of V1's graded consistency and its colour**

```diff
@@ -395,20 +369,19 @@
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
               {windowStats.map(({ days, label, c }) => {
                 const active = activeWin === days;
-                const dot = c ? c.consistencyColor : "#C7D6D3";
                 return (
                   <button key={label} onClick={() => setWinDays(days)}
                     className={`text-left px-2.5 py-2 rounded-xl border-2 transition-colors ${
                       active ? "border-teal-brand bg-teal-50" : "border-app bg-white"}`}>
                     <div className="flex items-center gap-1.5">
-                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
+                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c ? def.color : "#C7D6D3" }} />
                       <span className={`text-[11px] font-extrabold ${active ? "text-teal-brand" : "text-ink"}`}>{label}</span>
                     </div>
                     <div className="text-[11px] font-bold text-ink mt-0.5 truncate">
-                      {c ? c.metricLabel : "no data"}
+                      {c ? `${fmtVal(def, c.spread)}${def.unit} spread` : "no data"}
                     </div>
                     <div className="text-[10px] font-semibold text-ink2">
-                      {c ? `${c.pct}% in range` : "\u2014"}
+                      {c ? (c.pct == null ? `${c.n} reading${c.n === 1 ? "" : "s"}` : `${c.pct}% in range`) : "—"}
                     </div>
                   </button>
                 );
```

11. **styling token substituted — the panel and the three consumption boxes were the same pale teal as the page behind them, so nothing read as a distinct element; owner finding 10 asks for a teal page with white boxes and the consumption boxes raised in a darker teal with text chosen for the ground**

```diff
@@ -417,280 +390,139 @@
           </div>
 
           {rows.length === 0 ? (
-            <div className="py-10 text-center text-ink2 font-semibold text-sm">No readings for {def.label.toLowerCase()} in this window</div>
+            <div className="py-10 text-center text-ink2 font-semibold text-sm">No readings for {def.labelMid || def.label.toLowerCase()} in this window</div>
           ) : (
             <>
-              <div className="grid grid-cols-4 gap-3 mb-5">
-                <div className="text-center min-w-0">
-                  <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">Latest</div>
-                  <div className="text-lg font-black text-ink mt-0.5 truncate">{latest.value}{def.unit}</div>
-                </div>
-                <div className="text-center min-w-0">
-                  <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">Min</div>
-                  <div className="text-lg font-black text-ink mt-0.5 truncate">{fmtVal(def, min)}{def.unit}</div>
-                </div>
-                <div className="text-center min-w-0">
-                  <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">Max</div>
-                  <div className="text-lg font-black text-ink mt-0.5 truncate">{fmtVal(def, max)}{def.unit}</div>
-                </div>
-                <div className="text-center min-w-0">
-                  <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">Median</div>
-                  <div className="text-lg font-black text-ink mt-0.5 truncate">
-                    {fmtVal(def, control ? control.p50 : avg)}{def.unit}
+              {/* OWNER FINDING 25 — THESE WERE UNREADABLE.
+
+                  Four figures across a phone, each "10.00dKH" on one line at
+                  `text-lg`, in a cell that then clipped it: the row read
+                  "10.00… 9.00d… 10.00… 9.00d…", which is worse than showing
+                  nothing because it looks like data.
+
+                  The unit moves to its own line. It is the same for all four
+                  and repeating it four times across the narrowest row in the
+                  app was what cost the digits their space. Nothing is clipped
+                  now — `truncate` is gone rather than being given more room,
+                  because a number that silently loses its last digit is a
+                  number the keeper cannot trust anywhere. */}
+              <div className="grid grid-cols-4 gap-2 mb-5">
+                {[["Latest", latestShown], ["Min", stats.min], ["Max", stats.max], ["Median", stats.median]].map(([label, v]) => (
+                  <div key={label} className="text-center min-w-0">
+                    <div className="text-[10px] text-ink2 uppercase tracking-wide font-extrabold">{label}</div>
+                    <div className="text-[17px] leading-tight font-black text-ink mt-0.5 tabular-nums">
+                      {fmtVal(def, v)}
+                    </div>
+                    {def.unit && (
+                      <div className="text-[9px] font-bold text-ink2 leading-none">{def.unit}</div>
+                    )}
                   </div>
-                </div>
+                ))}
               </div>
 
-              {control && (
-                <div className="rounded-xl p-3 mb-4" style={{ background: control.tone + "12", border: `1px solid ${control.tone}40` }}>
-                  <div className="flex items-center justify-between mb-2">
-                    <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: control.tone }}>
-                      {control.headline}
-                    </span>
-                    <span className="text-[12px] font-black text-ink">
-                      usually {fmtVal(def, control.p05)}–{fmtVal(def, control.p95)}{def.unit}
-                    </span>
+              {/* TWO ROWS. V1 had three, and the third — weekly drift — was a
+                  trend claim. Neither row here carries a grade: the spread is
+                  the spread, and the count is a count. */}
+              <div className="rounded-xl p-3 mb-4" style={{ background: def.color + "12", border: `1px solid ${def.color}40` }}>
+                <div className="flex items-center justify-between mb-2">
+                  <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: def.color }}>
+                    {winLabel}
+                  </span>
+                  <span className="text-[12px] font-black text-ink">
+                    usually {fmtVal(def, stats.p05)}–{fmtVal(def, stats.p95)}{def.unit}
+                  </span>
+                </div>
+
+                <div className="flex items-center gap-2 mb-1.5">
+                  <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Consistency</span>
+                  <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
+                    <div className="h-full rounded-full" style={{ width: "100%", background: def.color + "55" }} />
                   </div>
+                  <span className="text-[10px] font-bold w-24 text-right shrink-0" style={{ color: def.color }}>
+                    {fmtVal(def, stats.spread)}{def.unit} spread
+                  </span>
+                </div>
 
-                  {/* Where testing is frequent enough, the rate measures replace the
-                      spread row — a spread cannot tell a slow climb from a bounce. */}
-                  {rates && rates.daily ? (
-                    <>
-                      <div className="flex items-center gap-2 mb-1.5">
-                        <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Day to day</span>
-                        <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
-                          <div className="h-full rounded-full transition-all"
-                            style={{ width: `${(rates.daily.grade === "good" ? 1 : rates.daily.grade === "ok" ? 0.55 : 0.2) * 100}%`,
-                                     background: rates.daily.grade === "good" ? "#0B7C86" : rates.daily.grade === "ok" ? "#A2621B" : "#C4285B" }} />
-                        </div>
-                        <span className="text-[10px] font-bold w-24 text-right shrink-0"
-                          style={{ color: rates.daily.grade === "good" ? "#0B7C86" : rates.daily.grade === "ok" ? "#A2621B" : "#C4285B" }}>
-                          {rates.daily.value.toFixed(rates.rr.dp)} {rates.rr.unit}/day
-                        </span>
-                      </div>
-                      {rates.weekly && (
-                        <div className="flex items-center gap-2 mb-1.5">
-                          <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Weekly drift</span>
-                          <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
-                            <div className="h-full rounded-full transition-all"
-                              style={{ width: `${(rates.weekly.grade === "good" ? 1 : rates.weekly.grade === "ok" ? 0.55 : 0.2) * 100}%`,
-                                       background: rates.weekly.grade === "good" ? "#0B7C86" : rates.weekly.grade === "ok" ? "#A2621B" : "#C4285B" }} />
-                          </div>
-                          <span className="text-[10px] font-bold w-24 text-right shrink-0"
-                            style={{ color: rates.weekly.grade === "good" ? "#0B7C86" : rates.weekly.grade === "ok" ? "#A2621B" : "#C4285B" }}>
-                            {rates.weekly.value > 0 ? "+" : ""}{rates.weekly.value.toFixed(rates.rr.dp)} {rates.rr.unit}/wk
-                          </span>
-                        </div>
-                      )}
-                    </>
-                  ) : (
-                    <div className="flex items-center gap-2 mb-1.5">
-                      <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">Consistency</span>
+                {stats.pct == null ? (
+                  <div className="text-[10px] text-ink2 font-semibold mt-1">
+                    No target range set for {def.labelMid || def.label.toLowerCase()}, so there is nothing to count these against.
+                  </div>
+                ) : (
+                  <>
+                    <div className="flex items-center gap-2">
+                      <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">In range</span>
                       <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
-                        <div className="h-full rounded-full transition-all"
-                          style={{ width: `${control.consistencyScore * 100}%`, background: control.consistencyColor }} />
+                        <div className="h-full rounded-full" style={{ width: `${stats.pct}%`, background: def.color }} />
                       </div>
-                      <span className="text-[10px] font-bold w-24 text-right shrink-0" style={{ color: control.consistencyColor }}>{control.metricLabel || control.consistency}</span>
+                      <span className="text-[10px] font-bold text-ink2 w-16 text-right shrink-0">{stats.pct}%</span>
                     </div>
-                  )}
-
-                  <div className="flex items-center gap-2">
-                    <span className="text-[10px] font-extrabold uppercase text-ink2 w-20 shrink-0">In range</span>
-                    <div className="h-2 rounded-full bg-white overflow-hidden flex-1">
-                      <div className="h-full rounded-full transition-all"
-                        style={{ width: `${control.pct}%`, background: control.pct >= 85 ? "#0B7C86" : control.consistency === "tight" ? "#1D6FA5" : "#A2621B" }} />
+                    <div className="text-[10px] text-ink2 font-semibold mt-1 ml-[88px]">
+                      {stats.inRange} of {stats.n} inside your own range{stats.below > 0 && ` · ${stats.below} below`}{stats.above > 0 && ` · ${stats.above} above`}
                     </div>
-                    <span className="text-[10px] font-bold text-ink2 w-16 text-right shrink-0">{control.pct}%</span>
-                  </div>
-                  <div className="text-[10px] text-ink2 font-semibold mt-1 ml-[88px]">
-                    {control.inRange} of {control.rows} in range{control.below > 0 && ` · ${control.below} below`}{control.above > 0 && ` · ${control.above} above`}
-                  </div>
-
+                  </>
+                )}
 
-                  {/* The verdict and the bars stay visible; the explanation
-                      folds away. Changing the window should show the bars and
-                      the chart react, not push them off screen behind three
-                      paragraphs you have already read. */}
-                  <button onClick={() => setDetailOpen((v) => !v)}
-                    className="w-full flex items-center justify-center gap-1 mt-2 pt-2 border-t"
-                    style={{ borderColor: control.tone + "26" }}>
-                    <span className="text-[11px] font-extrabold" style={{ color: control.tone }}>
-                      {detailOpen ? "Hide detail" : "What this means"}
-                    </span>
-                    {detailOpen
-                      ? <ChevronUp size={12} style={{ color: control.tone }} />
-                      : <ChevronDown size={12} style={{ color: control.tone }} />}
-                  </button>
+                <button onClick={() => setDetailOpen((v) => !v)}
+                  className="w-full flex items-center justify-center gap-1 mt-2 pt-2 border-t"
+                  style={{ borderColor: def.color + "26" }}>
+                  <span className="text-[11px] font-extrabold" style={{ color: def.color }}>
+                    {detailOpen ? "Hide detail" : "Where these figures come from"}
+                  </span>
+                  {detailOpen
+                    ? <ChevronUp size={12} style={{ color: def.color }} />
+                    : <ChevronDown size={12} style={{ color: def.color }} />}
+                </button>
 
-                  {detailOpen && (<>
-                  {/* One box, both stories: where it sits, and how it is moving. */}
+                {detailOpen && (
                   <p className="text-[12px] text-ink font-medium leading-relaxed mt-2">
-                    {rates && rates.daily ? rateNarrative(def, rates, winLabel) : control.note}
-                    {(!rates || !rates.daily) && control.pattern && control.pattern !== "flat" &&
-                      ` Across these ${control.rows} readings it is ${control.pattern}.`}
-                    {control.atResolution && ` Every step was within what a ${def.label.toLowerCase()} kit can resolve, so some of this may be reading resolution rather than real movement.`}
+                    These are counted straight off your readings for {winLabel} — the spread is the
+                    highest minus the lowest, and the range count is against the two numbers you set.
+                    {def.assessed
+                      ? " What the readings mean is on the Dosing tab, where the engine says it."
+                      : " Nothing here says what they mean; there is no engine for this parameter yet."}
                   </p>
-
-                  {rates && rates.daily && (
-                    <p className="text-[12px] text-ink font-medium leading-relaxed mt-2">
-                      {(() => {
-                        const band = `${fmtVal(def, def.min)}\u2013${fmtVal(def, def.max)}${def.unit}`;
-                        const outside = control.below + control.above;
-                        const side = control.above > control.below ? "above" : "below";
-                        if (!control.medianInside) {
-                          return `As for where it sits, the typical reading is ${fmtVal(def, control.gap)}${def.unit} ${control.bias === "high" ? "above" : "below"} your ${band} target range — so it's being held steadily, just not at the level you asked for.`;
-                        }
-                        if (control.pct >= 90) {
-                          return `As for where it sits, that's right where you want it — ${control.inRange} of ${control.rows} readings landed inside ${band}.`;
-                        }
-                        if (control.pct >= 70) {
-                          return `As for where it sits, the typical reading is inside ${band}, though ${outside} of ${control.rows} strayed ${side} it. Nothing dramatic, but it spends real time outside the band rather than the occasional trip.`;
-                        }
-                        return `As for where it sits, that's marginal — only ${control.inRange} of ${control.rows} readings landed inside ${band}, with ${outside} ${side} it. The middle of the range is inside your band, so the issue is how widely it swings rather than where it's centred.`;
-                      })()}
-                    </p>
-                  )}
-
-                  {control.contextNote && (
-                    <p className="text-[12px] text-ink font-medium leading-relaxed mt-2 pt-2 border-t"
-                       style={{ borderColor: control.tone + "33" }}>
-                      {control.contextNote}
-                    </p>
-                  )}
-
-                  {rates && rates.daily && (
-                    <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-1.5">
-                      Guides: under {rates.rr.dailyGood} {rates.rr.unit} a day, and under {rates.rr.weeklyGood} {rates.rr.unit} of drift across a week.
-                    </p>
-                  )}
-                  </>)}
-
-                  {control.suggestWorth && onSaveRange && (
-                    <div className="mt-2 flex items-center justify-between gap-2">
-                      <span className="text-[12px] font-bold text-ink min-w-0">
-                        Change the target range to {fmtVal(def, control.suggested.min)}–{fmtVal(def, control.suggested.max)}{def.unit}?
-                      </span>
-                      <button onClick={() => onSaveRange(def.key, control.suggested.min, control.suggested.max)}
-                        className="text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border-2 shrink-0 bg-white"
-                        style={{ color: control.tone, borderColor: control.tone + "66" }}>
-                        Use this
-                      </button>
-                    </div>
-                  )}
-                </div>
-              )}
-
+                )}
+              </div>
 
-              {/* Logging sits between the verdict and the chart: you read where
+              {/* Logging sits between the figures and the chart: you read where
                   it stands, record the new reading, and see it land. */}
               {onAddReading && (
-                <QuickLog def={def} onAdd={onAddReading} settings={settings} reminders={reminders} />
+                <QuickLog def={def} onAdd={onAddReading} />
               )}
 
-              {/* Chart first: the stability summary above sets up what the
-                  line shows, and the callouts below interpret it. Reading a
-                  verdict before seeing the data it came from was backwards. */}
-              <ZoomableLineChart data={chartData} color={def.color} targetRangeMin={def.min} targetRangeMax={def.max} height={280} events={relevantEvents} />
-
-              {(() => {
-                const fs = findingsFor(findings, def.key);
-                if (!fs.length) return null;
-                return (
-                  <div className="mb-4">
-                    <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
-                      Notices for {def.label.toLowerCase()}
-                    </div>
-                    <FindingList items={fs} onDismiss={onDismissFinding} />
-                  </div>
-                );
-              })()}
-
-              {/* The generic dose box that used to sit here has been removed.
-                  It ran a different engine from the banner at the top of this
-                  modal — a 30-day window against the protocol's own — and the
-                  two disagreed outright: a tank steady but below range read
-                  "Correction needed" at the top and "Dose looks right" here.
-                  The banner says everything this did and reconciles with the
-                  Dosing Wizard, so one voice is left rather than two. */}
-
-              {elementUse && (
-                <div className="rounded-xl p-3 mb-4" style={{ background: "#0B7C8610", border: "1px solid #0B7C8640" }}>
-                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-teal-brand mb-2">
-                    Consumption & dosing
-                  </div>
-
-                  {elementUse.status !== "ok" ? (
-                    <p className="text-[12px] text-ink font-medium leading-relaxed">
-                      {/* "nostrength" is a refusal, not a shortage of readings.
-                          Saying "log a few more tests" would send the user off
-                          to do something that cannot fix it. */}
-                      {elementUse.status === "nostrength"
-                        ? `Enter your ${elementUse.missing} in Insights under Tank & dosing setup — it's how much ${def.label.toLowerCase()} one mL of your solution adds, and it's on your bottle. Every figure here is scaled by it, so the app won't guess: no consumption rate and no dose advice until it's set.`
-                        : elementUse.status === "tooshort"
-                        ? `${def.label} moves slowly, so this needs at least ${elementUse.minDays} days of readings before a consumption figure means anything. You've got ${elementUse.spanDays} days so far.`
-                        : `Log a few more ${def.label.toLowerCase()} tests and this will work out what the tank is actually using.`}
-                    </p>
-                  ) : !elementUse.doseConfigured ? (
-                    <>
-                      <p className="text-[12px] text-ink font-medium leading-relaxed">
-                        Over the last {elementUse.spanDays} days your {def.label.toLowerCase()} has {Math.abs(elementUse.netChange) < (STABILITY_RULES[def.key]?.noiseFloor || 0)
-                          ? "barely moved"
-                          : elementUse.netChange > 0
-                          ? `risen ${fmtAmount(Math.abs(elementUse.netChange))}${def.unit}`
-                          : `fallen ${fmtAmount(Math.abs(elementUse.netChange))}${def.unit}`}
-                        {elementUse.wcCount > 0 && `, across ${elementUse.wcCount} water ${elementUse.wcCount === 1 ? "change" : "changes"}`}.
-                      </p>
-                      <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-1.5">
-                        Enter how much {def.label.toLowerCase()} you dose each day, in Insights under Tank &amp; dosing setup, and this will turn that into an actual consumption rate.
-                      </p>
-                    </>
-                  ) : (
-                    <>
-                      {/* Two tiles, not three. The third read "Water changes
-                          +0.08 dKH" and was a term in the balance; §22 removed
-                          that term, and a tile the arithmetic no longer uses is
-                          an invitation to work out a different answer from the
-                          one shown. */}
-                      <div className="grid grid-cols-2 gap-2 mb-2">
-                        <div className="text-center min-w-0">
-                          <div className="text-[9px] text-ink2 uppercase tracking-wide font-extrabold">Dosing</div>
-                          <div className="text-sm font-black text-ink mt-0.5 truncate">{fmtAmount(elementUse.dosePerDay)}{def.unit}/day</div>
-                        </div>
-                        <div className="text-center min-w-0">
-                          <div className="text-[9px] text-ink2 uppercase tracking-wide font-extrabold">Consuming</div>
-                          <div className="text-sm font-black mt-0.5 truncate" style={{ color: elementUse.reliable ? "#0B7C86" : "#45605F" }}>
-                            {elementUse.reliable ? `${fmtAmount(elementUse.perDay)}${def.unit}/day` : "too small"}
-                          </div>
-                        </div>
-                      </div>
-
-                      <p className="text-[12px] text-ink font-medium leading-relaxed">
-                        Across {elementUse.spanDays} days you dosed about {fmtAmount(elementUse.dosed)}{def.unit} in total
-                        {elementUse.wcCount > 0
-                          ? `, across ${elementUse.wcCount} water ${elementUse.wcCount === 1 ? "change" : "changes"}`
-                          : ``}
-                        , while the tank itself {Math.abs(elementUse.netChange) < 0.005 ? "held level" : elementUse.netChange > 0 ? `rose ${fmtAmount(elementUse.netChange)}${def.unit}` : `fell ${fmtAmount(Math.abs(elementUse.netChange))}${def.unit}`}.
-                        {" "}
-                        {elementUse.reliable
-                          ? `That leaves about ${fmtAmount(elementUse.perDay)}${def.unit} a day being consumed.`
-                          : `The leftover is smaller than your test kit can reliably resolve, so there's no trustworthy consumption figure yet — ${def.label.toLowerCase()} demand is genuinely small at this scale.`}
-                        {elementUse.sparse && ` Bear in mind your readings here average ${Math.round(elementUse.avgGap)} days apart, so this is an average across long gaps rather than a close measurement.`}
-                      </p>
+              <ZoomableLineChart data={chartData} color={def.color}
+                paramName={def.label} unit={def.unit}
+                targetRangeMin={range ? def.min : null} targetRangeMax={range ? def.max : null}
+                height={280} events={relevantEvents} />
 
-                      {elementUse.reliable && elementUse.perDay < 0 && (
-                        <p className="text-[12px] text-ink font-medium leading-relaxed mt-1.5">
-                          The figure came out negative, which means more is going in than the tank uses — worth easing the dose back, or it will keep climbing.
-                        </p>
-                      )}
+              {/* ONE note, beneath the chart, and never a marker per point. The
+                  readings are drawn as ordinary points on an ordinary line
+                  because that is what they are; whether the engine can use one
+                  for a trend is the engine's business, not the chart's. */}
+              {untimed > 0 && (
+                <p className="text-[11px] text-ink2 font-medium mt-2">
+                  {untimed} of these {rows.length} readings were recorded with a date and no time.
+                </p>
+              )}
 
-                    </>
-                  )}
-                </div>
+              {/* The readings themselves, under the chart they are drawn on —
+                  which is where a keeper who has just SEEN a wrong point is
+                  already looking. `PORT-OMISSIONS.md` records the absence of
+                  this route as the most serious loss in the port. */}
+              {onCorrectReading && (
+                <ReadingList rows={[...rows].reverse()} def={def} onPick={setFixing}
+                  onDelete={onDeleteReading} />
               )}
             </>
           )}
         </Card>
       </div>
+
+      {fixing && (
+        <CorrectReadingSheet reading={fixing} def={def}
+          onCorrect={onCorrectReading} onDelete={onDeleteReading}
+          onClose={() => setFixing(null)} />
+      )}
     </div>
   );
 }
```

### `app/src/components/AllParametersSheet.jsx`

| | |
|---|---|
| V1 source | `src/components/AllParametersSheet.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `929279af7c6cc4d041fe44d0e6e5593e2d879a55ab9ab7940fe3cde1fef24e06` |
| V1 blob | `6d1264095e15729802f35a0039d9e756ca0b8fc8` |
| Ported SHA-256 | `daee6b86813e660537eca461552d2f8b5c56bd9d26a42b76e2796912681d3c38` |
| Differences | 10 |

1. **data source rewired — imports repointed onto V2's formatting, application clock and read adapter**

```diff
@@ -2,10 +2,12 @@
 import { Card } from './ErrorBoundary.jsx'
 import { ZoomableLineChart } from './ZoomableChart.jsx'
 import { Check, X } from '../icons.jsx'
-import { fmtVal } from '../lib/analytics/time-in-range.js'
-import { byNewest, byOldest, fmtTime, nowTime } from '../lib/analytics/time-of-day.js'
+import { fmtVal, fmtTime } from '../lib/format.js'
+import { nowTime } from '../lib/clock.js'
 import { useEscape } from '../lib/backup.jsx'
 import { addDaysFromToday, fmtShort, todayStr } from '../lib/dates.js'
+import { rowsFor } from '../lib/adapt.js'
+import { chartGroupsFrom, currentObservationFor } from '../present/episodes.js'
 
 /* --- Enter every parameter on one screen ---
  *
```

2. **data source rewired — the Test Lab takes V2's schedule view instead of V1's reminders and reminder view**

```diff
@@ -14,7 +16,8 @@
  * Log, move on. The date applies to all of them, since a testing session
  * happens at one sitting.
  */
-export function TestLab({ paramDefs, readings, onAdd, onOpenParam, reminders = [], reminderView = null }) {
+export function TestLab({ paramDefs, readings, onAdd, onOpenParam, scheduleView = null,
+  episodes = null, onDeleteReading = null }) {
   const [date, setDate] = useState(todayStr());
   const [time, setTime] = useState(nowTime());
   const [values, setValues] = useState({});
```

3. **data source rewired — the latest reading per parameter comes from the read adapter's ordering**

```diff
@@ -24,8 +27,8 @@
   const latest = useMemo(() => {
     const m = {};
     for (const d of paramDefs) {
-      const rows = readings.filter((r) => r.param === d.key).sort(byNewest);
-      m[d.key] = rows[0] || null;
+      const rows = rowsFor(readings, d.key);
+      m[d.key] = rows.length ? rows[rows.length - 1] : null;
     }
     return m;
   }, [readings, paramDefs]);
```

4. **data source rewired — a logged reading carries value, date and time and nothing else**

```diff
@@ -35,7 +38,7 @@
     if (raw === undefined || raw === "") return;
     const v = parseFloat(raw);
     if (!isFinite(v)) return;
-    await onAdd({ param: def.key, value: v, date, time, note: "" });
+    await onAdd({ param: def.key, value: v, date, time });
     setVal(def.key, "");
 
   };
```

5. **data source rewired — the due state reads V2's task vocabulary**

```diff
@@ -45,9 +48,9 @@
   const { sessionDue, sessionDone } = useMemo(() => {
     let due = 0, done = 0;
     for (const def of paramDefs) {
-      const st = reminderView && reminderView.states.find(
-        (x) => x.rem.paramKey === def.key && x.rem.kind === "test");
-      const rows = readings.filter((r) => r.param === def.key);
+      const st = scheduleView && scheduleView.states.find(
+        (x) => x.task.parameter === def.key && x.task.kind === "TEST");
+      const rows = rowsFor(readings, def.key);
       const testedOnDate = rows.some((r) => r.date === date);
       const wasDue = st && st.daysOut <= 0;
       if (wasDue || testedOnDate) due += 1;
```

6. **data source rewired — the session progress and the due lookup read V2's schedule view**

```diff
@@ -54,11 +57,11 @@
       if (testedOnDate) done += 1;
     }
     return { sessionDue: due, sessionDone: done };
-  }, [paramDefs, readings, date, reminderView]);
+  }, [paramDefs, readings, date, scheduleView]);
 
   const dueFor = (key) => {
-    if (!reminderView) return null;
-    const st = reminderView.states.find((x) => x.rem.paramKey === key && x.rem.kind === "test");
+    if (!scheduleView) return null;
+    const st = scheduleView.states.find((x) => x.task.parameter === key && x.task.kind === "TEST");
     return st || null;
   };
 
```

7. **wording replaced with engine output — the party emoji in the completion state replaced by the icon set's tick; the brief rules out emojis**

```diff
@@ -104,7 +107,10 @@
 
         {sessionDue > 0 && sessionDone >= sessionDue && (
           <div className="rounded-lg px-3 py-2 mb-2.5 flex items-center gap-2" style={{ background: "#0B7C8614" }}>
-            <span style={{ fontSize: 16 }}>{"\u{1F389}"}</span>
+            {/* V1 put a party emoji here. The brief: "No emojis. No green
+                tick, no confetti, no stars. Keep it professional." The
+                completion state stays; the confetti does not. */}
+            <Check size={14} strokeWidth={3} style={{ color: "#0B7C86" }} />
             <span className="text-[12px] font-extrabold" style={{ color: "#0B7C86" }}>
               Everything due today is done.
             </span>
```

8. **data source rewired — All graphs builds its series through the read adapter**

```diff
@@ -219,7 +225,7 @@
 
 /* Every chart in one place, stripped of commentary — for when you want to scan
    the tank's whole history rather than study one parameter. */
-export function AllGraphsModal({ paramDefs, readings, chartEvents, onClose, onOpenParam }) {
+export function AllGraphsModal({ paramDefs, readings, chartEvents, onClose, onOpenParam, episodes = null }) {
   useEscape(onClose);
   /* One window setting for every chart, so they're comparable at a glance —
      charts on different timescales invite the wrong conclusion. */
```

9. **defect fixed — owner finding 29: the all-graphs charts plotted every raw measurement as a separate point, so a repeat test read as several tests. They take the grouped points now.**

```diff
@@ -229,9 +235,8 @@
   const series = paramDefs
     .map((def) => ({
       def,
-      data: readings.filter((r) => r.param === def.key && (!cutoff || r.date >= cutoff))
-        .sort(byOldest)
-        .map((r) => ({ date: r.date, value: r.value, label: fmtShort(r.date), time: r.time })),
+      data: chartGroupsFrom(
+        rowsFor(readings, def.key).filter((r) => !cutoff || r.date >= cutoff), episodes, fmtShort),
     }))
     .filter((x) => x.data.length >= 2);
 
```

10. **chemistry removed — the target range is stated and shaded only where the keeper has one, and the chart is passed its unit and parameter name**

```diff
@@ -279,10 +284,15 @@
                   <span className="text-[13px] font-black text-ink truncate">{def.label}</span>
                 </span>
                 <span className="text-[11px] font-bold text-ink2 shrink-0">
-                  {fmtVal(def, data[data.length - 1].value)}{def.unit} · target range {fmtVal(def, def.min)}–{fmtVal(def, def.max)}
+                  {fmtVal(def, data[data.length - 1].value)}{def.unit}
+                  {def.min != null && def.max != null
+                    ? ` · target range ${fmtVal(def, def.min)}–${fmtVal(def, def.max)}`
+                    : ""}
                 </span>
               </button>
-              <ZoomableLineChart data={data} color={def.color} targetRangeMin={def.min} targetRangeMax={def.max}
+              <ZoomableLineChart data={data} color={def.color}
+                paramName={def.label} unit={def.unit}
+                targetRangeMin={def.min} targetRangeMax={def.max}
                 height={150} events={chartEvents.filter((ev) => !ev.param || ev.param === def.key)} />
             </Card>
           ))}
```

### `app/src/components/LogReadingSheet.jsx`

| | |
|---|---|
| V1 source | `src/components/LogReadingSheet.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `1638a9ec9cc18458cb084f1679d7b4f921fb21a8f0414d492ed5c70def543038` |
| V1 blob | `205c56b8fe0d98d88631ee5cbd789644dc45318c` |
| Ported SHA-256 | `85885009bdc3113068fba2cc597bbf4de4ea4a4dd39f9e2f7fc944b61cddb091` |
| Differences | 4 |

1. **data source rewired — the clock comes from the application's, not V1's time-of-day analytics module**

```diff
@@ -1,7 +1,7 @@
 import { useState } from 'react'
 import { Btn, Field, inputCls } from './DoseExpectation.jsx'
 import { ChevronDown, ChevronUp, Plus } from '../icons.jsx'
-import { nowTime } from '../lib/analytics/time-of-day.js'
+import { nowTime } from '../lib/clock.js'
 import { todayStr } from '../lib/dates.js'
 
 /* --- Log a reading from the parameter view ---
```

2. **data source rewired — the unused settings and reminders props removed, and the header states the brief's logging rule: value, date, time, save, and no time-provenance question**

```diff
@@ -8,20 +8,26 @@
  *
  * You often want to record a test at the moment you're looking at the trend for
  * that parameter, rather than going back to the Testing tab and re-selecting it.
- * Kept to the two fields that matter — value and date — and collapsed by
+ * Kept to the fields that matter — value, date and time — and collapsed by
  * default so it never competes with the chart for attention.
+ *
+ * FOUR ELEMENTS AND ONE BUTTON, AND NOTHING ELSE. The brief for this port is
+ * unusually specific here: "Value, date, time, save. Date and time pre-filled
+ * with now ... There is no time-provenance question. No 'how well do you know
+ * that time'. No five-way choice. Not on this screen, not in Test Lab, not
+ * anywhere." A live entry carries the device's own offset, so its provenance
+ * is `EXACT_ABSOLUTE` and there is genuinely nothing to ask. The forms that
+ * asked are gone.
  */
-export function QuickLog({ def, onAdd, settings, reminders = [] }) {
+export function QuickLog({ def, onAdd }) {
   const [open, setOpen] = useState(false);
   const [value, setValue] = useState("");
   const [date, setDate] = useState(todayStr());
   const [time, setTime] = useState(nowTime());
 
-  const linked = reminders.find((r) => r.enabled !== false && r.kind === "test" && r.paramKey === def.key);
-
   const submit = async () => {
     if (value === "") return;
-    await onAdd({ param: def.key, value: parseFloat(value), date, time, note: "" });
+    await onAdd({ param: def.key, value: parseFloat(value), date, time });
     setValue("");
     setDate(todayStr()); setTime(nowTime());
   };
```

3. **defect fixed — V1 wrote "Log a alkalinity reading"; the article now follows the word**

```diff
@@ -33,7 +39,11 @@
         <span className="flex items-center gap-1.5">
           <Plus size={13} style={{ color: def.color }} />
           <span className="text-[12px] font-extrabold" style={{ color: def.color }}>
-            Log a {def.label.toLowerCase()} reading
+            {/* "a alkalinity" is V1's own wording bug, carried by
+                `Log a {def.label.toLowerCase()}`. The article follows the word
+                rather than being assumed. */}
+            Log {/^[aeiou]/i.test(def.labelMid || def.label) ? "an" : "a"}{" "}
+            {def.labelMid || def.label.toLowerCase()} reading
           </span>
         </span>
         {open ? <ChevronUp size={14} className="text-ink2" /> : <ChevronDown size={14} className="text-ink2" />}
```

4. **chemistry removed — the placeholder falls back to nothing where the keeper has no range, instead of printing a band edge**

```diff
@@ -46,7 +56,7 @@
           <Field label={`Value (${def.unit || ""})`}>
             <input type="number" inputMode="decimal" step={def.step} value={value}
               onChange={(e) => setValue(e.target.value)} className={inputCls}
-              placeholder={String(def.min)} />
+              placeholder={def.min == null ? "" : String(def.min)} />
           </Field>
           <div className="grid grid-cols-2 gap-2 mt-2">
             <Field label="Date">
```

---

### `app/src/components/IcpPanel.jsx`

| | |
|---|---|
| V1 source | `src/components/IcpPanel.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `9e9bdc6f18895b34f018f3982b37186141e1dcc373215ba8277107f264672cc4` |
| V1 blob | `5f21591915efcb28191343a8ab4def1dc9ff8bd7` |
| Ported SHA-256 | `e80dcef5800eecf2d54edcd57cba527971ca66c405b35421d77ae760bdb8b412` |
| Differences | 7 |

1. **chemistry removed — the reference-range table and the element grouping deleted, along with the photo-compression import; the header records what left and why**

```diff
@@ -1,22 +1,33 @@
-import { useEffect, useMemo, useRef, useState } from 'react'
+import { useEffect, useMemo, useState } from 'react'
 import { Btn, Field, SectionTitle, inputCls } from './DoseExpectation.jsx'
-import { Card, DeleteButton } from './ErrorBoundary.jsx'
+import { Card } from './ErrorBoundary.jsx'
 import { ZoomableLineChart } from './ZoomableChart.jsx'
-import { Plus, Upload, X } from '../icons.jsx'
-import { ICP_GROUPS, icpRef } from '../lib/analytics/icp-reference.js'
-import { byNewest, byOldest } from '../lib/analytics/time-of-day.js'
+import { Plus, X } from '../icons.jsx'
 import { fmtDate, fmtShort, todayStr } from '../lib/dates.js'
-import { compressImage } from '../lib/image-compression.js'
 
 /* ---------------------------------- ICP Panel ---------------------------------- */
 
+/* V1's ICP entry, ported, with three things gone.
+
+   THE REFERENCE BANDS. V1 shaded every element graph against `icpRef` — a
+   table of a lab's published ranges — and wrote a sentence about what the band
+   meant. Those are band edges for twenty-odd elements, and a band edge is
+   chemistry: it comes from the canon and the canon has nothing to say about
+   any of them. `ICP_GROUPS`, which ordered the elements "the ones you manage
+   first, contaminants last", is the same judgement in a different form. Both
+   are gone; the elements are listed as they were entered.
+
+   THE PHOTO UPLOAD. Out by the brief for now — "No file upload for now" —
+   along with V1's image compression and its photo store.
+
+   `PAST RESULTS`. Out by the brief: "V1's `Past results` list is not carried —
+   the graph covers it."
+*/
+
 export function IcpPanel({ icps, onAdd, onDelete }) {
   const [date, setDate] = useState(todayStr());
   const [note, setNote] = useState("");
   const [rows, setRows] = useState([{ name: "", value: "" }]);
-  const [imgData, setImgData] = useState(null);
-  const [busy, setBusy] = useState(false);
-  const fileRef = useRef(null);
 
   const elementNames = useMemo(() => {
     const set = new Set();
```

2. **chemistry removed — `ICP_GROUPS`, which ordered elements by which ones matter, replaced by the elements as entered**

```diff
@@ -24,26 +35,11 @@
     return Array.from(set).sort();
   }, [icps]);
 
-  /* Same elements, ordered the way you'd actually look for them: the ones you
-     manage first, contaminants last. */
-  const groupedElements = useMemo(() => {
-    const remaining = new Set(elementNames);
-    const out = [];
-    for (const g of ICP_GROUPS) {
-      const found = g.members.filter((m) => remaining.has(m));
-      found.forEach((m) => remaining.delete(m));
-      if (found.length) out.push({ label: g.label, items: found });
-    }
-    if (remaining.size) out.push({ label: "Other", items: Array.from(remaining).sort() });
-    return out;
-  }, [elementNames]);
   const [graphEl, setGraphEl] = useState("");
   useEffect(() => {
-    if (graphEl || !groupedElements.length) return;
-    /* Open on something worth looking at rather than the first contaminant
-       alphabetically. */
-    setGraphEl(groupedElements[0].items[0]);
-  }, [groupedElements]);
+    if (graphEl || !elementNames.length) return;
+    setGraphEl(elementNames[0]);
+  }, [elementNames]);
 
   const updateRow = (i, field, val) => {
     const next = [...rows]; next[i] = { ...next[i], [field]: val }; setRows(next);
```

3. **data source rewired — the photo capture handler deleted; the brief removes file upload for now**

```diff
@@ -51,22 +47,8 @@
   const addRow = () => setRows([...rows, { name: "", value: "" }]);
   const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
 
-  const [fileErr, setFileErr] = useState(null);
   const [saveMsg, setSaveMsg] = useState(null);
 
-  const handleFile = async (e) => {
-    const file = e.target.files?.[0];
-    if (!file) return;
-    setBusy(true); setFileErr(null);
-    try {
-      const data = await compressImage(file);
-      setImgData(data);
-    } catch (err) {
-      setFileErr(err.message || "Could not read that image.");
-      setImgData(null);
-    } finally { setBusy(false); }
-  };
-
   const submit = async (e) => {
     e.preventDefault();
     const elements = {};
```

4. **data source rewired — a saved panel carries its date, note and elements and no image**

```diff
@@ -75,7 +57,7 @@
       setSaveMsg("Add at least one element name and value before saving.");
       return;
     }
-    const ok = await onAdd({ date, note: note.trim(), elements, image: imgData });
+    const ok = await onAdd({ date, note: note.trim(), elements });
     if (ok === false) {
       setSaveMsg("Could not save — see the message at the top of the screen.");
       return;
```

5. **data source rewired — the reset drops the image state, and the graph reads the ledger's own ordering instead of re-sorting**

```diff
@@ -82,18 +64,15 @@
     }
     setSaveMsg(`Saved ${Object.keys(elements).length} element${Object.keys(elements).length === 1 ? "" : "s"} for ${fmtDate(date)}.`);
     setTimeout(() => setSaveMsg(null), 4000);
-    setRows([{ name: "", value: "" }]); setNote(""); setImgData(null); setFileErr(null);
-    if (fileRef.current) fileRef.current.value = "";
+    setRows([{ name: "", value: "" }]); setNote("");
   };
 
+  /* `icps` arrives oldest first, in the ledger's own total order. */
   const graphData = useMemo(() => {
     return icps.filter((t) => t.elements && t.elements[graphEl] != null)
-      .sort(byOldest)
       .map((t) => ({ label: fmtShort(t.date), value: t.elements[graphEl], date: t.date }));
   }, [icps, graphEl]);
 
-  const sortedIcps = useMemo(() => [...icps].sort(byNewest), [icps]);
-
   return (
     <div>
       <SectionTitle eyebrow="Every 6 weeks" title="ICP Panel" />
```

6. **data source rewired — the report-photo field deleted**

```diff
@@ -126,20 +105,6 @@
             <button type="button" onClick={addRow} className="mt-2 text-xs font-bold text-teal-brand flex items-center gap-1"><Plus size={12} /> Add element</button>
           </div>
 
-          <div>
-            <span className="block text-xs font-bold text-ink2 mb-1.5">Report photo (optional)</span>
-            <div className="flex items-center gap-3">
-              <label className="cursor-pointer">
-                <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-app text-sm font-bold text-ink hover:border-teal-brand">
-                  <Upload size={14} /> {busy ? "processing…" : "Choose file"}
-                </span>
-                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
-              </label>
-              {imgData && <img src={imgData} alt="preview" className="h-12 w-12 object-cover rounded-md border border-app" />}
-            </div>
-          </div>
-
-          {fileErr && <p className="text-[12px] font-bold text-rose-700">{fileErr}</p>}
           {saveMsg && <p className="text-[12px] font-bold text-teal-brand">{saveMsg}</p>}
           <Btn type="submit"><span className="flex items-center gap-1.5"><Plus size={14} /> Save ICP result</span></Btn>
         </form>
```

7. **chemistry removed — the element graph draws no reference band and states why; the grouped dropdown is a flat list; V1's `Past results` list is not carried, per the brief**

```diff
@@ -152,61 +117,24 @@
             <h2 className="text-2xl font-display text-ink mb-3">Element graph</h2>
             <div className="w-full sm:w-52">
               <select value={graphEl} onChange={(e) => setGraphEl(e.target.value)} className={inputCls}>
-                {groupedElements.map((g) => (
-                  <optgroup key={g.label} label={g.label}>
-                    {g.items.map((n) => <option key={n} value={n}>{n}</option>)}
-                  </optgroup>
-                ))}
+                {elementNames.map((n) => <option key={n} value={n}>{n}</option>)}
               </select>
             </div>
           </div>
           <Card className="p-4 mb-8">
-            {(() => {
-              const gRef = icpRef(graphEl);
-              return (
-                <>
-                  <ZoomableLineChart data={graphData} color="#B8541A" height={240}
-                    targetRangeMin={gRef ? gRef.lo : null} targetRangeMax={gRef ? gRef.hi : null} />
-                  {gRef && (
-                    <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
-                      {gRef.derived
-                        ? `Shaded band is Triton's setpoint of ${gRef.setpoint} ${gRef.unit} give or take 10% — Triton publishes a single target for this element rather than a range.`
-                        : gRef.hi === 0
-                        ? `Triton's target for ${graphEl} is zero, so the band sits on the axis — anything measurable is a detection.`
-                        : `Shaded band is Triton's published range, ${gRef.lo}–${gRef.hi} ${gRef.unit}.`}
-                    </p>
-                  )}
-                  {!gRef && (
-                    <p className="text-[11px] text-ink2 font-medium mt-2">No published reference range held for {graphEl}.</p>
-                  )}
-                </>
-              );
-            })()}
+            {/* No shaded band. V1 drew one from a lab's published range per
+                element; those are band edges, band edges are chemistry, and
+                the canon states none for any element here. The trace is the
+                trace. */}
+            <ZoomableLineChart data={graphData} color="#B8541A" height={240}
+              paramName={graphEl} unit="" />
+            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
+              Every element is kept and charted. None of them is assessed, and no range is
+              shaded, because there is no reference range for any of them in this build's canon.
+            </p>
           </Card>
         </>
       )}
-
-      <SectionTitle eyebrow="History" title="Past results" />
-      <div className="space-y-3">
-        {sortedIcps.length === 0 && <Card className="px-4 py-6 text-center text-ink2 font-semibold text-sm">No ICP results logged yet</Card>}
-        {sortedIcps.map((t) => (
-          <Card key={t.id} className="p-4">
-            <div className="flex items-start justify-between mb-2">
-              <div>
-                <div className="text-sm font-black text-ink">{fmtDate(t.date)}</div>
-                {t.note && <div className="text-[11px] text-ink2 font-semibold">{t.note}</div>}
-              </div>
-              <DeleteButton onDelete={() => onDelete(t.id)} />
-            </div>
-            <div className="flex flex-wrap gap-2 mb-2">
-              {Object.entries(t.elements || {}).map(([k, v]) => (
-                <span key={k} className="text-[11px] font-bold px-2 py-1 rounded-md bg-app border border-app text-ink">{k}: {v}</span>
-              ))}
-            </div>
-            {t.image && <img src={t.image} alt="ICP report" className="mt-2 max-h-48 rounded-lg border border-app" />}
-          </Card>
-        ))}
-      </div>
     </div>
   );
 }
```

---

### `app/src/components/DosingWizard.jsx`

| | |
|---|---|
| V1 source | `src/components/DosingWizard.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `2635e7ddaf17e9e95b4c2ed28af87c1e121447640ebdd6f1f54d5cd7e2fdceae` |
| V1 blob | `95b57a94957b9192c8e05a0af2d204b6e9d2ddcc` |
| Ported SHA-256 | `a87b46d50a3dda675d0df47bed6038975bbfb1814f1168e84dbb3a2505ca3630` |
| Differences | 3 |

1. **styling token substituted — the panel and the three consumption boxes were the same pale teal as the page behind them, so nothing read as a distinct element; owner finding 10 asks for a teal page with white boxes and the consumption boxes raised in a darker teal with text chosen for the ground**

```diff
@@ -1,46 +1,59 @@
 import { useState } from 'react'
-import { Btn, FindingList, PARAM_ICON, SectionTitle } from './DoseExpectation.jsx'
-import { AlkAssessmentBlock, Card } from './ErrorBoundary.jsx'
-import { Beaker, ChevronDown, ChevronUp, X } from '../icons.jsx'
-import { fmtAmount, fmtVal } from '../lib/analytics/time-in-range.js'
-import { STATUS_COLOR, paramStatus } from '../lib/dates.js'
-import { findingsFor } from '../lib/dosing/corrected-strength.js'
+import { Btn, PARAM_ICON, SectionTitle } from './DoseExpectation.jsx'
+import { Card } from './ErrorBoundary.jsx'
+import { ZoomableLineChart } from './ZoomableChart.jsx'
+import { Beaker, ChevronDown, ChevronUp } from '../icons.jsx'
+import { fmtDate, fmtShort } from '../lib/dates.js'
+import { chartGroupsFrom } from '../present/episodes.js'
+import { fmtPotency, fmtQty } from '../lib/format.js'
+import { positionTone } from '../present/position.js'
+import {
+  PILL, boxes, correctionPanel, potencyBox, reasonRows, recommendation, spanInWords,
+  statusParts, whyPanel, working,
+} from '../present/dosing-tab.js'
+import { sayPayloadKey, sayPayloadValue, sayReason } from '../present/wording.js'
+import { t } from '../strings.js'
 
-/* ---------------------------------- Dosing Wizard ---------------------------------- */
+/* ============================================================================
+   THE DOSING TAB
+   ----------------------------------------------------------------------------
+   `17-DOSING-TAB-SPEC.md`, owner-approved line by line, with `jake`'s wording.
 
-/* A card per element, showing the verdict before it is opened. The three sit
-   side by side so the question "does anything need doing?" is answered by
-   glancing at the colours, not by reading three assessments. */
-export function DoseElementCard({ def, a, open, onToggle }) {
-  const Icon = PARAM_ICON[def.key] || Beaker;
-  const act = a ? a.action : null;
-  const tone = act === "implausible" ? "#C4285B"
-    : act === "increase" || act === "decrease" ? "#0B7C86"
-    : act === "hold" ? "#45605F" : "#5F7575";
-  const arrow = act === "increase" ? "\u2191" : act === "decrease" ? "\u2193" : null;
+   WHAT CHANGED, AND WHY IT NEEDED TO. The ported tab rendered the engine's
+   answer as a wall of labelled figures: nine `Block`s, a row per contract
+   field, and every reason code the engine emitted with its payload printed
+   underneath. On the owner's real tank that was sixty-three reason codes,
+   twenty-eight of them the same one, and the most important thing on the
+   screen — what to do about his alkalinity — was a row reading "What to do".
 
-  const headline = !a ? "Set up"
-    : act === "implausible" ? "Check setup"
-    : act === "increase" || act === "decrease"
-    ? `${fmtAmount(a.currentDose)} \u2192 ${fmtAmount(a.recommendedDose)}`
-    : "No change";
-  const sub = !a ? "needs volume and strength"
-    : act === "implausible" ? "strength looks wrong"
-    : act === "increase" || act === "decrease"
-    ? (a.staged ? "staged step" : "mL/day")
-    : a.ok ? "dose matches use" : "more readings needed";
+   This screen says it in sentences instead, in V1's shape, and puts the
+   arithmetic behind one tap.
 
-  /* A miniature of where the parameter sits in its band, so the card carries
-     the situation as well as the verdict. */
-  const pos = a && a.current && def.max > def.min
-    ? Math.max(0, Math.min(1, (a.current.value - def.min) / (def.max - def.min)))
-    : null;
+   IT STILL COMPUTES NOTHING. Canon `X-INV-004`: the domain engine owns
+   chemistry, presentation renders structured output, and "no UI component
+   independently calculates slope, dose, response class or retest time." Every
+   figure below comes from `present/dosing-tab.js`, which reads the engine's
+   fields and chooses which sentence fits. There is no threshold in this file
+   and no equation in it.
+   ========================================================================= */
 
+/* ---- the three summary boxes -------------------------------------------
+   V1's, ported. The three sit side by side so the question "does anything need
+   doing?" is answered by glancing at the colours rather than by reading three
+   assessments.
+
+   Calcium and magnesium show "No engine yet" AND NOTHING ELSE. Canon `X-002`
+   makes this build alkalinity-only; a box that also showed a last value
+   dressed up as a status would be implying an assessment nothing produced. */
+export function DoseElementCard({ def, summary, selected, onSelect }) {
+  const Icon = PARAM_ICON[def.key] || Beaker;
+  const tone = def.assessed && summary ? summary.tone : "#5F7575";
+
   return (
-    <button onClick={onToggle} className="w-full text-left">
+    <button onClick={onSelect} className="w-full text-left">
       <Card className="p-3 h-full flex flex-col overflow-hidden transition-all"
-        style={{ borderColor: open ? tone + "66" : undefined,
-                 boxShadow: open ? `0 0 0 2px ${tone}22` : undefined }}>
+        style={{ borderColor: selected ? tone + "66" : undefined,
+                 boxShadow: selected ? `0 0 0 2px ${tone}22` : undefined }}>
         <div className="flex items-center gap-1.5 mb-1.5">
           <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
             style={{ background: def.color + "22" }}>
```

2. **chemistry removed — the whole body: V1 computed the dose, the staged step and the correction offers here. The three summary boxes are V1's layout; everything inside is what V2's engine returned**

```diff
@@ -47,41 +60,21 @@
             <Icon size={11} style={{ color: def.color }} strokeWidth={2.6} />
           </span>
           <span className="text-[11px] font-black text-ink truncate flex-1 min-w-0">{def.label}</span>
-          {open ? <ChevronUp size={13} className="text-ink2 shrink-0" />
-                : <ChevronDown size={13} className="text-ink2 shrink-0" />}
         </div>
 
-        <div className="flex items-baseline gap-1">
-          {arrow && <span className="text-[13px] font-black" style={{ color: tone }}>{arrow}</span>}
-          <span className="text-[14px] font-black leading-none tabular-nums" style={{ color: tone }}>
-            {headline}
-          </span>
-        </div>
-        <div className="text-[9px] font-bold text-ink2 mt-0.5 truncate">{sub}</div>
-
-        {pos != null && (
-          <div className="mt-2">
-            <div className="h-1 rounded-full relative" style={{ background: "#E9EFEE" }}>
-              <div className="absolute rounded-full" style={{ left: 0, right: 0, top: 0, height: 4,
-                background: def.color + "33" }} />
-              <div className="absolute rounded-full"
-                style={{ left: `${pos * 100}%`, top: -2, width: 4, height: 8,
-                         background: STATUS_COLOR[paramStatus(def, a.current.value)] || def.color,
-                         transform: "translateX(-50%)" }} />
-            </div>
-            <div className="text-[9px] font-bold text-ink2 mt-1 truncate">
-              {fmtVal(def, a.current.value)}{def.unit}
-            </div>
-          </div>
-        )}
-
-        {a && a.activePlan && (
-          <div className="mt-1.5 rounded px-1.5 py-0.5 inline-block"
-            style={{ background: "#0B7C8618" }}>
-            <span className="text-[8px] font-extrabold uppercase tracking-wide" style={{ color: "#0B7C86" }}>
-              in progress
+        {def.assessed ? (
+          <>
+            <span className="text-[14px] font-black leading-none tabular-nums" style={{ color: tone }}>
+              {summary ? summary.headline : "—"}
             </span>
-          </div>
+            <span className="text-[9px] font-bold text-ink2 mt-0.5 truncate">
+              {summary ? summary.sub : ""}
+            </span>
+          </>
+        ) : (
+          <span className="text-[11px] font-bold text-ink2 leading-tight">
+            {t("dosing.summary.noEngine")}
+          </span>
         )}
       </Card>
     </button>
```

3. **styling token substituted — the panel and the three consumption boxes were the same pale teal as the page behind them, so nothing read as a distinct element; owner finding 10 asks for a teal page with white boxes and the consumption boxes raised in a darker teal with text chosen for the ground**

```diff
@@ -88,203 +81,464 @@
   );
 }
 
+/* ---- a light-teal information panel, V1's surface ---------------------- */
+/* A PANEL STANDS OUT FROM THE PAGE — owner finding 10.
 
-/* The correction control. Three states, and only one is ever on screen:
-   nothing running and the level is out of band -> offer it;
-   running -> show progress and let it be cancelled;
-   arrived -> one tap back to the maintenance dose. */
-export function CorrectionPanel({ def, state, offers, onStart, onCancel, onFinish }) {
-  /* Open on the quickest pace that is actually workable rather than a fixed
-     default. Defaulting to "steady" showed a refusal for calcium at 530 while
-     its gentle option would have brought it back in a fortnight — the panel
-     hid a working answer behind a preference. */
-  const best = ["quick", "steady", "gentle"].find((k) => offers && offers[k] && offers[k].possible);
-  const [pace, setPace] = useState(null);
-  const chosen = pace && offers && offers[pace] && offers[pace].possible ? pace : (best || "steady");
-  if (!def) return null;
-  const st = state || {};
-  const plan = st.correctionPlan;
+   It was `#F3F7F6` on a `#F3F7F6` page: the same pale teal as the ground behind
+   it, so nothing on this tab read as a distinct element and the screen looked
+   flat rather than designed. The owner's instruction is a choice between two
+   schemes — "either a white page with teal boxes, or a teal page with white
+   boxes, not teal on teal" — and the page is already the teal one, so the
+   panels are the white ones.
 
-  if (plan && st.state === "correction-done") {
-    return (
-      <Card className="p-4 mt-3" style={{ borderColor: "#0B7C8640", background: "#0B7C8608" }}>
-        <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Correction complete</div>
-        <div className="text-sm font-black text-ink">{st.headline}</div>
-        <p className="text-[12px] text-ink2 mt-1 leading-snug">{st.detail}</p>
-        <div className="flex gap-2 mt-3">
-          <Btn onClick={onFinish}>Set dose to {fmtAmount(plan.returnDose)} mL/day</Btn>
-          <Btn variant="ghost" onClick={onCancel}>Dismiss</Btn>
-        </div>
-      </Card>
-    );
-  }
+   White, a border and a soft shadow, which is the same surface `Card` uses.
+   Two definitions of "a raised surface" would drift apart, so this is deliberately
+   the same three values. */
+function Panel({ children, className = "" }) {
+  return (
+    <div className={`rounded-2xl p-3.5 bg-card border border-app shadow-[0_1px_2px_rgba(15,40,45,0.04)] ${className}`}>
+      {children}
+    </div>
+  );
+}
 
-  if (plan) {
-    const pct = plan.movedSoFar != null && plan.remaining != null
-      ? Math.max(0, Math.min(100, Math.round(plan.movedSoFar / (plan.movedSoFar + plan.remaining) * 100)))
-      : 0;
-    return (
-      <Card className="p-4 mt-3" style={{ borderColor: "#1D6FA540", background: "#1D6FA508" }}>
-        <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Correction running</div>
-        <div className="text-sm font-black text-ink">{st.headline}</div>
-        <p className="text-[12px] text-ink2 mt-1 leading-snug">{st.detail}</p>
-        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "#1D6FA520" }}>
-          <div style={{ width: `${pct}%`, height: "100%", background: "#1D6FA5" }} />
-        </div>
-        <div className="text-[10px] font-bold text-ink2 mt-1">
-          {fmtVal(def, plan.startValue)} → {fmtVal(def, plan.level)} → {fmtVal(def, plan.target)}{def.unit}
-        </div>
-        <div className="mt-3">
-          <Btn variant="ghost" onClick={onCancel}>Cancel and go back to {fmtAmount(plan.returnDose)} mL/day</Btn>
-        </div>
-      </Card>
-    );
-  }
+/* THE THREE CONSUMPTION BOXES, RAISED — owner finding 10, in his own terms:
+   "darker teal, a shadow, and text chosen for contrast against whatever ground
+   they sit on."
 
-  const offer = offers && offers[chosen];
-  if (!offer) return null;
+   They were `bg-app` on a `bg-app` page, which is why they disappeared into it.
+   They are the most-looked-at figures on the tab — what the tank uses, what the
+   dose supplies, and the difference — so they are the one surface here that is
+   deeper than the page rather than lighter than it, and they carry their own
+   shadow.
 
-  if (!offer.possible) {
-    return (
-      <Card className="p-4 mt-3" style={{ borderColor: "#A2621B40", background: "#A2621B08" }}>
-        <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Bringing it back</div>
-        <p className="text-[12px] text-ink2 leading-snug">{offer.why}</p>
-      </Card>
-    );
-  }
+   THE TEXT IS CHOSEN FOR THE GROUND, and that is not decoration. `tone` is
+   passed in by `boxes()` for a figure that carries a position colour, and a
+   position colour picked for dark text on a pale card is not legible on deep
+   teal. So a toned value keeps a pale card to sit on and an untoned one takes
+   the deep ground — rather than printing the engine's own colour on a
+   background it was never chosen against. */
+const DEEP_TEAL = "#0A6570";
 
+function Box({ label, value, sub, prose = false, tone = null }) {
+  const onDeep = !tone;
   return (
-    <Card className="p-4 mt-3">
-      <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1">Bring it back to range</div>
-      <p className="text-[12px] text-ink2 leading-snug">
-        {def.label} is {offer.up ? "below" : "above"} your band. The daily dose can walk it
-        to {fmtVal(def, offer.aimPoint)}{def.unit} if it runs {offer.up ? "above" : "below"} what
-        the tank uses for a while, then goes back.
-      </p>
-      <div className="flex gap-1.5 mt-3">
-        {["gentle", "steady", "quick"].map((k) => {
-          const o = offers[k];
-          if (!o || !o.possible) return null;
-          const on = k === chosen;
-          return (
-            <button key={k} onClick={() => setPace(k)}
-              className="flex-1 rounded-lg px-2 py-2 text-center"
-              style={{ border: `1px solid ${on ? "#0B7C86" : "#E3ECEA"}`,
-                background: on ? "#0B7C860D" : "transparent" }}>
-              <div className="text-[11px] font-black text-ink capitalize">{k}</div>
-              <div className="text-[10px] font-bold text-ink2">{o.days}d</div>
-            </button>
-          );
-        })}
+    <div className="rounded-xl p-3 border shadow-[0_2px_6px_rgba(8,25,29,0.12)] h-full"
+      style={{
+        background: onDeep ? DEEP_TEAL : "#FFFFFF",
+        borderColor: onDeep ? "#08525C" : "#E3ECEA",
+      }}>
+      <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] leading-tight"
+        style={{ color: onDeep ? "#B7E2E3" : "#45605F" }}>
+        {label}
       </div>
-      <p className="text-[11px] text-ink2 mt-2 leading-snug">
-        Dose {fmtAmount(offer.dose)} mL/day for about {offer.days} day{offer.days === 1 ? "" : "s"},
-        then back to {fmtAmount(offer.returnDose)} mL/day. You will be told when it arrives,
-        and can cancel at any point.
-      </p>
-      <div className="mt-3">
-        <Btn onClick={() => onStart(offer)}>Start the correction</Btn>
+      <div className={`${prose ? "text-[13px]" : "text-[18px] tabular-nums"} font-black mt-1 leading-tight`}
+        style={{ color: onDeep ? "#FFFFFF" : (tone || "#12312F") }}>
+        {value == null ? t("dosing.boxes.notWorkedOut") : value}
       </div>
-    </Card>
+      {sub && (
+        <div className="text-[10px] font-bold mt-0.5 leading-snug"
+          style={{ color: onDeep ? "#CDEBEB" : "#45605F" }}>
+          {sub}
+        </div>
+      )}
+    </div>
   );
 }
 
-export function DosingWizard({ paramDefs, alkAssessment, caAssessment, mgAssessment, findings = [],
-  onDismissFinding, onApplyAlkDose, onApplyCaDose, onApplyMgDose,
-  onClearAlkPlan, onClearCaPlan, onClearMgPlan,
-  onLogCorrection, onApplyEffect, onApplyCaEffect, onApplyMgEffect,
-  correctionOffers = {}, doseStates = [],
-  onStartCorrection, onCancelCorrection, onFinishCorrection }) {
+/* ---- the severity pill -------------------------------------------------
+   `INFO`, `LIMITING` and `BLOCKING` are programming language and meant nothing
+   to a reef keeper. `jake`'s names answer the question the keeper actually
+   has — what did this do to the answer? — and they render as pills rather than
+   as coloured text with a dot beside it. */
+const PILL_STYLE = {
+  REFUSAL: { bg: "#FBE9EF", fg: "#C4285B" },
+  BLOCKING: { bg: "#FBE9EF", fg: "#C4285B" },
+  GATING: { bg: "#FBF1E4", fg: "#A2621B" },
+  LIMITING: { bg: "#FBF1E4", fg: "#A2621B" },
+  INFO: { bg: "#EDF3F2", fg: "#45605F" },
+};
 
-  const items = [
-    { key: "alkalinity", a: alkAssessment, apply: onApplyAlkDose, clear: onClearAlkPlan, effect: onApplyEffect },
-    { key: "calcium", a: caAssessment, apply: onApplyCaDose, clear: onClearCaPlan, effect: onApplyCaEffect },
-    { key: "magnesium", a: mgAssessment, apply: onApplyMgDose, clear: onClearMgPlan, effect: onApplyMgEffect },
-  ];
+function Pill({ severity }) {
+  const st = PILL_STYLE[severity] || PILL_STYLE.INFO;
+  return (
+    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
+      style={{ background: st.bg, color: st.fg }}>
+      {t(PILL[severity] || "dosing.pill.info")}
+    </span>
+  );
+}
 
-  /* Opens on whichever element actually wants attention, so the common case
-     needs no navigation at all. */
-  const firstNeeding = items.find((x) => x.a && (x.a.action === "increase" || x.a.action === "decrease"));
-  const [openKey, setOpenKey] = useState(firstNeeding ? firstNeeding.key : null);
+/* ---- show working ------------------------------------------------------
+   EXPANDS IN PLACE, collapsed by default. Not a sheet: the number being
+   explained stays visible while the explanation is read.
 
-  const needing = items.filter((x) => x.a && (x.a.action === "increase" || x.a.action === "decrease")).length;
-  const active = items.find((x) => x.key === openKey);
-  const activeDef = active ? paramDefs.find((d) => d.key === active.key) : null;
+   The button reads "Show working" where the app can state something and
+   "Why?" where it cannot — the second is a different promise and the label
+   should not pretend otherwise. */
+function ShowWorking({ result, config, canExplain }) {
+  const [open, setOpen] = useState(false);
+  const sections = canExplain ? working(result, config) : [];
+  const why = canExplain ? [] : whyPanel(result);
+  const rows = reasonRows(result);
 
   return (
-    <div>
-      <SectionTitle eyebrow="Two-part" title="Dosing Wizard" />
+    <div className="mt-2">
+      <button onClick={() => setOpen((v) => !v)}
+        className="flex items-center gap-1 text-[12px] font-extrabold text-teal-brand">
+        {canExplain ? t("dosing.reco.showWorking") : t("dosing.reco.why")}
+        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
+      </button>
 
-      <div className="rounded-2xl p-3.5 mb-4"
-        style={{ background: needing ? "#0B7C860F" : "#F3F7F6",
-                 border: `1px solid ${needing ? "#0B7C8633" : "#E3ECEA"}` }}>
-        <p className="text-[13px] text-ink font-medium leading-relaxed">
-          {needing
-            ? `${needing === 1 ? "One element looks" : `${needing} elements look`} like the dose no longer matches what the tank is using. Tap one below for the working — you set the amount yourself.`
-            : "Every dose is currently matching what the tank uses. Nothing needs changing."}
+      {open && (
+        <div className="mt-2 rounded-xl border border-app p-3">
+          {sections.map((s) => (
+            <div key={s.title} className="mb-3 last:mb-0">
+              <h5 className="text-[12px] font-black text-ink mb-1">{s.title}</h5>
+              {s.lines.map((line, i) => (
+                <p key={i} className="text-[12px] text-ink font-medium leading-relaxed mb-1 last:mb-0">
+                  {line}
+                </p>
+              ))}
+            </div>
+          ))}
+
+          {why.map((line, i) => (
+            <p key={i} className="text-[12px] text-ink font-medium leading-relaxed">{line}</p>
+          ))}
+
+          {/* The reason codes sit LAST and inside the working. Never on the
+              face of the screen, never in a notification strip. Identical
+              codes are already collapsed to one row with a count, and INFO
+              codes that carry no calculation never got here at all. */}
+          {rows.length > 0 && (
+            <div className="mt-3 pt-2 border-t border-app">
+              {rows.map((r) => (
+                <div key={r.code} className="py-1.5">
+                  <div className="flex items-center gap-1.5 mb-1">
+                    <Pill severity={r.severity} />
+                    {r.count > 1 && (
+                      <span className="text-[10px] font-extrabold text-ink2">× {r.count}</span>
+                    )}
+                  </div>
+                  <p className="text-[12px] text-ink font-medium leading-relaxed">{sayReason(r.code)}</p>
+                </div>
+              ))}
+            </div>
+          )}
+        </div>
+      )}
+    </div>
+  );
+}
+
+/* ---- correction in progress --------------------------------------------
+   V1's panel, above the recommendation. THERE IS NO CANCEL LINK: a correction
+   is a fact about what the keeper did, not a mode he is in. It ends when the
+   app determines the dose has settled, or when a new dose change starts a new
+   one — and the panel says so rather than offering to undo a thing that
+   already happened. */
+/* THE CHANGE YOU MADE, AND WHAT CAME OF IT.
+
+   Finding 12. It renders `correctionPanel()`'s output and holds no rule: which
+   state applies, whether the engine has finished with it, and whether a test is
+   due now are all decided in `present/dosing-tab.js` from what the engine said.
+   This component chooses a sentence per state and draws a button. */
+function CorrectionPanel({ result, asOf, dismissed, onDismiss }) {
+  const p = correctionPanel(result, asOf);
+  if (!p) return null;
+  if (p.canDismiss && dismissed === p.signature) return null;
+
+  const stateLine =
+    p.state === "tooEarly"
+      ? (p.posts != null ? t("dosing.correction.tooEarly", { posts: p.posts })
+                         : t("dosing.correction.tooEarlyPlain"))
+      : t(`dosing.correction.${p.state}`);
+
+  return (
+    <Panel className="mb-3">
+      <h4 className="text-[13px] font-black text-ink mb-1">{t("dosing.correction.title")}</h4>
+      {p.from != null && p.to != null && (
+        <p className="text-[12px] text-ink font-medium leading-relaxed">
+          {t("dosing.correction.body", {
+            date: fmtDate(p.changedOn),
+            from: fmtQty(p.from, "mlPerDay"),
+            to: fmtQty(p.to, "mlPerDay"),
+          })}
         </p>
+      )}
+
+      <p className="text-[12px] text-ink font-bold leading-relaxed mt-1">{stateLine}</p>
+
+      {/* The next test, and never as a date the keeper has already met. */}
+      {!p.terminal && p.nextTest && (
+        <p className="text-[12px] text-ink font-medium leading-relaxed mt-1">
+          {p.nextTest.now
+            ? t("dosing.correction.nextTestNow")
+            : t("dosing.correction.nextTest", { date: fmtDate(String(p.nextTest.at).slice(0, 10)) })}
+        </p>
+      )}
+
+      {p.offersNewDose && (
+        <p className="text-[12px] text-ink font-medium leading-relaxed mt-1">
+          {t("dosing.correction.newDose", { dose: fmtQty(p.recommendedDose, "mlPerDay") })}
+        </p>
+      )}
+
+      {p.canDismiss ? (
+        <button
+          onClick={() => onDismiss && onDismiss(p.signature)}
+          className="w-full mt-2.5 rounded-xl py-2 text-[12px] font-extrabold text-teal-brand border-2 border-app">
+          {t("dosing.correction.close")}
+        </button>
+      ) : (
         <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-1.5">
-          Each element is judged only on readings taken since its own dose last changed. Change one thing
-          at a time, and give it the time stated before judging it.
+          {t("dosing.correction.ends")}
         </p>
+      )}
+    </Panel>
+  );
+}
+
+/* ---- the chart ---------------------------------------------------------
+   7 and 14 day tabs. NO DOTTED MARKERS AND NO "NOT ELIGIBLE" LEGEND: every
+   reading is an ordinary point on an ordinary line, because that is what it
+   is. Which readings the engine could use is the engine's statement and it
+   belongs in the working, where it is named in words — a second, weaker
+   version of it drawn on the chart is exactly the duplicate ownership
+   `MASTER RULE 1` forbids. */
+function DosingChart({ def, rows, chartEvents, episodes = null }) {
+  const [days, setDays] = useState(7);
+  const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
+  const shown = rows.filter((r) => r.date >= cutoff);
+
+  /* THE DATES AND THE DOSE-CHANGE MARKERS — owner finding 9, and one cause.
+
+     This built its own point shape: `{ i, value, date, time }`. The chart's
+     x-axis is `dataKey="label"` and its event markers place themselves by
+     matching an event's date to a point's `label`. Neither could find one, so
+     the axis drew no dates and the owner's four imported dose changes drew
+     nothing — on a chart that was already being handed them.
+
+     `chartGroupsFrom` is the shape every other chart in the app uses, and it
+     is where the point rule lives: one x-position per TEST, with the
+     measurements of a repeat test stacked on it rather than spread along the
+     axis as if they were separate tests. Building a second point shape here
+     was the defect; there is one now. */
+  const data = chartGroupsFrom(shown, episodes, fmtShort);
+
+  return (
+    <div className="mb-4">
+      <div className="flex gap-1.5 mb-2" role="group" aria-label={t("dosing.graph.aria")}>
+        {[[7, t("dosing.graph.7")], [14, t("dosing.graph.14")]].map(([d, label]) => (
+          <button key={d} onClick={() => setDays(d)}
+            className="rounded-lg px-3 py-1.5 text-[11px] font-extrabold border-2"
+            style={{ borderColor: days === d ? def.color : "#E3ECEA",
+                     color: days === d ? def.color : "#45605F" }}>
+            {label}
+          </button>
+        ))}
       </div>
+      <ZoomableLineChart data={data} color={def.color} paramName={def.label} unit={def.unit}
+        targetRangeMin={def.min} targetRangeMax={def.max} height={220} events={chartEvents} />
+    </div>
+  );
+}
 
+/* YOUR SOLUTION'S REAL STRENGTH — finding 13, owner-approved.
+
+   Renders `potencyBox()` and holds no rule: which sentence applies, whether the
+   estimate is confident enough to act on and whether the two figures agree are
+   all decided in `present/dosing-tab.js` from what the engine said.
+
+   THE TWO BUTTONS ARE THE WHOLE POINT AND THEY ARE NEVER PRE-PRESSED. Neither
+   is styled as the safe one, because neither is: the keeper's own figure may be
+   right and so may the tank's. Where the box does not offer them, nothing has
+   changed and nothing needs his attention. */
+function PotencyBox({ box, onAccept, onKeep }) {
+  const [open, setOpen] = useState(false);
+  const args = {
+    learned: box.learned == null ? "—" : fmtPotency(box.learned),
+    entered: fmtPotency(box.entered),
+    accepted: fmtPotency(box.entered),
+  };
+
+  return (
+    <Panel>
+      <h4 className="text-[13px] font-black text-ink mb-1">{t("dosing.potency.title")}</h4>
+
+      <p className="text-[12px] text-ink font-medium leading-relaxed">
+        {box.asksAgain ? t("dosing.potency.asksAgain", args) : t(`dosing.potency.${box.state}`, args)}
+      </p>
+
+      {/* Where the figure in use came from, once there is more than one place
+          it could have come from. The same line Setup shows. */}
+      {box.provenance && (
+        <p className="text-[11px] font-bold text-teal-brand leading-relaxed mt-1.5">
+          {t(box.provenance.key, {
+            value: fmtPotency(box.provenance.value),
+            date: fmtDate(box.provenance.date),
+          })}
+        </p>
+      )}
+
+      {box.working.length > 0 && (
+        <div className="mt-2">
+          <button onClick={() => setOpen((v) => !v)}
+            className="flex items-center gap-1 text-[12px] font-extrabold text-teal-brand">
+            {t("dosing.reco.showWorking")}
+            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
+          </button>
+          {open && (
+            <div className="mt-2 rounded-xl border border-app p-3">
+              {box.working.map((line, i) => (
+                <p key={i} className="text-[12px] text-ink font-medium leading-relaxed mb-1 last:mb-0">
+                  {line}
+                </p>
+              ))}
+              {box.limits.length > 0 && (
+                <div className="mt-3">
+                  <h5 className="text-[12px] font-black text-ink mb-1">{t("dosing.potency.limitsHead")}</h5>
+                  {box.limits.map((r) => (
+                    <p key={r.code} className="text-[12px] text-ink2 font-medium leading-relaxed mb-1 last:mb-0">
+                      {sayReason(r.code)}
+                    </p>
+                  ))}
+                </div>
+              )}
+            </div>
+          )}
+        </div>
+      )}
+
+      {box.offersChoice && (
+        <div className="flex gap-2 mt-3">
+          <button
+            className="flex-1 rounded-xl py-2 text-[12px] font-extrabold text-white bg-teal-brand"
+            onClick={() => onAccept && onAccept(box.learned)}>
+            {t("dosing.potency.useMeasured")}
+          </button>
+          <button
+            className="flex-1 rounded-xl py-2 text-[12px] font-extrabold text-teal-brand border-2 border-app"
+            onClick={() => onKeep && onKeep(box.learned)}>
+            {t("dosing.potency.keepEntered")}
+          </button>
+        </div>
+      )}
+    </Panel>
+  );
+}
+
+/* ---- the tab ------------------------------------------------------------ */
+export function DosingWizard({ paramDefs, engineResult, summaries = {}, latestByParam = {},
+  config = null, readings = [], chartEvents = [], onChangeDoseAnyway = null,
+  asOf = null, correctionDismissed = null, onDismissCorrection = null,
+  onAcceptPotency = null, onKeepPotency = null, episodes = null }) {
+
+  const KEYS = ["ALK", "CA", "MG"];
+  const items = KEYS.map((key) => ({ key, def: paramDefs.find((d) => d.key === key) })).filter((x) => x.def);
+  const [selected, setSelected] = useState("ALK");
+  const active = items.find((x) => x.key === selected) || items[0];
+  const def = active ? active.def : null;
+
+  const rows = readings.filter((r) => def && r.param === def.key);
+  const latest = def ? latestByParam[def.key] : null;
+  const assessed = def && def.assessed && engineResult;
+
+  const status = assessed ? statusParts(engineResult) : null;
+  const rec = assessed ? recommendation(engineResult, rows.length) : null;
+  const three = assessed ? boxes(engineResult) : null;
+  const potency = assessed ? potencyBox(engineResult, config) : null;
+
+  return (
+    <div>
+      <SectionTitle eyebrow="Two-part" title="Dosing" />
+
       <div className="grid grid-cols-3 gap-2 mb-4 items-stretch">
-        {items.map(({ key, a }) => {
-          const def = paramDefs.find((d) => d.key === key);
-          if (!def) return null;
-          return (
-            <DoseElementCard key={key} def={def} a={a} open={openKey === key}
-              onToggle={() => setOpenKey(openKey === key ? null : key)} />
-          );
-        })}
+        {items.map(({ key, def: d }) => (
+          <DoseElementCard key={key} def={d} summary={summaries[key] || null}
+            selected={selected === key} onSelect={() => setSelected(key)} />
+        ))}
       </div>
 
-      {active && activeDef && (
-        <Card key={active.key} className="p-4">
-          <div className="flex items-center gap-2 mb-3">
-            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activeDef.color }} />
-            <span className="text-[15px] font-black text-ink flex-1">{activeDef.label}</span>
-            <button onClick={() => setOpenKey(null)} aria-label="Close"
-              className="text-ink2 p-1 -m-1"><X size={16} /></button>
-          </div>
-          {active.a ? (
-            <AlkAssessmentBlock a={active.a} def={activeDef} onApplyDose={active.apply}
-              onClearPlan={active.clear}
-              onLogCorrection={onLogCorrection ? ((ml, dir) => onLogCorrection(ml, dir, active.key)) : null}
-              onApplyEffect={active.effect} />
-          ) : (
-            <p className="text-[13px] text-ink2 font-medium leading-relaxed">
-              Set your tank volume, this element's daily dose and its solution strength in Setup, and log a
-              few readings — the assessment will appear here.
+      {!def ? null : !def.assessed ? (
+        <Panel>
+          <p className="text-[13px] text-ink font-medium leading-relaxed">
+            There is no {def.labelMid || def.label.toLowerCase()} engine in this build. Readings are
+            logged, charted and scheduled exactly as alkalinity's are, and none of them is assessed.
+            Nothing here will guess at a dose, because a dose is chemistry and chemistry comes from
+            the canon.
+          </p>
+        </Panel>
+      ) : !engineResult ? (
+        <Panel>
+          <p className="text-[13px] text-ink font-medium leading-relaxed">
+            {t("dosing.fresh.sentence")}
+          </p>
+        </Panel>
+      ) : (
+        <>
+          {/* ONE WIDE BOX, spanning both columns. Four rows that used to be
+              separate — where it sits, the latest reading, which way it is
+              going, and when it was measured — said as one line in which every
+              phrase names its own subject. Safety is gone from here: it is
+              redundant with position, and it rendered in red, which read as an
+              alarm for good news. */}
+          <Panel className="mb-3">
+            <p className="text-[15px] font-black text-ink leading-snug"
+              style={{ color: positionTone(engineResult.position) }}>
+              {status ? t("dosing.status.join", { parts: status }) : t("dosing.status.noReading")}
             </p>
+            <p className="text-[11px] font-bold text-ink2 mt-1">
+              {latest
+                ? latest.time
+                  ? t("dosing.status.measured", { date: fmtDate(latest.date), time: latest.time })
+                  : t("dosing.status.measuredDateOnly", { date: fmtDate(latest.date) })
+                : t("dosing.status.noReadingSub")}
+            </p>
+          </Panel>
+
+          <CorrectionPanel result={engineResult} asOf={asOf}
+            dismissed={correctionDismissed} onDismiss={onDismissCorrection} />
+
+          {/* THE RECOMMENDATION. The most important thing on the screen, and it
+              reads as sentences. */}
+          {rec && (
+            <Card className="p-4 mb-4">
+              <h3 className="text-[17px] font-black text-ink leading-tight mb-1.5">{rec.head}</h3>
+              <p className="text-[13px] text-ink font-medium leading-relaxed">{rec.body.join("")}</p>
+              <ShowWorking result={engineResult} config={config} canExplain={rec.canExplain} />
+              <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
+                {t("dosing.reco.note")}
+              </p>
+              {/* V1's, kept where a hold is recommended: a hold is advice, and
+                  the keeper is allowed to disagree with it. */}
+              {rec.offerChangeAnyway && onChangeDoseAnyway && (
+                <Btn className="w-full mt-3" onClick={onChangeDoseAnyway}>
+                  {t("dosing.reco.changeAnyway")}
+                </Btn>
+              )}
+            </Card>
           )}
-          {/* --- Temporary correction ---------------------------------------
-              Separate from tuning the dose to match consumption. That job
-              keeps a level where it already is; this one moves it somewhere
-              else and then ends. Conflating them is what had the app
-              recommending a dose cut in the middle of a deliberate rise. */}
-          <CorrectionPanel
-            def={activeDef}
-            state={doseStates.find((d) => d && d.key === active.key)}
-            offers={correctionOffers[active.key]}
-            onStart={(offer) => onStartCorrection(active.key, offer)}
-            onCancel={() => onCancelCorrection(active.key)}
-            onFinish={() => onFinishCorrection(active.key)} />
 
-          {findingsFor(findings, active.key).length > 0 && (
-            <div className="mt-3">
-              <FindingList items={findingsFor(findings, active.key)} compact onDismiss={onDismissFinding} />
+          <DosingChart def={def} rows={rows} chartEvents={chartEvents} episodes={episodes} />
+
+          {three && (
+            <div className="grid grid-cols-2 gap-2 mb-4">
+              <Box {...three[0]} />
+              <Box {...three[1]} />
+              <div className="col-span-2"><Box {...three[2]} /></div>
             </div>
           )}
-        </Card>
-      )}
 
-      {!active && (
-        <p className="text-[12px] text-ink2 font-medium leading-relaxed text-center px-6">
-          Tap any of the three above to see how its figure was reached.
-        </p>
+          {/* THE POTENCY ESTIMATOR, its own box below everything (finding 13). */}
+          {potency && (
+            <PotencyBox box={potency} onAccept={onAcceptPotency} onKeep={onKeepPotency} />
+          )}
+        </>
       )}
     </div>
   );
 }
+
+export { spanInWords, sayPayloadKey, sayPayloadValue };
```

### `app/src/components/Tasks.jsx`

| | |
|---|---|
| V1 source | `src/components/Tasks.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `2482249ce03e14404f2f75c9f72a24d140e695c9de908d878fafec0df747d593` |
| V1 blob | `83583c09cea5fa4080582555219756f49e0cb2e7` |
| Ported SHA-256 | `231f55c46c75daf96904e5d907a91494fc1a4830ce603f26a245bee28a7c9158` |
| Differences | 5 |

1. **data source rewired — the calendar's completed entries reach V2's task store to take one back off the record; owner decision 32 makes anything the keeper recorded deletable**

```diff
@@ -1,124 +1,122 @@
-import { useMemo, useState } from 'react'
+import { useState } from 'react'
 import { Btn, Field, SectionTitle, inputCls } from './DoseExpectation.jsx'
 import { Card } from './ErrorBoundary.jsx'
-import { Check, Plus, X } from '../icons.jsx'
-import { predictAfterChange } from '../lib/analytics/consumption.js'
-import { fmtVal } from '../lib/analytics/time-in-range.js'
-import { DEFAULT_SETTINGS } from '../lib/analytics/water-changes.js'
+import { Check, Plus, SunMedium, StickyNote, X } from '../icons.jsx'
 import { CompletionCalendar, ReminderRow, ReminderSheet } from '../lib/backup.jsx'
 import { uid } from '../lib/constants.js'
 import { todayStr } from '../lib/dates.js'
-import { REMINDER_GROUPS, reminderState } from '../lib/reminders.js'
+import { nowTime } from '../lib/clock.js'
+import { taskState, TASK_KIND } from '../store/schedule.js'
 
 /* ---------------------------------- Tasks ---------------------------------- */
 
-export function Tasks({ allTasks, taskLog, onAddCustom, onDeleteCustom, onMarkDone,
-  onAddWaterChange, onSetReminderDue, onSetReminderInterval, onSkipReminder,
-  onDeleteWaterChange, onUpdateReminder, onNudgeReminder, onAddReminder, onDeleteReminder,
-  waterChanges = [], settings = DEFAULT_SETTINGS,
-  latestByParam = {}, paramDefs = [], reminders = [], reminderView = null,
-  onOpenTest = () => {} }) {
-  const [newUnit, setNewUnit] = useState("days");
-  const [newStart, setNewStart] = useState(todayStr());
-  const [wcOpen, setWcOpen] = useState(false);
-  const [wcLitres, setWcLitres] = useState(String(settings.waterChangeL ?? 10));
-  const [wcResult, setWcResult] = useState(null);
+/* V1's Tasks screen, ported, and the home for everything unscheduled.
 
-  const preview = useMemo(() => {
-    const L = parseFloat(wcLitres);
-    /* What a change dilutes is a fraction of the tank, so with no net volume
-       there is no fraction to quote. */
-    if (!L || L <= 0 || !(settings.volumeL > 0)) return null;
-    return predictAfterChange(latestByParam, paramDefs, settings.volumeL, L);
-  }, [wcLitres, latestByParam, paramDefs, settings.volumeL]);
+   WHAT CAME OUT. V1 previewed what a water change would do to every parameter
+   — `predictAfterChange`, a dilution model, computed in this component. That is
+   chemistry: it says what a reading will be. The water-change flow asks for
+   litres and records them, which is what the brief specifies and all the
+   engine needs.
 
+   WHAT WENT IN. The three unscheduled things the brief puts here: a one-off
+   addition by hand, a lighting change, and a short note with a date for
+   anything that changed what the tank uses — new corals, a loss.
+
+   V1's `REMINDER_GROUPS` — test schedule and husbandry — is not ported as
+   data, because it was keyed to V1's own reminder kinds. The grouping is the
+   same idea over `TASK_KIND`, which is V2's. */
+
+const GROUPS = [
+  { id: "test", label: "Test schedule", kinds: [TASK_KIND.TEST] },
+  { id: "husbandry", label: "Husbandry & maintenance", kinds: [TASK_KIND.HUSBANDRY, TASK_KIND.CUSTOM] },
+];
+
+export function Tasks({ tasks = [], completions = [], scheduleView = null, paramDefs = [],
+  onMarkDone, onAddTask, onDeleteTask, onUpdateTask,
+  onSetTaskDue, onSetTaskInterval, onSkipTask,
+  onAddWaterChange, onAddOneOff, onAddLightingChange, onAddNote,
+  waterChanges = [], onOpenTest = () => {}, onDeleteDone = null }) {
+
+  /* ---- the water-change prompt: litres, and nothing else ---------------- */
+  const [wcOpen, setWcOpen] = useState(null);
+  const [wcLitres, setWcLitres] = useState("");
+
   const confirmWaterChange = async () => {
     const L = parseFloat(wcLitres);
     if (!L || L <= 0) return;
-    await onAddWaterChange({ date: todayStr(), litres: L, note: "" });
-    await onMarkDone("waterchange", todayStr());
-    setWcResult(settings.volumeL > 0
-      ? predictAfterChange(latestByParam, paramDefs, settings.volumeL, L) : null);
-    setWcOpen(false);
+    await onAddWaterChange({ date: todayStr(), time: nowTime(), litres: L });
+    await onMarkDone(wcOpen, todayStr(), { litres: L });
+    setWcOpen(null);
+    setWcLitres("");
   };
 
+  /* ---- a custom task ---------------------------------------------------- */
   const [label, setLabel] = useState("");
   const [freq, setFreq] = useState(14);
+  const [newUnit, setNewUnit] = useState("days");
+  const [newStart, setNewStart] = useState(todayStr());
+  const [oneOffTask, setOneOffTask] = useState(false);
 
   const submit = async (e) => {
     if (e && e.preventDefault) e.preventDefault();
     const name = label.trim();
     if (!name) return;
-    /* Custom entries are reminders like any other, so they get the same
-       scheduling, snoozing and calendar history. */
     const n = Math.max(1, parseInt(freq, 10) || 7);
-    await onAddReminder({
-      id: uid(), label: name, paramKey: null, kind: "task",
+    await onAddTask({
+      id: uid(), label: name, kind: TASK_KIND.CUSTOM, parameter: null,
       intervalDays: newUnit === "weeks" ? n * 7 : n,
-      startDate: newStart || todayStr(), enabled: true, builtin: false,
+      startDate: newStart || todayStr(),
+      /* A one-off is a task that is turned off once it has been done, rather
+         than a second kind of thing with its own storage and its own calendar
+         behaviour. V1's own reasoning for one model, applied again. */
+      oneOff: oneOffTask,
     });
-    setLabel(""); setFreq(14); setNewUnit("days"); setNewStart(todayStr());
+    setLabel(""); setFreq(14); setNewUnit("days"); setNewStart(todayStr()); setOneOffTask(false);
   };
 
-  /* One sheet, shared by the calendar below and the reminder list above, so a
-     task can be moved from wherever you happen to be looking at it. */
+  /* ---- the three unscheduled records ------------------------------------ */
+  const [ooOpen, setOoOpen] = useState(false);
+  const [ooMl, setOoMl] = useState("");
+  const [ooDate, setOoDate] = useState(todayStr());
+  const [ooTime, setOoTime] = useState(nowTime());
+
+  const [lightOpen, setLightOpen] = useState(false);
+  const [lightDate, setLightDate] = useState(todayStr());
+  const [lightNote, setLightNote] = useState("");
+
+  const [noteOpen, setNoteOpen] = useState(false);
+  const [noteDate, setNoteDate] = useState(todayStr());
+  const [noteText, setNoteText] = useState("");
+
+  const alk = paramDefs.find((d) => d.assessed);
+
+  /* One sheet, shared by the calendar below and the task list above, so a task
+     can be moved from wherever you happen to be looking at it. */
   const [sheetId, setSheetId] = useState(null);
-  const sheetRem = sheetId ? (reminders || []).find((r) => r.id === sheetId) : null;
-  const sheetState = sheetRem ? reminderState(sheetRem, taskLog, todayStr()) : null;
+  const sheetTask = sheetId ? tasks.find((r) => r.id === sheetId) : null;
+  const sheetState = sheetTask ? taskState(sheetTask, completions, todayStr()) : null;
   const closeSheet = () => setSheetId(null);
   const onPickTask = (id) => setSheetId(id);
 
   return (
     <div>
-      <SectionTitle eyebrow="Schedule" title="Reminders" />
-
-      {/* Result of the change just logged */}
-      {wcResult && (
-        <Card className="p-4 mb-4" style={{ borderColor: "#0B7C8666" }}>
-          <div className="flex items-start justify-between gap-2 mb-2">
-            <div className="text-[11px] font-extrabold uppercase tracking-wide text-teal-brand">
-              Water change logged
-            </div>
-            <button aria-label="Dismiss" onClick={() => setWcResult(null)} className="text-ink2 p-2 -m-2 rounded-lg active:bg-app"><X size={16} /></button>
-          </div>
-          <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
-            That replaced {wcResult.pct.toFixed(1)}% of your water. Here's roughly where your levels should sit now — worth testing to confirm rather than taking these as read.
-          </p>
-          <div className="space-y-1.5">
-            {wcResult.rows.map(({ def, before, after, delta }) => (
-              <div key={def.key} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-app">
-                <span className="text-[13px] font-black text-ink min-w-0 truncate">{def.label}</span>
-                <span className="text-[12px] font-bold text-ink2 shrink-0">
-                  {fmtVal(def, before)} → <span className="text-ink font-black">{fmtVal(def, after)}{def.unit}</span>
-                  {Math.abs(delta) >= 0.005 && (
-                    <span className="ml-1" style={{ color: delta > 0 ? "#A2621B" : "#1D6FA5" }}>
-                      ({delta > 0 ? "+" : ""}{fmtVal(def, delta)})
-                    </span>
-                  )}
-                </span>
-              </div>
-            ))}
-          </div>
-        </Card>
-      )}
+      <SectionTitle eyebrow="Schedule" title="Tasks" />
 
-      {/* Water change volume prompt */}
+      {/* Water change volume prompt. Litres, and nothing else. */}
       {wcOpen && (
         <Card className="p-4 mb-4">
           <div className="flex items-center justify-between gap-2 mb-3">
             <span className="text-[14px] font-black text-ink">How much did you change?</span>
-            <button aria-label="Close" onClick={() => setWcOpen(false)} className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-app"><X size={20} /></button>
+            <button aria-label="Close" onClick={() => setWcOpen(null)} className="text-ink2 hover:text-ink p-2 -m-2 rounded-lg active:bg-app"><X size={20} /></button>
           </div>
           <Field label="Litres">
             <input type="number" inputMode="decimal" min="0" step="0.5" value={wcLitres}
-              onChange={(e) => setWcLitres(e.target.value)} className={inputCls} />
+              onChange={(e) => setWcLitres(e.target.value)} className={inputCls} autoFocus />
           </Field>
-          {wcPreview && (
-            <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-1 mb-2">
-              {wcPreview.pct.toFixed(1)}% of your {settings.volumeL}L system.
-            </p>
-          )}
-          <Btn className="w-full" onClick={logWaterChange}>
+          {/* V1 previewed what this would do to every parameter. That was a
+              dilution model in a UI component; the engine owns what a water
+              change does, and it is told the litres. */}
+          <Btn className="w-full mt-2" onClick={confirmWaterChange}>
             <span className="flex items-center justify-center gap-1.5"><Check size={14} /> Log water change</span>
           </Btn>
         </Card>
```

2. **data source rewired — the empty state explains that this build ships no seeded test schedule, because a cadence is chemistry**

```diff
@@ -134,8 +132,17 @@
           that reading; the rest you tick off.
         </p>
 
-        {REMINDER_GROUPS.map((g) => {
-          const list = reminders.filter((r) => g.kinds.includes(r.kind));
+        {tasks.length === 0 && (
+          <p className="text-[13px] text-ink2 font-medium leading-relaxed">
+            Nothing is scheduled yet. This build ships no test schedule of its own — a test
+            cadence is chemistry, and the only one the canon states is alkalinity's, which the
+            engine gives as a recommendation rather than a rhythm. Add what you actually do
+            below and the intervals are yours.
+          </p>
+        )}
+
+        {GROUPS.map((g) => {
+          const list = tasks.filter((r) => g.kinds.includes(r.kind));
           if (!list.length) return null;
           return (
             <div key={g.id} className="mb-4 last:mb-0">
```

3. **data source rewired — the task rows read V2's task vocabulary and the water-change prompt is keyed to the task that raised it**

```diff
@@ -145,12 +152,12 @@
               <div className="space-y-2">
                 {list.map((r) => (
                   <ReminderRow key={r.id} rem={r}
-                    state={reminderView && reminderView.states.find((x) => x.rem.id === r.id)}
+                    state={scheduleView && scheduleView.states.find((x) => x.task.id === r.id)}
                     onReschedule={() => onPickTask(r.id)}
-                    onComplete={r.kind === "water" ? () => setWcOpen(true)
-                      : r.kind === "test" && r.paramKey ? () => onOpenTest(r.paramKey)
-                      : () => onMarkDone(r.id)}
-                    completeLabel={r.kind === "water" ? "Log change" : r.kind === "test" ? "Log test" : "Mark done"} />
+                    onComplete={r.needsVolume ? () => setWcOpen(r.id)
+                      : r.kind === TASK_KIND.TEST && r.parameter ? () => onOpenTest(r.parameter)
+                      : () => onMarkDone(r.id, todayStr())}
+                    completeLabel={r.needsVolume ? "Log change" : r.kind === TASK_KIND.TEST ? "Log test" : "Mark done"} />
                 ))}
               </div>
             </div>
```

4. **wording replaced with engine output — the section is a task rather than a reminder, matching V2's vocabulary**

```diff
@@ -160,8 +167,8 @@
 
       {/* The add form uses the same fields as editing, so what you fill in
           matches what you'll see afterwards. */}
-      <Card className="p-4 mb-8">
-        <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-2">Add a reminder</div>
+      <Card className="p-4 mb-4">
+        <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-2">Add a task</div>
         <Field label="Name">
           <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
             className={inputCls} placeholder="e.g. Clean filter sock" />
```

5. **data source rewired — the calendar's completed entries reach V2's task store to take one back off the record; owner decision 32 makes anything the keeper recorded deletable**

```diff
@@ -180,25 +187,144 @@
             <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} className={inputCls} />
           </Field>
         </div>
+        <label className="flex items-center gap-2 mt-2">
+          <input type="checkbox" checked={oneOffTask} onChange={(e) => setOneOffTask(e.target.checked)} />
+          <span className="text-[12px] font-bold text-ink2">Just the once — turn it off after it is done</span>
+        </label>
         <Btn onClick={submit} className="w-full mt-3">
-          <span className="flex items-center justify-center gap-1.5"><Plus size={14} /> Add reminder</span>
+          <span className="flex items-center justify-center gap-1.5"><Plus size={14} /> Add task</span>
         </Btn>
       </Card>
 
-      {/* The calendar replaces a list of recent water changes: it shows every
-          completed task, not one kind, and gives the month at a glance. */}
+      {/* ---- everything unscheduled ---------------------------------------
+          The brief puts these here: "a one-off addition by hand, and anything
+          that changed what the tank uses — new corals, a loss, a lighting
+          change. A short free-text note with a date." */}
+      <Card className="p-4 mb-4">
+        <div className="text-[10px] font-extrabold uppercase tracking-wide text-ink2 mb-2">
+          Record something that happened
+        </div>
+
+        {/* A ONE-OFF ADDITION. Alkalinity only, and it says so.
+
+            The brief requires that a one-off addition states which parameter it
+            was. It can be recorded for alkalinity because that is the parameter
+            the engine reads corrections for. For anything else the engine has
+            no input at all: `toEngineEvents` sends every `MANUAL_CORRECTION`
+            without a parameter, so a calcium one-off would arrive as an
+            alkalinity one and confound a segment that nothing touched. Offering
+            it would create a wrong record rather than an incomplete one.
+            Recorded as open in `docs/migration/PORT-OMISSIONS.md`. */}
+        <button onClick={() => setOoOpen((v) => !v)}
+          className="w-full flex items-center gap-2 py-2 text-left border-t border-app first:border-0">
+          <Plus size={14} className="text-ink2 shrink-0" />
+          <span className="text-[13px] font-black text-ink flex-1">A one-off addition by hand</span>
+        </button>
+        {ooOpen && (
+          <div className="pb-3">
+            <p className="text-[11px] text-ink2 font-medium leading-relaxed mb-2">
+              {alk ? `${alk.label} only in this build.` : ""} Millilitres of your usual solution, added
+              by hand rather than by the pump.
+            </p>
+            <Field label="Millilitres">
+              <input type="number" inputMode="decimal" min="0" step="0.5" value={ooMl}
+                onChange={(e) => setOoMl(e.target.value)} className={inputCls} />
+            </Field>
+            <div className="grid grid-cols-2 gap-2 mt-2">
+              <Field label="Date">
+                <input type="date" value={ooDate} max={todayStr()} onChange={(e) => setOoDate(e.target.value)} className={inputCls} />
+              </Field>
+              <Field label="Time">
+                <input type="time" value={ooTime} onChange={(e) => setOoTime(e.target.value)} className={inputCls} />
+              </Field>
+            </div>
+            <Btn className="w-full mt-3" disabled={!parseFloat(ooMl)}
+              onClick={async () => {
+                const ml = parseFloat(ooMl);
+                if (!ml || ml <= 0) return;
+                await onAddOneOff({ amountMl: ml, date: ooDate, time: ooTime });
+                setOoMl(""); setOoOpen(false);
+              }}>
+              Record it
+            </Btn>
+          </div>
+        )}
+
+        <button onClick={() => setLightOpen((v) => !v)}
+          className="w-full flex items-center gap-2 py-2 text-left border-t border-app">
+          <SunMedium size={14} className="text-ink2 shrink-0" />
+          <span className="text-[13px] font-black text-ink flex-1">A lighting change</span>
+        </button>
+        {lightOpen && (
+          <div className="pb-3">
+            <div className="grid grid-cols-1 gap-2">
+              <Field label="Date">
+                <input type="date" value={lightDate} max={todayStr()} onChange={(e) => setLightDate(e.target.value)} className={inputCls} />
+              </Field>
+              <Field label="What changed">
+                <input type="text" value={lightNote} onChange={(e) => setLightNote(e.target.value)}
+                  className={inputCls} placeholder="e.g. blues up 10%" />
+              </Field>
+            </div>
+            <Btn className="w-full mt-3"
+              onClick={async () => {
+                await onAddLightingChange({ date: lightDate, note: lightNote.trim() });
+                setLightNote(""); setLightOpen(false);
+              }}>
+              Record it
+            </Btn>
+            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
+              This marks every chart, because a lighting change touches everything.
+            </p>
+          </div>
+        )}
+
+        <button onClick={() => setNoteOpen((v) => !v)}
+          className="w-full flex items-center gap-2 py-2 text-left border-t border-app">
+          <StickyNote size={14} className="text-ink2 shrink-0" />
+          <span className="text-[13px] font-black text-ink flex-1">Something that changed what the tank uses</span>
+        </button>
+        {noteOpen && (
+          <div className="pb-3">
+            <div className="grid grid-cols-1 gap-2">
+              <Field label="Date">
+                <input type="date" value={noteDate} max={todayStr()} onChange={(e) => setNoteDate(e.target.value)} className={inputCls} />
+              </Field>
+              <Field label="What happened">
+                <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)}
+                  className={inputCls} placeholder="e.g. four new frags in" />
+              </Field>
+            </div>
+            <Btn className="w-full mt-3" disabled={!noteText.trim()}
+              onClick={async () => {
+                if (!noteText.trim()) return;
+                await onAddNote({ date: noteDate, note: noteText.trim() });
+                setNoteText(""); setNoteOpen(false);
+              }}>
+              Record it
+            </Btn>
+            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
+              New corals, a loss, anything that changes demand. It is kept with the date and
+              shown against your history; nothing works out what it means.
+            </p>
+          </div>
+        )}
+      </Card>
+
+      {/* The calendar: every completed task, not one kind, and the month at a
+          glance. */}
       <SectionTitle eyebrow="History" title="Done & coming up" />
-      <CompletionCalendar taskLog={taskLog} reminders={reminders} waterChanges={waterChanges}
-        onPickTask={onPickTask} />
+      <CompletionCalendar taskLog={completions} reminders={tasks} waterChanges={waterChanges}
+        onPickTask={onPickTask} onDeleteDone={onDeleteDone} />
 
-      {sheetRem && (
-        <ReminderSheet rem={sheetRem} state={sheetState} onClose={closeSheet}
-          onSetDue={(id, d) => { onSetReminderDue(id, d); closeSheet(); }}
-          onSetInterval={(id, n) => { onSetReminderInterval(id, n); closeSheet(); }}
-          onComplete={(id) => { onMarkDone(id); closeSheet(); }}
-          onSkip={(id) => { onSkipReminder(id); closeSheet(); }}
-          onToggleEnabled={(id, on) => { onUpdateReminder(id, { enabled: on }); closeSheet(); }}
-          onDelete={(id) => { onDeleteReminder(id); closeSheet(); }} />
+      {sheetTask && (
+        <ReminderSheet rem={sheetTask} state={sheetState} onClose={closeSheet}
+          onSetDue={(id, d) => { onSetTaskDue(id, d); closeSheet(); }}
+          onSetInterval={(id, n) => { onSetTaskInterval(id, n); closeSheet(); }}
+          onComplete={(id) => { onMarkDone(id, todayStr()); closeSheet(); }}
+          onSkip={(id) => { onSkipTask(id); closeSheet(); }}
+          onToggleEnabled={(id, on) => { onUpdateTask(id, { enabled: on }); closeSheet(); }}
+          onDelete={(id) => { onDeleteTask(id); closeSheet(); }} />
       )}
 
     </div>
```

### `app/src/components/Setup.jsx`

| | |
|---|---|
| V1 source | `src/components/Setup.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `eb41bf87ba1c612bab5c1c7295718d76200aeb9f8fcff61871804f57b64a6e49` |
| V1 blob | `cba41937bdbfc9ea9649ac541785d17276217ffb` |
| Ported SHA-256 | `613483ec4b12f1d1de81d852f540482ea6b63170579696dae7b5dcb5c2cdfd0f` |
| Differences | 2 |

1. **styling token substituted — the panel and the three consumption boxes were the same pale teal as the page behind them, so nothing read as a distinct element; owner finding 10 asks for a teal page with white boxes and the consumption boxes raised in a darker teal with text chosen for the ground**

```diff
@@ -1,205 +1,305 @@
 import { useEffect, useMemo, useRef, useState } from 'react'
-import { Btn, Field, SectionTitle, findingKey, inputCls } from './DoseExpectation.jsx'
+import { Btn, Field, SectionTitle, inputCls } from './DoseExpectation.jsx'
 import { Card, DeleteButton } from './ErrorBoundary.jsx'
-import { InfoBlock } from './Insights.jsx'
-import { Activity, Calculator, CheckCircle2, ChevronDown, ChevronUp, Download, Plus, RotateCcw, Save, SunMedium, Upload, Waves } from '../icons.jsx'
-import { DOSE_ELEMENTS } from '../lib/analytics/consumption.js'
-import { CORRECTIONS, computeCorrection, fmtDoseMass } from '../lib/analytics/correction.js'
-import { magnesiumGate } from '../lib/analytics/magnesium-gate.js'
-import { kitSigma } from '../lib/analytics/measurement-noise.js'
-import { fmtAmount } from '../lib/analytics/time-in-range.js'
-import { byNewest } from '../lib/analytics/time-of-day.js'
-import { fileHandleSupported, loadFileHandle, readSnapshot, regrantAndWrite, restoreSnapshot, ringList, saveFileHandle, shareBackup, shareSupported, writeBackupToHandle } from '../lib/auto-backup.js'
-import { BACKUP_LABELS, buildBackup, downloadCsv, downloadJson, inspectBackup, requestPersistence, restoreBackup } from '../lib/backup.jsx'
-import { daysBetween, fmtDate, fmtShort, todayStr } from '../lib/dates.js'
-import { buildCsv } from '../lib/export-csv.js'
-import { KIT_PRECISION, settleWindow } from '../lib/findings.js'
-import { loadKey, saveKey } from '../lib/storage.js'
+import {
+  Beaker, Bell, ChevronDown, ChevronUp, Download, Plus, Save, Settings2, SunMedium, Upload, Waves,
+} from '../icons.jsx'
+import { fmtAmount, fmtPotency, fmtTime } from '../lib/format.js'
+import { todayStr, fmtDate } from '../lib/dates.js'
+import { nowTime } from '../lib/clock.js'
+import { CHEMICALS, KEEPER_FACTS, POTENCY_FORM, potencyForThisTank } from '../store/config.js'
+import { ImportPanel } from './ImportPanel.jsx'
+import { TestMode } from './TestMode.jsx'
+import { MODE, currentMode } from '../store/mode.js'
+import { t } from '../strings.js'
 
 /* ---------------------------------- Setup ---------------------------------- */
 
-export function Setup({ settings, onSaveSettings, paramDefs, latestByParam, readings,
-  doseLog = [], onAddDoseChange, onDeleteDoseChange,
-  waterChanges = [], icps = [], lighting = [], taskLog = [], allTasks = [],
-  onAddLighting, onDeleteLighting, onRestored, onPlayIntro,
-  onRestoreFinding, onRestoreAllFindings,
-  customTasks = [], dismissedList = [], customRanges = {},
-  corrections = [], onDeleteCorrection = null }) {
+/* THE CARD PATTERN, AND AN HONEST NOTE ABOUT WHERE IT CAME FROM.
 
-  const [vol, setVol] = useState((settings.volumeL == null ? "" : String(settings.volumeL)));
-  const [backupAt, setBackupAt] = useState(null);
-  const [restoreMsg, setRestoreMsg] = useState(null);
-  const [pending, setPending] = useState(null);
-  /* "keep" or "file" — what to do about target ranges the incoming copy and
-     this device disagree about. Null until the user says, and the restore
-     will not run without it, because both answers rewrite how the whole log
-     reads and neither is the app's to assume. */
-  const [rangeChoice, setRangeChoice] = useState(null);
-  const [persistState, setPersistState] = useState(null);
+   The brief asks for "V1's expandable card pattern, ported: icon in a tinted
+   square, small coloured category label, bold black heading, grey subtitle
+   with a count or status, chevron on the right in the category colour,
+   expanding in place."
 
-  /* The automatic side of backup: the snapshots this device holds, and the
-     file handle if one was chosen. Loaded here so the panel shows what is
-     actually protecting the user rather than what ought to be. */
-  const [snapshots, setSnapshots] = useState([]);
-  const [fileState, setFileState] = useState(null);
+   That pattern is not in V1's source. V1's `Setup.jsx` at `9276a2c` is a flat
+   list of plain `Card`s with no icon square, no category label and no
+   expansion; `original-artifact.html`, V1's single-file ancestor, does not
+   have it either. It was searched for rather than assumed.
 
-  /* The eight lists a restore merges into, in the shape both the preview and
-     the restore expect. It was written out three times, once per call site,
-     which is how the snapshot path came to be given the same arguments but
-     none of the same checks. */
-  const restoreCurrent = () => ({
-    "readings": readings, "icp-tests": icps, "water-changes": waterChanges,
-    "dose-log": doseLog, "lighting-log": lighting, "task-log": taskLog,
-    "tasks-custom": customTasks,
-  });
+   So `SetupSection` below is written to the brief's description, in V1's
+   visual language — V1's `Card`, V1's icon set, V1's type scale and V1's
+   colours. It is NOT in `docs/migration/PORT-MANIFEST.md`, because there is no
+   V1 original to diff it against and listing it as a port would be the exact
+   claim this port exists to stop being made without evidence. It is recorded
+   in `docs/migration/PORT-OMISSIONS.md` instead.
 
-  const rangeConflicts = pending && pending.info.rangeConflicts ? pending.info.rangeConflicts : [];
+   WHAT ELSE LEFT V1's SETUP. It was 931 lines and imported the magnesium gate,
+   a settle-window function, kit-noise figures and a correction calculator —
+   V1's FOURTH implementation of that calculator. None of it crossed. The
+   correction calculator is recorded for later and is not built now; the
+   opening animation is out by the brief and was `LEAVE_BEHIND` in the salvage
+   inventory anyway. */
 
-  /* The preview renders above the snapshot list, so a snapshot restored from
-     the bottom of the panel would otherwise put its confirmation off-screen
-     and read as a tap that did nothing. Jumped rather than animated: this is
-     a correction to where the page already is, not an effect. */
-  const previewRef = useRef(null);
-  useEffect(() => {
-    const el = previewRef.current;
-    if (pending && el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
-  }, [pending]);
+function SetupSection({ icon: Icon, category, colour, heading, subtitle, open, onToggle, children }) {
+  return (
+    <Card className="mb-3 overflow-hidden">
+      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
+        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
+          style={{ background: colour + "1A" }}>
+          <Icon size={18} style={{ color: colour }} strokeWidth={2.4} />
+        </span>
+        <span className="min-w-0 flex-1">
+          <span className="block text-[10px] font-extrabold uppercase tracking-[0.13em]"
+            style={{ color: colour }}>
+            {category}
+          </span>
+          <span className="block text-[15px] font-black text-ink truncate">{heading}</span>
+          <span className="block text-[11px] font-bold text-ink2 truncate">{subtitle}</span>
+        </span>
+        {open
+          ? <ChevronUp size={18} style={{ color: colour }} className="shrink-0" />
+          : <ChevronDown size={18} style={{ color: colour }} className="shrink-0" />}
+      </button>
+      {open && <div className="px-4 pb-4 border-t border-app pt-3">{children}</div>}
+    </Card>
+  );
+}
 
-  const refreshAuto = async () => {
-    setSnapshots(await ringList());
-    const handle = await loadFileHandle();
-    if (!handle) { setFileState(null); return; }
-    let needsTap = false;
-    try {
-      if (handle.queryPermission) needsTap = (await handle.queryPermission({ mode: "readwrite" })) !== "granted";
-    } catch { needsTap = true; }
-    setFileState({ handle, needsTap });
-  };
+/* ============================================================================
+   WHAT SETUP SHOWS IS READ FROM THE CONFIGURATION, EVERY TIME IT CHANGES
+   ----------------------------------------------------------------------------
+   The screen used to take one copy of the configuration when it mounted and
+   hold it for the rest of its life. Every field below was a `useState`
+   initialiser, and a `useState` initialiser runs ONCE. Saving appends a new
+   configuration version and the `config` prop changes; the screen went on
+   rendering the copy it took at the start.
 
-  /* Ask for durable storage on arrival, and find out when the last backup was,
-     so the reminder can be honest rather than nagging on every visit. */
-  useEffect(() => {
-    let live = true;
-    (async () => {
-      const p = await requestPersistence();
-      if (live) setPersistState(p);
-      const last = await loadKey("last-backup", null);
-      if (live) setBackupAt(last);
-      if (live) await refreshAuto();
-    })();
-    return () => { live = false; };
-  }, []);
+   That is a screen and an engine reading from two different places, which is
+   the fault this round exists to remove: a number the app is not using is worse
+   than a wrong one, because nothing beside it can be trusted either.
 
-  const backupAge = backupAt ? daysBetween(backupAt.slice(0, 10), todayStr()) : null;
-  const [elemKey, setElemKey] = useState("alkalinity");
-  const elem = DOSE_ELEMENTS.find((e) => e.key === elemKey) || DOSE_ELEMENTS[0];
-  const [elemDose, setElemDose] = useState("");
-  const [elemStrength, setElemStrength] = useState("");
-  const [showStrength, setShowStrength] = useState(false);
-  const [showSigma, setShowSigma] = useState(false);
-  const [sigmaVal, setSigmaVal] = useState("");
-  const [saveMsg, setSaveMsg] = useState(null);
-  /* Doses are often adjusted a few days before you get round to logging it,
-     so the change date is editable rather than assumed to be today. */
-  const [doseDate, setDoseDate] = useState(todayStr());
+   So the readers are named functions rather than inline initialisers, and the
+   effect below re-runs every one of them whenever the configuration VERSION
+   changes. Keying on `configVersionId` rather than on the object is what makes
+   typing survive: the version changes when something is stored, and not when a
+   parent happens to re-render.
 
-  /* Only an actual change to volumeL (e.g. an external backup restore)
-     should resync this field. Depending on the whole `settings` object
-     re-fired this on every unrelated settings write on this screen (e.g.
-     saving a dose change), clobbering an unsaved volume edit. */
-  useEffect(() => {
-    setVol((settings.volumeL == null ? "" : String(settings.volumeL)));
-  }, [settings.volumeL]);
+   Nothing here derives a value. Each function reads one stored field and turns
+   it into the string an input renders, and `derived` below still renders the
+   ENGINE's own figure for the grams-per-litre form. `ALK-014` keeps its one
+   owner. */
 
-  useEffect(() => {
-    setElemDose(String(settings[elem.doseField] ?? 0));
-    /* Empty when nothing is stored, and deliberately not pre-filled with a
-       suggestion. A figure the user has not checked against their own bottle
-       is the problem this removed, not a convenience (reef-chemistry.md §16). */
-    setElemStrength(settings[elem.strengthField] == null ? "" : String(settings[elem.strengthField]));
-    setSigmaVal(String(kitSigma(elem.key, settings)));
-    setSaveMsg(null);
-  }, [settings, elemKey]);
+function factsFrom(config) {
+  const out = {};
+  for (const f of KEEPER_FACTS) out[f.key] = config && config[f.key] != null ? String(config[f.key]) : "";
+  return out;
+}
 
-  const currentDose = settings[elem.doseField] ?? 0;
-  const doseNum = parseFloat(elemDose);
-  const strengthNum = parseFloat(elemStrength) || 0;
-  const doseChanged = !isNaN(doseNum) && doseNum !== currentDose;
-  const volNum = parseFloat(vol);
-  const perDayDelivered = volNum > 0
-    ? currentDose * strengthNum * (100 / volNum) : null;
+function formFrom(config) {
+  return (config && config.potencyStatedAs) || POTENCY_FORM.DKH_PER_ML;
+}
 
-  /* Clearing the field stores nothing, rather than storing some other tank's
-     volume. The app would rather refuse to dose than dose the wrong tank. */
-  const saveVolume = async () => {
-    await onSaveSettings({ ...settings, volumeL: volNum > 0 ? volNum : null });
-    setSaveMsg(volNum > 0
-      ? "Tank volume saved."
-      : "Tank volume cleared. Dosing advice will not be calculated until you enter it.");
-    setTimeout(() => setSaveMsg(null), 2500);
-  };
+function chemicalFrom(config) {
+  return (config && config.chemical) || "NA2CO3";
+}
 
-  /* Changing the dose is itself the event, so one action updates the setting
-     and appends to that element's history. No separate "record change" step. */
-  const saveDose = async () => {
-    if (isNaN(doseNum)) return;
-    await onAddDoseChange({ date: doseDate, ml: doseNum, element: elemKey, note: "" });
-    setSaveMsg(`${elem.label} dose set to ${doseNum} mL/day, recorded for ${fmtDate(doseDate)}.`);
-    setDoseDate(todayStr());
-    setTimeout(() => setSaveMsg(null), 3500);
+function gPerLFrom(config) {
+  return config && config.stockConcentrationGPerL != null ? String(config.stockConcentrationGPerL) : "";
+}
+
+function per100LFrom(config) {
+  return config && config.potencyStatedAs === POTENCY_FORM.DKH_PER_ML_PER_100L
+    ? String(config.potencyStatedValue ?? "") : "";
+}
+
+export function Setup({ config, onSaveConfig, paramDefs = [], engineResult = null,
+  doseChanges = [], onAddDoseChange, onDeleteEvent, onSetStandingDose,
+  lightingChanges = [], hiddenNotices = [], onRestoreNotice, onRestoreAllNotices,
+  onExport, store = null, onImported = null, onModeChange = null,
+  storageHealth = null }) {
+
+  const [openId, setOpenId] = useState(null);
+  const testModeOn = currentMode() === MODE.TEST;
+  const toggle = (id) => setOpenId(openId === id ? null : id);
+
+  /* ---- the keeper's facts ---------------------------------------------- */
+  const [facts, setFacts] = useState(() => factsFrom(config));
+  const [factMsg, setFactMsg] = useState("");
+
+  const saveFacts = async (keys) => {
+    const values = {};
+    for (const k of keys) {
+      const raw = facts[k];
+      if (raw === "" || raw == null) continue;
+      const n = parseFloat(raw);
+      if (!Number.isFinite(n)) { setFactMsg("Enter a number."); return; }
+      values[k] = n;
+    }
+    await onSaveConfig(values);
+    setFactMsg("Saved.");
+    setTimeout(() => setFactMsg(""), 2500);
   };
 
-  const saveSigma = async () => {
-    const v = parseFloat(sigmaVal);
-    if (!(v > 0)) return;
-    await onSaveSettings({ ...settings, kitSigma: { ...(settings.kitSigma || {}), [elem.key]: v } });
-    setSaveMsg("Kit precision saved.");
-    setTimeout(() => setSaveMsg(null), 2500);
+  /* WHAT THIS SECTION IS STILL WAITING FOR — AND IT COUNTS ONLY WHAT IT ASKS.
+
+     Owner finding 4: "'One more left' persisted; the owner had to press save
+     repeatedly before the step completed." It was not a save that failed. This
+     counted every one of `KEEPER_FACTS`, including `selectedPotencyDkhPerMl`,
+     and this section renders three of them — the volume and the two range
+     edges. The strength and the pump's step are asked for in the DOSING section
+     below.
+
+     Worse, the strength can be legitimately absent. A keeper who states his
+     solution in grams per litre stores `chemical` and `stockConcentrationGPerL`
+     and NO `selectedPotencyDkhPerMl`, because the engine derives the potency
+     itself and the app storing one as well would override `ALK-014`'s owner
+     with a copy. That is `store/config.js`'s own rule, and it made this counter
+     permanently stuck at one however many times he pressed save — a screen
+     telling him something was missing that he had already supplied, on the same
+     screen he had supplied it. */
+  const ASKED_HERE = KEEPER_FACTS.filter(
+    (f) => f.key === "netVolumeL" || f.key.startsWith("targetRange")
+  );
+  const missing = ASKED_HERE.filter((f) => !config || config[f.key] == null).length;
+
+  /* ---- dose changes ----------------------------------------------------- */
+  const [dcOpen, setDcOpen] = useState(false);
+  const [dcFrom, setDcFrom] = useState("");
+  const [dcTo, setDcTo] = useState("");
+  const [dcDate, setDcDate] = useState(todayStr());
+  const [dcTime, setDcTime] = useState(nowTime());
+
+  const newestFirst = useMemo(
+    () => [...doseChanges].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
+    [doseChanges]);
+
+  const submitDoseChange = async () => {
+    const from = parseFloat(dcFrom), to = parseFloat(dcTo);
+    if (!Number.isFinite(from) || !Number.isFinite(to)) return;
+    await onAddDoseChange({ fromMlPerDay: from, toMlPerDay: to, date: dcDate, time: dcTime });
+    setDcFrom(""); setDcTo(""); setDcDate(todayStr()); setDcTime(nowTime());
   };
 
-  /* Clearing the field stores nothing, rather than falling back to some other
-     tank's product. Exactly what saveVolume does above, for the same reason:
-     the app would rather refuse than dose from a figure nobody checked. */
+  /* ---- ONE dosing section ------------------------------------------------
+
+     "Never ask the same thing twice in different clothes." Solution strength,
+     the dose in force and the pump's step used to sit in one card while the
+     dose-change history sat in another, and "solution strength" was asked for
+     in dKH/mL only — the one form a keeper who mixes his own soda ash does not
+     have. Both are one section now, and the strength is asked for once in
+     whichever of three forms he actually holds. */
+  const DOSED = ["ALK", "CA", "MG"];
+  const [dosedKey, setDosedKey] = useState("ALK");
+  const dosedDef = paramDefs.find((d) => d.key === dosedKey);
+
+  const [form, setForm] = useState(() => formFrom(config));
+  const [chemical, setChemical] = useState(() => chemicalFrom(config));
+  const [gPerL, setGPerL] = useState(() => gPerLFrom(config));
+  const [per100L, setPer100L] = useState(() => per100LFrom(config));
+  const [strengthMsg, setStrengthMsg] = useState("");
+
+  /* THE RE-READ. One effect, one condition: the stored version changed.
+
+     `standing` and `current` are handled at their own declaration below, for
+     the same reason and by the same rule — the dose in force is a ledger fact,
+     not a configuration field, so it has its own key. */
+  const syncedVersion = useRef(config ? config.configVersionId : null);
+  useEffect(() => {
+    const version = config ? config.configVersionId : null;
+    if (version === syncedVersion.current) return;
+    syncedVersion.current = version;
+    setFacts(factsFrom(config));
+    setForm(formFrom(config));
+    setChemical(chemicalFrom(config));
+    setGPerL(gPerLFrom(config));
+    setPer100L(per100LFrom(config));
+  }, [config]);
+
+  const netVolumeL = parseFloat(facts.netVolumeL);
+
+  /* What the app can honestly show back as the derived figure, and where it
+     came from. For the grams-per-litre form that is the ENGINE's own number —
+     `P = factor · C / V` is `ALK-014` and has one owner, so the app renders
+     what the engine returned rather than recomputing it. */
+  const derived = useMemo(() => {
+    if (form === POTENCY_FORM.DKH_PER_ML) return { kind: "stated" };
+    if (form === POTENCY_FORM.DKH_PER_ML_PER_100L) {
+      const v = potencyForThisTank(parseFloat(per100L), netVolumeL);
+      if (v == null) return { kind: Number.isFinite(netVolumeL) ? "none" : "needsVolume" };
+      return { kind: "fromVolume", value: v, volume: netVolumeL };
+    }
+    const p = engineResult && engineResult.potency;
+    const v = p && typeof p.theoreticalPotencyDkhPerMl === "number"
+      ? p.theoreticalPotencyDkhPerMl : null;
+    return v == null ? { kind: "afterSave" } : { kind: "fromEngine", value: v };
+  }, [form, per100L, netVolumeL, engineResult]);
+
   const saveStrength = async () => {
-    await onSaveSettings({ ...settings, [elem.strengthField]: strengthNum > 0 ? strengthNum : null });
-    setSaveMsg(strengthNum > 0
-      ? "Product strength saved."
-      : `${elem.label} strength cleared. Dosing advice and corrections will not be calculated until you enter it.`);
-    setTimeout(() => setSaveMsg(null), 3500);
+    const values = {};
+    if (form === POTENCY_FORM.GRAMS_PER_LITRE) {
+      const c = parseFloat(gPerL);
+      if (!Number.isFinite(c)) { setStrengthMsg("Enter a number."); return; }
+      /* The engine derives the potency from these two. Sending a
+         `selectedPotencyDkhPerMl` as well would override its own derivation
+         with the app's, so the app clears it rather than holding a stale one. */
+      values.chemical = chemical;
+      values.stockConcentrationGPerL = c;
+      values.selectedPotencyDkhPerMl = null;
+      values.potencyStatedValue = c;
+    } else if (form === POTENCY_FORM.DKH_PER_ML_PER_100L) {
+      const stated = parseFloat(per100L);
+      const v = potencyForThisTank(stated, netVolumeL);
+      if (v == null) { setStrengthMsg("Enter your net volume above first."); return; }
+      values.selectedPotencyDkhPerMl = v;
+      values.potencyStatedValue = stated;
+    } else {
+      const v = parseFloat(facts.selectedPotencyDkhPerMl);
+      if (!Number.isFinite(v)) { setStrengthMsg("Enter a number."); return; }
+      values.selectedPotencyDkhPerMl = v;
+      values.potencyStatedValue = v;
+    }
+    values.potencyStatedAs = form;
+    await onSaveConfig(values);
+    setStrengthMsg("Saved.");
+    setTimeout(() => setStrengthMsg(""), 2500);
   };
 
-  const elemLog = useMemo(
-    () => doseLog.filter((d) => (d.element || "alkalinity") === elemKey)
-      .sort(byNewest),
-    [doseLog, elemKey]);
+  /* The dose in force. This is the field whose absence stopped the engine
+     working out consumption at all — see `lib/record.js` `recordDoseState`. */
+  const standing = newestFirst.length ? newestFirst[0].to : null;
+  const [current, setCurrent] = useState(() => (standing != null ? String(standing) : ""));
+  const [currentMsg, setCurrentMsg] = useState("");
 
-  // Correction calculator state
-  const correctable = paramDefs.filter((d) => CORRECTIONS[d.key]);
-  const [calcParam, setCalcParam] = useState(correctable[0] ? correctable[0].key : "alkalinity");
-  const [calcAimPoint, setCalcAimPoint] = useState("");
-  const calcDef = paramDefs.find((d) => d.key === calcParam) || correctable[0];
-  const calcCurrent = latestByParam && latestByParam[calcParam] ? latestByParam[calcParam].value : null;
-  const correction = useMemo(
-    () => computeCorrection(calcParam, calcCurrent, parseFloat(calcAimPoint), settings.volumeL),
-    [calcParam, calcCurrent, calcAimPoint, settings.volumeL]);
-  /* §10's magnesium gate. This calculator is the third path to an alkalinity
-     or calcium correction and shares no code with the two engines, so it
-     evaluates the gate itself from the one function that owns the rule. It
-     never blocks the magnesium correction — that is the one the gate is
-     telling the user to do. */
-  const calcGate = useMemo(
-    () => ((calcParam === "alkalinity" || calcParam === "calcium")
-      ? magnesiumGate({ readings, settings, paramDefs }) : null),
-    [calcParam, readings, settings, paramDefs]);
+  /* The same re-read as the configuration's, keyed on the ledger fact rather
+     than the configuration version, because that is where the standing dose
+     lives. Without it the box went on showing the dose that was in force when
+     the screen opened, however many changes had been recorded since. */
+  const syncedStanding = useRef(standing);
+  useEffect(() => {
+    if (standing === syncedStanding.current) return;
+    syncedStanding.current = standing;
+    setCurrent(standing != null ? String(standing) : "");
+  }, [standing]);
 
-  // Lighting log state
-  const [lightDate, setLightDate] = useState(todayStr());
-  const [lightNote, setLightNote] = useState("");
-  const submitLighting = async (e) => {
-    e.preventDefault();
-    if (!lightNote.trim()) return;
-    await onAddLighting({ date: lightDate, note: lightNote.trim() });
-    setLightNote("");
+  /* What the card says about itself when it is shut: the two facts whose
+     absence stops the engine answering, named rather than counted. */
+  const dosingSubtitle = useMemo(() => {
+    const bits = [];
+    const hasStrength = config
+      && (config.selectedPotencyDkhPerMl != null
+        || (config.chemical != null && config.stockConcentrationGPerL != null));
+    if (!hasStrength) bits.push("solution strength needed");
+    if (standing == null) bits.push("current dose needed");
+    return bits.length ? bits.join(" · ") : `${fmtAmount(standing)} mL/day`;
+  }, [config, standing]);
+
+  const saveCurrent = async () => {
+    const v = parseFloat(current);
+    if (!Number.isFinite(v)) { setCurrentMsg("Enter a number."); return; }
+    await onSetStandingDose(v);
+    setCurrentMsg(t("dosing.currentSaved"));
+    setTimeout(() => setCurrentMsg(""), 2500);
   };
 
   return (
```

2. **styling token substituted — the panel and the three consumption boxes were the same pale teal as the page behind them, so nothing read as a distinct element; owner finding 10 asks for a teal page with white boxes and the consumption boxes raised in a darker teal with text chosen for the ground**

```diff
@@ -206,726 +306,343 @@
     <div>
       <SectionTitle eyebrow="Configuration" title="Setup" />
 
-      {/* --- Tank & dosing setup --- */}
-      <Card className="p-4 mb-4">
-        <div className="text-sm font-black text-ink mb-1">Tank</div>
-        <Field label="Volume (L)">
-          <div className="flex gap-2">
-            <input type="number" inputMode="decimal" step="1" value={vol} onChange={(e) => setVol(e.target.value)} className={inputCls} />
-            <Btn onClick={saveVolume} className="shrink-0">
-              <span className="flex items-center gap-1.5"><Save size={14} /> Save</span>
-            </Btn>
-          </div>
-        </Field>
-
-        {/* Which alkalinity kit you use decides how long the app waits before
-            it will read a trend. A more precise kit clears its own error in
-            fewer days, so it earns a verdict sooner — the app was assuming
-            two days for everyone, which is too short on a slow tank with a
-            coarse kit and a wasted day on a fast one. */}
-        {/* One kit per element. A single choice was guaranteed to be wrong for
-            something: Hanna's alkalinity checker is the most precise in common
-            use and its calcium checker is among the least, and hardly anyone
-            buys one brand for all three. */}
-        {[
-          { key: "alkalinity", label: "Alkalinity", unit: "dKH" },
-          { key: "calcium", label: "Calcium", unit: "ppm" },
-          { key: "magnesium", label: "Magnesium", unit: "ppm" },
-        ].map((el) => (
-          <Field key={el.key} label={`${el.label} test kit`}>
-            <select className={inputCls}
-              value={(settings.testKits && settings.testKits[el.key]) || settings.testKit || "hanna"}
-              onChange={(e) => onSaveSettings({ ...settings,
-                testKits: { ...(settings.testKits || {}), [el.key]: e.target.value } })}>
-              {Object.entries(KIT_PRECISION).map(([k, v]) => (
-                <option key={k} value={k}>{v.label} (±{v[el.key]}{el.unit})</option>
-              ))}
-            </select>
+      {/* ---- the tank's own facts --------------------------------------- */}
+      <SetupSection icon={Waves} category="Tank" colour="#0B7C86"
+        heading="Your tank"
+        subtitle={missing ? `${missing} still needed` : "all set"}
+        open={openId === "tank"} onToggle={() => toggle("tank")}>
+        {/* V1 canon's rule, carried across as a principle: "Setup asks for
+            facts, not judgements." Every field here is something only the
+            keeper knows and the app cannot default. Nothing here is a
+            threshold, a tolerance or a cadence — those are the canon's, and
+            the app does not ask because it does not get to choose. */}
+        <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
+          These are the things only you know. The app will not guess at any of them, and it
+          says what it cannot work out without each one.
+        </p>
+        {ASKED_HERE.map((f) => (
+          <Field key={f.key} label={`${t(f.label)}${f.unit ? ` (${f.unit})` : ""}`} className="mb-2">
+            <input type="number" inputMode="decimal" className={inputCls}
+              value={facts[f.key]} onChange={(e) => setFacts({ ...facts, [f.key]: e.target.value })}
+              placeholder={t(f.hint)} />
           </Field>
         ))}
-        <p className="text-[11px] text-ink2 mt-1 leading-snug">
-          Precision decides how long the app waits before it will read a trend —
-          a better kit earns a verdict sooner.{" "}
-          {settings.volumeL > 0 ? (
-            <>
-              Alkalinity currently needs{" "}
-              {settleWindow("alkalinity",
-                (settings.dailyDoseMl || 0) * (settings.dkhPerMlPer100L || 0) * 100 / settings.volumeL,
-                settings)}{" "}
-              days of readings on this tank.
-            </>
-          ) : (
-            <>How many days that takes on this tank depends on your net volume, which isn't set yet.</>
-          )}
-        </p>
-      </Card>
+        <Btn className="w-full mt-2"
+          onClick={() => saveFacts(["netVolumeL", "targetRangeMinDkh", "targetRangeMaxDkh"])}>
+          <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span>
+        </Btn>
+        {factMsg && <p className="text-[11px] font-extrabold text-teal-brand mt-2">{factMsg}</p>}
+      </SetupSection>
 
-      <Card className="p-4 mb-4">
-        <div className="text-sm font-black text-ink mb-3">Dosing</div>
+      {/* ---- ONE dosing section -----------------------------------------
 
-        <Field label="Element">
-          <select value={elemKey} onChange={(e) => setElemKey(e.target.value)} className={inputCls}>
-            {DOSE_ELEMENTS.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
-          </select>
-        </Field>
+           `17-DOSING-TAB-SPEC.md`'s companion rule for Setup: one dosing
+           section, and never the same question twice in different clothes.
+           Solution strength, the dose in force, the pump's step and the record
+           of every change are one thing the keeper sets up, so they are one
+           card.
 
-        {/* One field for the dose. Changing it IS the event — it records itself
-            with today's date, so there's no second "new rate" box to fill in. */}
-        <div className="mt-3">
-          <div className="grid grid-cols-2 gap-2">
-            <Field label={`Dose (mL/day)`}>
-              <input type="number" step="0.1" inputMode="decimal" value={elemDose}
-                onChange={(e) => setElemDose(e.target.value)} className={inputCls}
-                placeholder="0 if not dosed" />
-            </Field>
-            <Field label="Date changed">
-              <input type="date" value={doseDate} onChange={(e) => setDoseDate(e.target.value)}
-                className={inputCls} max={todayStr()} />
-            </Field>
-          </div>
-          <div className="mt-2">
-            <Btn onClick={saveDose} disabled={!doseChanged} className="w-full sm:w-auto">
-              <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save dose change</span>
-            </Btn>
-          </div>
-          {doseChanged && (
-            <p className="text-[11px] font-bold text-teal-brand mt-1.5">
-              Records a change on {fmtDate(doseDate)}{currentDose > 0 ? `, from ${currentDose} to ${elemDose} mL/day` : `, starting at ${elemDose} mL/day`}.
-            </p>
-          )}
-          {!doseChanged && currentDose > 0 && strengthNum > 0 && (
-            <p className="text-[11px] font-bold text-teal-brand mt-1.5">
-              {perDayDelivered != null
-                ? `Delivering about ${fmtAmount(perDayDelivered)} ${elem.unit} per day to ${vol}L.`
-                : "What this delivers per day cannot be worked out until the tank's net volume is set above."}
-            </p>
-          )}
-          {saveMsg && <p className="text-[11px] font-extrabold text-teal-brand mt-1.5">{saveMsg}</p>}
+           DELIVERY METHOD IS NOT ASKED. The application handles pump-delivered
+           maintenance dosing only; corrections may be by hand, maintenance is
+           not. There is no choice to make, so there is no question — and
+           nothing that can afterwards be reported as "not recorded". */}
+      <SetupSection icon={Beaker} category="Dosing" colour="#1D6FA5"
+        heading="Dosing"
+        subtitle={dosingSubtitle}
+        open={openId === "dosing"} onToggle={() => toggle("dosing")}>
+
+        <div className="flex gap-1.5 mb-3">
+          {DOSED.map((k) => {
+            const def = paramDefs.find((d) => d.key === k);
+            if (!def) return null;
+            return (
+              <button key={k} onClick={() => setDosedKey(k)}
+                className="flex-1 rounded-lg py-2 text-[12px] font-extrabold border-2"
+                style={{ borderColor: dosedKey === k ? def.color : "#E3ECEA",
+                         color: dosedKey === k ? def.color : "#45605F" }}>
+                {def.label}
+              </button>
+            );
+          })}
         </div>
 
-        {/* Strength is set once per product, so it stays tucked away. */}
-        <button onClick={() => setShowStrength((v) => !v)}
-          className="mt-3 w-full flex items-center justify-between gap-2 py-2 border-t border-app">
-          <span className="text-[12px] font-bold text-ink2 min-w-0 truncate">
-            Product strength: <span className="text-ink font-black">{elemStrength} {elem.strengthLabel}</span>
-          </span>
-          <span className="text-[11px] font-extrabold text-teal-brand flex items-center gap-1 shrink-0">
-            {showStrength ? "Close" : "Change"} {showStrength ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
-          </span>
-        </button>
-        {showStrength && (
-          <div className="mt-2 rounded-xl p-3 bg-app border border-app">
-            <Field label={`Strength (${elem.strengthLabel})`}>
-              <div className="flex gap-2">
-                <input type="number" inputMode="decimal" step={elem.strengthStep} value={elemStrength}
-                  onChange={(e) => setElemStrength(e.target.value)} className={inputCls} />
-                <Btn onClick={saveStrength} className="shrink-0">
-                  <span className="flex items-center gap-1.5"><Save size={14} /> Save</span>
-                </Btn>
-              </div>
-            </Field>
-            <p className="text-[11px] text-ink2 font-medium mt-2 leading-relaxed">{elem.hint}</p>
-          </div>
-        )}
+        {!(dosedDef && dosedDef.assessed) ? (
+          <p className="text-[13px] text-ink2 font-medium leading-relaxed">
+            There is no {dosedDef ? (dosedDef.labelMid || dosedDef.label.toLowerCase()) : ""} engine in this
+            build, so there is nothing here to set up yet. Its readings are logged and charted like
+            every other parameter's.
+          </p>
+        ) : (
+          <>
+            {/* ---- solution strength: ONE fact, three ways of saying it ---- */}
+            <h4 className="text-[13px] font-black text-ink mb-1">{t("dosing.strengthHead")}</h4>
+            <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-2">
+              {t("dosing.strengthLead")}
+            </p>
+            <div className="flex gap-1.5 mb-2.5">
+              {Object.keys(POTENCY_FORM).map((k) => (
+                <button key={k} onClick={() => setForm(POTENCY_FORM[k])}
+                  className="flex-1 rounded-lg py-1.5 px-1 text-[10px] font-extrabold border-2 leading-tight"
+                  style={{ borderColor: form === POTENCY_FORM[k] ? "#0B7C86" : "#E3ECEA",
+                           color: form === POTENCY_FORM[k] ? "#0B7C86" : "#45605F" }}>
+                  {t(`dosing.form.${POTENCY_FORM[k]}`)}
+                </button>
+              ))}
+            </div>
 
-        {/* Kit precision drives the testing-cadence advice */}
-        <button onClick={() => setShowSigma((v) => !v)}
-          className="mt-3 w-full flex items-center justify-between gap-2 py-2 border-t border-app">
-          <span className="text-[12px] font-bold text-ink2 min-w-0 truncate">
-            Test kit precision: <span className="text-ink font-black">±{kitSigma(elem.key, settings)} {elem.unit}</span>
-          </span>
-          <span className="text-[11px] font-extrabold text-teal-brand flex items-center gap-1 shrink-0">
-            {showSigma ? "Close" : "Change"} {showSigma ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
-          </span>
-        </button>
-        {showSigma && (
-          <div className="mt-2 rounded-xl p-3 bg-app border border-app">
-            <Field label={`Repeat-test spread (${elem.unit})`}>
-              <div className="flex gap-2">
-                <input type="number" inputMode="decimal" step="0.001" value={sigmaVal}
-                  onChange={(e) => setSigmaVal(e.target.value)} className={inputCls} />
-                <Btn onClick={saveSigma} className="shrink-0">
-                  <span className="flex items-center gap-1.5"><Save size={14} /> Save</span>
-                </Btn>
-              </div>
-            </Field>
-            <p className="text-[11px] text-ink2 font-medium mt-2 leading-relaxed">
-              How much your readings vary when you test the same water twice — not how much the tank
-              varies. Titration kits are typically about one drop's worth; digital checkers quote a
-              figure on the box. This drives the testing-frequency advice in Insights.
+            {form === POTENCY_FORM.GRAMS_PER_LITRE && (
+              <>
+                <Field label={t("dosing.chemical")} className="mb-2">
+                  <select className={inputCls} value={chemical}
+                    onChange={(e) => setChemical(e.target.value)}>
+                    {CHEMICALS.map((c) => (
+                      <option key={c.key} value={c.key}>{t(c.label)}</option>
+                    ))}
+                  </select>
+                </Field>
+                <Field label={t("dosing.gPerL")} className="mb-2">
+                  <input type="number" inputMode="decimal" className={inputCls}
+                    value={gPerL} onChange={(e) => setGPerL(e.target.value)} />
+                </Field>
+              </>
+            )}
+
+            {form === POTENCY_FORM.DKH_PER_ML && (
+              <Field label={t("dosing.dkhPerMl")} className="mb-2">
+                <input type="number" inputMode="decimal" step="0.0001" className={inputCls}
+                  value={facts.selectedPotencyDkhPerMl}
+                  onChange={(e) => setFacts({ ...facts, selectedPotencyDkhPerMl: e.target.value })} />
+              </Field>
+            )}
+
+            {form === POTENCY_FORM.DKH_PER_ML_PER_100L && (
+              <Field label={t("dosing.dkhPerMlPer100L")} className="mb-2">
+                <input type="number" inputMode="decimal" step="0.0001" className={inputCls}
+                  value={per100L} onChange={(e) => setPer100L(e.target.value)} />
+              </Field>
+            )}
+
+            {/* WHAT WAS DERIVED, AND FROM WHAT. Never silently. */}
+            <p className="text-[11px] font-bold text-teal-brand leading-relaxed mb-2">
+              {derived.kind === "stated" && t("dosing.statedDirectly")}
+              {derived.kind === "fromEngine" && t("dosing.derivedFromEngine", { value: fmtPotency(derived.value) })}
+              {derived.kind === "fromVolume" && t("dosing.derivedFromVolume", { value: fmtPotency(derived.value), volume: fmtAmount(derived.volume) })}
+              {derived.kind === "needsVolume" && t("dosing.derivedNeedsVolume")}
+              {derived.kind === "afterSave" && t("dosing.derivedAfterSave")}
             </p>
-          </div>
-        )}
+            <Btn className="w-full" onClick={saveStrength}>
+              <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span>
+            </Btn>
+            {strengthMsg && <p className="text-[11px] font-extrabold text-teal-brand mt-2">{strengthMsg}</p>}
 
-        {/* This element's change history */}
-        {elemLog.length > 0 && (
-          <div className="mt-3 pt-3 border-t border-app">
-            <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
-              {elem.label} changes
+            {/* ---- the dose in force -------------------------------------- */}
+            <div className="border-t border-app mt-4 pt-3">
+              <h4 className="text-[13px] font-black text-ink mb-1">{t("dosing.currentHead")}</h4>
+              <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-2">
+                {t("dosing.currentLead")}
+              </p>
+              <Field label={t("dosing.current")} className="mb-2">
+                <input type="number" inputMode="decimal" step="0.01" className={inputCls}
+                  value={current} onChange={(e) => setCurrent(e.target.value)} />
+              </Field>
+              <p className="text-[11px] font-bold text-ink2 mb-2">
+                {standing != null ? t("dosing.currentOnRecord", { dose: fmtAmount(standing) }) : t("dosing.currentNone")}
+              </p>
+              {standing != null && (
+                <p className="text-[11px] font-medium text-ink2 leading-relaxed mb-2">
+                  {t("dosing.currentUseChange")}
+                </p>
+              )}
+              <Btn className="w-full" onClick={saveCurrent}>
+                <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span>
+              </Btn>
+              {currentMsg && <p className="text-[11px] font-extrabold text-teal-brand mt-2">{currentMsg}</p>}
             </div>
-            <div className="divide-y divide-app">
-              {elemLog.slice(0, 5).map((d) => (
-                <div key={d.id} className="flex items-center justify-between py-2">
-                  <span className="text-[13px] font-bold text-ink">{d.ml} mL/day</span>
-                  <div className="flex items-center gap-3">
-                    <span className="text-[11px] text-ink2 font-semibold">{fmtShort(d.date)}</span>
-                    <DeleteButton onDelete={() => onDeleteDoseChange(d.id)} size={13} />
-                  </div>
-                </div>
+
+            {/* ---- the pump's step ---------------------------------------- */}
+            <div className="border-t border-app mt-4 pt-3">
+              {KEEPER_FACTS.filter((f) => f.key === "recommendationPrecisionMlPerDay").map((f) => (
+                <Field key={f.key} label={`${t(f.label)}${f.unit ? ` (${f.unit})` : ""}`} className="mb-2">
+                  <input type="number" inputMode="decimal" className={inputCls}
+                    value={facts[f.key]} onChange={(e) => setFacts({ ...facts, [f.key]: e.target.value })}
+                    placeholder={t(f.hint)} />
+                </Field>
               ))}
+              <Btn className="w-full" onClick={() => saveFacts(["recommendationPrecisionMlPerDay"])}>
+                <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save</span>
+              </Btn>
             </div>
+
+            {/* ---- every change to the dose ------------------------------- */}
+            <div className="border-t border-app mt-4 pt-3">
+              <h4 className="text-[13px] font-black text-ink mb-1">Dose changes</h4>
+              <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
+                Every change to the daily dose, newest first. The date and time matter: the engine
+                measures the tank's response from the moment the change took effect, so a change made
+                at 9am and one made at 9pm are not the same change.
+              </p>
+        <button onClick={() => setDcOpen((v) => !v)}
+          className="w-full flex items-center justify-between gap-2 rounded-xl border border-app px-3 py-2.5 mb-3">
+          <span className="text-[12px] font-extrabold text-teal-brand">Record a dose change</span>
+          {dcOpen ? <ChevronUp size={14} className="text-ink2" /> : <ChevronDown size={14} className="text-ink2" />}
+        </button>
+
+        {dcOpen && (
+          <div className="mb-3">
+            <div className="grid grid-cols-2 gap-2">
+              <Field label="From (mL/day)">
+                <input type="number" inputMode="decimal" step="0.1" value={dcFrom}
+                  onChange={(e) => setDcFrom(e.target.value)} className={inputCls} />
+              </Field>
+              <Field label="To (mL/day)">
+                <input type="number" inputMode="decimal" step="0.1" value={dcTo}
+                  onChange={(e) => setDcTo(e.target.value)} className={inputCls} />
+              </Field>
+            </div>
+            <div className="grid grid-cols-2 gap-2 mt-2">
+              <Field label="Date">
+                <input type="date" value={dcDate} max={todayStr()}
+                  onChange={(e) => setDcDate(e.target.value)} className={inputCls} />
+              </Field>
+              <Field label="Time">
+                <input type="time" value={dcTime} onChange={(e) => setDcTime(e.target.value)} className={inputCls} />
+              </Field>
+            </div>
+            <Btn className="w-full mt-3" onClick={submitDoseChange}>
+              <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Record it</span>
+            </Btn>
           </div>
         )}
-      </Card>
 
-      {/* --- Full dosing history across all elements --- */}
-      {doseLog.length > 0 && (
-        <InfoBlock icon={Activity} eyebrow="History" title="Doser changes" tone="#45605F"
-          collapsible
-          summary={doseLog.length
-            ? `${doseLog.length} change${doseLog.length === 1 ? "" : "s"} recorded`
-            : "Nothing recorded yet"}>
-          <div className="divide-y divide-app">
-            {[...doseLog].sort(byNewest).map((d) => {
-              const el = DOSE_ELEMENTS.find((e) => e.key === (d.element || "alkalinity"));
-              const prior = [...doseLog]
-                .filter((x) => (x.element || "alkalinity") === (d.element || "alkalinity") && x.date < d.date)
-                .sort(byNewest)[0];
-              const delta = prior ? d.ml - prior.ml : null;
-              return (
-                <div key={d.id} className="flex items-center justify-between gap-2 py-2.5">
-                  <div className="min-w-0">
-                    <div className="text-[13px] font-black text-ink">
-                      {el ? el.label : "Alkalinity"} → {d.ml} mL/day
-                    </div>
-                    <div className="text-[11px] text-ink2 font-semibold">
-                      {fmtDate(d.date)}
-                      {delta != null && delta !== 0 && (
-                        <span style={{ color: delta > 0 ? "#0B7C86" : "#A2621B" }}>
-                          {" · "}{delta > 0 ? "up" : "down"} {Math.abs(delta).toFixed(1)} mL from {prior.ml}
+        {newestFirst.length === 0 ? (
+          <p className="text-[13px] text-ink2 font-medium">No dose changes recorded yet.</p>
+        ) : (
+          <div className="space-y-1.5">
+            {newestFirst.map((d) => (
+              <div key={d.id} className="flex items-center gap-2 rounded-lg bg-app px-2.5 py-2">
+                <div className="min-w-0 flex-1">
+                  <div className="text-[13px] font-black text-ink truncate">
+                    {d.isStart ? (
+                      <>{fmtAmount(d.to)} mL/day</>
+                    ) : (
+                      <>
+                        {fmtAmount(d.from)} → {fmtAmount(d.to)} mL/day
+                        <span className="text-ink2 font-bold ml-1">
+                          ({d.to > d.from ? "+" : ""}{fmtAmount(d.to - d.from)})
                         </span>
-                      )}
-                      {prior == null && " · first recorded"}
-                    </div>
+                      </>
+                    )}
                   </div>
-                  <DeleteButton onDelete={() => onDeleteDoseChange(d.id)} size={13} />
-                </div>
-              );
-            })}
-          </div>
-          <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
-            Every change here also appears as a marker on that element's own chart, so you can see what each adjustment actually did.
-          </p>
-        </InfoBlock>
-      )}
-
-      {/* --- One-off corrections, as their own kind of entry ---
-
-          A correction is not a dose change and is not a reading, and it was
-          previously neither listed nor exported anywhere. The engines have
-          always read it — it is what stops a rise being scored as the tank
-          suddenly needing less — so the app was reasoning permanently from
-          something the user had no way to look at, check or take back. Its
-          own block rather than a row in Doser changes, because the two hold
-          different quantities: a dose change is mL per day and stays set, a
-          correction is a single addition in mL and is over once it is in. */}
-      {corrections.length > 0 && (
-        <InfoBlock icon={Calculator} eyebrow="History" title="One-off corrections" tone="#B8541A"
-          collapsible
-          summary={`${corrections.length} correction${corrections.length === 1 ? "" : "s"} logged`}>
-          <div className="divide-y divide-app">
-            {[...corrections].sort(byNewest).map((c) => {
-              const el = DOSE_ELEMENTS.find((e) => e.key === (c.element || "alkalinity"));
-              const label = el ? el.label.toLowerCase() : "alkalinity";
-              const down = c.direction === "down" || c.ml < 0;
-              return (
-                <div key={c.id} className="flex items-center justify-between gap-2 py-2.5">
-                  <div className="min-w-0">
-                    <div className="text-[13px] font-black text-ink">
-                      {fmtAmount(Math.abs(c.ml))} mL of {label}
-                    </div>
-                    <div className="text-[11px] text-ink2 font-semibold">
-                      {fmtDate(c.date)}{c.time ? ` · ${c.time}` : ""}
-                      {" · "}{down ? "to bring it down" : "one-off, on top of the daily dose"}
-                    </div>
+                  <div className="text-[11px] font-bold text-ink2">
+                    {fmtDate(d.date)}{fmtTime(d.time) ? ` · ${fmtTime(d.time)}` : ""}
+                    {d.isStart ? " · where the record begins" : ""}
+                    {d.fromDerived ? " · the earlier figure is read from the record, not typed" : ""}
                   </div>
-                  {onDeleteCorrection && (
-                    <DeleteButton onDelete={() => onDeleteCorrection(c.id)} size={13}
-                      confirmMessage="Correction removed" />
-                  )}
                 </div>
-              );
-            })}
-          </div>
-          <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
-            The app treats the rise these caused as your doing rather than as the tank needing less,
-            so they stay in the reasoning for as long as they are listed here. Removing one you
-            logged by mistake takes it back out of that reasoning too.
-          </p>
-        </InfoBlock>
-      )}
-
-      {/* --- 9. Correction calculator --- */}
-      <InfoBlock icon={Calculator} eyebrow="Actions" title="Correction calculator" tone="#B8541A"
-        collapsible
-        summary="Work out a one-off dose to move a parameter">
-        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
-          <Field label="Parameter">
-            <select value={calcParam} onChange={(e) => { setCalcParam(e.target.value); setCalcAimPoint(""); }} className={inputCls}>
-              {correctable.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
-            </select>
-          </Field>
-          <Field label={`Aim point${calcDef && calcDef.unit ? ` (${calcDef.unit})` : ""}`}>
-            <input type="number" inputMode="decimal" step={calcDef ? calcDef.step : 0.1} value={calcAimPoint}
-              onChange={(e) => setCalcAimPoint(e.target.value)} className={inputCls}
-              placeholder={calcDef ? `${calcDef.min}–${calcDef.max}` : ""} />
-          </Field>
-        </div>
-        {calcGate ? (
-          <div className="rounded-xl p-3" style={{ background: "#A2621B12", border: "1px solid #A2621B40" }}>
-            <p className="text-[13px] text-ink font-medium leading-relaxed">{calcGate.why}</p>
-          </div>
-        ) : calcCurrent == null ? (
-          <p className="text-[13px] text-ink2 font-medium">No current reading logged for {calcDef ? calcDef.label.toLowerCase() : "this parameter"} — log one first.</p>
-        ) : !(settings.volumeL > 0) ? (
-          <p className="text-[13px] text-ink2 font-medium">
-            Currently {calcCurrent}{calcDef.unit}. Set your tank's net volume above before this
-            can be worked out — every amount here is per litre of water.
-          </p>
-        ) : !correction ? (
-          <p className="text-[13px] text-ink2 font-medium">
-            Currently {calcCurrent}{calcDef.unit}. Enter an aim point to see what it takes to get there in {settings.volumeL}L.
-          </p>
-        ) : !correction.raising ? (
-          <div className="rounded-xl p-3" style={{ background: "#1D6FA512", border: "1px solid #1D6FA540" }}>
-            <p className="text-[13px] text-ink font-medium leading-relaxed">
-              You're aiming to <strong>lower</strong> {calcDef.label.toLowerCase()} from {calcCurrent} to {correction.delta + calcCurrent}{calcDef.unit}. There's no additive for this — the safe route is dilution through water changes, or simply reducing dosing and letting consumption pull it down. Use the water change model below to see how much each change would move it.
-            </p>
+                <DeleteButton onDelete={() => onDeleteEvent(d.id)} confirmMessage="Dose change removed" />
+              </div>
+            ))}
           </div>
-        ) : (
-          <div className="rounded-xl p-3" style={{ background: "#B8541A12", border: "1px solid #B8541A40" }}>
-            <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
-              Raising {calcDef.label.toLowerCase()} by {correction.delta.toFixed(correction.delta < 1 ? 2 : 0)}{correction.unit} in {settings.volumeL}L.
-              {correction.days > 1
-                ? ` That exceeds the safe change of ${correction.maxPerDay}${correction.unit} per day, so spread it over ${correction.days} days.`
-                : " That's within a safe single-day change."}
-            </p>
-            <div className="space-y-2">
-              {correction.products.map((p) => (
-                <div key={p.name} className="p-2 rounded-lg bg-white">
-                  <div className="text-[13px] font-black text-ink">{p.name}</div>
-                  <div className="text-[13px] font-bold" style={{ color: "#B8541A" }}>
-                    {fmtDoseMass(p.totalG)} total
-                    {correction.days > 1 && ` · ${fmtDoseMass(p.perDayG)}/day for ${correction.days} days`}
-                  </div>
-                  <div className="text-[11px] text-ink2 font-semibold mt-0.5">{p.note}</div>
-                </div>
-              ))}
-              {correction.tiny && (
-                <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
-                  These amounts are below what a kitchen scale weighs accurately. Rather than measuring the powder directly, dissolve a larger known weight into a litre of RODI and dose a measured fraction of that solution.
-                </p>
-              )}
+        )}
             </div>
-            <p className="text-[11px] text-ink2 font-medium mt-2">
-              Dissolve in RODI before adding, and add to high flow. Re-test before dosing again rather than stacking doses on an assumption.
-            </p>
-          </div>
+          </>
         )}
-      </InfoBlock>
+      </SetupSection>
 
+      {/* ---- test mode ---------------------------------------------------
+           ROUND THREE, ITEM 9. Here rather than on the tab bar because, in the
+           port's own words, "it is not part of keeping a tank". */}
+      <SetupSection icon={Settings2} category="Tools" colour="#A2621B"
+        heading={t("testmode.title")}
+        subtitle={testModeOn ? t("testmode.on") : t("testmode.off")}
+        open={openId === "testmode"} onToggle={() => toggle("testmode")}>
+        <TestMode onModeChange={onModeChange} />
+      </SetupSection>
 
-      {/* --- Lighting log --- */}
-      <InfoBlock icon={SunMedium} eyebrow="AI Blade" title="Lighting changes" tone="#926A09"
-        collapsible
-        summary={lighting.length
-          ? `${lighting.length} change${lighting.length === 1 ? "" : "s"} · last ${fmtShort(lighting[0].date)}`
-          : "Nothing recorded yet"}>
-        <form onSubmit={submitLighting} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
-          <Field label="Date">
-            <input type="date" value={lightDate} onChange={(e) => setLightDate(e.target.value)} className={inputCls} max={todayStr()} />
-          </Field>
-          <Field label="What changed" className="sm:col-span-3">
-            <input type="text" value={lightNote} onChange={(e) => setLightNote(e.target.value)} className={inputCls}
-              placeholder="e.g. bumped blue channel to 80%" />
-          </Field>
-          <div className="sm:col-span-4">
-            <Btn type="submit" className="w-full sm:w-auto">
-              <span className="flex items-center justify-center gap-1.5"><Plus size={14} /> Log change</span>
-            </Btn>
-          </div>
-        </form>
-        {lighting.length === 0 ? (
-          <p className="text-[13px] text-ink2 font-medium">No lighting changes logged yet.</p>
+      {/* ---- lighting ---------------------------------------------------- */}
+      <SetupSection icon={SunMedium} category="The tank" colour="#A2621B"
+        heading="Lighting changes"
+        subtitle={lightingChanges.length ? `${lightingChanges.length} recorded` : "none recorded"}
+        open={openId === "lighting"} onToggle={() => toggle("lighting")}>
+        <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
+          A lighting change marks every chart, because it touches everything. Record one from
+          Tasks; this is the list.
+        </p>
+        {lightingChanges.length === 0 ? (
+          <p className="text-[13px] text-ink2 font-medium">Nothing recorded yet.</p>
         ) : (
-          <div className="divide-y divide-app">
-            {lighting.slice(0, 8).map((l) => (
-              <div key={l.id} className="flex items-start justify-between gap-2 py-2">
-                <div className="min-w-0">
-                  <div className="text-[11px] text-ink2 font-bold">{fmtDate(l.date)}</div>
-                  <div className="text-[13px] font-semibold text-ink">{l.note}</div>
+          <div className="space-y-1.5">
+            {lightingChanges.map((l) => (
+              <div key={l.id} className="flex items-center gap-2 rounded-lg bg-app px-2.5 py-2">
+                <div className="min-w-0 flex-1">
+                  <div className="text-[13px] font-black text-ink truncate">{l.note || "Lighting changed"}</div>
+                  <div className="text-[11px] font-bold text-ink2">{fmtDate(l.date)}</div>
                 </div>
-                <DeleteButton onDelete={() => onDeleteLighting(l.id)} />
+                <DeleteButton onDelete={() => onDeleteEvent(l.id)} confirmMessage="Lighting change removed" />
               </div>
             ))}
           </div>
         )}
-        <p className="text-[12px] text-ink2 font-medium leading-relaxed mt-3">
-          Each change drops a marker on every parameter chart, so you can see whether a lighting tweak moved your alkalinity demand.
-        </p>
-      </InfoBlock>
+      </SetupSection>
 
-      {/* --- 11. Backup and export --- */}
-      {/* Anything hidden has to be findable again, or dismissing becomes its own
-          trap — a notice you can never get back. */}
-      <InfoBlock icon={CheckCircle2} eyebrow="Acknowledged" title="Hidden notices" tone="#45605F"
-        collapsible
-        summary={dismissedList.length
-          ? `${dismissedList.length} notice${dismissedList.length === 1 ? "" : "s"} hidden`
-          : "Nothing hidden"}>
-        {dismissedList.length === 0 ? (
-          <p className="text-[13px] text-ink2 font-medium leading-relaxed">
-            Notices you hide will be listed here. They come back on their own if the situation changes —
-            hiding one only silences the version you read.
+      {/* ---- hidden notices ---------------------------------------------- */}
+      <SetupSection icon={Bell} category="Notices" colour="#7B4FCB"
+        heading="Hidden notices"
+        subtitle={hiddenNotices.length ? `${hiddenNotices.length} put away` : "none put away"}
+        open={openId === "hidden"} onToggle={() => toggle("hidden")}>
+        {hiddenNotices.length === 0 ? (
+          <p className="text-[13px] text-ink2 font-medium">
+            Nothing is hidden. A notice you put away comes back on its own if the engine raises it
+            with different numbers.
           </p>
         ) : (
           <>
-            <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
-              These are hidden from the rest of the app. Each will return by itself if the underlying
-              numbers move enough to change what it says.
-            </p>
-            <div className="space-y-2">
-              {dismissedList.map((f) => (
-                <div key={f.id} className="flex items-start justify-between gap-2 rounded-lg p-2.5 bg-app">
-                  <div className="min-w-0">
-                    <div className="text-[12px] font-black text-ink">{f.title}</div>
-                    <div className="text-[11px] text-ink2 font-medium">
-                      {(f.params || []).join(", ") || f.scope}
-                    </div>
-                  </div>
-                  <button onClick={() => onRestoreFinding(findingKey(f))}
+            <div className="space-y-1.5 mb-3">
+              {hiddenNotices.map((n) => (
+                <div key={n.id} className="flex items-center gap-2 rounded-lg bg-app px-2.5 py-2">
+                  <span className="text-[12px] font-bold text-ink min-w-0 flex-1">{n.title}</span>
+                  <button onClick={() => onRestoreNotice(n)}
                     className="shrink-0 text-[11px] font-extrabold text-teal-brand">Show again</button>
                 </div>
               ))}
             </div>
-            <Btn variant="ghost" className="w-full mt-3" onClick={onRestoreAllFindings}>
-              <span className="flex items-center justify-center gap-1.5"><RotateCcw size={13} /> Show all again</span>
-            </Btn>
+            <Btn variant="ghost" className="w-full" onClick={onRestoreAllNotices}>Show all again</Btn>
           </>
         )}
-      </InfoBlock>
+      </SetupSection>
 
-      <InfoBlock icon={Waves} eyebrow="Fun" title="Opening animation" tone="#0B7C86"
-        collapsible
-        summary="Watch the reef intro again">
-        <p className="text-[13px] text-ink font-medium leading-relaxed mb-3">
-          This plays once each time the app is opened. Tap below to watch it now.
+      {/* ---- backup and export ------------------------------------------- */}
+      <SetupSection icon={Download} category="Your data" colour="#45605F"
+        heading="Backup and export"
+        subtitle={storageHealth ? storageHealth.summary : "a file you can keep"}
+        open={openId === "backup"} onToggle={() => toggle("backup")}>
+        <p className="text-[12px] text-ink2 font-medium leading-relaxed mb-3">
+          Browser storage is not durable. This writes out everything this device holds — every
+          event, every stored assessment with the version that produced it, and the whole
+          configuration history — as one file you can keep somewhere else.
         </p>
-        <Btn className="w-full" onClick={onPlayIntro}>
-          <span className="flex items-center justify-center gap-1.5"><Waves size={14} /> Play intro</span>
-        </Btn>
-      </InfoBlock>
-
-      <InfoBlock icon={Download} eyebrow="Your data" title="Backup & export" tone="#45605F"
-        collapsible
-        defaultOpen={backupAge == null || backupAge > 14}
-        summary={backupAge == null ? "No backup recorded on this device"
-          : backupAge > 14 ? `Last backup ${backupAge} days ago`
-          : `Backed up ${backupAge === 0 ? "today" : `${backupAge}d ago`} · ${readings.length} readings`}>
-        <div className="rounded-xl p-3 mb-3" style={{ background: backupAge == null || backupAge > 14 ? "#A2621B15" : "#0B7C8612" }}>
-          <p className="text-[13px] text-ink font-medium leading-relaxed">
-            {/* Not "you haven't saved a backup yet" — the app cannot know that.
-                `last-backup` lives in the same storage as everything else, so a
-                browser that clears its data erases the record of the backup
-                along with the data the backup was protecting. Saying no backup
-                exists would be a guess, and it would be wrong at exactly the
-                moment it matters most: a user with a good file in iCloud Drive,
-                told by the only screen that could help them that there is
-                nothing to recover. Report the missing record, and point at
-                restore. */}
-            {backupAge == null
-              ? `This device has no record of a backup. That record is erased along with everything else when a browser clears its storage, so if you saved a file before, it may still be there — restore it below rather than starting again. Browser storage isn't permanent: clearing Safari, or not opening the app for a week, can erase everything, and a backup file is the only copy that survives that.`
-              : backupAge > 14
-              ? `Your last backup was ${backupAge} days ago. Worth saving a fresh one.`
-              : `Last backup ${backupAge === 0 ? "today" : backupAge === 1 ? "yesterday" : `${backupAge} days ago`}.`}
-          </p>
-          {persistState && (
-            <p className="text-[11px] text-ink2 font-medium mt-1.5">
-              {persistState.granted
-                ? "This browser has agreed to keep your data rather than evicting it automatically."
-                : persistState.supported
-                ? "This browser wouldn't guarantee your data against automatic eviction, which makes backups more important."
-                : "This browser can't guarantee your data against automatic eviction, which makes backups more important."}
-            </p>
-          )}
-        </div>
-
-        <Btn className="w-full mb-2" onClick={async () => {
-          const b = await buildBackup();
-          downloadJson(b, `dans-tank-backup-${todayStr()}.json`);
-          await saveKey("last-backup", b.createdAt);
-          setBackupAt(b.createdAt);
-          setRestoreMsg("Backup saved. Keep it somewhere that isn't this phone — Files, iCloud Drive, or emailed to yourself.");
-          setTimeout(() => setRestoreMsg(null), 8000);
-        }}>
-          <span className="flex items-center justify-center gap-1.5"><Save size={14} /> Save backup file</span>
+        <Btn className="w-full" onClick={onExport}>
+          <span className="flex items-center justify-center gap-1.5"><Download size={14} /> Export everything</span>
         </Btn>
-
-        {/* One tap to Files, iCloud Drive or Mail, on the platforms where the
-            automatic file below does not exist. Not recorded as a backup: the
-            share sheet reports dismissal and success identically in practice,
-            so a `last-backup` written here would sometimes claim a copy that
-            was cancelled. */}
-        {shareSupported() && (
-          <Btn variant="ghost" className="w-full mb-2" onClick={async () => {
-            const res = await shareBackup(await buildBackup());
-            setRestoreMsg(res.ok
-              ? "Backup shared. If you saved it to Files or iCloud Drive, it will survive anything that happens to this browser."
-              : "Sharing was cancelled — nothing was saved.");
-            setTimeout(() => setRestoreMsg(null), 8000);
-          }}>
-            <span className="flex items-center justify-center gap-1.5"><Upload size={14} /> Share a backup file</span>
-          </Btn>
-        )}
-
-        <label className="block">
-          <span className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-app px-4 py-2.5 text-[13px] font-extrabold text-ink2 cursor-pointer active:bg-app">
-            <Upload size={14} /> Restore from a backup
-          </span>
-          <input type="file" accept=".json,application/json" className="hidden"
-            onChange={async (e) => {
-              const file = e.target.files && e.target.files[0];
-              e.target.value = "";
-              if (!file) return;
-              try {
-                const parsed = JSON.parse(await file.text());
-                const info = inspectBackup(parsed, restoreCurrent(), customRanges);
-                if (!info.ok) { setRestoreMsg(info.reason); return; }
-                setPending({ kind: "file", parsed, info });
-                setRangeChoice(null);
-                setRestoreMsg(null);
-              } catch (err) {
-                setRestoreMsg("That file couldn't be read as a backup.");
-              }
-            }} />
-        </label>
-
-        {pending && (
-          <div ref={previewRef} className="mt-3 rounded-xl border-2 p-3" style={{ borderColor: "#0B7C8640", background: "#0B7C8608" }}>
-            <div className="text-[11px] font-extrabold uppercase tracking-wide text-ink2 mb-1.5">
-              {pending.kind === "snapshot" ? "Snapshot" : "Backup"} from{" "}
-              {pending.info.createdAt ? fmtDate(pending.info.createdAt.slice(0, 10)) : "an unknown date"}
-            </div>
-            {/* Entries the file holds but the app cannot read. Counting them as
-                importable made the preview promise more than the restore would
-                deliver, and the difference vanished without a word — the worst
-                shape a data-loss bug can take, because nothing looks wrong. */}
-            {pending.info.skipped > 0 && (
-              <p className="text-[11px] font-bold mb-2 rounded-lg px-2 py-1.5"
-                style={{ color: "#B8541A", background: "#B8541A14" }}>
-                {pending.info.skipped} {pending.info.skipped === 1 ? "entry" : "entries"} in
-                this file can't be read and won't be restored. The counts below are what
-                will actually come in.
-              </p>
-            )}
-            <div className="space-y-1 mb-2">
-              {pending.info.summary.map((row) => (
-                <div key={row.key} className="flex items-center justify-between gap-2">
-                  <span className="text-[12px] font-bold text-ink2">{BACKUP_LABELS[row.key] || row.key}</span>
-                  <span className="text-[12px] font-black text-ink">
-                    {row.total} in file · <span style={{ color: row.fresh ? "#0B7C86" : "#5F7575" }}>{row.fresh} new</span>
-                  </span>
-                </div>
-              ))}
-            </div>
-            <p className="text-[11px] text-ink2 font-medium leading-relaxed mb-2">
-              Your readings, doses and other entries are only ever added to — nothing is overwritten
-              or duplicated, and running the same file twice changes nothing the second time.
-            </p>
-
-            {/* Target ranges are the one thing a restore cannot merge, and the
-                one thing it used to overwrite without saying so. Every reading
-                in the log is coloured, shaded and described against these
-                bands as it is drawn — nothing records what band a reading was
-                in when it was logged — so taking the file's copy silently
-                re-labels months of history, including tests logged after the
-                backup was made. Keeping this device's copy is just as much a
-                decision, so neither is taken on the user's behalf. */}
-            {rangeConflicts.length > 0 && (
-              <div className="rounded-lg border-2 p-2.5 mb-2" style={{ borderColor: "#A2621B55", background: "#A2621B12" }}>
-                <div className="text-[11px] font-black mb-1" style={{ color: "#8A5A18" }}>
-                  This {pending.kind === "snapshot" ? "snapshot" : "backup"}'s target ranges are not the ones set here
-                </div>
-                <div className="space-y-1 my-1.5">
-                  {rangeConflicts.map((c) => {
-                    const def = paramDefs.find((d) => d.key === c.param);
-                    const unit = def && def.unit ? def.unit : "";
-                    const band = (r) => (r ? `${r.min}–${r.max}${unit}` : "the app's own band");
-                    return (
-                      <div key={c.param} className="text-[11px] font-semibold text-ink2 leading-relaxed">
-                        <span className="font-black text-ink">{def ? def.label : c.param}</span>
-                        {" — here "}<span className="font-black">{band(c.device)}</span>
-                        {", in this file "}<span className="font-black">{band(c.file)}</span>
-                      </div>
-                    );
-                  })}
-                </div>
-                <p className="text-[11px] font-medium leading-relaxed mb-2" style={{ color: "#45605F" }}>
-                  Your whole log is judged against whichever you pick, not just what comes back in
-                  this restore — every past reading is re-labelled the moment you choose. Everything
-                  else above is restored either way.
-                </p>
-                <div className="grid grid-cols-2 gap-2">
-                  {[["keep", "Keep the ones set here"], ["file", `Use the ${pending.kind === "snapshot" ? "snapshot" : "file"}'s`]].map(([v, label]) => (
-                    <button key={v} onClick={() => setRangeChoice(v)}
-                      aria-pressed={rangeChoice === v}
-                      className="rounded-lg border-2 px-2 py-2 text-[11px] font-extrabold leading-tight"
-                      style={{ borderColor: rangeChoice === v ? "#8A5A18" : "#E3ECEA",
-                               background: rangeChoice === v ? "#A2621B22" : "#fff",
-                               color: rangeChoice === v ? "#8A5A18" : "#45605F" }}>
-                      {label}
-                    </button>
-                  ))}
-                </div>
-              </div>
-            )}
-
-            <div className="grid grid-cols-2 gap-2">
-              <Btn variant="ghost" onClick={() => { setPending(null); setRangeChoice(null); }}>Cancel</Btn>
-              <Btn disabled={rangeConflicts.length > 0 && !rangeChoice} onClick={async () => {
-                const opts = { ranges: rangeChoice || "keep" };
-                const merged = pending.kind === "snapshot"
-                  ? await restoreSnapshot(pending.key, restoreCurrent(), true, opts)
-                  : await restoreBackup(pending.parsed, restoreCurrent(), true, opts);
-                if (!merged) {
-                  setPending(null); setRangeChoice(null);
-                  setRestoreMsg("That snapshot could not be read.");
-                  setTimeout(() => setRestoreMsg(null), 8000);
-                  return;
-                }
-                onRestored(merged);
-                const added = pending.info.summary.reduce((a, r) => a + r.fresh, 0);
-                /* The old message said "nothing was overwritten", which was
-                   false for the one field that was. It now reports what was
-                   decided about the target ranges, because that is the part a user
-                   cannot see happening. */
-                const ranges = rangeConflicts.length === 0 ? ""
-                  : rangeChoice === "file" ? " Your target ranges now come from this file."
-                  : " The target ranges set on this device were kept.";
-                setPending(null);
-                setRangeChoice(null);
-                setRestoreMsg((added
-                  ? `Restored — ${added} ${added === 1 ? "entry" : "entries"} added.`
-                  : "Nothing new to add; your data already matched that file.") + ranges);
-                setTimeout(() => setRestoreMsg(null), 8000);
-              }}>Restore</Btn>
-            </div>
-            {rangeConflicts.length > 0 && !rangeChoice && (
-              <p className="text-[11px] font-bold mt-2" style={{ color: "#8A5A18" }}>
-                Choose what happens to the target ranges first.
-              </p>
-            )}
-          </div>
-        )}
-
-        {restoreMsg && (
-          <p className="text-[12px] font-bold text-ink mt-2 leading-relaxed">{restoreMsg}</p>
-        )}
-
-        {/* The automatic backup file — Chromium only, which is why the share
-            button above exists. Once a file is chosen the app rewrites it
-            daily with no further prompts; a lapsed permission degrades to a
-            tap here rather than failing silently. */}
-        {fileHandleSupported() && (
-          <div className="mt-4 pt-3 border-t border-app">
-            <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
-              {fileState
-                ? fileState.needsTap
-                  ? "A backup file is set up, but the browser needs your permission again to keep writing it."
-                  : "This browser rewrites your chosen backup file automatically, about once a day. If the file lives in a synced folder, it survives anything that happens to this device."
-                : "This browser can keep one backup file up to date by itself — choose where once, and the app rewrites it about once a day with no further steps."}
-            </p>
-            {fileState && fileState.needsTap ? (
-              <Btn className="w-full sm:w-auto" onClick={async () => {
-                const res = await regrantAndWrite(fileState.handle, await buildBackup());
-                setRestoreMsg(res.ok ? "Backup file updated." : "The browser did not allow it — the file was not written.");
-                setTimeout(() => setRestoreMsg(null), 8000);
-                await refreshAuto();
-              }}>Allow updates again</Btn>
-            ) : (
-              <Btn variant="ghost" className="w-full sm:w-auto" onClick={async () => {
-                try {
-                  const handle = await window.showSaveFilePicker({
-                    suggestedName: "dans-tank-backup.json",
-                    types: [{ description: "Tank backup", accept: { "application/json": [".json"] } }],
-                  });
-                  await saveFileHandle(handle);
-                  await writeBackupToHandle(handle, await buildBackup());
-                  setRestoreMsg("Backup file created. The app will keep it up to date from here.");
-                  setTimeout(() => setRestoreMsg(null), 8000);
-                  await refreshAuto();
-                } catch { /* picker dismissed — nothing chosen, nothing changed */ }
-              }}>{fileState ? "Choose a different file" : "Choose where to keep it"}</Btn>
-            )}
-          </div>
-        )}
+      </SetupSection>
 
-        {/* The snapshot ring. Deliberately described as what it is: it lives
-            in the same origin as the data it copies and dies with it, so
-            calling it a backup would promise a protection it cannot give. */}
-        {snapshots.length > 0 && (
-          <div className="mt-4 pt-3 border-t border-app">
-            <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
-              The app also keeps its own last {snapshots.length === 1 ? "snapshot" : `${snapshots.length} daily snapshots`} of
-              everything, on this device. They undo a mistake — a bad restore, an accidental
-              delete — but they are erased along with everything else if the browser clears
-              its storage, so they are not a backup.
-            </p>
-            <div className="space-y-1">
-              {snapshots.map((s) => (
-                <div key={s.key} className="flex items-center justify-between gap-2">
-                  <span className="text-[12px] font-bold text-ink2">
-                    {fmtDate(s.key.slice(0, 10))} · {s.counts.readings || 0} readings
-                  </span>
-                  {/* Through the same preview the file restore uses. The ring
-                      was the one path that wrote on a single tap with nothing
-                      shown first, which is how a snapshot could re-label a
-                      whole log against an old target range before anyone saw it. */}
-                  <Btn variant="ghost" onClick={async () => {
-                    const parsed = await readSnapshot(s.key);
-                    const info = parsed && inspectBackup(parsed, restoreCurrent(), customRanges);
-                    if (!info || !info.ok) {
-                      setRestoreMsg("That snapshot could not be read.");
-                      setTimeout(() => setRestoreMsg(null), 8000);
-                      return;
-                    }
-                    setPending({ kind: "snapshot", key: s.key, parsed, info });
-                    setRangeChoice(null);
-                    setRestoreMsg(null);
-                  }}>Restore</Btn>
-                </div>
-              ))}
-            </div>
-          </div>
-        )}
+      {/* ---- the import -------------------------------------------------- */}
+      <SetupSection icon={Upload} category="Your data" colour="#45605F"
+        heading="Import your history"
+        subtitle="from a V1 backup file"
+        open={openId === "import"} onToggle={() => toggle("import")}>
+        {store
+          ? <ImportPanel store={store} onImported={onImported} />
+          : <p className="text-[13px] text-ink2 font-medium">The import is not wired up on this screen.</p>}
+      </SetupSection>
 
-        <div className="mt-4 pt-3 border-t border-app">
-          <p className="text-[13px] text-ink font-medium leading-relaxed mb-2">
-            The CSV below is for reading — open it in a spreadsheet or share it. It can't be
-            restored from, because it flattens ICP panels into rows and doesn't include your settings.
-          </p>
-          <Btn variant="ghost" className="w-full sm:w-auto"
-            onClick={() => downloadCsv(
-              buildCsv({ readings, icps, lighting, taskLog, doseLog, waterChanges, allTasks, corrections }),
-              `dans-tank-${todayStr()}.csv`)}>
-            <span className="flex items-center justify-center gap-1.5"><Download size={14} /> Download CSV</span>
-          </Btn>
-        </div>
+      {/* V1's opening animation is out by the brief, and the salvage inventory
+          had already put it under `LEAVE_BEHIND`: "327 lines of bundle for no
+          product function."
 
-        <p className="text-[11px] text-ink2 font-medium mt-3">
-          {readings.length} readings · {icps.length} ICP panels · {waterChanges.length} water changes · {doseLog.length} dose changes
-        </p>
-      </InfoBlock>
+          The correction calculator is recorded for later and is not built. V1
+          had four implementations of it and one of them lived in this file. */}
+      <div className="h-8" />
     </div>
   );
 }
```

### `app/src/App.jsx`

| | |
|---|---|
| V1 source | `src/App.jsx` |
| V1 commit | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 SHA-256 | `022f7b075372bec3783a8099216e0ed8a50b291d7e0bba228204c10e6229ba63` |
| V1 blob | `d03c3726f2c38088cfb0ff18577a042506e69a0c` |
| Ported SHA-256 | `7a559c4f6ec0839d303a1501595c7b68884106092e9c2a6efe8c859330da4e61` |
| Differences | 7 |

1. **chemistry removed — V1's nine analytics and dosing imports deleted; the shell imports V2's store, the read and write adapters, the assessment entry point and the present layer**

```diff
@@ -1,62 +1,84 @@
-import React, { useEffect, useMemo, useState } from 'react'
+import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
 import { Dashboard, ParamHistoryModal } from './components/Dashboard.jsx'
 import { DoseChangePopup, findingHidden, findingKey, findingSignature } from './components/DoseExpectation.jsx'
 import { DosingWizard } from './components/DosingWizard.jsx'
 import { TabErrorBoundary } from './components/ErrorBoundary.jsx'
-import { IcpResultPopup } from './components/IcpConfirmation.jsx'
-import { Insights } from './components/Insights.jsx'
-import { LaunchSplash } from './components/LaunchAnimation.jsx'
+import { IcpPanel } from './components/IcpPanel.jsx'
 import { LogResultPopup, Toast } from './components/ReadingConfirmation.jsx'
 import { Setup } from './components/Setup.jsx'
 import { TaskDonePopup } from './components/TaskCompletion.jsx'
 import { Tasks } from './components/Tasks.jsx'
-import { WaterLog } from './components/WaterLog.jsx'
-import { AlertTriangle, Waves, X } from './icons.jsx'
-import { DOSE_ELEMENTS } from './lib/analytics/consumption.js'
-import { fmtAmount } from './lib/analytics/time-in-range.js'
-import { addDays, byNewest, byOldest, nowTime } from './lib/analytics/time-of-day.js'
-import { DEFAULT_SETTINGS, LIGHTING_SEED, WATER_CHANGE_LITRES, WATER_CHANGE_SEED } from './lib/analytics/water-changes.js'
-import { buildBackup, requestPersistence } from './lib/backup.jsx'
-import { NAV, PARAM_DEFS, uid } from './lib/constants.js'
-import { fmtShort, paramStatus, todayStr } from './lib/dates.js'
-import { assessAlkalinity } from './lib/dosing/alkalinity.js'
-import { assessCalcium } from './lib/dosing/calcium.js'
-import { assessMagnesium, proposeCorrection } from './lib/dosing/helpers.js'
-import { doseStatus } from './lib/dosing/state.js'
-import { buildFindings } from './lib/findings.js'
-import { buildBriefing, buildOverview, explainScore } from './lib/narrative-engine.js'
-import { REMINDER_SEED, autoCompletions, computeReminders, intervalLabel, reminderState } from './lib/reminders.js'
-import { computeStability } from './lib/stability-engine.js'
-import { maybeAutoBackup } from './lib/auto-backup.js'
-import { assessInstall } from './lib/install-witness.js'
-import { drainLegacyStore, loadKey, notify, onStorageError, onToast, saveKey } from './lib/storage.js'
+import { TestLab, AllGraphsModal } from './components/AllParametersSheet.jsx'
+import { AlertTriangle, Beaker, FlaskConical, LayoutDashboard, ListChecks, Settings2, Waves, X } from './icons.jsx'
+import { NAV } from './lib/constants.js'
+import { todayStr, fmtShort } from './lib/dates.js'
+import { onStorageError, onToast, notify } from './lib/storage.js'
+import {
+  chartEventsFrom, latestByParamFrom, paramDefsFrom, readingsFrom, rowsFor,
+} from './lib/adapt.js'
+import {
+  correctReading, deleteRecord,
+  recordDoseChange, recordDoseState, recordIcpPanel, recordLightingChange, recordNote, recordOneOff,
+  recordReading, recordWaterChange,
+} from './lib/record.js'
+import { createStore } from './store/index.js'
+import { MODE, applyClock, currentMode, storeForMode } from './store/mode.js'
+import { TestMode, TestModeMarker } from './components/TestMode.jsx'
+import { POTENCY_FORM } from './store/config.js'
+import { KIND } from './store/ledger.js'
+import { autoCompletions, computeSchedule, makeTask, TASK_KIND } from './store/schedule.js'
+import { runAssessment, nowAsOf } from './assess.js'
+import { nowIso } from './store/time.js'
+import { ENGINE_STATE, onEngineState, warmUp } from './engine/client.js'
+import { cardContent, cardStatusLine } from './present/card-content.js'
+import { selectCard, instructsDoseChange } from './present/cards.js'
+import { episodesFrom, latestEpisode } from './present/episodes.js'
+import { positionTone } from './present/position.js'
+import { sayVerb, sayAction, sayPosition } from './present/wording.js'
+import { fmtAmount } from './lib/format.js'
+import { t } from './strings.js'
 
+/* The tab set is data in `lib/constants.js`, which imports nothing so it stays
+   loadable by a test runner that is Node and nothing else. The glyph each tab
+   is drawn with is bound here. */
+const NAV_ICON = {
+  dashboard: LayoutDashboard, flask: FlaskConical, beaker: Beaker,
+  checks: ListChecks, settings: Settings2,
+};
+
 /* ---------------------------------- main app ---------------------------------- */
 
+/* WHAT USED TO BE HERE.
 
-/* ===========================================================================
-   deriveTankState — everything the app believes about the tank, computed once
-   ===========================================================================
-   Before this, derivation was split: the app root computed the findings and
-   the three dosing assessments, while the Dashboard separately computed the
-   overview, the briefing and the score working, and computeStability was
-   called from six places. Nothing forced those to agree, and twice they did
-   not — two dismissal systems writing different key formats into the same
-   storage, and a headline that declared the tank calm while the claims under
-   it disagreed.
+   V1's `App.jsx` was 1,468 lines and the largest single thing in it was
+   `deriveTankState` — "everything the app believes about the tank, computed
+   once". It called `buildFindings`, `assessAlkalinity`, `assessCalcium`,
+   `assessMagnesium`, `doseStatus`, `computeStability`, `buildOverview`,
+   `buildBriefing`, `explainScore` and `proposeCorrection`, and handed the
+   result down to every screen.
 
-   Every screen now reads from one object. Two surfaces cannot describe the
-   same tank differently because there is only one description. This changes
-   no reasoning: the same engines are called with the same inputs, so every
-   protocol example and every suite must still pass unchanged, which is what
-   makes the consolidation checkable rather than a leap of faith.
-   ========================================================================= */
-/* Whatever came out of storage, as a list of usable records. Storage holds
-   whatever was last written, and a backup file holds whatever was in it — an
-   interrupted write, a hand-edited export or a file from another tool can all
-   produce a null in the middle of a list, or something that is not a list at
-   all. Dropping the unusable entries is right: a record the app cannot read is
-   worse than no record, because it poisons everything derived from it. */
+   Its instinct was right and V2 already holds it as canon: `MASTER RULE 1`,
+   one owner for each inference. What V1 got wrong was WHERE that owner lived.
+   Nine chemistry engines running inside a React component is nine owners of
+   nine rules the canon owns, and `X-INV-004` and `DEC-003` forbid it.
+
+   So the derivation is gone, all of it, and one call replaced it:
+
+       runAssessment(store, nowAsOf())
+
+   which loads the ledger and the configuration history through V2's store,
+   hands the engine `(events, configurationHistory, asOf)`, stores the result
+   with its version stamps, and returns what came back. The shell reads no
+   field of it that it does not simply pass on.
+
+   THE CLOCK. `INV-A2` puts the assessment instant in the application and makes
+   it an explicit argument. `nowAsOf()` reads it, once, here. Nothing below
+   this line invents one. */
+
+/* Whatever came out of storage, as a list of usable records. Kept from V1
+   because the reasoning still applies to a restored file: "a record the app
+   cannot read is worse than no record, because it poisons everything derived
+   from it." */
 export function toRecords(value) {
   if (!Array.isArray(value)) return [];
   const out = [];
```

2. **chemistry removed — `deriveTankState` deleted: V1 computed the findings, three dose assessments, the stability of every parameter, the overview, the briefing, the score and the correction offers in the app root. One call to `runAssessment` replaces it, and every handler writes through the write adapter**

```diff
@@ -66,1155 +88,655 @@
   return out;
 }
 
-export function deriveTankState(input) {
-  const {
-    readings: rawReadings = [], icps: rawIcps = [], paramDefs = [],
-    settings: rawSettings = DEFAULT_SETTINGS,
-    doseLog: rawDoseLog = [], waterChanges: rawWaterChanges = [],
-    corrections: rawCorrections = [], kitChanges = {},
-    dismissed = {}, plans: rawPlans = {}, correctionPlans = {},
-  } = input || {};
-
-  /* Readings arrive from three places: the log form, which parses; an edit,
-     which parses; and a restored backup, which does not. The backup inspector
-     checks the file's shape but never the type of a value, so a JSON export
-     touched by hand — or written by another tool — can put the string "8.9"
-     into a reading. That threw on the first call to toFixed and took the whole
-     screen with it, and because it is then saved to storage it would throw
-     again on every load.
-
-     Coerced once, here, rather than defended against in fifty display sites.
-     A value that cannot be made into a finite number is dropped: a reading the
-     app cannot read is worse than no reading, because it poisons the trend. */
-  const readings = [];
-  for (const r of toRecords(rawReadings)) {
-    const v = typeof r.value === "number" ? r.value : parseFloat(r.value);
-    if (!isFinite(v)) continue;
-    readings.push(r.value === v ? r : { ...r, value: v });
-  }
-
-  /* The same guard for every other log. Readings were coerced here and the
-     rest were not, so a backup with a null entry in the dose log — or a stored
-     value that was not an array at all — threw before anything could be shown.
-     Six of the app's own record types crashed on shapes its own backup format
-     permits. */
-  /* A default is only applied when the key is absent. Storage can hold an
-     explicit null — an interrupted write leaves one — and that sails past the
-     default straight into the first property access. */
-  const settings = (rawSettings && typeof rawSettings === "object" && !Array.isArray(rawSettings))
-    ? rawSettings : DEFAULT_SETTINGS;
-
-  /* Same trap as settings: a stored null passes the default and then the
-     first property read fails. Three storage keys hold plans and any of them
-     can be null after an interrupted write. */
-  const plans = (rawPlans && typeof rawPlans === "object") ? rawPlans : {};
-
-  const icps = toRecords(rawIcps);
-  /* Millilitres coerced, the same way reading values are. Readings have been
-     coerced at this boundary for months and the dose log never was — so a
-     backup holding ml as the string "11" survived the restore, survived
-     inspectBackup, and then crashed the reading confirmation on toFixed. JSON
-     round-trips preserve types, but a hand-edited export or a file from
-     another tool does not have to. */
-  const doseLog = toRecords(rawDoseLog).map((r) => {
-    const ml = typeof r.ml === "number" ? r.ml : parseFloat(r.ml);
-    return isFinite(ml) ? (r.ml === ml ? r : { ...r, ml }) : { ...r, ml: null };
-  });
-  const waterChanges = toRecords(rawWaterChanges);
-  const corrections = toRecords(rawCorrections);
-
-  /* Uses the app's own ordering rather than a second implementation of "most
-     recent" — the point of this function is that there is one of everything. */
-  const latestByParam = {};
+/* The three summary boxes on Dosing, worded from the engine's own answer.
+   Alkalinity's comes from the result; calcium's and magnesium's do not exist,
+   and the box says so rather than showing a figure nothing produced. */
+function doseSummaries(engineResult, paramDefs, assessmentState) {
+  const out = {};
   for (const def of paramDefs) {
-    const rows = readings.filter((r) => r.param === def.key).sort(byNewest);
-    latestByParam[def.key] = rows[0] || null;
-  }
-
-  const findingsData = buildFindings({
-    readings, icps, paramDefs, settings, doseLog, waterChanges,
-    latestByParam, kitChanges, corrections,
-  });
-  /* Dismissal filters the presentation, never the reasoning: the engines see
-     everything, and only what reaches a screen is trimmed. */
-  const allFindings = findingsData.findings;
-  const findings = allFindings.filter((f) => !findingHidden(f, dismissed));
-  const dismissedList = allFindings.filter((f) => findingHidden(f, dismissed));
-
-  const assess = (key, fn2, plan) => {
-    const def = paramDefs.find((d) => d.key === key);
-    if (!def) return null;
-    /* paramDefs travels with the call because §10's magnesium gate hangs off
-       magnesium's target range, which is the user's to set — the engine is
-       given its own def and would otherwise have to assume the shipped one. */
-    const a = fn2({ readings, doseLog, waterChanges, settings, def, plan, corrections, correctionPlans, paramDefs });
-    return a ? { ...a, def } : null;
-  };
-  const alkAssessment = assess("alkalinity", assessAlkalinity, plans.alk);
-  const caAssessment = assess("calcium", assessCalcium, plans.ca);
-  const mgAssessment = assess("magnesium", assessMagnesium, plans.mg);
-
-  const today = todayStr();
-  const doseStates = [
-    { key: "alkalinity", a: alkAssessment },
-    { key: "calcium", a: caAssessment },
-    { key: "magnesium", a: mgAssessment },
-  ].map(({ key, a }) => {
-    const d = paramDefs.find((x) => x.key === key);
-    if (!d || !a) return null;
-    const st = doseStatus(a, d, today, settings, latestByParam, doseLog, waterChanges);
-    return st ? { ...st, key, el: d.label.toLowerCase(), def: d } : null;
-  }).filter(Boolean);
-
-  /* Stability was recomputed independently by the strip, the score working,
-     the briefing and the overview. Computed once here and handed down. */
-  const stabilityByParam = {};
-  for (const def of paramDefs) stabilityByParam[def.key] = computeStability(def, readings);
-
-  const overview = buildOverview(readings, latestByParam, paramDefs, findings, doseStates);
-  /* The briefing sees the whole pool and does its own hiding, so it can report
-     how many notes are put away rather than silently losing them. */
-  const briefing = buildBriefing(readings, latestByParam, paramDefs, allFindings, doseStates, { dismissed });
-  const scoreExplained = explainScore(readings, latestByParam, paramDefs, overview.score);
-
-  /* What a correction would involve for each element, at each pace, so the
-     Dosing Wizard can offer it without re-deriving anything. Null where the
-     level is already in band; { possible: false, why } where the dose cannot
-     do the job. */
-  const correctionOffers = {};
-  for (const d of doseStates) {
-    if (!d || !d.def) continue;
-    const a = { alkalinity: alkAssessment, calcium: caAssessment, magnesium: mgAssessment }[d.key];
-    if (!a) continue;
-    correctionOffers[d.key] = {
-      gentle: proposeCorrection(a, d.def, settings, "gentle"),
-      steady: proposeCorrection(a, d.def, settings, "steady"),
-      quick: proposeCorrection(a, d.def, settings, "quick"),
+    if (def.key !== "ALK" && def.key !== "CA" && def.key !== "MG") continue;
+    if (!def.assessed) { out[def.key] = null; continue; }
+    if (!engineResult) {
+      /* Alkalinity, with no answer yet. The box says which of the reasons it
+         is rather than reading as "there is no engine for this", which is the
+         true statement about calcium and a false one about this. */
+      out[def.key] = {
+        tone: "#5F7575",
+        headline: cardStatusLine(null, { assessed: true, assessmentState }),
+        sub: "",
+        value: null,
+      };
+      continue;
+    }
+    const card = selectCard(engineResult);
+    const dose = engineResult.doseRecommendation || {};
+    const rec = dose.recommendedDoseMlPerDay ?? dose.recommendedDose;
+    const cur = dose.currentDoseMlPerDay ?? dose.currentDose;
+    out[def.key] = {
+      tone: positionTone(engineResult.position),
+      /* "Does this instruct a change?" has one owner, in `present/cards.js`,
+         because two screens ask it. Its note says why: a recommended dose is
+         PRESENT on results that recommend nothing at all, so reading its
+         presence as a command turned a hold into "up 0.0 mL/day from 12.0". */
+      headline: typeof rec === "number" && typeof cur === "number" && instructsDoseChange(engineResult)
+        ? `${fmtAmount(cur)} → ${fmtAmount(rec)}`
+        : sayVerb(card, dose.action),
+      sub: sayPosition(engineResult.position),
+      value: typeof engineResult.latestValidValueDkh === "number" ? engineResult.latestValidValueDkh : null,
     };
   }
-
-  return {
-    correctionOffers,
-    latestByParam, stabilityByParam,
-    findingsData, allFindings, findings, dismissedList,
-    alkAssessment, caAssessment, mgAssessment, doseStates,
-    overview, briefing, scoreExplained,
-    hiddenCount: briefing.hiddenCount || 0,
-  };
+  return out;
 }
 
-/* The last line before a blank screen.
- *
- * TabErrorBoundary covers the tab contents, but 942 lines run above it —
- * every storage load, the whole derivation, forty-one hooks. A failure in any
- * of that renders nothing at all: no tabs, no menu, and no way to reach the
- * export button.
- *
- * That matters more than it sounds. A display bug is an annoyance if you can
- * still get your data out and a disaster if you cannot, and this app has
- * already shipped one fault that made it completely unusable while every check
- * passed. The point of this boundary is not to fix anything — it is to make
- * sure a bug costs you a morning rather than your history.
- *
- * buildBackup reads storage directly and touches no component state, so it
- * still works when everything above it has failed. */
-export class RootErrorBoundary extends React.Component {
-  constructor(props) {
-    super(props);
-    this.state = { error: null, saving: false, saved: false };
-  }
-  static getDerivedStateFromError(error) { return { error }; }
+export function ReefConsoleInner() {
+  /* ROUND THREE, ITEM 9 — TEST MODE WAS UNREACHABLE.
 
-  async rescue() {
-    this.setState({ saving: true });
-    try {
-      const backup = await buildBackup();
-      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
-      const url = URL.createObjectURL(blob);
-      const a = document.createElement("a");
-      a.href = url;
-      a.download = `dans-tank-rescue-${todayStr()}.json`;
-      document.body.appendChild(a);
-      a.click();
-      document.body.removeChild(a);
-      URL.revokeObjectURL(url);
-      this.setState({ saving: false, saved: true });
-    } catch (e) {
-      this.setState({ saving: false, saved: false, rescueFailed: String(e && e.message) });
-    }
-  }
+     `store/mode.js` survived the port whole, and nothing imported it. The
+     store was built with `createStore()` unconditionally, so the app always
+     read the real tank whatever the mode said, and the clock was never
+     applied.
 
-  render() {
-    if (!this.state.error) return this.props.children;
-    const { saving, saved, rescueFailed } = this.state;
-    return (
-      <div style={{ minHeight: "100vh", background: "#F3F7F6", padding: "24px 18px" }}>
-        <div style={{ maxWidth: 460, margin: "0 auto" }}>
-          <h1 style={{ fontSize: 19, fontWeight: 900, color: "#08191D", margin: "0 0 10px" }}>
-            The app could not start
-          </h1>
-          <p style={{ fontSize: 14, lineHeight: 1.55, color: "#45605F", margin: "0 0 8px" }}>
-            Something failed before any screen could be drawn. <strong>Your data has not been
-            touched</strong> — it is still in storage exactly as you left it.
-          </p>
-          <p style={{ fontSize: 14, lineHeight: 1.55, color: "#45605F", margin: "0 0 18px" }}>
-            Save a copy now, before doing anything else. The file below is the same
-            backup the Setup screen produces and can be restored once this is fixed.
-          </p>
-          <button onClick={() => this.rescue()} disabled={saving}
-            style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "none",
-                     background: saved ? "#0B7C86" : "#08191D", color: "#fff",
-                     fontSize: 15, fontWeight: 800, cursor: saving ? "default" : "pointer" }}>
-            {saving ? "Saving…" : saved ? "Saved — check your downloads" : "Save my data"}
-          </button>
-          {rescueFailed && (
-            <p style={{ fontSize: 13, color: "#C4285B", marginTop: 12, fontWeight: 700 }}>
-              The rescue export also failed. {rescueFailed} Do not clear the app's storage —
-              the data is still there and can be recovered another way.
-            </p>
-          )}
-          <p style={{ fontSize: 12, color: "#5F7575", marginTop: 22, lineHeight: 1.5 }}>
-            Reloading is safe and may clear a one-off failure. If it does not, the message
-            below is what went wrong.
-          </p>
-          <pre style={{ fontSize: 11, color: "#5F7575", background: "#E3ECEA",
-                        padding: 10, borderRadius: 8, marginTop: 8,
-                        whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
-            {String(this.state.error && (this.state.error.stack || this.state.error.message))}
-          </pre>
-        </div>
-      </div>
-    );
+     `storeForMode` is the one owner of which database is in force, and
+     `applyClock` the one owner of what "now" means. Both are called here and
+     nowhere else. `modeTick` re-runs this when the screen switches modes, so
+     the store the app holds and the mode the module reports cannot disagree. */
+  const [modeTick, setModeTick] = useState(0);
+  const mode = currentMode();
+  const storeRef = useRef(null);
+  const storeModeRef = useRef(null);
+  if (!storeRef.current || storeModeRef.current !== mode) {
+    applyClock();
+    storeRef.current = mode === MODE.TEST ? storeForMode(mode) : createStore();
+    storeModeRef.current = mode;
   }
-}
-
-/* What a cleared device is told it used to hold. Plain words rather than the
-   storage keys, and only the keys that had something in them — "412 readings
-   and 3 ICP panels" is a sentence somebody recognises as their own tank. */
-const LOST_LABELS = {
-  "readings": ["reading", "readings"],
-  "icp-tests": ["ICP panel", "ICP panels"],
-  "water-changes": ["water change", "water changes"],
-  "dose-log": ["dose change", "dose changes"],
-  "task-log": ["completed task", "completed tasks"],
-  "lighting-log": ["lighting note", "lighting notes"],
-};
-
-export function lostSummary(had) {
-  const parts = Object.keys(LOST_LABELS)
-    .filter((k) => (had[k] || 0) > 0)
-    .map((k) => `${had[k]} ${LOST_LABELS[k][had[k] === 1 ? 0 : 1]}`);
-  if (parts.length === 0) return "";
-  if (parts.length === 1) return parts[0];
-  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
-}
+  const store = storeRef.current;
 
-export function ReefConsoleInner() {
+  const [loaded, setLoaded] = useState(false);
   const [tab, setTab] = useState("dashboard");
-  /* Tapping "Log test" on a reminder should land on the entry form with the
-     right parameter already chosen — otherwise you arrive on the Testing tab
-     and have to find it yourself. */
-  const [testPrefill, setTestPrefill] = useState(null);
-  /* Lifted out of Dashboard: tapping a parameter should open its graph from
-     anywhere, and two copies of the same modal would drift apart. */
   const [modalParam, setModalParam] = useState(null);
-  const [logResult, setLogResult] = useState(null);
-  const [icpResult, setIcpResult] = useState(null);
-  const [taskResult, setTaskResult] = useState(null);
-  const [toastMsg, setToastMsg] = useState(null);
+  const [allGraphs, setAllGraphs] = useState(false);
+  /* Which half of the Test tab is showing: the parameter checklist or the ICP
+     panels. Named `testTab` rather than `testMode`, because "test mode" means
+     something else entirely in this app — the assessment instant set by hand
+     (`app/src/store/mode.js`) — and two things with one name is how a search
+     for one of them finds the other. */
+  const [testTab, setTestTab] = useState("tests");
 
-  /* The splash belongs to a launch, not to a render: it plays once per session
-     and never again until the app is opened afresh. Gating it to home-screen
-     launches meant it was invisible in a browser tab, which made it impossible
-     to see at all unless installed — so it now plays wherever the app opens,
-     and is skippable either way. */
-  /* The app mounts once per page load, so plain state already means "once per
-     launch". A sessionStorage flag was used to guard against replays, but it
-     was never cleared — so after the first ever load the splash was suppressed
-     for the entire life of that browser tab, which is why it stopped showing. */
-  const [splash, setSplash] = useState(true);
-  useEffect(() => { onToast(setToastMsg); }, []);
+  /* ---- what is on this device ---------------------------------------- */
+  const [projection, setProjection] = useState([]);
+  const [config, setConfig] = useState(null);
+  const [tasks, setTasks] = useState([]);
+  const [completions, setCompletions] = useState([]);
+  const [hiddenNotices, setHiddenNotices] = useState({});
+  /* WHICH CONCLUSION THE KEEPER HAS PUT AWAY, NOT WHICH PANEL.
 
-  /* Ask the browser to keep this app's data, once, at launch.
-     This request used to live in Setup's mount effect, and Setup only mounts
-     while its tab is selected — so someone who logged readings from the
-     Dashboard for months never asked at all, while Safari's seven-day
-     eviction rule applied to them in full. Asking from the root means it
-     happens whatever tab is showing. requestPersistence remembers its own
-     answer, so Setup's copy of the call reads the result rather than asking a
-     second time. */
-  useEffect(() => { requestPersistence(); }, []);
-  const openTestFor = (paramKey) => { setTestPrefill({ paramKey, at: Date.now() }); setTab("log"); };
+     A single string: the correction panel's signature, which is the
+     intervention and the class the engine reached on it. Delete the reading the
+     conclusion rested on, the engine reclassifies from what remains, the
+     signature stops matching and the panel is back — which is owner finding
+     16's worked example, and it needs no record that a deletion happened. */
+  const [correctionDismissed, setCorrectionDismissed] = useState(null);
 
-  /* Browsers restore the previous scroll position on reload, which drops you
-     partway down the Dashboard with the heading out of view. */
-  useEffect(() => {
-    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
-      window.history.scrollRestoration = "manual";
-    }
-  }, []);
+  /* ---- what the engine said ------------------------------------------- */
+  const [assessment, setAssessment] = useState(null);
+  const [engineState, setEngineState] = useState(null);
 
-  /* Returning to a tab left the heading clipped under the browser chrome.
-     Two things cause it: the previous scroll position is retained, and mobile
-     Chrome re-expands its URL bar as you reach the top, which shifts the layout
-     after the scroll has already happened. A single scrollTo therefore lands in
-     the wrong place. Reset across several frames so the last one runs after the
-     toolbar has settled. */
-  useEffect(() => {
-    if (typeof window === "undefined") return;
-    let cancelled = false;
-    const toTop = () => {
-      if (cancelled) return;
-      window.scrollTo(0, 0);
-      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
-      if (document.body) document.body.scrollTop = 0;
-    };
-    toTop();
-    const r1 = requestAnimationFrame(() => { toTop(); requestAnimationFrame(toTop); });
-    const t1 = setTimeout(toTop, 80);
-    const t2 = setTimeout(toTop, 250);
-    return () => {
-      cancelled = true;
-      cancelAnimationFrame(r1);
-      clearTimeout(t1); clearTimeout(t2);
-    };
-  }, [tab]);
-  const [loaded, setLoaded] = useState(false);
-  const [readings, setReadings] = useState([]);
-  const [icps, setIcps] = useState([]);
-  const [customTasks, setCustomTasks] = useState([]);
-  const [taskLog, setTaskLog] = useState([]);
-  const [lighting, setLighting] = useState([]);
-  const [customRanges, setCustomRanges] = useState({});
-  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
-  const [doseLog, setDoseLog] = useState([]);
-  const [waterChanges, setWaterChanges] = useState([]);
-  const [reminders, setReminders] = useState([]);
-  /* When each test kit was last replaced, so a lab comparison is only weighed
-     against the kit that actually produced it. */
-  const [kitChanges, setKitChanges] = useState({});
-  /* Findings the user has read and chosen not to act on, keyed by id and the
-     exact wording — so if the situation worsens the wording changes and the
-     finding comes back rather than staying hidden for good. */
-  const [dismissed, setDismissed] = useState({});
-  const [alkPlan, setAlkPlan] = useState(null);
-  const [corrections, setCorrections] = useState([]);
-  /* Temporary correction plans, keyed by element. A plan says the dose is
-     deliberately off consumption, what it is aiming at, and what to return to
-     — without it the engine reads the elevated dose as an error and argues
-     with the very plan the keeper just started. */
-  const [correctionPlans, setCorrectionPlans] = useState({});
-  const [caPlan, setCaPlan] = useState(null);
-  const [mgPlan, setMgPlan] = useState(null);
+  /* ---- the moments ----------------------------------------------------- */
+  const [logResult, setLogResult] = useState(null);
   const [doseResult, setDoseResult] = useState(null);
+  const [taskResult, setTaskResult] = useState(null);
+  const [toastMsg, setToastMsg] = useState(null);
   const [storageMsg, setStorageMsg] = useState(null);
-  /* What the startup check made of this device: a new one, one that has been
-     running, or one whose browser cleared everything. Null until it has run,
-     so nothing is claimed before it is known. */
-  const [install, setInstall] = useState(null);
-
-  // Merge any user-edited target ranges over the built-in defaults.
-  const paramDefs = useMemo(() =>
-    PARAM_DEFS.map((d) => customRanges[d.key]
-      ? { ...d, min: customRanges[d.key].min, max: customRanges[d.key].max }
-      : d),
-  [customRanges]);
+  const [remWindow, setRemWindow] = useState(14);
 
-  const saveSettings = async (next) => {
-    const merged = { ...DEFAULT_SETTINGS, ...next };
-    setSettings(merged);
-    await saveKey("tank-settings", merged);
-  };
-  const addDoseChange = async (row) => {
-    const element = row.element || "alkalinity";
-    const next = [{ id: uid(), ...row, element }, ...doseLog];
-    setDoseLog(next); await saveKey("dose-log", next);
-    const cfg = DOSE_ELEMENTS.find((e) => e.key === element);
-    if (cfg) await saveSettings({ ...settings, [cfg.doseField]: row.ml });
-  };
-  const deleteDoseChange = async (id) => {
-    const next = doseLog.filter((d) => d.id !== id);
-    setDoseLog(next); await saveKey("dose-log", next);
-  };
-  const addWaterChange = async (row) => {
-    const next = [{ id: uid(), ...row }, ...waterChanges];
-    setWaterChanges(next); await saveKey("water-changes", next);
-  };
-  const deleteWaterChange = async (id) => {
-    const next = waterChanges.filter((w) => w.id !== id);
-    setWaterChanges(next); await saveKey("water-changes", next);
-  };
-  const saveRange = async (key, min, max) => {
-    const next = { ...customRanges, [key]: { min, max } };
-    setCustomRanges(next);
-    await saveKey("custom-ranges", next);
-  };
-  const resetRange = async (key) => {
-    const next = { ...customRanges };
-    delete next[key];
-    setCustomRanges(next);
-    await saveKey("custom-ranges", next);
-  };
+  useEffect(() => {
+    onToast((m) => setToastMsg(m));
+    onStorageError((m) => setStorageMsg(m));
+    return onEngineState((s) => setEngineState(s));
+  }, []);
 
-  useEffect(() => { onStorageError((m) => setStorageMsg(m)); }, []);
+  /* Reload everything this device holds. Called after every write, so no
+     screen ever renders from a copy of the record that the record has since
+     moved past. */
+  const reload = useCallback(async () => {
+    const [proj, cfg, ts, cs, hidden, correction] = await Promise.all([
+      store.ledger.projection(),
+      store.config.current(),
+      store.tasks.tasks(),
+      store.tasks.completions(),
+      store.kvGet("hidden-notices"),
+      store.kvGet("correction-dismissed"),
+    ]);
+    setProjection(proj);
+    setConfig(cfg);
+    setTasks(ts);
+    setCompletions(cs);
+    setHiddenNotices(hidden || {});
+    setCorrectionDismissed(correction || null);
+  }, [store]);
 
-  /* The snapshot schedule: once the load has settled and the install check has
-     run, and again whenever the app is backgrounded — the moment most likely
-     to precede an eviction. At most one snapshot a day; maybeAutoBackup holds
-     the cadence itself. A device the check judged wiped is skipped entirely,
-     because on it the current state is the thing that must NOT be preserved —
-     snapshotting it, or writing it over the chosen backup file, would destroy
-     the last good copy at the moment it is needed. */
-  useEffect(() => {
-    if (!loaded || !install) return undefined;
-    const suspectWipe = install.state === "wiped" || install.state === "suspect";
-    maybeAutoBackup({ suspectWipe });
-    const onHide = () => { if (document.visibilityState === "hidden") maybeAutoBackup({ suspectWipe }); };
-    document.addEventListener("visibilitychange", onHide);
-    return () => document.removeEventListener("visibilitychange", onHide);
-  }, [loaded, install]);
+  /* Ask the engine. Every write that could change the answer calls this, and
+     nothing else calls the engine at all. */
+  const assess = useCallback(async () => {
+    try {
+      const r = await runAssessment(store, nowAsOf());
+      setAssessment(r);
+    } catch (e) {
+      setAssessment({ state: "ENGINE_FAILED", engineResult: null, error: e && e.message });
+    }
+  }, [store]);
 
   useEffect(() => {
-    /* Carry an existing install's data out of the legacy `reefconsole:` prefix
-       before anything is read from the live one. Removing the storage shim
-       moved every read from the legacy copy to the mirror, and the old save
-       path ignored whether the mirror write succeeded — so on a device that
-       was ever short of space the mirror is the older of the two, and reading
-       it silently reverts whatever the failed write was carrying. A custom
-       target range is exactly that shape of value: lose it and the band falls
-       back to the shipped default with nothing on screen to say so.
-
-       Synchronous and before the loads below, not inside them: `drainLegacyStore`
-       records the keys it could not finish, and `loadKey` consults that record
-       to keep preferring the legacy copy for them. Both halves have to have
-       run before the first read, or the record is empty and the stale mirror
-       wins anyway. Idempotent and a no-op on a device with nothing under the
-       old prefix, which is every install made after the shim went. */
-    drainLegacyStore();
     (async () => {
-      const [r, i, ct, tl, lg, seeded, icpSeeded, wcSeeded, lightSeeded, strengthsFixed, rem, kc, dis, ap, corr, cap, mgp, cr, st, dl, wc] = await Promise.all([
-        loadKey("readings", []),
-        loadKey("icp-tests", []),
-        loadKey("tasks-custom", []),
-        loadKey("task-log", []),
-        loadKey("lighting-log", []),
-        loadKey("historical-seeded", false),
-        loadKey("icp-seeded", false),
-        loadKey("wc-seeded", false),
-        loadKey("light-seeded", false),
-        loadKey("strengths-fixed-v1", false),
-        loadKey("reminders", null),
-        loadKey("kit-changes", {}),
-        loadKey("findings-dismissed", {}),
-        loadKey("alk-plan", null),
-        loadKey("corrections", []),
-        loadKey("ca-plan", null),
-        loadKey("mg-plan", null),
-        loadKey("custom-ranges", {}),
-        loadKey("tank-settings", DEFAULT_SETTINGS),
-        loadKey("dose-log", []),
-        loadKey("water-changes", []),
-      ]);
+      await reload();
+      setLoaded(true);
+      /* Starting the runtime is a 12 MB decompress. Nothing else needs it, so
+         it is started when the app is idle rather than blocking first paint:
+         logging a reading, browsing history and completing a task all work
+         before the engine has finished booting. */
+      warmUp();
+      assess();
+    })();
+  }, [reload, assess]);
 
-      /* Is this a new device, or one that has been cleared? The two used to be
-         indistinguishable — every marker below lives in the storage a clear
-         erases, so their absence was read as "new install, seed away" and a
-         wiped device was handed 25 water changes it never had. The check runs
-         before any seeding decision because it is the input to all of them. */
-      const state = await assessInstall({
-        "readings": (r || []).length, "icp-tests": (i || []).length,
-        "water-changes": (wc || []).length, "dose-log": (dl || []).length,
-        "task-log": (tl || []).length, "lighting-log": (lg || []).length,
-      }, {
-        "historical-seeded": seeded, "icp-seeded": icpSeeded, "wc-seeded": wcSeeded,
-        "light-seeded": lightSeeded, "strengths-fixed-v1": strengthsFixed,
-      });
-      setInstall(state);
+  /* ---- the record, in the shape the ported screens read ---------------- */
+  const paramDefs = useMemo(() => paramDefsFrom(config), [config]);
+  const readings = useMemo(() => readingsFrom(projection), [projection]);
+  const latestByParam = useMemo(() => latestByParamFrom(readings, paramDefs), [readings, paramDefs]);
+  const chartEvents = useMemo(() => chartEventsFrom(projection), [projection]);
 
-      /* Readings are measurements somebody took, so nothing is seeded into
-         them — a clean device starts empty. The marker is still written on the
-         first run so the state of an install stays readable. */
-      const finalReadings = r;
-      if (!seeded) {
-        await saveKey("readings", finalReadings);
-        await saveKey("historical-seeded", true);
-      }
+  const waterChanges = useMemo(() => projection
+    .filter((r) => r.event.kind === KIND.WATER_CHANGE && r.state !== "SUPERSEDED" && r.state !== "INVALID")
+    .map((r) => ({ id: r.event.eventId, date: r.event.time.localDate, litres: r.event.detail.litres })), [projection]);
 
-      /* ICP panels are measurements too, and are seeded no more than readings
-         are. */
-      const finalIcps = i;
-      if (!icpSeeded) {
-        await saveKey("icp-seeded", true);
-      }
+  /* Dose CHANGES and the dose STATE the record starts from.
 
-      /* Weekly water changes, seeded once and matched on date so anything
-         already logged by hand is left alone.
+     The import writes the first dose row of each parameter as a `DOSE_STATE` —
+     what was running when the record begins — and every later one as a
+     `DOSE_CHANGE`. Listing only the changes made a freshly imported history
+     read as "no dose changes recorded" while the app was assessing against a
+     dose it had. A starting point has no delta and is shown as what it is. */
+  const doseChanges = useMemo(() => projection
+    .filter((r) => (r.event.kind === KIND.DOSE_CHANGE || r.event.kind === KIND.DOSE_STATE)
+      && r.state !== "SUPERSEDED" && r.state !== "INVALID")
+    .map((r) => ({
+      id: r.event.eventId,
+      date: r.event.time.localDate,
+      time: r.event.time.localTime || null,
+      from: r.event.kind === KIND.DOSE_CHANGE ? r.event.detail.fromMlPerDay : null,
+      to: r.event.kind === KIND.DOSE_CHANGE ? r.event.detail.toMlPerDay : r.event.detail.doseMlPerDay,
+      /* `fromMlPerDay` on an imported change is this app reading the previous
+         recorded row, not something the keeper wrote down. The import marks it,
+         and the list says so rather than presenting it as his figure. */
+      fromDerived: !!r.event.detail.fromMlPerDayDerived,
+      isStart: r.event.kind === KIND.DOSE_STATE,
+      parameter: r.event.parameter || "ALK",
+    })), [projection]);
 
-         Not seeded at all on a device that has been cleared, or one the check
-         above could not account for. The marker is still written, so declining
-         is remembered: without it the next load — by then with a reading on it,
-         and so no longer looking wiped — would walk back into this branch and
-         write the 25 rows after all. A missing water-change history can be
-         restored from a backup or retyped; invented maintenance events cannot
-         be told from real ones afterwards, and they feed the nutrient maths. */
-      let finalWaterChanges = wc || [];
-      if (!wcSeeded) {
-        if (state.maySeed) {
-          const have = new Set(finalWaterChanges.map((w) => w.date));
-          const add = WATER_CHANGE_SEED
-            .filter((d) => !have.has(d))
-            .map((d) => ({ id: "wc-" + d, date: d, litres: WATER_CHANGE_LITRES, note: "" }));
-          if (add.length) {
-            finalWaterChanges = [...finalWaterChanges, ...add].sort(byNewest);
-            await saveKey("water-changes", finalWaterChanges);
-          }
-        }
-        await saveKey("wc-seeded", true);
-      }
+  const lightingChanges = useMemo(() => projection
+    .filter((r) => r.event.kind === KIND.HUSBANDRY && r.event.detail
+      && r.event.detail.husbandryKind === "LIGHTING"
+      && r.state !== "SUPERSEDED" && r.state !== "INVALID")
+    .map((r) => ({ id: r.event.eventId, date: r.event.time.localDate, note: r.event.detail.note })), [projection]);
 
-      let finalLighting = lg || [];
-      if (!lightSeeded) {
-        if (state.maySeed) {
-          const haveL = new Set(finalLighting.map((x) => x.date));
-          const addL = LIGHTING_SEED.filter((x) => !haveL.has(x.date));
-          if (addL.length) {
-            finalLighting = [...finalLighting, ...addL].sort(byNewest);
-            await saveKey("lighting-log", finalLighting);
-          }
-        }
-        await saveKey("light-seeded", true);
-      }
+  const icps = useMemo(() => projection
+    .filter((r) => r.event.kind === KIND.ICP_PANEL && r.state !== "SUPERSEDED" && r.state !== "INVALID")
+    .map((r) => ({
+      id: r.event.eventId,
+      date: r.event.time.localDate,
+      note: r.event.detail.note,
+      elements: r.event.detail.elements || {},
+    })), [projection]);
 
-      /* Doses are seeded; product strengths are NOT, and must never be again.
-         A strength is a fact about the user's own bottle, so there is nothing
-         to seed it with — see DEFAULT_SETTINGS, which no longer carries one.
-         An unset strength is refused and named, the same as an unset net
-         volume (reef-chemistry.md §16, §12, §17).
+  const scheduleView = useMemo(
+    () => computeSchedule(tasks, completions, todayStr(), remWindow),
+    [tasks, completions, remWindow]);
 
-         Two blocks were removed here on 16 August, both of which wrote a
-         default into storage and so would defeat the change entirely:
-         - the seed loop, which filled a missing strength with the shipped
-           figure, and
-         - a one-off `strengths-fixed-v1` overwrite that replaced ANY stored
-           strength with the shipped figure once per install. It existed to
-           repair an early double-doubling (0.72 instead of 0.3611). Anyone
-           whose install already ran it keeps the repaired value — the flag is
-           left in storage untouched, and nothing re-reads it. Anyone who has
-           not run it keeps whatever they have, per the 16 August decision that
-           stored values are left alone for now; confirming the ones that were
-           never typed by hand is TW-061. */
-      const finalSettings = { ...DEFAULT_SETTINGS, ...(st || {}) };
-      const doseSeedFields = ["dailyDoseMl", "calciumDoseMl", "magDoseMl"];
-      const needsSeed = !st || doseSeedFields.some((f) => st[f] == null);
-      if (needsSeed) {
-        for (const f of doseSeedFields) {
-          if (!st || st[f] == null) finalSettings[f] = DEFAULT_SETTINGS[f];
-        }
-        await saveKey("tank-settings", finalSettings);
-      }
+  const engineResult = assessment && assessment.engineResult ? assessment.engineResult : null;
+  /* Why there is no engine result, when there is none. The states are
+     `assess.js`'s own — `NO_CONFIGURATION`, `STORAGE_UNAVAILABLE` — plus the
+     one this shell adds when the call itself threw. Null while the first
+     assessment is still running, which the screens render as "working it
+     out". */
+  /* `assess.js` now returns `ENGINE_UNAVAILABLE` as its own state, so the
+     screens get the right label without this having to correct one.
 
-      /* Test reminders exist from the start rather than needing to be created —
-         the app already knows which parameters exist. Only the schedule is the
-         user's to set. */
-      let finalReminders = rem;
-      if (!finalReminders) {
-        finalReminders = REMINDER_SEED.map((x) => ({ ...x }));
-        await saveKey("reminders", finalReminders);
-      } else {
-        /* Add anything seeded since this install was created — husbandry
-           reminders arrived after the test ones — without disturbing schedules
-           already customised. */
-        const have = new Set(finalReminders.map((x) => x.id));
-        const missing = REMINDER_SEED.filter((x) => !have.has(x.id)).map((x) => ({ ...x }));
-        if (missing.length) {
-          finalReminders = [...finalReminders, ...missing];
-          await saveKey("reminders", finalReminders);
-        }
-      }
-      setReminders(finalReminders);
-      setKitChanges(kc || {});
-      setDismissed(dis || {});
-      setAlkPlan(ap || null);
-      setCorrections(corr || []);
-      const cplans = await loadKey("correction-plans");
-      setCorrectionPlans(cplans || {});
-      setCaPlan(cap || null);
-      setMgPlan(mgp || null);
+     The client's own state still wins where it says the engine failed, because
+     it knows before the first assessment is even attempted — that is what
+     turns a blank card into "the engine could not start" during boot rather
+     than after it. */
+  const engineDown = engineState && engineState.state === ENGINE_STATE.FAILED;
+  const assessmentState = engineDown ? "ENGINE_UNAVAILABLE" : assessment ? assessment.state : null;
 
-      setReadings(finalReadings); setIcps(finalIcps); setCustomTasks(ct); setTaskLog(tl);
-      setLighting(finalLighting); setCustomRanges(cr || {}); setSettings(finalSettings);
-      setDoseLog(dl || []); setWaterChanges(finalWaterChanges);
-      setLoaded(true);
-    })();
-  }, []);
+  /* THE ENGINE'S OWN OBSERVATIONS, FOR EVERY SCREEN THAT SHOWS A VALUE.
 
-  /* A restore writes to storage directly, so mirror the merged result into
-     state — otherwise the screen would keep showing the pre-restore data until
-     the next reload. */
-  const saveReminders = async (next) => {
-    setReminders(next);
-    await saveKey("reminders", next);
-  };
+     Canon treats measurements taken within half an hour as one test and
+     resolves them to their middle value. Until this existed the words on a
+     card came from that resolved observation while the number beside them came
+     straight from the ledger, so five 9.0s and a 10.0 typed in one minute drew
+     "10.00 · IN RANGE". Read, never re-derived — see `present/episodes.js`. */
+  const episodes = useMemo(() => episodesFrom(engineResult), [engineResult]);
 
-  /* Recording a replacement retires every comparison made with the old kit. */
-  const replaceKit = async (paramKey, date = todayStr()) => {
-    const next = { ...kitChanges, [paramKey]: date };
-    setKitChanges(next);
-    await saveKey("kit-changes", next);
-    const def = paramDefs.find((d) => d.key === paramKey);
-    notify(`${def ? def.label : "Kit"} marked as replaced`);
-  };
-  const undoReplaceKit = async (paramKey) => {
-    const next = { ...kitChanges };
-    delete next[paramKey];
-    setKitChanges(next);
-    await saveKey("kit-changes", next);
-    notify("Replacement removed");
-  };
+  /* One notice per parameter, from the engine, already worded — and filtered
+     by what the keeper has put away. The identity and the signature are V1's
+     mechanism over V2's reason codes: put one away and it comes back the
+     moment the engine raises it with different numbers. */
+  const noticeFor = useCallback((def) => {
+    const c = cardContent(def, engineResult, assessmentState);
+    if (!c.notice) return null;
+    return findingHidden(c.notice, hiddenNotices) ? null : c.notice;
+  }, [engineResult, assessmentState, hiddenNotices]);
 
-  const dismissFinding = async (f) => {
-    const prev = dismissed[findingKey(f)];
-    const times = (prev && typeof prev === "object" && prev.times ? prev.times : 0) + 1;
-    const next = { ...dismissed,
-      [findingKey(f)]: { at: todayStr(), sig: findingSignature(f), times } };
-    setDismissed(next);
-    await saveKey("findings-dismissed", next);
-    notify("Hidden — it'll return if this changes");
+  const dismissNotice = async (f) => {
+    const next = { ...hiddenNotices, [findingKey(f)]: { sig: findingSignature(f), at: new Date().toISOString(), title: f.title, id: f.id } };
+    await store.kvSet("hidden-notices", next);
+    setHiddenNotices(next);
+    notify("Notice hidden");
   };
-  /* A claim is put away by its own key rather than a finding id, because most
-     claims are not findings — a drift or a parked pair is assembled from the
-     readings themselves. */
-  const dismissNote = async (c) => {
-    if (!c || !c.dismissKey) return;
-    /* Key and signature are stored separately: the key identifies the claim
-       for as long as it exists, the signature records the situation it was put
-       away in. A claim is suppressed only while the two still agree, which is
-       what makes the count stable and the return meaningful. */
-    const prev = dismissed[c.dismissKey];
-    const times = (prev && typeof prev === "object" && prev.times ? prev.times : 0) + 1;
-    const next = {
-      ...dismissed,
-      [c.dismissKey]: {
-        at: todayStr(),
-        sig: c.dismissSignature != null ? String(c.dismissSignature) : "",
-        /* How many times this has been put off. Kept in the entry because the
-           key no longer changes between snoozes, so counting keys would always
-           report one. */
-        times,
-      },
-    };
-    /* Shown once rather than in front of every snooze. */
-    if (c.snoozeUntilTest && c.dismissKey) {
-      next["__snooze-explained|" + c.dismissKey] = todayStr();
-    }
-    setDismissed(next);
-    await saveKey("findings-dismissed", next);
-    notify(c.snoozeUntilTest
-      ? "Put off \u2014 back after your next test"
-      : "Hidden \u2014 it'll return if this changes");
+  const restoreNotice = async (n) => {
+    const next = { ...hiddenNotices };
+    delete next[findingKey(n)];
+    await store.kvSet("hidden-notices", next);
+    setHiddenNotices(next);
+    notify("Notice shown again");
   };
-  /* One note back, by its own key — restoring everything was the only option
-     before, which made hiding a thing you had to be sure about. */
-  /* Start a temporary correction: set the dose and record why, so every
-     surface knows the elevated figure is deliberate. */
-  const startCorrection = async (key, offer) => {
-    if (!offer || !offer.possible) return;
-    const st = deriveTankState({ readings, icps, paramDefs, settings, doseLog,
-      waterChanges, corrections, kitChanges, dismissed, correctionPlans });
-    const level = st.latestByParam[key];
-    const plan = {
-      target: offer.aimPoint,
-      returnDose: offer.returnDose,
-      startedAt: `${todayStr()} ${nowTime()}`,
-      startValue: level ? level.value : null,
-      pace: offer.pace,
-      dose: offer.dose,
-      days: offer.days,
-    };
-    const next = { ...correctionPlans, [key]: plan };
-    setCorrectionPlans(next);
-    await saveKey("correction-plans", next);
-    await addDoseChange({ date: todayStr(), ml: offer.dose, element: key,
-      note: `correction toward ${offer.aimPoint}` });
-    notify(`${key} dose set to ${fmtAmount(offer.dose)} mL/day — correcting toward ${offer.aimPoint}`);
+  const dismissCorrection = async (signature) => {
+    await store.kvSet("correction-dismissed", signature);
+    setCorrectionDismissed(signature);
   };
 
-  /* Cancel: the dose goes back, the plan is deleted, and everything derived
-     from it disappears with it. Nothing should survive a cancel. */
-  const cancelCorrection = async (key) => {
-    const plan = correctionPlans[key];
-    if (!plan) return;
-    const next = { ...correctionPlans };
-    delete next[key];
-    setCorrectionPlans(next);
-    await saveKey("correction-plans", next);
-    if (plan.returnDose != null) {
-      await addDoseChange({ date: todayStr(), ml: plan.returnDose, element: key,
-        note: "correction cancelled" });
-    }
-    notify(`Correction cancelled — ${key} dose back to ${fmtAmount(plan.returnDose)} mL/day`);
+  const restoreAllNotices = async () => {
+    await store.kvSet("hidden-notices", {});
+    setHiddenNotices({});
+    notify("All notices shown again");
   };
 
-  /* Arrived: return to the maintenance dose and clear the plan in one action,
-     because leaving the elevated dose running is how a correction overshoots. */
-  const finishCorrection = async (key) => {
-    const plan = correctionPlans[key];
-    if (!plan) return;
-    const next = { ...correctionPlans };
-    delete next[key];
-    setCorrectionPlans(next);
-    await saveKey("correction-plans", next);
-    await addDoseChange({ date: todayStr(), ml: plan.returnDose, element: key,
-      note: "correction complete" });
-    notify(`${key} back to ${fmtAmount(plan.returnDose)} mL/day`);
-  };
+  const hiddenList = useMemo(
+    () => Object.entries(hiddenNotices).map(([k, v]) => ({ key: k, id: v.id, title: v.title })),
+    [hiddenNotices]);
 
-  const restoreOneNote = async (c) => {
-    if (!c || !c.dismissKey) return;
-    const next = { ...dismissed };
-    delete next[c.dismissKey];
-    setDismissed(next);
-    await saveKey("findings-dismissed", next);
-    notify("Shown again");
-  };
+  /* ---- writing ---------------------------------------------------------- */
 
-  const restoreNotes = async () => {
-    setDismissed({});
-    await saveKey("findings-dismissed", {});
-    notify("Hidden notices restored");
+  /* A reading. Four elements went in, and the three things that follow are the
+     three the brief asks for: it saves, it completes its test task, and the
+     moment appears. */
+  const addReading = async ({ param, value, date, time }) => {
+    const def = paramDefs.find((d) => d.key === param);
+    const prior = rowsFor(readings, param);
+    const prev = prior.length ? prior[prior.length - 1].value : null;
+    try {
+      await recordReading(store, { param, value, date, time });
+      /* Logging the reading IS the completion. There is no separate tick. */
+      const auto = autoCompletions(tasks, completions, param, date);
+      if (auto.length) await store.tasks.writeCompletions(auto);
+    } catch (e) {
+      setStorageMsg(e && e.message);
+      return;
+    }
+    await reload();
+    notify("Reading saved");
+    setLogResult({
+      at: Date.now(), def, value, prev, date, time,
+      position: null,
+    });
+    assess();
   };
 
-  const restoreFinding = async (key) => {
-    const next = { ...dismissed };
-    delete next[key];
-    setDismissed(next);
-    await saveKey("findings-dismissed", next);
-    notify("Note restored");
-  };
-  const restoreAllFindings = async () => {
-    setDismissed({});
-    await saveKey("findings-dismissed", {});
-    notify("All notes restored");
+  const addDoseChange = async ({ fromMlPerDay, toMlPerDay, date, time }) => {
+    try {
+      await recordDoseChange(store, { fromMlPerDay, toMlPerDay, date, time });
+    } catch (e) { setStorageMsg(e && e.message); return; }
+    await reload();
+    notify("Dose change recorded");
+    const def = paramDefs.find((d) => d.key === "ALK");
+    setDoseResult({ at: Date.now(), def, from: fromMlPerDay, to: toMlPerDay, date, time });
+    assess();
   };
 
-  /* Setting the dose from the assessment records it as a dose change, so the
-     protocol restarts its window and will hold for 48 hours before advising
-     again — exactly as it would if the change had been entered by hand. */
-  /* Applying a dose does three things at once, which is what makes this a loop
-     rather than a calculator: it records the change so the protocol restarts
-     its window, it remembers where the staged correction is heading, and it
-     pins the alkalinity test that will judge the new dose so it appears on the
-     dashboard when it is actually due. */
-  const applyAlkDose = (ml, meta = {}) => applyDoseChange("alkalinity", ml, meta);
-
-  /* Adopting the solved strength updates the one number every dose figure
-     depends on. */
-  /* Calcium mirrors alkalinity exactly: apply a dose, remember the plan, pin
-     the test that judges it — only on a weekly rhythm rather than a 48-hour
-     one, because that is how fast calcium actually moves. */
-  /* Recording a dose change, for any of the three. The date and time come from
-     the sheet rather than "now", because when the doser actually changed is
-     what the settling period is measured from — and people record it after the
-     fact as often as at the moment. */
-  const applyDoseChange = async (element, ml, meta = {}) => {
-    const cfg = {
-      alkalinity: { rem: "rem-alkalinity", key: "alk-plan", set: setAlkPlan, days: 2 },
-      calcium:    { rem: "rem-calcium",    key: "ca-plan",  set: setCaPlan,  days: 7 },
-      magnesium:  { rem: "rem-magnesium",  key: "mg-plan",  set: setMgPlan,  days: 7 },
-    }[element];
-    if (!cfg) return;
+  /* FIXING A READING THAT WAS TYPED WRONG.
 
-    const date = meta.date || todayStr();
-    const time = meta.time || nowTime();
-    await addDoseChange({ date, time, ml, element, note: "set from the dosing wizard" });
+     `PORT-OMISSIONS.md`'s most serious loss in the port. Both of these append
+     — neither edits and neither deletes — and the sheet says so before either
+     runs. */
+  const fixReading = async (args) => {
+    try { await correctReading(store, args); }
+    catch (e) { setStorageMsg(e && e.message); return; }
+    await reload();
+    notify(t("correct.saved"));
+    assess();
+  };
 
-    const testOn = addDays(date, cfg.days);
-    const nextPlan = {
-      appliedDose: ml, appliedAt: `${date} ${time}`,
-      target: meta.target != null ? meta.target : ml,
-      stage: meta.stage || 1, stages: meta.stages || 1,
-      nextTestAt: testOn, nextTestTime: time,
-    };
-    cfg.set(nextPlan);
-    await saveKey(cfg.key, nextPlan);
-    await saveReminders(reminders.map((r) => (r.id === cfg.rem
-      ? { ...r, dueOverride: testOn, dueTime: time, dueReason: "dose", adjustDays: 0 } : r)));
+  /* ONE DELETE, USED BY EVERY SURFACE THAT OFFERS ONE — owner decision 32.
 
-    /* What this dose should do, so the next reading confirms it or doesn't.
-       Uses the dose actually entered, not the one suggested. */
-    const def = paramDefs.find((d) => d.key === element);
-    const effect = meta.effectPerMl;
-    const cons = meta.consumption;
-    let perDay = null, expected = null;
-    if (isFinite(effect) && isFinite(cons) && meta.currentValue != null) {
-      perDay = ml * effect - cons;
-      expected = meta.currentValue + perDay * cfg.days;
-    }
-    setDoseResult({
-      at: Date.now(), def, from: meta.fromDose, to: ml, date, time,
-      testOn, days: cfg.days, perDay, expected,
-      staged: !!meta.staged, target: meta.target,
-    });
+     The record is gone: the event, its annotations, and every assessment that
+     read it. `deleteRecord` owns all three so that no caller can do one and
+     forget another. What each caller supplies is the sentence the keeper sees,
+     because "Alkalinity reading deleted" and "Dose change deleted" are the same
+     act on different records and he is entitled to be told which. */
+  const deleteRecordById = async (eventId, said) => {
+    try {
+      const { removed } = await deleteRecord(store, eventId);
+      if (!removed) return false;
+    } catch (e) { setStorageMsg(e && e.message); return false; }
+    await reload();
+    notify(said || t("correct.deleted"));
+    assess();
+    return true;
   };
 
-  const applyMgDose = (ml, meta = {}) => applyDoseChange("magnesium", ml, meta);
-  const clearMgPlan = async () => {
-    setMgPlan(null);
-    await saveKey("mg-plan", null);
-    await saveReminders(reminders.map((r) => (r.id === "rem-magnesium"
-      ? { ...r, dueOverride: null, dueTime: null, dueReason: null } : r)));
-    notify("Plan cleared");
-  };
-  const applyMgEffect = async (per100L) => {
-    await saveSettings({ ...settings, mgPpmPerMlPer100L: per100L });
-    notify(`Magnesium strength set to ${per100L} ppm/mL/100L`);
-  };
+  const dropReading = (eventId) => deleteRecordById(eventId, t("delete.done.reading"));
 
-  const applyCaDose = (ml, meta = {}) => applyDoseChange("calcium", ml, meta);
-  const clearCaPlan = async () => {
-    setCaPlan(null);
-    await saveKey("ca-plan", null);
-    await saveReminders(reminders.map((r) => (r.id === "rem-calcium"
-      ? { ...r, dueOverride: null, dueTime: null, dueReason: null } : r)));
-    notify("Plan cleared");
+  /* The dose the keeper says his pump is running now. Stage 1 established, by
+     measurement, that the engine had no readable record of this at all on a
+     V1-imported history — and without it `consumption` is `NOT_RUN` and every
+     figure that depends on it is withheld. */
+  const setStandingDose = async (doseMlPerDay) => {
+    try { await recordDoseState(store, { doseMlPerDay }); }
+    catch (e) { setStorageMsg(e && e.message); return; }
+    await reload();
+    notify("Current dose recorded");
+    assess();
   };
-  const applyCaEffect = async (per100L) => {
-    await saveSettings({ ...settings, caPpmPerMlPer100L: per100L });
-    notify(`Calcium strength set to ${per100L} ppm/mL/100L`);
+
+  const addWaterChange = async ({ date, time, litres }) => {
+    try {
+      await recordWaterChange(store, { date, time, litres, netVolumeL: config && config.netVolumeL });
+    } catch (e) { setStorageMsg(e && e.message); return; }
+    await reload();
+    notify("Water change recorded");
+    assess();
   };
 
-  const applyAlkEffect = async (per100L) => {
-    await saveSettings({ ...settings, dkhPerMlPer100L: per100L });
-    notify(`Alkalinity strength set to ${per100L} dKH/mL/100L`);
+  const addOneOff = async ({ amountMl, date, time }) => {
+    try { await recordOneOff(store, { amountMl, date, time }); }
+    catch (e) { setStorageMsg(e && e.message); return; }
+    await reload();
+    notify("Addition recorded");
+    assess();
   };
 
-  const logCorrection = async (ml, direction, element = "alkalinity") => {
-    const entry = { id: uid(), date: todayStr(), time: nowTime(), element,
-                    ml: direction === "down" ? -Math.abs(ml) : Math.abs(ml), direction };
-    const next = [entry, ...corrections];
-    setCorrections(next);
-    await saveKey("corrections", next);
-    /* The correction takes two to three days to deliver, so the test that
-       judges it belongs after that, not tomorrow. */
-    /* Calcium and magnesium take a week to show what a correction did;
-       alkalinity a few days. */
-    const testOn = addDays(todayStr(), element === "alkalinity" ? 3 : 7);
-    const remId = element === "calcium" ? "rem-calcium"
-      : element === "magnesium" ? "rem-magnesium" : "rem-alkalinity";
-    const rem = reminders.map((r) => (r.id === remId
-      ? { ...r, dueOverride: testOn, dueTime: nowTime(), dueReason: "correction", adjustDays: 0 } : r));
-    await saveReminders(rem);
-    notify(`${fmtAmount(Math.abs(ml))} mL correction logged · test ${fmtShort(testOn)}`);
+  const addLightingChange = async ({ date, note }) => {
+    try { await recordLightingChange(store, { date, note }); }
+    catch (e) { setStorageMsg(e && e.message); return; }
+    await reload();
+    notify("Lighting change recorded");
   };
 
-  const deleteCorrection = async (id) => {
-    const next = corrections.filter((c) => c.id !== id);
-    setCorrections(next);
-    await saveKey("corrections", next);
+  const addNote = async ({ date, note }) => {
+    try { await recordNote(store, { date, note }); }
+    catch (e) { setStorageMsg(e && e.message); return; }
+    await reload();
+    notify("Note recorded");
   };
 
-  const clearAlkPlan = async () => {
-    setAlkPlan(null);
-    await saveKey("alk-plan", null);
-    const next = reminders.map((r) => (r.id === "rem-alkalinity"
-      ? { ...r, dueOverride: null, dueTime: null, dueReason: null } : r));
-    await saveReminders(next);
-    notify("Plan cleared");
+  const addIcp = async ({ date, note, elements }) => {
+    try { await recordIcpPanel(store, { date, note, elements }); }
+    catch (e) { setStorageMsg(e && e.message); return false; }
+    await reload();
+    notify("ICP panel saved");
+    return true;
   };
 
-  const addReminder = async (r) => { await saveReminders([...reminders, r]); };
-  const deleteReminder = async (id) => { await saveReminders(reminders.filter((r) => r.id !== id)); };
+  const deleteEvent = (eventId, said = null) => deleteRecordById(eventId, said);
 
-  const updateReminder = async (id, patch) => {
-    await saveReminders(reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)));
+  /* Something the keeper recorded on his calendar, taken back off it (owner
+     finding 16). A completion is the task store's own record rather than a
+     ledger event, so it is `uncomplete` rather than `deleteRecord` — but the
+     act is the same one and the keeper is told the same way. */
+  const deleteCompletion = async (item) => {
+    if (!item || !item.taskId || !item.date) return;
+    await store.tasks.uncomplete(item.taskId, item.date);
+    await reload();
+    notify(t("delete.done.entry"));
   };
 
-  /* Nudging shifts only the next occurrence. The one after it is scheduled from
-     the actual completion, so this never permanently skews the rhythm. */
-  /* Moving a task sets an explicit date rather than accumulating a relative
-     offset. The old model nudged by N days, which meant the date you saw was
-     the result of arithmetic you could not inspect, and editing a task that
-     already had completion history did nothing at all — the due date was
-     derived from the last completion and the offset was quietly ignored. */
-  const setReminderDue = async (id, iso) => {
-    if (!iso) return;
-    await updateReminder(id, { dueOverride: iso, dueReason: "manual", adjustDays: 0 });
-    const r = reminders.find((x) => x.id === id);
-    notify(`${r ? r.label : "Task"} moved to ${fmtShort(iso)}`);
+  /* ---- the schedule ----------------------------------------------------- */
+  const markDone = async (taskId, date = todayStr(), detail = null) => {
+    const task = tasks.find((t) => t.id === taskId);
+    await store.tasks.complete({ taskId, date, detail });
+    if (task && task.oneOff) await store.tasks.saveTask({ ...task, enabled: false });
+    await reload();
+    notify("Task completed");
+    setTaskResult({
+      at: Date.now(),
+      label: task ? task.label : "Task",
+      date,
+      intervalDays: task ? task.intervalDays : null,
+      nextDue: null,
+    });
   };
 
-  const setReminderInterval = async (id, days) => {
-    if (!isFinite(days) || days < 1) return;
-    /* Changing the rhythm also releases any one-off move, or the new interval
-       would appear to do nothing until the pinned date passed. */
-    await updateReminder(id, { intervalDays: days, dueOverride: null, dueReason: null });
-    notify(`Now ${intervalLabel(days).toLowerCase()}`);
+  const addTask = async (spec) => {
+    const task = { ...makeTask(spec), oneOff: !!spec.oneOff };
+    await store.tasks.saveTask(task);
+    await reload();
+    notify("Task added");
   };
 
-  const skipReminder = async (id) => {
-    const r = reminders.find((x) => x.id === id);
-    if (!r) return;
-    const st = reminderState(r, taskLog, todayStr());
-    /* Skipping moves to the next occurrence rather than marking it done, so
-       the history stays honest about what was actually tested. */
-    await updateReminder(id, { dueOverride: addDays(st.due, r.intervalDays), dueReason: "skipped", adjustDays: 0 });
-    notify(`Skipped — next ${fmtShort(addDays(st.due, r.intervalDays))}`);
+  const updateTask = async (id, patch) => {
+    const task = tasks.find((t) => t.id === id);
+    if (!task) return;
+    await store.tasks.saveTask({ ...task, ...patch });
+    await reload();
   };
 
-  /* Kept for the existing +1 day controls. */
-  const nudgeReminder = async (id, days) => {
-    const r = reminders.find((x) => x.id === id);
-    if (!r) return;
-    const st = reminderState(r, taskLog, todayStr());
-    await setReminderDue(id, addDays(st.due, days));
+  const deleteTask = async (id) => {
+    await store.tasks.removeTask(id);
+    await reload();
+    notify("Task deleted");
   };
 
-  const completeReminder = async (id, date = todayStr()) => {
-    const entry = { id: uid(), taskId: id, date };
-    const next = [entry, ...taskLog];
-    setTaskLog(next);
-    await saveKey("task-log", next);
-    /* A completion supersedes any nudge — the next due date comes from here. */
-    await updateReminder(id, { adjustDays: 0 });
-
-    const rem = reminders.find((r) => r.id === id);
-    if (rem) {
-      const history = next.filter((l) => l.taskId === id)
-        .map((l) => l.date).sort((a, b) => (a < b ? 1 : -1));
-      setTaskResult({
-        at: Date.now(), label: rem.label, date,
-        intervalDays: rem.intervalDays,
-        nextDue: addDays(date, rem.intervalDays),
-        history,
-      });
-    }
+  /* A nudge moves ONLY the next occurrence, anchored to the completion it was
+     made against. `schedule.js` owns that rule; this passes the anchor. */
+  const nudgeTask = async (id, days) => {
+    const task = tasks.find((t) => t.id === id);
+    if (!task) return;
+    const st = scheduleView.states.find((s) => s.task.id === id);
+    await store.tasks.saveTask({ ...task, adjustDays: (task.adjustDays || 0) + days, adjustAnchor: st ? st.lastDone ?? null : null });
+    await reload();
+    notify("Moved to tomorrow");
   };
 
-  const applyRestore = (merged) => {
-    if (merged["readings"]) setReadings(merged["readings"]);
-    if (merged["icp-tests"]) setIcps(merged["icp-tests"]);
-    if (merged["water-changes"]) setWaterChanges(merged["water-changes"]);
-    if (merged["dose-log"]) setDoseLog(merged["dose-log"]);
-    if (merged["lighting-log"]) setLighting(merged["lighting-log"]);
-    if (merged["task-log"]) setTaskLog(merged["task-log"]);
-    if (merged["tasks-custom"]) setCustomTasks(merged["tasks-custom"]);
-    if (merged["reminders"]) setReminders(merged["reminders"]);
-    if (merged["tank-settings"]) setSettings(merged["tank-settings"]);
-    if (merged["custom-ranges"]) setCustomRanges(merged["custom-ranges"]);
-    if (merged["kit-changes"]) setKitChanges(merged["kit-changes"]);
-    if (merged["findings-dismissed"]) setDismissed(merged["findings-dismissed"]);
-    if (merged["correction-plans"]) setCorrectionPlans(merged["correction-plans"]);
+  const setTaskDue = async (id, date) => {
+    const task = tasks.find((t) => t.id === id);
+    if (!task) return;
+    const st = scheduleView.states.find((s) => s.task.id === id);
+    const base = st ? st.due : task.startDate;
+    const shift = Math.round((new Date(date) - new Date(base)) / 86400000);
+    await store.tasks.saveTask({ ...task, adjustDays: (task.adjustDays || 0) + shift, adjustAnchor: st ? st.lastDone ?? null : null });
+    await reload();
+    notify(`Moved to ${fmtShort(date)}`);
   };
 
-  /* Reminders replaced the old task list, so anything that used to look up a
-     task name reads from there instead. Kept under the same name so the CSV
-     export and due-list code didn't need rewriting. */
-  const allTasks = useMemo(
-    () => reminders.map((r) => ({ id: r.id, label: r.label, freqDays: r.intervalDays, builtin: r.builtin })),
-    [reminders]);
-
-  const latestByParam = useMemo(() => {
-    const map = {};
-    for (const def of paramDefs) {
-      const rows = readings.filter((r) => r.param === def.key).sort(byNewest);
-      map[def.key] = rows[0] || null;
-    }
-    return map;
-  }, [readings, paramDefs]);
-
-  const [remWindow, setRemWindow] = useState(14);
-  const reminderView = useMemo(
-    () => computeReminders(reminders, taskLog, todayStr(), remWindow),
-    [reminders, taskLog, remWindow]);
+  const setTaskInterval = async (id, n) => {
+    const task = tasks.find((t) => t.id === id);
+    if (!task) return;
+    await store.tasks.saveTask({ ...task, intervalDays: n, adjustDays: 0, adjustAnchor: null });
+    await reload();
+    notify("Schedule changed");
+  };
 
-  /* The reminder engine replaced this; nothing renders it any more. */
-  const dueList = [];
+  const skipTask = async (id) => {
+    const task = tasks.find((t) => t.id === id);
+    if (!task) return;
+    await store.tasks.saveTask({ ...task, adjustDays: (task.adjustDays || 0) + task.intervalDays, adjustAnchor: null });
+    await reload();
+    notify("Skipped once");
+  };
 
-  /* Husbandry events overlaid on parameter charts so cause and effect is visible. */
-  /* Chart markers are limited to things that happen occasionally and could
-     plausibly shift a trend. Water changes and recurring tasks are weekly, so
-     marking them buried the chart under a picket fence of lines that carried
-     no information. */
-  /* One place reasons about cross-cutting conclusions; every screen reads from
-     the same pool rather than re-deriving its own view. */
-  /* One derivation for the whole app. Every screen reads from this object, so
-     two surfaces cannot describe the same tank differently — the fault behind
-     two dismissal systems keyed differently, and a headline that contradicted
-     the claims beneath it. */
-  const tank = useMemo(
-    () => deriveTankState({
-      readings, icps, paramDefs, settings, doseLog, waterChanges, corrections,
-      kitChanges, dismissed, plans: { alk: alkPlan, ca: caPlan, mg: mgPlan },
-      correctionPlans,
-    }),
-    [readings, icps, paramDefs, settings, doseLog, waterChanges, corrections,
-     kitChanges, dismissed, alkPlan, caPlan, mgPlan, correctionPlans]);
+  /* ---- configuration ---------------------------------------------------- */
+  const saveConfig = async (values) => {
+    /* `effectiveFrom` is stamped from the APPLICATION's clock, not the wall
+       clock. Canon §518 resolves the configuration version effective at the
+       assessment instant and the engine refuses outright when none is; a
+       version stamped from the wall clock inside test mode is effective at the
+       real instant it was typed, so every backdated assessment finds no
+       configuration and refuses. `TM-25` is the test that caught exactly this
+       during the port. */
+    await store.config.append({ ...(config || {}), ...values }, nowIso());
+    await reload();
+    notify("Saved");
+    assess();
+  };
 
-  const findingsData = tank.findingsData;
-  const findings = tank.findings;
-  const dismissedList = tank.dismissedList;
-  const alkAssessment = tank.alkAssessment;
-  const caAssessment = tank.caAssessment;
-  const mgAssessment = tank.mgAssessment;
-  const doseStates = tank.doseStates;
+  /* ACCEPTING THE MEASURED STRENGTH — finding 13, and the keeper's act.
 
-  const chartEvents = useMemo(() => {
-    const ev = [];
-    for (const l of lighting) {
-      ev.push({ date: l.date, icon: "\u2600", color: "#926A09", kind: "Lighting", text: l.note || "Lighting change" });
-    }
-    for (const d of doseLog) {
-      const el = DOSE_ELEMENTS.find((e) => e.key === (d.element || "alkalinity"));
-      ev.push({ date: d.date, icon: "\u25C6", color: "#0B7C86", kind: "Dose",
-        param: d.element || "alkalinity",
-        text: `${el ? el.label : "Dose"} set to ${d.ml} mL/day` });
-    }
-    /* One-off corrections, on the chart for the same reason dose changes are:
-       a step in a line is unreadable without the thing that caused it, and a
-       correction is the most common cause of one. The engines have always
-       known about these; the charts did not, so a rise the app was privately
-       attributing to a correction looked unexplained to the person reading
-       it. Marked distinctly from a dose change because it is a single
-       addition in mL, not a new daily rate. */
-    for (const c of corrections) {
-      const el = DOSE_ELEMENTS.find((e) => e.key === (c.element || "alkalinity"));
-      ev.push({ date: c.date, icon: "+", color: "#B8541A", kind: "Correction",
-        param: c.element || "alkalinity",
-        text: `${fmtAmount(Math.abs(c.ml))} mL one-off ${el ? el.label.toLowerCase() : "alkalinity"} correction` });
-    }
-    return ev.sort(byOldest);
-  }, [lighting, doseLog, corrections]);
+     "If accepted it writes into configuration as a new version, exactly as if
+     typed. The dose is then sized from it." So this goes through `saveConfig`
+     like every other setting: a new configuration version, effective now, with
+     every assessment already stored still naming the version it actually used.
 
-  const alerts = useMemo(() => {
-    return paramDefs.map((def) => ({ def, reading: latestByParam[def.key] }))
-      .filter(({ def, reading }) => reading && paramStatus(def, reading.value) !== "ok" && paramStatus(def, reading.value) !== "unknown");
-  }, [latestByParam, paramDefs]);
+     `potencyDecision` records WHICH way he decided, what the estimate was when
+     he decided it, and on what day. Three things follow from it and none would
+     work without all three:
 
-  /* ---------- mutators ---------- */
-  const addReading = async (row) => {
-    const next = [...readings, { id: uid(), ...row }];
-    setReadings(next); await saveKey("readings", next);
-    /* Recording the reading IS the completion — there is no second tick to
-       remember, and the next one is scheduled from this date. */
-    const completed = await completeLinkedReminders(row.param, row.date, "test");
+       · the provenance line — "measured from your tank's response, accepted 22
+         Aug" — which is a different sentence from "the figure you entered";
+       · the estimator asking AGAIN if it later learns something different,
+         which it can only know by comparing against the figure he was shown;
+       · keeping being a decision rather than an absence of one. A keeper who
+         has looked at a measurement and chosen his own number has told the app
+         something, and the box must stop asking him the same question.
 
-    /* Hand back enough for the form to confirm what was saved and when the
-       next one falls, so the outcome is visible without leaving the page. */
-    const def = paramDefs.find((d) => d.key === row.param);
-    const linked = reminders.find((r) => r.enabled !== false && r.kind === "test" && r.paramKey === row.param);
-    /* The previous reading lets the confirmation say something about movement
-       rather than just repeating the number back. */
-    const prior = readings.filter((r) => r.param === row.param)
-      .sort(byNewest)[0];
-    const out = {
-      prev: prior ? prior.value : null,
-      delta: prior ? row.value - prior.value : null,
-      def, value: row.value, date: row.date,
-      status: def ? paramStatus(def, row.value) : "unknown",
-      nextDue: linked ? addDays(row.date, linked.intervalDays) : null,
-      interval: linked ? linked.intervalDays : null,
-      completed: completed && completed.length > 0,
-      /* Identity for the confirmation popup: remounting on each reading is what
-         stops the previous run's finished state painting for a frame. */
-      at: Date.now(),
+     It is application bookkeeping about a setting, not a setting the engine
+     reads, so it is stripped on the way to the engine like `potencyStatedAs`
+     beside it. */
+  const decidePotency = async (learned, accepted) => {
+    /* `inUse` is the figure this decision PUT IN FORCE — the measured one if he
+       took it, his own if he kept it. The provenance line reads it and states
+       nothing unless the configuration still holds it, so a figure he types
+       later cannot inherit "measured from your tank's response". */
+    const entered = config ? config.selectedPotencyDkhPerMl : null;
+    const values = {
+      potencyDecision: { accepted, learned, inUse: accepted ? learned : entered, on: todayStr() },
     };
-
-    /* What the dosing engine makes of the tank now this reading is in it. The
-       popup renders that verdict rather than forming its own — otherwise the
-       two drift, and a reading logged mid-correction reads as a problem while
-       the Dosing Wizard two taps away calls it progress. */
-    try {
-      const after = deriveTankState({
-        readings: next, icps, paramDefs, settings, doseLog, waterChanges,
-        corrections, kitChanges, dismissed,
-        plans: { alk: alkPlan, ca: caPlan, mg: mgPlan },
-        correctionPlans,
-      });
-      out.doseState = after.doseStates.find((d) => d && d.key === row.param) || null;
-    } catch (e) {
-      out.doseState = null;
+    if (accepted) {
+      values.selectedPotencyDkhPerMl = learned;
+      values.potencyStatedValue = learned;
+      values.potencyStatedAs = POTENCY_FORM.DKH_PER_ML;
     }
-    if (out.def) setLogResult(out);
-    return out;
-  };
-  const editReading = async (id, patch) => {
-    const next = readings.map((r) => (r.id === id ? { ...r, ...patch } : r));
-    setReadings(next); await saveKey("readings", next);
-  };
-  const deleteReading = async (id) => {
-    const next = readings.filter((r) => r.id !== id);
-    setReadings(next); await saveKey("readings", next);
-  };
-  /* Shared by readings and ICP panels: mark any linked reminder done and clear
-     a pending nudge, so the schedule follows what actually happened. */
-  const completeLinkedReminders = async (paramKey, date, kind) => {
-    const additions = autoCompletions(reminders, taskLog, paramKey, date, kind);
-    if (!additions.length) return [];
-    const nextLog = [...additions, ...taskLog];
-    setTaskLog(nextLog);
-    await saveKey("task-log", nextLog);
-    const ids = new Set(additions.map((a) => a.taskId));
-    const cleared = reminders.map((r) =>
-      ids.has(r.id) && (r.adjustDays || r.dueOverride)
-        ? { ...r, adjustDays: 0, dueOverride: null, dueTime: null, dueReason: null }
-        : r);
-    if (cleared.some((r, i) => r !== reminders[i])) await saveReminders(cleared);
-    return additions;
+    await saveConfig(values);
+    notify(accepted ? t("dosing.potency.accepted") : "Keeping the strength you entered");
   };
 
-  const addIcp = async (row) => {
-    const next = [...icps, { id: uid(), ...row }];
-    setIcps(next);
-    const ok = await saveKey("icp-tests", next);
-    await completeLinkedReminders(null, row.date, "icp");
-    /* The panel is the densest thing entered into the app; it deserves the same
-       moment a single reading gets. `at` keys the popup so each one remounts. */
-    setIcpResult({ ...row, at: Date.now(), priorPanels: icps });
-    return ok;
-  };
-  const deleteIcp = async (id) => {
-    const next = icps.filter((r) => r.id !== id);
-    setIcps(next); await saveKey("icp-tests", next);
-  };
-  const addCustomTask = async (row) => {
-    const next = [...customTasks, { id: uid(), builtin: false, ...row }];
-    setCustomTasks(next); await saveKey("tasks-custom", next);
-  };
-  const deleteCustomTask = async (id) => {
-    const next = customTasks.filter((t) => t.id !== id);
-    setCustomTasks(next); await saveKey("tasks-custom", next);
-    const nextLog = taskLog.filter((l) => l.taskId !== id);
-    setTaskLog(nextLog); await saveKey("task-log", nextLog);
-  };
-  const markTaskDone = async (taskId, date) => {
-    const next = [...taskLog, { id: uid(), taskId, date }];
-    setTaskLog(next); await saveKey("task-log", next);
+  const acceptPotency = (learned) => decidePotency(learned, true);
+  const keepPotency = (learned) => decidePotency(learned, false);
+
+  const saveRange = async (key, min, max) => {
+    const def = paramDefs.find((d) => d.key === key);
+    if (!config && !def) return;
+    const base = config || {};
+    const values = def && def.assessed
+      ? { ...base, targetRangeMinDkh: min, targetRangeMaxDkh: max }
+      : { ...base, parameterRanges: { ...(base.parameterRanges || {}), [key]: { min, max } } };
+    await store.config.append(values, nowIso());
+    await reload();
+    notify("Target range changed");
+    if (def && def.assessed) assess();
   };
-  const addLighting = async (row) => {
-    const next = [{ id: uid(), ...row }, ...lighting];
-    setLighting(next); await saveKey("lighting-log", next);
+
+  const resetRange = async (key) => {
+    const def = paramDefs.find((d) => d.key === key);
+    const base = config || {};
+    if (def && def.assessed) return;   /* alkalinity's range is a required fact */
+    const ranges = { ...(base.parameterRanges || {}) };
+    delete ranges[key];
+    await store.config.append({ ...base, parameterRanges: ranges }, nowIso());
+    await reload();
+    notify("Range cleared");
   };
-  const deleteLighting = async (id) => {
-    const next = lighting.filter((l) => l.id !== id);
-    setLighting(next); await saveKey("lighting-log", next);
+
+  const exportEverything = async () => {
+    const [events, annotations, all, cfgs, ts, cs] = await Promise.all([
+      store.ledger.allEvents(), store.ledger.allAnnotations(),
+      store.assessments.all(), store.config.history(),
+      store.tasks.tasks(), store.tasks.completions(),
+    ]);
+    const doc = {
+      format: "dosing-wizard-v2-export", version: 1,
+      exportedAt: new Date().toISOString(),
+      events, annotations, assessments: all, configurations: cfgs, tasks: ts, completions: cs,
+    };
+    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
+    const url = URL.createObjectURL(blob);
+    const a = document.createElement("a");
+    a.href = url;
+    a.download = `dosing-wizard-v2-${todayStr()}.json`;
+    document.body.appendChild(a);
+    a.click();
+    document.body.removeChild(a);
+    URL.revokeObjectURL(url);
+    notify("Export saved");
   };
 
+  const openTestFor = (key) => { setTab("log"); setModalParam(null); };
+
   if (!loaded) {
     return (
       <div className="min-h-screen bg-app flex items-center justify-center font-body">
         <div className="flex items-center gap-3 text-teal-brand font-bold text-sm">
-          <Waves className="animate-pulse" size={20} /> loading reef console…
+          <Waves className="animate-pulse" size={20} /> loading…
         </div>
       </div>
     );
   }
 
+  const modalDef = modalParam ? paramDefs.find((d) => d.key === modalParam) : null;
+
   return (
-    <div className="min-h-screen bg-app text-ink font-body">
+    /* ROUND THREE, ITEM 7 — THE TAB BAR SCROLLED WITH THE CONTENT.
+
+       `min-h-screen` on the shell plus `fixed bottom-0` on the nav is pinned
+       only while the visual viewport and the layout viewport agree, and on a
+       phone they do not: iOS Safari's toolbars shrink the visual viewport as
+       you scroll, so `100vh` overhangs the screen, the document grows past it
+       and the bar rides down with the content, leaving a band of dead grey
+       below it and a cut-off look at the fold.
+
+       `100dvh` is the DYNAMIC viewport height — the one that tracks the
+       toolbars — and the shell is now a flex column that owns its own scroll
+       region. The nav is a flex sibling of that region rather than a fixed
+       element floating over a document taller than the screen, so it cannot
+       ride anywhere: the content scrolls inside `<main>` and the bar is
+       always the last row of the viewport.
+
+       ROUND FOUR, ITEM 5 — AND IT WAS THE FALLBACK THAT BROKE IT.
+
+       The flex column above was right. What was wrong sat beside it:
+       `min-h-screen` is `min-height: 100vh`, and it was kept "as the fallback
+       for a browser with no `dvh`". A `min-height` is not a fallback for a
+       `height` — it is a FLOOR, and it wins. On iOS Safari `100vh` is the
+       viewport with the toolbars hidden, so it is TALLER than `100dvh`: the
+       shell was forced past the visual viewport, the document scrolled as a
+       whole, and the nav — the last row of a box taller than the screen — sat
+       below the fold. Which is exactly what the owner described: the bar
+       disappears as you scroll and "only reappears after scrolling all the way
+       to the bottom and continuing".
+
+       The fallback is now a `height` too, and it is written in CSS rather than
+       in a style object — a JS object cannot hold the same key twice, so
+       `{ height: "100vh", height: "100dvh" }` is not two declarations with the
+       second preferred, it is one declaration with the first silently dropped.
+       In the stylesheet below they are two declarations on one property: a
+       browser that understands `dvh` takes the second, one that does not takes
+       the first, which is what a fallback means.
+
+       `overflow: hidden` on the shell means the DOCUMENT cannot scroll at all.
+       Scrolling happens inside `<main>`, so there is no page-level scroll for
+       the bar to ride on however the viewport units resolve, and nothing can
+       run underneath it. */
+    <div className="bg-app text-ink font-body flex flex-col app-shell">
       <style>{`
         .font-display { font-family: 'Avenir Next', 'Avenir', 'Futura', 'Trebuchet MS', -apple-system, 'Segoe UI', Roboto, sans-serif; letter-spacing: -0.02em; font-weight: 800; }
         .font-body { font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
+        .app-shell { height: 100vh; height: 100dvh; overflow: hidden; }
         .bg-app { background-color: #F3F7F6; }
+        /* A raised surface on the pale-teal page. bg-card was USED by the
+           correction sheet and the pinned close control and was never defined,
+           so both rendered with no background at all - the sheet showed the
+           dark overlay through its own text. Defined once, here, beside the
+           page colour it has to stand out from (owner finding 10). */
+        .bg-card { background-color: #FFFFFF; }
         .border-app { border-color: #E3ECEA; }
         .text-ink { color: #08191D; }
         .text-ink2 { color: #45605F; }
```

3. **data source rewired — the sidebar states the app's own name and the keeper's configured net volume instead of V1's hard-coded tank identity**

```diff
@@ -1242,21 +764,26 @@
         }
       `}</style>
 
-      <div className="flex">
+      {/* The row that holds the desktop sidebar and the content. It is the
+          flex child that takes the leftover height, and it owns the overflow
+          so `<main>` inside it is the only thing that scrolls. */}
+      <div className="flex flex-1 min-h-0">
         {/* Sidebar - desktop */}
-        <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r border-app px-4 py-6 bg-white">
+        <aside className="hidden md:flex flex-col w-56 shrink-0 h-full overflow-y-auto border-r border-app px-4 py-6 bg-white">
           <div className="flex items-center gap-2 px-2 mb-8">
             <div className="w-9 h-9 rounded-xl bg-teal-brand flex items-center justify-center shadow-sm">
               <Waves size={17} className="text-white" />
             </div>
             <div>
-              <div className="font-display text-sm text-ink leading-tight">Dan's Tank</div>
-              <div className="text-[10px] text-ink2 font-bold">77L reef · Sydney</div>
+              <div className="font-display text-sm text-ink leading-tight">Dosing Wizard</div>
+              <div className="text-[10px] text-ink2 font-bold">
+                {config && config.netVolumeL ? `${config.netVolumeL}L` : "volume not set"}
+              </div>
             </div>
           </div>
           <nav className="flex flex-col gap-1">
             {NAV.map((n) => {
-              const Icon = n.icon;
+              const Icon = NAV_ICON[n.icon];
               const active = tab === n.id;
               return (
                 <button key={n.id} onClick={() => setTab(n.id)}
```

4. **data source rewired — V1's wipe-notice banner deleted with the storage layer that produced it; the install witness survives in V2's store with no surface, and that is recorded**

```diff
@@ -1266,59 +793,35 @@
               );
             })}
           </nav>
+          {/* V1 printed its own target ranges here as a fixed block of text.
+              They were band edges written into the sidebar, and they did not
+              come across. What is here instead is the keeper's own alkalinity
+              range, read back from his configuration. */}
           <div className="mt-auto px-3 py-3 rounded-lg bg-app border border-app">
-            <div className="text-[10px] text-teal-brand uppercase tracking-wide font-extrabold mb-1">Target ranges</div>
-            <div className="text-xs text-ink font-bold leading-relaxed">34–36 ppt · 8.5–9.5 dKH<br/>Ca 450–500 · Mg 1450–1500</div>
+            <div className="text-[10px] text-teal-brand uppercase tracking-wide font-extrabold mb-1">Your range</div>
+            <div className="text-xs text-ink font-bold leading-relaxed">
+              {config && config.targetRangeMinDkh != null
+                ? `${config.targetRangeMinDkh}–${config.targetRangeMaxDkh} dKH`
+                : "not set yet"}
+            </div>
           </div>
         </aside>
 
         {/* Main */}
-        <main className="flex-1 px-4 md:px-8 max-w-6xl"
+        <main className="flex-1 px-4 md:px-8 max-w-6xl overflow-y-auto"
           style={{
-            /* The safe-area inset is what actually protects the heading — on a
-               notched phone or an installed PWA it is the difference between a
-               readable title and one under the status bar, and it is zero on
-               desktop where nothing overlaps. The 2.5rem that used to sit on
-               top of it was defensive padding against mobile Chrome's URL bar,
-               but browser chrome sits above the viewport rather than over it,
-               so all it bought was a screenful of white space above every
-               heading. One rem is enough to keep the title off the edge. */
             paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))",
-            paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))",
+            /* The nav is a sibling now and takes its own height, so this no
+               longer has to reserve 6rem for a bar floating over it. */
+            paddingBottom: "1.5rem",
+            WebkitOverflowScrolling: "touch",
           }}>
-          {/* A cleared browser used to look exactly like a new phone, so the
-              app filled the gap with seed data and said nothing. It now says
-              what it knows and offers the only thing that can help. It does
-              not say whether a backup exists — `last-backup` was erased by the
-              same clear, and claiming either way is how the Setup panel used
-              to send people away from a file that was sitting in iCloud
-              Drive. */}
-          {install && (install.state === "wiped" || install.state === "suspect") && (
-            <div className="mb-4 rounded-xl p-3 border-2" style={{ background: "#A2621B12", borderColor: "#A2621B55" }}>
-              <div className="flex items-start gap-2 min-w-0">
-                <AlertTriangle size={16} className="shrink-0 mt-0.5" color="#A2621B" />
-                <div className="min-w-0">
-                  <p className="text-[13px] font-bold text-ink leading-relaxed">
-                    {install.state === "wiped"
-                      ? `This browser cleared the app's storage.${install.hadTotal > 0
-                          ? ` Before that, this device held ${lostSummary(install.had)}.`
-                          : ""} None of it is here now, and nothing has been filled in to replace it.`
-                      : "This browser is holding stored data the app cannot read, so this device is not being treated as a new one and nothing has been filled in."}
-                  </p>
-                  <p className="text-[12px] font-medium text-ink2 leading-relaxed mt-1">
-                    If you saved a backup file, restoring it brings your history back. This device
-                    has no record either way — that record was erased along with everything else.
-                  </p>
-                  <button onClick={() => setTab("setup")}
-                    className="mt-2 rounded-lg px-3 py-2 text-[12px] font-extrabold text-white"
-                    style={{ background: "#A2621B" }}>
-                    Restore from a backup
-                  </button>
-                </div>
-              </div>
-            </div>
-          )}
 
+          {/* The one failure the whole real/test separation exists to prevent
+              is a keeper reading a test answer as his own tank's, so the
+              marker is loud and is on every screen while the mode is on. */}
+          <TestModeMarker key={modeTick} />
+
           {storageMsg && (
             <div className="mb-4 rounded-xl p-3 border-2" style={{ background: "#C4285B12", borderColor: "#C4285B55" }}>
               <div className="flex items-start justify-between gap-3">
```

5. **chemistry removed — V1's fixed block of target ranges in the sidebar deleted; the keeper's own alkalinity range is read back from his configuration**

```diff
@@ -1335,105 +838,133 @@
             <div className="w-8 h-8 rounded-lg bg-teal-brand flex items-center justify-center">
               <Waves size={16} className="text-white" />
             </div>
-            <div className="font-display text-ink">Dan's Tank</div>
+            <div className="font-display text-ink">Dosing Wizard</div>
           </header>
 
           <TabErrorBoundary tabKey={tab}>
           {tab === "dashboard" && (
-            <Dashboard {...{ latestByParam, dueList, alerts, readings, paramDefs, saveRange, resetRange,
-              customRanges, chartEvents, settings, doseLog, waterChanges, findings, icps,
-              reminderView, remWindow, setRemWindow, doseStates }}
-              onOpenTest={openTestFor}
-              onCompleteReminder={completeReminder}
-              onNudgeReminder={nudgeReminder}
-              onSetReminderDue={setReminderDue} onSetReminderInterval={setReminderInterval}
-              onSkipReminder={skipReminder} onUpdateReminder={updateReminder}
-              onAddReading={addReading} reminders={reminders} taskLog={taskLog}
-              onGoTab={(t) => setTab(t)}
-              tank={tank}
-              dismissedNotes={dismissed}
-              onDismissNote={dismissNote} onRestoreNotes={restoreNotes}
-              onRestoreOneNote={restoreOneNote}
-              onOpenParam={setModalParam} />
+            <Dashboard
+              latestByParam={latestByParam} readings={readings} paramDefs={paramDefs}
+              saveRange={saveRange} resetRange={resetRange} customRanges={{}}
+              chartEvents={chartEvents} config={config} episodes={episodes}
+              engineResult={engineResult} assessmentState={assessmentState} scheduleView={scheduleView}
+              tasks={tasks} completions={completions} waterChanges={waterChanges}
+              onOpenParam={setModalParam} onOpenTest={openTestFor}
+              onCompleteTask={markDone} onNudgeTask={nudgeTask}
+              remWindow={remWindow} setRemWindow={setRemWindow}
+              onSetTaskDue={setTaskDue} onSetTaskInterval={setTaskInterval}
+              onSkipTask={skipTask} onUpdateTask={updateTask}
+              onAddReading={addReading}
+              onCorrectReading={fixReading} onDeleteReading={dropReading} />
           )}
+
           {tab === "log" && (
-            <WaterLog readings={readings} onAdd={addReading} onDelete={deleteReading}
-              paramDefs={paramDefs} chartEvents={chartEvents}
-              icps={icps} onAddIcp={addIcp} onDeleteIcp={deleteIcp} onEdit={editReading} prefill={testPrefill}
-              onOpenParam={setModalParam} reminders={reminders} reminderView={reminderView} />
+            <div>
+              {/* `My tests` / `ICP panels`, with counts, and All graphs top right. */}
+              <div className="flex items-center justify-between gap-2 mb-4">
+                <div className="flex gap-1.5">
+                  {[["tests", "My tests", readings.length], ["icp", "ICP panels", icps.length]].map(([k, label, n]) => (
+                    <button key={k} onClick={() => setTestTab(k)}
+                      className="rounded-lg px-3 py-1.5 text-[12px] font-extrabold border-2"
+                      style={{ borderColor: testTab === k ? "#0B7C86" : "#E3ECEA",
+                               color: testTab === k ? "#0B7C86" : "#45605F",
+                               background: testTab === k ? "#0B7C8610" : "#fff" }}>
+                      {label} <span className="opacity-70">{n}</span>
+                    </button>
+                  ))}
+                </div>
+                <button onClick={() => setAllGraphs(true)}
+                  className="rounded-lg px-3 py-1.5 text-[12px] font-extrabold border-2"
+                  style={{ borderColor: "#E3ECEA", color: "#45605F" }}>
+                  All graphs
+                </button>
+              </div>
+
+              {testTab === "tests" ? (
+                <TestLab paramDefs={paramDefs} readings={readings} onAdd={addReading}
+                  onOpenParam={setModalParam} scheduleView={scheduleView}
+                  episodes={episodes} onDeleteReading={dropReading} />
+              ) : (
+                <IcpPanel icps={icps} onAdd={addIcp} />
+              )}
+            </div>
           )}
+
           {tab === "dosing" && (
-            <DosingWizard paramDefs={paramDefs}
-              alkAssessment={alkAssessment} caAssessment={caAssessment} mgAssessment={mgAssessment}
-              findings={findings} onDismissFinding={dismissFinding}
-              onApplyAlkDose={applyAlkDose} onApplyCaDose={applyCaDose} onApplyMgDose={applyMgDose}
-              onClearAlkPlan={clearAlkPlan} onClearCaPlan={clearCaPlan} onClearMgPlan={clearMgPlan}
-              correctionOffers={tank.correctionOffers} doseStates={tank.doseStates}
-              onStartCorrection={startCorrection} onCancelCorrection={cancelCorrection}
-              onFinishCorrection={finishCorrection}
-              onLogCorrection={logCorrection}
-              onApplyEffect={applyAlkEffect} onApplyCaEffect={applyCaEffect} onApplyMgEffect={applyMgEffect} />
-          )}
-          {tab === "insights" && (
-            <Insights readings={readings} icps={icps} paramDefs={paramDefs}
-              settings={settings} latestByParam={latestByParam}
-              doseLog={doseLog} waterChanges={waterChanges} lighting={lighting} findings={findings}
-              onSaveSettings={saveSettings} onSaveRange={saveRange}
-              kitChanges={kitChanges} onReplaceKit={replaceKit} onUndoReplaceKit={undoReplaceKit}
-              onDismissFinding={dismissFinding} onApplyAlkDose={applyAlkDose}
-              alkPlan={alkPlan} onClearAlkPlan={clearAlkPlan}
-              corrections={corrections} onLogCorrection={logCorrection}
-              onApplyEffect={applyAlkEffect}
-              onApplyCaDose={applyCaDose} onApplyCaEffect={applyCaEffect}
-              caPlan={caPlan} onClearCaPlan={clearCaPlan}
-              onApplyMgDose={applyMgDose} onApplyMgEffect={applyMgEffect}
-              mgPlan={mgPlan} onClearMgPlan={clearMgPlan} />
+            <DosingWizard paramDefs={paramDefs} engineResult={engineResult}
+              asOf={assessment && assessment.asOf ? assessment.asOf : null}
+              correctionDismissed={correctionDismissed} onDismissCorrection={dismissCorrection}
+              onAcceptPotency={acceptPotency} onKeepPotency={keepPotency}
+              summaries={doseSummaries(engineResult, paramDefs, assessmentState)}
+              latestByParam={latestByParam}
+              config={config} readings={readings} chartEvents={chartEvents} episodes={episodes}
+              /* V1's, kept where a hold is recommended: a hold is advice, and
+                 the keeper is allowed to disagree with it. It opens the same
+                 dose-change form Setup uses; nothing here records a change by
+                 itself (`ALK-RECOMMEND-ONLY-001`). */
+              /* `"settings"` is not a tab id — `NAV` calls it `"setup"` — so this
+                 button set the tab to a value nothing renders and the screen
+                 went blank with only the bar left. Owner finding 20. */
+              onChangeDoseAnyway={() => setTab("setup")} />
           )}
+
           {tab === "tasks" && (
-            <Tasks allTasks={allTasks} taskLog={taskLog} onAddCustom={addCustomTask}
-              onDeleteCustom={deleteCustomTask} onMarkDone={completeReminder}
-              onAddWaterChange={addWaterChange} waterChanges={waterChanges}
-              settings={settings} latestByParam={latestByParam}
-              paramDefs={paramDefs} onDeleteWaterChange={deleteWaterChange}
-              reminders={reminders} reminderView={reminderView} onUpdateReminder={updateReminder}
-              onSetReminderDue={setReminderDue} onSetReminderInterval={setReminderInterval}
-              onSkipReminder={skipReminder}
-              onNudgeReminder={nudgeReminder} onAddReminder={addReminder}
-              onDeleteReminder={deleteReminder} onOpenTest={openTestFor} />
+            <Tasks tasks={tasks} completions={completions} scheduleView={scheduleView}
+              paramDefs={paramDefs}
+              onMarkDone={markDone} onAddTask={addTask} onDeleteTask={deleteTask}
+              onUpdateTask={updateTask}
+              onSetTaskDue={setTaskDue} onSetTaskInterval={setTaskInterval} onSkipTask={skipTask}
+              onAddWaterChange={addWaterChange} onAddOneOff={addOneOff}
+              onAddLightingChange={addLightingChange} onAddNote={addNote}
+              waterChanges={waterChanges} onOpenTest={openTestFor}
+              onDeleteDone={deleteCompletion} />
           )}
+
           {tab === "setup" && (
-            <Setup settings={settings} onSaveSettings={saveSettings} paramDefs={paramDefs}
-              latestByParam={latestByParam} readings={readings}
-              doseLog={doseLog} onAddDoseChange={addDoseChange} onDeleteDoseChange={deleteDoseChange}
-              waterChanges={waterChanges} icps={icps} lighting={lighting}
-              taskLog={taskLog} allTasks={allTasks}
-              onAddLighting={addLighting} onDeleteLighting={deleteLighting}
-              customTasks={customTasks} onRestored={applyRestore} customRanges={customRanges}
-              corrections={corrections} onDeleteCorrection={deleteCorrection}
-              onPlayIntro={() => setSplash(true)}
-              dismissedList={dismissedList} onRestoreFinding={restoreFinding}
-              onRestoreAllFindings={restoreAllFindings} />
+            <Setup config={config} onSaveConfig={saveConfig} paramDefs={paramDefs}
+              engineResult={engineResult}
+              doseChanges={doseChanges} onAddDoseChange={addDoseChange} onDeleteEvent={deleteEvent}
+              onSetStandingDose={setStandingDose}
+              onModeChange={() => setModeTick((n) => n + 1)}
+              lightingChanges={lightingChanges}
+              hiddenNotices={hiddenList} onRestoreNotice={restoreNotice}
+              onRestoreAllNotices={restoreAllNotices}
+              onExport={exportEverything}
+              store={store}
+              onImported={async () => { await reload(); assess(); notify("History imported"); }} />
           )}
           </TabErrorBoundary>
 
-          <DoseChangePopup key={doseResult ? doseResult.at : "none"} result={doseResult} onClose={() => setDoseResult(null)} />
-          <LogResultPopup key={logResult ? logResult.at : "none"} result={logResult}
+          <DoseChangePopup key={doseResult ? "dose" + doseResult.at : "dosenone"} result={doseResult}
+            onClose={() => setDoseResult(null)} />
+          <LogResultPopup key={logResult ? "log" + logResult.at : "lognone"} result={logResult}
             onClose={() => setLogResult(null)} readings={readings}
+            verdict={logResult && engineResult && logResult.def && logResult.def.assessed
+              ? {
+                  tone: positionTone(engineResult.position),
+                  headline: sayPosition(engineResult.position),
+                  line: sayAction(engineResult.doseRecommendation && engineResult.doseRecommendation.action),
+                  goto: instructsDoseChange(engineResult) ? "dosing" : null,
+                }
+              : null}
             onOpenDosing={() => setTab("dosing")} />
-          <IcpResultPopup key={icpResult ? "icp" + icpResult.at : "icpnone"} result={icpResult}
-            onClose={() => setIcpResult(null)} icps={icpResult ? icpResult.priorPanels : []} />
           <TaskDonePopup key={taskResult ? "task" + taskResult.at : "tasknone"} result={taskResult}
             onClose={() => setTaskResult(null)} />
           <Toast message={toastMsg} onDone={() => setToastMsg(null)} />
-          {splash && <LaunchSplash onDone={() => setSplash(false)} />}
 
-          {modalParam && (
-            <ParamHistoryModal def={paramDefs.find((d) => d.key === modalParam)} readings={readings}
+          {allGraphs && (
+            <AllGraphsModal paramDefs={paramDefs} readings={readings} chartEvents={chartEvents}
+              episodes={episodes}
+              onClose={() => setAllGraphs(false)} onOpenParam={setModalParam} />
+          )}
+
+          {modalDef && (
+            <ParamHistoryModal def={modalDef} readings={readings}
               onClose={() => setModalParam(null)} onSaveRange={saveRange} onResetRange={resetRange}
-              isCustom={!!customRanges[modalParam]} chartEvents={chartEvents} settings={settings}
-              doseLog={doseLog} paramDefs={paramDefs} waterChanges={waterChanges} findings={findings}
-              onAddReading={addReading} reminders={reminders} onDismissFinding={dismissFinding}
-              dose={(doseStates || []).find((d) => d.key === modalParam) || null}
+              isCustom={!modalDef.assessed && modalDef.hasRange}
+              chartEvents={chartEvents} episodes={episodes} onDeleteReading={dropReading}
+              onAddReading={addReading}
+              notice={noticeFor(modalDef)}
               onGoDosing={() => { setModalParam(null); setTab("dosing"); }} />
           )}
         </main>
```

6. **defect fixed — a module of constants that could not be loaded outside the bundler could not be tested. `lib/constants.js` now imports nothing and `NAV` carries an icon KEY; the shell binds the key to a glyph here**

```diff
@@ -1440,10 +971,10 @@
       </div>
 
       {/* Bottom nav - mobile */}
-      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-app flex justify-around py-2 z-20 shadow-[0_-1px_6px_rgba(15,40,45,0.06)]"
+      <nav className="md:hidden shrink-0 bg-white border-t border-app flex justify-around py-2 z-20 shadow-[0_-1px_6px_rgba(15,40,45,0.06)]"
         style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom, 0px))" }}>
         {NAV.map((n) => {
-          const Icon = n.icon;
+          const Icon = NAV_ICON[n.icon];
           const active = tab === n.id;
           return (
             <button key={n.id} onClick={() => setTab(n.id)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[56px] rounded-lg active:bg-app">
```

7. **data source rewired — the root error boundary's rescue export reads V2's store directly instead of V1's `buildBackup`, because V2's record is in IndexedDB rather than localStorage**

```diff
@@ -1457,6 +988,96 @@
   );
 }
 
+/* The last line before a blank screen.
+ *
+ * `TabErrorBoundary` covers the tab contents, but everything above it — every
+ * storage load, every hook — runs outside it, and a failure in any of that
+ * renders nothing at all: no tabs, no menu, and no way to reach the export
+ * button.
+ *
+ * That matters more than it sounds. A display bug is an annoyance if you can
+ * still get your data out and a disaster if you cannot.
+ */
+export class RootErrorBoundary extends React.Component {
+  constructor(props) {
+    super(props);
+    this.state = { error: null, saving: false, saved: false };
+  }
+  static getDerivedStateFromError(error) { return { error }; }
+
+  /* V1 called `buildBackup()`, which read its own `localStorage` keys directly
+     and therefore still worked when everything above it had failed. V2's
+     record is in IndexedDB, so the rescue opens its own store rather than
+     reaching for component state that is not there. */
+  async rescue() {
+    this.setState({ saving: true });
+    try {
+      const store = createStore();
+      const [events, annotations, assessments, configurations, tasks, completions] = await Promise.all([
+        store.ledger.allEvents(), store.ledger.allAnnotations(),
+        store.assessments.all(), store.config.history(),
+        store.tasks.tasks(), store.tasks.completions(),
+      ]);
+      const doc = { format: "dosing-wizard-v2-export", version: 1,
+        exportedAt: new Date().toISOString(),
+        events, annotations, assessments, configurations, tasks, completions };
+      const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
+      const url = URL.createObjectURL(blob);
+      const a = document.createElement("a");
+      a.href = url;
+      a.download = `dosing-wizard-v2-rescue-${todayStr()}.json`;
+      document.body.appendChild(a);
+      a.click();
+      document.body.removeChild(a);
+      URL.revokeObjectURL(url);
+      this.setState({ saving: false, saved: true });
+    } catch (e) {
+      this.setState({ saving: false, saved: false, rescueFailed: String(e && e.message) });
+    }
+  }
+
+  render() {
+    if (!this.state.error) return this.props.children;
+    const { saving, saved, rescueFailed } = this.state;
+    return (
+      <div style={{ minHeight: "100vh", background: "#F3F7F6", padding: "24px 18px" }}>
+        <div style={{ maxWidth: 460, margin: "0 auto" }}>
+          <h1 style={{ fontSize: 19, fontWeight: 900, color: "#08191D", margin: "0 0 10px" }}>
+            The app could not start
+          </h1>
+          <p style={{ fontSize: 14, lineHeight: 1.55, color: "#45605F", margin: "0 0 8px" }}>
+            Something failed before any screen could be drawn. <strong>Your data has not been
+            touched</strong> — it is still in storage exactly as you left it.
+          </p>
+          <p style={{ fontSize: 14, lineHeight: 1.55, color: "#45605F", margin: "0 0 18px" }}>
+            Save a copy now, before doing anything else.
+          </p>
+          <button onClick={() => this.rescue()} disabled={saving}
+            style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "none",
+                     background: saved ? "#0B7C86" : "#08191D", color: "#fff",
+                     fontSize: 15, fontWeight: 800, cursor: saving ? "default" : "pointer" }}>
+            {saving ? "Saving…" : saved ? "Saved — check your downloads" : "Save my data"}
+          </button>
+          {rescueFailed && (
+            <p style={{ fontSize: 13, color: "#C4285B", marginTop: 12, fontWeight: 700 }}>
+              The rescue export also failed. {rescueFailed} Do not clear the app's storage —
+              the data is still there and can be recovered another way.
+            </p>
+          )}
+          <p style={{ fontSize: 12, color: "#5F7575", marginTop: 22, lineHeight: 1.5 }}>
+            Reloading is safe and may clear a one-off failure. If it does not, the message
+            below is what went wrong.
+          </p>
+          <pre style={{ fontSize: 11, color: "#5F7575", background: "#E3ECEA",
+                        padding: 10, borderRadius: 8, overflowX: "auto", marginTop: 8 }}>
+            {String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)}
+          </pre>
+        </div>
+      </div>
+    );
+  }
+}
+
 /* Exported wrapped, so nothing can render the app without its last line of
    defence in place. */
 export function ReefConsole() {
```
