# The application

An installable web app that runs the Alk V2 engine on the owner's phone,
offline, with their readings stored on the device.

---

## Installing it on a phone

Four steps. The third is the one people miss.

**1. Fetch the Python runtime.** Once, on the machine that will serve it.

```
python3 tools/app/vendor-runtime.py
```

About 12 MB, pinned by version and verified by SHA-256. It is not committed —
the script is, so the two can never drift apart. See the header of that file
for why the app carries a Python runtime at all.

**2. Serve the repository.**

```
python3 tools/app/serve.py
```

It prints two addresses: one for this machine and one for the phone. The app is
served from the repository root rather than from `app/`, because it reads the
engine and two canon documents that live outside it and must not be copied.

**3. Reach it over a secure origin.** A phone will not install a web app — will
not even register the offline copy — over plain `http://` from an IP address.
Two ways round it, both ordinary:

- **A tunnel.** Any of the usual ones will do; they give an `https://` address
  that forwards to `serve.py`. Open that on the phone.
- **A static host.** Run step 1, then upload the repository (or just `app/`,
  `engine/` and `docs/implementation/alk-v2/`) to any static host that serves
  HTTPS. There is no build step and no server-side anything: what is served is
  what is in the repository.

`localhost` also counts as secure, so a desktop browser at
`http://localhost:8000/app/` installs and works without either.

**4. Add it to the home screen.** iOS: Share, then *Add to Home Screen*.
Android: the browser menu, then *Install app* or *Add to Home screen*.

It will open from the home screen with no address bar, and it will open with no
network. The first open after installing spends a few seconds starting the
chemistry engine; after that the runtime is cached and only an update re-fetches
it.

---

## What happens on the very first run

Nothing is assumed. The app opens on setup and asks for four things only the
keeper knows: net water volume, the target range, the solution's strength per
millilitre, and the smallest step the pump makes. It refuses to continue
without them and says so — it will not guess any of them, and it does not offer
a default it cannot source.

Everything else it needs — how much scatter an alkalinity test has, how big a
step is reasonable, how fast a tank may safely move — comes from the frozen
canon and is not a setting.

Then Today opens, with nothing due and no assessment, and says so.

---

## Running it in development

```
npm install                             # once
python3 tools/app/vendor-runtime.py     # once — the 12 MB Python runtime
npm run dev                             # then open /app/index.html

node tests/app/run-app-tests.mjs             # the application tests
node tests/app/run-app-tests.mjs --mutations # and their negative controls
node tools/port/check-port-manifest.mjs      # every ported line accounted for
node tools/port/mutate-manifest.mjs          # and that check can fail
python3 tools/app/check-strings.py           # no prose outside strings.js (*.js only)
```

The interface is React, because it is V1's and V1's is React — see `DEC-024`.
Vite's root is the REPOSITORY, not `app/`: `src/engine/worker.js` resolves the
engine's own files three directories above itself, and serving the repository
root is what keeps that true. Editing the worker to suit the build would have
been changing the engine boundary to make the interface convenient.

The engine's own gate is separate and unchanged:

```
python3 tools/conformance/run-conformance.py --engine 'python3 engine/alk-v2-engine.py'
python3 tools/conformance/run-mutations.py
```

`tools/app/smoke.mjs` and `tools/app/check-moment-timings.py` are retired and
say what replaced them: the dev server does the first, and the port manifest —
which accounts for every line of the moment components rather than a handful of
named constants — does the second.

---

## How it is put together

```
index.html          the shell. Vite's entry; V1's, with V2's identity
manifest.webmanifest
assets/             icons
src/
  main.jsx          V1's, verbatim
  App.jsx           V1's shell: the tabs, the moments, the toast, rewired
  icons.jsx         V1's icon set, verbatim
  index.css         V1's, verbatim
  styles/           V1's base and skin, verbatim
  components/       V1's screens, ported. See docs/migration/PORT-MANIFEST.md
  lib/              V1's libraries, ported, plus the two adapters:
                      adapt.js   V2's record in the shape V1's screens read
                      record.js  every write into V2's ledger, in one place
  strings.js        EVERY user-facing string about chemistry
  assess.js         alk.assess — loads, calls the engine, persists. No chemistry
  engine/           the engine boundary: a worker, and a promise around it
  store/            the append-only ledger, assessments, tasks, configuration
  present/          which card, which order, which string. Decides no chemistry
vendor/pyodide/     the Python runtime. Fetched, not committed
```

`sw.js`, `ui/`, `screens/`, `moments/` and `assets/*.css` were the V2 interface
and are gone. Losing the service worker cost the offline shell; that is recorded
in `docs/migration/PORT-OMISSIONS.md` §10 with what restoring it needs.

Four things are worth knowing before reading any of it.

**The engine is the engine.** Not a port of it. `src/engine/worker.js` loads
`engine/alk_v2/*.py` — the same files the conformance harness runs, unmodified
— into CPython compiled to WebAssembly. Canon `MASTER RULE 1` says one owner
for each inference, and "two implementations that agree today are a defect, not
a coincidence." A JavaScript rewrite would have been a second owner of every
threshold in the canon.

**No UI component computes chemistry.** Every number on every screen is read
out of an engine result. This is not a claim: `tests/app/test-port.mjs`
`PORT-01`…`PORT-04` fail if any interface file names a V1 classifier, holds a
member of the engine's decision vocabulary, or compares a reading to a band
edge, and each has a mutation that turns it red.

**The card is chosen by a predicate table, not by nested branching.**
`src/present/cards.js`. The order is data, and a test proves at most one row
matches any result — which is the property V1's first-match wizard lacked.

**Assessments are stored records.** With engine, canon and configuration
version stamps and the identity of every input event, from the first commit. A
re-analysis is a new record; the old one keeps saying what it said.

---

## What is not in this build

No accounts, no cloud, no sync, no notifications, no import, no calculators. No
calcium or magnesium assessment — those parameters are logged, charted and
scheduled with the same event shape as alkalinity, and are simply not assessed.

Everything is on the device and nowhere else. An export is the only copy that
survives losing the phone; Settings says so in those words.
