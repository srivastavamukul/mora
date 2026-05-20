import { normalizeItem } from './normalizeCapture'

function validateItem(item) {
  if (!item || typeof item !== 'object') return null;

  const hasUrl = item.url && typeof item.url === 'string'

  return {
    ...item,

    // Required fallbacks
    title: item.title?.trim() || 'Untitled',
    thumbnail: item.thumbnail || '',
    description: item.description || '',

    // Normalize enums
    source: item.source || 'web',
    type: item.type || 'link',

    // Safety
    url: hasUrl ? item.url.trim() : null,
  };
}

export function captureItem(input = {}, existingItem = null, seenTitles = new Set()) {
  const { captureMode, ...rest } = input

  // Reject at raw input level — nothing to save without a URL or explicit title
  if (!rest.url?.trim() && !rest.title?.trim()) return null

  return validateItem(normalizeItem(
    {
      ...rest,
      origin: rest.origin || captureMode || 'manual',
      raw: input.raw ?? input,
    },
    existingItem,
    seenTitles
  ));
}
