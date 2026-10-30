import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Clock3, Flag, MessageSquareText, Search, ShieldAlert, Star, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { apiRequest } from '../../lib/api'
import { AdminCard, AdminPageTitle, EmptyState, ErrorState, formatDate, LoadingState, Pagination, StatusBadge } from '../../components/admin/AdminPrimitives'

const tabs = [['pending', 'Pending'], ['all', 'All reviews'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['flagged', 'Flagged']]

export default function ReviewModerationPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'pending'
  const page = Number(params.get('page') || 1)
  const [data, setData] = useState({ data: [], pagination: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [action, setAction] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState('')

  const query = useMemo(() => {
    const next = new URLSearchParams()
    next.set('status', status)
    next.set('page', String(page))
    next.set('limit', '20')
    if (search.trim()) next.set('q', search.trim())
    return next.toString()
  }, [status, page, search])
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await apiRequest(`/admin/reviews?${query}`)) }
    catch (requestError) { setError(requestError.message || 'Reviews could not be loaded.') }
    finally { setLoading(false) }
  }, [query])
  useEffect(() => { void load() }, [load])

  const chooseAction = (review, nextAction) => {
    if (nextAction === 'approve') {
      if (!window.confirm(`Approve “${review.title}”? This makes it public and updates institution ratings.`)) return
      void submitAction(review, nextAction, '', '')
      return
    }
    setSelected(review); setAction(nextAction); setReason(''); setNote('')
  }
  const submitAction = async (review, nextAction, nextReason, nextNote) => {
    setSaving(true); setBusyId(review._id)
    try {
      await apiRequest(`/admin/reviews/${review._id}/moderation`, { method: 'POST', body: JSON.stringify({ action: nextAction, ...(nextReason ? { reason: nextReason } : {}), ...(nextNote ? { note: nextNote } : {}) }) })
      toast.success(`Review ${nextAction === 'approve' ? 'approved' : nextAction === 'reject' ? 'rejected' : nextAction === 'flag' ? 'flagged' : nextAction === 'hide' ? 'hidden' : 'removed'}.`)
      setSelected(null); setAction(''); await load()
    } catch (requestError) { toast.error(requestError.message || 'Review moderation failed.') }
    finally { setSaving(false); setBusyId('') }
  }
  const confirmReasonAction = (event) => { event.preventDefault(); if (selected) void submitAction(selected, action, reason, note) }

  return <>
    <AdminPageTitle title="Review moderation" description="Review submissions are private until approved. Rating totals are recalculated with every moderation decision." />
    <div className="mb-5 flex flex-wrap gap-2">{tabs.map(([key, label]) => <button key={key} onClick={() => { const next = new URLSearchParams(params); next.set('status', key); next.delete('page'); setParams(next) }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${status === key ? 'bg-teal text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-cream'}`}>{label}</button>)}</div>
    <AdminCard className="mb-5"><form onSubmit={(event) => { event.preventDefault(); const next = new URLSearchParams(params); next.delete('page'); setParams(next); void load() }} className="flex items-center gap-2"><Search size={17} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search review, reviewer or email" className="min-w-0 flex-1 py-1 text-sm outline-none" aria-label="Search reviews" /><button className="rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white">Search</button></form></AdminCard>
    {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> : !data.data.length ? <EmptyState title={status === 'pending' ? 'Moderation queue is clear' : 'No reviews found'} body="New submissions and moderation results will appear here." /> : <div className="space-y-4">{data.data.map((review) => <AdminCard key={review._id}>
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={review.status} /><span className="text-xs text-slate-500">{formatDate(review.createdAt)}</span></div><h2 className="mt-3 text-lg font-bold text-ink">{review.title}</h2><p className="mt-1 text-sm text-slate-600">{review.institution?.name || 'Institution unavailable'} · {review.author?.name || 'Member'}{review.author?.email ? ` · ${review.author.email}` : ''}</p></div><div className="inline-flex items-center gap-1 rounded-xl bg-amber px-3 py-2 text-sm font-bold text-ink"><Star size={16} fill="currentColor" />{review.overallRating} / 5</div></div>
      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{review.body}</p>{(review.pros || review.cons) && <div className="mt-3 grid gap-3 sm:grid-cols-2">{review.pros && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><strong>Pros:</strong> {review.pros}</p>}{review.cons && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900"><strong>Cons:</strong> {review.cons}</p>}</div>}
      {review.attachments?.filter((item) => item.status !== 'rejected').length > 0 && <div className="mt-4 flex flex-wrap gap-2">{review.attachments.filter((item) => item.status !== 'rejected').map((image) => <a key={image.publicId} href={image.secureUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-200 p-1"><img src={image.secureUrl} alt={image.alt || 'Review attachment'} className="size-20 rounded-lg object-cover" /></a>)}</div>}
      {review.moderation?.note && <p className="mt-3 rounded-xl bg-amber/40 p-3 text-sm text-ink"><strong>Internal note:</strong> {review.moderation.note}</p>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><button onClick={() => { setSelected(review); setAction('history') }} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal"><Clock3 size={16} />Moderation history</button><div className="flex flex-wrap gap-2">{review.status === 'pending' && <><button disabled={busyId === review._id} onClick={() => chooseAction(review, 'approve')} className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Check size={15} />Approve</button><button onClick={() => chooseAction(review, 'reject')} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"><X size={15} />Reject</button><button onClick={() => chooseAction(review, 'flag')} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-amber"><Flag size={15} />Flag</button></>}{review.status === 'approved' && <><button onClick={() => chooseAction(review, 'hide')} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-amber"><ShieldAlert size={15} />Hide</button><button onClick={() => chooseAction(review, 'remove')} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"><X size={15} />Remove</button></>}</div></div>
    </AdminCard>)}</div>}
    {!loading && !error && <Pagination page={page} totalPages={data.pagination?.totalPages} onChange={(nextPage) => { const next = new URLSearchParams(params); next.set('page', String(nextPage)); setParams(next) }} />}
    {selected && action === 'history' && <HistoryDialog review={selected} onClose={() => setSelected(null)} />}
    {selected && action !== 'history' && <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/50 p-4"><form onSubmit={confirmReasonAction} role="dialog" aria-modal="true" aria-labelledby="moderation-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h2 id="moderation-title" className="text-xl font-bold text-ink">{action[0].toUpperCase() + action.slice(1)} review</h2><p className="mt-1 text-sm text-slate-600">Add a private reason for this decision. It is recorded in the moderation history.</p><label className="mt-5 block text-sm font-semibold">Reason<textarea required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-teal" /></label><label className="mt-4 block text-sm font-semibold">Internal note (optional)<textarea maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-teal" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => { setSelected(null); setAction('') }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={saving} className="rounded-xl bg-teal px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving…' : `Confirm ${action}`}</button></div></form></div>}
  </>
}

function HistoryDialog({ review, onClose }) {
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { apiRequest(`/admin/reviews/${review._id}/moderation-history`).then(setHistory).catch((requestError) => setError(requestError.message || 'History could not be loaded.')) }, [review._id])
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="history-title" className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><h2 id="history-title" className="text-xl font-bold text-ink">Moderation history</h2><p className="mt-1 text-sm text-slate-500">{review.title}</p></div><button onClick={onClose} aria-label="Close history" className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button></div>{error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}<ul className="mt-5 space-y-3">{history.map((entry) => <li key={entry._id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-2"><span className="font-bold capitalize text-ink">{entry.action.replaceAll('-', ' ')}</span><time className="text-xs text-slate-500">{formatDate(entry.createdAt)}</time></div><p className="mt-1 text-sm text-slate-600">{entry.actor?.name || 'Moderator'}{entry.reason ? ` · ${entry.reason}` : ''}</p></li>)}</ul>{!history.length && !error && <div className="mt-5 text-sm text-slate-500"><MessageSquareText className="mr-1 inline" size={16} />No decisions recorded yet.</div>}</section></div>
}
