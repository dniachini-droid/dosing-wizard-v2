import { useEffect, useMemo, useState } from 'react'
import { Btn, Field, SectionTitle, inputCls } from './DoseExpectation.jsx'
import { Card } from './ErrorBoundary.jsx'
import { ZoomableLineChart } from './ZoomableChart.jsx'
import { Plus, X } from '../icons.jsx'
import { fmtDate, fmtShort, todayStr } from '../lib/dates.js'

/* ---------------------------------- ICP Panel ---------------------------------- */

/* V1's ICP entry, ported, with three things gone.

   THE REFERENCE BANDS. V1 shaded every element graph against `icpRef` — a
   table of a lab's published ranges — and wrote a sentence about what the band
   meant. Those are band edges for twenty-odd elements, and a band edge is
   chemistry: it comes from the canon and the canon has nothing to say about
   any of them. `ICP_GROUPS`, which ordered the elements "the ones you manage
   first, contaminants last", is the same judgement in a different form. Both
   are gone; the elements are listed as they were entered.

   THE PHOTO UPLOAD. Out by the brief for now — "No file upload for now" —
   along with V1's image compression and its photo store.

   `PAST RESULTS`. Out by the brief: "V1's `Past results` list is not carried —
   the graph covers it."
*/

export function IcpPanel({ icps, onAdd, onDelete }) {
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [rows, setRows] = useState([{ name: "", value: "" }]);

  const elementNames = useMemo(() => {
    const set = new Set();
    icps.forEach((t) => Object.keys(t.elements || {}).forEach((k) => set.add(k)));
    return Array.from(set).sort();
  }, [icps]);

  const [graphEl, setGraphEl] = useState("");
  useEffect(() => {
    if (graphEl || !elementNames.length) return;
    setGraphEl(elementNames[0]);
  }, [elementNames]);

  const updateRow = (i, field, val) => {
    const next = [...rows]; next[i] = { ...next[i], [field]: val }; setRows(next);
  };
  const addRow = () => setRows([...rows, { name: "", value: "" }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const [saveMsg, setSaveMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const elements = {};
    rows.forEach((r) => { if (r.name.trim() && r.value !== "") elements[r.name.trim()] = parseFloat(r.value); });
    if (Object.keys(elements).length === 0) {
      setSaveMsg("Add at least one element name and value before saving.");
      return;
    }
    const ok = await onAdd({ date, note: note.trim(), elements });
    if (ok === false) {
      setSaveMsg("Could not save — see the message at the top of the screen.");
      return;
    }
    setSaveMsg(`Saved ${Object.keys(elements).length} element${Object.keys(elements).length === 1 ? "" : "s"} for ${fmtDate(date)}.`);
    setTimeout(() => setSaveMsg(null), 4000);
    setRows([{ name: "", value: "" }]); setNote("");
  };

  /* `icps` arrives oldest first, in the ledger's own total order. */
  const graphData = useMemo(() => {
    return icps.filter((t) => t.elements && t.elements[graphEl] != null)
      .map((t) => ({ label: fmtShort(t.date), value: t.elements[graphEl], date: t.date }));
  }, [icps, graphEl]);

  return (
    <div>
      <SectionTitle eyebrow="Every 6 weeks" title="ICP Panel" />

      <Card className="p-4 mb-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Test date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} max={todayStr()} /></Field>
            <Field label="Note (optional)"><input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="e.g. Triton, after WC" /></Field>
          </div>

          <div>
            <span className="block text-xs font-bold text-ink2 mb-1.5">Elements</span>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <input type="text" value={r.name} onChange={(e) => updateRow(i, "name", e.target.value)} placeholder="Element, e.g. Iodine" className={inputCls} />
                  </div>
                  <div className="w-24 shrink-0">
                    <input type="number" inputMode="decimal" step="any" value={r.value} onChange={(e) => updateRow(i, "value", e.target.value)} placeholder="value" className={inputCls} />
                  </div>
                  <button type="button" onClick={() => removeRow(i)} aria-label="Remove element"
                    className="text-ink2 hover:text-rose-700 shrink-0 w-8 h-8 flex items-center justify-center rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addRow} className="mt-2 text-xs font-bold text-teal-brand flex items-center gap-1"><Plus size={12} /> Add element</button>
          </div>

          {saveMsg && <p className="text-[12px] font-bold text-teal-brand">{saveMsg}</p>}
          <Btn type="submit"><span className="flex items-center gap-1.5"><Plus size={14} /> Save ICP result</span></Btn>
        </form>
      </Card>

      {elementNames.length > 0 && (
        <>
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-teal-brand font-extrabold mb-1">Trend</div>
            <h2 className="text-2xl font-display text-ink mb-3">Element graph</h2>
            <div className="w-full sm:w-52">
              <select value={graphEl} onChange={(e) => setGraphEl(e.target.value)} className={inputCls}>
                {elementNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <Card className="p-4 mb-8">
            {/* No shaded band. V1 drew one from a lab's published range per
                element; those are band edges, band edges are chemistry, and
                the canon states none for any element here. The trace is the
                trace. */}
            <ZoomableLineChart data={graphData} color="#B8541A" height={240}
              paramName={graphEl} unit="" />
            <p className="text-[11px] text-ink2 font-medium leading-relaxed mt-2">
              Every element is kept and charted. None of them is assessed, and no range is
              shaded, because there is no reference range for any of them in this build's canon.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
