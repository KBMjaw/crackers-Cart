import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MessageCircle, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { inr, fmtDay, fmtDate, waLink } from '../lib/format'
import { PageHeader, StatusBadge, Th, Td } from './common'
import { Spinner, Modal, Empty } from '../components/ui'

export default function Customers() {
  const [data, setData] = useState(null)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    (async () => {
      const [c, o] = await Promise.all([
        supabase.from('customers').select('*').order('updated_at', { ascending: false }),
        supabase.from('orders').select('id, customer_id, order_number, total_amount, status, created_at').order('created_at', { ascending: false }),
      ])
      const byC = {}
      ;(o.data || []).forEach((x) => { (byC[x.customer_id] ||= []).push(x) })
      setData((c.data || []).map((x) => {
        const orders = byC[x.id] || []
        return { ...x, orders, count: orders.length, value: orders.filter((y) => y.status !== 'Cancelled').reduce((s, y) => s + Number(y.total_amount), 0), last: orders[0]?.created_at }
      }))
    })()
  }, [])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (data || []).filter((c) => !t || [c.name, c.mobile, c.whatsapp, c.place, c.pincode].some((v) => (v || '').toLowerCase().includes(t)))
  }, [data, q])

  return (
    <div>
      <PageHeader title="Customers" sub={data ? `${data.length} customers` : ''} />
      <div className="card mb-4 p-3"><div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-10" placeholder="Search name, phone, place, pincode" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
      {!data ? <Spinner /> : list.length === 0 ? <Empty icon="👥" title="No customers yet" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50"><tr><Th>Name</Th><Th>Phone</Th><Th>WhatsApp</Th><Th>Place</Th><Th>Pincode</Th><Th className="text-center">Orders</Th><Th className="text-right">Total Value</Th><Th>Last Order</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((c) => (
                <tr key={c.id} onClick={() => setSel(c)} className="cursor-pointer hover:bg-saffron-50/40">
                  <Td className="font-semibold text-navy">{c.name}</Td><Td>{c.mobile}</Td><Td>{c.whatsapp}</Td><Td>{c.place}</Td><Td>{c.pincode}</Td>
                  <Td className="text-center">{c.count}</Td><Td className="text-right font-semibold">{inr(c.value)}</Td><Td className="text-slate-500">{fmtDay(c.last)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name}>
        {sel && (
          <div>
            <div className="text-sm text-slate-600">{sel.mobile} · {sel.place} {sel.pincode}</div>
            <div className="mt-3 flex gap-2">
              <a href={`tel:${sel.mobile}`} className="btn-ghost btn-sm"><Phone size={16} /> Call</a>
              <a href={waLink(sel.whatsapp || sel.mobile, `Hi ${sel.name},`)} target="_blank" rel="noreferrer" className="btn-wa btn-sm"><MessageCircle size={16} /> WhatsApp</a>
            </div>
            <h4 className="mt-4 font-display text-lg font-bold text-navy">Order history ({sel.count})</h4>
            <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {sel.orders.map((o) => (
                <button key={o.id} onClick={() => nav(`/admin/orders/${o.id}`)} className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-slate-50">
                  <div><div className="font-semibold text-navy">{o.order_number}</div><div className="text-xs text-slate-500">{fmtDate(o.created_at)}</div></div>
                  <div className="text-right"><div className="font-bold">{inr(o.total_amount)}</div><StatusBadge s={o.status} /></div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
