import { useMemo, useState } from 'react'
import { Plus, Truck, CheckCircle2, Clock, PackageX, HandCoins, IndianRupee, Bird, CircleSlash } from 'lucide-react'
import { useStore } from '../store.jsx'
import { ROUTES, UNITS } from '../config.js'
import { invoiceTotal, partySummary, rs, rsShort, num, today, addDays, fmtDate, sum } from '../lib.js'
import { PageHeader, Card, CardHead, Stat, Tabs, Table, Badge, Button, Modal, Field, Input, Progress, cx } from '../components/ui.jsx'
import { InvoiceModal, InvoiceView, PaymentModal } from '../components/Invoice.jsx'
import { go } from '../nav.js'

export default function Local() {
  const { data } = useStore()
  const [tab, setTab] = useState('today')
  const [newBill, setNewBill] = useState(false)
  const [showLast, setShowLast] = useState(false)
  const [pay, setPay] = useState(false)
  const t = today()
  const todays = data.dispatches.filter((d) => d.date === t)
  const delivered = sum(todays, (d) => sum(d.stops.filter((s) => s.status === 'Delivered'), (s) => s.birds))
  const loaded = sum(todays, (d) => d.loaded)
  const invToday = data.invoices.filter((i) => i.unit === 'local' && i.date === t && !i.void)
  const buyers = data.parties.filter((p) => p.unit === 'local')
  const cashToday = sum(data.payments.filter((p) => p.date === t && buyers.some((b) => b.id === p.partyId)), (p) => p.amount)

  return (
    <div>
      <PageHeader
        unit="local"
        title="Local live-bird routes"
        sub="Daily dispatch by route: loaded, delivered, returned, lost, and what each shop owes"
        actions={
          <>
            <Button variant="outline" icon={HandCoins} onClick={() => setPay(true)}>Receipt</Button>
            <Button icon={Plus} onClick={() => setNewBill(true)}>Extra sale</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Stat label="Loaded today" value={num(loaded)} icon={Truck} sub={`${todays.length} vehicles`} />
        <Stat label="Delivered" value={num(delivered)} icon={CheckCircle2} tone="ok" sub={<Progress value={delivered} max={loaded} color={UNITS.local.color} className="mt-1" />} />
        <Stat label="Sales today" value={rsShort(sum(invToday, invoiceTotal))} icon={IndianRupee} tone="info" sub={`${invToday.length} shops billed`} />
        <Stat label="Cash collected" value={rsShort(cashToday)} icon={HandCoins} tone="ok" sub="today, all routes" />
      </div>
      <Tabs className="mt-3 sm:mt-5" value={tab} onChange={setTab} tabs={[{ id: 'today', label: "Today's routes" }, { id: 'report', label: 'Route report' }, { id: 'buyers', label: 'Shops & dues', count: buyers.length }]} />
      <div className="mt-3 sm:mt-4">
        {tab === 'today' && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {todays.map((d) => <RouteCard key={d.id} ds={d} />)}
          </div>
        )}
        {tab === 'report' && <RouteReport />}
        {tab === 'buyers' && <Buyers />}
      </div>
      <InvoiceModal open={newBill} onClose={() => setNewBill(false)} unit="local" onCreated={() => setShowLast(true)} />
      {showLast && data.lastInvoice && <InvoiceView no={data.lastInvoice} onClose={() => setShowLast(false)} />}
      <PaymentModal open={pay} onClose={() => setPay(false)} />
    </div>
  )
}

