/* ============================================================
   LIFE OS — RPG Engine
   Core game logic: XP, leveling, stats, battles, enemies.
   ============================================================ */

import type {
  StatAbbr,
  EncounterDifficulty,
  RpgLootDrop,
  SkillTreeId,
} from '@/lib/db/schema'

// ── Stat Colors ──

export const STAT_COLORS: Record<StatAbbr, string> = {
  STR: '#DC2626',
  END: '#D97706',
  DIS: '#2563EB',
  WIS: '#7C3AED',
  CHA: '#CA8A04',
  FOC: '#0891B2',
  CRA: '#059669',
  STW: '#6B7280',
  FAI: '#EAB308',
}

export const STAT_NAMES: Record<StatAbbr, string> = {
  STR: 'Strength',
  END: 'Endurance',
  DIS: 'Discipline',
  WIS: 'Wisdom',
  CHA: 'Charisma',
  FOC: 'Focus',
  CRA: 'Craft',
  STW: 'Stewardship',
  FAI: 'Faith',
}

export const ALL_STATS: StatAbbr[] = ['STR', 'END', 'DIS', 'WIS', 'CHA', 'FOC', 'CRA', 'STW', 'FAI']

// ── XP + Leveling ──

/** XP required to go from `level` to `level+1`. */
export function xpRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

/** Calculate character level from total XP. */
export function levelFromXp(totalXp: number): { level: number; currentLevelXp: number; nextLevelXp: number } {
  let level = 1
  let cumulative = 0
  while (true) {
    const needed = xpRequiredForLevel(level)
    if (cumulative + needed > totalXp) {
      return { level, currentLevelXp: totalXp - cumulative, nextLevelXp: needed }
    }
    cumulative += needed
    level++
  }
}

/** XP required for a stat to go from `statLevel` to `statLevel+1`. */
export function statXpRequired(statLevel: number): number {
  if (statLevel <= 20) return 100 + (statLevel - 1) * 20
  return 500 + (statLevel - 20) * 50
}

/** Calculate stat level from stat-specific XP. */
export function statLevelFromXp(statXp: number): { level: number; currentXp: number; nextXp: number } {
  let level = 1
  let cumulative = 0
  while (level < 99) {
    const needed = statXpRequired(level)
    if (cumulative + needed > statXp) {
      return { level, currentXp: statXp - cumulative, nextXp: needed }
    }
    cumulative += needed
    level++
  }
  return { level: 99, currentXp: 0, nextXp: 0 }
}

// ── Secondary Stats ──

export interface SecondaryStats {
  hp: number
  energy: number
  crit: number
  resistance: number
  initiative: number
}

export function computeSecondaryStats(stats: Record<StatAbbr, number>): SecondaryStats {
  return {
    hp: 100 + (stats.STR * 3) + (stats.END * 2) + (stats.FAI * 1),
    energy: 50 + (stats.END * 2) + (stats.DIS * 1),
    crit: 5 + (stats.FOC * 0.5) + (stats.DIS * 0.3),
    resistance: 10 + (stats.WIS * 2) + (stats.FAI * 1) + (stats.END * 1),
    initiative: 5 + (stats.DIS * 1) + (stats.FOC * 0.5),
  }
}

/** Find the dominant stat for aura color. */
export function dominantStat(stats: Record<StatAbbr, number>): StatAbbr {
  return (Object.entries(stats) as [StatAbbr, number][])
    .reduce((a, b) => (a[1] >= b[1] ? a : b))[0]
}

// ── Enemy Definitions ──

export interface EnemyDefinition {
  id: string
  name: string
  theme: string
  primaryStat: StatAbbr
  secondaryStat: StatAbbr
  difficulty: EncounterDifficulty
  baseHp: number
  basePower: number
  baseDefense: number
  pattern: string[] // cycle of move IDs
  spawnsAfter: string // source action description
  loot: RpgLootDrop[]
  xpReward: number
}

