import { Check, MapPin, Plus, Scale } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useComparison } from '../context/useComparison'
import { Badge, Stars } from './ui'

export function InstitutionVisual({ institution, className = '' }) {
  const image = institution.coverImage?.secureUrl
  const [failedImage, setFailedImage] = useState(null)
  const [loadedImage, setLoadedImage] = useState(null)
  if (image && failedImage !== image) return <div className={`relative overflow-hidden bg-slate-100 ${className}`}><div className={`absolute inset-0 animate-pulse bg-slate-100 ${loadedImage === image ? 'hidden' : ''}`} aria-hidden="true" /><img src={image} alt={`${institution.name} campus`} className={`h-full w-full object-cover transition-opacity duration-300 ${loadedImage === image ? 'opacity-100' : 'opacity-0'}`} loading="eager" onLoad={() => setLoadedImage(image)} onError={() => { if (import.meta.env.DEV) console.warn(`[CampusCompass] Cover image failed to load for institution ${institution.slug}; host: ${new URL(image, window.location.href).host}`); setFailedImage(image) }} /></div>
  return <div className={`institution-art ${institution.palette || ''} ${className}`} role="img" aria-label={`Campus image not yet available for ${institution.name}`}><span className="art-sun" /><span className="art-building art-building-one" /><span className="art-building art-building-two" /><span className="art-ground" /></div>
}

export default function InstitutionCard({ institution, layout = 'grid' }) {
  const { comparisonIds, toggleComparison } = useComparison()
  const id = institution._id || institution.id
  const city = institution.location?.city || institution.city || ''
  const region = institution.location?.stateProvince || institution.state || institution.location?.country || institution.country || ''
  const rating = institution.ratingAverage ?? institution.rating ?? 0
  const reviewCount = institution.ratingCount ?? institution.reviews ?? 0
  const fee = institution.fees?.find((item) => item.label)?.amount != null ? `${institution.fees.find((item) => item.label).amount.toLocaleString()} ${institution.fees.find((item) => item.label).currency || ''} ${institution.fees.find((item) => item.label).period || ''}`.trim() : institution.fee || 'Contact for fees'
  const badge = institution.badge || institution.type
  const selected = comparisonIds.includes(id)
  return <article className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lift ${layout === 'list' ? 'sm:flex' : ''}`}>
    <InstitutionVisual institution={institution} className={layout === 'list' ? 'h-48 sm:h-auto sm:w-72' : 'h-44'} />
    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-start justify-between gap-3"><Badge tone="teal">{badge}</Badge><button onClick={() => toggleComparison(id)} className={`grid size-9 place-items-center rounded-lg border transition focus:outline-none focus:ring-4 focus:ring-teal/10 ${selected ? 'border-teal bg-mist text-teal' : 'border-slate-200 text-slate-500 hover:border-teal hover:text-teal'}`} aria-label={`${selected ? 'Remove' : 'Add'} ${institution.name} ${selected ? 'from' : 'to'} comparison`}>{selected ? <Check size={17} /> : <Plus size={17} />}</button></div>
      <Link to={`/institutions/${institution.slug}`} className="mt-4 block"><h3 className="text-lg font-bold text-ink transition group-hover:text-teal">{institution.name}</h3></Link>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={15} />{[city, region].filter(Boolean).join(', ') || 'Location not listed'}</p>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{institution.description}</p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><div><Stars value={rating} /><span className="ml-1 text-xs text-slate-500">({reviewCount})</span></div><span className="text-sm font-semibold text-ink">{fee}</span></div>
      <div className="mt-4 flex gap-2"><Link className="flex-1 rounded-xl bg-ink px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-ink/90" to={`/institutions/${institution.slug}`}>View details</Link><button onClick={() => toggleComparison(id)} className="rounded-xl border border-slate-200 px-3 text-slate-600 hover:border-teal hover:text-teal" aria-label="Compare institution"><Scale size={18} /></button></div>
    </div>
  </article>
}
