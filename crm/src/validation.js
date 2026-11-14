import { productError, catalogOf } from './catalog.js'
import { birdBook, feedStock, retailStock, invoiceTotal, today } from './lib.js'

// Business validation for the demo. Production must enforce these rules on the server too.
export function validateAction(state, type, p = {}, user) {
  if (!user) return 'Sign in first.'
  if (type === 'product') return user.id !== 'owner' ? 'Only the owner can manage products.' : productError(state,p)
  if (type === 'stockReceipt' && (user.id !== 'owner' || !catalogOf(state).some(x=>x.id===p.product && x.units.includes('retail')) || !Number.isFinite(p.kg) || p.kg <= 0 || !p.reason?.trim())) return 'Choose a retail product, positive quantity and source note.'
  const positive = n => Number.isFinite(n) && n > 0
  const birds = n => positive(n) && Number.isInteger(n)
  const available = birdBook(state, '2000-01-01', today()).closing
  if (p.date && (!/^\d{4}-\d{2}-\d{2}$/.test(p.date) || p.date > today())) return 'Choose a valid date no later than today.'
  if (type === 'mortality' && (!birds(p.qty) || p.qty > available || !p.reason?.trim())) return 'Mortality requires an available bird count and a reason.'
  if (type === 'transfer' && (!birds(p.qty) || p.qty > available)) return 'Transfer exceeds available birds or has an invalid count.'
  if (type === 'batch' && (!birds(p.qty) || !Number.isFinite(p.cost) || p.cost < 0 || state.batches.some(b => b.id === p.id))) return 'Use a unique batch ID, positive bird count and valid cost.'
  if (type === 'feed' && (!positive(p.bags) || !state.feed.some(f => f.id === p.item) || (p.kind === 'issued' && p.bags > feedStock(state,p.item)))) return 'Feed quantity is invalid or exceeds stock.'
  if (type === 'retailWaste' && (!positive(p.kg) || p.kg > retailStock(state,p.product) || !p.reason?.trim())) return 'Wastage requires available stock and a reason.'
  if (type === 'processing') {
    if (!birds(p.birds) || p.birds > available || !positive(p.liveKg) || !positive(p.dressedKg) || p.dressedKg > p.liveKg) return 'Processing quantities must be positive, available, and dressed weight cannot exceed live weight.'
    const entries = Object.entries(p.split || {})
    if (!entries.length || entries.some(([,n]) => !Number.isFinite(n) || n < 0) || Math.abs(entries.reduce((s,[,n])=>s+n,0)-p.dressedKg)>0.11) return 'Product output must equal dressed weight.'
  }
  if (type === 'invoice') {
    if ((p.lines || []).some(l => l.product && !catalogOf(state).some(product => product.id === l.product && product.active !== false && product.units.includes(p.unit)))) return 'Choose an active product for this business unit.'
    if (!p.lines?.length || p.lines.some(l=>!positive(l.qty) || !positive(l.rate)) || !Number.isFinite(p.paid) || p.paid<0 || p.paid>invoiceTotal(p)+0.5) return 'Check bill quantities, rates and payment amount.'
    if (p.unit !== 'retail' && (p.lines.some(l=>!birds(l.birds)) || p.lines.reduce((s,l)=>s+l.birds,0)>available)) return 'Bill exceeds available bird stock or contains an invalid bird count.'
    const totals = {}
    for (const l of p.lines) if (p.unit === 'retail' && l.product) totals[l.product]=(totals[l.product]||0)+l.qty
    if (Object.entries(totals).some(([k,n])=>n>retailStock(state,k)+0.001)) return 'Bill exceeds available product stock.'
  }
  if (type === 'payment') {
    if (!positive(p.amount) || !state.parties.some(x=>x.id===p.partyId)) return 'Choose an account and positive payment amount.'
    if (p.kind === 'credit' && !p.note?.trim()) return 'A credit note requires a reason.'
    if ((p.alloc||[]).some(a=>!positive(a.amount)) || (p.alloc||[]).reduce((s,a)=>s+a.amount,0)>p.amount+0.01) return 'Allocated amounts cannot exceed the payment.'
  }
  if (type === 'deliverStop') {
    const d=state.dispatches.find(x=>x.id===p.dispatch), stop=d?.stops.find(x=>x.partyId===p.partyId)
    const used=d?.stops.filter(x=>x.status==='Delivered').reduce((s,x)=>s+x.birds,0)||0
    if (!stop || stop.status!=='Pending' || d.status==='Closed' || !birds(p.birds) || p.birds>d.loaded-used || !positive(p.kg) || p.paid<0 || p.paid>p.kg*stop.rate+0.5) return 'Delivery is already posted or quantities exceed the load.'
  }
  if (type === 'void' && (user.id!=='owner' || !p.reason?.trim() || state.invoices.find(i=>i.no===p.no)?.void)) return 'Only the owner may reverse an active bill, with a reason.'
  if (['expense','wpay'].includes(type) && !positive(p.amount)) return 'Amount must be positive.'
  return null
}
