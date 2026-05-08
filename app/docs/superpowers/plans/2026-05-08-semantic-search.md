# Semantic Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Moodboard's title-only search with deterministic text similarity scoring across all item fields.

**Architecture:** New pure utility `scoreSearchMatch.js` exports two functions — `scoreSearchMatch` (scores one item against a query) and `semanticSearch` (filters+sorts a list). Moodboard replaces its `matchesSearch` filter with a memoized `semanticSearch` call; when a query is active, semantic relevance order overrides the sort mode.

**Tech Stack:** Vanilla JS, React useMemo, Vitest (already configured at `mora/app`)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/utils/scoreSearchMatch.js` | `normalize`, `scoreSearchMatch`, `semanticSearch` |
| Create | `src/utils/__tests__/scoreSearchMatch.test.js` | All tests for the two exports |
| Modify | `src/pages/Moodboard.jsx` | Remove `matchesSearch`, wire semantic search |

---

### Task 1: Write failing tests for `scoreSearchMatch` and `semanticSearch`

**Files:**
- Create: `src/utils/__tests__/scoreSearchMatch.test.js`

- [ ] **Step 1: Create the test file**

```js
// src/utils/__tests__/scoreSearchMatch.test.js
import { describe, it, expect } from 'vitest'
import { scoreSearchMatch, semanticSearch } from '../scoreSearchMatch'

const makeItem = (overrides = {}) => ({
  id: 'i1',
  title: 'Test Title',
  body: '',
  tags: [],
  source: 'web',
  type: 'link',
  createdAt: Date.now(),
  ...overrides,
})

describe('scoreSearchMatch', () => {
  it('returns 0 for empty query', () => {
    expect(scoreSearchMatch('', makeItem())).toBe(0)
    expect(scoreSearchMatch('   ', makeItem())).toBe(0)
  })

  it('returns 0 when no text matches', () => {
    const item = makeItem({ title: 'React hooks', body: '', tags: [], source: 'web', type: 'link' })
    const score = scoreSearchMatch('python django', item)
    expect(score).toBe(0)
  })

  it('gives +5 for exact phrase match', () => {
    const item = makeItem({ title: 'deep learning tutorial', body: '', tags: [], source: 'web', type: 'link' })
    const score = scoreSearchMatch('deep learning', item)
    // phrase match (+5) + word matches (+3 each for "deep" and "learning") + recency
    expect(score).toBeGreaterThanOrEqual(11)
  })

  it('gives +3 per exact word match (no phrase)', () => {
    const item = makeItem({ title: 'react patterns guide', body: '', tags: [], source: 'web', type: 'link' })
    // "react hooks": phrase not in text, "react" exact word (+3), "hooks" absent (0)
    const score = scoreSearchMatch('react hooks', item)
    expect(score).toBeGreaterThanOrEqual(3)
    expect(score).toBeLessThan(5) // no phrase bonus
  })

  it('gives +1 for partial word match (substring)', () => {
    const item = makeItem({ title: 'redesigning interfaces', body: '', tags: [], source: 'web', type: 'link' })
    // "design tools": phrase not in text, "design" partial in "redesigning" (+1), "tools" absent (0)
    const score = scoreSearchMatch('design tools', item)
    expect(score).toBeGreaterThanOrEqual(1)
    expect(score).toBeLessThan(3) // no phrase or exact word bonus
  })

  it('scores across all memory text fields (tags, body, source)', () => {
    const item = makeItem({ title: 'My Item', body: 'machine learning notes', tags: ['ml'], source: 'medium', type: 'article' })
    const score = scoreSearchMatch('machine learning', item)
    expect(score).toBeGreaterThan(0)
  })

  it('is case-insensitive', () => {
    const item = makeItem({ title: 'Deep Learning Basics', body: '', tags: [], source: 'web', type: 'link' })
    const lower = scoreSearchMatch('deep learning', item)
    const upper = scoreSearchMatch('DEEP LEARNING', item)
    expect(lower).toBe(upper)
  })

  it('strips punctuation from query and text', () => {
    const item = makeItem({ title: 'React, hooks & patterns', body: '', tags: [], source: 'web', type: 'link' })
    const score = scoreSearchMatch('react hooks', item)
    expect(score).toBeGreaterThan(0)
  })

  it('adds recency boost (recent item scores higher than old)', () => {
    const recentItem = makeItem({ title: 'same title here', createdAt: Date.now() })
    const oldItem = makeItem({ title: 'same title here', createdAt: Date.now() - 100 * 86400000 })
    expect(scoreSearchMatch('same title', recentItem)).toBeGreaterThan(scoreSearchMatch('same title', oldItem))
  })
})

