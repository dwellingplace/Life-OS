'use client'

import React, { useState, useEffect, useRef, type CSSProperties } from 'react'
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
  onUpdate?: (id: string, updates: Partial<Task>) => Promise<void>
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

const PRIORITIES: Priority[] = ['p1', 'p2', 'p3']

export default function TaskDetailSheet({
  isOpen,
  onClose,
  task,
  subtasks = [],
  project = null,
  onToggle,
  onUpdate,
  onSnooze,
  onPromoteTop3,
  onDemoteTop3,
  onDelete,
}: TaskDetailSheetProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const scheduledDateRef = useRef<HTMLInputElement>(null)
  const dueDateRef = useRef<HTMLInputElement>(null)

  // Sync draft when task changes
  useEffect(() => {
    if (task) setTitleDraft(task.title)
    setEditingTitle(false)
  }, [task?.id])

  // Focus input when editing starts
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus()
  }, [editingTitle])

  if (!task) return null

  const isCompleted = task.status === 'completed'
  const taskSubtasks = subtasks.filter((s) => s.taskId === task.id)

  const commitTitleEdit = async () => {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== task.title && onUpdate) {
      await onUpdate(task.id, { title: trimmed })
    }
    setEditingTitle(false)
  }

  const handlePriorityChange = async (newPriority: Priority) => {
    if (newPriority !== task.priority && onUpdate) {
      await onUpdate(task.id, { priority: newPriority })
    }
  }

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
      {/* ── Title (click to edit) ── */}
      <div style={{ margin: '0 0 var(--space-4)' }}>
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitleEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitleEdit()
              if (e.key === 'Escape') {
                setTitleDraft(task.title)
                setEditingTitle(false)
              }
            }}
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)' as unknown as number,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--leading-tight)',
              background: 'var(--glass-bg-secondary)',
              border: '1px solid var(--accent-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-2)',
              width: '100%',
              outline: 'none',
            }}
          />
        ) : (
          <h2
            onClick={() => {
              if (onUpdate) {
                setTitleDraft(task.title)
                setEditingTitle(true)
              }
            }}
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)' as unknown as number,
              color: isCompleted ? 'var(--text-tertiary)' : 'var(--text-primary)',
              textDecoration: isCompleted ? 'line-through' : 'none',
              textDecorationColor: isCompleted ? 'var(--text-tertiary)' : 'transparent',
              margin: 0,
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--leading-tight)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              cursor: onUpdate ? 'text' : 'default',
            }}
          >
            {task.isTop3 && <StarIcon size={18} color="var(--accent)" />}
            {task.title}
          </h2>
        )}
        {/* ── Priority Picker ── */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => handlePriorityChange(p)}
              style={{
                ...priorityStyle(p),
                cursor: onUpdate ? 'pointer' : 'default',
                outline: task.priority === p ? '2px solid var(--accent)' : 'none',
                outlineOffset: '1px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {priorityLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Detail Rows ── */}
      <div>
        {/* Scheduled Date (Do Date) */}
        <div
          style={{ ...rowStyle, cursor: onUpdate ? 'pointer' : 'default' }}
          onClick={() => onUpdate && scheduledDateRef.current?.showPicker?.()}
        >
          <span style={labelStyle}>Do date</span>
          <span style={valueStyle}>
            {formatDate(task.scheduledDate)}
            {onUpdate && (
              <input
                ref={scheduledDateRef}
                type="date"
                value={task.scheduledDate ?? ''}
                onChange={(e) => {
                  const val = e.target.value || undefined
                  onUpdate(task.id, { scheduledDate: val })
                }}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: 0,
                  height: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              />
            )}
          </span>
        </div>

        {/* Due Date (Deadline) */}
        <div
          style={{ ...rowStyle, cursor: onUpdate ? 'pointer' : 'default' }}
          onClick={() => onUpdate && dueDateRef.current?.showPicker?.()}
        >
          <span style={labelStyle}>Deadline</span>
          <span style={valueStyle}>
            {formatDate(task.dueDate)}
            {onUpdate && (
              <input
                ref={dueDateRef}
                type="date"
                value={task.dueDate ?? ''}
                onChange={(e) => {
                  const val = e.target.value || undefined
                  onUpdate(task.id, { dueDate: val })
                }}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: 0,
                  height: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              />
            )}
          </span>
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
