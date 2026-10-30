import { KeyRound, ShieldCheck } from 'lucide-react'
import { AdminCard, AdminPageTitle } from '../../components/admin/AdminPrimitives'

export default function AdminSettingsPage() {
  return <>
    <AdminPageTitle title="Settings" description="Security and moderation guidance for the CampusCompass administrator workspace." />
    <div className="grid gap-5 lg:grid-cols-2"><AdminCard><span className="grid size-11 place-items-center rounded-xl bg-mist text-teal"><ShieldCheck size={20} /></span><h2 className="mt-4 font-bold text-ink">Administrator access</h2><p className="mt-2 text-sm leading-6 text-slate-600">Administrator role is read from the MongoDB user record and checked again on every admin API request. User suspensions revoke existing sessions.</p></AdminCard><AdminCard><span className="grid size-11 place-items-center rounded-xl bg-amber text-ink"><KeyRound size={20} /></span><h2 className="mt-4 font-bold text-ink">Initial administrator</h2><p className="mt-2 text-sm leading-6 text-slate-600">Provision the first administrator from the backend with the configured INITIAL_ADMIN_EMAIL and the bootstrap command. Do not assign roles from a browser or share server credentials.</p><p className="mt-4 rounded-xl bg-cream p-3 font-mono text-xs text-slate-600">npm run bootstrap:admin</p></AdminCard></div>
  </>
}
