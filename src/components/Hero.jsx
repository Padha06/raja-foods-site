import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { ArrowDown, TrendingUp, Truck, ShieldCheck } from 'lucide-react'
import { useLang } from '../lang.jsx'
import { PHOTOS, RATES, img, srcSet, waLink } from '../config.js'
import { BUSINESSES, STATS } from '../content.js'
import { WAIcon } from './Chrome.jsx'

function Count({ to, plain }) {
  const ref = useRef(null)
  const seen = useInView(ref, { once: true })
  const [n, setN] = useState(plain ? to : 0)
  useEffect(() => {
    if (!seen || plain) return
    let raf
    const t0 = performance.now()
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1400)
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [seen, to, plain])
  return <span ref={ref}>{plain ? to : n.toLocaleString('en-IN')}</span>
}

const fade = (d) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay: d, ease: [0.22, 1, 0.36, 1] } })

// Phones stack text above the photo collage so the copy stays readable; from md up it sits side by side
export default function Hero() {
  const { tx } = useLang()
  const live = RATES[0]
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-1/2 size-[420px] rounded-full bg-brand/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-8 pt-6 sm:px-5 sm:pb-14 sm:pt-12 md:grid-cols-[1.08fr_1fr] md:px-8 lg:gap-14 lg:pb-20 lg:pt-16">
        <div>
          <motion.div {...fade(0)} className="inline-flex items-center gap-2 rounded-full bg-gold-l px-3 py-1.5 text-[12px] font-bold text-gold-d ring-1 ring-gold/30 sm:text-[12.5px]">
            <span className="size-2 rounded-full bg-leaf" />
            {tx({ en: 'Fresh stock dispatched every morning', hi: 'हर सुबह ताज़ा माल रवाना' })}
          </motion.div>
          <motion.h1 {...fade(0.08)} className="mt-4 font-display text-[40px] font-extrabold leading-[0.98] tracking-tight text-ink sm:mt-5 sm:text-[52px] lg:text-[72px]">
            {tx({ en: 'From our farm', hi: 'हमारे फ़ार्म से' })}
            <br />
            {tx({ en: 'to your ', hi: 'आपकी ' })}
            <span className="relative inline-block text-brand">
              {tx({ en: 'plate.', hi: 'थाली तक।' })}
              <svg viewBox="0 0 200 18" className="absolute -bottom-1.5 left-0 w-full sm:-bottom-2" preserveAspectRatio="none" aria-hidden="true">
                <motion.path d="M3 13 C 50 3, 120 3, 197 10" fill="none" stroke="#e3a32f" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.6 }} />
              </svg>
            </span>
          </motion.h1>
          <motion.p {...fade(0.16)} className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:mt-6 sm:text-[17px] lg:text-[19px]">
            {tx({
              en: 'Raja Foods raises healthy broilers on its own farm and supplies them live to districts and chicken shops, and fresh-cut to hotels and homes through Raja Broilers.',
              hi: 'राजा फ़ूड्स अपने फ़ार्म पर स्वस्थ ब्रॉयलर पालता है और उन्हें ज़िलों व चिकन दुकानों को ज़िंदा, और राजा ब्रॉयलर्स के ज़रिए होटलों व घरों को ताज़ा कटा पहुँचाता है।',
            })}
          </motion.p>
          <motion.div {...fade(0.24)} className="mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
            <a href={waLink('Namaste Raja Foods, I would like to place an order.')} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-4 text-[14px] font-bold text-white shadow-[0_12px_28px_-10px_rgb(155_28_28/0.8)] transition hover:bg-brand-d sm:h-auto sm:px-6 sm:py-3.5 sm:text-[15.5px]">
              <WAIcon className="size-5" />
              {tx({ en: 'Order on WhatsApp', hi: 'WhatsApp ऑर्डर' })}
            </a>
            <a href="#businesses" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-4 text-[14px] font-bold text-ink ring-1 ring-line transition hover:ring-ink/30 sm:h-auto sm:px-6 sm:py-3.5 sm:text-[15.5px]">
              {tx({ en: 'Our 4 businesses', hi: 'हमारे 4 व्यवसाय' })}
              <ArrowDown className="size-4" />
            </a>
          </motion.div>
          <motion.div {...fade(0.32)} className="mt-5 flex flex-wrap gap-2 sm:mt-8">
            {BUSINESSES.map((b) => (
              <a key={b.id} href={`#biz-${b.id}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/70 px-3 text-[12.5px] font-semibold text-ink-2 ring-1 ring-line hover:bg-white sm:text-[13px]">
                <span className="size-2 rounded-full" style={{ background: b.color }} />
                {b.brand === 'Raja Foods' ? tx(b.title) : b.brand}
              </a>
            ))}
          </motion.div>
        </div>

        {/* photo collage */}
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="relative mx-2 sm:mx-0">
          <div className="grid grid-cols-[1.25fr_1fr] gap-2 sm:gap-3">
            <div className="row-span-2 overflow-hidden rounded-[22px] sm:rounded-[28px]">
              <img src={img(PHOTOS.flock, 900)} srcSet={srcSet(PHOTOS.flock, [400, 700, 1000])} sizes="(min-width:768px) 30vw, 60vw" alt="Healthy broilers on the Raja Foods farm" className="aspect-[3/4.4] size-full object-cover" fetchPriority="high" />
            </div>
            <div className="overflow-hidden rounded-[22px] sm:rounded-[28px]">
              <img src={img(PHOTOS.wholeChicken, 600)} alt="Fresh dressed chicken at Raja Broilers" className="aspect-square size-full object-cover" />
            </div>
            <div className="overflow-hidden rounded-[22px] sm:rounded-[28px]">
              <img src={img(PHOTOS.truck, 600)} alt="Wholesale truck loaded for dispatch" className="aspect-square size-full object-cover" />
            </div>
          </div>
          <motion.a href="#rates" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} className="absolute -left-3 top-[8%] animate-float rounded-2xl bg-white p-3 shadow-[0_18px_40px_-16px_rgb(31_20_16/0.45)] ring-1 ring-line sm:-left-8 sm:p-3.5">
            <p className="text-[11.5px] font-semibold text-muted">{tx({ en: "Today's live rate", hi: 'आज का ज़िंदा रेट' })}</p>
            <p className="font-display text-[24px] font-extrabold text-ink sm:text-[28px]">
              ₹{live.price}<span className="text-[13px] font-semibold text-muted sm:text-sm">/kg</span>
            </p>
            <p className="flex items-center gap-1 text-[11px] font-bold text-leaf"><TrendingUp className="size-3.5" />+₹{live.change} {tx({ en: 'since yesterday', hi: 'कल से' })}</p>
          </motion.a>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="absolute -bottom-4 right-2 flex items-center gap-2.5 rounded-2xl bg-night px-3 py-2.5 text-white shadow-xl sm:-bottom-5 sm:right-6 sm:gap-3 sm:px-4 sm:py-3">
            <span className="grid size-9 place-items-center rounded-xl bg-gold text-night"><Truck className="size-5" /></span>
            <span className="leading-tight">
              <span className="block text-[13px] font-bold sm:text-[14px]">{tx({ en: 'Hotels served before 8 AM', hi: 'होटल डिलीवरी सुबह 8 से पहले' })}</span>
              <span className="block text-[11.5px] text-white/60">{tx({ en: 'Daily routes · 6 districts', hi: 'रोज़ रूट · 6 ज़िले' })}</span>
            </span>
          </motion.div>
          <div className="absolute -right-2 top-4 grid size-10 place-items-center rounded-full bg-leaf text-white shadow-lg ring-4 ring-paper sm:-right-3 sm:top-5 sm:size-11">
            <ShieldCheck className="size-5 sm:size-6" />
          </div>
        </motion.div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-2 sm:px-5 sm:pb-14 md:px-8">
        <div className="grid grid-cols-2 gap-y-4 rounded-3xl bg-white/80 py-4 ring-1 ring-line sm:grid-cols-4 sm:divide-x sm:divide-line sm:py-6">
          {STATS.map((s) => (
            <div key={s.value} className="px-3 text-center sm:px-4">
              <p className="font-display text-[28px] font-extrabold tracking-tight text-ink sm:text-[40px]">
                <Count to={s.value} plain={s.plain} />
                <span className="text-brand">{s.suffix}</span>
              </p>
              <p className="text-[12.5px] font-medium leading-tight text-muted sm:mt-1 sm:text-[14px]">{tx(s.label)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
