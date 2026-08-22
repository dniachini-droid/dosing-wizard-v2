/* ============================================================================
   OFFLINE
   ----------------------------------------------------------------------------
   ROUND THREE, ITEM 10: "offline is gone. The service worker did not survive
   the build change."

   `PRODUCT-VISION.md` wants an installable app a keeper can use standing at
   the tank, and a reef tank is very often in a garage, a basement or a fish
   room where the phone has no signal. An app that needs the network to tell
   you what your alkalinity is doing is not the product.

   WHAT IS CACHED, AND WHY IT IS NOT JUST THE SHELL. This app carries its own
   engine: `app/src/engine/worker.js` runs `engine/alk_v2/*.py` inside CPython
   compiled to WebAssembly, and fetches those files, the frozen reason-code
   catalogue and a 12 MB Python runtime from the same origin at run time. Cache
   the HTML and the JavaScript alone and the app opens offline and then cannot
   answer anything, which is a worse failure than not opening: it looks like
   the engine is broken.

   So the precache list is the shell AND the engine's own files AND the
   catalogue. The runtime is cached on first use rather than precached — it is
   12 MB, it is not committed to the repository, and forcing it into the
   install step would make a failed install out of an artefact that may not be
   deployed yet.

   ONE OWNER FOR THE MODULE LIST. `ENGINE_MODULES` in `worker.js` is the list,
   and its own comment says it is written out "so the service worker can
   precache exactly this set". The build reads it out of that file rather than
   restating it here — two lists that agree today is what canon `MASTER RULE 1`
   calls a defect rather than a coincidence.

   The two placeholders at the head of the code below are filled in at build
   time by the `dosing-wizard:service-worker` plugin in `vite.config.js`. They
   are deliberately not spelled out in this comment: `String.replace` takes the
   FIRST occurrence, so a comment that named them would be substituted instead
   of the code, and the worker would ship with its placeholders intact and fail
   to evaluate at all. That is exactly what happened once.
   ========================================================================= */

const VERSION = "__VERSION__";
const CACHE = `dosing-wizard-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      /* One at a time and tolerant of a miss. `cache.addAll` rejects the whole
         install if ANY single URL 404s, and this list spans three directories
         of a repository that is served rather than bundled — one renamed file
         and the app would have no service worker at all, silently. A missing
         entry is a gap in the offline story; a failed install is the whole
         story gone. */
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "reload" });
            if (res.ok) await cache.put(url, res);
          } catch {
            /* Left out of the cache. The fetch handler will try the network
               for it, which is what it would have done anyway. */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      /* Every previous version's cache is dropped. A stale engine file served
         beside a fresh one is two versions of the chemistry in one answer, and
         canon §64 conditions replay on the engine version being the same. */
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith("dosing-wizard-") && n !== CACHE).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);

      /* A navigation is answered from the shell so a deep link works offline
         too. `index.html` is the only entry this app has. */
      if (req.mode === "navigate") {
        const cached = await cache.match("/app/index.html");
        if (cached) {
          /* Refresh it in the background; the keeper gets the copy that is
             already here rather than waiting on a network that may be gone. */
          event.waitUntil(refresh(cache, "/app/index.html"));
          return cached;
        }
        try { return await fetch(req); } catch { return new Response("", { status: 504 }); }
      }

      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) {
        event.waitUntil(refresh(cache, req));
        return cached;
      }

      try {
        const res = await fetch(req);
        /* The Python runtime and anything else fetched at run time lands here
           on its first use, which is what makes the SECOND launch work
           offline even though the runtime is not precached. */
        if (res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch {
        return new Response("", { status: 504 });
      }
    })()
  );
});

async function refresh(cache, request) {
  try {
    const res = await fetch(request, { cache: "no-cache" });
    if (res.ok) await cache.put(request, res);
  } catch {
    /* Offline. The cached copy already went back to the page. */
  }
}
