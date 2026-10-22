// Everything client-specific lives here. Phone, address, towns, rates and the yearly numbers are
// placeholders until Raja Foods confirms them; swap the WhatsApp number before the demo so test
// enquiries reach a phone you hold.
export const BRAND = {
  name: 'Raja Foods',
  since: 2012,
  whatsapp: '919000000000',
  phoneDisplay: '+91 90000 00000',
  email: 'orders@rajafoods.in',
  address: { en: 'Main Road, Your Town, Madhya Pradesh', hi: 'मेन रोड, आपका शहर, मध्य प्रदेश' },
  hours: { en: 'Every day, 5 AM – 9 PM', hi: 'रोज़, सुबह 5 – रात 9' },
  // the private management system built for the same client
  staffLogin: 'https://raja-foods-demo.vercel.app',
}

export const waLink = (text) => `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`
export const telLink = `tel:+${BRAND.whatsapp}`

export const img = (id, w = 1000, q = 75) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`
export const srcSet = (id, widths = [480, 800, 1200, 1600]) => widths.map((w) => `${img(id, w)} ${w}w`).join(', ')

// Stock photography for the demo. Swap for the client's own farm, trucks and shop photos.
export const PHOTOS = {
  flock: '1589922583749-6b8473a85048',
  flockClose: '1630090374791-c9eb7bab3935',
  shed: '1589922585952-b31ed31b2c92',
  chicks: '1694854038360-56b29a16fb0c',
  chick: '1531155179084-3e1f15110922',
  truck: '1716512060259-d114cfba13e8',
  truckFront: '1681004478577-cb7f8421f78c',
  pickup: '1627019866926-b6030ff785fe',
  tempo: '1558957543-ab3e457707a6',
  wholeChicken: '1587593810167-a84920ea0781',
  breast: '1633096013004-e2cb4023b560',
  curry: '1708782344490-9026aaa5eec7',
  curryNaan: '1565557623262-b51c2513a641',
  butterChicken: '1603894584373-5ac82b2ae398',
}

// Today's rates shown on the site. In the live version these come from the rate the owner sets each morning.
export const RATES = [
  { id: 'live', name: { en: 'Live broiler', hi: 'ज़िंदा ब्रॉयलर' }, unit: { en: 'per kg live', hi: 'प्रति किलो ज़िंदा' }, price: 108, change: 2 },
  { id: 'curry', name: { en: 'Curry cut', hi: 'करी कट' }, unit: { en: 'per kg', hi: 'प्रति किलो' }, price: 240, change: 0 },
  { id: 'whole', name: { en: 'Whole dressed', hi: 'साबुत ड्रेस्ड' }, unit: { en: 'per kg', hi: 'प्रति किलो' }, price: 200, change: 0 },
  { id: 'boneless', name: { en: 'Boneless', hi: 'बोनलेस' }, unit: { en: 'per kg', hi: 'प्रति किलो' }, price: 360, change: -10 },
]

export const DISTRICTS = ['Jabalpur', 'Narsinghpur', 'Sagar', 'Seoni', 'Chhindwara', 'Narmadapuram']
