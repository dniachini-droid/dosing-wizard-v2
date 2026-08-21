/* ============================================================================
   THE SERVICE WORKER — offline on first paint
   ----------------------------------------------------------------------------
   V1 canon `wizard-states.md` §18, carried across as the offline contract:
   "Fully functional with no network on first paint after install; a service
   worker must never serve a half-updated asset set; a log entry created
   offline must survive a hard reload."

   The middle clause is the one that shapes this file. A cache that is filled
   file-by-file can be read halfway through filling, and then the app runs with
   last week's screen against this week's store. So:

     - every install writes into a NEW cache named for its version;
     - the new cache is only switched to when it is COMPLETE;
     - if any part of the shell fails to fetch, the install fails and the old
       cache keeps serving. A working old version beats a broken new one.

   TWO TIERS, AND WHY
   ------------------

   The shell is small and is precached at install: the app opens offline
   immediately after the first visit.

   The Python runtime is 12 MB and is cached in the BACKGROUND after the shell
   is ready. That is deliberate. The keeper can log a reading, complete a task
   and read their history before it has finished; only the assessment waits.
   Blocking the install on 12 MB would mean a keeper on a slow connection had
   no app at all rather than most of one.
   ========================================================================= */

const VERSION = "dw2-v1";
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

/* The application shell. Everything needed to open, log a reading and read
   history with no network at all. */
const SHELL_FILES = [
  /* `./` is deliberately NOT here. A static host serves the directory as
     index.html, but a bare directory URL is not universally fetchable, and one
     unfetchable entry fails the whole install — which is the correct behaviour
     and cost an afternoon to diagnose the first time. Navigations fall back to
     `./index.html` in the fetch handler, which covers the directory URL. */
  "./index.html",
  "./manifest.webmanifest",
  "./assets/tokens.css",
  "./assets/app.css",
  "./assets/shell.css",
  "./assets/icon.svg",
  "./src/main.js",
  "./src/assess.js",
  "./src/ui/dom.js",
  "./src/ui/format.js",
  "./src/store/index.js",
  "./src/store/db.js",
  "./src/store/time.js",
  "./src/store/mode.js",
  "./src/store/seed.js",
  "./src/store/import-v1.js",
  "./src/store/ledger.js",
  "./src/store/assessments.js",
  "./src/store/schedule.js",
  "./src/store/config.js",
  "./src/strings.js",
  "./src/store/suggestion.js",
  "./src/present/cards.js",
  "./src/present/wording.js",
  "./src/present/attention.js",
  "./src/present/why-retest.js",
  "./src/screens/today.js",
  "./src/screens/testlab.js",
  "./src/screens/testmode.js",
  "./src/screens/importv1.js",
  "./src/screens/tasks.js",
  "./src/screens/history.js",
  "./src/screens/settings.js",
  "./src/screens/entry.js",
  "./src/screens/entrydetail.js",
  "./src/screens/logentry.js",
  "./src/screens/assessment.js",
  "./src/screens/detail.js",
  "./src/moments/moments.js",
  "./src/moments/present.js",
  "./src/engine/client.js",
  "./src/engine/worker.js",
  /* The canon's default configuration. Setup reads it rather than carrying a
     copy of the numbers, so setup has to work offline too. */
  "../docs/implementation/alk-v2/fixtures/config-defaults.json",
];

/* The engine and its runtime. Cached after the shell, in the background. */
const ENGINE_FILES = [
  "../engine/alk_v2/__init__.py",
  "../engine/alk_v2/adapter.py",
  "../engine/alk_v2/capability.py",
  "../engine/alk_v2/catalogue.py",
  "../engine/alk_v2/constants.py",
  "../engine/alk_v2/dosing.py",
  "../engine/alk_v2/engine.py",
  "../engine/alk_v2/intervention.py",
  "../engine/alk_v2/kernel.py",
  "../engine/alk_v2/ledger.py",
  "../engine/alk_v2/observation.py",
  "../engine/alk_v2/potency.py",
  "../engine/alk_v2/response.py",
  "../engine/alk_v2/retest.py",
  "../engine/alk_v2/trajectory.py",
  "../docs/implementation/alk-v2/ALK-V2-REASON-CODES.md",
  "./vendor/pyodide/pyodide.mjs",
  "./vendor/pyodide/pyodide.asm.js",
  "./vendor/pyodide/pyodide.asm.wasm",
  "./vendor/pyodide/python_stdlib.zip",
  "./vendor/pyodide/pyodide-lock.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      /* `addAll` is atomic in the sense that matters here: one failure rejects
         the whole thing, the install fails, and `SHELL` is never activated as
         the cache to serve from. That is the "never a half-updated asset set"
         rule, enforced rather than hoped for.

         Its one weakness is diagnostic: it says "Request failed" and not which
         request. So each file is fetched by name first, and a failure names the
         file. Without this, one missing asset presents as an app that silently
         never works offline, with nothing anywhere saying why. */
      const missing = [];
      await Promise.all(
        SHELL_FILES.map(async (url) => {
          try {
            const res = await fetch(new Request(url, { cache: "reload" }));
            if (!res.ok) missing.push(`${url} (${res.status})`);
          } catch (e) {
            missing.push(`${url} (${(e && e.message) || "unreachable"})`);
          }
        })
      );
      if (missing.length) {
        throw new Error("the offline copy is incomplete, so it was not installed: " + missing.join(", "));
      }
      await cache.addAll(SHELL_FILES);
      /* Not `skipWaiting()`. A worker that takes over immediately can leave a
         page running old modules against a new cache — a half-updated set by a
         different route. The new version takes over when every page using the
         old one has closed, which for a home-screen app is the next open. */
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !n.startsWith(VERSION)).map((n) => caches.delete(n)));
      await self.clients.claim();
      /* The runtime, in the background, after the shell is live. A failure here
         is not fatal: the app works, and the assessment card says the engine is
         still starting. */
      cacheRuntime();
    })()
  );
});

async function cacheRuntime() {
  const cache = await caches.open(RUNTIME);
  for (const url of ENGINE_FILES) {
    try {
      if (await cache.match(url)) continue;
      const res = await fetch(url, { cache: "reload" });
      if (res.ok) await cache.put(url, res);
    } catch {
      /* Offline, or the file is not deployed. Reported by the app, not here. */
    }
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      /* Cache first. This app has no server-side state and nothing on it goes
         stale within a session; a network-first strategy would just make every
         screen wait for a round trip that adds nothing. */
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;

      try {
        const res = await fetch(req);
        /* Anything fetched that belongs to the runtime tier is kept, so a file
           missed by the background pass is cached the first time it is needed
           rather than being fetched again on every open. */
        if (res.ok && (url.pathname.includes("/vendor/pyodide/") || url.pathname.includes("/engine/alk_v2/"))) {
          const cache = await caches.open(RUNTIME);
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        /* Offline and not cached. For a navigation, the app shell is the right
           answer — the app runs from local data and does not need this URL.
           For anything else, an honest failure the caller can report. */
        if (req.mode === "navigate") {
          const shell = await caches.match("./index.html");
          if (shell) return shell;
        }
        return new Response("This part of the app is not available offline yet.", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }
    })()
  );
});
