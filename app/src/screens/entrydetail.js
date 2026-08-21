/* ============================================================================
   ONE ENTRY — VIEW, EDIT, SUPERSEDE, MARK SUSPECT, MARK INVALID
   ----------------------------------------------------------------------------
   One item, one sheet, reachable from Today's stepper, from Test Lab, from
   Tasks, from the calendar and from a point on a chart.

   Every route to it ends here, and every action here appends. Nothing on this
   screen overwrites anything, and the sheet says so before the keeper commits
   — because "edit" almost everywhere else means "destroy the previous value",
   and here it does not.
   ========================================================================= */

import { h } from "../ui/dom.js";
import { openSheet, timeControl, supersedeReading, auditConsequence } from "./entry.js";
import { ANNOTATION, parameterDef } from "../store/ledger.js";
import { PROVENANCE, describeTime } from "../store/time.js";
import { fmtDayName, fmtEventTime } from "../ui/format.js";
import { t } from "../strings.js";

export async function openEntrySheet(ctx, eventId) {
  const projected = await ctx.store.ledger.projection();
  const row = projected.find((r) => r.event.eventId === eventId);
  if (!row) return;
  const e = row.event;
  const def = e.parameter ? parameterDef(e.parameter) : null;

  const body = h("div");

  body.append(
    h(
      "div",
      { class: "kv" },
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("entry.detail.what")), h("span", { class: "kv-v" }, def ? def.label : e.kind)),
      e.rawValue != null
        ? h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("entry.detail.asTyped")), h("span", { class: "kv-v" }, t("entry.detail.value", { value: e.rawValue, unit: e.unit || "" })))
        : null,
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("entry.detail.whenHappened")), h("span", { class: "kv-v" }, fmtEventTime(e.time))),
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("entry.detail.howWellKnown")), h("span", { class: "kv-v" }, describeTime(e.time))),
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("entry.detail.whenTold")), h("span", { class: "kv-v" }, fmtDayName(e.recordedAt.slice(0, 10)))),
      h("div", { class: "kv-row" }, h("span", { class: "kv-k" }, t("entry.detail.state")), h("span", { class: "kv-v" }, stateWords(row)))
    )
  );

  if (e.time.timeProvenance === PROVENANCE.DATE_ONLY) {
    body.append(
      h(
        "div",
        { class: "callout quiet" },
        h("p", null, t("entry.dateOnly.head")),
        h("p", null, t("entry.dateOnly.body")),
        h("p", null, t("entry.dateOnly.cannot"))
      )
    );
  }

  if (row.supersededBy) {
    body.append(
      h(
        "div",
        { class: "callout attention" },
        h("p", null, t("entry.superseded.head")),
        h("button", { class: "btn btn-quiet", type: "button", onclick: () => openEntrySheet(ctx, row.supersededBy) }, t("entry.superseded.open"))
      )
    );
  }

  if (row.notes.length) {
    body.append(h("p", { class: "seclabel" }, t("entry.notes")));
    row.notes.forEach((n) => body.append(h("p", { class: "body" }, n)));
  }

  openSheet({
    title: t("entry.detail.title"),
    body,
    actions: (close) => [
      row.state === "SUPERSEDED"
        ? null
        : h("button", { class: "btn btn-primary", type: "button", onclick: () => { close(); openCorrectSheet(ctx, row); } }, t("entry.correct")),
      row.state === "SUSPECT"
        ? h("button", { class: "btn", type: "button", onclick: async () => { await annotate(ctx, e.eventId, ANNOTATION.WITHDRAW); close(); ctx.refresh(); } }, t("entry.mark.unsuspect"))
        : h("button", { class: "btn", type: "button", onclick: () => { close(); openMarkSheet(ctx, row, ANNOTATION.MARK_SUSPECT); } }, t("entry.mark.suspect")),
      row.state === "INVALID"
        ? null
        : h("button", { class: "btn btn-quiet", type: "button", onclick: () => { close(); openMarkSheet(ctx, row, ANNOTATION.MARK_INVALID); } }, t("entry.mark.invalid")),
      h("button", { class: "btn btn-quiet", type: "button", onclick: close }, t("action.close")),
    ].filter(Boolean),
  });
}

