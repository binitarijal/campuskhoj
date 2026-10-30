import { Compass, Search, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Brand({ inverse = false }) {
  return <Link to="/" className={`inline-flex items-center gap-2 font-bold tracking-tight ${inverse ? 'text-white' : 'text-ink'}`}><span className="grid size-9 place-items-center rounded-xl bg-teal text-white shadow-sm"><Compass size={20} strokeWidth={2.5} /></span><span className="text-xl">Campus<span className={inverse ? 'text-amber' : 'text-teal'}>Compass</span></span></Link>
}

export function Stars({ value, size = 15, showValue = true }) {
  return <span className="inline-flex items-center gap-1.5"><span className="inline-flex text-amber" aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={size} fill={star <= Math.round(value) ? 'currentColor' : 'none'} className={star <= Math.round(value) ? '' : 'text-slate-300'} />)}</span>{showValue && <strong className="text-sm text-ink">{value.toFixed(1)}</strong>}</span>
}

export function Badge({ children, tone = 'teal' }) {
  const styles = { teal: 'bg-mist text-teal', amber: 'bg-amber/15 text-amber-700', slate: 'bg-slate-100 text-slate-600', navy: 'bg-ink/10 text-ink' }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone] || styles.teal}`}>{children}</span>
}

export function PrimaryButton({ children, className = '', ...props }) { return <button className={`inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal/90 focus:outline-none focus:ring-4 focus:ring-teal/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</button> }
export function SecondaryButton({ children, className = '', ...props }) { return <button className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-teal/40 hover:bg-mist/40 focus:outline-none focus:ring-4 focus:ring-teal/10 ${className}`} {...props}>{children}</button> }

export function SearchField({ value, onChange, placeholder = 'Search institutions, courses, or places', className = '' }) {
  return <label className={`flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-teal focus-within:ring-4 focus-within:ring-teal/10 ${className}`}><Search size={19} className="shrink-0 text-slate-400" /><span className="sr-only">Search institutions</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400" /></label>
}

export function SectionTitle({ eyebrow, title, body, action }) { return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="max-w-2xl">{eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-teal">{eyebrow}</p>}<h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>{body && <p className="mt-2 text-slate-600">{body}</p>}</div>{action}</div> }

export function EmptyState({ title, body, action }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-mist text-teal"><Search size={22} /></div><h3 className="font-bold text-ink">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{body}</p>{action && <div className="mt-5">{action}</div>}</div> }
