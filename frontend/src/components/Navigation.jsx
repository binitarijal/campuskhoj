import { LogOut, Menu, Scale, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useComparison } from '../context/useComparison'
import { useAuth } from '../context/useAuth'
import toast from 'react-hot-toast'
import { Brand, PrimaryButton } from './ui'

const navItems = [{ label: 'Discover', to: '/institutions' }, { label: 'Compare', to: '/compare' }, { label: 'How it works', to: '/#how-it-works' }]

export default function Navigation() {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()
  const { comparisonIds } = useComparison()
  const profileMenu = [
    ['My Profile', '/profile'], ['My Reviews', '/profile#my-reviews'],
    ['Saved Colleges', '/profile#saved-institutions'], ['Account Settings', '/profile#account-settings'],
  ]
  const signOut = async () => {
    try {
      await logout()
      setOpen(false)
      navigate('/', { replace: true })
      toast.success('You have signed out.')
    } catch (error) {
      toast.error(error.message || 'Sign out failed. Please try again.')
    }
  }
  const closeProfileMenu = (event) => event.currentTarget.closest('details')?.removeAttribute('open')
  const identity = isAuthenticated && <details className="group relative">
    <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1.5 text-left outline-none hover:bg-mist focus-visible:ring-2 focus-visible:ring-teal">
      {user.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-9 rounded-full object-cover" /> : <span className="grid size-9 place-items-center rounded-full bg-mist text-teal"><UserRound size={18} /></span>}
      <span className="max-w-32 truncate text-sm font-semibold text-ink">{user.name}</span>
    </summary>
    <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      <div className="border-b border-slate-100 px-3 py-2"><p className="truncate text-sm font-bold text-ink">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div>
      {profileMenu.map(([label, href]) => <Link key={label} to={href} onClick={closeProfileMenu} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-mist hover:text-teal">{label}</Link>)}
      {user.role === 'admin' && <Link to="/admin" onClick={closeProfileMenu} className="block rounded-lg px-3 py-2 text-sm font-semibold text-teal hover:bg-mist">Administration</Link>}
      <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"><LogOut size={16} />Sign out</button>
    </div>
  </details>

  return <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-cream/90 backdrop-blur"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Brand /><nav className="hidden items-center gap-7 md:flex">{navItems.map((item) => <NavLink key={item.label} to={item.to} className={({ isActive }) => `text-sm font-semibold transition ${isActive ? 'text-teal' : 'text-slate-600 hover:text-ink'}`}>{item.label}</NavLink>)}</nav><div className="hidden items-center gap-3 md:flex"><Link to="/compare" className="relative grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-mist hover:text-teal" aria-label="View comparison"><Scale size={20} />{comparisonIds.length > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-amber text-[10px] font-bold text-ink">{comparisonIds.length}</span>}</Link>{!isLoading && (isAuthenticated ? identity : <Link to="/sign-in" className="text-sm font-semibold text-ink hover:text-teal">Sign in</Link>)}<Link to="/review"><PrimaryButton>Write a review</PrimaryButton></Link></div><button onClick={() => setOpen(!open)} className="grid size-10 place-items-center rounded-xl text-ink hover:bg-mist md:hidden" aria-expanded={open} aria-controls="mobile-navigation" aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button></div>{open && <div id="mobile-navigation" className="border-t border-slate-200 bg-cream px-4 py-4 md:hidden"><nav className="mx-auto flex max-w-7xl flex-col gap-2">{navItems.map((item) => <NavLink onClick={() => setOpen(false)} key={item.label} to={item.to} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-mist">{item.label}</NavLink>)}{!isLoading && (isAuthenticated ? <><div className="flex items-center gap-3 rounded-xl px-3 py-2">{user.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-10 rounded-full object-cover" /> : <UserRound size={20} />}<div className="min-w-0"><p className="truncate text-sm font-bold">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div></div>{profileMenu.map(([label, href]) => <Link onClick={() => setOpen(false)} key={label} to={href} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-mist">{label}</Link>)}{user.role === 'admin' && <Link onClick={() => setOpen(false)} to="/admin" className="rounded-lg px-3 py-2.5 text-sm font-semibold text-teal hover:bg-mist">Administration</Link>}<button onClick={signOut} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50"><LogOut size={16} />Sign out</button></> : <Link onClick={() => setOpen(false)} to="/sign-in" className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-mist">Sign in</Link>)}<Link onClick={() => setOpen(false)} to="/review" className="mt-2"><PrimaryButton className="w-full">Write a review</PrimaryButton></Link></nav></div>}</header>
}

export function Footer() { const groups = [['Explore', [['Institutions', '/institutions'], ['Compare schools', '/compare'], ['Write a review', '/review']]], ['Your account', [['Sign in', '/sign-in'], ['My profile', '/profile'], ['How it works', '/#how-it-works']]], ['Administration', [['Admin dashboard', '/admin'], ['Manage institutions', '/admin/institutions'], ['Review moderation', '/admin/reviews']]]]; return <footer className="mt-20 bg-ink text-slate-300"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)] lg:px-8"><div><Brand inverse /><p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">Clearer choices for the next chapter of learning. Reviews are published only after moderation.</p></div>{groups.map(([heading, links]) => <div key={heading}><h3 className="font-semibold text-white">{heading}</h3><ul className="mt-4 space-y-3">{links.map(([label, to]) => <li key={label}><Link className="text-sm hover:text-amber" to={to}>{label}</Link></li>)}</ul></div>)}</div><div className="border-t border-white/10 px-4 py-5 text-center text-xs text-slate-500">© 2026 CampusCompass. Listings and reviews are served by the CampusCompass API.</div></footer> }
