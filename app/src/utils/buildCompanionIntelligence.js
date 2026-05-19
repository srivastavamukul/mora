function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }
function phrase(t) { return (t || '').toLowerCase() }

function joinTwo(a, b) { return `${phrase(a)} and ${phrase(b)}` }

function detectIntent(q) {
  const ql = q.toLowerCase()
  if (/kept?s?|recur|return|again|pattern|come back|coming back/.test(ql)) return 'recurring'
  if (/changed?|shift|different|moved|transition|new direction/.test(ql)) return 'changed'
  if (/faded?|stop|anymore|haven.?t|lost interest|disappear/.test(ql)) return 'dormant'
  if (/lately|recently|on my mind|been thinking|been saving|been exploring|these days/.test(ql)) return 'lately'
  return 'specific'
}

function lately(context, monthlyReview, evolution, resurfacingSignals) {
  const ctxThemes = (context?.themes || []).slice(0, 2)
  const monthThemes = (monthlyReview?.dominantThemes || []).slice(0, 2)
  const trends = (resurfacingSignals?.trendCandidates || []).slice(0, 2).map(t => t.theme)
  const primary = ctxThemes.length > 0 ? ctxThemes : monthThemes.length > 0 ? monthThemes : trends

  const parts = []

  if (primary.length >= 2) {
    parts.push(`${cap(joinTwo(primary[0], primary[1]))} have appeared repeatedly in your recent saves.`)
  } else if (primary.length === 1) {
    parts.push(`${cap(phrase(primary[0]))} has appeared repeatedly in your recent saves.`)
  }

  const evolutionSignal = evolution?.periods?.[0]?.changeSignals?.[0]
  if (evolutionSignal && parts.length > 0) parts.push(evolutionSignal)

  if (parts.length === 0 && monthlyReview?.observations?.length > 0) {
    parts.push(monthlyReview.observations[0])
  }

  return parts.slice(0, 2).join(' ') || null
}

function changed(evolution, resurfacingSignals, monthlyReview) {
  const signals = evolution?.periods?.[0]?.changeSignals || []
  if (signals.length > 0) return signals.slice(0, 2).join(' ')

  const trending = resurfacingSignals?.trendCandidates?.[0]?.theme
  const dormant = resurfacingSignals?.dormantThemes?.[0]?.theme
  if (trending && dormant) {
    return `Your attention appears to be shifting from ${phrase(dormant)} toward ${phrase(trending)}.`
  }

  return monthlyReview?.observations?.[0] || null
}

function recurring(resurfacingSignals, evolution) {
  const top = (resurfacingSignals?.recurringThemes || []).slice(0, 2)

  if (top.length >= 2) {
    return `${cap(joinTwo(top[0].theme, top[1].theme))} seem to reappear across different periods of your archive.`
  }
  if (top.length === 1) {
    return `${cap(phrase(top[0].theme))} seems to reappear consistently across your archive.`
  }

  // Fallback: find theme present in 2+ evolution periods
  const freq = {}
  for (const p of (evolution?.periods || [])) {
    for (const t of p.dominantThemes) freq[t] = (freq[t] || 0) + 1
  }
  const best = Object.entries(freq).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1])[0]
  return best ? `${cap(phrase(best[0]))} appears consistently across your archive.` : null
}

function dormant(resurfacingSignals) {
  const top = resurfacingSignals?.dormantThemes?.[0]
  if (!top) return null
  const days = top.daysSinceLast || 0
  const timeStr = days >= 60 ? 'a few months' : days >= 30 ? 'about a month' : 'a while'
  return `${cap(phrase(top.theme))}, which once appeared frequently, hasn't shown up in ${timeStr}.`
}

function specific(query, context, evolution, monthlyReview) {
  const { themes = [], sources = [], observations = [], relevantMemories = [], entities = [] } = context || {}

  if (relevantMemories.length === 0) return 'Nothing in your memories closely matches that.'

  const q = phrase(query.trim())
  let core = ''

  if (themes.length >= 2) {
    core = `${cap(phrase(themes[0]))} and ${phrase(themes[1])} come up together across your memories`
  } else if (themes.length === 1) {
    core = q.includes(phrase(themes[0]))
      ? `${cap(phrase(themes[0]))} ideas appear repeatedly in your archive`
      : `You seem to return often to ${phrase(themes[0])}`
  } else if (entities.length > 0) {
    core = `${entities[0]} comes up across several of your memories`
  } else if (observations.length > 0) {
    return observations[0]
  } else {
    const n = relevantMemories.length
    core = `${cap(q)} comes up in ${n} ${n === 1 ? 'memory' : 'memories'}`
  }

  const suffix = sources.length > 0 && themes.length > 0 ? `, often saved from ${sources[0]}` : ''

  const evolutionSignal = evolution?.periods?.[0]?.changeSignals?.find(s =>
    themes.some(t => s.toLowerCase().includes(phrase(t)))
  )

  const base = core + suffix + '.'
  return evolutionSignal ? `${base} ${evolutionSignal}` : base
}

export function buildCompanionIntelligence(query, context, reviews, monthlyReview, evolution, resurfacingSignals) {
  if (!query) return { response: '', supportingSignals: [] }

  const intent = detectIntent(query)
  let response = null

  if (intent === 'lately') response = lately(context, monthlyReview, evolution, resurfacingSignals)
  else if (intent === 'changed') response = changed(evolution, resurfacingSignals, monthlyReview)
  else if (intent === 'recurring') response = recurring(resurfacingSignals, evolution)
  else if (intent === 'dormant') response = dormant(resurfacingSignals)
  else response = specific(query, context, evolution, monthlyReview)

  // Fallback chain
  if (!response && context?.relevantMemories?.length > 0) response = specific(query, context, evolution, monthlyReview)
  if (!response && reviews?.observations?.length > 0) response = reviews.observations[0]
  if (!response && monthlyReview?.observations?.length > 0) response = monthlyReview.observations[0]
  if (!response) response = 'Your archive holds the answer, but the signal is faint.'

  const supportingSignals = [
    ...(context?.themes || []).slice(0, 2),
    ...(resurfacingSignals?.recurringThemes || []).slice(0, 1).map(t => t.theme),
  ]

  return {
    response,
    supportingSignals: [...new Set(supportingSignals)].slice(0, 4),
  }
}
