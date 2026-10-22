import { useEffect } from 'react'
import Lenis from 'lenis'
import { Nav, MobileBar, Footer, FloatingWA } from './components/Chrome.jsx'
import Hero from './components/Hero.jsx'
import Businesses from './components/Businesses.jsx'
import { RatesStrip, Journey, Audiences, Quality, Areas, Faq } from './components/Sections.jsx'
import Order from './components/Order.jsx'

export default function App() {
  useEffect(() => {
    // smooth wheel scrolling on desktop only; touch keeps native momentum
    if (window.matchMedia('(pointer: coarse)').matches) return
    const lenis = new Lenis({ duration: 1.05 })
    let id
    const raf = (t) => {
      lenis.raf(t)
      id = requestAnimationFrame(raf)
    }
    id = requestAnimationFrame(raf)
    const click = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a || a.getAttribute('href').length < 2) return
      e.preventDefault()
      lenis.scrollTo(a.getAttribute('href'), { offset: -70 })
    }
    document.addEventListener('click', click)
    return () => {
      cancelAnimationFrame(id)
      document.removeEventListener('click', click)
      lenis.destroy()
    }
  }, [])

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <RatesStrip />
        <Businesses />
        <Journey />
        <Audiences />
        <Quality />
        <Areas />
        <Order />
        <Faq />
      </main>
      <Footer />
      <FloatingWA />
      <MobileBar />
    </>
  )
}
