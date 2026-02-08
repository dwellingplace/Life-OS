'use client'

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassChip } from '@/components/ui/GlassChip'
import { GlassSheet } from '@/components/ui/GlassSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'
import {
  BookIcon,
  StarIcon,
  PlusIcon,
  CameraIcon,
  ClockIcon,
  XIcon,
  CheckIcon,
  SearchIcon,
  ChevronDownIcon,
} from '@/components/ui/Icons'
import Header from '@/components/layout/Header'
import { useJournal } from '@/hooks/useJournal'
import type { JournalEntry, Attachment, ReminderItem } from '@/lib/db/schema'

// ── Types ──

type ViewId = 'entries' | 'reminders'
type SectionKey = keyof JournalEntry['sections']

interface JournalSectionDef {
  key: SectionKey
  emoji: string
  title: string
  prompt: string
}

interface StarSheetState {
  isOpen: boolean
  section: string
  lines: string[]
}

// ── Constants ──

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'entries', label: 'Entries' },
  { id: 'reminders', label: 'Reminders' },
]

const JOURNAL_SECTIONS: JournalSectionDef[] = [
  { key: 'prayer', emoji: '\u{1F64F}', title: 'Prayer', prompt: 'Talk to God about what\u2019s on your heart...' },
  { key: 'leadership', emoji: '\u{1F454}', title: 'Leadership', prompt: 'What leadership insight are you learning?' },
  { key: 'gratitude', emoji: '\u{1F64F}', title: 'Gratitude', prompt: '3 things you\u2019re grateful for today...' },
  { key: 'freeNotes', emoji: '\u270F\uFE0F', title: 'Free Notes', prompt: 'Anything else on your mind...' },
]

// ── Helpers ──

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Compute tomorrow's date string for quick snooze. */
function getTomorrowStr(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

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

const chipRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-3) 0',
  opacity: 0,
  animation: 'settle-in var(--duration-settle) var(--ease-out) 100ms both',
}

const dateHeadingStyle: CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--weight-semibold)' as unknown as number,
  color: 'var(--text-primary)',
  margin: '0 0 var(--space-4)',
  fontFamily: 'var(--font-sans)',
  opacity: 0,
  animation: 'settle-in var(--duration-settle) var(--ease-out) 150ms both',
}

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  WebkitTapHighlightColor: 'transparent',
  minHeight: 'var(--tap-min)',
}

const sectionTitleGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
}

const sectionEmojiStyle: CSSProperties = {
  fontSize: 'var(--text-md)',
  lineHeight: 1,
}

const sectionTitleTextStyle: CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--weight-semibold)' as unknown as number,
  color: 'var(--text-primary)',
}

const previewTextStyle: CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--text-tertiary)',
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const expandedBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  paddingTop: 'var(--space-2)',
}

const starBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--glass-bg-secondary)',
  border: '1px solid var(--glass-border)',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background var(--duration-fast) var(--ease-out)',
  WebkitTapHighlightColor: 'transparent',
}

const photoGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
  gap: 'var(--space-2)',
  marginTop: 'var(--space-2)',
}

const photoThumbStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '1',
  objectFit: 'cover',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--glass-border)',
}

const reminderCardActionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  flexWrap: 'wrap',
  paddingTop: 'var(--space-2)',
}

const actionBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  padding: 'var(--space-1) var(--space-3)',
  minHeight: 'var(--tap-min)',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-medium)' as unknown as number,
  fontFamily: 'var(--font-sans)',
  cursor: 'pointer',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg-secondary)',
  color: 'var(--text-secondary)',
  transition: 'background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)',
  WebkitTapHighlightColor: 'transparent',
}

const actionBtnActiveStyle: CSSProperties = {
  ...actionBtnStyle,
  background: 'var(--accent-subtle)',
  border: '1px solid var(--accent-muted)',
  color: 'var(--accent)',
}

const actionBtnDangerStyle: CSSProperties = {
  ...actionBtnStyle,
  color: '#f87171',
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

const starLineRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  padding: 'var(--space-3) var(--space-2)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  minHeight: 'var(--tap-min)',
  background: 'transparent',
  border: 'none',
  width: '100%',
  fontFamily: 'var(--font-sans)',
  transition: 'background var(--duration-fast) var(--ease-out)',
  WebkitTapHighlightColor: 'transparent',
}

// ── Archive Styles ──

const archiveSectionHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  margin: 'var(--space-6) 0 var(--space-3)',
}

const archiveSectionTitleStyle: CSSProperties = {
  fontSize: 'var(--text-lg)',
  fontWeight: 'var(--weight-semibold)' as unknown as number,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  margin: 0,
}

const archiveDividerStyle: CSSProperties = {
  flex: 1,
  height: '1px',
  background: 'var(--glass-border)',
}

const archiveCardHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  WebkitTapHighlightColor: 'transparent',
  minHeight: 'var(--tap-min)',
}

const archiveDateTextStyle: CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--weight-semibold)' as unknown as number,
  color: 'var(--text-primary)',
  margin: 0,
}

const archiveBadgeRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flexWrap: 'wrap',
  marginTop: 'var(--space-1)',
}

const archiveBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--glass-bg-secondary)',
  border: '1px solid var(--glass-border)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-sans)',
  lineHeight: 1.4,
}

const archiveExpandedSectionStyle: CSSProperties = {
  padding: 'var(--space-3) 0',
  borderTop: '1px solid var(--glass-border)',
}

const archiveExpandedLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-semibold)' as unknown as number,
  color: 'var(--text-secondary)',
  margin: '0 0 var(--space-1)',
  fontFamily: 'var(--font-sans)',
}

const archiveExpandedTextStyle: CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--text-primary)',
  margin: 0,
  whiteSpace: 'pre-wrap',
  lineHeight: 1.6,
  fontFamily: 'var(--font-sans)',
}

// ── Main Screen ──

interface JournalScreenProps {
  onSearchPress?: () => void
}

