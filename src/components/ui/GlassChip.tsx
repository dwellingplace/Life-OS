'use client';

import React, { type ReactNode, type CSSProperties } from 'react';

export type GlassChipSize = 'sm' | 'md';

export interface GlassChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  size?: GlassChipSize;
  className?: string;
  style?: CSSProperties;
}

const sizeStyles: Record<GlassChipSize, CSSProperties> = {
  sm: {
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-1) var(--space-3)',
    fontSize: 'var(--text-xs)',
    gap: 'var(--space-1)',
  },
  md: {
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-2) var(--space-4)',
    fontSize: 'var(--text-sm)',
    gap: 'var(--space-2)',
  },
};

export function GlassChip({
  label,
  selected = false,
  onClick,
  icon,
  size = 'md',
  className,
  style,
}: GlassChipProps) {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    lineHeight: 'var(--leading-tight)',
    cursor: onClick ? 'pointer' : 'default',
    transition: `
      background var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out),
      color var(--duration-fast) var(--ease-out),
      transform var(--duration-fast) var(--ease-out)
    `.trim(),
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    outline: 'none',
    whiteSpace: 'nowrap',
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
    ...sizeStyles[size],
    ...style,
  };

  return (
    <>
      <style>{`
        .glass-chip:focus-visible {
          box-shadow: var(--accent-ring) !important;
        }
        .glass-chip:active {
          transform: scale(0.95);
        }
        .glass-chip:hover {
          border-color: var(--glass-border-strong);
        }
        .glass-chip[aria-pressed="true"]:hover {
          border-color: var(--accent);
        }
        @media (prefers-reduced-motion: reduce) {
          .glass-chip:active {
            transform: none;
          }
        }
      `}</style>
      <button
        type="button"
        role="option"
        aria-pressed={selected}
        aria-label={label}
        className={`glass-chip${className ? ` ${className}` : ''}`}
        style={baseStyle}
        onClick={onClick}
        tabIndex={0}
      >
        {icon && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <span>{label}</span>
      </button>
    </>
  );
}

export default GlassChip;
