chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "PAGE_DATA") return;

  const { url, title, description, thumbnail, source, type, selectedText, metadata } = message.payload;

  chrome.storage.local.get({ mora_capture_queue: [] }, (result) => {
    const queue = [...result.mora_capture_queue];

    const item = {
      id: crypto.randomUUID(),
      origin: "extension",
      timestamp: Date.now(),
      url,
      title,
      description: description || "",
      thumbnail: thumbnail || "",
      source: source || "web",
      type: type || "link",
      selectedText: selectedText || "",
      ...(metadata ? { metadata } : {}),
    };

    queue.push(item);

    chrome.storage.local.set({ mora_capture_queue: queue }, () => {
      if (chrome.runtime.lastError) return;
      chrome.tabs.query({ url: "http://localhost:5173/*" }, (tabs) => {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, { type: "MORA_CAPTURE", items: [item] })
            .catch(() => {
              // Bridge content script may be dead after extension reload — re-inject and retry
              chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["bridge.js"] })
                .then(() => setTimeout(() => {
                  chrome.tabs.sendMessage(tab.id, { type: "MORA_CAPTURE", items: [item] }).catch(() => {})
                }, 100))
                .catch(() => {})
            });
        }
      });
    });
  });
});
