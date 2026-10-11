import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Upload, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { inr, STOCK, salePrice, hasOffer, pctOff } from '../lib/format'
import BulkUpload, { downloadSheet } from './BulkUpload'
import { PageHeader, Field, ImageInput } from './common'
import { Spinner, Modal, Toggle, Thumb, Empty } from '../components/ui'

const UNITS = ['Box', 'Piece', 'Packet', 'Bundle']
const blank = { name: '', category_id: '', description: '', price: '', offer_price: '', unit_type: 'Box', stock_status: 'in_stock', image: null, featured: false, active: true, display_order: 0 }

export default function Products() {
  const [rows, setRows] = useState(null)
  const [cats, setCats] = useState([])
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [edit, setEdit] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [bulk, setBulk] = useState(false)

  const load = async () => {
    const [p, c] = await Promise.all([
      supabase.from('products').select('*').order('display_order').order('name'),
      supabase.from('categories').select('*').order('sort_order').order('name'),
    ])
    setRows(p.data || []); setCats(c.data || [])
  }
  useEffect(() => { load() }, [])
  const catById = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c])), [cats])

  const list = (rows || []).filter((p) => (!cat || p.category_id === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase())))

  const patch = async (p, v) => {
    setRows((r) => r.map((x) => (x.id === p.id ? { ...x, ...v } : x)))
    await supabase.from('products').update(v).eq('id', p.id)
  }
  const save = async () => {
    setErr('')
    if (!edit.name.trim()) return setErr('Product name is required')
    if (edit.price === '' || Number(edit.price) < 0) return setErr('Enter a valid selling price')
    if (edit.offer_price !== '' && edit.offer_price != null && Number(edit.offer_price) > Number(edit.price)) return setErr('Offer price cannot be more than the selling price')
    setBusy(true)
    const v = { ...edit, name: edit.name.trim(), price: Number(edit.price), offer_price: edit.offer_price === '' || edit.offer_price == null || Number(edit.offer_price) === 0 ? null : Number(edit.offer_price), display_order: Number(edit.display_order) || 0, category_id: edit.category_id || null }
    delete v.id; delete v.created_at
    const res = edit.id ? await supabase.from('products').update(v).eq('id', edit.id) : await supabase.from('products').insert(v)
    setBusy(false)
    if (res.error) return setErr(res.error.message)
    setEdit(null); load()
  }
  const del = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? It will also be removed from gift boxes. Past orders keep their details.`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) alert(error.message); else load()
  }

  const exportAll = () => downloadSheet((rows || []).map((p) => ({
    'Product Name': p.name, Category: catById[p.category_id]?.name || '', Description: p.description || '',
    'Selling Price': Number(p.price), 'Offer Price': p.offer_price != null ? Number(p.offer_price) : '', 'Unit Type': p.unit_type,
    Stock: STOCK[p.stock_status]?.label, Featured: p.featured ? 'Yes' : 'No', Active: p.active ? 'Yes' : 'No', 'Display Order': p.display_order, 'Image URL': p.image || '',
  })), `crackerscart-products-${new Date().toISOString().slice(0, 10)}.xlsx`)

  return (
    <div>
      <PageHeader title="Products" sub={rows ? `${rows.length} products` : ''}>
        <button onClick={exportAll} disabled={!rows?.length} className="btn-ghost"><Download size={18} /> Export</button>
        <button onClick={() => setBulk(true)} className="btn-navy"><Upload size={18} /> Bulk Upload</button>
        <button onClick={() => { setErr(''); setEdit({ ...blank, category_id: cat || cats[0]?.id || '' }) }} className="btn-primary"><Plus size={18} /> Add Product</button>
      </PageHeader>
      <div className="card mb-4 flex flex-col gap-2 p-3 sm:flex-row">
        <div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input pl-10" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="input sm:w-64" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
      </div>

      {!rows ? <Spinner /> : list.length === 0 ? <Empty icon="📦" title="No products" /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <div key={p.id} className={`card flex gap-3 p-3 ${!p.active ? 'opacity-60' : ''}`}>
              <Thumb src={p.image} icon={catById[p.category_id]?.icon} name={p.name} className="h-20 w-20 shrink-0 rounded-xl text-3xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><div className="truncate font-bold text-navy">{p.name}</div><div className="truncate text-xs text-slate-500">{catById[p.category_id]?.name || 'No category'}</div></div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => { setErr(''); setEdit({ ...p }) }} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-navy-50" aria-label="Edit"><Pencil size={16} /></button>
                    <button onClick={() => del(p)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="mt-1 text-sm"><b className="text-navy">{inr(salePrice(p))}</b>{hasOffer(p) && <><s className="ml-1 text-xs text-slate-400">{inr(p.price)}</s><span className="badge ml-1 bg-emerald-50 text-emerald-700">{pctOff(p)}% off</span></>} / {p.unit_type}{p.featured && <span className="badge ml-2 bg-festive-yellow/40 text-navy">★ Featured</span>}</div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Toggle checked={p.active} onChange={(v) => patch(p, { active: v })} label={p.active ? 'Enabled' : 'Disabled'} />
                  <select value={p.stock_status} onChange={(e) => patch(p, { stock_status: e.target.value })} className={`rounded-lg px-2 py-1 text-xs font-semibold ${STOCK[p.stock_status].cls}`}>
                    {Object.entries(STOCK).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Product' : 'Add Product'} wide>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <ImageInput value={edit.image} onChange={(v) => setEdit({ ...edit, image: v })} folder="products" label="Add photo" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Product Name" className="sm:col-span-2"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="Category"><select className="input" value={edit.category_id || ''} onChange={(e) => setEdit({ ...edit, category_id: e.target.value })}><option value="">— None —</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></Field>
              <Field label="Unit Type"><select className="input" value={edit.unit_type} onChange={(e) => setEdit({ ...edit, unit_type: e.target.value })}>{[...new Set([...UNITS, edit.unit_type])].map((u) => <option key={u}>{u}</option>)}</select></Field>
              <Field label="Selling Price (₹)" hint="MRP – shown struck through when an offer price is set"><input className="input" inputMode="decimal" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value.replace(/[^\d.]/g, '') })} /></Field>
              <Field label="Offer Price (₹)" hint={hasOffer(edit) ? `Customers pay this · ${pctOff(edit)}% off` : 'Customers pay this. Leave empty to sell at selling price.'}><input className="input" inputMode="decimal" value={edit.offer_price ?? ''} onChange={(e) => setEdit({ ...edit, offer_price: e.target.value.replace(/[^\d.]/g, '') })} /></Field>
              <Field label="Stock / Availability"><select className="input" value={edit.stock_status} onChange={(e) => setEdit({ ...edit, stock_status: e.target.value })}>{Object.entries(STOCK).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
              <Field label="Description" className="sm:col-span-2"><textarea rows={2} className="input" value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
              <Field label="Display Order" hint="Lower numbers show first"><input className="input" inputMode="numeric" value={edit.display_order} onChange={(e) => setEdit({ ...edit, display_order: e.target.value.replace(/\D/g, '') })} /></Field>
              <div className="flex flex-col justify-end gap-3 pb-1">
                <Toggle checked={edit.featured} onChange={(v) => setEdit({ ...edit, featured: v })} label="Featured / Popular" />
                <Toggle checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="Enabled on website" />
              </div>
            </div>
            {err && <p className="text-sm text-festive-red sm:col-span-2">{err}</p>}
            <div className="flex justify-end gap-2 sm:col-span-2"><button className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button disabled={busy} className="btn-primary" onClick={save}>{busy ? 'Saving…' : 'Save Product'}</button></div>
          </div>
        )}
      </Modal>
      <BulkUpload open={bulk} onClose={() => setBulk(false)} products={rows || []} categories={cats} onDone={load} />
    </div>
  )
}
