import { useMemo, useState } from 'react'
import { Plus, Paperclip, Wallet, Banknote, ArrowDownLeft, ArrowUpRight, Download } from 'lucide-react'
import { useStore } from '../store.jsx'
import { UNITS, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../config.js'
import { rs, rsShort, today, addDays, fmtDate, sum, downloadCSV } from '../lib.js'
import { PageHeader, Card, CardHead, Stat, Tabs, Table, Badge, Button, Modal, Field, Input, Select, Progress, UnitTag, Segmented } from '../components/ui.jsx'

export default function Expenses() {
  const { data, units, user } = useStore()
  const [tab, setTab] = useState('list')
  const [days, setDays] = useState(30)
  const [add, setAdd] = useState(false)
  const from = addDays(today(), -(days - 1))
  const seesAdmin = user.modules === 'all'
  const list = data.expenses.filter((e) => e.date >= from && (units.includes(e.unit) || (e.unit === 'admin' && seesAdmin && units.length > 1)))
  const total = sum(list, (e) => e.amount)
  const byCat = useMemo(() => {
    const m = {}
    for (const e of list) {
      const k = `${e.unit}|${e.category}`
      m[k] = m[k] || { key: k, unit: e.unit, category: e.category, amount: 0, n: 0 }
      m[k].amount += e.amount
      m[k].n++
    }
    return Object.values(m).sort((a, b) => b.amount - a.amount)
  }, [list])
  const byUnit = (u) => sum(list.filter((e) => e.unit === u), (e) => e.amount)

  return (
    <div>
      <PageHeader
        title="Expenses & cash"
        sub="Every entry has a unit, category, payee, method and optional receipt"
        actions={
          <>
            <Button variant="outline" icon={Download} className="max-sm:hidden" onClick={() => downloadCSV('expenses.csv', [['Date', 'Unit', 'Category', 'Payee', 'Amount', 'Method', 'Note', 'Entered by'], ...list.map((e) => [e.date, e.unit, e.category, e.payee, e.amount, e.method, e.note, e.by])])}>CSV</Button>
            <Button icon={Plus} onClick={() => setAdd(true)}>Add expense</Button>
          </>
        }
      />
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Stat label={`Total · ${days === 1 ? 'today' : `${days} days`}`} value={rsShort(total)} icon={Wallet} sub={`${list.length} entries`} />
        {['farm', 'district', 'local', 'retail'].filter((u) => units.includes(u)).slice(0, 3).map((u) => (
          <Stat key={u} label={UNITS[u].name} value={rsShort(byUnit(u))} sub={<Progress value={byUnit(u)} max={total} color={UNITS[u].color} className="mt-1" />} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 sm:mt-5">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'list', label: 'Entries' }, { id: 'cat', label: 'By category' }, { id: 'cash', label: 'Daily cash' }]} />
        <Segmented value={days} onChange={setDays} options={[{ value: 1, label: 'Today' }, { value: 7, label: '7d' }, { value: 30, label: '30d' }]} />
      </div>
      <div className="mt-3">
        {tab === 'list' && (
          <Card>
            <Table
              max={600}
              cols={[
                { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
                { key: 'unit', label: 'Unit', render: (r) => <UnitTag unit={r.unit} short /> },
                { key: 'category', label: 'Category', render: (r) => <b>{r.category}</b> },
                { key: 'payee', label: 'Payee' },
                { key: 'note', label: 'Note', render: (r) => <span className="text-muted">{r.note}</span>, className: 'max-sm:hidden' },
                { key: 'method', label: 'Paid by', render: (r) => <Badge>{r.method}</Badge> },
                { key: 'receipt', label: 'Bill', render: (r) => (r.receipt ? <Paperclip className="size-3.5 text-good-d" /> : <span className="text-muted">–</span>) },
                { key: 'amount', label: 'Amount', right: true, render: (r) => <b>{rs(r.amount)}</b> },
              ]}
              rows={list.slice(0, 250).map((e) => ({ ...e, key: e.id }))}
              foot={{ date: 'Total', amount: rs(total) }}
            />
          </Card>
        )}
        {tab === 'cat' && (
          <Card>
            <CardHead title="Where the money went" sub={rs(total)} />
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-3 py-4 sm:px-5 lg:grid-cols-3">
              {byCat.map((c) => (
                <div key={c.key}>
                  <div className="flex items-center justify-between gap-2 text-[11.5px] sm:text-[13px]">
                    <span className="min-w-0 truncate"><span className="font-semibold">{c.category}</span> <span className="text-muted">· {UNITS[c.unit]?.short || 'Admin'}</span></span>
                    <span className="font-semibold tabular-nums">{rs(c.amount)}</span>
                  </div>
                  <Progress value={c.amount} max={byCat[0].amount} color={UNITS[c.unit]?.color || '#898781'} className="mt-1" />
                </div>
              ))}
            </div>
          </Card>
        )}
        {tab === 'cash' && <CashBook days={days} />}
      </div>
      <AddExpense open={add} onClose={() => setAdd(false)} />
    </div>
  )
}

// Cash sales and cash collections in, cash expenses out, per day → expected cash in hand
function CashBook({ days }) {
  const { data, units } = useStore()
  const pmap = Object.fromEntries(data.parties.map((p) => [p.id, p]))
  const rows = []
  for (let k = 0; k < Math.max(days, 7); k++) {
    const d = addDays(today(), -k)
    const cashPays = data.payments.filter((p) => p.date === d && p.method === 'Cash' && units.includes(pmap[p.partyId].unit))
    const counter = sum(cashPays.filter((p) => p.partyId === 'C1'), (p) => p.amount)
    const coll = sum(cashPays.filter((p) => p.partyId !== 'C1'), (p) => p.amount)
    const out = sum(data.expenses.filter((e) => e.date === d && e.method === 'Cash' && units.includes(e.unit)), (e) => e.amount)
    rows.push({ key: d, date: d, counter, coll, out, net: counter + coll - out })
  }
  return (
    <Card>
      <CardHead title="Daily cash summary" sub="Daily inflows less expenses. Opening cash and bank transfers are not included in this movement report." />
      <div className="mt-2">
        <Table
          cols={[
            { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
            { key: 'counter', label: 'Cash sales', right: true, render: (r) => <span className="inline-flex items-center gap-1 text-good-d"><ArrowDownLeft className="size-3" />{rs(r.counter)}</span> },
            { key: 'coll', label: 'Cash collections', right: true, render: (r) => <span className="text-good-d">{rs(r.coll)}</span> },
            { key: 'out', label: 'Cash expenses', right: true, render: (r) => <span className="inline-flex items-center gap-1 text-crit-d"><ArrowUpRight className="size-3" />{rs(r.out)}</span> },
            { key: 'net', label: 'Net cash movement', right: true, render: (r) => <b className="inline-flex items-center gap-1"><Banknote className="size-3.5 text-muted" />{rs(r.net)}</b> },
          ]}
          rows={rows}
        />
      </div>
    </Card>
  )
}

function AddExpense({ open, onClose }) {
  const { user, dispatch } = useStore()
  const unitOpts = [...user.units, ...(user.modules === 'all' ? ['admin'] : [])]
  const [f, setF] = useState({ unit: unitOpts[0], category: EXPENSE_CATEGORIES[unitOpts[0]][0], payee: '', amount: '', method: 'Cash', note: '', receipt: false, date: today() })
  const submit = (e) => {
    e.preventDefault()
    dispatch('expense', { ...f, amount: +f.amount }, `Expense ${rs(+f.amount)} saved`)
    setF({ ...f, payee: '', amount: '', note: '', receipt: false })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Add expense">
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Unit"><Select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value, category: EXPENSE_CATEGORIES[e.target.value][0] })} options={unitOpts.map((u) => ({ value: u, label: UNITS[u]?.name || 'General / admin' }))} /></Field>
        <Field label="Category"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} options={EXPENSE_CATEGORIES[f.unit]} /></Field>
        <Field label="Amount (₹)"><Input type="number" min="1" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="Date"><Input type="date" max={today()} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Paid to"><Input required value={f.payee} onChange={(e) => setF({ ...f, payee: e.target.value })} /></Field>
        <Field label="Paid by"><Select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} options={PAYMENT_METHODS} /></Field>
        <Field label="Note" className="col-span-2"><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Optional" /></Field>
        <label className="col-span-2 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-3 py-3 text-xs text-muted hover:border-brand">
          <Paperclip className="size-4" />
          <span className="flex-1">{f.receipt ? 'Receipt attached ✓' : 'Attach bill photo (stored privately)'}</span>
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setF({ ...f, receipt: !!e.target.files?.length })} />
        </label>
        <Button className="col-span-2">Save expense</Button>
      </form>
    </Modal>
  )
}
