import { App } from '@capacitor/app'
import { handleShareIntent, initShareService, getPendingCount } from './shareIntentService.js'

let bridgeReady = false
let onItemCallback = null

/**
 * Called by native share plugin (Android intent / iOS share extension)
 * with raw share payload before or after JS context is ready.
 * Safe to call multiple times — dedup handled by shareIntentService.
 */
export function receiveSharePayload(payload = {}) {
  try {
    return handleShareIntent(payload)
  } catch {
    return { status: 'error', reason: 'bridge_receive_failed' }
  }
}

/**
 * Wire into Capacitor App events.
 * Call once on app startup, passing the function that writes a Mora item.
 *
 * @param {(moraItem: object) => void} onItem
 */
export function initCapacitorBridge(onItem) {
  if (typeof onItem !== 'function') throw new Error('initCapacitorBridge: onItem must be a function')
  if (bridgeReady) return

  onItemCallback = onItem

  // Initialize service — replays any items queued before bridge was ready
  try {
    initShareService(onItem)
  } catch {}

  // Replay queue each time app returns to foreground (share while app was suspended)
  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) return
    if (getPendingCount() === 0) return
    try {
      initShareService(onItemCallback)
    } catch {}
  })

  // Handle URL-scheme shares (e.g. mora://share?url=...)
  App.addListener('appUrlOpen', ({ url }) => {
    if (!url) return
    try {
      const parsed = new URL(url)
      if (parsed.hostname !== 'share') return
      const payload = {
        url:   parsed.searchParams.get('url')   ?? undefined,
        text:  parsed.searchParams.get('text')  ?? undefined,
        title: parsed.searchParams.get('title') ?? undefined,
      }
      handleShareIntent(payload)
    } catch {}
  })

  bridgeReady = true
}

/**
 * Expose bridge on globalThis so native Capacitor WebView bridge can reach it.
 * Call after initCapacitorBridge.
 */
export function exposeNativeBridge() {
  globalThis.__moraBridge = { receiveSharePayload }
}
