import { useState, useCallback } from 'react'

function loadDismissed() {
  try {
    const raw = localStorage.getItem('mora_dismissed_hints')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function useOnboarding() {
  const [dismissed, setDismissed] = useState(loadDismissed)

  const dismissHint = useCallback((key) => {
    setDismissed(prev => {
      const next = { ...prev, [key]: true }
      localStorage.setItem('mora_dismissed_hints', JSON.stringify(next))
      return next
    })
  }, [])

  const isVisible = useCallback((key) => !dismissed[key], [dismissed])

  return { dismissHint, isVisible }
}
