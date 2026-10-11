import { useState } from 'react'
import { ShoppingBasket, Plus } from 'lucide-react'
import { useShop } from '../store/ShopContext'
import { QtyStepper, Thumb } from './ui'
import { inr, STOCK, plural, salePrice, hasOffer, pctOff } from '../lib/format'

function PriceTag({ x, unit, big }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      <span className={`${big ? 'text-lg' : ''} font-extrabold text-navy`}>{inr(salePrice(x))}</span>
      {hasOffer(x) && <span className="text-xs text-slate-400 line-through">{inr(x.price)}</span>}
      {unit && <span className="text-xs text-slate-500">/ {unit}</span>}
      {hasOffer(x) && <span className="badge bg-emerald-50 text-emerald-700">{pctOff(x)}% off</span>}
    </span>
  )
}

function StockBadge({ s }) {
  const v = STOCK[s] || STOCK.in_stock
  return <span className={`badge ${v.cls}`}>{v.label}</span>
}

export function ProductCard({ p, category, compact = false }) {
  const { qtyOf, changeQty, fitsBudget } = useShop()
  const qty = qtyOf('product', p.id)
  const out = p.stock_status === 'out_of_stock'
  const price = salePrice(p)
  const item = { type: 'product', id: p.id, name: p.name, price, mrp: Number(p.price), unit: p.unit_type, image: p.image, icon: category?.icon }
  const tooMuch = !fitsBudget(price)

  if (compact) {
    return (
      <div className={`flex items-center gap-3 py-3 ${out ? 'opacity-60' : ''}`}>
        <Thumb src={p.image} icon={category?.icon} name={p.name} className="h-14 w-14 shrink-0 rounded-xl text-2xl" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-navy">{p.name}</div>
          <div className="text-sm text-slate-600"><PriceTag x={p} unit={p.unit_type} />{qty > 0 && <span className="ml-2 text-saffron-600">= {inr(price * qty)}</span>}</div>
          {tooMuch && qty === 0 && !out && <div className="text-[11px] font-semibold text-festive-red">Above remaining budget</div>}
        </div>
        {out ? <StockBadge s={p.stock_status} /> : qty > 0
          ? <QtyStepper size="sm" value={qty} onDec={() => changeQty(item, -1)} onInc={() => changeQty(item, 1)} />
          : <button onClick={() => changeQty(item, 1)} className="btn-ghost btn-sm"><Plus size={16} /> Add</button>}
      </div>
    )
  }

  return (
    <div className={`card flex flex-col overflow-hidden ${out ? 'opacity-70' : ''}`}>
      <div className="relative">
        <Thumb src={p.image} icon={category?.icon} name={p.name} className="aspect-[4/3] w-full" />
        {p.featured && <span className="badge absolute left-2 top-2 bg-festive-yellow text-navy-900">★ Popular</span>}
      </div>
      <div className="flex flex-1 flex-col p-3">
        {category && <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{category.name}</div>}
        <h3 className="font-display text-base font-bold leading-tight text-navy sm:text-lg">{p.name}</h3>
        {p.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 sm:text-sm">{p.description}</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div><PriceTag x={p} unit={p.unit_type} big /></div>
          <StockBadge s={p.stock_status} />
        </div>
        <div className="mt-auto pt-3">
          {out ? null : qty > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <QtyStepper value={qty} onDec={() => changeQty(item, -1)} onInc={() => changeQty(item, 1)} />
              <div className="text-right text-xs text-slate-500">Subtotal<div className="text-sm font-bold text-saffron-600">{inr(price * qty)}</div></div>
            </div>
          ) : (
            <button onClick={() => changeQty(item, 1)} className={`w-full ${tooMuch ? 'btn-ghost' : 'btn-navy'}`}>
              <ShoppingBasket size={16} /> {tooMuch ? 'Over budget' : 'Add to Basket'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function GiftBoxCard({ g }) {
  const { qtyOf, changeQty, fitsBudget } = useShop()
  const imgs = [g.image_1, g.image_2, g.image_3].filter(Boolean)
  const [idx, setIdx] = useState(0)
  const qty = qtyOf('gift_box', g.id)
  const out = g.stock_status === 'out_of_stock'
  const price = salePrice(g)
  const item = { type: 'gift_box', id: g.id, name: g.name, price, mrp: Number(g.price), unit: 'Box', image: g.image_1, icon: '🎁' }
  const tooMuch = !fitsBudget(price)

  return (
    <div className={`card flex flex-col overflow-hidden ${out ? 'opacity-70' : ''}`}>
      <div className="relative">
        {imgs.length ? (
          <div className="no-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto" onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
            {imgs.map((src, i) => <img key={i} src={src} alt={`${g.name} ${i + 1}`} loading="lazy" className="h-full w-full shrink-0 snap-center object-cover" />)}
          </div>
        ) : <Thumb icon="🎁" name={g.name} className="aspect-[4/3] w-full text-6xl" />}
        {imgs.length > 1 && <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">{imgs.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />)}</div>}
        <span className="absolute right-2 top-2 rounded-xl bg-white/95 px-2.5 py-1 text-right font-display shadow">{hasOffer(g) && <span className="block text-xs font-semibold leading-none text-slate-400 line-through">{inr(g.price)}</span>}<span className="text-lg font-extrabold text-saffron-600">{inr(price)}</span></span>
        {hasOffer(g) && <span className="badge absolute bottom-2 right-2 bg-festive-green text-white">{pctOff(g)}% OFF</span>}
        {g.featured && <span className="badge absolute left-2 top-2 bg-festive-yellow text-navy-900">★ Best seller</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl font-bold leading-tight text-navy">{g.name}</h3>
          <StockBadge s={g.stock_status} />
        </div>
        {g.description && <p className="mt-1 text-sm text-slate-600">{g.description}</p>}
        {g.gift_box_items?.length > 0 && (
          <div className="mt-3 rounded-xl bg-cream p-3">
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Includes</div>
            <ul className="space-y-1 text-sm">
              {g.gift_box_items.filter((i) => i.product).map((i, k) => (
                <li key={k} className="flex justify-between gap-2"><span className="text-navy-800">{i.product.name}</span><span className="whitespace-nowrap font-semibold text-navy">{plural(i.quantity, i.product.unit_type)}</span></li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-auto pt-4">
          {out ? null : qty > 0 ? (
            <div className="flex items-center justify-between">
              <QtyStepper value={qty} onDec={() => changeQty(item, -1)} onInc={() => changeQty(item, 1)} />
              <span className="font-bold text-saffron-600">{inr(price * qty)}</span>
            </div>
          ) : (
            <button onClick={() => changeQty(item, 1)} className={`w-full ${tooMuch ? 'btn-ghost' : 'btn-primary'}`}>
              <ShoppingBasket size={18} /> {tooMuch ? 'Above your budget' : 'Add to Basket'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ComboCard({ o, products }) {
  const { qtyOf, changeQty } = useShop()
  const byId = Object.fromEntries(products.map((p) => [p.id, p]))
  const items = (o.combo_items || []).map((c) => ({ ...c, p: byId[c.product_id] })).filter((c) => c.p)
  const worth = items.reduce((s, c) => s + salePrice(c.p) * c.quantity, 0)
  const qty = qtyOf('combo', o.id)
  const item = { type: 'combo', id: o.id, name: o.title, price: o.combo_price, unit: 'Combo', icon: '🎊' }
  return (
    <div className="card overflow-hidden border-2 border-saffron-100">
      <div className="flex items-center justify-between bg-gradient-to-r from-saffron-500 to-festive-red px-4 py-2 text-white">
        <span className="text-xs font-bold uppercase tracking-wider">Combo Offer</span>
        {worth > o.combo_price && <span className="text-xs font-semibold">Save {inr(worth - o.combo_price)}</span>}
      </div>
      <div className="p-4">
        <h3 className="font-display text-xl font-bold text-navy">{o.title}</h3>
        {o.description && <p className="text-sm text-slate-600">{o.description}</p>}
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((c) => <li key={c.product_id} className="flex justify-between"><span>{c.p.name}</span><span className="font-semibold">{plural(c.quantity, c.p.unit_type)}</span></li>)}
        </ul>
        <div className="mt-3 flex items-end justify-between">
          <div>{worth > o.combo_price && <div className="text-sm text-slate-400 line-through">{inr(worth)}</div>}<div className="font-display text-2xl font-extrabold text-saffron-600">{inr(o.combo_price)}</div></div>
          {qty > 0 ? <QtyStepper value={qty} onDec={() => changeQty(item, -1)} onInc={() => changeQty(item, 1)} />
            : <button onClick={() => changeQty(item, 1)} className="btn-primary"><ShoppingBasket size={16} /> Add Combo</button>}
        </div>
      </div>
    </div>
  )
}
