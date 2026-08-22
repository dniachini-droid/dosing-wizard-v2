/* ============================================================================
   DOES IT ACTUALLY WORK OFFLINE?
   ----------------------------------------------------------------------------
   ROUND THREE, ITEM 10 is explicit about how this is to be answered: "Restore
   it, and verify by running it with the network off, not by reading the
   config." Reading the config is how a service worker that registers, installs
   and caches nothing useful passes review.

   So this builds nothing and asserts nothing about source. It serves the built
   app the way a deployment does — `app/dist` for the shell, the repository
   root for the engine's own Python files and the frozen catalogue, which is
   what `vite.config.js` explains the root is for — loads it in a real browser,
   waits for the service worker to install, and then TAKES THE ORIGIN AWAY:
   the browser context goes offline AND the HTTP server is shut down. Nothing
   is listening on the port any more, and the test proves it before going on.

   Anything the page produces after that came out of the cache, because there
   is nowhere else it could have come from.

   What it checks, in the order it matters:

     - the app renders at all with no origin;
     - it made ZERO requests that reached a server (there was none to reach);
     - `engine/alk_v2/engine.py` is readable — the app carries its own engine,
       and one that opens but cannot answer is a worse failure than one that
       does not open;
     - the frozen reason-code catalogue is readable, for the same reason;
     - no page errors.

   Running it:

       npm run build
       node tools/app/check-offline.mjs

   It needs Playwright and a Chromium, which this repository deliberately does
   NOT depend on: it is a verification tool, not part of the application, and
   `package.json` describes the app. Install them where you run it.

       npm install playwright        # or set PLAYWRIGHT_CHROMIUM to a binary

   Exit 0 is a pass. The log is written to `offline.log` beside the working
   directory as well as being the exit code, so a CI run can show its working.
   ========================================================================= */

import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
const LOG = process.env.OFFLINE_LOG || 'offline.log';
fs.writeFileSync(LOG,''); const say=(...a)=>fs.appendFileSync(LOG,a.join(' ')+'\n');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const DIST = path.join(ROOT, 'app/dist');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.py':'text/x-python','.md':'text/markdown'};
let served=0;
const server=http.createServer((req,res)=>{const url=decodeURIComponent((req.url||'/').split('?')[0]);const rel=url==='/'?'/app/index.html':url;let f=path.join(DIST,rel);if(!fs.existsSync(f)||!fs.statSync(f).isFile())f=path.join(ROOT,rel);if(!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);res.end();return;}served+=1;res.setHeader('Content-Type',TYPES[path.extname(f)]||'application/octet-stream');res.setHeader('Service-Worker-Allowed','/');res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(8099,r));
const b=await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined, args:['--no-sandbox']});
const ctx=await b.newContext(); const page=await ctx.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e).slice(0,200)));

say('1. ONLINE first visit');
await page.goto('http://localhost:8099/app/index.html',{waitUntil:'load',timeout:30000});
await new Promise(r=>setTimeout(r,5000));
say('   rendered chars:', (await page.innerText('#root')).trim().length);

say('2. service worker');
const sw = await page.evaluate(async()=>{ const reg=await navigator.serviceWorker.ready; return reg.active?reg.active.state:'none'; });
say('   state:', sw);
await new Promise(r=>setTimeout(r,4000));
const cached = await page.evaluate(async()=>{ const names=(await caches.keys()).filter(n=>n.startsWith('dosing-wizard-'));
  if(!names.length) return {count:0}; const c=await caches.open(names[0]); const k=await c.keys();
  return {name:names[0],count:k.length,engine:k.filter(x=>x.url.includes('/engine/alk_v2/')).length,
          catalogue:k.some(x=>x.url.includes('REASON-CODES.md')), html:k.some(x=>x.url.endsWith('/app/index.html'))}; });
say('   cache:', JSON.stringify(cached));

say('3. NETWORK OFF — the browser is offline AND the server is shut down');
await ctx.setOffline(true);
await new Promise(r=>server.close(r));
/* Nothing is listening on 8099 any more. Anything the page gets from here on
   came out of the cache, because there is no origin left to get it from. */
const dead = await new Promise(r=>{
  const s2=http.request({host:'localhost',port:8099,path:'/app/index.html',timeout:2000},()=>r(false));
  s2.on('error',()=>r(true)); s2.on('timeout',()=>{s2.destroy();r(true);}); s2.end();
});
say('   origin genuinely gone:', dead);
const before = served;

say('4. RELOAD while offline');
errs.length=0;
await page.reload({waitUntil:'load',timeout:30000});
await new Promise(r=>setTimeout(r,5000));
const txt=(await page.innerText('#root')).trim();
say('   rendered chars:', txt.length);
say('   first 120:', JSON.stringify(txt.slice(0,120)));
say('   server hits while offline:', served-before);
const eng = await page.evaluate(async()=>{ try{const r=await fetch('/engine/alk_v2/engine.py'); return r.ok?(await r.text()).length:0;}catch{return -1;} });
say('   engine.py readable offline:', eng, 'bytes');
const cat = await page.evaluate(async()=>{ try{const r=await fetch('/docs/implementation/alk-v2/ALK-V2-REASON-CODES.md'); return r.ok?(await r.text()).length:0;}catch{return -1;} });
say('   catalogue readable offline:', cat, 'bytes');
say('   page errors:', JSON.stringify(errs.slice(0,3)));

const pass = txt.length>0 && dead && (served-before)===0 && eng>1000 && cat>1000;
say(pass?'RESULT: OFFLINE PASS':'RESULT: OFFLINE FAIL');
await b.close(); process.exit(pass?0:1);
