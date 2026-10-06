import { useShop } from '../store/ShopContext'

export default function QuoteCard({ place = 'home', className = '' }) {
  const { quotes } = useShop()
  const field = { home: 'show_on_home', offers: 'show_on_offers', confirmation: 'show_on_confirmation' }[place]
  const list = (quotes || []).filter((q) => q[field])
  if (!list.length) return null
  const q = list[new Date().getDate() % list.length]
  return (
    <figure className={`relative overflow-hidden rounded-2xl border border-saffron-100 bg-gradient-to-br from-saffron-50 via-white to-amber-50 px-5 py-5 text-center ${className}`}>
      <span className="pointer-events-none absolute -left-2 -top-4 text-7xl text-saffron-100 font-display">“</span>
      <blockquote className={`relative text-lg font-semibold leading-relaxed text-navy-800 ${q.language === 'Tamil' ? "font-['Noto_Sans_Tamil']" : 'font-display text-xl'}`}>
        {q.text}
      </blockquote>
    </figure>
  )
}