export const ENEMIES: EnemyDefinition[] = [
  {
    id: 'chaos_gremlin',
    name: 'Chaos Gremlin',
    theme: 'Distractions',
    primaryStat: 'DIS',
    secondaryStat: 'FOC',
    difficulty: 'easy',
    baseHp: 60,
    basePower: 12,
    baseDefense: 4,
    pattern: ['attack', 'distract', 'attack'],
    spawnsAfter: 'top3_complete',
    loot: [{ type: 'xp_orb', itemId: 'focus_shard', amount: 25, stat: 'FOC' }],
    xpReward: 50,
  },
  {
    id: 'fatigue_beast',
    name: 'Fatigue Beast',
    theme: 'Exhaustion',
    primaryStat: 'STR',
    secondaryStat: 'END',
    difficulty: 'medium',
    baseHp: 100,
    basePower: 18,
    baseDefense: 6,
    pattern: ['heavy_slam', 'rest', 'heavy_slam', 'drain'],
    spawnsAfter: 'workout_complete',
    loot: [{ type: 'essence_fragment', itemId: 'iron_essence', amount: 1 }],
    xpReward: 100,
  },
  {
    id: 'tension_wraith',
    name: 'Tension Wraith',
    theme: 'Conflict avoidance',
    primaryStat: 'CHA',
    secondaryStat: 'WIS',
    difficulty: 'medium',
    baseHp: 90,
    basePower: 16,
    baseDefense: 8,
    pattern: ['whisper', 'shadow_strike', 'whisper'],
    spawnsAfter: 'leadership_prompt',
    loot: [{ type: 'xp_orb', itemId: 'charm_shard', amount: 30, stat: 'CHA' }],
    xpReward: 100,
  },
  {
    id: 'budget_bandit',
    name: 'Budget Bandit',
    theme: 'Financial neglect',
    primaryStat: 'STW',
    secondaryStat: 'DIS',
    difficulty: 'medium',
    baseHp: 85,
    basePower: 14,
    baseDefense: 7,
    pattern: ['steal', 'attack', 'steal'],
    spawnsAfter: 'finance_review',
    loot: [{ type: 'xp_orb', itemId: 'coin_shard', amount: 30, stat: 'STW' }],
    xpReward: 100,
  },
  {
    id: 'signal_goblin',
    name: 'Signal Goblin',
    theme: 'Audio interference',
    primaryStat: 'CRA',
    secondaryStat: 'FOC',
    difficulty: 'medium',
    baseHp: 80,
    basePower: 15,
    baseDefense: 5,
    pattern: ['screech', 'attack', 'screech', 'attack'],
    spawnsAfter: 'audio_practice',
    loot: [{ type: 'xp_orb', itemId: 'craft_shard', amount: 30, stat: 'CRA' }],
    xpReward: 100,
  },
  {
    id: 'doubt_shade',
    name: 'Doubt Shade',
    theme: 'Self-doubt',
    primaryStat: 'FAI',
    secondaryStat: 'WIS',
    difficulty: 'hard',
    baseHp: 140,
    basePower: 22,
    baseDefense: 10,
    pattern: ['whisper', 'shadow_strike', 'whisper', 'shadow_strike', 'despair'],
    spawnsAfter: 'journal_truth_starred',
    loot: [
      { type: 'essence_fragment', itemId: 'faith_essence', amount: 1 },
      { type: 'xp_orb', itemId: 'wisdom_shard', amount: 50, stat: 'WIS' },
    ],
    xpReward: 200,
  },
  {
    id: 'procrastination_hydra',
    name: 'Procrastination Hydra',
    theme: 'Avoidance',
    primaryStat: 'DIS',
    secondaryStat: 'FOC',
    difficulty: 'hard',
    baseHp: 180,
    basePower: 25,
    baseDefense: 12,
    pattern: ['attack', 'regrow', 'attack', 'attack', 'regrow'],
    spawnsAfter: 'weekly_quest_streak',
    loot: [
      { type: 'quest_token', itemId: 'hydra_token', amount: 1 },
      { type: 'xp_orb', itemId: 'dis_orb', amount: 75, stat: 'DIS' },
    ],
    xpReward: 200,
  },
  {
    id: 'entropy_lord',
    name: 'The Entropy Lord',
    theme: 'Chaos',
    primaryStat: 'DIS',
    secondaryStat: 'WIS',
    difficulty: 'boss',
    baseHp: 300,
    basePower: 35,
    baseDefense: 15,
    pattern: ['chaos_wave', 'attack', 'drain', 'chaos_wave', 'attack', 'ultimate'],
    spawnsAfter: 'monthly_quest',
    loot: [
      { type: 'gear', itemId: 'cloak_of_order', amount: 1 },
      { type: 'title', itemId: 'order_keeper', amount: 1 },
      { type: 'xp_orb', itemId: 'all_orb', amount: 100 },
    ],
    xpReward: 500,
  },
]

