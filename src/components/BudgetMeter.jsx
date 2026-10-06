import { useShop } from '../store/ShopContext'
import { inr } from '../lib/format'

export default function BudgetMeter({ large = false }) {
  const { budgetActive, budget, total, remaining } = useShop()
  if (!budgetActive) {
    return (
      <div className={`flex items-center justify-between ${large ? 'text-base' : 'text-sm'}`}>
        <span className="text-slate-600">No fixed budget</span>
        <span className="font-bold text-navy">Basket: {inr(total)}</span>
      </div>
    )
  }
  const pct = Math.min(100, Math.round((total / budget.amount) * 100))
  const over = remaining < 0
  const bar = over ? 'from-festive-red to-rose-500' : pct >= 90 ? 'from-saffron-500 to-festive-red' : 'from-festive-yellow to-saffron-500'
  return (
    <div>
      <div className={`flex items-end justify-between gap-2 ${large ? 'mb-2' : 'mb-1.5'}`}>
        <div>
          <div className={`font-display font-bold text-navy leading-none ${large ? 'text-2xl' : 'text-lg'}`}>
            {inr(total)} <span className="text-slate-400 font-semibold">/ {inr(budget.amount)}</span>
          </div>
          {large && <div className="mt-1 text-sm text-slate-600">{Math.round((total / budget.amount) * 100)}% budget filled</div>}
        </div>
        <div className={`text-right font-semibold ${large ? 'text-base' : 'text-sm'} ${over ? 'text-festive-red' : 'text-festive-green'}`}>
          {over ? <>Exceeded by {inr(-remaining)}</> : <>Remaining {inr(remaining)}</>}
        </div>
      </div>
      <div className={`relative w-full overflow-hidden rounded-full bg-navy-50 ${large ? 'h-4' : 'h-2.5'}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full bg-gradient-to-r ${bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
        {large && pct > 8 && <span className="absolute inset-y-0 flex items-center text-[10px] font-bold text-white" style={{ left: `calc(${pct}% - 2.2rem)` }}>{pct}%</span>}
      </div>
      {large && (
        <div className="mt-1.5 text-xs text-slate-500">
          {budget.mode === 'strict' ? 'Staying within your budget' : 'You can go above your budget'}
        </div>
      )}
    </div>
  )
}
