import { v4 as uuid } from 'uuid'
import { db } from './index'
import type {
  Template,
  ScheduleRule,
  TemplateItem,
  CharismaReminder,
  Department,
  Tag,
  Task,
  AppSettings,
  TimeBlock,
  RepeatType,
} from './schema'

/* ============================================================
   SEED DATA — "John Starter" preset
   Populates the database with default templates, charisma
   reminders, departments, tags, settings, and sample tasks.
   ============================================================ */

const now = new Date().toISOString()
const today = new Date().toISOString().split('T')[0]

// ── Helper: Create a template + its schedule rule + its items ──

interface TemplateItemSeed {
  label: string
  normalizedExerciseId?: string
  itemType: string
  config: Record<string, unknown>
}

interface TemplateSeed {
  type: Template['type']
  name: string
  icon?: string
  config?: Record<string, unknown>
  sortOrder: number
  schedule: {
    daysOfWeek: number[]
    timeBlock: TimeBlock
    repeatType: RepeatType
  }
  items: TemplateItemSeed[]
}

function buildTemplate(seed: TemplateSeed): {
  template: Template
  rule: ScheduleRule
  items: TemplateItem[]
} {
  const templateId = uuid()

  const template: Template = {
    id: templateId,
    type: seed.type,
    name: seed.name,
    icon: seed.icon,
    isActive: true,
    config: seed.config ?? {},
    version: 1,
    sortOrder: seed.sortOrder,
    createdAt: now,
    updatedAt: now,
  }

  const rule: ScheduleRule = {
    id: uuid(),
    templateId,
    daysOfWeek: seed.schedule.daysOfWeek,
    timeBlock: seed.schedule.timeBlock,
    repeatType: seed.schedule.repeatType,
    effectiveFrom: today,
    createdAt: now,
    updatedAt: now,
  }

  const items: TemplateItem[] = seed.items.map((item, index) => ({
    id: uuid(),
    templateId,
    label: item.label,
    itemType: item.itemType,
    config: item.config,
    sortOrder: index,
    isOptional: false,
    normalizedExerciseId: item.normalizedExerciseId,
    createdAt: now,
    updatedAt: now,
  }))

  return { template, rule, items }
}

// ── Helper: Build a workout exercise item ──

function exercise(
  label: string,
  normalizedExerciseId: string,
  config: Record<string, unknown>
): TemplateItemSeed {
  return {
    label,
    normalizedExerciseId,
    itemType: 'exercise',
    config: { weightUnit: 'lbs', ...config },
  }
}

// ── Helper: Build a mobility item ──

function mobility(
  label: string,
  config: Record<string, unknown>
): TemplateItemSeed {
  return { label, itemType: 'mobility-move', config }
}

// ── Helper: Build a supplement item ──

function supplement(
  label: string,
  config: Record<string, unknown>
): TemplateItemSeed {
  return { label, itemType: 'supplement', config }
}

// ════════════════════════════════════════════════════════════════
//  Template definitions
// ════════════════════════════════════════════════════════════════

