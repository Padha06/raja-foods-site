import { RULES } from './config.js'

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
export const rs = (n) => `₹${inr.format(Math.round(n || 0))}`
export const num = (n, d = 0) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n || 0)

// Compact rupees for tiles: ₹4.2 L, ₹1.3 Cr
export const rsShort = (n) => {
  const a = Math.abs(n)
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(a >= 1e6 ? 1 : 2)} L`
  if (a >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`
  return rs(n)
}

// Dates are stored as yyyy-mm-dd strings so localStorage round-trips them exactly
export const iso = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
export const today = () => iso(new Date())
export const addDays = (s, n) => {
  const d = new Date(`${s}T00:00:00`)
  d.setDate(d.getDate() + n)
  return iso(d)
}
export const daysBetween = (a, b) => Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 864e5)
export const fmtDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
export const fmtDateLong = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtTime = (t) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })

export const invoiceTotal = (inv) => inv.lines.reduce((s, l) => s + l.qty * l.rate, 0) + (inv.transport || 0) - (inv.discount || 0)

// Ledger for one buyer or hotel: opening balance, then invoices, receipts and credit notes in date
// order, with the running balance computed from posted entries (never typed over).
export function partyLedger(state, partyId) {
  const p = state.parties.find((x) => x.id === partyId)
  const rows = [{ date: p.openingDate, kind: 'Opening balance', ref: 'OB', debit: p.opening, credit: 0 }]
  for (const inv of state.invoices) if (inv.partyId === partyId) rows.push({ date: inv.date, kind: inv.void ? 'Invoice (voided)' : 'Invoice', ref: inv.no, debit: inv.void ? 0 : invoiceTotal(inv), credit: 0, inv })
  for (const pay of state.payments) if (pay.partyId === partyId) rows.push({ date: pay.date, kind: pay.kind === 'credit' ? 'Credit note' : `Receipt · ${pay.method}`, ref: pay.ref || pay.id, debit: 0, credit: pay.amount, pay })
  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.debit ? -1 : 1))
  let bal = 0
  for (const r of rows) r.balance = bal += r.debit - r.credit
  return rows
}

// Allocate receipts to invoices: explicit allocations first, the rest oldest-first.
// Returns each open invoice with what is still due and its age, plus any unallocated credit.
export function openItems(state, partyId) {
  const p = state.parties.find((x) => x.id === partyId)
  const items = [{ no: 'OB', date: p.openingDate, total: p.opening, due: p.opening, dueDays: 0 }]
  for (const inv of state.invoices)
    if (inv.partyId === partyId && !inv.void) items.push({ no: inv.no, date: inv.date, total: invoiceTotal(inv), due: invoiceTotal(inv), dueDays: p.creditDays, inv })
  items.sort((a, b) => (a.date < b.date ? -1 : 1))
  let spare = 0
  const pays = state.payments.filter((x) => x.partyId === partyId).sort((a, b) => (a.date < b.date ? -1 : 1))
  for (const pay of pays) {
    let left = pay.amount
    for (const a of pay.alloc || []) {
      const it = items.find((i) => i.no === a.no)
      if (!it) continue
      const take = Math.min(it.due, a.amount, left)
      it.due -= take
      left -= take
    }
    for (const it of pay.allocationMode === 'explicit' ? [] : items) {
      if (left <= 0) break
      const take = Math.min(it.due, left)
      it.due -= take
      left -= take
    }
    spare += left
  }
  const t = today()
  const open = items.filter((i) => i.due > 0.5).map((i) => ({ ...i, age: Math.max(0, daysBetween(addDays(i.date, i.dueDays), t)) }))
  return { open, unallocated: spare }
}

export const AGING_LABELS = ['Current', '1–7 days', '8–30 days', '31–60 days', 'Over 60']
export function agingOf(open) {
  const b = [0, 0, 0, 0, 0]
  const [, a1, a2, a3] = RULES.agingBuckets
  for (const i of open) {
    const k = i.age <= 0 ? 0 : i.age <= a1 ? 1 : i.age <= a2 ? 2 : i.age <= a3 ? 3 : 4
    b[k] += i.due
  }
  return b
}

export function partySummary(state, partyId) {
  const p = state.parties.find((x) => x.id === partyId)
  const { open, unallocated } = openItems(state, partyId)
  const outstanding = open.reduce((s, i) => s + i.due, 0) - unallocated
  const overdue = open.filter((i) => i.age > 0).reduce((s, i) => s + i.due, 0)
  const aging = agingOf(open)
  const oldest = open.reduce((m, i) => Math.max(m, i.age), 0)
  return { party: p, outstanding, overdue, aging, oldest, open, unallocated, overLimit: p.creditLimit && outstanding > p.creditLimit }
}

// Farm bird book for a date range: opening + received − mortality − transferred/sold = closing
export function birdBook(state, from, to) {
  let opening = 0
  const r = { received: 0, mortality: 0, transferred: 0, sold: 0 }
  for (const m of state.birdMoves) {
    const sign = m.type === 'received' || m.type === 'opening' ? 1 : -1
    if (m.date < from) opening += sign * m.qty
    else if (m.date <= to && m.type !== 'opening') r[m.type] += m.qty
    else if (m.date <= to && m.type === 'opening') opening += m.qty
  }
  return { opening, ...r, closing: opening + r.received - r.mortality - r.transferred - r.sold }
}

export function feedStock(state, itemId) {
  return state.feedMoves.filter((m) => m.item === itemId).reduce((s, m) => s + (m.type === 'purchase' || m.type === 'opening' ? m.bags : -m.bags), 0)
}

export function retailStock(state, productId) {
  return state.retailMoves.filter((m) => m.product === productId).reduce((s, m) => s + (m.type === 'received' || m.type === 'opening' ? m.kg : -m.kg), 0)
}

export const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + f(x), 0)

export function downloadCSV(name, rows) {
  const esc = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv' }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
