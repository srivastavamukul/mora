import { enrichSemanticMetadata } from './enrichSemanticMetadata'
import { enrichMemoryMetadata } from './enrichMemoryMetadata'

const HOW_TO_RE = /^how\s+to\s+/i
const SOCIAL_PLATFORM_RE = /^(.+?)\s+on\s+(?:instagram|twitter|x|youtube|tiktok|facebook|pinterest|linkedin|reddit)\s*[:–—]/i

const THEME_PHRASE = {
  'Online Income': 'building income online',
  'Entrepreneurship': 'entrepreneurship and growth',
  'Freelancing': 'freelancing and independent work',
  'Business': 'business strategy',
  'Branding': 'building a brand',
  'Marketing': 'marketing and reach',
  'Sales': 'sales and conversion',
  'Software Business': 'software products and business',
  'Investing': 'growing wealth through investing',
  'Personal Finance': 'managing personal finances',
  'Wealth Building': 'building long-term wealth',
  'Cryptocurrency': 'crypto and digital assets',
  'Technology': 'technology and tools',
  'Software': 'software and systems',
  'Programming': 'programming and code',
  'Software Development': 'software development',
  'Engineering': 'engineering and technical systems',
  'Artificial Intelligence': 'AI and machine learning',
  'Data Science': 'data and analytics',
  'Design': 'design and aesthetics',
  'UX/UI Design': 'product design and UX',
  'Graphic Design': 'graphic design',
  'Visual Design': 'visual design and composition',
  'Art': 'art and creative expression',
  'Creativity': 'creative thinking and making',
  'Illustration': 'illustration and drawing',
  'Photography': 'photography and visual storytelling',
  'Cinema': 'film and cinema',
  'Bollywood': 'Bollywood and Indian film',
  'Entertainment': 'entertainment and culture',
  'Gaming': 'gaming and play',
  'Podcasts': 'podcasts and conversations',
  'Music': 'music and sound',
  'Dance': 'dance and movement',
  'Social Media': 'social media and digital life',
  'Video Content': 'video and visual content',
  'Visual Discovery': 'visual ideas and inspiration',
  'Content Creation': 'content creation and publishing',
  'Influencer Marketing': 'the creator economy',
  'Health': 'health and wellbeing',
  'Fitness': 'fitness and movement',
  'Wellness': 'wellness and self-care',
  'Mindfulness': 'mindfulness and presence',
  'Nutrition': 'nutrition and eating well',
  'Food': 'food and cooking',
  'Travel': 'travel and exploration',
  'Lifestyle': 'lifestyle and living',
  'Fashion': 'fashion and personal style',
  'Learning': 'learning and curiosity',
  'Education': 'education and knowledge',
  'Productivity': 'productivity and focus',
  'Personal Development': 'personal growth and habits',
  'Writing': 'writing and storytelling',
  'Books': 'books and ideas',
  'Reading': 'reading and reflection',
  'Research': 'research and knowledge',
  'Science': 'science and discovery',
  'Psychology': 'psychology and the mind',
  'Philosophy': 'philosophy and meaning',
  'Spirituality': 'spirituality and inner life',
}

// Themes that originate from the platform name, not the content itself
const PLATFORM_THEMES = new Set([
  'Social Media', 'Video Content', 'Visual Discovery', 'Content Creation', 'Influencer Marketing',
])

const SOURCE_FLAVOR = {
  instagram: 'moments',
  tiktok: 'moments',
  youtube: 'content',
  pinterest: 'ideas',
  twitter: 'thoughts',
  x: 'thoughts',
  linkedin: 'insights',
  spotify: 'listening',
  soundcloud: 'listening',
}

const _cache = new Map()

export function buildMemoryNarrative(item) {
  if (!item) return { narrativeTitle: '', narrativeSummary: '' }

  const cacheKey = item.id ? `narrative:${item.id}:${item.updatedAt || item.createdAt || 0}` : null
  if (cacheKey && _cache.has(cacheKey)) return _cache.get(cacheKey)

  const { themes, entities, cleanTitle, titleTransformed } = enrichSemanticMetadata(item)
  const { displayTitle, sourceLabel } = enrichMemoryMetadata(item)

  const rawTitle = item.title || ''
  const source = (item.source || item.metadata?.source || '').toLowerCase()
  const isHowTo = HOW_TO_RE.test(rawTitle)
  const isSocialPost = SOCIAL_PLATFORM_RE.test(rawTitle)
  const primaryTheme = themes[0] || null
  const primaryEntity = entities[0] || null
  const baseTitle = (titleTransformed && cleanTitle) ? cleanTitle : displayTitle

  let narrativeTitle = ''
  let narrativeSummary = ''

  // narrativeTitle
  if (isHowTo && primaryTheme) {
    const phrase = THEME_PHRASE[primaryTheme]
    narrativeTitle = phrase ? `Ideas for ${phrase}` : `Ideas for ${primaryTheme.toLowerCase()}`
  } else if (isSocialPost && primaryEntity) {
    const flavor = SOURCE_FLAVOR[source] || 'moments'
    const contentTheme = themes.find(t => !PLATFORM_THEMES.has(t))
    narrativeTitle = (contentTheme && THEME_PHRASE[contentTheme])
      ? `${contentTheme} ${flavor}`
      : `${primaryEntity} ${flavor}`
  } else {
    narrativeTitle = baseTitle || displayTitle
  }

  if (narrativeTitle) {
    narrativeTitle = narrativeTitle.charAt(0).toUpperCase() + narrativeTitle.slice(1)
  }

  // narrativeSummary
  if (primaryEntity && primaryTheme && !PLATFORM_THEMES.has(primaryTheme)) {
    const phrase = THEME_PHRASE[primaryTheme] || primaryTheme.toLowerCase()
    narrativeSummary = `${primaryEntity} content exploring ${phrase}.`
  } else if (primaryEntity && isSocialPost) {
    const flavor = SOURCE_FLAVOR[source] || 'content'
    narrativeSummary = `${flavor.charAt(0).toUpperCase() + flavor.slice(1)} centered around ${primaryEntity}.`
  } else if (themes.length >= 2) {
    const p1 = THEME_PHRASE[themes[0]] || themes[0].toLowerCase()
    const p2 = (THEME_PHRASE[themes[1]] || themes[1]).toLowerCase()
    narrativeSummary = `Ideas related to ${p1} and ${p2}.`
  } else if (primaryTheme) {
    const phrase = THEME_PHRASE[primaryTheme] || primaryTheme.toLowerCase()
    narrativeSummary = `Ideas related to ${phrase}.`
  } else if (primaryEntity) {
    narrativeSummary = `Moments with ${primaryEntity}.`
  } else if (sourceLabel && sourceLabel !== 'Web') {
    narrativeSummary = `Saved from ${sourceLabel}.`
  } else {
    narrativeSummary = 'A saved memory worth revisiting.'
  }

  const result = { narrativeTitle, narrativeSummary }
  if (cacheKey) {
    if (_cache.size > 1000) _cache.clear()
    _cache.set(cacheKey, result)
  }
  return result
}
