'use client'

import React, { useState, useCallback, useMemo } from 'react'
import TabBar from './TabBar'
import QuickAddFAB from './QuickAddFAB'
import { SearchOverlay } from '@/components/search/SearchOverlay'
import { parseQuickAdd, getQuickAddSuggestions, type QuickAddAction } from '@/lib/quickAdd/parser'
import { createTask } from '@/lib/repositories/taskRepository'
import { saveFinanceEntry } from '@/lib/repositories/supportingRepository'
import { getOrCreateTodayEntry, updateJournalSection } from '@/lib/repositories/journalRepository'
import type { TabId } from '@/types'

interface AppShellProps {
  children: (activeTab: TabId, onSearchPress: () => void, onTabChange: (tab: TabId) => void) => React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const handleQuickAdd = useCallback(() => {
    setQuickAddOpen(true)
  }, [])

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true)
  }, [])

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false)
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children(activeTab, handleSearchOpen, setActiveTab)}
      </div>

      {/* Quick Add FAB */}
      <QuickAddFAB onPress={handleQuickAdd} />

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Quick Add Sheet (placeholder) */}
      {quickAddOpen && (
        <QuickAddOverlay onClose={() => setQuickAddOpen(false)} />
      )}

      {/* Search Overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={handleSearchClose} />
    </div>
  )
}

function formatPreview(action: QuickAddAction): string {
  switch (action.type) {
    case 'task': {
      const parts = [action.title]
      if (action.scheduledDate) parts.push(`(${action.scheduledDate}`)
      else parts.push('(')
      parts[parts.length - 1] += `, ${action.priority}`
      if (action.tags.length > 0) parts[parts.length - 1] += `, #${action.tags.join(' #')}`
      parts[parts.length - 1] += ')'
      return `Task: ${parts.join(' ')}`
    }
    case 'money':
      return `$${action.amount} → ${action.category}${action.note ? ` (${action.note})` : ''}`
    case 'journal':
      return `Journal: ${action.text}`
    case 'workout':
      return `Workout${action.templateName ? `: ${action.templateName}` : ''}`
  }
}

function QuickAddOverlay({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const suggestions = useMemo(() => getQuickAddSuggestions(input), [input])
  const parsedAction: QuickAddAction | null = useMemo(
    () => (input.trim() ? parseQuickAdd(input) : null),
    [input],
  )

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isSubmitting) return

    setIsSubmitting(true)

    try {
      const action = parseQuickAdd(trimmed)

      switch (action.type) {
        case 'task':
          await createTask({
            title: action.title,
            scheduledDate: action.scheduledDate,
            priority: action.priority,
            tags: action.tags,
          })
          break

        case 'money': {
          const todayStr = new Date().toISOString().slice(0, 10)
          await saveFinanceEntry(todayStr, action.amount, action.category, action.note || undefined)
          break
        }

        case 'journal': {
          const todayStr = new Date().toISOString().slice(0, 10)
          const entry = await getOrCreateTodayEntry(todayStr)
          const existingText = entry.sections?.[action.section as keyof typeof entry.sections] ?? ''
          const newText = existingText ? `${existingText}\n${action.text}` : action.text
          await updateJournalSection(entry.id, action.section as keyof typeof entry.sections, newText)
          break
        }

        case 'workout':
          // Workout navigation is handled elsewhere; just close the overlay.
          break
      }
    } finally {
      setIsSubmitting(false)
    }

    onClose()
  }, [input, isSubmitting, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-sheet)' as unknown as number,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'fade-in var(--duration-normal) var(--ease-smooth)',
        }}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick add"
        style={{
          position: 'relative',
          background: 'var(--glass-bg-modal)',
          backdropFilter: 'blur(var(--blur-heavy))',
          WebkitBackdropFilter: 'blur(var(--blur-heavy))',
          borderTop: '1px solid var(--glass-border-strong)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          padding: `var(--space-4) var(--space-5) calc(var(--space-6) + var(--safe-area-bottom))`,
          animation: 'slide-up var(--duration-slow) var(--ease-out)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 -8px 40px rgba(0,0,0,0.4)',
          minHeight: '280px',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: '36px',
            height: '4px',
            borderRadius: '2px',
            background: 'var(--glass-border-strong)',
            margin: '0 auto var(--space-5)',
          }}
          aria-hidden="true"
        />
        {/* Quick Add Input */}
        <div style={{ marginBottom: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)' }}>
          <input
            type="text"
            placeholder="Task, workout, journal, $amount..."
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--text-md)',
              color: 'var(--text-primary)',
              background: 'var(--glass-bg-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-muted)'
              e.currentTarget.style.boxShadow = 'var(--accent-ring)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isSubmitting}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--text-md)',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              color: input.trim() ? 'var(--text-on-accent)' : 'var(--text-muted)',
              background: input.trim() ? 'var(--accent)' : 'var(--glass-bg-secondary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              cursor: input.trim() ? 'pointer' : 'default',
              opacity: isSubmitting ? 0.6 : 1,
              minHeight: 'var(--tap-min)',
            }}
          >
            Add
          </button>
        </div>

        {/* Parsed Action Preview */}
        {parsedAction && input.trim() && (
          <div
            style={{
              marginBottom: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--glass-bg-secondary)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {formatPreview(parsedAction)}
          </div>
        )}

        {/* Suggestion Chips */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                // If the suggestion starts with "...", it is a completion hint:
                // replace the last token in the input with the completed keyword.
                if (suggestion.startsWith('...')) {
                  const keyword = suggestion.slice(3)
                  const tokens = input.split(/\s+/)
                  tokens[tokens.length - 1] = keyword
                  setInput(tokens.join(' ') + ' ')
                } else {
                  setInput(suggestion)
                }
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--glass-bg-secondary)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                minHeight: 'var(--tap-min)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
