import { useMemo, useState } from 'react'
import { Plus, Truck, MapPin, IndianRupee, Clock, HandCoins, Phone } from 'lucide-react'
import { useStore } from '../store.jsx'
import { DISTRICTS, UNITS } from '../config.js'
import { invoiceTotal, partySummary, rs, rsShort, num, today, addDays, fmtDate, sum } from '../lib.js'
import { PageHeader, Card, CardHead, Stat, Tabs, Table, Badge, Button, Progress, Select } from '../components/ui.jsx'
import { InvoiceModal, InvoiceView, PaymentModal } from '../components/Invoice.jsx'
import { go } from '../nav.js'

const STATUS_TONE = { Loading: 'warn', 'In transit': 'info', Delivered: 'ok' }
const NEXT = { Loading: 'In transit', 'In transit': 'Delivered' }

export default function District() {
  const { data, dispatch } = useStore()
  const [tab, setTab] = useState('dispatch')
  const [newBill, setNewBill] = useState(false)
  const [showLast, setShowLast] = useState(false)
  const [view, setView] = useState(null)
  const [pay, setPay] = useState(false)
  const t = today()
  const from = addDays(t, -29)
  const inv = data.invoices.filter((i) => i.unit === 'district' && !i.void)
  const buyers = data.parties.filter((p) => p.unit === 'district')
  const summaries = useMemo(() => buyers.map((b) => partySummary(data, b.id)), [data]) // eslint-disable-line react-hooks/exhaustive-deps
  const month = inv.filter((i) => i.date >= from)
  const transportCost = sum(data.expenses.filter((e) => e.unit === 'district' && e.date >= from), (e) => e.amount)
  const coll = sum(data.payments.filter((p) => p.date >= from && buyers.some((b) => b.id === p.partyId)), (p) => p.amount)

  return (
    <div>
      <PageHeader
        unit="district"
        title="Bulk sales across districts"
        sub="Live birds by count and weight, dispatch tracking, invoices and buyer dues"
        actions={
          <>
            <Button variant="outline" icon={HandCoins} onClick={() => setPay(true)}>Receipt</Button>
            <Button icon={Plus} onClick={() => setNewBill(true)}>New bulk sale</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Stat label="Sales · 30 days" value={rsShort(sum(month, invoiceTotal))} icon={IndianRupee} tone="info" sub={`${month.length} invoices`} />
        <Stat label="Birds sold · 30 days" value={num(sum(month, (i) => i.lines[0].birds))} icon={Truck} sub={`${num(sum(month, (i) => i.lines[0].qty))} kg live`} />
        <Stat label="Collected · 30 days" value={rsShort(coll)} icon={HandCoins} tone="ok" sub={`Transport cost ${rsShort(transportCost)}`} />
        <Stat label="Buyer dues" value={rsShort(sum(summaries, (s) => s.outstanding))} icon={Clock} tone="warn" sub={<span className="text-crit-d">{rsShort(sum(summaries, (s) => s.overdue))} overdue</span>} />
      </div>

      <Tabs className="mt-3 sm:mt-5" value={tab} onChange={setTab} tabs={[{ id: 'dispatch', label: 'Dispatches & invoices' }, { id: 'buyers', label: 'Buyers', count: buyers.length }, { id: 'districts', label: 'District report' }]} />
      <div className="mt-3 sm:mt-4">
        {tab === 'dispatch' && (
          <Card>
            <Table
              max={560}
              onRow={(r) => setView(r.no)}
              cols={[
                { key: 'no', label: 'Invoice', render: (r) => <b>{r.no}</b> },
                { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
                { key: 'buyer', label: 'Buyer', render: (r) => r.party.name },
                { key: 'district', label: 'District', render: (r) => r.party.district },
                { key: 'birds', label: 'Birds', right: true, render: (r) => num(r.lines[0].birds) },
                { key: 'kg', label: 'Live kg', right: true, render: (r) => num(r.lines[0].qty) },
                { key: 'rate', label: 'Rate', right: true, render: (r) => rs(r.lines[0].rate) },
                { key: 'total', label: 'Amount', right: true, render: (r) => <b>{rs(invoiceTotal(r))}</b> },
                { key: 'vehicle', label: 'Vehicle', className: 'max-sm:hidden' },
                {
                  key: 'status',
                  label: 'Dispatch',
                  render: (r) => (
                    <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                      {NEXT[r.status] && (
                        <button onClick={() => dispatch('dispatchStatus', { no: r.no, status: NEXT[r.status] }, `${r.no} marked ${NEXT[r.status]}`)} className="text-[10.5px] font-semibold text-brand hover:underline sm:text-[11px]">
                          → {NEXT[r.status]}
                        </button>
                      )}
                    </span>
                  ),
                },
              ]}
              rows={[...inv].reverse().slice(0, 80).map((i) => ({ ...i, key: i.no, party: buyers.find((b) => b.id === i.partyId) }))}
            />
          </Card>
        )}
        {tab === 'buyers' && (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
            {summaries.map((s) => (
              <Card key={s.party.id} className="p-3 sm:p-4">
                <button onClick={() => go('ledgers', s.party.id)} className="block w-full text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink sm:text-[15px]">{s.party.name}</p>
                      <p className="flex items-center gap-1 text-[10.5px] text-muted sm:text-xs"><MapPin className="size-3" />{s.party.district} · {s.party.contact}</p>
                    </div>
                    {s.overLimit ? <Badge tone="crit">Over limit</Badge> : s.oldest > 7 ? <Badge tone="warn">Overdue</Badge> : <Badge tone="ok">Good</Badge>}
                  </div>
                  <p className="mt-3 font-display text-lg font-bold sm:text-2xl">{rs(s.outstanding)}</p>
                  <Progress value={s.outstanding} max={s.party.creditLimit} color={s.overLimit ? 'var(--color-crit)' : UNITS.district.color} className="mt-2" />
                  <div className="mt-1.5 flex justify-between text-[10px] text-muted sm:text-[11px]">
                    <span>Limit {rsShort(s.party.creditLimit)} · {s.party.creditDays}d credit</span>
                    <span>{rs(s.party.rateKg)}/kg</span>
                  </div>
                  {s.overdue > 0 && <p className="mt-1 text-[10.5px] font-medium text-crit-d sm:text-xs">{rs(s.overdue)} overdue · oldest {s.oldest} days</p>}
                </button>
                <a href={`tel:${s.party.phone.replace(/\s/g, '')}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand"><Phone className="size-3" />{s.party.phone}</a>
              </Card>
            ))}
          </div>
        )}
        {tab === 'districts' && <DistrictReport inv={inv} summaries={summaries} />}
      </div>

      <InvoiceModal open={newBill} onClose={() => setNewBill(false)} unit="district" onCreated={() => setShowLast(true)} />
      {showLast && data.lastInvoice && <InvoiceView no={data.lastInvoice} onClose={() => setShowLast(false)} />}
      {view && <InvoiceView no={view} onClose={() => setView(null)} />}
      <PaymentModal open={pay} onClose={() => setPay(false)} />
    </div>
  )
}

function DistrictReport({ inv, summaries }) {
  const { data } = useStore()
  const [days, setDays] = useState('30')
  const from = addDays(today(), -(+days - 1))
  const rows = DISTRICTS.map((d) => {
    const ids = summaries.filter((s) => s.party.district === d).map((s) => s.party.id)
    const list = inv.filter((i) => ids.includes(i.partyId) && i.date >= from)
    return {
      key: d,
      district: d,
      buyers: ids.length,
      bills: list.length,
      birds: sum(list, (i) => i.lines[0].birds),
      kg: sum(list, (i) => i.lines[0].qty),
      sales: sum(list, invoiceTotal),
      transport: sum(list, (i) => i.transport),
      coll: sum(data.payments.filter((p) => ids.includes(p.partyId) && p.date >= from), (p) => p.amount),
      due: sum(summaries.filter((s) => s.party.district === d), (s) => s.outstanding),
      overdue: sum(summaries.filter((s) => s.party.district === d), (s) => s.overdue),
    }
  })
  const tot = (k) => sum(rows, (r) => r[k])
  return (
    <Card>
      <CardHead title="District-wise sales, collections & dues" right={<Select value={days} onChange={(e) => setDays(e.target.value)} options={[{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }]} className="!h-8 !w-36 !text-xs" />} />
      <div className="mt-2">
        <Table
          cols={[
            { key: 'district', label: 'District', render: (r) => <b>{r.district}</b> },
            { key: 'bills', label: 'Bills', right: true },
            { key: 'birds', label: 'Birds', right: true, render: (r) => num(r.birds) },
            { key: 'kg', label: 'Live kg', right: true, render: (r) => num(r.kg) },
            { key: 'sales', label: 'Sales', right: true, render: (r) => rs(r.sales) },
            { key: 'transport', label: 'Transport', right: true, render: (r) => rs(r.transport) },
            { key: 'coll', label: 'Collected', right: true, render: (r) => rs(r.coll) },
            { key: 'due', label: 'Due', right: true, render: (r) => rs(r.due) },
            { key: 'overdue', label: 'Overdue', right: true, render: (r) => <span className={r.overdue ? 'text-crit-d' : ''}>{rs(r.overdue)}</span> },
          ]}
          rows={rows}
          foot={{ district: 'Total', bills: tot('bills'), birds: num(tot('birds')), kg: num(tot('kg')), sales: rs(tot('sales')), transport: rs(tot('transport')), coll: rs(tot('coll')), due: rs(tot('due')), overdue: rs(tot('overdue')) }}
        />
      </div>
    </Card>
  )
}