export function getEnemyById(id: string): EnemyDefinition | undefined {
  return ENEMIES.find((e) => e.id === id)
}

// ── Battle Logic ──

export interface BattleState {
  playerHp: number
  playerMaxHp: number
  playerEnergy: number
  playerMaxEnergy: number
  enemyHp: number
  enemyMaxHp: number
  turnsElapsed: number
  enemyPatternIndex: number
}

/** Calculate player attack damage. */
export function playerAttackDamage(
  primaryStatLevel: number,
  characterLevel: number,
  enemyDefense: number,
  critChance: number,
): { damage: number; isCrit: boolean } {
  const baseDamage = Math.max(1, Math.floor((primaryStatLevel * 1.5) + (characterLevel * 0.5) - enemyDefense))
  const isCrit = Math.random() * 100 < critChance
  return { damage: isCrit ? Math.floor(baseDamage * 1.5) : baseDamage, isCrit }
}

/** Calculate enemy attack damage. */
export function enemyAttackDamage(enemyPower: number, playerResistance: number): number {
  return Math.max(1, Math.floor(enemyPower - playerResistance * 0.3))
}

/** Get the enemy's next move from their pattern. */
export function getEnemyMove(pattern: string[], patternIndex: number): { move: string; nextIndex: number } {
  const move = pattern[patternIndex % pattern.length]
  return { move, nextIndex: (patternIndex + 1) % pattern.length }
}

/** Scale enemy stats based on player level. */
export function scaleEnemy(enemy: EnemyDefinition, playerLevel: number): {
  hp: number; power: number; defense: number
} {
  const scale = 1 + (playerLevel - 1) * 0.05
  return {
    hp: Math.floor(enemy.baseHp * scale),
    power: Math.floor(enemy.basePower * scale),
    defense: Math.floor(enemy.baseDefense * scale),
  }
}

// ── XP Mapping ──

export interface XpReward {
  primaryStat: StatAbbr
  primaryXp: number
  secondaryStat?: StatAbbr
  secondaryXp?: number
}

export interface ActivityXpMapping {
  module: string
  action: string
  primary: StatAbbr
  secondary?: StatAbbr
  baseXp: number
  secondaryXp?: number
}

