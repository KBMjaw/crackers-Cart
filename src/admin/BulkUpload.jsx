import { useRef, useState } from 'react'
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { inr } from '../lib/format'
import { Modal } from '../components/ui'

// Column headers used in the template. Matching is case/space-insensitive and accepts a few aliases.
export const COLUMNS = ['Product Name', 'Category', 'Description', 'Selling Price', 'Offer Price', 'Unit Type', 'Stock', 'Featured', 'Active', 'Display Order', 'Image URL']
const ALIASES = {
  name: ['productname', 'name', 'product', 'item', 'itemname'],
  category: ['category', 'categoryname', 'type'],
  description: ['description', 'desc', 'details'],
  price: ['sellingprice', 'sellingprice₹', 'mrp', 'price', 'rate'],
  offer_price: ['offerprice', 'offerprice₹', 'offer', 'saleprice', 'discountprice', 'specialprice'],
  unit_type: ['unittype', 'unit', 'uom'],
  stock: ['stock', 'availability', 'stockstatus', 'status'],
  featured: ['featured', 'popular'],
  active: ['active', 'enabled', 'show'],
  display_order: ['displayorder', 'order', 'sortorder', 'sno', 'slno'],
  image: ['imageurl', 'image', 'photo', 'imagelink'],
}
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9₹]/g, '')
const UNITS = { box: 'Box', boxes: 'Box', piece: 'Piece', pieces: 'Piece', pcs: 'Piece', pc: 'Piece', packet: 'Packet', packets: 'Packet', pkt: 'Packet', bundle: 'Bundle', bundles: 'Bundle' }
const yes = (v, dflt) => {
  const s = String(v ?? '').trim().toLowerCase()
  if (!s) return dflt
  return ['yes', 'y', 'true', '1', 'on', 'enabled', 'active'].includes(s)
}
const stockOf = (v) => {
  const s = norm(v)
  if (!s) return 'in_stock'
  if (s.includes('out') || s === 'no' || s === '0' || s === 'unavailable') return 'out_of_stock'
  if (s.includes('low') || s.includes('few') || s.includes('limited')) return 'low_stock'
  return 'in_stock'
}
const money = (v) => {
  if (v === null || v === undefined || String(v).trim() === '') return null
  const n = Number(String(v).replace(/[₹,\s]/g, ''))
  return Number.isFinite(n) ? n : NaN
}

async function loadXLSX() { return import('xlsx') }

