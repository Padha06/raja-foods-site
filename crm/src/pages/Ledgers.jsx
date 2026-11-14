import { useMemo, useState } from 'react'
import { Search, ArrowLeft, HandCoins, FileMinus, Printer, Download, Share2, Plus, Phone, MapPin } from 'lucide-react'
import { useStore } from '../store.jsx'
import { UNITS, BRAND } from '../config.js'
import { partyLedger, partySummary, rs, num, today, addDays, fmtDate, fmtDateLong, downloadCSV, sum } from '../lib.js'
import { PageHeader, Card, CardHead, Tabs, Table, Badge, Button, Input, Segmented, UnitTag, cx } from '../components/ui.jsx'
import { AgingBar } from '../components/charts.jsx'
import { InvoiceModal, InvoiceView, PaymentModal } from '../components/Invoice.jsx'
import { go } from '../nav.js'

export default function Ledgers({ arg }) {
  const { data, units } = useStore()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('due')
  const all = useMemo(() => data.parties.filter((p) => p.type !== 'counter' && units.includes(p.unit)).map((p) => partySummary(data, p.id)), [data, units])
  const list = all
    .filter((s) => !q || `${s.party.name} ${s.party.district || ''} ${s.party.contact}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === 'due' ? b.outstanding - a.outstanding : sort === 'overdue' ? b.oldest - a.oldest : a.party.name.localeCompare(b.party.name)))
  const selected = arg && all.find((s) => s.party.id === arg)

  return (
    <div>
      <div className={cx(selected && 'max-lg:hidden')}>
        <PageHeader title="Buyer & hotel ledgers" sub="Balances are calculated from posted bills, receipts and credit notes, never typed over" />
      </div>
      <div className="grid gap-3 lg:grid-cols-[340px_1fr] lg:gap-5">
        <Card className={cx('flex flex-col lg:sticky lg:top-20 lg:max-h-[calc(100dvh-110px)]', selected && 'max-lg:hidden')}>
          <div className="space-y-2 border-b border-line p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input placeholder="Search buyer, hotel, district…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted">{list.length} accounts · {rs(sum(list, (s) => s.outstanding))}</span>
              <Segmented value={sort} onChange={setSort} options={[{ value: 'due', label: 'Due' }, { value: 'overdue', label: 'Oldest' }, { value: 'name', label: 'A–Z' }]} />
            </div>
          </div>
          <div className="flex-1 divide-y divide-line/70 overflow-y-auto">
            {list.map((s) => (
              <button key={s.party.id} onClick={() => go('ledgers', s.party.id)} className={cx('flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-page', arg === s.party.id && 'bg-brand-l/60')}>
                <span className="size-2 shrink-0 rounded-full" style={{ background: UNITS[s.party.unit].color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ink">{s.party.name}</span>
                  <span className="block truncate text-[11px] text-muted">{s.party.type === 'hotel' ? 'Hotel' : s.party.district || 'Local shop'} · {s.party.creditDays}d credit</span>
                </span>
                <span className="text-right">
                  <span className="block text-[13px] font-semibold tabular-nums">{rs(s.outstanding)}</span>
                  {s.overLimit && <Badge tone="crit">Over limit</Badge>}
                  {s.overdue > 0 ? <span className="block text-[10.5px] text-crit-d">{s.oldest}d overdue · {rs(s.overdue)}</span> : <span className="block text-[10.5px] text-muted">on time</span>}
                </span>
              </button>
            ))}
          </div>
        </Card>
        {selected ? <Detail s={selected} /> : (
          <Card className="hidden place-items-center p-10 text-center text-sm text-muted lg:grid">
            <div>
              <HandCoins className="mx-auto size-8 text-muted/60" />
              <p className="mt-2">Pick an account to see its statement, open bills and payment history.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function Detail({ s }) {
  const { data, user } = useStore()
  const p = s.party
  const [tab, setTab] = useState('statement')
  const [range, setRange] = useState(30)
  const [modal, setModal] = useState(null)
  const [view, setView] = useState(null)
  const [showLast, setShowLast] = useState(false)
  const ledger = useMemo(() => partyLedger(data, p.id), [data, p.id])
  const from = addDays(today(), -(range - 1))
  const before = ledger.filter((r) => r.date < from)
  const opening = before.length ? before.at(-1).balance : 0
  const rows = ledger.filter((r) => r.date >= from).map((r, i) => ({ ...r, key: i }))
  if (range < 999 && before.length) rows.unshift({ key: 'bf', date: from, kind: 'Brought forward', ref: '', debit: 0, credit: 0, balance: opening, bf: true })
  const canBill = user.modules === 'all' || user.modules.includes(p.unit) || user.modules.includes('billing')
  const reminder = `https://wa.me/${p.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Namaste ${p.contact} ji, ${UNITS[p.unit].full} statement: balance ${rs(s.outstanding)}${s.overdue > 0 ? `, of which ${rs(s.overdue)} is overdue` : ''}. Kindly arrange payment. Thank you.`)}`
  const csv = () => downloadCSV(`${p.name.replace(/\W+/g, '-')}-statement.csv`, [['Date', 'Entry', 'Ref', 'Debit', 'Credit', 'Balance'], ...rows.map((r) => [r.date, r.kind, r.ref, Math.round(r.debit), Math.round(r.credit), Math.round(r.balance)])])
  const sales = useMemo(() => {
    const m = {}
    for (const inv of data.invoices.filter((i) => i.partyId === p.id && !i.void && i.date >= from))
      for (const l of inv.lines) {
        const k = l.item
        m[k] = m[k] || { key: k, item: k, qty: 0, birds: 0, amount: 0, bills: new Set() }
        m[k].qty += l.qty
        m[k].birds += l.birds || 0
        m[k].amount += l.qty * l.rate
        m[k].bills.add(inv.no)
      }
    return Object.values(m)
  }, [data, p.id, from])

  return (
    <div className="min-w-0 space-y-3 sm:space-y-4">
      <button onClick={() => go('ledgers')} className="flex items-center gap-1 text-xs font-semibold text-muted lg:hidden"><ArrowLeft className="size-4" /> All accounts</button>
      <Card className="p-3 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <UnitTag unit={p.unit} />
            <h2 className="mt-1 font-display text-lg font-bold sm:text-2xl">{p.name}</h2>
            <p className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted sm:text-xs">
              <span className="flex items-center gap-1"><Phone className="size-3" />{p.contact} · {p.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="size-3" />{p.address}{p.district ? `, ${p.district}` : ''}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {canBill && <Button size="sm" variant="outline" icon={Plus} onClick={() => setModal('bill')}>Bill</Button>}
            <Button size="sm" variant="outline" icon={FileMinus} onClick={() => setModal('credit')}>Credit note</Button>
            <Button size="sm" icon={HandCoins} onClick={() => setModal('pay')}>Payment</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
          {[
            ['Balance', rs(s.outstanding), ''],
            ['Overdue', rs(s.overdue), s.overdue > 0 ? 'text-crit-d' : ''],
            ['Credit limit', rs(p.creditLimit), s.overLimit ? 'text-crit-d' : ''],
            ['Terms', `${p.creditDays} days`, ''],
          ].map(([l, v, c]) => (
            <div key={l} className="rounded-xl bg-page px-2 py-2 sm:px-3">
              <p className="text-[9.5px] text-muted sm:text-[11px]">{l}</p>
              <p className={cx('font-display text-[13px] font-bold tabular-nums sm:text-lg', c)}>{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <AgingBar buckets={s.aging} />
        </div>
        {s.unallocated > 0.5 && <p className="mt-2 text-[11px] text-muted">Includes {rs(s.unallocated)} received but not yet applied to a bill.</p>}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'statement', label: 'Statement' }, { id: 'open', label: 'Open bills', count: s.open.length }, { id: 'history', label: 'What they buy' }]} />
        <Segmented value={range} onChange={setRange} options={[{ value: 7, label: '7d' }, { value: 30, label: '30d' }, { value: 999, label: 'All' }]} />
      </div>

      {tab === 'statement' && (
        <Card>
          <div className="print-area">
            <div className="hidden print:block">
              <p className="font-display text-xl font-bold">{UNITS[p.unit].full}: Statement of account</p>
              <p className="text-sm">{p.name} · {range < 999 ? `${fmtDateLong(from)} – ` : 'Up to '}{fmtDateLong(today())} · {BRAND.phone}</p>
            </div>
            <Table
              max={560}
              onRow={(r) => r.inv && setView(r.inv.no)}
              cols={[
                { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
                { key: 'kind', label: 'Entry', render: (r) => <span className={cx(r.bf && 'font-semibold', r.credit > 0 && 'text-good-d')}>{r.kind}</span> },
                { key: 'ref', label: 'Ref', render: (r) => <span className="text-muted">{r.ref}</span> },
                { key: 'debit', label: 'Debit', right: true, render: (r) => (r.debit ? rs(r.debit) : '') },
                { key: 'credit', label: 'Credit', right: true, render: (r) => (r.credit ? <span className="text-good-d">{rs(r.credit)}</span> : '') },
                { key: 'balance', label: 'Balance', right: true, render: (r) => <b>{rs(r.balance)}</b> },
              ]}
              rows={rows}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-line p-3">
            <a href={reminder} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" icon={Share2}>WhatsApp reminder</Button></a>
            <Button size="sm" variant="outline" icon={Download} onClick={csv}>CSV</Button>
            <Button size="sm" variant="outline" icon={Printer} onClick={() => window.print()}>Print / PDF</Button>
          </div>
        </Card>
      )}
      {tab === 'open' && (
        <Card>
          <Table
            onRow={(r) => r.inv && setView(r.no)}
            cols={[
              { key: 'no', label: 'Bill', render: (r) => <b>{r.no === 'OB' ? 'Opening balance' : r.no}</b> },
              { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
              { key: 'total', label: 'Bill amount', right: true, render: (r) => rs(r.total) },
              { key: 'due', label: 'Still due', right: true, render: (r) => <b>{rs(r.due)}</b> },
              { key: 'age', label: 'Overdue by', right: true, render: (r) => (r.age > 0 ? <Badge tone={r.age > 30 ? 'crit' : 'warn'}>{r.age} days</Badge> : <Badge tone="ok">Not due</Badge>) },
            ]}
            rows={s.open.map((o) => ({ ...o, key: o.no }))}
            empty="All bills are paid"
          />
        </Card>
      )}
      {tab === 'history' && (
        <Card>
          <Table
            cols={[
              { key: 'item', label: 'Item', render: (r) => <b>{r.item}</b> },
              { key: 'bills', label: 'Bills', right: true, render: (r) => r.bills.size },
              ...(p.unit !== 'retail' ? [{ key: 'birds', label: 'Birds', right: true, render: (r) => num(r.birds) }] : []),
              { key: 'qty', label: 'Kg', right: true, render: (r) => num(r.qty, 1) },
              { key: 'avg', label: 'Avg rate', right: true, render: (r) => rs(r.amount / r.qty) },
              { key: 'amount', label: 'Amount', right: true, render: (r) => <b>{rs(r.amount)}</b> },
            ]}
            rows={sales}
          />
        </Card>
      )}

      <PaymentModal open={modal === 'pay' || modal === 'credit'} kind={modal === 'credit' ? 'credit' : 'receipt'} partyId={p.id} onClose={() => setModal(null)} />
      <InvoiceModal open={modal === 'bill'} unit={p.unit} partyId={p.id} onClose={() => setModal(null)} onCreated={() => setShowLast(true)} />
      {showLast && data.lastInvoice && <InvoiceView no={data.lastInvoice} onClose={() => setShowLast(false)} />}
      {view && <InvoiceView no={view} onClose={() => setView(null)} />}
    </div>
  )
}
