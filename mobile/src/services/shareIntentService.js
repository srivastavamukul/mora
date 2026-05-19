import { routeSharedContent } from '../utils/routeSharedContent.js'
import { normalizeMobileCapture } from '../utils/normalizeMobileCapture.js'

const QUEUE_KEY = '__mora_share_queue__'
const SEEN_KEY  = '__mora_share_seen__'
const MAX_QUEUE = 50
const MAX_SEEN  = 200

// --- persistence shim (replace with AsyncStorage on native) ---
const store = {
  get: key => {
    try { return JSON.parse(globalThis.localStorage?.getItem(key) ?? 'null') } catch { return null }
  },
  set: (key, val) => {
    try { globalThis.localStorage?.setItem(key, JSON.stringify(val)) } catch {}
  },
}

function loadQueue() {
  return store.get(QUEUE_KEY) ?? []
}

function saveQueue(q) {
  store.set(QUEUE_KEY, q.slice(-MAX_QUEUE))
}

function loadSeen() {
  return new Set(store.get(SEEN_KEY) ?? [])
}

function saveSeen(seen) {
  const arr = [...seen]
  store.set(SEEN_KEY, arr.slice(-MAX_SEEN))
}

// fingerprint that is stable across duplicate share events
function fingerprint(payload) {
  const { url, text, title } = payload
  return [url ?? '', text?.slice(0, 60) ?? '', title ?? ''].join('|')
}

// --- state ---
let ready = false
let drainCallback = null  // (moraItem) => void — wired by app on launch
const memQueue = []       // in-memory staging before drain

function enqueue(payload) {
  const seen = loadSeen()
  const fp   = fingerprint(payload)
  if (seen.has(fp)) return { status: 'duplicate', fp }

  seen.add(fp)
  saveSeen(seen)

  const entry = { payload, fp, queuedAt: Date.now() }
  const persisted = loadQueue()
  persisted.push(entry)
  saveQueue(persisted)
  memQueue.push(entry)

  return { status: 'queued', fp }
}

function processEntry(entry) {
  const routed    = routeSharedContent(entry.payload)
  const moraItem  = normalizeMobileCapture({
    ...entry.payload,
    source: routed.platform !== 'generic' ? routed.platform : undefined,
    ...routed.extracted,
  })
  return moraItem
}

function drain() {
  if (!ready || typeof drainCallback !== 'function') return

  const persisted = loadQueue()
  const toProcess = persisted.length ? persisted : memQueue

  const succeeded = []
  const failed    = []

  for (const entry of toProcess) {
    try {
      const item = processEntry(entry)
      drainCallback(item)
      succeeded.push(entry.fp)
    } catch {
      failed.push(entry.fp)
    }
  }

  // clear only succeeded entries
  if (succeeded.length) {
    const remaining = loadQueue().filter(e => !succeeded.includes(e.fp))
    saveQueue(remaining)
    memQueue.length = 0
    for (const e of remaining) memQueue.push(e)
  }

  return { succeeded: succeeded.length, failed: failed.length }
}

// --- public API ---

/**
 * Called by the OS share handler (intent/share extension) with raw payload.
 * Safe to call before app is ready — captures are queued and replayed on init.
 */
export function handleShareIntent(payload = {}) {
  if (!payload || (!payload.url && !payload.text)) {
    return { status: 'ignored', reason: 'empty_payload' }
  }
  const result = enqueue(payload)
  if (result.status === 'queued' && ready) drain()
  return result
}

/**
 * Call once on app launch, passing the function that writes a Mora item.
 * Replays any pending captures from previous sessions.
 */
export function initShareService(onItem) {
  if (typeof onItem !== 'function') throw new Error('initShareService: onItem must be a function')
  drainCallback = onItem
  ready = true
  return drain()
}

/**
 * Returns pending capture count (persisted + in-memory).
 */
export function getPendingCount() {
  const persisted = loadQueue()
  return persisted.length || memQueue.length
}

/**
 * Hard-reset — clears queue and seen index. For testing / sign-out.
 */
export function resetShareService() {
  saveQueue([])
  saveSeen(new Set())
  memQueue.length = 0
  ready = false
  drainCallback = null
}