export async function downloadSheet(rows, filename, format = 'xlsx') {
  const XLSX = await loadXLSX()
  const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMNS })
  ws['!cols'] = COLUMNS.map((c) => ({ wch: c === 'Description' ? 40 : c === 'Image URL' ? 30 : Math.max(12, c.length + 2) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')
  XLSX.writeFile(wb, filename, { bookType: format })
}

export function templateRows() {
  return [
    { 'Product Name': 'Flower Pots Big', Category: 'Flower Pots / Pusvanam', Description: 'Tall colourful fountain, 10 pcs per box', 'Selling Price': 200, 'Offer Price': 160, 'Unit Type': 'Box', Stock: 'Available', Featured: 'Yes', Active: 'Yes', 'Display Order': 1, 'Image URL': '' },
    { 'Product Name': '7 cm Electric Sparklers', Category: 'Sparklers', Description: 'Safe sparklers, 10 pcs', 'Selling Price': 40, 'Offer Price': 30, 'Unit Type': 'Box', Stock: 'Few left', Featured: 'No', Active: 'Yes', 'Display Order': 2, 'Image URL': '' },
    { 'Product Name': '1000 Wala Garland', Category: 'Others', Description: '1000 crackers chain', 'Selling Price': 450, 'Offer Price': '', 'Unit Type': 'Bundle', Stock: 'Out of stock', Featured: 'No', Active: 'Yes', 'Display Order': 3, 'Image URL': '' },
  ]
}

export default function BulkUpload({ open, onClose, products, categories, onDone }) {
  const ref = useRef()
  const [file, setFile] = useState('')
  const [rows, setRows] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [readErr, setReadErr] = useState('')

  const reset = () => { setFile(''); setRows(null); setResult(null); setReadErr('') }
  const close = () => { reset(); onClose() }

  const parse = async (f) => {
    reset(); setFile(f.name)
    try {
      const XLSX = await loadXLSX()
      const buf = await f.arrayBuffer()
      const wb = XLSX.read(buf, { type: 'array' })
      const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: true })
      if (!raw.length) return setReadErr('The file has no rows. Use the template to see the expected columns.')
      const headers = Object.keys(raw[0])
      const map = {}
      for (const [key, names] of Object.entries(ALIASES)) {
        const h = headers.find((x) => names.includes(norm(x)))
        if (h) map[key] = h
      }
      if (!map.name || !map.price) return setReadErr(`Could not find the "Product Name" and "Selling Price" columns. Found: ${headers.join(', ')}`)

      const byName = Object.fromEntries(products.map((p) => [p.name.trim().toLowerCase(), p]))
      const catByName = Object.fromEntries(categories.map((c) => [c.name.trim().toLowerCase(), c]))
      const seen = new Set()
      const parsed = raw.map((r, i) => {
        const get = (k) => (map[k] ? r[map[k]] : undefined)
        const name = String(get('name') ?? '').trim()
        const price = money(get('price'))
        const offer = money(get('offer_price'))
        const catName = String(get('category') ?? '').trim()
        const errors = []
        if (!name) errors.push('Name missing')
        if (price === null || Number.isNaN(price) || price < 0) errors.push('Invalid selling price')
        if (Number.isNaN(offer) || (offer !== null && offer < 0)) errors.push('Invalid offer price')
        if (offer !== null && !Number.isNaN(offer) && price !== null && offer > price) errors.push('Offer price is more than selling price')
        const key = name.toLowerCase()
        if (name && seen.has(key)) errors.push('Duplicate name in file')
        seen.add(key)
        const unitRaw = String(get('unit_type') ?? '').trim()
        const existing = byName[key]
        return {
          line: i + 2,
          name, price, offer_price: offer === null || Number.isNaN(offer) || offer === 0 ? null : offer,
          category: catName, newCategory: !!catName && !catByName[catName.toLowerCase()],
          description: map.description ? String(get('description') ?? '').trim() : undefined,
          unit_type: unitRaw ? (UNITS[unitRaw.toLowerCase()] || unitRaw) : (existing?.unit_type || 'Box'),
          stock_status: map.stock ? stockOf(get('stock')) : undefined,
          featured: map.featured ? yes(get('featured'), false) : undefined,
          active: map.active ? yes(get('active'), true) : undefined,
          display_order: map.display_order && String(get('display_order')).trim() !== '' ? parseInt(get('display_order'), 10) || 0 : undefined,
          image: map.image ? String(get('image') ?? '').trim() || undefined : undefined,
          existing, errors,
        }
      }).filter((r) => r.name || r.price !== null)
      setRows(parsed)
    } catch (e) {
      setReadErr(`Could not read this file: ${e.message}`)
    }
  }

  const good = (rows || []).filter((r) => !r.errors.length)
  const bad = (rows || []).filter((r) => r.errors.length)

  const doImport = async () => {
    setBusy(true)
    try {
      // 1. create any new categories
      const catByName = Object.fromEntries(categories.map((c) => [c.name.trim().toLowerCase(), c.id]))
      const newCats = [...new Set(good.filter((r) => r.newCategory).map((r) => r.category))]
      if (newCats.length) {
        const maxSort = Math.max(0, ...categories.map((c) => c.sort_order || 0))
        const { data, error } = await supabase.from('categories').insert(newCats.map((n, i) => ({ name: n, icon: '🎇', sort_order: maxSort + i + 1 }))).select('id,name')
        if (error) throw error
        data.forEach((c) => { catByName[c.name.trim().toLowerCase()] = c.id })
      }
      // 2. build product rows
      const toRow = (r) => {
        const v = { name: r.name, price: r.price, offer_price: r.offer_price, unit_type: r.unit_type }
        if (r.category) v.category_id = catByName[r.category.toLowerCase()]
        for (const k of ['description', 'stock_status', 'featured', 'active', 'display_order', 'image']) if (r[k] !== undefined) v[k] = r[k]
        return v
      }
      const inserts = good.filter((r) => !r.existing).map(toRow)
      const updates = good.filter((r) => r.existing).map((r) => ({ id: r.existing.id, ...toRow(r) }))
      let added = 0, updated = 0
      for (let i = 0; i < inserts.length; i += 200) {
        const { error } = await supabase.from('products').insert(inserts.slice(i, i + 200))
        if (error) throw error
        added += Math.min(200, inserts.length - i)
      }
      for (const u of updates) {
        const { id, ...v } = u
        const { error } = await supabase.from('products').update(v).eq('id', id)
        if (error) throw error
        updated++
      }
      setResult({ ok: true, added, updated, cats: newCats.length, skipped: bad.length })
      onDone?.()
    } catch (e) {
      setResult({ ok: false, msg: e.message })
    }
    setBusy(false)
  }

  return (
    <Modal open={open} onClose={close} title="Bulk Upload Products" wide>
      {result ? (
        <div className="py-4 text-center">
          {result.ok ? <CheckCircle2 className="mx-auto text-festive-green" size={48} /> : <AlertTriangle className="mx-auto text-festive-red" size={48} />}
          <h3 className="mt-2 text-2xl font-bold text-navy">{result.ok ? 'Upload complete' : 'Upload failed'}</h3>
          {result.ok ? (
            <p className="mt-1 text-slate-600">{result.added} added · {result.updated} updated{result.cats ? ` · ${result.cats} new categories` : ''}{result.skipped ? ` · ${result.skipped} rows skipped` : ''}</p>
          ) : <p className="mt-1 text-sm text-rose-700">{result.msg}</p>}
          <div className="mt-5 flex justify-center gap-2"><button className="btn-ghost" onClick={reset}>Upload another file</button><button className="btn-primary" onClick={close}>Done</button></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-navy-50/60 p-4 text-sm text-navy-800">
            <p className="font-semibold">Upload a CSV or Excel (.xlsx / .xls) file.</p>
            <ul className="mt-1 list-inside list-disc text-slate-600">
              <li>Required: <b>Product Name</b>, <b>Selling Price</b>. Optional: Offer Price, Category, Description, Unit Type, Stock, Featured, Active, Display Order, Image URL.</li>
              <li>Products with the same name are <b>updated</b>; new names are <b>added</b>. New categories are created automatically.</li>
              <li>Leave Offer Price empty to sell at the selling price.</li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-ghost btn-sm" onClick={() => downloadSheet(templateRows(), 'shanmuga-products-template.xlsx')}><Download size={14} /> Excel template</button>
              <button className="btn-ghost btn-sm" onClick={() => downloadSheet(templateRows(), 'shanmuga-products-template.csv', 'csv')}><Download size={14} /> CSV template</button>
            </div>
          </div>

          <button onClick={() => ref.current.click()} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-saffron-400 bg-saffron-50/50 px-4 py-8 text-navy hover:bg-saffron-50">
            <FileSpreadsheet size={36} className="text-saffron-600" />
            <span className="font-semibold">{file || 'Choose CSV / Excel file'}</span>
            <span className="text-xs text-slate-500">.csv, .xlsx, .xls</span>
          </button>
          <input ref={ref} type="file" className="hidden" accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) parse(f) }} />
          {readErr && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{readErr}</p>}

          {rows && (
            <>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="badge bg-emerald-50 px-3 py-1 text-emerald-700">{good.filter((r) => !r.existing).length} new</span>
                <span className="badge bg-sky-50 px-3 py-1 text-sky-700">{good.filter((r) => r.existing).length} update</span>
                {bad.length > 0 && <span className="badge bg-rose-50 px-3 py-1 text-rose-700">{bad.length} with errors (skipped)</span>}
              </div>
              <div className="max-h-80 overflow-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Product</th><th className="px-3 py-2">Category</th><th className="px-3 py-2 text-right">Selling</th><th className="px-3 py-2 text-right">Offer</th><th className="px-3 py-2">Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <tr key={r.line} className={r.errors.length ? 'bg-rose-50/60' : ''}>
                        <td className="px-3 py-1.5 text-slate-400">{r.line}</td>
                        <td className="px-3 py-1.5 font-medium text-navy">{r.name || '—'}</td>
                        <td className="px-3 py-1.5">{r.category || <span className="text-slate-400">{r.existing ? 'unchanged' : '—'}</span>}{r.newCategory && <span className="ml-1 text-xs text-saffron-600">(new)</span>}</td>
                        <td className="px-3 py-1.5 text-right">{r.price != null && !Number.isNaN(r.price) ? inr(r.price) : '—'}</td>
                        <td className="px-3 py-1.5 text-right">{r.offer_price ? inr(r.offer_price) : '—'}</td>
                        <td className="px-3 py-1.5">{r.errors.length ? <span className="text-xs font-semibold text-rose-700">{r.errors.join(', ')}</span> : r.existing ? <span className="text-xs font-semibold text-sky-700">Update</span> : <span className="text-xs font-semibold text-emerald-700">Add</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={close}>Cancel</button>
                <button className="btn-primary" disabled={busy || !good.length} onClick={doImport}><Upload size={18} /> {busy ? 'Uploading…' : `Import ${good.length} products`}</button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
