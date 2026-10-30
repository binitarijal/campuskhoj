import { AlertCircle, Building2, RefreshCw } from 'lucide-react'

export function AdminPageTitle({ eyebrow = 'CampusCompass admin', title, description, action }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-teal">{eyebrow}</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}</div>{action}</div>
}

export function AdminCard({ children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}>{children}</section>
}

export function StatCard({ icon: Icon, label, value, detail, tone = 'teal' }) {
  return <AdminCard className="p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-ink">{value ?? '—'}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tone === 'yellow' ? 'bg-amber text-ink' : tone === 'mint' ? 'bg-mist text-teal' : 'bg-teal/10 text-teal'}`}><Icon size={20} /></span></div></AdminCard>
}

export function StatusBadge({ status }) {
  const classes = {
    published: 'bg-emerald-50 text-emerald-800', approved: 'bg-emerald-50 text-emerald-800', active: 'bg-emerald-50 text-emerald-800', verified: 'bg-emerald-50 text-emerald-800',
    pending: 'bg-amber text-ink', draft: 'bg-slate-100 text-slate-700', flagged: 'bg-orange-50 text-orange-800',
    rejected: 'bg-rose-50 text-rose-800', removed: 'bg-rose-50 text-rose-800', suspended: 'bg-rose-50 text-rose-800',
    deactivated: 'bg-slate-100 text-slate-700', archived: 'bg-slate-100 text-slate-700', unverified: 'bg-slate-100 text-slate-700', hidden: 'bg-orange-50 text-orange-800',
    open: 'bg-amber text-ink', resolved: 'bg-emerald-50 text-emerald-800', dismissed: 'bg-slate-100 text-slate-700',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${classes[status] || 'bg-slate-100 text-slate-700'}`}>{status || 'unknown'}</span>
}

export function LoadingState({ rows = 4 }) {
  return <div className="space-y-3" role="status" aria-label="Loading"><span className="sr-only">Loading data…</span>{Array.from({ length: rows }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
}

export function EmptyState({ title = 'Nothing here yet', body = 'There are no records to show.' }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><span className="mx-auto grid size-11 place-items-center rounded-xl bg-mist text-teal"><Building2 size={20} /></span><h2 className="mt-4 font-bold text-ink">{title}</h2><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{body}</p></div>
}

export function ErrorState({ message, onRetry }) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5" role="alert"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 shrink-0 text-rose-700" size={19} /><div className="flex-1"><p className="font-semibold text-rose-900">Could not load this data</p><p className="mt-1 text-sm text-rose-800">{message || 'Please try again.'}</p></div>{onRetry && <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100"><RefreshCw size={15} />Retry</button>}</div></div>
}

export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages < 2) return null
  return <div className="mt-5 flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Page {page} of {totalPages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-ink disabled:opacity-40">Previous</button><button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-ink disabled:opacity-40">Next</button></div></div>
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '—' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}
