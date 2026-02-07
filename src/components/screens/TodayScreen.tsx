'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Header from '@/components/layout/Header'
import BlockHeader from '@/components/layout/BlockHeader'
import EditLadderSheet from '@/components/layout/EditLadderSheet'
import TaskDetailSheet from '@/components/layout/TaskDetailSheet'
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon, XIcon } from '@/components/ui/Icons'
import { GlassButton } from '@/components/ui/GlassButton'
import { db } from '@/lib/db'
import { getDateStr } from '@/lib/engine/todayGenerator'
import { Top3Card } from '@/components/cards/Top3Card'
import { CharismaCard } from '@/components/cards/CharismaCard'
import { MobilityCard } from '@/components/cards/MobilityCard'
import { SupplementCard } from '@/components/cards/SupplementCard'
import { JournalCard } from '@/components/cards/JournalCard'
import { WorkFocusCard } from '@/components/cards/WorkFocusCard'
import { DailyTodoCard } from '@/components/cards/DailyTodoCard'
import { WorkoutCard } from '@/components/cards/WorkoutCard'
import { MoneyMinuteCard } from '@/components/cards/MoneyMinuteCard'
import WorkoutSessionScreen from '@/components/screens/WorkoutSessionScreen'
import { GlassSheet } from '@/components/ui/GlassSheet'
import { useToday } from '@/hooks/useToday'
import { useJournal } from '@/hooks/useJournal'
import { useSupportingModules } from '@/hooks/useSupportingModules'
import { useInstanceEntries } from '@/hooks/useInstanceEntries'
import useAuth from '@/hooks/useAuth'
import {
  updateTask as repoUpdateTask,
  deleteTask as repoDeleteTask,
  promoteToTop3 as repoPromoteToTop3,
  demoteFromTop3 as repoDemoteFromTop3,
} from '@/lib/repositories/taskRepository'
import type { Instance, Task, Priority } from '@/lib/db/schema'
import type { TimeBlock } from '@/lib/db/schema'

// ── Priority converter: 'p1'|'p2'|'p3' → 1|2|3 ──
function priorityToNumber(p: Priority): 1 | 2 | 3 {
  const map: Record<Priority, 1 | 2 | 3> = { p1: 1, p2: 2, p3: 3 }
  return map[p]
}

