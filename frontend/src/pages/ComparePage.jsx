import { useEffect, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useComparison } from '../context/useComparison'
import { apiRequest } from '../lib/api'
import { EmptyState, PrimaryButton, Stars } from '../components/ui'
import { ErrorState, LoadingState } from '../components/admin/AdminPrimitives'

const idOf = (institution) => institution._id || institution.id

export default function ComparePage() {
  const { comparisonIds, clearComparison } = useComparison()
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    if (comparisonIds.length < 2) { setSelected([]); return }
    let active = true
    setLoading(true); setError('')
    apiRequest(`/institutions/compare?ids=${comparisonIds.join(',')}`).then((items) => { if (active) setSelected(items) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Comparison data could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [comparisonIds, reload])

  if (comparisonIds.length < 2) return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><p className="text-xs font-bold uppercase tracking-widest text-teal">Comparison</p><h1 className="mt-2 text-3xl font-bold text-ink">Compare with clarity</h1><div className="mt-8"><EmptyState title="Choose at least two institutions" body="Add up to three published institutions from discovery to compare courses, facilities, fees, and approved ratings." /></div><Link to="/institutions" className="mt-6 inline-flex"><PrimaryButton>Browse institutions <ArrowRight size={16} /></PrimaryButton></Link></main>
  if (loading) return <main className="mx-auto max-w-7xl px-4 py-12"><LoadingState rows={4} /></main>
  if (error) return <main className="mx-auto max-w-7xl px-4 py-12"><ErrorState message={error} onRetry={() => { setError(''); setReload((value) => value + 1) }} /></main>

  const rows = [
    { name: 'Approved rating', render: (item) => <><Stars value={item.ratingAverage} /><span className="ml-2 text-xs text-slate-500">{item.ratingCount} reviews</span></> },
    { name: 'Location', render: (item) => [item.location?.city, item.location?.stateProvince, item.location?.country].filter(Boolean).join(', ') || '—' },
    { name: 'Courses', render: (item) => <span className="text-sm leading-6">{item.courses?.filter((course) => course.isPublic !== false).map((course) => course.name).join(', ') || '—'}</span> },
    { name: 'Facilities', render: (item) => <ul className="space-y-1.5 text-sm">{item.facilities?.map((facility) => <li key={facility.code} className="flex gap-1.5"><Check size={15} className="shrink-0 text-teal" />{facility.label}</li>) || '—'}</ul> },
    { name: 'Fees', render: (item) => <span className="text-sm">{item.fees?.map((fee) => `${fee.label}: ${fee.amount ?? 'Contact'} ${fee.currency || ''} ${fee.period || ''}`).join(' · ') || 'Contact institution'}</span> },
  ]

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-teal">Comparison</p><h1 className="mt-2 text-3xl font-bold text-ink">Your shortlist, side by side</h1><p className="mt-2 text-slate-600">Ratings and review counts include approved reviews only.</p></div><button className="text-sm font-bold text-teal" onClick={clearComparison}>Clear comparison</button></div><div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="min-w-[760px] w-full text-left"><thead><tr className="border-b border-slate-200 bg-slate-50"><th className="w-48 p-5 text-sm font-bold text-slate-500">Compare</th>{selected.map((item) => <th key={idOf(item)} className="min-w-64 p-5"><Link to={`/institutions/${item.slug}`} className="text-lg font-bold text-ink hover:text-teal">{item.name}</Link><p className="mt-1 text-sm font-normal text-slate-500">{item.type} · {item.location?.city}</p></th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.name} className="border-b border-slate-100 last:border-0"><th className="p-5 align-top text-sm font-bold text-ink">{row.name}</th>{selected.map((item) => <td key={idOf(item)} className="p-5 align-top text-slate-600">{row.render(item)}</td>)}</tr>)}</tbody></table></div></main>
}
