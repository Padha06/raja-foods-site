import { Check, ArrowUpRight } from 'lucide-react'
import { useLang } from '../lang.jsx'
import { img, waLink } from '../config.js'
import { BUSINESSES } from '../content.js'
import { Reveal, SectionHead, WAIcon } from './Chrome.jsx'

export default function Businesses() {
  const { tx } = useLang()
  return (
    <section id="businesses" className="bg-cream py-12 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
        <SectionHead
          kicker={{ en: 'One family, four businesses', hi: 'एक परिवार, चार व्यवसाय' }}
          title={{ en: 'Every step of the chicken business, done by us.', hi: 'चिकन व्यवसाय का हर कदम, हमारे हाथों।' }}
          sub={{ en: 'From raising the birds to cutting them fresh for your kitchen, each part has its own team, and they all work as one.', hi: 'पक्षी पालने से लेकर आपकी रसोई के लिए ताज़ा काटने तक, हर हिस्से की अपनी टीम है, और सब मिलकर काम करते हैं।' }}
        />

        {/* overview: 2×2 on phones, four across from md */}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 md:grid-cols-4">
          {BUSINESSES.map((b, i) => (
            <Reveal key={b.id} delay={i * 0.06}>
              <a href={`#biz-${b.id}`} className="group relative block overflow-hidden rounded-2xl bg-night sm:rounded-3xl">
                <img src={img(b.photo, 600)} alt="" className="aspect-[3/4] w-full object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-90" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-night via-night/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
                  <span className="mb-1.5 inline-block h-1 w-6 rounded-full sm:mb-2 sm:w-8" style={{ background: b.color }} />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/65">{b.brand}</p>
                  <p className="font-display text-[16px] font-bold leading-tight text-white sm:text-[21px]">{tx(b.title)}</p>
                  <p className="mt-1 hidden text-[13px] text-white/65 sm:block">{tx(b.tag)}</p>
                </div>
                <span className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-white/90 text-ink transition group-hover:rotate-45 sm:right-3 sm:top-3 sm:size-9">
                  <ArrowUpRight className="size-4" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        {/* detail rows: photo above text on phones, alternating sides from md */}
        <div className="mt-14 space-y-16 sm:mt-20 sm:space-y-24">
          {BUSINESSES.map((b, i) => (
            <div key={b.id} id={`biz-${b.id}`} className="grid scroll-mt-24 items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-16">
              <Reveal className={`relative mr-3 md:mr-0 ${i % 2 ? 'md:order-2' : ''}`}>
                <div className="overflow-hidden rounded-3xl sm:rounded-[32px]">
                  <img src={img(b.photo, 1000)} alt={tx(b.title)} className="aspect-[4/3.4] w-full object-cover" loading="lazy" />
                </div>
                <div className={`absolute -bottom-5 w-[38%] overflow-hidden rounded-2xl ring-4 ring-cream sm:-bottom-8 sm:rounded-3xl sm:ring-[6px] ${i % 2 ? '-right-3 md:-left-6 md:right-auto' : '-right-3 sm:-right-6'}`}>
                  <img src={img(b.inset, 500)} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                </div>
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 font-display text-[12.5px] font-extrabold text-ink shadow sm:left-5 sm:top-5 sm:text-[13px]">
                  0{i + 1} · {b.brand}
                </span>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] sm:text-[12.5px]" style={{ color: b.color }}>
                  <span className="h-0.5 w-6 rounded-full" style={{ background: b.color }} />
                  {tx(b.tag)}
                </p>
                <h3 className="mt-2 font-display text-[30px] font-extrabold leading-[1.05] tracking-tight text-ink sm:mt-3 sm:text-[38px] lg:text-[46px]">{tx(b.title)}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted sm:mt-4 sm:text-[16.5px]">{tx(b.body)}</p>
                <ul className="mt-5 space-y-2.5 sm:mt-6">
                  {b.points.map((p) => (
                    <li key={p.en} className="flex items-start gap-2.5 text-[15px] font-medium text-ink-2 sm:text-[15.5px]">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-white" style={{ background: b.color }}>
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      {tx(p)}
                    </li>
                  ))}
                </ul>
                <a href={waLink(b.msg)} target="_blank" rel="noreferrer" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-5 text-[14.5px] font-bold text-white transition hover:bg-brand sm:mt-8">
                  <WAIcon className="size-4" />
                  {tx(b.cta)}
                </a>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
