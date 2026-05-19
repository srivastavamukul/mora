chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "MORA_CAPTURE") return;

  window.postMessage({
    source: "mora-extension",
    payload: message.items
  }, window.location.origin);

  // Remove delivered items from queue so delete+re-save works correctly (Bug 3)
  const deliveredIds = (message.items || []).map(i => i.id).filter(Boolean)
  if (deliveredIds.length > 0) {
    chrome.storage.local.get({ mora_capture_queue: [] }, (result) => {
      const remaining = result.mora_capture_queue.filter(i => !deliveredIds.includes(i.id))
      chrome.storage.local.set({ mora_capture_queue: remaining })
    })
  }
});

// Listen for messages from the Mora app
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return
  if (!event.data || event.data.source !== "mora-app") return

  // App ready — deliver any pending (unprocessed) captures (Bug 4)
  if (event.data.type === "REQUEST_PENDING") {
    chrome.storage.local.get({ mora_capture_queue: [] }, (result) => {
      const pending = result.mora_capture_queue
      if (pending.length > 0) {
        window.postMessage({ source: "mora-extension", payload: pending }, window.location.origin)
        chrome.storage.local.set({ mora_capture_queue: [] })
      }
    })
  }

  // App deleted an item — remove its URL from queue so it can be re-saved (Bug 3)
  if (event.data.type === "ITEM_DELETED" && event.data.url) {
    chrome.storage.local.get({ mora_capture_queue: [] }, (result) => {
      const remaining = result.mora_capture_queue.filter(i => i.url !== event.data.url)
      chrome.storage.local.set({ mora_capture_queue: remaining })
    })
  }
})
