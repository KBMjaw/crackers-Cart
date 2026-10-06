import { Link, Navigate, useLocation } from 'react-router-dom'
import { Copy, MessageCircle, Home as HomeIcon } from 'lucide-react'
import { useState } from 'react'
import { useShop } from '../store/ShopContext'
import QuoteCard from '../components/QuoteCard'
import { inr, waLink } from '../lib/format'

export default function Success() {
  const { state } = useLocation()
  const { settings } = useShop()
  const [copied, setCopied] = useState(false)
  if (!state?.order_number) return <Navigate to="/" replace />

  const copy = async () => { try { await navigator.clipboard.writeText(state.order_number); setCopied(true) } catch { /* ignore */ } }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 text-center">
      <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-festive-yellow to-saffron-500 text-5xl shadow-lift">
        <span className="flame">🪔</span>
      </div>
      <h1 className="mt-5 text-3xl font-extrabold text-navy">Order Received Successfully</h1>
      <p className="mt-2 text-slate-600">Thank you for your order{state.name ? `, ${state.name.split(' ')[0]}` : ''}. Our team will contact you shortly through WhatsApp or phone.</p>

      <div className="card mt-6 p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Your Order ID</div>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="font-display text-3xl font-extrabold tracking-wide text-saffron-600">{state.order_number}</span>
          <button onClick={copy} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-navy-50" aria-label="Copy order ID"><Copy size={18} /></button>
        </div>
        {copied && <div className="text-xs text-festive-green">Copied!</div>}
        <div className="mt-3 text-sm text-slate-600">Order value: <b className="text-navy">{inr(state.total)}</b></div>
        {state.offers?.length > 0 && (
          <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-left text-sm text-emerald-800">
            <b>Offers applied:</b>
            <ul className="mt-1 list-inside list-disc">{state.offers.map((o, i) => <li key={i}>{o.text}</li>)}</ul>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">No payment has been collected. Please keep your Order ID for reference.</p>
      </div>

      <QuoteCard place="confirmation" className="mt-6" />

      <div className="mt-6 grid gap-2">
        {settings?.whatsapp_number && (
          <a className="btn-wa w-full py-3" target="_blank" rel="noreferrer" href={waLink(settings.whatsapp_number, `Hi, I just placed Diwali order ${state.order_number}.`)}>
            <MessageCircle size={18} /> Message us on WhatsApp
          </a>
        )}
        <Link to="/" className="btn-ghost w-full py-3"><HomeIcon size={18} /> Back to Home</Link>
      </div>
    </div>
  )
}
