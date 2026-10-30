import { ArrowRight, Scale, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useComparison } from '../context/useComparison'
import { apiRequest } from '../lib/api'

export default function ComparisonTray() {
  const { comparisonIds, toggleComparison, clearComparison } = useComparison()
  const [selected, setSelected] = useState([])
  useEffect(() => {
    if (comparisonIds.length < 2) { setSelected([]); return }
    let active = true
    apiRequest(`/institutions/compare?ids=${comparisonIds.join(',')}`).then((items) => { if (active) setSelected(items) }).catch(() => { if (active) setSelected([]) })
    return () => { active = false }
  }, [comparisonIds])
  if (!selected.length) return null
  return <aside className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-3xl rounded-2xl border border-teal/20 bg-white p-3 shadow-lift sm:inset-x-6"><div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-2 px-2 text-sm font-bold text-ink"><Scale size={18} className="text-teal" />Compare <span className="text-slate-500">({selected.length}/3)</span></div><div className="flex min-w-0 flex-1 flex-wrap gap-2">{selected.map((item) => <span key={item._id} className="inline-flex items-center gap-1 rounded-lg bg-mist px-2 py-1.5 text-xs font-semibold text-teal">{item.name}<button onClick={() => toggleComparison(item._id)} aria-label={`Remove ${item.name}`}><X size={14} /></button></span>)}</div><button onClick={clearComparison} className="text-xs font-semibold text-slate-500 hover:text-ink">Clear</button><Link to="/compare" className="inline-flex items-center gap-1 rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white">Compare <ArrowRight size={15} /></Link></div></aside>
}