// ── Format date for header ──
function formatHeaderDate(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return getDateStr(d)
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

interface TodayScreenProps {
  onSearchPress?: () => void
  onTabChange?: (tab: import('@/types').TabId) => void
}

export default function TodayScreen({ onSearchPress, onTabChange }: TodayScreenProps) {
  const todayDateStr = useMemo(() => getDateStr(), [])
  const [viewDate, setViewDate] = useState(todayDateStr)
  const isToday = viewDate === todayDateStr

  const today = useToday(viewDate)
  const dateStr = viewDate
  const journal = useJournal(dateStr)
  const supporting = useSupportingModules(dateStr)
  const auth = useAuth()

  const goToPrevDay = useCallback(() => setViewDate(d => addDaysToDate(d, -1)), [])
  const goToNextDay = useCallback(() => setViewDate(d => addDaysToDate(d, 1)), [])
  const goToToday = useCallback(() => setViewDate(todayDateStr), [todayDateStr])

  // Journal section values from live data
  const journalAm = journal.entry?.sections?.prayer ?? ''
  const journalPm = journal.entry?.sections?.gratitude ?? ''

  // Workout session state
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null)

  // Settings sheet state
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Task detail sheet state
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const handleTaskTap = useCallback((taskId: string) => {
    const task = today.tasks.find((t) => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setTaskDetailOpen(true)
    }
  }, [today.tasks])

  const handleCloseTaskDetail = useCallback(() => {
    setTaskDetailOpen(false)
    setSelectedTask(null)
  }, [])

  const handleUpdateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    await repoUpdateTask(id, updates)
  }, [])

  const handleDeleteTask = useCallback(async (id: string) => {
    await repoDeleteTask(id)
    setTaskDetailOpen(false)
    setSelectedTask(null)
  }, [])

  const handlePromoteTop3 = useCallback(async (id: string) => {
    await repoPromoteToTop3(id, dateStr)
  }, [dateStr])

  const handleDemoteTop3 = useCallback(async (id: string) => {
    await repoDemoteFromTop3(id)
  }, [])

  // Module action sheet state
  const [moduleAction, setModuleAction] = useState<{ isOpen: boolean; instance: Instance | null }>({
    isOpen: false,
    instance: null,
  })

  const openModuleActions = useCallback((inst: Instance) => {
    setModuleAction({ isOpen: true, instance: inst })
  }, [])

  const closeModuleActions = useCallback(() => {
    setModuleAction({ isOpen: false, instance: null })
  }, [])

  const removeInstance = useCallback(async (instanceId: string) => {
    const now = new Date().toISOString()
    await db.instances.update(instanceId, { deletedAt: now, updatedAt: now })
    closeModuleActions()
  }, [closeModuleActions])

  // Edit Ladder state
  const [editLadder, setEditLadder] = useState<{ isOpen: boolean; title: string }>({
    isOpen: false,
    title: '',
  })

  // Collect instance IDs for entry tracking
  const instanceIds = useMemo(
    () => today.instances.map((i) => i.id),
    [today.instances]
  )
  const completedEntries = useInstanceEntries(instanceIds)

  // Group instances by time block
  const blockInstances = useMemo(() => {
    const blocks: Record<TimeBlock, Instance[]> = {
      morning: [],
      midday: [],
      workout: [],
      evening: [],
    }
    for (const inst of today.instances) {
      if (blocks[inst.timeBlock]) {
        blocks[inst.timeBlock].push(inst)
      }
    }
    return blocks
  }, [today.instances])

  const headerDate = useMemo(() => formatHeaderDate(viewDate), [viewDate])
  const greetingText = useMemo(() => getGreeting(), [])

  // ── Card Prop Builders ──

  const buildMobilityItems = useCallback(
    (instance: Instance) => {
      const items = today.templateItems[instance.templateId ?? ''] ?? []
      const completed = completedEntries[instance.id] ?? new Set()
      return items.map((item) => ({
        id: item.id,
        name: item.label,
        duration: (item.config.duration as string) ?? '',
        durationSeconds: (item.config.durationSeconds as number) ?? 0,
        isCompleted: completed.has(item.id),
      }))
    },
    [today.templateItems, completedEntries]
  )

  const buildSupplementItems = useCallback(
    (instance: Instance) => {
      const items = today.templateItems[instance.templateId ?? ''] ?? []
      const completed = completedEntries[instance.id] ?? new Set()
      return items.map((item) => ({
        id: item.id,
        name: item.label,
        dosage: (item.config.dosage as string) ?? '',
        timing: item.config.timing as string | undefined,
        isChecked: completed.has(item.id),
      }))
    },
    [today.templateItems, completedEntries]
  )

  const buildWorkoutExercises = useCallback(
    (instance: Instance): string[] => {
      const items = today.templateItems[instance.templateId ?? ''] ?? []
      return items.map((item) => item.label)
    },
    [today.templateItems]
  )

  // ── Top 3 + Tasks for card props ──
  const top3ForCard = useMemo(
    () =>
      today.top3Tasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: priorityToNumber(t.priority),
        dueTime: t.dueTime,
        isCompleted: t.status === 'completed',
      })),
    [today.top3Tasks]
  )

  const tasksForCard = useMemo(
    () =>
      today.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: priorityToNumber(t.priority),
        dueTime: t.dueTime,
        isCompleted: t.status === 'completed',
      })),
    [today.tasks]
  )

  // Work focus items from live db (fallback to defaults if none set yet)
  const workFocusItems = supporting.workFocusItems.length > 0
    ? supporting.workFocusItems
    : ['Finalize chapel AV plan', 'Prep worship night set', 'Review Q1 audio budget']

  const totalItems = today.instances.length + today.tasks.length
  const noop = useCallback(() => {}, [])
  const goToJournal = useCallback(() => onTabChange?.('journal'), [onTabChange])
  const goToTasks = useCallback(() => onTabChange?.('tasks'), [onTabChange])

  const handleToggleItem = useCallback(
    (instanceId: string) => (itemId: string) => {
      today.toggleTemplateItem(instanceId, itemId)
    },
    [today.toggleTemplateItem]
  )

  const handleEditLadder = useCallback(
    (title: string) => () => {
      setEditLadder({ isOpen: true, title })
    },
    []
  )

  // ── Render a single instance card ──
  const renderCard = useCallback(
    (instance: Instance) => {
      switch (instance.cardType) {
        case 'charisma': {
          const reminder = today.selectedCharisma
          const reminderId = reminder?.id
          return (
            <CharismaCard
              key={instance.id}
              text={reminder?.text ?? 'No reminder available today.'}
              theme={reminder?.theme ?? 'Presence'}
              onGotIt={() => reminderId && supporting.charismaGotIt(reminderId, instance.id)}
              onPin={() => reminderId && supporting.charismaPin(reminderId, 3)}
              onSwap={() => reminderId && supporting.charismaSwap(instance.id, reminderId)}
              onFavorite={() => reminderId && supporting.charismaFavorite(reminderId)}
            />
          )
        }

        case 'mobility':
          return (
            <MobilityCard
              key={instance.id}
              title={instance.title}
              items={buildMobilityItems(instance)}
              onToggleItem={handleToggleItem(instance.id)}
            />
          )

        case 'supplements':
          return (
            <SupplementCard
              key={instance.id}
              title={instance.title}
              items={buildSupplementItems(instance)}
              onToggleItem={handleToggleItem(instance.id)}
            />
          )

        case 'workout': {
          const exercises = buildWorkoutExercises(instance)
          const dayLabel =
            (instance.configOverride?.dayLabel as string) ??
            instance.subtitle?.split('·')[0]?.trim() ??
            ''
          return (
            <WorkoutCard
              key={instance.id}
              name={instance.title}
              dayLabel={dayLabel}
              exerciseCount={exercises.length}
              exercises={exercises}
              status={instance.status === 'in-progress' ? 'in-progress' : instance.status === 'completed' ? 'completed' : 'pending'}
              onStart={() => setWorkoutSessionId(instance.id)}
            />
          )
        }

        case 'money-minute':
          return (
            <MoneyMinuteCard
              key={instance.id}
              onSave={(amount, category, note) => supporting.saveMoney(amount, category, note)}
            />
          )

        case 'work-focus':
          return (
            <WorkFocusCard
              key={instance.id}
              items={workFocusItems}
              onViewAll={noop}
            />
          )

        default:
          return null
      }
    },
    [
      today.selectedCharisma,
      buildMobilityItems,
      buildSupplementItems,
      buildWorkoutExercises,
      handleToggleItem,
      workFocusItems,
      supporting,
      noop,
    ]
  )

  // ── Loading state ──
  if (today.isLoading) {
    return (
      <div style={{ height: '100%', overflow: 'auto' }}>
        <Header title={headerDate} syncStatus="syncing" />
        <div style={{ padding: '0 var(--space-4)' }}>
          <div
            style={{
              padding: 'var(--space-4) var(--space-1)',
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 100ms both',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--weight-semibold)' as unknown as number,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {greetingText}, John
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Loading your day...
            </p>
          </div>
          {/* Skeleton cards */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-shimmer"
              style={{
                height: '80px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--glass-bg-primary)',
                border: '1px solid var(--glass-border)',
                marginBottom: 'var(--space-3)',
                opacity: 0,
                animation: `settle-in var(--duration-settle) var(--ease-out) ${200 + i * 100}ms both`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Block rendering helper ──
  function renderBlock(block: TimeBlock, delay: number) {
    const instances = blockInstances[block]
    if (instances.length === 0) return null

    // Add journal cards for morning and evening blocks
    const hasJournal = block === 'morning' || block === 'evening'

    return (
      <React.Fragment key={block}>
        <BlockHeader block={block} animationDelay={delay} />
        <CardStack>
          {instances.map((inst) => (
            <div key={`wrap-${inst.id}`} style={{ position: 'relative' }}>
              {renderCard(inst)}
              <button
                onClick={() => openModuleActions(inst)}
                aria-label={`Actions for ${inst.title}`}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--glass-bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  zIndex: 2,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <MoreHorizontalIcon size={16} color="var(--text-tertiary)" />
              </button>
            </div>
          ))}
          {block === 'morning' && (
            <JournalCard
              title="Morning Journal"
              prompt="Set your intention for today..."
              value={journalAm}
              onChange={(text) => journal.updateSection('prayer', text)}
              onExpand={goToJournal}
            />
          )}
          {block === 'midday' && (
            <DailyTodoCard
              tasks={tasksForCard}
              onToggleTask={today.toggleTask}
              onTaskTap={handleTaskTap}
              onViewAll={goToTasks}
            />
          )}
          {block === 'evening' && (
            <JournalCard
              title="Evening Journal"
              prompt="3 things you're grateful for..."
              value={journalPm}
              onChange={(text) => journal.updateSection('gratitude', text)}
              onExpand={goToJournal}
            />
          )}
        </CardStack>
      </React.Fragment>
    )
  }

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(var(--tabbar-height) + var(--space-8))',
      }}
    >
      <Header
        title={headerDate}
        syncStatus="synced"
        onSearchPress={onSearchPress}
        onSettingsPress={() => setSettingsOpen(true)}
      />

      <div style={{ padding: '0 var(--space-4)' }}>
        {/* ── Greeting ── */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-1) var(--space-2)',
            opacity: 0,
            animation: 'settle-in var(--duration-settle) var(--ease-out) 100ms both',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)' as unknown as number,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {greetingText}, John
          </h2>
          {/* ── Day Navigation ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              margin: 'var(--space-2) 0 0',
            }}
          >
            <button
              onClick={goToPrevDay}
              aria-label="Previous day"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-full)',
                background: 'var(--glass-bg-secondary)',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                padding: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <ChevronLeftIcon size={16} color="var(--text-secondary)" />
            </button>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)' as unknown as number,
                color: 'var(--text-secondary)',
                minWidth: 0,
              }}
            >
              {headerDate}
            </span>
            <button
              onClick={goToNextDay}
              aria-label="Next day"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-full)',
                background: 'var(--glass-bg-secondary)',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                padding: 0,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <ChevronRightIcon size={16} color="var(--text-secondary)" />
            </button>
            {!isToday && (
              <button
                onClick={goToToday}
                style={{
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-subtle)',
                  border: '1px solid var(--accent-muted)',
                  color: 'var(--accent)',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Today
              </button>
            )}
          </div>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              margin: '2px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <span>{totalItems} items today</span>
            {!today.busyDay ? (
              <button
                onClick={() => today.setBusyDay(true)}
                style={{
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--glass-bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Busy Day
              </button>
            ) : (
              <button
                onClick={() => today.setBusyDay(false)}
                style={{
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-subtle)',
                  border: '1px solid var(--accent-muted)',
                  color: 'var(--accent)',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Exit Busy Day
              </button>
            )}
          </p>
        </div>

        {/* ── Top 3 (always visible) ── */}
        {top3ForCard.length > 0 && (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <Top3Card tasks={top3ForCard} onToggleTask={today.toggleTask} />
          </div>
        )}

        {today.busyDay ? (
          <BusyDayView
            instances={today.instances}
            buildMobilityItems={buildMobilityItems}
            handleToggleItem={handleToggleItem}
            journalValue={journalAm}
            onJournalChange={(text) => journal.updateSection('prayer', text)}
            workFocusItems={workFocusItems}
          />
        ) : (
          <>
            {renderBlock('morning', 200)}
            {renderBlock('midday', 400)}
            {renderBlock('workout', 600)}
            {renderBlock('evening', 800)}
          </>
        )}

        <div style={{ height: 'var(--space-16)' }} />
      </div>

      {/* Edit Ladder Sheet */}
      <EditLadderSheet
        isOpen={editLadder.isOpen}
        onClose={() => setEditLadder({ isOpen: false, title: '' })}
        itemTitle={editLadder.title}
        onSelect={(scope) => {
          console.log('Edit scope selected:', scope)
        }}
      />

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        isOpen={taskDetailOpen}
        onClose={handleCloseTaskDetail}
        task={selectedTask}
        onToggle={async (id: string) => { await today.toggleTask(id) }}
        onUpdate={handleUpdateTask}
        onSnooze={() => {}}
        onPromoteTop3={handlePromoteTop3}
        onDemoteTop3={handleDemoteTop3}
        onDelete={handleDeleteTask}
      />

      {/* Module Action Sheet */}
      <GlassSheet
        isOpen={moduleAction.isOpen}
        onClose={closeModuleActions}
        title={moduleAction.instance?.title ?? 'Module'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <GlassButton
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => {
              if (moduleAction.instance) {
                closeModuleActions()
                setEditLadder({ isOpen: true, title: moduleAction.instance.title })
              }
            }}
          >
            Edit Template
          </GlassButton>
          <GlassButton
            variant="danger"
            size="md"
            fullWidth
            icon={<XIcon size={16} />}
            onClick={() => {
              if (moduleAction.instance) removeInstance(moduleAction.instance.id)
            }}
          >
            Remove for Today
          </GlassButton>
        </div>
      </GlassSheet>

      {/* Workout Session Overlay */}
      {workoutSessionId && (
        <WorkoutSessionScreen
          instanceId={workoutSessionId}
          onClose={() => setWorkoutSessionId(null)}
        />
      )}

      {/* Settings Sheet */}
      <GlassSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Settings"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Account info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--glass-bg-secondary)',
              border: '1px solid var(--glass-border)',
            }}
          >
            {auth.imageUrl ? (
              <img
                src={auth.imageUrl}
                alt=""
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-full)',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-subtle)',
                  border: '1px solid var(--accent-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--accent)',
                  flexShrink: 0,
                }}
              >
                {(auth.fullName ?? auth.email ?? '?')[0].toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {auth.fullName ?? 'User'}
              </div>
              {auth.email && (
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {auth.email}
                </div>
              )}
            </div>
          </div>

          {/* Logout button */}
          <button
            type="button"
            onClick={async () => {
              setSettingsOpen(false)
              await auth.logout()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#EF4444',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              minHeight: 'var(--tap-min)',
              width: '100%',
            }}
          >
            Log Out
          </button>
        </div>
      </GlassSheet>
    </div>
  )
}

