import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Plus, Save, Trash2, Upload, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { apiRequest } from '../../lib/api'
import { AdminPageTitle, ErrorState, LoadingState } from '../../components/admin/AdminPrimitives'

const blankInstitution = () => ({
  name: '', slug: '', type: 'University', verificationStatus: 'unverified', establishedYear: '', accreditation: [], description: '', history: '',
  location: { country: '', stateProvince: '', city: '', address: '' },
  logo: null, coverImage: null, gallery: [], courses: [], departments: [], faculties: [], facultyProfiles: [], facilities: [], fees: [],
  admissions: { procedure: '', applicationDeadline: '', scholarships: [], financialAid: '', contactName: '', contactEmail: '', contactPhone: '' },
  contacts: { phone: '', email: '', officialWebsite: '', address: '' },
})

const tabs = ['Basics', 'Courses & faculty', 'Facilities', 'Fees & admissions', 'Images']
const facilityChoices = ['library', 'digital-library', 'laboratories', 'computer-labs', 'classrooms', 'smart-classrooms', 'auditorium', 'sports-grounds', 'indoor-sports', 'gymnasium', 'cafeteria', 'hostel', 'transportation', 'medical', 'wifi', 'security', 'parking', 'research', 'other']
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const maxEstablishedYear = new Date().getFullYear()