function RouteCard({ ds }) {
  const { data, dispatch } = useStore()
  const [stop, setStop] = useState(null)
  const [closing, setClosing] = useState(false)
  const route = ROUTES.find((r) => r.id === ds.route)
  const done = ds.stops.filter((s) => s.status === 'Delivered')
  const pending = ds.stops.filter((s) => s.status === 'Pending')
  const deliveredBirds = sum(done, (s) => s.birds)
  const onTruck = ds.loaded - deliveredBirds - ds.lost - (ds.status === 'Closed' ? ds.returned : 0)
  return (
    <Card className="col-span-3 flex flex-col md:col-span-1">
      <div className="border-b border-line px-3 py-3 sm:px-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-[14px] font-bold sm:text-base">{route.name}</p>
            <p className="text-[10.5px] text-muted sm:text-xs">{ds.vehicle} · {ds.driver}</p>
          </div>
          <Badge tone={ds.status === 'Closed' ? 'mute' : 'info'}>{ds.status}</Badge>
        </div>
        <div className="mt-2.5 grid grid-cols-4 gap-1 text-center">
          {[['Loaded', ds.loaded], ['Delivered', deliveredBirds], ['On truck', Math.max(0, onTruck)], ['Lost', ds.lost]].map(([l, v]) => (
            <div key={l} className="rounded-lg bg-page py-1.5">
              <p className="font-display text-sm font-bold tabular-nums sm:text-base">{num(v)}</p>
              <p className="text-[9.5px] text-muted sm:text-[10.5px]">{l}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 divide-y divide-line/70">
        {ds.stops.map((s) => {
          const p = data.parties.find((x) => x.id === s.partyId)
          return (
            <div key={s.partyId} className="flex items-center gap-2 px-3 py-2 sm:px-4">
              {s.status === 'Delivered' ? <CheckCircle2 className="size-4 shrink-0 text-good" /> : s.status === 'Skipped' ? <CircleSlash className="size-4 shrink-0 text-muted" /> : <Clock className="size-4 shrink-0 text-warn-d" />}
              <div className="min-w-0 flex-1">
                <p className={cx('truncate text-[12px] font-semibold sm:text-[13px]', s.status === 'Skipped' && 'text-muted line-through')}>{p.name}</p>
                <p className="text-[10.5px] text-muted sm:text-[11px]">{s.birds} birds · {s.kg} kg · {rs(s.rate)}/kg</p>
              </div>
              {s.status === 'Pending' && ds.status !== 'Closed' ? (
                <Button size="sm" onClick={() => setStop(s)}>Deliver</Button>
              ) : s.invoice ? (
                <span className="text-[10.5px] font-medium text-muted sm:text-[11px]">{s.invoice}</span>
              ) : null}
            </div>
          )
        })}
      </div>
      {ds.status !== 'Closed' && (
        <div className="border-t border-line p-2.5 sm:p-3">
          <Button variant="outline" className="w-full" icon={PackageX} onClick={() => setClosing(true)}>
            Close route{pending.length ? ` (${pending.length} pending)` : ''}
          </Button>
        </div>
      )}
      {stop && <DeliverModal ds={ds} stop={stop} onClose={() => setStop(null)} />}
      <CloseModal open={closing} ds={ds} onTruck={onTruck} onClose={() => setClosing(false)} onSave={(lost) => { dispatch('closeDispatch', { dispatch: ds.id, lost }, `${route.name} closed`); setClosing(false) }} />
    </Card>
  )
}

function DeliverModal({ ds, stop, onClose }) {
  const { data, dispatch } = useStore()
  const p = data.parties.find((x) => x.id === stop.partyId)
  const s = partySummary(data, p.id)
  const [birds, setBirds] = useState(String(stop.birds))
  const [kg, setKg] = useState(String(stop.kg))
  const [paid, setPaid] = useState('')
  const amount = +kg * stop.rate
  return (
    <Modal open onClose={onClose} title={`Deliver to ${p.name}`} sub={`Previous balance ${rs(s.outstanding)} · ${p.creditDays}-day credit`}>
      <form
        className="grid grid-cols-2 gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          dispatch('deliverStop', { dispatch: ds.id, partyId: p.id, birds: +birds, kg: +kg, paid: +paid || 0 }, `Delivered to ${p.name}`)
          onClose()
        }}
      >
        <Field label="Birds delivered"><Input type="number" min="1" required value={birds} onChange={(e) => setBirds(e.target.value)} /></Field>
        <Field label="Weighed kg"><Input type="number" min="1" step="0.1" required value={kg} onChange={(e) => setKg(e.target.value)} /></Field>
        <Field label="Cash collected (₹)" className="col-span-2" hint="Leave empty if on credit. Partial payments are fine.">
          <Input type="number" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0" />
        </Field>
        <div className="col-span-2 flex items-center justify-between rounded-xl bg-page px-3 py-2.5 text-sm">
          <span className="text-muted">{kg} kg × {rs(stop.rate)}</span>
          <b className="font-display text-lg">{rs(amount)}</b>
        </div>
        <Button className="col-span-2">Confirm delivery & bill</Button>
      </form>
    </Modal>
  )
}

function CloseModal({ open, ds, onTruck, onClose, onSave }) {
  const [lost, setLost] = useState('0')
  const back = Math.max(0, onTruck - (+lost || 0))
  return (
    <Modal open={open} onClose={onClose} title="Close today's route" sub="Pending stops are marked skipped. Returned birds go back into farm stock.">
      <form className="grid grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); onSave(+lost || 0) }}>
        <Field label="Birds on truck"><Input disabled value={Math.max(0, onTruck)} /></Field>
        <Field label="Lost / died on route"><Input type="number" min="0" max={onTruck} value={lost} onChange={(e) => setLost(e.target.value)} /></Field>
        <div className="col-span-2 rounded-xl bg-page px-3 py-2.5 text-[13px]">
          <b>{back}</b> birds returned to farm{+lost > 0 && <> · <b className="text-crit-d">{lost}</b> lost (flagged for owner review)</>}
        </div>
        <Button className="col-span-2">Close {ds.route}</Button>
      </form>
    </Modal>
  )
}

function RouteReport() {
  const { data } = useStore()
  const rows = useMemo(() => {
    const out = []
    for (let k = 0; k < 10; k++) {
      const d = addDays(today(), -k)
      for (const ds of data.dispatches.filter((x) => x.date === d)) {
        const inv = data.invoices.filter((i) => i.unit === 'local' && i.date === d && i.route === ds.route && !i.void)
        const ids = ds.stops.map((s) => s.partyId)
        out.push({
          key: ds.id,
          date: d,
          route: ds.route,
          loaded: ds.loaded,
          delivered: sum(ds.stops.filter((s) => s.status === 'Delivered'), (s) => s.birds),
          returned: ds.returned,
          lost: ds.lost,
          sales: sum(inv, invoiceTotal),
          coll: sum(data.payments.filter((p) => p.date === d && ids.includes(p.partyId)), (p) => p.amount),
          fuel: sum(data.expenses.filter((e) => e.unit === 'local' && e.date === d && e.note === ROUTES.find((r) => r.id === ds.route).name), (e) => e.amount),
        })
      }
    }
    return out
  }, [data])
  return (
    <Card>
      <CardHead title="Route-wise dispatch, sales & collection" sub="Last 10 days · variance = loaded − delivered − returned − lost" />
      <div className="mt-2">
        <Table
          max={520}
          cols={[
            { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
            { key: 'route', label: 'Route' },
            { key: 'loaded', label: 'Loaded', right: true },
            { key: 'delivered', label: 'Delivered', right: true },
            { key: 'returned', label: 'Returned', right: true },
            { key: 'lost', label: 'Lost', right: true, render: (r) => <span className={r.lost ? 'font-semibold text-crit-d' : ''}>{r.lost}</span> },
            { key: 'var', label: 'Variance', right: true, render: (r) => { const v = r.loaded - r.delivered - r.returned - r.lost; return r.date === today() ? <span className="text-muted">open</span> : <Badge tone={v ? 'crit' : 'ok'}>{v ? v : 'OK'}</Badge> } },
            { key: 'sales', label: 'Sales', right: true, render: (r) => rs(r.sales) },
            { key: 'coll', label: 'Collected', right: true, render: (r) => rs(r.coll) },
            { key: 'fuel', label: 'Fuel', right: true, render: (r) => rs(r.fuel) },
          ]}
          rows={rows}
        />
      </div>
    </Card>
  )
}

function Buyers() {
  const { data } = useStore()
  const rows = data.parties.filter((p) => p.unit === 'local').map((p) => ({ key: p.id, ...partySummary(data, p.id) }))
  return (
    <Card>
      <Table
        onRow={(r) => go('ledgers', r.party.id)}
        cols={[
          { key: 'name', label: 'Shop', render: (r) => <b>{r.party.name}</b> },
          { key: 'route', label: 'Route', render: (r) => ROUTES.find((x) => x.id === r.party.route).name },
          { key: 'phone', label: 'Phone', render: (r) => r.party.phone, className: 'max-sm:hidden' },
          { key: 'rate', label: 'Rate', right: true, render: (r) => `${rs(r.party.rateKg)}/kg` },
          { key: 'limit', label: 'Limit', right: true, render: (r) => rs(r.party.creditLimit) },
          { key: 'due', label: 'Balance', right: true, render: (r) => <b>{rs(r.outstanding)}</b> },
          { key: 'status', label: 'Status', render: (r) => (r.overLimit ? <Badge tone="crit">Over limit</Badge> : r.overdue > 0 ? <Badge tone="warn">{rs(r.overdue)} overdue</Badge> : <Badge tone="ok">OK</Badge>) },
        ]}
        rows={rows}
      />
    </Card>
  )
}
