'use client'

import React, { type CSSProperties } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { ZapIcon } from '@/components/ui/Icons'

export interface AudioTrainingCardProps {
  title?: string
  description?: string
  onStart?: () => void
}

export function AudioTrainingCard({
  title = 'Audio Training',
  description = 'Practice your listening skills with today\'s audio exercise.',
  onStart,
}: AudioTrainingCardProps) {
  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-2)',
  }

  const titleStyle: CSSProperties = {
    fontSize: 'var(--text-md)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: 'var(--text-primary)',
    margin: 0,
  }

  const descStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    lineHeight: 'var(--leading-normal)',
    margin: '0 0 var(--space-3)',
  }

  const btnStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-2) var(--space-4)',
    background: 'var(--glass-bg-secondary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    transition: 'background var(--duration-fast) var(--ease-out)',
  }

  return (
    <GlassCard>
      <div style={headerStyle}>
        <ZapIcon size={18} color="var(--accent)" />
        <h3 style={titleStyle}>{title}</h3>
      </div>
      <p style={descStyle}>{description}</p>
      {onStart && (
        <button type="button" style={btnStyle} onClick={onStart}>
          <ZapIcon size={14} />
          Start Training
        </button>
      )}
    </GlassCard>
  )
}

export default AudioTrainingCard
