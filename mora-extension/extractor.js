const getMeta = (selectors) => {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    const val = el?.getAttribute("content") || el?.getAttribute("href");
    if (val) return val;
  }
  return "";
};

const hostname = window.location.hostname.replace(/^www\./, "");

let source = "web";
let type = "link";

if (hostname.includes("youtube.com")) { source = "youtube"; type = "video"; }
else if (hostname.includes("pinterest.com")) { source = "pinterest"; type = "image"; }
else if (hostname.includes("instagram.com")) { source = "instagram"; type = "post"; }

chrome.runtime.sendMessage({
  type: "PAGE_DATA",
  payload: {
    url: window.location.href,
    title: document.title,
    description: getMeta([
      'meta[property="og:description"]',
      'meta[name="description"]',
    ]),
    thumbnail: getMeta([
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[property="twitter:image"]',
    ]),
    source,
    type,
    selectedText: window.getSelection()?.toString() || "",
  },
});
