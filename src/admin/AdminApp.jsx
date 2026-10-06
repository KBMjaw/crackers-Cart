import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Package, FolderTree, Gift, Users, Tag, Quote, Settings as Cog, LogOut, Menu, X, ExternalLink, Lock, User } from 'lucide-react'
import { supabase, usernameToEmail } from '../lib/supabase'
import { Spinner } from '../components/ui'
import Dashboard from './Dashboard'
import Orders from './Orders'
import OrderDetail from './OrderDetail'
import Products from './Products'
import Categories from './Categories'
import GiftBoxes from './GiftBoxes'
import Customers from './Customers'
import Offers from './Offers'
import Quotes from './Quotes'
import Settings from './Settings'

const NAV = [
  ['', 'Dashboard', LayoutDashboard], ['orders', 'Orders', ShoppingBag], ['products', 'Products', Package],
  ['categories', 'Categories', FolderTree], ['gift-boxes', 'Gift Boxes', Gift], ['customers', 'Customers', Users],
  ['offers', 'Offers', Tag], ['quotes', 'Diwali Quotes', Quote], ['settings', 'Settings', Cog],
]

function Login({ onDone }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(u), password: p })
    setBusy(false)
    if (error) setErr('Invalid username or password')
    else onDone?.()
  }
  return (
    <div className="grid min-h-screen place-items-center bg-navy-900 px-4">
      <form onSubmit={submit} className="pop w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
        <img src="/logo.webp" alt="CrackersCart" className="mx-auto h-28 w-28 object-contain" />
        <h1 className="mt-1 text-center text-2xl font-extrabold text-navy">Admin Login</h1>
        <p className="text-center text-sm text-slate-500">Authorised staff only</p>
        <div className="mt-6 space-y-3">
          <div className="relative"><User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Username" autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} required /></div>
          <div className="relative"><Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" type="password" placeholder="Password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} required /></div>
        </div>
        {err && <p className="mt-3 rounded-lg bg-rose-50 p-2 text-center text-sm text-rose-700">{err}</p>}
        <button disabled={busy} className="btn-primary mt-5 w-full py-3">{busy ? 'Signing in…' : 'Sign in'}</button>
        <a href="/" className="mt-4 block text-center text-xs text-slate-500 hover:text-navy">← Back to website</a>
      </form>
    </div>
  )
}

export default function AdminApp() {
  const [state, setState] = useState({ loading: true, session: null, isAdmin: false })
  const [menu, setMenu] = useState(false)
  const nav = useNavigate()

  const check = async (session) => {
    if (!session) return setState({ loading: false, session: null, isAdmin: false })
    const { data } = await supabase.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle()
    setState({ loading: false, session, isAdmin: !!data })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => check(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { setTimeout(() => check(session), 0) })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (state.loading) return <Spinner />
  if (!state.session) return <Login />
  if (!state.isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div><h1 className="text-2xl font-bold text-navy">Not authorised</h1><p className="text-slate-600">This account does not have admin access.</p>
          <button className="btn-navy mt-4" onClick={() => supabase.auth.signOut()}>Sign out</button></div>
      </div>
    )
  }

  const logout = async () => { await supabase.auth.signOut(); nav('/admin') }
  const sidebar = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map(([to, label, Icon]) => (
        <NavLink key={to} end={to === ''} to={`/admin/${to}`} onClick={() => setMenu(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-saffron-500 text-white shadow' : 'text-navy-100 hover:bg-white/10'}`}>
          <Icon size={18} /> {label}
        </NavLink>
      ))}
      <a href="/" target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-100 hover:bg-white/10"><ExternalLink size={18} /> View website</a>
      <button onClick={logout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-navy-100 hover:bg-white/10"><LogOut size={18} /> Logout</button>
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 overflow-y-auto bg-navy-900 lg:block">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <img src="/logo.webp" alt="" className="h-10 w-10 rounded-lg bg-white object-contain" />
          <div className="font-display text-lg font-extrabold leading-none"><span className="text-white">Crackers</span><span className="text-saffron-400">Cart</span><div className="text-[11px] font-medium text-navy-100">Admin Panel</div></div>
        </div>
        {sidebar}
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy-900 px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2"><img src="/logo.webp" alt="" className="h-9 w-9 rounded-lg bg-white object-contain" /><span className="font-display text-lg font-extrabold">Admin</span></div>
        <button onClick={() => setMenu(true)} aria-label="Menu" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10"><Menu /></button>
      </header>
      {menu && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setMenu(false)}>
          <div className="pop h-full w-64 overflow-y-auto bg-navy-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end p-2"><button onClick={() => setMenu(false)} className="grid h-10 w-10 place-items-center text-white" aria-label="Close menu"><X /></button></div>
            {sidebar}
          </div>
        </div>
      )}
      <main className="mx-auto max-w-7xl p-4 lg:p-8">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="gift-boxes" element={<GiftBoxes />} />
          <Route path="customers" element={<Customers />} />
          <Route path="offers" element={<Offers />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  )
}
