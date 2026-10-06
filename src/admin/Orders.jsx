import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, RefreshCw, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { inr, fmtDate, ORDER_STATUSES, STATUS_CLS } from '../lib/format'
import { PageHeader, Th, Td } from './common'
import { Spinner, Empty } from '../components/ui'

export function StatusSelect({ value, onChange }) {
  return (
    <select value={value} onClick={(e) => e.stopPropagation()} onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border px-2 py-1 text-xs font-semibold outline-none ${STATUS_CLS[value]}`}>
      {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
    </select>
  )
}

export default function Orders() {
  const [rows, setRows] = useState(null)
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [minV, setMinV] = useState('')
  const [maxV, setMaxV] = useState('')
  const [loc, setLoc] = useState('')
  const status = params.get('status') || ''
  const nav = useNavigate()

  const load = async () => {
    setRows(null)
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setRows(data || [])
  }
  useEffect(() => { load() }, [])

  const setStatus = async (o, s) => {
    setRows((r) => r.map((x) => (x.id === o.id ? { ...x, status: s } : x)))
    await supabase.from('orders').update({ status: s, updated_at: new Date().toISOString() }).eq('id', o.id)
  }

  const list = useMemo(() => {
    if (!rows) return []
    const t = q.trim().toLowerCase()
    const l = loc.trim().toLowerCase()
    return rows.filter((o) =>
      (!status || o.status === status) &&
      (!t || [o.order_number, o.customer_name, o.mobile, o.whatsapp, o.pincode, o.place].some((v) => (v || '').toLowerCase().includes(t))) &&
      (!from || o.created_at.slice(0, 10) >= from) && (!to || o.created_at.slice(0, 10) <= to) &&
      (!minV || Number(o.total_amount) >= Number(minV)) && (!maxV || Number(o.total_amount) <= Number(maxV)) &&
      (!l || (o.place || '').toLowerCase().includes(l) || (o.pincode || '').includes(l)))
  }, [rows, q, status, from, to, minV, maxV, loc])

  const exportCsv = () => {
    const head = ['Order ID', 'Customer', 'Phone', 'WhatsApp', 'Place', 'Pincode', 'Budget', 'Amount', 'Date', 'Status']
    const lines = list.map((o) => [o.order_number, o.customer_name, o.mobile, o.whatsapp, o.place, o.pincode, o.customer_budget ?? '', o.total_amount, fmtDate(o.created_at), o.status].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }

  return (
    <div>
      <PageHeader title="Orders" sub={rows ? `${list.length} of ${rows.length} orders` : ''}>
        <button onClick={exportCsv} className="btn-ghost btn-sm"><Download size={16} /> Export</button>
        <button onClick={load} className="btn-ghost btn-sm"><RefreshCw size={16} /> Refresh</button>
      </PageHeader>

      <div className="card mb-4 space-y-3 p-3">
        <div className="relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search name, phone, order ID, pincode, place…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button onClick={() => setParams({})} className={!status ? 'chip-on' : 'chip-off'}>All</button>
          {ORDER_STATUSES.map((s) => <button key={s} onClick={() => setParams({ status: s })} className={status === s ? 'chip-on' : 'chip-off'}>{s} {rows && <span className="opacity-70">({rows.filter((o) => o.status === s).length})</span>}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <label className="text-xs font-semibold text-slate-500">From<input type="date" className="input mt-1 py-2" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="text-xs font-semibold text-slate-500">To<input type="date" className="input mt-1 py-2" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <label className="text-xs font-semibold text-slate-500">Min ₹<input inputMode="numeric" className="input mt-1 py-2" value={minV} onChange={(e) => setMinV(e.target.value.replace(/\D/g, ''))} /></label>
          <label className="text-xs font-semibold text-slate-500">Max ₹<input inputMode="numeric" className="input mt-1 py-2" value={maxV} onChange={(e) => setMaxV(e.target.value.replace(/\D/g, ''))} /></label>
          <label className="col-span-2 text-xs font-semibold text-slate-500 md:col-span-1">Location<input className="input mt-1 py-2" placeholder="Place / pincode" value={loc} onChange={(e) => setLoc(e.target.value)} /></label>
        </div>
      </div>

      {!rows ? <Spinner /> : list.length === 0 ? <Empty icon="📭" title="No orders found" /> : (
        <>
          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {list.map((o) => (
              <div key={o.id} onClick={() => nav(`/admin/orders/${o.id}`)} className="card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="font-bold text-navy">{o.order_number}</div><div className="text-sm">{o.customer_name} · {o.mobile}</div><div className="text-xs text-slate-500">{o.place} {o.pincode} · {fmtDate(o.created_at)}</div></div>
                  <div className="text-right"><div className="font-display text-lg font-extrabold text-navy">{inr(o.total_amount)}</div><StatusSelect value={o.status} onChange={(s) => setStatus(o, s)} /></div>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-slate-50"><tr><Th>Order ID</Th><Th>Customer</Th><Th>Phone</Th><Th>WhatsApp</Th><Th>Place</Th><Th>Pincode</Th><Th className="text-right">Budget</Th><Th className="text-right">Amount</Th><Th>Date</Th><Th>Status</Th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((o) => (
                  <tr key={o.id} onClick={() => nav(`/admin/orders/${o.id}`)} className="cursor-pointer hover:bg-saffron-50/40">
                    <Td className="font-semibold text-navy">{o.order_number}</Td><Td>{o.customer_name}</Td><Td>{o.mobile}</Td><Td>{o.whatsapp}</Td><Td>{o.place}</Td><Td>{o.pincode}</Td>
                    <Td className="text-right">{o.customer_budget ? inr(o.customer_budget) : '—'}</Td><Td className="text-right font-semibold">{inr(o.total_amount)}</Td>
                    <Td className="whitespace-nowrap text-slate-500">{fmtDate(o.created_at)}</Td><Td><StatusSelect value={o.status} onChange={(s) => setStatus(o, s)} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
