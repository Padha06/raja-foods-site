import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Egg, Wheat, Scale, Truck, Utensils, ShieldCheck, Droplets, Receipt, Plus, MapPin, TrendingUp, TrendingDown, Minus, Check, Navigation } from 'lucide-react'
import { useLang } from '../lang.jsx'
import { DISTRICTS, RATES, img, waLink } from '../config.js'
import { AUDIENCES, FAQ, JOURNEY, QUALITY, BUSINESSES } from '../content.js'
import { Reveal, SectionHead, WAIcon } from './Chrome.jsx'

const ICONS = { egg: Egg, wheat: Wheat, scale: Scale, truck: Truck, utensils: Utensils, shield: ShieldCheck, droplets: Droplets, receipt: Receipt }

export function RatesStrip() {
  const { tx, lang } = useLang()
  const date = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <section id="rates" className="grain relative bg-brand text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-4 px-4 py-6 sm:gap-8 sm:px-5 sm:py-9 md:grid-cols-[1fr_2.4fr] md:px-8">
        <div>
          <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-gold">
            <span className="relative flex size-2"><span className="absolute inset-0 animate-ping rounded-full bg-gold" /><span className="relative size-full rounded-full bg-gold" /></span>
            {tx({ en: "Today's rates", hi: 'आज के रेट' })}
          </p>
          <p className="mt-1 font-display text-[20px] font-bold leading-tight sm:mt-1.5 sm:text-[24px]">{date}</p>
          <p className="mt-0.5 text-[13px] text-white/65">{tx({ en: 'Updated 6:00 AM · bulk rates on call', hi: 'सुबह 6:00 बजे अपडेट · थोक रेट कॉल पर' })}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {RATES.map((r) => {
            const Icon = r.change > 0 ? TrendingUp : r.change < 0 ? TrendingDown : Minus
            return (
              <div key={r.id} className="rounded-2xl bg-white/[0.09] p-3 ring-1 ring-white/15 sm:p-4">
                <p className="text-[13px] font-semibold text-white/75">{tx(r.name)}</p>
                <p className="font-display text-[26px] font-extrabold leading-tight sm:text-[32px]">₹{r.price}</p>
                <p className="flex items-center gap-1 text-[12px] text-white/60">
                  <Icon className={`size-3.5 ${r.change > 0 ? 'text-gold' : ''}`} />
                  {tx(r.unit)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function Journey() {
  const { tx } = useLang()
  return (
    <section id="journey" className="grain relative overflow-hidden bg-night py-12 text-white sm:py-20 lg:py-28">
      <img src={img('1694854038360-56b29a16fb0c', 1600, 60)} alt="" className="absolute inset-0 size-full object-cover opacity-[0.12]" loading="lazy" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
        <SectionHead light center kicker={{ en: 'Farm to plate', hi: 'फ़ार्म से थाली' }} title={{ en: 'Five steps. One family watching every one.', hi: 'पाँच कदम। हर कदम पर परिवार की नज़र।' }} sub={{ en: 'Because we own the farm, the trucks and the shop, nothing is handed to a stranger along the way.', hi: 'फ़ार्म, गाड़ियाँ और दुकान सब हमारी हैं, इसलिए रास्ते में कुछ भी किसी अनजान के हाथ नहीं जाता।' }} />
        {/* vertical timeline on phones, five across from md */}
        <div className="relative mt-9 grid gap-6 sm:mt-16 md:grid-cols-5 md:gap-5">
          <div className="absolute bottom-6 left-7 top-6 w-px bg-gradient-to-b from-gold/0 via-gold/60 to-gold/0 md:bottom-auto md:left-[10%] md:right-[10%] md:top-8 md:h-px md:w-auto md:bg-gradient-to-r" />
          {JOURNEY.map((s, i) => {
            const Icon = ICONS[s.icon]
            return (
              <Reveal key={i} delay={i * 0.1} className="relative flex gap-4 md:block md:text-center">
                <div className="grid size-14 shrink-0 place-items-center rounded-full bg-gold text-night shadow-[0_0_0_6px_rgb(31_20_16),0_0_30px_rgb(227_163_47/0.45)] md:mx-auto md:size-16 md:shadow-[0_0_0_8px_rgb(31_20_16),0_0_40px_rgb(227_163_47/0.45)]">
                  <Icon className="size-6 md:size-7" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-gold md:mt-5">0{i + 1}</p>
                  <p className="font-display text-[18px] font-bold leading-tight md:mt-1 md:text-[19px]">{tx(s.title)}</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-white/60 md:mt-2">{tx(s.text)}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function Audiences() {
  const { tx } = useLang()
  const [active, setActive] = useState(AUDIENCES[0].id)
  const a = AUDIENCES.find((x) => x.id === active)
  const biz = BUSINESSES.find((b) => b.id === a.unit)
  return (
    <section className="py-12 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
        <SectionHead kicker={{ en: 'Who we supply', hi: 'हम किसे सप्लाई करते हैं' }} title={{ en: 'Whatever you run, we have a way to serve it.', hi: 'आपका काम जो भी हो, हमारे पास उसका तरीका है।' }} />
        <div className="mt-6 grid grid-cols-2 gap-1.5 rounded-3xl bg-cream p-1.5 ring-1 ring-line sm:mt-10 sm:inline-grid sm:grid-cols-4 sm:rounded-full sm:p-1">
          {AUDIENCES.map((x) => (
            <button key={x.id} onClick={() => setActive(x.id)} className={`relative min-h-11 rounded-full px-3 text-[13.5px] font-bold transition sm:px-5 sm:text-[14.5px] ${active === x.id ? 'text-white' : 'text-ink-2 hover:text-ink'}`}>
              {active === x.id && <motion.span layoutId="aud" className="absolute inset-0 rounded-full bg-brand" transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }} />}
              <span className="relative">{tx(x.label)}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }} className="mt-4 grid overflow-hidden rounded-3xl bg-white ring-1 ring-line sm:mt-6 sm:rounded-[32px] md:grid-cols-2">
            <img src={img(a.photo, 900)} alt={tx(a.label)} className="aspect-[16/10] size-full object-cover md:aspect-[4/3.4]" loading="lazy" />
            <div className="flex flex-col justify-center p-5 sm:p-10 lg:p-14">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: biz.color }}>{biz.brand}</p>
              <h3 className="mt-1.5 font-display text-[24px] font-extrabold leading-tight sm:mt-2 sm:text-[34px]">{tx(a.head)}</h3>
              <ul className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">
                {a.points.map((p) => (
                  <li key={p.en} className="flex gap-2.5 text-[15px] text-ink-2 sm:gap-3 sm:text-[16px]">
                    <Check className="mt-0.5 size-5 shrink-0 text-leaf" strokeWidth={3} />
                    {tx(p)}
                  </li>
                ))}
              </ul>
              <a href={waLink(`Namaste Raja Foods, I run a ${a.label.en.toLowerCase().replace(/s$/, '')} and would like to know your rates.`)} target="_blank" rel="noreferrer" className="mt-6 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-wa px-5 text-[14.5px] font-bold text-white hover:bg-wa-dark sm:mt-8">
                <WAIcon className="size-4" />
                {tx({ en: 'Get my rate', hi: 'मेरा रेट जानें' })}
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

export function Quality() {
  const { tx } = useLang()
  return (
    <section id="quality" className="bg-cream py-12 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
        <div className="grid items-end gap-6 sm:gap-10 md:grid-cols-[1fr_1.3fr]">
          <SectionHead kicker={{ en: 'Our promise', hi: 'हमारा वादा' }} title={{ en: 'Clean birds. Honest weight. Clear bills.', hi: 'साफ़ पक्षी। सही वज़न। साफ़ बिल।' }} />
          <Reveal className="relative overflow-hidden rounded-3xl sm:rounded-[28px]">
            <img src={img('1630090374791-c9eb7bab3935', 1000)} alt="Broilers in a clean shed" className="aspect-[16/8] w-full object-cover" loading="lazy" />
          </Reveal>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 md:grid-cols-4">
          {QUALITY.map((q, i) => {
            const Icon = ICONS[q.icon]
            return (
              <Reveal key={q.title.en} delay={i * 0.07} className="rounded-2xl bg-white p-4 ring-1 ring-line sm:rounded-3xl sm:p-7">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-l text-brand sm:size-12 sm:rounded-2xl">
                  <Icon className="size-5 sm:size-6" />
                </span>
                <p className="mt-3 font-display text-[16px] font-bold leading-tight sm:mt-5 sm:text-[20px]">{tx(q.title)}</p>
                <p className="mt-1.5 text-[13px] leading-snug text-muted sm:mt-2 sm:text-[14.5px] sm:leading-relaxed">{tx(q.text)}</p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function Areas() {
  const { tx } = useLang()
  // rough positions on a stylised map; the home town sits in the middle
  const spots = [[22, 30], [48, 17], [78, 30], [20, 70], [42, 85], [76, 74]]
  return (
    <section className="py-12 sm:py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-7 px-4 sm:gap-12 sm:px-5 md:grid-cols-2 md:px-8">
        <div>
          <SectionHead kicker={{ en: 'Where we deliver', hi: 'हम कहाँ पहुँचाते हैं' }} title={{ en: 'Six districts by truck. Our town by daily route.', hi: 'छह ज़िले ट्रक से। हमारा शहर रोज़ के रूट से।' }} sub={{ en: 'New district or route? Message us and we will plan a vehicle.', hi: 'नया ज़िला या रूट? मैसेज करें, हम गाड़ी प्लान करेंगे।' }} />
          <div className="mt-5 flex flex-wrap gap-2 sm:mt-8">
            {DISTRICTS.map((d) => (
              <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[14px] font-semibold ring-1 ring-line sm:px-4 sm:text-[14.5px]">
                <MapPin className="size-4 text-brand" />{d}
              </span>
            ))}
          </div>
        </div>
        <Reveal className="relative aspect-square overflow-hidden rounded-3xl bg-night sm:rounded-[36px]">
          <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
            {spots.map(([x, y], i) => (
              <motion.line key={i} x1="52" y1="50" x2={x} y2={y} stroke="#e3a32f" strokeWidth="0.5" strokeDasharray="1.5 1.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 + i * 0.12 }} />
            ))}
            <circle cx="52" cy="50" r="13" fill="#9b1c1c" opacity="0.25" />
            <circle cx="52" cy="50" r="8" fill="#9b1c1c" opacity="0.4" />
          </svg>
          {spots.map(([x, y], i) => (
            <span key={DISTRICTS[i]} className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-ink shadow sm:px-3 sm:text-[13px]" style={{ left: `${x}%`, top: `${y}%` }}>
              {DISTRICTS[i]}
            </span>
          ))}
          <span className="absolute left-[52%] top-[50%] grid -translate-x-1/2 -translate-y-1/2 place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-brand text-white ring-4 ring-gold sm:size-14"><Navigation className="size-5 sm:size-6" /></span>
            <span className="mt-1 rounded bg-gold px-2 text-[11px] font-extrabold text-night sm:mt-1.5 sm:text-[12px]">Raja Foods</span>
          </span>
        </Reveal>
      </div>
    </section>
  )
}

export function Faq() {
  const { tx } = useLang()
  const [open, setOpen] = useState(0)
  return (
    <section className="py-12 sm:py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:gap-12 sm:px-5 md:grid-cols-[1fr_1.6fr] md:px-8">
        <SectionHead kicker={{ en: 'Questions', hi: 'सवाल' }} title={{ en: 'Asked by buyers every week.', hi: 'जो खरीदार हर हफ़्ते पूछते हैं।' }} />
        <div className="divide-y divide-line border-y border-line">
          {FAQ.map((f, i) => (
            <div key={i}>
              <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex min-h-14 w-full items-center justify-between gap-3 py-3 text-left sm:py-5">
                <span className="font-display text-[16px] font-bold sm:text-[19px]">{tx(f.q)}</span>
                <Plus className={`size-5 shrink-0 text-brand transition ${open === i ? 'rotate-45' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-4 text-[15px] leading-relaxed text-muted sm:pb-5 sm:text-[15.5px]">
                    {tx(f.a)}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