export const ACTIVITY_XP_MAP: ActivityXpMapping[] = [
  { module: 'workout', action: 'log_set', primary: 'STR', baseXp: 15 },
  { module: 'workout', action: 'complete_workout', primary: 'STR', secondary: 'END', baseXp: 50, secondaryXp: 25 },
  { module: 'workout', action: 'pr', primary: 'STR', secondary: 'DIS', baseXp: 100, secondaryXp: 50 },
  { module: 'mobility', action: 'complete_session', primary: 'END', secondary: 'STR', baseXp: 75, secondaryXp: 0 },
  { module: 'tasks', action: 'complete_task', primary: 'DIS', baseXp: 20 },
  { module: 'tasks', action: 'complete_top3', primary: 'DIS', secondary: 'FOC', baseXp: 50, secondaryXp: 50 },
  { module: 'tasks', action: 'complete_all_top3', primary: 'DIS', secondary: 'FOC', baseXp: 150, secondaryXp: 100 },
  { module: 'tasks', action: 'complete_high_priority', primary: 'FOC', secondary: 'DIS', baseXp: 40, secondaryXp: 0 },
  { module: 'journal', action: 'write_entry', primary: 'WIS', baseXp: 50 },
  { module: 'journal', action: 'write_entry_200', primary: 'WIS', baseXp: 100 },
  { module: 'journal', action: 'write_entry_500', primary: 'WIS', secondary: 'FAI', baseXp: 150, secondaryXp: 25 },
  { module: 'journal', action: 'star_truth', primary: 'WIS', baseXp: 25 },
  { module: 'prayer', action: 'log_prayer', primary: 'FAI', baseXp: 75 },
  { module: 'prayer', action: 'log_scripture', primary: 'FAI', secondary: 'WIS', baseXp: 50, secondaryXp: 25 },
  { module: 'supplements', action: 'complete_all', primary: 'DIS', secondary: 'END', baseXp: 30, secondaryXp: 0 },
  { module: 'finance', action: 'money_minute', primary: 'STW', secondary: 'DIS', baseXp: 50, secondaryXp: 0 },
  { module: 'finance', action: 'weekly_review', primary: 'STW', baseXp: 150 },
  { module: 'work_focus', action: 'complete_item', primary: 'FOC', secondary: 'DIS', baseXp: 40, secondaryXp: 0 },
  { module: 'work_focus', action: 'complete_all', primary: 'FOC', secondary: 'CHA', baseXp: 100, secondaryXp: 25 },
  { module: 'work_focus', action: 'deep_work', primary: 'FOC', baseXp: 100 },
  { module: 'audio', action: 'log_rep', primary: 'CRA', secondary: 'FOC', baseXp: 50, secondaryXp: 0 },
  { module: 'audio', action: 'practice_session', primary: 'CRA', baseXp: 100 },
  { module: 'leadership', action: 'complete_prompt', primary: 'CHA', secondary: 'WIS', baseXp: 75, secondaryXp: 0 },
  { module: 'leadership', action: 'family_action', primary: 'CHA', secondary: 'FAI', baseXp: 50, secondaryXp: 0 },
]

export function getXpMapping(module: string, action: string): ActivityXpMapping | undefined {
  return ACTIVITY_XP_MAP.find((m) => m.module === module && m.action === action)
}

// ── Quest Templates ──

export interface DailyQuestTemplate {
  name: string
  description: string
  targetModule: string
  targetAction: string
  targetCount: number
  xpReward: Record<string, number>
}

export const DAILY_QUEST_TEMPLATES: DailyQuestTemplate[] = [
  { name: 'Morning Discipline', description: 'Complete a workout', targetModule: 'workout', targetAction: 'complete_workout', targetCount: 1, xpReward: { STR: 100, DIS: 50 } },
  { name: 'Body Maintenance', description: 'Complete a mobility session', targetModule: 'mobility', targetAction: 'complete_session', targetCount: 1, xpReward: { END: 75 } },
  { name: 'The Top 3 Challenge', description: 'Complete all Top 3 tasks', targetModule: 'tasks', targetAction: 'complete_all_top3', targetCount: 1, xpReward: { DIS: 150, FOC: 100 } },
  { name: 'Daily Reflection', description: 'Write a journal entry', targetModule: 'journal', targetAction: 'write_entry', targetCount: 1, xpReward: { WIS: 100 } },
  { name: 'Morning Offering', description: 'Log prayer or devotional', targetModule: 'prayer', targetAction: 'log_prayer', targetCount: 1, xpReward: { FAI: 100 } },
  { name: 'Supplement Protocol', description: 'Take all supplements', targetModule: 'supplements', targetAction: 'complete_all', targetCount: 1, xpReward: { DIS: 50 } },
  { name: 'Money Minute', description: 'Complete finance check-in', targetModule: 'finance', targetAction: 'money_minute', targetCount: 1, xpReward: { STW: 75 } },
  { name: 'Creative Practice', description: 'Log an audio rep or practice', targetModule: 'audio', targetAction: 'log_rep', targetCount: 1, xpReward: { CRA: 75 } },
  { name: 'Connection Point', description: 'Complete a leadership prompt', targetModule: 'leadership', targetAction: 'complete_prompt', targetCount: 1, xpReward: { CHA: 75 } },
  { name: 'Deep Work Block', description: 'Log 1+ hour focused work', targetModule: 'work_focus', targetAction: 'deep_work', targetCount: 1, xpReward: { FOC: 100 } },
]

