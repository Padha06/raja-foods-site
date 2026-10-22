import { useState } from 'react'
import { Phone, MapPin, Clock, CheckCircle2, Store } from 'lucide-react'
import { useLang } from '../lang.jsx'
import { BRAND, telLink, waLink } from '../config.js'
import { BUSINESSES } from '../content.js'
import { Reveal, WAIcon } from './Chrome.jsx'

const WHO = [
  { id: 'trader', label: { en: 'Trader', hi: 'व्यापारी' }, biz: 'district', unit: 'birds' },
  { id: 'shop', label: { en: 'Chicken shop', hi: 'चिकन दुकान' }, biz: 'local', unit: 'birds' },
  { id: 'hotel', label: { en: 'Hotel', hi: 'होटल' }, biz: 'retail', unit: 'kg' },
  { id: 'home', label: { en: 'Home', hi: 'घर' }, biz: 'retail', unit: 'kg' },
]
const WHEN = [
  { id: 'today', en: 'Today', hi: 'आज' },
  { id: 'tomorrow', en: 'Tomorrow', hi: 'कल' },
  { id: 'daily', en: 'Daily', hi: 'रोज़' },
]

function Contact({ href, ext, icon, tone, label, value, extra }) {
  const Tag = href ? 'a' : 'div'
  return (
    <Tag href={href} target={ext ? '_blank' : undefined} rel={ext ? 'noreferrer' : undefined} className="flex min-h-14 items-center gap-3 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10 hover:bg-white/10 sm:p-4">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[12px] text-white/55">{label}</span>
        <span className="block text-[15px] font-bold sm:text-[17px]">{value}</span>
        {extra}
      </span>
    </Tag>
  )
}

