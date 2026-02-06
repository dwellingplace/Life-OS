'use client'

import React, { type CSSProperties } from 'react'
import { GlassSheet } from '@/components/ui/GlassSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  CheckIcon,
  ClockIcon,
  StarIcon,
  XIcon,
  MoonIcon,
} from '@/components/ui/Icons'
import type { Task, Subtask, Project, Priority } from '@/lib/db/schema'

// ── Props ──

interface TaskDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  subtasks?: Subtask[]
  project?: Project | null
  onToggle: (id: string) => Promise<void>
  onSnooze: (id: string) => void
  onPromoteTop3: (id: string) => Promise<void>
  onDemoteTop3: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

// ── Priority badge ──

function priorityLabel(p: Priority): string {
  switch (p) {
    case 'p1':
      return 'P1'
    case 'p2':
      return 'P2'
    case 'p3':
      return 'P3'
  }
}

function priorityStyle(p: Priority): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 'var(--text-xs)',
    borderRadius: 'var(--radius-sm)',
    padding: '2px 8px',
    lineHeight: 1.4,
  }
  switch (p) {
    case 'p1':
      return {
        ...base,
        fontWeight: 'var(--weight-semibold)' as unknown as number,
        color: 'var(--text-primary)',
        background: 'var(--glass-bg-elevated)',
        border: '1px solid var(--glass-border-strong)',
      }
    case 'p2':
      return {
        ...base,
        fontWeight: 'var(--weight-medium)' as unknown as number,
        color: 'var(--text-secondary)',
        background: 'var(--glass-bg-secondary)',
        border: '1px solid var(--glass-border)',
      }
    case 'p3':
      return {
        ...base,
        fontWeight: 'var(--weight-regular)' as unknown as number,
        color: 'var(--text-tertiary)',
        background: 'var(--glass-bg-secondary)',
        border: '1px solid var(--glass-border)',
      }
  }
}

// ── Date formatters ──

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Not set'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// ── Component ──

