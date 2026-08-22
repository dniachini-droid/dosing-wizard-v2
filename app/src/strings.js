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
  "entry.detail.origin": "Where this came from",
  "entry.origin.here": "Entered in this app",
  "entry.origin.keeper": "Your own records, brought across from the old app",
  "entry.origin.unconfirmed": "Brought across from the old app — unconfirmed",
  "entry.origin.configuration": "Settings brought across from the old app",
  "entry.origin.unconfirmedHead": "It is not certain this one is yours.",
  "entry.origin.unconfirmedBody":
    "The review of your old app found records like this identical to values that shipped inside the app " +
    "itself. It is kept either way, and marked, rather than quietly counted as something you recorded.",

  "entry.reconstructed.head": "This time was worked out, not recorded.",
  "entry.reconstructed.body": ({ zone, date }) =>
    `The old app stored the time of day and not the timezone. You said on ${date} that these readings were ` +
    `taken in ${zone}, and that is what the exact moment here was worked out from — including which side of ` +
    `a daylight-saving change the date falls on.`,
  "entry.reconstructed.note":
    "If that is wrong, this reading's exact moment is wrong with it. The date, the time of day and the value " +
    "are unaffected — they are what your file recorded.",

  "time.describe.exact": "Date and time recorded",
  "time.describe.dateOnly": "Date only — the time of day was not recorded",
  "time.describe.local": "Time of day recorded, but the timezone it was in is not known",
  "time.describe.reconstructed": "Time reconstructed from evidence recorded at the time",
  "time.describe.none": "No time recorded",
  "time.fmt.dateOnly": ({ date }) => `${date} · time of day not recorded`,
  "time.fmt.localOnly": ({ date, time }) => `${date} ${time} · timezone not recorded`,

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
  /* ======================================================================
     THE INTERACTIVE CHART
     ================================================================== */

  "chart.hint": "Pinch to zoom · drag to pan · double-tap to reset",
  "chart.reset": "Reset",
  "chart.nothingHere": "Nothing in this part of the range.",
  "chart.openEntry": "tap again to open it",
  "chart.aria": ({ label, unit, n, from, fromDate, to, toDate }) =>
    `${label} chart, ${n} readings in ${unit || "no unit"}, from ${from} on ${fromDate} to ${to} on ${toDate}.`,
  "chart.point.aria": ({ label, value, unit, date }) => `${label} ${value} ${unit} on ${date}`,

  /* ==================================================================
     ONE TEST, RUN MORE THAN ONCE
     ------------------------------------------------------------------
     Measurements of one parameter taken within half an hour are one test
     run several times, and the figure everything is worked out from is
     the middle one of them. The keeper is entitled to see both: the
     values he actually typed, and which of them was used.

     The middle value is deliberate and is not the average. One fumbled
     titration drags an average and does not move the middle one, which
     is exactly what a keeper wants from a repeat test.
     ================================================================== */
  "group.duplicate": ({ value, unit }) =>
    `Two tests taken within half an hour, so they are treated as one test run in duplicate. `
    + `The value used is ${value}${unit ? ` ${unit}` : ""}.`,
  "group.triplicate": ({ value, unit }) =>
    `Three tests taken within half an hour, so they are treated as one test run in triplicate. `
    + `The value used is ${value}${unit ? ` ${unit}` : ""}.`,
  "group.many": ({ count, value, unit }) =>
    `${count} tests taken within half an hour, so they are treated as one test run ${count} times over. `
    + `The value used is ${value}${unit ? ` ${unit}` : ""}.`,
  "group.median": "The middle value is the one used, not the average, so one wild result does not move it.",
  "group.spread": ({ spread, unit }) =>
    `They ranged ${spread}${unit ? ` ${unit}` : ""} apart.`,
  "group.wideSpread": ({ spread, unit }) =>
    `They ranged ${spread}${unit ? ` ${unit}` : ""} apart, which is wider than repeats of one test usually sit. `
    + `Worth running it again.`,
  "group.badgeShort": ({ count }) => `${count} tests`,
  "group.legend.measurement": "each test",
  "group.legend.used": "the value used",
  "group.aria": ({ count, value, unit, date }) =>
    `A test run ${count} times on ${date}; the value used is ${value}${unit ? ` ${unit}` : ""}`,

  "err.assumedNeedsOffset":
    "A time built from an assumption needs the offset that was assumed. Without one there is nothing to " +
    "build it from.",
  "err.assumptionNeedsRecord":
    "A time built from an assumption has to carry the assumption. A record that claims the stronger " +
    "precision without saying what was assumed is the thing this rule exists to prevent.",

  "err.chartNeedsLabel":
    "A chart must be told which parameter it is drawing. This one was not, which is the defect carried over " +
    "from the old app.",
  "err.chartNeedsUnit":
    "A chart must be told what unit it is drawing in. An empty unit is a real answer; leaving it out is not.",

  "history.legend.yourRange": ({ min, max, unit }) => `your range, ${min}–${max} ${unit}`,
  "history.legend.noTime": ({ n }) => `${n} with no time of day`,
  "history.legend.noZone": ({ n }) => `${n} with a time but no timezone`,
  "history.entry.noTime": " · no time of day, so it cannot enter a trend",
  "history.entry.noZone": " · the timezone was not recorded, so it cannot enter a trend",
  "history.boundary.mark": "dosing",
  "history.boundary.note": ({ date }) =>
    `Records of what was being dosed start on ${date}. Readings before that are yours and are real; what was ` +
    `going into the tank between them is simply not written down, so how much the tank was using cannot be ` +
    `worked out from that period.`,

  "history.chart.aria": ({ label, unit, days, n }) =>
    `${label} in ${unit || "no unit"}, over the last ${days} days, ${n} observations.`,
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

  /* ==========================================================================
     THE DOSING TAB
     --------------------------------------------------------------------------
     Written by `jake` for this tab, on the engine's real output for the owner's
     tank, with authority to settle the wording. Applied as written.

     Three conventions hold across every string below, and the call sites obey
     them:

       - PROSE NEVER PRINTS A MINUS SIGN. A slope is a magnitude and the
         direction is a word: "falling 0.030 dKH a day". Box values may keep the
         sign; sentences may not.
       - In prose, "a day". In box values, "dKH/day".
       - Rounding belongs to the call site: dKH 2 dp, mL/day 2 dp,
         dKH/day 3 dp, percentages whole.
     ====================================================================== */

  /* ---- the three summary boxes ---------------------------------------- */
  "dosing.summary.alk": "Alkalinity",
  "dosing.summary.ca": "Calcium",
  "dosing.summary.mg": "Magnesium",
  /* Stands alone by design. No sub-line, no "coming soon", no last value
     dressed up as a status — the box says the one true thing and stops. */
  "dosing.summary.noEngine": "No engine yet",

  /* ---- the wide status box --------------------------------------------
     Rendered `{value} · {position} · {trend}`. Every one of the three phrases
     names its own subject, so any two can be read alone: "not clear yet" on
     its own was the defect this replaces. Safety says nothing here. */
  "dosing.status.value": ({ value }) => `${value} dKH`,
  "dosing.status.join": ({ parts }) => parts.join(" · "),

  "dosing.status.pos.below": "below your range",
  "dosing.status.pos.in": "in your range",
  "dosing.status.pos.above": "above your range",
  "dosing.status.pos.unknown": "not placed against your range",

  "dosing.status.trend.falling": ({ slope }) => `alkalinity falling ${slope} dKH a day`,
  "dosing.status.trend.rising": ({ slope }) => `alkalinity rising ${slope} dKH a day`,
  "dosing.status.trend.flat": "alkalinity holding steady",
  "dosing.status.trend.uncertain": "no clear alkalinity trend yet",
  "dosing.status.trend.fallingPlain": "alkalinity falling",
  "dosing.status.trend.risingPlain": "alkalinity rising",

  "dosing.status.measured": ({ date, time }) => `Measured ${date} at ${time}`,
  "dosing.status.measuredDateOnly": ({ date }) => `Measured ${date} · time of day not recorded`,
  "dosing.status.noReading": "No alkalinity reading yet",
  "dosing.status.noReadingSub": "Log a test and this box fills in.",

  /* ---- the recommendation, as prose -----------------------------------
     Where a verdict on the last change exists it is the FIRST sentence of the
     body, under the headline and before the arithmetic: "did the last thing I
     did work?" is the question a keeper arrives with. It never becomes its own
     headline — the headline is always the action. */

  "dosing.reco.increase.head": ({ dose }) => `Increase to ${dose} mL/day`,
  "dosing.reco.increase.where": ({ value, slope }) =>
    `Alkalinity is ${value} dKH, below your range, and falling ${slope} dKH a day. `,
  "dosing.reco.increase.gap": ({ consumption, current, supplied, gap }) =>
    `Your tank is using ${consumption} dKH a day and ${current} mL/day supplies ${supplied} — ` +
    `about ${gap} dKH a day short. `,
  "dosing.reco.increase.step": ({ delta, effect }) =>
    `Another ${delta} mL/day adds ${effect} dKH a day. `,
  /* Not decoration. Without it the screen shows a 0.030 shortfall and a step
     that closes half of it, and looks like an arithmetic error. */
  "dosing.reco.increase.sizedFrom": ({ supported, observed }) =>
    `The step is sized from ${supported} dKH a day, the part of the ${observed} the readings can ` +
    `actually stand behind, so it is deliberately smaller than the raw drift would suggest. `,
  "dosing.reco.increase.after": ({ postSlope }) =>
    `That should leave alkalinity falling about ${postSlope} dKH a day instead.`,
  "dosing.reco.increase.afterLevel": "That should bring alkalinity close to level.",

  "dosing.reco.decrease.head": ({ dose }) => `Reduce to ${dose} mL/day`,
  "dosing.reco.decrease.where": ({ value, slope }) =>
    `Alkalinity is ${value} dKH, above your range, and rising ${slope} dKH a day. `,
  "dosing.reco.decrease.whereIn": ({ value, slope }) =>
    `Alkalinity is ${value} dKH, in your range, and rising ${slope} dKH a day. `,
  "dosing.reco.decrease.gap": ({ consumption, current, supplied, gap }) =>
    `Your tank is using ${consumption} dKH a day and ${current} mL/day supplies ${supplied} — ` +
    `about ${gap} dKH a day more than it needs. `,
  "dosing.reco.decrease.step": ({ delta, effect }) =>
    `Taking ${delta} mL/day off removes ${effect} dKH a day. `,
  "dosing.reco.decrease.sizedFrom": ({ supported, observed }) =>
    `The step is sized from ${supported} dKH a day, the part of the ${observed} the readings can ` +
    `actually stand behind, so it is deliberately smaller than the raw drift would suggest. `,
  "dosing.reco.decrease.after": ({ postSlope }) =>
    `That should leave alkalinity rising about ${postSlope} dKH a day instead.`,
  "dosing.reco.decrease.afterLevel": "That should bring alkalinity close to level.",

  "dosing.reco.hold.head": ({ dose }) => `Hold at ${dose} mL/day`,
  "dosing.reco.hold.matching": ({ consumption, supplied }) =>
    `Your tank is using ${consumption} dKH a day and your dose supplies ${supplied}. ` +
    `The dose is matching consumption. `,
  "dosing.reco.hold.withinVariation": ({ slope }) =>
    `Alkalinity is moving ${slope} dKH a day, which is within normal test variation. ` +
    `Nothing that small can be told apart from the tests themselves. `,
  "dosing.reco.hold.towardRange": ({ value }) =>
    `Alkalinity is ${value} dKH and already heading back toward your range on the dose you are on. ` +
    `Adding to it now would push past the far side. `,
  "dosing.reco.hold.roundsToCurrent": ({ rawDelta, step }) =>
    `The figures justify ${rawDelta} mL/day, and your pump moves in steps of ${step} mL. ` +
    `That rounds back to the dose you are already on. `,
  "dosing.reco.hold.isARecommendation":
    "A hold is a recommendation. The app looked and found nothing worth changing.",

  "dosing.reco.verdict.worked": ({ date, from, to, slopeBefore, slopeSince }) =>
    `The change you made on ${date}, from ${from} to ${to} mL/day, worked: alkalinity was falling ` +
    `${slopeBefore} dKH a day before it and is ${slopeSince} a day since. `,
  "dosing.reco.verdict.workedRising": ({ date, from, to, slopeBefore, slopeSince }) =>
    `The change you made on ${date}, from ${from} to ${to} mL/day, worked: alkalinity was rising ` +
    `${slopeBefore} dKH a day before it and is ${slopeSince} a day since. `,
  "dosing.reco.verdict.partly": ({ date, from, to, slopeBefore, slopeSince }) =>
    `The change you made on ${date}, from ${from} to ${to} mL/day, moved things the right way but ` +
    `not far enough: ${slopeBefore} dKH a day before it, ${slopeSince} a day since. `,
  "dosing.reco.verdict.didNot": ({ date, from, to, expected, slopeSince }) =>
    `The change you made on ${date}, from ${from} to ${to} mL/day, did not do what it was meant to. ` +
    `It predicted ${expected} dKH a day and the readings since show ${slopeSince}. ` +
    `What follows is sized from what actually happened, not from what was expected. `,
  "dosing.reco.verdict.tooEarly": ({ date, from, to }) =>
    `Too early to say whether the change you made on ${date}, from ${from} to ${to} mL/day, worked — ` +
    `not enough has happened since it to tell its effect apart from ordinary test variation. `,
  "dosing.reco.verdict.tooEarlyWhen": ({ date }) => `A test on or after ${date} should settle it. `,
  "dosing.reco.verdict.confounded": ({ date }) =>
    `The change you made on ${date} cannot be graded. Something else happened in the same window, ` +
    `and the app will not credit the change with a result that may not be its. `,
  "dosing.reco.verdict.unknownTime": ({ date }) =>
    `The change recorded on ${date} cannot be graded, because the time it took effect is not known. ` +
    `Nothing can be measured from a moment the app does not have. `,
  "dosing.reco.verdict.expired":
    "The watching window on the last change closed without a verdict. It is not counted either way. ",

  /* No "you need 4 readings over 5 days" anywhere below. Evidence minima are
     canon's, and a sentence here asserting one would be a chemistry rule
     living in the strings file. */
  "dosing.reco.fresh.head": "Not enough yet to size a dose",
  "dosing.reco.fresh.body": ({ n }) =>
    `You have ${n} alkalinity reading${n === 1 ? "" : "s"} recorded. Keep logging tests as you do them, ` +
    `and tell the app what your pump is set to — those two things are all it needs. ` +
    `The recommendation appears here on its own when your readings can carry one.`,
  "dosing.reco.fresh.bodyNone":
    "No alkalinity readings are recorded yet. Log tests as you do them, and tell the app what your " +
    "pump is set to — those two things are all it needs. The recommendation appears here on its own " +
    "when your readings can carry one.",
  "dosing.reco.fresh.nothingWrong":
    "Nothing is wrong and there is nothing to fix. A dose sized from one or two readings would be a " +
    "guess with a decimal point on it.",
  "dosing.reco.fresh.needsFacts": ({ list }) => `The app also has not been told: ${list}.`,

  "dosing.reco.note":
    "This is what is recommended. The app cannot see your pump and does not record the change as made " +
    "until you say so.",
  "dosing.reco.showWorking": "Show working",
  "dosing.reco.why": "Why?",
  "dosing.reco.changeAnyway": "Change the dose anyway",
  "dosing.reco.setDose": ({ dose }) => `Set the dose to ${dose}`,

  /* ---- the three boxes -------------------------------------------------
     "Current calculated consumption" became "What your tank uses": "calculated"
     is the app talking about itself, and the sub-line already says where the
     figure came from. */
  "dosing.boxes.uses": "What your tank uses",
  "dosing.boxes.usesSub": "dKH/day, from your readings and what was dosed",
  "dosing.boxes.supplies": "What your dose supplies",
  "dosing.boxes.suppliesSub": ({ dose, potency }) =>
    `dKH/day, from ${dose} mL/day at ${potency} dKH per mL`,
  "dosing.boxes.difference": "The difference",

  "dosing.boxes.diff.short": ({ gap }) => `${gap} dKH/day short`,
  "dosing.boxes.diff.shortSub": "your dose supplies less than the tank uses",
  "dosing.boxes.diff.excess": ({ gap }) => `${gap} dKH/day in excess`,
  "dosing.boxes.diff.excessSub": "your dose supplies more than the tank uses",
  "dosing.boxes.diff.matching": "dosing is matching consumption",
  "dosing.boxes.diff.matchingSub": "no difference the readings can show",

  "dosing.boxes.notWorkedOut": "Not worked out",
  "dosing.boxes.notWorkedOutSub": ({ missing }) => `needs ${missing}`,

  /* ---- the potency estimator ------------------------------------------- */
  "dosing.potency.title": "Your solution's real strength",
  "dosing.potency.agrees": ({ periods, learned, entered }) =>
    `Your tank's response across ${periods} dosing periods puts the real effect at about ${learned} dKH ` +
    `per mL, against the ${entered} you entered, which agrees closely.`,
  "dosing.potency.differsSome": ({ periods, learned, entered, pct }) =>
    `Your tank's response across ${periods} dosing periods puts the real effect at about ${learned} dKH ` +
    `per mL, against the ${entered} you entered — ${pct}% apart. Worth watching; the app is still using ` +
    `the figure you entered and will not overwrite it.`,
  "dosing.potency.differsALot": ({ periods, learned, entered, pct }) =>
    `Your tank's response across ${periods} dosing periods puts the real effect at about ${learned} dKH ` +
    `per mL, against the ${entered} you entered — ${pct}% apart, which is a real disagreement. ` +
    `Check the recipe, the batch and your net water volume; one of those three is usually behind it. ` +
    `The app is still using the figure you entered and will not overwrite it.`,
  "dosing.potency.notYet": ({ entered }) =>
    `Not enough yet to check your solution against your tank. That needs readings either side of a dose ` +
    `change big enough to read the response from. Until then every figure here is built on the ` +
    `${entered} dKH per mL you entered.`,
  /* The one that ships wherever `potencyLearningState` is
     `CAPABILITY_GATED` — which is this whole build, since potency learning is
     gated on `M-2`, `M-3` and `M-9`. `notYet` would be a lie of omission
     there: it implies the check arrives with more data, and it will not. */
  "dosing.potency.off": ({ entered }) =>
    `This build does not check your solution's strength against your tank — that is switched off by ` +
    `design, not missing. Every figure here is built on the ${entered} dKH per mL you entered.`,

  /* ---- show working ----------------------------------------------------
     Arithmetic and nothing else. No footer note, no restatement of the
     recommendation, no list of rules that did not fire. */
  "dosing.working.uses": "What your tank uses",
  "dosing.working.movement": "The movement we can stand behind",
  "dosing.working.dose": "The dose",
  "dosing.working.readings": "The readings used",

  "dosing.working.uses.falling": ({ dose, potency, supplied, slope, consumption }) =>
    `${dose} mL/day at ${potency} dKH per mL puts in ${supplied} dKH a day. Your readings fell ` +
    `${slope} dKH a day over the same stretch. The tank used both: ${supplied} + ${slope} = ` +
    `${consumption} dKH a day.`,
  "dosing.working.uses.rising": ({ dose, potency, supplied, slope, consumption }) =>
    `${dose} mL/day at ${potency} dKH per mL puts in ${supplied} dKH a day. Your readings rose ` +
    `${slope} dKH a day over the same stretch, so the tank used less than went in: ${supplied} − ` +
    `${slope} = ${consumption} dKH a day.`,
  "dosing.working.uses.flat": ({ dose, potency, supplied, consumption }) =>
    `${dose} mL/day at ${potency} dKH per mL puts in ${supplied} dKH a day, and your readings held ` +
    `level, so the tank used what went in: ${consumption} dKH a day.`,
  "dosing.working.uses.doseFrom": ({ dose }) =>
    `The ${dose} mL/day is the schedule you told the app your pump is running.`,
  /* Must not claim the figure was derived from a recipe the app does not hold:
     `POTENCY_SELECTED_THEORETICAL`'s payload carries `chemical` and
     `concentrationGPerL` as UNKNOWN whenever the keeper stated a potency
     directly. "The figure you entered" is what is true. */
  "dosing.working.uses.potencyFrom": ({ potency }) =>
    `The ${potency} dKH per mL is the figure you entered at setup, not one measured from this tank.`,

  "dosing.working.movement.line": ({ observed, margin, supported }) =>
    `Your readings drift ${observed} dKH a day. ${margin} of that is inside the uncertainty of the ` +
    `readings themselves, and it is taken off rather than assumed away: ${observed} − ${margin} = ` +
    `${supported} dKH a day. Only that second figure sizes a dose change.`,
  /* Pre-empts the keeper who works out first-minus-last and gets a different
     number. The counts ("n=10, 45 pairwise slopes") are method trivia and go. */
  /* The drift, with what it was drawn from. Finding 14: a bare "0.00" tells a
     keeper nothing about how much history stands behind it. */
  "dosing.working.movement.drawnFrom": ({ observed, n, span }) =>
    `Your readings drift ${observed} dKH a day, across ${n} readings over approximately ${span}.`,

  "dosing.working.movement.method":
    "The drift is the middle of every pair of your readings, so one odd result cannot drag it.",
  "dosing.working.movement.floor": ({ scatter, floor }) =>
    `Your readings scattered ${scatter} dKH, less than the ${floor} an alkalinity test is worked to, ` +
    `so ${floor} was used instead. That is why the figure taken off is larger than your own scatter.`,

  "dosing.working.dose.line": ({ supported, potency, rawDelta, step, delta, current, dose }) =>
    `Closing ${supported} dKH a day at ${potency} dKH per mL needs ${rawDelta} mL/day. Your pump ` +
    `moves in steps of ${step} mL, so that rounds to ${delta}: ${current} + ${delta} = ${dose} mL/day.`,
  "dosing.working.dose.lineDown": ({ supported, potency, rawDelta, step, delta, current, dose }) =>
    `Removing ${supported} dKH a day at ${potency} dKH per mL needs ${rawDelta} mL/day. Your pump ` +
    `moves in steps of ${step} mL, so that rounds to ${delta}: ${current} − ${delta} = ${dose} mL/day.`,
  "dosing.working.dose.after": ({ dose, postSlope, observed }) =>
    `At ${dose} mL/day the tank should drift about ${postSlope} dKH a day instead of ${observed}.`,
  "dosing.working.dose.capped": ({ uncapped, dose }) =>
    `The figures alone gave ${uncapped} mL/day. Each step is kept modest, so the recommendation is ` +
    `${dose}.`,

  "dosing.working.readings.line": ({ n, span, first, last }) =>
    `${n} readings over approximately ${span}, from ${first} to ${last}.`,
  "dosing.working.readings.lineOne": ({ first }) => `One reading, on ${first}.`,

  "dosing.working.excluded.tooClose": ({ date }) =>
    `The ${date} reading wasn't used — it was taken too close to the one before it.`,
  "dosing.working.excluded.noTime": ({ date }) =>
    `The ${date} reading wasn't used — it has a date but no time of day, so the gap to the next one ` +
    `isn't a known length of time. It stays in your history.`,
  "dosing.working.excluded.invalid": ({ date }) =>
    `The ${date} reading wasn't used — you marked it invalid.`,
  "dosing.working.excluded.beforeChange": ({ date }) =>
    `Readings before ${date} weren't used — the dose changed then, and the stretch starts clean.`,
  "dosing.working.excluded.confounded": ({ from, to }) =>
    `Readings between ${from} and ${to} weren't used — something happened in that window that the ` +
    `trend can't be read through.`,

  /* Days in words, to the nearest half day. Never "4.99 days". */
  "dosing.span.halfDay": "half a day",
  "dosing.span.oneDay": "one day",
  "dosing.span.oneAndHalf": "a day and a half",
  "dosing.span.word": ({ word }) => `${word} days`,
  "dosing.span.wordAndHalf": ({ word }) => `${word} and a half days`,
  "dosing.span.numeric": ({ n }) => `${n} days`,

  /* ---- when the app cannot state anything ------------------------------
     The button reads "Why?", and the panel names what is missing and stops.
     More than two missing items is not a wording problem, it is the setup
     screen; the panel links there rather than listing five nouns. */
  "dosing.why.oneMissing": ({ a }) => `One thing is missing: ${a}.`,
  "dosing.why.twoMissing": ({ a, b }) => `Two things are missing: ${a} and ${b}.`,
  "dosing.why.manyMissing": "Several things are still missing. Setup lists them.",
  "dosing.why.nothingElse": "Nothing else is holding this up.",

  "dosing.why.item.readings": "more alkalinity readings, a few days apart",
  "dosing.why.item.doseState": "what your pump is set to",
  "dosing.why.item.potency": "how much one millilitre of your solution raises this tank",
  "dosing.why.item.volume": "your net water volume",
  "dosing.why.item.range": "the target range you are aiming to hold",
  "dosing.why.item.pumpStep": "the smallest step your pump makes",
  "dosing.why.item.doseTime": "when the last dose change actually took effect",
  "dosing.why.item.time": ({ date }) => `a test on or after ${date}`,

  /* ---- the severity pills ----------------------------------------------
     `INFO`, `LIMITING` and `BLOCKING` are programming language. Each pill below
     answers one question — what did this do to the answer? — so the three read
     as a scale a keeper can order at a glance. "Limited this" also already
     exists in the app's voice (`assessment.missing.limits`), so the tab is not
     inventing a second dialect. */
  "dosing.pill.info": "No effect",
  "dosing.pill.limiting": "Limited this",
  "dosing.pill.blocking": "Stopped this",

  /* ---- correction in progress ------------------------------------------ */
  /* ---- the change you made, and what came of it ------------------------
     Replaces the old "correction in progress" panel. That panel had one thing
     to say — a date — and `retest.recommendedAt` returns the assessment
     instant itself once a test is due, so on the day the keeper tested it told
     him the next useful test was that day (finding 12).

     The engine has known the answer all along: `responseAssessment`
     classification, `classificationIsTerminal`, and `postClusters`. Every
     string below is a sentence for a state the engine named. None of them
     counts readings, compares anything to a minimum or decides when enough has
     happened — `AWAITING_FORMAL_POST_SLOPE` is the engine saying that, not a
     sentence here working it out (canon `X-INV-004`).

     The panel is one strip, read top to bottom:
         title · body (the change) · state · next test · new dose · close
     Only the state line changes between states, and every state has one. */

  /* Was "Correction in progress", which is false the moment the engine
     reaches a terminal class — and four of the eight states below are terminal
     on arrival. The title has to survive "the change worked" and "this cannot
     be graded" as comfortably as it survives the waiting, so it names the
     subject and says nothing about status. Status is the state line's job. */
  "dosing.correction.title": "The change you made",

  /* The old body ended "...and the app is watching what alkalinity does next",
     which is a status claim inside the line that names the change. It is wrong
     in every terminal state and it duplicated the state line in the rest, so
     it has gone. This line now does one thing: says what was changed, when. */
  "dosing.correction.body": ({ date, from, to }) =>
    `You changed the dose on ${date}, from ${from} to ${to} mL/day.`,

  "dosing.correction.ends":
    "This ends on its own — when the dose settles, or when a new change starts a new one. " +
    "There is nothing here to cancel.",

  /* ---- the state line, one per `state` the presenter returns ------------ */

  "dosing.correction.waiting":
    "Nothing has been tested since, so there is nothing to read yet.",

  /* Two forms, and both are needed: `postClusters` is only in the payload of
     `AWAITING_FORMAL_POST_SLOPE`. `AWAITING_DETECTABILITY` and `INCONCLUSIVE`
     map to this same state and carry no count, so `posts` arrives null and the
     plain form is what renders. A count invented to fill it would be a number
     the engine did not give. */
  "dosing.correction.tooEarly": ({ posts }) =>
    posts === 1
      ? "Still too early to say — one test in since the change."
      : `Still too early to say — ${posts} tests in since the change.`,
  "dosing.correction.tooEarlyPlain": "Still too early to say.",

  /* `EXPECTED` says the response matched the prediction the app made at the
     moment of the change. It does not say the dose now matches consumption —
     that is the recommendation's statement, and it is made on this tab by the
     hold. This sentence claims the first and not the second. */
  "dosing.correction.worked":
    "The change worked. Alkalinity moved by about as much as the app predicted, " +
    "so there is nothing more to watch here.",

  "dosing.correction.partial":
    "It moved alkalinity the right way, but not as far as the change predicted.",

  /* `OVER_RESPONSE` — the response was larger than predicted. That is not the
     same thing as alkalinity crossing your range, which is the separate
     overshoot event and has its own line elsewhere on the card. The sentence
     stays on the response so the two are not read as one. */
  "dosing.correction.overshot":
    "Alkalinity moved further than the change predicted.",

  "dosing.correction.noMovement":
    "The readings since show no movement the app can tell apart from ordinary " +
    "test variation.",

  "dosing.correction.wrongWay":
    "Alkalinity has gone the opposite way to the change.",

  /* One sentence, and it must not leave the keeper waiting. Every state
     mapped here is terminal — confounded, interrupted, the change time not
     known, too little evidence before the change, or a signal smaller than the
     scatter it would have to be read out of. More readings genuinely cannot
     rescue any of them, and the second clause is there to say so. */
  "dosing.correction.cannotTell":
    "This change cannot be graded, and more readings will not change that.",

  /* ---- the next test, in its two forms ---------------------------------- */

  "dosing.correction.nextTest": ({ date }) => `The next useful test is ${date}.`,

  /* THE FIX, and the reason this one is a plain string and not a function of
     a date. When a test is already due the engine submits the assessment
     instant itself, so any date rendered here is today's — which is exactly
     what told the keeper on 22 August that the next useful test was 22 August,
     after he had tested. Taking no argument makes rendering a date here
     impossible rather than merely discouraged. */
  "dosing.correction.nextTestNow": "The next useful test is due now.",

  /* ---- what to do about a conclusion ------------------------------------ */

  /* Offered on `partial` and `overshot`, where the engine has already sized a
     different dose from what actually happened. */
  "dosing.correction.newDose": ({ dose }) =>
    `The app has a new dose for you, sized from what actually happened: ${dose} mL/day.`,

  /* Shown only on a terminal panel. Not "Close": what is being put away is the
     conclusion, not the box — delete the reading the conclusion rested on and
     the engine reclassifies, the signature stops matching and this panel comes
     back saying what it said before. "Done with this" is true of that; "Close"
     would imply the keeper had disposed of something permanent.
     `dosing.correction.ends` belongs to the non-terminal panel and is not
     shown next to this control — it says there is nothing here to cancel. */
  "dosing.correction.close": "Done with this",

  /* ---- the potency estimator ------------------------------------------- */

  "dosing.potency.title": "Your solution's real strength",

  /* Nothing to estimate from yet. Says what it is waiting for rather than
     "not enough data": the keeper can supply a dose change and readings either
     side of it, and cannot supply "more data". */
  "dosing.potency.notYet": ({ entered }) =>
    `Not enough yet to check your solution against your tank. That needs readings either side of a ` +
    `dose change big enough to read the response from. Until then every figure here is built on the ` +
    `${entered} dKH per mL you entered.`,

  /* An estimate exists and is not settled enough to act on. It is still shown
     — hiding a figure the app holds is how the keeper stops trusting the box —
     but no buttons are offered beside it, and the sentence says which way that
     will resolve rather than leaving it hanging. */
  "dosing.potency.notConfident": ({ learned, entered }) =>
    `Your tank's response puts the real effect at about ${learned} dKH per mL, against the ` +
    `${entered} you entered. That is not settled enough to act on yet, so the app is still using ` +
    `your figure. More dose changes will either confirm it or move it.`,

  /* Owner-approved wording, from finding 13, as written. */
  "dosing.potency.agrees": ({ learned, entered }) =>
    `Your tank's response puts the real effect at about ${learned} dKH per mL, against the ` +
    `${entered} you entered. That agrees closely.`,

  /* Owner-approved wording, from finding 13, as written — and it names a
     recipe, so it may only be used where the app actually holds one. Where the
     keeper typed a dKH per mL figure straight in there is no recipe to be
     stronger than, and the `...Stated` pair is what renders there. Same rule as
     `dosing.working.uses.potencyFrom`. */
  "dosing.potency.stronger": ({ learned, entered }) =>
    `Your tank's response puts the real effect at about ${learned} dKH per mL, against the ` +
    `${entered} you entered — your solution is stronger than the recipe suggests.`,
  "dosing.potency.weaker": ({ learned, entered }) =>
    `Your tank's response puts the real effect at about ${learned} dKH per mL, against the ` +
    `${entered} you entered — your solution is weaker than the recipe suggests.`,
  "dosing.potency.strongerStated": ({ learned, entered }) =>
    `Your tank's response puts the real effect at about ${learned} dKH per mL, against the ` +
    `${entered} you entered — your solution is stronger than the figure you entered.`,
  "dosing.potency.weakerStated": ({ learned, entered }) =>
    `Your tank's response puts the real effect at about ${learned} dKH per mL, against the ` +
    `${entered} you entered — your solution is weaker than the figure you entered.`,

  /* The box's disclosure control reuses `dosing.reco.showWorking`. One label
     for one affordance — a second key reading "Show working" is two owners of
     one word waiting to drift apart. */

  /* Owner-approved labels, from finding 13, as written. Both name what they
     do to the figure the app uses, so neither can be read as the safe one. */
  "dosing.potency.useMeasured": "Use the measured strength",
  "dosing.potency.keepEntered": "Keep the strength I entered",

  /* Provenance, wherever the figure in use is shown — Setup and the Dosing
     tab both. A box value, so "dKH/mL" rather than the prose "dKH per mL". */
  "dosing.potency.fromMeasured": ({ value, date }) =>
    `${value} dKH/mL — measured from your tank's response, accepted ${date}`,
  /* Its counterpart, and it earns its place: once the keeper has been shown a
     measurement and has chosen his own figure over it, "the figure you entered
     at setup" is no longer the whole truth about where it came from. Keeping
     is a decision he made on a date, and it is recorded as one. */
  "dosing.potency.fromKept": ({ value, date }) =>
    `${value} dKH/mL — the figure you entered, kept on ${date}`,

  "dosing.potency.accepted":
    "The app is now using the measured strength. The figure you entered stays in your settings " +
    "history, and every assessment already saved keeps the figure it actually used.",

  /* The estimator has moved since the keeper accepted a figure. It asks
     rather than updating: the accepted figure is his, and an app that quietly
     rewrote it would make the provenance line above a lie. */
  "dosing.potency.asksAgain": ({ learned, accepted }) =>
    `Your tank's response has moved on since you accepted a measured strength. It now puts the real ` +
    `effect at about ${learned} dKH per mL, against the ${accepted} in use. You can take the new ` +
    `figure or stay on the one you accepted.`,

  /* The working behind the estimate. Each line is one dose change the learner
     read, and the arithmetic is the engine's own: how much the dose moved, how
     much the tank's drift moved with it, and the strength that implies. */
  "dosing.potency.working.observation": ({ delta, slope, potency }) =>
    `Your dose moved ${delta} mL/day and the drift moved ${slope} dKH a day with it, ` +
    `which puts the strength at ${potency} dKH per mL.`,
  "dosing.potency.working.pooled": ({ n, potency }) =>
    `Across ${n} dose changes the middle figure is ${potency} dKH per mL.`,
  "dosing.potency.working.against": ({ learned, entered }) =>
    `${learned} measured, against ${entered} entered.`,

  /* What the learner could not do, stated beside the estimate it limits rather
     than in the dose working, where the owner met all three as "Limited this"
     on a screen that was sizing his dose correctly (finding 7). */
  "dosing.potency.limitsHead": "What is holding this back",

  "dosing.graph.7": "7 days",
  "dosing.graph.14": "14 days",
  "dosing.graph.aria": "How long a stretch to show",

  "dosing.fresh.sentence":
    "There is not enough yet to size a dose — keep logging your alkalinity tests, and the recommendation " +
    "will appear here on its own when your readings can carry one.",

  /* ---- correcting and deleting a reading -------------------------------
     `PORT-OMISSIONS.md`: "There is no way to fix a mistyped reading in this
     build." The audit consequence is stated plainly rather than implied,
     because supersession is not what a keeper expects the word "edit" to
     mean. */
  "correct.title": "Fix this reading",
  "correct.original": ({ value, unit, date, time }) =>
    `Recorded as ${value} ${unit} on ${date}${time ? ` at ${time}` : ""}.`,
  "correct.newValue": "What it should say",
  "correct.dateOnlyNote":
    "This reading has a date and no time of day, so the corrected one will not have a time either. "
    + "Fixing a number is not new information about when it was taken.",
  "correct.save": "Save the correction",
  "correct.saved": "Reading corrected",
  "correct.deleteHead": "Or take it out of your results",
  /* Owner decision 32: it is deleted, so the sentence says deleted. The
     previous wording promised the record kept it — "it stops counting" — which
     was true of the annotation this replaced and is a lie about what now
     happens. */
  "correct.deleteBody":
    "Use this where the reading should never have been recorded at all — a test you botched, or one "
    + "you entered twice.",
  "correct.delete": "Delete this reading",
  "correct.deleted": "Reading taken out",
  "correct.cancel": "Leave it as it is",
  "correct.readingsHead": "Your readings",
  "correct.tapToFix": "Tap any reading to fix it or take it out.",
  /* ---- deleting a record, and it is deleted ---------------------------
     Owner decision 32. There is no "marked invalid" anywhere any more, so
     there is no wording for one either — `correct.superseded` and
     `correct.invalid` were badges for two states nothing can now produce.

     The confirmation asks plainly and names the act. It does not ask "are you
     sure", which invites a reflex rather than a decision, and it does not
     promise the record can be got back, because it cannot. */
  /* ==================================================================
     THE DELIVERED DOSE — ONE FIELD, FOREVER
     ------------------------------------------------------------------
     Not a setup field. It is the dose the pump is running: filled the
     first time it establishes the dose, filled again it records a
     change. The keeper never types the previous figure — the record
     holds it.

     No sentence here says "the app". The register forbids any observer,
     and the two notes that used to sit above and below this field were
     the fourth and fifth places it had appeared.
     ================================================================== */
  "dose.delivered.head": "The dose your pump is running now",
  "dose.delivered.lead":
    "Type the new figure when you change the dial. The date and time matter, because the tank's "
    + "response is measured from the moment the change took effect.",
  "dose.delivered.leadFirst":
    "What your doser is delivering each day. The date and time matter, because everything about "
    + "the tank's response is measured from them.",
  "dose.delivered.field": "mL per day",
  "dose.delivered.date": "Date",
  "dose.delivered.time": "Time",
  "dose.delivered.save": "Save the change",
  "dose.delivered.saveFirst": "Save",
  "dose.delivered.recorded": "Recorded.",
  "dose.delivered.changed": "Change recorded.",
  "dose.delivered.needNumber": "Enter a number.",
  "dose.delivered.needPositive": "A dose cannot be less than nothing.",

  "dose.history.head": "Dose changes",
  "dose.history.none": "No dose recorded yet.",
  "dose.history.moved": ({ from, to }) => `Moved from ${from} mL/day to ${to} mL/day`,
  "dose.history.start": ({ dose }) => `${dose} mL/day \u2014 where the record begins`,
  "dose.history.fromDerived": "the earlier figure is read from the record, not typed",
  "dose.history.noEdit":
    "A dose change cannot be edited. Delete it and enter it again with the right date and time.",
  "dose.history.deleteAria": ({ date }) => `Delete the dose change from ${date}`,

  "dose.origin.recommendation": "a recommendation",
  "dose.origin.adjusted": "a recommendation you adjusted",
  "dose.origin.keeper": "your own change",

  "dose.change.head": "Change the dose",
  "dose.change.close": "Never mind",

  /* ==================================================================
     THE RAW READINGS, WHERE THE KEEPER CAN REACH THEM
     ------------------------------------------------------------------
     Owner findings 8, 11 and 27. There was no list of readings anywhere
     in the app. The calendar answers "what did I do on this day"; it
     does not answer "where is that reading I typed wrong".
     ================================================================== */
  "testlab.showReadings": ({ parameter }) => `Show every ${parameter} reading`,
  "testlab.hideReadings": ({ parameter }) => `Hide the ${parameter} readings`,
  "testlab.noReadings": ({ parameter }) => `No ${parameter} readings yet.`,
  "testlab.partOf.duplicate": ({ value, unit }) =>
    `one of two tests half an hour apart \u00b7 ${value}${unit} used`,
  "testlab.partOf.triplicate": ({ value, unit }) =>
    `one of three tests half an hour apart \u00b7 ${value}${unit} used`,
  "testlab.partOf.many": ({ count, value, unit }) =>
    `one of ${count} tests half an hour apart \u00b7 ${value}${unit} used`,

  "delete.confirm.reading": "Delete this reading? It will be gone, and everything is worked out again without it.",
  "delete.confirm.dose": "Delete this dose change? It will be gone, and everything is worked out again without it.",
  "delete.confirm.entry": "Delete this entry? It will be gone, and everything is worked out again without it.",
  "delete.confirm.yes": "Delete it",
  "delete.confirm.no": "Keep it",

  /* The dark pill at the bottom, after the fact. Names what went, because the
     keeper may have several kinds of record on one screen. */
  "delete.done.reading": "Alkalinity reading deleted.",
  "delete.done.readingOf": ({ parameter }) => `${parameter} reading deleted.`,
  "delete.done.dose": "Dose change deleted.",
  "delete.done.waterChange": "Water change deleted.",
  "delete.done.entry": "Entry deleted.",

  "delete.aria.reading": ({ date }) => `Delete the reading from ${date}`,
  "delete.aria.entry": "Delete this entry",

  /* ---- the dosing section: one fact, three ways of saying it ------------
     Grams per litre of soda ash and dKH per millilitre are the same fact in
     different clothes. Setup asks once and derives the rest, and says which
     figure it derived and from what. */
  "dosing.strengthHead": "How strong is your solution?",
  "dosing.strengthLead":
    "Grams per litre and dKH per millilitre are the same fact said two ways. Tell the app "
    + "whichever you know and it works out the rest.",
  "dosing.form.GRAMS_PER_LITRE": "Grams per litre",
  "dosing.form.DKH_PER_ML": "dKH per mL",
  "dosing.form.DKH_PER_ML_PER_100L": "dKH per mL per 100 L",
  "dosing.chemical": "What is in it",
  "dosing.gPerL": "Grams per litre of solution",
  "dosing.dkhPerMl": "dKH per mL, in this tank",
  "dosing.dkhPerMlPer100L": "dKH per mL per 100 L",
  "dosing.derivedFromEngine": ({ value }) =>
    `Worked out from what you entered: ${value} dKH per mL in this tank.`,
  "dosing.derivedFromVolume": ({ value, volume }) =>
    `Worked out for your ${volume} L: ${value} dKH per mL.`,
  "dosing.derivedNeedsVolume":
    "Enter your net volume above and the app can work out what that is for this tank.",
  "dosing.derivedAfterSave":
    "Save it and the app will show you what one millilitre gives in this tank.",
  "dosing.statedDirectly": "This is the figure the app uses, exactly as you typed it.",
  "chem.na2co3": "Soda ash (Na₂CO₃)",
  "chem.nahco3": "Baking soda (NaHCO₃)",
  "chem.naoh": "Caustic soda (NaOH)",
  "chem.commercial": "A bought product",

  "dosing.currentHead": "What your pump is running now",
  "dosing.currentLead":
    "The daily dose your doser is set to at this moment. The app needs it to work out what "
    + "your tank uses — without it there is nothing to weigh the readings against.",
  "dosing.current": "Daily dose (mL/day)",
  "dosing.currentOnRecord": ({ dose }) => `On record: ${dose} mL/day.`,
  "dosing.currentNone": "Nothing on record yet.",
  "dosing.currentUseChange":
    "There is already a dose on record. If you have changed it, record the change below with "
    + "the date it happened — that way the app knows which readings sit either side of it.",
  "dosing.currentSaved": "Recorded.",

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
  "testmode.reset.failed": ({ reason }) =>
    `The test data was NOT cleared, and it is all still there. ${reason} ` +
    `If this app is open in another tab or window, close it and try again.`,

  "testmode.facts.title": "The test tank's facts",
  "testmode.facts.none":
    "This store has no tank facts yet. It does not borrow your real tank's, so it needs its own before the " +
    "engine has anything to work from.",
  "testmode.facts.set": "Set the test tank up",
  "testmode.facts.change": "Change them",
  "testmode.facts.effectiveFrom": "In force from",
  "testmode.facts.beforeHead": "The app's date is before the tank facts take effect.",
  "testmode.facts.beforeBody": ({ date }) =>
    `The engine resolves the settings in force at the moment it is asked about, and there are none before ` +
    `${date} — so it will refuse rather than answer. Move the date forward, or set the facts again from an ` +
    `earlier date.`,
  "testmode.facts.moveTo": ({ date }) => `Move the app's date to ${date}`,
  "testmode.facts.note":
    "Tank facts take effect from the app's date at the moment you save them, so set the date to the start of " +
    "the period you want to look at before entering them.",

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
    "A water change in litres needs the tank volume, and this store has not been told it yet. " +
    "Set the tank facts first, or give the change as a fraction of the tank.",
  "seed.err.noVolumeText": "the water change in litres",
  "seed.err.doseBeforeLedger":
    "This dose is dated before a dose already recorded here, and what was running earlier cannot be " +
    "worked out from it. Clear the test data and enter the series in date order.",
  "seed.err.doseBeforeLedgerText": "the dose line",

  /* ======================================================================
     IMPORTING THE KEEPER'S V1 HISTORY
     ================================================================== */

  "settings.import.title": "Bring your old records across",
  "settings.import.body":
    "A one-time import of your history from the previous app. You choose the file, read what it will do, and " +
    "then decide. It never runs on its own.",
  "settings.import.done":
    "Your history has been brought across. Running it again changes nothing — it says so before you press " +
    "anything.",
  "settings.import.action": "Import your history",
  "settings.import.again": "Import again",
  "settings.import.note": "Nothing is overwritten, and the file you choose is kept exactly as it arrived.",

  "import.title": "Import your history",
  "import.subtitle": "Read what it will do, then decide.",
  "import.chooseTitle": "Choose the file",
  "import.chooseBody":
    "The export from your old app. Nothing happens when you choose it — the next thing you see is a report of " +
    "what it contains and what would be brought across.",
  "import.chooseFile": "The export file",
  "import.reading": "Reading it…",

  "import.assumed.title": "The recorded times, and what is assumed about them",
  "import.assumed.offset": "Offset applied",
  "import.assumed.offsetWith": ({ offset, zone }) => `${offset} (${zone})`,
  "import.assumed.noOffset": "none — this device does not know its own",
  "import.assumed.applies": "Readings it applies to",
  "import.assumed.untouched": "Readings it does not touch",
  "import.assumed.body": ({ n }) =>
    `${n} of your readings carry a time of day. Your old app did not record which timezone that clock was in, ` +
    `so this one applies the offset your device is on now — the same offset to every reading.`,
  "import.assumed.elapsed":
    "That is safe for the thing it is used for. Your tank does not travel, so the same offset applies to all " +
    "of them, and the time BETWEEN any two readings comes out exactly right — which is the only thing worked " +
    "out from these times. What it cannot tell you is where those readings sit on a world clock.",
  "import.assumed.recorded":
    "It is written down as an assumption, on every reading it touched: what was assumed, and that nobody told " +
    "us it. It is not recorded as something you said.",
  "import.assumed.note":
    "Readings with no time of day gain nothing from this and are not touched. There is no clock reading to " +
    "work from, and inventing one is the thing this app will not do.",

  "import.potency.label": "Solution strength (dKH per mL, in your tank)",
  "import.potency.hint":
    "Your file carries a figure that does not match your actual solution. This is the corrected one, and it " +
    "is what will be stored. Change it if it is wrong.",

  "import.err.notJson": ({ error }) => `That file could not be read as an export. ${error}`,
  "import.err.wrongFormat": ({ format }) =>
    `That is not an export from the old app — it says it is "${format}".`,
  "import.err.wrongVersion": ({ version }) =>
    `That export is version ${version}, and this can only read version 1.`,
  "import.err.noData": "That export has no records in it.",
  "import.err.unknownParameter": ({ text }) =>
    `The file has readings of "${text}", which this app has no place to keep.`,
  "import.err.notANumber": ({ text, date }) => `A reading on ${date} has the value "${text}", which is not a number.`,
  "import.err.badDose": ({ text, date }) => `A dose record on ${date} is for "${text}" and could not be read.`,
  "import.err.badWater": ({ date }) => `A water change on ${date} has no volume on it.`,
  "import.err.badDate": ({ what, text }) =>
    `A ${what} record has "${text}" where its date should be, which is not a date. Nothing has been imported.`,
  "import.err.badTime": ({ what, date, text }) =>
    `A ${what} record on ${date} has "${text}" where its time should be, which is not a time of day. ` +
    `Nothing has been imported.`,
  "import.err.notAList": ({ name }) =>
    `The ${name} section of that file is not a list of records, so it could not be read.`,
  "import.err.emptyIcp": ({ date }) => `The ICP panel dated ${date} has no results in it.`,
  "import.err.doseNoBounds": ({ date }) =>
    `The dose record on ${date} has no time of day, and without knowing which timezone your records were in ` +
    `there is no way to say even roughly when it took effect. Give the timezone, or leave that record out.`,
  "import.err.badRange": ({ text }) =>
    `Your file's target range for "${text}" has no usable numbers on it.`,
  "import.err.unknownRange": ({ text }) =>
    `Your file has a target range for "${text}", which this app has no place to keep.`,
  "import.err.badReminder": ({ text }) => `The reminder "${text}" has no interval on it.`,

  "import.refused.title": "That file cannot be imported",
  "import.refused.counts": "The file disagrees with itself",
  "import.refused.countsBody":
    "The export states how many records it holds, and that is not how many are in it. Nothing has been " +
    "imported. A file that does not match its own count is not the file it says it is, and guessing which " +
    "half to believe is not something this will do.",
  "import.countMismatch": ({ stated, actual }) => `says ${stated}, contains ${actual}`,
  "import.countUnstated": ({ actual }) => `says nothing, contains ${actual}`,
  "import.refused.countsUnstated":
    "That export does not say how many records it holds, so there is nothing to check its contents against. " +
    "A file that has been cut short looks exactly like a complete one. Nothing has been imported.",
  "import.refused.rows": "Some rows could not be read",
  "import.refused.rowsBody": ({ n }) =>
    n === 1
      ? "One row could not be read, and nothing has been imported."
      : `${n} rows could not be read, and nothing has been imported.`,

  "import.what.title": "What would come across",
  "import.what.readingRow": ({ n, withTime }) =>
    withTime ? `${n} readings · ${withTime} with a time` : `${n} readings · none with a time`,
  "import.what.span": ({ from, to }) => `${from} to ${to}`,
  "import.what.readings": "Readings",
  "import.what.doses": "Dose records",
  "import.what.water": "Water changes",
  "import.what.icps": "ICP panels",
  "import.what.lighting": "Lighting notes",
  "import.what.tasks": "Reminders",
  "import.what.completions": "Things marked done",
  "import.what.notImported": ({ findings, plans }) =>
    `Not brought across: ${findings} hidden-notice records, which are hide-state for notices this app does ` +
    `not have; and ${plans} active dosing plans, which carry no record of what was predicted at the time.`,

  "import.time.title": "How well the times are known",
  "import.time.dateOnly": "Date, no time of day",
  "import.time.withTime": "Date and a time of day",
  "import.time.exact": "Time provable to the second",
  "import.time.of": ({ n, total }) => `${n} of ${total}`,
  "import.time.body":
    "A reading with no time of day is stored with no time of day. Not midnight, not midday, not the time you " +
    "usually test — nothing. That cannot be undone later, so it is not done at all.",
  "import.time.local":
    "The readings that do carry a time are read as local times and given this device's offset, so the time " +
    "between any two of them is exact. Which offset was assumed is recorded on each one.",
  "import.time.note":
    "This is the one thing about an import that cannot be corrected afterwards: a made-up time is " +
    "indistinguishable from a real one the moment it is stored.",

  "import.eligibility.title": "What can be worked out from it",
  "import.eligibility.everything":
    "Every reading comes across as a real measurement. They all chart, they all appear in your history, and " +
    "they are all part of the record. What can be worked OUT from them is a narrower question, and the answer " +
    "is not the same for every period.",
  "import.eligibility.doseFrom": "Dose history begins",
  "import.eligibility.before": "Alkalinity readings before it",
  "import.eligibility.after": "Alkalinity readings from then on",
  "import.eligibility.beforeBody": ({ date }) =>
    `Before ${date} nothing in your records says what was being dosed. The readings are true; what was going ` +
    `into the tank between them is simply not written down anywhere, so how much the tank was using cannot be ` +
    `worked out from them. That is a gap in the record, not a doubt about the numbers.`,
  "import.eligibility.afterBody":
    "From then on there are dose records either side of the readings, which is the part with enough context " +
    "to be worth analysing.",
  "import.eligibility.noDoseHistory":
    "Nothing in the file says what was being dosed at any point, so none of the period has delivery context.",
  "import.eligibility.noInstantHead":
    "Even the part with dose records cannot be analysed, and it is worth knowing why now.",
  "import.eligibility.noInstantBody": ({ date }) =>
    `None of the readings from ${date} onwards carries a time of day. Working out how fast the tank is using ` +
    `something means dividing by how much time passed between two readings, and a date on its own does not ` +
    `say — so the engine will decline rather than estimate. Nothing is lost by importing: the readings are ` +
    `kept either way, and one more test with a time on it starts the clock.`,

  "import.eligibility.note":
    "This app does not decide which readings are usable. They are stored with what is true about them, and " +
    "the engine says what it can and cannot do with each — with its reason, on your history screen.",

  "import.provenance.title": "Records worth a second look",
  "import.provenance.body":
    "The review of your old app found these identical to values that shipped inside the app itself, rather " +
    "than looking like something typed in. That is not proof either way: the app's own note says the values " +
    "were built from your practice, and a copy cannot be told from the thing it was copied from.",
  "import.provenance.question":
    "They come across, flagged as unconfirmed rather than quietly treated as yours. If they are your records, " +
    "nothing needs doing. If they are not, they should not be read as history.",
  "import.provenance.note":
    "Recorded rather than decided. One answer from you settles all three.",

  "import.config.title": "Your settings, as they stand now",
  "import.config.body":
    "These come across as your CURRENT settings, dated today. They are not applied backwards over your old " +
    "readings: the file has no record of when any of them changed, and pretending otherwise would rewrite " +
    "history that was never recorded.",
  "import.config.volume": "Tank volume",
  "import.config.litres": ({ n }) => `${n} L`,
  "import.config.alkRange": "Alkalinity range",
  "import.config.range": ({ min, max, unit }) => `${min}–${max} ${unit}`,
  "import.config.potencyHead": "One figure is being corrected.",
  "import.config.potencyBody": ({ imported, corrected }) =>
    `The file carries ${imported} for your alkalinity solution's strength. You have said the real figure is ` +
    `${corrected} dKH per mL in your tank. The corrected figure is what gets stored.`,
  "import.config.potencyKept":
    "The figure from the file is kept alongside it, recorded as superseded. Nothing already worked out is " +
    "recomputed with either number.",
  "import.config.note":
    "Your reminders come across with the intervals your file carries — see below.",

  "import.reminders.title": "Your reminders",
  "import.reminders.body": ({ n }) =>
    `All ${n} come across with the intervals your file has on them, so what you actually have in front of you ` +
    `is what you get here.`,
  "import.reminders.unverified":
    "What the file does not record is which of them you chose. The review of your old app found that one " +
    "interval had been changed and the rest were the defaults it shipped with — and there is nothing in the " +
    "export that says which is which. So they are brought across marked as unverified rather than as your " +
    "choices, and you can change any of them.",
  "import.reminders.row": ({ label, interval }) => `${label} · every ${interval} days`,

  "import.run.title": "Run the import",
  "import.run.body":
    "Everything above is what will happen. Nothing in your records is overwritten — every one of these is a " +
    "new entry beside what is already there.",
  "import.run.action": "Bring these across",
  "import.run.working": "Bringing them across…",
  "import.run.done": ({ n }) => `${n} records brought across.`,
  "import.run.note":
    "The file you chose is kept exactly as it arrived, so what it actually said can always be checked.",

  "import.nothingNew.title": "Everything in this file is already here",
  "import.nothingNew.body":
    "Every record in it matches one your history already holds, so running the import would add nothing. " +
    "Nothing has been changed.",
  "import.alreadyHeld.readings": "Readings already held",
  "import.alreadyHeld.doses": "Dose records already held",
  "import.alreadyHeld.water": "Water changes already held",
  "import.alreadyHeld.icps": "ICP panels already held",
  "import.alreadyHeld.completions": "Completions already held",
  "import.nothingNew.note":
    "Records are matched on what they say — what was measured, on what day, at what time, and the value — " +
    "not on the identifiers the old app gave them, because those do not survive an export.",

  "import.done.title": "Brought across",
  "import.done.body": ({ n }) =>
    `${n} records are now in your history, alongside your reminders and what you had already marked done.`,
  "import.done.note":
    "The file is kept exactly as it arrived. Importing it again will add nothing, and will say so.",

  "import.run.failed": ({ reason }) =>
    `The import stopped part-way through and did not finish. ${reason} Nothing is lost and nothing is ` +
    `duplicated: run it again with the same file and it will add only what is missing.`,

  "import.previously.incompleteTitle": "An import did not finish",
  "import.previously.incompletePill": "unfinished",
  "import.previously.incompleteBody":
    "An earlier run stopped part-way through. Your file was kept, so nothing is lost — run it again with the " +
    "same file and it will add only the records that are missing.",

  "import.previously.title": "Already imported",
  "import.previously.when": "Brought across",
  "import.previously.file": "From",
  "import.previously.readings": "Readings",
  "import.previously.note":
    "The file is kept with the record of what was made from it. Importing the same file again adds nothing.",

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
  /* The short form the parameter card centres on its range bar. The brief for
     the V1 interface port is explicit that the words are `IN RANGE`,
     `ABOVE RANGE` and `BELOW RANGE`, and specifically not "in band". They are
     separate keys rather than a truncation of the sentences above, because a
     language pass should be able to change one without disturbing the other.

     There is deliberately no short form for `UNKNOWN` or `NOT_RUN`. A card
     with no position shows no word — see `app/src/present/position.js`. */
  "positionShort.IN_RANGE": "IN RANGE",
  "positionShort.BELOW_RANGE": "BELOW RANGE",
  "positionShort.ABOVE_RANGE": "ABOVE RANGE",
  "positionShort.ALERT_LOW": "LOW — ATTENTION",
  "positionShort.ALERT_HIGH": "HIGH — ATTENTION",

  "position.UNKNOWN": "Not known",
  "position.NOT_RUN": "Not worked out",

  /* The same trajectory values as they read INSIDE a sentence rather than at
     the head of one — "In range, holding" needs "holding", not "Holding
     steady". Separate keys rather than a lowercase() of the ones below,
     because "Not clear yet" does not survive that treatment. */
  "trajectoryMid.RISING": "rising",
  "trajectoryMid.FALLING": "falling",
  "trajectoryMid.STABLE": "holding",

  /* ---- the parameter card's status line ---- */
  "card.status.positionAndTrajectory": ({ position, trajectory }) => `${position} · ${trajectory}`,
  /* Alkalinity, before the engine has a position for it. Not a refusal, and
     not blank: it says which of the two states this is. */
  "card.status.noPositionYet": "AWAITING A READING",
  /* The four states that are not "the engine answered", each said as itself.
     A blank, or a status line that reads like a verdict when no engine ran, is
     the failure mode this project has ruled out repeatedly. */
  "card.status.engineStarting": "WORKING IT OUT",
  "card.status.engineUnavailable": "ENGINE UNAVAILABLE",
  "card.status.notSetUp": "SETUP NEEDED",
  "card.status.storageUnavailable": "RECORD UNREADABLE",
  /* Every parameter this build does not assess. It states what the app does
     with these readings, which is true, rather than classifying them — there
     is no engine for them, so there is no position and none is invented. */
  "card.status.notAssessed": "LOGGED · NOT ASSESSED",

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
  "parameter.PH": "pH",
  "parameter.K": "Potassium",

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

  /* Takes no `day`: it declared one and never rendered it, and the sentence is
     complete without one — "already your scheduled test day" is about the day
     the keeper just picked, which he is looking at. Found by `STR-08`. */
  "suggest.alreadyScheduled": "That's already your scheduled test day. Nothing to change.",
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
