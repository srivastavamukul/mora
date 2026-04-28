import { captureItem } from './captureItem'
import { deduplicateCapture } from './deduplicateCapture'

export function initBridge(setItems) {
  function handleMessage(event) {
    if (event.origin !== window.location.origin) return
    if (!event.data || event.data.source !== 'mora-extension') return

    const payload = event.data.payload
    if (!Array.isArray(payload) || payload.length === 0) return
    if (!payload.every(p => typeof p === 'object')) return

    setItems(current => {
      let next = [...current]
      for (const raw of payload) {
        try {
          if (!raw || typeof raw !== 'object') continue
          const candidate = captureItem({ ...raw, origin: 'extension' })
          if (!candidate) continue
          const { isDuplicate } = deduplicateCapture(next, candidate)
          if (!isDuplicate) next = [...next, candidate]
        } catch {
          // ignore malformed
        }
      }
      return next
    })
  }

  window.addEventListener('message', handleMessage)
  return () => window.removeEventListener('message', handleMessage)
}
