const btn = document.getElementById("saveBtn");
const status = document.getElementById("status");
const preview = document.getElementById("preview");
const previewImg = document.getElementById("previewImg");

const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";
undoBtn.style.cssText = "margin-top:6px;background:#333;font-size:12px;padding:6px;display:none;";
status.after(undoBtn);

let undoTimer = null;
let savedItemId = null;

function setStatus(text, cls = "muted") {
  status.textContent = text;
  status.className = cls;
}

function showPreview(url) {
  if (!url) return;
  previewImg.src = url;
  previewImg.onload = () => { preview.style.display = "block"; };
  previewImg.onerror = () => { preview.style.display = "none"; };
}

function showUndo(itemId) {
  savedItemId = itemId;
  undoBtn.style.display = "block";
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    undoBtn.style.display = "none";
    savedItemId = null;
  }, 5000);
}

undoBtn.addEventListener("click", async () => {
  if (!savedItemId) return;
  clearTimeout(undoTimer);
  undoBtn.style.display = "none";
  preview.style.display = "none";
  const id = savedItemId;
  savedItemId = null;
  try {
    const { mora_capture_queue: queue = [] } = await chrome.storage.local.get("mora_capture_queue");
    const filtered = queue.filter(item => item.id !== id);
    if (filtered.length === queue.length) return;
    await chrome.storage.local.set({ mora_capture_queue: filtered });
    setStatus("Removed");
  } catch {
    setStatus("Remove failed", "error");
  }
});

btn.addEventListener("click", async () => {
  btn.disabled = true;
  undoBtn.style.display = "none";
  preview.style.display = "none";
  clearTimeout(undoTimer);
  savedItemId = null;
  setStatus("Saving...");

  let resolved = false;
  let storageListener = null;
  let fallbackTimer = null;

  function finish(text, cls, item) {
    if (resolved) return;
    resolved = true;
    clearTimeout(fallbackTimer);
    if (storageListener) chrome.storage.onChanged.removeListener(storageListener);
    setStatus(text, cls);
    if (item?.thumbnail) showPreview(item.thumbnail);
    if (item?.id) showUndo(item.id);
    btn.disabled = false;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const { mora_capture_queue: before = [] } = await chrome.storage.local.get("mora_capture_queue");

    if (tab?.url && before.some(i => i.url === tab.url)) {
      return finish("Already in your archive", "muted");
    }

    const beforeLen = before.length;

    fallbackTimer = setTimeout(() => finish("Save failed", "error"), 5000);

    storageListener = (changes, area) => {
      if (area !== "local" || !changes.mora_capture_queue) return;
      const after = changes.mora_capture_queue.newValue || [];
      if (after.length <= beforeLen) return;
      const newItem = after[after.length - 1];
      const text = newItem?.thumbnail ? "Saved locally ✓" : "Saved without preview";
      finish(text, "success", newItem);
    };

    chrome.storage.onChanged.addListener(storageListener);

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["extractor.js"],
    });

  } catch {
    finish("Save failed", "error");
  }
});