describe('semanticSearch', () => {
  it('returns items unchanged when query is empty', () => {
    const items = [makeItem({ id: '1' }), makeItem({ id: '2' })]
    expect(semanticSearch('', items)).toBe(items)
    expect(semanticSearch('   ', items)).toBe(items)
  })

  it('filters out items with score <= 0', () => {
    const match = makeItem({ id: '1', title: 'react hooks tutorial' })
    const noMatch = makeItem({ id: '2', title: 'cooking pasta recipe' })
    const result = semanticSearch('react', [match, noMatch])
    expect(result.map(i => i.id)).toContain('1')
    expect(result.map(i => i.id)).not.toContain('2')
  })

  it('sorts results by score descending', () => {
    const strong = makeItem({ id: 'strong', title: 'react hooks deep dive react' })
    const weak = makeItem({ id: 'weak', title: 'some react mention' })
    const result = semanticSearch('react hooks', [weak, strong])
    expect(result[0].id).toBe('strong')
  })

  it('returns plain items (not score wrappers)', () => {
    const item = makeItem({ id: '1', title: 'react patterns' })
    const result = semanticSearch('react', [item])
    expect(result[0]).not.toHaveProperty('score')
    expect(result[0]).toHaveProperty('title')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail (file not yet created)**

```
cd C:\MORA\mora\app && npm test -- scoreSearchMatch
```

Expected: FAIL — `Cannot find module '../scoreSearchMatch'`

---

### Task 2: Implement `scoreSearchMatch.js`

**Files:**
- Create: `src/utils/scoreSearchMatch.js`

- [ ] **Step 1: Create the utility**

```js
// src/utils/scoreSearchMatch.js
import { getItemMemoryText } from './getItemMemoryText'
import { getRecencyScore } from './getRecencyScore'

function normalize(str) {
  return (str || '').toLowerCase().replace(/[^\w\s]/g, '').trim()
}

export function scoreSearchMatch(query, item) {
  const q = normalize(query)
  if (!q) return 0

  const text = normalize(getItemMemoryText(item))
  if (!text) return 0

  let score = 0

  if (text.includes(q)) score += 5

  const queryWords = q.split(/\s+/).filter(Boolean)
  const textWords = new Set(text.split(/\s+/).filter(Boolean))

  for (const word of queryWords) {
    if (textWords.has(word)) {
      score += 3
    } else if (text.includes(word)) {
      score += 1
    }
  }

  score += getRecencyScore(item.createdAt) * 0.3

  return score
}

export function semanticSearch(query, items) {
  if (!query || !query.trim()) return items
  return items
    .map(item => ({ item, score: scoreSearchMatch(query, item) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.item)
}
```

- [ ] **Step 2: Run the full test suite**

```
cd C:\MORA\mora\app && npm test -- scoreSearchMatch
```

Expected: All tests PASS.

- [ ] **Step 3: Run full suite to check no regressions**

```
cd C:\MORA\mora\app && npm test
```

Expected: All 19 existing tests + new tests PASS.

- [ ] **Step 4: Commit**

```
cd C:\MORA\mora\app && git add src/utils/scoreSearchMatch.js src/utils/__tests__/scoreSearchMatch.test.js
```

> Note: C:\MORA is not a git repo. Skip commit step — no git available.

---

### Task 3: Integrate semantic search into Moodboard.jsx

**Files:**
- Modify: `src/pages/Moodboard.jsx`

- [ ] **Step 1: Add import at top of Moodboard.jsx**

After the existing imports (around line 12), add:

```js
import { semanticSearch } from '../utils/scoreSearchMatch'
```

- [ ] **Step 2: Remove `matchesSearch` function**

Delete lines 287–297 (the entire `matchesSearch` function):

```js
// DELETE THIS BLOCK:
const matchesSearch = (item) => {
  const query = searchQuery.trim().toLowerCase()
  if (!query) return true
  const safe = safeItem(item)
  return (
    safe.title.toLowerCase().includes(query) ||
    safe.source.toLowerCase().includes(query) ||
    safe.tags.some(tag => tag.toLowerCase().includes(query)) ||
    (item.mood && item.mood.toLowerCase().includes(query))
  )
}
```

- [ ] **Step 3: Replace `filtered` and `sorted` computations**

Delete these lines (around 299–305):

```js
// DELETE:
const filtered = items.filter(item => {
  const matchesType = activeFilter === 'all' || (item.type || item.filterKey) === activeFilter
  return matchesType && matchesSearch(item)
})

// eslint-disable-next-line react-hooks/exhaustive-deps
const sorted = useMemo(() => sortItems(filtered, flags, sortMode), [filtered, flags, sortMode])
```

Replace with:

```js
const filtered = useMemo(() => {
  const typeFiltered = items.filter(item =>
    activeFilter === 'all' || (item.type || item.filterKey) === activeFilter
  )
  const query = searchQuery.trim()
  return query ? semanticSearch(query, typeFiltered) : typeFiltered
}, [items, activeFilter, searchQuery])

// eslint-disable-next-line react-hooks/exhaustive-deps
const sorted = useMemo(() => {
  if (searchQuery.trim()) return filtered
  return sortItems(filtered, flags, sortMode)
}, [filtered, flags, sortMode])
```

- [ ] **Step 4: Verify build is clean**

```
cd C:\MORA\mora\app && npm run build
```

Expected: Build completes with no errors. Module count should be ~60 (one new module for scoreSearchMatch).

- [ ] **Step 5: Run full test suite one final time**

```
cd C:\MORA\mora\app && npm test
```

Expected: All tests PASS (scoreSearchMatch tests + original 19).

- [ ] **Step 6: Manual smoke test**

Start dev server: `npm run dev`

1. Open Moodboard
2. Type a partial word (e.g. "react") — should match items with "react" in title, body, tags, source
3. Type a phrase (e.g. "machine learning") — phrase-matching items should appear first
4. Type nonsense — grid should go empty (no zero-score items)
5. Clear search — items return to previous sort order
6. Confirm filter chips still work alongside search
7. Confirm grouping (dominant tag / timeline) still renders in non-search mode
