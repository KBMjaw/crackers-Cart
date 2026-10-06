import { useNavigate } from 'react-router-dom'
import { useShop } from '../store/ShopContext'

// Sends the customer through Details → Budget before shopping, remembering where they wanted to go.
export default function useStartOrder() {
  const nav = useNavigate()
  const { customerReady, budget } = useShop()
  return (next = '/shop/gift-boxes') => {
    if (!customerReady) return nav(`/order/details?next=${encodeURIComponent(next)}`)
    if (!budget.decided) return nav(`/order/budget?next=${encodeURIComponent(next)}`)
    nav(next)
  }
}