export default function JournalScreen({ onSearchPress }: JournalScreenProps) {
  const dateStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const journal = useJournal(dateStr)
  const formattedDate = useMemo(() => formatDate(dateStr), [dateStr])

  const [activeView, setActiveView] = useState<ViewId>('entries')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [starSheet, setStarSheet] = useState<StarSheetState>({
    isOpen: false,
    section: '',
    lines: [],
  })
  const [expandedArchiveIds, setExpandedArchiveIds] = useState<Set<string>>(new Set())

  // ── Local buffer for section text (prevents debounce + live-query feedback loop) ──
  const [localSections, setLocalSections] = useState<Record<string, string>>({})
  const lastSectionEditRef = useRef<Record<string, number>>({})

  // Sync DB values → local buffer, but skip sections the user typed in recently
  useEffect(() => {
    const sections = journal.entry?.sections
    if (!sections) return
    setLocalSections((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(sections)) {
        if (Date.now() - (lastSectionEditRef.current[key] ?? 0) > 1000) {
          next[key] = (sections as Record<string, string>)[key] ?? ''
        }
      }
      return next
    })
  }, [journal.entry?.sections])

  // Live query for past journal entries (all entries except today's, excluding empty ones)
  const pastEntries = useLiveQuery(
    () =>
      db.journalEntries
        .filter((e) => !e.deletedAt && e.entryDate !== dateStr)
        .toArray()
        .then((entries) => {
          const sectionKeys = JOURNAL_SECTIONS.map((s) => s.key)
          return entries
            .filter((e) => {
              const sections = e.sections ?? {}
              return sectionKeys.some((k) => (sections as Record<string, string>)[k]?.trim())
            })
            .sort((a, b) => b.entryDate.localeCompare(a.entryDate))
        }),
    [dateStr],
    [] as JournalEntry[]
  )

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Archive toggle handler ──

  const toggleArchiveEntry = useCallback((id: string) => {
    setExpandedArchiveIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // ── Section handlers ──

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const handleSectionChange = useCallback(
    (sectionKey: SectionKey) => (value: string) => {
      lastSectionEditRef.current[sectionKey] = Date.now()
      setLocalSections((prev) => ({ ...prev, [sectionKey]: value }))
      journal.updateSection(sectionKey, value)
    },
    [journal.updateSection]
  )

  const handleOpenStarSheet = useCallback(
    (sectionKey: SectionKey) => {
      const text = journal.entry?.sections?.[sectionKey] ?? ''
      const lines = text.split('\n').filter((l: string) => l.trim().length > 0)
      if (lines.length === 0) return
      setStarSheet({ isOpen: true, section: sectionKey, lines })
    },
    [journal.entry]
  )

  const handleStarLine = useCallback(
    (text: string, lineIndex: number) => {
      journal.starLine(text, starSheet.section + ':' + lineIndex)
      setStarSheet({ isOpen: false, section: '', lines: [] })
    },
    [journal.starLine, starSheet.section]
  )

  const handleCloseStarSheet = useCallback(() => {
    setStarSheet({ isOpen: false, section: '', lines: [] })
  }, [])

  // ── Photo handlers ──

  const handleAddPhotoClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        // Create a local URI from the file for immediate preview
        const localUri = URL.createObjectURL(file)
        journal.addPhoto(file, localUri)
      }
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [journal.addPhoto]
  )

  // ── Section content getter ──

  const getSectionText = useCallback(
    (sectionKey: SectionKey): string => {
      return localSections[sectionKey] ?? journal.entry?.sections?.[sectionKey] ?? ''
    },
    [localSections, journal.entry]
  )

  // ── Loading state ──

  if (journal.isLoading) {
    return (
      <div style={screenStyle}>
        <div style={contentStyle}>
          <div style={{ padding: 'var(--space-4) 0' }}>
            <div
              style={{
                height: '28px',
                width: '180px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--glass-bg-primary)',
                border: '1px solid var(--glass-border)',
                marginBottom: 'var(--space-4)',
                opacity: 0,
                animation: 'settle-in var(--duration-settle) var(--ease-out) 100ms both',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-4)',
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 150ms both',
            }}
          >
            {[1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 'var(--tap-min)',
                  width: '90px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--glass-bg-primary)',
                  border: '1px solid var(--glass-border)',
                }}
              />
            ))}
          </div>
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

  // ── Render Entries View ──

  function renderEntries() {
    let delay = 200

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Date Header */}
        <h2 style={dateHeadingStyle}>{formattedDate}</h2>

        {/* Journal Sections */}
        {JOURNAL_SECTIONS.map((section) => {
          const isExpanded = expandedSections.has(section.key)
          const text = getSectionText(section.key)
          const firstLine = text.split('\n').find((l: string) => l.trim().length > 0) || ''
          const currentDelay = (delay += 80)

          return (
            <GlassCard
              key={section.key}
              padding="md"
              animationDelay={currentDelay}
            >
              {/* Section Header */}
              <button
                style={sectionHeaderStyle}
                onClick={() => toggleSection(section.key)}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${section.title}`}
              >
                <div style={sectionTitleGroupStyle}>
                  <span style={sectionEmojiStyle} aria-hidden="true">
                    {section.emoji}
                  </span>
                  <span style={sectionTitleTextStyle}>{section.title}</span>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'transform var(--duration-fast) var(--ease-out)',
                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  }}
                >
                  <ChevronDownIcon size={18} color="var(--text-tertiary)" />
                </span>
              </button>

              {/* Collapsed Preview */}
              {!isExpanded && (
                <p style={previewTextStyle}>
                  {firstLine || 'Tap to add...'}
                </p>
              )}

              {/* Expanded Body */}
              {isExpanded && (
                <div style={expandedBodyStyle}>
                  <GlassInput
                    value={text}
                    onChange={handleSectionChange(section.key)}
                    placeholder={section.prompt}
                    multiline
                    rows={4}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      style={starBtnStyle}
                      onClick={() => handleOpenStarSheet(section.key)}
                      aria-label={`Star a line in ${section.title}`}
                      title="Star a line to create a reminder"
                    >
                      <StarIcon size={16} color="var(--accent)" />
                    </button>
                  </div>
                </div>
              )}
            </GlassCard>
          )
        })}

        {/* Photo Section */}
        <GlassCard padding="md" animationDelay={(delay += 80)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={sectionTitleGroupStyle}>
              <CameraIcon size={18} color="var(--text-secondary)" />
              <span style={sectionTitleTextStyle}>Photos</span>
            </div>
            <GlassButton
              variant="secondary"
              size="sm"
              icon={<PlusIcon size={14} />}
              onClick={handleAddPhotoClick}
            >
              Add Photo
            </GlassButton>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          {/* Photo thumbnails */}
          {journal.attachments && journal.attachments.length > 0 && (
            <div style={photoGridStyle}>
              {journal.attachments.map((attachment, index) => (
                <div key={attachment.id} style={{ position: 'relative' }}>
                  <img
                    src={attachment.thumbnailUri || attachment.localUri || ''}
                    alt={`Photo ${index + 1}`}
                    style={photoThumbStyle}
                    loading="lazy"
                  />
                  <button
                    onClick={() => journal.deletePhoto(attachment.id)}
                    aria-label={`Delete photo ${index + 1}`}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <XIcon size={12} color="#fff" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {(!journal.attachments || journal.attachments.length === 0) && (
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)',
                margin: 'var(--space-2) 0 0',
                textAlign: 'center',
                padding: 'var(--space-4) 0',
              }}
            >
              No photos yet. Tap &quot;Add Photo&quot; to attach an image.
            </p>
          )}
        </GlassCard>

        {/* ── Archive Section ── */}
        {pastEntries.length > 0 && (
          <>
            {/* Section divider with label */}
            <div style={archiveSectionHeaderStyle}>
              <BookIcon size={18} color="var(--text-tertiary)" />
              <span style={archiveSectionTitleStyle}>Archive</span>
              <div style={archiveDividerStyle} />
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {pastEntries.length} {pastEntries.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {/* Past entry cards */}
            {pastEntries.map((entry, idx) => {
              const isExpanded = expandedArchiveIds.has(entry.id)
              const sections = entry.sections ?? {}
              const nonEmptySections = JOURNAL_SECTIONS.filter(
                (s) => sections[s.key]?.trim()
              )

              return (
                <GlassCard
                  key={entry.id}
                  padding="md"
                  animationDelay={600 + idx * 60}
                >
                  {/* Collapsed header */}
                  <button
                    style={archiveCardHeaderStyle}
                    onClick={() => toggleArchiveEntry(entry.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} journal entry from ${formatDate(entry.entryDate)}`}
                  >
                    <div>
                      <p style={archiveDateTextStyle}>
                        {formatDate(entry.entryDate)}
                      </p>
                      {!isExpanded && nonEmptySections.length > 0 && (
                        <div style={archiveBadgeRowStyle}>
                          {nonEmptySections.map((s) => (
                            <span key={s.key} style={archiveBadgeStyle}>
                              {s.emoji} {s.title}
                            </span>
                          ))}
                        </div>
                      )}
                      {!isExpanded && nonEmptySections.length === 0 && (
                        <p
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-tertiary)',
                            margin: 'var(--space-1) 0 0',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          Empty entry
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        transition: 'transform var(--duration-fast) var(--ease-out)',
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        flexShrink: 0,
                      }}
                    >
                      <ChevronDownIcon size={18} color="var(--text-tertiary)" />
                    </span>
                  </button>

                  {/* Expanded content (read-only) */}
                  {isExpanded && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0,
                        marginTop: 'var(--space-2)',
                      }}
                    >
                      {nonEmptySections.length > 0 ? (
                        nonEmptySections.map((s, sIdx) => (
                          <div
                            key={s.key}
                            style={{
                              ...archiveExpandedSectionStyle,
                              ...(sIdx === 0 ? { borderTop: '1px solid var(--glass-border)' } : {}),
                            }}
                          >
                            <p style={archiveExpandedLabelStyle}>
                              <span>{s.emoji}</span> {s.title}
                            </p>
                            <p style={archiveExpandedTextStyle}>
                              {sections[s.key]}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div style={archiveExpandedSectionStyle}>
                          <p
                            style={{
                              fontSize: 'var(--text-sm)',
                              color: 'var(--text-tertiary)',
                              margin: 0,
                              fontStyle: 'italic',
                            }}
                          >
                            No content was written for this day.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </>
        )}
      </div>
    )
  }

  // ── Render Reminders View ──

  function renderReminders() {
    const reminders = journal.allReminders ?? []

    if (reminders.length === 0) {
      return (
        <div style={emptyStateStyle}>
          <div
            style={{
              lineHeight: 1,
              marginBottom: 'var(--space-4)',
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 200ms both',
            }}
          >
            <StarIcon size={48} color="var(--text-tertiary)" />
          </div>
          <p
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--weight-semibold)' as unknown as number,
              color: 'var(--text-primary)',
              margin: '0 0 var(--space-2)',
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 250ms both',
            }}
          >
            No reminders yet.
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
              margin: 0,
              maxWidth: '280px',
              lineHeight: 1.5,
              opacity: 0,
              animation: 'settle-in var(--duration-settle) var(--ease-out) 300ms both',
            }}
          >
            Star a line in your journal to create one.
          </p>
        </div>
      )
    }

    // Sort: pinned first, then by creation date
    const sorted = [...reminders].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    })

    let delay = 150

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {sorted.map((reminder) => {
          const isSnoozed = !!reminder.snoozeUntil && new Date(reminder.snoozeUntil) > new Date()
          const currentDelay = (delay += 60)

          return (
            <GlassCard
              key={reminder.id}
              padding="md"
              animationDelay={currentDelay}
              style={isSnoozed ? { opacity: 0.5 } : undefined}
            >
              {/* Reminder text */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                {reminder.isPinned && (
                  <span
                    style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5, flexShrink: 0 }}
                    aria-label="Pinned"
                  >
                    {'\u{1F4CC}'}
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--weight-medium)' as unknown as number,
                      color: 'var(--text-primary)',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {reminder.text}
                  </p>
                  {/* Source info */}
                  {reminder.sourceLineRef && (
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                        margin: 'var(--space-1) 0 0',
                      }}
                    >
                      From: {reminder.sourceLineRef.split(':')[0]}
                    </p>
                  )}
                  {/* Snooze info */}
                  {isSnoozed && reminder.snoozeUntil && (
                    <p
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                        margin: 'var(--space-1) 0 0',
                      }}
                    >
                      <ClockIcon size={12} />
                      Snoozed until{' '}
                      {new Date(reminder.snoozeUntil).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Action row */}
              <div style={reminderCardActionRowStyle}>
                {/* Pin toggle */}
                <button
                  style={reminder.isPinned ? actionBtnActiveStyle : actionBtnStyle}
                  onClick={() => journal.togglePin(reminder.id)}
                  aria-label={reminder.isPinned ? 'Unpin reminder' : 'Pin reminder'}
                >
                  {'\u{1F4CC}'} {reminder.isPinned ? 'Pinned' : 'Pin'}
                </button>

                {/* Snooze button -- snooze to tomorrow */}
                <button
                  style={actionBtnStyle}
                  onClick={() => journal.snoozeReminder(reminder.id, getTomorrowStr())}
                  aria-label="Snooze reminder until tomorrow"
                >
                  <ClockIcon size={12} /> Snooze
                </button>

                {/* Show in Today toggle */}
                <button
                  style={reminder.surfaceInToday ? actionBtnActiveStyle : actionBtnStyle}
                  onClick={() => journal.toggleSurface(reminder.id)}
                  aria-label={reminder.surfaceInToday ? 'Hide from Today' : 'Show in Today'}
                >
                  <CheckIcon size={12} /> {reminder.surfaceInToday ? 'In Today' : 'Today'}
                </button>

                {/* Delete */}
                <button
                  style={actionBtnDangerStyle}
                  onClick={() => journal.deleteReminder(reminder.id)}
                  aria-label="Delete reminder"
                >
                  <XIcon size={12} /> Delete
                </button>
              </div>
            </GlassCard>
          )
        })}
      </div>
    )
  }

  // ── Main render ──

  return (
    <div style={screenStyle}>
      <Header title="Journal" syncStatus="synced" onSearchPress={onSearchPress} />
      <div style={contentStyle}>
        {/* Chip Tabs */}
        <div style={chipRowStyle}>
          {VIEWS.map((view) => (
            <GlassChip
              key={view.id}
              label={view.label}
              selected={activeView === view.id}
              onClick={() => setActiveView(view.id)}
              size="md"
            />
          ))}
        </div>

        {/* Active View */}
        {activeView === 'entries' ? renderEntries() : renderReminders()}

        {/* Bottom spacer */}
        <div style={{ height: 'var(--space-16)' }} />
      </div>

      {/* Star Line Picker Sheet */}
      <GlassSheet
        isOpen={starSheet.isOpen}
        onClose={handleCloseStarSheet}
        title="Which line to star?"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}
        >
          {starSheet.lines.map((line, index) => (
            <button
              key={index}
              style={starLineRowStyle}
              onClick={() => handleStarLine(line, index)}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'var(--glass-bg-secondary)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <StarIcon size={16} color="var(--accent)" />
              <span
                style={{
                  flex: 1,
                  fontSize: 'var(--text-base)',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  lineHeight: 1.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {line}
              </span>
            </button>
          ))}
        </div>
        {starSheet.lines.length === 0 && (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              padding: 'var(--space-6) 0',
              margin: 0,
            }}
          >
            No lines to star. Write something first.
          </p>
        )}
      </GlassSheet>
    </div>
  )
}
