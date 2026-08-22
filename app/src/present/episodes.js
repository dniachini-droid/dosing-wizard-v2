/* ============================================================================
   THE ENGINE'S OWN OBSERVATIONS, READ BACK — NOT RE-DERIVED
   ----------------------------------------------------------------------------
   Canon groups measurements of one parameter taken within thirty minutes into
   a single testing episode and resolves it to the MEDIAN of its members
   (`ALK-TESTING-EPISODE-001`, `ALK-EPISODE-RESOLUTION-001`). Six readings
   typed in one minute are one test run six times, not six tests over an hour.

   Every screen in this application has to know that, because until now every
   screen showed the raw latest reading as "the current value" while every WORD
   beside it came from the engine's resolved episode. Log 10.0 dKH a minute
   after five 9.0s and the card read "10.00 · IN RANGE": the number from one
   source, the verdict from another, disagreeing in view at the same time.

   WHY THIS FILE COMPUTES NOTHING
   ------------------------------

   The obvious fix is to group the readings here. That would be a second
   implementation of the thirty-minute window and a second implementation of
   the median, and canon `MASTER RULE 1` is explicit that two implementations
   agreeing today are a defect rather than a coincidence — the day they
   disagreed there would be no way to say which was right. `X-INV-004` gives
   the domain engine one analytical owner and says presentation renders
   structured output.

   So this file READS. The engine already publishes every episode it formed, on
   every assessment:

       EPISODE_RESOLVED               episodeId, episodeAt, episodeValueDkh,
                                      combinedMeasurementCount
       EPISODE_MEASUREMENTS_COMBINED  memberMeasurementIds, episodeSpreadDkh
                                      (only where more than one was combined)
       CLUSTER_ANOMALOUS_SPREAD       the members disagreed by more than the
                                      canon's limit

   `memberMeasurementIds` are this application's own event ids, so a member
   found here is the same record the readings list deletes. There is no
   threshold, no window, no median and no comparison in this file, and there
   must never be one.

   THE GROUP IS NEVER STORED
   -------------------------

   It is whatever measurements currently exist inside that half hour, and it is
   read afresh from the assessment every time. Delete one of a pair and the
   engine's next assessment reports a group of one whose resolved value is the
   survivor's — because it re-formed the episode from the ledger, not because
   anything here patched a cached group.
   ========================================================================= */

/* One episode, in the shape the screens read. Every field is copied from the
   engine's payload; none is worked out. */
function emptyIndex() {
  return { list: [], byMemberId: new Map(), byId: new Map() };
}

function payloadsOf(engineResult, code) {
  const codes = engineResult && Array.isArray(engineResult.reasonCodes)
    ? engineResult.reasonCodes : [];
  const out = [];
  for (const c of codes) {
    if (!c || c.code !== code) continue;
    out.push(c.payload || {});
  }
  return out;
}

/* Every episode the engine formed on this assessment, oldest first.

   Ordered by the engine's own `episodeAt`, which is the instant it resolved
   the group to — for a group of several that is the median of their instants,
   which is the engine's answer to "when was this test run" and not a second
   opinion formed here. */
