import { useMemo, useState } from 'react'
import { Plus, Skull, ArrowRightLeft, PackagePlus, PackageMinus, Bird, Wheat, Activity, Scale, TriangleAlert } from 'lucide-react'
import { useStore } from '../store.jsx'
import { UNITS } from '../config.js'
import { birdBook, feedStock, today, addDays, num, rs, fmtDate, sum } from '../lib.js'
import { PageHeader, Card, CardHead, Stat, Tabs, Table, Badge, Button, Modal, Field, Input, Select, Progress, UnitTag, cx } from '../components/ui.jsx'

const REASONS = ['Natural', 'Heat stress', 'Respiratory', 'Leg weakness', 'Crowding', 'Predator', 'Other']

export default function Farm({ arg }) {
  const { data } = useStore()
  const [tab, setTab] = useState(arg === 'feed' ? 'feed' : 'birds')
  const [modal, setModal] = useState(null)
  const t = today()
  const monthFrom = addDays(t, -29)
  const book = useMemo(() => birdBook(data, monthFrom, t), [data, monthFrom, t])
  const onHand = useMemo(() => birdBook(data, '2000-01-01', t).closing, [data, t])
  const todayMort = sum(data.birdMoves.filter((m) => m.date === t && m.type === 'mortality'), (m) => m.qty)
  const feedUsed = sum(data.feedMoves.filter((m) => m.type === 'issued' && m.date >= monthFrom), (m) => m.bags)
  const lowFeed = data.feed.filter((f) => feedStock(data, f.id) < f.reorder)

  return (
    <div>
      <PageHeader
        unit="farm"
        title="Farm: birds, feed & costs"
        sub="Opening + received − mortality − transferred = closing. Every number below comes from a logged movement."
        actions={
          <>
            <Button variant="outline" icon={Skull} onClick={() => setModal('mortality')}>Mortality</Button>
            <Button variant="outline" icon={ArrowRightLeft} onClick={() => setModal('transfer')} className="max-sm:hidden">Transfer</Button>
            <Button icon={Plus} onClick={() => setModal('batch')}>New batch</Button>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Stat label="Birds on hand" value={num(onHand)} icon={Bird} sub={`${data.batches.filter((b) => b.status !== 'Sold out').length} active batches`} />
        <Stat label="Mortality today" value={num(todayMort)} icon={Skull} tone={todayMort > 60 ? 'crit' : undefined} sub={`${((book.mortality / (book.opening + book.received)) * 100).toFixed(2)}% this month`} />
        <Stat label="Feed used · 30 days" value={`${num(feedUsed)}`} icon={Wheat} sub={`bags · ${num((feedUsed * 50) / 1000, 1)} tonnes`} />
        <Stat label="Low feed items" value={lowFeed.length} icon={TriangleAlert} tone={lowFeed.length ? 'warn' : 'ok'} sub={lowFeed.map((f) => f.type).join(', ') || 'All above reorder'} onClick={() => setTab('feed')} />
      </div>

      <Tabs
        className="mt-3 sm:mt-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'birds', label: 'Bird stock' },
          { id: 'batches', label: 'Batches', count: data.batches.filter((b) => b.status !== 'Sold out').length },
          { id: 'mortality', label: 'Mortality log' },
          { id: 'feed', label: 'Feed' },
          { id: 'perf', label: 'Performance' },
        ]}
      />
      <div className="mt-3 sm:mt-4">
        {tab === 'birds' && <BirdStock book={book} onHand={onHand} />}
        {tab === 'batches' && <Batches />}
        {tab === 'mortality' && <Mortality />}
        {tab === 'feed' && <Feed onAction={setModal} />}
        {tab === 'perf' && <Performance book={book} feedUsed={feedUsed} />}
      </div>

      <MortalityModal open={modal === 'mortality'} onClose={() => setModal(null)} />
      <BatchModal open={modal === 'batch'} onClose={() => setModal(null)} />
      <TransferModal open={modal === 'transfer'} onClose={() => setModal(null)} onHand={onHand} />
      <FeedModal kind={modal === 'feed-purchase' ? 'purchase' : modal === 'feed-issue' ? 'issued' : null} onClose={() => setModal(null)} />
    </div>
  )
}

