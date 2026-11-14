import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Printer, Share2, Ban, TriangleAlert } from 'lucide-react'
import { useStore } from '../store.jsx'
import { UNITS, BRAND, PAYMENT_METHODS, ROUTES } from '../config.js'
import { productsFor } from '../catalog.js'
import { go } from '../nav.js'
import { birdBook, invoiceTotal, openItems, partySummary, retailStock, rs, num, today, fmtDate, fmtDateLong } from '../lib.js'
import { Modal, Field, Input, Select, Button, Badge, Segmented, cx } from './ui.jsx'

const LIVE = { item: 'Live broiler', birds: '', qty: '', uom: 'kg' }

export function InvoiceModal({ open, onClose, unit: fixedUnit, partyId: fixedParty, onCreated }) {
  const { data, dispatch, user } = useStore()
  const PRODUCTS = productsFor(data, 'retail', true)
  const sellUnits = ['district', 'local', 'retail'].filter((u) => user.units.includes(u))
  const [unit, setUnit] = useState(fixedUnit || sellUnits[0])
  const liveProducts = productsFor(data, unit, true)
  const parties = data.parties.filter((p) => p.unit === unit)
  const [partyId, setPartyId] = useState(fixedParty || parties[0]?.id)
  const party = data.parties.find((p) => p.id === partyId) || parties[0]
  const [lines, setLines] = useState([])
  const [transport, setTransport] = useState('')
  const [pay, setPay] = useState('credit')
  const [method, setMethod] = useState('Cash')
  const [partial, setPartial] = useState('')
  const [route, setRoute] = useState('R1')

  // reset lines whenever the buyer changes, with that buyer's agreed rate
  useEffect(() => {
    if (!open) return
    const p = data.parties.find((x) => x.id === partyId)
    if (!p) return
    const initial = productsFor(data, unit, true)[0]
    if (unit === 'retail') setLines(initial ? [{product:initial.id, qty:'', rate:p.type === 'hotel' && initial.id === 'curry' ? p.rateKg : initial.price}] : [])
    else setLines(initial ? [{...LIVE, product:initial.id, item:initial.name, rate:initial.id === 'live' ? p.rateKg : initial.price}] : [])
    setPay(p.type === 'counter' ? 'full' : 'credit')
    setMethod(p.type === 'counter' ? 'UPI' : 'Cash')
  }, [partyId, open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      setUnit(fixedUnit || sellUnits[0])
      setPartyId(fixedParty || data.parties.find((p) => p.unit === (fixedUnit || sellUnits[0]))?.id)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const onHand = useMemo(() => birdBook(data, '2000-01-01', today()).closing, [data])
  if (!party) return null
  const norm = lines.map((l) => (unit === 'retail' ? { item: PRODUCTS.find((p) => p.id === l.product)?.name || l.item || 'Product', product: l.product, qty: +l.qty || 0, uom: 'kg', rate: +l.rate || 0 } : { item: liveProducts.find(p => p.id === l.product)?.name || l.item || 'Live broiler', product: l.product, birds: +l.birds || 0, qty: +l.qty || 0, uom: 'kg', rate: +l.rate || 0 }))
  const total = norm.reduce((s, l) => s + l.qty * l.rate, 0) + (+transport || 0)
  const birds = norm.reduce((s, l) => s + (l.birds || 0), 0)
  const overStock = unit !== 'retail' && birds > onHand
  const stockShort = unit === 'retail' ? norm.filter((l) => l.qty > retailStock(data, l.product)) : []
  const s = party.type !== 'counter' ? partySummary(data, party.id) : null
  const overLimit = s && party.creditLimit && s.outstanding + total > party.creditLimit
  const paid = pay === 'full' ? Math.round(total) : pay === 'part' ? +partial || 0 : 0
  const blocked = (overStock || stockShort.length) && user.id !== 'owner'

  const submit = (e) => {
    e.preventDefault()
    if (!total || blocked) return
    const r = ROUTES.find((x) => x.id === route)
    const saved = dispatch('invoice', { unit, partyId: party.id, lines: norm.filter((l) => l.qty > 0), transport: +transport || 0, paid, method, vehicle: unit === 'local' ? r.vehicle : undefined, driver: unit === 'local' ? r.driver : undefined, override: overStock || stockShort.length > 0 })
    if (!saved) return
    onClose()
    onCreated?.()
  }

  return (
    <Modal open={open} onClose={onClose} title="New bill" sub="Auto-numbered · stock and ledger update together" wide>
      {user.id === 'owner' && <Button type="button" variant="outline" icon={Plus} className="mb-3" onClick={() => go('products')}>Manage products / Add product</Button>}
      <form onSubmit={submit} className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {!fixedUnit && sellUnits.length > 1 && (
            <Field label="Unit">
              <Select value={unit} onChange={(e) => { setUnit(e.target.value); setPartyId(data.parties.find((p) => p.unit === e.target.value)?.id) }} options={sellUnits.map((u) => ({ value: u, label: UNITS[u].name }))} />
            </Field>
          )}
          <Field label={unit === 'retail' ? 'Hotel / customer' : 'Buyer'} className={fixedUnit || sellUnits.length < 2 ? 'col-span-2' : ''}>
            <Select value={party.id} onChange={(e) => setPartyId(e.target.value)} options={parties.map((p) => ({ value: p.id, label: `${p.name}${p.district ? ` · ${p.district}` : ''}` }))} />
          </Field>
        </div>
        {s && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-page px-3 py-2 text-[11px] text-ink-2 sm:text-xs">
            <span>Balance <b>{rs(s.outstanding)}</b></span>
            {s.overdue > 0 && <span className="text-crit-d">Overdue {rs(s.overdue)}</span>}
            <span>Credit {party.creditDays} days · limit {rs(party.creditLimit)}</span>
            <span>Agreed rate {rs(party.rateKg)}/kg</span>
          </div>
        )}

        {unit !== 'retail' && <Field label="Product"><Select value={lines[0]?.product || 'live'} options={liveProducts.map(p=>({value:p.id,label:p.name}))} onChange={e=>{const p=liveProducts.find(p=>p.id===e.target.value);setLines(lines.map(l=>({...l,product:p.id,item:p.name,rate:p.id==='live'?party.rateKg:p.price})))}} /></Field>}
        <div className="rounded-xl border border-line">
          <div className={cx('grid gap-2 border-b border-line px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]', unit === 'retail' ? 'grid-cols-[1.6fr_1fr_1fr_1fr_28px]' : 'grid-cols-[1fr_1fr_1fr_1fr_28px]')}>
            {unit === 'retail' ? <span>Product</span> : <span>Birds</span>}
            <span>{unit === 'retail' ? 'Kg' : 'Live kg'}</span>
            <span>Rate / kg</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          {lines.map((l, i) => {
            const set = (k, v) => setLines(lines.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
            return (
              <div key={i} className={cx('grid items-center gap-2 px-3 py-2', unit === 'retail' ? 'grid-cols-[1.6fr_1fr_1fr_1fr_28px]' : 'grid-cols-[1fr_1fr_1fr_1fr_28px]')}>
                {unit === 'retail' ? (
                  <Select value={l.product} onChange={(e) => { const p = PRODUCTS.find((x) => x.id === e.target.value); setLines(lines.map((x, j) => (j === i ? { ...x, product: p.id, rate: party.type === 'hotel' && ['curry','whole','boneless','leg','liver'].includes(p.id) ? (p.id === 'boneless' ? party.rateKg + 130 : party.rateKg) : p.price } : x))) }} options={PRODUCTS.map((p) => ({ value: p.id, label: p.name }))} />
                ) : (
                  <Input type="number" min="0" placeholder="0" required value={l.birds} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, birds: e.target.value, qty: x.qtyTouched ? x.qty : e.target.value ? Math.round(+e.target.value * 2.2) : '' } : x)))} />
                )}
                <Input type="number" min="0" step="0.1" placeholder="0" required value={l.qty} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: e.target.value, qtyTouched: true } : x)))} />
                <Input type="number" min="0" step="0.5" value={l.rate} onChange={(e) => set('rate', e.target.value)} />
                <span className="text-right text-[12px] font-semibold tabular-nums sm:text-sm">{rs((+l.qty || 0) * (+l.rate || 0))}</span>
                <button type="button" disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, j) => j !== i))} className="grid size-7 place-items-center rounded-md text-muted hover:bg-crit-l hover:text-crit disabled:opacity-30" aria-label="Remove line">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )
          })}
          {unit === 'retail' && (
            <button type="button" disabled={!PRODUCTS.length} onClick={() => { const p = PRODUCTS[0]; setLines([...lines, { product:p.id, qty:'', rate:p.price }]) }} className="flex items-center gap-1 px-3 pb-2 text-xs font-semibold text-brand">
              <Plus className="size-3.5" /> Add product
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {unit === 'district' && <Field label="Transport charge (₹)"><Input type="number" min="0" value={transport} onChange={(e) => setTransport(e.target.value)} placeholder="0" /></Field>}
          {unit === 'local' && <Field label="Route / vehicle"><Select value={route} onChange={(e) => setRoute(e.target.value)} options={ROUTES.map((r) => ({ value: r.id, label: r.name }))} /></Field>}
          <Field label="Payment" className={unit === 'retail' ? 'col-span-2' : ''}>
            <Segmented value={pay} onChange={setPay} options={[{ value: 'credit', label: 'On credit' }, { value: 'part', label: 'Part paid' }, { value: 'full', label: 'Paid in full' }]} />
          </Field>
          {pay !== 'credit' && (
            <>
              <Field label="Method"><Select value={method} onChange={(e) => setMethod(e.target.value)} options={PAYMENT_METHODS} /></Field>
              {pay === 'part' && <Field label="Amount received (₹)"><Input type="number" min="1" max={total} required value={partial} onChange={(e) => setPartial(e.target.value)} /></Field>}
            </>
          )}
        </div>

        {(overStock || stockShort.length > 0 || overLimit) && (
          <div className="space-y-1.5 rounded-xl bg-crit-l p-3 text-xs text-crit-d">
            {overStock && <p className="flex gap-1.5"><TriangleAlert className="size-4 shrink-0" />{num(birds)} birds is more than the {num(onHand)} on the farm. {user.id === 'owner' ? 'Owner override will be flagged in the audit log.' : 'Only the owner can override.'}</p>}
            {stockShort.map((l) => <p key={l.product} className="flex gap-1.5"><TriangleAlert className="size-4 shrink-0" />Only {num(retailStock(data, l.product), 1)} kg {l.item} in the shop.</p>)}
            {overLimit && <p className="flex gap-1.5"><TriangleAlert className="size-4 shrink-0" />This bill takes {party.name} over its {rs(party.creditLimit)} credit limit.</p>}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <div>
            <p className="text-[11px] text-muted sm:text-xs">Bill total{paid ? ` · paid ${rs(paid)}` : ''}</p>
            <p className="font-display text-xl font-bold sm:text-2xl">{rs(total)}</p>
          </div>
          <Button disabled={!total || blocked}>Save & print bill</Button>
        </div>
      </form>
    </Modal>
  )
}

// Printable bill with the right brand for the unit that issued it
export function InvoiceView({ no, onClose }) {
  const { data, dispatch, user } = useStore()
  const [voiding, setVoiding] = useState(false)
  const [reason, setReason] = useState('')
  const inv = data.invoices.find((i) => i.no === no)
  if (!inv) return null
  const party = data.parties.find((p) => p.id === inv.partyId)
  const total = invoiceTotal(inv)
  const paid = data.payments.filter((p) => p.alloc?.some((a) => a.no === no)).reduce((s, p) => s + p.alloc.find((a) => a.no === no).amount, 0)
  const open = party.type !== 'counter' ? openItems(data, party.id).open.find((i) => i.no === no) : null
  const balance = open ? open.due : Math.max(0, total - paid)
  const brand = UNITS[inv.unit].billingName || UNITS[inv.unit].full
  const billingAddress = UNITS[inv.unit].billingAddress || BRAND.address
  const wa = `https://wa.me/?text=${encodeURIComponent(`${brand}\nBill ${inv.no} · ${fmtDateLong(inv.date)}\n${party.name}\nAmount ${rs(total)}${balance > 0 ? `\nBalance due ${rs(balance)}` : '\nPaid. Thank you!'}`)}`

  return (
    <Modal open onClose={onClose} title={`Bill ${inv.no}`} sub={inv.void ? 'Voided' : `${UNITS[inv.unit].name} · ${fmtDateLong(inv.date)}`} wide>
      <div className="print-area rounded-xl border border-line p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src={BRAND.logo} alt="Raja Broilers logo" width="96" height="96" className="size-16 shrink-0 rounded-lg object-contain sm:size-24" />
            <div className="min-w-0">
            <p className="font-display text-lg font-bold text-brand sm:text-2xl">{brand}</p>
            <p className="text-[11px] text-muted sm:text-xs">{billingAddress} · {BRAND.phone}</p>
            <p className="text-[10px] text-muted sm:text-[11px]">{BRAND.gstin}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{party.type === 'counter' ? 'Cash memo' : 'Invoice'}</p>
            <p className="font-display text-base font-bold sm:text-lg">{inv.no}</p>
            <p className="text-[11px] text-muted sm:text-xs">{fmtDateLong(inv.date)}</p>
          </div>
        </div>
        {inv.void && <div className="mt-3 rounded-lg bg-crit-l px-3 py-2 text-xs font-semibold text-crit-d">VOID · {inv.voidReason}</div>}
        <div className="mt-3 grid grid-cols-2 gap-3 text-[11.5px] sm:text-[13px]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Billed to</p>
            <p className="font-semibold">{party.name}</p>
            <p className="text-muted">{party.address}{party.district ? `, ${party.district}` : ''}</p>
            {party.phone !== '-' && <p className="text-muted">{party.phone}</p>}
          </div>
          {(inv.vehicle || inv.driver) && (
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Dispatch</p>
              <p>{inv.vehicle}</p>
              <p className="text-muted">{inv.driver}</p>
              <Badge tone={inv.status === 'Delivered' ? 'ok' : 'info'}>{inv.status}</Badge>
            </div>
          )}
        </div>
        <table className="mt-4 w-full text-[11.5px] sm:text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[10px] uppercase tracking-wide text-muted">
              <th className="py-1.5">Item</th>
              {inv.unit !== 'retail' && <th className="py-1.5 text-right">Birds</th>}
              <th className="py-1.5 text-right">Qty</th>
              <th className="py-1.5 text-right">Rate</th>
              <th className="py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l, i) => (
              <tr key={i} className="border-b border-line/60">
                <td className="py-1.5">{l.item}</td>
                {inv.unit !== 'retail' && <td className="py-1.5 text-right tabular-nums">{num(l.birds)}</td>}
                <td className="py-1.5 text-right tabular-nums">{num(l.qty, l.qty % 1 ? 1 : 0)} {l.uom}</td>
                <td className="py-1.5 text-right tabular-nums">{rs(l.rate)}</td>
                <td className="py-1.5 text-right tabular-nums">{rs(l.qty * l.rate)}</td>
              </tr>
            ))}
            {inv.transport > 0 && (
              <tr className="border-b border-line/60">
                <td className="py-1.5" colSpan={inv.unit !== 'retail' ? 4 : 3}>Transport</td>
                <td className="py-1.5 text-right tabular-nums">{rs(inv.transport)}</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="ml-auto mt-3 w-full max-w-[240px] space-y-1 text-[12px] sm:text-sm">
          <div className="flex justify-between font-display text-base font-bold"><span>Total</span><span className="tabular-nums">{rs(total)}</span></div>
          <div className="flex justify-between text-muted"><span>Received</span><span className="tabular-nums">{rs(total - balance)}</span></div>
          <div className={cx('flex justify-between font-semibold', balance > 0 ? 'text-crit-d' : 'text-good-d')}><span>{balance > 0 ? 'Balance due' : 'Paid'}</span><span className="tabular-nums">{rs(balance)}</span></div>
        </div>
        <p className="mt-4 text-[10px] text-muted sm:text-[11px]">Entered by {inv.by}. Posted bills are reversed with a reason, never deleted.</p>
      </div>
      <div className="no-print mt-3 flex flex-wrap justify-end gap-2">
        {!inv.void && user.id === 'owner' && <Button variant="ghost" icon={Ban} onClick={() => setVoiding(!voiding)} className="mr-auto text-crit">Void</Button>}
        <a href={wa} target="_blank" rel="noreferrer"><Button variant="outline" icon={Share2}>WhatsApp</Button></a>
        <Button icon={Printer} onClick={() => window.print()}>Print / PDF</Button>
      </div>
      {voiding && (
        <form className="no-print mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); dispatch('void', { no, reason, unit: inv.unit }, `${no} voided`); setVoiding(false) }}>
          <Input required placeholder="Reason for voiding (kept in audit log)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button variant="danger">Void bill</Button>
        </form>
      )}
    </Modal>
  )
}

export function PaymentModal({ open, onClose, partyId: fixedParty, kind = 'receipt' }) {
  const { data, dispatch, user } = useStore()
  const parties = data.parties.filter((p) => p.type !== 'counter' && user.units.includes(p.unit))
  const [partyId, setPartyId] = useState(fixedParty || parties[0]?.id)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('UPI')
  const [ref, setRef] = useState('')
  const [note, setNote] = useState('')
  const [picked, setPicked] = useState({})
  const [date, setDate] = useState(today())
  useEffect(() => {
    if (open) {
      setPartyId(fixedParty || parties[0]?.id)
      setAmount('')
      setDate(today())
      setRef('')
      setNote('')
      setPicked({})
    }
  }, [open, fixedParty]) // eslint-disable-line react-hooks/exhaustive-deps
  const party = data.parties.find((p) => p.id === partyId)
  const items = useMemo(() => (party ? openItems(data, party.id).open : []), [data, party])
  if (!party) return null

  // spread the amount over ticked bills, oldest first; what is left stays unallocated
  let left = +amount || 0
  const alloc = []
  for (const it of items) {
    if (!picked[it.no] || left <= 0) continue
    const a = Math.min(it.due, left)
    alloc.push({ no: it.no, amount: Math.round(a) })
    left -= a
  }
  const pickOldest = () => {
    let l = +amount || 0
    const p = {}
    for (const it of items) {
      if (l <= 0) break
      p[it.no] = true
      l -= it.due
    }
    setPicked(p)
  }
  const submit = (e) => {
    e.preventDefault()
    dispatch('payment', { kind, date, allocationMode: 'explicit', partyId: party.id, amount: +amount, method, ref, note, alloc }, kind === 'credit' ? `Credit note ${rs(+amount)} issued` : `${rs(+amount)} received from ${party.name}`)
    onClose()
  }
  const total = items.reduce((s, i) => s + i.due, 0)

  return (
    <Modal open={open} onClose={onClose} title={kind === 'credit' ? 'Credit note / adjustment' : 'Record payment received'} sub={`${party.name} · balance ${rs(total)}`} wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {!fixedParty && (
            <Field label="Buyer / hotel" className="col-span-2">
              <Select value={partyId} onChange={(e) => { setPartyId(e.target.value); setPicked({}) }} options={parties.map((p) => ({ value: p.id, label: `${p.name} · ${UNITS[p.unit].short}` }))} />
            </Field>
          )}
          <Field label="Date"><Input type="date" required max={today()} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Amount (₹)"><Input type="number" min="1" required autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} onBlur={pickOldest} /></Field>
          {kind === 'credit' ? (
            <Field label="Reason"><Input required value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 8 kg returned" /></Field>
          ) : (
            <Field label="Method"><Select value={method} onChange={(e) => setMethod(e.target.value)} options={PAYMENT_METHODS} /></Field>
          )}
          {kind !== 'credit' && <Field label="Reference / UTR" className="col-span-2"><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Optional" /></Field>}
        </div>
        <div className="rounded-xl border border-line">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Apply to open bills</p>
            <button type="button" onClick={pickOldest} className="text-[11px] font-semibold text-brand">Oldest first</button>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {items.length === 0 && <p className="px-3 py-4 text-center text-xs text-muted">No open bills · amount will stay as advance</p>}
            {items.map((it) => {
              const a = alloc.find((x) => x.no === it.no)
              return (
                <label key={it.no} className="flex cursor-pointer items-center gap-2.5 border-b border-line/60 px-3 py-2 text-[12px] last:border-0 sm:text-[13px]">
                  <input type="checkbox" checked={!!picked[it.no]} onChange={(e) => setPicked({ ...picked, [it.no]: e.target.checked })} className="size-4 accent-[var(--color-brand)]" />
                  <span className="flex-1">
                    <b>{it.no === 'OB' ? 'Opening balance' : it.no}</b> <span className="text-muted">· {fmtDate(it.date)}</span>
                    {it.age > 0 && <span className="ml-1.5 text-[10.5px] text-crit-d">{it.age}d overdue</span>}
                  </span>
                  <span className="tabular-nums text-muted">{rs(it.due)}</span>
                  <span className="w-20 text-right font-semibold tabular-nums text-good-d">{a ? rs(a.amount) : ''}</span>
                </label>
              )
            })}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted sm:text-xs">
            Allocated <b className="text-ink">{rs(alloc.reduce((s, a) => s + a.amount, 0))}</b>
            {left > 0.5 && <> · unallocated <b className="text-ink">{rs(left)}</b> (held as account credit)</>}
          </p>
          <Button disabled={!+amount}>{kind === 'credit' ? 'Issue credit note' : 'Save receipt'}</Button>
        </div>
      </form>
    </Modal>
  )
}
