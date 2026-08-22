/* ============================================================================
   DOES THE BUILT APP ASK FOR ITS ENGINE WHERE A DEPLOYMENT PUTS IT?
   ----------------------------------------------------------------------------
   `AI-018`. The worker reached the Python runtime by a RELATIVE path while
   deriving its `indexURL` from `BASE`. Two spellings of one location, agreeing
   only where the worker file happens to sit three directories deep — which it
   does in the dev server and does not in a build, where the chunk is emitted
   to `/assets/`. The import then resolved one directory too high, 404'd, and
   the engine could not start in production at all. Nothing saw it: not the dev
   server, not the suite, not a reader.

   `PORT-19` pins the source property — one owner for the location — and runs
   in every gate. This is the end-to-end half, and it answers the question that
   actually matters: put a real browser in front of a real build, and watch
   which URL the worker asks for.

   THE 12 MB RUNTIME IS DELIBERATELY NOT COMMITTED (`tools/app/vendor-runtime.py`
   fetches and hash-verifies it), so this serves a STUB at the path a
   deployment serves. The stub exports `loadPyodide` and throws when called,
   because what is being tested is the PATH and not the runtime. Reaching the
   stub proves the app asks for the right URL; it does not prove CPython boots,
   and this tool does not claim it does.

   Running it:

       npm run build
       node tools/app/check-runtime-path.mjs

   Needs Playwright and a Chromium, which this repository does not depend on —
   it is a verification tool, not part of the application:

       npm install playwright
       PLAYWRIGHT_CHROMIUM=/path/to/chrome node tools/app/check-runtime-path.mjs

   Exit 0 is a pass. Any other URL the worker asks for is logged by name.
   ========================================================================= */

import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
const LOG = process.env.RUNTIME_PATH_LOG || 'runtime-path.log';
fs.writeFileSync(LOG,''); const say=(...a)=>fs.appendFileSync(LOG,a.join(' ')+'\n');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const DIST = path.join(ROOT, 'app/dist');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.py':'text/x-python','.md':'text/markdown'};
/* The stub. Exports `loadPyodide`, throws when called — we are testing the
   PATH, not the runtime. */
const STUB = 'export async function loadPyodide(){ throw new Error("STUB RUNTIME REACHED"); }';
const server=http.createServer((req,res)=>{
  const url=decodeURIComponent((req.url||'/').split('?')[0]);
  if (url === '/app/vendor/pyodide/pyodide.mjs') {
    say('SERVED STUB at', url);
    res.setHeader('Content-Type','text/javascript'); res.end(STUB); return;
  }
  if (url.includes('pyodide')) { say('*** WORKER ASKED FOR', url, '-> 404'); res.writeHead(404); res.end(); return; }
  const rel=url==='/'?'/app/index.html':url;
  let f=path.join(DIST,rel);
  if(!fs.existsSync(f)||!fs.statSync(f).isFile())f=path.join(ROOT,rel);
  if(!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',TYPES[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(8095,r));
const b=await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined, args:['--no-sandbox']});
const page=await (await b.newContext()).newPage();
await page.goto('http://localhost:8095/app/index.html',{waitUntil:'load'});
await new Promise(r=>setTimeout(r,7000));
await b.close(); server.close();
const log = fs.readFileSync(LOG, 'utf8');
const pass = log.includes('SERVED STUB');
say(pass ? 'RESULT: the worker reached the runtime path a deployment serves'
         : 'RESULT: it did NOT — see the 404 above');
console.log(log);
process.exit(pass ? 0 : 1);