export function episodesFrom(engineResult) {
  if (!engineResult) return emptyIndex();

  const combined = new Map();
  for (const p of payloadsOf(engineResult, "EPISODE_MEASUREMENTS_COMBINED")) {
    if (p.episodeId) combined.set(p.episodeId, p);
  }
  /* The engine names the anomaly by cluster rather than by episode. Both ids
     are built from the same instant, so the anomalous set is keyed on what the
     payload actually carries and looked up by the episode's own cluster id
     when one is present, never by reconstructing an id here. */
  const anomalous = new Set();
  for (const p of payloadsOf(engineResult, "CLUSTER_ANOMALOUS_SPREAD")) {
    if (p.clusterId) anomalous.add(p.clusterId);
  }

  const index = emptyIndex();
  for (const p of payloadsOf(engineResult, "EPISODE_RESOLVED")) {
    if (!p.episodeId) continue;
    const extra = combined.get(p.episodeId) || {};
    const memberIds = Array.isArray(extra.memberMeasurementIds)
      ? [...extra.memberMeasurementIds] : [];
    const clusterId = p.episodeId.replace(/^EP-/, "CL-");
    const ep = {
      episodeId: p.episodeId,
      at: p.episodeAt || null,
      /* The value the engine used. Every figure on every screen that describes
         this test is this one. */
      valueDkh: typeof p.episodeValueDkh === "number" ? p.episodeValueDkh : null,
      count: typeof p.combinedMeasurementCount === "number" ? p.combinedMeasurementCount : 1,
      memberIds,
      spreadDkh: typeof extra.episodeSpreadDkh === "number" ? extra.episodeSpreadDkh : null,
      anomalous: anomalous.has(clusterId),
    };
    index.list.push(ep);
    index.byId.set(ep.episodeId, ep);
    for (const id of memberIds) index.byMemberId.set(id, ep);
  }

  index.list.sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? -1 : 1));
  return index;
}

/* The most recent episode, which is what "the current value" means for a
   parameter the engine assesses. Null where the engine reported none — which
   is every parameter it does not assess, and alkalinity before it has answered.
   A caller that gets null shows the raw record and says nothing about it. */
export function latestEpisode(index) {
  return index && index.list.length ? index.list[index.list.length - 1] : null;
}

/* Which episode a given reading belongs to, or null.

   A reading the engine did not place in a multi-measurement episode is not an
   error and is not missing: it is a test run once, and it is its own point.
   Only groups of more than one carry member ids, because only they need them. */
export function episodeForReading(index, readingId) {
  if (!index || !readingId) return null;
  return index.byMemberId.get(readingId) || null;
}

/* Is this reading one of several taken close enough together to be one test?

   The question every surface that shows a raw value needs to ask before it
   presents that value as the tank's current alkalinity. */
export function isGrouped(index, readingId) {
  const ep = episodeForReading(index, readingId);
  return !!(ep && ep.count > 1);
}

/* ============================================================================
   THE CHART'S POINTS
   ----------------------------------------------------------------------------
   One x-position per test, not one per measurement. Six readings typed in a
   minute drew six points spread along the axis, which said the keeper tested
   six times over an hour. He tested once, six times over.

   So a group occupies a single position — the engine's own `episodeAt` — and
   carries its members with it. The chart draws the members stacked at that
   position, small and quiet, and marks the resolved value distinctly against
   them; the trend line runs through the resolved value alone.

   A test run once is a group of one and takes the same shape, so the chart has
   one kind of point rather than two.

   A reading the engine placed in no episode — every parameter it does not
   assess, and any reading with no usable instant — is its own group of one
   resolved to its own value. That is not the engine's answer being guessed at;
   it is the honest shape of a record nothing has grouped.
   ========================================================================= */
export function chartGroupsFrom(rows, index, fmtShort) {
  const out = [];
  const placed = new Map();

  for (const r of rows) {
    const ep = episodeForReading(index, r.id);
    if (!ep || ep.count <= 1) {
      out.push({
        key: r.id,
        episodeId: null,
        label: fmtShort(r.date) + (r.time ? ` ${r.time}` : ""),
        value: r.value,
        date: r.date,
        time: r.time,
        members: [{ id: r.id, value: r.value, time: r.time }],
        count: 1,
        spread: null,
        anomalous: false,
        grouped: false,
      });
      continue;
    }
    let g = placed.get(ep.episodeId);
    if (!g) {
      /* The group sits at the instant the ENGINE resolved it to, rendered in
         the offset its members arrived in. Nothing here recomputes that
         instant; it is read off the payload. */
      const date = ep.at ? ep.at.slice(0, 10) : r.date;
      const time = ep.at ? ep.at.slice(11, 16) : r.time;
      g = {
        key: ep.episodeId,
        episodeId: ep.episodeId,
        label: `${fmtShort(date)} ${time}`,
        /* The figure the engine used, and the only one the trend line reads. */
        value: ep.valueDkh,
        date,
        time,
        members: [],
        count: ep.count,
        spread: ep.spreadDkh,
        anomalous: ep.anomalous,
        grouped: true,
      };
      placed.set(ep.episodeId, g);
      out.push(g);
    }
    g.members.push({ id: r.id, value: r.value, time: r.time });
  }

  /* Members oldest first within the group, so the stack reads in the order the
     keeper typed them. */
  for (const g of out) {
    if (g.grouped) g.members.sort((a, b) => (a.time === b.time ? 0 : (a.time || "") < (b.time || "") ? -1 : 1));
  }
  return out;
}

