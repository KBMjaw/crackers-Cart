import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Phone, Save, Trash2, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { inr, fmtDate, waLink, plural } from '../lib/format'
import { StatusSelect } from './Orders'
import { Spinner, Modal } from '../components/ui'

const DEFAULT_TEMPLATE = `Hi {name},

Thank you for your Diwali crackers order.

Order ID: {order_id}

Your selected items:
{items}

Total Order Value: ₹{total}

We have received your order successfully. Our team will contact you shortly regarding confirmation and collection/delivery.

Thank you.`

export function buildMessage(template, order, items, shop) {
  const lines = items.map((i) => `• ${i.name} × ${i.quantity}${Number(i.subtotal) ? ` – ₹${Number(i.subtotal).toLocaleString('en-IN')}` : ''}`).join('\n')
  return (template || DEFAULT_TEMPLATE)
    .replaceAll('{name}', order.customer_name || '')
    .replaceAll('{order_id}', order.order_number)
    .replaceAll('{items}', lines)
    .replaceAll('{total}', Number(order.total_amount).toLocaleString('en-IN'))
    .replaceAll('{shop}', shop || 'CrackersCart')
}

export default function OrderDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [o, setO] = useState(null)
  const [items, setItems] = useState([])
  const [settings, setSettings] = useState(null)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [wa, setWa] = useState(null)

  useEffect(() => {
    (async () => {
      const [a, b, s] = await Promise.all([
        supabase.from('orders').select('*').eq('id', id).maybeSingle(),
        supabase.from('order_items').select('*').eq('order_id', id),
        supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      ])
      setO(a.data || false); setItems(b.data || []); setSettings(s.data); setNotes(a.data?.admin_notes || '')
    })()
  }, [id])

  if (o === null) return <Spinner />
  if (o === false) return <p className="text-slate-600">Order not found. <Link to="/admin/orders" className="text-saffron-600">Back to orders</Link></p>

  const update = async (patch) => {
    setO((x) => ({ ...x, ...patch }))
    await supabase.from('orders').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  }
  const saveNotes = async () => { await update({ admin_notes: notes }); setSaved(true); setTimeout(() => setSaved(false), 1500) }
  const del = async () => {
    if (!window.confirm(`Delete order ${o.order_number}? This cannot be undone.`)) return
    await supabase.from('orders').delete().eq('id', id)
    nav('/admin/orders')
  }

  const groups = [
    ['Selected Gift Boxes', items.filter((i) => i.item_type === 'gift_box')],
    ['Combo Offers', items.filter((i) => i.item_type === 'combo')],
    ['Selected Individual Crackers', items.filter((i) => i.item_type === 'product')],
    ['Complimentary / Offers', items.filter((i) => i.item_type === 'free')],
  ].filter(([, l]) => l.length)

  const remaining = o.customer_budget ? Number(o.customer_budget) - Number(o.total_amount) : null
  const Row = ({ k, v }) => <div className="flex justify-between gap-3 py-1.5 text-sm"><span className="text-slate-500">{k}</span><span className="text-right font-semibold text-navy">{v || '—'}</span></div>

  return (
    <div>
      <button onClick={() => nav(-1)} className="mb-3 flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-navy print:hidden"><ArrowLeft size={16} /> Back</button>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">{o.order_number}</h1>
          <p className="text-sm text-slate-500">Placed {fmtDate(o.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <StatusSelect value={o.status} onChange={(s) => update({ status: s })} />
          <button onClick={() => setWa(buildMessage(settings?.whatsapp_template, o, items, settings?.shop_name))} className="btn-wa btn-sm"><MessageCircle size={16} /> Send WhatsApp Message</button>
          <a href={`tel:${o.mobile}`} className="btn-ghost btn-sm"><Phone size={16} /> Call</a>
          <button onClick={() => window.print()} className="btn-ghost btn-sm"><Printer size={16} /> Print</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {groups.map(([title, list]) => (
            <div key={title} className="card overflow-hidden">
              <h2 className="border-b border-slate-100 px-4 py-3 text-lg font-bold text-navy">{title}</h2>
              <div className="divide-y divide-slate-100">
                {list.map((i) => (
                  <div key={i.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <div><div className="font-semibold text-navy">{i.name}</div><div className="text-slate-500">{plural(i.quantity, i.unit_type)}{Number(i.price) > 0 && ` × ${inr(i.price)}`}{Number(i.mrp) > Number(i.price) && <s className="ml-1 text-slate-400">{inr(i.mrp)}</s>}</div></div>
                      <div className="font-bold text-navy">{Number(i.subtotal) > 0 ? inr(i.subtotal) : <span className="text-festive-green">FREE</span>}</div>
                    </div>
                    {Array.isArray(i.details) && i.details.length > 0 && (
                      <ul className="mt-1.5 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                        {i.details.map((d, k) => <li key={k}>• {d.name} – {plural(d.quantity * i.quantity, d.unit)}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="card p-4">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Total Items</span><b>{o.total_items}</b></div>
            <div className="mt-1 flex justify-between"><span className="font-bold text-navy">Total Amount</span><span className="font-display text-2xl font-extrabold text-navy">{inr(o.total_amount)}</span></div>
          </div>
          {o.customer_notes && <div className="card border-l-4 border-l-saffron-500 p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Customer note</div><p className="mt-1 text-sm">{o.customer_notes}</p></div>}
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="mb-1 text-lg font-bold text-navy">Customer Details</h2>
            <Row k="Name" v={o.customer_name} /><Row k="Phone" v={o.mobile} /><Row k="WhatsApp" v={o.whatsapp} /><Row k="Place" v={o.place} /><Row k="Pincode" v={o.pincode} />
          </div>
          <div className="card p-4">
            <h2 className="mb-1 text-lg font-bold text-navy">Budget</h2>
            <Row k="Budget type" v={{ none: 'No fixed budget', strict: 'Stay within budget', flexible: 'Can exceed budget' }[o.budget_type]} />
            {o.customer_budget && <Row k="Entered budget" v={inr(o.customer_budget)} />}
            <Row k="Order total" v={inr(o.total_amount)} />
            {remaining !== null && <Row k={remaining < 0 ? 'Exceeded by' : 'Remaining'} v={inr(Math.abs(remaining))} />}
          </div>
          <div className="card p-4 print:hidden">
            <h2 className="text-lg font-bold text-navy">Internal Notes</h2>
            <p className="mb-2 text-xs text-slate-500">Only visible to admins.</p>
            <textarea rows={4} className="input" placeholder="e.g. Customer asked for delivery after 6 PM." value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button onClick={saveNotes} className="btn-navy btn-sm mt-2"><Save size={16} /> {saved ? 'Saved ✓' : 'Save notes'}</button>
          </div>
          <button onClick={del} className="flex items-center gap-1 text-sm font-semibold text-rose-600 hover:underline print:hidden"><Trash2 size={14} /> Delete order</button>
        </div>
      </div>

      <Modal open={wa !== null} onClose={() => setWa(null)} title="WhatsApp Message">
        <p className="mb-2 text-sm text-slate-600">Edit the message if needed, then open WhatsApp to send it to <b>+91 {o.whatsapp || o.mobile}</b>.</p>
        <textarea rows={14} className="input font-mono text-sm" value={wa || ''} onChange={(e) => setWa(e.target.value)} />
        <a href={waLink(o.whatsapp || o.mobile, wa)} target="_blank" rel="noreferrer" onClick={() => { if (o.status === 'New') update({ status: 'Contacted' }); setWa(null) }} className="btn-wa mt-3 w-full py-3"><MessageCircle size={18} /> Open WhatsApp</a>
        {o.status === 'New' && <p className="mt-2 text-center text-xs text-slate-500">Status will change to “Contacted”.</p>}
      </Modal>
    </div>
  )
}
