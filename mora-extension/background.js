chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "PAGE_DATA") return;

  const { url, title, description, thumbnail, source, type, selectedText } = message.payload;

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
    };

    queue.push(item);

    chrome.storage.local.set({ mora_capture_queue: queue }, () => {
      chrome.tabs.query({ url: "http://localhost:5173/*" }, (tabs) => {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, { type: "MORA_CAPTURE", items: [item] })
            .catch(() => {});
        }
      });
    });
  });
});