export interface WeeklyQuestTemplate {
  name: string
  description: string
  targetModule: string
  targetAction: string
  targetCount: number
  xpReward: Record<string, number>
}

export const WEEKLY_QUEST_TEMPLATES: WeeklyQuestTemplate[] = [
  { name: 'Iron Week', description: '5+ workouts this week', targetModule: 'workout', targetAction: 'complete_workout', targetCount: 5, xpReward: { STR: 500 } },
  { name: 'The Disciplined', description: 'Complete Top 3 five days', targetModule: 'tasks', targetAction: 'complete_all_top3', targetCount: 5, xpReward: { DIS: 400, FOC: 200 } },
  { name: "Sage's Journal", description: '5+ journal entries', targetModule: 'journal', targetAction: 'write_entry', targetCount: 5, xpReward: { WIS: 400 } },
  { name: 'Faithful Week', description: '6+ prayer/devotional logs', targetModule: 'prayer', targetAction: 'log_prayer', targetCount: 6, xpReward: { FAI: 400 } },
  { name: 'Budget Review', description: 'Complete weekly finance review', targetModule: 'finance', targetAction: 'weekly_review', targetCount: 1, xpReward: { STW: 300 } },
  { name: 'Practice Makes', description: '4+ creative practice sessions', targetModule: 'audio', targetAction: 'log_rep', targetCount: 4, xpReward: { CRA: 300 } },
  { name: 'Social Leader', description: '3+ leadership or family actions', targetModule: 'leadership', targetAction: 'complete_prompt', targetCount: 3, xpReward: { CHA: 300 } },
  { name: 'Endurance Protocol', description: '4+ mobility sessions', targetModule: 'mobility', targetAction: 'complete_session', targetCount: 4, xpReward: { END: 300 } },
]

// ── Skill Tree Definitions ──

export interface PerkDefinition {
  number: number
  name: string
  prereqPerks: number[] // perk numbers required
  prereqLevel?: number
  prereqStats?: Partial<Record<StatAbbr, number>>
  effect: string
  type: 'passive' | 'skill'
  skillName?: string
  skillEnergyCost?: number
}

export interface SkillTreeDefinition {
  id: SkillTreeId
  name: string
  stats: StatAbbr[]
  perks: PerkDefinition[]
}

