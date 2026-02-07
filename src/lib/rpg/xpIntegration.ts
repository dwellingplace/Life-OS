/* ============================================================
   LIFE OS — RPG XP Integration
   Hooks into existing module actions to grant XP, progress quests,
   and spawn encounters.
   ============================================================ */

import {
  grantXp,
  progressQuest,
  spawnEncounter,
  getCharacter,
} from './repository'
import { ENEMIES } from './engine'
import { db } from '@/lib/db'
import { getBridgedUserId } from '@/lib/auth/bridge'

/**
 * Call this after a workout is completed.
 * @param instanceId - The workout instance ID (for idempotency)
 * @param completedSets - Number of sets completed
 * @param hadPR - Whether a personal record was set
 */
export async function onWorkoutComplete(instanceId: string, completedSets: number, hadPR: boolean): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  const character = await getCharacter()
  if (!character) return

  // XP for sets
  if (completedSets > 0) {
    await grantXp(userId, 'workout', 'log_set', `${instanceId}_sets`, 'STR', completedSets * 15)
  }

  // XP for completion
  await grantXp(userId, 'workout', 'complete_workout', instanceId, 'STR', 50, 'END', 25)
  await progressQuest(userId, 'workout', 'complete_workout')

  // PR bonus
  if (hadPR) {
    await grantXp(userId, 'workout', 'pr', `${instanceId}_pr`, 'STR', 100, 'DIS', 50)
  }

  // Spawn encounter
  await spawnEncounter(userId, 'fatigue_beast', 'workout_complete')

  // Check usage-based spawning
  await checkUsageEncounter()
}

/**
 * Call this when a mobility session is completed.
 */
export async function onMobilityComplete(instanceId: string): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  await grantXp(userId, 'mobility', 'complete_session', instanceId, 'END', 75)
  await progressQuest(userId, 'mobility', 'complete_session')
}

/**
 * Call this when a task is completed.
 */
export async function onTaskComplete(taskId: string, isTop3: boolean, isHighPriority: boolean): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  await grantXp(userId, 'tasks', 'complete_task', taskId, 'DIS', 20)
  await progressQuest(userId, 'tasks', 'complete_task')

  if (isTop3) {
    await grantXp(userId, 'tasks', 'complete_top3', `${taskId}_top3`, 'DIS', 50, 'FOC', 50)
  }

  if (isHighPriority) {
    await grantXp(userId, 'tasks', 'complete_high_priority', `${taskId}_hp`, 'FOC', 40)
  }

  // Check usage-based spawning
  await checkUsageEncounter()
}

/**
 * Call this when all Top 3 tasks are completed for the day.
 */
export async function onAllTop3Complete(dateStr: string): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  await grantXp(userId, 'tasks', 'complete_all_top3', `top3_${dateStr}`, 'DIS', 150, 'FOC', 100)
  await progressQuest(userId, 'tasks', 'complete_all_top3')

  // Spawn encounter
  await spawnEncounter(userId, 'chaos_gremlin', 'top3_complete')
}

/**
 * Call this when a journal entry is saved.
 */
export async function onJournalSave(entryId: string, wordCount: number): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  if (wordCount >= 500) {
    await grantXp(userId, 'journal', 'write_entry_500', entryId, 'WIS', 150, 'FAI', 25)
  } else if (wordCount >= 200) {
    await grantXp(userId, 'journal', 'write_entry_200', entryId, 'WIS', 100)
  } else {
    await grantXp(userId, 'journal', 'write_entry', entryId, 'WIS', 50)
  }
  await progressQuest(userId, 'journal', 'write_entry')

  // Check usage-based spawning
  await checkUsageEncounter()
}

/**
 * Call this when a journal truth is starred.
 */
export async function onTruthStarred(entryId: string, truthText: string): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  await grantXp(userId, 'journal', 'star_truth', `truth_${entryId}`, 'WIS', 25)

  // Spawn encounter
  await spawnEncounter(userId, 'doubt_shade', 'journal_truth_starred')
}

/**
 * Call this when a prayer/devotional is logged.
 */
export async function onPrayerComplete(instanceId: string): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  await grantXp(userId, 'prayer', 'log_prayer', instanceId, 'FAI', 75)
  await progressQuest(userId, 'prayer', 'log_prayer')
}

