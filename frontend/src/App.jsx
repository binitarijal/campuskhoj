import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './context/useAuth'
import ComparisonTray from './components/ComparisonTray'
import { Footer } from './components/Navigation'
import Navigation from './components/Navigation'
import { ComparisonProvider } from './context/ComparisonContext'
const AdminPage = lazy(() => import('./pages/AdminPage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const DiscoveryPage = lazy(() => import('./pages/DiscoveryPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const InstitutionPage = lazy(() => import('./pages/InstitutionPage'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const SignInPage = lazy(() => import('./pages/SignInPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const InstitutionManagementPage = lazy(() => import('./pages/admin/InstitutionManagementPage'))
const InstitutionEditorPage = lazy(() => import('./pages/admin/InstitutionEditorPage'))
const ReviewModerationPage = lazy(() => import('./pages/admin/ReviewModerationPage'))
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'))
const ReportedContentPage = lazy(() => import('./pages/admin/ReportedContentPage'))
const CatalogManagementPage = lazy(() => import('./pages/admin/CatalogManagementPage'))
const ActivityLogPage = lazy(() => import('./pages/admin/ActivityLogPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'))

function NotFound() { return <main className="mx-auto max-w-7xl px-4 py-24 text-center"><p className="text-sm font-bold text-teal">404</p><h1 className="mt-2 text-4xl font-bold text-ink">This page is off the map.</h1></main> }

function RequireAuth({ children, admin = false }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <main className="grid min-h-[50vh] place-items-center text-sm text-slate-600" role="status">Checking your session…</main>
  if (!isAuthenticated) return <Navigate to="/sign-in" replace />
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { pathname } = useLocation()
  const inAdmin = pathname.startsWith('/admin')
  return <ComparisonProvider><div className="min-h-screen bg-cream text-slate-800">{!inAdmin && <Navigation />}<Suspense fallback={<main className="grid min-h-[50vh] place-items-center text-sm text-slate-600" role="status">Loading CampusCompass…</main>}><Routes><Route path="/" element={<HomePage />} /><Route path="/institutions" element={<DiscoveryPage />} /><Route path="/institutions/:slug" element={<InstitutionPage />} /><Route path="/compare" element={<ComparePage />} /><Route path="/review" element={<RequireAuth><ReviewPage /></RequireAuth>} /><Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} /><Route path="/sign-in" element={<SignInPage />} /><Route path="/admin" element={<RequireAuth admin><AdminLayout /></RequireAuth>}><Route index element={<AdminPage />} /><Route path="institutions" element={<InstitutionManagementPage />} /><Route path="institutions/new" element={<InstitutionEditorPage />} /><Route path="institutions/:id/edit" element={<InstitutionEditorPage />} /><Route path="reviews" element={<ReviewModerationPage />} /><Route path="users" element={<UserManagementPage />} /><Route path="reports" element={<ReportedContentPage />} /><Route path="catalog" element={<CatalogManagementPage />} /><Route path="analytics" element={<AdminPage analyticsOnly />} /><Route path="activity" element={<ActivityLogPage />} /><Route path="settings" element={<AdminSettingsPage />} /><Route path="*" element={<NotFound />} /></Route><Route path="*" element={<NotFound />} /></Routes></Suspense>{!inAdmin && <><ComparisonTray /><Footer /></>}</div></ComparisonProvider>
}
