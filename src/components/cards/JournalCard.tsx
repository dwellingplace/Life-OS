'use client';

import React, { useState, useEffect, useRef, type CSSProperties } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { BookIcon, CameraIcon } from '@/components/ui/Icons';

export interface JournalCardProps {
  title: string;
  prompt: string;
  value: string;
  onChange: (text: string) => void;
  onExpand: () => void;
}

export function JournalCard({
  title,
  prompt,
  value,
  onChange,
  onExpand,
}: JournalCardProps) {
  // Local state buffer to prevent the debounced DB write + useLiveQuery
  // feedback loop from resetting the textarea while typing.
  const [localValue, setLocalValue] = useState(value);
  const lastEditRef = useRef(0);

  useEffect(() => {
    // Only sync from prop if we haven't typed recently (avoids overwrite during debounce)
    if (Date.now() - lastEditRef.current > 1000) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (text: string) => {
    lastEditRef.current = Date.now();
    setLocalValue(text);
    onChange(text);
  };
  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-1)',
  };

  const titleStyle: CSSProperties = {
    fontSize: 'var(--text-md)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: 'var(--text-primary)',
    margin: 0,
  };

  const promptStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-regular)' as unknown as number,
    color: 'var(--text-secondary)',
    lineHeight: 'var(--leading-normal)',
    marginBottom: 'var(--space-3)',
  };

  const textareaStyle: CSSProperties = {
    width: '100%',
    minHeight: '72px',
    maxHeight: '120px',
    padding: 'var(--space-3)',
    background: 'var(--glass-bg-secondary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-sans)',
    lineHeight: 'var(--leading-normal)',
    resize: 'none',
    outline: 'none',
    transition: `border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)`,
    WebkitAppearance: 'none',
    boxSizing: 'border-box' as const,
  };

  const footerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'var(--space-3)',
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

  const expandBtnStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-2) var(--space-3)',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    color: 'var(--accent)',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    transition: `color var(--duration-fast) var(--ease-out)`,
  };

  return (
    <GlassCard>
      <style>{`
        .journal-textarea:focus {
          border-color: var(--accent-muted) !important;
          box-shadow: var(--glass-inner-glow), var(--accent-ring) !important;
        }
        .journal-textarea::placeholder {
          color: var(--text-tertiary);
        }
      `}</style>

      <div style={headerStyle}>
        <BookIcon size={18} color="var(--accent)" />
        <h3 style={titleStyle}>{title}</h3>
      </div>

      <p style={promptStyle}>{prompt}</p>

      <textarea
        className="journal-textarea"
        style={textareaStyle}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Write your thoughts..."
        rows={3}
        aria-label="Journal entry"
      />

      <div style={footerStyle}>
        <button
          type="button"
          style={iconBtnStyle}
          onClick={() => {}}
          aria-label="Add photo"
        >
          <CameraIcon size={20} />
        </button>

        <button
          type="button"
          style={expandBtnStyle}
          onClick={onExpand}
          aria-label="Expand journal"
        >
          Expand
        </button>
      </div>
    </GlassCard>
  );
}

export default JournalCard;
