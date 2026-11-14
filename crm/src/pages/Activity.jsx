import { useState } from 'react'
import { Check, Minus, Flag, ShieldCheck, DatabaseBackup, KeyRound, FileLock2 } from 'lucide-react'
import { useStore } from '../store.jsx'
import { ROLES, UNITS } from '../config.js'
import { fmtDate, fmtTime, iso } from '../lib.js'
import { PageHeader, Card, CardHead, Tabs, Table, Badge, UnitTag, Segmented } from '../components/ui.jsx'

const MODULES = [
  ['dashboard', 'Dashboard'], ['farm', 'Farm'], ['district', 'District'], ['local', 'Local'], ['retail', 'Broilers'],
  ['billing', 'Bills'], ['ledgers', 'Ledgers'], ['expenses', 'Expenses'], ['workers', 'Workers'], ['reports', 'Reports'],
]

export default function Activity() {
  const { data, units, user } = useStore()
  const [tab, setTab] = useState('log')
  const [only, setOnly] = useState('all')
  const rows = data.audit.filter((a) => units.includes(a.unit) && (only === 'all' || a.flag)).map((a) => ({ ...a, key: a.id }))
  return (
    <div>
      <PageHeader title="Activity & audit" sub="Who created, edited or voided what, and when. Corrections need a reason." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'log', label: 'Audit log', count: rows.length }, ...(user.id === 'owner' ? [{ id: 'access', label: 'Roles & access' }, { id: 'safety', label: 'Data safety' }] : [])]} />
      <div className="mt-3">
        {tab === 'log' && (
          <Card>
            <CardHead title="Every important change" right={<Segmented value={only} onChange={setOnly} options={[{ value: 'all', label: 'All' }, { value: 'flag', label: 'Flagged' }]} />} />
            <div className="mt-2">
              <Table
                max={640}
                cols={[
                  { key: 'when', label: 'When', render: (r) => <span className="text-muted">{fmtDate(iso(new Date(r.at)))} · {fmtTime(r.at)}</span> },
                  { key: 'who', label: 'User', render: (r) => <span><b>{r.who}</b> <span className="text-muted max-sm:hidden">· {r.role}</span></span> },
                  { key: 'unit', label: 'Unit', render: (r) => <UnitTag unit={r.unit} short /> },
                  { key: 'action', label: 'Action', render: (r) => <span className="font-semibold">{r.action} {r.flag && <Badge tone="warn" icon={Flag}>Review</Badge>}</span> },
                  { key: 'detail', label: 'Detail', render: (r) => <span className="text-ink-2">{r.detail}</span> },
                ]}
                rows={rows}
              />
            </div>
          </Card>
        )}
        {tab === 'access' && (
          <Card>
            <CardHead title="What each role can open" sub="Demo role visibility. Production server and database permissions are not connected yet." />
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-[11px] sm:text-[13px]">
                <thead>
                  <tr className="border-b border-line text-[9.5px] uppercase tracking-wide text-muted sm:text-[10.5px]">
                    <th className="px-3 py-2 text-left sm:px-5">Role</th>
                    <th className="px-2 py-2 text-left">Units</th>
                    {MODULES.map(([, l]) => <th key={l} className="px-1.5 py-2 text-center">{l}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(ROLES).map((r) => (
                    <tr key={r.id} className="border-b border-line/60">
                      <td className="whitespace-nowrap px-3 py-2 sm:px-5"><b>{r.label}</b><span className="block text-[10.5px] text-muted">{r.person}</span></td>
                      <td className="px-2 py-2"><span className="flex gap-1">{r.units.map((u) => <span key={u} title={UNITS[u].name} className="size-2 rounded-full" style={{ background: UNITS[u].color }} />)}</span></td>
                      {MODULES.map(([m]) => {
                        const ok = r.modules === 'all' || r.modules.includes(m)
                        return <td key={m} className="px-1.5 py-2 text-center">{ok ? <Check className="mx-auto size-4 text-good" /> : <Minus className="mx-auto size-3.5 text-line" />}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line px-3 py-2.5 text-[11px] text-muted sm:px-5 sm:text-xs">Optional: a route manager can be limited to their assigned routes, and the cashier to bills and receipts only.</p>
          </Card>
        )}
        {tab === 'safety' && (
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {[
              [ShieldCheck, 'Secure sign-in', 'Demo role selection is not secure authentication. Production sign-in must be configured before entering real records.'],
              [DatabaseBackup, 'Daily backups', 'This demo saves to this browser. Scheduled database backups and a documented restore test are required before launch.'],
              [KeyRound, 'Raja Foods owns everything', 'Domain, hosting, database and source ownership must be confirmed and handed over to Raja Foods before launch.'],
              [FileLock2, 'Private documents', 'Private file storage and role-restricted downloads must be connected before real documents are uploaded.'],
            ].map(([Icon, t, d]) => (
              <Card key={t} className="p-3 sm:p-5">
                <Icon className="size-5 text-brand sm:size-6" />
                <p className="mt-2 font-display text-[13px] font-bold sm:text-base">{t}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted sm:text-[13px]">{d}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
