import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, RefreshCw, Star, UserRound } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { apiRequest } from '../lib/api'

function dateLabel(value) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? 'Not available' : new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date)
}

function ReviewStatus({ status }) {
  const labels = { approved: 'Approved', rejected: 'Rejected', flagged: 'Under review', hidden: 'Hidden by a moderator', removed: 'Removed by a moderator', pending: 'Pending' }
  const label = labels[status] || 'Pending'
  const color = status === 'approved' ? 'bg-emerald-50 text-emerald-700' : ['rejected', 'removed'].includes(status) ? 'bg-rose-50 text-rose-700' : status === 'hidden' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-800'
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${color}`}>{label}</span>
}

export default function ProfilePage() {
  const { user: sessionUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProfile = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError('')
    try {
      setProfile(await apiRequest('/account/profile'))
    } catch (requestError) {
      setError(requestError.message || 'Your profile could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    apiRequest('/account/profile').then((data) => {
      if (active) setProfile(data)
    }).catch((requestError) => {
      if (active) setError(requestError.message || 'Your profile could not be loaded.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  if (loading) return <main className="mx-auto grid min-h-[50vh] max-w-7xl place-items-center px-4 text-sm text-slate-600" role="status">Loading your profile…</main>
  if (error) return <main className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-2xl font-bold text-ink">We couldn’t load your profile</h1><p role="alert" className="mt-3 text-slate-600">{error}</p><button onClick={loadProfile} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 font-semibold text-white"><RefreshCw size={16} />Try again</button></main>

  const account = profile?.user || sessionUser
  const reviews = profile?.reviews || []
  const favorites = profile?.favorites || []
  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {account?.avatarUrl ? <img src={account.avatarUrl} alt={`${account.name}'s profile`} referrerPolicy="no-referrer" className="size-24 rounded-2xl object-cover" /> : <span className="grid size-24 place-items-center rounded-2xl bg-mist text-teal"><UserRound size={38} /></span>}
        <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-widest text-teal">My account</p><h1 className="mt-2 truncate text-3xl font-bold text-ink">{account?.name}</h1><p className="mt-1 truncate text-slate-600">{account?.email}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />Joined {dateLabel(account?.createdAt)}</span><span className="rounded-full bg-mist px-2.5 py-1 text-xs font-bold capitalize text-teal">{account?.role || 'user'}</span></div></div>
      </div>
    </section>

    <section id="my-reviews" className="mt-10 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold text-ink">My reviews</h2><p className="mt-1 text-sm text-slate-600">Your submissions and their moderation status.</p></div><span className="text-sm text-slate-500">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span></div>
      {reviews.length ? <div className="mt-5 grid gap-4">{reviews.map((review) => <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold text-slate-500">{review.institution?.name || 'Institution'}</p><h3 className="mt-1 text-lg font-bold text-ink">{review.title}</h3></div><ReviewStatus status={review.status} /></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{review.body}</p><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span className="inline-flex items-center gap-1"><Star size={14} className="fill-amber text-amber" />{review.overallRating} / 5</span><span>{dateLabel(review.createdAt)}</span></div></article>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-semibold text-ink">No reviews yet</p><Link to="/review" className="mt-2 inline-block text-sm font-bold text-teal hover:text-ink">Write your first review</Link></div>}
    </section>

    <section id="saved-institutions" className="mt-10 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold text-ink">Saved colleges</h2><p className="mt-1 text-sm text-slate-600">Institutions you’ve saved for later.</p></div><span className="text-sm text-slate-500">{favorites.length} saved</span></div>
      {favorites.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{favorites.map(({ id, institution }) => <Link key={id} to={`/institutions/${institution.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal/40 hover:shadow-sm"><div className="flex items-center gap-3">{institution.logo?.secureUrl ? <img src={institution.logo.secureUrl} alt="" className="size-12 rounded-xl object-cover" /> : <span className="grid size-12 place-items-center rounded-xl bg-mist text-teal"><UserRound size={20} /></span>}<div className="min-w-0"><h3 className="truncate font-bold text-ink">{institution.name}</h3><p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500"><MapPin size={13} />{[institution.location?.city, institution.location?.country].filter(Boolean).join(', ')}</p></div></div></Link>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-semibold text-ink">No saved institutions yet</p><Link to="/institutions" className="mt-2 inline-block text-sm font-bold text-teal hover:text-ink">Explore institutions</Link></div>}
    </section>

    <section id="account-settings" className="mt-10 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold text-ink">Account settings</h2><p className="mt-2 text-sm leading-6 text-slate-600">Your name, email, and profile image are managed through the Google account you used to sign in. To update them, change your Google profile and sign in again.</p></section>
  </main>
}
