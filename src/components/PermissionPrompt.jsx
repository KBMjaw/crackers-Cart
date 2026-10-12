import { useEffect, useState } from 'react'
import { Bell, MapPin, MessageCircle } from 'lucide-react'
import { Modal } from './ui'
import { storage } from '../lib/format'

const KEY = 'cc_permissions_v1'

export const getConsent = () => storage.get(KEY, null)

// Reverse-geocode to pre-fill town & pincode (OpenStreetMap, no key needed). Fails silently.
async function lookupPlace(lat, lon) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`, { headers: { Accept: 'application/json' } })
    const j = await r.json()
    const a = j.address || {}
    return {
      place: a.town || a.city || a.village || a.suburb || a.county || '',
      pincode: (a.postcode || '').replace(/\D/g, '').slice(0, 6),
    }
  } catch { return null }
}

/**
 * One single permission prompt for everything the site can use:
 * notifications (order updates), location (auto-fill town & pincode) and WhatsApp/phone contact consent.
 * Asked only once – the answer is remembered on this device.
 */
export default function PermissionPrompt() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (getConsent()) return
    const t = setTimeout(() => setOpen(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const decide = (allowed) => {
    storage.set(KEY, { allowed, at: Date.now() })
    setOpen(false)
    if (!allowed) return
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {}) } catch { /* ignore */ }
    try {
      navigator.geolocation?.getCurrentPosition(async (pos) => {
        const found = await lookupPlace(pos.coords.latitude, pos.coords.longitude)
        if (found) {
          storage.set('cc_geo', found)
          window.dispatchEvent(new CustomEvent('cc-geo', { detail: found }))
        }
      }, () => {}, { timeout: 10000, maximumAge: 600000 })
    } catch { /* ignore */ }
  }

  return (
    <Modal open={open} onClose={() => decide(false)}>
      <div className="text-center">
        <img src="/logo.webp" alt="" className="mx-auto -mt-2 h-20 w-20 rounded-2xl bg-white object-contain" />
        <h3 className="text-2xl font-bold text-navy">Allow required permissions to continue</h3>
        <p className="mt-1 text-sm text-slate-600">One-time permission for a faster, smoother order.</p>
      </div>
      <ul className="mt-5 space-y-3">
        <li className="flex gap-3 rounded-xl bg-navy-50/60 p-3">
          <Bell className="mt-0.5 shrink-0 text-saffron-600" size={20} />
          <div><p className="font-semibold text-navy">Notifications</p><p className="text-sm text-slate-600">Get a confirmation when your order is placed.</p></div>
        </li>
        <li className="flex gap-3 rounded-xl bg-navy-50/60 p-3">
          <MapPin className="mt-0.5 shrink-0 text-saffron-600" size={20} />
          <div><p className="font-semibold text-navy">Location</p><p className="text-sm text-slate-600">Auto-fill your town and pincode.</p></div>
        </li>
        <li className="flex gap-3 rounded-xl bg-navy-50/60 p-3">
          <MessageCircle className="mt-0.5 shrink-0 text-[#25D366]" size={20} />
          <div><p className="font-semibold text-navy">WhatsApp & phone contact</p><p className="text-sm text-slate-600">Let our team contact you about your order.</p></div>
        </li>
      </ul>
      <div className="mt-6 grid gap-2">
        <button className="btn-primary w-full py-3 text-base" onClick={() => decide(true)}>Allow All &amp; Continue</button>
        <button className="btn-ghost w-full py-3" onClick={() => decide(false)}>Not Now</button>
      </div>
    </Modal>
  )
}
