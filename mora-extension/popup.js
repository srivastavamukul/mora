const btn = document.getElementById("saveBtn");
const status = document.getElementById("status");

btn.addEventListener("click", async () => {
  btn.disabled = true;
  status.textContent = "Capturing...";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const { mora_capture_queue: before = [] } = await chrome.storage.local.get("mora_capture_queue");
  const beforeLen = before.length;

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["extractor.js"],
  });

  setTimeout(async () => {
    const { mora_capture_queue: after = [] } = await chrome.storage.local.get("mora_capture_queue");

    if (after.length === beforeLen) {
      status.textContent = "Already saved";
    } else {
      const item = after[after.length - 1];
      status.textContent = item?.thumbnail ? "Saved ✓" : "Saved (no preview)";
    }
    btn.disabled = false;
  }, 600);
});
