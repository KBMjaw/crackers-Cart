import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { Search, Gift, Sparkles, PackageOpen, Tag, SlidersHorizontal, X } from 'lucide-react'
import { useShop } from '../store/ShopContext'
import { ProductCard, GiftBoxCard, ComboCard } from '../components/Cards'
import BudgetMeter from '../components/BudgetMeter'
import QuoteCard from '../components/QuoteCard'
import { Empty, Spinner } from '../components/ui'
import { inr } from '../lib/format'
import { OFFER_TYPES } from '../lib/offers'

const TABS = [
  { id: 'gift-boxes', label: 'Gift Boxes', icon: Gift },
  { id: 'crackers', label: 'Crackers', icon: Sparkles },
  { id: 'build', label: 'Build Your Box', icon: PackageOpen },
  { id: 'offers', label: 'Offers', icon: Tag },
]
const RANGES = [
  { id: 'all', label: 'Any price', test: () => true },
  { id: 'lt500', label: 'Below ₹500', test: (p) => p < 500 },
  { id: '500-1000', label: '₹500–₹1,000', test: (p) => p >= 500 && p <= 1000 },
  { id: '1000-2000', label: '₹1,000–₹2,000', test: (p) => p > 1000 && p <= 2000 },
  { id: 'gt2000', label: 'Above ₹2,000', test: (p) => p > 2000 },
]

