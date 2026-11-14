import { useEffect, useRef, useState } from 'react'
import { UNITS } from '../config.js'
import { AGING_LABELS, fmtDate, rs, rsShort } from '../lib.js'

function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    if (ref.current) ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

const niceMax = (v) => {
  const p = 10 ** Math.floor(Math.log10(v || 1))
  return Math.ceil(v / p / 2) * 2 * p
}

// Daily sales stacked by selling unit. Segments are separated by a 2px surface gap and only the
// top of each stack is rounded, so the stack reads as one bar anchored to the baseline.
export function SalesBars({ days, series, height = 220 }) {
  const [ref, w] = useWidth()
  const [hover, setHover] = useState(null)
  const padL = 40
  const padB = 20
  const h = height
  const totals = days.map((d) => series.reduce((s, k) => s + d[k], 0))
  const max = niceMax(Math.max(...totals))
  const plotW = Math.max(10, w - padL)
  const step = plotW / days.length
  const bw = Math.max(3, Math.min(22, step - (w < 500 ? 2 : 4)))
  const y = (v) => ((h - padB) * v) / max
  const ticks = [0, max / 2, max]
  const hd = hover != null ? days[hover] : null

  return (
    <div ref={ref} className="relative select-none">
      <svg width={w} height={h} className="block overflow-visible" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={w} y1={h - padB - y(t)} y2={h - padB - y(t)} stroke={t === 0 ? 'var(--color-axis)' : 'var(--color-grid)'} />
            <text x={padL - 6} y={h - padB - y(t) + 3} textAnchor="end" className="fill-muted text-[9.5px] tabular-nums sm:text-[10.5px]">
              {t === 0 ? '0' : rsShort(t).replace('₹', '')}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = padL + i * step + (step - bw) / 2
          let acc = 0
          const segs = series.filter((k) => d[k] > 0)
          return (
            <g key={d.date} opacity={hover == null || hover === i ? 1 : 0.45}>
              {segs.map((k, j) => {
                const top = j === segs.length - 1
                const y0 = h - padB - y(acc)
                acc += d[k]
                const y1 = h - padB - y(acc)
                const hh = Math.max(0, y0 - y1 - (j > 0 ? 2 : 0))
                const r = top ? Math.min(4, bw / 2, hh) : 0
                return <path key={k} d={roundTop(x, y1, bw, hh, r)} fill={UNITS[k].color} />
              })}
              <rect x={padL + i * step} y={0} width={step} height={h - padB} fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
              {(i % Math.ceil(days.length / (w < 500 ? 5 : 8)) === 0 || i === days.length - 1) && (
                <text x={x + bw / 2} y={h - 5} textAnchor="middle" className="fill-muted text-[9.5px] sm:text-[10.5px]">
                  {fmtDate(d.date)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {hd && (
        <div
          className="pointer-events-none absolute top-0 z-10 w-40 rounded-xl border border-line bg-surface p-2.5 text-[11px] shadow-lg sm:w-44 sm:text-xs"
          style={{ left: Math.min(Math.max(0, padL + hover * step + step / 2 - 88), w - 176) }}
        >
          <p className="mb-1.5 font-semibold text-ink">{fmtDate(hd.date)}</p>
          {series.map((k) => (
            <div key={k} className="flex items-center justify-between gap-2 py-0.5">
              <span className="flex items-center gap-1.5 text-ink-2">
                <span className="size-2 rounded-sm" style={{ background: UNITS[k].color }} />
                {UNITS[k].short}
              </span>
              <span className="tabular-nums text-ink">{rs(hd[k])}</span>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold text-ink">
            <span>Total</span>
            <span className="tabular-nums">{rs(totals[hover])}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function roundTop(x, y, w, h, r) {
  if (h <= 0) return ''
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

export function Legend({ series }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {series.map((k) => (
        <span key={k} className="flex items-center gap-1.5 text-[10.5px] text-ink-2 sm:text-xs">
          <span className="size-2 rounded-sm sm:size-2.5" style={{ background: UNITS[k].color }} />
          {UNITS[k].name}
        </span>
      ))}
    </div>
  )
}

// Ordinal blue ramp: older dues get darker. Labels sit under each segment, so colour never carries it alone.
export const AGING_COLORS = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#0d366b']
export function AgingBar({ buckets, compact }) {
  const total = buckets.reduce((s, x) => s + x, 0) || 1
  const [hover, setHover] = useState(null)
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full sm:h-4">
        {buckets.map((b, i) =>
          b > 0 ? (
            <div key={i} title={`${AGING_LABELS[i]}: ${rs(b)}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ width: `${(b / total) * 100}%`, background: AGING_COLORS[i], opacity: hover == null || hover === i ? 1 : 0.5 }} />
          ) : null,
        )}
      </div>
      {!compact && (
        <div className="mt-2.5 grid grid-cols-5 gap-1 sm:gap-2">
          {buckets.map((b, i) => (
            <div key={i} className={hover === i ? 'opacity-100' : ''}>
              <div className="flex items-center gap-1 text-[9px] text-muted sm:text-[11px]">
                <span className="size-1.5 shrink-0 rounded-sm sm:size-2" style={{ background: AGING_COLORS[i] }} />
                <span className="truncate">{AGING_LABELS[i]}</span>
              </div>
              <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-ink sm:text-sm">{rsShort(b)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Spark({ values, color = 'var(--color-brand)', w = 90, h = 26 }) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - ((v - min) / (max - min || 1)) * (h - 4)}`).join(' ')
  return (
    <svg width={w} height={h} className="block">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
