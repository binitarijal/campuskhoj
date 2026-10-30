import { createContext, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

const ComparisonContext = createContext(null)

export function ComparisonProvider({ children }) {
  const [comparisonIds, setComparisonIds] = useState([])
  const toggleComparison = (id) => {
    setComparisonIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= 3) { toast.error('You can compare up to three institutions.'); return current }
      toast.success('Added to comparison')
      return [...current, id]
    })
  }
  const value = useMemo(() => ({ comparisonIds, toggleComparison, clearComparison: () => setComparisonIds([]) }), [comparisonIds])
  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>
}

export { ComparisonContext }
