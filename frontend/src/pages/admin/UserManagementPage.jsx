import { useCallback, useEffect, useState } from 'react'
import { Search, UserRound, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiRequest } from '../../lib/api'
import { AdminCard, AdminPageTitle, EmptyState, ErrorState, formatDate, LoadingState, Pagination, StatusBadge } from '../../components/admin/AdminPrimitives'

export default function UserManagementPage() {
  const [filter, setFilter] = useState({ q: '', role: '', status: '', page: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [data, setData] = useState({ data: [], pagination: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ page: filter.page, limit: '20' })
      if (filter.q) params.set('q', filter.q)
      if (filter.role) params.set('role', filter.role)
      if (filter.status) params.set('status', filter.status)
      setData(await apiRequest(`/admin/users?${params}`))
    } catch (requestError) { setError(requestError.message || 'Users could not be loaded.') }
    finally { setLoading(false) }
  }, [filter])
  useEffect(() => { void load() }, [load])

  const action = async (user, kind, value) => {
    const label = kind === 'status' ? `${value} this account` : `change ${user.name}'s role to ${value}`
    if (!window.confirm(`Are you sure you want to ${label}? Existing sessions are revoked.`)) return
    setBusy(true)
    try {
      await apiRequest(`/admin/users/${user._id}/${kind}`, { method: 'PATCH', body: JSON.stringify({ [kind]: value }) })
      toast.success('Account updated and existing sessions revoked.')
      await load()
      if (selected?._id === user._id) await openUser(user)
    } catch (requestError) { toast.error(requestError.message || 'Account could not be updated.') }
    finally { setBusy(false) }
  }

  const openUser = async (user) => {
    setSelected(user); setDetail(null)
    try { setDetail(await apiRequest(`/admin/users/${user._id}`)) }
    catch (requestError) { toast.error(requestError.message || 'User details could not be loaded.') }
  }

  return <>
    <AdminPageTitle title="User management" description="Review account activity, roles and status. Suspensions and deactivations revoke existing sessions." />
    <AdminCard className="mb-5"><div className="grid gap-3 sm:grid-cols-[1fr_180px_180px_auto]"><form onSubmit={(event) => { event.preventDefault(); setFilter((value) => ({ ...value, q: searchInput.trim(), page: 1 })) }} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3"><Search size={17} className="text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} aria-label="Search users" placeholder="Search name or email" className="min-w-0 flex-1 py-2.5 text-sm outline-none" /></form><select value={filter.role} onChange={(event) => setFilter((value) => ({ ...value, role: event.target.value, page: 1 }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">All roles</option><option value="user">User</option><option value="admin">Admin</option></select><select value={filter.status} onChange={(event) => setFilter((value) => ({ ...value, status: event.target.value, page: 1 }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="deactivated">Deactivated</option></select><button onClick={load} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-cream">Refresh</button></div></AdminCard>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : !data.data.length ? <EmptyState title="No users found" body="Try another search or filter." /> : <AdminCard className="overflow-hidden p-0"><div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Member</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Reviews</th><th className="px-5 py-3">Last activity</th><th className="px-5 py-3">Actions</th></tr></thead><tbody>{data.data.map((user) => <tr key={user._id} className="border-t border-slate-100 text-sm"><td className="px-5 py-4"><button onClick={() => openUser(user)} className="flex items-center gap-3 text-left">{user.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-10 rounded-full object-cover" referrerPolicy="no-referrer" /> : <span className="grid size-10 place-items-center rounded-full bg-mist text-teal"><UserRound size={18} /></span>}<span><span className="block font-bold text-ink">{user.name}</span><span className="block text-xs text-slate-500">{user.email}</span></span></button></td><td className="px-5 py-4 text-slate-500">{formatDate(user.createdAt)}</td><td className="px-5 py-4"><select value={user.role} disabled={busy} onChange={(event) => action(user, 'role', event.target.value)} aria-label={`Change ${user.name} role`} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"><option value="user">User</option><option value="admin">Admin</option></select></td><td className="px-5 py-4"><StatusBadge status={user.status} /></td><td className="px-5 py-4">{user.reviewCount}</td><td className="px-5 py-4 text-slate-500">{formatDate(user.lastLoginAt)}</td><td className="px-5 py-4"><select value="" disabled={busy} onChange={(event) => { const next = event.target.value; if (next) void action(user, 'status', next) }} aria-label={`Manage ${user.name} account`} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold"><option value="">Manage…</option>{user.status !== 'active' && <option value="active">Reactivate</option>}{user.status !== 'suspended' && <option value="suspended">Suspend</option>}{user.status !== 'deactivated' && <option value="deactivated">Deactivate</option>}</select></td></tr>)}</tbody></table></div></AdminCard>}
    {!loading && !error && <Pagination page={filter.page} totalPages={data.pagination?.totalPages} onChange={(page) => setFilter((value) => ({ ...value, page }))} />}
    {selected && <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="user-details-title" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div className="flex items-center gap-3">{selected.avatarUrl ? <img src={selected.avatarUrl} alt="" className="size-14 rounded-full object-cover" /> : <span className="grid size-14 place-items-center rounded-full bg-mist text-teal"><UserRound /></span>}<div><h2 id="user-details-title" className="text-xl font-bold text-ink">{selected.name}</h2><p className="text-sm text-slate-500">{selected.email}</p></div></div><button onClick={() => setSelected(null)} aria-label="Close user details" className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button></div>{detail ? <><div className="mt-5 flex flex-wrap gap-3 text-sm"><StatusBadge status={detail.user.status} /><span className="rounded-full bg-mist px-3 py-1 font-semibold capitalize text-teal">{detail.user.role}</span><span className="text-slate-500">Joined {formatDate(detail.user.createdAt)} · Last activity {formatDate(detail.user.lastLoginAt)}</span></div><h3 className="mt-6 font-bold text-ink">Review history</h3><ul className="mt-3 space-y-2">{detail.reviews.map((review) => <li key={review._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><div><p className="font-semibold text-ink">{review.title}</p><p className="text-xs text-slate-500">{review.institution?.name || 'Institution'} · {formatDate(review.createdAt)}</p></div><StatusBadge status={review.status} /></li>)}</ul>{!detail.reviews.length && <p className="mt-2 text-sm text-slate-500">No review history.</p>}</> : <p className="mt-6 text-sm text-slate-500">Loading member details…</p>}</section></div>}
  </>
}