export default function Shop() {
  const { tab = 'gift-boxes' } = useParams()
  const nav = useNavigate()
  const { loading, settings, customerReady, budget, categories, products, giftBoxes, offers, cart } = useShop()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [range, setRange] = useState('all')
  const [avail, setAvail] = useState(false)
  const [popular, setPopular] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!customerReady) nav(`/order/details?next=/shop/${tab}`, { replace: true })
    else if (!budget.decided) nav(`/order/budget?next=/shop/${tab}`, { replace: true })
  }, [customerReady, budget.decided]) // eslint-disable-line

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])
  const rangeTest = RANGES.find((r) => r.id === range).test
  const text = q.trim().toLowerCase()

  const filteredProducts = useMemo(() => products.filter((p) =>
    (cat === 'all' || p.category_id === cat) &&
    rangeTest(Number(p.price)) &&
    (!avail || p.stock_status !== 'out_of_stock') &&
    (!popular || p.featured) &&
    (!text || p.name.toLowerCase().includes(text) || (p.description || '').toLowerCase().includes(text) || (catById[p.category_id]?.name || '').toLowerCase().includes(text))
  ), [products, cat, rangeTest, avail, popular, text, catById])

  const filteredBoxes = useMemo(() => giftBoxes.filter((g) =>
    rangeTest(Number(g.price)) && (!avail || g.stock_status !== 'out_of_stock') && (!popular || g.featured) &&
    (!text || g.name.toLowerCase().includes(text) || (g.description || '').toLowerCase().includes(text) ||
      g.gift_box_items?.some((i) => i.product?.name.toLowerCase().includes(text)))
  ), [giftBoxes, rangeTest, avail, popular, text])

  if (loading) return <Spinner />
  if (settings?.orders_open === false) {
    return <div className="mx-auto max-w-lg px-4 py-16"><Empty icon="🔒" title="Orders are currently closed.">Please contact us for more information.</Empty></div>
  }

  const activeFilters = (cat !== 'all') + (range !== 'all') + avail + popular
  const usedCats = categories.filter((c) => products.some((p) => p.category_id === c.id))
  const combos = offers.filter((o) => o.offer_type === 'combo')
  const otherOffers = offers.filter((o) => o.offer_type !== 'combo')

  const filterBar = tab !== 'offers' && (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-10" placeholder="Search crackers…" aria-label="Search crackers" />
          {q && <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400" aria-label="Clear search"><X size={16} /></button>}
        </div>
        <button onClick={() => setShowFilters((s) => !s)} className={`btn-ghost relative ${showFilters ? 'bg-navy-50' : ''}`} aria-label="Filters">
          <SlidersHorizontal size={18} /><span className="hidden sm:inline">Filters</span>
          {activeFilters > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-saffron-500 text-[11px] font-bold text-white">{activeFilters}</span>}
        </button>
      </div>
      {showFilters && (
        <div className="pop card space-y-3 p-3">
          <div>
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Price range</div>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              {RANGES.map((r) => <button key={r.id} onClick={() => setRange(r.id)} className={range === r.id ? 'chip-on' : 'chip-off'}>{r.label}</button>)}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setAvail(!avail)} className={avail ? 'chip-on' : 'chip-off'}>Available only</button>
            <button onClick={() => setPopular(!popular)} className={popular ? 'chip-on' : 'chip-off'}>★ Popular</button>
            {activeFilters > 0 && <button onClick={() => { setCat('all'); setRange('all'); setAvail(false); setPopular(false) }} className="chip border-transparent text-festive-red">Clear all</button>}
          </div>
        </div>
      )}
      {(tab === 'crackers' || tab === 'build') && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <button onClick={() => setCat('all')} className={cat === 'all' ? 'chip-on' : 'chip-off'}>All</button>
          {usedCats.map((c) => <button key={c.id} onClick={() => setCat(c.id)} className={cat === c.id ? 'chip-on' : 'chip-off'}>{c.icon} {c.name}</button>)}
        </div>
      )}
    </div>
  )

  const boxProducts = cart.filter((i) => i.type === 'product')

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      {/* Tabs */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <NavLink key={id} to={`/shop/${id}`} className={({ isActive }) => `flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${isActive ? 'bg-navy text-white shadow-md' : 'bg-white text-navy-800 shadow-card'}`}>
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </div>

      {tab === 'build' ? (
        <div className="sticky top-[60px] z-20 -mx-4 mt-3 border-b border-navy-50 bg-cream/95 px-4 py-3 backdrop-blur">
          <div className="card p-4">
            <div className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-navy">🧺 Your Budget Basket</div>
            <BudgetMeter large />
          </div>
        </div>
      ) : budget.has && (
        <div className="card mt-3 p-3"><BudgetMeter /></div>
      )}

      <div className="mt-4">{filterBar}</div>

      {tab === 'gift-boxes' && (
        <section className="mt-5">
          <h1 className="text-2xl font-extrabold text-navy">Gift Boxes</h1>
          <p className="text-sm text-slate-600">Ready-made Diwali boxes – just add to basket.</p>
          {filteredBoxes.length === 0 ? <div className="mt-4"><Empty icon="🎁" title="No gift boxes match">Try clearing filters.</Empty></div> : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredBoxes.map((g) => <GiftBoxCard key={g.id} g={g} />)}</div>
          )}
        </section>
      )}

      {tab === 'crackers' && (
        <section className="mt-5">
          <h1 className="text-2xl font-extrabold text-navy">Individual Crackers</h1>
          <p className="text-sm text-slate-600">{filteredProducts.length} items</p>
          {filteredProducts.length === 0 ? <div className="mt-4"><Empty icon="🎇" title="No crackers found">Try another search or category.</Empty></div> : (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{filteredProducts.map((p) => <ProductCard key={p.id} p={p} category={catById[p.category_id]} />)}</div>
          )}
        </section>
      )}

      {tab === 'build' && (
        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
          <div>
            <h1 className="text-2xl font-extrabold text-navy">Build Your Own Diwali Box</h1>
            <p className="text-sm text-slate-600">Pick crackers one by one and watch your budget basket fill.</p>
            {filteredProducts.length === 0 ? <div className="mt-4"><Empty icon="🎇" title="No crackers found" /></div> : (
              (cat === 'all' ? usedCats : usedCats.filter((c) => c.id === cat)).map((c) => {
                const list = filteredProducts.filter((p) => p.category_id === c.id)
                if (!list.length) return null
                return (
                  <div key={c.id} className="card mt-4 px-4 py-2">
                    <h2 className="flex items-center gap-2 border-b border-navy-50 py-2 font-display text-lg font-bold text-navy">{c.icon} {c.name}</h2>
                    <div className="divide-y divide-navy-50">{list.map((p) => <ProductCard key={p.id} p={p} category={c} compact />)}</div>
                  </div>
                )
              })
            )}
          </div>
          <aside className="lg:sticky lg:top-40 lg:self-start">
            <div className="card p-4">
              <h3 className="font-display text-lg font-bold text-navy">Your Diwali Box</h3>
              {boxProducts.length === 0 ? <p className="mt-2 text-sm text-slate-500">Nothing yet – add crackers from the list.</p> : (
                <ul className="mt-2 space-y-1.5 text-sm">
                  {boxProducts.map((i) => <li key={i.key} className="flex justify-between gap-2"><span>{i.name} <span className="text-slate-500">× {i.qty}</span></span><span className="font-semibold">{inr(i.price * i.qty)}</span></li>)}
                </ul>
              )}
            </div>
          </aside>
        </section>
      )}

      {tab === 'offers' && (
        <section className="mt-5 space-y-5">
          <h1 className="text-2xl font-extrabold text-navy">Diwali Offers</h1>
          <QuoteCard place="offers" />
          {offers.length === 0 && <Empty icon="🏷️" title="No offers right now">Check back soon!</Empty>}
          {combos.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{combos.map((o) => <ComboCard key={o.id} o={o} products={products} />)}</div>}
          {otherOffers.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {otherOffers.map((o) => (
                <div key={o.id} className="rounded-2xl border-2 border-dashed border-saffron-400 bg-saffron-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-saffron-600">{OFFER_TYPES[o.offer_type]?.label}</div>
                  <div className="mt-1 font-display text-xl font-bold text-navy">{o.title}</div>
                  {o.description && <p className="text-sm text-slate-700">{o.description}</p>}
                  {o.min_amount > 0 && <p className="mt-1 text-xs text-slate-500">On orders of {inr(o.min_amount)} and above</p>}
                  {o.valid_to && <p className="mt-1 text-xs text-slate-500">Valid till {new Date(o.valid_to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>}
                  <p className="mt-2 text-xs font-semibold text-festive-green">Applied automatically in your basket</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
