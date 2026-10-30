import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Archive, Edit3, ExternalLink, FilePlus2, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiRequest } from '../../lib/api'
import { AdminCard, AdminPageTitle, EmptyState, ErrorState, formatDate, LoadingState, Pagination, StatusBadge } from '../../components/admin/AdminPrimitives'

export default function InstitutionManagementPage() {
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState({ data: [], pagination: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(params.get('q') || '')
  const type = params.get('type') || ''
  const status = params.get('status') || ''
  const page = Number(params.get('page') || 1)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const query = new URLSearchParams(params)
      query.set('limit', '20')
      setData(await apiRequest(`/admin/institutions?${query}`))
    } catch (requestError) { setError(requestError.message || 'Institution records could not be loaded.') }
    finally { setLoading(false) }
  }, [params])
  useEffect(() => { void load() }, [load])

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  const changeStatus = async (institution, action) => {
    const labels = { publish: 'publish', unpublish: 'unpublish', archive: 'archive' }
    if (!window.confirm(`Are you sure you want to ${labels[action]} ${institution.name}?`)) return
    try { await apiRequest(`/admin/institutions/${institution._id}/${action}`, { method: 'POST', body: '{}' }); toast.success(`Institution ${action === 'publish' ? 'published' : action === 'archive' ? 'archived' : 'unpublished'}.`); await load() }
    catch (requestError) { toast.error(requestError.message || 'The institution could not be updated.') }
  }

  const deleteInstitution = async (institution) => {
    if (!window.confirm(`Permanently delete ${institution.name}? This is only available when no reviews or saved records depend on it.`)) return
    try { await apiRequest(`/admin/institutions/${institution._id}?confirm=true`, { method: 'DELETE' }); toast.success('Institution deleted.'); await load() }
    catch (requestError) { toast.error(requestError.message || 'This institution could not be deleted.') }
  }

  return <>
    <AdminPageTitle title="Institutions" description="Search, edit, publish, archive or remove institution records." action={<Link to="/admin/institutions/new" className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-bold text-white hover:bg-ink"><FilePlus2 size={17} />Add institution</Link>} />
    <AdminCard className="mb-5"><div className="grid gap-3 sm:grid-cols-[1fr_180px_180px_auto]"><form onSubmit={(event) => { event.preventDefault(); updateFilter('q', search) }} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3"><Search size={17} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 py-2.5 text-sm outline-none" placeholder="Search name, slug or city" aria-label="Search institutions" /></form><select value={type} onChange={(event) => updateFilter('type', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" aria-label="Filter institution type"><option value="">All types</option><option>School</option><option>College</option><option>University</option></select><select value={status} onChange={(event) => updateFilter('status', event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" aria-label="Filter publication status"><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select><button onClick={load} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-cream">Refresh</button></div></AdminCard>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : !data.data.length ? <EmptyState title="No institutions found" body="Add an institution or adjust your search and filters." /> : <AdminCard className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Institution</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Location</th><th className="px-5 py-3">Rating</th><th className="px-5 py-3">Publication</th><th className="px-5 py-3">Verification</th><th className="px-5 py-3">Added</th><th className="px-5 py-3">Actions</th></tr></thead><tbody>{data.data.map((institution) => <tr key={institution._id} className="border-t border-slate-100 text-sm"><td className="px-5 py-4"><div className="flex items-center gap-3">{institution.logo?.secureUrl ? <img src={institution.logo.secureUrl} alt="" className="size-10 rounded-lg object-cover" /> : <span className="grid size-10 place-items-center rounded-lg bg-mist font-bold text-teal">{institution.name.slice(0, 1)}</span>}<div><p className="font-bold text-ink">{institution.name}</p><p className="text-xs text-slate-500">{institution.slug}</p></div></div></td><td className="px-5 py-4">{institution.type}</td><td className="px-5 py-4">{institution.location?.city}, {institution.location?.country}</td><td className="px-5 py-4">{institution.ratingCount ? `${institution.ratingAverage.toFixed(2)} (${institution.ratingCount})` : '—'}</td><td className="px-5 py-4"><StatusBadge status={institution.status} /></td><td className="px-5 py-4"><StatusBadge status={institution.verificationStatus || 'unverified'} /></td><td className="px-5 py-4 text-slate-500">{formatDate(institution.createdAt)}</td><td className="px-5 py-4"><div className="flex items-center gap-1"><Link to={`/admin/institutions/${institution._id}/edit`} aria-label={`Edit ${institution.name}`} className="grid size-9 place-items-center rounded-lg hover:bg-mist hover:text-teal"><Edit3 size={16} /></Link>{institution.status !== 'published' && institution.status !== 'archived' && <button onClick={() => changeStatus(institution, 'publish')} aria-label={`Publish ${institution.name}`} title="Publish" className="grid size-9 place-items-center rounded-lg hover:bg-mist hover:text-teal"><ExternalLink size={16} /></button>}{institution.status === 'published' && <button onClick={() => changeStatus(institution, 'unpublish')} aria-label={`Unpublish ${institution.name}`} title="Unpublish" className="grid size-9 place-items-center rounded-lg hover:bg-amber hover:text-ink"><Archive size={16} /></button>}{institution.status !== 'archived' && <button onClick={() => changeStatus(institution, 'archive')} aria-label={`Archive ${institution.name}`} title="Archive" className="grid size-9 place-items-center rounded-lg hover:bg-amber hover:text-ink"><Archive size={16} /></button>}<button onClick={() => deleteInstitution(institution)} aria-label={`Delete ${institution.name}`} title="Delete" className="grid size-9 place-items-center rounded-lg text-rose-700 hover:bg-rose-50"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div></AdminCard>}
    {!loading && !error && <Pagination page={page} totalPages={data.pagination?.totalPages} onChange={(next) => { const p = new URLSearchParams(params); p.set('page', String(next)); setParams(p) }} />}
  </>
}
