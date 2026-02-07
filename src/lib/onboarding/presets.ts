import { db } from '@/lib/db'

export type OnboardingPreset = 'john-starter' | 'minimal' | 'empty'

export interface PresetConfig {
  id: OnboardingPreset
  name: string
  description: string
  icon: string
  todayPreset: 'minimal' | 'standard' | 'full'
  beginnerMode: boolean
  enabledModuleTypes: string[]
}

export const PRESETS: PresetConfig[] = [
  {
    id: 'john-starter',
    name: 'Full Setup',
    description: 'All modules enabled with sample data. Best for power users.',
    icon: '🚀',
    todayPreset: 'full',
    beginnerMode: false,
    enabledModuleTypes: ['workout', 'mobility', 'supplements', 'charisma-deck', 'work-focus', 'audio-training', 'finance'],
  },
  {
    id: 'minimal',
    name: 'Quick Start',
    description: 'Tasks, workouts, and journal only. Perfect to start simple.',
    icon: '✨',
    todayPreset: 'standard',
    beginnerMode: true,
    enabledModuleTypes: ['workout', 'supplements'],
  },
  {
    id: 'empty',
    name: 'Blank Slate',
    description: 'Start from scratch. Build your own system.',
    icon: '📋',
    todayPreset: 'minimal',
    beginnerMode: false,
    enabledModuleTypes: [],
  },
]

// Apply a preset to the app
export async function applyPreset(preset: OnboardingPreset): Promise<void> {
  const config = PRESETS.find(p => p.id === preset)
  if (!config) return

  const now = new Date().toISOString()

  // Update app settings (use get+put to handle the case where the record
  // might not exist yet, since Dexie's update() silently no-ops on missing keys)
  const existing = await db.appSettings.get('user-settings')
  if (existing) {
    await db.appSettings.update('user-settings', {
      onboardingComplete: true,
      onboardingPreset: preset,
      beginnerMode: config.beginnerMode,
      todayPrefs: { ...existing.todayPrefs, preset: config.todayPreset },
      updatedAt: now,
    })
  } else {
    await db.appSettings.put({
      id: 'user-settings',
      onboardingComplete: true,
      onboardingPreset: preset,
      beginnerMode: config.beginnerMode,
      notificationPrefs: { amAnchorTime: '07:00', pmAnchorTime: '21:00', quietHoursStart: '22:00', quietHoursEnd: '07:00', taskReminders: true },
      workoutPrefs: { autoPrefillLastTime: true, defaultRestSeconds: 90, weightIncrement: 5, weightUnit: 'lbs' },
      todayPrefs: { preset: config.todayPreset, busyDayActive: false },
      updatedAt: now,
    })
  }

  // Enable/disable templates based on preset
  const templates = await db.templates.filter(t => !t.deletedAt).toArray()
  for (const t of templates) {
    const shouldBeActive = config.enabledModuleTypes.includes(t.type)
    if (t.isActive !== shouldBeActive) {
      await db.templates.update(t.id, { isActive: shouldBeActive, updatedAt: now })
    }
  }
}

// Check if onboarding is complete
export async function isOnboardingComplete(): Promise<boolean> {
  const settings = await db.appSettings.get('user-settings')
  return settings?.onboardingComplete ?? false
}
