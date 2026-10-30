import { CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { mountGoogleButton, unmountGoogleButton } from '../lib/googleIdentity'

export default function SignInPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, authError } = useAuth()
  const buttonContainer = useRef(null)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const [status, setStatus] = useState(googleClientId ? 'loading' : 'missing-client-id')
  const [submitting, setSubmitting] = useState(false)

  const handleCredential = useCallback(async (response) => {
    if (!response.credential) {
      toast.error('Google did not return a sign-in credential. Please try again.')
      return
    }

    setSubmitting(true)
    try {
      const user = await login(response.credential)
      toast.success(`Welcome, ${user.name}.`)
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to reach the sign-in service. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [login, navigate])

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    let cancelled = false
    const container = buttonContainer.current
    if (!googleClientId || !container) return () => { cancelled = true }

    mountGoogleButton(container, googleClientId, handleCredential, () => !cancelled).then((mounted) => {
      if (mounted && !cancelled) setStatus('ready')
    }).catch(() => {
      if (!cancelled) setStatus('load-error')
    })

    return () => {
      cancelled = true
      unmountGoogleButton(container, handleCredential)
    }
  }, [handleCredential, googleClientId])

  return <main className="grid min-h-[calc(100vh-72px)] bg-white lg:grid-cols-2"><section className="hidden bg-ink p-12 lg:block"><Brand inverse /><div className="mx-auto mt-28 max-w-md"><p className="text-xs font-bold uppercase tracking-[.16em] text-amber">A thoughtful community</p><h1 className="mt-4 text-4xl font-bold leading-tight text-white">Help the next learner choose with confidence.</h1><p className="mt-5 leading-7 text-slate-300">Sign in to save institutions, compare your options, or submit a review for moderation.</p><div className="mt-10 space-y-4">{['Your reviews remain private while they are moderated.', 'No student-verification claims are made from Google sign-in alone.', 'Your sign-in session will be protected by secure server cookies.'].map((text) => <p key={text} className="flex gap-3 text-sm text-slate-300"><CheckCircle2 size={18} className="shrink-0 text-amber" />{text}</p>)}</div></div></section><section className="flex items-center justify-center bg-cream p-5 sm:p-10"><div className="w-full max-w-md"><div className="lg:hidden"><Brand /></div><div className="mt-12 rounded-3xl border border-slate-200 bg-white p-7 shadow-soft sm:p-9"><span className="grid size-12 place-items-center rounded-2xl bg-mist text-teal"><ShieldCheck size={24} /></span><h1 className="mt-5 text-3xl font-bold text-ink">Welcome back</h1><p className="mt-2 leading-6 text-slate-600">Sign in to CampusCompass with the Google account you choose.</p>{authError && <p role="alert" className="mt-3 text-sm text-rose-700">{authError}</p>}<div className="mt-8 flex min-h-11 justify-center" ref={buttonContainer} aria-busy={submitting || status === 'loading'} />{(status === 'loading' || submitting) && <p className="mt-2 text-center text-xs text-slate-500">{submitting ? 'Verifying your Google account…' : 'Loading secure Google sign-in…'}</p>}{status === 'missing-client-id' && <p role="alert" className="mt-3 text-center text-sm text-rose-700">Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in frontend/.env.local.</p>}{status === 'load-error' && <p role="alert" className="mt-3 text-center text-sm text-rose-700">Google sign-in could not load. Check your network connection and try again.</p>}<div className="my-7 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />Secure sign-in<span className="h-px flex-1 bg-slate-200" /></div><p className="text-center text-xs leading-5 text-slate-500">By continuing, you agree to the Terms and acknowledge the Privacy Policy. We request only the profile information needed to create your account.</p><div className="mt-7 rounded-xl bg-mist/70 p-3 text-xs leading-5 text-slate-600"><LockKeyhole size={14} className="mr-1 inline text-teal" />Google verifies your identity; CampusCompass stores its session in a secure HTTP-only cookie.</div><Link to="/" className="mt-6 block text-center text-sm font-semibold text-teal hover:text-ink">Return to CampusCompass</Link></div></div></section></main>
}