/**
 * Call this when all supplements are checked off.
 */
export async function onSupplementsComplete(instanceId: string): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  await grantXp(userId, 'supplements', 'complete_all', instanceId, 'DIS', 30, 'END', 0)
  await progressQuest(userId, 'supplements', 'complete_all')
}

/**
 * Call this when a Money Minute check-in is done.
 */
export async function onFinanceCheckIn(instanceId: string): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  await grantXp(userId, 'finance', 'money_minute', instanceId, 'STW', 50)
  await progressQuest(userId, 'finance', 'money_minute')

  // Spawn encounter on weekly review
  await spawnEncounter(userId, 'budget_bandit', 'finance_review')
}

/**
 * Call this when a work focus item is completed.
 */
export async function onWorkFocusComplete(instanceId: string): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  await grantXp(userId, 'work_focus', 'complete_item', instanceId, 'FOC', 40)
  await progressQuest(userId, 'work_focus', 'complete_item')
  // Also progress Deep Work Block quest (uses 'deep_work' action)
  await progressQuest(userId, 'work_focus', 'deep_work')
}

/**
 * Call this when an audio training rep is logged.
 */
export async function onAudioRepComplete(instanceId: string): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  await grantXp(userId, 'audio', 'log_rep', instanceId, 'CRA', 50)
  await progressQuest(userId, 'audio', 'log_rep')

  // Spawn encounter
  await spawnEncounter(userId, 'signal_goblin', 'audio_practice')
}

/**
 * Call this when a charisma/leadership prompt is completed.
 */
export async function onLeadershipComplete(instanceId: string): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  await grantXp(userId, 'leadership', 'complete_prompt', instanceId, 'CHA', 75)
  await progressQuest(userId, 'leadership', 'complete_prompt')

  // Spawn encounter
  await spawnEncounter(userId, 'tension_wraith', 'leadership_prompt')
}

// ── Usage-based encounter spawning ──

/** Enemies eligible for random usage-based spawning (easy/medium only) */
const RANDOM_ENCOUNTER_POOL = ENEMIES.filter(
  (e) => e.difficulty === 'easy' || e.difficulty === 'medium'
)

/** Action thresholds at which a random encounter spawns. */
const SPAWN_THRESHOLDS = [5, 10, 15, 20, 30]

/**
 * Check if the user's daily activity count has crossed a threshold
 * and spawn a random encounter if so. Idempotent — uses threshold
 * value in the sourceAction to avoid duplicates.
 */
async function checkUsageEncounter(): Promise<void> {
  const userId = getBridgedUserId()
  if (!userId) return

  const character = await getCharacter()
  if (!character) return

  // Count today's XP events
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayEvents = await db.rpgXpEvents
    .where('userId')
    .equals(userId)
    .filter((e) => e.timestamp.startsWith(todayStr))
    .count()

  // Check each threshold
  for (const threshold of SPAWN_THRESHOLDS) {
    if (todayEvents >= threshold) {
      // Pick a random enemy from the pool based on threshold index
      const enemyIdx = (threshold + character.level) % RANDOM_ENCOUNTER_POOL.length
      const enemy = RANDOM_ENCOUNTER_POOL[enemyIdx]
      // Spawn with idempotent key including date + threshold
      await spawnEncounter(userId, enemy.id, `usage_${todayStr}_${threshold}`)
    }
  }
}

/**
 * Generic instance completion handler — routes to the right XP function
 * based on cardType.
 */
export async function onInstanceComplete(instanceId: string, cardType: string): Promise<void> {
  switch (cardType) {
    case 'mobility':
      await onMobilityComplete(instanceId); break
    case 'supplements':
      await onSupplementsComplete(instanceId); break
    case 'money-minute':
      await onFinanceCheckIn(instanceId); break
    case 'work-focus':
      await onWorkFocusComplete(instanceId); break
    case 'audio-training':
      await onAudioRepComplete(instanceId); break
    case 'charisma':
      await onLeadershipComplete(instanceId); break
    default:
      return
  }

  // Check usage-based spawning after any instance completion
  await checkUsageEncounter()
}
