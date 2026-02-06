'use client'

import React, { useState, useCallback } from 'react'
import { PlusIcon } from '@/components/ui/Icons'

interface QuickAddFABProps {
  onPress: () => void
}

export default function QuickAddFAB({ onPress }: QuickAddFABProps) {
  const [isPressed, setIsPressed] = useState(false)

  const handleTouchStart = useCallback(() => setIsPressed(true), [])
  const handleTouchEnd = useCallback(() => setIsPressed(false), [])

  return (
    <button
      onClick={onPress}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      aria-label="Quick add"
      style={{
        position: 'fixed',
        bottom: 'calc(70px + var(--safe-area-bottom))',
        right: 'var(--space-5)',
        zIndex: 'var(--z-fab)' as unknown as number,
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: '1px solid rgba(92, 224, 214, 0.25)',
        background: 'radial-gradient(circle at 30% 30%, rgba(92, 224, 214, 0.2), rgba(92, 224, 214, 0.08))',
        backdropFilter: 'blur(var(--blur-medium))',
        WebkitBackdropFilter: 'blur(var(--blur-medium))',
        color: 'var(--accent)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `
          0 0 24px rgba(92, 224, 214, 0.15),
          0 4px 16px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
        transform: isPressed ? 'scale(0.92)' : 'scale(1)',
        transition: `transform var(--duration-fast) var(--ease-out)`,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Glow ring */}
      <span
        style={{
          position: 'absolute',
          inset: '-3px',
          borderRadius: '50%',
          border: '1px solid rgba(92, 224, 214, 0.12)',
          animation: 'glow-pulse 3s ease-in-out infinite',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      <PlusIcon size={24} strokeWidth={2} />
    </button>
  )
}
