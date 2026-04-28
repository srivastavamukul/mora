function normalizeUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return null;
  try {
    const u = new URL(urlStr);
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) {
      if (key.startsWith('utm_')) u.searchParams.delete(key);
    }
    u.searchParams.sort();
    u.pathname = u.pathname.replace(/\/+$/, '') || '/';
    return u.toString().toLowerCase();
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

  if (candidateExternalId) {
    for (const item of existingItems) {
      if (item.externalId && item.externalId === candidateExternalId) {
        return { isDuplicate: true, reason: 'externalId' };
      }
    }
  }

  if (candidateUrl) {
    for (const item of existingItems) {
      if (normalizeUrl(item.url) === candidateUrl) {
        return { isDuplicate: true, reason: 'url' };
      }
    }
  }

  return { isDuplicate: false, reason: null };
}
