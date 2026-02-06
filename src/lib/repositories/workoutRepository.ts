import { db } from '@/lib/db'
import type {
  Instance,
  InstanceEntry,
  TemplateItem,
  ExerciseHistory,
} from '@/lib/db/schema'
import { v4 as uuid } from 'uuid'

// ── Types ──

export interface ExerciseSetData {
  setNumber: number
  weight: number
  reps: number
  completed: boolean
}

export interface ExerciseSessionData {
  templateItem: TemplateItem
  sets: ExerciseSetData[]
  lastTime: { sets: ExerciseSetData[]; date: string } | null
  notes: string
  isCompleted: boolean
}

// ── Helpers ──

function now(): string {
  return new Date().toISOString()
}

/**
 * Extract sets from an instance entry's JSON data.
 * The data shape is: { sets: ExerciseSetData[], notes?: string, completed?: boolean }
 */
function parseSetsFromEntry(entry: InstanceEntry): ExerciseSetData[] {
  const data = entry.data as Record<string, unknown>
  const sets = data.sets as ExerciseSetData[] | undefined
  return sets ?? []
}

function parseNotesFromEntry(entry: InstanceEntry): string {
  const data = entry.data as Record<string, unknown>
  return (data.notes as string) ?? ''
}

function parseCompletedFromEntry(entry: InstanceEntry): boolean {
  const data = entry.data as Record<string, unknown>
  return (data.completed as boolean) ?? false
}

/**
 * Build default sets from a template item's config.
 * Uses defaultSets, defaultReps, and defaultWeight from config.
 */
function buildDefaultSets(templateItem: TemplateItem): ExerciseSetData[] {
  const config = templateItem.config as Record<string, unknown>
  const numSets = (config.defaultSets as number) ?? 3
  const defaultReps = (config.defaultReps as number) ?? 10
  const defaultWeight = (config.defaultWeight as number) ?? 0

  return Array.from({ length: numSets }, (_, i) => ({
    setNumber: i + 1,
    weight: defaultWeight,
    reps: defaultReps,
    completed: false,
  }))
}

/**
 * Find the instance entry for a given instance + template item.
 */
async function findEntry(
  instanceId: string,
  templateItemId: string,
): Promise<InstanceEntry | undefined> {
  return db.instanceEntries
    .where('instanceId')
    .equals(instanceId)
    .filter((e) => e.templateItemId === templateItemId && !e.deletedAt)
    .first()
}

// ── 1. getWorkoutInstance ──

export async function getWorkoutInstance(
  instanceId: string,
): Promise<Instance | undefined> {
  return db.instances.get(instanceId)
}

// ── 2. getExercisesForInstance ──

export async function getExercisesForInstance(
  instanceId: string,
): Promise<ExerciseSessionData[]> {
  const instance = await db.instances.get(instanceId)
  if (!instance || !instance.templateId) return []

  // Get all template items for this workout, sorted by sortOrder
  const templateItems = await db.templateItems
    .where('templateId')
    .equals(instance.templateId)
    .filter((ti) => !ti.deletedAt)
    .sortBy('sortOrder')

  // Get all instance entries for this workout session
  const entries = await db.instanceEntries
    .where('instanceId')
    .equals(instanceId)
    .filter((e) => !e.deletedAt)
    .toArray()

  const entryByTemplateItem = new Map<string, InstanceEntry>()
  for (const entry of entries) {
    if (entry.templateItemId) {
      entryByTemplateItem.set(entry.templateItemId, entry)
    }
  }

  // Build the session data for each exercise
  const exercises: ExerciseSessionData[] = []

  for (const templateItem of templateItems) {
    const entry = entryByTemplateItem.get(templateItem.id)

    // Current session sets: from entry if it exists, otherwise default from template
    const sets = entry ? parseSetsFromEntry(entry) : buildDefaultSets(templateItem)
    const notes = entry ? parseNotesFromEntry(entry) : ''
    const isCompleted = entry ? parseCompletedFromEntry(entry) : false

    // Look up "last time" data
    const lastTime = await getLastTimeForExercise(
      templateItem.normalizedExerciseId ?? '',
      instance.templateId,
    )

    exercises.push({
      templateItem,
      sets,
      lastTime,
      notes,
      isCompleted,
    })
  }

  return exercises
}

// ── 3. getLastTimeForExercise ──

