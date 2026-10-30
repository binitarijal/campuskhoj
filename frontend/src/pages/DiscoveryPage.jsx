import { useCallback, useEffect, useState } from 'react'
import { Filter, Grid2X2, List, Search, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import InstitutionCard from '../components/InstitutionCard'
import { apiRequest } from '../lib/api'
import { EmptyState, SecondaryButton } from '../components/ui'
import { ErrorState, LoadingState } from '../components/admin/AdminPrimitives'

const facilities = ['library', 'digital-library', 'laboratories', 'computer-labs', 'classrooms', 'smart-classrooms', 'auditorium', 'sports-grounds', 'gymnasium', 'cafeteria', 'hostel', 'transportation', 'medical', 'wifi', 'security', 'parking', 'research']

export default function DiscoveryPageLive() {
  const [params, setParams] = useSearchParams()
  const [queryInput, setQueryInput] = useState(params.get('q') || '')
  const [cityInput, setCityInput] = useState(params.get('city') || '')
  const [layout, setLayout] = useState('grid')
  const [filterOpen, setFilterOpen] = useState(false)
  const [result, setResult] = useState({ data: [], pagination: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const page = Number(params.get('page') || 1)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const query = new URLSearchParams(params)
      query.set('limit', '12')
      const sortMap = { rating: 'rating_desc', reviews: 'reviews_desc', newest: 'newest', name: 'name_asc' }
      query.set('sort', sortMap[query.get('sort')] || query.get('sort') || 'rating_desc')
      setResult(await apiRequest(`/institutions?${query}`))
    } catch (requestError) { setError(requestError.message || 'Institutions could not be loaded.') }
    finally { setLoading(false) }
  }, [params])
  useEffect(() => { setQueryInput(params.get('q') || ''); setCityInput(params.get('city') || '') }, [params])
  useEffect(() => { void load() }, [load])

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    next.delete('page'); setParams(next)
  }
  const search = (event) => { event.preventDefault(); const next = new URLSearchParams(params); if (queryInput.trim()) next.set('q', queryInput.trim()); else next.delete('q'); if (cityInput.trim()) next.set('city', cityInput.trim()); else next.delete('city'); next.delete('page'); setParams(next) }
  const clear = () => { setParams({}) }
  const activeFilters = [...params.entries()].filter(([key]) => ['q', 'type', 'city', 'country', 'facility', 'minRating'].includes(key))

  return <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-teal">Institution discovery</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Find a place that fits.</h1><p className="mt-3 text-slate-600">Search published institution details, courses, locations, facilities and approved ratings.</p></div><form onSubmit={search} className="mt-7 flex flex-col gap-3 lg:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3"><Search size={17} className="text-slate-400" /><input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} aria-label="Search name or course" placeholder="Search school, course, or city" className="min-w-0 flex-1 py-3 text-sm outline-none" /></label><input value={cityInput} onChange={(event) => setCityInput(event.target.value)} aria-label="Filter by city" placeholder="City" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal" /><SecondaryButton type="submit">Search</SecondaryButton><SecondaryButton type="button" onClick={() => setFilterOpen((value) => !value)} className="lg:hidden"><Filter size={17} />Filters</SecondaryButton></form>
    <div className="mt-6 grid gap-8 lg:grid-cols-[250px_1fr]"><aside className={`${filterOpen ? 'block' : 'hidden'} h-fit rounded-2xl border border-slate-200 bg-white p-5 lg:block`}><div className="flex items-center justify-between"><h2 className="font-bold text-ink">Filters</h2><button onClick={clear} className="text-xs font-bold text-teal">Clear all</button></div><label className="mt-5 block border-t border-slate-100 pt-4 text-sm font-semibold">Institution type<select value={params.get('type') || ''} onChange={(event) => setFilter('type', event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2.5 font-normal"><option value="">All types</option><option>School</option><option>College</option><option>University</option></select></label><label className="mt-5 block border-t border-slate-100 pt-4 text-sm font-semibold">Country<input value={params.get('country') || ''} onChange={(event) => setFilter('country', event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 p-2.5 font-normal" placeholder="Any country" /></label><label className="mt-5 block border-t border-slate-100 pt-4 text-sm font-semibold">Facility<select value={params.get('facility') || ''} onChange={(event) => setFilter('facility', event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2.5 font-normal"><option value="">Any facility</option>{facilities.map((facility) => <option key={facility} value={facility}>{facility.replaceAll('-', ' ')}</option>)}</select></label><label className="mt-5 block border-t border-slate-100 pt-4 text-sm font-semibold">Minimum rating<select value={params.get('minRating') || ''} onChange={(event) => setFilter('minRating', event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2.5 font-normal"><option value="">Any rating</option>{[4.5, 4, 3.5, 3].map((rating) => <option key={rating} value={rating}>{rating} and up</option>)}</select></label></aside>
      <section><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600"><strong className="text-ink">{result.pagination?.total || 0}</strong> published institutions</p><div className="flex items-center gap-2"><select value={params.get('sort') || 'rating'} onChange={(event) => setFilter('sort', event.target.value)} aria-label="Sort institutions" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="rating">Highest rated</option><option value="reviews">Most reviewed</option><option value="newest">Recently added</option><option value="name">Alphabetical</option></select><div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white"><button onClick={() => setLayout('grid')} className={`p-2 ${layout === 'grid' ? 'bg-mist text-teal' : 'text-slate-500'}`} aria-label="Grid view"><Grid2X2 size={18} /></button><button onClick={() => setLayout('list')} className={`p-2 ${layout === 'list' ? 'bg-mist text-teal' : 'text-slate-500'}`} aria-label="List view"><List size={18} /></button></div></div></div>
        {activeFilters.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{activeFilters.map(([key, value]) => <button key={key} onClick={() => setFilter(key, '')} className="inline-flex items-center gap-1 rounded-full bg-mist px-3 py-1 text-xs font-semibold text-teal">{value}<X size={13} /></button>)}</div>}
        <div className={`mt-5 grid gap-5 ${layout === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>{loading ? <div className="col-span-full"><LoadingState rows={6} /></div> : error ? <div className="col-span-full"><ErrorState message={error} onRetry={load} /></div> : result.data.map((institution) => <InstitutionCard key={institution._id} institution={institution} layout={layout} />)}</div>
        {!loading && !error && result.data.length === 0 && <EmptyState title="No published institutions match" body="Try another search or clear a filter. Newly published listings will appear here." />}
        {!loading && !error && result.pagination?.totalPages > 1 && <div className="mt-6 flex items-center justify-between"><span className="text-sm text-slate-500">Page {page} of {result.pagination.totalPages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setFilter('page', String(page - 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><button disabled={page >= result.pagination.totalPages} onClick={() => setFilter('page', String(page + 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40">Next</button></div></div>}
      </section></div></main>
}
