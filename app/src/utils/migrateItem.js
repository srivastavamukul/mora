/**
 * Schema migration utility
 * Ensures old items are compatible with the latest schema
 */

const CURRENT_SCHEMA_VERSION = 2

export function migrateItem(item) {
  if (!item || typeof item !== 'object') return null

  const migrated = { ...item }

  if (!migrated.url || typeof migrated.url !== 'string') {
    if (migrated.type !== 'journal') return null
    migrated.url = null
  } else {
    migrated.url = migrated.url.trim()
  }
  if (!migrated.title) migrated.title = 'Untitled'
  if (!migrated.thumbnail) migrated.thumbnail = ''
  if (!migrated.description) migrated.description = ''
  if (!migrated.metadata || typeof migrated.metadata !== 'object') migrated.metadata = {}
  if (!migrated.raw || typeof migrated.raw !== 'object') migrated.raw = {}
  if (!Array.isArray(migrated.tags)) migrated.tags = []
  else migrated.tags = migrated.tags.filter(t => typeof t === 'string' && t.length > 0)
  if (migrated.mood === undefined) migrated.mood = null
  if (migrated.externalId === undefined) migrated.externalId = null
  if (migrated.body === undefined) migrated.body = ''
  if (migrated.memoryDate === undefined) migrated.memoryDate = null
  if (migrated.memoryType === undefined) migrated.memoryType = null
  if (migrated.privateNote === undefined) migrated.privateNote = null
  if (migrated.collection === undefined) migrated.collection = null

  // filterKey → type (if type is missing)
  if (!migrated.type && migrated.filterKey) migrated.type = migrated.filterKey
  if (!migrated.type) migrated.type = 'link'
  if (!migrated.source) migrated.source = 'web'

  const oldMetadata = migrated.metadata
  migrated.metadata = {
    thumbnail: oldMetadata?.thumbnail || migrated.thumbnail || '',
    description: oldMetadata?.description || migrated.description || '',
    source: oldMetadata?.source || migrated.source || 'web',
    type: oldMetadata?.type || migrated.type || 'link',
    platform: oldMetadata?.platform || null,
    hostname: oldMetadata?.hostname || null,
    canonicalUrl: oldMetadata?.canonicalUrl || null,
    origin: oldMetadata?.origin || oldMetadata?.captureMode || 'manual',
    capturedAt: oldMetadata?.capturedAt || migrated.createdAt,
  }

  if (!migrated.createdAt || typeof migrated.createdAt !== 'number' || !isFinite(migrated.createdAt)) {
    migrated.createdAt = Date.now()
  }
  if (migrated.updatedAt === undefined || (typeof migrated.updatedAt !== 'number' && migrated.updatedAt !== null) || (typeof migrated.updatedAt === 'number' && !isFinite(migrated.updatedAt))) {
    migrated.updatedAt = null
  }

  migrated.schemaVersion = CURRENT_SCHEMA_VERSION

  return migrated
}
