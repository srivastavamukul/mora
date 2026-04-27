const BADGE = {
  song: 'SONG CLIP',
  insight: 'INSIGHT',
  image: 'PINNED IMAGE',
  note: 'NOTE',
  activity: 'ACTIVITY',
}

const BADGE_COLOR = {
  song: 'text-primary',
  insight: 'text-secondary',
  image: 'text-tertiary',
  note: 'text-on-surface',
  activity: 'text-primary',
}

const COL_SPAN = {
  song: 'md:col-span-8',
  insight: 'md:col-span-4',
  image: 'md:col-span-5',
  note: 'md:col-span-3',
  activity: 'md:col-span-4',
}

const TILT = {
  insight: 'rotate-1 hover:rotate-0',
  image: '-rotate-1 hover:rotate-0',
}

export function mapItemToUI(item) {
  const type = item.type || item.filterKey || 'link'
  return {
    badge: BADGE[type] ?? (item.source ? item.source.toUpperCase() : 'SAVED'),
    badgeColor: BADGE_COLOR[type] ?? 'text-on-surface-variant',
    colSpanClass: COL_SPAN[type] ?? 'md:col-span-4',
    tiltClass: TILT[type] ?? '',
  }
}
