import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Pencil, CheckCircle2 } from 'lucide-react'
import { useShop } from '../store/ShopContext'
import { supabase } from '../lib/supabase'
import { inr } from '../lib/format'
import { computeFreebies } from '../lib/offers'
import { BudgetSummary } from './Cart'
import { Steps } from './Details'

export default function Review() {
  const shop = useShop()
  const { customer, customerReady, cart, total, budget, offers, products, settings } = shop
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const nav = useNavigate()
  const freebies = computeFreebies(cart, offers, products, total)

  useEffect(() => {
    if (!customerReady) nav('/order/details?next=/order/review', { replace: true })
    else if (!cart.length) nav('/cart', { replace: true })
  }, []) // eslint-disable-line

  const confirm = async () => {
    setBusy(true); setErr('')
    const { data, error } = await supabase.rpc('place_order', {
      p_customer: { name: customer.name, mobile: customer.mobile, whatsapp: customer.whatsapp || customer.mobile, place: customer.place, pincode: customer.pincode },
      p_budget: { type: budget.has ? budget.mode : 'none', amount: budget.has ? budget.amount : null },
      p_items: cart.map((i) => ({ type: i.type, id: i.id, quantity: i.qty })),
      p_notes: notes,
    })
    setBusy(false)
    if (error) { setErr(error.message || 'Could not place the order. Please try again.'); return }
    const summary = { order_number: data.order_number, total: data.total, offers: data.offers, name: customer.name }
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Order Received Successfully 🪔', { body: `${data.order_number} · ${inr(data.total)} – we'll contact you shortly.`, icon: '/apple-touch-icon.png' })
      }
    } catch { /* ignore */ }
    shop.resetOrder()
    nav('/order/success', { replace: true, state: summary })
  }

  const Row = ({ k, v }) => <div className="flex justify-between gap-3 py-1"><span className="text-slate-600">{k}</span><span className="text-right font-semibold text-navy">{v}</span></div>

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Steps step={4} />
      <h1 className="text-3xl font-extrabold text-navy">Review Your Order</h1>

      <section className="card mt-5 p-5">
        <div className="mb-2 flex items-center justify-between"><h2 className="text-xl font-bold text-navy">Customer Details</h2><Link to="/order/details?next=/order/review" className="flex items-center gap-1 text-sm font-semibold text-saffron-600"><Pencil size={14} /> Edit</Link></div>
        <div className="text-sm">
          <Row k="Name" v={customer.name} />
          <Row k="Phone" v={`+91 ${customer.mobile}`} />
          <Row k="WhatsApp" v={`+91 ${customer.whatsapp || customer.mobile}`} />
          <Row k="Place" v={customer.place} />
          <Row k="Pincode" v={customer.pincode} />
        </div>
      </section>

      <section className="card mt-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5"><h2 className="text-xl font-bold text-navy">Order Details</h2><Link to="/cart" className="flex items-center gap-1 text-sm font-semibold text-saffron-600"><Pencil size={14} /> Edit</Link></div>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full text-sm">
            <thead className="bg-navy-50/60 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-2">Product</th><th className="px-2 py-2 text-center">Qty</th><th className="px-2 py-2 text-right">Price</th><th className="px-5 py-2 text-right">Subtotal</th></tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {cart.map((i) => (
                <tr key={i.key}><td className="px-5 py-2.5 font-medium text-navy">{i.name}{i.type !== 'product' && <span className="ml-1 text-xs text-slate-500">({i.type === 'gift_box' ? 'Gift Box' : 'Combo'})</span>}</td><td className="px-2 text-center">{i.qty}</td><td className="px-2 text-right">{inr(i.price)}</td><td className="px-5 text-right font-semibold">{inr(i.price * i.qty)}</td></tr>
              ))}
              {freebies.map((f, k) => (
                <tr key={`f${k}`} className="bg-emerald-50/60"><td className="px-5 py-2.5 text-emerald-800">{f.name} <span className="text-xs">(Complimentary)</span></td><td className="px-2 text-center">{f.qty}</td><td className="px-2 text-right text-emerald-700">FREE</td><td className="px-5 text-right text-emerald-700">₹0</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="mb-2 text-xl font-bold text-navy">Budget</h2>
        <BudgetSummary />
      </section>

      <section className="card mt-4 p-5">
        <label className="label" htmlFor="notes">Notes for our team (optional)</label>
        <textarea id="notes" rows={2} maxLength={500} className="input" placeholder="e.g. Please deliver after 6 PM" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </section>

      {err && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{err}</div>}
      {settings?.orders_open === false && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Orders are currently closed. Please contact us for more information.</div>}

      <button disabled={busy || settings?.orders_open === false} onClick={confirm} className="btn-primary mt-5 w-full py-4 text-lg">
        {busy ? 'Placing order…' : <><CheckCircle2 size={20} /> Confirm Order · {inr(total)}</>}
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">No payment is collected online. Our team will contact you to confirm.</p>
    </div>
  )
}
