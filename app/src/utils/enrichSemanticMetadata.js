// topic lifting: raw word → theme string(s) or null (null = suppress filler)
const TOPIC_LIFT = {
  // filler / noise
  let: null, magic: null, amazing: null, awesome: null, incredible: null,
  beautiful: null, love: null, like: null, going: null, well: null,
  look: null, see: null, time: null, day: null, back: null,
  just: null, ever: null, even: null, always: null, never: null,
  make: null, get: null, way: null, ways: null, things: null, thing: null,
  best: null, top: null, tips: null, tip: null, guide: null, list: null,
  new: null, good: null, great: null, use: null, using: null, used: null,
  now: null, still: null, real: null, true: null, right: null, big: null,

  // business / entrepreneurship
  money: ['Online Income', 'Entrepreneurship'],
  earn: ['Online Income', 'Entrepreneurship'],
  earning: ['Online Income', 'Entrepreneurship'],
  income: ['Online Income', 'Entrepreneurship'],
  revenue: 'Business',
  profit: 'Business',
  startup: 'Entrepreneurship',
  startups: 'Entrepreneurship',
  entrepreneur: 'Entrepreneurship',
  entrepreneurs: 'Entrepreneurship',
  freelance: 'Freelancing',
  freelancer: 'Freelancing',
  business: 'Business',
  brand: 'Branding',
  branding: 'Branding',
  marketing: 'Marketing',
  sales: 'Sales',
  saas: 'Software Business',
  product: 'Product',

  // finance
  invest: 'Investing',
  investing: 'Investing',
  investment: 'Investing',
  investments: 'Investing',
  stocks: 'Investing',
  stock: 'Investing',
  finance: 'Personal Finance',
  financial: 'Personal Finance',
  budget: 'Personal Finance',
  budgeting: 'Personal Finance',
  wealth: 'Wealth Building',
  crypto: 'Cryptocurrency',
  bitcoin: 'Cryptocurrency',
  ethereum: 'Cryptocurrency',

  // technology
  tech: 'Technology',
  technology: 'Technology',
  software: 'Software',
  code: 'Programming',
  coding: 'Programming',
  programming: 'Programming',
  developer: 'Software Development',
  development: 'Software Development',
  engineering: 'Engineering',
  ai: 'Artificial Intelligence',
  data: 'Data Science',
  database: 'Technology',
  automation: 'Technology',

  // design
  design: 'Design',
  designer: 'Design',
  ui: 'UX/UI Design',
  ux: 'UX/UI Design',
  graphic: 'Graphic Design',
  visual: 'Visual Design',
  typography: 'Design',
  aesthetic: 'Design',
  color: 'Design',
  colour: 'Design',
  animation: 'Design',

  // creative arts
  art: 'Art',
  artist: 'Art',
  artwork: 'Art',
  creative: 'Creativity',
  creativity: 'Creativity',
  illustration: 'Illustration',
  illustrator: 'Illustration',
  photography: 'Photography',
  photo: 'Photography',
  photos: 'Photography',
  draw: 'Illustration',
  drawing: 'Illustration',

  // entertainment / film
  film: 'Cinema',
  films: 'Cinema',
  movie: 'Cinema',
  movies: 'Cinema',
  cinema: 'Cinema',
  bollywood: ['Bollywood', 'Entertainment'],
  hollywood: ['Cinema', 'Entertainment'],
  actor: 'Entertainment',
  actress: 'Entertainment',
  celebrity: 'Entertainment',
  shows: 'Entertainment',
  gaming: 'Gaming',
  podcast: 'Podcasts',

  // music
  music: 'Music',
  song: 'Music',
  songs: 'Music',
  singer: 'Music',
  band: 'Music',
  album: 'Music',
  concert: 'Music',
  playlist: 'Music',

  // dance
  dance: 'Dance',
  dancing: 'Dance',

  // social media / digital
  instagram: 'Social Media',
  youtube: 'Video Content',
  pinterest: 'Visual Discovery',
  tiktok: 'Social Media',
  twitter: 'Social Media',
  content: 'Content Creation',
  creator: 'Content Creation',
  influencer: 'Influencer Marketing',

  // health / wellness
  health: 'Health',
  fitness: 'Fitness',
  wellness: 'Wellness',
  mindfulness: 'Mindfulness',
  meditation: 'Mindfulness',
  nutrition: 'Nutrition',
  diet: 'Nutrition',
  exercise: 'Fitness',
  workout: 'Fitness',
  yoga: 'Wellness',

  // lifestyle
  food: 'Food',
  travel: 'Travel',
  lifestyle: 'Lifestyle',
  fashion: 'Fashion',
  style: 'Fashion',

  // learning / development
  learn: 'Learning',
  learning: 'Learning',
  education: 'Education',
  productivity: 'Productivity',
  habit: 'Personal Development',
  habits: 'Personal Development',
  growth: 'Personal Development',
  mindset: 'Personal Development',
  writing: 'Writing',
  book: 'Books',
  books: 'Books',
  read: 'Reading',
  reading: 'Reading',
  research: 'Research',
  science: 'Science',
  psychology: 'Psychology',
  philosophy: 'Philosophy',
  spiritual: 'Spirituality',
  spirituality: 'Spirituality',
}

// words mapping to null — exported for tagFreq filtering
export const FILLER_WORDS = new Set(
  Object.entries(TOPIC_LIFT)
    .filter(([, v]) => v === null)
    .map(([k]) => k)
)

