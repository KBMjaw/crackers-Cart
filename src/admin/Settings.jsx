import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageHeader, Field, ImageInput } from './common'
import { Spinner, Toggle } from '../components/ui'

export default function Settings() {
  const [s, setS] = useState(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { supabase.from('settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => setS(data || { id: 1 })) }, [])
  if (!s) return <Spinner />
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }))

  const save = async () => {
    setBusy(true); setMsg('')
    const v = { ...s, min_order_amount: Number(s.min_order_amount) || 0, serviceable_pincodes: (s.serviceable_pincodes || '').split(/[\s,]+/).filter(Boolean).join(', '), updated_at: new Date().toISOString() }
    const { error } = await supabase.from('settings').upsert(v)
    setBusy(false)
    setMsg(error ? error.message : 'Settings saved ✓')
    if (!error) setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div className="pb-20">
      <PageHeader title="Website Settings" />
      <div className="space-y-4">
        <section className={`card flex flex-wrap items-center justify-between gap-3 p-5 ${s.orders_open ? '' : 'border-rose-200 bg-rose-50'}`}>
          <div><h2 className="text-xl font-bold text-navy">Orders {s.orders_open ? 'Open' : 'Closed'}</h2><p className="text-sm text-slate-600">{s.orders_open ? 'Customers can place orders.' : 'Website shows: “Orders are currently closed. Please contact us for more information.”'}</p></div>
          <Toggle checked={s.orders_open} onChange={(v) => set('orders_open', v)} label={s.orders_open ? 'Open' : 'Closed'} />
        </section>

        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-xl font-bold text-navy sm:col-span-2">Shop details</h2>
          <Field label="Shop Name"><input className="input" value={s.shop_name || ''} onChange={(e) => set('shop_name', e.target.value)} /></Field>
          <Field label="Tagline"><input className="input" value={s.tagline || ''} onChange={(e) => set('tagline', e.target.value)} /></Field>
          <Field label="Contact Number"><input className="input" inputMode="tel" value={s.contact_number || ''} onChange={(e) => set('contact_number', e.target.value)} /></Field>
          <Field label="WhatsApp Number" hint="10-digit number; used for the WhatsApp buttons on the website"><input className="input" inputMode="tel" value={s.whatsapp_number || ''} onChange={(e) => set('whatsapp_number', e.target.value)} /></Field>
          <Field label="Address" className="sm:col-span-2"><textarea rows={2} className="input" value={s.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
          <Field label="Homepage Text" className="sm:col-span-2"><textarea rows={3} className="input" value={s.homepage_text || ''} onChange={(e) => set('homepage_text', e.target.value)} /></Field>
          <Field label="Logo" hint="Leave empty to use the Shanmuga Crackers logo"><ImageInput value={s.logo_url} onChange={(v) => set('logo_url', v)} folder="branding" label="Upload logo" /></Field>
          <Field label="Diwali Banner" hint="Shown at the top of the homepage. Leave empty to use the Shanmuga banner."><ImageInput value={s.banner_url} onChange={(v) => set('banner_url', v)} folder="branding" label="Upload banner" /></Field>
        </section>

        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-xl font-bold text-navy sm:col-span-2">Order rules</h2>
          <Field label="Minimum Order Amount (₹)" hint="0 = no minimum"><input className="input" inputMode="numeric" value={s.min_order_amount ?? 0} onChange={(e) => set('min_order_amount', e.target.value.replace(/[^\d.]/g, ''))} /></Field>
          <Field label="Serviceable Pincodes" hint="Comma separated. Leave empty to accept all pincodes."><textarea rows={2} className="input" placeholder="626123, 626124" value={s.serviceable_pincodes || ''} onChange={(e) => set('serviceable_pincodes', e.target.value)} /></Field>
        </section>

        <section className="card p-5">
          <h2 className="text-xl font-bold text-navy">WhatsApp Message Template</h2>
          <p className="mb-2 text-sm text-slate-600">Placeholders: <code>{'{name}'}</code> <code>{'{order_id}'}</code> <code>{'{items}'}</code> <code>{'{total}'}</code> <code>{'{shop}'}</code></p>
          <textarea rows={12} className="input font-mono text-sm" value={s.whatsapp_template || ''} onChange={(e) => set('whatsapp_template', e.target.value)} />
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-3">
          {msg && <span className={`text-sm font-semibold ${msg.includes('✓') ? 'text-festive-green' : 'text-festive-red'}`}>{msg}</span>}
          <button disabled={busy} onClick={save} className="btn-primary"><Save size={18} /> {busy ? 'Saving…' : 'Save Settings'}</button>
        </div>
      </div>
    </div>
  )
}
