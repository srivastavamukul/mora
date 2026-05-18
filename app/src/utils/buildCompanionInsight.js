function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

export function buildCompanionInsight(query, context) {
  if (!query || !context) return { summary: '', signals: [] }

  const { themes = [], sources = [], observations = [], relevantMemories = [] } = context

  const signals = [...themes.slice(0, 3), ...sources.slice(0, 1)]

  if (relevantMemories.length === 0) {
    return { summary: 'Nothing in your memories closely matches that.', signals: [] }
  }

  const q = query.trim().toLowerCase()
  const top = themes[0]

  let core = ''

  if (themes.length >= 2) {
    core = `${cap(themes[0])} and ${themes[1]} come up together across your memories`
  } else if (themes.length === 1) {
    core = top.toLowerCase() === q
      ? `${cap(top)} ideas appear repeatedly across your memories`
      : `You seem to return often to ${top} ideas`
  } else if (observations.length > 0) {
    return { summary: observations[0], signals }
  } else {
    const n = relevantMemories.length
    core = `${cap(q)} comes up in ${n} ${n === 1 ? 'memory' : 'memories'}`
  }

  const suffix = sources.length > 0 && themes.length > 0 ? `, often saved from ${sources[0]}` : ''

  return { summary: core + suffix + '.', signals }
}
