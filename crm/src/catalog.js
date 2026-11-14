import { PRODUCTS } from './data.js'

export const defaultProducts = () => [
  { id: 'live', name: 'Live broiler', price: 110, units: ['district', 'local'], active: true, share: 0 },
  ...PRODUCTS.map(p => ({ ...p, units: ['retail'], active: true })),
]
export const catalogOf = data => data.products || defaultProducts()
export const productsFor = (data, unit, activeOnly = false) => catalogOf(data).filter(p => p.units.includes(unit) && (!activeOnly || p.active !== false))

export function productError(data, p) {
  if (!p.name?.trim() || p.name.trim().length > 80) return 'Enter a product name (up to 80 characters).'
  if (!Number.isFinite(p.price) || p.price <= 0) return 'Enter a selling price greater than zero.'
  if (!p.units?.length || p.units.some(u => !['district','local','retail'].includes(u))) return 'Choose a selling unit.'
  if (catalogOf(data).some(x => x.id !== p.id && x.name.trim().toLowerCase() === p.name.trim().toLowerCase() && x.units.some(u => p.units.includes(u)))) return 'A product with this name already exists in the selected unit.'
  return null
}

export function saveProduct(data, p, id) {
  const products = catalogOf(data)
  const previous = products.find(x => x.id === p.id)
  const product = { ...previous, id: previous?.id || id, name: p.name.trim(), price: p.price, units: previous?.units || p.units, active: p.active !== false, share: previous?.share || 0 }
  return { ...data, products: previous ? products.map(x => x.id === product.id ? product : x) : [...products, product] }
}

// A new four-digit series starts at 0001. Legacy demo references remain valid.
export function nextInvoiceNumber(invoices, prefix) {
  const relevant = invoices.filter(i => i.no.startsWith(prefix + '-'))
  const numbered = relevant.filter(i => !i.archivedSeries && (i.seriesNumber != null || /^0\d{3}$/.test(i.no.slice(prefix.length + 1))))
  let n = numbered.reduce((max,i) => Math.max(max, i.seriesNumber ?? Number(i.no.slice(prefix.length + 1))), 0) + 1
  const used = new Set(invoices.map(i => i.no))
  while (used.has(`${prefix}-${String(n).padStart(4,'0')}`)) n++
  return `${prefix}-${String(n).padStart(4,'0')}`
}
