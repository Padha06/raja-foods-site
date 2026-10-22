import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Phone, LayoutGrid, IndianRupee, ShoppingBag, LogIn, MapPin, Clock, Mail } from 'lucide-react'
import { useLang } from '../lang.jsx'
import { BRAND, telLink, waLink } from '../config.js'
import { NAV, BUSINESSES } from '../content.js'

export function Logo({ light }) {
  return (
    <a href="#top" className="flex items-center gap-2" aria-label="Raja Foods home">
      <svg viewBox="0 0 64 64" className="size-8 shrink-0 sm:size-10">
        <rect width="64" height="64" rx="16" fill="#9b1c1c" />
        <path d="M14 44V22l9 8 9-12 9 12 9-8v22z" fill="#e3a32f" />
        <rect x="14" y="46" width="36" height="5" rx="2" fill="#fdf1d8" />
      </svg>
      <span className="leading-none">
        <span className={`block font-display text-[17px] font-extrabold tracking-tight sm:text-[21px] ${light ? 'text-white' : 'text-ink'}`}>Raja Foods</span>
        <span className={`mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.18em] sm:block ${light ? 'text-white/55' : 'text-muted'}`}>Farm · Wholesale · Broilers</span>
      </span>
    </a>
  )
}

export function WAIcon({ className = 'size-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.39 9.39 0 0 1-1.44-5.01c0-5.2 4.23-9.42 9.43-9.42 2.52 0 4.88.98 6.66 2.76a9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.23 9.42-9.43 9.42m8.02-17.44A11.27 11.27 0 0 0 12.05.75C5.8.75.72 5.83.72 12.08c0 2 .52 3.95 1.52 5.66L.62 23.62l6.01-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.32-8.02" />
    </svg>
  )
}

