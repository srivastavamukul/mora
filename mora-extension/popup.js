const btn = document.getElementById("saveBtn");
const status = document.getElementById("status");

btn.addEventListener("click", async () => {
  btn.disabled = true;
  status.textContent = "Capturing...";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["extractor.js"]
  });

  setTimeout(() => {
    status.textContent = "Saved ✓";
  }, 600);
});