function stateWords(row) {
  return {
    CURRENT: t("entry.state.current"),
    SUPERSEDED: t("entry.state.superseded"),
    SUSPECT: t("entry.state.suspect"),
    INVALID: t("entry.state.invalid"),
  }[row.state];
}

function openCorrectSheet(ctx, row) {
  const e = row.event;
  const def = e.parameter ? parameterDef(e.parameter) : null;
  const input = h("input", { class: "input", inputmode: "decimal", value: e.rawValue ?? "", "aria-label": t("entry.correct.correctedValue") });
  const note = h("input", { class: "input", "aria-label": t("entry.correct.why"), placeholder: t("entry.correct.why") });

  /* The time control opens on what the original actually had. It cannot offer
     a stronger provenance than the original carried — the options above the
     original's are removed, not disabled, because a disabled control still
     tells the keeper the app could do it if only they insisted. */
  const tc = timeControl({
    initialDate: e.time.localDate,
    initialTime: e.time.localTime || "",
    initialProvenance: e.time.timeProvenance,
  });
  if (e.time.timeProvenance === PROVENANCE.DATE_ONLY) {
    /* Matched on the option's own key rather than on its rendered text, so a
       language pass that rewords "Date only" cannot silently re-enable the
       stronger options on a date-only record. */
    tc.removeOptionsAbove(PROVENANCE.DATE_ONLY);
  }

  const msg = h("p", { class: "hint" });
  const body = h("div");
  body.append(
    h(
      "div",
      { class: "field" },
      h(
        "span",
        { class: "flabel" },
        def ? t("entry.correct.value", { label: def.label, unit: def.unit }) : t("entry.correct.valuePlain")
      ),
      input
    ),
    tc.node,
    h("div", { class: "field" }, h("span", { class: "flabel" }, t("entry.correct.why")), note),
    h("p", { class: "seclabel" }, t("entry.correct.whatThisDoes"))
  );
  auditConsequence(row).forEach((line) => body.append(h("p", { class: "body" }, line)));
  body.append(msg);

  openSheet({
    title: t("entry.correct.title"),
    body,
    actions: (close) => [
      h(
        "button",
        {
          class: "btn btn-primary",
          type: "button",
          onclick: async () => {
            const when = tc.read();
            if (!when.ok) return void (msg.textContent = when.why);
            try {
              await supersedeReading(ctx.store, {
                originalEventId: e.eventId,
                rawValue: input.value,
                time: when.time,
                note: note.value.trim() || null,
              });
              close();
              ctx.refresh();
            } catch (err) {
              msg.textContent = err.message;
            }
          },
        },
        t("entry.correct.save")
      ),
      h("button", { class: "btn btn-quiet", type: "button", onclick: close }, t("action.cancel")),
    ],
  });
}

function openMarkSheet(ctx, row, type) {
  const suspect = type === ANNOTATION.MARK_SUSPECT;
  const note = h("input", { class: "input", "aria-label": t("entry.correct.why"), placeholder: t("entry.correct.why") });
  const body = h(
    "div",
    null,
    h("div", { class: "field" }, h("span", { class: "flabel" }, t("entry.correct.why")), note),
    h("p", { class: "seclabel" }, t("entry.correct.whatThisDoes")),
    h("p", { class: "body" }, suspect ? t("entry.mark.suspectBody") : t("entry.mark.invalidBody")),
    suspect
      ? h(
          "div",
          { class: "callout quiet" },
          h("p", null, t("entry.mark.suspectLimitHead")),
          h("p", null, t("entry.mark.suspectLimitBody"))
        )
      : null
  );

  openSheet({
    title: suspect ? t("entry.mark.suspectTitle") : t("entry.mark.invalidTitle"),
    body,
    actions: (close) => [
      h(
        "button",
        {
          class: "btn btn-primary",
          type: "button",
          onclick: async () => {
            await annotate(ctx, row.event.eventId, type, note.value.trim() || null);
            close();
            ctx.refresh();
          },
        },
        suspect ? t("entry.mark.suspect") : t("entry.mark.invalid")
      ),
      h("button", { class: "btn btn-quiet", type: "button", onclick: close }, t("action.cancel")),
    ],
  });
}

async function annotate(ctx, targetEventId, type, note = null) {
  await ctx.store.ledger.annotate({
    type,
    targetEventId,
    recordedAt: new Date().toISOString(),
    note,
  });
}
