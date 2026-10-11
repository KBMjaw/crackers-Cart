import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { inr, STOCK, plural, salePrice, hasOffer, pctOff } from '../lib/format'
import { PageHeader, Field, ImageInput } from './common'
import { Spinner, Modal, Toggle, Thumb, Empty } from '../components/ui'

const blank = { name: '', description: '', price: '', offer_price: '', image_1: null, image_2: null, image_3: null, stock_status: 'in_stock', active: true, featured: false, display_order: 0, items: [] }

export default function GiftBoxes() {
  const [rows, setRows] = useState(null)
  const [products, setProducts] = useState([])
  const [edit, setEdit] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [pick, setPick] = useState('')

  const load = async () => {
    const [g, p] = await Promise.all([
      supabase.from('gift_boxes').select('*, gift_box_items(id, product_id, quantity, product:products(name, unit_type, price, offer_price))').order('display_order').order('price'),
      supabase.from('products').select('id, name, unit_type, price, offer_price').order('name'),
    ])
    setRows(g.data || []); setProducts(p.data || [])
  }
  useEffect(() => { load() }, [])

  const open = (g) => {
    setErr(''); setPick('')
    setEdit(g ? { ...g, items: (g.gift_box_items || []).map((i) => ({ product_id: i.product_id, quantity: i.quantity })) } : { ...blank })
  }
  const patch = async (g, v) => { setRows((r) => r.map((x) => (x.id === g.id ? { ...x, ...v } : x))); await supabase.from('gift_boxes').update(v).eq('id', g.id) }

  const save = async () => {
    setErr('')
    if (!edit.name.trim()) return setErr('Gift box name is required')
    if (edit.price === '' || Number(edit.price) < 0) return setErr('Enter a valid selling price')
    if (edit.offer_price !== '' && edit.offer_price != null && Number(edit.offer_price) > Number(edit.price)) return setErr('Offer price cannot be more than the selling price')
    setBusy(true)
    const v = { name: edit.name.trim(), description: edit.description, price: Number(edit.price), offer_price: edit.offer_price === '' || edit.offer_price == null ? null : Number(edit.offer_price), image_1: edit.image_1, image_2: edit.image_2, image_3: edit.image_3, stock_status: edit.stock_status, active: edit.active, featured: edit.featured, display_order: Number(edit.display_order) || 0 }
    let id = edit.id
    const r = id ? await supabase.from('gift_boxes').update(v).eq('id', id) : await supabase.from('gift_boxes').insert(v).select('id').single()
    if (r.error) { setBusy(false); return setErr(r.error.message) }
    if (!id) id = r.data.id
    await supabase.from('gift_box_items').delete().eq('gift_box_id', id)
    if (edit.items.length) {
      const ins = await supabase.from('gift_box_items').insert(edit.items.map((i) => ({ gift_box_id: id, product_id: i.product_id, quantity: Number(i.quantity) || 1 })))
      if (ins.error) { setBusy(false); return setErr(ins.error.message) }
    }
    setBusy(false); setEdit(null); load()
  }
  const del = async (g) => { if (window.confirm(`Delete gift box “${g.name}”?`)) { await supabase.from('gift_boxes').delete().eq('id', g.id); load() } }

  const pById = Object.fromEntries(products.map((p) => [p.id, p]))
  const contentsValue = edit ? edit.items.reduce((s, i) => s + (pById[i.product_id] ? salePrice(pById[i.product_id]) : 0) * i.quantity, 0) : 0

  return (
    <div>
      <PageHeader title="Gift Boxes" sub="Ready-made boxes at different prices">
        <button onClick={() => open(null)} className="btn-primary"><Plus size={18} /> Add Gift Box</button>
      </PageHeader>
      {!rows ? <Spinner /> : rows.length === 0 ? <Empty icon="🎁" title="No gift boxes yet" /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((g) => (
            <div key={g.id} className={`card overflow-hidden ${!g.active ? 'opacity-60' : ''}`}>
              <div className="flex">
                {[g.image_1, g.image_2, g.image_3].filter(Boolean).length ? [g.image_1, g.image_2, g.image_3].filter(Boolean).map((s, i) => <img key={i} src={s} alt="" className="h-28 min-w-0 flex-1 object-cover" />) : <Thumb icon="🎁" name={g.name} className="h-28 w-full" />}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="font-display text-lg font-bold text-navy">{g.name}</div><div className="flex items-baseline gap-1.5"><span className="font-extrabold text-saffron-600">{inr(salePrice(g))}</span>{hasOffer(g) && <><s className="text-xs text-slate-400">{inr(g.price)}</s><span className="badge bg-emerald-50 text-emerald-700">{pctOff(g)}% off</span></>}</div></div>
                  <div className="flex gap-1">
                    <button onClick={() => open(g)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-navy-50" aria-label="Edit"><Pencil size={16} /></button>
                    <button onClick={() => del(g)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
                <ul className="mt-2 space-y-0.5 text-xs text-slate-600">{g.gift_box_items?.map((i) => <li key={i.id}>• {i.product?.name} – {plural(i.quantity, i.product?.unit_type)}</li>)}</ul>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Toggle checked={g.active} onChange={(v) => patch(g, { active: v })} label={g.active ? 'Enabled' : 'Disabled'} />
                  <select value={g.stock_status} onChange={(e) => patch(g, { stock_status: e.target.value })} className={`rounded-lg px-2 py-1 text-xs font-semibold ${STOCK[g.stock_status].cls}`}>{Object.entries(STOCK).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                  {g.featured && <span className="badge bg-festive-yellow/40 text-navy">★ Featured</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Gift Box' : 'Add Gift Box'} wide>
        {edit && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Gift Box Name" className="sm:col-span-2"><input className="input" placeholder="e.g. Family Celebration Box" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="Selling Price (₹)" hint="MRP – shown struck through when an offer price is set"><input className="input" inputMode="decimal" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value.replace(/[^\d.]/g, '') })} /></Field>
              <Field label="Offer Price (₹)" hint={hasOffer(edit) ? `Customers pay this · ${pctOff(edit)}% off` : 'Customers pay this. Leave empty to sell at selling price.'}><input className="input" inputMode="decimal" value={edit.offer_price ?? ''} onChange={(e) => setEdit({ ...edit, offer_price: e.target.value.replace(/[^\d.]/g, '') })} /></Field>
              <Field label="Availability"><select className="input" value={edit.stock_status} onChange={(e) => setEdit({ ...edit, stock_status: e.target.value })}>{Object.entries(STOCK).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
              <Field label="Description" className="sm:col-span-2"><textarea rows={2} className="input" value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            </div>
            <Field label="Images (up to 3)">
              <div className="flex flex-wrap gap-3">
                {['image_1', 'image_2', 'image_3'].map((k, i) => <ImageInput key={k} value={edit[k]} onChange={(v) => setEdit((e) => ({ ...e, [k]: v }))} folder="gift-boxes" label={`Image ${i + 1}`} />)}
              </div>
            </Field>
            <div>
              <label className="label">Crackers Included</label>
              <div className="space-y-2">
                {edit.items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select className="input flex-1" value={it.product_id} onChange={(e) => setEdit({ ...edit, items: edit.items.map((x, j) => (j === idx ? { ...x, product_id: e.target.value } : x)) })}>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input className="input w-20 text-center" inputMode="numeric" value={it.quantity} onChange={(e) => setEdit({ ...edit, items: edit.items.map((x, j) => (j === idx ? { ...x, quantity: e.target.value.replace(/\D/g, '') } : x)) })} />
                    <span className="w-14 text-xs text-slate-500">{pById[it.product_id]?.unit_type}</span>
                    <button onClick={() => setEdit({ ...edit, items: edit.items.filter((_, j) => j !== idx) })} className="grid h-9 w-9 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Remove"><X size={16} /></button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <select className="input flex-1" value={pick} onChange={(e) => setPick(e.target.value)}><option value="">+ Select a product to add…</option>{products.filter((p) => !edit.items.some((i) => i.product_id === p.id)).map((p) => <option key={p.id} value={p.id}>{p.name} ({inr(salePrice(p))}/{p.unit_type})</option>)}</select>
                  <button disabled={!pick} onClick={() => { setEdit({ ...edit, items: [...edit.items, { product_id: pick, quantity: 1 }] }); setPick('') }} className="btn-navy">Add</button>
                </div>
                {edit.items.length > 0 && <p className="text-xs text-slate-500">Individual value of contents: {inr(contentsValue)}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-5">
              <Toggle checked={edit.featured} onChange={(v) => setEdit({ ...edit, featured: v })} label="Featured" />
              <Toggle checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="Enabled on website" />
              <label className="flex items-center gap-2 text-sm font-medium">Display order <input className="input w-20 py-1.5" inputMode="numeric" value={edit.display_order} onChange={(e) => setEdit({ ...edit, display_order: e.target.value.replace(/\D/g, '') })} /></label>
            </div>
            {err && <p className="text-sm text-festive-red">{err}</p>}
            <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button disabled={busy} className="btn-primary" onClick={save}>{busy ? 'Saving…' : 'Save Gift Box'}</button></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
