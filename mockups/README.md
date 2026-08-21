# Screen mockups

Static, hand-written mockups of the Dosing Wizard V2 interface — thirty-one screens plus
an index — so the interface can be judged before implementation begins and so the
implementation has a target.

**These are presentation artefacts.** No engine, no persistence, no framework. Every
number is hand-written sample data. Nothing here is authority for anything, and nothing
here decides any open question.

## What this set is, and what it extends

PR #6 (`claude/build-one-mockups-65ojkb`) built eleven screens and the visual language
they are drawn in. **That language carries across unchanged**, and so does its substance:
refusals rendered as real designed states rather than as blanks, a severity-ordered notice
list with its payload figures visible, and status kept as separate orthogonal dimensions
rather than fused into one badge.

What is added are the **surfaces** the V1 application had and PR #6 did not. They are
listed in `docs/migration/V1-APPLICATION-SALVAGE.md` §12, which did not exist when PR #6
was built. V1's *interaction designs* cross over; **V1's visual styling does not** and is
carried nowhere.

## Opening them

Open `index.html` in a browser, or serve this folder and open it on a phone:

```
python3 -m http.server 8000 --directory mockups
```

For a phone with no server, build the single self-contained file:

```
python3 mockups/build-single-file.py
```

That writes `mockups/dosing-wizard-v2-mockups.html` — every screen, both stylesheets and
the moment driver inlined, with a picker to move between them. **It is not committed.**
The build script is, so the artefact can always be rebuilt and can never drift from the
screens it was made from. It is in `.gitignore` for that reason.

## Checking them

```
python3 mockups/check-plain-english.py
```

Owner decision 9 says no reason-code identifier and no canon variable name may appear in
any visible string, and that they may appear only in a clearly separated developer view.
That is a rule which can be pinned by a failing test, so it is, rather than being left to
prose review. The check exits non-zero and names every leak.

## Files

| File | What it is |
|---|---|
| `index.html` | Every screen, the sample tank, and how the set is built |
| `tokens.css` | **Every** colour, radius, shadow, size — and every timing value, including all four ported moments |
| `app.css` | Shared components. Structure only — every appearance value is a `var()` from `tokens.css` |
| `moments.js` | The four moments. The only script; reads its timing from `tokens.css` |
| `check-plain-english.py` | Fails if contract vocabulary is visible outside a developer view |
| `build-single-file.py` | Folds the set into one self-contained file for a phone |
| `CONTRACT-GAPS.md` | Twenty-three things the screens could not express. None resolved |

### Today — one ranked list, and a day stepper over it

| File | What it is |
|---|---|
| `02-today-a-dose-change.html` | An ordinary dose-change recommendation |
| `02-today-b-hold.html` | Hold, as a full recommendation |
| `02-today-c-insufficient.html` | Not enough evidence |
| `02-today-d-refusal.html` | A capability refusal — no pump step |
| `02-today-e-safety.html` | A safety return, in its own register |
| `02-today-f-settled.html` | **New.** Nothing due, nothing wrong |
| `02-today-g-day-ahead.html` | **New.** The stepper forward — what is *due* |
| `02-today-h-day-past.html` | **New.** The stepper back — what was *done* |
| `03-assessment-detail.html` | The working, in full |

### Test Lab

| File | What it is |
|---|---|
| `08-test-lab.html` | **New.** Every parameter as a row, one date for the sitting, type-and-log |
| `04-log-entry.html` | All nine event families, time precision on every form |
| `19-icp-entry.html` | **New.** ICP panel entry |
| `05-entry-detail.html` | One reading: correct, supersede, mark suspect, mark invalid |
| `09-edit-sheet.html` | **New.** The shared edit sheet, reachable from anywhere |

### Tasks

| File | What it is |
|---|---|
| `10-tasks.html` | **New.** The month calendar, the test schedule and husbandry |
| `11-calendar-day.html` | **New.** One day: done, still due, changes recorded, rhythms behind it |
| `12-reschedule-sheet.html` | **New.** The shared reschedule sheet |
| `13-custom-task.html` | **New.** Custom tasks, husbandry logging, unscheduled one-offs |
| `14-suggested-test.html` | **New.** The engine's suggested test — accept or decline |

### History

| File | What it is |
|---|---|
| `06-history.html` | Thickened: the whole record with one boundary marker, a named window, zoom |
| `15-history-all-graphs.html` | **New.** Six parameters, one window, one scroll |

### The moments

