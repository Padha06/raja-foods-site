// One-time migration: sample invoices must not consume real billing numbers.
// Saved user bills retain their references and cannot be reused by the new series.
export function prepareBillingSeries(data) {
  if (data.billingSeriesVersion === 2) return data
  const references = new Map()
  for (const inv of data.invoices || []) {
    if (!inv.createdAt && !inv.no.startsWith('DEMO-')) references.set(inv.no, `DEMO-${inv.no}`)
  }
  const ref = value => references.get(value) || value
  const note = value => typeof value === 'string' ? value.replace(/\b(?:RFD|RWL|RBH|RBC)-\d+\b/g, ref) : value
  return {
    ...data, billingSeriesVersion: 2,
    invoices: (data.invoices || []).map(i => ({...i, no:ref(i.no), archivedSeries:true})),
    payments: (data.payments || []).map(p => ({...p, alloc:(p.alloc || []).map(a=>({...a,no:ref(a.no)}))})),
    dispatches: (data.dispatches || []).map(d=>({...d,stops:d.stops.map(s=>({...s,invoice:ref(s.invoice)}))})),
    birdMoves: (data.birdMoves || []).map(m=>({...m,note:note(m.note)})),
    retailMoves: (data.retailMoves || []).map(m=>({...m,note:note(m.note)})),
    audit: (data.audit || []).map(a=>({...a,detail:note(a.detail)})),
    lastInvoice:ref(data.lastInvoice),
  }
}
