'use client'

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type CSSProperties,
} from 'react'
import {
  SearchIcon,
  CheckIcon,
  BookIcon,
  StarIcon,
  DollarIcon,
  LayersIcon,
  XIcon as CloseIcon,
} from '@/components/ui/Icons'
import {
  globalSearch,
  type SearchResult,
  type SearchResultType,
} from '@/lib/repositories/searchRepository'

// ── Props ──

export interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

// ── Filter Chip Definitions ──

interface FilterChipDef {
  label: string
  type: SearchResultType | 'all'
}

const FILTER_CHIPS: FilterChipDef[] = [
  { label: 'All', type: 'all' },
  { label: 'Tasks', type: 'task' },
  { label: 'Journal', type: 'journal' },
  { label: 'Reminders', type: 'reminder' },
  { label: 'Finance', type: 'finance' },
  { label: 'Templates', type: 'template' },
]

// ── Icon Mapping ──

const RESULT_TYPE_ICON: Record<string, React.ReactNode> = {
  task: <CheckIcon size={18} color="var(--accent)" />,
  journal: <BookIcon size={18} color="var(--accent)" />,
  reminder: <StarIcon size={18} color="var(--text-secondary)" />,
  charisma: <StarIcon size={18} color="var(--accent-muted)" />,
  finance: <DollarIcon size={18} color="var(--accent)" />,
  template: <LayersIcon size={18} color="var(--accent)" />,
}

// ── Date Formatting ──