/* How many measurements this test was run with, as a word.

   Two and three have names a keeper uses; past that a count reads better than
   a word almost nobody says out loud. The wording itself is in `strings.js`;
   this only decides which of the three sentences applies. */
export function groupWordKey(count) {
  if (count === 2) return "duplicate";
  if (count === 3) return "triplicate";
  return "many";
}

/* ============================================================================
   "THE CURRENT VALUE" — ONE OWNER, FOR EVERY SURFACE THAT SHOWS ONE
   ----------------------------------------------------------------------------
   The big figure on a dashboard card, the marker on its range bar, the row on
   the Test tab and the line at the top of Dosing all answer the same question,
   and until now three of them answered it from the ledger while every word
   beside them answered it from the engine. That is how a card came to read
   "10.00 · IN RANGE": the marker was drawn from the raw reading and was
   correct, the words came from the assessment and described a different
   number, and both were on screen at once.

   So they ask here instead.

   Where the engine assesses the parameter and has answered, the current value
   is its latest resolved observation — the figure it actually used. Where it
   does not (every parameter but alkalinity in this build) or has not answered
   yet, it is the latest raw reading, which is the only thing anyone knows, and
   the caller is told which it got rather than being left to assume.
   ========================================================================= */
export function currentObservationFor(def, engineResult, index, latestReading) {
  const ep = def && def.assessed && engineResult ? latestEpisode(index) : null;
  if (ep && ep.valueDkh != null) {
    return {
      value: ep.valueDkh,
      date: ep.at ? ep.at.slice(0, 10) : (latestReading ? latestReading.date : null),
      time: ep.at ? ep.at.slice(11, 16) : (latestReading ? latestReading.time : null),
      count: ep.count,
      spread: ep.spreadDkh,
      anomalous: ep.anomalous,
      episodeId: ep.episodeId,
      /* The engine resolved this. A caller may say so; none may imply it of a
         value that came from the branch below. */
      resolved: true,
    };
  }
  if (!latestReading) return null;
  return {
    value: latestReading.value,
    date: latestReading.date,
    time: latestReading.time,
    count: 1,
    spread: null,
    anomalous: false,
    episodeId: null,
    resolved: false,
  };
}

/* WHICH FIGURE A SURFACE PUTS ON SCREEN.

   The card, its range marker and the "Latest" cell in the parameter sheet all
   answer this, and each of them used to answer it by reaching for the raw last
   reading — which is how "10.00" came to be printed beside the word "IN RANGE".

   It is a function rather than an expression inside a component because it is
   the exact line the whole of findings 26 and 28 turn on, and a line that
   important has to be testable by a runner that never renders anything.
   `test-engineer` found it uncovered: reverting it would have reintroduced the
   owner's flagship defect and turned nothing red. */
export function shownObservation(observation, reading) {
  if (observation) return observation;
  if (!reading) return null;
  /* No engine answer for this parameter yet. The raw reading is the only thing
     anyone knows, and it says so rather than claiming to have been resolved. */
  return { value: reading.value, date: reading.date, count: 1, resolved: false };
}

/* The most recent point of a grouped series, for a surface that shows one
   figure and calls it the latest.

   `groups` is `chartGroupsFrom`'s output, so its last entry's value is the
   figure the engine used for the most recent test — not the last measurement
   typed. `fallback` covers a caller with no groups at all. */
export function latestShownValue(groups, fallback) {
  return groups && groups.length ? groups[groups.length - 1].value : fallback;
}
