'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Header from '@/components/layout/Header'
import BlockHeader from '@/components/layout/BlockHeader'
import EditLadderSheet from '@/components/layout/EditLadderSheet'
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
import type { Instance, Priority } from '@/lib/db/schema'
import type { TimeBlock } from '@/lib/db/schema'

// ── Priority converter: 'p1'|'p2'|'p3' → 1|2|3 ──
function priorityToNumber(p: Priority): 1 | 2 | 3 {
  const map: Record<Priority, 1 | 2 | 3> = { p1: 1, p2: 2, p3: 3 }
  return map[p]
}

// ── Format today's date for header ──
function formatHeaderDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

interface TodayScreenProps {
  onSearchPress?: () => void
}

export default function TodayScreen({ onSearchPress }: TodayScreenProps) {
  const today = useToday()
  const dateStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const journal = useJournal(dateStr)
  const supporting = useSupportingModules(dateStr)
  const auth = useAuth()

  // Journal section values from live data
  const journalAm = journal.entry?.sections?.prayer ?? ''
  const journalPm = journal.entry?.sections?.gratitude ?? ''

  // Workout session state
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null)

  // Settings sheet state
  const [settingsOpen, setSettingsOpen] = useState(false)

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

  const headerDate = useMemo(() => formatHeaderDate(), [])
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
          {instances.map((inst) => renderCard(inst))}
          {block === 'morning' && (
            <JournalCard
              title="Morning Journal"
              prompt="Set your intention for today..."
              value={journalAm}
              onChange={(text) => journal.updateSection('prayer', text)}
              onExpand={noop}
            />
          )}
          {block === 'midday' && (
            <DailyTodoCard
              tasks={tasksForCard}
              onToggleTask={today.toggleTask}
              onViewAll={noop}
            />
          )}
          {block === 'evening' && (
            <JournalCard
              title="Evening Journal"
              prompt="3 things you're grateful for..."
              value={journalPm}
              onChange={(text) => journal.updateSection('gratitude', text)}
              onExpand={noop}
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
