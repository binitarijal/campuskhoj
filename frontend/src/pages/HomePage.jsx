import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, BadgeCheck, Building2, GraduationCap, Library, Search, ShieldCheck, Star } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import InstitutionCard from '../components/InstitutionCard'
import { apiRequest } from '../lib/api'
import { Badge, EmptyState, PrimaryButton, SearchField, SectionTitle } from '../components/ui'
import { ErrorState } from '../components/admin/AdminPrimitives'

const categories = [{ label: 'Schools', type: 'School', icon: GraduationCap }, { label: 'Colleges', type: 'College', icon: Building2 }, { label: 'Universities', type: 'University', icon: Library }]

export default function HomePageLive() {
  const [query, setQuery] = useState('')
  const [featured, setFeatured] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const load = useCallback(async () => {
    try { setFeatured(await apiRequest('/institutions/featured')) }
    catch (requestError) { setError(requestError.message || 'Published institutions could not be loaded.') }
    finally { setLoading(false) }
  }, [])
  const retry = () => { setError(''); setLoading(true); void load() }
  useEffect(() => { void load() }, [load])
  const search = (event) => { event.preventDefault(); navigate(`/institutions?q=${encodeURIComponent(query)}`) }

  return <>
    <section className="relative overflow-hidden bg-ink"><div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" /><div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_.9fr] lg:px-8"><div className="max-w-2xl"><Badge tone="amber">A clearer way to choose</Badge><h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">Find a place to <span className="text-amber">learn and thrive.</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">Explore published institution details and reviews that have been approved by moderators.</p><form onSubmit={search} className="mt-8 flex max-w-xl flex-col gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur sm:flex-row"><SearchField value={query} onChange={setQuery} className="flex-1 border-0 shadow-none" placeholder="Search school, course, or city" /><PrimaryButton type="submit" className="px-5"><Search size={18} />Search</PrimaryButton></form><div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-200"><span className="inline-flex items-center gap-2"><BadgeCheck size={17} className="text-amber" />Approved reviews only</span><span className="inline-flex items-center gap-2"><BadgeCheck size={17} className="text-amber" />Compare published data</span></div></div><div className="relative mx-auto w-full max-w-md self-center"><div className="hero-campus"><div className="hero-campus-sky" /><div className="hero-campus-window-grid" /><div className="hero-campus-arch" /><div className="hero-campus-tree tree-one" /><div className="hero-campus-tree tree-two" /><div className="absolute bottom-6 left-6 rounded-xl bg-white p-3 shadow-lift"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-lg bg-mist text-teal"><Star size={18} fill="currentColor" /></span><span><strong className="block text-sm text-ink">Reviews with context</strong><span className="text-xs text-slate-600">Read student experiences</span></span></div></div></div></div></div></section>
    <main>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="grid gap-3 sm:grid-cols-3">{categories.map(({ label, type, icon: Icon }) => <Link key={type} to={`/institutions?type=${type}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal/40 hover:shadow-soft"><Icon className="text-teal" size={24} /><p className="mt-4 text-lg font-bold text-ink">{label}</p><p className="mt-1 text-sm text-slate-500">Browse published listings <ArrowRight className="ml-1 inline" size={14} /></p></Link>)}</div></section>
      <section className="bg-white"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><SectionTitle eyebrow="Explore institutions" title="Discover places that fit" body="Ratings and review counts reflect approved community reviews." action={<Link to="/institutions" className="inline-flex items-center gap-1 text-sm font-bold text-teal hover:text-ink">Browse all <ArrowRight size={16} /></Link>} />{error ? <div className="mt-7"><ErrorState message={error} onRetry={retry} /></div> : loading ? <p role="status" className="mt-7 text-sm text-slate-500">Loading published institutions…</p> : featured.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{featured.map((institution) => <InstitutionCard key={institution._id} institution={institution} />)}</div> : <div className="mt-7"><EmptyState title="No institutions published yet" body="Published listings will appear here when an administrator adds and approves institution information." /></div>}</div></section>
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionTitle eyebrow="Trust is built in" title="How reviews reach prospective learners" /><div className="mt-8 grid gap-5 md:grid-cols-3">{[[ShieldCheck, 'Sign in securely', 'Google sign-in protects the review community and keeps account ownership clear.'], [Building2, 'Share your experience', 'Reviews describe a learner’s own experience with an institution.'], [BadgeCheck, 'Moderated before publishing', 'New submissions stay private until an administrator approves them.']].map(([Icon, title, body], index) => <article key={title} className="relative rounded-2xl border border-slate-200 bg-white p-6"><span className="absolute right-5 top-5 text-4xl font-bold text-slate-100">0{index + 1}</span><span className="grid size-11 place-items-center rounded-xl bg-mist text-teal"><Icon size={22} /></span><h3 className="mt-5 font-bold text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></article>)}</div></section>
      <section className="bg-mist"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center lg:px-8"><div><p className="text-xs font-bold uppercase tracking-widest text-teal">For better decisions</p><h2 className="mt-2 text-2xl font-bold text-ink">Compare what matters.</h2></div><Link to="/institutions"><PrimaryButton>Explore institutions <ArrowRight size={17} /></PrimaryButton></Link></div></section>
    </main>
  </>
}
