function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str
}

export function buildMemoryCompanionResponse(context) {
  if (!context || typeof context !== 'object') return { reflections: [] }

  const {
    relevantMemories = [],
    relatedJournals = [],
    themes = [],
    sources = [],
  } = context

  const reflections = []

  // dominant theme across recent memories
  if (themes.length >= 1 && relevantMemories.length >= 2) {
    reflections.push(`${capitalize(themes[0])} themes appear repeatedly in your archive.`)
  }

  // journal depth signal
  if (relatedJournals.length >= 2) {
    reflections.push('Your recent journals suggest deeper personal reflection.')
  }

  // source concentration signal
  if (sources.length >= 1 && relevantMemories.length >= 3) {
    reflections.push(`Your saves have been coming primarily from ${sources[0]} recently.`)
  }

  return { reflections: reflections.slice(0, 3) }
}
