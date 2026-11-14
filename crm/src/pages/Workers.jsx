import { useMemo, useState } from 'react'
import { Plus, Users, UserCheck, UserX, HandCoins, Lock, Phone } from 'lucide-react'
import { useStore } from '../store.jsx'
import { UNITS } from '../config.js'
import { rs, rsShort, today, addDays, fmtDate, fmtDateLong, sum } from '../lib.js'
import { PageHeader, Card, CardHead, Stat, Tabs, Table, Badge, Button, Modal, Field, Input, Select, UnitTag, cx } from '../components/ui.jsx'

const MARK = { P: { label: 'P', cls: 'bg-good-l text-good-d' }, A: { label: 'A', cls: 'bg-crit-l text-crit-d' }, L: { label: 'L', cls: 'bg-warn-l text-warn-d' } }
const CYCLE = { undefined: 'P', P: 'A', A: 'L', L: 'P' }

export default function Workers() {
  const { data, units, user } = useStore()
  const [tab, setTab] = useState('attendance')
  const [add, setAdd] = useState(false)
  const [payFor, setPayFor] = useState(null)
  const workers = data.workers.filter((w) => units.includes(w.unit))
  const t = today()
  const marks = data.attendance[t] || {}
  const present = workers.filter((w) => marks[w.id] === 'P').length
  // salary details are owner-only (brief §10)
  const seesPay = user.id === 'owner'

  return (
    <div>
      <PageHeader
        title="Workers"
        sub="Attendance, salary, advances and repayments. Salary details are visible to the owner only."
        actions={seesPay && <Button icon={Plus} onClick={() => setAdd(true)}>Add worker</Button>}
      />
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Stat label="Workers" value={workers.length} icon={Users} sub={`${new Set(workers.map((w) => w.unit)).size} units`} />
        <Stat label="Present today" value={present} icon={UserCheck} tone="ok" sub={`${workers.length - Object.keys(marks).filter((k) => workers.some((w) => w.id === k)).length} not marked yet`} />
        <Stat label="Absent / leave" value={workers.filter((w) => marks[w.id] === 'A' || marks[w.id] === 'L').length} icon={UserX} tone="warn" />
        {seesPay ? (
          <Stat label="Advances outstanding" value={rsShort(sum(workers, (w) => balanceOf(data, w.id).advance))} icon={HandCoins} />
        ) : (
          <Stat label="Salary data" value="Owner only" icon={Lock} />
        )}
      </div>
      <Tabs className="mt-3 sm:mt-5" value={tab} onChange={setTab} tabs={[{ id: 'attendance', label: 'Attendance' }, ...(seesPay ? [{ id: 'pay', label: 'Salary & advances' }] : []), { id: 'list', label: 'Directory' }]} />
      <div className="mt-3">
        {tab === 'attendance' && <Attendance workers={workers} />}
        {tab === 'pay' && seesPay && <Pay workers={workers} onPay={setPayFor} />}
        {tab === 'list' && (
          <Card>
            <Table
              cols={[
                { key: 'name', label: 'Name', render: (r) => <b>{r.name}</b> },
                { key: 'role', label: 'Role' },
                { key: 'unit', label: 'Unit', render: (r) => <UnitTag unit={r.unit} /> },
                { key: 'phone', label: 'Phone', render: (r) => <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1 text-brand"><Phone className="size-3" />{r.phone}</a> },
                { key: 'address', label: 'Address' },
                { key: 'joined', label: 'Joined', render: (r) => fmtDateLong(r.joined) },
                { key: 'active', label: 'Status', render: (r) => <Badge tone={r.active ? 'ok' : 'mute'}>{r.active ? 'Active' : 'Inactive'}</Badge> },
              ]}
              rows={workers.map((w) => ({ ...w, key: w.id }))}
            />
          </Card>
        )}
      </div>
      <AddWorker open={add} onClose={() => setAdd(false)} />
      {payFor && <PayModal worker={payFor} onClose={() => setPayFor(null)} />}
    </div>
  )
}

function Attendance({ workers }) {
  const { data, dispatch } = useStore()
  const dates = Array.from({ length: 14 }, (_, k) => addDays(today(), -13 + k))
  return (
    <Card>
      <CardHead title="Attendance · last 14 days" sub="Tap today's cell to mark Present → Absent → Leave" />
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-[11px] sm:text-[13px]">
          <thead>
            <tr className="border-b border-line text-[9.5px] uppercase tracking-wide text-muted sm:text-[10.5px]">
              <th className="sticky left-0 z-[1] bg-surface px-3 py-2 text-left sm:px-5">Worker</th>
              {dates.map((d) => (
                <th key={d} className={cx('px-0.5 py-2 text-center font-semibold', d === today() && 'text-brand')}>
                  {new Date(`${d}T00:00:00`).getDate()}
                </th>
              ))}
              <th className="px-3 py-2 text-right sm:px-5">Days</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => {
              const p = dates.filter((d) => data.attendance[d]?.[w.id] === 'P').length
              return (
                <tr key={w.id} className="border-b border-line/60">
                  <td className="sticky left-0 z-[1] whitespace-nowrap bg-surface px-3 py-1.5 sm:px-5">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full" style={{ background: UNITS[w.unit].color }} />
                      <span className="font-semibold">{w.name}</span>
                    </span>
                    <span className="block pl-3 text-[10px] text-muted sm:text-[11px]">{w.role}</span>
                  </td>
                  {dates.map((d) => {
                    const m = data.attendance[d]?.[w.id]
                    const isToday = d === today()
                    return (
                      <td key={d} className="px-0.5 py-1.5 text-center">
                        <button
                          disabled={!isToday}
                          onClick={() => dispatch('attendance', { date: d, workerId: w.id, status: CYCLE[m] })}
                          className={cx('grid size-5 place-items-center rounded-md text-[9.5px] font-bold sm:size-7 sm:text-[11px]', m ? MARK[m].cls : 'border border-dashed border-line text-muted', isToday && 'ring-1 ring-brand/30 hover:ring-brand')}
                        >
                          {m ? MARK[m].label : isToday ? '+' : ''}
                        </button>
                      </td>
                    )
                  })}
                  <td className="px-3 py-1.5 text-right font-semibold tabular-nums sm:px-5">{p}/14</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function balanceOf(data, workerId) {
  const list = data.wpay.filter((p) => p.workerId === workerId)
  const advance = sum(list.filter((p) => p.type === 'advance'), (p) => p.amount) - sum(list.filter((p) => p.type === 'repayment'), (p) => p.amount)
  return { advance, list }
}

function Pay({ workers, onPay }) {
  const { data } = useStore()
  const monthStart = today().slice(0, 8) + '01'
  const rows = useMemo(
    () =>
      workers.map((w) => {
        const { advance, list } = balanceOf(data, w.id)
        const dates = Object.keys(data.attendance).filter((d) => d >= monthStart)
        const present = dates.filter((d) => data.attendance[d][w.id] === 'P').length
        const absent = dates.filter((d) => data.attendance[d][w.id] === 'A').length
        const deduction = Math.round((w.salary / 30) * absent)
        const paidThisMonth = sum(list.filter((p) => p.type === 'salary' && p.date >= monthStart), (p) => p.amount)
        return { key: w.id, w, present, absent, deduction, advance, payable: w.salary - deduction - paidThisMonth }
      }),
    [workers, data, monthStart],
  )
  return (
    <Card>
      <CardHead title="This month's salary" sub="Monthly salary − absent-day deduction − already paid. Advances are shown separately." />
      <div className="mt-2">
        <Table
          cols={[
            { key: 'name', label: 'Worker', render: (r) => <b>{r.w.name}</b> },
            { key: 'unit', label: 'Unit', render: (r) => <UnitTag unit={r.w.unit} short /> },
            { key: 'salary', label: 'Salary', right: true, render: (r) => rs(r.w.salary) },
            { key: 'present', label: 'Present', right: true },
            { key: 'absent', label: 'Absent', right: true },
            { key: 'deduction', label: 'Deduction', right: true, render: (r) => (r.deduction ? <span className="text-crit-d">−{rs(r.deduction)}</span> : '–') },
            { key: 'advance', label: 'Advance due', right: true, render: (r) => (r.advance > 0 ? <Badge tone="warn">{rs(r.advance)}</Badge> : '–') },
            { key: 'payable', label: 'Payable', right: true, render: (r) => <b>{rs(r.payable)}</b> },
            { key: 'act', label: '', render: (r) => <Button size="sm" variant="outline" onClick={() => onPay(r.w)}>Pay / advance</Button> },
          ]}
          rows={rows}
          foot={{ name: 'Total', salary: rs(sum(rows, (r) => r.w.salary)), payable: rs(sum(rows, (r) => r.payable)), advance: rs(sum(rows, (r) => Math.max(0, r.advance))) }}
        />
      </div>
    </Card>
  )
}

function PayModal({ worker, onClose }) {
  const { data, dispatch } = useStore()
  const { advance, list } = balanceOf(data, worker.id)
  const [f, setF] = useState({ type: 'salary', amount: String(worker.salary), note: '' })
  return (
    <Modal open onClose={onClose} title={worker.name} sub={`${worker.role} · salary ${rs(worker.salary)} · advance due ${rs(advance)}`}>
      <form
        className="grid grid-cols-2 gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          dispatch('wpay', { workerId: worker.id, type: f.type, amount: +f.amount, note: f.note }, 'Saved')
          onClose()
        }}
      >
        <Field label="Type"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} options={[{ value: 'salary', label: 'Salary payment' }, { value: 'advance', label: 'Give advance' }, { value: 'repayment', label: 'Advance repayment' }]} /></Field>
        <Field label="Amount (₹)"><Input type="number" min="1" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label="Note" className="col-span-2"><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        <Button className="col-span-2">Save</Button>
      </form>
      <p className="mb-1 mt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">History</p>
      <div className="divide-y divide-line/70 text-[12px]">
        {list.slice().reverse().map((p) => (
          <div key={p.id} className="flex justify-between py-1.5">
            <span>{fmtDate(p.date)} · {p.type} {p.note && <span className="text-muted">· {p.note}</span>}</span>
            <b className={p.type === 'advance' ? 'text-warn-d' : ''}>{rs(p.amount)}</b>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function AddWorker({ open, onClose }) {
  const { dispatch } = useStore()
  const [f, setF] = useState({ name: '', role: '', unit: 'farm', phone: '', salary: '', address: '', joined: today(), active: true })
  return (
    <Modal open={open} onClose={onClose} title="Add worker">
      <form
        className="grid grid-cols-2 gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          dispatch('worker', { ...f, salary: +f.salary }, `${f.name} added`)
          setF({ name: '', role: '', unit: 'farm', phone: '', salary: '', address: '', joined: today(), active: true })
          onClose()
        }}
      >
        <Field label="Name" className="col-span-2"><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Role"><Input required value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="e.g. Shed worker" /></Field>
        <Field label="Unit"><Select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} options={Object.values(UNITS).map((u) => ({ value: u.id, label: u.name }))} /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Address" className="col-span-2"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <Field label="Joining date"><Input type="date" required max={today()} value={f.joined} onChange={(e) => setF({ ...f, joined: e.target.value })} /></Field>
        <Field label="Status"><Select value={String(f.active)} onChange={(e) => setF({ ...f, active: e.target.value === 'true' })} options={[{value:'true',label:'Active'},{value:'false',label:'Inactive'}]} /></Field>
        <Field label="Monthly salary (₹)"><Input type="number" min="0" required value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} /></Field>
        <Button className="col-span-2">Add worker</Button>
      </form>
    </Modal>
  )
}