const templateSeeds: TemplateSeed[] = [
  // ── 1. Push Day ──
  {
    type: 'workout',
    name: 'Push Day',
    icon: '\u{1F4AA}',
    config: { dayLabel: 'Monday' },
    sortOrder: 0,
    schedule: { daysOfWeek: [1], timeBlock: 'workout', repeatType: 'specific-days' },
    items: [
      exercise('Incline DB Press', 'incline_db_press', { defaultSets: 3, defaultReps: 10, defaultWeight: 60 }),
      exercise('Flat DB Press', 'flat_db_press', { defaultSets: 3, defaultReps: 10, defaultWeight: 70 }),
      exercise('Pec Deck / Cable Fly', 'pec_deck_cable_fly', { defaultSets: 3, defaultReps: 12 }),
      exercise('DB Lateral Raises', 'db_lateral_raises', { defaultSets: 3, defaultReps: 12, defaultWeight: 20 }),
      exercise('Cable Rear Delt Fly', 'cable_rear_delt_fly', { defaultSets: 3, defaultReps: 15 }),
      exercise('DB Overhead Press', 'db_overhead_press', { defaultSets: 3, defaultReps: 10, defaultWeight: 40 }),
      exercise('Rope Pushdowns', 'rope_pushdowns', { defaultSets: 3, defaultReps: 12 }),
      exercise('Overhead Triceps Extension', 'overhead_triceps_extension', { defaultSets: 3, defaultReps: 12 }),
    ],
  },

  // ── 2. Pull Day ──
  {
    type: 'workout',
    name: 'Pull Day',
    icon: '\u{1F4AA}',
    config: { dayLabel: 'Wednesday' },
    sortOrder: 1,
    schedule: { daysOfWeek: [3], timeBlock: 'workout', repeatType: 'specific-days' },
    items: [
      exercise('Weighted Pull-Ups', 'weighted_pull_ups', { defaultSets: 3, defaultReps: 8 }),
      exercise('Barbell Row', 'barbell_row', { defaultSets: 3, defaultReps: 8, defaultWeight: 135 }),
      exercise('Chest-Supported Row', 'chest_supported_row', { defaultSets: 3, defaultReps: 10 }),
      exercise('Straight Arm Pulldown', 'straight_arm_pulldown', { defaultSets: 3, defaultReps: 12 }),
      exercise('Barbell Curl', 'barbell_curl', { defaultSets: 3, defaultReps: 10, defaultWeight: 65 }),
      exercise('Incline DB Curl', 'incline_db_curl', { defaultSets: 3, defaultReps: 10, defaultWeight: 25 }),
      exercise('Preacher Curl / Cable Curl', 'preacher_curl', { defaultSets: 3, defaultReps: 12 }),
    ],
  },

  // ── 3. Full Body + Arm Blast ──
  {
    type: 'workout',
    name: 'Full Body + Arm Blast',
    icon: '\u{1F4AA}',
    config: { dayLabel: 'Friday' },
    sortOrder: 2,
    schedule: { daysOfWeek: [5], timeBlock: 'workout', repeatType: 'specific-days' },
    items: [
      exercise('Trap Bar Deadlift', 'trap_bar_deadlift', { defaultSets: 3, defaultReps: 6, defaultWeight: 225 }),
      exercise('Front Squat', 'front_squat', { defaultSets: 3, defaultReps: 8, defaultWeight: 135 }),
      exercise('Hamstring Curl', 'hamstring_curl', { defaultSets: 3, defaultReps: 10, notes: 'slow eccentric' }),
      exercise('Standing Calf Raises', 'standing_calf_raises', { defaultSets: 3, defaultReps: 15 }),
      exercise('Standing Overhead Press', 'standing_overhead_press', { defaultSets: 3, defaultReps: 8, defaultWeight: 95 }),
      exercise('Superset: Rope Pushdown + EZ Bar Curl', 'rope_pushdown_ez_curl', { defaultSets: 3, defaultReps: 12, isSuperset: true }),
      exercise('Superset: Overhead Cable Extension + DB Hammer Curl', 'overhead_ext_hammer_curl', { defaultSets: 3, defaultReps: 12, isSuperset: true }),
      exercise('Hanging Leg Raises', 'hanging_leg_raises', { defaultSets: 3, defaultReps: 12 }),
      exercise('Pallof Press', 'pallof_press', { defaultSets: 3, defaultReps: 10 }),
    ],
  },

  // ── 4. Morning Mobility ──
  {
    type: 'mobility',
    name: 'Morning Mobility',
    icon: '\u{1F9D8}',
    sortOrder: 3,
    schedule: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], timeBlock: 'morning', repeatType: 'daily' },
    items: [
      mobility('Wall posture reset', { durationSeconds: 60, duration: '1 min' }),
      mobility('Cat-Cow', { durationSeconds: 45, duration: '6-8 reps' }),
      mobility('Hip flexor stretch', { durationSeconds: 60, duration: '30 sec/side' }),
      mobility('Deep nasal breathing', { durationSeconds: 90, duration: '1-2 min' }),
    ],
  },

  // ── 5. Evening Mobility ──
  {
    type: 'mobility',
    name: 'Evening Mobility',
    icon: '\u{1F9D8}',
    sortOrder: 4,
    schedule: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], timeBlock: 'evening', repeatType: 'daily' },
    items: [
      mobility('Deep squat hold', { durationSeconds: 90, duration: '1-2 min' }),
      mobility('Couch stretch', { durationSeconds: 90, duration: '45-60 sec/side' }),
      mobility('Supine spinal twist', { durationSeconds: 60, duration: '30 sec/side' }),
      mobility('Box breathing', { durationSeconds: 150, duration: '2-3 min' }),
    ],
  },

  // ── 6. Morning Supplements ──
  {
    type: 'supplements',
    name: 'Morning Supplements',
    icon: '\u{1F48A}',
    sortOrder: 5,
    schedule: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], timeBlock: 'morning', repeatType: 'daily' },
    items: [
      supplement('Creatine', { dosage: '5g' }),
      supplement('Glutamine', { dosage: '5g', timing: 'empty stomach' }),
      supplement('Tyrosine', { dosage: '500-1000mg', timing: 'empty stomach' }),
      supplement('Rhodiola', { dosage: '200-400mg', timing: 'empty stomach' }),
      supplement("Lion's Mane", { dosage: '500-1000mg' }),
      supplement('Vitamin D3 + K2', { dosage: '5000 IU / 180mcg', timing: 'with fat meal' }),
    ],
  },

  // ── 7. Midday Supplements ──
  {
    type: 'supplements',
    name: 'Midday Supplements',
    icon: '\u{1F48A}',
    sortOrder: 6,
    schedule: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], timeBlock: 'midday', repeatType: 'daily' },
    items: [
      supplement('Fish Oil', { dosage: '3g EPA/DHA', timing: 'with fat meal' }),
      supplement('Curcumin + Black Pepper', { dosage: '500-1000mg + piperine', timing: 'with fat meal' }),
    ],
  },

  // ── 8. Pre-Workout ──
  {
    type: 'supplements',
    name: 'Pre-Workout',
    icon: '\u{1F48A}',
    sortOrder: 7,
    schedule: { daysOfWeek: [1, 3, 5], timeBlock: 'workout', repeatType: 'specific-days' },
    items: [
      supplement('Alpha GPC', { dosage: '300-600mg', timing: '30-60 min pre' }),
    ],
  },

  // ── 9. Night Supplements ──
  {
    type: 'supplements',
    name: 'Night Supplements',
    icon: '\u{1F48A}',
    sortOrder: 8,
    schedule: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], timeBlock: 'evening', repeatType: 'daily' },
    items: [
      supplement('Glutamine', { dosage: '5g', timing: 'empty stomach' }),
      supplement('Ashwagandha', { dosage: '500-600mg', timing: 'with dinner' }),
      supplement('Zinc', { dosage: '25-30mg', timing: 'with food' }),
      supplement('Magnesium', { dosage: '300-400mg' }),
    ],
  },

  // ── 10. Charisma Deck ──
  {
    type: 'charisma-deck',
    name: 'Charisma Reminders',
    icon: '\u{2728}',
    sortOrder: 9,
    schedule: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], timeBlock: 'morning', repeatType: 'daily' },
    items: [], // charisma reminders live in their own table
  },
]

