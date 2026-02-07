'use client'

import { useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { RpgEncounter, RpgBattleTurn, BattleAction } from '@/lib/db/schema'
import {
  startEncounter,
  executeBattleTurn,
  getBattleTurns,
} from '@/lib/rpg/repository'
import { useAuth } from './useAuth'

export function useRpgBattle(encounterId: string | null) {
  const { userId } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<{
    victory: boolean
    defeat: boolean
    turn: RpgBattleTurn
  } | null>(null)

  const encounter = useLiveQuery(
    async () => {
      if (!encounterId) return null
      return db.rpgEncounters.get(encounterId) ?? null
    },
    [encounterId],
    null as RpgEncounter | null,
  )

  const turns = useLiveQuery(
    async () => {
      if (!encounterId) return []
      return getBattleTurns(encounterId)
    },
    [encounterId],
    [] as RpgBattleTurn[],
  )

  const handleStart = useCallback(async () => {
    if (!encounterId) return null
    return startEncounter(encounterId)
  }, [encounterId])

  const handleAction = useCallback(
    async (action: BattleAction) => {
      if (!encounterId || !userId || isProcessing) return null
      setIsProcessing(true)
      try {
        const result = await executeBattleTurn(encounterId, action, userId)
        if (result) {
          setLastResult({
            victory: result.victory,
            defeat: result.defeat,
            turn: result.turn,
          })
        }
        return result
      } finally {
        setIsProcessing(false)
      }
    },
    [encounterId, userId, isProcessing],
  )

  return {
    encounter,
    turns,
    isProcessing,
    lastResult,
    start: handleStart,
    executeAction: handleAction,
  }
}
