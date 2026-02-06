'use client'

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { InstanceEntry } from '@/lib/db/schema'

/**
 * Returns a map of completed template item IDs for a given instance.
 * Used by checklist cards (mobility, supplements) to show checked state.
 */
export function useInstanceEntries(instanceIds: string[]): Record<string, Set<string>> {
  const entries = useLiveQuery(
    async (): Promise<InstanceEntry[]> => {
      if (instanceIds.length === 0) return []
      const results: InstanceEntry[] = []
      for (const id of instanceIds) {
        const items = await db.instanceEntries
          .where('instanceId')
          .equals(id)
          .filter(e => !e.deletedAt)
          .toArray()
        results.push(...items)
      }
      return results
    },
    [instanceIds.join(',')],
    [] as InstanceEntry[]
  )

  return useMemo(() => {
    const map: Record<string, Set<string>> = {}
    for (const entry of entries) {
      if (!map[entry.instanceId]) {
        map[entry.instanceId] = new Set()
      }
      if (entry.templateItemId && (entry.data as Record<string, unknown>).completed) {
        map[entry.instanceId].add(entry.templateItemId)
      }
    }
    return map
  }, [entries])
}