// ════════════════════════════════════════════════════════════════
//  Charisma Reminders (30 items)
// ════════════════════════════════════════════════════════════════

interface CharismaReminderSeed {
  text: string
  theme: string
}

const charismaReminderSeeds: CharismaReminderSeed[] = [
  // Presence (1-6)
  { text: '3-Second Arrival: pause \u2192 stack posture \u2192 warm eyes \u2192 speak one clear sentence.', theme: 'Presence' },
  { text: 'Tall spine, heavy feet, soft shoulders.', theme: 'Presence' },
  { text: 'Slow your walk 10%. Calm reads as confident.', theme: 'Presence' },
  { text: 'Chest open, chin level, eyes on horizon.', theme: 'Presence' },
  { text: 'Jaw unclenched + brow smooth. Your face sets the room.', theme: 'Presence' },
  { text: 'Hands neutral (not busy, not guarded).', theme: 'Presence' },

  // Voice (7-12)
  { text: 'Calm interest face: soft eyes + micro-smile.', theme: 'Voice' },
  { text: 'Voice anchor: exhale once \u2192 speak 10% slower \u2192 end sentences downward.', theme: 'Voice' },
  { text: 'One thought per sentence. Short beats feel confident.', theme: 'Voice' },
  { text: 'Stop talking one beat sooner. Silence = authority.', theme: 'Voice' },
  { text: "Lower pitch slightly on key points (don't push volume).", theme: 'Voice' },
  { text: "Don't rush the first 5 seconds. Start steady.", theme: 'Voice' },

  // Warmth (13-16)
  { text: 'Lead with warmth, then show competence.', theme: 'Warmth' },
  { text: "Name + warmth: 'Good to see you, [Name].'", theme: 'Warmth' },
  { text: "Validation before solution: 'That makes sense.' then solve.", theme: 'Warmth' },
  { text: "Make people feel safe first. Then they'll follow.", theme: 'Warmth' },

  // Listening (17-20)
  { text: '2-Beat Listen: finish \u2192 pause \u2192 reflect \u2192 ask one question.', theme: 'Listening' },
  { text: 'Repeat their last 3\u20135 words as a question.', theme: 'Listening' },
  { text: "Summarize: 'So what I'm hearing is\u2026'", theme: 'Listening' },
  { text: 'Curious question > quick advice.', theme: 'Listening' },

  // Authority (21-26)
  { text: "Match energy, don't mirror anxiety.", theme: 'Authority' },
  { text: 'One direct ask today: clear, kind, firm.', theme: 'Authority' },
  { text: "Clean No: 'I can't do that, but I can do this.'", theme: 'Authority' },
  { text: "State the standard: 'Here's what done looks like.'", theme: 'Authority' },
  { text: "Use 'because' once, not a long defense.", theme: 'Authority' },
  { text: 'If it matters, say it once plainly.', theme: 'Authority' },

  // Regulation (27-29)
  { text: 'Heat rising: exhale \u2192 drop shoulders \u2192 slow down.', theme: 'Regulation' },
  { text: 'Powerful voice \u2260 loud voice.', theme: 'Regulation' },
  { text: 'Your face can sound like yelling \u2014 soft eyes, loose jaw.', theme: 'Regulation' },

  // Ritual (30)
  { text: 'Shutdown + reset: note wins + plan tomorrow + brief prayer/breath.', theme: 'Ritual' },
]

