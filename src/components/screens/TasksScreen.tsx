'use client'

import React, { useState, useCallback, useMemo, type CSSProperties } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassButton } from '@/components/ui/GlassButton'
import { Checkbox } from '@/components/ui/Checkbox'
import { GlassChip } from '@/components/ui/GlassChip'
import {
  PlusIcon,
  StarIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@/components/ui/Icons'
import Header from '@/components/layout/Header'
import TaskDetailSheet from '@/components/layout/TaskDetailSheet'
import SnoozeSheet from '@/components/layout/SnoozeSheet'
import { useTasks } from '@/hooks/useTasks'
import type { Task, Priority } from '@/lib/db/schema'
import type { SnoozeOption } from '@/lib/repositories/taskRepository'

// ── Constants ──

type TabId = 'inbox' | 'today' | 'upcoming' | 'projects'

const TABS: { id: TabId; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'projects', label: 'Projects' },
]

// ── Priority helpers ──

function priorityBadgeStyle(priority: Priority): CSSProperties {
  switch (priority) {
    case 'p1':
      return {
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-semibold)' as unknown as number,
        color: 'var(--text-primary)',
        background: 'var(--glass-bg-elevated)',
        border: '1px solid var(--glass-border-strong)',
        borderRadius: 'var(--radius-sm)',
        padding: '1px 6px',
        lineHeight: 1.4,
      }
    case 'p2':
      return {
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-medium)' as unknown as number,
        color: 'var(--text-secondary)',
        background: 'var(--glass-bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '1px 6px',
        lineHeight: 1.4,
      }
    case 'p3':
      return {
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-regular)' as unknown as number,
        color: 'var(--text-tertiary)',
        background: 'var(--glass-bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '1px 6px',
        lineHeight: 1.4,
      }
  }
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const label = priority.toUpperCase()
  return <span style={priorityBadgeStyle(priority)}>{label}</span>
}

function TimeBadge({ time }: { time: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-tertiary)',
        background: 'var(--glass-bg-secondary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '1px 6px',
        lineHeight: 1.4,
      }}
    >
      <ClockIcon size={10} />
      {time}
    </span>
  )
}

// ── Task Row ──

interface TaskRowProps {
  task: Task
  onToggle: (id: string) => void
  onTap: (task: Task) => void
  onLongPress: (task: Task) => void
  onToggleTop3: (task: Task) => void
  animationDelay?: number
}

function TaskRow({ task, onToggle, onTap, onLongPress, onToggleTop3, animationDelay }: TaskRowProps) {
  const isCompleted = task.status === 'completed'

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-1) 0',
    minHeight: 'var(--tap-min)',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    ...(animationDelay !== undefined
      ? {
          opacity: 0,
          animation: `settle-in var(--duration-settle) var(--ease-out) ${animationDelay}ms both`,
        }
      : {}),
  }

  const titleStyle: CSSProperties = {
    flex: 1,
    fontSize: 'var(--text-base)',
    fontWeight:
      task.priority === 'p1'
        ? ('var(--weight-semibold)' as unknown as number)
        : ('var(--weight-regular)' as unknown as number),
    color: isCompleted ? 'var(--text-tertiary)' : 'var(--text-primary)',
    textDecoration: isCompleted ? 'line-through' : 'none',
    textDecorationColor: isCompleted ? 'var(--text-tertiary)' : 'transparent',
    lineHeight: 'var(--leading-normal)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const metaStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    flexShrink: 0,
  }

  return (
    <div
      style={rowStyle}
      onClick={() => onTap(task)}
      onContextMenu={(e) => {
        e.preventDefault()
        onLongPress(task)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onTap(task)
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <Checkbox
          checked={isCompleted}
          onChange={() => onToggle(task.id)}
          size="sm"
        />
      </div>
      <span style={titleStyle}>{task.title}</span>
      <div style={metaStyle}>
        {task.dueTime && <TimeBadge time={task.dueTime} />}
        {task.priority !== 'p3' && <PriorityBadge priority={task.priority} />}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleTop3(task)
          }}
          aria-label={task.isTop3 ? 'Remove from Top 3' : 'Add to Top 3'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            margin: '-4px',
            WebkitTapHighlightColor: 'transparent',
            opacity: task.isTop3 ? 1 : 0.35,
            transition: 'opacity var(--duration-fast) var(--ease-out)',
          }}
        >
          <StarIcon size={14} color={task.isTop3 ? 'var(--accent)' : 'var(--text-tertiary)'} />
        </button>
      </div>
    </div>
  )
}

// ── Main Screen ──

interface TasksScreenProps {
  onSearchPress?: () => void
}

