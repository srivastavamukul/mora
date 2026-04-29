import { normalizeItem } from './normalizeCapture'

function validateItem(item) {
  if (!item || typeof item !== 'object') return null;

  // MUST HAVE
  if (!item.url || typeof item.url !== 'string') return null;

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
    url: item.url.trim(),
  };
}

export function captureItem(input = {}, existingItem = null) {
  const { captureMode, ...rest } = input

  return validateItem(normalizeItem(
    {
      ...rest,
      origin: rest.origin || captureMode || 'manual',
      raw: input.raw ?? input,
    },
    existingItem
  ));
}