function TextField({ label, value, onChange, required = false, type = 'text', placeholder = '', min, max, rows }) {
  const common = { value: value ?? '', onChange: (event) => onChange(event.target.value), required, placeholder, min, max, className: 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/10' }
  return <label className="block text-sm font-semibold text-slate-700">{label}{required && <span className="text-rose-700"> *</span>}{rows ? <textarea {...common} rows={rows} /> : <input {...common} type={type} />}</label>
}

function Section({ title, children, action }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold text-ink">{title}</h2>{action}</div>{children}</section>
}

function UploadBox({ label, accept = 'image/jpeg,image/png,image/webp', multiple = false, disabled = false, busy = false, onFiles }) {
  const [dragging, setDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [validationError, setValidationError] = useState('')
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews])
  const takeFiles = (files) => {
    const chosen = Array.from(files || [])
    if (!chosen.length) return
    const valid = chosen.filter((file) => file.size <= 8 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    setValidationError(valid.length !== chosen.length ? 'Only JPEG, PNG or WebP images under 8 MB are accepted.' : '')
    setSelectedFiles(valid)
    setPreviews(valid.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })))
  }
  return <div onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); takeFiles(event.dataTransfer.files) }} className={`rounded-xl border border-dashed p-5 text-center transition ${dragging ? 'border-teal bg-mist/50' : 'border-slate-300'} ${disabled ? 'opacity-50' : ''}`}>
    <Upload size={20} className="mx-auto text-teal" /><p className="mt-2 text-sm font-semibold text-ink">{busy ? 'Uploading…' : label}</p><p className="mt-1 text-xs text-slate-500">Select or drop JPEG, PNG or WebP · max 8 MB each</p>
    <label className={`mt-3 inline-flex cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold ${disabled || busy ? 'pointer-events-none opacity-50' : 'hover:border-teal'}`}>Choose file{multiple ? 's' : ''}<input disabled={disabled || busy} type="file" accept={accept} multiple={multiple} className="sr-only" onChange={(event) => { takeFiles(event.target.files); event.target.value = '' }} /></label>
    {validationError && <p role="alert" className="mt-3 text-sm text-rose-700">{validationError}</p>}
    {previews.length > 0 && <><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{previews.map((preview) => <div key={`${preview.name}-${preview.url}`} className="min-w-0"><img src={preview.url} alt={`Preview of ${preview.name}`} className="aspect-square w-full rounded-lg object-cover" /><p className="truncate text-xs text-slate-500">{preview.name}</p></div>)}</div><div className="mt-3 flex justify-center gap-2"><button type="button" disabled={busy} onClick={() => { setSelectedFiles([]); setPreviews([]); setValidationError('') }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">Clear</button><button type="button" disabled={disabled || busy || !selectedFiles.length} onClick={() => { const files = selectedFiles; setSelectedFiles([]); setPreviews([]); onFiles(files) }} className="rounded-lg bg-teal px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Uploading…' : `Upload ${selectedFiles.length} image${selectedFiles.length === 1 ? '' : 's'}`}</button></div></>}
  </div>
}

export default function InstitutionEditorPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const [form, setForm] = useState(blankInstitution)
  const saveLock = useRef(false)
  const [tab, setTab] = useState(tabs[0])
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const uploadLock = useRef(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [draggedImage, setDraggedImage] = useState(null)

  useEffect(() => {
    if (isNew) return
    let active = true
    apiRequest(`/admin/institutions/${id}`).then((data) => { if (active) setForm({ ...blankInstitution(), ...data, location: { ...blankInstitution().location, ...data.location }, contacts: { ...blankInstitution().contacts, ...data.contacts }, admissions: { ...blankInstitution().admissions, ...data.admissions } }) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Institution could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, isNew])

  const update = useCallback((key, value) => setForm((current) => ({ ...current, [key]: value })), [])
  const updateNested = (group, key, value) => setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }))
  const updateListItem = (key, index, field, value) => setForm((current) => ({ ...current, [key]: current[key].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }))
  const removeListItem = (key, index) => setForm((current) => ({ ...current, [key]: current[key].filter((_, itemIndex) => itemIndex !== index) }))

  const save = async (event) => {
    event.preventDefault()
    if (saveLock.current) return
    saveLock.current = true
    setSaveError('')
    setSaving(true)
    try {
      const payload = {
        name: form.name, slug: form.slug, type: form.type, verificationStatus: form.verificationStatus || 'unverified',
        establishedYear: form.establishedYear ? Number(form.establishedYear) : null,
        accreditation: Array.isArray(form.accreditation) ? form.accreditation : String(form.accreditation || '').split(',').map((item) => item.trim()).filter(Boolean),
        description: form.description, history: form.history,
        location: { country: form.location.country, city: form.location.city, stateProvince: form.location.stateProvince, address: form.location.address, ...(form.location.coordinates ? { coordinates: form.location.coordinates } : {}) },
        logo: form.logo, coverImage: form.coverImage, gallery: form.gallery,
        courses: form.courses.map((course) => ({ ...course, tuitionFee: course.tuitionFee === '' ? undefined : course.tuitionFee == null ? undefined : Number(course.tuitionFee), availableSeats: course.availableSeats === '' ? undefined : course.availableSeats == null ? undefined : Number(course.availableSeats) })),
        departments: form.departments, faculties: form.faculties,
        facultyProfiles: form.facultyProfiles.map((person) => ({ ...person, experienceYears: person.experienceYears === '' ? undefined : person.experienceYears == null ? undefined : Number(person.experienceYears) })),
        facilities: form.facilities,
        fees: form.fees.map((fee) => ({ ...fee, amount: fee.amount === '' ? undefined : fee.amount == null ? undefined : Number(fee.amount) })),
        admission: form.admission,
        contacts: form.contacts,
        admissions: { ...form.admissions, applicationDeadline: form.admissions.applicationDeadline ? new Date(form.admissions.applicationDeadline).toISOString() : null },
      }
      if (isNew) {
        const result = await apiRequest('/admin/institutions', { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Draft saved. Add a description of at least 40 characters and one public course before publishing.')
        navigate(`/admin/institutions/${result._id}/edit`, { replace: true })
      } else {
        await apiRequest(`/admin/institutions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        toast.success('Institution changes saved.')
      }
    } catch (requestError) {
      const fieldDetails = requestError.fields ? Object.entries(requestError.fields).map(([field, message]) => `${field}: ${message}`).join(' · ') : ''
      const message = fieldDetails ? `${requestError.message} ${fieldDetails}` : requestError.message || 'Changes could not be saved.'
      setSaveError(message)
      toast.error(message)
    } finally { saveLock.current = false; setSaving(false) }
  }

  const uploadImages = async (files, collection, facilityCode) => {
    if (isNew) { toast.error('Save this draft first, then upload its images.'); return }
    if (uploadLock.current) return
    const validFiles = files.filter((file) => file.size <= 8 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    if (!validFiles.length) { toast.error('Choose a JPEG, PNG or WebP image under 8 MB.'); return }
    uploadLock.current = true
    setUploading(true)
    try {
      const uploaded = []
      for (let index = 0; index < validFiles.length; index += 1) {
        const file = validFiles[index]
        setUploadProgress(`Uploading ${index + 1} of ${validFiles.length}`)
        const query = new URLSearchParams({ collection, alt: file.name.replace(/\.[^.]+$/, '').slice(0, 100) })
        if (collection === 'facility') query.set('facilityCode', facilityCode)
        if (collection === 'faculty') query.set('facultyIndex', String(facilityCode))
        const asset = await apiRequest(`/admin/institutions/${id}/media?${query}`, { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
        if (!asset?.publicId || !asset?.secureUrl?.startsWith('https://res.cloudinary.com/')) throw new Error('The image service returned an invalid image URL.')
        uploaded.push(asset)
        setForm((current) => {
          if (collection === 'logo' || collection === 'coverImage') return { ...current, [collection]: asset }
          if (collection === 'gallery') return { ...current, gallery: [...current.gallery, asset] }
          if (collection === 'faculty') return { ...current, facultyProfiles: current.facultyProfiles.map((person, index) => index === Number(facilityCode) ? { ...person, photo: asset } : person) }
          return { ...current, facilities: current.facilities.map((facility) => facility.code === facilityCode ? { ...facility, images: [...(facility.images || []), asset] } : facility) }
        })
      }
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded securely.`)
    } catch (requestError) { toast.error(requestError.message || 'Image upload failed. Successfully uploaded images remain saved.') }
    finally { uploadLock.current = false; setUploading(false); setUploadProgress('') }
  }

  const deleteImage = async (asset) => {
    if (!window.confirm('Delete this image from Cloudinary and the institution?')) return
    try {
      const result = await apiRequest(`/admin/institutions/${id}/media`, { method: 'DELETE', body: JSON.stringify({ publicId: asset.publicId }) })
      setForm((current) => ({ ...current, logo: current.logo?.publicId === asset.publicId ? null : current.logo, coverImage: current.coverImage?.publicId === asset.publicId ? null : current.coverImage, gallery: current.gallery.filter((image) => image.publicId !== asset.publicId), facilities: current.facilities.map((facility) => ({ ...facility, images: (facility.images || []).filter((image) => image.publicId !== asset.publicId) })), facultyProfiles: current.facultyProfiles.map((person) => ({ ...person, photo: person.photo?.publicId === asset.publicId ? null : person.photo })) }))
      if (result.cloudinaryStillReferenced) toast.success('Image removed from this listing. The shared Cloudinary image was kept because another record still uses it.')
      else if (result.cloudinaryDeleted === false) toast.error('Image detached from the listing, but Cloudinary cleanup failed. The listing no longer references it.')
      else toast.success('Image deleted.')
    } catch (requestError) { toast.error(requestError.message || 'Image could not be deleted.') }
  }

  const reorderGallery = async (targetIndex) => {
    if (draggedImage === null || draggedImage === targetIndex) return
    const gallery = [...form.gallery]
    const [moved] = gallery.splice(draggedImage, 1)
    gallery.splice(targetIndex, 0, moved)
    const reordered = gallery.map((asset, order) => ({ ...asset, order }))
    update('gallery', reordered); setDraggedImage(null)
    try { await apiRequest(`/admin/institutions/${id}`, { method: 'PATCH', body: JSON.stringify({ gallery: reordered }) }) }
    catch (requestError) { toast.error(requestError.message || 'Gallery order could not be saved.') }
  }

  if (loading) return <LoadingState rows={5} />
  if (error) return <ErrorState message={error} onRetry={() => navigate(0)} />

  return <>
    <AdminPageTitle eyebrow="Institution management" title={isNew ? 'Add institution' : 'Edit institution'} description={isNew ? 'Create a draft, then add media and publish it when the listing is complete.' : `${form.name} · ${form.status}`} action={<Link to="/admin/institutions" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold"><ArrowLeft size={16} />All institutions</Link>} />
    <form onSubmit={save} aria-busy={saving} className="space-y-5">
      {saveError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{saveError}</div>}
      {isNew && <p className="rounded-xl border border-teal/20 bg-mist/30 px-4 py-3 text-sm text-ink">New institutions are saved as drafts. To publish one, add a description with at least 40 characters and at least one course marked visible publicly, then use Publish in the institution list.</p>}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">{tabs.map((item) => <button type="button" key={item} onClick={() => setTab(item)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === item ? 'bg-teal text-white' : 'text-slate-600 hover:bg-cream'}`}>{item}</button>)}</div>
      {tab === 'Basics' && <Section title="Verification"><label className="block max-w-md text-sm font-semibold text-slate-700">Verification status<select value={form.verificationStatus || 'unverified'} onChange={(event) => update('verificationStatus', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="unverified">Unverified</option><option value="pending">Verification pending</option><option value="verified">Verified</option><option value="rejected">Verification rejected</option></select><span className="mt-1 block text-xs font-normal text-slate-500">This status is managed by an administrator and does not publish a draft by itself.</span></label></Section>}
      {tab === 'Basics' && <Section title="Basic information"><div className="grid gap-4 md:grid-cols-2"><TextField label="Institution name" value={form.name} required onChange={(value) => { update('name', value); if (!slugEdited) update('slug', slugify(value)) }} /><TextField label="URL slug" value={form.slug} required onChange={(value) => { setSlugEdited(true); update('slug', slugify(value)) }} /><label className="block text-sm font-semibold text-slate-700">Type<span className="text-rose-700"> *</span><select required value={form.type} onChange={(event) => update('type', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option>School</option><option>College</option><option>University</option></select></label><TextField label="Established year" type="number" min="1000" max={maxEstablishedYear} value={form.establishedYear} onChange={(value) => update('establishedYear', value)} /><TextField label="Accreditations (comma separated)" value={Array.isArray(form.accreditation) ? form.accreditation.join(', ') : form.accreditation} onChange={(value) => update('accreditation', value)} /><TextField label="Official website" value={form.contacts?.officialWebsite} onChange={(value) => updateNested('contacts', 'officialWebsite', value)} placeholder="https://example.edu" /><TextField label="Contact email" type="email" value={form.contacts?.email} onChange={(value) => updateNested('contacts', 'email', value)} /><TextField label="Contact phone" value={form.contacts?.phone} onChange={(value) => updateNested('contacts', 'phone', value)} /></div><div className="mt-4"><TextField label="Description" value={form.description} rows={4} onChange={(value) => update('description', value)} /></div><div className="mt-4"><TextField label="History" value={form.history} rows={3} onChange={(value) => update('history', value)} /></div><h3 className="mb-3 mt-6 font-semibold text-ink">Address</h3><div className="grid gap-4 md:grid-cols-2"><TextField label="Address" value={form.location?.address} onChange={(value) => updateNested('location', 'address', value)} /><TextField label="City" value={form.location?.city} required onChange={(value) => updateNested('location', 'city', value)} /><TextField label="State / province" value={form.location?.stateProvince} onChange={(value) => updateNested('location', 'stateProvince', value)} /><TextField label="Country" value={form.location?.country} required onChange={(value) => updateNested('location', 'country', value)} /></div></Section>}

      {tab === 'Courses & faculty' && <div className="space-y-5"><Section title="Courses and academics" action={<button type="button" onClick={() => update('courses', [...form.courses, { name: '', category: '', qualification: '', duration: '', eligibility: '', admissionRequirements: '', description: '', tuitionFee: '', availableSeats: '', isPublic: true }])} className="inline-flex items-center gap-1 text-sm font-bold text-teal"><Plus size={16} />Add course</button>}>{form.courses.length ? form.courses.map((course, index) => <div key={index} className="mb-4 rounded-xl border border-slate-200 p-4 last:mb-0"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-ink">Course {index + 1}</h3><button type="button" onClick={() => removeListItem('courses', index)} aria-label="Remove course" className="text-rose-700"><Trash2 size={17} /></button></div><div className="grid gap-4 md:grid-cols-2">{[['name','Course name'],['category','Category'],['qualification','Degree / qualification'],['duration','Duration'],['department','Department'],['eligibility','Eligibility'],['admissionRequirements','Admission requirements'],['description','Description']].map(([field,label]) => <TextField key={field} label={label} value={course[field]} rows={['eligibility','admissionRequirements','description'].includes(field) ? 2 : undefined} onChange={(value) => updateListItem('courses', index, field, value)} required={field === 'name'} />)}<TextField label="Tuition fee" type="number" min="0" value={course.tuitionFee} onChange={(value) => updateListItem('courses', index, 'tuitionFee', value ? Number(value) : undefined)} /><TextField label="Available seats" type="number" min="0" value={course.availableSeats} onChange={(value) => updateListItem('courses', index, 'availableSeats', value ? Number(value) : undefined)} /></div><label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={course.isPublic !== false} onChange={(event) => updateListItem('courses', index, 'isPublic', event.target.checked)} />Visible publicly</label></div>) : <p className="text-sm text-slate-500">No courses added.</p>}</Section>
        <Section title="Faculty profiles" action={<button type="button" onClick={() => update('facultyProfiles', [...form.facultyProfiles, { name: '', designation: '', department: '', qualification: '', experienceYears: '', biography: '' }])} className="inline-flex items-center gap-1 text-sm font-bold text-teal"><Plus size={16} />Add faculty</button>}>{form.facultyProfiles.length ? form.facultyProfiles.map((person, index) => <div key={index} className="mb-4 rounded-xl border border-slate-200 p-4 last:mb-0"><div className="mb-4 flex justify-between"><h3 className="font-semibold">Faculty member {index + 1}</h3><button type="button" onClick={() => removeListItem('facultyProfiles', index)} aria-label="Remove faculty" className="text-rose-700"><Trash2 size={17} /></button></div><div className="grid gap-4 md:grid-cols-2">{[['name','Name'],['designation','Designation'],['department','Department'],['qualification','Qualification']].map(([field,label]) => <TextField key={field} label={label} value={person[field]} onChange={(value) => updateListItem('facultyProfiles', index, field, value)} required={field === 'name'} />)}<TextField label="Years of experience" type="number" min="0" value={person.experienceYears} onChange={(value) => updateListItem('facultyProfiles', index, 'experienceYears', value ? Number(value) : undefined)} /><TextField label="Biography" value={person.biography} rows={2} onChange={(value) => updateListItem('facultyProfiles', index, 'biography', value)} /></div></div>) : <p className="text-sm text-slate-500">No faculty profiles added.</p>}</Section></div>}

      {tab === 'Courses & faculty' && <Section title="Faculty profile photos">{form.facultyProfiles.length ? <div className="space-y-4">{form.facultyProfiles.map((person, index) => <div key={`faculty-photo-${index}`} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-4"><div className="min-w-40 flex-1"><p className="font-semibold text-ink">{person.name || `Faculty member ${index + 1}`}</p><p className="text-xs text-slate-500">{person.designation || 'No designation added'}</p></div><UploadBox label={person.photo ? 'Replace photo' : 'Upload photo'} disabled={isNew} busy={uploading} onFiles={(files) => uploadImages(files.slice(0, 1), 'faculty', index)} />{person.photo && <><img src={person.photo.secureUrl} alt={person.photo.alt || `${person.name} profile`} className="size-14 rounded-lg object-cover" /><button type="button" onClick={() => deleteImage(person.photo)} className="text-sm font-semibold text-rose-700">Remove</button></>}</div>)}</div> : <p className="text-sm text-slate-500">Add faculty profiles first, then attach profile photos.</p>}</Section>}

      {tab === 'Facilities' && <Section title="Infrastructure and facilities" action={<button type="button" onClick={() => update('facilities', [...form.facilities, { code: `other-${Date.now()}`, label: '', description: '', images: [] }])} className="inline-flex items-center gap-1 text-sm font-bold text-teal"><Plus size={16} />Add facility</button>}>{form.facilities.length ? form.facilities.map((facility, index) => <div key={`${facility.code}-${index}`} className="mb-4 rounded-xl border border-slate-200 p-4 last:mb-0"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Facility {index + 1}</h3><button type="button" onClick={() => removeListItem('facilities', index)} aria-label="Remove facility" className="text-rose-700"><Trash2 size={17} /></button></div><div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Facility type<select value={facility.code} onChange={(event) => { const selectedCode = event.target.value === 'other' ? `other-${Date.now()}` : event.target.value; const uniqueCode = form.facilities.some((item, itemIndex) => itemIndex !== index && item.code === selectedCode) ? `${selectedCode}-${index + 1}` : selectedCode; updateListItem('facilities', index, 'code', uniqueCode) }} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">{!facilityChoices.includes(facility.code) && <option value={facility.code}>Custom facility</option>}{facilityChoices.map((code) => <option key={code} value={code} disabled={code !== 'other' && form.facilities.some((item, itemIndex) => itemIndex !== index && item.code === code)}>{code.replaceAll('-', ' ')}</option>)}</select></label><TextField label="Display label (customizable)" value={facility.label} required onChange={(value) => updateListItem('facilities', index, 'label', value)} /><TextField label="Description" value={facility.description} rows={2} onChange={(value) => updateListItem('facilities', index, 'description', value)} /></div><div className="mt-4"><UploadBox label="Upload facility photos" multiple disabled={isNew} busy={uploading} onFiles={(files) => uploadImages(files, 'facility', facility.code)} /></div>{facility.images?.length > 0 && <div className="mt-3 grid grid-cols-4 gap-2">{facility.images.map((image) => <div key={image.publicId} className="relative"><img src={image.secureUrl} alt={image.alt || ''} className="aspect-square rounded-lg object-cover" /><button type="button" onClick={() => deleteImage(image)} aria-label="Delete facility image" className="absolute right-1 top-1 rounded-md bg-white p-1 text-rose-700"><X size={14} /></button></div>)}</div>}</div>) : <p className="text-sm text-slate-500">Add campus facilities such as libraries, laboratories, transport and custom amenities.</p>}</Section>}

      {tab === 'Fees & admissions' && <div className="space-y-5"><Section title="Fees" action={<button type="button" onClick={() => update('fees', [...form.fees, { label: '', amount: '', currency: 'USD', period: 'per year', source: 'unverified', notes: '' }])} className="inline-flex items-center gap-1 text-sm font-bold text-teal"><Plus size={16} />Add fee</button>}>{form.fees.length ? form.fees.map((fee, index) => <div key={index} className="mb-4 grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4"><TextField label="Fee name" value={fee.label} required onChange={(value) => updateListItem('fees', index, 'label', value)} /><TextField label="Amount" type="number" min="0" value={fee.amount} onChange={(value) => updateListItem('fees', index, 'amount', value ? Number(value) : undefined)} /><TextField label="Currency" value={fee.currency} onChange={(value) => updateListItem('fees', index, 'currency', value.toUpperCase().slice(0, 3))} /><TextField label="Period" value={fee.period} onChange={(value) => updateListItem('fees', index, 'period', value)} /><label className="text-sm font-semibold text-slate-700">Information source<select value={fee.source || 'unverified'} onChange={(event) => updateListItem('fees', index, 'source', event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="institution-provided">Institution provided</option><option value="unverified">Unverified</option></select></label><button type="button" onClick={() => removeListItem('fees', index)} className="self-end text-left text-sm font-semibold text-rose-700">Remove fee</button></div>) : <p className="text-sm text-slate-500">No fee information has been added.</p>}</Section><Section title="Admissions and financial aid"><div className="grid gap-4 md:grid-cols-2"><TextField label="Admission procedure" value={form.admissions?.procedure} rows={4} onChange={(value) => updateNested('admissions', 'procedure', value)} /><TextField label="Financial aid" value={form.admissions?.financialAid} rows={4} onChange={(value) => updateNested('admissions', 'financialAid', value)} /><TextField label="Application deadline" type="date" value={form.admissions?.applicationDeadline?.slice?.(0, 10)} onChange={(value) => updateNested('admissions', 'applicationDeadline', value)} /><TextField label="Admission contact name" value={form.admissions?.contactName} onChange={(value) => updateNested('admissions', 'contactName', value)} /><TextField label="Admission contact email" type="email" value={form.admissions?.contactEmail} onChange={(value) => updateNested('admissions', 'contactEmail', value)} /><TextField label="Admission contact phone" value={form.admissions?.contactPhone} onChange={(value) => updateNested('admissions', 'contactPhone', value)} /></div></Section></div>}

      {tab === 'Fees & admissions' && <Section title="Scholarships and financial aid" action={<button type="button" onClick={() => updateNested('admissions', 'scholarships', [...(form.admissions.scholarships || []), { name: '', description: '', eligibility: '', amount: '' }])} className="inline-flex items-center gap-1 text-sm font-bold text-teal"><Plus size={16} />Add scholarship</button>}>{form.admissions.scholarships?.length ? form.admissions.scholarships.map((scholarship, index) => <div key={`scholarship-${index}`} className="mb-4 grid gap-4 rounded-xl border border-slate-200 p-4 md:grid-cols-2"><TextField label="Scholarship name" required value={scholarship.name} onChange={(value) => setForm((current) => ({ ...current, admissions: { ...current.admissions, scholarships: current.admissions.scholarships.map((item, itemIndex) => itemIndex === index ? { ...item, name: value } : item) } }))} /><TextField label="Amount" type="number" min="0" value={scholarship.amount} onChange={(value) => setForm((current) => ({ ...current, admissions: { ...current.admissions, scholarships: current.admissions.scholarships.map((item, itemIndex) => itemIndex === index ? { ...item, amount: value ? Number(value) : undefined } : item) } }))} /><TextField label="Eligibility" value={scholarship.eligibility} rows={2} onChange={(value) => setForm((current) => ({ ...current, admissions: { ...current.admissions, scholarships: current.admissions.scholarships.map((item, itemIndex) => itemIndex === index ? { ...item, eligibility: value } : item) } }))} /><TextField label="Description" value={scholarship.description} rows={2} onChange={(value) => setForm((current) => ({ ...current, admissions: { ...current.admissions, scholarships: current.admissions.scholarships.map((item, itemIndex) => itemIndex === index ? { ...item, description: value } : item) } }))} /><button type="button" onClick={() => updateNested('admissions', 'scholarships', form.admissions.scholarships.filter((_, itemIndex) => itemIndex !== index))} className="text-left text-sm font-semibold text-rose-700">Remove scholarship</button></div>) : <p className="text-sm text-slate-500">No scholarships added.</p>}</Section>}

      {tab === 'Images' && <div className="space-y-5"><Section title="Institution logo"><UploadBox label="Upload logo" disabled={isNew} busy={uploading} onFiles={(files) => uploadImages(files.slice(0, 1), 'logo')} />{form.logo && <div className="mt-4 flex items-center gap-4"><img src={form.logo.secureUrl} alt={form.logo.alt || `${form.name} logo`} className="size-20 rounded-xl border border-slate-200 object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{form.logo.publicId}</p><p className="text-xs text-slate-500">{form.logo.width} × {form.logo.height}</p></div><button type="button" onClick={() => deleteImage(form.logo)} aria-label="Delete logo" className="rounded-lg p-2 text-rose-700 hover:bg-rose-50"><Trash2 size={17} /></button></div>}</Section><Section title="Cover image"><UploadBox label="Upload cover image" disabled={isNew} busy={uploading} onFiles={(files) => uploadImages(files.slice(0, 1), 'coverImage')} />{form.coverImage && <div className="mt-4"><img src={form.coverImage.secureUrl} alt={form.coverImage.alt || `${form.name} cover`} className="max-h-64 w-full rounded-xl object-cover" /><button type="button" onClick={() => deleteImage(form.coverImage)} className="mt-2 text-sm font-semibold text-rose-700">Remove cover image</button></div>}</Section><Section title="Image gallery"><UploadBox label={uploadProgress || 'Upload gallery images'} multiple disabled={isNew} busy={uploading} onFiles={(files) => uploadImages(files, 'gallery')} /><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{form.gallery.map((image, index) => <div key={image.publicId} draggable onDragStart={() => setDraggedImage(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderGallery(index)} className="group relative cursor-move"><img src={image.secureUrl} alt={image.alt || `Campus gallery image ${index + 1}`} className="aspect-square w-full rounded-xl object-cover" /><span className="absolute bottom-2 left-2 rounded-md bg-ink/80 px-2 py-1 text-xs font-bold text-white">{index + 1}</span><button type="button" onClick={() => deleteImage(image)} aria-label="Delete gallery image" className="absolute right-2 top-2 rounded-lg bg-white/95 p-2 text-rose-700 opacity-100 shadow-sm sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={15} /></button></div>)}</div>{form.gallery.length > 1 && <p className="mt-3 text-xs text-slate-500">Drag images to reorder. The order is saved to MongoDB.</p>}</Section></div>}

      {tab === 'Basics' && <Section title="Departments"><div className="flex flex-wrap gap-2">{form.departments.map((department, index) => <span key={`${department}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-mist px-3 py-1.5 text-sm font-semibold text-teal">{department}<button type="button" onClick={() => removeListItem('departments', index)} aria-label={`Remove ${department}`}><X size={14} /></button></span>)}<DepartmentInput onAdd={(department) => update('departments', [...form.departments, department])} /></div><p className="mt-3 text-xs text-slate-500">Add department name and press Enter.</p></Section>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link to="/admin/institutions" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold">Cancel</Link><button disabled={saving} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Save size={17} />{saving ? 'Saving…' : isNew ? 'Create draft' : 'Save changes'}</button></div>
    </form>
  </>
}

function DepartmentInput({ onAdd }) {
  const [value, setValue] = useState('')
  return <form onSubmit={(event) => { event.preventDefault(); const clean = value.trim(); if (clean) onAdd(clean); setValue('') }} className="flex gap-1"><input value={value} onChange={(event) => setValue(event.target.value)} aria-label="New department" placeholder="Add department" className="w-36 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" /><button className="grid size-8 place-items-center rounded-lg bg-teal text-white" aria-label="Add department"><Plus size={16} /></button></form>
}

