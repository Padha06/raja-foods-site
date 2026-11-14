import { useMemo, useState } from 'react'
import { Plus, Minus, ShoppingBag, Hotel, Scale, Drumstick, Trash2, HandCoins, IndianRupee, Recycle, Factory, Phone, CalendarClock, FileText } from 'lucide-react'
import { useStore } from '../store.jsx'
import { RULES, UNITS } from '../config.js'
import { productsFor } from '../catalog.js'
import { invoiceTotal, partySummary, retailStock, rs, rsShort, num, today, addDays, fmtDate, fmtTime, sum } from '../lib.js'
import { PageHeader, Card, CardHead, Stat, Tabs, Table, Badge, Button, Modal, Field, Input, Select, Progress, Segmented, cx } from '../components/ui.jsx'
import { InvoiceModal, InvoiceView, PaymentModal } from '../components/Invoice.jsx'
import { go } from '../nav.js'

export default function Retail({ arg }) {
  const { data } = useStore()
  const [tab, setTab] = useState(arg === 'stock' ? 'stock' : 'counter')
  const [hotelBill, setHotelBill] = useState(null)
  const [showLast, setShowLast] = useState(false)
  const [pay, setPay] = useState(false)
  const t = today()
  const inv = data.invoices.filter((i) => i.unit === 'retail' && i.date === t && !i.void)
  const hotelSales = sum(inv.filter((i) => i.partyId !== 'C1'), invoiceTotal)
  const counterSales = sum(inv.filter((i) => i.partyId === 'C1'), invoiceTotal)
  const kgToday = sum(inv, (i) => sum(i.lines, (l) => l.qty))
  const hotels = data.parties.filter((p) => p.type === 'hotel')
  const hotelDue = sum(hotels, (h) => partySummary(data, h.id).outstanding)

  return (
    <div>
      <PageHeader
        unit="retail"
        title="Raja Broilers: shop & hotel supply"
        sub="Counter bills, a separate ledger for every hotel, and kg stock that reconciles with processing yield"
        actions={
          <>
            <Button variant="outline" icon={HandCoins} onClick={() => setPay(true)}>Receipt</Button>
            <Button icon={Hotel} onClick={() => setHotelBill(hotels[0].id)}>Hotel delivery</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Stat label="Counter sales today" value={rsShort(counterSales)} icon={ShoppingBag} tone="info" sub={`${inv.filter((i) => i.partyId === 'C1').length} bills`} />
        <Stat label="Hotel supply today" value={rsShort(hotelSales)} icon={Hotel} sub={`${inv.filter((i) => i.partyId !== 'C1').length} deliveries`} />
        <Stat label="Kg sold today" value={num(kgToday, 1)} icon={Scale} sub="dressed kg, all products" />
        <Stat label="Hotel dues" value={rsShort(hotelDue)} icon={HandCoins} tone="warn" sub={`${hotels.length} hotel accounts`} onClick={() => setTab('hotels')} />
      </div>
      <Tabs className="mt-3 sm:mt-5" value={tab} onChange={setTab} tabs={[{ id: 'counter', label: 'Counter billing' }, { id: 'hotels', label: 'Hotels', count: hotels.length }, { id: 'stock', label: 'Kg stock' }, { id: 'yield', label: 'Processing & yield' }]} />
      <div className="mt-3 sm:mt-4">
        {tab === 'counter' && <Counter />}
        {tab === 'hotels' && <Hotels onBill={setHotelBill} />}
        {tab === 'stock' && <Stock />}
        {tab === 'yield' && <Yield />}
      </div>
      <InvoiceModal open={!!hotelBill} partyId={hotelBill} onClose={() => setHotelBill(null)} unit="retail" onCreated={() => setShowLast(true)} />
      {showLast && data.lastInvoice && <InvoiceView no={data.lastInvoice} onClose={() => setShowLast(false)} />}
      <PaymentModal open={pay} onClose={() => setPay(false)} />
    </div>
  )
}

const ICONS = { curry: Drumstick, whole: Drumstick, boneless: Drumstick, leg: Drumstick, liver: Drumstick }

function Counter() {
  const { data, dispatch } = useStore()
  const PRODUCTS = productsFor(data, 'retail')
  const [cart, setCart] = useState({})
  const [method, setMethod] = useState('UPI')
  const [view, setView] = useState(null)
  const add = (id, kg) => setCart((c) => ({ ...c, [id]: Math.max(0, Math.round(((c[id] || 0) + kg) * 100) / 100) }))
  const lines = PRODUCTS.filter((p) => cart[p.id] > 0).map((p) => ({ item: p.name, product: p.id, qty: cart[p.id], uom: 'kg', rate: p.price }))
  const total = sum(lines, (l) => l.qty * l.rate)
  const bills = data.invoices.filter((i) => i.partyId === 'C1' && i.date === today() && !i.void).slice().reverse()
  const checkout = () => {
    const saved = dispatch('invoice', { unit: 'retail', partyId: 'C1', lines, paid: Math.round(total), method }, `Counter bill ${rs(total)} · ${method}`)
    if (saved) setCart({})
  }
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-4">
      <div className="col-span-5 grid grid-cols-3 gap-2 sm:gap-3 lg:col-span-3">
        {PRODUCTS.filter(p=>p.active !== false).map((p) => {
          const stock = retailStock(data, p.id) - (cart[p.id] || 0)
          const Icon = ICONS[p.id] || Drumstick
          return (
            <Card key={p.id} className={cx('p-2.5 sm:p-4', cart[p.id] > 0 && 'border-brand/50 ring-2 ring-brand/10')}>
              <div className="flex items-start justify-between">
                <span className="grid size-7 place-items-center rounded-lg bg-brand-l text-brand sm:size-9"><Icon className="size-4 sm:size-5" /></span>
                <span className={cx('text-[10px] font-medium sm:text-[11px]', stock < 15 ? 'text-crit-d' : 'text-muted')}>{num(stock, 1)} kg left</span>
              </div>
              <p className="mt-2 text-[12px] font-semibold sm:text-sm">{p.name}</p>
              <p className="font-display text-[15px] font-bold sm:text-xl">{rs(p.price)}<span className="text-[10px] font-medium text-muted sm:text-xs">/kg</span></p>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {[0.5, 1, 2].map((k) => (
                  <button key={k} onClick={() => add(p.id, k)} className="rounded-md border border-line py-1 text-[10.5px] font-semibold text-ink-2 hover:border-brand hover:text-brand sm:text-xs">+{k}</button>
                ))}
              </div>
            </Card>
          )
        })}
        <Card className="col-span-3 flex items-center gap-3 p-3 text-[11px] text-muted sm:text-xs md:col-span-1 md:block">
          <p className="font-semibold text-ink">Scale-friendly</p>
          <p className="mt-1">Tap +0.5 / +1 / +2 kg, or type the exact weight in the bill. Stock drops as you bill.</p>
        </Card>
      </div>
      <Card className="col-span-5 flex flex-col lg:col-span-2">
        <CardHead title="Current bill" sub="Walk-in customer" right={lines.length > 0 && <button onClick={() => setCart({})} className="text-[11px] font-semibold text-muted hover:text-crit">Clear</button>} />
        <div className="flex-1 px-3 py-2 sm:px-5">
          {lines.length === 0 && <p className="py-8 text-center text-xs text-muted">Tap a product to start a bill</p>}
          {lines.map((l) => (
            <div key={l.product} className="flex items-center gap-2 border-b border-line/60 py-2">
              <span className="min-w-0 flex-1 text-[12px] font-semibold sm:text-[13px]">{l.item}</span>
              <button onClick={() => add(l.product, -0.25)} className="grid size-6 place-items-center rounded-md border border-line"><Minus className="size-3" /></button>
              <input type="number" step="0.05" value={l.qty} onChange={(e) => setCart({ ...cart, [l.product]: +e.target.value })} className="h-7 w-16 rounded-md border border-line text-center text-[12px] tabular-nums" />
              <button onClick={() => add(l.product, 0.25)} className="grid size-6 place-items-center rounded-md border border-line"><Plus className="size-3" /></button>
              <span className="w-16 text-right text-[12px] font-semibold tabular-nums sm:w-20 sm:text-[13px]">{rs(l.qty * l.rate)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-line p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <Segmented value={method} onChange={setMethod} options={['UPI', 'Cash']} />
            <p className="font-display text-xl font-bold sm:text-2xl">{rs(total)}</p>
          </div>
          <Button className="mt-3 w-full" disabled={!total} onClick={checkout}>Bill & mark paid</Button>
        </div>
        <div className="border-t border-line px-3 pb-3 pt-2 sm:px-5">
          <p className="py-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted">Today's counter bills</p>
          {bills.length === 0 && <p className="py-2 text-xs text-muted">None yet today</p>}
          {bills.slice(0, 5).map((b) => (
            <button key={b.no} onClick={() => setView(b.no)} className="flex w-full justify-between py-1 text-[11.5px] hover:text-brand sm:text-xs">
              <span>{b.no} · {b.createdAt ? fmtTime(b.createdAt) : ''}</span>
              <b className="tabular-nums">{rs(invoiceTotal(b))}</b>
            </button>
          ))}
        </div>
      </Card>
      {view && <InvoiceView no={view} onClose={() => setView(null)} />}
    </div>
  )
}

function Hotels({ onBill }) {
  const { data } = useStore()
  const hotels = data.parties.filter((p) => p.type === 'hotel')
  const t = today()
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
      {hotels.map((h) => {
        const s = partySummary(data, h.id)
        const month = data.invoices.filter((i) => i.partyId === h.id && !i.void && i.date >= addDays(t, -29))
        const todayInv = month.find((i) => i.date === t)
        return (
          <Card key={h.id} className="flex flex-col p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold sm:text-[15px]">{h.name}</p>
                <p className="flex items-center gap-1 text-[10.5px] text-muted sm:text-xs"><CalendarClock className="size-3" />{h.schedule} · {h.contact}</p>
              </div>
              {s.overLimit ? <Badge tone="crit">Over limit</Badge> : s.oldest > 7 ? <Badge tone="warn">Overdue</Badge> : <Badge tone="ok">Good</Badge>}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-lg bg-page py-1.5">
                <p className="font-display text-[13px] font-bold sm:text-base">{rsShort(s.outstanding)}</p>
                <p className="text-[9.5px] text-muted sm:text-[10.5px]">Balance</p>
              </div>
              <div className="rounded-lg bg-page py-1.5">
                <p className="font-display text-[13px] font-bold sm:text-base">{num(sum(month, (i) => sum(i.lines, (l) => l.qty)))}</p>
                <p className="text-[9.5px] text-muted sm:text-[10.5px]">kg · 30d</p>
              </div>
              <div className="rounded-lg bg-page py-1.5">
                <p className="font-display text-[13px] font-bold sm:text-base">{rs(h.rateKg)}</p>
                <p className="text-[9.5px] text-muted sm:text-[10.5px]">rate/kg</p>
              </div>
            </div>
            <Progress value={s.outstanding} max={h.creditLimit} color={s.overLimit ? 'var(--color-crit)' : UNITS.retail.color} className="mt-3" />
            <p className="mt-1 text-[10px] text-muted sm:text-[11px]">Limit {rs(h.creditLimit)} · {h.creditDays}-day credit{s.overdue > 0 && <span className="text-crit-d"> · {rs(s.overdue)} overdue</span>}</p>
            <p className="mt-1 text-[10.5px] sm:text-xs">{todayInv ? <span className="text-good-d">✓ Delivered today · {todayInv.no}</span> : <span className="text-warn-d">Not delivered yet today</span>}</p>
            <div className="mt-auto flex gap-1.5 pt-3">
              <Button size="sm" className="flex-1" onClick={() => onBill(h.id)}>Deliver</Button>
              <Button size="sm" variant="outline" icon={FileText} className="flex-1" onClick={() => go('ledgers', h.id)}>Ledger</Button>
              <a href={`tel:${h.phone.replace(/\s/g, '')}`}><Button size="sm" variant="outline" icon={Phone} aria-label="Call" /></a>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function Stock() {
  const { data, dispatch } = useStore()
  const PRODUCTS = productsFor(data, 'retail')
  const [days, setDays] = useState(1)
  const [waste, setWaste] = useState(false)
  const from = addDays(today(), -(days - 1))
  const rows = PRODUCTS.map((p) => {
    const mv = data.retailMoves.filter((m) => m.product === p.id)
    const before = sum(mv.filter((m) => m.date < from), (m) => (m.type === 'received' || m.type === 'opening' ? m.kg : -m.kg))
    const inR = mv.filter((m) => m.date >= from)
    const recv = sum(inR.filter((m) => m.type === 'received' || m.type === 'opening'), (m) => m.kg)
    const sold = sum(inR.filter((m) => m.type === 'sold'), (m) => m.kg)
    const wst = sum(inR.filter((m) => m.type === 'wastage'), (m) => m.kg)
    return { key: p.id, name: p.name, opening: before, recv, sold, wst, closing: before + recv - sold - wst }
  })
  const f = (v) => num(v, 1)
  return (
    <Card>
      <CardHead
        title="Shop stock in kg"
        sub="Opening + received from processing − sold − wastage = closing"
        right={
          <div className="flex items-center gap-2">
            <Segmented value={days} onChange={setDays} options={[{ value: 1, label: 'Today' }, { value: 7, label: '7 days' }, { value: 30, label: '30 days' }]} />
            <Button size="sm" variant="outline" icon={Recycle} onClick={() => setWaste(true)} className="max-sm:hidden">Wastage</Button>
          </div>
        }
      />
      <div className="mt-2">
        <Table
          cols={[
            { key: 'name', label: 'Product', render: (r) => <b>{r.name}</b> },
            { key: 'opening', label: 'Opening', right: true, render: (r) => f(r.opening) },
            { key: 'recv', label: 'Received', right: true, render: (r) => <span className="text-good-d">+{f(r.recv)}</span> },
            { key: 'sold', label: 'Sold', right: true, render: (r) => `−${f(r.sold)}` },
            { key: 'wst', label: 'Wastage', right: true, render: (r) => <span className="text-crit-d">−{f(r.wst)}</span> },
            { key: 'closing', label: 'Closing kg', right: true, render: (r) => <b className={r.closing < 15 ? 'text-crit-d' : ''}>{f(r.closing)}</b> },
          ]}
          rows={rows}
          foot={{ name: 'Total', opening: f(sum(rows, (r) => r.opening)), recv: f(sum(rows, (r) => r.recv)), sold: f(sum(rows, (r) => r.sold)), wst: f(sum(rows, (r) => r.wst)), closing: f(sum(rows, (r) => r.closing)) }}
        />
      </div>
      <WasteModal open={waste} onClose={() => setWaste(false)} onSave={(p) => { dispatch('retailWaste', p, `${p.kg} kg wastage recorded`); setWaste(false) }} />
    </Card>
  )
}

function WasteModal({ open, onClose, onSave }) {
  const { data } = useStore()
  const PRODUCTS = productsFor(data, 'retail')
  const [f, setF] = useState({ product: 'curry', kg: '', reason: 'Trimming' })
  return (
    <Modal open={open} onClose={onClose} title="Record wastage" sub="Needs a reason; shows in the retail report">
      <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); onSave({ ...f, kg: +f.kg }) }}>
        <Field label="Product"><Select value={f.product} onChange={(e) => setF({ ...f, product: e.target.value })} options={PRODUCTS.map((p) => ({ value: p.id, label: p.name }))} /></Field>
        <Field label="Kg"><Input type="number" step="0.1" min="0.1" required value={f.kg} onChange={(e) => setF({ ...f, kg: e.target.value })} /></Field>
        <Field label="Reason" className="col-span-2"><Select value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} options={['Trimming', 'Spoilage', 'Power cut', 'Returned by hotel', 'Other']} /></Field>
        <Button className="col-span-2">Save</Button>
      </form>
    </Modal>
  )
}

function Yield() {
  const { data, dispatch } = useStore()
  const PRODUCTS = productsFor(data, 'retail')
  const [open, setOpen] = useState(false)
  const rows = data.processing.slice(-14).reverse().map((p) => ({ ...p, key: p.id, y: p.dressedKg / p.liveKg }))
  const avg = sum(rows, (r) => r.dressedKg) / (sum(rows, (r) => r.liveKg) || 1)
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <div className="col-span-3 grid grid-cols-3 gap-2 sm:gap-4 lg:col-span-1 lg:grid-cols-1">
        <Stat label="Agreed yield rule" value={`${(RULES.dressedYield * 100).toFixed(0)}%`} icon={Factory} sub="dressed kg per live kg" />
        <Stat label="Actual · 14 days" value={`${(avg * 100).toFixed(1)}%`} icon={Scale} tone={Math.abs(avg - RULES.dressedYield) < 0.01 ? 'ok' : 'warn'} sub={Math.abs(avg - RULES.dressedYield) < 0.01 ? 'Within 1% of rule' : 'Check processing'} />
        <Card className="p-3 sm:p-4">
          <p className="text-[11px] leading-relaxed text-muted sm:text-xs">Live weight and dressed kg are never treated as equal. Birds sent from the farm are converted using the confirmed yield, so shop stock and farm stock both stay honest.</p>
          <Button size="sm" className="mt-3 w-full" icon={Factory} onClick={() => setOpen(true)}>Record processing</Button>
        </Card>
      </div>
      <Card className="col-span-3 lg:col-span-2">
        <CardHead title="Daily processing" sub="Live birds from farm → dressed kg into shop stock" />
        <div className="mt-2">
          <Table
            cols={[
              { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
              { key: 'birds', label: 'Birds', right: true },
              { key: 'liveKg', label: 'Live kg', right: true, render: (r) => num(r.liveKg) },
              { key: 'dressedKg', label: 'Dressed kg', right: true, render: (r) => num(r.dressedKg, 1) },
              { key: 'y', label: 'Yield', right: true, render: (r) => <Badge tone={Math.abs(r.y - RULES.dressedYield) <= 0.015 ? 'ok' : 'warn'}>{(r.y * 100).toFixed(1)}%</Badge> },
              { key: 'by', label: 'By', className: 'max-sm:hidden' },
            ]}
            rows={rows}
          />
        </div>
      </Card>
      <ProcessModal open={open} onClose={() => setOpen(false)} onSave={(p) => { dispatch('processing', p, `${p.birds} birds processed → ${p.dressedKg} kg`); setOpen(false) }} />
    </div>
  )
}

function ProcessModal({ open, onClose, onSave }) {
  const { data } = useStore()
  const PRODUCTS = productsFor(data, 'retail')
  const [birds, setBirds] = useState('')
  const [liveKg, setLiveKg] = useState('')
  const [dressed, setDressed] = useState('')
  const live = +liveKg || +birds * RULES.avgLiveKg
  const dkg = +dressed || Math.round(live * RULES.dressedYield * 10) / 10
  const totalShare = sum(PRODUCTS, (p) => p.share)
  const split = Object.fromEntries(PRODUCTS.map((p) => [p.id, Math.round(((dkg * p.share) / totalShare) * 10) / 10]))
  return (
    <Modal open={open} onClose={onClose} title="Record processing" sub="Moves live birds out of farm stock and dressed kg into shop stock">
      <form className="grid grid-cols-3 gap-3" onSubmit={(e) => { e.preventDefault(); onSave({ birds: +birds, liveKg: Math.round(live), dressedKg: dkg, split }) }}>
        <Field label="Birds"><Input type="number" min="1" required value={birds} onChange={(e) => setBirds(e.target.value)} /></Field>
        <Field label="Live kg"><Input type="number" placeholder={String(Math.round(+birds * RULES.avgLiveKg) || '')} value={liveKg} onChange={(e) => setLiveKg(e.target.value)} /></Field>
        <Field label="Dressed kg"><Input type="number" step="0.1" placeholder={String(dkg || '')} value={dressed} onChange={(e) => setDressed(e.target.value)} /></Field>
        <div className="col-span-3 rounded-xl bg-page p-3 text-xs">
          <p className="mb-1.5 font-semibold text-ink-2">Into shop stock {live ? `· yield ${((dkg / live) * 100).toFixed(1)}%` : ''}</p>
          <div className="grid grid-cols-5 gap-1 text-center">
            {PRODUCTS.map((p) => (
              <div key={p.id}>
                <p className="font-semibold tabular-nums">{num(split[p.id], 1)}</p>
                <p className="text-[10px] text-muted">{p.name}</p>
              </div>
            ))}
          </div>
        </div>
        <Button className="col-span-3" disabled={!+birds}>Save processing</Button>
      </form>
    </Modal>
  )
}
