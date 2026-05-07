const btn = document.getElementById("saveBtn");
const status = document.getElementById("status");

const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";
undoBtn.style.cssText = "margin-top:6px;background:#333;font-size:12px;padding:6px;display:none;";
status.after(undoBtn);

let undoTimer = null;
let savedItemId = null;

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
  const id = savedItemId;
  savedItemId = null;
  try {
    const { mora_capture_queue: queue = [] } = await chrome.storage.local.get("mora_capture_queue");
    const filtered = queue.filter(item => item.id !== id);
    if (filtered.length === queue.length) return;
    await chrome.storage.local.set({ mora_capture_queue: filtered });
    status.textContent = "Removed";
  } catch {
    status.textContent = "Remove failed";
  }
});

btn.addEventListener("click", async () => {
  btn.disabled = true;
  undoBtn.style.display = "none";
  clearTimeout(undoTimer);
  savedItemId = null;
  status.textContent = "Capturing...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const { mora_capture_queue: before = [] } = await chrome.storage.local.get("mora_capture_queue");
    const beforeLen = before.length;
    const beforeLastId = before.length ? before[before.length - 1]?.id : null;

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["extractor.js"],
    });

    setTimeout(async () => {
      try {
        const { mora_capture_queue: after = [] } = await chrome.storage.local.get("mora_capture_queue");

        if (after.length === beforeLen) {
          status.textContent = "Already saved";
        } else {
          const newItem = after[after.length - 1];
          status.textContent = newItem?.thumbnail ? "Saved ✓" : "Saved (no preview)";
          if (newItem?.id && newItem.id !== beforeLastId) {
            showUndo(newItem.id);
          }
        }
      } catch {
        status.textContent = "Failed to save";
      }
      btn.disabled = false;
    }, 600);
  } catch {
    status.textContent = "Failed to save";
    btn.disabled = false;
  }
});