export default function Order() {
  const { tx } = useLang()
  const [f, setF] = useState({ who: 'shop', name: '', phone: '', town: '', qty: '', when: 'tomorrow' })
  const [sent, setSent] = useState(null)
  const who = WHO.find((w) => w.id === f.who)
  const biz = BUSINESSES.find((b) => b.id === who.biz)
  const phoneOk = /^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, '').slice(-10))

  const submit = (e) => {
    e.preventDefault()
    if (!phoneOk) return
    const ref = `RF${Date.now().toString().slice(-6)}`
    const msg = [
      `Namaste ${biz.brand}, new order enquiry (${ref})`,
      `I am: ${who.label.en}`,
      `Name: ${f.name}`,
      `Phone: ${f.phone}`,
      `Town: ${f.town}`,
      `Quantity: ${f.qty} ${who.unit}`,
      `Needed: ${WHEN.find((w) => w.id === f.when).en}`,
    ].join('\n')
    window.open(waLink(msg), '_blank', 'noopener')
    setSent(ref)
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  // 16px inputs keep iOS from zooming into the field
  const input = 'h-12 w-full rounded-xl bg-white px-3.5 text-[16px] text-ink ring-1 ring-line outline-none transition focus:ring-2 focus:ring-brand sm:px-4 sm:text-[15px]'
  const label = 'mb-1.5 block text-[13.5px] font-bold text-ink-2'
  const chip = (on, dark) => `min-h-11 rounded-xl px-2 text-[14px] font-bold ring-1 transition sm:py-3 sm:text-[14.5px] ${on ? (dark ? 'bg-ink text-white ring-ink' : 'bg-brand text-white ring-brand') : 'bg-paper text-ink-2 ring-line hover:ring-ink/30'}`

  return (
    <section id="order" className="bg-cream py-12 sm:py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:gap-6 sm:px-5 md:grid-cols-[1fr_1.5fr] md:px-8">
        <Reveal className="grain flex flex-col justify-between rounded-3xl bg-night p-5 text-white sm:rounded-[32px] sm:p-10">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-gold">{tx({ en: 'Order & enquiry', hi: 'ऑर्डर और पूछताछ' })}</p>
            <h2 className="mt-2 font-display text-[28px] font-extrabold leading-[1.05] sm:mt-3 sm:text-[42px]">{tx({ en: 'Tell us what you need. We reply in minutes.', hi: 'बताइए क्या चाहिए। हम मिनटों में जवाब देंगे।' })}</h2>
          </div>
          <div className="mt-6 space-y-2.5 sm:mt-10 sm:space-y-3">
            <Contact href={telLink} icon={<Phone className="size-5" />} tone="bg-gold text-night" label={tx({ en: 'Call us', hi: 'कॉल करें' })} value={BRAND.phoneDisplay} />
            <Contact href={waLink('Namaste Raja Foods')} ext icon={<WAIcon className="size-5" />} tone="bg-wa text-white" label="WhatsApp" value={tx({ en: 'Chat with us', hi: 'बात करें' })} />
            <Contact
              icon={<Store className="size-5" />}
              tone="bg-brand text-white"
              label={tx({ en: 'Raja Broilers shop', hi: 'राजा ब्रॉयलर्स दुकान' })}
              value={<span className="flex items-center gap-1 text-[14px] font-semibold sm:text-[14.5px]"><MapPin className="size-3.5 shrink-0" />{tx(BRAND.address)}</span>}
              extra={<span className="flex items-center gap-1 text-[12.5px] text-white/55"><Clock className="size-3.5" />{tx(BRAND.hours)}</span>}
            />
          </div>
        </Reveal>

        <Reveal delay={0.1} className="rounded-3xl bg-white p-5 ring-1 ring-line sm:rounded-[32px] sm:p-10">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="size-14 text-leaf sm:size-16" />
              <p className="mt-4 font-display text-[24px] font-extrabold sm:text-[28px]">{tx({ en: 'Enquiry ready on WhatsApp', hi: 'पूछताछ WhatsApp पर तैयार' })}</p>
              <p className="mt-2 text-[15px] text-muted">{tx({ en: 'Reference', hi: 'संदर्भ' })} <b className="text-ink">{sent}</b>. {tx({ en: 'Press send in WhatsApp and our team will confirm the rate and time.', hi: 'WhatsApp में भेजें दबाएँ, हमारी टीम रेट और समय पक्का करेगी।' })}</p>
              <button onClick={() => setSent(null)} className="mt-5 min-h-11 px-4 text-[14px] font-bold text-brand">{tx({ en: 'Send another', hi: 'एक और भेजें' })}</button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className={label}>{tx({ en: 'I am ordering for a…', hi: 'मैं ऑर्डर कर रहा/रही हूँ…' })}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {WHO.map((w) => (
                    <button type="button" key={w.id} onClick={() => setF({ ...f, who: w.id })} aria-pressed={f.who === w.id} className={chip(f.who === w.id)}>
                      {tx(w.label)}
                    </button>
                  ))}
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted">
                  <span className="size-2 rounded-full" style={{ background: biz.color }} />
                  {tx({ en: 'Handled by', hi: 'संभालेगा' })} <b className="text-ink-2">{biz.brand}</b>
                </p>
              </div>
              <label>
                <span className={label}>{tx({ en: 'Name / business', hi: 'नाम / व्यवसाय' })}</span>
                <input required autoComplete="name" value={f.name} onChange={set('name')} className={input} />
              </label>
              <label>
                <span className={label}>{tx({ en: 'Mobile', hi: 'मोबाइल' })}</span>
                <input required type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} placeholder="98xxxxxxxx" className={`${input} ${f.phone && !phoneOk ? 'ring-2 ring-brand' : ''}`} />
                {f.phone && !phoneOk && <span className="mt-1 block text-[12.5px] text-brand">{tx({ en: 'Enter a 10-digit mobile number', hi: '10 अंकों का मोबाइल नंबर डालें' })}</span>}
              </label>
              <label>
                <span className={label}>{tx({ en: 'Town / district', hi: 'शहर / ज़िला' })}</span>
                <input required value={f.town} onChange={set('town')} className={input} />
              </label>
              <label>
                <span className={label}>{who.unit === 'birds' ? tx({ en: 'How many birds?', hi: 'कितने पक्षी?' }) : tx({ en: 'How many kg?', hi: 'कितने किलो?' })}</span>
                <input required inputMode="numeric" value={f.qty} onChange={set('qty')} placeholder={who.unit === 'birds' ? '100' : '10'} className={input} />
              </label>
              <div className="sm:col-span-2">
                <p className={label}>{tx({ en: 'When do you need it?', hi: 'कब चाहिए?' })}</p>
                <div className="grid grid-cols-3 gap-2">
                  {WHEN.map((w) => (
                    <button type="button" key={w.id} onClick={() => setF({ ...f, when: w.id })} aria-pressed={f.when === w.id} className={chip(f.when === w.id, true)}>
                      {tx(w)}
                    </button>
                  ))}
                </div>
              </div>
              <button className="mt-1 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-wa text-[16px] font-bold text-white shadow-[0_12px_28px_-12px_rgb(18_140_94/0.8)] transition hover:bg-wa-dark sm:col-span-2 sm:mt-2">
                <WAIcon className="size-5" />
                {tx({ en: 'Send enquiry on WhatsApp', hi: 'WhatsApp पर पूछताछ भेजें' })}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
