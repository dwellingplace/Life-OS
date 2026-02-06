'use client'

import React from 'react'

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
}

const defaults: Required<Pick<IconProps, 'size' | 'color' | 'strokeWidth'>> = {
  size: 24,
  color: 'currentColor',
  strokeWidth: 1.5,
}

function makeIcon(
  name: string,
  paths: (p: Required<Pick<IconProps, 'strokeWidth'>>) => React.ReactNode
) {
  const Icon = React.memo(function Icon({
    size = defaults.size,
    color = defaults.color,
    strokeWidth = defaults.strokeWidth,
    className,
  }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {paths({ strokeWidth })}
      </svg>
    )
  })
  Icon.displayName = name
  return Icon
}

// ── Tab Icons ──

export const SunIcon = makeIcon('SunIcon', () => (
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>
))

export const LayersIcon = makeIcon('LayersIcon', () => (
  <>
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </>
))

export const CheckSquareIcon = makeIcon('CheckSquareIcon', () => (
  <>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </>
))

export const BookIcon = makeIcon('BookIcon', () => (
  <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 004 17V5a2 2 0 012-2h13a1 1 0 011 1v13M6.5 17H20v2.5a.5.5 0 01-.5.5H6.5A2.5 2.5 0 014 17.5" />
))

export const BarChartIcon = makeIcon('BarChartIcon', () => (
  <>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </>
))

// ── Card / Action Icons ──

export const PlusIcon = makeIcon('PlusIcon', () => (
  <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </>
))

export const ChevronRightIcon = makeIcon('ChevronRightIcon', () => (
  <path d="M9 18l6-6-6-6" />
))

export const ChevronDownIcon = makeIcon('ChevronDownIcon', () => (
  <path d="M6 9l6 6 6-6" />
))

export const StarIcon = makeIcon('StarIcon', () => (
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
))

export const ClockIcon = makeIcon('ClockIcon', () => (
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </>
))

export const CameraIcon = makeIcon('CameraIcon', () => (
  <>
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </>
))

export const SearchIcon = makeIcon('SearchIcon', () => (
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>
))

export const DumbbellIcon = makeIcon('DumbbellIcon', () => (
  <>
    <path d="M6.5 6.5h11M6 9V4M18 9V4M3 9h4M17 9h4M3 9v6M7 9v6M17 9v6M21 9v6M3 15h4M17 15h4M6 20v-5M18 20v-5M6.5 17.5h11" />
  </>
))

export const HeartIcon = makeIcon('HeartIcon', () => (
  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
))

export const SparklesIcon = makeIcon('SparklesIcon', () => (
  <>
    <path d="M12 3l1.45 4.35L18 8.5l-4.55 1.15L12 14l-1.45-4.35L6 8.5l4.55-1.15L12 3z" />
    <path d="M19 14l.87 2.61L22.5 17.5l-2.63.89L19 21l-.87-2.61L15.5 17.5l2.63-.89L19 14z" />
  </>
))

export const BriefcaseIcon = makeIcon('BriefcaseIcon', () => (
  <>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </>
))

export const DollarIcon = makeIcon('DollarIcon', () => (
  <>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </>
))

export const ZapIcon = makeIcon('ZapIcon', () => (
  <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
))

export const MoonIcon = makeIcon('MoonIcon', () => (
  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
))

export const SettingsIcon = makeIcon('SettingsIcon', () => (
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </>
))

export const XIcon = makeIcon('XIcon', () => (
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>
))

export const CheckIcon = makeIcon('CheckIcon', () => (
  <path d="M20 6L9 17l-5-5" />
))

export const MoreHorizontalIcon = makeIcon('MoreHorizontalIcon', () => (
  <>
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
  </>
))

export const RefreshIcon = makeIcon('RefreshIcon', () => (
  <>
    <path d="M1 4v6h6" />
    <path d="M23 20v-6h-6" />
    <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" />
  </>
))

export const WifiOffIcon = makeIcon('WifiOffIcon', () => (
  <>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </>
))
