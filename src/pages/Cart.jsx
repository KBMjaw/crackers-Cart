import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ArrowRight, Gift, Sparkles } from 'lucide-react'
import { useShop } from '../store/ShopContext'
import { QtyStepper, Thumb, Empty } from '../components/ui'
import BudgetMeter from '../components/BudgetMeter'
import { inr } from '../lib/format'
import { computeFreebies, nextNudges } from '../lib/offers'

export function BudgetSummary() {
  const { total, savings, itemCount, budgetActive, budget, remaining } = useShop()
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between"><dt className="text-slate-600">{savings > 0 ? 'Selling Price Total' : 'Subtotal'}</dt><dd className="font-semibold">{inr(total + savings)}</dd></div>
      {savings > 0 && <div className="flex justify-between text-festive-green"><dt>Offer Savings</dt><dd className="font-semibold">− {inr(savings)}</dd></div>}
      <div className="flex justify-between"><dt className="text-slate-600">Total Items</dt><dd className="font-semibold">{itemCount}</dd></div>
      <div className="flex justify-between border-t border-dashed border-navy-100 pt-2 text-base"><dt className="font-bold text-navy">Total Amount</dt><dd className="font-display text-xl font-extrabold text-navy">{inr(total)}</dd></div>
      {budgetActive ? (
        <>
          <div className="flex justify-between"><dt className="text-slate-600">Your Budget</dt><dd className="font-semibold">{inr(budget.amount)}</dd></div>
          <div className={`flex justify-between font-bold ${remaining < 0 ? 'text-festive-red' : 'text-festive-green'}`}>
            <dt>{remaining < 0 ? 'Budget Exceeded By' : 'Remaining Budget'}</dt><dd>{inr(Math.abs(remaining))}</dd>
          </div>
        </>
      ) : <div className="flex justify-between"><dt className="text-slate-600">Budget</dt><dd className="text-slate-500">No fixed budget</dd></div>}
    </dl>
  )
}

export default function Cart() {
  const { cart, changeQty, removeItem, total, offers, products, settings, budgetActive } = useShop()
  const nav = useNavigate()
  const freebies = computeFreebies(cart, offers, products, total)
  const nudges = nextNudges(cart, offers, products, total)
  const minAmt = Number(settings?.min_order_amount || 0)
  const belowMin = total < minAmt

  if (!cart.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <Empty icon="🧺" title="Your basket is empty">
          <p>Add a gift box or some crackers to get started.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to="/shop/gift-boxes" className="btn-primary"><Gift size={18} /> Gift Boxes</Link>
            <Link to="/shop/crackers" className="btn-ghost"><Sparkles size={18} /> Crackers</Link>
          </div>
        </Empty>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-extrabold text-navy">Your Basket</h1>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {budgetActive && <div className="card p-4"><BudgetMeter large /></div>}
          <div className="card divide-y divide-navy-50">
            <div className="hidden grid-cols-[1fr_7rem_8rem_6rem_2.5rem] gap-3 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid">
              <span>Product</span><span className="text-right">Rate</span><span className="text-center">Quantity</span><span className="text-right">Subtotal</span><span />
            </div>
            {cart.map((i) => (
              <div key={i.key} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 p-4 sm:grid-cols-[3.5rem_1fr_7rem_8rem_6rem_2.5rem]">
                <Thumb src={i.image} icon={i.icon || (i.type === 'gift_box' ? '🎁' : i.type === 'combo' ? '🎊' : '🎇')} name={i.name} className="h-14 w-14 rounded-xl text-2xl" />
                <div className="min-w-0">
                  <div className="font-semibold leading-tight text-navy">{i.name}</div>
                  <div className="text-xs text-slate-500">{i.type === 'gift_box' ? 'Gift Box' : i.type === 'combo' ? 'Combo Offer' : i.unit}<span className="sm:hidden"> · {inr(i.price)}{i.mrp > i.price && <s className="ml-1 text-slate-400">{inr(i.mrp)}</s>}</span></div>
                  <div className="mt-2 flex items-center gap-3 sm:hidden">
                    <QtyStepper size="sm" value={i.qty} onDec={() => changeQty(i, -1)} onInc={() => changeQty(i, 1)} />
                  </div>
                </div>
                <div className="hidden text-right text-sm sm:block">{inr(i.price)}{i.mrp > i.price && <div className="text-xs text-slate-400 line-through">{inr(i.mrp)}</div>}</div>
                <div className="hidden justify-center sm:flex"><QtyStepper size="sm" value={i.qty} onDec={() => changeQty(i, -1)} onInc={() => changeQty(i, 1)} /></div>
                <div className="flex flex-col items-end gap-2 sm:contents">
                  <div className="text-right font-bold text-navy">{inr(i.price * i.qty)}</div>
                  <button onClick={() => removeItem(i.key)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-festive-red" aria-label={`Remove ${i.name}`}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>

          {freebies.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="font-display text-lg font-bold text-emerald-800">🎁 Complimentary with your order</div>
              <ul className="mt-1 space-y-1 text-sm text-emerald-900">
                {freebies.map((f, k) => <li key={k} className="flex justify-between"><span>{f.name} <span className="text-emerald-700">({f.offer.title})</span></span><span className="font-semibold">× {f.qty} · FREE</span></li>)}
              </ul>
            </div>
          )}
          {nudges.map((n, k) => <div key={k} className="rounded-xl bg-saffron-50 px-4 py-2.5 text-sm font-medium text-saffron-600">✨ {n}</div>)}
          <Link to="/shop/crackers" className="inline-block text-sm font-semibold text-saffron-600">+ Add more items</Link>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <h2 className="mb-3 text-xl font-bold text-navy">Summary</h2>
            <BudgetSummary />
            {belowMin && <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-sm text-amber-800">Minimum order amount is {inr(minAmt)}. Add {inr(minAmt - total)} more.</p>}
            <button disabled={belowMin} onClick={() => nav('/order/review')} className="btn-primary mt-4 w-full py-3.5 text-base">Review Order <ArrowRight size={18} /></button>
            <p className="mt-2 text-center text-xs text-slate-500">No payment now – we'll confirm on WhatsApp.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
