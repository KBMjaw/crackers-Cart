import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import { useShop } from '../store/ShopContext'
import { storage } from '../lib/format'

export function Steps({ step }) {
  const labels = ['Details', 'Budget', 'Shop', 'Confirm']
  return (
    <ol className="mb-6 flex items-center gap-1.5">
      {labels.map((l, i) => (
        <li key={l} className="flex flex-1 flex-col gap-1">
          <span className={`h-1.5 rounded-full ${i < step ? 'bg-saffron-500' : 'bg-navy-50'}`} />
          <span className={`text-[11px] font-semibold ${i < step ? 'text-saffron-600' : 'text-slate-400'}`}>{l}</span>
        </li>
      ))}
    </ol>
  )
}

export default function Details() {
  const { customer, setCustomer, settings } = useShop()
  const [f, setF] = useState(customer)
  const [errors, setErrors] = useState({})
  const [params] = useSearchParams()
  const nav = useNavigate()
  const next = params.get('next') || '/shop/gift-boxes'

  // Auto-fill town/pincode if the customer allowed location in the one-time permission prompt.
  useEffect(() => {
    const apply = (g) => g && setF((x) => ({ ...x, place: x.place || g.place, pincode: x.pincode || g.pincode }))
    apply(storage.get('cc_geo', null))
    const h = (e) => apply(e.detail)
    window.addEventListener('cc-geo', h)
    return () => window.removeEventListener('cc-geo', h)
  }, [])

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const digits = (v, n) => v.replace(/\D/g, '').slice(0, n)

  const submit = (e) => {
    e.preventDefault()
    const er = {}
    if (f.name.trim().length < 2) er.name = 'Please enter your name'
    if (!/^[6-9]\d{9}$/.test(f.mobile)) er.mobile = 'Enter a valid 10-digit mobile number'
    const wa = f.sameWa ? f.mobile : f.whatsapp
    if (!/^[6-9]\d{9}$/.test(wa)) er.whatsapp = 'Enter a valid 10-digit WhatsApp number'
    if (!f.place.trim()) er.place = 'Please enter your place / town'
    if (!/^\d{6}$/.test(f.pincode)) er.pincode = 'Enter a valid 6-digit pincode'
    const pins = (settings?.serviceable_pincodes || '').split(',').map((s) => s.trim()).filter(Boolean)
    if (!er.pincode && pins.length && !pins.includes(f.pincode)) er.pincode = 'Sorry, we do not deliver to this pincode yet. Please contact us.'
    setErrors(er)
    if (Object.keys(er).length) return
    setCustomer({ ...f, name: f.name.trim(), place: f.place.trim(), whatsapp: wa })
    nav(`/order/budget?next=${encodeURIComponent(next)}`)
  }

  const Err = ({ k }) => (errors[k] ? <p className="mt-1 text-sm text-festive-red">{errors[k]}</p> : null)

  if (settings?.orders_open === false) {
    return <div className="mx-auto max-w-lg px-4 py-16 text-center"><h2 className="text-2xl font-bold text-navy">Orders are currently closed.</h2><p className="text-slate-600">Please contact us for more information.</p></div>
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Steps step={1} />
      <h1 className="text-3xl font-extrabold text-navy">Your details</h1>
      <p className="mt-1 text-slate-600">So our team can confirm your order on WhatsApp or phone.</p>
      <form onSubmit={submit} className="card mt-5 space-y-4 p-5" noValidate>
        <div>
          <label className="label" htmlFor="name">Customer Name</label>
          <input id="name" className="input" autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Your full name" />
          <Err k="name" />
        </div>
        <div>
          <label className="label" htmlFor="mobile">Mobile Number</label>
          <div className="flex"><span className="grid place-items-center rounded-l-xl border border-r-0 border-navy-100 bg-navy-50 px-3 text-sm font-semibold text-navy">+91</span>
            <input id="mobile" className="input rounded-l-none" inputMode="numeric" autoComplete="tel-national" value={f.mobile} onChange={(e) => set('mobile', digits(e.target.value, 10))} placeholder="10-digit mobile" /></div>
          <Err k="mobile" />
        </div>
        <label className="flex items-center gap-2.5 text-sm font-medium text-navy-800">
          <input type="checkbox" className="h-5 w-5 accent-saffron-500" checked={f.sameWa} onChange={(e) => set('sameWa', e.target.checked)} />
          WhatsApp number same as mobile number
        </label>
        {!f.sameWa && (
          <div>
            <label className="label" htmlFor="wa">WhatsApp Number</label>
            <div className="flex"><span className="grid place-items-center rounded-l-xl border border-r-0 border-navy-100 bg-navy-50 px-3 text-sm font-semibold text-navy">+91</span>
              <input id="wa" className="input rounded-l-none" inputMode="numeric" value={f.whatsapp} onChange={(e) => set('whatsapp', digits(e.target.value, 10))} placeholder="10-digit WhatsApp" /></div>
            <Err k="whatsapp" />
          </div>
        )}
        <div className="grid grid-cols-[1fr_8rem] gap-3">
          <div>
            <label className="label" htmlFor="place">Place / Town</label>
            <input id="place" className="input" autoComplete="address-level2" value={f.place} onChange={(e) => set('place', e.target.value)} placeholder="e.g. Sivakasi" />
          </div>
          <div>
            <label className="label" htmlFor="pin">Pincode</label>
            <input id="pin" className="input" inputMode="numeric" autoComplete="postal-code" value={f.pincode} onChange={(e) => set('pincode', digits(e.target.value, 6))} placeholder="6 digits" />
          </div>
        </div>
        <Err k="place" /><Err k="pincode" />
        {storage.get('cc_geo', null) && <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} /> Town and pincode filled from your location – please check.</p>}
        <button type="submit" className="btn-primary w-full py-3.5 text-base">Continue <ArrowRight size={18} /></button>
      </form>
    </div>
  )
}
