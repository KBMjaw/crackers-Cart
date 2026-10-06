import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useShop } from '../store/ShopContext'
import { Steps } from './Details'
import { inr } from '../lib/format'

const PRESETS = [500, 1000, 2000, 5000]

function Choice({ active, onClick, title, sub, emoji }) {
  return (
    <button type="button" onClick={onClick} className={`relative flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${active ? 'border-saffron-500 bg-saffron-50' : 'border-navy-50 bg-white hover:border-navy-100'}`}>
      {emoji && <span className="text-2xl">{emoji}</span>}
      <span className="flex-1"><span className="block font-display text-lg font-bold text-navy">{title}</span>{sub && <span className="block text-sm text-slate-600">{sub}</span>}</span>
      <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${active ? 'border-saffron-500 bg-saffron-500 text-white' : 'border-navy-100'}`}>{active && <Check size={14} />}</span>
    </button>
  )
}

export default function Budget() {
  const { budget, setBudget, customerReady } = useShop()
  const [has, setHas] = useState(budget.decided ? budget.has : null)
  const [amount, setAmount] = useState(budget.amount || '')
  const [custom, setCustom] = useState(budget.amount && !PRESETS.includes(budget.amount))
  const [mode, setMode] = useState(budget.mode || 'strict')
  const [params] = useSearchParams()
  const nav = useNavigate()
  const next = params.get('next') || '/shop/gift-boxes'

  useEffect(() => { if (!customerReady) nav(`/order/details?next=${encodeURIComponent(next)}`, { replace: true }) }, [customerReady]) // eslint-disable-line

  const valid = has === false || (has === true && Number(amount) >= 100)
  const go = () => {
    setBudget({ decided: true, has: !!has, amount: has ? Number(amount) : 0, mode })
    nav(next)
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Steps step={2} />
      <h1 className="text-3xl font-extrabold text-navy">Do you have a fixed budget?</h1>
      <p className="mt-1 text-slate-600">We'll show how much of your budget is filled as you shop.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Choice active={has === true} onClick={() => setHas(true)} title="Yes" emoji="💰" />
        <Choice active={has === false} onClick={() => setHas(false)} title="No" emoji="🎉" />
      </div>

      {has && (
        <div className="pop mt-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy">Enter your budget</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {PRESETS.map((p) => (
                <button key={p} type="button" onClick={() => { setAmount(p); setCustom(false) }} className={Number(amount) === p && !custom ? 'chip-on justify-center py-2.5' : 'chip-off justify-center py-2.5'}>{inr(p)}</button>
              ))}
              <button type="button" onClick={() => { setCustom(true); setAmount('') }} className={custom ? 'chip-on justify-center py-2.5' : 'chip-off justify-center py-2.5'}>Custom</button>
            </div>
            {custom && (
              <div className="mt-3 flex items-center">
                <span className="grid place-items-center self-stretch rounded-l-xl border border-r-0 border-navy-100 bg-navy-50 px-3 font-bold text-navy">₹</span>
                <input autoFocus className="input rounded-l-none text-lg font-bold" inputMode="numeric" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 7))} />
              </div>
            )}
            {custom && amount !== '' && Number(amount) < 100 && <p className="mt-1 text-sm text-festive-red">Minimum budget is ₹100</p>}
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy">Would you like to stay within your budget?</h2>
            <div className="mt-3 space-y-2">
              <Choice active={mode === 'strict'} onClick={() => setMode('strict')} title="Stay within my budget" sub="We'll only let you add items that fit." />
              <Choice active={mode === 'flexible'} onClick={() => setMode('flexible')} title="I can exceed my budget" sub="Keep adding – we'll show how much you're over." />
            </div>
          </div>
        </div>
      )}

      <button disabled={!valid} onClick={go} className="btn-primary mt-8 w-full py-3.5 text-base">Start Shopping <ArrowRight size={18} /></button>
    </div>
  )
}
