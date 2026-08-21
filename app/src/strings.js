/* ============================================================================
   EVERY USER-FACING STRING IN THE APPLICATION
   ----------------------------------------------------------------------------
   This file is the only place text the keeper can read is written down. No
   screen, no component, no wording helper and no reason-code handler contains
   a sentence. They reference a key; the text lives here.

   The reason is a language pass that is coming after first use. Text scattered
   across thirty screens makes that an expensive, error-prone job. In one file
   it is an afternoon.

   HOW TO USE IT
   -------------

       t("today.title")
       t("today.subtitle.assessed", { volume: 77, time: "08:05" })

   A string that carries a value is a FUNCTION of its values, never a
   concatenation at the call site:

       ok    "assessment.dose.raise": ({ dose }) => `Increase the dose to ${dose} mL/day`,
       not   t("assessment.dose.raise") + " " + dose + " mL/day"

   That keeps the whole sentence — including word order, punctuation and where
   the number sits — editable here. A translator or an editor rewriting
   `"Increase the dose to {dose} mL/day"` as `"Take the dose up to {dose} a day"`
   changes one line and nothing else. Built by concatenation, the same edit
   would need the call site changed too, and the two would drift.

   WHAT COUNTS AS USER-FACING
   --------------------------

   Everything the keeper can read: headings, body copy, button labels, form
   labels and hints, empty states, error messages, aria-labels, and every
   sentence rendered from a reason code. A reason code's wording is a LOOKUP
   here, not a sentence sitting next to the code that emits it.

   What is not user-facing and is therefore not here: CSS class names, DOM
   attribute names, engine field names, and anything inside the developer view,
   which by owner decision 9 is the one place contract vocabulary may appear
   verbatim.

   `tools/app/check-strings.py` fails if a prose literal appears anywhere in
   `app/src/` outside this file.
   ========================================================================= */

