export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

// Selling price (MRP) is `price`; when an Offer Price is set we sell at the offer price.
export const hasOffer = (x) => x?.offer_price != null && x.offer_price !== '' && Number(x.offer_price) > 0 && Number(x.offer_price) < Number(x.price)
export const salePrice = (x) => (x?.offer_price != null && x.offer_price !== '' && Number(x.offer_price) > 0 ? Number(x.offer_price) : Number(x?.price || 0))
export const pctOff = (x) => (hasOffer(x) ? Math.round((1 - Number(x.offer_price) / Number(x.price)) * 100) : 0)

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

export const fmtDay = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const todayISO = () => {
  const d = new Date(Date.now() + 5.5 * 3600 * 1000)
  return d.toISOString().slice(0, 10)
}

export const plural = (n, unit) => {
  if (!unit) return `${n}`
  if (n === 1) return `${n} ${unit}`
  const u = /x$|s$/i.test(unit) ? unit + 'es' : unit + 's'
  return `${n} ${u}`
}

export const STOCK = {
  in_stock: { label: 'Available', cls: 'bg-emerald-50 text-emerald-700' },
  low_stock: { label: 'Few left', cls: 'bg-amber-50 text-amber-700' },
  out_of_stock: { label: 'Out of stock', cls: 'bg-rose-50 text-rose-700' },
}

export const ORDER_STATUSES = ['New', 'Contacted', 'Confirmed', 'Packing', 'Ready', 'Completed', 'Cancelled']
export const STATUS_CLS = {
  New: 'bg-sky-50 text-sky-700 border-sky-200',
  Contacted: 'bg-violet-50 text-violet-700 border-violet-200',
  Confirmed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Packing: 'bg-amber-50 text-amber-700 border-amber-200',
  Ready: 'bg-teal-50 text-teal-700 border-teal-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

export const waLink = (number, text) => {
  let n = String(number || '').replace(/\D/g, '')
  if (n.length === 10) n = '91' + n
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export const storage = {
  get(k, fallback) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback } catch { return fallback }
  },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } },
  del(k) { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}
