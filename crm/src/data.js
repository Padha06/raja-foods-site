// Seed data for the demo. Everything is generated relative to today from one fixed random seed, so
// the demo always looks current yet every total on the dashboard still reconciles with the records
// underneath it (farm transfers = birds sold by the units, processing yield = retail kg received, …).
import { DISTRICTS, ROUTES, RULES, EXPENSE_CATEGORIES } from './config.js'
import { addDays, today, iso } from './lib.js'

const DAYS = 45

function rng(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const PRODUCTS = [
  { id: 'curry', name: 'Curry cut', price: 240, share: 0.52 },
  { id: 'whole', name: 'Whole dressed', price: 200, share: 0.17 },
  { id: 'boneless', name: 'Boneless', price: 360, share: 0.12 },
  { id: 'leg', name: 'Leg piece', price: 280, share: 0.12 },
  { id: 'liver', name: 'Liver & gizzard', price: 160, share: 0.07 },
]

export const FEED_ITEMS = [
  { id: 'pre', name: 'Pre-starter crumble', type: 'Pre-starter', bagKg: 50, supplier: 'Godrej Agrovet', rate: 2150, reorder: 60, share: 0.12 },
  { id: 'start', name: 'Starter crumble', type: 'Starter', bagKg: 50, supplier: 'Godrej Agrovet', rate: 2040, reorder: 120, share: 0.24 },
  { id: 'grow', name: 'Grower pellet', type: 'Grower', bagKg: 50, supplier: 'Suguna Feeds', rate: 1960, reorder: 150, share: 0.34 },
  { id: 'finish', name: 'Finisher pellet', type: 'Finisher', bagKg: 50, supplier: 'Suguna Feeds', rate: 1890, reorder: 150, share: 0.3 },
]

const DISTRICT_BUYERS = [
  ['Shree Ganesh Traders', 'Jabalpur', 'Rakesh Agrawal', 1500000, 10, 0.95],
  ['Maa Narmada Poultry', 'Narsinghpur', 'Deepak Patel', 1000000, 7, 0.9],
  ['Sagar Chicken Centre', 'Sagar', 'Faizan Ali', 1200000, 10, 0.85],
  ['Seoni Fresh Birds', 'Seoni', 'Manoj Thakur', 800000, 7, 0.9],
  ['Patel Broiler Agency', 'Chhindwara', 'Hitesh Patel', 1200000, 15, 0.8],
  ['Hoshangabad Meat Suppliers', 'Hoshangabad', 'Naveen Rai', 600000, 7, 0.15],
]
const LOCAL_BUYERS = [
  ['Babu Chicken Shop', 'R1'], ['Anand Chicken Corner', 'R1'], ['Salim Meat Shop', 'R1'], ['Gupta Chicken', 'R1'],
  ['New Fresh Chicken', 'R2'], ['Rehman Chicken', 'R2'], ['Shiv Chicken Point', 'R2'],
  ['Kisan Chicken', 'R3'], ['Jai Hind Chicken', 'R3'], ['Maa Durga Chicken', 'R3'],
]
const HOTELS = [
  ['Hotel Narmada Palace', 'Mr. Saxena', 'Daily 7 AM', 205, 200000, 0.95],
  ['Shree Bhojnalaya', 'Mr. Tiwari', 'Daily 9 AM', 198, 100000, 0.9],
  ['Hotel Royal Inn', 'Mrs. Kapoor', 'Daily 7 AM', 210, 150000, 0.9],
  ['Al-Kareem Restaurant', 'Mr. Kareem', 'Daily 10 AM', 200, 120000, 0.45],
  ['Green Leaf Dhaba', 'Mr. Gill', 'Alternate days', 195, 80000, 0.85],
  ['Hotel Sai Residency', 'Mr. Joshi', 'Daily 8 AM', 208, 150000, 0.95],
]

const WORKERS = [
  ['Vinod Lodhi', 'Farm manager', 'farm', 22000], ['Kamlesh Ahirwar', 'Shed supervisor', 'farm', 14000],
  ['Rajju Gond', 'Shed worker', 'farm', 10000], ['Bhagwat Kushwaha', 'Shed worker', 'farm', 10000],
  ['Gopal Rajak', 'Feed & store', 'farm', 11000], ['Halke Ram', 'Night guard', 'farm', 9000],
  ['Arvind Jain', 'District manager', 'district', 24000], ['Shahid Khan', 'Truck driver', 'district', 15000],
  ['Santosh Kurmi', 'Local manager', 'local', 18000], ['Ramesh Yadav', 'Driver · Route 1', 'local', 13000],
  ['Sunil Kewat', 'Driver · Route 2', 'local', 13000], ['Mukesh Patel', 'Driver · Route 3', 'local', 13000],
  ['Imran Khan', 'Retail manager', 'retail', 18000], ['Sonu Vishwakarma', 'Cutter', 'retail', 12000],
  ['Pooja Sahu', 'Cashier', 'retail', 11000], ['Ajay Dhurve', 'Hotel delivery', 'retail', 10000],
]

const phone = (r) => `+91 9${Math.floor(r() * 9e8 + 1e8)}`

export function makeSeed() {
  const r = rng(20261022)
  const pick = (a) => a[Math.floor(r() * a.length)]
  const between = (a, b) => a + r() * (b - a)
  const int = (a, b) => Math.floor(between(a, b + 1))
  const end = today()
  const start = addDays(end, -DAYS)

  const parties = []
  DISTRICT_BUYERS.forEach(([name, district, contact, creditLimit, creditDays, pays], i) =>
    parties.push({ id: `D${i + 1}`, unit: 'district', type: 'buyer', name, district, contact, phone: phone(r), address: `${district} mandi`, creditLimit, creditDays, opening: int(1, 6) * 25000, openingDate: start, pays, rateKg: int(104, 110) }),
  )
  LOCAL_BUYERS.forEach(([name, route], i) =>
    parties.push({ id: `L${i + 1}`, unit: 'local', type: 'buyer', name, route, contact: name.split(' ')[0], phone: phone(r), address: ROUTES.find((x) => x.id === route).name.split('· ')[1], creditLimit: int(5, 10) * 10000, creditDays: 3, opening: int(0, 4) * 5000, openingDate: start, pays: name === 'Rehman Chicken' ? 0.4 : 0.92, rateKg: int(111, 116) }),
  )
  HOTELS.forEach(([name, contact, schedule, rateKg, creditLimit, pays], i) =>
    parties.push({ id: `H${i + 1}`, unit: 'retail', type: 'hotel', name, contact, schedule, phone: phone(r), address: 'Town centre', creditLimit, creditDays: 7, opening: int(1, 5) * 10000, openingDate: start, pays, rateKg }),
  )
  parties.push({ id: 'C1', unit: 'retail', type: 'counter', name: 'Counter sales (walk-in)', contact: '-', phone: '-', address: 'Raja Broilers shop', creditLimit: 0, creditDays: 0, opening: 0, openingDate: start, pays: 1, rateKg: 0 })

  const invoices = []
  const payments = []
  const birdMoves = []
  const feedMoves = []
  const retailMoves = []
  const processing = []
  const dispatches = []
  const expenses = []
  const batches = []
  const seq = { district: 1, local: 1, retail: 1, counter: 1, pay: 7000 }
  const noFor = (unit, type) => (type === 'counter' ? `RBC-${String(seq.counter++).padStart(4, '0')}` : unit === 'district' ? `RFD-${String(seq.district++).padStart(4, '0')}` : unit === 'local' ? `RWL-${String(seq.local++).padStart(4, '0')}` : `RBH-${String(seq.retail++).padStart(4, '0')}`)
  const birdsBySale = { district: [], local: [], retail: [] }

  // Farm starting position: sheds already holding birds, then fresh chicks placed every ~9 days
  birdMoves.push({ id: 'BM0', date: start, type: 'opening', qty: 29400, batch: '-', note: 'Opening stock (all sheds)', by: 'Vinod Lodhi' })
  const sheds = ['Shed A', 'Shed B', 'Shed C', 'Shed D']
  const preBatches = [['B-0911', -40, 'Shed A', 'Ready'], ['B-0920', -31, 'Shed B', 'Ready'], ['B-0929', -22, 'Shed C', 'Growing']]
  preBatches.forEach(([id, off, shed, status]) =>
    batches.push({ id, date: addDays(start, off), source: 'Venky’s Hatchery', type: 'Broiler · Cobb 430', qty: 9800, costPerBird: 41, shed, status: 'Sold out', avgKg: 2.3 }),
  )
  retailMoves.push(...PRODUCTS.map((p, i) => ({ id: `RO${i}`, date: start, product: p.id, type: 'opening', kg: [60, 25, 18, 18, 10][i], note: 'Opening stock' })))
  feedMoves.push(...FEED_ITEMS.map((f, i) => ({ id: `FO${i}`, date: start, item: f.id, type: 'opening', bags: [180, 320, 480, 420][i], note: 'Opening stock', by: 'Gopal Rajak' })))

  for (let d = 0; d <= DAYS; d++) {
    const date = addDays(start, d)
    const isToday = date === end

    // chicks placed
    if (d % 9 === 3) {
      const qty = int(12, 14) * 1000
      const id = `B-${date.slice(5, 7)}${date.slice(8)}`
      const shed = sheds[(batches.length) % 4]
      batches.push({ id, date, source: pick(['Venky’s Hatchery', 'Suguna Hatchery', 'IB Group']), type: 'Broiler · Cobb 430', qty, costPerBird: int(38, 46), shed, status: 'Growing', avgKg: 0 })
      birdMoves.push({ id: `BM${birdMoves.length}`, date, type: 'received', qty, batch: id, note: `Chicks placed in ${shed}`, by: 'Vinod Lodhi' })
      expenses.push({ id: `E${expenses.length}`, date, unit: 'farm', category: 'Chicks', payee: batches.at(-1).source, amount: qty * batches.at(-1).costPerBird, method: 'Bank transfer', note: `Batch ${id}`, receipt: true, by: 'Raja Saheb' })
      expenses.push({ id: `E${expenses.length}`, date, unit: 'farm', category: 'Vaccine', payee: 'Ventri Biologicals', amount: Math.round(qty * 1.6), method: 'UPI', note: `Vaccination for ${id}`, receipt: true, by: 'Vinod Lodhi' })
    }
    // mortality
    const dead = int(28, 64)
    birdMoves.push({ id: `BM${birdMoves.length}`, date, type: 'mortality', qty: dead, batch: pick(batches.slice(-4)).id, reason: pick(['Heat stress', 'Natural', 'Leg weakness', 'Respiratory', 'Natural', 'Crowding']), note: '', by: pick(['Kamlesh Ahirwar', 'Rajju Gond']) })

    // district bulk sales: 2 of 6 buyers each day
    for (const p of parties.filter((x) => x.unit === 'district')) {
      if (r() > 0.36) continue
      const birds = int(26, 52) * 10
      const kg = Math.round(birds * between(2.1, 2.35))
      const status = isToday ? pick(['Loading', 'In transit', 'In transit']) : 'Delivered'
      invoices.push({ no: noFor('district'), unit: 'district', partyId: p.id, date, lines: [{ item: 'Live broiler', birds, qty: kg, uom: 'kg', rate: p.rateKg }], transport: int(25, 45) * 100, status, vehicle: pick(['MP 20 HB 4521', 'MP 49 H 7788', 'MP 20 GA 1190']), driver: pick(['Shahid Khan', 'Hired · Pappu']), by: 'Arvind Jain' })
      birdsBySale.district.push([date, birds])
      expenses.push({ id: `E${expenses.length}`, date, unit: 'district', category: pick(['Transport', 'Transport', 'Loading / unloading']), payee: pick(['Jai Bajrang Transport', 'Hamal team']), amount: int(30, 55) * 100, method: 'Cash', note: `${p.district} delivery`, receipt: r() > 0.4, by: 'Arvind Jain' })
    }

    // local route dispatches: one vehicle per route, most shops each day
    for (const route of ROUTES) {
      const stops = []
      for (const p of parties.filter((x) => x.route === route.id)) {
        if (r() > 0.85) continue
        const birds = int(7, 16) * 5
        const kg = Math.round(birds * between(2.1, 2.3))
        const delivered = isToday && stops.length >= 2 ? null : birds
        const no = delivered == null ? null : noFor('local')
        if (no) invoices.push({ no, unit: 'local', partyId: p.id, date, lines: [{ item: 'Live broiler', birds, qty: kg, uom: 'kg', rate: p.rateKg }], transport: 0, status: 'Delivered', route: route.id, vehicle: route.vehicle, driver: route.driver, by: 'Santosh Kurmi' })
        stops.push({ partyId: p.id, birds, kg, rate: p.rateKg, invoice: no, status: no ? 'Delivered' : 'Pending' })
      }
      const sold = stops.reduce((s, x) => s + x.birds, 0)
      const lost = r() > 0.8 ? int(1, 3) : 0
      const returned = r() > 0.7 ? int(1, 3) * 5 : 0
      const loaded = sold + lost + returned
      dispatches.push({ id: `DS-${date.slice(5).replace('-', '')}-${route.id}`, date, route: route.id, vehicle: route.vehicle, driver: route.driver, loaded, returned: isToday ? 0 : returned, lost: isToday ? 0 : lost, stops, status: isToday ? 'Out for delivery' : 'Closed', source: 'Farm · Shed ' + pick(['A', 'B', 'C', 'D']) })
      birdsBySale.local.push([date, isToday ? loaded : sold + lost])
      expenses.push({ id: `E${expenses.length}`, date, unit: 'local', category: 'Fuel', payee: 'HP Petrol Pump', amount: int(9, 16) * 100, method: 'Cash', note: route.name, receipt: true, by: route.driver })
    }

    // Raja Broilers: hotels + counter, in dressed kg by product
    const productKg = Object.fromEntries(PRODUCTS.map((p) => [p.id, 0]))
    for (const h of parties.filter((x) => x.type === 'hotel')) {
      if (h.schedule === 'Alternate days' && d % 2) continue
      if (r() > 0.92) continue
      const curry = int(14, 40)
      const boneless = r() > 0.5 ? int(4, 12) : 0
      const lines = [{ item: 'Curry cut', product: 'curry', qty: curry, uom: 'kg', rate: h.rateKg }]
      if (boneless) lines.push({ item: 'Boneless', product: 'boneless', qty: boneless, uom: 'kg', rate: h.rateKg + 130 })
      productKg.curry += curry
      productKg.boneless += boneless
      const returned = r() > 0.9 ? int(1, 3) : 0
      invoices.push({ no: noFor('retail'), unit: 'retail', partyId: h.id, date, lines, transport: 0, status: 'Delivered', accepted: curry + boneless - returned, returned, by: 'Imran Khan' })
    }
    const counterKg = int(130, 190) * (new Date(`${date}T00:00:00`).getDay() === 0 ? 1.35 : 1)
    const cLines = PRODUCTS.map((p) => {
      const q = Math.round(counterKg * p.share * between(0.85, 1.15) * 10) / 10
      productKg[p.id] += q
      return { item: p.name, product: p.id, qty: q, uom: 'kg', rate: p.price }
    })
    if (!isToday) {
      const no = noFor('retail', 'counter')
      invoices.push({ no, unit: 'retail', partyId: 'C1', date, lines: cLines, transport: 0, status: 'Paid', note: 'Day total of counter bills', by: 'Pooja Sahu' })
      const total = cLines.reduce((s, l) => s + l.qty * l.rate, 0)
      const upi = Math.round(total * between(0.35, 0.55))
      payments.push({ id: `RC-${seq.pay++}`, partyId: 'C1', date, amount: upi, method: 'UPI', alloc: [{ no, amount: upi }], by: 'Pooja Sahu' })
      payments.push({ id: `RC-${seq.pay++}`, partyId: 'C1', date, amount: Math.round(total) - upi, method: 'Cash', alloc: [{ no, amount: Math.round(total) - upi }], by: 'Pooja Sahu' })
    }
    // processing: live birds from farm → dressed kg, at the confirmed yield
    const totalKg = Object.values(productKg).reduce((s, x) => s + x, 0)
    const wastageKg = Math.round(totalKg * between(0.01, 0.025) * 10) / 10
    const birds = Math.ceil((totalKg + wastageKg + int(0, 6)) / (RULES.avgLiveKg * RULES.dressedYield))
    const liveKg = Math.round(birds * between(2.15, 2.25))
    const dressed = Math.round(liveKg * between(0.71, 0.73) * 10) / 10
    processing.push({ id: `PR-${date.slice(5).replace('-', '')}`, date, birds, liveKg, dressedKg: dressed, wastageKg, by: 'Sonu Vishwakarma' })
    birdsBySale.retail.push([date, birds])
    for (const p of PRODUCTS) {
      const recv = Math.round((dressed * (productKg[p.id] / totalKg)) * 10) / 10
      retailMoves.push({ id: `RM${retailMoves.length}`, date, product: p.id, type: 'received', kg: recv, note: 'From processing' })
      if (!isToday) retailMoves.push({ id: `RM${retailMoves.length}`, date, product: p.id, type: 'sold', kg: productKg[p.id], note: 'Hotels + counter' })
      else retailMoves.push({ id: `RM${retailMoves.length}`, date, product: p.id, type: 'sold', kg: productKg[p.id] - cLines.find((l) => l.product === p.id).qty, note: 'Hotels' })
      retailMoves.push({ id: `RM${retailMoves.length}`, date, product: p.id, type: 'wastage', kg: Math.round(wastageKg * (productKg[p.id] / totalKg) * 10) / 10, note: 'Trimming & spoilage' })
    }
    expenses.push({ id: `E${expenses.length}`, date, unit: 'retail', category: 'Ice', payee: 'Shiv Ice Factory', amount: int(3, 6) * 100, method: 'Cash', note: '', receipt: false, by: 'Imran Khan' })

    // farm → unit transfers equal what each unit moved that day (no double counting)
    for (const unit of ['district', 'local', 'retail']) {
      const qty = birdsBySale[unit].filter(([dd]) => dd === date).reduce((s, [, b]) => s + b, 0)
      if (qty) birdMoves.push({ id: `BM${birdMoves.length}`, date, type: 'transferred', qty, to: unit, batch: pick(batches.filter((b) => b.date <= addDays(date, -32)).slice(-2).concat(batches.slice(0, 1))).id, note: '', by: 'Vinod Lodhi' })
    }

    // feed: ~0.1 kg per bird per day, purchases every 6 days
    for (const f of FEED_ITEMS) {
      feedMoves.push({ id: `FM${feedMoves.length}`, date, item: f.id, type: 'issued', bags: Math.round(between(88, 100) * f.share), shed: pick(sheds), by: 'Gopal Rajak' })
      if (d % 6 === 2 && !(f.id === 'pre' && d > 30)) {
        const bags = Math.round(between(560, 600) * f.share)
        feedMoves.push({ id: `FM${feedMoves.length}`, date, item: f.id, type: 'purchase', bags, rate: f.rate, supplier: f.supplier, by: 'Gopal Rajak' })
        expenses.push({ id: `E${expenses.length}`, date, unit: 'farm', category: 'Feed', payee: f.supplier, amount: bags * f.rate, method: 'Bank transfer', note: `${bags} bags ${f.name}`, receipt: true, by: 'Gopal Rajak' })
      }
    }
    if (d % 3 === 1) expenses.push({ id: `E${expenses.length}`, date, unit: 'farm', category: 'Medicine', payee: 'Krishna Vet Medical', amount: int(18, 45) * 100, method: 'UPI', note: pick(['Vitamins & electrolytes', 'Antibiotic course', 'Liver tonic']), receipt: true, by: 'Vinod Lodhi' })
    if (d % 7 === 0) {
      expenses.push({ id: `E${expenses.length}`, date, unit: 'farm', category: 'Electricity', payee: 'MPEB', amount: int(140, 180) * 100, method: 'Bank transfer', note: 'Fans, foggers, brooders', receipt: true, by: 'Vinod Lodhi' })
      expenses.push({ id: `E${expenses.length}`, date, unit: 'farm', category: 'Bedding / litter', payee: 'Rice husk supplier', amount: int(40, 70) * 100, method: 'Cash', note: '', receipt: false, by: 'Vinod Lodhi' })
      expenses.push({ id: `E${expenses.length}`, date, unit: 'retail', category: 'Cleaning', payee: 'Local vendor', amount: int(6, 12) * 100, method: 'Cash', note: '', receipt: false, by: 'Imran Khan' })
    }
    if (date.slice(8) === '01' || d === 0) {
      expenses.push({ id: `E${expenses.length}`, date, unit: 'retail', category: 'Shop rent', payee: 'Shop owner', amount: 18000, method: 'Bank transfer', note: 'Monthly rent', receipt: true, by: 'Raja Saheb' })
      expenses.push({ id: `E${expenses.length}`, date, unit: 'admin', category: 'Administration', payee: 'CA office', amount: 6500, method: 'UPI', note: 'Monthly accounting', receipt: true, by: 'Raja Saheb' })
    }
  }

  // Receipts: each party settles invoices older than its credit days, some reliably, some not
  for (const p of parties.filter((x) => x.type !== 'counter')) {
    const inv = invoices.filter((i) => i.partyId === p.id)
    let paidUpTo = 0
    let carry = p.opening
    for (let d = 2; d <= DAYS; d += p.unit === 'local' ? 2 : int(4, 7)) {
      const date = addDays(start, d)
      const cutoff = addDays(date, -p.creditDays)
      let due = carry
      while (paidUpTo < inv.length && inv[paidUpTo].date <= cutoff) {
        due += inv[paidUpTo].lines.reduce((s, l) => s + l.qty * l.rate, 0) + (inv[paidUpTo].transport || 0)
        paidUpTo++
      }
      if (due <= 0 || r() > p.pays) {
        carry = due
        continue
      }
      const amount = r() > 0.25 ? Math.round(due) : Math.round((due * between(0.4, 0.8)) / 100) * 100
      carry = due - amount
      if (amount > 0) payments.push({ id: `RC-${seq.pay++}`, partyId: p.id, date, amount, method: p.unit === 'local' ? pick(['Cash', 'Cash', 'UPI']) : pick(['Bank transfer', 'UPI', 'Cheque', 'Bank transfer']), ref: p.unit === 'local' ? '' : `UTR${int(100000, 999999)}`, alloc: [], by: p.unit === 'district' ? 'Arvind Jain' : p.unit === 'local' ? 'Santosh Kurmi' : 'Pooja Sahu' })
    }
  }
  // a credit note so the ledger shows one
  payments.push({ id: `CN-${seq.pay++}`, kind: 'credit', partyId: 'H3', date: addDays(end, -6), amount: 1640, method: 'Credit note', ref: 'CN-014', note: '8 kg returned · quality', alloc: [], by: 'Imran Khan' })

  // batch status from age
  for (const b of batches) {
    const age = Math.round((new Date(`${end}T00:00:00`) - new Date(`${b.date}T00:00:00`)) / 864e5)
    if (b.status === 'Sold out') continue
    b.ageDays = age
    b.status = age >= 34 ? 'Selling' : age >= 28 ? 'Ready soon' : 'Growing'
    b.avgKg = Math.round(Math.min(2.4, 0.045 + age * 0.068) * 100) / 100
  }

  // workers, attendance, salary and advances
  const workers = WORKERS.map(([name, role, unit, salary], i) => ({ id: `W${i + 1}`, name, role, unit, salary, phone: phone(r), joined: iso(new Date(2019 + (i % 6), (i * 5) % 12, 1 + i)), address: 'Local', active: true }))
  const attendance = {}
  for (let d = 30; d >= 0; d--) {
    const date = addDays(end, -d)
    attendance[date] = {}
    for (const w of workers) {
      if (d === 0 && r() > 0.6) continue // today: still being marked
      const x = r()
      attendance[date][w.id] = x > 0.95 ? 'A' : x > 0.91 ? 'L' : 'P'
    }
  }
  const wpay = []
  workers.forEach((w, i) => {
    if (i % 3 === 0) wpay.push({ id: `WP${wpay.length}`, workerId: w.id, date: addDays(end, -int(5, 25)), type: 'advance', amount: int(2, 6) * 1000, note: pick(['Family function', 'Medical', 'School fees']), by: 'Raja Saheb' })
    if (i % 6 === 0) wpay.push({ id: `WP${wpay.length}`, workerId: w.id, date: addDays(end, -int(1, 4)), type: 'repayment', amount: 1000, note: 'Cut from salary', by: 'Raja Saheb' })
    wpay.push({ id: `WP${wpay.length}`, workerId: w.id, date: addDays(end, -(new Date().getDate() + 1)), type: 'salary', amount: w.salary, note: 'Last month salary', by: 'Raja Saheb' })
  })

  const feed = FEED_ITEMS.map(({ share, ...f }) => f)
  const audit = [
    { id: 'A1', at: Date.now() - 1000 * 60 * 18, who: 'Imran Khan', role: 'Retail & Hotel Manager', unit: 'retail', action: 'Recorded delivery', detail: 'Hotel Narmada Palace · 32 kg curry cut' },
    { id: 'A2', at: Date.now() - 1000 * 60 * 47, who: 'Santosh Kurmi', role: 'Local Distribution Manager', unit: 'local', action: 'Dispatched route', detail: 'Route 2 loaded from farm' },
    { id: 'A3', at: Date.now() - 1000 * 60 * 95, who: 'Kamlesh Ahirwar', role: 'Farm', unit: 'farm', action: 'Logged mortality', detail: `${birdMoves.at(-4)?.qty || 40} birds · Heat stress` },
    { id: 'A4', at: Date.now() - 1000 * 60 * 60 * 3, who: 'Arvind Jain', role: 'District Wholesale Manager', unit: 'district', action: 'Corrected invoice', detail: 'RFD rate 107 → 108 · reason: agreed rate', flag: true },
    { id: 'A5', at: Date.now() - 1000 * 60 * 60 * 5, who: 'Raja Saheb', role: 'Owner', unit: 'farm', action: 'Changed permission', detail: 'Cashier can now record UPI receipts' },
  ]

  return {
    version: 4,
    seededOn: end,
    parties,
    invoices,
    payments,
    birdMoves,
    batches: batches.reverse(),
    feed,
    feedMoves,
    retailMoves,
    processing,
    dispatches,
    expenses,
    workers,
    attendance,
    wpay,
    audit,
    todos: [
      { id: 'T1', text: 'Call Hoshangabad Meat Suppliers about 30+ day dues', unit: 'district', done: false },
      { id: 'T2', text: 'Order pre-starter feed before Friday batch', unit: 'farm', done: false },
      { id: 'T3', text: 'Send October statement to Al-Kareem Restaurant', unit: 'retail', done: false },
      { id: 'T4', text: 'Fix Route 3 vehicle tyre', unit: 'local', done: true },
    ],
  }
}

export const EXPENSE_UNITS = Object.keys(EXPENSE_CATEGORIES)
export { DISTRICTS }
