'use client'

import React, { useCallback, type CSSProperties } from 'react'
import { GlassSheet } from '@/components/ui/GlassSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import {
  MoonIcon,
  SunIcon,
  ClockIcon,
  StarIcon,
} from '@/components/ui/Icons'
import type { SnoozeOption } from '@/lib/repositories/taskRepository'

// ── Props ──

interface SnoozeSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (option: SnoozeOption) => void
}

// ── Snooze options config ──

interface SnoozeOptionConfig {
  id: SnoozeOption
  label: string
  icon: React.ReactNode
  description: string
}

function getSnoozeOptions(): SnoozeOptionConfig[] {
  // Compute dynamic labels
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowLabel = tomorrow.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  // Next workday
  const nextWork = new Date(now)
  nextWork.setDate(nextWork.getDate() + 1)
  while (nextWork.getDay() === 0 || nextWork.getDay() === 6) {
    nextWork.setDate(nextWork.getDate() + 1)
  }
  const nextWorkLabel = nextWork.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  // Next Monday
  const nextMon = new Date(now)
  nextMon.setDate(nextMon.getDate() + 1)
  while (nextMon.getDay() !== 1) {
    nextMon.setDate(nextMon.getDate() + 1)
  }
  const nextMonLabel = nextMon.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return [
    {
      id: 'tonight',
      label: 'Tonight',
      icon: <MoonIcon size={18} color="var(--text-secondary)" />,
      description: 'Later today, evening block',
    },
    {
      id: 'tomorrow',
      label: 'Tomorrow',
      icon: <SunIcon size={18} color="var(--text-secondary)" />,
      description: tomorrowLabel,
    },
    {
      id: 'next-workday',
      label: 'Next workday',
      icon: <ClockIcon size={18} color="var(--text-secondary)" />,
      description: nextWorkLabel,
    },
    {
      id: 'next-week',
      label: 'Next week',
      icon: <StarIcon size={18} color="var(--text-secondary)" />,
      description: `Monday, ${nextMonLabel}`,
    },
    {
      id: 'pick-date',
      label: 'Pick a date...',
      icon: <ClockIcon size={18} color="var(--text-secondary)" />,
      description: 'Choose a custom date',
    },
  ]
}

// ── Component ──

export default function SnoozeSheet({ isOpen, onClose, onSelect }: SnoozeSheetProps) {
  const options = getSnoozeOptions()

  const handleSelect = useCallback(
    (option: SnoozeOption) => {
      if (option === 'pick-date') {
        console.log('Pick a date: date picker not yet implemented')
        onClose()
        return
      }
      onSelect(option)
    },
    [onSelect, onClose]
  )

  // ── Styles ──

  const optionRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    width: '100%',
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-3) var(--space-4)',
    background: 'var(--glass-bg-primary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    WebkitTapHighlightColor: 'transparent',
    transition: 'background var(--duration-fast) var(--ease-out)',
    textAlign: 'left' as const,
  }

  const listStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    paddingBottom: 'var(--space-4)',
  }

  const cancelRowStyle: CSSProperties = {
    paddingTop: 'var(--space-2)',
    borderTop: '1px solid var(--glass-border)',
  }

  return (
    <GlassSheet isOpen={isOpen} onClose={onClose} title="Snooze until...">
      <div style={listStyle}>
        {options.map((opt, i) => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            style={{
              ...optionRowStyle,
              opacity: 0,
              animation: `settle-in var(--duration-settle) var(--ease-out) ${150 + i * 60}ms both`,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              {opt.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--weight-medium)' as unknown as number,
                  color: 'var(--text-primary)',
                  lineHeight: 'var(--leading-tight)',
                }}
              >
                {opt.label}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  lineHeight: 'var(--leading-normal)',
                  marginTop: '1px',
                }}
              >
                {opt.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div style={cancelRowStyle}>
        <GlassButton
          variant="ghost"
          size="md"
          fullWidth
          onClick={onClose}
        >
          Cancel
        </GlassButton>
      </div>
    </GlassSheet>
  )
}
