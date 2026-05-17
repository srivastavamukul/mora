import { captureItem } from './captureItem'
import { deduplicateCapture } from './deduplicateCapture'

const MAX_BRIDGE_PAYLOAD = 50

export function initBridge(setItems) {
  function handleMessage(event) {
    if (event.origin !== window.location.origin) return
    if (!event.data || event.data.source !== 'mora-extension') return

    const payload = event.data.payload
    if (!Array.isArray(payload) || payload.length === 0) return
    if (payload.length > MAX_BRIDGE_PAYLOAD) return
    if (!payload.every(p => p !== null && typeof p === 'object')) return

    const batchOutcomes = []

    setItems(current => {
      let next = [...current]
      let changed = false
      for (const raw of payload) {
        try {
          if (!raw || typeof raw !== 'object') { batchOutcomes.push('invalid'); continue }
          const candidate = captureItem({ ...raw, origin: 'extension' })
          if (!candidate || !candidate.url) { batchOutcomes.push('invalid'); continue }
          const { isDuplicate } = deduplicateCapture(next, candidate)
          if (isDuplicate) {
            batchOutcomes.push('duplicate')
          } else {
            batchOutcomes.push(candidate.thumbnail ? 'added' : 'partial')
            next.push(candidate)
            changed = true
          }
        } catch {
          batchOutcomes.push('invalid')
        }
      }
      return changed ? next : current
    })

    setTimeout(() => {
      if (batchOutcomes.length === 0) return
      const allInvalid = batchOutcomes.every(o => o === 'invalid')
      const status = allInvalid ? 'nothing_valid'
        : batchOutcomes.includes('duplicate') ? 'duplicate'
        : batchOutcomes.includes('partial') ? 'partial'
        : 'added'
      window.postMessage({ source: 'mora-extension-feedback', status }, window.location.origin)
    }, 0)
  }

  window.addEventListener('message', handleMessage)
  return () => window.removeEventListener('message', handleMessage)
}
