import { useState } from 'react'
import { Bird, Wheat, Receipt, Truck, Route, Hotel, Store, LayoutDashboard, Users, Download, FileSpreadsheet } from 'lucide-react'
import { useStore } from '../store.jsx'
import { UNITS } from '../config.js'
import { productsFor } from '../catalog.js'
import { birdBook, invoiceTotal, partySummary, today, addDays, downloadCSV, sum, fmtDateLong } from '../lib.js'
import { PageHeader, Card, Button, Segmented, Input, cx } from '../components/ui.jsx'
import { balanceOf } from './Workers.jsx'

// The nine reports from brief §11. Each one is built from the same records the screens use.
const REPORTS = [
  { id: 'birds', unit: 'farm', icon: Bird, title: 'Farm bird report', desc: 'Opening, received, mortality, transfers and closing birds by day.' },
  { id: 'feed', unit: 'farm', icon: Wheat, title: 'Farm feed report', desc: 'Opening, purchased, used and closing bags per feed.' },
  { id: 'farmexp', unit: 'farm', icon: Receipt, title: 'Farm expenses', desc: 'Every farm expense with category, payee and method.' },
  { id: 'district', unit: 'district', icon: Truck, title: 'District wholesale', desc: 'Buyer-wise birds, kg, sales, transport, collections and dues.' },
  { id: 'local', unit: 'local', icon: Route, title: 'Local distribution', desc: 'Route-wise loaded, delivered, returned, lost, sales and collection.' },
  { id: 'hotels', unit: 'retail', icon: Hotel, title: 'Hotel ledger', desc: 'Each hotel: billed, paid, balance and aging buckets.' },
  { id: 'retail', unit: 'retail', icon: Store, title: 'Retail shop', desc: 'Daily counter vs hotel sales, kg sold and wastage.' },
  { id: 'combined', unit: null, icon: LayoutDashboard, title: 'Combined summary', desc: 'Sales, collections and expenses by unit with estimated result.' },
  { id: 'workers', unit: null, icon: Users, title: 'Worker report', desc: 'Attendance, salary and advance balance. Owner only.', owner: true },
]