| File | What it is |
|---|---|
| `16-moment-reading-arrival.html` | **New.** The reading drawn onto its own recent history |
| `17-moment-dose-expectation.html` | **New.** The prediction stated before the next reading arrives |
| `18-moment-task-completion.html` | **New.** The run of completions and the real intervals |
| `20-icp-arrival.html` | **New.** The panel counted in |

### Setup, settings and the platform

| File | What it is |
|---|---|
| `01-setup.html` | First-run setup: four steps and what each refuses if skipped |
| `07-settings.html` | Thickened: solution-strength provenance, hidden notices, data and platform |
| `21-durability.html` | **New.** Three backup tiers with their real limits; wipe detection |
| `22-offline-install.html` | **New.** Offline, install and update state |
| `23-error-boundary.html` | **New.** A crashed tab that names itself and leaves navigation working |
| `24-developer-view.html` | **New.** The one place a reason code may appear on screen |

## Sample data

A 77-litre mixed reef on Thursday 20 August 2026. Target range 8.6 – 9.2 dKH, outer
bounds 7.0 – 11.0. Dosing 9.0 mL/day of a 100 g/L sodium carbonate solution through a
pump that steps in 0.1 mL/day, giving 0.0686 dKH per mL. Alkalinity around 8.7 dKH and
drifting gently down.

Every payload number follows arithmetically from the sample readings, so the working shown
on the assessment-detail screen can be checked by hand.

**The test and chore intervals shown on the Tasks screens are sample data and are adopted
from nowhere.** No V1 cadence is carried across. Which cadences are the keeper's and which
are the engine's is gap 16, unresolved.

## The three interaction moments — ported, not rebuilt

Their value is the tuning, so the tuning is what was carried across. The geometry, the
progress loop, the timing constants, the easing curves and the delays are transcribed from
V1 source at commit `9276a2ca254e88d19e0f02dced42a1b896499780`:

| Moment | V1 source |
|---|---|
| The reading arrives on its own history | `src/components/ReadingContext.jsx`, `src/components/ReadingConfirmation.jsx:438-508`, `src/styles/base.css:17-63,201-214` |
| The dose expectation | `src/components/DoseExpectation.jsx:17-120` |
| Task completion | `src/components/TaskCompletion.jsx` |
| The ICP arrival *(fourth, not required but in the same family)* | `src/components/IcpConfirmation.jsx:14-71` |

**Every one of those values lives in `tokens.css`**, in a block that cites the V1 file and
line each group came from. `moments.js` reads them through `getComputedStyle` at run time,
so retuning a duration is editing one number in the token file and nothing else.

The single progress value in the reading moment is the part most worth preserving: the
chart draw, the travelling dot and the counting number are all read from one number
between 0 and 1. Three independent animations could never stay in step, which is why the
dot used to run ahead of its own line.

What is deliberately *not* ported: V1's chemistry. Each of these components computed its
own verdict inside the presentation layer. The moments here render sentences the engine
would supply.

## Notes on how this was built

**One script, in a set that otherwise has none.** PR #6 had no script at all and that was
right for it. The moments cannot be done without one — a still frame cannot carry a
tuning — so `moments.js` exists and does nothing else. No screen outside the four moment
screens loads it.

**Two stylesheets, not one.** As in PR #6. `app.css` holds the component classes and
contains no literal colour, radius, shadow or type size, so `tokens.css` remains the
single place appearance is changed.

**One exception to the literal-value rule, stated rather than hidden.** The `@keyframes`
blocks for the ported moments contain literal transform values — a 10-pixel bounce, a 0.94
scale, a rotation. Those are the *shape* of a curve that was tuned by hand in V1, not
appearance settings, and tokenising them would invite exactly the retuning this work
exists to avoid. Every duration, delay and easing curve *is* a token.

**One correction to PR #6's CSS.** `.attention-item:first-child` was written to suppress
the separator above the first item in the ranked list, but each item is the only child of
its `<li>`, so the rule matched every one and no separator ever drew. It is now
`.attention-list > li:first-child > .attention-item`. This changes how those screens look —
separators now appear as the rule intended — and it is called out here because the owner
approved the earlier rendering.

**The Log tab is dissolved, not deleted.** Readings go to Test Lab, maintenance goes to
Tasks. `04-log-entry.html` still exists and is reached from both.

**The reason-code catalogue is not lost.** Every code and payload PR #6 rendered is still
present, verbatim, in the developer view at the foot of the screen it belonged to. What
changed is that it is no longer the visible text.