// platform names that are contexts, not person entities
const NAME_STOP = new Set([
  'A', 'An', 'The', 'In', 'On', 'At', 'To', 'For', 'Of', 'By', 'With',
  'And', 'Or', 'But', 'From', 'Into', 'About', 'After', 'Before', 'As',
  'Is', 'Are', 'Was', 'Were', 'Be', 'Been', 'Has', 'Have', 'Had',
  'Do', 'Does', 'Will', 'Would', 'Can', 'Could', 'Should', 'May',
  'Let', 'Make', 'Get', 'Come', 'Go', 'See', 'Know', 'Think', 'Take',
  'Give', 'Look', 'Use', 'Find', 'Tell', 'Try', 'Start', 'Run', 'Keep',
  'This', 'That', 'These', 'Those', 'My', 'Your', 'His', 'Her', 'Our', 'Its',
  'How', 'Why', 'What', 'When', 'Where', 'Who', 'Which',
  'New', 'More', 'Most', 'All', 'Some', 'No', 'Not', 'Only', 'Just',
  'Good', 'Great', 'Best', 'Top', 'Old', 'Big',
  'Official', 'Video', 'Audio', 'Full', 'Live', 'Episode', 'Season', 'Part',
  'YouTube', 'Instagram', 'Twitter', 'Pinterest', 'Facebook', 'TikTok',
  'Reddit', 'Spotify', 'LinkedIn', 'Medium', 'Substack', 'GitHub',
  'Behance', 'Dribbble', 'Wikipedia', 'SoundCloud', 'Bandcamp',
])

const SOCIAL_PLATFORM_RE = /^(.+?)\s+on\s+(?:instagram|twitter|x|youtube|tiktok|facebook|pinterest|linkedin|reddit)\s*[:–—]/i

const HOW_TO_RE = /^how\s+to\s+/i

const GERUND_MAP = {
  make: 'Making', build: 'Building', create: 'Creating', start: 'Starting',
  grow: 'Growing', earn: 'Earning', use: 'Using', find: 'Finding',
  get: 'Getting', run: 'Running', develop: 'Developing', launch: 'Launching',
  write: 'Writing', sell: 'Selling', learn: 'Learning', manage: 'Managing',
}

function extractEntities(text) {
  if (!text) return []
  const entities = []

  // "X on Platform:" → X is a person/brand
  const platformMatch = text.match(SOCIAL_PLATFORM_RE)
  if (platformMatch) {
    const candidate = platformMatch[1].trim()
    if (candidate.length > 1 && candidate.length < 60) entities.push(candidate)
  }

  // consecutive capitalized words not in stop list
  const words = text.split(/\s+/)
  let run = []
  for (const word of words) {
    const stripped = word.replace(/[^a-zA-Z]/g, '')
    const isCap = stripped.length > 1 && /^[A-Z][a-z]/.test(stripped) && !NAME_STOP.has(stripped)
    if (isCap) {
      run.push(stripped)
    } else {
      if (run.length >= 2) {
        const entity = run.join(' ')
        if (!entities.some(e => e.includes(entity) || entity.includes(e))) entities.push(entity)
      }
      run = []
    }
  }
  if (run.length >= 2) {
    const entity = run.join(' ')
    if (!entities.some(e => e.includes(entity) || entity.includes(e))) entities.push(entity)
  }

  return entities.slice(0, 3)
}

function liftThemes(words) {
  const themes = new Set()
  for (const word of words) {
    const val = TOPIC_LIFT[word.toLowerCase()]
    if (Array.isArray(val)) val.forEach(t => themes.add(t))
    else if (val) themes.add(val)
    // null = suppress; undefined = not in map = ignore
  }
  return [...themes]
}

function buildCleanTitle(rawTitle) {
  if (!rawTitle) return ''
  let title = String(rawTitle).trim()

  // "X on Platform: ..." → "X"
  const platformMatch = title.match(SOCIAL_PLATFORM_RE)
  if (platformMatch) return platformMatch[1].trim()

  // "How To [Verb] ..." → "[Verbing] ..."
  if (HOW_TO_RE.test(title)) {
    title = title.replace(HOW_TO_RE, '').trim()
    const firstWord = title.split(/\s+/)[0]
    const gerund = GERUND_MAP[firstWord.toLowerCase()]
    if (gerund) {
      title = gerund + title.slice(firstWord.length)
    }
    title = title.replace(/\bOn\s+([A-Z])/g, 'with $1')
  }

  return title.trim()
}

function buildCleanDescription(raw) {
  if (!raw) return ''
  return String(raw)
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 200)
}

export function enrichSemanticMetadata(item) {
  if (!item) return { entities: [], themes: [], cleanTitle: '', cleanDescription: '' }

  const rawTitle = item.title || ''
  const rawDesc = item.description || item.body || ''
  const tags = Array.isArray(item.tags) ? item.tags : []

  const entities = extractEntities(rawTitle) || extractEntities(rawDesc.slice(0, 200))

  // lift from both existing tags and title words (>2 chars)
  const titleWords = rawTitle.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  const themes = liftThemes([...tags, ...titleWords])

  return {
    entities,
    themes,
    cleanTitle: buildCleanTitle(rawTitle),
    cleanDescription: buildCleanDescription(rawDesc),
  }
}
