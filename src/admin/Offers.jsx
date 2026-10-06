import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { inr, fmtDay } from '../lib/format'
import { OFFER_TYPES, isOfferLive } from '../lib/offers'
import { PageHeader, Field } from './common'
import { Spinner, Modal, Toggle, Empty } from '../components/ui'

const blank = (type) => ({ offer_type: type, title: '', description: '', combo_items: [], combo_price: '', buy_product_id: '', buy_quantity: 5, free_product_id: '', free_quantity: 1, min_amount: '', reward_text: '', valid_from: '', valid_to: '', active: true, display_order: 0 })

export default function Offers() {
  const [rows, setRows] = useState(null)
  const [products, setProducts] = useState([])
  const [edit, setEdit] = useState(null)
  const [err, setErr] = useState('')
  const [pick, setPick] = useState('')

  const load = async () => {
    const [o, p] = await Promise.all([supabase.from('offers').select('*').order('display_order').order('created_at'), supabase.from('products').select('id,name,price,unit_type').order('name')])
    setRows(o.data || []); setProducts(p.data || [])
  }
  useEffect(() => { load() }, [])
  const pById = Object.fromEntries(products.map((p) => [p.id, p]))

  const summary = (o) => {
    switch (o.offer_type) {
      case 'combo': return `${(o.combo_items || []).map((c) => `${pById[c.product_id]?.name || '?'} ×${c.quantity}`).join(' + ')} for ${inr(o.combo_price)}`
      case 'quantity': return `Buy ${o.buy_quantity} ${pById[o.buy_product_id]?.name || '?'}, get ${o.free_quantity} free`
      case 'product': return `Buy ${o.buy_quantity} ${pById[o.buy_product_id]?.name || '?'}, get ${o.free_quantity} ${pById[o.free_product_id]?.name || '?'} free`
      default: return `Orders ≥ ${inr(o.min_amount)} → ${o.reward_text || o.title}`
    }
  }

  const save = async () => {
    setErr('')
    const e = edit
    if (!e.title.trim()) return setErr('Offer title is required')
    if (e.offer_type === 'combo' && (e.combo_items.length < 2 || !(Number(e.combo_price) > 0))) return setErr('Select at least 2 products and set a combo price')
    if ((e.offer_type === 'quantity' || e.offer_type === 'product') && (!e.buy_product_id || !(Number(e.buy_quantity) > 0) || !(Number(e.free_quantity) > 0))) return setErr('Select the product and quantities')
    if (e.offer_type === 'product' && !e.free_product_id) return setErr('Select the complimentary product')
    if ((e.offer_type === 'voucher' || e.offer_type === 'min_purchase') && (!(Number(e.min_amount) > 0) || !e.reward_text.trim())) return setErr('Enter the minimum amount and the gift/voucher text')
    if (e.valid_from && e.valid_to && e.valid_to < e.valid_from) return setErr('End date must be after start date')
    const v = {
      offer_type: e.offer_type, title: e.title.trim(), description: e.description, active: e.active, display_order: Number(e.display_order) || 0,
      valid_from: e.valid_from || null, valid_to: e.valid_to || null,
      combo_items: e.offer_type === 'combo' ? e.combo_items.map((c) => ({ product_id: c.product_id, quantity: Number(c.quantity) || 1 })) : [],
      combo_price: e.offer_type === 'combo' ? Number(e.combo_price) : null,
      buy_product_id: ['quantity', 'product'].includes(e.offer_type) ? e.buy_product_id : null,
      buy_quantity: ['quantity', 'product'].includes(e.offer_type) ? Number(e.buy_quantity) : null,
      free_product_id: e.offer_type === 'product' ? e.free_product_id : null,
      free_quantity: ['quantity', 'product'].includes(e.offer_type) ? Number(e.free_quantity) : null,
      min_amount: ['voucher', 'min_purchase'].includes(e.offer_type) ? Number(e.min_amount) : null,
      reward_text: ['voucher', 'min_purchase'].includes(e.offer_type) ? e.reward_text.trim() : null,
    }
    const r = e.id ? await supabase.from('offers').update(v).eq('id', e.id) : await supabase.from('offers').insert(v)
    if (r.error) return setErr(r.error.message)
    setEdit(null); load()
  }
  const del = async (o) => { if (window.confirm(`Delete offer “${o.title}”?`)) { await supabase.from('offers').delete().eq('id', o.id); load() } }
  const toggle = async (o, v) => { setRows((r) => r.map((x) => (x.id === o.id ? { ...x, active: v } : x))); await supabase.from('offers').update({ active: v }).eq('id', o.id) }

  const set = (k, v) => setEdit((e) => ({ ...e, [k]: v }))
  const num = (v) => v.replace(/[^\d.]/g, '')
  const ProductSelect = ({ k }) => (
    <select className="input" value={edit[k] || ''} onChange={(e) => set(k, e.target.value)}><option value="">Select product…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} ({inr(p.price)}/{p.unit_type})</option>)}</select>
  )
  const comboWorth = edit?.combo_items?.reduce((s, c) => s + (pById[c.product_id]?.price || 0) * (Number(c.quantity) || 0), 0) || 0

  return (
    <div>
      <PageHeader title="Offers & Promotions" sub="Offers apply automatically on the website – no code changes needed">
        <div className="flex flex-wrap gap-2">
          {Object.entries(OFFER_TYPES).map(([k, v]) => <button key={k} onClick={() => { setErr(''); setPick(''); setEdit(blank(k)) }} className="btn-ghost btn-sm"><Plus size={14} /> {v.label}</button>)}
        </div>
      </PageHeader>
      {!rows ? <Spinner /> : rows.length === 0 ? <Empty icon="🏷️" title="No offers yet">Create one using the buttons above.</Empty> : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((o) => {
            const live = isOfferLive(o)
            return (
              <div key={o.id} className={`card p-4 ${!o.active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2"><span className="badge bg-saffron-50 text-saffron-600">{OFFER_TYPES[o.offer_type].label}</span>{o.active && <span className={`badge ${live ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{live ? 'Live' : 'Scheduled / Expired'}</span>}</div>
                    <div className="mt-1 font-display text-lg font-bold text-navy">{o.title}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setErr(''); setPick(''); setEdit({ ...blank(o.offer_type), ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v ?? ''])), active: o.active }) }} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-navy-50" aria-label="Edit"><Pencil size={16} /></button>
                    <button onClick={() => del(o)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-700">{summary(o)}</p>
                {o.description && <p className="text-xs text-slate-500">{o.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <Toggle checked={o.active} onChange={(v) => toggle(o, v)} label={o.active ? 'Active' : 'Inactive'} />
                  <span className="text-xs text-slate-500">{o.valid_from || o.valid_to ? `${o.valid_from ? fmtDay(o.valid_from) : '…'} → ${o.valid_to ? fmtDay(o.valid_to) : '…'}` : 'No date limit'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit ? `${edit.id ? 'Edit' : 'New'} ${OFFER_TYPES[edit.offer_type].label}` : ''} wide>
        {edit && (
          <div className="space-y-4">
            <p className="rounded-lg bg-saffron-50 p-2.5 text-sm text-saffron-600">{OFFER_TYPES[edit.offer_type].hint}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Offer Title" className="sm:col-span-2"><input className="input" placeholder="e.g. Buy 5 Get 1 Free" value={edit.title} onChange={(e) => set('title', e.target.value)} /></Field>
              <Field label="Offer Description" className="sm:col-span-2"><textarea rows={2} className="input" value={edit.description || ''} onChange={(e) => set('description', e.target.value)} /></Field>
            </div>

            {edit.offer_type === 'combo' && (
              <div className="space-y-2">
                <label className="label">Products in combo</label>
                {edit.combo_items.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 truncate rounded-xl bg-slate-50 px-3 py-2.5 text-sm">{pById[c.product_id]?.name}</span>
                    <input className="input w-20 text-center" inputMode="numeric" value={c.quantity} onChange={(e) => set('combo_items', edit.combo_items.map((x, j) => (j === i ? { ...x, quantity: e.target.value.replace(/\D/g, '') } : x)))} />
                    <button onClick={() => set('combo_items', edit.combo_items.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Remove"><X size={16} /></button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <select className="input flex-1" value={pick} onChange={(e) => setPick(e.target.value)}><option value="">+ Add product…</option>{products.filter((p) => !edit.combo_items.some((c) => c.product_id === p.id)).map((p) => <option key={p.id} value={p.id}>{p.name} ({inr(p.price)})</option>)}</select>
                  <button disabled={!pick} onClick={() => { set('combo_items', [...edit.combo_items, { product_id: pick, quantity: 1 }]); setPick('') }} className="btn-navy">Add</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Special Combo Price (₹)" hint={comboWorth ? `Regular value: ${inr(comboWorth)}` : ''}><input className="input" inputMode="decimal" value={edit.combo_price} onChange={(e) => set('combo_price', num(e.target.value))} /></Field>
                </div>
              </div>
            )}

            {(edit.offer_type === 'quantity' || edit.offer_type === 'product') && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Customer buys (product)" className="sm:col-span-2"><ProductSelect k="buy_product_id" /></Field>
                <Field label="Buy quantity"><input className="input" inputMode="numeric" value={edit.buy_quantity} onChange={(e) => set('buy_quantity', e.target.value.replace(/\D/g, ''))} /></Field>
                <Field label="Free quantity"><input className="input" inputMode="numeric" value={edit.free_quantity} onChange={(e) => set('free_quantity', e.target.value.replace(/\D/g, ''))} /></Field>
                {edit.offer_type === 'product' && <Field label="Complimentary product" className="sm:col-span-2"><ProductSelect k="free_product_id" /></Field>}
                <p className="text-xs text-slate-500 sm:col-span-2">Repeats automatically – e.g. buying 10 with “Buy 5 Get 1” gives 2 free.</p>
              </div>
            )}

            {(edit.offer_type === 'voucher' || edit.offer_type === 'min_purchase') && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Minimum order amount (₹)"><input className="input" inputMode="decimal" value={edit.min_amount} onChange={(e) => set('min_amount', num(e.target.value))} /></Field>
                <Field label={edit.offer_type === 'voucher' ? 'Voucher / gift given' : 'Complimentary gift'}><input className="input" placeholder={edit.offer_type === 'voucher' ? '₹100 voucher for next purchase' : 'Free sweet box'} value={edit.reward_text || ''} onChange={(e) => set('reward_text', e.target.value)} /></Field>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Valid from"><input type="date" className="input" value={edit.valid_from || ''} onChange={(e) => set('valid_from', e.target.value)} /></Field>
              <Field label="Valid to"><input type="date" className="input" value={edit.valid_to || ''} onChange={(e) => set('valid_to', e.target.value)} /></Field>
              <Field label="Display order"><input className="input" inputMode="numeric" value={edit.display_order} onChange={(e) => set('display_order', e.target.value.replace(/\D/g, ''))} /></Field>
            </div>
            <Toggle checked={edit.active} onChange={(v) => set('active', v)} label="Active" />
            {err && <p className="text-sm text-festive-red">{err}</p>}
            <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save Offer</button></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