export async function getLastTimeForExercise(
  normalizedExerciseId: string,
  templateId?: string,
): Promise<{ sets: ExerciseSetData[]; date: string } | null> {
  if (!normalizedExerciseId) return null

  // Priority 1: same exercise in same template
  if (templateId) {
    const sameTemplate = await db.exerciseHistory
      .where('normalizedExerciseId')
      .equals(normalizedExerciseId)
      .filter((h) => h.templateId === templateId)
      .toArray()

    if (sameTemplate.length > 0) {
      // Sort by instanceDate descending to get most recent
      sameTemplate.sort((a, b) => b.instanceDate.localeCompare(a.instanceDate))
      const latest = sameTemplate[0]
      return {
        sets: latest.setsData.map((s) => ({
          setNumber: s.set,
          weight: s.weight,
          reps: s.reps,
          completed: s.completed,
        })),
        date: latest.instanceDate,
      }
    }
  }

  // Priority 2: same exercise anywhere
  const anyHistory = await db.exerciseHistory
    .where('normalizedExerciseId')
    .equals(normalizedExerciseId)
    .toArray()

  if (anyHistory.length > 0) {
    anyHistory.sort((a, b) => b.instanceDate.localeCompare(a.instanceDate))
    const latest = anyHistory[0]
    return {
      sets: latest.setsData.map((s) => ({
        setNumber: s.set,
        weight: s.weight,
        reps: s.reps,
        completed: s.completed,
      })),
      date: latest.instanceDate,
    }
  }

  return null
}

// ── 4. logSet ──

