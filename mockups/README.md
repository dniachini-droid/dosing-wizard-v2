# Build-one screen mockups

Static, hand-written mockups of the six build-one screens (Today in five variants) plus a
settings area, so the interface can be judged before implementation begins and so the
implementation has a target.

**These are presentation artefacts.** No engine, no persistence, no framework, no script of
any kind. Every number is hand-written sample data. Nothing here is authority for anything,
and nothing here decides any open question.

## Opening them

Open `index.html` in a browser, or serve this folder and open it on a phone:

```
python3 -m http.server 8000 --directory mockups
```

The screens are laid out mobile-first and cap their width on a larger window.

## Files

| File | What it is |
|---|---|
| `index.html` | Links to every screen, with the sample-tank data and the design notes |
| `tokens.css` | **Every** colour, radius, shadow, type size, weight, letter-spacing and spacing step |
| `app.css` | Shared components. Structure only — every appearance value is a `var()` from `tokens.css` |
| `01-setup.html` | First-run setup: four steps and what each refuses if skipped |
| `02-today-a-dose-change.html` | Today — an ordinary dose-change recommendation |
| `02-today-b-hold.html` | Today — hold, as a full recommendation |
| `02-today-c-insufficient.html` | Today — not enough evidence |
| `02-today-d-refusal.html` | Today — a capability refusal (missing pump step) |
| `02-today-e-safety.html` | Today — a safety return, in its own register |
| `03-assessment-detail.html` | The working: readings, trend, support, consumption, the dose chain, retest candidates, all reason codes, version stamps |
| `04-log-entry.html` | All nine event families, time precision on every form |
| `05-entry-detail.html` | View, correct, supersede, mark suspect, mark invalid |
| `06-history.html` | One chart per parameter, events marked, exclusions marked |
| `07-settings.html` | Versioned settings with change history; read-only solution and potency panel |
| `CONTRACT-GAPS.md` | Eleven things the screens could not express, left open |

## Sample data

A 77-litre mixed reef. Target range 8.6 – 9.2 dKH, outer bounds 7.0 – 11.0. Dosing
9.0 mL/day of a 100 g/L sodium carbonate solution through a pump that steps in
0.1 mL/day, giving 0.0686 dKH per mL. Alkalinity around 8.7 dKH and drifting down.

Every reason code is a real code from `docs/implementation/alk-v2/ALK-V2-REASON-CODES.md`
with the payload fields that catalogue requires. Every payload number follows arithmetically
from the sample readings, so the working shown on screen 3 can be checked by hand.

## Two notes on how this was built

**Two stylesheets, not one.** The task asked for one token file plus one file per screen. A
second shared file, `app.css`, holds the component classes. It contains no literal colour,
radius, shadow or type size — every value is a token — so `tokens.css` remains the single
place appearance is changed. The alternative was duplicating roughly six hundred lines of
identical component CSS across eleven files, which would have defeated that goal on the
first edit.

**The information-architecture review is not in this repository.** The task refers to an
IA review that identified these six screens and four missing areas. It is not present on
`main`, nor on `claude/dosing-wizard-conformance-harness-4f5yvi`,
`claude/dosing-wizard-review-agents-hpnc50` or `claude/freeze-5-alk-canon-k7yo2r`. These
screens were therefore built from the task description together with a first-hand read of
the data contract, the reason-code catalogue, the module design's presentation contract,
the implementation contract and canon Part IX. Where the review would have settled a
question, the question is in `CONTRACT-GAPS.md` instead.
