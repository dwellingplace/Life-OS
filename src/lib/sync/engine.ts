import { getAuthenticatedSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { getBridgedUserId } from '@/lib/auth/bridge'
import {
  getPendingOutboxItems,
  markInFlight,
  markSynced,
  markFailed,
  cleanupSyncedItems,
} from './outbox'
import { db } from '@/lib/db'
import type { SyncOutbox } from '@/lib/db/schema'

/* ============================================================
   Sync Engine — Pushes local changes to Supabase and pulls
   remote changes with conflict resolution.

   Architecture:
     Local writes  -->  IndexedDB  -->  Outbox  -->  Supabase
     Supabase      -->  Pull cycle -->  IndexedDB (with conflict resolution)

   Conflict strategy:
     - LWW (Last-Writer-Wins) for most entities
     - Section-level merge for journalEntries
     - Tombstone propagation: deletions always win
   ============================================================ */

// ── Constants ──

const AUTO_SYNC_INTERVAL_MS = 30_000 // 30 seconds
const LAST_SYNC_KEY = 'lastSyncTimestamp'

/** Dexie table names that map 1:1 to Supabase tables. */
const SYNCABLE_TABLES = [
  'templates',
  'scheduleRules',
  'templateItems',
  'instances',
  'instanceEntries',
  'exerciseHistory',
  'tasks',
  'subtasks',
  'projects',
  'journalEntries',
  'attachments',
  'ocrTexts',
  'reminderItems',
  'charismaReminders',
  'departments',
  'departmentGoals',
  'weeklyFocus',
  'keyRhythms',
  'financeEntries',
  'tags',
  'taggables',
] as const

/** Journal section keys used for section-level merge. */
const JOURNAL_SECTIONS = ['prayer', 'leadership', 'gratitude', 'freeNotes'] as const

// ── Internal state ──

let syncStatus: 'idle' | 'syncing' | 'error' | 'offline' = 'idle'

// ── Helpers ──

function now(): string {
  return new Date().toISOString()
}

function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Get the authenticated user's Clerk ID from the auth bridge.
 * Returns null if not signed in.
 */
function getCurrentUserId(): string | null {
  return getBridgedUserId()
}

/**
 * Retrieve the last sync timestamp from appSettings.
 * Returns null if no sync has ever occurred.
 */
async function getLastSyncTimestamp(): Promise<string | null> {
  const settings = await db.appSettings.get('user-settings')
  if (!settings) return null

  const ts = (settings as unknown as Record<string, unknown>)[LAST_SYNC_KEY]
  return typeof ts === 'string' ? ts : null
}

/** Persist the last sync timestamp into appSettings. */
async function setLastSyncTimestamp(timestamp: string): Promise<void> {
  const settings = await db.appSettings.get('user-settings')
  if (settings) {
    await db.appSettings.update('user-settings', {
      [LAST_SYNC_KEY]: timestamp,
      updatedAt: now(),
    } as Record<string, unknown>)
  }
}

/**
 * Convert a camelCase Dexie table name to the snake_case Supabase
 * table name convention. e.g. "journalEntries" -> "journal_entries"
 */
function toSnakeCase(name: string): string {
  return name.replace(/[A-Z]/g, (ch) => '_' + ch.toLowerCase())
}

// ── Push: Process outbox ──

/**
 * Process all pending outbox items, pushing each to Supabase.
 * Items are processed sequentially in FIFO order.
 *
 * Returns counts of successfully synced and failed items.
 */
export async function processOutbox(): Promise<{ synced: number; failed: number }> {
  const items = await getPendingOutboxItems()
  let synced = 0
  let failed = 0

  for (const item of items) {
    try {
      await markInFlight(item.id)
      const success = await syncItem(item)

      if (success) {
        await markSynced(item.id)
        synced++
      } else {
        await markFailed(item.id)
        failed++
      }
    } catch {
      // Network or unexpected errors — mark failed and continue
      await markFailed(item.id)
      failed++
    }
  }

  return { synced, failed }
}

/**
 * Sync a single outbox item to Supabase.
 *
 * Uses the `clientEventId` for idempotency: the server-side RPC or
 * upsert logic can check for duplicate `clientEventId` values to
 * prevent re-applying the same change.
 *
 * Returns true on success, false on failure.
 */
async function syncItem(item: SyncOutbox): Promise<boolean> {
  const supabase = await getAuthenticatedSupabase()
  if (!supabase) return false
  const userId = getCurrentUserId()
  if (!userId) return false

  const tableName = toSnakeCase(item.entityType)

  // Attach user_id and client_event_id to the payload for RLS and idempotency
  const payload = {
    ...item.payload,
    user_id: userId,
    client_event_id: item.clientEventId,
  }

  switch (item.operation) {
    case 'insert': {
      const { error } = await supabase
        .from(tableName)
        .upsert(payload, { onConflict: 'id' })

      if (error) {
        console.error(`[sync] insert failed for ${tableName}/${item.entityId}:`, error.message)
        return false
      }
      return true
    }

    case 'update': {
      const { error } = await supabase
        .from(tableName)
        .upsert(payload, { onConflict: 'id' })

      if (error) {
        console.error(`[sync] update failed for ${tableName}/${item.entityId}:`, error.message)
        return false
      }
      return true
    }

    case 'delete': {
      // Soft-delete: set deletedAt on the remote row
      const { error } = await supabase
        .from(tableName)
        .update({
          deleted_at: item.payload.deletedAt ?? now(),
          updated_at: now(),
          user_id: userId,
        })
        .eq('id', item.entityId)
        .eq('user_id', userId)

      if (error) {
        console.error(`[sync] delete failed for ${tableName}/${item.entityId}:`, error.message)
        return false
      }
      return true
    }

    default:
      console.error(`[sync] unknown operation: ${item.operation}`)
      return false
  }
}

// ── Pull: Fetch remote changes ──

/**
 * Pull remote changes from Supabase that were modified since the last
 * sync timestamp. Applies conflict resolution before writing to IndexedDB.
 *
 * Returns the number of entities updated locally.
 */
export async function pullRemoteChanges(): Promise<number> {
  const supabase = await getAuthenticatedSupabase()
  if (!supabase) return 0
  const userId = getCurrentUserId()
  if (!userId) return 0

  const lastSync = await getLastSyncTimestamp()
  const pullTimestamp = now()
  let totalPulled = 0

  for (const table of SYNCABLE_TABLES) {
    try {
      const remoteTable = toSnakeCase(table)

      // Build query: all rows for this user modified after lastSync
      let query = supabase
        .from(remoteTable)
        .select('*')
        .eq('user_id', userId)

      if (lastSync) {
        query = query.gt('updated_at', lastSync)
      }

      const { data, error } = await query

      if (error) {
        console.error(`[sync] pull failed for ${remoteTable}:`, error.message)
        continue
      }

      if (!data || data.length === 0) continue

      // Separate tombstones from live updates
      const tombstones: Array<{ id: string; deletedAt: string }> = []
      const liveUpdates: Array<Record<string, unknown>> = []

      for (const row of data) {
        const remoteEntity = camelCaseKeys(row)
        if (remoteEntity.deletedAt) {
          tombstones.push({
            id: remoteEntity.id as string,
            deletedAt: remoteEntity.deletedAt as string,
          })
        } else {
          liveUpdates.push(remoteEntity)
        }
      }

      // Process tombstones first — deletions always win
      if (tombstones.length > 0) {
        await processTombstones(table, tombstones)
        totalPulled += tombstones.length
      }

      // Apply live updates with conflict resolution
      const dexieTable = db.table(table)

      for (const remoteEntity of liveUpdates) {
        const entityId = remoteEntity.id as string
        const localEntity = await dexieTable.get(entityId)

        if (!localEntity) {
          // New entity from remote — insert directly
          // Strip user_id and client_event_id (local schema doesn't have these)
          const cleaned = stripRemoteOnlyFields(remoteEntity)
          await dexieTable.add(cleaned)
          totalPulled++
        } else {
          // Both sides have the entity — resolve conflicts
          const resolved = resolveConflict(table, localEntity, remoteEntity)
          const cleaned = stripRemoteOnlyFields(resolved)
          await dexieTable.update(entityId, cleaned)
          totalPulled++
        }
      }
    } catch (err) {
      console.error(`[sync] pull error for ${table}:`, err)
      // Continue with remaining tables
    }
  }

  // Update the last sync timestamp
  await setLastSyncTimestamp(pullTimestamp)

  return totalPulled
}

// ── Conflict Resolution ──

/**
 * Resolve conflicts between a local entity and a remote entity.
 *
 * Strategy:
 * 1. Journal entries: section-level merge. Each section is compared
 *    independently. If only one side changed a section, that change wins.
 *    If both sides changed the same section, LWW applies to that section.
 * 2. All other entities: Last-Writer-Wins (LWW) based on `updatedAt`.
 *    The version with the newer timestamp is used in its entirety.
 */
function resolveConflict(
  entityType: string,
  localEntity: Record<string, unknown>,
  remoteEntity: Record<string, unknown>,
): Record<string, unknown> {
  // Tombstone check: if either side is deleted, deletion wins
  if (localEntity.deletedAt || remoteEntity.deletedAt) {
    const deletedAt = localEntity.deletedAt ?? remoteEntity.deletedAt
    return { ...localEntity, ...remoteEntity, deletedAt }
  }

  // Journal entries use section-level merge
  if (entityType === 'journalEntries') {
    return mergeJournalEntry(localEntity, remoteEntity)
  }

  // Default: Last-Writer-Wins
  const localTime = new Date(localEntity.updatedAt as string).getTime()
  const remoteTime = new Date(remoteEntity.updatedAt as string).getTime()

  if (remoteTime >= localTime) {
    return remoteEntity
  }

  return localEntity
}

/**
 * Merge two versions of a journal entry at the section level.
 *
 * For each section (prayer, leadership, gratitude, freeNotes):
 * - If only one side has a value, use that value.
 * - If both sides changed, use the version from the entity with the
 *   newer `updatedAt` (LWW at the section level).
 *
 * The merged result uses the newer `updatedAt` and recomputes `fullText`.
 */
function mergeJournalEntry(
  localEntity: Record<string, unknown>,
  remoteEntity: Record<string, unknown>,
): Record<string, unknown> {
  const localSections = (localEntity.sections ?? {}) as Record<string, string | undefined>
  const remoteSections = (remoteEntity.sections ?? {}) as Record<string, string | undefined>

  const localTime = new Date(localEntity.updatedAt as string).getTime()
  const remoteTime = new Date(remoteEntity.updatedAt as string).getTime()

  // Start with the newer entity as the base
  const base = remoteTime >= localTime ? remoteEntity : localEntity
  const mergedSections: Record<string, string | undefined> = {}

  for (const section of JOURNAL_SECTIONS) {
    const localVal = localSections[section]
    const remoteVal = remoteSections[section]

    const localHasValue = localVal !== undefined && localVal !== ''
    const remoteHasValue = remoteVal !== undefined && remoteVal !== ''

    if (localHasValue && !remoteHasValue) {
      // Only local has content for this section
      mergedSections[section] = localVal
    } else if (!localHasValue && remoteHasValue) {
      // Only remote has content for this section
      mergedSections[section] = remoteVal
    } else if (localHasValue && remoteHasValue) {
      // Both changed — LWW for this section
      mergedSections[section] = remoteTime >= localTime ? remoteVal : localVal
    } else {
      // Neither has a value
      mergedSections[section] = undefined
    }
  }

  // Rebuild fullText from merged sections
  const fullText = JOURNAL_SECTIONS
    .map((s) => mergedSections[s])
    .filter(Boolean)
    .join('\n\n')

  return {
    ...base,
    sections: mergedSections,
    fullText,
    updatedAt: new Date(Math.max(localTime, remoteTime)).toISOString(),
  }
}

// ── Tombstone Handling ──

/**
 * Process tombstone deletions from the remote.
 *
 * When a remote entity has `deletedAt` set, propagate the soft-delete
 * to the local IndexedDB copy. Deletions are permanent — once either
 * side deletes, the delete wins regardless of timestamps.
 */
async function processTombstones(
  entityType: string,
  tombstones: Array<{ id: string; deletedAt: string }>,
): Promise<void> {
  const dexieTable = db.table(entityType)

  for (const tombstone of tombstones) {
    const local = await dexieTable.get(tombstone.id)

    if (local) {
      // Propagate the soft-delete locally
      await dexieTable.update(tombstone.id, {
        deletedAt: tombstone.deletedAt,
        updatedAt: now(),
      })
    }
    // If the entity doesn't exist locally, no action needed —
    // the delete is already in effect.
  }
}

// ── Full Sync Cycle ──

/**
 * Execute a full sync cycle:
 * 1. Push all pending outbox items to Supabase
 * 2. Pull all remote changes since last sync
 * 3. Clean up old synced outbox items
 *
 * Returns summary counts.
 */
export async function fullSync(): Promise<{
  pushed: number
  pulled: number
  failed: number
}> {
  if (!isSupabaseConfigured()) {
    return { pushed: 0, pulled: 0, failed: 0 }
  }

  if (!isOnline()) {
    syncStatus = 'offline'
    return { pushed: 0, pulled: 0, failed: 0 }
  }

  const userId = getCurrentUserId()
  if (!userId) {
    return { pushed: 0, pulled: 0, failed: 0 }
  }

  syncStatus = 'syncing'

  try {
    // Phase 1: Push local changes
    const { synced: pushed, failed } = await processOutbox()

    // Phase 2: Pull remote changes
    const pulled = await pullRemoteChanges()

    // Phase 3: Housekeeping
    await cleanupSyncedItems()

    syncStatus = 'idle'
    return { pushed, pulled, failed }
  } catch (err) {
    console.error('[sync] full sync failed:', err)
    syncStatus = 'error'
    return { pushed: 0, pulled: 0, failed: 0 }
  }
}

// ── Auto-Sync ──

/**
 * Start the auto-sync loop. Runs `fullSync()` every 30 seconds
 * while the browser is online.
 *
 * Also listens for `online`/`offline` events to update sync status
 * and trigger an immediate sync when connectivity is restored.
 *
 * Returns a cleanup function that stops the loop and removes listeners.
 */
export function startAutoSync(): () => void {
  let intervalId: ReturnType<typeof setInterval> | null = null
  let stopped = false

  const runSync = async () => {
    if (stopped) return
    if (!isOnline()) {
      syncStatus = 'offline'
      return
    }
    await fullSync()
  }

  // Start the periodic sync
  intervalId = setInterval(runSync, AUTO_SYNC_INTERVAL_MS)

  // Run an initial sync immediately
  void runSync()

  // Listen for connectivity changes
  const handleOnline = () => {
    syncStatus = 'idle'
    void runSync()
  }

  const handleOffline = () => {
    syncStatus = 'offline'
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  // Return cleanup function
  return () => {
    stopped = true
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

// ── Status ──

/**
 * Get the current sync status.
 *
 * - 'idle': No sync in progress, ready for next cycle
 * - 'syncing': A sync cycle is currently running
 * - 'error': The last sync cycle encountered errors
 * - 'offline': The browser is offline
 */
export async function getSyncStatus(): Promise<'idle' | 'syncing' | 'error' | 'offline'> {
  if (!isOnline()) return 'offline'
  return syncStatus
}

// ── Utility: Key Conversion ──

/**
 * Convert snake_case keys from Supabase rows to camelCase for Dexie.
 * e.g. "created_at" -> "createdAt", "user_id" -> "userId"
 */
function camelCaseKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
    result[camelKey] = obj[key]
  }
  return result
}

/**
 * Strip fields that exist on the remote but not in the local Dexie schema
 * (e.g. `userId`, `clientEventId`).
 */
function stripRemoteOnlyFields(entity: Record<string, unknown>): Record<string, unknown> {
  const { userId, clientEventId, ...rest } = entity
  return rest
}
