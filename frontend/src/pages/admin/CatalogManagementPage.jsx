import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiRequest } from '../../lib/api'
import { AdminCard, AdminPageTitle, EmptyState, ErrorState, LoadingState, StatusBadge } from '../../components/admin/AdminPrimitives'

const newCategory = () => ({ name: '', slug: '', kind: 'course', description: '', active: true })
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function CatalogManagementPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setItems(await apiRequest('/admin/categories')) }
    catch (requestError) { setError(requestError.message || 'Categories could not be loaded.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  const save = async (event) => {
    event.preventDefault(); setSaving(true)
    try {
      const editing = Boolean(form._id)
      await apiRequest(`/admin/categories${editing ? `/${form._id}` : ''}`, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify({ name: form.name, slug: form.slug, kind: form.kind, description: form.description, active: form.active }) })
      toast.success(editing ? 'Category updated.' : 'Category created.')
      setForm(null); await load()
    } catch (requestError) { toast.error(requestError.message || 'Category could not be saved.') }
    finally { setSaving(false) }
  }

  const deactivate = async (item) => {
    if (!window.confirm(`Deactivate ${item.name}? Existing institution and course records will keep their labels.`)) return
    try { await apiRequest(`/admin/categories/${item._id}`, { method: 'DELETE' }); toast.success('Category deactivated.'); await load() }
    catch (requestError) { toast.error(requestError.message || 'Category could not be deactivated.') }
  }

  return <>
    <AdminPageTitle title="Categories & courses" description="Maintain institution and course category labels used by the discovery catalogue." action={<button onClick={() => setForm(newCategory())} className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-bold text-white"><Plus size={17} />Add category</button>} />
    <div className="grid gap-5 lg:grid-cols-2">{['institution', 'course'].map((kind) => <AdminCard key={kind}><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold capitalize text-ink">{kind} categories</h2><p className="mt-1 text-xs text-slate-500">{items.filter((item) => item.kind === kind).length} categories</p></div></div>{loading ? <LoadingState rows={3} /> : error ? <ErrorState message={error} onRetry={load} /> : !items.some((item) => item.kind === kind) ? <EmptyState title={`No ${kind} categories`} body="Create the first category for the catalogue." /> : <ul className="divide-y divide-slate-100">{items.filter((item) => item.kind === kind).map((item) => <li key={item._id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="font-semibold text-ink">{item.name}</p><p className="text-xs text-slate-500">{item.slug}{item.description ? ` · ${item.description}` : ''}</p></div><div className="flex shrink-0 items-center gap-2"><StatusBadge status={item.active ? 'active' : 'deactivated'} /><button onClick={() => setForm(item)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">Edit</button>{item.active && <button onClick={() => deactivate(item)} aria-label={`Deactivate ${item.name}`} className="rounded-lg p-2 text-rose-700 hover:bg-rose-50"><Trash2 size={15} /></button>}</div></li>)}</ul>}</AdminCard>)}</div>
    {form && <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/50 p-4"><form onSubmit={save} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-bold text-ink">{form._id ? 'Edit category' : 'Add category'}</h2><div className="mt-5 space-y-4"><label className="block text-sm font-semibold">Category name<input required minLength={2} maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: current._id ? current.slug : slugify(event.target.value) }))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label><label className="block text-sm font-semibold">Slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label><label className="block text-sm font-semibold">Type<select value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="course">Course</option><option value="institution">Institution</option></select></label><label className="block text-sm font-semibold">Description<textarea maxLength={500} value={form.description || ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>{form._id && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />Active</label>}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setForm(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={saving} className="rounded-xl bg-teal px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save category'}</button></div></form></div>}
  </>
}
