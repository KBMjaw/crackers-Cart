import { Link } from 'react-router-dom'
import { Gift, Sparkles, PackageOpen, ArrowRight, Phone, MessageCircle, Tag, Wallet, ClipboardCheck } from 'lucide-react'
import { useShop } from '../store/ShopContext'
import useStartOrder from '../hooks/useStartOrder'
import QuoteCard from '../components/QuoteCard'
import { Thumb, Spinner } from '../components/ui'
import { inr, waLink } from '../lib/format'

function Sparks() {
  const dots = [[8, 18, 'bg-festive-yellow'], [22, 70, 'bg-saffron-400'], [78, 22, 'bg-festive-yellow'], [90, 64, 'bg-rose-400'], [55, 12, 'bg-white'], [40, 85, 'bg-festive-yellow'], [68, 80, 'bg-white']]
  return dots.map(([x, y, c], i) => (
    <span key={i} className={`twinkle absolute h-1.5 w-1.5 rounded-full ${c}`} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.35}s` }} />
  ))
}

export default function Home() {
  const { settings, loading, giftBoxes, offers, error } = useShop()
  const start = useStartOrder()
  const open = settings?.orders_open !== false

  if (loading) return <Spinner label="Lighting up the shop…" />

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        {settings?.banner_url
          ? <img src={settings.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          : <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(247,148,29,.45),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(230,51,35,.35),transparent_50%)]" />}
        <Sparks />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pb-10 pt-8 md:grid-cols-[1.2fr_1fr] md:py-16">
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-festive-yellow ring-1 ring-white/15">🪔 Diwali {new Date().getFullYear()} orders</span>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] sm:text-5xl">
              Your Diwali.<br /><span className="text-festive-yellow">Your Choice.</span><br /><span className="text-saffron-400">Your Cart.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base text-navy-100 md:mx-0">
              {settings?.homepage_text || 'Pick a ready gift box or build your own Diwali box within your budget.'}
            </p>
            {open ? (
              <button onClick={() => start('/shop/gift-boxes')} className="btn-primary mt-6 px-7 py-3.5 text-lg shadow-lg shadow-saffron-500/30">
                Start Your Order <ArrowRight size={20} />
              </button>
            ) : (
              <div className="mt-6 rounded-2xl bg-white/10 p-4 text-left ring-1 ring-white/20">
                <p className="font-display text-xl font-bold text-festive-yellow">Orders are currently closed.</p>
                <p className="text-sm text-navy-100">Please contact us for more information.</p>
              </div>
            )}
            <div className="mt-5 flex items-center justify-center gap-4 text-xs text-navy-100 md:justify-start">
              <span className="flex items-center gap-1"><Wallet size={14} /> No online payment</span>
              <span className="flex items-center gap-1"><ClipboardCheck size={14} /> Order in 2 minutes</span>
            </div>
          </div>
          <div className="relative mx-auto w-56 sm:w-72 md:w-80">
            <div className="absolute inset-6 rounded-full bg-saffron-500/40 blur-3xl" />
            <img src={settings?.logo_url || '/logo.webp'} alt="CrackersCart" className="relative w-full rounded-[2rem] bg-white p-2 shadow-2xl" />
          </div>
        </div>
      </section>

      {error && <div className="mx-auto mt-4 max-w-6xl px-4"><div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Could not load the catalogue. Please refresh the page.</div></div>}

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="-mt-6 relative z-10 grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 text-center shadow-lift sm:gap-4 sm:p-4">
          {[['1', 'Your details'], ['2', 'Set budget'], ['3', 'Pick & confirm']].map(([n, l]) => (
            <div key={n} className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-saffron-50 text-sm font-bold text-saffron-600">{n}</span>
              <span className="text-xs font-semibold text-navy-800 sm:text-sm">{l}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-8"><QuoteCard place="home" /></section>

      {/* Three ways to shop */}
      <section className="mx-auto max-w-6xl px-4 pt-8">
        <h2 className="text-2xl font-bold text-navy">How would you like to shop?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { to: '/shop/gift-boxes', icon: Gift, t: 'Gift Boxes', d: 'Ready-made boxes from ₹500', c: 'from-saffron-500 to-festive-red' },
            { to: '/shop/crackers', icon: Sparkles, t: 'Individual Crackers', d: 'Choose each cracker you like', c: 'from-navy-600 to-indigo-500' },
            { to: '/shop/build', icon: PackageOpen, t: 'Build Your Own Box', d: 'Fill your box, watch the budget', c: 'from-emerald-500 to-teal-500' },
          ].map(({ to, icon: Icon, t, d, c }) => (
            <button key={to} disabled={!open} onClick={() => start(to)} className="card group flex items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60">
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${c} text-white shadow-md`}><Icon size={26} /></span>
              <span className="flex-1">
                <span className="block font-display text-lg font-bold text-navy">{t}</span>
                <span className="block text-sm text-slate-600">{d}</span>
              </span>
              <ArrowRight className="text-navy-600 transition group-hover:translate-x-1" size={20} />
            </button>
          ))}
        </div>
      </section>

      {/* Gift boxes preview */}
      {giftBoxes.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-navy">Popular Gift Boxes</h2>
            {open && <button onClick={() => start('/shop/gift-boxes')} className="text-sm font-semibold text-saffron-600">View all →</button>}
          </div>
          <div className="no-scrollbar -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {giftBoxes.slice(0, 8).map((g) => (
              <button key={g.id} disabled={!open} onClick={() => start('/shop/gift-boxes')} className="card w-52 shrink-0 snap-start overflow-hidden text-left">
                <Thumb src={g.image_1} icon="🎁" name={g.name} className="h-32 w-full" />
                <div className="p-3">
                  <div className="font-display font-bold leading-tight text-navy">{g.name}</div>
                  <div className="mt-1 text-lg font-extrabold text-saffron-600">{inr(g.price)}</div>
                  <div className="text-xs text-slate-500">{g.gift_box_items?.length || 0} varieties</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Offers */}
      {offers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-8">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-navy">Diwali Offers</h2>
            {open && <button onClick={() => start('/shop/offers')} className="text-sm font-semibold text-saffron-600">All offers →</button>}
          </div>
          <div className="no-scrollbar -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {offers.slice(0, 6).map((o) => (
              <div key={o.id} className="w-64 shrink-0 rounded-2xl border border-dashed border-saffron-400 bg-saffron-50 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-saffron-600"><Tag size={14} /> Offer</div>
                <div className="mt-1 font-display text-lg font-bold leading-tight text-navy">{o.title}</div>
                {o.description && <p className="mt-1 text-sm text-slate-600">{o.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      {(settings?.contact_number || settings?.whatsapp_number) && (
        <section className="mx-auto max-w-6xl px-4 pt-10">
          <div className="card flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h3 className="text-xl font-bold text-navy">Need help choosing?</h3>
              <p className="text-sm text-slate-600">Call or WhatsApp us – we're happy to help.</p>
            </div>
            <div className="flex gap-2">
              {settings.contact_number && <a href={`tel:${settings.contact_number}`} className="btn-ghost"><Phone size={18} /> Call</a>}
              {settings.whatsapp_number && <a href={waLink(settings.whatsapp_number, 'Hi, I would like to know more about your Diwali crackers.')} target="_blank" rel="noreferrer" className="btn-wa"><MessageCircle size={18} /> WhatsApp</a>}
            </div>
          </div>
        </section>
      )}

      {open && (
        <div className="mx-auto max-w-6xl px-4 pt-8 text-center">
          <Link to="/order/details" className="btn-navy px-6 py-3">Start Your Order <ArrowRight size={18} /></Link>
        </div>
      )}
    </div>
  )
}
