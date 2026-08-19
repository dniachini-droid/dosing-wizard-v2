# Run records

One file per unattended run: `docs/process/runs/<YYYY-MM-DD>-<slug>.md`.

## The contract

**A run writes only its own file.** There is no shared index, no shared state
file and no shared log. Concurrent writers to a shared record corrupt it, and
the corruption is not noticed until the record is needed. Listing the directory
is how you find runs.

**Write as you go, not at the end.** A run that dies mid-way should leave a
partial record that says where it got to. A partial record is useful; a missing
one is not.

**Another run may mark a dead run interrupted, and nothing else.** If a run
finds an earlier record left open, it may append a note that the run was
interrupted and what state it left behind. It does not edit that run's findings,
plan or conclusions.

**Records are not edited after the fact to look better.** A finding that turned
out to be wrong is annotated, not deleted. The value of the record is that it
shows what was believed at the time.

## Required contents

Per `docs/process/AUTONOMY-AND-CONTROLS.md`:

- the **run base commit**, and the `docs/canon/` state it is measured against;
- task, and the admissibility decision;
- plan, including declared out-of-scope;
- what was implemented, and any departure from plan with its reason;
- reviewers run; reviewers considered and not run, with reasons;
- every material finding: severity, what it was, how it was resolved — including
  findings deliberately not fixed;
- outstanding findings carried into the PR;
- checks run, with real output;
- open owner decisions raised, and where filed;
- what was deliberately not done.

## What this is not

Not a changelog — git is the changelog. Not a status report — `PROJECT-STATE.md`
is the status. Not an authority — nothing in a run record decides anything.

It is the answer to "was that run careful, or lucky?", asked later, by someone
who was not there.
