# Open Owner Decisions

A queue of decisions that only the owner can take, raised by work that hit them.

**This file is not an authority.** Nothing here is decided, and nothing here may
be relied on by any implementation. A decision becomes authority only when the
owner records it in `DECISIONS.md` — or, for chemistry behaviour, only through a
governed canon reissue.

## Why it exists

Autonomous and assisted work regularly reaches a point where continuing requires
a choice nobody has made. The two bad outcomes are the work stopping and the
question evaporating, or the work continuing and the question being answered
quietly by whoever happened to be holding the keyboard.

This file is the third option: the question survives, findable, with enough
worked up around it that answering it is cheap.

## How entries are added

`advisor` works the decision up; the session that hit it files the entry.
Newest first.

```
## OD-nnn — <one-line question>

- **Raised:** <date> · **By:** <run / PR / session> · **Status:** OPEN
- **Blocks:** <what cannot proceed, or "nothing — recorded for later">

**The question, in plain language**

**Why it is undecided** — what the existing authorities do and do not say, quoted.

**Options** — two or three, each with what it commits to, what it forecloses,
what it costs, and how reversible it is.

**Which direction being wrong hurts more**

**What already covers this** — if anything.

**What must change alongside**

**Recommendation, and what would make it wrong**
```

## How entries are closed

The owner decides. The decision is recorded in `DECISIONS.md` as a new entry.
The entry here is then marked:

```
- **Status:** CLOSED — see DEC-nnn (<date>)
```

Closed entries stay. The record of what was open, and for how long, is worth
more than a tidy file.

---

## Open

*None recorded yet.*

## Closed

*None yet.*
