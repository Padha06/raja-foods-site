import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from './store.jsx'
import Shell from './components/Shell.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Farm from './pages/Farm.jsx'
import District from './pages/District.jsx'
import Local from './pages/Local.jsx'
import Retail from './pages/Retail.jsx'
import Ledgers from './pages/Ledgers.jsx'
import Billing from './pages/Billing.jsx'
import Expenses from './pages/Expenses.jsx'
import Workers from './pages/Workers.jsx'
import Reports from './pages/Reports.jsx'
import Activity from './pages/Activity.jsx'
import Products from './pages/Products.jsx'

import { parseHash as parse } from './nav.js'

const PAGES = { dashboard: Dashboard, farm: Farm, district: District, local: Local, retail: Retail, ledgers: Ledgers, billing: Billing, expenses: Expenses, workers: Workers, reports: Reports, activity: Activity, products: Products }

export default function App() {
  const { user, can } = useStore()
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const f = () => {
      setRoute(parse())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])

  if (!user) return <Login />
  // a manager who follows a link to a module they can't open lands on their first allowed page
  const allowed = can(route.page) && PAGES[route.page]
  const first = user.modules === 'all' ? 'dashboard' : user.modules[0]
  const page = allowed ? route.page : first
  const Page = PAGES[page]

  return (
    <Shell page={page}>
      {!allowed && route.page !== first && <Denied page={route.page} />}
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <Page arg={route.arg} />
        </motion.div>
      </AnimatePresence>
    </Shell>
  )
}

function Denied({ page }) {
  return (
    <div className="mb-4 rounded-xl border border-crit/30 bg-crit-l px-4 py-2.5 text-xs font-medium text-crit-d sm:text-sm">
      Your role can't open “{page}”. The owner controls which modules and units each manager can see.
    </div>
  )
}