// ── Card Stack ──
function CardStack({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {children}
    </div>
  )
}

// ── Busy Day View ──
interface BusyDayViewProps {
  instances: Instance[]
  buildMobilityItems: (inst: Instance) => { id: string; name: string; duration: string; durationSeconds: number; isCompleted: boolean }[]
  handleToggleItem: (instanceId: string) => (itemId: string) => void
  journalValue: string
  onJournalChange: (text: string) => void
  workFocusItems: string[]
}

function BusyDayView({
  instances,
  buildMobilityItems,
  handleToggleItem,
  journalValue,
  onJournalChange,
  workFocusItems,
}: BusyDayViewProps) {
  const noop = useCallback(() => {}, [])
  const mobilityInstance = instances.find((i) => i.cardType === 'mobility')

  return (
    <div style={{ marginTop: 'var(--space-2)' }}>
      <div
        style={{
          padding: 'var(--space-2) var(--space-3)',
          marginBottom: 'var(--space-3)',
          borderRadius: 'var(--radius-full)',
          background: 'var(--accent-subtle)',
          border: '1px solid var(--accent-muted)',
          fontSize: 'var(--text-sm)',
          color: 'var(--accent)',
          textAlign: 'center',
        }}
      >
        Busy Day mode — essentials only
      </div>
      <CardStack>
        {mobilityInstance && (
          <MobilityCard
            title="Quick Mobility"
            items={buildMobilityItems(mobilityInstance).slice(0, 2)}
            onToggleItem={handleToggleItem(mobilityInstance.id)}
          />
        )}
        <JournalCard
          title="Quick Journal"
          prompt="One sentence: how are you?"
          value={journalValue}
          onChange={onJournalChange}
          onExpand={noop}
        />
        <WorkFocusCard items={workFocusItems.slice(0, 1)} onViewAll={noop} />
      </CardStack>
      <div
        style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--glass-bg-secondary)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text-tertiary)',
          fontSize: 'var(--text-sm)',
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        Show all ({instances.length} more)
      </div>
    </div>
  )
}