export default function TaskDetailSheet({
  isOpen,
  onClose,
  task,
  subtasks = [],
  project = null,
  onToggle,
  onSnooze,
  onPromoteTop3,
  onDemoteTop3,
  onDelete,
}: TaskDetailSheetProps) {
  if (!task) return null

  const isCompleted = task.status === 'completed'
  const taskSubtasks = subtasks.filter((s) => s.taskId === task.id)

  // ── Styles ──

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--space-3) 0',
    borderBottom: '1px solid var(--glass-border)',
    minHeight: 'var(--tap-min)',
  }

  const labelStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-sans)',
  }

  const valueStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
  }

  const tagChipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 10px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--glass-bg-secondary)',
    border: '1px solid var(--glass-border)',
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-sans)',
  }

  const actionsRowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-3)',
    paddingTop: 'var(--space-5)',
  }

  return (
    <GlassSheet isOpen={isOpen} onClose={onClose} title={task.title}>
      {/* ── Title ── */}
      <h2
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--weight-semibold)' as unknown as number,
          color: isCompleted ? 'var(--text-tertiary)' : 'var(--text-primary)',
          textDecoration: isCompleted ? 'line-through' : 'none',
          textDecorationColor: isCompleted ? 'var(--text-tertiary)' : 'transparent',
          margin: '0 0 var(--space-4)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 'var(--leading-tight)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}
      >
        {task.isTop3 && <StarIcon size={18} color="var(--accent)" />}
        <span style={priorityStyle(task.priority)}>{priorityLabel(task.priority)}</span>
      </h2>

      {/* ── Detail Rows ── */}
      <div>
        {/* Scheduled Date (Do Date) */}
        <div style={rowStyle}>
          <span style={labelStyle}>Do date</span>
          <span style={valueStyle}>{formatDate(task.scheduledDate)}</span>
        </div>

        {/* Due Date (Deadline) */}
        <div style={rowStyle}>
          <span style={labelStyle}>Deadline</span>
          <span style={valueStyle}>{formatDate(task.dueDate)}</span>
        </div>

        {/* Due Time */}
        {task.dueTime && (
          <div style={rowStyle}>
            <span style={labelStyle}>Time</span>
            <span
              style={{
                ...valueStyle,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ClockIcon size={14} color="var(--text-tertiary)" />
              {task.dueTime}
            </span>
          </div>
        )}

        {/* Project */}
        {project && (
          <div style={rowStyle}>
            <span style={labelStyle}>Project</span>
            <span
              style={{
                ...valueStyle,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              {project.color && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: 'var(--radius-full)',
                    background: project.color,
                  }}
                />
              )}
              {project.name}
            </span>
          </div>
        )}

        {/* Duration */}
        {task.durationMinutes && (
          <div style={rowStyle}>
            <span style={labelStyle}>Duration</span>
            <span style={valueStyle}>{task.durationMinutes}m</span>
          </div>
        )}
      </div>

      {/* ── Notes ── */}
      {task.notes && (
        <div style={{ paddingTop: 'var(--space-4)' }}>
          <p
            style={{
              ...labelStyle,
              marginBottom: 'var(--space-2)',
            }}
          >
            Notes
          </p>
          <GlassCard padding="sm">
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: 'var(--leading-relaxed)',
                fontFamily: 'var(--font-sans)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {task.notes}
            </p>
          </GlassCard>
        </div>
      )}

      {/* ── Subtasks ── */}
      {taskSubtasks.length > 0 && (
        <div style={{ paddingTop: 'var(--space-4)' }}>
          <p
            style={{
              ...labelStyle,
              marginBottom: 'var(--space-2)',
            }}
          >
            Subtasks ({taskSubtasks.filter((s) => s.isCompleted).length}/{taskSubtasks.length})
          </p>
          <GlassCard padding="sm">
            {taskSubtasks.map((sub) => (
              <div
                key={sub.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  minHeight: 'var(--tap-min)',
                  padding: 'var(--space-1) 0',
                }}
              >
                <Checkbox
                  checked={sub.isCompleted}
                  onChange={() => {
                    // Subtask toggle placeholder
                    console.log('Toggle subtask', sub.id)
                  }}
                  size="sm"
                />
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: sub.isCompleted ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: sub.isCompleted ? 'line-through' : 'none',
                    textDecorationColor: sub.isCompleted ? 'var(--text-tertiary)' : 'transparent',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {sub.title}
                </span>
              </div>
            ))}
          </GlassCard>
        </div>
      )}

      {/* ── Tags ── */}
      {task.tags.length > 0 && (
        <div style={{ paddingTop: 'var(--space-4)' }}>
          <p
            style={{
              ...labelStyle,
              marginBottom: 'var(--space-2)',
            }}
          >
            Tags
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            {task.tags.map((tag) => (
              <span key={tag} style={tagChipStyle}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div style={actionsRowStyle}>
        <GlassButton
          variant={isCompleted ? 'secondary' : 'primary'}
          size="md"
          fullWidth
          icon={<CheckIcon size={16} />}
          onClick={async () => {
            await onToggle(task.id)
            onClose()
          }}
        >
          {isCompleted ? 'Uncomplete' : 'Complete'}
        </GlassButton>

        <GlassButton
          variant="secondary"
          size="md"
          fullWidth
          icon={<MoonIcon size={16} />}
          onClick={() => onSnooze(task.id)}
        >
          Snooze
        </GlassButton>

        <GlassButton
          variant="secondary"
          size="md"
          fullWidth
          icon={<StarIcon size={16} />}
          onClick={async () => {
            if (task.isTop3) {
              await onDemoteTop3(task.id)
            } else {
              await onPromoteTop3(task.id)
            }
            onClose()
          }}
        >
          {task.isTop3 ? 'Remove Top 3' : 'Top 3'}
        </GlassButton>

        <GlassButton
          variant="danger"
          size="md"
          fullWidth
          icon={<XIcon size={16} />}
          onClick={async () => {
            await onDelete(task.id)
            onClose()
          }}
        >
          Delete
        </GlassButton>
      </div>
    </GlassSheet>
  )
}
