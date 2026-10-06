import { Minus, Plus, X } from 'lucide-react'
import { useEffect } from 'react'

export function QtyStepper({ value, onDec, onInc, disabledInc, size = 'md' }) {
  const s = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  return (
    <div className="inline-flex items-center rounded-xl border border-navy-100 bg-white">
      <button type="button" aria-label="Decrease" onClick={onDec} className={`${s} grid place-items-center rounded-l-xl text-navy hover:bg-navy-50 active:bg-navy-100`}>
        <Minus size={16} />
      </button>
      <span className="min-w-[2rem] text-center font-bold tabular-nums">{value}</span>
      <button type="button" aria-label="Increase" onClick={onInc} disabled={disabledInc} className={`${s} grid place-items-center rounded-r-xl text-white bg-saffron-500 hover:bg-saffron-600 disabled:bg-slate-300`}>
        <Plus size={16} />
      </button>
    </div>
  )
}

const TILE_COLORS = ['from-amber-100 to-orange-200', 'from-rose-100 to-red-200', 'from-indigo-100 to-blue-200', 'from-emerald-100 to-teal-200', 'from-fuchsia-100 to-purple-200', 'from-yellow-100 to-amber-200']
export function Thumb({ src, icon, name = '', className = '' }) {
  if (src) return <img src={src} alt={name} loading="lazy" className={`object-cover bg-navy-50 ${className}`} />
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TILE_COLORS.length
  return (
    <div className={`grid place-items-center bg-gradient-to-br ${TILE_COLORS[idx]} ${className}`} aria-hidden>
      <span className="text-4xl drop-shadow-sm">{icon || '🎇'}</span>
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-900/50 backdrop-blur-[2px]" onClick={onClose}>
      <div className={`pop w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-md'} max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-lift`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-navy-50 bg-white px-5 py-4">
            <h3 className="text-xl font-bold text-navy">{title}</h3>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-navy-50" aria-label="Close"><X size={20} /></button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-navy-600">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-saffron-100 border-t-saffron-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

export function Empty({ icon = '🪔', title, children }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="text-5xl">{icon}</div>
      <h3 className="text-xl font-bold text-navy">{title}</h3>
      {children && <div className="text-slate-600">{children}</div>}
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 select-none">
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-festive-green' : 'bg-slate-300'}`}>
        <input type="checkbox" className="sr-only" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      {label && <span className="text-sm font-medium text-navy-800">{label}</span>}
    </label>
  )
}
