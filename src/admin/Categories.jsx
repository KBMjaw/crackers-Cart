import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageHeader, Field } from './common'
import { Spinner, Modal, Toggle, Empty } from '../components/ui'

const ICONS = ['🌋', '🌀', '✨', '✏️', '🚀', '💣', '💥', '🎶', '🐍', '🎆', '🎇', '🧒', '🪔', '🎁', '⭐', '🔥']
const blank = { name: '', description: '', icon: '🎇', active: true, sort_order: 0 }

export default function Categories() {
  const [rows, setRows] = useState(null)
  const [counts, setCounts] = useState({})
  const [edit, setEdit] = useState(null)
  const [err, setErr] = useState('')

  const load = async () => {
    const [c, p] = await Promise.all([supabase.from('categories').select('*').order('sort_order').order('name'), supabase.from('products').select('category_id')])
    setRows(c.data || [])
    const m = {}; (p.data || []).forEach((x) => { m[x.category_id] = (m[x.category_id] || 0) + 1 }); setCounts(m)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!edit.name.trim()) return setErr('Name is required')
    const v = { name: edit.name.trim(), description: edit.description, icon: edit.icon, active: edit.active, sort_order: Number(edit.sort_order) || 0 }
    const r = edit.id ? await supabase.from('categories').update(v).eq('id', edit.id) : await supabase.from('categories').insert(v)
    if (r.error) return setErr(r.error.message)
    setEdit(null); load()
  }
  const del = async (c) => {
    if (!window.confirm(`Delete category “${c.name}”? ${counts[c.id] ? `${counts[c.id]} products will become uncategorised.` : ''}`)) return
    await supabase.from('categories').delete().eq('id', c.id); load()
  }
  const toggle = async (c, v) => { setRows((r) => r.map((x) => (x.id === c.id ? { ...x, active: v } : x))); await supabase.from('categories').update({ active: v }).eq('id', c.id) }

  return (
    <div>
      <PageHeader title="Categories" sub="Create and arrange cracker categories">
        <button onClick={() => { setErr(''); setEdit({ ...blank, sort_order: (rows?.length || 0) + 1 }) }} className="btn-primary"><Plus size={18} /> Add Category</button>
      </PageHeader>
      {!rows ? <Spinner /> : rows.length === 0 ? <Empty title="No categories yet" /> : (
        <div className="card divide-y divide-slate-100">
          {rows.map((c) => (
            <div key={c.id} className={`flex items-center gap-3 p-3 ${!c.active ? 'opacity-60' : ''}`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-saffron-50 text-2xl">{c.icon || '🎇'}</span>
              <div className="min-w-0 flex-1"><div className="font-bold text-navy">{c.name}</div><div className="text-xs text-slate-500">{counts[c.id] || 0} products · order {c.sort_order}</div></div>
              <Toggle checked={c.active} onChange={(v) => toggle(c, v)} />
              <button onClick={() => { setErr(''); setEdit({ ...c }) }} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-navy-50" aria-label="Edit"><Pencil size={16} /></button>
              <button onClick={() => del(c)} className="grid h-9 w-9 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Category' : 'Add Category'}>
        {edit && (
          <div className="space-y-3">
            <Field label="Name"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Icon"><div className="flex flex-wrap gap-1.5">{ICONS.map((i) => <button type="button" key={i} onClick={() => setEdit({ ...edit, icon: i })} className={`grid h-10 w-10 place-items-center rounded-lg text-xl ${edit.icon === i ? 'bg-saffron-100 ring-2 ring-saffron-500' : 'bg-slate-50'}`}>{i}</button>)}</div></Field>
            <Field label="Description"><textarea rows={2} className="input" value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <Field label="Sort Order"><input className="input" inputMode="numeric" value={edit.sort_order} onChange={(e) => setEdit({ ...edit, sort_order: e.target.value.replace(/\D/g, '') })} /></Field>
            <Toggle checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="Enabled" />
            {err && <p className="text-sm text-festive-red">{err}</p>}
            <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
