'use client';

import React, { useId, type CSSProperties } from 'react';

export type CheckboxSize = 'sm' | 'md';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: CheckboxSize;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const sizeMap: Record<CheckboxSize, { box: number; icon: number; fontSize: string }> = {
  sm: { box: 20, icon: 12, fontSize: 'var(--text-sm)' },
  md: { box: 24, icon: 14, fontSize: 'var(--text-base)' },
};

export function Checkbox({
  checked,
  onChange,
  label,
  size = 'md',
  disabled = false,
  className,
  style,
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = `checkbox-${generatedId}`;
  const dims = sizeMap[size];

  const wrapperStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minHeight: 'var(--tap-min)',
    minWidth: 'var(--tap-min)',
    padding: 'var(--space-2)',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    opacity: disabled ? 0.4 : 1,
    ...style,
  };

  const boxStyle: CSSProperties = {
    position: 'relative',
    width: `${dims.box}px`,
    height: `${dims.box}px`,
    borderRadius: 'var(--radius-sm)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `
      background var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out),
      transform var(--duration-fast) var(--ease-spring)
    `.trim(),
    ...(checked
      ? {
          background: 'var(--accent)',
          border: '2px solid var(--accent)',
          boxShadow: '0 0 10px rgba(92, 224, 214, 0.3)',
        }
      : {
          background: 'var(--glass-bg-secondary)',
          border: '2px solid var(--glass-border-strong)',
          boxShadow: 'var(--glass-inner-glow)',
        }),
  };

  const checkmarkStyle: CSSProperties = {
    width: `${dims.icon}px`,
    height: `${dims.icon}px`,
    display: checked ? 'block' : 'none',
    animation: checked ? 'checkboxPop var(--duration-normal) var(--ease-spring)' : 'none',
  };

  const labelStyle: CSSProperties = {
    fontSize: dims.fontSize,
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-regular)' as unknown as number,
    color: checked ? 'var(--text-secondary)' : 'var(--text-primary)',
    lineHeight: 'var(--leading-normal)',
    textDecoration: checked ? 'line-through' : 'none',
    transition: `color var(--duration-fast) var(--ease-out), text-decoration-color var(--duration-fast) var(--ease-out)`,
    textDecorationColor: checked ? 'var(--text-tertiary)' : 'transparent',
  };

  const hiddenInputStyle: CSSProperties = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  };

  return (
    <>
      <style>{`
        @keyframes checkboxPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .glass-checkbox-box:has(+ .glass-checkbox-hidden:focus-visible),
        .glass-checkbox-wrapper:focus-within .glass-checkbox-box {
          box-shadow: var(--accent-ring) !important;
        }
        .glass-checkbox-wrapper:active .glass-checkbox-box {
          transform: scale(0.9);
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes checkboxPop {
            from { transform: scale(1); opacity: 1; }
            to { transform: scale(1); opacity: 1; }
          }
          .glass-checkbox-wrapper:active .glass-checkbox-box {
            transform: none;
          }
        }
      `}</style>
      <label
        htmlFor={inputId}
        className={`glass-checkbox-wrapper${className ? ` ${className}` : ''}`}
        style={wrapperStyle}
      >
        <span className="glass-checkbox-box" style={boxStyle} aria-hidden="true">
          <svg
            viewBox="0 0 14 14"
            fill="none"
            style={checkmarkStyle}
            aria-hidden="true"
          >
            <path
              d="M2.5 7.5L5.5 10.5L11.5 3.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <input
          id={inputId}
          type="checkbox"
          className="glass-checkbox-hidden"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          style={hiddenInputStyle}
          aria-label={label || 'checkbox'}
        />
        {label && <span style={labelStyle}>{label}</span>}
      </label>
    </>
  );
}

export default Checkbox;