export const SKILL_TREES: SkillTreeDefinition[] = [
  {
    id: 'warrior',
    name: "Warrior's Path",
    stats: ['STR', 'END'],
    perks: [
      { number: 1, name: 'Iron Will', prereqPerks: [], effect: '+10% STR XP from workouts', type: 'passive' },
      { number: 2, name: 'Second Wind', prereqPerks: [1], effect: 'Recover 15 Energy once per encounter', type: 'skill', skillName: 'Second Wind', skillEnergyCost: 0 },
      { number: 3, name: 'Heavy Lifter', prereqPerks: [], prereqLevel: 5, prereqStats: { STR: 10 }, effect: 'Bonus XP for PR sets', type: 'passive' },
      { number: 4, name: 'Unbreakable', prereqPerks: [3], effect: '+20 HP', type: 'passive' },
      { number: 5, name: 'Marathon Spirit', prereqPerks: [1], effect: '+15% END XP from mobility', type: 'passive' },
      { number: 6, name: 'Consistency Engine', prereqPerks: [5], effect: '1 missed day/week won\'t break workout streak', type: 'passive' },
      { number: 7, name: 'Steel Body', prereqPerks: [4], prereqStats: { STR: 20 }, effect: '+15 Resistance', type: 'passive' },
      { number: 8, name: 'Power Surge', prereqPerks: [3], effect: 'STR×2 damage, 15 Energy', type: 'skill', skillName: 'Power Strike', skillEnergyCost: 15 },
      { number: 9, name: 'Recovery Master', prereqPerks: [5], prereqStats: { END: 15 }, effect: 'Rest days grant 2× END XP', type: 'passive' },
      { number: 10, name: "Titan's Resolve", prereqPerks: [7, 8], prereqLevel: 20, effect: '+50% damage 3 turns, 30 Energy', type: 'skill', skillName: 'Titan Mode', skillEnergyCost: 30 },
    ],
  },
  {
    id: 'sage',
    name: "Sage's Path",
    stats: ['WIS', 'FAI'],
    perks: [
      { number: 1, name: 'Deep Thinker', prereqPerks: [], effect: '+10% WIS XP from journal', type: 'passive' },
      { number: 2, name: 'Truth Seeker', prereqPerks: [1], effect: 'Equipped Truths +5% buff', type: 'passive' },
      { number: 3, name: 'Inner Light', prereqPerks: [], effect: '+10% FAI XP from prayer', type: 'passive' },
      { number: 4, name: 'Clarity', prereqPerks: [1], prereqStats: { WIS: 10 }, effect: '+5% Crit chance', type: 'passive' },
      { number: 5, name: 'Stillness', prereqPerks: [3], prereqStats: { FAI: 10 }, effect: '+20 Resistance vs Tension Wraith', type: 'passive' },
      { number: 6, name: 'Archivist', prereqPerks: [2], effect: 'OCR journal → 2× WIS XP', type: 'passive' },
      { number: 7, name: 'Meditation Master', prereqPerks: [5], prereqStats: { FAI: 20 }, effect: '+10 starting Energy in battle', type: 'passive' },
      { number: 8, name: "Oracle's Sight", prereqPerks: [4, 6], effect: 'See enemy next move, 10 Energy', type: 'skill', skillName: 'Foresight', skillEnergyCost: 10 },
      { number: 9, name: 'Sermon of Calm', prereqPerks: [5], effect: 'Enemy attack -30% 2 turns, 12 Energy', type: 'skill', skillName: 'Calm Word', skillEnergyCost: 12 },
      { number: 10, name: "Sage's Transcendence", prereqPerks: [8, 7], prereqLevel: 25, effect: 'Full heal + clear debuffs, 35 Energy', type: 'skill', skillName: 'Enlightenment', skillEnergyCost: 35 },
    ],
  },
  {
    id: 'leader',
    name: "Leader's Path",
    stats: ['CHA', 'DIS', 'FOC'],
    perks: [
      { number: 1, name: 'Clear Voice', prereqPerks: [], effect: '+10% CHA XP from leadership', type: 'passive' },
      { number: 2, name: 'Task Master', prereqPerks: [], effect: '+10% DIS XP from tasks', type: 'passive' },
      { number: 3, name: 'Department Head', prereqPerks: [1], effect: 'Work Focus → 1.5× XP', type: 'passive' },
      { number: 4, name: 'Laser Focus', prereqPerks: [2], prereqStats: { FOC: 10 }, effect: 'High-priority task XP +25%', type: 'passive' },
      { number: 5, name: 'Rallying Cry', prereqPerks: [1], prereqStats: { CHA: 10 }, effect: 'Own attack +20% 2 turns, 10 Energy', type: 'skill', skillName: 'Rally', skillEnergyCost: 10 },
      { number: 6, name: 'Streak Commander', prereqPerks: [2], effect: '+1 streak protection/month', type: 'passive' },
      { number: 7, name: 'Flow State', prereqPerks: [4], prereqStats: { FOC: 20 }, effect: 'Deep work → 2× FOC XP', type: 'passive' },
      { number: 8, name: 'Executive Presence', prereqPerks: [3, 5], effect: 'Stun enemy 1 turn, 15 Energy', type: 'skill', skillName: 'Command', skillEnergyCost: 15 },
      { number: 9, name: 'Triple Threat', prereqPerks: [], effect: 'Top 3 completions → +10 all stat XP', type: 'passive' },
      { number: 10, name: "Commander's Authority", prereqPerks: [8, 7], prereqLevel: 25, effect: 'All stats +10% for encounter, 30 Energy', type: 'skill', skillName: 'Leadership Aura', skillEnergyCost: 30 },
    ],
  },
  {
    id: 'tuner',
    name: "Tuner's Path",
    stats: ['CRA', 'FOC'],
    perks: [
      { number: 1, name: 'Practiced Ear', prereqPerks: [], effect: '+10% CRA XP from audio reps', type: 'passive' },
      { number: 2, name: 'Micro Mastery', prereqPerks: [1], effect: 'Daily micro-practice → +25 CRA XP', type: 'passive' },
      { number: 3, name: 'Deep Dive', prereqPerks: [1], effect: 'Weekly deep practice → 2× CRA XP', type: 'passive' },
      { number: 4, name: 'Signal Clarity', prereqPerks: [2], prereqStats: { CRA: 10 }, effect: '+20 Resistance vs Signal Goblin', type: 'passive' },
      { number: 5, name: 'Sonic Strike', prereqPerks: [3], prereqStats: { CRA: 15 }, effect: 'CRA×2 damage, 15 Energy', type: 'skill', skillName: 'Resonance', skillEnergyCost: 15 },
      { number: 6, name: 'Flow of Sound', prereqPerks: [4, 5], effect: 'Audio + work focus combined → FOC bonus', type: 'passive' },
      { number: 7, name: 'Perfect Pitch', prereqPerks: [6], prereqStats: { CRA: 25 }, effect: 'Audio streaks → +10% CRA XP/week', type: 'passive' },
      { number: 8, name: 'Creative Burst', prereqPerks: [5], prereqStats: { CRA: 20 }, effect: 'Next 2 attacks +40%, 20 Energy', type: 'skill', skillName: 'Inspiration', skillEnergyCost: 20 },
      { number: 9, name: "Master's Technique", prereqPerks: [7, 8], prereqStats: { CRA: 35 }, effect: 'All CRA XP +25%', type: 'passive' },
      { number: 10, name: "Tuner's Zenith", prereqPerks: [9], prereqLevel: 30, effect: 'Ignore enemy defense 3 turns, 40 Energy', type: 'skill', skillName: 'Perfect Frequency', skillEnergyCost: 40 },
    ],
  },
  {
    id: 'steward',
    name: "Steward's Path",
    stats: ['STW', 'DIS'],
    perks: [
      { number: 1, name: 'Penny Wise', prereqPerks: [], effect: '+10% STW XP from Money Minute', type: 'passive' },
      { number: 2, name: 'Budget Hawk', prereqPerks: [1], effect: 'Weekly finance review → 2× STW XP', type: 'passive' },
      { number: 3, name: 'Debt Destroyer', prereqPerks: [1], effect: 'Debt payoff → bonus STW + DIS XP', type: 'passive' },
      { number: 4, name: 'Fiscal Shield', prereqPerks: [2], prereqStats: { STW: 10 }, effect: '+20 Resistance vs Budget Bandit', type: 'passive' },
      { number: 5, name: 'Calculated Strike', prereqPerks: [3], prereqStats: { STW: 15 }, effect: 'STW×2 damage, 15 Energy', type: 'skill', skillName: 'Audit', skillEnergyCost: 15 },
      { number: 6, name: 'Compound Interest', prereqPerks: [4, 5], effect: 'STW streaks → +5% STW XP/week', type: 'passive' },
      { number: 7, name: 'Financial Freedom', prereqPerks: [6], prereqStats: { STW: 25 }, effect: 'Unlock bonus Steward questlines', type: 'passive' },
      { number: 8, name: 'Resource Surge', prereqPerks: [5], prereqStats: { STW: 20 }, effect: 'Recover 20 Energy + 10 HP, 0 Energy (1/battle)', type: 'skill', skillName: 'Invest', skillEnergyCost: 0 },
      { number: 9, name: 'Master Steward', prereqPerks: [7, 8], prereqStats: { STW: 35 }, effect: 'All STW +25%', type: 'passive' },
      { number: 10, name: "Steward's Zenith", prereqPerks: [9], prereqLevel: 30, effect: 'Full HP + double next attack, 40 Energy', type: 'skill', skillName: 'Abundance', skillEnergyCost: 40 },
    ],
  },
]

export function getSkillTree(id: SkillTreeId): SkillTreeDefinition | undefined {
  return SKILL_TREES.find((t) => t.id === id)
}
