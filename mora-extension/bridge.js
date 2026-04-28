chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "MORA_CAPTURE") return;
  
  window.postMessage({
    source: "mora-extension",
    payload: message.items
  }, window.location.origin);
});