export function LangToggle({ light, small }) {
  const { lang, setLang } = useLang()
  return (
    <div className={`flex rounded-full p-0.5 font-bold ${small ? 'text-[11px]' : 'text-[12.5px]'} ${light ? 'bg-white/10 ring-1 ring-white/15' : 'bg-cream ring-1 ring-line'}`} role="group" aria-label="Language">
      {[['en', 'EN'], ['hi', 'हिं']].map(([k, label]) => (
        <button key={k} onClick={() => setLang(k)} aria-pressed={lang === k} className={`rounded-full transition ${small ? 'min-h-8 px-3' : 'px-3 py-1.5'} ${lang === k ? 'bg-brand text-white' : light ? 'text-white/70 hover:text-white' : 'text-muted hover:text-ink'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}

export function Reveal({ children, delay = 0, className, y = 22 }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

export function SectionHead({ kicker, title, sub, light, center }) {
  const { tx } = useLang()
  return (
    <Reveal className={`max-w-3xl ${center ? 'mx-auto text-center' : ''}`}>
      <p className={`text-[12px] font-bold uppercase tracking-[0.18em] ${light ? 'text-gold' : 'text-brand'}`}>{tx(kicker)}</p>
      <h2 className={`mt-2 font-display text-[30px] font-extrabold leading-[1.05] tracking-tight sm:mt-2.5 sm:text-[40px] lg:text-[50px] ${light ? 'text-white' : 'text-ink'}`}>{tx(title)}</h2>
      {sub && <p className={`mt-3 text-[15px] leading-relaxed sm:mt-4 sm:text-[17px] ${light ? 'text-white/65' : 'text-muted'}`}>{tx(sub)}</p>}
    </Reveal>
  )
}

export function Nav() {
  const { tx } = useLang()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header id="top" className={`sticky top-0 z-40 bg-paper/90 backdrop-blur-xl transition-shadow ${scrolled ? 'shadow-[0_8px_28px_-14px_rgb(31_20_16/0.3)]' : ''}`}>
      <div className="mx-auto flex h-[56px] max-w-7xl items-center justify-between gap-3 px-3 sm:h-[74px] sm:px-5 md:px-8">
        <Logo />
        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="rounded-full px-3.5 py-2 text-[14.5px] font-semibold text-ink/75 transition hover:bg-cream hover:text-ink">
              {tx(n)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LangToggle small />
          <a href={BRAND.staffLogin} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[13.5px] font-semibold text-ink-2 ring-1 ring-line transition hover:bg-cream md:flex">
            <LogIn className="size-4" />
            {tx({ en: 'Staff login', hi: 'स्टाफ़ लॉगिन' })}
          </a>
          <a href={waLink('Namaste Raja Foods, I would like to place an order.')} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-[14px] font-bold text-white shadow-[0_8px_20px_-8px_rgb(155_28_28/0.7)] transition hover:bg-brand-d sm:flex">
            <WAIcon />
            {tx({ en: 'Order on WhatsApp', hi: 'WhatsApp पर ऑर्डर' })}
          </a>
        </div>
      </div>
    </header>
  )
}

// Phones get the section links in a bottom tab bar instead of the header
export function MobileBar() {
  const { tx } = useLang()
  const items = [
    { href: '#businesses', icon: LayoutGrid, label: { en: 'Businesses', hi: 'व्यवसाय' } },
    { href: '#rates', icon: IndianRupee, label: { en: 'Rates', hi: 'रेट' } },
    { href: '#order', icon: ShoppingBag, label: { en: 'Order', hi: 'ऑर्डर' }, main: true },
    { href: telLink, icon: Phone, label: { en: 'Call', hi: 'कॉल' } },
    { href: waLink('Namaste Raja Foods'), icon: WAIcon, label: { en: 'WhatsApp', hi: 'WhatsApp' }, ext: true },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-xl">
        {items.map((it) => (
          <a key={it.href} href={it.href} target={it.ext ? '_blank' : undefined} rel={it.ext ? 'noreferrer' : undefined} className={`flex min-h-14 flex-1 flex-col items-center justify-end gap-0.5 py-2 text-[11px] font-bold ${it.main ? 'text-brand' : it.ext ? 'text-wa' : 'text-ink-2'}`}>
            <span className={`grid place-items-center ${it.main ? '-mt-5 size-11 rounded-full bg-brand text-white shadow-lg ring-4 ring-paper' : 'size-6'}`}>
              <it.icon className="size-5" />
            </span>
            {tx(it.label)}
          </a>
        ))}
      </div>
    </nav>
  )
}

export function FloatingWA() {
  const { tx } = useLang()
  return (
    <a href={waLink('Namaste Raja Foods, I would like to place an order.')} target="_blank" rel="noreferrer" aria-label={tx({ en: 'Chat on WhatsApp', hi: 'WhatsApp पर बात करें' })} className="fixed bottom-6 right-6 z-40 hidden size-14 place-items-center rounded-full bg-wa text-white shadow-[0_12px_30px_-8px_rgb(18_140_94/0.7)] transition hover:scale-105 lg:grid">
      <span className="absolute inset-0 animate-ping rounded-full bg-wa/40 [animation-duration:2.6s]" />
      <WAIcon className="relative size-7" />
    </a>
  )
}

export function Footer() {
  const { tx } = useLang()
  return (
    <footer className="grain bg-night pb-24 text-white lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-14 md:px-8">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <Logo light />
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-white/60 sm:text-sm">{tx({ en: 'One family, four businesses: our farm, district wholesale, local live-bird routes and Raja Broilers.', hi: 'एक परिवार, चार व्यवसाय: हमारा फ़ार्म, ज़िला थोक, लोकल ज़िंदा पक्षी रूट और राजा ब्रॉयलर्स।' })}</p>
          </div>
          <div className="hidden sm:block">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">{tx({ en: 'Businesses', hi: 'व्यवसाय' })}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-white/70">
              {BUSINESSES.map((b) => (
                <li key={b.id}><a href={`#biz-${b.id}`} className="hover:text-white">{tx(b.title)}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">{tx({ en: 'Contact', hi: 'संपर्क' })}</p>
            <ul className="mt-3 space-y-2 text-[14px] text-white/70 sm:text-sm">
              <li><a href={telLink} className="flex min-h-9 items-center gap-2 hover:text-white"><Phone className="size-3.5" />{BRAND.phoneDisplay}</a></li>
              <li className="hidden items-center gap-2 sm:flex"><Mail className="size-3.5" />{BRAND.email}</li>
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0" />{tx(BRAND.address)}</li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">{tx({ en: 'Open', hi: 'समय' })}</p>
            <p className="mt-3 flex items-center gap-2 text-[14px] text-white/70 sm:text-sm"><Clock className="size-3.5" />{tx(BRAND.hours)}</p>
            <a href={BRAND.staffLogin} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-white/80 ring-1 ring-white/20 hover:bg-white/10">
              <LogIn className="size-3.5" />{tx({ en: 'Staff login', hi: 'स्टाफ़ लॉगिन' })}
            </a>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4 text-[12px] text-white/45 sm:mt-10 sm:text-xs">
          <span>© {new Date().getFullYear()} Raja Foods</span>
          <span>{tx({ en: 'Website by Pocco Locco Media', hi: 'वेबसाइट: पोक्को लोक्को मीडिया' })}</span>
        </div>
      </div>
    </footer>
  )
}
