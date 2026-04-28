import { normalizeItem } from './normalizeCapture'

export function captureItem(input = {}, existingItem = null) {
  const { captureMode, ...rest } = input

  return normalizeItem(
    {
      ...rest,
      origin: rest.origin || captureMode || 'manual',
      raw: input.raw ?? input,
    },
    existingItem
  )
}