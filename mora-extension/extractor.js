(function () {
  const url = window.location.href
  const hostname = window.location.hostname.replace(/^www\./, '')

  function getMeta(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      const val = el?.content || el?.getAttribute('content')
      if (val) return val
    }
    return ''
  }

  function send(payload) {
    if (window.location.href !== url) return
    chrome.runtime.sendMessage({ type: 'PAGE_DATA', payload })
  }

  let source = 'web'
  let type = 'link'

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    source = 'youtube'
    type = 'video'
  } else if (hostname.includes('pinterest.com')) {
    source = 'pinterest'
    type = 'image'
  } else if (hostname.includes('instagram.com')) {
    source = 'instagram'
    type = 'post'
  }

  const selectedText = window.getSelection()?.toString() || ''

  // Instagram: og: meta tags are NOT updated on SPA navigation.
  // Read live DOM. sendMessage fires inside callback only.
  if (source === 'instagram') {
    function isInstagramCDN(src) {
      return src && (
        src.includes('cdninstagram') ||
        src.includes('fbcdn') ||
        src.includes('scontent')
      )
    }

    function getInstagramThumbnail(attempts) {
      // Reels: video poster attribute is the thumbnail, not an img element
      const videoPoster = [...document.querySelectorAll('video[poster]')]
        .map(v => v.poster || '')
        .find(isInstagramCDN)
      if (videoPoster) return videoPoster

      const allImgs = [...document.querySelectorAll('img')]

      // Loaded images first (naturalWidth > 100 = fully rendered)
      const loaded = allImgs
        .filter(img => (img.naturalWidth || img.width || 0) > 100)
        .map(i => i.currentSrc || i.src || '')
        .find(isInstagramCDN)
      if (loaded) return loaded

      // Foreign CDN images load slower — check src/currentSrc even if not rendered yet
      const unloaded = allImgs
        .map(i => i.currentSrc || i.src || i.dataset?.src || '')
        .find(isInstagramCDN)
      if (unloaded) return unloaded

      const metaImg = getMeta(['meta[property="og:image"]', 'meta[name="twitter:image"]']) || ''

      // ONLY use meta as LAST fallback (not primary)
      return attempts >= 4 ? metaImg : ''
    }

    function getInstagramTitle() {
      const title = document.title || ''
      // document.title is just "Instagram" during SPA transition — use og:title as fallback
      if (title && title.toLowerCase() !== 'instagram' && !title.includes('•')) return title
      return getMeta(['meta[property="og:title"]']) || title || ''
    }

    function extractInstagram(attempts) {
      const thumbnail = getInstagramThumbnail(attempts)
      const title = getInstagramTitle()
      const validThumbnail = isInstagramCDN(thumbnail)

      if (validThumbnail || attempts >= 6) {
        const article = document.querySelector('article')
        const caption = article?.querySelector('span[dir="auto"]')?.textContent?.trim() || ''
        const description =
          getMeta(['meta[property="og:description"]', 'meta[name="description"]']) || caption
        send({ url, title, description, thumbnail, source, type, selectedText })
        return
      }

      // Wait for DOM update — MutationObserver with timeout fallback
      const target = document.querySelector('article') || document.querySelector('main') || document.body
      let fired = false

      const observer = new MutationObserver(() => {
        if (fired) return
        fired = true
        observer.disconnect()
        extractInstagram(attempts + 1)
      })

      observer.observe(target, { childList: true, subtree: true })

      setTimeout(() => {
        if (fired) return
        fired = true
        observer.disconnect()
        extractInstagram(attempts + 1)
      }, 300)
    }

    extractInstagram(0)
    return
  }

  // YouTube, Pinterest, generic web — og: meta is reliable here
  // Adaptive delay: already-loaded pages need almost no wait
  const delay = document.readyState === 'complete' ? 100 : 500

  setTimeout(() => {
    const titleTag = document.title || ''
    const rawTitle =
      getMeta(['meta[property="og:title"]']) ||
      titleTag ||
      document.querySelector('h1')?.textContent?.trim() ||
      url.split('/').pop().replace(/[-_]/g, ' ') ||
      ''

    let cleanTitle = rawTitle.trim()
    if (!cleanTitle.includes(' ') && cleanTitle.includes('-')) {
      cleanTitle = cleanTitle.replace(/[-_]/g, ' ')
    }

    const description =
      getMeta([
        'meta[property="og:description"]',
        'meta[name="description"]'
      ]) || ''

    let thumbnail =
      getMeta([
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
        'meta[property="twitter:image"]'
      ]) || ''

    if (source === 'youtube') {
      const urlObj = new URL(url)
      const videoId =
        urlObj.searchParams.get('v') ||
        (hostname.includes('youtu.be') ? urlObj.pathname.slice(1) : null) ||
        (url.includes('/shorts/') ? url.split('/shorts/')[1]?.split('?')[0] : null)
      thumbnail = videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : thumbnail
    }

    if (source === 'pinterest') {
      thumbnail =
        getMeta([
          'meta[property="og:image:secure_url"]',
          'meta[name="twitter:image:src"]'
        ]) || thumbnail
      const img =
        document.querySelector('img[srcset]')?.src ||
        document.querySelector('img')?.src ||
        ''
      if (img) thumbnail = img
    }

    // Fallback: scan for a large content image if meta yielded nothing
    if (!thumbnail) {
      const img = [...document.querySelectorAll('img')].find(i =>
        (i.naturalWidth || i.width || 0) > 200 &&
        !i.src.includes('icon') &&
        !i.src.includes('logo')
      )
      thumbnail = img?.currentSrc || img?.src || ''
    }

    if (thumbnail && thumbnail.startsWith('/')) {
      thumbnail = location.origin + thumbnail
    }

    send({
      url,
      title: cleanTitle || '',
      description: description || '',
      thumbnail: thumbnail || '',
      source,
      type,
      selectedText
    })
  }, delay)
})()
