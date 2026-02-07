'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect } from 'react'
import { db } from '@/lib/db'
import type { StatAbbr, RpgQuest, RpgEncounter, RpgLogEntry, RpgTruth, RpgPerkUnlock, SkillTreeId } from '@/lib/db/schema'
import {
  getCharacter,
  initializeCharacter,
  getStatLevels,
  getStatLevelNumbers,
  getTodayQuests,
  getWeeklyQuests,
  getPendingEncounters,
  getRecentLog,
  getEquippedTruths,
  getTruths,
  getPerkPoints,
  getUnlockedPerks,
  getActiveQuestlines,
  generateDailyQuests,
  generateWeeklyQuests,
  grantXp,
  progressQuest,
  spawnEncounter,
  unlockPerk,
  collectTruth,
  toggleTruthEquip,
} from '@/lib/rpg/repository'
import {
  levelFromXp,
  statLevelFromXp,
  computeSecondaryStats,
  ALL_STATS,
  STAT_COLORS,
  STAT_NAMES,
  type SecondaryStats,
} from '@/lib/rpg/engine'
import { useAuth } from './useAuth'

export function useRpg() {
  const { userId } = useAuth()

  // Initialize character and quests when userId is available
  useEffect(() => {
    if (!userId) return
    initializeCharacter(userId).then(() => {
      generateDailyQuests(userId)
      generateWeeklyQuests(userId)
    })
  }, [userId])

  const character = useLiveQuery(
    () => db.rpgCharacters.get('current'),
    [],
    undefined,
  )

  const statLevels = useLiveQuery(
    async () => {
      if (!userId) return null
      return getStatLevels(userId)
    },
    [userId],
    null,
  )

  const statNumbers = useLiveQuery(
    async () => {
      if (!userId) return null
      return getStatLevelNumbers(userId)
    },
    [userId],
    null,
  )

  const secondaryStats: SecondaryStats | null = statNumbers
    ? computeSecondaryStats(statNumbers)
    : null

  const levelInfo = character
    ? levelFromXp(character.totalXp)
    : { level: 1, currentLevelXp: 0, nextLevelXp: 100 }

  const dailyQuests = useLiveQuery(
    async () => {
      if (!userId) return []
      return getTodayQuests(userId)
    },
    [userId],
    [] as RpgQuest[],
  )

  const weeklyQuests = useLiveQuery(
    async () => {
      if (!userId) return []
      return getWeeklyQuests(userId)
    },
    [userId],
    [] as RpgQuest[],
  )

  const encounters = useLiveQuery(
    async () => {
      if (!userId) return []
      return getPendingEncounters(userId)
    },
    [userId],
    [] as RpgEncounter[],
  )

  const logEntries = useLiveQuery(
    async () => {
      if (!userId) return []
      return getRecentLog(userId, 30)
    },
    [userId],
    [] as RpgLogEntry[],
  )

  const equippedTruths = useLiveQuery(
    async () => {
      if (!userId) return []
      return getEquippedTruths(userId)
    },
    [userId],
    [] as RpgTruth[],
  )

  const allTruths = useLiveQuery(
    async () => {
      if (!userId) return []
      return getTruths(userId)
    },
    [userId],
    [] as RpgTruth[],
  )

  const perkPoints = useLiveQuery(
    async () => {
      if (!userId) return null
      return getPerkPoints(userId)
    },
    [userId],
    null,
  )

  const unlockedPerks = useLiveQuery(
    async () => {
      if (!userId) return []
      return getUnlockedPerks(userId)
    },
    [userId],
    [] as RpgPerkUnlock[],
  )

  const questlines = useLiveQuery(
    async () => {
      if (!userId) return []
      return getActiveQuestlines(userId)
    },
    [userId],
    [],
  )

  const handleGrantXp = useCallback(
    async (
      sourceModule: string,
      sourceAction: string,
      sourceItemId: string,
      primaryStat: StatAbbr,
      primaryXp: number,
      secondaryStat?: StatAbbr,
      secondaryXp?: number,
    ) => {
      if (!userId) return null
      const result = await grantXp(userId, sourceModule, sourceAction, sourceItemId, primaryStat, primaryXp, secondaryStat, secondaryXp)
      // Progress quests
      await progressQuest(userId, sourceModule, sourceAction)
      return result
    },
    [userId],
  )

  const handleSpawnEncounter = useCallback(
    async (enemyId: string, sourceAction: string) => {
      if (!userId) return null
      return spawnEncounter(userId, enemyId, sourceAction)
    },
    [userId],
  )

  const handleUnlockPerk = useCallback(
    async (treeId: SkillTreeId, perkNumber: number) => {
      if (!userId) return false
      return unlockPerk(userId, treeId, perkNumber)
    },
    [userId],
  )

  const handleCollectTruth = useCallback(
    async (text: string, sourceEntryId: string, theme: RpgTruth['theme']) => {
      if (!userId) return null
      return collectTruth(userId, text, sourceEntryId, theme)
    },
    [userId],
  )

  const handleToggleTruth = useCallback(
    async (truthId: string, equip: boolean) => {
      return toggleTruthEquip(truthId, equip)
    },
    [],
  )

  const completedDailyCount = dailyQuests.filter((q) => q.status === 'completed').length
  const totalDailyCount = dailyQuests.length

  return {
    // Character
    character,
    levelInfo,
    statLevels,
    statNumbers,
    secondaryStats,

    // Quests
    dailyQuests,
    weeklyQuests,
    questlines,
    completedDailyCount,
    totalDailyCount,

    // Encounters
    encounters,

    // Truths
    equippedTruths,
    allTruths,

    // Perks
    perkPoints,
    unlockedPerks,

    // Log
    logEntries,

    // Actions
    grantXp: handleGrantXp,
    spawnEncounter: handleSpawnEncounter,
    unlockPerk: handleUnlockPerk,
    collectTruth: handleCollectTruth,
    toggleTruth: handleToggleTruth,

    // Constants
    STAT_COLORS,
    STAT_NAMES,
    ALL_STATS,
  }
}
