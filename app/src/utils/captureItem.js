import { normalizeItem } from './normalizeCapture'

export function captureItem(input = {}, existingItem = null) {
  const { captureMode, ...rest } = input

  return normalizeItem(
    {
      ...rest,
      origin: captureMode || rest.origin || 'manual',
      raw: input.raw ?? input,
    },
    existingItem
  )
}