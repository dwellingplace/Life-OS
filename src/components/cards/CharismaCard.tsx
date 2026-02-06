'use client';

import React, { type CSSProperties } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { HeartIcon, RefreshIcon, SparklesIcon } from '@/components/ui/Icons';

export interface CharismaCardProps {
  text: string;
  theme: string;
  onGotIt: () => void;
  onPin: () => void;
  onSwap: () => void;
  onFavorite: () => void;
}

export function CharismaCard({
  text,
  theme,
  onGotIt,
  onPin,
  onSwap,
  onFavorite,
}: CharismaCardProps) {
  const cardStyle: CSSProperties = {
    borderLeft: '3px solid var(--accent)',
  };

  const chipStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    color: 'var(--accent)',
    background: 'var(--accent-subtle)',
    padding: '2px var(--space-2)',
    borderRadius: 'var(--radius-full)',
    lineHeight: 'var(--leading-normal)',
    marginBottom: 'var(--space-3)',
  };

  const quoteStyle: CSSProperties = {
    fontSize: '17px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-regular)' as unknown as number,
    color: 'var(--text-primary)',
    lineHeight: 'var(--leading-relaxed)',
    margin: 0,
    marginBottom: 'var(--space-4)',
  };

  const actionsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  };

  const primaryActionStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-2) var(--space-4)',
    background: 'var(--accent)',
    color: '#0f1219',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    transition: `transform var(--duration-fast) var(--ease-out)`,
  };

  const iconBtnStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'var(--tap-min)',
    minWidth: 'var(--tap-min)',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: 'var(--space-2)',
    WebkitTapHighlightColor: 'transparent',
    transition: `color var(--duration-fast) var(--ease-out)`,
  };

  return (
    <GlassCard variant="primary" style={cardStyle}>
      <div style={chipStyle}>
        <SparklesIcon size={12} />
        <span>{theme}</span>
      </div>

      <p style={quoteStyle}>{text}</p>

      <div style={actionsStyle}>
        <button
          type="button"
          style={primaryActionStyle}
          onClick={onGotIt}
          aria-label="Got it"
        >
          Got it
        </button>

        <button
          type="button"
          style={iconBtnStyle}
          onClick={onPin}
          aria-label="Pin"
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 17v5M9 3h6l-1 7h3l-5 7-5-7h3L9 3z" />
          </svg>
        </button>

        <button
          type="button"
          style={iconBtnStyle}
          onClick={onSwap}
          aria-label="Swap"
        >
          <RefreshIcon size={20} />
        </button>

        <button
          type="button"
          style={iconBtnStyle}
          onClick={onFavorite}
          aria-label="Favorite"
        >
          <HeartIcon size={20} />
        </button>
      </div>
    </GlassCard>
  );
}

export default CharismaCard;