function BirdStock({ book, onHand }) {
  const { data } = useStore()
  const days = useMemo(() => {
    const out = []
    for (let k = 13; k >= 0; k--) {
      const d = addDays(today(), -k)
      out.push({ key: d, date: d, ...birdBook(data, d, d) })
    }
    return out.reverse()
  }, [data])
  const toUnit = (u) => sum(data.birdMoves.filter((m) => m.type === 'transferred' && m.to === u && m.date >= addDays(today(), -29)), (m) => m.qty)
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <Card className="col-span-3 lg:col-span-1">
        <CardHead title="Bird book · last 30 days" sub="Reconciles automatically" />
        <div className="space-y-2 px-3 py-3 text-[12px] sm:px-5 sm:py-4 sm:text-sm">
          {[
            ['Opening birds', book.opening],
            ['+ Chicks placed / returns', book.received],
            ['− Mortality', book.mortality],
            ['− Transferred to units', book.transferred],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between">
              <span className="text-muted">{l}</span>
              <span className="font-semibold tabular-nums">{num(v)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t-2 border-ink pt-2 font-display text-base font-bold sm:text-lg">
            <span>Closing</span>
            <span className="tabular-nums">{num(book.closing)}</span>
          </div>
          {book.closing === onHand && <Badge tone="ok">Matches live stock</Badge>}
          <div className="!mt-4 space-y-2 border-t border-line pt-3">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]">Where the birds went</p>
            {['district', 'local', 'retail'].map((u) => (
              <div key={u}>
                <div className="flex justify-between text-[11px] sm:text-xs">
                  <UnitTag unit={u} />
                  <span className="font-semibold tabular-nums">{num(toUnit(u))}</span>
                </div>
                <Progress value={toUnit(u)} max={book.transferred} color={UNITS[u].color} className="mt-1" />
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card className="col-span-3 lg:col-span-2">
        <CardHead title="Daily bird movements" sub="Last 14 days" />
        <div className="mt-2">
          <Table
            cols={[
              { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
              { key: 'opening', label: 'Opening', right: true, render: (r) => num(r.opening) },
              { key: 'received', label: 'Received', right: true, render: (r) => (r.received ? <span className="text-good-d">+{num(r.received)}</span> : '–') },
              { key: 'mortality', label: 'Mortality', right: true, render: (r) => <span className="text-crit-d">−{num(r.mortality)}</span> },
              { key: 'transferred', label: 'To units', right: true, render: (r) => `−${num(r.transferred)}` },
              { key: 'closing', label: 'Closing', right: true, render: (r) => <b>{num(r.closing)}</b> },
            ]}
            rows={days}
          />
        </div>
      </Card>
    </div>
  )
}

function Batches() {
  const { data } = useStore()
  const rows = data.batches.map((b) => {
    const dead = sum(data.birdMoves.filter((m) => m.type === 'mortality' && m.batch === b.id), (m) => m.qty)
    return { ...b, key: b.id, dead }
  })
  return (
    <Card>
      <Table
        cols={[
          { key: 'id', label: 'Batch', render: (r) => <b>{r.id}</b> },
          { key: 'date', label: 'Placed', render: (r) => fmtDate(r.date) },
          { key: 'shed', label: 'Shed' },
          { key: 'source', label: 'Source', className: 'max-sm:hidden' },
          { key: 'qty', label: 'Chicks', right: true, render: (r) => num(r.qty) },
          { key: 'dead', label: 'Mortality', right: true, render: (r) => <span>{num(r.dead)} <span className="text-muted">({((r.dead / r.qty) * 100).toFixed(1)}%)</span></span> },
          { key: 'age', label: 'Age', right: true, render: (r) => (r.status === 'Sold out' ? '–' : `${r.ageDays} d`) },
          { key: 'avg', label: 'Avg wt', right: true, render: (r) => (r.avgKg ? `${r.avgKg} kg` : '–') },
          { key: 'cost', label: 'Chick cost', right: true, render: (r) => rs(r.qty * r.costPerBird) },
          { key: 'status', label: 'Status', render: (r) => <Badge tone={{ Growing: 'info', 'Ready soon': 'warn', Selling: 'ok' }[r.status] || 'mute'}>{r.status}</Badge> },
        ]}
        rows={rows}
      />
    </Card>
  )
}

function Mortality() {
  const { data } = useStore()
  const rows = data.birdMoves.filter((m) => m.type === 'mortality').slice(-40).reverse().map((m) => ({ ...m, key: m.id }))
  const byReason = {}
  for (const m of data.birdMoves.filter((x) => x.type === 'mortality' && x.date >= addDays(today(), -29))) byReason[m.reason] = (byReason[m.reason] || 0) + m.qty
  const total = sum(Object.values(byReason))
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <Card className="col-span-3 lg:col-span-1">
        <CardHead title="Causes · last 30 days" sub={`${num(total)} birds`} />
        <div className="space-y-2.5 px-3 py-3 sm:px-5 sm:py-4">
          {Object.entries(byReason).sort((a, b) => b[1] - a[1]).map(([r, v]) => (
            <div key={r}>
              <div className="flex justify-between text-[11.5px] sm:text-[13px]">
                <span>{r}</span>
                <span className="font-semibold tabular-nums">{num(v)} <span className="font-normal text-muted">· {((v / total) * 100).toFixed(0)}%</span></span>
              </div>
              <Progress value={v} max={total} color={UNITS.farm.color} className="mt-1" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="col-span-3 lg:col-span-2">
        <Table
          max={480}
          cols={[
            { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
            { key: 'batch', label: 'Batch' },
            { key: 'qty', label: 'Birds', right: true, render: (r) => <b className="text-crit-d">{r.qty}</b> },
            { key: 'reason', label: 'Reason' },
            { key: 'by', label: 'Recorded by' },
          ]}
          rows={rows}
        />
      </Card>
    </div>
  )
}

function Feed({ onAction }) {
  const { data } = useStore()
  const moves = data.feedMoves.filter((m) => m.type !== 'opening').slice(-60).reverse().map((m) => ({ ...m, key: m.id, item: data.feed.find((f) => f.id === m.item) }))
  const from = addDays(today(), -6)
  return (
    <div className="space-y-2 sm:space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" icon={PackageMinus} onClick={() => onAction('feed-issue')}>Issue to shed</Button>
        <Button icon={PackagePlus} onClick={() => onAction('feed-purchase')}>Feed purchase</Button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        {data.feed.map((f) => {
          const s = feedStock(data, f.id)
          const used7 = sum(data.feedMoves.filter((m) => m.item === f.id && m.type === 'issued' && m.date >= from), (m) => m.bags)
          const low = s < f.reorder
          return (
            <Card key={f.id} className={cx('p-3 sm:p-4', low && 'border-crit/40')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]">{f.type}</p>
                  <p className="text-[12px] font-semibold text-ink sm:text-sm">{f.name}</p>
                </div>
                {low && <Badge tone="crit" icon={TriangleAlert}>Low</Badge>}
              </div>
              <p className="mt-2 font-display text-xl font-bold sm:text-3xl">{num(s)} <span className="text-xs font-medium text-muted sm:text-sm">bags</span></p>
              <Progress value={s} max={Math.max(f.reorder * 4, s)} color={low ? 'var(--color-crit)' : UNITS.farm.color} className="mt-2" />
              <div className="mt-2 flex justify-between text-[10px] text-muted sm:text-[11px]">
                <span>Reorder at {f.reorder}</span>
                <span>~{Math.max(0, Math.floor(s / (used7 / 7 || 1)))} days left</span>
              </div>
              <p className="mt-1 text-[10px] text-muted sm:text-[11px]">{f.bagKg} kg bag · {rs(f.rate)} · {f.supplier}</p>
            </Card>
          )
        })}
      </div>
      <Card>
        <CardHead title="Feed register" sub="Purchases and daily issues to sheds" />
        <div className="mt-2">
          <Table
            max={420}
            cols={[
              { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
              { key: 'type', label: 'Entry', render: (r) => <Badge tone={r.type === 'purchase' ? 'ok' : 'mute'}>{r.type === 'purchase' ? 'Purchase' : 'Issued'}</Badge> },
              { key: 'item', label: 'Feed', render: (r) => r.item.name },
              { key: 'bags', label: 'Bags', right: true, render: (r) => <b className={r.type === 'purchase' ? 'text-good-d' : ''}>{r.type === 'purchase' ? '+' : '−'}{r.bags}</b> },
              { key: 'detail', label: 'Shed / supplier', render: (r) => r.shed || r.supplier },
              { key: 'value', label: 'Value', right: true, render: (r) => (r.rate ? rs(r.bags * r.rate) : '–') },
              { key: 'by', label: 'By', className: 'max-sm:hidden' },
            ]}
            rows={moves}
          />
        </div>
      </Card>
    </div>
  )
}

function Performance({ book, feedUsed }) {
  const { data } = useStore()
  const from = addDays(today(), -29)
  const exps = data.expenses.filter((e) => e.unit === 'farm' && e.date >= from)
  const byCat = {}
  for (const e of exps) byCat[e.category] = (byCat[e.category] || 0) + e.amount
  const totalCost = sum(Object.values(byCat))
  const perBird = totalCost / (book.transferred || 1)
  const fcr = (feedUsed * 50) / (book.transferred * 2.2 || 1)
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <div className="col-span-3 grid grid-cols-4 gap-2 sm:gap-4">
        <Stat label="Birds sent to units" value={num(book.transferred)} icon={ArrowRightLeft} sub="last 30 days" />
        <Stat label="Mortality rate" value={`${((book.mortality / (book.opening + book.received)) * 100).toFixed(2)}%`} icon={Activity} sub={`${num(book.mortality)} birds`} />
        <Stat label="Feed conversion (est.)" value={fcr.toFixed(2)} icon={Scale} sub="kg feed per kg live sent" />
        <Stat label="Est. cost per bird" value={rs(perBird)} icon={Bird} sub="farm costs ÷ birds sent" />
      </div>
      <Card className="col-span-3 lg:col-span-2">
        <CardHead title="Farm costs by category · last 30 days" sub={`${rs(totalCost)} total`} />
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 px-3 py-3 sm:px-5 sm:py-4">
          {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => (
            <div key={c}>
              <div className="flex justify-between text-[11.5px] sm:text-[13px]">
                <span>{c}</span>
                <span className="font-semibold tabular-nums">{rs(v)}</span>
              </div>
              <Progress value={v} max={totalCost} color={UNITS.farm.color} className="mt-1" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="col-span-3 p-3 text-[12px] leading-relaxed text-ink-2 sm:p-5 sm:text-sm lg:col-span-1">
        <p className="font-display text-sm font-bold text-ink sm:text-base">How this is calculated</p>
        <p className="mt-2">Cost per bird = chicks + feed + medicine + vaccine + labour + power + litter recorded for the farm, divided by birds transferred to the three units.</p>
        <p className="mt-2 text-muted">Feed allocation (by farm, shed or flock) and how birds arrive (bought chicks, own raising or both) are confirmed with the owner in phase 1, and this report follows that rule.</p>
      </Card>
    </div>
  )
}

function MortalityModal({ open, onClose }) {
  const { data, dispatch } = useStore()
  const active = data.batches.filter((b) => b.status !== 'Sold out')
  const [f, setF] = useState({ qty: '', batch: active[0]?.id, reason: 'Natural', date: today() })
  const submit = (e) => {
    e.preventDefault()
    dispatch('mortality', { ...f, qty: +f.qty }, `${f.qty} birds logged in ${f.batch}`)
    setF({ ...f, qty: '' })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Log mortality" sub="Reduces live bird stock immediately">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Birds">
          <Input type="number" min="1" required autoFocus value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} />
        </Field>
        <Field label="Date">
          <Input type="date" value={f.date} max={today()} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </Field>
        <Field label="Batch">
          <Select value={f.batch} onChange={(e) => setF({ ...f, batch: e.target.value })} options={active.map((b) => ({ value: b.id, label: `${b.id} · ${b.shed}` }))} />
        </Field>
        <Field label="Reason">
          <Select value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} options={REASONS} />
        </Field>
        <Button className="col-span-2 mt-1">Save mortality</Button>
      </form>
    </Modal>
  )
}

function BatchModal({ open, onClose }) {
  const { dispatch } = useStore()
  const t = today()
  const [f, setF] = useState({ qty: '12000', cost: '42', shed: 'Shed A', source: 'Venky’s Hatchery', date: t })
  const submit = (e) => {
    e.preventDefault()
    const id = `B-${f.date.slice(5, 7)}${f.date.slice(8)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
    dispatch('batch', { ...f, id, qty: +f.qty, cost: +f.cost }, `Batch ${id} placed · ${num(+f.qty)} chicks`)
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Place a new batch" sub="Adds birds to stock and the chick cost to farm expenses">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Chicks received"><Input type="number" min="1" required value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></Field>
        <Field label="Cost per chick (₹)"><Input type="number" min="0" required value={f.cost} onChange={(e) => setF({ ...f, cost: e.target.value })} /></Field>
        <Field label="Shed"><Select value={f.shed} onChange={(e) => setF({ ...f, shed: e.target.value })} options={['Shed A', 'Shed B', 'Shed C', 'Shed D']} /></Field>
        <Field label="Date"><Input type="date" value={f.date} max={t} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Hatchery / supplier" className="col-span-2"><Input value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} /></Field>
        <div className="col-span-2 rounded-xl bg-page p-3 text-xs text-ink-2">Total chick cost <b>{rs(+f.qty * +f.cost)}</b> is added to farm expenses.</div>
        <Button className="col-span-2">Place batch</Button>
      </form>
    </Modal>
  )
}

function TransferModal({ open, onClose, onHand }) {
  const { data, dispatch, user } = useStore()
  const [f, setF] = useState({ qty: '', to: 'retail', batch: data.batches.find((b) => b.status === 'Selling')?.id || data.batches[0]?.id, note: '' })
  const over = +f.qty > onHand
  const submit = (e) => {
    e.preventDefault()
    if (over && user.id !== 'owner') return
    dispatch('transfer', { ...f, qty: +f.qty, override: over }, `${num(+f.qty)} birds sent to ${UNITS[f.to].name}`)
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Transfer birds to a unit" sub="Reduces farm stock and increases the unit's stock. It is not a sale, so nothing is counted twice.">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Birds" hint={`${num(onHand)} on hand`}><Input type="number" min="1" required value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></Field>
        <Field label="To unit"><Select value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} options={['district', 'local', 'retail'].map((u) => ({ value: u, label: UNITS[u].name }))} /></Field>
        <Field label="From batch" className="col-span-2"><Select value={f.batch} onChange={(e) => setF({ ...f, batch: e.target.value })} options={data.batches.filter((b) => b.status !== 'Sold out').map((b) => ({ value: b.id, label: `${b.id} · ${b.shed} · ${b.status}` }))} /></Field>
        {over && (
          <div className="col-span-2 flex gap-2 rounded-xl bg-crit-l p-3 text-xs text-crit-d">
            <TriangleAlert className="size-4 shrink-0" />
            More than the {num(onHand)} birds on hand. {user.id === 'owner' ? 'As owner you can override; it will be flagged in the audit log.' : 'Only the owner can override this.'}
          </div>
        )}
        <Button className="col-span-2" disabled={over && user.id !== 'owner'}>{over ? 'Override & transfer' : 'Transfer birds'}</Button>
      </form>
    </Modal>
  )
}

function FeedModal({ kind, onClose }) {
  const { data, dispatch } = useStore()
  const [f, setF] = useState({ item: 'grow', bags: '', shed: 'Shed A', rate: '', supplier: '' })
  const item = data.feed.find((x) => x.id === f.item)
  const stock = feedStock(data, f.item)
  const submit = (e) => {
    e.preventDefault()
    dispatch('feed', { kind, item: f.item, bags: +f.bags, shed: kind === 'issued' ? f.shed : undefined, rate: +(f.rate || item.rate), supplier: f.supplier || item.supplier }, kind === 'purchase' ? `${f.bags} bags purchased` : `${f.bags} bags issued to ${f.shed}`)
    setF({ ...f, bags: '' })
    onClose()
  }
  return (
    <Modal open={!!kind} onClose={onClose} title={kind === 'purchase' ? 'Feed purchase' : 'Issue feed to shed'} sub={`${item.name}: ${num(stock)} bags in store`}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Feed" className="col-span-2"><Select value={f.item} onChange={(e) => setF({ ...f, item: e.target.value })} options={data.feed.map((x) => ({ value: x.id, label: `${x.name} (${x.bagKg} kg)` }))} /></Field>
        <Field label="Bags"><Input type="number" min="1" max={kind === 'issued' ? stock : undefined} required value={f.bags} onChange={(e) => setF({ ...f, bags: e.target.value })} /></Field>
        {kind === 'issued' ? (
          <Field label="Shed"><Select value={f.shed} onChange={(e) => setF({ ...f, shed: e.target.value })} options={['Shed A', 'Shed B', 'Shed C', 'Shed D']} /></Field>
        ) : (
          <>
            <Field label="Rate per bag (₹)"><Input type="number" placeholder={String(item.rate)} value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} /></Field>
            <Field label="Supplier" className="col-span-2"><Input placeholder={item.supplier} value={f.supplier} onChange={(e) => setF({ ...f, supplier: e.target.value })} /></Field>
            <div className="col-span-2 rounded-xl bg-page p-3 text-xs text-ink-2">Purchase value <b>{rs(+f.bags * +(f.rate || item.rate))}</b> is also posted to farm expenses (Feed).</div>
          </>
        )}
        <Button className="col-span-2">{kind === 'purchase' ? 'Save purchase' : 'Issue feed'}</Button>
      </form>
    </Modal>
  )
}
