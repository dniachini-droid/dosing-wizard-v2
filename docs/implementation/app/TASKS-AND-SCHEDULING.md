# TASKS AND SCHEDULING — design decisions
Owner-approved, 21 August 2026

---

## ONE LIST, FOUR KINDS OF ITEM

Tasks, tests and the app's own asks all appear in the same ranked list on
Today and on the calendar. They differ in what tapping them does, not in
where they live.

| Kind | Example | Tapping it |
|---|---|---|
| **Yours** | Water change, clean the skimmer, filter socks | Tick to complete |
| **Your test** | Alkalinity every 4 days | Opens the reading entry. Logging the reading completes it — there is no separate tick |
| **The app's ask** | Confirm the dose change, add your doser setting, retest magnesium | Does the thing, which resolves it. Never ticked by hand |
| **The app's suggested test** | A test on Saturday would show whether the dose change worked | Accept or decline. See below |

An app ask that is never acted on must not sit in the list forever. It
expires quietly after a reasonable interval and the app treats the
underlying state as unconfirmed, which it already handles.

---

## COMPLETION-ANCHORED SCHEDULING

An item is due a fixed interval after it was last **completed**, not
after it was last **due**.

So a four-day test done on Sunday is next due Thursday, regardless of
when it was scheduled. Being behind never compounds into a backlog, and
the schedule right-sizes itself to how the keeper actually works.

An overdue item stays visibly overdue. Completing it clears it and the
clock restarts from that moment. Eight days late, tested today, next one
in four days.

Logging a reading auto-completes its test task. The act of recording the
reading is the completion.

---

## THE SUGGESTED TEST

The keeper's schedule is theirs. The engine never changes it.

Separately, after a dose change the engine works out when a test would
be informative and offers it. The keeper decides how it fits.

### The prompt

> **Test alkalinity on Saturday**
> A test then will show whether your dose change worked.
> **Why Saturday?**
>
> **How would you like to schedule this?**
>
> **Replace my next scheduled test** *(recommended)*
> **Add it as an extra test**
>
> ☐ Remember this and don't ask again

**Replace is recommended** because it gets the same information without
asking for an extra test, and completion-anchored scheduling right-sizes
everything afterwards.

Neither option names the keeper's other test dates. They know their own
schedule, and naming a third date made the choice harder to read.

### When the suggested day is already a scheduled test day

Nothing to ask.

> **Test alkalinity on Saturday**
> That's already your scheduled test day. Nothing to change.

### Why Saturday

A link, not a paragraph in the prompt. The keeper is deciding a
schedule, not evaluating an argument.

> **Why Saturday**
> You changed the dose today. That should shift alkalinity by about
> 0.10 dKH a day.
>
> By Saturday it will have moved around 0.30 dKH — enough to tell apart
> from ordinary test variation. Testing sooner would mostly show noise.

Same principle as the working: numbers carry the explanation, prose
appears only where a number needs it.

### Remembering the answer

Opt-in and explicit. The app never infers a preference from repeated
taps.

The setting must state what is actually happening, not just name a
preference, and must be findable by someone who ticked the box months
ago and has forgotten:

> **When a test is suggested**
> Currently: replaces your next scheduled test, without asking.
> **Ask me each time**

---

## WHAT THIS RULES OUT

- The engine silently moving a keeper's scheduled test.
- Rescheduling the engine's suggestion as though it were a keeper task —
  it is accepted or declined, not moved.
- Inferring a scheduling preference from behaviour.
- A prompt that explains the reasoning inline. The reasoning is one tap
  away and never in the way.