function formatShortDate(date: string | Date | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${months[d.getMonth()]} ${d.getDate()}`
}

// ── Component ──

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<SearchResultType[]>([])
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auto-focus input when overlay opens ──

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ''
      }
    } else {
      document.body.style.overflow = ''
      setQuery('')
      setResults([])
      setActiveFilters([])
      setIsSearching(false)
    }
  }, [isOpen])

  // ── Close on Escape ──

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // ── Debounced search ──

  const performSearch = useCallback(
    async (searchQuery: string, filters: SearchResultType[]) => {
      if (!searchQuery.trim()) {
        setResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const searchResults = await globalSearch(
          searchQuery,
          filters.length > 0 ? filters : undefined
        )
        setResults(searchResults)
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
      }
    },
    []
  )

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!query.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceRef.current = setTimeout(() => {
      performSearch(query, activeFilters)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, activeFilters, performSearch])

  // ── Filter chip toggle ──

  const handleFilterToggle = useCallback((chipType: SearchResultType | 'all') => {
    if (chipType === 'all') {
      setActiveFilters([])
      return
    }

    setActiveFilters((prev) => {
      if (prev.includes(chipType)) {
        return prev.filter((f) => f !== chipType)
      }
      return [...prev, chipType]
    })
  }, [])

  // ── Backdrop click ──

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  // ── Determine empty state message ──

  const emptyStateMessage = useMemo(() => {
    if (!query.trim()) {
      return 'Search across all your data'
    }
    if (!isSearching && results.length === 0) {
      return `No results for "${query}"`
    }
    return null
  }, [query, isSearching, results.length])

  if (!isOpen) return null

  // ── Styles ──

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 'var(--z-sheet)' as unknown as number,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(var(--blur-medium))',
    WebkitBackdropFilter: 'blur(var(--blur-medium))',
    animation: 'searchOverlayFadeIn var(--duration-normal) var(--ease-out) forwards',
  }

  const contentStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '500px',
    height: '100%',
    margin: '0 auto',
    background: 'var(--glass-bg-modal)',
    backdropFilter: 'blur(var(--blur-heavy))',
    WebkitBackdropFilter: 'blur(var(--blur-heavy))',
    animation: 'searchOverlaySlideUp var(--duration-normal) var(--ease-out) forwards',
  }

  const searchBarStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-4) var(--space-3)',
    borderBottom: '1px solid var(--glass-border)',
    flexShrink: 0,
  }

  const inputWrapperStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  }

  const inputIconStyle: CSSProperties = {
    position: 'absolute',
    left: 'var(--space-3)',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    color: 'var(--text-tertiary)',
    pointerEvents: 'none',
    zIndex: 1,
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-3) var(--space-4) var(--space-3) calc(var(--space-3) + 18px + var(--space-2))',
    background: 'var(--glass-bg-primary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-sans)',
    lineHeight: 1.5,
    outline: 'none',
    transition: `border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)`,
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none' as const,
  }

  const closeButtonStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'var(--tap-min)',
    height: 'var(--tap-min)',
    borderRadius: 'var(--radius-full)',
    background: 'var(--glass-bg-secondary)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    flexShrink: 0,
    transition: `background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)`,
    WebkitTapHighlightColor: 'transparent',
  }

  const chipsRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-4)',
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
    flexShrink: 0,
    borderBottom: '1px solid var(--glass-border)',
    scrollbarWidth: 'none' as const,
  }

  const resultsContainerStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'calc(var(--space-6) + var(--safe-area-bottom))',
  }

  const emptyStateStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-16) var(--space-6)',
    textAlign: 'center',
    color: 'var(--text-tertiary)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    lineHeight: 1.5,
  }

  const loadingStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-6)',
    color: 'var(--text-tertiary)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
  }

  return (
    <>
      <style>{`
        @keyframes searchOverlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes searchOverlaySlideUp {
          from {
            transform: translateY(12px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .search-overlay-input:focus {
          border-color: var(--accent-muted) !important;
          box-shadow: var(--accent-ring) !important;
        }
        .search-overlay-input::placeholder {
          color: var(--text-tertiary);
        }
        .search-overlay-chips::-webkit-scrollbar {
          display: none;
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes searchOverlayFadeIn {
            from { opacity: 1; }
            to { opacity: 1; }
          }
          @keyframes searchOverlaySlideUp {
            from { transform: none; opacity: 1; }
            to { transform: none; opacity: 1; }
          }
        }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        style={overlayStyle}
        onClick={handleBackdropClick}
      >
        <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
          {/* Search bar */}
          <div style={searchBarStyle}>
            <div style={inputWrapperStyle}>
              <span style={inputIconStyle} aria-hidden="true">
                <SearchIcon size={18} />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                aria-label="Search query"
                className="search-overlay-input"
                style={inputStyle}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
            <button
              type="button"
              aria-label="Close search"
              style={closeButtonStyle}
              onClick={onClose}
            >
              <CloseIcon size={20} />
            </button>
          </div>

          {/* Filter chips */}
          <div
            className="search-overlay-chips"
            style={chipsRowStyle}
            role="listbox"
            aria-label="Filter results"
          >
            {FILTER_CHIPS.map((chip) => {
              const isAll = chip.type === 'all'
              const isSelected = isAll
                ? activeFilters.length === 0
                : activeFilters.includes(chip.type as SearchResultType)

              return (
                <FilterChip
                  key={chip.label}
                  label={chip.label}
                  selected={isSelected}
                  onClick={() => handleFilterToggle(chip.type)}
                />
              )
            })}
          </div>

          {/* Results area */}
          <div style={resultsContainerStyle}>
            {isSearching && query.trim() && results.length === 0 ? (
              <div style={loadingStyle}>Searching...</div>
            ) : emptyStateMessage ? (
              <div style={emptyStateStyle}>
                <SearchIcon size={32} color="var(--text-tertiary)" />
                <div style={{ marginTop: 'var(--space-3)' }}>
                  {emptyStateMessage}
                </div>
              </div>
            ) : (
              results.map((result, index) => (
                <SearchResultRow key={result.id ?? index} result={result} />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Filter Chip Sub-component ──

interface FilterChipProps {
  label: string
  selected: boolean
  onClick: () => void
}

function FilterChip({ label, selected, onClick }: FilterChipProps) {
  const chipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-1) var(--space-3)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    lineHeight: 1.4,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: `
      background var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out)
    `.trim(),
    ...(selected
      ? {
          background: 'var(--accent-subtle)',
          border: '1px solid var(--accent-muted)',
          color: 'var(--accent)',
          boxShadow: '0 0 12px rgba(92, 224, 214, 0.15)',
        }
      : {
          background: 'var(--glass-bg-secondary)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text-secondary)',
          boxShadow: 'none',
        }),
  }

  return (
    <button
      type="button"
      role="option"
      aria-pressed={selected}
      aria-label={label}
      style={chipStyle}
      onClick={onClick}
      tabIndex={0}
    >
      {label}
    </button>
  )
}

// ── Search Result Row Sub-component ──

interface SearchResultRowProps {
  result: SearchResult
}

function SearchResultRow({ result }: SearchResultRowProps) {
  const icon = RESULT_TYPE_ICON[result.type] ?? (
    <SearchIcon size={18} color="var(--text-tertiary)" />
  )
  const dateLabel = formatShortDate(result.date)
  const subtitle = result.matchContext ?? result.subtitle ?? ''

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    borderBottom: '1px solid var(--glass-border)',
    cursor: 'pointer',
    transition: `background var(--duration-fast) var(--ease-out)`,
    WebkitTapHighlightColor: 'transparent',
    minHeight: 'var(--tap-min)',
  }

  const iconContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--glass-bg-secondary)',
    border: '1px solid var(--glass-border)',
    flexShrink: 0,
  }

  const textContainerStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  }

  const titleStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const subtitleStyle: CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const dateStyle: CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    color: 'var(--text-tertiary)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }

  return (
    <div style={rowStyle} role="button" tabIndex={0}>
      <div style={iconContainerStyle} aria-hidden="true">
        {icon}
      </div>
      <div style={textContainerStyle}>
        <div style={titleStyle}>{result.title}</div>
        {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
      </div>
      {dateLabel && <div style={dateStyle}>{dateLabel}</div>}
    </div>
  )
}

export default SearchOverlay