// ════════════════════════════════════════════════════════════════
//  Departments
// ════════════════════════════════════════════════════════════════

const departmentSeeds = [
  { name: 'Leadership/Admin', sortOrder: 0 },
  { name: 'Audio', sortOrder: 1 },
  { name: 'Worship', sortOrder: 2 },
  { name: 'Production', sortOrder: 3 },
  { name: 'Chapel', sortOrder: 4 },
]

// ════════════════════════════════════════════════════════════════
//  Default Tags
// ════════════════════════════════════════════════════════════════

const tagSeeds = [
  { name: 'Faith/Prayer', keywords: ['prayer', 'pray', 'God', 'faith', 'scripture', 'Bible', 'devotion', 'worship', 'spirit', 'blessing', 'grace', 'meditation'] },
  { name: 'Leadership/Admin', keywords: ['leadership', 'lead', 'team', 'meeting', 'strategy', 'vision', 'delegate', 'manage', 'admin', 'decision'] },
  { name: 'Family', keywords: ['family', 'wife', 'husband', 'kids', 'children', 'mom', 'dad', 'parent', 'home', 'dinner'] },
  { name: 'Audio', keywords: ['audio', 'sound', 'mix', 'speaker', 'monitor', 'mic', 'cable', 'eq', 'gain', 'signal'] },
  { name: 'Worship', keywords: ['worship', 'song', 'setlist', 'rehearsal', 'music', 'chord', 'lyric', 'band'] },
  { name: 'Production', keywords: ['production', 'stage', 'lights', 'video', 'camera', 'screen', 'graphics', 'slides'] },
  { name: 'Chapel', keywords: ['chapel', 'service', 'congregation', 'ministry', 'volunteer', 'event'] },
  { name: 'Finances', keywords: ['money', 'budget', 'expense', 'cost', 'income', 'savings', 'invest', 'bill', 'payment'] },
  { name: 'Health/Fitness', keywords: ['workout', 'exercise', 'gym', 'run', 'swim', 'stretch', 'mobility', 'supplement', 'sleep', 'nutrition'] },
  { name: 'Other', keywords: [] },
]

