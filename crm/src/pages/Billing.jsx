import { useMemo, useState } from 'react'
import { Plus, HandCoins, Search, ReceiptText, Wallet, Smartphone, Landmark } from 'lucide-react'
import { useStore } from '../store.jsx'
import { PAYMENT_METHODS } from '../config.js'
import { invoiceTotal, rs, rsShort, today, addDays, fmtDate, sum } from '../lib.js'
import { PageHeader, Card, Stat, Tabs, Table, Badge, Button, Input, Select, UnitTag } from '../components/ui.jsx'
import { InvoiceModal, InvoiceView, PaymentModal } from '../components/Invoice.jsx'

export default function Billing() {
  const { data, units } = useStore()
  const [tab, setTab] = useState('bills')
  const [q, setQ] = useState('')
  const [days, setDays] = useState('7')
  const [method, setMethod] = useState('All')
  const [newBill, setNewBill] = useState(false)
  const [showLast, setShowLast] = useState(false)
  const [pay, setPay] = useState(false)
  const [view, setView] = useState(null)
  const t = today()
  const from = addDays(t, -(+days - 1))
  const pmap = useMemo(() => Object.fromEntries(data.parties.map((p) => [p.id, p])), [data.parties])
  const match = (p) => !q || p.name.toLowerCase().includes(q.toLowerCase())

  const bills = data.invoices
    .filter((i) => units.includes(i.unit) && i.date >= from && (match(pmap[i.partyId]) || i.no.toLowerCase().includes(q.toLowerCase())))
    .slice()
    .reverse()
    .map((i) => ({ ...i, key: i.no, party: pmap[i.partyId], total: invoiceTotal(i), muted: i.void }))
  const receipts = data.payments
    .filter((p) => units.includes(pmap[p.partyId].unit) && p.date >= from && match(pmap[p.partyId]) && (method === 'All' || p.method === method))
    .slice()
    .reverse()
    .map((p) => ({ ...p, key: p.id, party: pmap[p.partyId] }))
  const todayPays = data.payments.filter((p) => p.date === t && units.includes(pmap[p.partyId].unit))
  const byMethod = (m) => sum(todayPays.filter((p) => p.method === m), (p) => p.amount)

  return (
    <div>
      <PageHeader
        title="Bills & receipts"
        sub="Auto-numbered per unit · cash, UPI, bank and cheque · full, part or credit"
        actions={
          <>
            <Button variant="outline" icon={HandCoins} onClick={() => setPay(true)}>Receipt</Button>
            <Button icon={Plus} onClick={() => setNewBill(true)}>New bill</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Stat label="Billed today" value={rsShort(sum(data.invoices.filter((i) => i.date === t && !i.void && units.includes(i.unit)), invoiceTotal))} icon={ReceiptText} tone="info" />
        <Stat label="Cash in today" value={rsShort(byMethod('Cash'))} icon={Wallet} tone="ok" />
        <Stat label="UPI today" value={rsShort(byMethod('UPI'))} icon={Smartphone} tone="ok" />
        <Stat label="Bank / cheque today" value={rsShort(byMethod('Bank transfer') + byMethod('Cheque'))} icon={Landmark} tone="ok" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-5">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'bills', label: 'Bills', count: bills.length }, { id: 'receipts', label: 'Receipts', count: receipts.length }]} />
        <div className="flex flex-1 flex-wrap justify-end gap-2">
          <div className="relative min-w-40 flex-1 sm:max-w-64">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input placeholder="Search name or bill no." value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
          {tab === 'receipts' && <Select value={method} onChange={(e) => setMethod(e.target.value)} options={['All', ...PAYMENT_METHODS, 'Credit note']} className="!w-32" />}
          <Select value={days} onChange={(e) => setDays(e.target.value)} options={[{ value: '1', label: 'Today' }, { value: '7', label: '7 days' }, { value: '30', label: '30 days' }]} className="!w-28" />
        </div>
      </div>
      <Card className="mt-3">
        {tab === 'bills' ? (
          <Table
            max={620}
            onRow={(r) => setView(r.no)}
            cols={[
              { key: 'no', label: 'Bill', render: (r) => <b>{r.no}</b> },
              { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
              { key: 'unit', label: 'Unit', render: (r) => <UnitTag unit={r.unit} short /> },
              { key: 'party', label: 'Customer', render: (r) => r.party.name },
              { key: 'total', label: 'Amount', right: true, render: (r) => <b>{rs(r.total)}</b> },
              { key: 'status', label: 'Status', render: (r) => (r.void ? <Badge tone="crit">Void</Badge> : r.partyId === 'C1' ? <Badge tone="ok">Paid</Badge> : <Badge tone={r.status === 'Delivered' ? 'mute' : 'info'}>{r.status}</Badge>) },
              { key: 'by', label: 'Entered by', className: 'max-sm:hidden' },
            ]}
            rows={bills.slice(0, 200)}
            foot={{ no: `${bills.length} bills`, total: rs(sum(bills.filter((b) => !b.void), (b) => b.total)) }}
          />
        ) : (
          <Table
            max={620}
            cols={[
              { key: 'id', label: 'Receipt', render: (r) => <b>{r.id}</b> },
              { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
              { key: 'unit', label: 'Unit', render: (r) => <UnitTag unit={r.party.unit} short /> },
              { key: 'party', label: 'From', render: (r) => r.party.name },
              { key: 'method', label: 'Method', render: (r) => <Badge tone={r.kind === 'credit' ? 'warn' : 'mute'}>{r.method}</Badge> },
              { key: 'amount', label: 'Amount', right: true, render: (r) => <b className="text-good-d">{rs(r.amount)}</b> },
              { key: 'alloc', label: 'Applied to', render: (r) => <span className="text-muted">{r.alloc?.length ? r.alloc.map((a) => a.no).join(', ') : 'Oldest first'}</span>, className: 'max-sm:hidden' },
              { key: 'by', label: 'Received by', className: 'max-sm:hidden' },
            ]}
            rows={receipts.slice(0, 200)}
            foot={{ id: `${receipts.length} receipts`, amount: rs(sum(receipts, (r) => r.amount)) }}
          />
        )}
      </Card>
      <InvoiceModal open={newBill} onClose={() => setNewBill(false)} onCreated={() => setShowLast(true)} />
      {showLast && data.lastInvoice && <InvoiceView no={data.lastInvoice} onClose={() => setShowLast(false)} />}
      {view && <InvoiceView no={view} onClose={() => setView(null)} />}
      <PaymentModal open={pay} onClose={() => setPay(false)} />
    </div>
  )
}
