'use client'

import React, { useCallback } from 'react'
import { GlassSheet } from '@/components/ui/GlassSheet'
import type { EditScope } from '@/lib/db/schema'

interface EditLadderSheetProps {
  isOpen: boolean
  onClose: () => void
  itemTitle: string
  onSelect: (scope: EditScope) => void
}

const options: { scope: EditScope; label: string; description: string }[] = [
  {
    scope: 'today',
    label: 'Edit Today Only',
    description: "Changes apply to today's session only.",
  },
  {
    scope: 'this-week',
    label: 'Edit This Week',
    description: 'Changes apply to all remaining sessions this week.',
  },
  {
    scope: 'template',
    label: 'Edit Template',
    description: 'Changes apply to all future sessions.',
  },
]

export default function EditLadderSheet({
  isOpen,
  onClose,
  itemTitle,
  onSelect,
}: EditLadderSheetProps) {
  const handleSelect = useCallback(
    (scope: EditScope) => {
      onSelect(scope)
      onClose()
    },
    [onSelect, onClose]
  )

  return (
    <GlassSheet isOpen={isOpen} onClose={onClose} title={`Edit ${itemTitle}`}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {options.map(({ scope, label, description }) => (
          <button
            key={scope}
            onClick={() => handleSelect(scope)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '2px',
              padding: 'var(--space-4)',
              background: 'var(--glass-bg-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              minHeight: 'var(--tap-min)',
              textAlign: 'left',
              width: '100%',
              transition: `background var(--duration-fast) var(--ease-smooth)`,
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-md)',
                fontWeight: 'var(--weight-medium)' as unknown as number,
                color: 'var(--text-primary)',
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              {description}
            </span>
          </button>
        ))}
      </div>

      {/* Disable options */}
      <div
        style={{
          marginTop: 'var(--space-4)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'none',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            minHeight: 'var(--tap-min)',
            textAlign: 'left',
          }}
        >
          Disable today only
        </button>
        <button
          onClick={onClose}
          style={{
            padding: 'var(--space-3) var(--space-4)',
            background: 'none',
            border: '1px solid rgba(248, 113, 113, 0.15)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--status-danger)',
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            minHeight: 'var(--tap-min)',
            textAlign: 'left',
            opacity: 0.7,
          }}
        >
          Disable forever...
        </button>
      </div>
    </GlassSheet>
  )
}
