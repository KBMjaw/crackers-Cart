import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { storage, salePrice } from '../lib/format'
import { isOfferLive } from '../lib/offers'

const ShopCtx = createContext(null)
export const useShop = () => useContext(ShopCtx)

const emptyCustomer = { name: '', mobile: '', whatsapp: '', sameWa: true, place: '', pincode: '' }
const emptyBudget = { decided: false, has: false, amount: 0, mode: 'strict' }

export function ShopProvider({ children }) {
  const [catalog, setCatalog] = useState({ loading: true, error: null, settings: null, categories: [], products: [], giftBoxes: [], offers: [], quotes: [] })
  const [customer, setCustomer] = useState(() => storage.get('cc_customer', emptyCustomer))
  const [budget, setBudget] = useState(() => storage.get('cc_budget', emptyBudget))
  const [cart, setCart] = useState(() => storage.get('cc_cart', []))
  const [budgetAlert, setBudgetAlert] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => storage.set('cc_customer', customer), [customer])
  useEffect(() => storage.set('cc_budget', budget), [budget])
  useEffect(() => storage.set('cc_cart', cart), [cart])

  const load = useCallback(async () => {
    setCatalog((c) => ({ ...c, loading: true, error: null }))
    const [s, c, p, g, o, q] = await Promise.all([
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('categories').select('*').eq('active', true).order('sort_order').order('name'),
      supabase.from('products').select('*').eq('active', true).order('display_order').order('name'),
      supabase.from('gift_boxes').select('*, gift_box_items(quantity, product:products(id,name,unit_type))').eq('active', true).order('display_order').order('price'),
      supabase.from('offers').select('*').eq('active', true).order('display_order'),
      supabase.from('quotes').select('*').eq('active', true).order('display_order'),
    ])
    const err = [s, c, p, g, o, q].find((r) => r.error)?.error
    setCatalog({
      loading: false,
      error: err ? err.message : null,
      settings: s.data || { shop_name: 'Shanmuga Crackers', orders_open: true, min_order_amount: 0, serviceable_pincodes: '' },
      categories: c.data || [],
      products: p.data || [],
      giftBoxes: g.data || [],
      offers: (o.data || []).filter(isOfferLive),
      quotes: q.data || [],
    })
  }, [])
  useEffect(() => { load() }, [load])

  // Drop basket lines that are no longer sold, and refresh prices from the live catalogue.
  useEffect(() => {
    if (catalog.loading || catalog.error) return
    setCart((prev) => prev.flatMap((i) => {
      const src = i.type === 'product' ? catalog.products.find((p) => p.id === i.id)
        : i.type === 'gift_box' ? catalog.giftBoxes.find((g) => g.id === i.id)
        : catalog.offers.find((o) => o.id === i.id && o.offer_type === 'combo')
      if (!src || src.stock_status === 'out_of_stock') return []
      const price = i.type === 'combo' ? Number(src.combo_price) : salePrice(src)
      const mrp = i.type === 'combo' ? price : Number(src.price)
      return [{ ...i, price, mrp }]
    }))
  }, [catalog.loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart])
  const savings = useMemo(() => cart.reduce((s, i) => s + Math.max(0, (i.mrp || i.price) - i.price) * i.qty, 0), [cart])
  const itemCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart])
  const qtyOf = useCallback((type, id) => cart.find((i) => i.key === `${type}:${id}`)?.qty || 0, [cart])

  const budgetActive = budget.has && budget.amount > 0
  const remaining = budgetActive ? budget.amount - total : null
  const fitsBudget = useCallback((price) => !(budgetActive && budget.mode === 'strict' && total + Number(price) > budget.amount), [budgetActive, budget, total])

  const changeQty = useCallback((item, delta) => {
    const key = `${item.type}:${item.id}`
    const existing = cart.find((i) => i.key === key)
    const cur = existing?.qty || 0
    const next = Math.max(0, Math.min(999, cur + delta))
    if (next === cur) return true
    const newTotal = total + (next - cur) * Number(item.price)
    if (delta > 0 && budgetActive && budget.mode === 'strict' && newTotal > budget.amount) {
      setBudgetAlert({ kind: 'blocked', needed: newTotal - budget.amount, item })
      return false
    }
    setCart((prev) => {
      if (next === 0) return prev.filter((i) => i.key !== key)
      if (existing) return prev.map((i) => (i.key === key ? { ...i, qty: next } : i))
      return [...prev, { key, type: item.type, id: item.id, name: item.name, price: Number(item.price), mrp: Number(item.mrp || item.price), unit: item.unit, image: item.image || null, icon: item.icon || null, qty: next }]
    })
    if (delta > 0 && budgetActive && total < budget.amount && newTotal >= budget.amount) {
      setBudgetAlert({ kind: newTotal > budget.amount ? 'over' : 'full' })
    }
    if (delta > 0 && cur === 0) setToast(`${item.name} added to basket`)
    return true
  }, [cart, total, budgetActive, budget])

  const removeItem = useCallback((key) => setCart((prev) => prev.filter((i) => i.key !== key)), [])
  const clearCart = useCallback(() => setCart([]), [])

  const resetOrder = useCallback(() => {
    setCart([])
    setBudget(emptyBudget)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(t)
  }, [toast])

  const customerReady = customer.name?.trim().length >= 2 && /^\d{10}$/.test(customer.mobile) && /^\d{6}$/.test(customer.pincode) && customer.place?.trim()

  const value = {
    ...catalog, reload: load,
    customer, setCustomer, customerReady,
    budget, setBudget, budgetActive, remaining, fitsBudget,
    cart, total, savings, itemCount, qtyOf, changeQty, removeItem, clearCart, resetOrder,
    budgetAlert, setBudgetAlert, toast, setToast,
  }
  return <ShopCtx.Provider value={value}>{children}</ShopCtx.Provider>
}
