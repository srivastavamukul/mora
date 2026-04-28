function normalizeUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return null;

  try {
    const u = new URL(urlStr);

    // remove hash
    u.hash = '';

    // remove tracking params
    for (const key of [...u.searchParams.keys()]) {
      if (
        key.startsWith('utm_') ||
        ['si', 'feature', 'igshid'].includes(key)
      ) {
        u.searchParams.delete(key);
      }
    }

    // normalize path (remove trailing slash)
    u.pathname = u.pathname.replace(/\/+$/, '') || '/';

    // sort params
    u.searchParams.sort();

    return u.toString().toLowerCase();
  } catch {
    return null;
  }
}

function getPlatformId(item) {
  if (!item || !item.url) return null;

  try {
    const u = new URL(item.url);

    // YouTube
    if (item.source === 'youtube') {
      return (
        u.searchParams.get('v') ||
        u.pathname.split('/').pop()
      );
    }

    // Instagram
    if (item.source === 'instagram') {
      const match = u.pathname.match(/\/(p|reel|tv)\/([^/]+)/);
      return match ? match[2] : null;
    }

    // Pinterest
    if (item.source === 'pinterest') {
      const match = u.pathname.match(/\/pin\/(\d+)/);
      return match ? match[1] : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function deduplicateCapture(existingItems, candidateItem) {
  if (!Array.isArray(existingItems) || !candidateItem) {
    return { isDuplicate: false, reason: null };
  }

  const candidateExternalId = candidateItem.externalId;
  const candidateUrl = normalizeUrl(candidateItem.url);
  const candidatePlatformId = getPlatformId(candidateItem);

  for (const item of existingItems) {

    // 1. externalId (strongest)
    if (candidateExternalId && item.externalId === candidateExternalId) {
      return { isDuplicate: true, reason: 'externalId' };
    }

    // 2. platformId (VERY important)
    const existingPlatformId = getPlatformId(item);
    if (candidatePlatformId && existingPlatformId === candidatePlatformId) {
      return { isDuplicate: true, reason: 'platformId' };
    }

    // 3. normalized URL
    if (candidateUrl && normalizeUrl(item.url) === candidateUrl) {
      return { isDuplicate: true, reason: 'url' };
    }
  }

  return { isDuplicate: false, reason: null };
}