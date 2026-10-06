import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Sparkles, CheckCircle2, PackageCheck, XCircle, IndianRupee, Users, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { inr, fmtDate } from '../lib/format'
import { PageHeader, StatusBadge, Th, Td } from './common'
import { Spinner } from '../components/ui'

export default function Dashboard() {
  const [d, setD] = useState(null)
  const nav = useNavigate()
  const load = async () => {
    setD(null)
    const [o, c] = await Promise.all([
      supabase.from('orders').select('id, order_number, customer_name, mobile, place, total_amount, status, created_at').order('created_at', { ascending: false }),
      supabase.from('customers').select('id', { count: 'exact', head: true }),
    ])
    setD({ orders: o.data || [], customers: c.count || 0 })
  }
  useEffect(() => { load() }, [])
  if (!d) return <Spinner />

  const by = (s) => d.orders.filter((o) => o.status === s).length
  const value = d.orders.filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + Number(o.total_amount), 0)
  const cards = [
    ['Total Orders', d.orders.length, ShoppingBag, 'from-navy-600 to-indigo-500', ''],
    ['New Orders', by('New'), Sparkles, 'from-sky-500 to-cyan-500', 'New'],
    ['Confirmed', by('Confirmed'), CheckCircle2, 'from-indigo-500 to-violet-500', 'Confirmed'],
    ['Completed', by('Completed'), PackageCheck, 'from-emerald-500 to-teal-500', 'Completed'],
    ['Cancelled', by('Cancelled'), XCircle, 'from-rose-500 to-red-500', 'Cancelled'],
    ['Total Order Value', inr(value), IndianRupee, 'from-saffron-500 to-festive-red', null],
    ['Total Customers', d.customers, Users, 'from-amber-500 to-yellow-500', null],
  ]

  return (
    <div>
      <PageHeader title="Dashboard" sub="Diwali orders at a glance">
        <button onClick={load} className="btn-ghost btn-sm"><RefreshCw size={16} /> Refresh</button>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, val, Icon, grad, status]) => (
          <button key={label} onClick={() => label === 'Total Customers' ? nav('/admin/customers') : status !== null && nav(`/admin/orders${status ? `?status=${status}` : ''}`)} className={`card flex items-center gap-3 p-4 text-left ${status === null && label !== 'Total Customers' ? 'cursor-default' : 'hover:shadow-lift'}`}>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${grad} text-white`}><Icon size={20} /></span>
            <span className="min-w-0"><span className="block truncate text-xs font-semibold text-slate-500">{label}</span><span className="block truncate font-display text-2xl font-extrabold text-navy">{val}</span></span>
          </button>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3"><h2 className="text-xl font-bold text-navy">Recent Orders</h2><Link to="/admin/orders" className="text-sm font-semibold text-saffron-600">View all →</Link></div>
        {d.orders.length === 0 ? <p className="px-4 pb-6 text-sm text-slate-500">No orders yet. Share your website link to start receiving orders.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50"><tr><Th>Order ID</Th><Th>Customer</Th><Th>Phone</Th><Th>Place</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th>Date</Th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {d.orders.slice(0, 10).map((o) => (
                  <tr key={o.id} onClick={() => nav(`/admin/orders/${o.id}`)} className="cursor-pointer hover:bg-saffron-50/40">
                    <Td className="font-semibold text-navy">{o.order_number}</Td><Td>{o.customer_name}</Td><Td>{o.mobile}</Td><Td>{o.place}</Td>
                    <Td className="text-right font-semibold">{inr(o.total_amount)}</Td><Td><StatusBadge s={o.status} /></Td><Td className="whitespace-nowrap text-slate-500">{fmtDate(o.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
