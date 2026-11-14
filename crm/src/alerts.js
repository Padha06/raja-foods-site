import { useMemo } from 'react'
import { useStore } from './store.jsx'
import { productsFor } from './catalog.js'
import { feedStock, retailStock, partySummary, rs, today, num } from './lib.js'

// In-app alerts from brief §12, filtered to the units the signed-in user can see
export function useAlerts() {
  const { data, user } = useStore()
  return useMemo(() => {
    if (!user) return []
    const a = []
    const sees = (u) => user.units.includes(u)
    if (sees('farm'))
      for (const f of data.feed) {
        const s = feedStock(data, f.id)
        if (s < f.reorder) a.push({ id: `feed-${f.id}`, tone: 'warn', unit: 'farm', title: `Low feed: ${f.name}`, text: `${num(s)} bags left · reorder level ${f.reorder}`, link: ['farm', 'feed'] })
      }
    if (sees('retail'))
      for (const p of productsFor(data, 'retail', true)) {
        const s = retailStock(data, p.id)
        if (s < 15) a.push({ id: `rs-${p.id}`, tone: 'warn', unit: 'retail', title: `Low shop stock: ${p.name}`, text: `${num(s, 1)} kg left`, link: ['retail', 'stock'] })
      }
    for (const p of data.parties) {
      if (p.type === 'counter' || !sees(p.unit)) continue
      const s = partySummary(data, p.id)
      if (s.overLimit) a.push({ id: `cl-${p.id}`, tone: 'crit', unit: p.unit, title: `Over credit limit: ${p.name}`, text: `${rs(s.outstanding)} due · limit ${rs(p.creditLimit)}`, link: ['ledgers', p.id] })
      else if (s.oldest > 7) a.push({ id: `od-${p.id}`, tone: 'warn', unit: p.unit, title: `Overdue: ${p.name}`, text: `${rs(s.overdue)} overdue · oldest ${s.oldest} days`, link: ['ledgers', p.id] })
    }
    if (sees('local')) {
      const open = data.dispatches.filter((d) => d.date === today() && d.status !== 'Closed')
      const pending = open.reduce((s, d) => s + d.stops.filter((x) => x.status === 'Pending').length, 0)
      if (pending) a.push({ id: 'stops', tone: 'info', unit: 'local', title: `${pending} route stops pending`, text: `${open.length} vehicles out for delivery`, link: ['local'] })
    }
    if (sees('district')) {
      const moving = data.invoices.filter((i) => i.unit === 'district' && !i.void && (i.status === 'Loading' || i.status === 'In transit'))
      if (moving.length) a.push({ id: 'transit', tone: 'info', unit: 'district', title: `${moving.length} district dispatches on the road`, text: moving.map((i) => data.parties.find((p) => p.id === i.partyId).district).join(', '), link: ['district'] })
    }
    const order = { crit: 0, warn: 1, info: 2 }
    return a.sort((x, y) => order[x.tone] - order[y.tone])
  }, [data, user])
}
