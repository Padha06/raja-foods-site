import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  LayoutDashboard, Bird, Truck, Route, Store, ReceiptText, BookOpenText, Wallet, Users, FileBarChart, Bell, ShieldCheck,
  LogOut, RotateCcw, Menu, ChevronDown, CircleAlert, TriangleAlert, Info, Check,
} from 'lucide-react'
import { useStore } from '../store.jsx'
import { useAlerts } from '../alerts.js'
import { BRAND, ROLES, UNITS } from '../config.js'
import { go } from '../nav.js'
import { cx } from './ui.jsx'

export const NAV = [
  { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    group: 'Operating units',
    items: [
      { id: 'farm', label: 'Farm', icon: Bird, unit: 'farm' },
      { id: 'district', label: 'District Wholesale', icon: Truck, unit: 'district' },
      { id: 'local', label: 'Local Distribution', icon: Route, unit: 'local' },
      { id: 'retail', label: 'Raja Broilers', icon: Store, unit: 'retail' },
    ],
  },
  {
    group: 'Money',
    items: [
      { id: 'billing', label: 'Bills & Receipts', icon: ReceiptText },
      { id: 'ledgers', label: 'Buyer & Hotel Ledgers', icon: BookOpenText },
      { id: 'expenses', label: 'Expenses & Cash', icon: Wallet },
    ],
  },
  {
    group: 'People & reports',
    items: [
      { id: 'products', label: 'Products', icon: Store },
      { id: 'workers', label: 'Workers', icon: Users },
      { id: 'reports', label: 'Reports', icon: FileBarChart },
      { id: 'activity', label: 'Activity & Audit', icon: ShieldCheck },
    ],
  },
]
const ALL = NAV.flatMap((g) => g.items)

export function Logo({ dark }) {
  return (
    <div className="flex items-center gap-2">
      <img src={BRAND.logo} alt="Raja Broilers logo" width="64" height="64" className="size-10 shrink-0 rounded-lg object-contain sm:size-12" />
      <div className="leading-none">
        <p className={cx('font-display text-[15px] font-bold sm:text-base', dark ? 'text-white' : 'text-ink')}>{BRAND.name}</p>
        <p className={cx('mt-0.5 text-[9.5px] font-medium uppercase tracking-wider sm:text-[10px]', dark ? 'text-white/45' : 'text-muted')}>Business Manager</p>
      </div>
    </div>
  )
}

