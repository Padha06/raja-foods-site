import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { UNITS } from '../config.js'

export const cx = (...a) => a.filter(Boolean).join(' ')

export function Card({ className, children, ...rest }) {
  return (
    <div className={cx('rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(28,21,18,0.04)]', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardHead({ title, sub, right, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-2 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="min-w-0">
        <h3 className="flex items-center gap-1.5 font-display text-[13px] font-semibold text-ink sm:text-[15px]">
          {Icon && <Icon className="size-3.5 text-muted sm:size-4" />}
          {title}
        </h3>
        {sub && <p className="mt-0.5 text-[10.5px] text-muted sm:text-xs">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function PageHeader({ title, sub, unit, actions }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 sm:mb-5">
      <div className="min-w-0">
        {unit && (
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted sm:text-[11px]">
            <span className="size-2 rounded-full" style={{ background: UNITS[unit].color }} />
            {UNITS[unit].full}
          </div>
        )}
        <h1 className="font-display text-lg font-bold leading-tight text-ink sm:text-2xl">{title}</h1>
        {sub && <p className="mt-0.5 text-[11px] text-muted sm:text-sm">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap justify-end gap-1.5 sm:gap-2">{actions}</div>}
    </div>
  )
}

export function Button({ variant = 'primary', size = 'md', className, icon: Icon, children, ...rest }) {
  const v = {
    primary: 'bg-brand text-white hover:bg-brand-d shadow-sm',
    ghost: 'bg-transparent text-ink-2 hover:bg-ink/5',
    outline: 'border border-line bg-surface text-ink-2 hover:bg-page',
    danger: 'bg-crit text-white hover:brightness-95',
  }[variant]
  const s = { sm: 'h-7 px-2 text-[11px] gap-1 sm:h-8 sm:px-2.5 sm:text-xs', md: 'h-8 px-2.5 text-[11.5px] gap-1.5 sm:h-9 sm:px-3.5 sm:text-[13px]' }[size]
  return (
    <button className={cx('inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold transition disabled:opacity-40', v, s, className)} {...rest}>
      {Icon && <Icon className="size-3.5 sm:size-4" />}
      {children}
    </button>
  )
}

const TONES = {
  ok: 'bg-good-l text-good-d',
  warn: 'bg-warn-l text-warn-d',
  crit: 'bg-crit-l text-crit-d',
  info: 'bg-sky-l text-sky-d',
  mute: 'bg-ink/5 text-muted',
}
export function Badge({ tone = 'mute', icon: Icon, children, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-[11px]', TONES[tone], className)}>
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  )
}

export function UnitTag({ unit, short }) {
  const u = UNITS[unit]
  if (!u) return <span className="text-muted">Admin</span>
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10.5px] font-medium text-ink-2 sm:text-xs">
      <span className="size-1.5 rounded-full sm:size-2" style={{ background: u.color }} />
      {short ? u.short : u.name}
    </span>
  )
}

export function Stat({ label, value, sub, icon: Icon, tone, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Card className={cx('p-2.5 text-left sm:p-4', onClick && 'transition hover:border-ink/20')}>
      <Tag onClick={onClick} className="block w-full text-left">
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-[10px] font-medium text-muted sm:text-xs">{label}</p>
          {Icon && (
            <span className={cx('grid size-5 shrink-0 place-items-center rounded-md sm:size-7 sm:rounded-lg', tone ? TONES[tone] : 'bg-ink/5 text-ink-2')}>
              <Icon className="size-3 sm:size-3.5" />
            </span>
          )}
        </div>
        <p className="mt-1 font-display text-[17px] font-bold leading-none tracking-tight text-ink sm:mt-2 sm:text-[26px]">{value}</p>
        {sub && <div className="mt-1 truncate text-[10px] text-muted sm:mt-1.5 sm:text-xs">{sub}</div>}
      </Tag>
    </Card>
  )
}

export function Table({ cols, rows, empty = 'Nothing here yet', onRow, foot, max }) {
  return (
    <div className={cx('overflow-x-auto', max && 'overflow-y-auto')} style={max ? { maxHeight: max } : undefined}>
      <table className="w-full text-[11px] sm:text-[13px]">
        <thead className="sticky top-0 z-[1] bg-surface">
          <tr className="border-b border-line text-left text-[9.5px] uppercase tracking-wider text-muted sm:text-[11px]">
            {cols.map((c) => (
              <th key={c.key} className={cx('whitespace-nowrap px-2 py-2 font-semibold first:pl-3 last:pr-3 sm:px-3 sm:first:pl-5 sm:last:pr-5', c.right && 'text-right')}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols.length} className="px-5 py-8 text-center text-muted">{empty}</td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={r.key ?? i} onClick={onRow ? () => onRow(r) : undefined} className={cx('border-b border-line/70 last:border-0', onRow && 'cursor-pointer hover:bg-page/70', r.muted && 'opacity-50')}>
              {cols.map((c) => (
                <td key={c.key} className={cx('whitespace-nowrap px-2 py-2 first:pl-3 last:pr-3 sm:px-3 sm:py-2.5 sm:first:pl-5 sm:last:pr-5', c.right && 'text-right tabular-nums', c.className)}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot && (
          <tfoot>
            <tr className="border-t-2 border-line font-semibold">
              {cols.map((c) => (
                <td key={c.key} className={cx('whitespace-nowrap px-2 py-2 first:pl-3 last:pr-3 sm:px-3 sm:first:pl-5 sm:last:pr-5', c.right && 'text-right tabular-nums')}>
                  {foot[c.key]}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cx('flex gap-0.5 overflow-x-auto rounded-xl bg-ink/[0.05] p-0.5 sm:gap-1 sm:p-1', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cx('relative flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-semibold transition sm:px-3 sm:py-1.5 sm:text-[13px]', value === t.id ? 'text-ink' : 'text-muted hover:text-ink-2')}
        >
          {value === t.id && <motion.span layoutId={`tab-${tabs[0].id}`} className="absolute inset-0 rounded-lg bg-surface shadow-sm" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />}
          <span className="relative">{t.label}</span>
          {t.count != null && <span className="relative rounded-full bg-ink/10 px-1.5 text-[9.5px] sm:text-[10.5px]">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Modal({ open, onClose, title, sub, children, wide }) {
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.35 }}
            className={cx('flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
              <div>
                <h2 className="font-display text-[15px] font-bold text-ink sm:text-lg">{title}</h2>
                {sub && <p className="text-[11px] text-muted sm:text-xs">{sub}</p>}
              </div>
              <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-ink/5" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Field({ label, hint, children, className }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1 block text-[11px] font-semibold text-ink-2 sm:text-xs">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10.5px] text-muted sm:text-[11px]">{hint}</span>}
    </label>
  )
}

const inputCls = 'h-9 w-full rounded-lg border border-line bg-surface px-2.5 text-[13px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 sm:h-10 sm:text-sm'
export const Input = ({ className, ...p }) => <input className={cx(inputCls, className)} {...p} />
export function Select({ options, className, ...p }) {
  return (
    <select className={cx(inputCls, 'pr-7', className)} {...p}>
      {options.map((o) => (typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button key={o.value ?? o} type="button" onClick={() => onChange(o.value ?? o)} className={cx('rounded-md px-2 py-1 text-[11px] font-semibold sm:px-2.5 sm:text-xs', value === (o.value ?? o) ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>
          {o.label ?? o}
        </button>
      ))}
    </div>
  )
}

export function Progress({ value, max, color = 'var(--color-brand)', className }) {
  return (
    <div className={cx('h-1.5 overflow-hidden rounded-full bg-ink/[0.07]', className)}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, background: color }} />
    </div>
  )
}

// Rounds a number field without fighting the user while they type
export function useNum(init) {
  const [v, set] = useState(String(init))
  return [v, set, Number(v) || 0]
}