export default function TasksScreen({ onSearchPress }: TasksScreenProps) {
  const tasks = useTasks()
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [snoozeTargetId, setSnoozeTargetId] = useState<string | null>(null)
  const [overdueExpanded, setOverdueExpanded] = useState(false)

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // ── Handlers ──

  const handleTaskTap = useCallback((task: Task) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }, [])

  const handleTaskLongPress = useCallback((task: Task) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false)
    setSelectedTask(null)
  }, [])

  const handleOpenSnooze = useCallback((taskId: string) => {
    setSnoozeTargetId(taskId)
    setDetailOpen(false)
    setSnoozeOpen(true)
  }, [])

  const handleSnoozeSelect = useCallback(
    async (option: SnoozeOption) => {
      if (!snoozeTargetId) return
      await tasks.snoozeTask(snoozeTargetId, option)
      setSnoozeOpen(false)
      setSnoozeTargetId(null)
    },
    [snoozeTargetId, tasks]
  )

  const handleCloseSnooze = useCallback(() => {
    setSnoozeOpen(false)
    setSnoozeTargetId(null)
  }, [])

  const handleToggleTop3 = useCallback(
    async (task: Task) => {
      if (task.isTop3) {
        await tasks.demoteFromTop3(task.id)
      } else {
        await tasks.promoteToTop3(task.id)
      }
    },
    [tasks]
  )

  const handleAddTask = useCallback(async () => {
    // Placeholder: will be wired to a creation sheet later
    await tasks.createTask({
      title: 'New task',
      scheduledDate: activeTab === 'today' ? todayStr : undefined,
    })
  }, [tasks, activeTab, todayStr])

  // ── Derived data for Today view ──

  const { scheduledToday, dueToday, overdueTasks } = useMemo(() => {
    const scheduled: Task[] = []
    const due: Task[] = []
    const overdue: Task[] = []

    for (const t of tasks.todayTasks) {
      if (t.isTop3 && t.top3Date === todayStr) continue // shown in Top 3 section
      if (t.dueDate && t.dueDate < todayStr && t.status !== 'completed') {
        overdue.push(t)
      } else if (t.scheduledDate === todayStr) {
        scheduled.push(t)
      } else if (t.dueDate === todayStr) {
        due.push(t)
      }
    }

    return { scheduledToday: scheduled, dueToday: due, overdueTasks: overdue }
  }, [tasks.todayTasks, todayStr])

  // Project task counts
  const projectTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    const allTasks = [
      ...tasks.inboxTasks,
      ...tasks.todayTasks,
      ...(tasks.upcomingTasks.flatMap((g) => g.tasks)),
    ]
    for (const t of allTasks) {
      if (t.projectId && t.status !== 'completed') {
        counts[t.projectId] = (counts[t.projectId] ?? 0) + 1
      }
    }
    return counts
  }, [tasks.inboxTasks, tasks.todayTasks, tasks.upcomingTasks])

  // ── Styles ──

  const screenStyle: CSSProperties = {
    height: '100%',
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'calc(var(--tabbar-height) + var(--space-8))',
  }

  const contentStyle: CSSProperties = {
    padding: '0 var(--space-4)',
  }

  const segmentedRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-1)',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    opacity: 0,
    animation: 'settle-in var(--duration-settle) var(--ease-out) 100ms both',
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: '0 0 var(--space-2)',
    padding: 'var(--space-3) 0 0',
  }

  const emptyStateStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-16) var(--space-6)',
    textAlign: 'center',
    minHeight: '40vh',
  }

  const dateHeaderStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: 'var(--text-secondary)',
    padding: 'var(--space-4) 0 var(--space-2)',
    margin: 0,
  }

  // ── Render sub-views ──

  function renderInbox() {
    if (tasks.inboxTasks.length === 0) {
      return (
        <div style={emptyStateStyle}>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)' as unknown as number,
              color: 'var(--text-primary)',
              margin: '0 0 var(--space-2)',
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 200ms both',
            }}
          >
            Inbox zero — nice work.
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
              margin: '0 0 var(--space-6)',
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 300ms both',
            }}
          >
            Tasks without a date land here.
          </p>
          <div
            style={{
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 400ms both',
            }}
          >
            <GlassButton
              variant="secondary"
              icon={<PlusIcon size={16} />}
              onClick={handleAddTask}
            >
              Add task
            </GlassButton>
          </div>
        </div>
      )
    }

    return (
      <GlassCard
        padding="sm"
        animationDelay={200}
      >
        {tasks.inboxTasks.map((task, i) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={tasks.toggleTask}
            onTap={handleTaskTap}
            onLongPress={handleTaskLongPress}
            onToggleTop3={handleToggleTop3}
            animationDelay={250 + i * 50}
          />
        ))}
      </GlassCard>
    )
  }

  function renderToday() {
    const hasTop3 = tasks.top3Tasks.length > 0
    const hasScheduled = scheduledToday.length > 0
    const hasDue = dueToday.length > 0
    const hasOverdue = overdueTasks.length > 0
    const isEmpty = !hasTop3 && !hasScheduled && !hasDue && !hasOverdue

    if (isEmpty) {
      return (
        <div style={emptyStateStyle}>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)' as unknown as number,
              color: 'var(--text-primary)',
              margin: '0 0 var(--space-2)',
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 200ms both',
            }}
          >
            Nothing scheduled today.
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
              margin: '0 0 var(--space-6)',
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 300ms both',
            }}
          >
            Add a task or promote from inbox.
          </p>
          <div
            style={{
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 400ms both',
            }}
          >
            <GlassButton
              variant="secondary"
              icon={<PlusIcon size={16} />}
              onClick={handleAddTask}
            >
              Add task
            </GlassButton>
          </div>
        </div>
      )
    }

    let delay = 200

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Top 3 section */}
        {hasTop3 && (
          <div>
            <div
              style={{
                ...sectionTitleStyle,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                opacity: 0,
                animation: `settle-in var(--duration-settle) var(--ease-out) ${delay}ms both`,
              }}
            >
              <StarIcon size={14} color="var(--accent)" />
              Top 3
            </div>
            <GlassCard variant="elevated" padding="sm" animationDelay={(delay += 50)}>
              {tasks.top3Tasks.map((task, i) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={tasks.toggleTask}
                  onTap={handleTaskTap}
                  onLongPress={handleTaskLongPress}
                  onToggleTop3={handleToggleTop3}
                  animationDelay={(delay += 50)}
                />
              ))}
            </GlassCard>
          </div>
        )}

        {/* Scheduled Today */}
        {hasScheduled && (
          <div>
            <div
              style={{
                ...sectionTitleStyle,
                opacity: 0,
                animation: `settle-in var(--duration-settle) var(--ease-out) ${(delay += 50)}ms both`,
              }}
            >
              Scheduled Today
            </div>
            <GlassCard padding="sm" animationDelay={(delay += 50)}>
              {scheduledToday.map((task, i) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={tasks.toggleTask}
                  onTap={handleTaskTap}
                  onLongPress={handleTaskLongPress}
                  onToggleTop3={handleToggleTop3}
                  animationDelay={(delay += 50)}
                />
              ))}
            </GlassCard>
          </div>
        )}

        {/* Due Today */}
        {hasDue && (
          <div>
            <div
              style={{
                ...sectionTitleStyle,
                opacity: 0,
                animation: `settle-in var(--duration-settle) var(--ease-out) ${(delay += 50)}ms both`,
              }}
            >
              Due Today
            </div>
            <GlassCard padding="sm" animationDelay={(delay += 50)}>
              {dueToday.map((task, i) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={tasks.toggleTask}
                  onTap={handleTaskTap}
                  onLongPress={handleTaskLongPress}
                  onToggleTop3={handleToggleTop3}
                  animationDelay={(delay += 50)}
                />
              ))}
            </GlassCard>
          </div>
        )}

        {/* Overdue - collapsed by default */}
        {hasOverdue && (
          <div>
            <button
              onClick={() => setOverdueExpanded((v) => !v)}
              style={{
                ...sectionTitleStyle,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 'var(--space-3) 0 var(--space-2)',
                fontFamily: 'var(--font-sans)',
                opacity: 0,
                animation: `settle-in var(--duration-settle) var(--ease-out) ${(delay += 50)}ms both`,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--status-warn)',
                  flexShrink: 0,
                }}
              />
              <span>Overdue ({overdueTasks.length})</span>
              <span
                style={{
                  transition: 'transform var(--duration-fast) var(--ease-out)',
                  transform: overdueExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  display: 'inline-flex',
                }}
              >
                <ChevronDownIcon size={14} color="var(--text-tertiary)" />
              </span>
            </button>
            {overdueExpanded && (
              <GlassCard padding="sm" animationDelay={(delay += 50)}>
                {overdueTasks.map((task, i) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={tasks.toggleTask}
                    onTap={handleTaskTap}
                    onLongPress={handleTaskLongPress}
                    onToggleTop3={handleToggleTop3}
                    animationDelay={(delay += 50)}
                  />
                ))}
              </GlassCard>
            )}
          </div>
        )}
      </div>
    )
  }

  function renderUpcoming() {
    if (tasks.upcomingTasks.length === 0) {
      return (
        <div style={emptyStateStyle}>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)' as unknown as number,
              color: 'var(--text-primary)',
              margin: '0 0 var(--space-2)',
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 200ms both',
            }}
          >
            No upcoming tasks.
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
              margin: '0 0 var(--space-6)',
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 300ms both',
            }}
          >
            Tasks scheduled for the next 14 days appear here.
          </p>
          <div
            style={{
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 400ms both',
            }}
          >
            <GlassButton
              variant="secondary"
              icon={<PlusIcon size={16} />}
              onClick={handleAddTask}
            >
              Add task
            </GlassButton>
          </div>
        </div>
      )
    }

    let delay = 200

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {tasks.upcomingTasks.map((group) => (
          <div key={group.date}>
            <h3
              style={{
                ...dateHeaderStyle,
                opacity: 0,
                animation: `settle-in var(--duration-settle) var(--ease-out) ${(delay += 50)}ms both`,
              }}
            >
              {group.dateLabel}
            </h3>
            <GlassCard padding="sm" animationDelay={(delay += 50)}>
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={tasks.toggleTask}
                  onTap={handleTaskTap}
                  onLongPress={handleTaskLongPress}
                  onToggleTop3={handleToggleTop3}
                  animationDelay={(delay += 40)}
                />
              ))}
            </GlassCard>
          </div>
        ))}
      </div>
    )
  }

  function renderProjects() {
    if (tasks.projects.length === 0) {
      return (
        <div style={emptyStateStyle}>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)' as unknown as number,
              color: 'var(--text-primary)',
              margin: '0 0 var(--space-2)',
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 200ms both',
            }}
          >
            No projects yet.
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
              margin: '0 0 var(--space-6)',
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 300ms both',
            }}
          >
            Projects group related tasks.
          </p>
          <div
            style={{
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 400ms both',
            }}
          >
            <GlassButton
              variant="secondary"
              icon={<PlusIcon size={16} />}
              onClick={() => console.log('Create project')}
            >
              Create a Project
            </GlassButton>
          </div>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
        {tasks.projects.map((project, i) => {
          const count = projectTaskCounts[project.id] ?? 0
          return (
            <GlassCard
              key={project.id}
              padding="md"
              animationDelay={200 + i * 80}
              onClick={() => console.log('Open project', project.id)}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  {project.color && (
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: 'var(--radius-full)',
                        background: project.color,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--weight-medium)' as unknown as number,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {project.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {count} {count === 1 ? 'task' : 'tasks'}
                  </span>
                  <ChevronRightIcon size={16} color="var(--text-tertiary)" />
                </div>
              </div>
            </GlassCard>
          )
        })}
      </div>
    )
  }

  function renderContent() {
    switch (activeTab) {
      case 'inbox':
        return renderInbox()
      case 'today':
        return renderToday()
      case 'upcoming':
        return renderUpcoming()
      case 'projects':
        return renderProjects()
    }
  }

  // ── Loading state ──
  if (tasks.isLoading) {
    return (
      <div style={screenStyle}>
        <Header title="Tasks" syncStatus="syncing" />
        <div style={contentStyle}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: '60px',
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

  return (
    <div style={screenStyle}>
      <Header
        title="Tasks"
        syncStatus="synced"
        onSearchPress={onSearchPress}
      />

      <div style={contentStyle}>
        {/* Segmented Control + Add Button Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-3) 0',
            opacity: 0,
            animation: 'settle-in var(--duration-settle) var(--ease-out) 100ms both',
          }}
        >
          <div style={segmentedRowStyle}>
            {TABS.map((tab) => (
              <GlassChip
                key={tab.id}
                label={tab.label}
                selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
              />
            ))}
          </div>
          <button
            onClick={handleAddTask}
            aria-label="Add task"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'var(--tap-min)',
              height: 'var(--tap-min)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              border: 'none',
              color: '#0f1219',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: 'var(--accent-glow)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <PlusIcon size={20} color="#0f1219" />
          </button>
        </div>

        {/* Active View */}
        {renderContent()}

        <div style={{ height: 'var(--space-16)' }} />
      </div>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        task={selectedTask}
        subtasks={tasks.subtasks.filter((s) => s.taskId === selectedTask?.id)}
        project={tasks.projects.find((p) => p.id === selectedTask?.projectId) ?? null}
        onToggle={tasks.toggleTask}
        onUpdate={tasks.updateTask}
        onSnooze={handleOpenSnooze}
        onPromoteTop3={tasks.promoteToTop3}
        onDemoteTop3={tasks.demoteFromTop3}
        onDelete={tasks.deleteTask}
      />

      {/* Snooze Sheet */}
      <SnoozeSheet
        isOpen={snoozeOpen}
        onClose={handleCloseSnooze}
        onSelect={handleSnoozeSelect}
      />
    </div>
  )
}
