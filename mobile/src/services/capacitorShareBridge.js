import { handleShareIntent, initShareService, getPendingCount } from './shareIntentService.js'

let bridgeReady = false
let minimizeTimer = null

function showNativeNotification(status, title) {
  try {
    const nb = window.__moraNativeAndroid
    if (!nb?.showNotification) return
    if (status === 'saved') {
      nb.showNotification('Saved to Mora ✓', title || 'Item captured')
    } else if (status === 'duplicate') {
      nb.showNotification('Already in Mora', title || 'Already saved')
    } else {
      nb.showNotification('Mora capture failed', 'Open Mora to review')
    }
  } catch {}
}

function scheduleMinimize() {
  clearTimeout(minimizeTimer)
  minimizeTimer = setTimeout(() => {
    try { window.__moraNativeAndroid?.moveToBackground?.() } catch {}
  }, 300)
}

export function receiveSharePayload(payload = {}) {
  try {
    const result = handleShareIntent(payload)
    if (result.status === 'duplicate') {
      showNativeNotification('duplicate', payload.title)
      scheduleMinimize()
    }
    return result
  } catch {
    showNativeNotification('failed', null)
    return { status: 'error', reason: 'bridge_receive_failed' }
  }
}

export function initCapacitorBridge(onItem) {
  if (typeof onItem !== 'function') throw new Error('initCapacitorBridge: onItem must be a function')
  if (bridgeReady) return

  function wrappedOnItem(moraItem) {
    let status = 'saved'
    try {
      const result = onItem(moraItem)
      status = result?.status ?? 'saved'
    } catch {
      showNativeNotification('failed', moraItem?.title)
      throw new Error('save_failed')
    }
    showNativeNotification(status, moraItem?.title)
    scheduleMinimize()
    return { status }
  }

  try {
    initShareService(wrappedOnItem)
  } catch {}

  // Android cold-start: pull share payload captured before JS context was ready
  if (typeof window !== 'undefined' && window.__moraNativeAndroid) {
    try {
      const raw = window.__moraNativeAndroid.getPendingShare()
      if (raw) handleShareIntent(JSON.parse(raw))
    } catch {}
  }

  // Drain queue each time app returns to foreground (share while app was suspended)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return
      if (getPendingCount() === 0) return
      try { initShareService(wrappedOnItem) } catch {}
    })
  }

  bridgeReady = true
}

export function exposeNativeBridge() {
  globalThis.__moraBridge = { receiveSharePayload }
}