export default function Shell({ page, children }) {
  const { can, user, storageError } = useStore()
  const [more, setMore] = useState(false)
  const items = ALL.filter((i) => can(i.id))
  const bottom = items.slice(0, 4)

  return (
    <div className="min-h-dvh">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-night lg:flex">
        <div className="px-5 pb-4 pt-5">
          <Logo dark />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map((g) => {
            const vis = g.items.filter((i) => can(i.id))
            if (!vis.length) return null
            return (
              <div key={g.group} className="mt-4 first:mt-1">
                <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">{g.group}</p>
                {vis.map((i) => (
                  <NavLink key={i.id} item={i} active={page === i.id} />
                ))}
              </div>
            )
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="rounded-xl bg-white/[0.06] p-3 text-[11px] leading-relaxed text-white/55">
            <span className="font-semibold text-gold">Demo mode.</span> Records you add are saved in this browser so you can try every flow.
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        <TopBar page={page} />
        {storageError && <div role="alert" className="bg-crit-l p-3 text-crit-d">Changes could not be saved in this browser. Keep this page open and free browser storage before continuing.</div>}
        <main className="mx-auto max-w-[1400px] px-3 pb-24 pt-3 sm:px-6 sm:pt-5 lg:px-8 lg:pb-12">{children}</main>
      </div>

      {/* phone & tablet bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl">
          {bottom.map((i) => (
            <BottomItem key={i.id} icon={i.icon} label={short(i.label)} active={page === i.id} onClick={() => go(i.id)} />
          ))}
          {items.length > 4 && <BottomItem icon={Menu} label="More" active={!bottom.some((b) => b.id === page)} onClick={() => setMore(true)} />}
        </div>
      </nav>
      <AnimatePresence>
        {more && (
          <motion.div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMore(false)}>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ type: 'spring', bounce: 0.1, duration: 0.3 }} className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-surface p-3 pb-[max(1rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/15" />
              <p className="mb-2 px-1 text-[11px] text-muted">Signed in as <b className="text-ink">{user.person}</b> · {user.label}</p>
              <div className="grid grid-cols-3 gap-2">
                {items.map((i) => (
                  <button key={i.id} onClick={() => { go(i.id); setMore(false) }} className={cx('flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center text-[11px] font-semibold', page === i.id ? 'border-brand bg-brand-l text-brand' : 'border-line text-ink-2')}>
                    <i.icon className="size-5" />
                    {i.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toasts />
    </div>
  )
}

const short = (l) => ({ 'District Wholesale': 'District', 'Local Distribution': 'Local', 'Raja Broilers': 'Broilers', 'Bills & Receipts': 'Bills', 'Buyer & Hotel Ledgers': 'Ledgers', 'Expenses & Cash': 'Expenses', 'Activity & Audit': 'Activity' })[l] || l

function NavLink({ item, active }) {
  const { icon: Icon } = item
  return (
    <a href={`#/${item.id}`} className={cx('group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition', active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white')}>
      {active && <motion.span layoutId="nav-active" className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-gold" />}
      <Icon className="size-4" />
      <span className="flex-1">{item.label}</span>
      {item.unit && <span className="size-1.5 rounded-full" style={{ background: UNITS[item.unit].color }} />}
    </a>
  )
}

function BottomItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={cx('flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold', active ? 'text-brand' : 'text-muted')}>
      <Icon className="size-5" strokeWidth={active ? 2.4 : 1.9} />
      {label}
    </button>
  )
}

function TopBar({ page }) {
  const { user, unitFilter, setUnitFilter } = useStore()
  const label = ALL.find((i) => i.id === page)?.label
  const showFilter = user.units.length > 1 && ['dashboard', 'billing', 'ledgers', 'expenses', 'workers', 'activity', 'reports'].includes(page)
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-[1400px] items-center gap-2 px-3 sm:h-14 sm:px-6 lg:px-8">
        <div className="lg:hidden">
          <Logo />
        </div>
        <p className="hidden font-display text-sm font-semibold text-muted lg:block">{label}</p>
        <div className="flex-1" />
        {showFilter && (
          <div className="hidden items-center gap-1 rounded-xl border border-line bg-surface p-1 md:flex">
            <FilterChip active={unitFilter === 'all'} onClick={() => setUnitFilter('all')}>All units</FilterChip>
            {user.units.map((u) => (
              <FilterChip key={u} active={unitFilter === u} onClick={() => setUnitFilter(u)} color={UNITS[u].color}>
                {UNITS[u].short}
              </FilterChip>
            ))}
          </div>
        )}
        <Alerts />
        <UserMenu />
      </div>
      {showFilter && (
        <div className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
          <FilterChip active={unitFilter === 'all'} onClick={() => setUnitFilter('all')}>All units</FilterChip>
          {user.units.map((u) => (
            <FilterChip key={u} active={unitFilter === u} onClick={() => setUnitFilter(u)} color={UNITS[u].color}>
              {UNITS[u].short}
            </FilterChip>
          ))}
        </div>
      )}
    </header>
  )
}

function FilterChip({ active, onClick, color, children }) {
  return (
    <button onClick={onClick} className={cx('flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition sm:text-xs', active ? 'bg-ink text-white' : 'bg-surface text-ink-2 hover:bg-page max-md:border max-md:border-line')}>
      {color && <span className="size-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}

function usePop() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const f = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', f)
    return () => document.removeEventListener('mousedown', f)
  }, [open])
  return [open, setOpen, ref]
}

const ALERT_ICON = { crit: CircleAlert, warn: TriangleAlert, info: Info }
const ALERT_TONE = { crit: 'text-crit', warn: 'text-warn-d', info: 'text-sky-d' }

function Alerts() {
  const alerts = useAlerts()
  const [open, setOpen, ref] = usePop()
  const urgent = alerts.filter((a) => a.tone !== 'info').length
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative grid size-9 place-items-center rounded-xl text-ink-2 hover:bg-ink/5" aria-label="Alerts">
        <Bell className="size-[18px]" />
        {urgent > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">{urgent}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="fixed inset-x-3 top-14 z-40 max-h-[70dvh] overflow-y-auto rounded-2xl border border-line bg-surface shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-96">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-display text-sm font-bold">Alerts</p>
              <span className="text-[11px] text-muted">{alerts.length} active</span>
            </div>
            {alerts.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted">All clear.</p>}
            {alerts.map((a) => {
              const Icon = ALERT_ICON[a.tone]
              return (
                <button key={a.id} onClick={() => { go(...a.link); setOpen(false) }} className="flex w-full gap-3 border-b border-line/60 px-4 py-2.5 text-left last:border-0 hover:bg-page">
                  <Icon className={cx('mt-0.5 size-4 shrink-0', ALERT_TONE[a.tone])} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">{a.title}</p>
                    <p className="truncate text-xs text-muted">{a.text}</p>
                  </div>
                  <span className="ml-auto mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: UNITS[a.unit]?.color }} />
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function UserMenu() {
  const { user, roleId, setRoleId, dispatch, toast } = useStore()
  const [open, setOpen, ref] = usePop()
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-1.5 hover:bg-ink/5 sm:pr-2">
        <span className="grid size-7 place-items-center rounded-lg bg-brand text-[11px] font-bold text-white sm:size-8">
          {user.person.split(' ').map((x) => x[0]).join('').slice(0, 2)}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[13px] font-semibold text-ink">{user.person}</span>
          <span className="block text-[11px] text-muted">{user.label}</span>
        </span>
        <ChevronDown className="hidden size-3.5 text-muted sm:block" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-11 z-40 w-72 rounded-2xl border border-line bg-surface p-2 shadow-xl">
            <p className="px-2 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted">Switch role (demo)</p>
            {Object.values(ROLES).map((r) => (
              <button key={r.id} onClick={() => { setRoleId(r.id); setOpen(false); go(r.modules === 'all' ? 'dashboard' : r.modules[0]) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-page">
                <span className="flex-1">
                  <span className="block text-[13px] font-semibold text-ink">{r.label}</span>
                  <span className="block text-[11px] text-muted">{r.person}</span>
                </span>
                {roleId === r.id && <Check className="size-4 text-brand" />}
              </button>
            ))}
            <div className="my-1 border-t border-line" />
            <button onClick={() => { dispatch('reset'); toast('Demo data reset'); setOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] font-medium text-ink-2 hover:bg-page">
              <RotateCcw className="size-4" /> Reset demo data
            </button>
            <button onClick={() => setRoleId(null)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] font-medium text-crit hover:bg-crit-l">
              <LogOut className="size-4" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-3 lg:bottom-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} className={cx('flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium shadow-lg', t.tone === 'warn' ? 'bg-warn-l text-warn-d' : 'bg-night text-white')}>
            {t.tone === 'warn' ? <TriangleAlert className="size-4" /> : <Check className="size-4 text-good" />}
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
