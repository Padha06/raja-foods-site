import { useMemo, useState } from 'react'
import { IndianRupee, HandCoins, Clock, Bird, Wheat, TrendingUp, ArrowUpRight, CheckCircle2, Circle, TriangleAlert, CircleAlert, Info } from 'lucide-react'
import { useStore } from '../store.jsx'
import { useAlerts } from '../alerts.js'
import { UNITS, SELLING_UNITS, BRAND } from '../config.js'
import { FEED_ITEMS } from '../data.js'
import { today, addDays, invoiceTotal, rs, rsShort, num, partySummary, birdBook, feedStock, fmtDate, fmtTime, sum } from '../lib.js'
import { Card, CardHead, Stat, Segmented, Badge, UnitTag, Progress, cx } from '../components/ui.jsx'
import { SalesBars, Legend, AgingBar } from '../components/charts.jsx'
import { go } from '../nav.js'

const RANGES = [
  { value: 1, label: 'Today' },
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 365, label: '365 days' },
]

export default function Dashboard() {
  const { data, user, units, dispatch } = useStore()
  const alerts = useAlerts()
  const [range, setRange] = useState(30)
  const t = today()
  const from = addDays(t, -(range - 1))
  const selling = SELLING_UNITS.filter((u) => units.includes(u))
  const seesFarm = units.includes('farm')

  const m = useMemo(() => {
    const inRange = (d) => d >= from && d <= t
    const partyUnit = Object.fromEntries(data.parties.map((p) => [p.id, p.unit]))
    const inv = data.invoices.filter((i) => !i.void && selling.includes(i.unit))
    const byUnit = Object.fromEntries(selling.map((u) => [u, { sales: 0, prev: 0, coll: 0, due: 0, overdue: 0, count: 0 }]))
    const prevFrom = addDays(from, -range)
    for (const i of inv) {
      if (inRange(i.date)) { byUnit[i.unit].sales += invoiceTotal(i); byUnit[i.unit].count++ }
      else if (i.date >= prevFrom && i.date < from) byUnit[i.unit].prev += invoiceTotal(i)
    }
    for (const p of data.payments) {
      const u = partyUnit[p.partyId]
      if (byUnit[u] && inRange(p.date) && p.kind !== 'credit') byUnit[u].coll += p.amount
    }
    const aging = [0, 0, 0, 0, 0]
    const debtors = []
    for (const p of data.parties) {
      if (!byUnit[p.unit] || p.type === 'counter') continue
      const s = partySummary(data, p.id)
      byUnit[p.unit].due += s.outstanding
      byUnit[p.unit].overdue += s.overdue
      s.aging.forEach((v, k) => (aging[k] += v))
      debtors.push(s)
    }
    debtors.sort((a, b) => b.overdue - a.overdue)
    const chartDays = range
    const days = Array.from({ length: chartDays }, (_, k) => ({ date: addDays(t, -(chartDays - 1 - k)), district: 0, local: 0, retail: 0 }))
    const idx = Object.fromEntries(days.map((d, k) => [d.date, k]))
    for (const i of inv) if (idx[i.date] != null) days[idx[i.date]][i.unit] += invoiceTotal(i)
    const exp = sum(data.expenses.filter((e) => inRange(e.date) && (units.includes(e.unit) || (e.unit === 'admin' && user.modules === 'all'))), (e) => e.amount)
    const sales = sum(Object.values(byUnit), (x) => x.sales)
    const prev = sum(Object.values(byUnit), (x) => x.prev)
    return { byUnit, aging, debtors: debtors.slice(0, 5), days, exp, sales, prev, coll: sum(Object.values(byUnit), (x) => x.coll), due: sum(Object.values(byUnit), (x) => x.due), overdue: sum(Object.values(byUnit), (x) => x.overdue) }
  }, [data, from, t, range, selling.join(), units.join()]) // eslint-disable-line react-hooks/exhaustive-deps

  const book = useMemo(() => birdBook(data, from, t), [data, from, t])
  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  // only compare when records cover the whole previous period, or the % is meaningless
  const firstDay = data.parties.reduce((d, p) => (p.openingDate < d ? p.openingDate : d), t)
  const comparable = m.prev && addDays(from, -range) >= firstDay
  const growth = comparable ? ((m.sales - m.prev) / m.prev) * 100 : 0

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium text-muted sm:text-sm">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="font-display text-lg font-bold text-ink sm:text-[28px]">
            {hello}, {user.person.split(' ')[0]}
          </h1>
        </div>
        <Segmented options={RANGES} value={range} onChange={setRange} />
      </div>

      {selling.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          <Stat label={`Sales · ${range === 1 ? 'today' : `last ${range} days`}`} value={rsShort(m.sales)} icon={IndianRupee} tone="info" sub={comparable ? <span className={growth >= 0 ? 'text-good-d' : 'text-crit-d'}>{growth >= 0 ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}% vs previous {range === 1 ? 'day' : `${range} days`}</span> : `${sum(Object.values(m.byUnit), (x) => x.count)} bills`} />
          <Stat label="Collections received" value={rsShort(m.coll)} icon={HandCoins} tone="ok" sub={`${Math.round((m.coll / (m.sales || 1)) * 100)}% of sales collected`} />
          <Stat label="Outstanding dues" value={rsShort(m.due)} icon={Clock} tone="warn" sub={<span className="text-crit-d">{rsShort(m.overdue)} overdue</span>} onClick={() => go('ledgers')} />
          {seesFarm ? (
            <Stat label="Birds on farm now" value={num(birdBook(data, '2000-01-01', t).closing)} icon={Bird} sub={`${num(book.mortality)} mortality in period`} onClick={() => go('farm')} />
          ) : (
            <Stat label="Expenses in period" value={rsShort(m.exp)} icon={TrendingUp} sub="All recorded expenses" onClick={() => go('expenses')} />
          )}
        </div>
      )}

      {selling.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="col-span-3 lg:col-span-2">
            <CardHead title="Daily sales by unit" sub="Every bar is the sum of the posted invoices for that day · hover for detail" right={<div className="hidden sm:block"><Legend series={selling} /></div>} />
            <div className="px-2 pb-3 pt-3 sm:px-5 sm:pb-5">
              <SalesBars days={m.days} series={selling} />
              <div className="mt-2 sm:hidden"><Legend series={selling} /></div>
            </div>
          </Card>
          <div className="col-span-3 grid grid-cols-3 gap-2 sm:gap-4 lg:col-span-1 lg:grid-cols-1">
            {selling.map((u) => {
              const x = m.byUnit[u]
              return (
                <Card key={u} className="p-2.5 sm:p-4">
                  <button onClick={() => go(u)} className="block w-full text-left">
                    <div className="flex items-center justify-between">
                      <UnitTag unit={u} short />
                      <ArrowUpRight className="size-3.5 text-muted" />
                    </div>
                    <p className="mt-1.5 font-display text-base font-bold leading-none sm:text-2xl">{rsShort(x.sales)}</p>
                    <div className="mt-2 grid grid-cols-1 gap-0.5 text-[10px] text-muted sm:grid-cols-2 sm:text-xs">
                      <span>Collected <b className="text-ink-2">{rsShort(x.coll)}</b></span>
                      <span>Due <b className={x.overdue > 0 ? 'text-crit-d' : 'text-ink-2'}>{rsShort(x.due)}</b></span>
                    </div>
                  </button>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
        {seesFarm && <FarmCard book={book} range={range} />}
        {selling.length > 0 && (
          <Card className={cx('col-span-2 lg:col-span-1', !seesFarm && 'lg:col-span-2')}>
            <CardHead title="Who owes us" sub="Buyer & hotel dues by age (from posted invoices & receipts)" right={<button onClick={() => go('ledgers')} className="text-[11px] font-semibold text-brand sm:text-xs">All ledgers</button>} />
            <div className="px-3 pb-2 pt-3 sm:px-5">
              <AgingBar buckets={m.aging} />
            </div>
            <div className="mt-1 divide-y divide-line/70 px-3 pb-2 sm:px-5">
              {m.debtors.map((d) => (
                <button key={d.party.id} onClick={() => go('ledgers', d.party.id)} className="flex w-full items-center gap-2 py-2 text-left">
                  <span className="size-1.5 shrink-0 rounded-full sm:size-2" style={{ background: UNITS[d.party.unit].color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold text-ink sm:text-[13px]">{d.party.name}</span>
                    <span className="block text-[10px] text-muted sm:text-[11px]">{d.oldest > 0 ? `oldest ${d.oldest} days overdue` : 'within credit days'}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[12px] font-semibold tabular-nums text-ink sm:text-[13px]">{rs(d.outstanding)}</span>
                    {d.overLimit ? <Badge tone="crit">Over limit</Badge> : d.overdue > 0 ? <span className="text-[10px] text-crit-d sm:text-[11px]">{rs(d.overdue)} overdue</span> : null}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}
        <Card className="col-span-2 lg:col-span-1">
          <CardHead title="Needs attention" sub={`${alerts.length} alerts · ${data.todos.filter((x) => !x.done && units.includes(x.unit)).length} open tasks`} />
          <div className="max-h-[360px] divide-y divide-line/70 overflow-y-auto px-3 pb-2 pt-1 sm:px-5">
            {alerts.slice(0, 6).map((a) => {
              const Icon = { crit: CircleAlert, warn: TriangleAlert, info: Info }[a.tone]
              return (
                <button key={a.id} onClick={() => go(...a.link)} className="flex w-full items-start gap-2 py-2 text-left">
                  <Icon className={cx('mt-0.5 size-3.5 shrink-0 sm:size-4', { crit: 'text-crit', warn: 'text-warn-d', info: 'text-sky-d' }[a.tone])} />
                  <span className="min-w-0">
                    <span className="block text-[12px] font-semibold text-ink sm:text-[13px]">{a.title}</span>
                    <span className="block truncate text-[10.5px] text-muted sm:text-xs">{a.text}</span>
                  </span>
                </button>
              )
            })}
            {data.todos.filter((x) => units.includes(x.unit)).map((td) => (
              <button key={td.id} onClick={() => dispatch('todo', { id: td.id })} className="flex w-full items-start gap-2 py-2 text-left">
                {td.done ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-good sm:size-4" /> : <Circle className="mt-0.5 size-3.5 shrink-0 text-muted sm:size-4" />}
                <span className={cx('text-[12px] sm:text-[13px]', td.done ? 'text-muted line-through' : 'text-ink')}>{td.text}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {selling.length > 0 && user.modules === 'all' && <ResultCard m={m} range={range} />}
      <RecentActivity />
    </div>
  )
}

function FarmCard({ book, range }) {
  const { data } = useStore()
  const rows = [
    ['Opening', book.opening, ''],
    ['+ Chicks placed / returned', book.received, 'text-good-d'],
    ['− Mortality', book.mortality, 'text-crit-d'],
    ['− Sent to units', book.transferred, 'text-ink-2'],
  ]
  return (
    <Card className="col-span-2 lg:col-span-1">
      <CardHead icon={Bird} title="Farm bird book" sub={range === 1 ? 'Today' : `Last ${range} days · reconciles to every movement`} right={<button onClick={() => go('farm')} className="text-[11px] font-semibold text-brand sm:text-xs">Open farm</button>} />
      <div className="grid grid-cols-2 gap-3 px-3 pb-4 pt-3 sm:px-5">
        <div className="space-y-1.5 text-[11.5px] sm:text-[13px]">
          {rows.map(([l, v, c]) => (
            <div key={l} className="flex justify-between gap-2">
              <span className="text-muted">{l}</span>
              <span className={cx('font-semibold tabular-nums', c)}>{num(v)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-line pt-1.5 font-bold">
            <span>Closing birds</span>
            <span className="tabular-nums">{num(book.closing)}</span>
          </div>
          <p className="text-[10px] text-muted sm:text-[11px]">Mortality rate {((book.mortality / (book.opening + book.received || 1)) * 100).toFixed(2)}%</p>
        </div>
        <div className="space-y-2">
          <p className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted sm:text-[11px]"><Wheat className="size-3" /> Feed in store</p>
          {FEED_ITEMS.map((f) => {
            const s = feedStock(data, f.id)
            const low = s < f.reorder
            return (
              <div key={f.id}>
                <div className="flex justify-between text-[10.5px] sm:text-xs">
                  <span className="truncate text-ink-2">{f.type}</span>
                  <span className={cx('font-semibold tabular-nums', low && 'text-crit-d')}>{num(s)} bags{low && ' ⚠'}</span>
                </div>
                <Progress value={s} max={Math.max(f.reorder * 4, s)} color={low ? 'var(--color-crit)' : UNITS.farm.color} className="mt-1" />
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

function ResultCard({ m, range }) {
  const margin = m.sales ? ((m.sales - m.exp) / m.sales) * 100 : 0
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-4 divide-x divide-line">
        {[
          ['Sales', m.sales, 'text-ink'],
          ['Recorded costs', m.exp, 'text-ink'],
          ['Est. operating result', m.sales - m.exp, m.sales - m.exp >= 0 ? 'text-good-d' : 'text-crit-d'],
          ['Margin', null, 'text-ink'],
        ].map(([l, v, c]) => (
          <div key={l} className="p-2.5 sm:p-4">
            <p className="text-[9.5px] text-muted sm:text-xs">{l}</p>
            <p className={cx('mt-1 font-display text-[13px] font-bold sm:text-xl', c)}>{v == null ? `${margin.toFixed(1)}%` : rsShort(v)}</p>
          </div>
        ))}
      </div>
      <p className="border-t border-line bg-page/60 px-3 py-2 text-[10px] text-muted sm:px-5 sm:text-[11px]">
        {range === 1 ? 'Today' : `Last ${range} days`}. Costs = chicks, feed, medicine, transport, shop and admin expenses as entered. The costing method is confirmed with {BRAND.owner} before launch.
      </p>
    </Card>
  )
}

function RecentActivity() {
  const { data, units } = useStore()
  const rows = data.audit.filter((a) => units.includes(a.unit)).slice(0, 6)
  return (
    <Card>
      <CardHead title="Recent activity" sub="Who did what, across your units" right={<button onClick={() => go('activity')} className="text-[11px] font-semibold text-brand sm:text-xs">Full audit log</button>} />
      <div className="grid grid-cols-2 gap-x-6 px-3 pb-3 pt-2 sm:px-5 lg:grid-cols-3">
        {rows.map((a) => (
          <div key={a.id} className="flex gap-2 border-b border-line/60 py-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full sm:size-2" style={{ background: UNITS[a.unit]?.color }} />
            <div className="min-w-0">
              <p className="truncate text-[11.5px] font-semibold text-ink sm:text-[13px]">{a.action} {a.flag && <Badge tone="warn">review</Badge>}</p>
              <p className="truncate text-[10.5px] text-muted sm:text-xs">{a.detail}</p>
              <p className="text-[10px] text-muted sm:text-[11px]">{a.who} · {a.at > Date.now() - 864e5 ? fmtTime(a.at) : fmtDate(new Date(a.at).toISOString().slice(0, 10))}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