export const STRINGS = Object.freeze({
  /* ======================================================================
     THE SHELL
     ================================================================== */

  "app.name": "Dosing Wizard",
  "app.starting": "Opening your tank…",
  "app.slow.title": "This is taking longer than it should.",
  "app.slow.body":
    "The app has not finished starting. Your data is not lost — it is stored on this device. " +
    "Try closing and reopening; if that does not work, this browser may be too old to run it.",
  "app.noscript":
    "This app needs JavaScript. It runs entirely on your phone — there is no server to fall back to.",

  "tab.today": "Today",
  "tab.testlab": "Test Lab",
  "tab.tasks": "Tasks",
  "tab.history": "History",
  "tab.tools": "Tools",
  "tab.later": "Later",
  "tab.aria": "Sections",

  "action.done": "Done",
  "action.close": "Close",
  "action.cancel": "Cancel",
  "action.save": "Save",
  "action.back": "Back",
  "action.log": "Log",
  "action.settings": "Settings",

  "crash.title": "This screen stopped",
  "crash.body":
    "Something went wrong drawing this screen. Nothing has been lost — your readings are stored " +
    "and the other tabs still work.",
  "crash.toToday": "Go to Today",
  "crash.toSettings": "Settings and export",
  "crash.dev": "Developer view",

  /* ======================================================================
     TODAY
     ================================================================== */

  "today.title": "Today",
  "today.subtitle.none": "No tank details recorded yet",
  "today.subtitle.volume": ({ volume }) => `${volume} L net volume`,
  "today.subtitle.assessedOn": ({ when, time }) => `assessed ${when} at ${time}`,
  "today.subtitle.assessed": ({ time }) => `assessed ${time}`,
  "today.subtitle.join": ({ parts }) => parts.join(" · "),

  "today.stepper.aria": "Move through the days",
  "today.stepper.back": "The day before",
  "today.stepper.forward": "The day after",
  "today.stepper.today": "Today",

  "today.attention.title": "Needs you",
  "today.attention.count": ({ n }) => `${n} item${n === 1 ? "" : "s"}`,
  "today.attention.none": "nothing",
  "today.attention.empty":
    "Nothing is due and nothing is wrong. There is nothing for you to do here today.",
  "today.attention.emptyNote":
    "This list only appears with something in it, so its presence means something needs attention.",
  "today.attention.note":
    "One list — tests, chores and the assessment together rather than a section each. Anything due " +
    "opens where it sits. The severity of anything the engine said is the engine's; the order between " +
    "different kinds of item is a product ordering the app declares, because the engine result has no " +
    "field that ranks them.",

  "today.item.safety.title": "Alkalinity is outside its safe outer limits",
  "today.item.safety.detail": "This outranks everything else. Open the assessment.",
  "today.item.dose.title": ({ dose }) => `Set the alkalinity maintenance dose to ${dose} mL/day`,
  "today.item.dose.detail": ({ direction, delta, from }) =>
    `${direction} ${delta} mL/day from ${from}. Recommended, not yet made.`,
  "today.item.dose.detailPlain": "Recommended, not yet made.",
  "today.item.dose.up": "Up",
  "today.item.dose.down": "Down",
  "today.item.hold.title": "Hold the alkalinity dose where it is",
  "today.item.hold.titleAt": ({ dose }) => `Hold the alkalinity dose at ${dose} mL/day`,
  "today.item.hold.detail": "A hold is the recommendation, not the absence of one.",
  "today.item.insufficient.title": "Not enough yet to size an alkalinity dose",
  "today.item.insufficient.detail": "The assessment says what is missing.",
  "today.item.nextUseful": ({ date }) => `The next useful test is ${date}.`,
  "today.item.refusal.title": "The app needs something before it can advise on alkalinity",
  "today.item.refusal.detail": ({ list }) => `It has not been told: ${list}.`,
  "today.item.refusal.detailPlain": "Open the assessment for what it needs.",
  "today.item.generic.title": "Alkalinity assessment",
  "today.item.generic.detail": "Open it for what the engine said.",

  "today.task.overdue": ({ days, last }) =>
    `${days} day${days === 1 ? "" : "s"} overdue. ${last}`,
  "today.task.dueToday": ({ last }) => `Due today. ${last}`,
  "today.task.lastDone": ({ date }) => `Last done ${date}.`,
  "today.task.never": "Never done.",
  "today.task.replacementHint":
    "Measuring your new saltwater once keeps the analysis running across the " +
    "change. Without it the app has to treat this as a fresh start.",
  "today.task.readingNote":
    "Recording the reading is what completes the test — there is no separate tick to remember.",
  "today.task.choreNote":
    "The next one is scheduled from when you did it, not from when it was due — so being late never stacks up.",

  "today.confirm.title": "Tell the app whether you made the change",
  "today.confirm.detail":
    "Until you do, the change is recorded as unknown — not as made and not as skipped.",
  "today.confirm.yesKnown": "Yes, and I know when",
  "today.confirm.yesKnownWhy": "Records an exact time. Starts watching for a response.",
  "today.confirm.yesUnsure": "Yes, but I'm not sure exactly when",
  "today.confirm.yesUnsureWhy":
    "Records an earliest and a latest. The window between is treated as confounded.",
  "today.confirm.no": "No, not yet",
  "today.confirm.noWhy": "Recorded as confirmed not implemented. Advice continues as normal.",
  "today.confirm.later": "Ask me later",
  "today.confirm.laterWhy": "Leaves it unknown. Unknown is not the same as no.",
  "today.confirm.note":
    "A recommendation and an implementation are two separate records with two separate times. " +
    "Neither is ever inferred from the other.",

  "today.suggestion.title": ({ date }) => `The app suggests testing alkalinity on ${date}`,
  "today.suggestion.note":
    "This is the app's suggestion, not one of your scheduled tests. You accept it or decline it; " +
    "it is not something to move, because moving it would change what it was for.",
  "today.suggestion.accept": "Accept — and show me what it changes",
  "today.suggestion.decline": "Decline",

  "today.ahead.title": "What is due",
  "today.ahead.empty": "Nothing is scheduled for this day.",
  "today.ahead.scheduled": "Scheduled",
  "today.ahead.note":
    "No assessment is shown for a day that has not happened. The engine has not been asked about it, " +
    "and showing today's answer under a future date would say it was worked out then.",

  "today.past.title": "What was done",
  "today.past.empty": "Nothing was recorded on this day.",
  "today.past.assessTitle": "What the app said that day",
  "today.past.assessEmpty": "No assessment was saved on this day.",
  "today.past.assessEmptyNote":
    "Assessments are saved records. This screen shows what was saved, not what the engine would say now.",
  "today.past.savedAt": "Saved at",
  "today.past.itSaid": "It said",
  "today.past.saidDose": ({ dose }) => `Set the dose to ${dose} mL/day`,
  "today.past.saidHold": "Hold the dose",
  "today.past.saidNothing": "It could not advise",
  "today.past.engine": "Engine",
  "today.past.canon": "Canon",
  "today.past.settings": "Settings",
  "today.past.note":
    "This is the record as it was written. Correcting a reading afterwards does not change it — " +
    "a re-analysis is a new assessment with a new identity, and both stay.",

  "today.storage.title": "Your records could not be read",
  "today.storage.body":
    "This device\u2019s storage did not answer, so the app cannot see your " +
    "history right now. Nothing has been lost \u2014 it could not be read, " +
    "which is not the same as being empty.",
  "today.storage.safe":
    "No assessment has been made or saved. An answer worked out from records " +
    "the app could not read would be worse than no answer.",
  "today.storage.what": ({ reason }) => `What the device said: ${reason}`,
  "today.engine.startingTitle": "Alkalinity",
  "today.engine.starting":
    "Working it out. The chemistry engine is starting up — this takes a few seconds the first time after an update.",
  "today.engine.notRun": "The assessment has not been run yet.",
  "today.engine.startingNote":
    "Everything else on this screen works without it: you can log readings, complete tasks and read your history now.",
  "today.engine.failed":
    "The chemistry engine could not start, so there is no assessment on this screen.",
  "today.engine.failedSafe":
    "Your readings are safe and nothing has been lost. Logging, tasks and history all still work.",
  "today.engine.failedWhat": ({ error }) => `What went wrong: ${error}`,
  "today.engine.failedNote":
    "The app shows nothing rather than guessing. An assessment that is not the engine's is not an assessment.",

  "today.setup.title": "Tell the app about your tank",
  "today.setup.body":
    "Nothing can be assessed until the app knows your net water volume, your target range, how strong " +
    "your solution is and what step your pump makes. These are facts only you have; the app will not " +
    "guess any of them.",
  "today.setup.action": "Set the tank up",

  "today.inert.label": "Logged only",
  "today.inert.never": "never tested",
  "today.inert.note":
    "These are logged, charted and scheduled exactly like alkalinity, and they are not assessed. " +
    "There is no engine for them yet, so there is no status, no position against a range and no advice — " +
    "and the app will not imply one it does not have.",

  "today.record.dateOnly.title": "One reading has a date but no time",
  "today.record.dateOnly.detail": ({ date, value, unit }) =>
    `${date}, ${value} ${unit}. Kept in your history; it cannot be used for the trend.`,
  "today.record.suspect.title": "You marked an entry suspect",
  "today.record.suspect.detail": ({ date }) =>
    `${date}. It is still in the record and still counted — this build has no rule for what a suspect mark should do.`,

  "today.state.superseded": "replaced by a later entry",
  "today.state.suspect": "you marked this suspect",
  "today.state.invalid": "you marked this invalid",

  /* ======================================================================
     THE ASSESSMENT CARD
     ================================================================== */

  "assessment.parameter": "Alkalinity",
  "assessment.mark": "Alk",
  "assessment.latestCaption": "Latest valid measurement. Position is read from this value alone.",
  "assessment.dimsLabel": "Where this stands",
  "assessment.dimsNote":
    "These six are separate on purpose. A change can be going exactly as predicted and have overshot " +
    "at the same time — one badge would drop whichever mattered.",

  "assessment.dim.position": "Where it sits",
  "assessment.dim.positionWhy": ({ value }) => `${value} dKH. From the latest measurement only.`,
  "assessment.dim.trajectory": "Which way it is going",
  "assessment.dim.trajectoryWhy": "Read from the readings in the stretch of history above.",
  "assessment.dim.evidence": "How much is known",
  "assessment.dim.evidenceWhy": ({ tests, days }) => `${tests} separate tests over ${days} days.`,
  "assessment.dim.evidenceWhyNone": "The record does not yet support a trend.",
  "assessment.dim.running": "What is running",
  "assessment.dim.runningNone": "None open",
  "assessment.dim.runningOpen": "A dose change is being watched",
  "assessment.dim.runningWhyNone": "No dose change is currently being watched.",
  "assessment.dim.response": "Whether it responded",
  "assessment.dim.responseWhyNone":
    "No dose change is being watched, so there is nothing to attribute a response to.",
  "assessment.dim.overshoot": "Whether it overshot",
  "assessment.dim.overshootYes": "Overshot",
  "assessment.dim.overshootNo": "None",
  "assessment.dim.overshootWhyYes": "A target boundary was crossed in the unwanted direction.",
  "assessment.dim.overshootWhyNo": "No target boundary has been crossed in the unwanted direction.",
  "assessment.dim.outer": "Safe outer limits",
  "assessment.dim.outerWhy": "This outranks everything else on this card.",

  "assessment.slope.observed": "What your tests show",
  "assessment.slope.observedSub": "dKH/day, straight from the readings",
  "assessment.slope.supported": "What's certain enough to act on",
  "assessment.slope.supportedSub": "dKH/day, after the uncertainty is taken off",
  "assessment.slope.note":
    "The second number is the first with measurement uncertainty subtracted. Only the second one sizes a dose change.",
  "assessment.slope.noteAbsent":
    "Both are shown whenever both exist, so a smaller acted-on figure is never mistaken for the measurement.",

  "assessment.reco.none": "No recommendation",
  "assessment.reco.unclassified.head": "This build has no card for what the engine returned",
  "assessment.reco.unclassified.body":
    "The engine answered and the app does not recognise the shape of the answer. Nothing is hidden: " +
    "the full result is in the developer view at the foot of this screen. Do not act on this card.",
  "assessment.reco.safety.body":
    "This is a different situation from being outside your target range, and it is treated differently. " +
    "The safety figures below are stated separately from the ordinary maintenance conclusion.",
  "assessment.reco.safety.rate": "Temporary safety rate",
  "assessment.reco.safety.destination": "Buffered safety destination",
  "assessment.reco.dose": ({ direction, dose }) => `${direction} the dose to ${dose} mL/day`,
  "assessment.reco.dose.increase": "Increase",
  "assessment.reco.dose.reduce": "Reduce",
  "assessment.reco.dose.keep": "Keep",
  "assessment.reco.dose.set": "Set",
  "assessment.reco.from": ({ dose }) => `From ${dose} mL/day. `,
  "assessment.reco.adds": ({ effect }) => `That adds ${effect} dKH/day. `,
  "assessment.reco.thenDrift": ({ slope }) =>
    `Alkalinity should then drift at about ${slope} dKH/day.`,
  "assessment.reco.hold.head": "Leave the dose where it is",
  "assessment.reco.hold.staying": ({ dose }) => `Staying at ${dose} mL/day. `,
  "assessment.reco.hold.body": "Holding is the recommendation here, not the absence of one.",
  "assessment.reco.constraints": ({ list }) => `Adjusted for: ${list}.`,
  "assessment.reco.note":
    "This is what is recommended. The app cannot see your pump and does not claim the change has been made.",
  "assessment.reco.wouldFix": ({ list }) => `What would change this: ${list}.`,
  "assessment.reco.wouldFixNone": "The reasons below say what it was waiting for.",
  "assessment.reco.wouldFixTest": ({ date }) => `another test on or after ${date}`,

  "assessment.retest.label": "Next test",
  "assessment.retest.recommended": "Recommended",
  "assessment.retest.earliest": "Earliest useful",
  "assessment.retest.why": "Why",
  "assessment.retest.latest": "Latest the app will let it slip",
  "assessment.retest.latestNone": "Not set",
  "assessment.retest.latestNoneSub": "the scheduler picks an earliest, never a deadline",
  "assessment.retest.at": ({ date, time }) => `${date}, ${time}`,
  "assessment.retest.notConsidered": "Timings not considered",
  "assessment.retest.notRunPill": "Not run",

  "assessment.missing.label": "What the app has not been told",
  "assessment.missing.limits": "Limits this",
  "assessment.missing.notRun": "Not run",
  "assessment.missing.holds": "what this holds back",
  "assessment.missing.effect": "effect",
  "assessment.missing.noEffect": "nothing on this card",

  "assessment.notices.summary": "Why the engine said this",
  "assessment.notices.blocking": ({ n }) => `${n} blocking`,
  "assessment.notices.limiting": ({ n }) => `${n} limiting`,
  "assessment.notices.info": ({ n }) => `${n} info`,

  "assessment.seeWorking": "See the working",

  "assessment.chart.aria": ({ from, fromDate, to, toDate, range }) =>
    `Alkalinity from ${from} on ${fromDate} to ${to} on ${toDate} dKH${range}.`,
  "assessment.chart.ariaRange": ({ min, max }) =>
    `, against a target range of ${min} to ${max} dKH`,
  "assessment.legend.range": ({ min, max, unit }) => `Target range ${min}–${max} ${unit}`,
  "assessment.legend.excluded": "Not eligible for the trend",
  "assessment.legend.repeats": "Repeats, shown as one",

  "assessment.dev.summary": "Developer view — contract vocabulary",
  "assessment.dev.note":
    "Everything below is the engine's own output, unaltered. It uses the contract's names on purpose; " +
    "nothing outside this box does.",

  /* ======================================================================
     THE WORKING
     ================================================================== */

  "working.title": "The working",
  "working.subtitle": "Every figure, and where it came from.",
  "working.none": "No assessment has been made yet.",
  "working.noneNote": "There is nothing to show rather than something invented to fill the space.",
  "working.head": "How this was worked out",
  "working.fromReadings": "From your readings",
  "working.testsUsed": "Separate tests used",
  "working.daysCovered": "Days they cover",
  "working.measuredDrift": "Measured drift",
  "working.scatterLine": "Scatter around the line",
  "working.scatterPoint": "Scatter used per reading",
  "working.driftUncertainty": "Uncertainty in the drift",
  "working.trend": "Trend",
  "working.standBehind": "What the app will stand behind",
  "working.supportedDrift": "Drift we can stand behind",
  "working.takenOff": "Taken off for uncertainty",
  "working.limitedBy": "Limited by uncertainty",
  "working.yes": "yes",
  "working.no": "no",
  "working.whichIs": "Which is",
  "working.whichIsValue": ({ observed, subtracted }) =>
    `${observed} with ${subtracted} taken off`,
  "working.supportedLabel": "Supported drift",
  "working.tankUses": "What the tank uses",
  "working.perDay": "Per day",
  "working.avgDose": "Average dose over that stretch",
  "working.perMl": "Each millilitre gives",
  "working.dailyUse": "Daily use",
  "working.dose": "The dose",
  "working.doseNow": "Dose now",
  "working.doseSteady": "Dose that would hold it steady",
  "working.beforeRounding": "Before rounding",
  "working.recommended": "Recommended",
  "working.change": "Change",
  "working.whatAdds": "What that adds",
  "working.expectedDrift": "Expected drift after it",
  "working.strength": "Solution strength",
  "working.inUse": "In use",
  "working.strengthFrom": "Where it came from",
  "working.strengthTheoretical": "your recipe and tank volume",
  "working.strengthLearned": "measured from past dose changes",
  "working.strengthLearnedLabel": "Learned from results",
  "working.strengthLearnedOff": "learning is switched off in this build",
  "working.note":
    "Every figure above is the engine's own. Nothing on this screen recomputes any of them — two " +
    "implementations of one number that agree today would be a defect waiting to happen, not a coincidence.",

  "record.title": "This assessment as a record",
  "record.saved": "Saved",
  "record.savedAt": ({ date, time }) => `${date} at ${time}`,
  "record.engine": "Engine version",
  "record.canon": "Canon version",
  "record.config": "Settings version",
  "record.inputs": "Readings and events it used",
  "record.replay": "Run it again on the same readings",
  "record.replaying": "Running it again…",
  "record.replayMissing": "That record could not be found.",
  "record.replaySame": "Run again on the same readings, the engine gives exactly the same answer.",
  "record.replayDiffers": ({ present, named }) =>
    `The answer differs. ${present} of ${named} of the entries it used are still current — an entry it used has probably been corrected since.`,
  "record.replayNoConfig": ({ id }) =>
    `This device no longer holds the settings this assessment used (${id}), so ` +
    `it cannot be replayed here. The record itself is unchanged.`,
  "record.replayEngine":
    "It reads differently now because the engine has changed since. That is an " +
    "upgrade, not a disagreement — the original record still says what it said.",
  "record.replayCanon":
    "It reads differently now because the chemistry rules have been reissued " +
    "since. The original record still says what it said.",
  "record.replayVersion":
    "The answer differs, and so does the engine version. That is an upgrade, not a disagreement — " +
    "a replay only means the same thing on the same engine.",
  "record.note":
    "This record is never rewritten. Correcting a reading afterwards makes a new assessment with a new " +
    "identity; this one keeps saying what it said, because what the app told you at the time is a fact about the past.",

  /* ======================================================================
     TEST LAB
     ================================================================== */

  "testlab.title": "Test Lab",
  "testlab.subtitle": "One sitting, one date, every parameter on this screen.",
  "testlab.sitting": "This sitting",
  "testlab.sittingNote":
    "Asked once for the sitting rather than once per reading. Any single row can be given its own time " +
    "if it genuinely differs.",
  "testlab.count": ({ done, total }) => `${done} of ${total} due logged`,
  "testlab.countNone": "nothing due",
  "testlab.rail": ({ done, total }) =>
    `${done} of the ${total} due test${total === 1 ? "" : "s"} recorded. The rail counts what is due, ` +
    "not what exists — logging something that was not due does not move it.",
  "testlab.railNone": "No tests are due today. You can still log anything you want to record.",
  "testlab.parameters": "Parameters",
  "testlab.lastReading": ({ value, unit, date }) => `Last ${value} ${unit} on ${date}`,
  "testlab.neverTested": "Never tested",
  "testlab.due": " · due",
  "testlab.logged": "Logged.",
  "testlab.inertRow": "Logged and charted. Not assessed — there is no engine for it yet.",
  "testlab.somethingElse": "Something else",
  "testlab.recordOther": "Record a dose change, water change or one-off",
  "testlab.recordIcp": "Enter an ICP panel",

  /* ======================================================================
     THE TIME CONTROL — the most load-bearing copy in the app
     ================================================================== */

  "time.when": "When did this happen?",
  "time.howWell": "How well do you know that time?",
  "time.date": "Date",
  "time.timeOfDay": "Time of day",
  "time.opt.now": "Now",
  "time.opt.nowHint": "this is happening as you log it",
  "time.opt.exact": "Exact time",
  "time.opt.exactHint": "you know when, to the minute",
  /* The hint said "with proof recorded" and the sheet asks for no proof. This
     build has no importer and no field to record a proof in, so the label
     described a capability that does not exist. It now says what the option
     actually is. */
  "time.opt.reconstructed": "Worked out",
  "time.opt.reconstructedHint": "from something else you remember",
  "time.opt.local": "Clock time",
  "time.opt.localHint": "zone unsure",
  "time.opt.dateOnly": "Date only",
  "time.opt.dateOnlyHint": "the time of day was not noted",
  "time.unanswered":
    "Say how well you know the time before saving. A weaker honest answer is always better than a made-up strong one.",
  "time.dateOnlyNote":
    "Stored with the date and no time. It stays that way permanently — the app will never fill the time in later.",
  "time.needTime": "Enter the time, or choose “date only”.",
  "time.needAnswer": "Say how well you know the time.",
  "time.describe.exact": "Date and time recorded",
  "time.describe.dateOnly": "Date only — the time of day was not recorded",
  "time.describe.local": "Time of day recorded, but the timezone it was in is not known",
  "time.describe.reconstructed": "Time reconstructed from evidence recorded at the time",
  "time.describe.none": "No time recorded",
  "time.fmt.dateOnly": ({ date }) => `${date} · time of day not recorded`,

  /* Relative days. "Today" and "Tomorrow" read better than a date for anything
     close and worse for anything far, so both forms live here. */
  "rel.today": "Today",
  "rel.tomorrow": "Tomorrow",
  "rel.yesterday": "Yesterday",
  "rel.inDays": ({ n }) => `in ${n} days`,
  "rel.daysAgo": ({ n }) => `${n} days ago`,

  /* ======================================================================
     ENTRY, EDITING AND THE SHARED SHEET
     ================================================================== */

  "entry.empty": "Nothing was entered. An empty box is not a reading of zero.",
  "entry.notANumber": ({ text }) => `“${text}” is not a number.`,
  "entry.unknownParameter": ({ key }) => `Unknown parameter: ${key}`,
  "entry.notInRecord": "That entry is not in the record.",

  "entry.detail.title": "This entry",
  "entry.detail.what": "What",
  "entry.detail.asTyped": "As you typed it",
  "entry.detail.whenHappened": "When it happened",
  "entry.detail.howWellKnown": "How well that is known",
  "entry.detail.whenTold": "When you told the app",
  "entry.detail.state": "State",
  "entry.detail.value": ({ value, unit }) => `${value} ${unit}`,

  "entry.state.current": "current",
  "entry.state.superseded": "replaced by a later entry, and kept",
  "entry.state.suspect": "you marked this suspect",
  "entry.state.invalid": "you marked this invalid",

  "entry.dateOnly.head": "This entry has a date and no time.",
  "entry.dateOnly.body":
    "It stays in your history and can still be the latest value, but it cannot enter a trend, because " +
    "the gap between it and another reading is not a known length of time.",
  "entry.dateOnly.cannot":
    "A correction cannot give it a time. It never had one, and the app will not manufacture one now — " +
    "a made-up time would be indistinguishable from a real one afterwards.",

  "entry.superseded.head": "A later entry replaces this one. This one is kept and is still readable.",
  "entry.superseded.open": "Open the entry that replaced it",
  "entry.notes": "Your notes",

  "entry.correct": "Correct it",
  "entry.correct.title": "Correct this entry",
  "entry.correct.save": "Save the correction",
  "entry.correct.why": "Why (optional)",
  "entry.correct.whatThisDoes": "What this does",
  "entry.correct.value": ({ label, unit }) => `${label} (${unit})`,
  "entry.correct.valuePlain": "Value",
  "entry.correct.correctedValue": "Corrected value",

  "entry.audit.kept":
    "The entry you are correcting stays in the record. It is marked as replaced, not removed, and you " +
    "can still open it.",
  "entry.audit.dateOnly":
    "This entry has a date and no time. A correction cannot give it one — it never had a time, and the " +
    "app will not manufacture one now.",
  "entry.audit.assessments":
    "Assessments already saved are not rewritten. They keep saying what they said, and a fresh assessment " +
    "will be made from the corrected record.",

  "entry.mark.suspect": "Mark it suspect",
  "entry.mark.suspectTitle": "Mark this suspect",
  "entry.mark.unsuspect": "Remove the suspect mark",
  "entry.mark.invalid": "Mark it invalid",
  "entry.mark.invalidTitle": "Mark this invalid",
  "entry.mark.suspectBody":
    "The entry stays exactly as it is and stays in the record. The mark is recorded alongside it, with today's date.",
  "entry.mark.invalidBody":
    "The entry stays exactly as it is and stays in the record. It stops being sent to the chemistry engine, " +
    "and it is drawn as excluded on your charts.",
  "entry.mark.suspectLimitHead":
    "Being honest about a limit: this build records a suspect mark and does nothing else with it.",
  "entry.mark.suspectLimitBody":
    "What a suspect reading should do to an assessment is a chemistry question, and the frozen canon has " +
    "no rule for it. Rather than invent one, the app keeps the mark visible and keeps counting the reading. " +
    "This is recorded as an open question.",

  /* ======================================================================
     RECORDING OTHER EVENTS
     ================================================================== */

  "log.title": "Record something",
  "log.subtitle": "Everything the engine can read about your tank.",
  "log.record": "Record it",

  "log.state.title": "What your doser is set to",
  "log.state.why":
    "Not a change — the rate your pump is running at now. Without it the app " +
    "knows what your alkalinity is doing but not what is being put in, and it " +
    "cannot size a dose at all.",
  "log.state.dose": "Dose",
  "log.state.doseHint": "In millilitres per day, as the pump is set.",
  "log.state.uncertain": "I'm not sure exactly when it was set to this",
  "log.state.needNumber": "Enter the dose as a number of millilitres per day.",

  "log.dose.title": "A dose change",
  "log.dose.why":
    "The time this took effect is the single most important time in the app — the engine measures the " +
    "tank's response from that moment.",
  "log.dose.from": "From (mL/day)",
  "log.dose.to": "To (mL/day)",
  "log.dose.uncertain": " I made it, but I'm not sure exactly when",
  "log.dose.between": "Between",
  "log.dose.betweenHint":
    "Everything in that window is treated as unusable for a trend, rather than the app picking a time inside it.",
  "log.dose.needNumbers": "Both doses have to be numbers.",
  "log.dose.needWindow": "Give the earliest and latest it could have been.",
  "log.dose.earliest": "Earliest it could have been",
  "log.dose.latest": "Latest it could have been",

  "log.water.title": "A water change",
  "log.water.why":
    "If you measured the new water's alkalinity from the same batch, the engine can subtract the step it " +
    "caused instead of reading it as a trend.",
  "log.water.fraction": "How much of the system (0.1 for 10%)",
  "log.water.measured": " I measured the new water's alkalinity, from the same batch",
  "log.water.replacement": "New water alkalinity (dKH)",
  "log.water.replacementHint": "Only useful if you measured it from the same batch you used.",
  "log.water.needFraction": "Give the fraction changed, between 0 and 1.",
  "log.water.needReplacement": "Give the alkalinity you measured.",
  "log.water.volume": "Volume",

  "log.manual.title": "A one-off addition",
  "log.manual.why":
    "A dose you added by hand, outside the pump. If you do not know how much, record it anyway — the " +
    "engine treats an unknown addition as the end of one stretch of history rather than pretending it did not happen.",
  "log.manual.amount": "How much (mL), if you know",
  "log.manual.notANumber": "That is not a number. Leave it empty if you do not know.",

  "log.anomaly.title": "A dosing problem",
  "log.anomaly.why":
    "A stretch where the dose did not actually go in. The engine ends its stretch of history there rather " +
    "than reading it as the tank changing.",
  "log.anomaly.what": "What happened",
  "log.anomaly.pumpStopped": "The pump stopped",
  "log.anomaly.containerEmpty": "The container ran dry",
  "log.anomaly.tubeBlocked": "A line was blocked",
  "log.anomaly.other": "Something else",
  "log.anomaly.from": "From",
  "log.anomaly.until": "Until",
  "log.anomaly.needSpan": "Give the stretch it covered.",

  "log.context.title": "Something that changes what the tank uses",
  "log.context.why":
    "New corals, a big loss, a lighting change. The engine uses it to explain a step change in demand " +
    "rather than treating it as a mystery.",
  "log.context.what": "What changed",
  "log.context.needWhat": "Say what changed.",

  "log.icp.title": "ICP panel",
  "log.icp.subtitle": "One sample, one date, every element on it.",
  "log.icp.panel": "The panel",
  "log.icp.lab": "Which lab",
  "log.icp.note":
    "Recorded and charted. No element here has a reference range in the app, because none of them has one " +
    "in the frozen chemistry canon, and the app will not assert one of its own.",
  "log.icp.needOne": "Enter at least one element.",
  "log.icp.notANumber": ({ element }) => `${element} is not a number.`,
  "log.icp.record": "Record the panel",
  "log.icp.elements": "elements",
  "log.icp.stored": "Stored",
  "log.icp.storedBody":
    "Every element is kept and charted. None of them is assessed — there is no reference range for any of " +
    "them in the frozen chemistry canon.",

  "log.event.reading": "Reading",
  "log.event.doseState": "Dose set",
  "log.event.doseChange": "Dose changed",
  "log.event.waterChange": "Water change",
  "log.event.manual": "One-off addition",
  "log.event.anomaly": "Dosing problem",
  "log.event.context": "Something that changes demand",
  "log.event.icp": "ICP panel",
  "log.event.husbandry": "Husbandry",
  "log.event.note": "Note",

  /* ======================================================================
     TASKS AND THE CALENDAR
     ================================================================== */

  "tasks.title": "Tasks",
  "tasks.subtitle": "Due a fixed interval after it was last done, never after it was last due.",

  "tasks.calendar.prev": "Previous month",
  "tasks.calendar.next": "Next month",
  "tasks.calendar.counts": ({ done, scheduled }) => `${done} completed · ${scheduled} scheduled`,
  "tasks.calendar.mon": "Mon",
  "tasks.calendar.tue": "Tue",
  "tasks.calendar.wed": "Wed",
  "tasks.calendar.thu": "Thu",
  "tasks.calendar.fri": "Fri",
  "tasks.calendar.sat": "Sat",
  "tasks.calendar.sun": "Sun",
  "tasks.calendar.legendDone": "Done",
  "tasks.calendar.legendScheduled": "Scheduled",
  "tasks.calendar.legendSuggested": "Suggested by the app",
  "tasks.calendar.legendOverdue": "Overdue",
  "tasks.calendar.note":
    "Completed and scheduled are counted separately and shown separately, so the month reads as a plan " +
    "and not only as a record. Tap a day for what is on it.",

  "tasks.empty.title": "No schedule yet",
  "tasks.empty.body":
    "The app ships with no test schedule. A testing cadence is a chemistry rule, and the only one the " +
    "canon states is alkalinity's — which arrives as the engine's suggested retest, on Today, rather than " +
    "as a repeating task.",
  "tasks.empty.body2":
    "Everything else is yours to set. Add a task, choose how often, and it is your interval — not a " +
    "number the app asserted.",
  "tasks.empty.add": "Add a task",

  "tasks.group.tests": "Test schedule",
  "tasks.group.husbandry": "Husbandry & maintenance",
  "tasks.group.empty": "Nothing here yet.",
  "tasks.row.detail": ({ interval, last }) => `${interval} · ${last}`,
  "tasks.row.lastDone": ({ date }) => `last done ${date}`,
  "tasks.row.never": "never done",
  "tasks.row.late": ({ days }) => `${days}d late`,

  "tasks.add": "Add",
  "tasks.add.new": "New task",
  "tasks.add.oneOff": "Record something that was not scheduled",

  "tasks.reschedule.lastDone": "Last done",
  "tasks.reschedule.never": "never",
  "tasks.reschedule.nextDue": "Next due",
  "tasks.reschedule.moveTo": "Move the next one to",
  "tasks.reschedule.moveHint":
    "A nudge moves only this occurrence. The one after it is still scheduled from when you actually do it, " +
    "so a nudge never permanently skews the rhythm.",
  "tasks.reschedule.howOften": "How often",
  "tasks.reschedule.howOftenHint":
    "Your interval. The app has no opinion about how often you should test this.",
  "tasks.reschedule.needInterval": "An interval has to be at least one day.",
  "tasks.reschedule.markDone": "Mark done today",
  "tasks.reschedule.skip": "Skip this one",
  "tasks.reschedule.turnOff": "Turn this off",
  "tasks.reschedule.intervalAria": "Interval in days",

  "tasks.day.done": "Done",
  "tasks.day.doneEmpty": "Nothing was completed on this day.",
  "tasks.day.wasDue": "Was due",
  "tasks.day.due": "Due",
  "tasks.day.dueEmpty": "Nothing scheduled.",
  "tasks.day.recorded": "Recorded",
  "tasks.day.autoCompleted": "completed by logging the reading",
  "tasks.day.markedDone": "marked done",
  "tasks.day.saidLabel": "What the app said",
  "tasks.day.saidCount": ({ n }) => `${n} assessment${n === 1 ? "" : "s"} saved on this day.`,

  "tasks.new.title": "New task",
  "tasks.new.editTitle": "Edit task",
  "tasks.new.what": "What is it?",
  "tasks.new.howOften": "How often?",
  "tasks.new.howOftenHint":
    "Your interval. The app has no cadence to suggest for anything but alkalinity, and alkalinity's comes " +
    "from the engine as a suggestion rather than a repeating task.",
  "tasks.new.days": "days",
  "tasks.new.weeks": "weeks",
  "tasks.new.firstDue": "First due",
  "tasks.new.isTest": "Is this a test?",
  "tasks.new.notATest": "Not a test",
  "tasks.new.isTestHint": "If it is, logging that reading completes it automatically.",
  "tasks.new.needName": "Give it a name.",
  "tasks.new.needInterval": "Say how often, in days or weeks.",

  "tasks.oneOff.title": "Something not scheduled",
  "tasks.oneOff.what": "What did you do?",
  "tasks.oneOff.hint":
    "Recorded as a one-off. It does not create a schedule and it does not complete anything.",
  "tasks.oneOff.needWhat": "Say what you did.",

  "tasks.suggestion.title": "The app's suggested test",
  "tasks.suggestion.suggests": "The app suggests",
  "tasks.suggestion.why": "Why",
  "tasks.suggestion.noTask":
    "You have no alkalinity test task, so accepting this changes nothing in your schedule. It just puts " +
    "the date on your calendar.",
  "tasks.suggestion.effectLabel": "What this does to your schedule",
  "tasks.suggestion.yourNext": "Your next alkalinity test",
  "tasks.suggestion.wouldMove": "Would move to",
  "tasks.suggestion.thatIs": "That is",
  "tasks.suggestion.noChange": "no change",
  "tasks.suggestion.shift": ({ days, direction }) =>
    `${days} day${days === 1 ? "" : "s"} ${direction}`,
  "tasks.suggestion.later": "later",
  "tasks.suggestion.earlier": "earlier",
  "tasks.suggestion.onlyThis": ({ interval }) =>
    `Only this occurrence moves. The one after it is still ${interval} from when you actually test.`,
  "tasks.suggestion.note":
    "A suggestion is accepted or declined. It is not rescheduled, because moving it would change what it " +
    "was for — the date is the engine's answer to a question about your tank, not a slot in your week.",
  "tasks.suggestion.accept": "Accept",
  "tasks.suggestion.decline": "Decline",

  "tasks.interval.day": "every day",
  "tasks.interval.days": ({ n }) => `every ${n} days`,
  "tasks.interval.week": "every week",
  "tasks.interval.weeks": ({ n }) => `every ${n} weeks`,
  "tasks.interval.needChosen": "A task needs an interval the keeper chose.",
  "tasks.interval.unknownKind": ({ kind }) => `Unknown task kind: ${kind}`,

  /* ======================================================================
     HISTORY
     ================================================================== */

  "history.title": "History",
  "history.subtitle": "Every reading, with what happened around it.",
  "history.window30": "30 days",
  "history.window60": "60 days",
  "history.window90": "90 days",
  "history.windowYear": "a year",
  "history.windowNote": ({ window }) =>
    `Showing the last ${window}. This is the window you chose for looking; the engine chooses its own ` +
    "window for deciding, and says which it used on the assessment.",
  "history.windowYearWord": "year",
  "history.windowDaysWord": ({ days }) => `${days} days`,
  "history.observations": ({ n }) => `${n} observation${n === 1 ? "" : "s"}`,
  "history.emptyWindow": "Nothing recorded in this window.",
  "history.showAll": "Show every parameter",
  "history.everyEntry": "Every entry",
  "history.chart.aria": ({ label, days, n }) =>
    `${label} over the last ${days} days, ${n} observations.`,
  "history.point.aria": ({ value, unit, date }) => `${value} ${unit} on ${date}`,
  "history.inertNote":
    "Logged and charted, not assessed. No range is shaded because there is no range for this parameter in " +
    "the canon, and the app will not draw one it made up.",
  "history.repeatNote": ({ minutes }) =>
    `Readings within ${minutes} minutes of each other are shown as one observation. That window is the ` +
    "engine's, reported on the last assessment; this chart follows it rather than choosing its own.",
  "history.entry.replaced": " · replaced by a later entry",
  "history.entry.suspect": " · you marked this suspect",
  "history.entry.excluded": " · cannot enter the trend",

  "history.event.doseChange": "Dose change",
  "history.event.doseState": "Dose set",
  "history.event.waterChange": "Water change",
  "history.event.manual": "One-off addition",
  "history.event.anomaly": "Dosing problem",
  "history.event.context": "Demand changed",
  "history.event.icp": "ICP panel",
  "history.event.husbandry": "Husbandry",

  /* ======================================================================
     SETUP, SETTINGS, TOOLS, PLATFORM
     ================================================================== */

  "setup.title": "Set up your tank",
  "setup.subtitle": "Five facts the app cannot work out for itself.",
  "setup.yourTank": "Your tank",
  "setup.save": "Save and start",
  "setup.saveExisting": "Save",
  "setup.needed": ({ label }) =>
    `${label} is needed. The app will not guess it, and it refuses rather than defaulting.`,
  "setup.rangeOrder": "The low end of the target range has to be below the high end.",
  "setup.defaultsFailedHead": "The app could not read the canon's default settings, so setup cannot finish.",
  "setup.defaultsFailedBody":
    "It will not substitute numbers of its own. Reload with a network connection, or reinstall.",
  "setup.decidesTitle": "What the app decides for itself",
  "setup.decidesBody":
    "Everything else — how much scatter an alkalinity test has, how big a step is reasonable, how fast a " +
    "tank may safely move, how often to retest — comes from the frozen chemistry canon and is not a setting. " +
    "If a default were not good enough to ship, the fault would be in the default, not in the absence of a question.",
  "setup.decidesNote":
    "There is deliberately no tolerance setting, no cadence setting and no confidence threshold. One input " +
    "arriving at three places has no single owner, and that is how the defects this project exists to avoid begin.",
  "setup.fieldLabel": ({ label, unit }) => `${label} (${unit})`,
  "setup.defaultsUnreadable": "The canon's default configuration could not be read.",
  "setup.defaultsShape": "The canon's default configuration is not in the expected shape.",

  "fact.netVolume": "Net water volume",
  "fact.netVolumeHint": "Water actually in the system, not the tank's rated size.",
  "fact.rangeLow": "Target range, low",
  "fact.rangeLowHint": "The bottom of the band you are aiming to hold.",
  "fact.rangeHigh": "Target range, high",
  "fact.rangeHighHint": "The top of it.",
  "fact.potency": "Solution strength",
  "fact.potencyHint": "How much one millilitre raises this tank.",
  "fact.pumpStep": "Smallest step your pump makes",
  "fact.pumpStepHint": "Recommendations are rounded to this.",

  "settings.title": "Settings",
  "settings.yourTank": "Your tank",
  "settings.notSet": "not set",
  "settings.change": "Change these",
  "settings.changeNote":
    "Changing a setting does not rewrite anything. A new version is recorded with the date it takes effect, " +
    "and every assessment already saved keeps pointing at the version it actually used.",
  "settings.factValue": ({ value, unit }) => `${value} ${unit}`,

  "settings.strengthTitle": "Where your solution strength came from",
  "settings.strengthBody": ({ value }) =>
    `The app is using ${value} dKH per mL, which you typed during setup.`,
  "settings.strengthNone": "No solution strength is recorded, so the app cannot size a dose.",
  "settings.strengthNote":
    "The app never writes this figure for you. It is not learning your solution's real strength from " +
    "results either — that is switched off by design in this build, and the assessment says so every time.",

  "settings.historyTitle": "Settings history",
  "settings.historyRow": ({ date, min, max }) => `in force from ${date} · range ${min}–${max} dKH`,

  "settings.dataTitle": "Your data",
  "settings.storage": "Storage",
  "settings.storageOk": "working",
  "settings.storageBad": "not available",
  "settings.assessmentsSaved": "Assessments saved",
  "settings.thisInstall": "This install",
  "settings.export": "Export everything",
  "settings.whatSurvives": "What survives what",
  "settings.dataNote":
    "Everything is on this device and nowhere else. There is no account, no cloud and no sync in this build, " +
    "so an export is the only copy that survives losing the phone.",

  "settings.witness.fresh": "first run — no data yet",
  "settings.witness.suspect":
    "this device held data before and none is here now — that is either a wipe or a fresh install, and the " +
    "app cannot tell which",
  "settings.witness.known": ({ date }) => `known since ${date}`,

  "survives.title": "What survives what",
  "survives.intro": "Stated plainly, including the parts that are not reassuring.",
  "survives.yes": "Survives",
  "survives.yesBody":
    "Closing the app. Reloading. Restarting the phone. Going offline. Losing the network mid-entry.",
  "survives.no": "Does not survive",
  "survives.noBody":
    "Clearing the browser's site data. Deleting the app from the home screen on some systems. Losing or " +
    "replacing the phone. Some browsers also clear storage for sites you have not opened in a while.",
  "survives.note":
    "There is no cloud copy in this build. An export you keep somewhere else is the only thing that survives " +
    "the second list.",

  /* ======================================================================
     TEST MODE
     ================================================================== */

  "settings.testmode.offBody":
    "Set the app's date by hand and enter a series of readings, to see what the engine says about a run of " +
    "days without waiting a month for them to happen. It uses its own separate store, so nothing you enter " +
    "there ever touches this tank.",
  "settings.testmode.onBody":
    "Test mode is on. The app is showing a date you set and a store that is not this tank's. Nothing on any " +
    "screen right now is about your actual tank.",
  "settings.testmode.setUp": "Set up test mode",
  "settings.testmode.open": "Test mode controls",
  "settings.testmode.note":
    "Off by default, and here rather than on the tab bar, because it is not part of keeping a tank.",

  "testmode.title": "Test mode",
  "testmode.subtitle": "Set the date. Enter the readings. See what the engine says.",
  "testmode.on": "on",
  "testmode.off": "off",

  "testmode.offTitle": "Test mode is off",
  "testmode.offBody":
    "Everything you see is your real tank, and the app's date is today. Turning test mode on changes two " +
    "things: the moment the assessment is worked out for, and which store the app reads and writes.",
  "testmode.startAt": "Start at",
  "testmode.startHint":
    "This is the moment the engine is asked about — not the time of any reading. You can move it a day at a " +
    "time afterwards.",
  "testmode.startDate": "Starting date",
  "testmode.startTime": "Starting time of day",
  "testmode.turnOn": "Turn test mode on",

  "testmode.whatItIsTitle": "What this is",
  "testmode.whatItIs":
    "A way of telling the app what the readings were and what day it is, and reading back what the engine " +
    "makes of it. It does not generate readings, model a tank or predict anything.",
  "testmode.whatItIsNot":
    "It is not a way of changing real data. Your real readings are not editable from here, and a test reading " +
    "never becomes a real one.",
  "testmode.samePathNote":
    "The engine is called by exactly the same code in both modes, with the same two inputs. Only the date and " +
    "the store differ — so what you see here is what the app would have said on that day with those readings.",

  "testmode.onTitle": "The app's date",
  "testmode.onBody":
    "This is the moment every screen is working from. Move it and the assessment, what is due, the retest " +
    "date and what counts as stale all follow it.",
  "testmode.stepper.aria": "Move the app's date",
  "testmode.stepper.back": "A day earlier",
  "testmode.stepper.forward": "A day later",
  "testmode.jumpTo": "Jump to",
  "testmode.timeOfDay": "Time of day",
  "testmode.goTo": "Go to this moment",
  "testmode.turnOff": "Turn test mode off",
  "testmode.stepNote":
    "Turning it off restores the real date and the real store, and copies nothing in either direction. " +
    "Whatever you entered here is still here next time.",

  "testmode.marker.tag": "TEST MODE",
  "testmode.marker.detail": ({ date, time }) => `not your tank · ${date}, ${time}`,

  "testmode.series.title": "Enter a series",
  "testmode.series.body":
    "One record per line. Paste a fortnight in one go rather than filling in fourteen forms. Blank lines and " +
    "lines starting with a hash are ignored.",
  "testmode.series.grammar":
    "2026-03-01        alk     8.6\n" +
    "2026-03-03 09:15  alk     8.4\n" +
    "2026-03-05        dose    8.8\n" +
    "2026-03-06        water   0.13\n" +
    "2026-03-06        water   10L\n" +
    "2026-03-07        manual  20\n" +
    "2026-03-08        note    skimmer overflowed",
  "testmode.series.aria": "The series to enter",
  "testmode.series.placeholder": "One record per line",
  "testmode.series.note":
    "A line with no time is stored with no time — not midnight, not midday. The first dose line is recorded " +
    "as what the pump is set to; every one after it is a change from the value before it. A dosing problem " +
    "needs a start and an end, so it has its own form rather than a line here.",
  "testmode.series.add": "Add these",
  "testmode.series.added": ({ n }) => `${n} added.`,
  "testmode.series.willAdd": ({ n }) => `${n} records will be added:`,
  "testmode.series.nothing": "Nothing to add yet.",
  "testmode.series.dateOnly": "Without a time",
  "testmode.series.dateOnlyCount": ({ n, total }) => `${n} of ${total}`,
  "testmode.series.problems": ({ n }) =>
    n === 1 ? "One line cannot be read, and nothing will be added until it is fixed:"
            : `${n} lines cannot be read, and nothing will be added until they are fixed:`,
  "testmode.series.problemLine": ({ n }) => `Line ${n}`,
  "testmode.series.fixFirst": "Fix the lines above first — nothing was added.",

  "testmode.separation.title": "Where this is being kept",
  "testmode.separation.reading": "Reading and writing",
  "testmode.separation.real": "Your real tank",
  "testmode.separation.held": "Records held here",
  "testmode.separation.body":
    "Two separate databases. There is no query that can see both, and no path that copies between them in " +
    "either direction.",
  "testmode.separation.note":
    "Test mode has its own tank facts too, for the same reason. The first time you turn it on it will ask for " +
    "them, rather than borrowing your real tank's.",

  "testmode.reset.title": "Clear the test data",
  "testmode.reset.body":
    "Removes everything entered in test mode — readings, doses, tasks, assessments and its tank facts. Your " +
    "real tank is not touched.",
  "testmode.reset.action": "Clear all test data",
  "testmode.reset.confirmTitle": "Clear all test data?",
  "testmode.reset.confirmBody":
    "Everything entered in test mode is removed and cannot be got back. Your real tank's records are not " +
    "touched by this.",
  "testmode.reset.confirmNote": "This clears the test store only.",
  "testmode.reset.confirmAction": "Yes, clear it",

  "testmode.err.notInTestMode": "That only works in test mode, and test mode is off.",

  "seed.err.tooShort": "A line needs at least a date, what it is, and a value.",
  "seed.err.badDate": ({ text }) => `${text} is not a date in the form 2026-03-01.`,
  "seed.err.needValue": "This line has no value on it.",
  "seed.err.needNote": "A note line needs something written after the word note.",
  "seed.err.unknownWord": ({ text }) =>
    `${text} is not something this can record. Use a parameter name, or dose, water, manual or note.`,
  "seed.err.fractionRange":
    "A water change given as a fraction has to be less than 1. Add an L for litres.",
  "seed.err.noVolume":
    "A water change in litres needs the tank volume, and this store has not been told it yet.",

  "platform.title": "Offline, install and updates",
  "platform.network": "Network",
  "platform.online": "online",
  "platform.offline": "offline — everything still works",
  "platform.installed": "Installed",
  "platform.installedYes": "yes, running from your home screen",
  "platform.installedNo": "not yet — use your browser's Add to Home Screen",
  "platform.engine": "Chemistry engine",
  "platform.checking": "checking…",
  "platform.engineVersions": ({ engine, canon }) => `${engine} · ${canon}`,
  "platform.engineFailed": ({ error }) => `could not start: ${error}`,
  "platform.offlineCopy": "Offline copy",
  "platform.updateReady": "an update is ready — close and reopen the app to take it",
  "platform.offlineReady": "ready, the app opens without a network",
  "platform.notInstalled": "not installed yet",
  "platform.noServiceWorker": "this browser cannot keep an offline copy",
  "platform.offlineCopyFailed": ({ error }) => `could not be made: ${error}`,
  "platform.note":
    "The first load downloads a Python runtime of about 12 MB, because the app runs the chemistry engine " +
    "itself rather than a second copy of it written in another language. After that it is cached and the " +
    "app opens offline.",

  "tools.title": "Tools",
  "tools.subtitle": "Not in this build.",
  "tools.body": "Calculators, conversions and the reef toolkit come later.",
  "tools.note":
    "The tab exists so the shape of the app is honest about what is planned. It is disabled rather than " +
    "hidden, and it does nothing rather than showing something that looks like it works.",
  "tools.settingsBody": "Calculators and conversions are not in this build.",
  "tools.settingsNote":
    "The tab is there so the shape of the app is honest about what is coming. It does nothing, and it says so, " +
    "rather than opening onto an empty screen.",

  /* ======================================================================
     THE MOMENTS
     ================================================================== */

  "moment.reading.logged": "Logged",
  "moment.reading.loggedWithRun": "Logged, with the run behind it",
  "moment.reading.range": ({ n, from, to }) =>
    `${n} reading${n === 1 ? "" : "s"} shown, from ${from} to ${to}.`,
  "moment.reading.first": "This is the first one, so there is no history to draw it onto yet.",
  "moment.reading.note":
    "No conclusion is drawn here. The assessment on Today is where the engine says what this means.",

  "moment.dose.label": "Alkalinity dose",
  "moment.dose.recordedExpect": "Recorded, with what to expect",
  "moment.dose.expectation": ({ slope }) =>
    `The engine expects alkalinity to drift at about ${slope} dKH/day after this change`,
  /* The engine's snapshot carries `expectedSlopeChange` — how much the dose
     change is expected to move the DRIFT — not a predicted reading. The
     sentence used to promise a value at the next test, which the engine never
     supplied and the app must not compute. */
  "moment.dose.expectationValue": ({ value }) =>
    `, a change of ${value} dKH/day on where it was heading.`,
  "moment.dose.expectationEnd": ".",
  "moment.dose.recorded": "Recorded",
  "moment.dose.noSnapshot":
    "The engine has not stated what to expect from this change yet. It will on the next assessment.",
  "moment.dose.noSnapshotNote":
    "The app does not make its own prediction here. A prediction has to come from the thing that will later " +
    "be measured against it.",
  "moment.dose.testAgain": "Test again",
  "moment.dose.testAgainWhy": "Why",
  "moment.dose.testAgainNone": "the engine has not said yet",
  "moment.dose.note":
    "Try not to change the dose again before that test — the reading only means something if this dose has " +
    "run undisturbed.",

  "moment.task.doneOn": ({ date }) => `done ${date}`,
  "moment.task.first": "First time logged",
  "moment.task.count": ({ n }) => `${n} times now`,
  "moment.task.rhythm": ({ actual, set }) =>
    `You do this about every ${actual} days. It is set to ${set} day${set === 1 ? "" : "s"}.`,
  "moment.task.scheduled": "The next one is scheduled from today.",
  "moment.task.nextDue": "Next due",
  "moment.task.gapTitle": ({ days }) => `${days} day${days === 1 ? "" : "s"}`,

  "moment.countdown.held": "Staying open — tap Done when you're finished",
  "moment.countdown.closing": ({ seconds }) => `Closes in ${seconds}s · tap to keep open`,

  /* ======================================================================
     ABSENT VALUES — NOT_RUN, WITHHELD, NONE rendered as designed states
     ================================================================== */

  "absent.NOT_RUN": "Not worked out",
  "absent.WITHHELD": "Held back",
  "absent.NONE": "None",
  "absent.UNKNOWN": "Not known",
  "absent.NOT_APPLICABLE": "Does not apply here",
  "absent.other": "Not available",
  "absent.notRecorded": "Not recorded",

  "absentWhy.NOT_RUN": "The app did not run this. The reasons below say what it was waiting for.",
  "absentWhy.WITHHELD":
    "The app worked this out and is not standing behind it yet. The reasons below say why.",
  "absentWhy.NONE": "There is genuinely nothing here — not a gap in the record.",
  "absentWhy.UNKNOWN": "The app has not been told this. It will not guess.",
  "absentWhy.NOT_APPLICABLE": "This question does not arise in the current situation.",
  "absentWhy.other": "The app cannot state this.",
  "absentWhy.notRecorded": "Nothing has been entered for this.",

  /* ======================================================================
     THE SIX DIMENSIONS
     ================================================================== */

  "position.IN_RANGE": "In range",
  "position.BELOW_RANGE": "Below your target range",
  "position.ABOVE_RANGE": "Above your target range",
  /* The two alert positions are in the contract's `Position` vocabulary and had
     no wording, so a keeper in an alert state read "Not recorded" for where
     their alkalinity actually was. Found by reading the vocabulary from the
     contract instead of from a hand-written list. */
  "position.ALERT_LOW": "Low enough to need attention now",
  "position.ALERT_HIGH": "High enough to need attention now",
  "position.UNKNOWN": "Not known",
  "position.NOT_RUN": "Not worked out",

  "trajectory.RISING": "Rising",
  "trajectory.FALLING": "Falling",
  "trajectory.STABLE": "Holding steady",
  "trajectory.UNCERTAIN": "Not clear yet",
  "trajectory.NOT_RUN": "Not worked out",

  "evidence.SUFFICIENT": "Enough to work from",
  "evidence.INSUFFICIENT": "Not enough yet",
  "evidence.PROVISIONAL": "Only two tests — treat as provisional",
  "evidence.HIGH_CONFIDENCE": "A long clean run to work from",
  "evidence.CONFOUNDED": "Something got in the way",
  /* The reason-code spellings, kept because the reason list renders them too.
     They are not `MovementEvidence` values and never were. */
  "evidence.PROVISIONAL_TWO_POINT": "Only two tests — treat as provisional",
  "evidence.CONFOUNDED_HARD": "Something got in the way",
  "evidence.ANOMALOUS": "One result looks out of keeping with the rest",
  "evidence.UNCERTAINTY_LIMITED": "The movement is smaller than the test's own scatter",
  "evidence.NOT_RUN": "Not worked out",

  "outer.WITHIN_BOUNDS": "Inside the safe outer limits",
  "outer.BREACHED_LOW": "Below the safe lower limit",
  "outer.BREACHED_HIGH": "Above the safe upper limit",
  "outer.NOT_RUN": "Not worked out",
  "outer.UNKNOWN": "Not known",

  "response.RESPONDING_AS_PREDICTED": "Moving as the change predicted",
  "response.RESPONDING_MORE_THAN_PREDICTED": "Moving more than the change predicted",
  "response.RESPONDING_LESS_THAN_PREDICTED": "Moving less than the change predicted",
  "response.NO_DETECTABLE_RESPONSE": "No change that can be told apart from the noise",
  "response.NOT_ATTRIBUTABLE_SMALL_SIGNAL": "The change was too small to isolate",
  "response.CONFOUNDED": "Something else happened in the same window",
  "response.NOT_RUN": "Not worked out",
  "response.NONE": "No dose change is being watched",

  /* The contract's closed `RecommendationAction` vocabulary
     (`ALK-V2-DATA-CONTRACT.md:577-582`), in full. Several of these belong to
     safety returns and return plans, which this build does not implement — but
     a value the engine can legally emit must have wording, or it reads on
     screen as an absence. */
  "action.SET_MAINTENANCE_DOSE": "Set the maintenance dose",
  "action.HOLD_CURRENT_DOSE": "Hold the dose where it is",
  "action.NO_CHANGE": "No change",
  "action.INSUFFICIENT_DATA": "Not enough to size a dose",
  "action.TEST_AGAIN": "Test again",
  "action.REPEAT_TEST_NOW": "Repeat the test now",
  "action.OFFER_RETURN_PLAN": "A staged return is available",
  "action.START_RETURN_PLAN": "Start the staged return",
  "action.CONTINUE_RETURN_PLAN": "Continue the staged return",
  "action.STOP_RETURN_PLAN": "Stop the staged return",
  "action.RETURN_TO_MAINTENANCE": "Go back to the maintenance dose",
  "action.SAFETY_RETURN": "Bring it back safely",
  "action.PAUSE_DOSING": "Pause dosing",
  "action.VERIFY_DOSER": "Check the doser",
  "action.VERIFY_SOLUTION": "Check the solution",
  "action.VERIFY_CONFIGURATION": "Check the settings",
  "action.NOT_RUN": "Not worked out",

  /* A verb the CARD supplies, overriding the action's own.

     Only one card needs this, and it is the reason the override exists: on a
     capability refusal the engine's action is `HOLD_CURRENT_DOSE`, the same
     action as an ordinary hold. Printing "Hold the dose where it is" there
     would tell the keeper the engine had affirmed their dose when what it
     actually did was decline to size one. */
  "verb.CAPABILITY_REFUSAL": "Cannot size a dose yet",

  "severity.GATING": "Limiting",
  "severity.REFUSAL": "Blocking",
  "severity.INFO": "Info",

  /* ======================================================================
     CONSTRAINTS THE ENGINE APPLIED
     ================================================================== */

  "constraint.ACTUATOR_ROUNDING": "your pump's step size",
  "constraint.ORDINARY_STEP_CAP": "the ordinary limit on one step",
  "constraint.EXCEPTIONAL_STEP_CAP": "the larger step limit",
  "constraint.RATE_RAIL": "a safe rate of change",
  "constraint.TOWARD_RANGE_HOLD": "already heading back toward range",
  "constraint.LIQUID_GUARD": "a limit on how much liquid goes in per day",
  "constraint.other": "a limit the engine applied",

  /* ======================================================================
     WHAT AN ENGINE OUTPUT IS, IN WORDS
     ================================================================== */

  "output.potency.learnedPotencyDkhPerMl": "learning your solution's real strength",
  "output.doseRecommendation.bracketStatus": "how this compares with what the tank normally needs",
  "output.safety.magnesiumGateState": "the magnesium check",
  "output.consumption": "what the tank uses per day",
  "output.maintenanceEstimateMlPerDay": "the dose that would hold it steady",
  "output.potencyConfidence": "how much to trust the learned strength",
  "output.recommendedDoseMlPerDay": "the recommended dose",
  "output.other": "part of the answer",

  /* ======================================================================
     CAPABILITIES — what the app has or has not been told
     ================================================================== */

  "capability.M-1": "A pump step size to round recommendations to",
  "capability.M-2": "Which solution and batch you are dosing",
  "capability.M-3": "How the dose is delivered",
  "capability.M-4": "The alkalinity of the water you change with",
  "capability.M-5": "The time a dose change took effect",
  "capability.M-6": "How much was actually delivered",
  "capability.M-7": "What was expected of a past dose change",
  "capability.M-8": "An exact time on a reading",
  "capability.M-9": "Confirmation of the dose set on the pump",
  "capability.M-10": "Enough history to say what this tank normally needs",
  "capability.M-11": "Magnesium",
  "capability.M-12": "Settings dated from when they applied",
  "capability.M-13": "Provable times on readings",
  "capability.other": "Something the app needs",

  /* ======================================================================
     PARAMETERS
     ================================================================== */

  "parameter.ALK": "Alkalinity",
  "parameter.CA": "Calcium",
  "parameter.MG": "Magnesium",
  "parameter.NO3": "Nitrate",
  "parameter.PO4": "Phosphate",
  "parameter.SAL": "Salinity",

  /* The same names mid-sentence. English lowercases them there and the
     specification's copy reads "Test alkalinity on Saturday"; other languages
     do not, so both forms live here rather than being derived by a
     `toLowerCase()` at a call site. */
  "parameterMid.ALK": "alkalinity",
  "parameterMid.CA": "calcium",
  "parameterMid.MG": "magnesium",
  "parameterMid.NO3": "nitrate",
  "parameterMid.PO4": "phosphate",
  "parameterMid.SAL": "salinity",

  /* ======================================================================
     PAYLOAD KEYS — the figures shown beside a reason
     ================================================================== */

  "payload.have": "separate tests",
  "payload.need": "minimum",
  "payload.haveDays": "days covered",
  "payload.needDays": "minimum days",
  "payload.windowDays": "furthest back we look (days)",
  "payload.spanDays": "days covered",
  "payload.startAt": "from",
  "payload.endAt": "to",
  "payload.lookbackCapDays": "furthest back we look (days)",
  "payload.nextUsefulTestAt": "next useful test",
  "payload.independentClusters": "separate tests",
  "payload.readingsUsed": "readings used",
  "payload.pairsCompared": "pairs compared",
  "payload.observedSlopeDkhPerDay": "measured drift",
  "payload.supportedSlopeDkhPerDay": "drift we can stand behind",
  "payload.sigmaSDkhPerDay": "uncertainty in that drift",
  "payload.sigmaResidDkh": "scatter around the line",
  "payload.sigmaBaseDkh": "working scatter for this test kit",
  "payload.sigmaPointDkh": "scatter used per reading",
  "payload.consumptionDkhPerDay": "the tank uses",
  "payload.selectedPotencyDkhPerMl": "each millilitre gives",
  "payload.theoreticalDkhPerMl": "each millilitre gives",
  "payload.doseHistoryMeanMlPerDay": "dose",
  "payload.programmedDoseMlPerDay": "dose set on the pump",
  "payload.currentDoseMlPerDay": "current dose",
  "payload.recommendedDoseMlPerDay": "recommended dose",
  "payload.deltaDoseMlPerDay": "change",
  "payload.predictedPostSlopeDkhPerDay": "drift expected after the change",
  "payload.netVolumeL": "net water volume",
  "payload.concentrationGPerL": "solution strength",
  "payload.chemical": "chemical",
  "payload.configVersionId": "settings version",
  "payload.effectiveFrom": "in force from",
  "payload.recommendedAt": "recommended",
  "payload.date": "date",
  "payload.expectedStepDkh": "expected step",
  "payload.changedFraction": "fraction changed",
  "payload.combinedMeasurementCount": "readings in that sitting",
  "payload.repeatClusterWindowMinutes": "readings this close count as one sitting (minutes)",
  "payload.daysToOuterBound": "days to the outer bound at this drift",
  "payload.magnesiumGateState": "magnesium",
  "payload.movementEvidence": "evidence",
  "payload.missingCapabilities": "what the app still needs",
  "payload.affectedOutputs": "what this holds back",
  "payload.deliveryBasis": "how the dose is delivered",
  "payload.segmentId": "stretch of history",

  /* ======================================================================
     PAYLOAD VALUES — contract enums, in words
     ================================================================== */

  "value.CONFIRMED_PROGRAMMED_SCHEDULE": "a confirmed pump schedule",
  "value.CONFIRMED_PUMP_SCHEDULE": "a confirmed pump schedule",
  "value.VERIFIED_DELIVERY": "confirmed delivery figures",
  "value.COMMAND_ONLY": "what the pump was told to do",
  "value.MANUAL": "by hand",
  "value.UNKNOWN": "not known",
  "value.THEORETICAL_ONLY": "your recipe and tank volume",
  "value.THEORETICAL_OR_CONFIGURED": "your recipe and tank volume",
  "value.LEARNED": "measured from past dose changes",
  "value.CALIBRATED": "measured from past dose changes",
  "value.STRONG": "measured from past dose changes, with strong agreement",
  "value.MEASURED_SAME_BATCH": "measured from the same batch",
  "value.INSUFFICIENT": "not enough evidence yet",
  "value.SUFFICIENT": "enough evidence",
  "value.CAPABILITY_GATED": "switched off in this build",
  "value.NOT_RUN": "not worked out",
  "value.WITHHELD": "held back",
  "value.NONE": "none",
  "value.NA2CO3": "sodium carbonate",
  "value.NAHCO3": "sodium bicarbonate",
  "value.ORDINARY": "an ordinary step",
  "value.EXCEPTIONAL": "a larger step",
  "value.ACTUATOR_ROUNDING": "your pump's step size",
  "value.WITHIN_BOUNDS": "inside the safe outer limits",
  "value.BREACHED_LOW": "below the safe lower limit",
  "value.BREACHED_HIGH": "above the safe upper limit",
  "value.IN_RANGE": "in range",
  "value.BELOW_RANGE": "below range",
  "value.ABOVE_RANGE": "above range",
  "value.RISING": "rising",
  "value.FALLING": "falling",
  "value.STABLE": "holding steady",
  "value.UNCERTAIN": "not clear yet",
  "value.INTERPRETABLE": "usable",
  "value.RESOLVED": "settled",



  /* ======================================================================
     THE SUGGESTED TEST
     ----------------------------------------------------------------------
     `docs/implementation/app/TASKS-AND-SCHEDULING.md`, owner-approved
     21 August 2026. The wording is the specification's, near-verbatim,
     because the specification wrote it as copy rather than as a description
     of copy.

     Two things it rules out are visible in what is NOT here: no string names
     the keeper's other test dates ("naming a third date made the choice
     harder to read"), and no string explains the reasoning inline — that is
     the `why.*` block, reached by a link.
     ================================================================== */

  "suggest.title": ({ parameter, day }) => `Test ${parameter} on ${day}`,
  "suggest.becauseDoseChange": "A test then will show whether your dose change worked.",
  "suggest.because": ({ reason }) => reason,
  "suggest.whyLink": ({ day }) => `Why ${day}?`,
  "suggest.howToSchedule": "How would you like to schedule this?",
  "suggest.replace": "Replace my next scheduled test",
  "suggest.replaceRecommended": "recommended",
  "suggest.addExtra": "Add it as an extra test",
  "suggest.remember": "Remember this and don't ask again",
  "suggest.decline": "Not this time",

  "suggest.alreadyScheduled": ({ day }) => `That's already your scheduled test day. Nothing to change.`,
  "suggest.alreadyExtra": "You have already added this as an extra test.",

  "suggest.appliedReplace": ({ day }) => `Your next test moved to ${day}.`,
  "suggest.appliedExtra": ({ day }) => `Added as an extra test on ${day}.`,
  "suggest.appliedByPreference": "Applied without asking, because that is what you asked for.",
  "suggest.changeThat": "Change that",

  "suggest.itemDetail": "The app's suggestion. Accept it or decline it — it is not something to move.",

  /* The reasoning, one tap away. */
  "why.title": ({ day }) => `Why ${day}`,
  "why.selected": "What decided it",
  "why.perDay": "Expected daily shift",
  "why.perDayValue": ({ slope }) => `${slope} dKH a day, after your dose change`,
  "why.howLong": "How far ahead",
  "why.howLongValue": ({ hours }) => `${hours} hours from the assessment`,
  "why.movementTiming": "Time for enough movement",
  "why.movementTimingValue": ({ days }) => `${days} days`,
  "why.limits": "Limits applied",
  "why.candidates": "The timings it weighed",
  "why.candidateSelected": "chosen",
  "why.candidateNotSubmitted": "not submitted",
  "why.candidateAt": ({ day, hours }) => `${day} · about ${hours} hours`,
  "why.notRun": "Timings it could not consider",
  "why.accumulatedUnavailable":
    "How much alkalinity will have moved by then is not shown. The engine states the timing and the daily " +
    "rate but not the accumulated figure, and this screen will not work it out for itself — a second place " +
    "computing that number is exactly the defect this app is built to avoid.",

  "candidate.ROUTINE_CADENCE": "The routine gap between tests",
  "candidate.SIGNAL_ACCUMULATION": "Waiting for enough movement to read",
  "candidate.FORECAST_BOUNDARY_RISK": "How long to a safe limit at this drift",
  "candidate.POST_CHANGE_FIRST": "The first test after a dose change",
  "candidate.POST_CHANGE_SECOND": "The second test after a dose change",
  "candidate.RAPID_MOVEMENT": "The tank is moving quickly",
  "candidate.SAFETY_RETURN_ACTIVE": "A safety action is running",
  "candidate.HIGH_BREACH_FAILSAFE": "Above the safe upper limit",
  "candidate.REPEAT_NOW": "Repeat the last test now",
  "candidate.RETURN_PLAN_EXPIRY": "The return plan",
  "candidate.DETECTABILITY": "Whether a change could be detected",

  /* The setting. It states what is actually happening rather than naming a
     preference, so someone who ticked the box months ago and has forgotten
     can read what it does. */
  "pref.title": "When a test is suggested",
  "pref.currentlyReplace": "Currently: replaces your next scheduled test, without asking.",
  "pref.currentlyExtra": "Currently: added as an extra test, without asking.",
  "pref.currentlyAsk": "Currently: the app asks you each time.",
  "pref.askEachTime": "Ask me each time",

  /* An extra test the keeper accepted. A one-off, not a repeating task. */
  "extra.label": ({ parameter }) => `Test ${parameter}`,
  "extra.detail": ({ day }) => `An extra test you accepted, for ${day}. Not part of your usual rhythm.`,
  "extra.expired": "That extra test has passed and is no longer shown.",

  /* An ask of the app's own. */
  "ask.expiresQuietly":
    "If you never answer, this stops asking after a fortnight and the app carries on treating it as unconfirmed.",

  /* ======================================================================
     THE DECLARED ATTENTION ORDER — why each class sits where it does
     ================================================================== */

  "rank.SAFETY": "A safety return is the only thing that outranks everything else.",
  "rank.ASSESSMENT_ACTION": "A dose the engine is recommending, not yet acted on.",
  "rank.CONFIRMATION_PENDING": "The app does not know whether a recommended change was made.",
  "rank.OVERDUE_TEST": "A test that was due before today.",
  "rank.DUE_TEST": "A test due today.",
  "rank.SUGGESTED_TEST": "The engine's suggested retest — accepted or declined, never rescheduled.",
  "rank.EXTRA_TEST": "An extra test the keeper accepted. A one-off, not part of their rhythm.",
  "rank.OVERDUE_TASK": "A chore that was due before today.",
  "rank.DUE_TASK": "A chore due today.",
  "rank.ASSESSMENT_BLOCKED": "The engine cannot answer and says what would fix it.",
  "rank.RECORD_QUALITY": "Something about the record itself that limits what can be concluded.",

  /* ======================================================================
     ERRORS AND REFUSALS
     ----------------------------------------------------------------------
     Two kinds live together here on purpose.

     Some are messages the keeper reads directly — an empty field, a value
     that is not a number. Some are invariant violations that should never
     happen and, if they do, surface in the crash screen's developer view. The
     second kind is still text a human might read, so it lives here too rather
     than being an exception to the rule.
     ================================================================== */

  "err.exactInstantNeedsBoth":
    "A time needs both a date and a time of day. If the time is not known, record it as date-only — " +
    "there is no path here that supplies one.",
  "err.dateOnlyNeedsDate": "A date-only record still needs a calendar date.",
  "err.provenanceUndeclared": "Both times must carry a declared provenance.",
  "err.provenanceImproved": ({ before, after }) =>
    `Time provenance may not improve in place: ${before} to ${after}. Record a new observation instead; ` +
    "the original never had that precision and must not acquire it.",
  "err.unknownEventKind": ({ kind }) => `Unknown event kind: ${kind}`,
  "err.unknownAnnotation": ({ type }) => `Unknown annotation: ${type}`,
  "err.doseNeedsConfidence": ({ kind }) =>
    `A ${kind} event must say whether its effective time is exact or uncertain. ` +
    `The app does not choose that on the keeper's behalf.`,
  "err.uncertainNeedsBounds":
    "An uncertain effective time needs an earliest and a latest, or there is " +
    "nothing to resume a clean stretch of history after.",
  "err.notRead": "Your records could not be read from this device\u2019s storage.",
  "err.eventNeedsTime": "Every event needs a time with a declared provenance.",
  "err.eventNeedsRecordedAt": "Every event needs a recorded time.",
  "err.recordedAtNotInstant": "The recorded time must be an instant.",
  "err.annotationNeedsTarget": "An annotation must name the event it is about.",
  "err.supersedeMissing": "Cannot supersede an event that is not in the record.",
  "err.annotateMissing": "Cannot annotate an event that is not in the record.",
  "err.idCollision": "Two records were given the same identity. Nothing was saved.",
  "err.assessmentIdExhausted": ({ asOf }) =>
    `Too many assessments were recorded at ${asOf} to give this one its own ` +
    `identity. Nothing has been overwritten.`,
  "err.assessmentExists": ({ id }) => `Assessment ${id} already exists and is not rewritable.`,
  "err.configExists": ({ id }) => `${id} already exists and is not rewritable.`,
  "err.assessNeedsAsOf": "An assessment needs an explicit assessment time — the engine reads no clock.",
  "err.engineNoStart": "The chemistry engine could not start.",
  "err.noCardMatched": "No card matched, and the table has no fallback.",
  "err.couldNotLoad": ({ path, status }) => `Could not load ${path} (${status}).`,
  "err.notStored": "That could not be stored.",
  "err.notRemoved": "That could not be removed.",
  "err.noRoom": "There was no room for that.",
  "err.dbUnusable": "The database is not usable.",
  "err.dbNoIndexedDb": "This browser has no place to store your data.",
  "err.dbTimeout": "Opening the database timed out.",
  "err.dbBlocked": "Another tab is holding the database open.",
  "err.dbMissingStores": "The database is missing its stores.",
  "err.dbCouldNotOpen": "The database could not be opened.",
  "err.offlineNotAvailable": "This part of the app is not available offline yet.",
  "err.offlineIncomplete": ({ list }) =>
    `The offline copy is incomplete, so it was not installed: ${list}`,

  /* ======================================================================
     REASON CODES
     ----------------------------------------------------------------------
     One sentence per code the engine can emit. These are LOOKUPS: the code
     that emits a reason carries no sentence, and no screen writes one.

     They carry no numbers. The payload figures are rendered beside them from
     the payload itself, so a sentence can never disagree with the number it
     sits next to.

     `mockups/CONTRACT-GAPS.md` gaps 4 and 23 record that nobody owns these
     sentences: the package declares codes, owners, severities and payload
     shapes, and no English. They are presentation's, written here, and they
     are not authority for anything. Where a sentence and the canon disagree,
     the canon is right and the sentence is a defect. Those gaps stay open.
     ================================================================== */

  "reason.fallback":
    "The engine gave a reason this build has no plain-English wording for. It is shown in full in the developer view.",

  "reason.CONFIG_VERSION_RESOLVED": "The settings in force at the time of this assessment were used.",
  "reason.CONFIG_HISTORICAL_UNAVAILABLE":
    "The settings that applied back then were not recorded, so older readings cannot be re-read in their own context.",
  "reason.VALIDATION_TIMESTAMP_INVALID": "A record carries a time that could not be read.",
  "reason.VALIDATION_VALUE_NOT_FINITE": "A record carries a value that is not a number.",
  "reason.VALIDATION_RECOMMENDATION_PRECISION_INVALID":
    "The pump step you set is not a usable size, so no rounded recommendation can be given.",

  "reason.EPISODE_RESOLVED": "A testing sitting was identified from your readings.",
  "reason.EPISODE_MEASUREMENTS_COMBINED": "Readings taken close together count as one observation.",
  "reason.OBSERVATION_REPEAT_COMBINED": "Repeats within the same sitting count once.",

  "reason.SEGMENT_SELECTED": "The stretch of history used for this assessment.",
  "reason.SEGMENT_BOUNDARY_DOSE_CHANGE":
    "A dose change ends one stretch of history and starts a clean one.",
  "reason.SEGMENT_BOUNDARY_DELIVERY_ANOMALY":
    "A recorded dosing problem ends one stretch of history and starts a clean one.",
  "reason.SEGMENT_CONFOUNDED_UNKNOWN_CORRECTION":
    "A one-off addition of unknown size sits in this window, so the readings around it cannot carry a trend.",
  "reason.SEGMENT_CONFOUNDED_UNKNOWN_DOSE_TIME":
    "A dose change with an unknown time sits in this window, so the readings around it cannot carry a trend.",
  "reason.SEGMENT_LOOKBACK_NOT_EXTENDED": "The app did not look further back than its usual window.",
  "reason.SEGMENT_NORMALIZATION_UNCERTAINTY_MODEL_UNAVAILABLE":
    "The known step from a water change was taken off the readings, but there is no rule yet for how much " +
    "extra uncertainty that adds.",
  "reason.SEGMENT_NORMALIZED_WATER_CHANGE":
    "A measured water change was taken off the readings that follow it, so it does not read as a trend.",
  "reason.SEGMENT_WC_CONFIDENCE_TIER_NOT_NORMALIZABLE":
    "The replacement water's alkalinity was not measured from the same batch, so its step cannot be taken off the readings.",
  "reason.SEGMENT_WC_MATERIAL_KNOWN_NORMALIZED":
    "The water change was big enough to matter and was measured, so its step was taken off.",
  "reason.SEGMENT_WC_NEGLIGIBLE":
    "The water change would have moved alkalinity by less than the smallest amount worth accounting for, " +
    "so nothing was taken off.",
  "reason.SEGMENT_WC_UNKNOWN_BOUNDARY":
    "A water change of unknown replacement alkalinity was large enough to end this stretch of history.",
  "reason.SEGMENT_WC_UNKNOWN_SUBFLOOR":
    "A water change of unknown replacement alkalinity was small enough to leave the history intact.",

  "reason.DELIVERY_BASIS_PROGRAMMED_SCHEDULE":
    "Your confirmed pump schedule was used as the record of what was dosed.",
  "reason.DELIVERY_BASIS_VERIFIED": "Confirmed delivery figures were used.",
  "reason.DELIVERY_COMMAND_ONLY_UNCONFIRMED":
    "The app knows what was asked for, not what was delivered.",
  "reason.DELIVERY_MIXED_INTEGRATION_NOT_RUN":
    "The dosing record mixes kinds that cannot be added together, so no single figure was used.",
  "reason.DELIVERY_ANOMALY_RECORDED": "A dosing problem is recorded in this window.",

  "reason.EVIDENCE_SUFFICIENT": "Enough separate tests over enough days for an ordinary dose decision.",
  "reason.EVIDENCE_INSUFFICIENT_CLUSTERS": "Not enough separate tests yet.",
  "reason.EVIDENCE_INSUFFICIENT_SPAN": "The tests do not yet cover enough days.",
  "reason.EVIDENCE_INSUFFICIENT_POSTCHANGE_SPAN": "Not enough time has passed since the dose change.",
  "reason.EVIDENCE_PROVISIONAL_TWO_POINT": "Two tests only. A line through two points is provisional.",
  "reason.EVIDENCE_INDEPENDENT_SELECTION_APPLIED":
    "Testing twice in a row does not count as two pieces of evidence.",
  "reason.EVIDENCE_CONFOUNDED_HARD":
    "Something in this window makes the readings unusable for a trend.",
  "reason.EVIDENCE_ANOMALOUS_LATEST_CLUSTER":
    "The most recent reading sits well away from the rest.",
  "reason.EVIDENCE_ANOMALOUS_HISTORICAL_CLUSTER": "An earlier reading sits well away from the rest.",

  "reason.TRAJECTORY_ESTIMATOR_THEIL_SEN":
    "The slope is the middle of every pair of readings, so one odd result cannot drag it.",
  "reason.TRAJECTORY_ESTIMATOR_TWO_POINT":
    "With two readings the slope is simply the line between them.",
  "reason.TRAJECTORY_RISING": "Alkalinity is rising, by more than uncertainty alone can explain.",
  "reason.TRAJECTORY_FALLING": "Alkalinity is falling, by more than uncertainty alone can explain.",
  "reason.TRAJECTORY_STABLE": "Alkalinity is holding steady.",
  "reason.TRAJECTORY_UNCERTAINTY_LIMITED":
    "There is movement, but it is not bigger than the scatter of the tests themselves.",
  "reason.TRAJECTORY_RAPID_CONFIRMED":
    "The last two tests moved fast enough to warrant testing again sooner.",
  "reason.TRAJECTORY_RAPID_NOT_CONFIRMED":
    "Nothing in the recent readings is moving fast enough to bring the next test forward.",

  "reason.UNCERTAINTY_FLOOR_APPLIED":
    "Your readings scattered less than the working floor for an alkalinity test, so the floor was used instead.",
  "reason.UNCERTAINTY_RESIDUAL_DOMINATES":
    "Your readings scattered more than the working floor, so your own scatter was used.",
  "reason.UNCERTAINTY_PAIRWISE_MAD_DIAGNOSTIC_ONLY":
    "A second scatter figure is shown for interest and is not used in any decision.",
  "reason.UNCERTAINTY_TWO_POINT_BASIS":
    "With two readings there is no scatter to measure, so the working floor was used.",
  "reason.UNCERTAINTY_SXX_NOT_POSITIVE":
    "The readings do not spread out in time, so no slope uncertainty can be worked out.",
  "reason.UNCERTAINTY_LIMITED": "The movement is not bigger than the uncertainty in it.",

  "reason.CONSUMPTION_ESTIMATED":
    "What the tank uses per day, from what went in against what the tests show.",
  "reason.CONSUMPTION_NOT_RUN": "The tank's daily use could not be worked out.",
  "reason.CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE":
    "The app has no record of what was being dosed, so it cannot work out what the tank uses.",
  "reason.CONSUMPTION_NOT_RUN_POTENCY_UNAVAILABLE":
    "The app does not know how much one millilitre gives, so it cannot work out what the tank uses.",
  "reason.CONSUMPTION_NEGATIVE_UNCERTAINTY_LIMITED":
    "The figures suggest the tank gained alkalinity, but not by more than the uncertainty, so nothing is concluded.",
  "reason.CONSUMPTION_NON_PHYSICAL_UNEXPLAINED_GAIN":
    "The tank appears to be gaining alkalinity from somewhere the app does not know about.",
  "reason.CONSUMPTION_CONTEXT_CHANGE":
    "Something you recorded suggests the tank's demand itself has changed.",

  "reason.POTENCY_SELECTED_THEORETICAL":
    "Strength per millilitre comes from your recipe and tank volume, not from measurement.",
  "reason.POTENCY_SELECTED_LEARNED":
    "Strength per millilitre comes from what past dose changes actually did.",
  "reason.POTENCY_REQUIRED": "A strength per millilitre is needed and none is available.",
  "reason.POTENCY_THEORETICAL_INPUTS_UNAVAILABLE":
    "The app has not been told the solution recipe or the tank volume, so it cannot work out the strength per millilitre.",
  "reason.POTENCY_LEARNING_CAPABILITY_GATED":
    "The app is not learning your solution's real strength from results. That is off by design in this build.",
  "reason.POTENCY_CALIBRATION_SNAPSHOT_UNAVAILABLE":
    "There is no rule yet for the record a strength calibration would be measured against.",
  "reason.POTENCY_CONFIDENCE_STATE_UNDETERMINED":
    "How much to trust the learned strength cannot be stated.",
  "reason.POTENCY_CONFIDENCE_PROMOTED":
    "There is now enough evidence to trust the learned strength more.",
  "reason.POTENCY_OBSERVATION_RECORDED":
    "A dose change gave a usable reading of the solution's real strength.",
  "reason.POTENCY_SIGNAL_CALIBRATION_ELIGIBLE":
    "That dose change was big enough to measure the solution's strength from.",
  "reason.POTENCY_SIGNAL_DIAGNOSTIC_ONLY":
    "That dose change is informative but too small to calibrate from.",
  "reason.POTENCY_SIGNAL_INELIGIBLE": "That dose change is too small to read anything from.",
  "reason.POTENCY_INELIGIBLE_EVIDENCE_PER_SIDE":
    "There are not enough tests on both sides of that dose change.",
  "reason.POTENCY_INELIGIBLE_INTERRUPTED":
    "That dose change was interrupted before it could be read.",
  "reason.POTENCY_INELIGIBLE_CORRECTION_IN_WINDOW":
    "A one-off addition happened during that window.",
  "reason.POTENCY_INELIGIBLE_CONSUMPTION_CONTEXT_CHANGE":
    "The tank's demand changed during that window.",
  "reason.POTENCY_PLAUSIBILITY_HOLD":
    "The strength this suggests is far enough from the recipe to be held back.",
  "reason.POTENCY_REJECTED_NON_POSITIVE":
    "That dose change implies a strength of zero or less, which cannot be right.",
  "reason.POTENCY_DISCREPANCY_BAND": "How far the measured strength sits from the recipe.",
  "reason.POTENCY_CONTEXT_DISCREPANCY":
    "The solution or setup recorded does not match what was in use.",
  "reason.POTENCY_PROGRAMMED_DOSE_STATE_UNCONFIRMED":
    "The dose in force has not been confirmed, so strength cannot be learned from it.",

  "reason.MAINTENANCE_INCREASE_RECOMMENDED":
    "The dose change that the shortfall we can stand behind justifies.",
  "reason.MAINTENANCE_DECREASE_RECOMMENDED":
    "The dose reduction that the surplus we can stand behind justifies.",
  "reason.MAINTENANCE_HOLD":
    "Nothing worth changing. Holding is the recommendation, not the absence of one.",
  "reason.MAINTENANCE_DOSE_CHANGE": "A change to the maintenance dose.",
  "reason.MAINTENANCE_BASELINE_ESTABLISHMENT":
    "There is no settled dose yet, so this is establishing one.",
  "reason.MAINTENANCE_STEP_CAP_APPLIED":
    "The change was made smaller than the figures alone would suggest, to keep each step modest.",
  "reason.MAINTENANCE_STEP_CAP_50_NOT_UNLOCKED":
    "The larger step size stays locked; this change is within the ordinary limit.",
  "reason.MAINTENANCE_STEP_CAP_50_UNLOCKED":
    "The larger step size is available for this change.",
  "reason.MAINTENANCE_RATE_RAIL_APPLIED":
    "The change was limited so the tank does not move faster than is safe.",
  "reason.MAINTENANCE_TOWARD_RANGE_HOLD":
    "The tank is already heading back toward the range, so the dose is left alone.",
  "reason.MAINTENANCE_ROUNDED_TO_PUMP_STEP": "Rounded to the smallest step your pump makes.",
  "reason.MAINTENANCE_HOLD_STABLE":
    "The tank is holding steady, so there is nothing worth changing.",
  "reason.MAINTENANCE_HOLD_TOWARD_RANGE":
    "The tank is already heading back toward your range, so the dose is left alone.",
  "reason.MAINTENANCE_HOLD_UNCERTAINTY_LIMITED":
    "There is movement, but not more than the tests' own scatter, so no dose change is sized from it.",
  "reason.MAINTENANCE_LIQUID_GUARD_EXCEEDED":
    "The change was limited so that no more liquid goes in per day than is sensible for a tank this size.",
  "reason.MAINTENANCE_NON_NEGATIVE_CLAMP":
    "The figures would give a dose below zero, which cannot be dosed, so the recommendation is held at zero.",
  "reason.MAINTENANCE_NO_ACTION_FROM_BROKEN_MASS_BALANCE":
    "What went in and what the tests show do not add up, so no dose is sized from them.",
  "reason.MAINTENANCE_ROUNDS_TO_CURRENT_DOSE":
    "The change the figures justify is smaller than your pump's step, so it rounds back to the dose you are already on.",
  "reason.MAINTENANCE_STEP_CAP_ORDINARY":
    "The change was made smaller than the figures alone would suggest, to keep each step modest.",
  "reason.MAINTENANCE_STEP_CAP_EXCEPTIONAL":
    "The change was allowed to be larger than an ordinary step, and was still capped.",
  "reason.MAINTENANCE_BRACKET_ADVISORY":
    "How this sits against what the tank has historically needed.",

  "reason.RESPONSE_NOT_ATTRIBUTABLE_SMALL_SIGNAL":
    "The last dose change was too small to tell apart from ordinary variation.",
  "reason.RESPONSE_PRECHANGE_EVIDENCE_INSUFFICIENT":
    "There were not enough tests before the change to compare against.",
  "reason.RESPONSE_AWAITING_DETECTABILITY":
    "Not enough has happened since the change to say whether it worked.",
  "reason.RESPONSE_AWAITING_FORMAL_POST_SLOPE":
    "Waiting for enough tests after the change to draw a line through them.",
  "reason.RESPONSE_CONFOUNDED":
    "Something else happened in the same window, so the change cannot be credited with the result.",
  "reason.RESPONSE_NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME":
    "The time of the dose change is not known, so nothing can be measured from it.",
  "reason.RESPONSE_METRICS_DIAGNOSTIC_ONLY":
    "These figures are shown for interest and are not used to classify the response.",
  "reason.RESPONSE_UNRESOLVED_EXPIRED": "The watching window closed without a verdict.",
  "reason.RESPONSE_OVERSHOOT":
    "The tank crossed a target boundary in the direction you did not want.",
  "reason.RESPONSE_OVERSHOOT_HORIZON_DERIVED":
    "How long overshoot is watched for after a change.",
  "reason.RESPONSE_PARTIAL_BAND_EMPTY":
    "There is no middle band here, so a partial response cannot be distinguished.",
  "reason.RESPONSE_MINIMUM_EXPOSURE_POLICY_UNAVAILABLE":
    "There is no rule yet for how much of a dosing day must have elapsed to count.",

  "reason.INTERVENTION_CREATED": "A dose change is now being watched.",
  "reason.INTERVENTION_EXPIRED": "The watching window for that dose change has closed.",
  "reason.INTERVENTION_INTERRUPTED":
    "Another change happened before the last one could be read.",
  "reason.INTERVENTION_ANCHOR_AMBIGUOUS":
    "It is not clear which dose change a reading belongs to.",
  "reason.INTERVENTION_PREDICTION_SNAPSHOT_STORED":
    "What was expected of this change was recorded at the moment it was made.",
  "reason.INTERVENTION_PREDICTION_SNAPSHOT_UNAVAILABLE":
    "What was expected of that change was never recorded, so it can never be graded.",

  "reason.RETURN_OFFER_AVAILABLE": "A plan to bring the tank back into range is available.",
  "reason.RETURN_OFFER_NOT_ELIGIBLE_TRAJECTORY":
    "A return plan is not offered while the tank is moving the way it is.",
  "reason.RETURN_PLAN_EXPIRY": "The return plan has run its course.",
  "reason.SAFETY_OUTER_BOUND_BREACHED_LOW": "Alkalinity is below the safe lower limit.",
  "reason.SAFETY_OUTER_BOUND_BREACHED_HIGH": "Alkalinity is above the safe upper limit.",
  "reason.SAFETY_RETURN_ACTIVE": "A temporary safety action is in force.",
  "reason.SAFETY_RATE_RAIL_APPLIED": "Held to a safe rate of change.",
  "reason.SAFETY_MG_GATE_UNKNOWN":
    "Magnesium is not being tracked in this build, so it is treated as unknown rather than assumed fine.",

  "reason.RETEST_ROUTINE_CADENCE": "Routine timing, nothing unusual in play.",
  "reason.RETEST_RAPID_MOVEMENT": "Sooner than usual, because the tank is moving quickly.",
  "reason.RETEST_SIGNAL_ACCUMULATION":
    "Timed so that enough movement will have built up to be readable.",
  "reason.RETEST_SIGNAL_ACCUMULATION_NOT_RUN": "Movement-based timing was not worked out.",
  "reason.RETEST_SIGNAL_FLOOR_APPLIED":
    "Not brought forward below the shortest useful gap between tests.",
  "reason.RETEST_OBSERVATION_CEILING_APPLIED":
    "Not pushed out beyond the longest gap the app will leave.",
  "reason.RETEST_FORECAST_BOUNDARY_RISK":
    "Timed against how long it would take to reach a safe limit at this drift.",
  "reason.RETEST_POST_CHANGE_FIRST": "The first test after a dose change.",
  "reason.RETEST_POST_CHANGE_SECOND": "The second test after a dose change.",
  "reason.RETEST_SAFETY_RETURN_ACTIVE": "More frequent while a safety action is running.",
  "reason.RETEST_HIGH_BREACH_FAILSAFE":
    "Frequent testing while alkalinity is above the safe upper limit.",
  "reason.RETEST_REPEAT_NOW": "Repeat the test now — the last result needs confirming.",
  "reason.RETEST_RETURN_PLAN_ASSESSMENT": "Timed against the return plan.",
  "reason.RETEST_DETECTABILITY_POLICY_UNAVAILABLE":
    "One way of timing the next test has no rule yet, so it was not considered.",
  "reason.RETEST_RETURN_PLAN_CADENCE_UNAVAILABLE":
    "Return-plan timing has no rule yet, so it was not considered.",

  "reason.CAPABILITY_SOLUTION_CONTEXT_MISSING":
    "The app has not been told which solution and batch you are dosing.",
  "reason.CAPABILITY_DELIVERY_CONTEXT_MISSING":
    "The app has not been told how the dose is delivered.",
  "reason.CAPABILITY_PROGRAMMED_DOSE_STATE_UNCONFIRMED":
    "The dose currently set on the pump has not been confirmed.",
  "reason.CAPABILITY_HISTORICAL_BRACKET_UNAVAILABLE":
    "There is not enough history to say what this tank normally needs.",
  "reason.CAPABILITY_MAGNESIUM_STATE_UNKNOWN": "Magnesium is not tracked in this build.",
  "reason.CAPABILITY_MEASUREMENT_TIME_IMPRECISE":
    "A reading's time of day is not known, so it cannot enter the trend. It stays in your history.",
  "reason.CAPABILITY_ABSOLUTE_TIME_UNAVAILABLE":
    "A record has no provable time, so elapsed time cannot be worked out from it.",
  "reason.CAPABILITY_DOSE_EFFECTIVE_TIME_UNCERTAIN":
    "The time a dose change took effect is not known exactly.",
  "reason.CAPABILITY_REPLACEMENT_WATER_ALK_MISSING":
    "The alkalinity of the replacement water was not recorded.",
  "reason.CAPABILITY_PREDICTION_SNAPSHOT_MISSING":
    "What was expected of a past dose change was not recorded.",
  "reason.CAPABILITY_HISTORICAL_CONFIGURATION_UNAVAILABLE":
    "The settings that applied at the time were not recorded.",
  "reason.CAPABILITY_POTENCY_LEARNER_GATED":
    "Learning the solution's real strength is switched off in this build.",

  "reason.OUTPUT_HOLD_IS_A_RECOMMENDATION":
    "Holding the dose is the recommendation here, not the absence of one.",
  "reason.OUTPUT_INSUFFICIENT_DATA_ACTIONABLE":
    "Even without enough for a dose decision, what is known is stated above.",
  "reason.OUTPUT_CONFIDENCE_UNSPECIFIED":
    "No numeric confidence label. That is a decided answer, not a missing rule — no such number exists and " +
    "none may be invented. The evidence facts above stand in its place.",
  "reason.AUDIT_TRACE_WRITTEN": "The full working behind this assessment was recorded.",
  "reason.MIGRATION_ALK_ONLY_RUNTIME":
    "This build assesses alkalinity only. Everything else is logged, charted and scheduled, and not assessed.",
  "reason.MIGRATION_MG_GATE_ISOLATED":
    "Magnesium has no engine yet, so it never influences an alkalinity answer.",
});

/* --------------------------------------------------------------------------
   The lookup.

   A missing key is a defect, and it presents as one: the key itself, wrapped
   so it is unmistakably wrong on screen. Returning an empty string would hide
   the defect behind a blank, which is the failure mode this project has ruled
   out everywhere else and applies here too.
   ------------------------------------------------------------------------ */

export function t(key, params) {
  const entry = STRINGS[key];
  if (entry === undefined) return `⟨missing string: ${key}⟩`;
  if (typeof entry === "function") return entry(params || {});
  return entry;
}

/* Does a key exist? Used by the lookups that fall back to a general sentence
   when a specific one has not been written — a reason code the engine adds
   before this file catches up, for instance. */
export function has(key) {
  return Object.prototype.hasOwnProperty.call(STRINGS, key);
}

/* The keys, for the test that checks every reason code the engine can emit has
   a sentence here. */
export function keys() {
  return Object.keys(STRINGS);
}
