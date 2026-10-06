import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from './ui'
import { useShop } from '../store/ShopContext'
import { inr } from '../lib/format'

export default function BudgetModal() {
  const { budgetAlert, setBudgetAlert, budget, setBudget, total, changeQty } = useShop()
  const [raising, setRaising] = useState(false)
  const [custom, setCustom] = useState('')
  const nav = useNavigate()
  if (!budgetAlert) return null
  const close = () => { setBudgetAlert(null); setRaising(false); setCustom('') }

  const raiseTo = (amt) => {
    const a = Math.round(Number(amt))
    if (!a || a <= budget.amount) return
    setBudget({ ...budget, amount: a })
    const pending = budgetAlert.item
    close()
    if (pending && total + Number(pending.price) <= a) setTimeout(() => changeQty(pending, 1), 0)
  }
  const blocked = budgetAlert.kind === 'blocked'
  const suggestions = [500, 1000, 2000].map((x) => budget.amount + x)
  const minNeeded = blocked ? Math.ceil(budget.amount + budgetAlert.needed) : null

  return (
    <Modal open onClose={close}>
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-festive-yellow to-saffron-500 text-3xl shadow-md">🧺</div>
        <h3 className="text-2xl font-bold text-navy">Your {inr(budget.amount)} budget has been filled.</h3>
        <p className="mt-1 text-slate-600">
          {blocked
            ? <>Adding <b>{budgetAlert.item?.name}</b> needs {inr(budgetAlert.needed)} more than your budget.</>
            : <>Basket total is {inr(total)}.</>}
          {' '}Would you like to increase your budget?
        </p>
      </div>

      {raising ? (
        <div className="mt-5 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(minNeeded ? [minNeeded, ...suggestions.filter((s) => s > minNeeded)].slice(0, 3) : suggestions).map((s) => (
              <button key={s} onClick={() => raiseTo(s)} className="btn-ghost btn-sm">{inr(s)}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input" inputMode="numeric" placeholder="New budget amount" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} />
            <button className="btn-navy" onClick={() => raiseTo(custom)} disabled={!custom || Number(custom) <= budget.amount}>Set</button>
          </div>
          <button className="w-full text-sm text-slate-500 underline" onClick={() => { setBudget({ ...budget, mode: 'flexible' }); close() }}>
            Or let me go above my budget
          </button>
        </div>
      ) : (
        <div className="mt-5 grid gap-2">
          <button className="btn-primary w-full py-3" onClick={() => setRaising(true)}>Increase Budget</button>
          <button className="btn-ghost w-full py-3" onClick={close}>Continue Shopping</button>
          <button className="btn-navy w-full py-3" onClick={() => { close(); nav('/cart') }}>Complete Order</button>
        </div>
      )}
    </Modal>
  )
}
