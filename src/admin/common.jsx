import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { uploadImage } from '../lib/image'
import { STATUS_CLS } from '../lib/format'

export function PageHeader({ title, sub, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-3xl font-extrabold text-navy">{title}</h1>{sub && <p className="text-sm text-slate-600">{sub}</p>}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

export function StatusBadge({ s }) {
  return <span className={`badge border ${STATUS_CLS[s] || ''}`}>{s}</span>
}

export function Field({ label, children, hint, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function ImageInput({ value, onChange, folder = 'products', label = 'Image' }) {
  const ref = useRef()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const pick = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setBusy(true); setErr('')
    try { onChange(await uploadImage(f, folder)) } catch (x) { setErr(x.message || 'Upload failed') }
    setBusy(false)
  }
  return (
    <div>
      <div className="relative h-28 w-28 overflow-hidden rounded-xl border-2 border-dashed border-navy-100 bg-navy-50/50">
        {value ? (
          <>
            <img src={value} alt={label} className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(null)} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white" aria-label="Remove image"><X size={14} /></button>
          </>
        ) : (
          <button type="button" onClick={() => ref.current.click()} className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs font-semibold text-navy-600">
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />} {busy ? 'Uploading…' : label}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />
      {err && <p className="mt-1 text-xs text-festive-red">{err}</p>}
    </div>
  )
}

export function Confirm({ text = 'Are you sure?' }) {
  return window.confirm(text)
}

export function Th({ children, className = '' }) { return <th className={`px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wide text-slate-500 ${className}`}>{children}</th> }
export function Td({ children, className = '' }) { return <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td> }
