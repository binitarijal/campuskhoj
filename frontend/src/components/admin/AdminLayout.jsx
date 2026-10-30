import { Activity, BarChart3, BookOpen, Building2, ChevronDown, ClipboardCheck, FilePlus2, Flag, LayoutDashboard, LogOut, Menu, Search, Settings, ShieldCheck, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/useAuth'

const nav = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Institutions', to: '/admin/institutions', icon: Building2 },
  { label: 'Add Institution', to: '/admin/institutions/new', icon: FilePlus2 },
  { label: 'Review Moderation', to: '/admin/reviews?status=pending', icon: ShieldCheck },
  { label: 'All Reviews', to: '/admin/reviews?status=all', icon: ClipboardCheck },
  { label: 'User Management', to: '/admin/users', icon: Users },
  { label: 'Reported Content', to: '/admin/reports', icon: Flag },
  { label: 'Categories & Courses', to: '/admin/catalog', icon: BookOpen },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  { label: 'Activity Logs', to: '/admin/activity', icon: Activity },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const signOut = async () => {
    try {
      await logout()
      toast.success('You have signed out.')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(error.message || 'Sign out failed. Please try again.')
    }
  }
  const runSearch = (event) => {
    event.preventDefault()
    navigate(`/admin/institutions${search ? `?q=${encodeURIComponent(search)}` : ''}`)
    setSidebarOpen(false)
  }

  return <div className="min-h-screen bg-cream text-ink">
    {sidebarOpen && <button className="fixed inset-0 z-40 bg-ink/40 md:hidden" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-slate-200 bg-white transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-[72px] items-center justify-between border-b border-slate-100 px-5"><Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-ink"><span className="grid size-9 place-items-center rounded-xl bg-teal text-white"><Building2 size={19} /></span>CampusCompass <span className="text-teal">Admin</span></Link><button onClick={() => setSidebarOpen(false)} className="grid size-9 place-items-center rounded-lg hover:bg-slate-100 md:hidden" aria-label="Close sidebar"><X size={19} /></button></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">{nav.map(({ label, to, icon: Icon, end }) => { const query = to.split('?')[1]; const queryMatches = !query || new URLSearchParams(location.search).get('status') === new URLSearchParams(query).get('status'); return <NavLink key={label} to={to} end={end} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive && queryMatches ? 'bg-mist text-teal' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'}`}><Icon size={18} />{label}</NavLink> })}</nav>
      <div className="border-t border-slate-100 p-3"><div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">{user.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-9 rounded-full object-cover" referrerPolicy="no-referrer" /> : <span className="grid size-9 place-items-center rounded-full bg-mist font-bold text-teal">{user.name?.slice(0, 1)}</span>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{user.name}</p><p className="truncate text-xs text-slate-500">Administrator</p></div><details className="relative"><summary className="grid size-8 cursor-pointer list-none place-items-center rounded-lg hover:bg-white" aria-label="Account options"><ChevronDown size={16} /></summary><div className="absolute bottom-9 right-0 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"><button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"><LogOut size={15} />Log out</button></div></details></div></div>
    </aside>
    <div className="min-h-screen md:pl-[272px]">
      <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8"><button onClick={() => setSidebarOpen(true)} className="grid size-10 place-items-center rounded-xl hover:bg-slate-100 md:hidden" aria-label="Open navigation"><Menu size={20} /></button><div className="hidden min-w-0 flex-1 md:block"><p className="text-xs text-slate-500">CampusCompass / <span className="font-semibold text-ink">Administration</span></p><p className="mt-0.5 text-sm font-bold">Manage the learning community</p></div><form onSubmit={runSearch} className="ml-auto flex w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-cream px-3 py-2"><Search size={17} className="shrink-0 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search institutions" placeholder="Search institutions…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" /></form><Link to="/" className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-cream sm:block">View site</Link></header>
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
    </div>
  </div>
}
