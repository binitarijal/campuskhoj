import { useCallback, useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { apiRequest } from '../../lib/api'
import { AdminCard, AdminPageTitle, EmptyState, ErrorState, formatDate, LoadingState, Pagination } from '../../components/admin/AdminPrimitives'

export default function ActivityLogPage() {
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState('')
  const [result, setResult] = useState({ data: [], pagination: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { const params = new URLSearchParams({ page, limit: '30' }); if (entityType) params.set('entityType', entityType); setResult(await apiRequest(`/admin/activity-logs?${params}`)) }
    catch (requestError) { setError(requestError.message || 'Activity history could not be loaded.') }
    finally { setLoading(false) }
  }, [page, entityType])
  useEffect(() => { void load() }, [load])

  return <>
    <AdminPageTitle title="Admin activity logs" description="Append-only audit events for moderation and administrator changes." />
    <AdminCard className="mb-5"><label className="flex max-w-xs items-center gap-3 text-sm font-semibold">Filter activity<select value={entityType} onChange={(event) => { setEntityType(event.target.value); setPage(1) }} className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"><option value="">All activity</option>{['review', 'institution', 'user', 'report', 'category'].map((value) => <option key={value}>{value}</option>)}</select></label></AdminCard>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : !result.data.length ? <EmptyState title="No admin activity recorded" body="Publishing, account changes and moderation decisions will appear here." /> : <AdminCard><ol className="space-y-0">{result.data.map((entry) => <li key={entry._id} className="relative flex gap-4 border-l border-slate-200 pb-6 pl-6 last:border-l-transparent last:pb-0"><span className="absolute -left-[9px] top-0 grid size-4 place-items-center rounded-full border-2 border-white bg-teal"><Activity size={9} className="text-white" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold capitalize text-ink">{entry.action.replaceAll('-', ' ')} <span className="font-normal text-slate-500">· {entry.entityType}</span></p><time className="text-xs text-slate-500">{formatDate(entry.createdAt)}</time></div><p className="mt-1 text-sm text-slate-600">{entry.actor?.name || 'Administrator'}{entry.reason ? ` · ${entry.reason}` : ''}</p><p className="mt-1 break-all font-mono text-xs text-slate-400">Record {entry.entityId}</p></div></li>)}</ol></AdminCard>}
    {!loading && !error && <Pagination page={page} totalPages={result.pagination?.totalPages} onChange={setPage} />}
  </>
}
