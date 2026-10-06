import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageHeader, Field } from './common'
import { Spinner, Modal, Toggle, Empty } from '../components/ui'

const blank = { text: '', language: 'Tamil', active: true, show_on_home: true, show_on_offers: false, show_on_confirmation: false, display_order: 0 }
const PLACES = [['show_on_home', 'Homepage'], ['show_on_offers', 'Offers section'], ['show_on_confirmation', 'Order confirmation']]

export default function Quotes() {
  const [rows, setRows] = useState(null)
  const [edit, setEdit] = useState(null)
  const [err, setErr] = useState('')
  const load = async () => { const { data } = await supabase.from('quotes').select('*').order('display_order').order('created_at'); setRows(data || []) }
  useEffect(() => { load() }, [])

  const patch = async (q, v) => { setRows((r) => r.map((x) => (x.id === q.id ? { ...x, ...v } : x))); await supabase.from('quotes').update(v).eq('id', q.id) }
  const save = async () => {
    if (!edit.text.trim()) return setErr('Message text is required')
    const v = { text: edit.text.trim(), language: edit.language, active: edit.active, show_on_home: edit.show_on_home, show_on_offers: edit.show_on_offers, show_on_confirmation: edit.show_on_confirmation, display_order: Number(edit.display_order) || 0 }
    const r = edit.id ? await supabase.from('quotes').update(v).eq('id', edit.id) : await supabase.from('quotes').insert(v)
    if (r.error) return setErr(r.error.message)
    setEdit(null); load()
  }
  const del = async (q) => { if (window.confirm('Delete this message?')) { await supabase.from('quotes').delete().eq('id', q.id); load() } }

  return (
    <div>
      <PageHeader title="Diwali Quotes & Messages" sub="Tamil / English festive messages shown on the website">
        <button onClick={() => { setErr(''); setEdit({ ...blank }) }} className="btn-primary"><Plus size={18} /> Add Message</button>
      </PageHeader>
      {!rows ? <Spinner /> : rows.length === 0 ? <Empty icon="🪔" title="No messages yet" /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((q) => (
            <div key={q.id} className={`card p-4 ${!q.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="badge bg-navy-50 text-navy">{q.language}</span>
                <div className="flex gap-1">
                  <button onClick={() => { setErr(''); setEdit({ ...q }) }} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-navy-50" aria-label="Edit"><Pencil size={16} /></button>
                  <button onClick={() => del(q)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              <p className="mt-2 text-lg font-semibold leading-relaxed text-navy-800">{q.text}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Toggle checked={q.active} onChange={(v) => patch(q, { active: v })} label={q.active ? 'Active' : 'Inactive'} />
                {PLACES.map(([k, l]) => <button key={k} onClick={() => patch(q, { [k]: !q[k] })} className={q[k] ? 'chip-on !py-1 text-xs' : 'chip-off !py-1 text-xs'}>{l}</button>)}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Message' : 'Add Message'}>
        {edit && (
          <div className="space-y-3">
            <Field label="Language"><div className="flex gap-2">{['Tamil', 'English'].map((l) => <button key={l} type="button" onClick={() => setEdit({ ...edit, language: l })} className={edit.language === l ? 'chip-on' : 'chip-off'}>{l}</button>)}</div></Field>
            <Field label="Message"><textarea rows={4} className="input text-lg" placeholder="இந்த தீபாவளி உங்கள் இல்லத்தில் மகிழ்ச்சியும், வளமும், ஒளியும் நிறையட்டும்! 🪔✨" value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} /></Field>
            <Field label="Show on"><div className="flex flex-wrap gap-2">{PLACES.map(([k, l]) => <button key={k} type="button" onClick={() => setEdit({ ...edit, [k]: !edit[k] })} className={edit[k] ? 'chip-on' : 'chip-off'}>{l}</button>)}</div></Field>
            <Toggle checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="Active" />
            {err && <p className="text-sm text-festive-red">{err}</p>}
            <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
