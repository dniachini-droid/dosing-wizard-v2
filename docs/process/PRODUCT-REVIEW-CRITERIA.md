# Product review criteria

The standard by which a review finding is judged to matter, and by which
ordinary engine output is judged to be sensible.

This file exists so that the agents which need this standard **read one copy of
it**. It is deliberately a file and not text inside an agent prompt: two prompts
holding two paraphrases of the same standard is duplicate rule ownership, and
the owner amending it would have to find both.

Its readers are `jake` and `normal-operation-reviewer`. Any future agent needing
the same standard reads it here rather than restating it.

---

## What this file is, and is not

**It is a review standard.** It says what a reasonable person should consider
important about this product when reading a finding or judging an output. It is
used for that and for nothing else.

**It is not chemistry authority, and nothing in it governs engine behaviour.**
No threshold, band edge, rail, tolerance, cadence, evidence minimum or dosing
equation appears here or may be derived from here. Chemistry comes from current
frozen canon — `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md`,
`SHARED_V2_FREEZE_2` and `ALK_V2_FREEZE_4` — and from nothing else. An agent
that used this file to justify a behavioural value would be doing exactly what
`CLAUDE.md` forbids.

**It is not product direction, and it does not compete with the founding
documents.** `PRODUCT-VISION.md` and `ROADMAP.md` own direction, `DECISIONS.md`
owns product and technical-architecture decisions, `PROJECT-STATE.md` owns
current state, and the canon owns behaviour. Where this file and any of those
differ, **the other document governs and this file is wrong**. Report the
difference; do not reconcile it here.

**It does not classify, decide or fix anything by itself.** It is the standard
the agents apply. The agents produce reports. The owner decides.

---

## Provenance

The assumptions below were stated by the owner in the task of 2026-08-20 that
created this file. They are recorded here as the owner's statement of what the
product is for.

Two of them are not currently stated anywhere else in the repository:
`PRC-001` (recommend-only, no connection to any doser) and `PRC-004` (not an
emergency tool). `PRC-005` is consistent with `PRODUCT-VISION.md` ("When
evidence cannot support an action, the system should refuse or hold rather than
manufacture precision") but is phrased more strongly here.

**Flagged, not resolved:** if any of these is meant to constrain what gets built
— rather than only how findings are judged — its home is `PRODUCT-VISION.md` or
`DECISIONS.md`, and putting it there is an owner act. Until the owner does that,
these govern review judgement only, and no agent may cite this file as a reason
to build or not build something.

---

## The criteria

### `PRC-001` — The application is recommend-only

It never controls, drives or commands a dosing pump. It has no connection to any
doser. It produces a recommendation; a human reads it and changes their own
equipment if they choose to.

**Consequence for review.** Withholding a recommendation has no physical effect
on any tank. A finding whose harm is "the user is not told something" is a
different and much smaller class of harm than a finding whose harm is "the user
is told something wrong". Weigh them accordingly.

This does not make a withheld recommendation free. A product that refuses on
ordinary readings is useless, which is `PRC-003`'s concern — but the cost is
usefulness, not safety.

### `PRC-002` — The intended user is a dedicated, experienced reef keeper

They test regularly, know their own system, and would recognise and act on an
obvious problem without an application telling them.

**Consequence for review.** The product does not have to catch what its user
already sees. A finding that the engine handles a blatant, immediately visible
situation imperfectly is worth less than a finding about something the user
could not have noticed unaided.

### `PRC-003` — The product exists for the ordinary middle of tank management

Slow drift. Gradually changing consumption. Checking whether an established dose
is still correct. Detecting trends too gradual for a person to notice week to
week.

**That last case is where the product earns its value.** A defect there is a
defect in the reason the product exists.

**Consequence for review.** Anything that degrades the ordinary middle is
serious, however mild it looks. A mild inconsistency in an everyday sequence
outranks a severe consequence in a state nobody reaches.

### `PRC-004` — The product is not an emergency tool

A tank in a severe state is a situation for experienced human judgement, not for
an application.

**Consequence for review.** Behaviour in severe states is judged by whether it
is honest and safe — whether the engine declines clearly rather than producing a
confident number it cannot support. It is not judged by whether it produces a
useful answer. "The engine gives no answer in a crisis" is not, by itself, a
defect.

**This is not permission to be wrong in severe states.** A wrong number is a
defect wherever it appears. Only the absence of an answer is excused here.

### `PRC-005` — No recommendation, with a plain generic message, is correct behaviour

Where the engine cannot produce a defensible recommendation, for any reason, the
correct behaviour is to produce no recommendation together with a plain generic
message. This is correct behaviour, not a defect. **There is no requirement that
every conceivable state produce a number.**

**Consequence for review.** A finding that ends in "and therefore the engine
produces nothing here" is usually already handled. Ask what the engine actually
does before treating it as a defect.

**Two things this does not excuse.**

1. A withheld recommendation on an *ordinary* sequence (`PRC-003`) is a defect,
   not conservatism. The product must work in the middle.
2. Silent degradation into a confident answer is the opposite failure and is
   always serious.

**What the message and the refusal actually are is canon's, not this file's.**
The reason codes, their severities and their payloads live in
`docs/implementation/alk-v2/ALK-V2-REASON-CODES.md`, tracing to canon. This file
says only that withholding is an acceptable outcome. It does not say when, and
it does not specify wording.

### `PRC-006` — Reference system for realism judgements

- a small reef aquarium of approximately 77 L;
- one owner;
- one or two test methods;
- readings entered manually every few days.

This is the system against which "would this plausibly happen?" is asked. It is
a **judgement reference, not a configuration and not a chemistry value**: 77 L
is the volume already used by the worked examples in
`docs/implementation/alk-v2/`, so it introduces nothing new, and no engine
behaviour may be derived from it.

Where a realism judgement depends on something this reference does not fix —
which product is dosed, what the target range is, how the tank is stocked — the
agent says the judgement was underdetermined rather than inventing the missing
detail.

---

## Using these criteria

**They are a standard for judgement, not a checklist to be scored.** An agent
citing them says which criterion applied and why, in plain language.

**They never override an authority.** If frozen canon, `DECISIONS.md`,
`PRODUCT-VISION.md` or `ROADMAP.md` settles a question, that settles it, and
these criteria do not reopen it. A conflict between this file and any of those
is a finding against this file.

**They are not a reason to discard a finding quietly.** An agent that judges a
finding unimportant records the finding and its judgement. Nothing disappears
because it was found to be an edge case.

**Uncertainty resolves toward the finding.** Where an agent cannot tell whether
the reference system would plausibly reach a state, it treats the state as
plausible. Misfiling a real defect as unimportant is the expensive error; the
reverse costs a reading.

---

## Amendment

Amending this file is an owner-directed change, like everything else under
`docs/process/AGENT-ROSTER.md` and `.claude/agents/**`
(`docs/process/AUTONOMY-AND-CONTROLS.md`). An agent may report that a criterion
is wrong, unclear or under-determined. It may not edit it, and it may not work
around it.
