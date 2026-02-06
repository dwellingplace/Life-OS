'use client'

import React from 'react'
import type { TimeBlock } from '@/types'

interface BlockHeaderProps {
  block: TimeBlock
  animationDelay?: number
}

const blockConfig: Record<TimeBlock, { label: string; icon: string }> = {
  morning: { label: 'Morning', icon: '☀️' },
  midday: { label: 'Midday', icon: '🌤' },
  workout: { label: 'Workout', icon: '💪' },
  evening: { label: 'Evening', icon: '🌙' },
}

export default function BlockHeader({ block, animationDelay = 0 }: BlockHeaderProps) {
  const config = blockConfig[block]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-4) var(--space-1) var(--space-2)',
        opacity: 0,
        animation: `settle-in var(--duration-settle) var(--ease-out) ${animationDelay}ms both`,
      }}
    >
      <span
        style={{
          fontSize: 'var(--text-sm)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          fontWeight: 'var(--weight-semibold)' as unknown as number,
        }}
      >
        {config.icon} {config.label}
      </span>
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'var(--glass-border)',
        }}
        aria-hidden="true"
      />
    </div>
  )
}