// ════════════════════════════════════════════════════════════════
//  Sample Tasks
// ════════════════════════════════════════════════════════════════

const taskSeeds: Array<{
  title: string
  priority: Task['priority']
  isTop3: boolean
  tags: string[]
  dueTime?: string
}> = [
  { title: 'Confirm volunteer schedule', priority: 'p1', isTop3: true, tags: ['Chapel'] },
  { title: 'Review chapel AV setup notes', priority: 'p1', isTop3: true, tags: ['Audio', 'Chapel'] },
  { title: 'Call mom', priority: 'p2', isTop3: true, tags: ['Family'], dueTime: '18:00' },
  { title: 'Pick up dry cleaning', priority: 'p3', isTop3: false, tags: [] },
  { title: "Reply to pastor's email", priority: 'p2', isTop3: false, tags: ['Chapel', 'Leadership'] },
]

// ════════════════════════════════════════════════════════════════
//  Main seed function
// ════════════════════════════════════════════════════════════════

export async function seedDatabase(): Promise<void> {
  // Check if data already exists
  const existingCount = await db.templates.count()
  if (existingCount > 0) {
    return
  }

  await db.transaction(
    'rw',
    [
      db.templates,
      db.scheduleRules,
      db.templateItems,
      db.charismaReminders,
      db.departments,
      db.tags,
      db.tasks,
      db.appSettings,
    ],
    async () => {
      // ── A) Templates + ScheduleRules + TemplateItems ──

      const allTemplates: Template[] = []
      const allRules: ScheduleRule[] = []
      const allItems: TemplateItem[] = []

      for (const seed of templateSeeds) {
        const { template, rule, items } = buildTemplate(seed)
        allTemplates.push(template)
        allRules.push(rule)
        allItems.push(...items)
      }

      await db.templates.bulkAdd(allTemplates)
      await db.scheduleRules.bulkAdd(allRules)
      await db.templateItems.bulkAdd(allItems)

      // ── B) Charisma Reminders ──

      const charismaReminders: CharismaReminder[] = charismaReminderSeeds.map(
        (seed) => ({
          id: uuid(),
          text: seed.text,
          theme: seed.theme,
          isDefault: true,
          isCustom: false,
          isFavorited: false,
          createdAt: now,
        })
      )

      await db.charismaReminders.bulkAdd(charismaReminders)

      // ── C) Departments ──

      const departments: Department[] = departmentSeeds.map((seed) => ({
        id: uuid(),
        name: seed.name,
        sortOrder: seed.sortOrder,
        createdAt: now,
        updatedAt: now,
      }))

      await db.departments.bulkAdd(departments)

      // ── D) Default Tags ──

      const tags: Tag[] = tagSeeds.map((seed) => ({
        id: uuid(),
        name: seed.name,
        isDefault: true,
        keywords: seed.keywords,
        createdAt: now,
      }))

      await db.tags.bulkAdd(tags)

      // ── E) App Settings ──

      const settings: AppSettings = {
        id: 'user-settings',
        notificationPrefs: {
          amAnchorTime: '07:00',
          pmAnchorTime: '21:00',
          quietHoursStart: '22:00',
          quietHoursEnd: '07:00',
          taskReminders: true,
        },
        workoutPrefs: {
          autoPrefillLastTime: true,
          defaultRestSeconds: 90,
          weightIncrement: 5,
          weightUnit: 'lbs',
        },
        todayPrefs: {
          preset: 'standard',
          busyDayActive: false,
        },
        beginnerMode: true,
        onboardingComplete: false,
        onboardingPreset: 'john-starter',
        updatedAt: now,
      }

      await db.appSettings.add(settings)

      // ── F) Sample Tasks ──

      const tasks: Task[] = taskSeeds.map((seed, index) => ({
        id: uuid(),
        title: seed.title,
        scheduledDate: today,
        priority: seed.priority,
        isTop3: seed.isTop3,
        top3Date: seed.isTop3 ? today : undefined,
        status: 'active' as const,
        sortOrder: index,
        tags: seed.tags,
        dueTime: seed.dueTime,
        createdAt: now,
        updatedAt: now,
      }))

      await db.tasks.bulkAdd(tasks)
    }
  )
}
