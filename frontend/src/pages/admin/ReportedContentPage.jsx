import { useCallback, useEffect, useState } from 'react'
import { Check, Eye, Flag, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiRequest } from '../../lib/api'
import { AdminCard, AdminPageTitle, EmptyState, ErrorState, formatDate, LoadingState, Pagination, StatusBadge } from '../../components/admin/AdminPrimitives'

const reasonLabels = { 'fake-review': 'Fake review', spam: 'Spam', 'abusive-language': 'Abusive language', 'misleading-information': 'Misleading information', 'conflict-of-interest': 'Conflict of interest', other: 'Other' }

export default function ReportedContentPage() {
  const [status, setStatus] = useState('open')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ data: [], pagination: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [reasonError, setReasonError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await apiRequest(`/admin/reports?status=${status}&page=${page}&limit=20`)) }
    catch (requestError) { setError(requestError.message || 'Reports could not be loaded.') }
    finally { setLoading(false) }
  }, [status, page])
  useEffect(() => { void load() }, [load])

  const resolve = async (nextAction = 'resolve') => {
    if (!selected) return
    if (reason.trim().length < 3) { setReasonError('Add a resolution note of at least 3 characters.'); return }
    setReasonError('')
    setSaving(true)
    try {
      await apiRequest(`/admin/reports/${selected._id}/resolve`, { method: 'POST', body: JSON.stringify({ action: nextAction, reason: reason.trim() }) })
      toast.success(nextAction === 'dismiss' ? 'Report dismissed.' : nextAction === 'remove-review' ? 'Review removed and report resolved.' : 'Report resolved.')
      setSelected(null); await load()
    } catch (requestError) { toast.error(requestError.message || 'Report could not be resolved.') }
    finally { setSaving(false) }
  }

  return <>
    <AdminPageTitle title="Reported content" description="Review community reports, inspect the reported review and record a resolution." />
    <div className="mb-5 flex gap-2">{['open', 'resolved', 'dismissed'].map((item) => <button key={item} onClick={() => { setStatus(item); setPage(1) }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold capitalize ${status === item ? 'bg-teal text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item}</button>)}</div>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : !data.data.length ? <EmptyState title="No reports in this queue" body="New reports from published reviews will appear here." /> : <div className="space-y-4">{data.data.map((report) => <AdminCard key={report._id}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={report.status} /><span className="rounded-full bg-amber px-2.5 py-1 text-xs font-bold text-ink">{reasonLabels[report.reason] || report.reason}</span><time className="text-xs text-slate-500">{formatDate(report.createdAt)}</time></div><h2 className="mt-3 text-lg font-bold text-ink">{report.review?.title || 'Review unavailable'}</h2><p className="mt-1 text-sm text-slate-600">Reported by {report.reporter?.name || 'Member'}{report.review?.institution?.name ? ` · ${report.review.institution.name}` : ''}</p></div><button onClick={() => setSelected(report)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-cream"><Eye size={16} />Inspect</button></div>{report.details && <p className="mt-3 rounded-xl bg-cream p-3 text-sm leading-6 text-slate-700">{report.details}</p>}{report.resolution?.reason && <p className="mt-3 text-sm text-slate-500">Resolution: {report.resolution.reason}</p>}</AdminCard>)}</div>}
    {!loading && !error && <Pagination page={page} totalPages={data.pagination?.totalPages} onChange={setPage} />}
    {selected && <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="report-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-teal">Reported review</p><h2 id="report-title" className="mt-1 text-xl font-bold text-ink">{selected.review?.title || 'Review unavailable'}</h2></div><button onClick={() => setSelected(null)} aria-label="Close report" className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button></div>{selected.review && <><p className="mt-4 text-sm text-slate-500">By {selected.review.author?.name} · {selected.review.institution?.name} · {selected.review.overallRating}/5</p><p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{selected.review.body}</p></> }<div className="mt-5 rounded-xl bg-amber/50 p-4 text-sm"><p className="font-bold text-ink">{reasonLabels[selected.reason] || selected.reason}</p><p className="mt-1 text-slate-700">{selected.details || 'No additional details.'}</p></div>{selected.status === 'open' && <div className="mt-5"><label className="block text-sm font-semibold">Resolution note<textarea required minLength={3} maxLength={1000} value={reason} onChange={(event) => { setReason(event.target.value); setReasonError('') }} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-teal" placeholder="Explain the moderation decision" /></label>{reasonError && <p role="alert" className="mt-1 text-sm text-rose-700">{reasonError}</p>}<div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" disabled={saving} onClick={() => void resolve('dismiss')} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"><X size={15} />Dismiss</button><button type="button" disabled={saving} onClick={() => { if (window.confirm('Remove this review and resolve the report?')) void resolve('remove-review') }} className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700"><Flag size={15} />Remove review</button><button type="button" disabled={saving} onClick={() => void resolve('resolve')} className="inline-flex items-center gap-1 rounded-xl bg-teal px-3 py-2 text-sm font-bold text-white"><Check size={15} />Resolve</button></div></div>}</section></div>}
  </>
}
