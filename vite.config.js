import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/* ============================================================================
   THE BUILD, AND THE ONE THING IT IS NOT ALLOWED TO MOVE
   ----------------------------------------------------------------------------
   The interface is V1's, and V1's interface is React. Porting it verbatim —
   which `docs/migration/PORT-MANIFEST.md` then proves line by line — requires
   the toolchain V1's files were written for. That is what this file is.

   `root` is the REPOSITORY, not `app/`, and that is load-bearing rather than a
   preference. `app/src/engine/worker.js` resolves the engine's own files from
   three directories above itself:

       const BASE = new URL("../../../", self.location.href);

   and then fetches `engine/alk_v2/*.py` and the frozen reason-code catalogue
   from `docs/`. Serving the repository root is what makes those paths land on
   the real engine and the real catalogue. Serving `app/` would have meant
   editing the worker to suit the build — that is, changing the engine boundary
   to make the interface convenient, which is the wrong way round. The engine
   is byte-identical to `main` and the transport that reaches it is untouched.
   ========================================================================= */

export default defineConfig({
  root: '.',
  plugins: [
    react(),
    {
      /* The dev server needs the same answer the build does. `resolveId`
         returning `external` leaves the specifier alone in both, so the
         browser fetches `/app/vendor/pyodide/pyodide.mjs` at run time — which
         is exactly where `tools/app/vendor-runtime.py` writes it. */
      name: 'dosing-wizard:uncommitted-python-runtime',
      enforce: 'pre',
      resolveId(id) {
        if (id.endsWith('vendor/pyodide/pyodide.mjs')) {
          return { id: '/app/vendor/pyodide/pyodide.mjs', external: true };
        }
        return null;
      },
      /* And the runtime is served RAW. Everything under `app/vendor/` is a
         CPython build — `pyodide.asm.js` is six megabytes of Emscripten output
         that carries a Node-only `require("ws")` down one branch — and handing
         it to a JavaScript module transformer gets exactly that: an unresolved
         import for a package this application has never depended on. It is not
         source. It is an artefact, fetched and hash-verified by
         `tools/app/vendor-runtime.py`, and it is served as bytes. */
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = (req.url || '').split('?')[0];
          if (!url.startsWith('/app/vendor/')) return next();
          const file = path.join(process.cwd(), decodeURIComponent(url));
          if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
          const TYPES = {
            '.mjs': 'text/javascript', '.js': 'text/javascript',
            '.wasm': 'application/wasm', '.json': 'application/json',
            '.zip': 'application/zip',
          };
          res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
          fs.createReadStream(file).pipe(res);
        });
      },
    },
    {
      /* ROUND THREE, ITEM 10 — THE SERVICE WORKER.

         `app/sw.js` is the source; this emits the built copy with two
         placeholders filled in. It runs at `generateBundle` so it can see the
         real hashed asset names, which is the half a hand-written precache
         list cannot have.

         THE ENGINE MODULE LIST IS READ, NOT RESTATED. `ENGINE_MODULES` in
         `app/src/engine/worker.js` is the one owner of which engine files this
         app carries, and its own comment says it is spelled out there "so the
         service worker can precache exactly this set". Parsing it out of that
         file keeps it one owner; writing the same fourteen names into this
         config would make it two, and canon `MASTER RULE 1` is explicit that
         two lists agreeing today is a defect rather than a coincidence. If the
         parse fails the build FAILS, rather than quietly shipping a service
         worker that caches no engine. */
      name: 'dosing-wizard:service-worker',
      generateBundle(_options, bundle) {
        const workerSrc = fs.readFileSync(
          path.join(process.cwd(), 'app/src/engine/worker.js'), 'utf8');
        const listMatch = workerSrc.match(/const ENGINE_MODULES = \[([\s\S]*?)\]/);
        if (!listMatch) {
          this.error('could not read ENGINE_MODULES out of app/src/engine/worker.js — '
            + 'the service worker would ship without the engine');
        }
        const modules = [...listMatch[1].matchAll(/"([^"]+\.py)"/g)].map((m) => m[1]);
        if (!modules.length) this.error('ENGINE_MODULES parsed as empty');

        const catalogue = workerSrc.match(/const CATALOGUE_PATH = "([^"]+)"/);
        if (!catalogue) this.error('could not read CATALOGUE_PATH out of worker.js');

        const assets = Object.keys(bundle).map((f) => '/' + f);
        const precache = [
          '/app/index.html',
          '/app/manifest.webmanifest',
          ...assets,
          ...modules.map((m) => `/engine/alk_v2/${m}`),
          '/' + catalogue[1],
        ];

        const sw = fs.readFileSync(path.join(process.cwd(), 'app/sw.js'), 'utf8')
          .replaceAll('__PRECACHE__', JSON.stringify(precache, null, 2))
          .replaceAll('__VERSION__', String(Date.now()));
        if (sw.includes('__PRECACHE__') || sw.includes('__VERSION__')) {
          this.error('the service worker still carries an unfilled placeholder');
        }

        this.emitFile({ type: 'asset', fileName: 'app/sw.js', source: sw });
      },
    },
  ],
  /* The Python runtime is an artefact this repository deliberately does not
     commit: `tools/app/vendor-runtime.py` fetches it and verifies its SHA-256,
     "so the two can never drift apart". A bundler asked to resolve it at build
     time therefore finds nothing and stops.

     Declaring it external is the whole fix. The import is left exactly as the
     worker wrote it and the browser resolves it at run time, from
     `app/vendor/pyodide/`, which is where `vendor-runtime.py` puts it. The
     engine boundary is untouched. */
  worker: {
    format: 'es',
    rollupOptions: {
      external: [/vendor\/pyodide\/pyodide\.mjs$/],
    },
  },
  build: {
    outDir: 'app/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'app/index.html',
    },
  },
  server: {
    fs: {
      /* The engine and the canon are read from outside `app/`. They are read
         and never written. */
      allow: ['.'],
    },
  },
})
