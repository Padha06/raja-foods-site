import { createContext, useContext, useEffect, useMemo, useReducer, useState, useCallback } from 'react'
import { catalogOf, saveProduct, nextInvoiceNumber } from './catalog.js'
import { makeSeed } from './data.js'
import { ROLES } from './config.js'
import { validateAction } from './validation.js'
import { prepareBillingSeries } from './billing-series.js'
import { today, invoiceTotal, birdBook, rs, num } from './lib.js'

const KEY = 'raja-foods-demo'
const Ctx = createContext(null)

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    // Preserve user records across days. Only an explicit reset may replace them.
    if (s && s.version === 4) return prepareBillingSeries(s)
  } catch {}
  return prepareBillingSeries(makeSeed())
}

let uid = Date.now() % 100000
const id = (p) => `${p}${++uid}`

const nextNo = nextInvoiceNumber

export function reducer(state, { type, p, user }) {
  const log = (action, detail, unit, flag) => [{ id: id('A'), at: Date.now(), who: user.person, role: user.label, unit, action, detail, flag }, ...state.audit]
  const d = p?.date || today()
  switch (type) {
    case 'product': {
      const next = saveProduct(state, p, id('P'))
      return { ...next, audit: log(p.id ? 'Updated product' : 'Added product', p.name, p.units[0]) }
    }
    case 'stockReceipt':
      return { ...state, retailMoves: [...state.retailMoves, { id: id('RM'), date: d, product: p.product, type: 'received', kg: p.kg, note: p.reason, by: user.person }], audit: log('Received shop stock', `${p.kg} kg · ${p.reason}`, 'retail') }
    case 'reset':
      return prepareBillingSeries(makeSeed())
    case 'mortality':
      return { ...state, birdMoves: [...state.birdMoves, { id: id('BM'), date: d, type: 'mortality', qty: p.qty, batch: p.batch, reason: p.reason, note: p.note || '', by: user.person }], audit: log('Logged mortality', `${p.qty} birds · ${p.batch} · ${p.reason}`, 'farm') }
    case 'batch': {
      const b = { id: p.id, date: d, source: p.source, type: 'Broiler · Cobb 430', qty: p.qty, costPerBird: p.cost, shed: p.shed, status: 'Growing', avgKg: 0.045, ageDays: 0 }
      return {
        ...state,
        batches: [b, ...state.batches],
        birdMoves: [...state.birdMoves, { id: id('BM'), date: d, type: 'received', qty: p.qty, batch: p.id, note: `Chicks placed in ${p.shed}`, by: user.person }],
        expenses: [{ id: id('E'), date: d, unit: 'farm', category: 'Chicks', payee: p.source, amount: p.qty * p.cost, method: 'Bank transfer', note: `Batch ${p.id}`, receipt: true, by: user.person }, ...state.expenses],
        audit: log('Placed new batch', `${p.id} · ${num(p.qty)} chicks · ${p.shed}`, 'farm'),
      }
    }
    case 'transfer':
      return { ...state, birdMoves: [...state.birdMoves, { id: id('BM'), date: d, type: 'transferred', qty: p.qty, to: p.to, batch: p.batch, note: p.note || '', by: user.person }], audit: log('Transferred birds', `${num(p.qty)} birds → ${p.to}`, 'farm', p.override) }
    case 'feed': {
      const mv = { id: id('FM'), date: d, item: p.item, type: p.kind, bags: p.bags, shed: p.shed, rate: p.rate, supplier: p.supplier, by: user.person }
      const item = state.feed.find((f) => f.id === p.item)
      const exp = p.kind === 'purchase' ? [{ id: id('E'), date: d, unit: 'farm', category: 'Feed', payee: p.supplier, amount: p.bags * p.rate, method: 'Bank transfer', note: `${p.bags} bags ${item.name}`, receipt: true, by: user.person }] : []
      return { ...state, feedMoves: [...state.feedMoves, mv], expenses: [...exp, ...state.expenses], audit: log(p.kind === 'purchase' ? 'Feed purchased' : 'Feed issued', `${p.bags} bags ${item.name}${p.shed ? ` · ${p.shed}` : ''}`, 'farm') }
    }
    case 'invoice': {
      const prefix = p.partyId === 'C1' ? 'RBC' : { district: 'RFD', local: 'RWL', retail: 'RBH' }[p.unit]
      const inv = { no: nextNo(state.invoices, prefix), unit: p.unit, partyId: p.partyId, date: d, lines: p.lines, transport: p.transport || 0, discount: p.discount || 0, status: p.unit === 'retail' ? 'Delivered' : 'Loading', vehicle: p.vehicle, driver: p.driver, note: p.note, by: user.person, createdAt: Date.now() }
      inv.seriesNumber = Number(inv.no.split('-').at(-1))
      let next = { ...state, invoices: [...state.invoices, inv] }
      const birds = p.lines.reduce((s, l) => s + (l.birds || 0), 0)
      if (birds && p.unit !== 'retail') next.birdMoves = [...state.birdMoves, { id: id('BM'), date: d, type: 'transferred', qty: birds, to: p.unit, batch: p.batch || '-', note: `Linked to ${inv.no}`, by: user.person }]
      if (p.unit === 'retail') next.retailMoves = [...state.retailMoves, ...p.lines.filter((l) => l.product).map((l) => ({ id: id('RM'), date: d, product: l.product, type: 'sold', kg: l.qty, note: inv.no }))]
      if (p.paid > 0) next.payments = [...state.payments, { id: id('RC-'), partyId: p.partyId, date: d, amount: p.paid, method: p.method, ref: '', alloc: [{ no: inv.no, amount: p.paid }], by: user.person }]
      next.audit = log('Created invoice', `${inv.no} · ${rs(invoiceTotal(inv))}${p.paid ? ` · paid ${p.method}` : ' · on credit'}`, p.unit, p.override)
      next.lastInvoice = inv.no
      return next
    }
    case 'payment': {
      const party = state.parties.find((x) => x.id === p.partyId)
      const pay = { id: id(p.kind === 'credit' ? 'CN-' : 'RC-'), kind: p.kind, allocationMode: p.allocationMode, partyId: p.partyId, date: d, amount: p.amount, method: p.kind === 'credit' ? 'Credit note' : p.method, ref: p.ref, note: p.note, alloc: p.alloc || [], by: user.person }
      return { ...state, payments: [...state.payments, pay], audit: log(p.kind === 'credit' ? 'Issued credit note' : 'Received payment', `${party.name} · ${rs(p.amount)}${p.method ? ` · ${p.method}` : ''}`, party.unit) }
    }
    case 'void': {
      // a voided bill puts its birds / kg back, so stock never drifts from the bills
      const inv = state.invoices.find((i) => i.no === p.no)
      if (!inv || inv.void || !p.reason?.trim() || user.id !== 'owner') return state
      const birds = inv.lines.reduce((s, l) => s + (l.birds || 0), 0)
      const back = birds && inv.unit !== 'retail' ? [{ id: id('BM'), date: today(), type: 'received', qty: birds, batch: '-', note: `Reversed ${inv.no}`, by: user.person }] : []
      const kg = inv.unit === 'retail' ? inv.lines.filter((l) => l.product).map((l) => ({ id: id('RM'), date: today(), product: l.product, type: 'received', kg: l.qty, note: `Reversed ${inv.no}` })) : []
      return { ...state, invoices: state.invoices.map((i) => (i.no === p.no ? { ...i, void: true, voidReason: p.reason } : i)), birdMoves: [...state.birdMoves, ...back], retailMoves: [...state.retailMoves, ...kg], audit: log('Voided invoice', `${p.no} · reason: ${p.reason}`, p.unit, true) }
    }
    case 'dispatchStatus':
      return { ...state, invoices: state.invoices.map((i) => (i.no === p.no ? { ...i, status: p.status } : i)), audit: log('Updated dispatch', `${p.no} → ${p.status}`, 'district') }
    case 'deliverStop': {
      const ds = state.dispatches.find((x) => x.id === p.dispatch)
      const stop = ds.stops.find((s) => s.partyId === p.partyId)
      const no = nextNo(state.invoices, 'RWL')
      const inv = { no, seriesNumber: Number(no.split('-').at(-1)), unit: 'local', partyId: p.partyId, date: ds.date, lines: [{ item: 'Live broiler', birds: p.birds, qty: p.kg, uom: 'kg', rate: stop.rate }], transport: 0, status: 'Delivered', route: ds.route, vehicle: ds.vehicle, driver: ds.driver, by: user.person, createdAt: Date.now() }
      const pays = p.paid > 0 ? [{ id: id('RC-'), partyId: p.partyId, date: ds.date, amount: p.paid, method: 'Cash', ref: '', alloc: [{ no, amount: p.paid }], by: user.person }] : []
      const party = state.parties.find((x) => x.id === p.partyId)
      return {
        ...state,
        invoices: [...state.invoices, inv],
        payments: [...state.payments, ...pays],
        dispatches: state.dispatches.map((x) => (x.id === ds.id ? { ...x, stops: x.stops.map((s) => (s.partyId === p.partyId ? { ...s, birds: p.birds, kg: p.kg, invoice: no, status: 'Delivered' } : s)) } : x)),
        audit: log('Delivered stop', `${party.name} · ${p.birds} birds · ${no}${p.paid ? ` · ${rs(p.paid)} cash` : ''}`, 'local'),
      }
    }
    case 'closeDispatch': {
      const ds = state.dispatches.find((x) => x.id === p.dispatch)
      if (!ds || ds.status === 'Closed') return state
      const delivered = ds.stops.reduce((s, x) => s + (x.status === 'Delivered' ? x.birds : 0), 0)
      if (!Number.isInteger(p.lost) || p.lost < 0 || p.lost > ds.loaded - delivered) return state
      const back = ds.loaded - delivered - p.lost
      // returned birds go back to farm stock, so only delivered + lost leave it
      const moves = back > 0 ? [{ id: id('BM'), date: ds.date, type: 'received', qty: back, batch: '-', note: `Returned from ${ds.route}`, by: user.person }] : []
      return { ...state, birdMoves: [...state.birdMoves, ...moves], dispatches: state.dispatches.map((x) => (x.id === ds.id ? { ...x, status: 'Closed', returned: back, lost: p.lost, stops: x.stops.map((s) => (s.status === 'Pending' ? { ...s, status: 'Skipped' } : s)) } : x)), audit: log('Closed route', `${ds.route} · ${back} returned · ${p.lost} lost`, 'local', p.lost > 0) }
    }
    case 'expense':
      return { ...state, expenses: [{ id: id('E'), date: d, ...p, by: user.person }, ...state.expenses], audit: log('Added expense', `${p.category} · ${rs(p.amount)} · ${p.payee}`, p.unit === 'admin' ? 'farm' : p.unit) }
    case 'attendance':
      return { ...state, attendance: { ...state.attendance, [p.date]: { ...(state.attendance[p.date] || {}), [p.workerId]: p.status } } }
    case 'wpay': {
      const w = state.workers.find((x) => x.id === p.workerId)
      return { ...state, wpay: [...state.wpay, { id: id('WP'), date: d, ...p, by: user.person }], audit: log(p.type === 'advance' ? 'Gave advance' : p.type === 'salary' ? 'Paid salary' : 'Recorded repayment', `${w.name} · ${rs(p.amount)}`, w.unit) }
    }
    case 'worker':
      return { ...state, workers: [...state.workers, { id: id('W'), active: true, joined: today(), ...p }], audit: log('Added worker', `${p.name} · ${p.role}`, p.unit) }
    case 'todo':
      return { ...state, todos: state.todos.map((t) => (t.id === p.id ? { ...t, done: !t.done } : t)) }
    case 'retailWaste':
      return { ...state, retailMoves: [...state.retailMoves, { id: id('RM'), date: d, product: p.product, type: 'wastage', kg: p.kg, note: p.reason }], audit: log('Recorded wastage', `${p.kg} kg · ${p.reason}`, 'retail') }
    case 'processing': {
      const dressed = p.dressedKg
      const prods = p.split
      return {
        ...state,
        processing: [...state.processing, { id: id('PR-'), date: d, birds: p.birds, liveKg: p.liveKg, dressedKg: dressed, wastageKg: 0, by: user.person }],
        birdMoves: [...state.birdMoves, { id: id('BM'), date: d, type: 'transferred', qty: p.birds, to: 'retail', batch: p.batch || '-', note: 'For processing', by: user.person }],
        retailMoves: [...state.retailMoves, ...Object.entries(prods).filter(([, kg]) => kg > 0).map(([product, kg]) => ({ id: id('RM'), date: d, product, type: 'received', kg, note: 'From processing' }))],
        audit: log('Processed birds', `${p.birds} birds → ${dressed} kg dressed`, 'retail'),
      }
    }
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [data, raw] = useReducer(reducer, null, load)
  const [roleId, setRoleId] = useState(() => {
    try { return sessionStorage.getItem('raja-role') } catch { return null }
  })
  const [unitFilter, setUnitFilter] = useState('all')
  const [toasts, setToasts] = useState([])
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
      setStorageError(false)
    } catch { setStorageError(true) }
  }, [data])
  useEffect(() => {
    try { roleId ? sessionStorage.setItem('raja-role', roleId) : sessionStorage.removeItem('raja-role') } catch {}
    setUnitFilter('all')
  }, [roleId])

  const user = roleId ? ROLES[roleId] : null
  const toast = useCallback((msg, tone = 'ok') => {
    const t = { id: id('T'), msg, tone }
    setToasts((x) => [...x, t])
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== t.id)), 3200)
  }, [])
  const dispatch = useCallback((type, p, msg) => {
    const error = validateAction(data, type, p, user)
    if (error) { toast(error, 'warn'); return false }
    raw({ type, p, user })
    if (msg) toast(msg)
    return true
  }, [data, user, toast])

  const can = useCallback((mod) => !!user && (user.modules === 'all' || user.modules.includes(mod)), [user])
  // units this user may see, narrowed by the header filter
  const units = useMemo(() => (!user ? [] : unitFilter === 'all' ? user.units : user.units.filter((u) => u === unitFilter)), [user, unitFilter])

  const value = { data, dispatch, user, roleId, setRoleId, can, units, unitFilter, setUnitFilter, toast, toasts, storageError }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

export function useBirdsOnHand() {
  const { data } = useStore()
  return birdBook(data, '2000-01-01', today()).closing
}
