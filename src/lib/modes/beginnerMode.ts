import { db } from '@/lib/db'

// Beginner mode shows fewer modules and simpler UI
export interface BeginnerModeConfig {
  isActive: boolean
  // Modules enabled in beginner mode
  enabledModules: string[]
  // Simplified features
  hideAdvancedFeatures: boolean
  simplifiedEditLadder: boolean
}

// Default beginner config - only core modules
export const BEGINNER_DEFAULTS: BeginnerModeConfig = {
  isActive: true,
  enabledModules: ['workout', 'top3', 'journal'],
  hideAdvancedFeatures: true,
  simplifiedEditLadder: true,
}

// Activate beginner mode
export async function activateBeginnerMode(): Promise<void> {
  await db.appSettings.update('user-settings', {
    beginnerMode: true,
    updatedAt: new Date().toISOString(),
  })
  // Disable advanced templates
  const templates = await db.templates.filter(t => !t.deletedAt).toArray()
  const advancedTypes = ['charisma-deck', 'work-focus', 'audio-training', 'finance']
  for (const t of templates) {
    if (advancedTypes.includes(t.type)) {
      await db.templates.update(t.id, { isActive: false, updatedAt: new Date().toISOString() })
    }
  }
}

// Deactivate beginner mode (enable all modules)
export async function deactivateBeginnerMode(): Promise<void> {
  await db.appSettings.update('user-settings', {
    beginnerMode: false,
    updatedAt: new Date().toISOString(),
  })
  // Re-enable all templates
  const templates = await db.templates.filter(t => !t.deletedAt).toArray()
  for (const t of templates) {
    if (!t.isActive) {
      await db.templates.update(t.id, { isActive: true, updatedAt: new Date().toISOString() })
    }
  }
}

// Check if a feature should be shown
export function shouldShowFeature(feature: string, isBeginnerMode: boolean): boolean {
  if (!isBeginnerMode) return true
  const beginnerFeatures = new Set([
    'today-runway', 'top3', 'workout', 'journal',
    'basic-tasks', 'basic-progress',
  ])
  return beginnerFeatures.has(feature)
}