export async function logSet(
  instanceId: string,
  templateItemId: string,
  setData: ExerciseSetData,
): Promise<void> {
  const existing = await findEntry(instanceId, templateItemId)
  const timestamp = now()

  if (existing) {
    // Update the sets array — replace the set with the matching setNumber, or append
    const currentSets = parseSetsFromEntry(existing)
    const setIndex = currentSets.findIndex(
      (s) => s.setNumber === setData.setNumber,
    )

    if (setIndex >= 0) {
      currentSets[setIndex] = setData
    } else {
      currentSets.push(setData)
    }

    // Sort by setNumber for consistency
    currentSets.sort((a, b) => a.setNumber - b.setNumber)

    await db.instanceEntries.update(existing.id, {
      data: { ...existing.data, sets: currentSets },
      updatedAt: timestamp,
    })
  } else {
    // Create a new entry
    await db.instanceEntries.add({
      id: uuid(),
      instanceId,
      templateItemId,
      entryType: 'exercise',
      data: { sets: [setData], notes: '', completed: false },
      sortOrder: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }
}

// ── 5. toggleSetCompletion ──

export async function toggleSetCompletion(
  instanceId: string,
  templateItemId: string,
  setNumber: number,
): Promise<void> {
  const existing = await findEntry(instanceId, templateItemId)
  if (!existing) return

  const currentSets = parseSetsFromEntry(existing)
  const setIndex = currentSets.findIndex((s) => s.setNumber === setNumber)
  if (setIndex < 0) return

  currentSets[setIndex] = {
    ...currentSets[setIndex],
    completed: !currentSets[setIndex].completed,
  }

  await db.instanceEntries.update(existing.id, {
    data: { ...existing.data, sets: currentSets },
    updatedAt: now(),
  })
}

// ── 6. addNoteToExercise ──

export async function addNoteToExercise(
  instanceId: string,
  templateItemId: string,
  note: string,
): Promise<void> {
  const existing = await findEntry(instanceId, templateItemId)
  const timestamp = now()

  if (existing) {
    await db.instanceEntries.update(existing.id, {
      data: { ...existing.data, notes: note },
      updatedAt: timestamp,
    })
  } else {
    await db.instanceEntries.add({
      id: uuid(),
      instanceId,
      templateItemId,
      entryType: 'exercise',
      data: { sets: [], notes: note, completed: false },
      sortOrder: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }
}

// ── 7. completeWorkout ──

export async function completeWorkout(instanceId: string): Promise<void> {
  const instance = await db.instances.get(instanceId)
  if (!instance) return

  const timestamp = now()

  // Mark the instance as completed
  await db.instances.update(instanceId, {
    status: 'completed',
    completedAt: timestamp,
    updatedAt: timestamp,
  })

  // Save exercise history for each exercise in this workout
  if (!instance.templateId) return

  const templateItems = await db.templateItems
    .where('templateId')
    .equals(instance.templateId)
    .filter((ti) => !ti.deletedAt && !!ti.normalizedExerciseId)
    .toArray()

  const entries = await db.instanceEntries
    .where('instanceId')
    .equals(instanceId)
    .filter((e) => !e.deletedAt)
    .toArray()

  const entryByTemplateItem = new Map<string, InstanceEntry>()
  for (const entry of entries) {
    if (entry.templateItemId) {
      entryByTemplateItem.set(entry.templateItemId, entry)
    }
  }

  const historyRecords: ExerciseHistory[] = []

  for (const templateItem of templateItems) {
    const entry = entryByTemplateItem.get(templateItem.id)
    if (!entry) continue

    const sets = parseSetsFromEntry(entry)
    if (sets.length === 0) continue

    const notes = parseNotesFromEntry(entry)

    // Calculate best set (highest weight, then most reps)
    const completedSets = sets.filter((s) => s.completed)
    let bestSet: { weight: number; reps: number } | undefined
    if (completedSets.length > 0) {
      const sorted = [...completedSets].sort((a, b) => {
        if (b.weight !== a.weight) return b.weight - a.weight
        return b.reps - a.reps
      })
      bestSet = { weight: sorted[0].weight, reps: sorted[0].reps }
    }

    // Calculate total volume (weight x reps for all completed sets)
    const totalVolume = completedSets.reduce(
      (sum, s) => sum + s.weight * s.reps,
      0,
    )

    historyRecords.push({
      id: uuid(),
      normalizedExerciseId: templateItem.normalizedExerciseId!,
      variant: templateItem.variant,
      templateId: instance.templateId,
      instanceId,
      instanceDate: instance.instanceDate,
      setsData: sets.map((s) => ({
        set: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        completed: s.completed,
      })),
      bestSet,
      totalVolume,
      notes: notes || undefined,
      createdAt: timestamp,
    })
  }

  if (historyRecords.length > 0) {
    await db.exerciseHistory.bulkAdd(historyRecords)
  }

  // Mark all exercise entries as completed
  for (const entry of entries) {
    await db.instanceEntries.update(entry.id, {
      data: { ...entry.data, completed: true },
      updatedAt: timestamp,
    })
  }
}

// ── 8. prefillFromLastTime ──

export async function prefillFromLastTime(
  normalizedExerciseId: string,
  templateId?: string,
  weightIncrement?: number,
): Promise<ExerciseSetData[]> {
  const lastTime = await getLastTimeForExercise(
    normalizedExerciseId,
    templateId,
  )

  if (!lastTime) return []

  return lastTime.sets.map((s) => ({
    ...s,
    weight: weightIncrement ? s.weight + weightIncrement : s.weight,
    completed: false,
  }))
}

// ── 9. copyLastTime ──

export async function copyLastTime(
  instanceId: string,
  templateItemId: string,
): Promise<void> {
  const instance = await db.instances.get(instanceId)
  if (!instance) return

  // Get the template item to find the normalizedExerciseId
  const templateItem = await db.templateItems.get(templateItemId)
  if (!templateItem || !templateItem.normalizedExerciseId) return

  const lastTime = await getLastTimeForExercise(
    templateItem.normalizedExerciseId,
    instance.templateId,
  )
  if (!lastTime) return

  // Reset completed status on copied sets
  const copiedSets = lastTime.sets.map((s) => ({
    ...s,
    completed: false,
  }))

  const existing = await findEntry(instanceId, templateItemId)
  const timestamp = now()

  if (existing) {
    await db.instanceEntries.update(existing.id, {
      data: { ...existing.data, sets: copiedSets },
      updatedAt: timestamp,
    })
  } else {
    await db.instanceEntries.add({
      id: uuid(),
      instanceId,
      templateItemId,
      entryType: 'exercise',
      data: { sets: copiedSets, notes: '', completed: false },
      sortOrder: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }
}

// ── 10. incrementWeight ──

export async function incrementWeight(
  instanceId: string,
  templateItemId: string,
  increment: number,
): Promise<void> {
  const existing = await findEntry(instanceId, templateItemId)
  if (!existing) return

  const currentSets = parseSetsFromEntry(existing)

  const updatedSets = currentSets.map((s) =>
    s.completed ? s : { ...s, weight: s.weight + increment },
  )

  await db.instanceEntries.update(existing.id, {
    data: { ...existing.data, sets: updatedSets },
    updatedAt: now(),
  })
}
