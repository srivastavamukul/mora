import { captureItem } from './captureItem'
import { deduplicateCapture } from './deduplicateCapture'

export function initBridge(setItems) {
  function handleMessage(event) {
    if (event.origin !== window.location.origin) return
    if (!event.data || event.data.source !== 'mora-extension') return

    const payload = event.data.payload
    if (!Array.isArray(payload) || payload.length === 0) return
    if (!payload.every(p => typeof p === 'object')) return

    console.log("BRIDGE RECEIVED:", payload)

    const batchOutcomes = []

    setItems(current => {
      console.log("CURRENT ITEMS:", current)
      let next = [...current]
      let changed = false
      for (const raw of payload) {
        try {
          console.log("RAW ITEM:", raw)
          if (!raw || typeof raw !== 'object') continue
          const candidate = captureItem({ ...raw, origin: 'extension' })
          console.log("CANDIDATE:", candidate)
          if (!candidate || !candidate.url) continue
          const { isDuplicate } = deduplicateCapture(next, candidate)
          console.log("DEDUP RESULT:", isDuplicate)
          if (isDuplicate) {
            batchOutcomes.push('duplicate')
            console.log("SKIPPED DUPLICATE")
          } else {
            batchOutcomes.push(candidate.thumbnail ? 'added' : 'partial')
            next.push(candidate)
            changed = true
            console.log("ITEM ADDED:", candidate)
          }
        } catch {
          // ignore malformed
        }
      }
      return changed ? next : current
    })

    setTimeout(() => {
      if (batchOutcomes.length === 0) return
      const status = batchOutcomes.includes('duplicate') ? 'duplicate'
        : batchOutcomes.includes('partial') ? 'partial'
        : 'added'
      window.postMessage({ source: 'mora-extension-feedback', status }, window.location.origin)
    }, 0)
  }

  window.addEventListener('message', handleMessage)
  return () => window.removeEventListener('message', handleMessage)
}
