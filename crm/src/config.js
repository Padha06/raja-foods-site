// Everything client-specific lives here. Districts, routes, hotels and rates are placeholders
// until Raja Foods shares their real lists (section 17 of the brief: "Existing records to import?").
export const BRAND = {
  logo: '/raja-broilers-logo-hd.png',
  name: 'Raja Foods',
  tagline: 'Farm · Wholesale · Broilers',
  owner: 'Raja Saheb',
  phone: '+91 90000 00000',
  address: 'Main Road, Your Town, Madhya Pradesh',
  gstin: 'GST status to be confirmed by accountant',
  website: 'https://raja-foods-site.vercel.app',
}

// The four operating units from the brief. Colours: the three selling units take the first three
// validated categorical slots (they stack together in the sales chart); the farm takes violet.
export const UNITS = {
  farm: { id: 'farm', name: 'Farm', full: 'Raja Foods Farm', color: '#6250d6', short: 'Farm' },
  district: { id: 'district', name: 'District Wholesale', full: 'Raja Foods (District Wholesale)', billingName: 'Raja Foods', billingAddress: 'Park Road, Manapparai 621306', color: '#2a78d6', short: 'District' },
  local: { id: 'local', name: 'Local Distribution', full: 'Raja Wholesale (Local Live-Bird)', color: '#eb6834', short: 'Local' },
  retail: { id: 'retail', name: 'Raja Broilers', full: 'Raja Broilers (Retail & Hotels)', billingName: 'Raja Broilers', billingAddress: 'Park Road, Manapparai 621306', color: '#1baf7a', short: 'Broilers' },
}
export const SELLING_UNITS = ['district', 'local', 'retail']

export const DISTRICTS = ['Jabalpur', 'Narsinghpur', 'Sagar', 'Seoni', 'Chhindwara', 'Hoshangabad']
export const ROUTES = [
  { id: 'R1', name: 'Route 1 · Town Market', vehicle: 'MP 49 G 2231', driver: 'Ramesh Yadav' },
  { id: 'R2', name: 'Route 2 · Station & Bypass', vehicle: 'MP 49 G 4410', driver: 'Sunil Kewat' },
  { id: 'R3', name: 'Route 3 · Villages East', vehicle: 'MP 49 H 1187', driver: 'Mukesh Patel' },
]

// Rules the owner confirms in phase 1. Kept editable in Settings so the demo shows they are rules, not guesses.
export const RULES = {
  avgLiveKg: 2.2, // average live weight of a sale-ready broiler
  dressedYield: 0.72, // dressed kg per live kg for Raja Broilers processing
  agingBuckets: [0, 7, 30, 60], // current, 1-7, 8-30, 31-60, 60+
}

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank transfer', 'Cheque']

export const EXPENSE_CATEGORIES = {
  farm: ['Feed', 'Chicks', 'Medicine', 'Vaccine', 'Labour', 'Electricity', 'Water', 'Bedding / litter', 'Maintenance'],
  district: ['Transport', 'Loading / unloading', 'Fuel', 'Packaging'],
  local: ['Fuel', 'Loading / unloading', 'Delivery', 'Vehicle repair'],
  retail: ['Shop rent', 'Electricity', 'Ice', 'Cleaning', 'Packaging', 'Shop supplies'],
  admin: ['Administration', 'Other'],
}

// Who can see what. Owner manages everything; managers see only their unit (brief §10).
export const ROLES = {
  owner: { id: 'owner', label: 'Owner', person: 'Raja Saheb', units: ['farm', 'district', 'local', 'retail'], modules: 'all' },
  farm: { id: 'farm', label: 'Farm Manager', person: 'Vinod Lodhi', units: ['farm'], modules: ['dashboard', 'farm', 'expenses', 'workers', 'activity'] },
  district: { id: 'district', label: 'District Wholesale Manager', person: 'Arvind Jain', units: ['district'], modules: ['dashboard', 'district', 'ledgers', 'billing', 'expenses', 'activity'] },
  local: { id: 'local', label: 'Local Distribution Manager', person: 'Santosh Kurmi', units: ['local'], modules: ['dashboard', 'local', 'ledgers', 'billing', 'expenses', 'activity'] },
  retail: { id: 'retail', label: 'Retail & Hotel Manager', person: 'Imran Khan', units: ['retail'], modules: ['dashboard', 'retail', 'ledgers', 'billing', 'expenses', 'activity'] },
  cashier: { id: 'cashier', label: 'Cashier / Collector', person: 'Pooja Sahu', units: ['district', 'local', 'retail'], modules: ['billing', 'ledgers'] },
}
