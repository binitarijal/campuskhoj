import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowLeft, CheckCircle2, ImagePlus, LockKeyhole, Star, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { apiRequest } from '../lib/api'
import { PrimaryButton, SecondaryButton } from '../components/ui'

const schema = z.object({
  institutionId: z.string().regex(/^[a-f\d]{24}$/i, 'Select an institution.'),
  overallRating: z.number().int().min(1, 'Choose an overall rating.').max(5),
  title: z.string().trim().min(3, 'Use at least 3 characters.').max(120),
  body: z.string().trim().min(40, 'Please share at least 40 characters.').max(4000),
  pros: z.string().max(1500).optional(), cons: z.string().max(1500).optional(),
  attendancePeriod: z.string().max(80).optional(),
})
const categories = [['academicQuality', 'Academic quality'], ['faculty', 'Faculty'], ['infrastructure', 'Infrastructure'], ['library', 'Library'], ['hostel', 'Hostel'], ['campusEnvironment', 'Campus environment'], ['placement', 'Placement'], ['valueForMoney', 'Value for money']]

export default function ReviewPageLive() {
  const [params] = useSearchParams()
  const selectedSlug = params.get('institution')
  const [institutions, setInstitutions] = useState([])
  const [loadingInstitutions, setLoadingInstitutions] = useState(true)
  const [institutionError, setInstitutionError] = useState('')
  const [rating, setRating] = useState(0)
  const [categoryRatings, setCategoryRatings] = useState({})
  const [files, setFiles] = useState([])
  const [filePreviews, setFilePreviews] = useState([])
  const previewUrls = useRef(new Set())
  const [submission, setSubmission] = useState(null)
  const [failedFiles, setFailedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { institutionId: '', overallRating: 0, title: '', body: '', pros: '', cons: '', attendancePeriod: '' } })

  useEffect(() => () => { for (const url of previewUrls.current) URL.revokeObjectURL(url) }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      apiRequest('/institutions?limit=48&sort=name_asc'),
      selectedSlug ? apiRequest(`/institutions/${encodeURIComponent(selectedSlug)}`).catch(() => null) : Promise.resolve(null),
    ]).then(([result, selected]) => {
      if (!active) return
      const options = result.data || []
      if (selected && !options.some((item) => item._id === selected._id)) options.unshift(selected)
      setInstitutions(options)
      if (selected) setValue('institutionId', selected._id)
      setInstitutionError('')
    }).catch((error) => { if (active) setInstitutionError(error.message || 'Institutions could not be loaded.') })
      .finally(() => { if (active) setLoadingInstitutions(false) })
    return () => { active = false }
  }, [selectedSlug, setValue])

  const addFiles = (fileList) => {
    const selectedFiles = Array.from(fileList || []).filter((file) => file.size <= 8 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    if (selectedFiles.length !== fileList?.length) toast.error('Some images were skipped. Use JPEG, PNG, or WebP files under 8 MB.')
    const additions = selectedFiles.slice(0, Math.max(0, 4 - files.length))
    const previews = additions.map((file) => {
      const url = URL.createObjectURL(file)
      previewUrls.current.add(url)
      return { file, url }
    })
    setFiles([...files, ...additions])
    setFilePreviews([...filePreviews, ...previews])
  }

  const uploadFile = async (reviewId, file) => {
    const query = new URLSearchParams({ alt: file.name.replace(/\.[^.]+$/, '').slice(0, 100) })
    return apiRequest(`/reviews/${reviewId}/attachments?${query}`, { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
  }

  const submit = async (values) => {
    const review = await apiRequest('/reviews', { method: 'POST', body: JSON.stringify({
      ...values,
      categoryRatings: Object.fromEntries(Object.entries(categoryRatings).filter(([, value]) => value)),
    }) })
    setSubmission(review)
    if (!files.length) { toast.success('Review submitted for moderation.'); return }
    setUploading(true)
    const failed = []
    for (const file of files) {
      try { await uploadFile(review.id, file) }
      catch { failed.push(file) }
    }
    setFailedFiles(failed)
    setUploading(false)
    if (failed.length) toast.error(`Review is pending, but ${failed.length} image(s) did not upload. Retry below.`)
    else toast.success('Review and images submitted for moderation.')
  }

  const retryUploads = async () => {
    if (!submission) return
    setUploading(true)
    const failed = []
    for (const file of failedFiles) {
      try { await uploadFile(submission.id, file) }
      catch { failed.push(file) }
    }
    setFailedFiles(failed); setUploading(false)
    if (!failed.length) toast.success('All review images uploaded.')
    else toast.error('Some images still could not upload.')
  }

  if (submission) return <main className="mx-auto max-w-xl px-4 py-20 sm:px-6"><div className="rounded-3xl border border-slate-200 bg-white p-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-mist text-teal"><CheckCircle2 size={30} /></span><h1 className="mt-5 text-2xl font-bold text-ink">Thank you for sharing.</h1><p className="mt-3 leading-7 text-slate-600">Your review is pending moderator approval. It is not public and does not affect the institution rating yet.</p>{uploading && <p className="mt-4 text-sm text-slate-500">Uploading supporting images…</p>}{failedFiles.length > 0 && <div className="mt-5 rounded-xl bg-amber/60 p-4 text-left"><p className="text-sm font-semibold text-ink">{failedFiles.length} image upload(s) need a retry.</p><button disabled={uploading} onClick={retryUploads} className="mt-3 rounded-lg bg-teal px-3 py-2 text-sm font-bold text-white disabled:opacity-60">Retry image uploads</button></div>}<Link to="/profile#my-reviews" className="mt-6 inline-block"><PrimaryButton>View my reviews</PrimaryButton></Link></div></main>

  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8"><Link to={selectedSlug ? `/institutions/${selectedSlug}` : '/institutions'} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal"><ArrowLeft size={16} />Back to institution</Link><div className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8"><div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mist text-teal"><LockKeyhole size={21} /></span><div><p className="text-xs font-bold uppercase tracking-widest text-teal">Your experience matters</p><h1 className="mt-1 text-3xl font-bold text-ink">Write a review</h1><p className="mt-2 text-sm leading-6 text-slate-600">Your review and any images stay private until an administrator approves them.</p></div></div>
      {institutionError && <div className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{institutionError}</div>}
      <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-6">
        <label className="block text-sm font-bold text-ink">Institution<select {...register('institutionId')} disabled={loadingInstitutions} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal outline-none focus:border-teal"><option value="">{loadingInstitutions ? 'Loading institutions…' : 'Select a published institution'}</option>{institutions.map((item) => <option key={item._id} value={item._id}>{item.name} · {item.location?.city || item.location?.country}</option>)}</select>{errors.institutionId && <Error text={errors.institutionId.message} />}</label>
        <fieldset><legend className="text-sm font-bold text-ink">Overall rating</legend><div className="mt-3 flex gap-2">{[1,2,3,4,5].map((value) => <button type="button" key={value} onClick={() => { setRating(value); setValue('overallRating', value, { shouldValidate: true }) }} className={`grid size-11 place-items-center rounded-xl border transition ${rating >= value ? 'border-teal bg-amber text-ink' : 'border-slate-200 text-slate-300 hover:border-teal'}`} aria-label={`${value} stars`} aria-pressed={rating === value}><Star size={21} fill={rating >= value ? 'currentColor' : 'none'} /></button>)}</div>{errors.overallRating && <Error text={errors.overallRating.message} />}</fieldset>
        <div className="grid gap-5 sm:grid-cols-2"><TextInput label="Review title" placeholder="Sum up your experience" error={errors.title?.message} {...register('title')} /><TextInput label="Attendance period (optional)" placeholder="e.g. 2022–2025" error={errors.attendancePeriod?.message} {...register('attendancePeriod')} /></div>
        <TextArea label="Detailed review" placeholder="What should future learners know? Focus on your own experience." rows={6} error={errors.body?.message} {...register('body')} />
        <div className="grid gap-5 sm:grid-cols-2"><TextArea label="Pros (optional)" rows={3} error={errors.pros?.message} {...register('pros')} /><TextArea label="Cons (optional)" rows={3} error={errors.cons?.message} {...register('cons')} /></div>
        <fieldset><legend className="text-sm font-bold text-ink">Category ratings (optional)</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{categories.map(([key, label]) => <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600">{label}<select value={categoryRatings[key] || ''} onChange={(event) => setCategoryRatings((current) => ({ ...current, [key]: event.target.value ? Number(event.target.value) : undefined }))} className="rounded-lg bg-white text-sm font-semibold text-ink outline-none"><option value="">Not rated</option>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label>)}</div></fieldset>
        <fieldset><legend className="text-sm font-bold text-ink">Supporting images (optional)</legend><label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files) }} className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center hover:border-teal hover:bg-mist/30"><ImagePlus size={22} className="text-teal" /><span className="mt-2 text-sm font-semibold">Choose or drop up to four images</span><span className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP · 8 MB each</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => { addFiles(event.target.files); event.target.value = '' }} /></label>{files.length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{filePreviews.map(({ file, url }, index) => <div key={`${file.name}-${index}`} className="relative"><img src={url} alt={file.name} className="aspect-square w-full rounded-xl object-cover" /><button type="button" onClick={() => { const preview = filePreviews[index]; if (preview) { URL.revokeObjectURL(preview.url); previewUrls.current.delete(preview.url) }; setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index)); setFilePreviews((current) => current.filter((_, itemIndex) => itemIndex !== index)) }} aria-label={`Remove ${file.name}`} className="absolute right-1 top-1 rounded-lg bg-white p-1 text-rose-700"><X size={15} /></button><p className="truncate text-xs text-slate-500">{file.name}</p></div>)}</div>}</fieldset>
        <p className="rounded-xl bg-mist p-4 text-sm leading-6 text-slate-700"><strong className="text-ink">Before you submit:</strong> Share your own experience, avoid private information and remember that a moderator reviews every submission.</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link to="/institutions"><SecondaryButton type="button">Cancel</SecondaryButton></Link><PrimaryButton disabled={isSubmitting || loadingInstitutions} type="submit">{isSubmitting ? 'Submitting…' : 'Submit for moderation'}</PrimaryButton></div>
      </form></div></main>
}

function TextInput({ label, error, ...props }) { return <label className="block text-sm font-bold text-ink">{label}<input {...props} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal outline-none focus:border-teal" />{error && <Error text={error} />}</label> }
function TextArea({ label, error, ...props }) { return <label className="block text-sm font-bold text-ink">{label}<textarea {...props} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm font-normal leading-6 outline-none focus:border-teal" />{error && <Error text={error} />}</label> }
function Error({ text }) { return <span className="mt-1 flex items-center gap-1 text-xs font-medium text-rose-700"><AlertCircle size={13} />{text}</span> }
