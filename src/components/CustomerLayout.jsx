import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ShoppingBasket, Phone, MessageCircle, CheckCircle2 } from 'lucide-react'
import { useShop } from '../store/ShopContext'
import { inr, waLink } from '../lib/format'
import BudgetModal from './BudgetModal'
import PermissionPrompt from './PermissionPrompt'
import BudgetMeter from './BudgetMeter'

export function Header() {
  const { itemCount, settings } = useShop()
  return (
    <header className="sticky top-0 z-40 border-b border-navy-50 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link to="/" className="flex items-center gap-2">
          <img src={settings?.logo_url || '/logo.webp'} alt={settings?.shop_name || 'Shanmuga Crackers'} className="h-11 w-11 rounded-xl bg-white object-contain" />
          <div className="leading-none">
            <div className="font-display text-xl font-extrabold"><span className="text-navy">Shanmuga</span> <span className="text-saffron-500">Crackers</span></div>
            <div className="hidden text-[11px] font-medium text-slate-500 sm:block">{settings?.tagline || 'சண்முகா பட்டாசுகள் & மத்தாப்புக்கள்'}</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {[['/shop/gift-boxes', 'Gift Boxes'], ['/shop/crackers', 'Crackers'], ['/shop/build', 'Build Your Box'], ['/shop/offers', 'Offers']].map(([to, l]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-navy-50 text-navy' : 'text-navy-800 hover:bg-navy-50'}`}>{l}</NavLink>
          ))}
        </nav>
        <Link to="/cart" className="relative grid h-11 w-11 place-items-center rounded-xl bg-navy text-white" aria-label="Basket">
          <ShoppingBasket size={22} />
          {itemCount > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-festive-red px-1 text-[11px] font-bold">{itemCount}</span>}
        </Link>
      </div>
    </header>
  )
}

export function Footer() {
  const { settings } = useShop()
  return (
    <footer className="mt-12 border-t border-navy-50 bg-navy text-navy-100">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3">
        <div>
          <div className="font-display text-2xl font-extrabold"><span className="text-white">Shanmuga</span> <span className="text-saffron-400">Crackers</span></div>
          <p className="mt-1 text-sm text-navy-100/80">{settings?.tagline || 'சண்முகா பட்டாசுகள் & மத்தாப்புக்கள்'}</p>
        </div>
        <div className="space-y-2 text-sm">
          {settings?.contact_number && <a href={`tel:${settings.contact_number}`} className="flex items-center gap-2 hover:text-white"><Phone size={16} /> {settings.contact_number}</a>}
          {settings?.whatsapp_number && <a href={waLink(settings.whatsapp_number, 'Hi, I have a query about Diwali crackers.')} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white"><MessageCircle size={16} /> WhatsApp us</a>}
          {settings?.address && <p className="whitespace-pre-line text-navy-100/80">{settings.address}</p>}
        </div>
        <div className="text-sm text-navy-100/80 sm:text-right">
          <p>Orders only – no online payment.</p>
          <p>Please follow safety guidelines while bursting crackers.</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs sm:flex-row">
          <span>© {new Date().getFullYear()} {settings?.shop_name || 'Shanmuga Crackers'}. All rights reserved.</span>
          <a href="https://cubecorpsol.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-saffron-400">
            A product by <span className="underline decoration-saffron-400 underline-offset-2">Cube CorpSol</span>
          </a>
        </div>
      </div>
    </footer>
  )
}

function BasketBar() {
  const { itemCount, total, budgetActive } = useShop()
  const loc = useLocation()
  const show = loc.pathname.startsWith('/shop') && itemCount > 0
  if (!show) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-50 bg-white/95 backdrop-blur safe-bottom">
      <div className="mx-auto max-w-6xl px-4 py-3">
        {budgetActive && <div className="mb-2"><BudgetMeter /></div>}
        <Link to="/cart" className="btn-primary w-full py-3 text-base">
          <ShoppingBasket size={20} /> View Basket · {itemCount} item{itemCount > 1 ? 's' : ''} · {inr(total)}
        </Link>
      </div>
    </div>
  )
}

function Toast() {
  const { toast } = useShop()
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center px-4">
      <div className="pop flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white shadow-lift">
        <CheckCircle2 size={16} className="text-festive-yellow" /> {toast}
      </div>
    </div>
  )
}

export default function CustomerLayout() {
  const loc = useLocation()
  const { itemCount } = useShop()
  const pad = loc.pathname.startsWith('/shop') && itemCount > 0
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <div className={pad ? 'bg-navy pb-36' : ''}><Footer /></div>
      <BasketBar />
      <BudgetModal />
      <Toast />
      <PermissionPrompt />
    </div>
  )
}
