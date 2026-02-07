/* ============================================================
   LIFE OS — RPG Repository
   Data access layer for all RPG entities.
   ============================================================ */

import { db } from '@/lib/db'
import type {
  RpgCharacter,
  RpgStatLevel,
  RpgXpEvent,
  RpgQuest,
  RpgQuestline,
  RpgEncounter,
  RpgBattleTurn,
  RpgTruth,
  RpgPerkUnlock,
  RpgPerkPoints,
  RpgAchievement,
  RpgCosmeticItem,
  RpgLogEntry,
  StatAbbr,
  BattleAction,
  SkillTreeId,
} from '@/lib/db/schema'
import {
  levelFromXp,
  statLevelFromXp,
  computeSecondaryStats,
  dominantStat,
  STAT_COLORS,
  ALL_STATS,
  scaleEnemy,
  getEnemyById,
  playerAttackDamage,
  enemyAttackDamage,
  getEnemyMove,
  DAILY_QUEST_TEMPLATES,
  WEEKLY_QUEST_TEMPLATES,
  type EnemyDefinition,
} from './engine'
import { v4 as uuid } from 'uuid'

function now(): string {
  return new Date().toISOString()
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Character ──

export async function getCharacter(): Promise<RpgCharacter | undefined> {
  return db.rpgCharacters.get('current')
}

export async function initializeCharacter(userId: string): Promise<RpgCharacter> {
  const existing = await db.rpgCharacters.get('current')
  if (existing) return existing

  const timestamp = now()
  const character: RpgCharacter = {
    id: 'current',
    userId,
    level: 1,
    totalXp: 0,
    prestigeCount: 0,
    prestigeXpBonus: 0,
    title: 'Novice',
    gear: [],
    auraColor: STAT_COLORS.DIS,
    equippedTruths: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    clientEventId: uuid(),
  }

  await db.rpgCharacters.put(character)

  // Initialize all stat levels
  for (const stat of ALL_STATS) {
    const statLevel: RpgStatLevel = {
      id: `${userId}_${stat}`,
      userId,
      stat,
      level: 1,
      currentXp: 0,
      totalXp: 0,
      updatedAt: timestamp,
      clientEventId: uuid(),
    }
    await db.rpgStatLevels.put(statLevel)
  }

  // Initialize perk points
  await db.rpgPerkPoints.put({
    id: `${userId}_perkpoints`,
    userId,
    available: 0,
    totalEarned: 0,
    updatedAt: timestamp,
    clientEventId: uuid(),
  })

  return character
}

// ── Stats ──

export async function getStatLevels(userId: string): Promise<Record<StatAbbr, RpgStatLevel>> {
  const levels = await db.rpgStatLevels.where('userId').equals(userId).toArray()
  const result = {} as Record<StatAbbr, RpgStatLevel>
  for (const sl of levels) {
    result[sl.stat] = sl
  }
  return result
}

export async function getStatLevelNumbers(userId: string): Promise<Record<StatAbbr, number>> {
  const levels = await getStatLevels(userId)
  const result = {} as Record<StatAbbr, number>
  for (const stat of ALL_STATS) {
    result[stat] = levels[stat]?.level ?? 1
  }
  return result
}

// ── XP Granting ──

export async function grantXp(
  userId: string,
  sourceModule: string,
  sourceAction: string,
  sourceItemId: string,
  primaryStat: StatAbbr,
  primaryXp: number,
  secondaryStat?: StatAbbr,
  secondaryXp?: number,
  bonusXp?: number,
  bonusSource?: string,
): Promise<{
  leveledUp: boolean
  newLevel: number
  statLevelUps: Array<{ stat: StatAbbr; oldLevel: number; newLevel: number }>
  perkPointEarned: boolean
}> {
  const timestamp = now()
  const clientEventId = uuid()

  // Check for duplicate event
  const existing = await db.rpgXpEvents
    .where('sourceItemId')
    .equals(sourceItemId)
    .filter((e) => e.sourceModule === sourceModule && e.sourceAction === sourceAction)
    .first()
  if (existing) {
    const char = await getCharacter()
    return { leveledUp: false, newLevel: char?.level ?? 1, statLevelUps: [], perkPointEarned: false }
  }

  // Create XP event
  const event: RpgXpEvent = {
    id: uuid(),
    userId,
    clientEventId,
    sourceModule,
    sourceAction,
    sourceItemId,
    primaryStat,
    primaryXp,
    secondaryStat,
    secondaryXp,
    bonusXp,
    bonusSource,
    timestamp,
  }
  await db.rpgXpEvents.add(event)

  const statLevelUps: Array<{ stat: StatAbbr; oldLevel: number; newLevel: number }> = []

  // Update primary stat
  const pUp = await addStatXp(userId, primaryStat, primaryXp + (bonusXp ?? 0), timestamp)
  if (pUp) statLevelUps.push(pUp)

  // Update secondary stat
  if (secondaryStat && secondaryXp && secondaryXp > 0) {
    const sUp = await addStatXp(userId, secondaryStat, secondaryXp, timestamp)
    if (sUp) statLevelUps.push(sUp)
  }

  // Update character total XP and level
  const totalXpAdded = primaryXp + (bonusXp ?? 0) + (secondaryXp ?? 0)
  const character = await db.rpgCharacters.get('current')
  if (!character) {
    return { leveledUp: false, newLevel: 1, statLevelUps, perkPointEarned: false }
  }

  const oldLevel = character.level
  const newTotalXp = character.totalXp + totalXpAdded
  const { level: newLevel } = levelFromXp(newTotalXp)
  const leveledUp = newLevel > oldLevel

  // Update aura color based on new dominant stat
  const statNums = await getStatLevelNumbers(userId)
  const newAura = STAT_COLORS[dominantStat(statNums)]

  await db.rpgCharacters.update('current', {
    totalXp: newTotalXp,
    level: newLevel,
    auraColor: newAura,
    updatedAt: timestamp,
    clientEventId: uuid(),
  })

  // Award perk point on level up
  let perkPointEarned = false
  if (leveledUp) {
    const pp = await db.rpgPerkPoints.where('userId').equals(userId).first()
    if (pp) {
      await db.rpgPerkPoints.update(pp.id, {
        available: pp.available + 1,
        totalEarned: pp.totalEarned + 1,
        updatedAt: timestamp,
        clientEventId: uuid(),
      })
      perkPointEarned = true
    }

    // Log entry
    await addLogEntry(userId, 'level_up', `Level ${newLevel}!`, `You reached level ${newLevel}`, { oldLevel, newLevel })
  }

  // Log stat level ups
  for (const su of statLevelUps) {
    await addLogEntry(userId, 'stat_up', `${su.stat} ${su.oldLevel} → ${su.newLevel}`, `${su.stat} leveled up!`, su)
  }

  return { leveledUp, newLevel, statLevelUps, perkPointEarned }
}

async function addStatXp(
  userId: string,
  stat: StatAbbr,
  xp: number,
  timestamp: string,
): Promise<{ stat: StatAbbr; oldLevel: number; newLevel: number } | null> {
  const id = `${userId}_${stat}`
  const statLevel = await db.rpgStatLevels.get(id)
  if (!statLevel) return null

  const oldLevel = statLevel.level
  const newTotalXp = statLevel.totalXp + xp
  const { level: newLevel, currentXp } = statLevelFromXp(newTotalXp)

  await db.rpgStatLevels.update(id, {
    level: newLevel,
    currentXp,
    totalXp: newTotalXp,
    updatedAt: timestamp,
    clientEventId: uuid(),
  })

  if (newLevel > oldLevel) {
    return { stat, oldLevel, newLevel }
  }
  return null
}

// ── Quests ──

export async function getActiveQuests(userId: string): Promise<RpgQuest[]> {
  return db.rpgQuests
    .where('userId')
    .equals(userId)
    .filter((q) => q.status === 'active')
    .toArray()
}

export async function getTodayQuests(userId: string): Promise<RpgQuest[]> {
  const todayStr = today()
  return db.rpgQuests
    .where('userId')
    .equals(userId)
    .filter((q) => q.type === 'daily' && q.createdAt.startsWith(todayStr))
    .toArray()
}

export async function getWeeklyQuests(userId: string): Promise<RpgQuest[]> {
  return db.rpgQuests
    .where('userId')
    .equals(userId)
    .filter((q) => q.type === 'weekly' && q.status === 'active')
    .toArray()
}

export async function generateDailyQuests(userId: string): Promise<void> {
  const todayStr = today()
  const timestamp = now()

  // Check if we already generated quests for today
  const existing = await db.rpgQuests
    .where('userId')
    .equals(userId)
    .filter((q) => q.type === 'daily' && q.createdAt.startsWith(todayStr))
    .count()

  if (existing > 0) return

  // Expire yesterday's daily quests
  const oldDailies = await db.rpgQuests
    .where('userId')
    .equals(userId)
    .filter((q) => q.type === 'daily' && q.status === 'active' && !q.createdAt.startsWith(todayStr))
    .toArray()

  for (const q of oldDailies) {
    await db.rpgQuests.update(q.id, { status: 'expired' })
  }

  // Generate new quests from templates
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  for (const template of DAILY_QUEST_TEMPLATES) {
    const quest: RpgQuest = {
      id: uuid(),
      userId,
      type: 'daily',
      name: template.name,
      description: template.description,
      targetModule: template.targetModule,
      targetAction: template.targetAction,
      targetCount: template.targetCount,
      currentCount: 0,
      xpReward: template.xpReward,
      status: 'active',
      createdAt: timestamp,
      expiresAt: endOfDay.toISOString(),
      clientEventId: uuid(),
    }
    await db.rpgQuests.add(quest)
  }
}

export async function generateWeeklyQuests(userId: string): Promise<void> {
  const timestamp = now()
  const currentDay = new Date().getDay()

  // Only generate on Monday (1) or if none exist
  const existing = await db.rpgQuests
    .where('userId')
    .equals(userId)
    .filter((q) => q.type === 'weekly' && q.status === 'active')
    .count()

  if (existing > 0 && currentDay !== 1) return
  if (existing > 0) return

  // Expire old weeklies
  const oldWeeklies = await db.rpgQuests
    .where('userId')
    .equals(userId)
    .filter((q) => q.type === 'weekly' && q.status === 'active')
    .toArray()

  for (const q of oldWeeklies) {
    await db.rpgQuests.update(q.id, { status: 'expired' })
  }

  // End of week (Sunday 23:59)
  const endOfWeek = new Date()
  endOfWeek.setDate(endOfWeek.getDate() + (7 - currentDay))
  endOfWeek.setHours(23, 59, 59, 999)

  for (const template of WEEKLY_QUEST_TEMPLATES) {
    const quest: RpgQuest = {
      id: uuid(),
      userId,
      type: 'weekly',
      name: template.name,
      description: template.description,
      targetModule: template.targetModule,
      targetAction: template.targetAction,
      targetCount: template.targetCount,
      currentCount: 0,
      xpReward: template.xpReward,
      status: 'active',
      createdAt: timestamp,
      expiresAt: endOfWeek.toISOString(),
      clientEventId: uuid(),
    }
    await db.rpgQuests.add(quest)
  }
}

export async function progressQuest(
  userId: string,
  module: string,
  action: string,
): Promise<RpgQuest[]> {
  const completed: RpgQuest[] = []
  const quests = await db.rpgQuests
    .where('userId')
    .equals(userId)
    .filter((q) => q.status === 'active' && q.targetModule === module && q.targetAction === action)
    .toArray()

  for (const quest of quests) {
    const newCount = quest.currentCount + 1
    const isComplete = newCount >= quest.targetCount

    await db.rpgQuests.update(quest.id, {
      currentCount: newCount,
      status: isComplete ? 'completed' : 'active',
      completedAt: isComplete ? now() : undefined,
    })

    if (isComplete) {
      completed.push({ ...quest, currentCount: newCount, status: 'completed' })

      // Grant quest XP
      for (const [stat, xp] of Object.entries(quest.xpReward)) {
        await grantXp(userId, 'quest', 'complete', quest.id, stat as StatAbbr, xp)
      }

      await addLogEntry(userId, 'quest_complete', quest.name, `Quest completed: ${quest.name}`, { questId: quest.id, xpReward: quest.xpReward })
    }
  }

  return completed
}

// ── Encounters / Battles ──

export async function getPendingEncounters(userId: string): Promise<RpgEncounter[]> {
  const nowStr = now()
  return db.rpgEncounters
    .where('userId')
    .equals(userId)
    .filter((e) => (e.status === 'pending' || e.status === 'active') && e.expiresAt > nowStr)
    .toArray()
}

export async function spawnEncounter(
  userId: string,
  enemyId: string,
  sourceAction: string,
): Promise<RpgEncounter | null> {
  const enemy = getEnemyById(enemyId)
  if (!enemy) return null

  // Max 3 pending encounters
  const pending = await getPendingEncounters(userId)
  if (pending.length >= 3) return null

  const character = await getCharacter()
  if (!character) return null

  const statNums = await getStatLevelNumbers(userId)
  const secondary = computeSecondaryStats(statNums)
  const scaled = scaleEnemy(enemy, character.level)

  const timestamp = now()
  const expires = new Date()
  expires.setHours(expires.getHours() + 48)

  const encounter: RpgEncounter = {
    id: uuid(),
    userId,
    enemyId: enemy.id,
    enemyName: enemy.name,
    difficulty: enemy.difficulty,
    enemyHp: scaled.hp,
    enemyMaxHp: scaled.hp,
    enemyPower: scaled.power,
    enemyDefense: scaled.defense,
    enemyPattern: enemy.pattern,
    enemyPatternIndex: 0,
    playerHp: secondary.hp,
    playerMaxHp: secondary.hp,
    playerEnergy: secondary.energy,
    playerMaxEnergy: secondary.energy,
    status: 'pending',
    turnsElapsed: 0,
    loot: enemy.loot,
    spawnedBy: sourceAction,
    createdAt: timestamp,
    expiresAt: expires.toISOString(),
    clientEventId: uuid(),
  }

  await db.rpgEncounters.add(encounter)
  return encounter
}

export async function startEncounter(encounterId: string): Promise<RpgEncounter | null> {
  const encounter = await db.rpgEncounters.get(encounterId)
  if (!encounter || encounter.status !== 'pending') return null

  await db.rpgEncounters.update(encounterId, { status: 'active' })
  return { ...encounter, status: 'active' }
}

export async function executeBattleTurn(
  encounterId: string,
  action: BattleAction,
  userId: string,
): Promise<{
  turn: RpgBattleTurn
  encounter: RpgEncounter
  victory: boolean
  defeat: boolean
} | null> {
  const encounter = await db.rpgEncounters.get(encounterId)
  if (!encounter || encounter.status !== 'active') return null

  const character = await getCharacter()
  if (!character) return null

  const statNums = await getStatLevelNumbers(userId)
  const secondary = computeSecondaryStats(statNums)
  const enemy = getEnemyById(encounter.enemyId)
  if (!enemy) return null

  // Player's turn
  let playerDamage = 0
  let energyCost = 0
  let isCrit = false
  let playerHealAmount = 0

  switch (action) {
    case 'attack': {
      const result = playerAttackDamage(
        statNums[enemy.primaryStat],
        character.level,
        encounter.enemyDefense,
        secondary.crit,
      )
      playerDamage = result.damage
      isCrit = result.isCrit
      break
    }
    case 'defend': {
      energyCost = -5 // recover 5 energy
      break
    }
    case 'skill': {
      // Basic skill: uses primary stat × 2 for 15 energy
      playerDamage = Math.floor(statNums[enemy.primaryStat] * 2)
      energyCost = 15
      break
    }
    case 'truth': {
      // Truth: WIS-based damage + small heal
      playerDamage = Math.floor(statNums.WIS * 1.5)
      playerHealAmount = Math.floor(statNums.FAI * 0.5)
      break
    }
  }

  // Enemy's turn
  const { move: enemyMove, nextIndex } = getEnemyMove(encounter.enemyPattern, encounter.enemyPatternIndex)
  let enemyDamage = 0

  if (enemyMove === 'rest' || enemyMove === 'regrow') {
    enemyDamage = 0 // enemy skips attack
  } else if (action === 'defend') {
    enemyDamage = Math.floor(enemyAttackDamage(encounter.enemyPower, secondary.resistance) * 0.5)
  } else {
    enemyDamage = enemyAttackDamage(encounter.enemyPower, secondary.resistance)
  }

  // Apply
  const newEnemyHp = Math.max(0, encounter.enemyHp - playerDamage)
  const newPlayerHp = Math.min(encounter.playerMaxHp, Math.max(0, encounter.playerHp - enemyDamage + playerHealAmount))
  const newEnergy = Math.max(0, Math.min(encounter.playerMaxEnergy, encounter.playerEnergy - energyCost))
  const newTurn = encounter.turnsElapsed + 1

  const victory = newEnemyHp <= 0
  const defeat = newPlayerHp <= 0

  // Save battle turn
  const turn: RpgBattleTurn = {
    id: uuid(),
    encounterId,
    turnNumber: newTurn,
    playerAction: action,
    playerDamageDealt: playerDamage,
    enemyAction: enemyMove,
    enemyDamageDealt: enemyDamage,
    playerHpAfter: newPlayerHp,
    enemyHpAfter: newEnemyHp,
    playerEnergyAfter: newEnergy,
    isCrit,
    timestamp: now(),
  }
  await db.rpgBattleTurns.add(turn)

  // Update encounter
  const newStatus = victory ? 'victory' as const : defeat ? 'defeat' as const : 'active' as const
  const updatedEncounter: Partial<RpgEncounter> = {
    enemyHp: newEnemyHp,
    playerHp: newPlayerHp,
    playerEnergy: newEnergy,
    turnsElapsed: newTurn,
    enemyPatternIndex: nextIndex,
    status: newStatus,
    ...(victory || defeat ? { completedAt: now() } : {}),
  }
  await db.rpgEncounters.update(encounterId, updatedEncounter)

  const finalEncounter = { ...encounter, ...updatedEncounter } as RpgEncounter

  // Handle victory rewards
  if (victory) {
    const enemyDef = getEnemyById(encounter.enemyId)
    if (enemyDef) {
      await grantXp(userId, 'battle', 'victory', encounterId, enemyDef.primaryStat, enemyDef.xpReward)
    }
    await addLogEntry(userId, 'battle', `Defeated ${encounter.enemyName}`, `Victory! +${enemyDef?.xpReward ?? 0} XP`, {
      enemyId: encounter.enemyId,
      turns: newTurn,
    })
  }

  return { turn, encounter: finalEncounter, victory, defeat }
}

export async function getBattleTurns(encounterId: string): Promise<RpgBattleTurn[]> {
  return db.rpgBattleTurns.where('encounterId').equals(encounterId).sortBy('turnNumber')
}

// ── Truths ──

export async function getTruths(userId: string): Promise<RpgTruth[]> {
  return db.rpgTruths.where('userId').equals(userId).toArray()
}

export async function getEquippedTruths(userId: string): Promise<RpgTruth[]> {
  return db.rpgTruths
    .where('userId')
    .equals(userId)
    .filter((t) => t.isEquipped)
    .toArray()
}

export async function collectTruth(
  userId: string,
  text: string,
  sourceEntryId: string,
  theme: RpgTruth['theme'],
): Promise<RpgTruth> {
  const truth: RpgTruth = {
    id: uuid(),
    userId,
    text,
    sourceEntryId,
    theme,
    battleEffect: `Deals WIS-based damage and inspires ${theme}`,
    battlePower: 1,
    isEquipped: false,
    collectedAt: now(),
    clientEventId: uuid(),
  }
  await db.rpgTruths.add(truth)
  return truth
}

export async function toggleTruthEquip(truthId: string, equip: boolean): Promise<void> {
  if (equip) {
    // Max 3 equipped truths
    const character = await getCharacter()
    if (!character) return
    const equipped = await getEquippedTruths(character.userId)
    if (equipped.length >= 3) return
  }
  await db.rpgTruths.update(truthId, { isEquipped: equip })
}

// ── Perk Points ──

export async function getPerkPoints(userId: string): Promise<RpgPerkPoints | undefined> {
  return db.rpgPerkPoints.where('userId').equals(userId).first()
}

export async function getUnlockedPerks(userId: string): Promise<RpgPerkUnlock[]> {
  return db.rpgPerkUnlocks.where('userId').equals(userId).toArray()
}

export async function unlockPerk(userId: string, treeId: SkillTreeId, perkNumber: number): Promise<boolean> {
  const pp = await getPerkPoints(userId)
  if (!pp || pp.available <= 0) return false

  const id = `${userId}_${treeId}_${perkNumber}`
  const existing = await db.rpgPerkUnlocks.get(id)
  if (existing) return false

  await db.rpgPerkUnlocks.add({
    id,
    userId,
    treeId,
    perkNumber,
    unlockedAt: now(),
    clientEventId: uuid(),
  })

  await db.rpgPerkPoints.update(pp.id, {
    available: pp.available - 1,
    updatedAt: now(),
    clientEventId: uuid(),
  })

  await addLogEntry(userId, 'perk', `Perk Unlocked`, `Unlocked perk #${perkNumber} in ${treeId} tree`, { treeId, perkNumber })

  return true
}

// ── Achievements ──

export async function getAchievements(userId: string): Promise<RpgAchievement[]> {
  return db.rpgAchievements.where('userId').equals(userId).toArray()
}

export async function unlockAchievement(userId: string, name: string, description: string, icon: string): Promise<void> {
  const existing = await db.rpgAchievements
    .where('userId')
    .equals(userId)
    .filter((a) => a.name === name)
    .first()
  if (existing) return

  await db.rpgAchievements.add({
    id: uuid(),
    userId,
    name,
    description,
    icon,
    unlockedAt: now(),
    clientEventId: uuid(),
  })

  await addLogEntry(userId, 'achievement', name, description, { icon })
}

// ── Log ──

export async function addLogEntry(
  userId: string,
  type: RpgLogEntry['type'],
  title: string,
  description: string,
  data: Record<string, unknown>,
): Promise<void> {
  await db.rpgLogEntries.add({
    id: uuid(),
    userId,
    type,
    title,
    description,
    data,
    timestamp: now(),
  })
}

export async function getRecentLog(userId: string, limit = 50): Promise<RpgLogEntry[]> {
  const all = await db.rpgLogEntries
    .where('userId')
    .equals(userId)
    .reverse()
    .sortBy('timestamp')
  return all.slice(0, limit)
}

// ── Cosmetics ──

export async function getCosmeticItems(userId: string): Promise<RpgCosmeticItem[]> {
  return db.rpgCosmeticItems.where('userId').equals(userId).toArray()
}

// ── Questlines ──

export async function getActiveQuestlines(userId: string): Promise<RpgQuestline[]> {
  return db.rpgQuestlines
    .where('userId')
    .equals(userId)
    .filter((q) => q.status === 'active')
    .toArray()
}
