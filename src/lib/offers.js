import { todayISO } from './format'

export const OFFER_TYPES = {
  combo: { label: 'Combo Offer', hint: 'Select multiple products and set a special combo price' },
  quantity: { label: 'Quantity Offer', hint: 'Buy X boxes, get Y boxes of the same product free' },
  product: { label: 'Product Offer', hint: 'Buy a product, get another product complimentary' },
  voucher: { label: 'Gift Voucher', hint: 'Give a voucher for orders above an amount' },
  min_purchase: { label: 'Minimum Purchase', hint: 'Shop above an amount and get a complimentary gift' },
}

export const isOfferLive = (o) => {
  if (!o?.active) return false
  const t = todayISO()
  if (o.valid_from && o.valid_from > t) return false
  if (o.valid_to && o.valid_to < t) return false
  return true
}

// Mirrors the server-side logic in place_order() so the basket shows freebies before submitting.
export function computeFreebies(cart, offers, products, total) {
  const paid = {}
  cart.filter((i) => i.type === 'product').forEach((i) => { paid[i.id] = (paid[i.id] || 0) + i.qty })
  const byId = Object.fromEntries((products || []).map((p) => [p.id, p]))
  const out = []
  ;(offers || []).filter(isOfferLive).forEach((o) => {
    if (o.offer_type === 'quantity' || o.offer_type === 'product') {
      const q = paid[o.buy_product_id] || 0
      if (o.buy_quantity > 0 && q >= o.buy_quantity) {
        const n = Math.floor(q / o.buy_quantity) * Math.max(o.free_quantity || 1, 1)
        const pid = o.offer_type === 'quantity' ? o.buy_product_id : (o.free_product_id || o.buy_product_id)
        const p = byId[pid]
        if (p) out.push({ offer: o, name: p.name, qty: n, unit: p.unit_type })
      }
    } else if (o.offer_type === 'voucher' || o.offer_type === 'min_purchase') {
      if (total >= Number(o.min_amount || 0)) out.push({ offer: o, name: o.reward_text || o.title, qty: 1, unit: o.offer_type === 'voucher' ? 'Voucher' : 'Gift' })
    }
  })
  return out
}

// Offers the customer is close to unlocking – used as gentle nudges in the basket.
export function nextNudges(cart, offers, products, total) {
  const paid = {}
  cart.filter((i) => i.type === 'product').forEach((i) => { paid[i.id] = (paid[i.id] || 0) + i.qty })
  const byId = Object.fromEntries((products || []).map((p) => [p.id, p]))
  const out = []
  ;(offers || []).filter(isOfferLive).forEach((o) => {
    if ((o.offer_type === 'quantity' || o.offer_type === 'product') && paid[o.buy_product_id]) {
      const q = paid[o.buy_product_id]
      const rem = o.buy_quantity - (q % o.buy_quantity)
      if (rem > 0 && rem < o.buy_quantity && byId[o.buy_product_id]) out.push(`Add ${rem} more ${byId[o.buy_product_id].name} to unlock “${o.title}”`)
    } else if ((o.offer_type === 'voucher' || o.offer_type === 'min_purchase') && total < o.min_amount && total >= o.min_amount * 0.6) {
      out.push(`Shop ₹${Math.ceil(o.min_amount - total).toLocaleString('en-IN')} more to get: ${o.reward_text || o.title}`)
    }
  })
  return out
}
