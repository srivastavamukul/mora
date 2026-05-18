import { useState, useCallback } from 'react'

const REFERENCE_RE = /\b(that|it|same|related|more)\b/i

export function useCompanionSession() {
  const [session, setSession] = useState({ lastQuery: '', lastThemes: [], lastSources: [] })

  const isReference = useCallback((q) => REFERENCE_RE.test(q), [])

  const resolveQuery = useCallback((rawQuery) => {
    if (!rawQuery || !session.lastQuery || !REFERENCE_RE.test(rawQuery)) return rawQuery
    const parts = [session.lastQuery]
    if (session.lastThemes.length > 0) parts.push(session.lastThemes.join(' '))
    if (session.lastSources.length > 0) parts.push(session.lastSources.join(' '))
    return parts.join(' ')
  }, [session])

  const commitQuery = useCallback((query, context) => {
    if (!query || !context) return
    setSession({
      lastQuery: query,
      lastThemes: Array.isArray(context.themes) ? context.themes : [],
      lastSources: Array.isArray(context.sources) ? context.sources : [],
    })
  }, [])

  return { resolveQuery, commitQuery, isReference }
}