export default function Reports() {
  const { data, units, user } = useStore()
  const PRODUCTS = productsFor(data, 'retail')
  const [days, setDays] = useState(30)
  const [custom, setCustom] = useState({ from: addDays(today(), -29), to: today() })
  const from = days === 'custom' ? custom.from : addDays(today(), -(days - 1))
  const to = days === 'custom' ? custom.to : today()
  const list = REPORTS.filter((r) => (r.unit ? units.includes(r.unit) : user.modules === 'all') && (!r.owner || user.id === 'owner'))

  const build = (id) => {
    const inR = (d) => d >= from && d <= to
    const dates = []
    for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d)
    const pmap = Object.fromEntries(data.parties.map((p) => [p.id, p]))
    switch (id) {
      case 'birds':
        return [['Date', 'Opening', 'Received', 'Mortality', 'Transferred', 'Closing'], ...dates.map((d) => { const b = birdBook(data, d, d); return [d, b.opening, b.received, b.mortality, b.transferred, b.closing] })]
      case 'feed':
        return [['Feed', 'Opening bags', 'Purchased', 'Used', 'Closing bags'], ...data.feed.map((f) => {
          const mv = data.feedMoves.filter((m) => m.item === f.id)
          const sign = (m) => (m.type === 'purchase' || m.type === 'opening' ? m.bags : -m.bags)
          const open = sum(mv.filter((m) => m.date < from), sign)
          const p = sum(mv.filter((m) => inR(m.date) && m.type === 'purchase'), (m) => m.bags)
          const u = sum(mv.filter((m) => inR(m.date) && m.type === 'issued'), (m) => m.bags)
          return [f.name, open, p, u, open + p - u]
        })]
      case 'farmexp':
        return [['Date', 'Category', 'Payee', 'Amount', 'Method', 'Note', 'Entered by'], ...data.expenses.filter((e) => e.unit === 'farm' && inR(e.date)).map((e) => [e.date, e.category, e.payee, e.amount, e.method, e.note, e.by])]
      case 'district':
        return [['Buyer', 'District', 'Bills', 'Birds', 'Live kg', 'Sales', 'Transport', 'Collected', 'Balance', 'Overdue'], ...data.parties.filter((p) => p.unit === 'district').map((p) => {
          const inv = data.invoices.filter((i) => i.partyId === p.id && !i.void && inR(i.date))
          const s = partySummary(data, p.id)
          return [p.name, p.district, inv.length, sum(inv, (i) => i.lines[0].birds), sum(inv, (i) => i.lines[0].qty), Math.round(sum(inv, invoiceTotal)), sum(inv, (i) => i.transport), sum(data.payments.filter((x) => x.partyId === p.id && inR(x.date)), (x) => x.amount), Math.round(s.outstanding), Math.round(s.overdue)]
        })]
      case 'local':
        return [['Date', 'Route', 'Vehicle', 'Loaded', 'Delivered', 'Returned', 'Lost', 'Sales'], ...data.dispatches.filter((d) => inR(d.date)).map((d) => [d.date, d.route, d.vehicle, d.loaded, sum(d.stops.filter((s) => s.status === 'Delivered'), (s) => s.birds), d.returned, d.lost, Math.round(sum(d.stops.filter((s) => s.status === 'Delivered'), (s) => s.kg * s.rate))])]
      case 'hotels':
        return [['Hotel', 'Billed in period', 'Paid in period', 'Balance', 'Current', '1-7', '8-30', '31-60', '60+'], ...data.parties.filter((p) => p.type === 'hotel').map((p) => {
          const s = partySummary(data, p.id)
          return [p.name, Math.round(sum(data.invoices.filter((i) => i.partyId === p.id && !i.void && inR(i.date)), invoiceTotal)), sum(data.payments.filter((x) => x.partyId === p.id && inR(x.date)), (x) => x.amount), Math.round(s.outstanding), ...s.aging.map(Math.round)]
        })]
      case 'retail':
        return [['Date', 'Counter sales', 'Hotel sales', 'Kg sold', 'Wastage kg', ...PRODUCTS.map((p) => `${p.name} kg`)], ...dates.map((d) => {
          const inv = data.invoices.filter((i) => i.unit === 'retail' && !i.void && i.date === d)
          const mv = data.retailMoves.filter((m) => m.date === d)
          return [d, Math.round(sum(inv.filter((i) => i.partyId === 'C1'), invoiceTotal)), Math.round(sum(inv.filter((i) => i.partyId !== 'C1'), invoiceTotal)), sum(mv.filter((m) => m.type === 'sold'), (m) => m.kg).toFixed(1), sum(mv.filter((m) => m.type === 'wastage'), (m) => m.kg).toFixed(1), ...PRODUCTS.map((p) => sum(mv.filter((m) => m.type === 'sold' && m.product === p.id), (m) => m.kg).toFixed(1))]
        })]
      case 'combined':
        return [['Unit', 'Sales', 'Collections', 'Expenses', 'Est. result'], ...Object.values(UNITS).map((u) => {
          const s = sum(data.invoices.filter((i) => i.unit === u.id && !i.void && inR(i.date)), invoiceTotal)
          const c = sum(data.payments.filter((p) => pmap[p.partyId].unit === u.id && inR(p.date) && p.kind !== 'credit'), (p) => p.amount)
          const e = sum(data.expenses.filter((x) => x.unit === u.id && inR(x.date)), (x) => x.amount)
          return [u.full, Math.round(s), c, e, Math.round(s - e)]
        })]
      case 'workers':
        return [['Worker', 'Unit', 'Role', 'Salary', 'Present days', 'Absent', 'Leave', 'Advance due'], ...data.workers.map((w) => {
          const ds = Object.keys(data.attendance).filter(inR)
          const c = (k) => ds.filter((d) => data.attendance[d][w.id] === k).length
          return [w.name, w.unit, w.role, w.salary, c('P'), c('A'), c('L'), balanceOf(data, w.id).advance]
        })]
      default:
        return []
    }
  }

  return (
    <div>
      <PageHeader title="Reports" sub="Export any report as CSV (opens in Excel). Totals match the records on every screen." />
      <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-5">
        <Segmented value={days} onChange={setDays} options={[{ value: 1, label: 'Today' }, { value: 7, label: '7 days' }, { value: 30, label: '30 days' }, { value: 'custom', label: 'Custom' }]} />
        {days === 'custom' && (
          <div className="flex items-center gap-1.5">
            <Input type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className="!h-8 !w-36 !text-xs" />
            <span className="text-xs text-muted">to</span>
            <Input type="date" value={custom.to} max={today()} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className="!h-8 !w-36 !text-xs" />
          </div>
        )}
        <span className="text-[11px] text-muted sm:text-xs">{fmtDateLong(from)} – {fmtDateLong(to)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
        {list.map((r) => {
          const rows = build(r.id)
          return (
            <Card key={r.id} className="flex flex-col p-3 sm:p-4">
              <div className="flex items-start gap-2.5">
                <span className={cx('grid size-8 shrink-0 place-items-center rounded-lg text-white sm:size-10')} style={{ background: r.unit ? UNITS[r.unit].color : 'var(--color-brand)' }}>
                  <r.icon className="size-4 sm:size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold sm:text-[15px]">{r.title}</p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-muted sm:text-xs">{r.desc}</p>
                </div>
              </div>
              <div className="mt-3 overflow-hidden rounded-lg border border-line text-[9.5px] sm:text-[11px]">
                <div className="flex gap-3 overflow-hidden whitespace-nowrap bg-page px-2 py-1 font-semibold text-muted">{rows[0]?.slice(0, 4).map((h) => <span key={h} className="flex-1 truncate">{h}</span>)}</div>
                {rows.slice(1, 3).map((row, i) => (
                  <div key={i} className="flex gap-3 overflow-hidden whitespace-nowrap border-t border-line/60 px-2 py-1 tabular-nums">{row.slice(0, 4).map((c, j) => <span key={j} className="flex-1 truncate">{c}</span>)}</div>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                <span className="flex items-center gap-1 text-[10.5px] text-muted sm:text-xs"><FileSpreadsheet className="size-3.5" />{rows.length - 1} rows</span>
                <Button size="sm" variant="outline" icon={Download} onClick={() => downloadCSV(`raja-${r.id}-${from}-to-${to}.csv`, rows)}>CSV</Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
