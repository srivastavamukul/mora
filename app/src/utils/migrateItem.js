/**
 * Schema migration utility
 * Ensures old items are compatible with the latest schema
 */

const CURRENT_SCHEMA_VERSION = 1

export function migrateItem(item) {
  if (!item || typeof item !== 'object') return null

  // Create new object without mutation
  const migrated = { ...item }

  // Ensure required fields exist with proper defaults
  if (migrated.url === undefined) migrated.url = null
  if (!migrated.metadata || typeof migrated.metadata !== 'object') migrated.metadata = {}
  if (!migrated.raw || typeof migrated.raw !== 'object') migrated.raw = {}
  if (!Array.isArray(migrated.tags)) migrated.tags = []
  if (migrated.mood === undefined) migrated.mood = null
  if (migrated.externalId === undefined) migrated.externalId = null
  if (migrated.body === undefined) migrated.body = ''

  // Standardize metadata structure
  const oldMetadata = migrated.metadata
  migrated.metadata = {
    thumbnail: oldMetadata?.thumbnail || null,
    platform: oldMetadata?.platform || null,
    hostname: oldMetadata?.hostname || null,
    canonicalUrl: oldMetadata?.canonicalUrl || null,
    origin: oldMetadata?.origin || oldMetadata?.captureMode || 'manual',
    capturedAt: oldMetadata?.capturedAt || migrated.createdAt,
  }

  // Handle missing timestamps
  if (!migrated.createdAt || typeof migrated.createdAt !== 'number') {
    migrated.createdAt = Date.now()
  }
  if (migrated.updatedAt === undefined || (typeof migrated.updatedAt !== 'number' && migrated.updatedAt !== null)) {
    migrated.updatedAt = null
  }

  // Map legacy fields
  // filterKey → type (if type is missing)
  if (!migrated.type && migrated.filterKey) {
    migrated.type = migrated.filterKey
  }
  if (!migrated.type) {
    migrated.type = 'link'
  }

  // Ensure source has fallback
  if (!migrated.source) {
    migrated.source = 'web'
  }

  // Add schemaVersion if missing
  if (!migrated.schemaVersion) {
    migrated.schemaVersion = CURRENT_SCHEMA_VERSION
  }

  return migrated
}
