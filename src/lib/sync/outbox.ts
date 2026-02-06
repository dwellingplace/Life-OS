import { db } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import type { SyncOutbox, SyncStatus } from '@/lib/db/schema'

/* ============================================================
   Sync Outbox — Queues local changes for background sync
   to Supabase. All writes go to IndexedDB first, then get
   pushed to the server via the sync engine.
   ============================================================ */

// ── Helpers ──

function now(): string {
  return new Date().toISOString()
}

/** Maximum retry attempts before an item is considered permanently failed. */
const MAX_RETRIES = 5

/** Synced items older than this (ms) are eligible for cleanup. */
const CLEANUP_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// ── Queue a change ──

/**
 * Queue a local change for sync to Supabase.
 *
 * Each queued item receives a unique `clientEventId` (UUID v4) which
 * the server uses for idempotency — if an event with the same
 * `clientEventId` was already processed, the server skips it.
 */
export async function queueChange(
  entityType: string,
  entityId: string,
  operation: 'insert' | 'update' | 'delete',
  payload: Record<string, unknown>,
): Promise<void> {
  const timestamp = now()

  const item: SyncOutbox = {
    id: uuid(),
    clientEventId: uuid(),
    entityType,
    entityId,
    operation,
    payload,
    status: 'pending',
    retryCount: 0,
    createdAt: timestamp,
  }

  await db.syncOutbox.add(item)
}

// ── Query pending items ──

/**
 * Retrieve all outbox items eligible for sync:
 * - status = 'pending', OR
 * - status = 'failed' with retryCount < MAX_RETRIES
 *
 * Results are ordered by `createdAt` ascending so older changes
 * are processed first (FIFO).
 */
export async function getPendingOutboxItems(): Promise<SyncOutbox[]> {
  const items = await db.syncOutbox
    .where('status')
    .anyOf('pending', 'failed')
    .filter((item) => {
      if (item.status === 'failed') {
        return item.retryCount < MAX_RETRIES
      }
      return true
    })
    .toArray()

  return items.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

// ── Status transitions ──

/**
 * Mark an outbox item as in-flight (currently being synced).
 * Prevents the same item from being picked up by a concurrent sync cycle.
 */
export async function markInFlight(id: string): Promise<void> {
  await db.syncOutbox.update(id, {
    status: 'in-flight' as SyncStatus,
  })
}

/**
 * Mark an outbox item as successfully synced.
 * Records the sync timestamp for cleanup tracking.
 */
export async function markSynced(id: string): Promise<void> {
  await db.syncOutbox.update(id, {
    status: 'synced' as SyncStatus,
    syncedAt: now(),
  })
}

/**
 * Mark an outbox item as failed and increment its retry counter.
 * Items that exceed MAX_RETRIES will no longer be picked up by
 * `getPendingOutboxItems`.
 */
export async function markFailed(id: string): Promise<void> {
  const item = await db.syncOutbox.get(id)
  if (!item) return

  await db.syncOutbox.update(id, {
    status: 'failed' as SyncStatus,
    retryCount: item.retryCount + 1,
  })
}

// ── Cleanup ──

/**
 * Remove synced outbox items that are older than 7 days.
 * Returns the number of items deleted.
 *
 * This should be called periodically (e.g. after each full sync)
 * to prevent the outbox table from growing unboundedly.
 */
export async function cleanupSyncedItems(): Promise<number> {
  const cutoff = new Date(Date.now() - CLEANUP_AGE_MS).toISOString()

  const staleItems = await db.syncOutbox
    .where('status')
    .equals('synced')
    .filter((item) => !!item.syncedAt && item.syncedAt < cutoff)
    .toArray()

  if (staleItems.length === 0) return 0

  await db.syncOutbox.bulkDelete(staleItems.map((item) => item.id))
  return staleItems.length
}

// ── Stats ──

/**
 * Return a breakdown of outbox items by status.
 * Useful for sync status indicators in the UI.
 */
export async function getOutboxStats(): Promise<{
  pending: number
  inFlight: number
  failed: number
  synced: number
}> {
  const all = await db.syncOutbox.toArray()

  const stats = { pending: 0, inFlight: 0, failed: 0, synced: 0 }

  for (const item of all) {
    switch (item.status) {
      case 'pending':
        stats.pending++
        break
      case 'in-flight':
        stats.inFlight++
        break
      case 'failed':
        stats.failed++
        break
      case 'synced':
        stats.synced++
        break
    }
  }

  return stats
}
