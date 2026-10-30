import { useCallback, useEffect, useState } from 'react'
import { Activity, Building2, CheckCircle2, ClipboardList, Flag, GraduationCap, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { AdminCard, AdminPageTitle, ErrorState, formatDate, LoadingState, StatCard, StatusBadge } from '../components/admin/AdminPrimitives'

function TrendChart({ title, rows, color = '#287A74' }) {
  const values = (rows || []).map((item) => item.count)
  const max = Math.max(1, ...values)
  const points = values.map((value, index) => {
    const x = values.length <= 1 ? 180 : 12 + (index * 336) / (values.length - 1)
    const y = 118 - (value / max) * 92
    return `${x},${y}`
  }).join(' ')
  return <AdminCard><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-ink">{title}</h2><p className="mt-1 text-xs text-slate-500">Monthly totals · last six months</p></div><span className="size-2.5 rounded-full" style={{ backgroundColor: color }} /></div><svg viewBox="0 0 360 150" role="img" aria-label={`${title} chart`} className="mt-5 h-36 w-full overflow-visible"><title>{title}</title><line x1="8" y1="120" x2="352" y2="120" stroke="#dbe5e1" /><polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{values.map((value, index) => { const x = values.length <= 1 ? 180 : 12 + (index * 336) / (values.length - 1); const y = 118 - (value / max) * 92; return <g key={rows[index].month}><circle cx={x} cy={y} r="4" fill={color} /><title>{rows[index].month}: {value}</title><text x={x} y="144" textAnchor="middle" fill="#687b76" fontSize="9">{rows[index].month.slice(5)}</text></g> })}</svg></AdminCard>
}

function BarChart({ title, rows, labelKey }) {
  const max = Math.max(1, ...(rows || []).map((row) => row.count))
  return <AdminCard><h2 className="font-bold text-ink">{title}</h2><div className="mt-5 space-y-4">{rows?.map((row) => <div key={row[labelKey]}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="font-semibold text-slate-600">{row[labelKey]}</span><span className="font-bold text-ink">{row.count}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal transition-all" style={{ width: `${Math.max(row.count ? 2 : 0, (row.count / max) * 100)}%` }} /></div></div>)}{!rows?.length && <p className="text-sm text-slate-500">No records yet.</p>}</div></AdminCard>
}

export default function AdminPage({ analyticsOnly = false }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setData(await apiRequest('/admin/dashboard')) } catch (requestError) { setError(requestError.message || 'Dashboard data could not be loaded.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  if (loading) return <><AdminPageTitle title={analyticsOnly ? 'Analytics' : 'Overview'} description="Live CampusCompass data from MongoDB." /><LoadingState rows={5} /></>
  if (error) return <><AdminPageTitle title={analyticsOnly ? 'Analytics' : 'Overview'} /><ErrorState message={error} onRetry={load} /></>

  const { stats, trends, institutionDistribution, moderation, recentUsers, recentReviews, recentInstitutions } = data
  const cards = [
    [Building2, 'Institutions', stats.totalInstitutions, `${stats.publishedInstitutions} published`, 'teal'],
    [GraduationCap, 'Schools', stats.schools, 'All publication states', 'mint'],
    [Building2, 'Colleges', stats.colleges, 'All publication states', 'yellow'],
    [GraduationCap, 'Universities', stats.universities, 'All publication states', 'teal'],
    [Users, 'Registered users', stats.totalUsers, `${stats.activeUsers} active · ${stats.suspendedUsers} suspended`, 'teal'],
    [ClipboardList, 'Total reviews', stats.totalReviews, `${stats.pendingReviews} pending moderation`, 'mint'],
    [CheckCircle2, 'Approved reviews', stats.approvedReviews, `${stats.rejectedReviews} rejected`, 'yellow'],
    [Flag, 'Open reports', stats.openReports, `${stats.flaggedReviews} flagged or hidden reviews`, 'teal'],
    [Activity, 'Average institution rating', Number(stats.averageInstitutionRating || 0).toFixed(2), 'Approved reviews only', 'mint'],
  ]

  return <>
    <AdminPageTitle title={analyticsOnly ? 'Analytics' : 'Overview'} description={analyticsOnly ? 'Registration, review and institution trends from live database records.' : 'A live summary of institutions, members, reviews and moderation activity.'} action={<button onClick={load} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-cream">Refresh data</button>} />
    {!analyticsOnly && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([icon, label, value, detail, tone]) => <StatCard key={label} icon={icon} label={label} value={value} detail={detail} tone={tone} />)}</div>}
    <div className={`mt-6 grid gap-4 ${analyticsOnly ? 'xl:grid-cols-2' : 'xl:grid-cols-2'}`}><TrendChart title="User registrations" rows={trends.users} /><TrendChart title="Review submissions" rows={trends.reviews} color="#55A9A0" /><BarChart title="Published institutions by type" rows={institutionDistribution} labelKey="type" /><BarChart title="Review moderation" rows={moderation} labelKey="status" /></div>
    {!analyticsOnly && <div className="mt-6 grid gap-4 xl:grid-cols-3">
      <RecentTable title="Recently registered users" rows={recentUsers} empty="No registered users yet." render={(user) => <><div className="flex min-w-0 items-center gap-3">{user.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-9 rounded-full object-cover" referrerPolicy="no-referrer" /> : <span className="grid size-9 place-items-center rounded-full bg-mist text-sm font-bold text-teal">{user.name?.slice(0, 1)}</span>}<div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div></div><time className="shrink-0 text-xs text-slate-500">{formatDate(user.createdAt)}</time></>} />
      <RecentTable title="Recent reviews" rows={recentReviews} empty="No reviews submitted yet." render={(review) => <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{review.title}</p><p className="truncate text-xs text-slate-500">{review.institution?.name || 'Institution'} · {review.author?.name || 'Member'}</p></div>} status />
      <RecentTable title="Recently added institutions" rows={recentInstitutions} empty="No institutions added yet." render={(institution) => <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{institution.name}</p><p className="truncate text-xs text-slate-500">{institution.type} · {institution.location?.city || 'Location not set'}</p></div>} status />
    </div>}
    {!analyticsOnly && <div className="mt-5 flex justify-end"><Link to="/admin/institutions/new" className="rounded-xl bg-teal px-4 py-2.5 text-sm font-bold text-white hover:bg-ink">Add an institution</Link></div>}
  </>
}

function RecentTable({ title, rows, empty, render, status = false }) {
  return <AdminCard className="min-w-0"><div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-bold text-ink">{title}</h2><span className="text-xs text-slate-500">Latest 6</span></div>{rows?.length ? <ul className="space-y-3">{rows.map((row) => <li key={row._id} className="flex items-center gap-3 border-t border-slate-100 pt-3 first:border-0 first:pt-0">{render(row)}{status && <StatusBadge status={row.status} />}</li>)}</ul> : <p className="text-sm text-slate-500">{empty}</p>}</AdminCard>
}
