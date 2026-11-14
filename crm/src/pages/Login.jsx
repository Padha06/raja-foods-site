import { motion } from 'motion/react'
import { ArrowRight, Bird, Truck, Route, Store, Lock, ShieldCheck } from 'lucide-react'
import { useStore } from '../store.jsx'
import { ROLES, UNITS, BRAND } from '../config.js'
import { Logo } from '../components/Shell.jsx'

const UNIT_ICONS = { farm: Bird, district: Truck, local: Route, retail: Store }

export default function Login() {
  const { setRoleId } = useStore()
  return (
    <div className="grid min-h-dvh md:grid-cols-[1.1fr_1fr]">
      <div className="relative overflow-hidden bg-night px-5 py-6 text-white sm:px-10 sm:py-10 md:flex md:flex-col md:justify-between lg:px-14">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <Logo dark />
          <a href={BRAND.website} className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-white/70 ring-1 ring-white/20 hover:bg-white/10 sm:text-xs">
            ← {BRAND.name} website
          </a>
        </div>
        <div className="relative mt-6 md:mt-0">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg font-display text-[26px] font-bold leading-[1.08] sm:text-4xl lg:text-5xl">
            Every bird, bag, bill and rupee. <span className="text-gold">One place.</span>
          </motion.h1>
          <p className="mt-3 max-w-md text-[13px] leading-relaxed text-white/60 sm:text-base">
            The private system for {BRAND.name}: farm stock, district wholesale, local routes, Raja Broilers hotels and counter, ledgers, expenses and workers. On phone and computer.
          </p>
          <div className="mt-5 grid grid-cols-4 gap-1.5 sm:mt-8 sm:gap-3">
            {Object.values(UNITS).map((u, i) => {
              const Icon = UNIT_ICONS[u.id]
              return (
                <motion.div key={u.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="rounded-xl border border-white/10 bg-white/[0.04] p-2 sm:rounded-2xl sm:p-3.5">
                  <span className="grid size-6 place-items-center rounded-md sm:size-8 sm:rounded-lg" style={{ background: u.color }}>
                    <Icon className="size-3.5 sm:size-4" />
                  </span>
                  <p className="mt-1.5 text-[10px] font-semibold leading-tight sm:mt-2.5 sm:text-[13px]">{u.name}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
        <p className="relative mt-6 hidden items-center gap-2 text-xs text-white/40 md:flex">
          <ShieldCheck className="size-4" /> Owner-managed accounts · every change logged · daily backups
        </p>
      </div>

      <div className="flex items-start justify-center px-4 py-6 sm:px-10 md:items-center">
        <div className="w-full max-w-md">
          <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
            <Lock className="size-3.5" /> Demo sign-in
          </div>
          <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">Who's signing in?</h2>
          <p className="mt-1 text-[13px] text-muted sm:text-sm">Pick a role to see exactly what that person can see. The live system uses phone + password set up by the owner.</p>
          <div className="mt-5 space-y-2">
            {Object.values(ROLES).map((r, i) => (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => { window.location.hash = '/' + (r.modules === 'all' ? 'dashboard' : r.modules[0]); setRoleId(r.id) }}
                className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left transition hover:border-brand/40 hover:shadow-md sm:p-3.5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-l font-display text-sm font-bold text-brand sm:size-10">
                  {r.person.split(' ').map((x) => x[0]).join('').slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-ink sm:text-sm">{r.label}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted sm:text-xs">
                    {r.person} ·
                    {r.id === 'owner' ? (
                      <span>All units, full access</span>
                    ) : r.id === 'cashier' ? (
                      <span>Bills & receipts only</span>
                    ) : (
                      r.units.map((u) => (
                        <span key={u} className="inline-flex items-center gap-1">
                          <span className="size-1.5 rounded-full" style={{ background: UNITS[u].color }} />
                          {UNITS[u].name} only
                        </span>
                      ))
                    )}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
