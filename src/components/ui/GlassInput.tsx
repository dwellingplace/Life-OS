'use client';

import React, {
  useId,
  type ReactNode,
  type CSSProperties,
  type ChangeEvent,
} from 'react';

export interface GlassInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  icon?: ReactNode;
  label?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function GlassInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  icon,
  label,
  disabled = false,
  className,
  style,
}: GlassInputProps) {
  const generatedId = useId();
  const inputId = `glass-input-${generatedId}`;

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange(e.target.value);
  };

  const wrapperStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-2)',
    width: '100%',
    ...style,
  };

  const labelStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    lineHeight: 'var(--leading-tight)',
  };

  const fieldWrapperStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    width: '100%',
  };

  const iconWrapperStyle: CSSProperties = {
    position: 'absolute',
    left: 'var(--space-3)',
    top: multiline ? 'var(--space-3)' : '50%',
    transform: multiline ? 'none' : 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    color: 'var(--text-tertiary)',
    pointerEvents: 'none',
    zIndex: 1,
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    minHeight: 'var(--tap-min)',
    padding: icon
      ? 'var(--space-3) var(--space-4) var(--space-3) calc(var(--space-3) + var(--icon-md) + var(--space-2))'
      : 'var(--space-3) var(--space-4)',
    background: 'var(--glass-bg-primary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    backdropFilter: 'blur(var(--blur-light))',
    WebkitBackdropFilter: 'blur(var(--blur-light))',
    boxShadow: 'var(--glass-inner-glow)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-sans)',
    lineHeight: 'var(--leading-normal)',
    outline: 'none',
    transition: `
      border-color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out)
    `.trim(),
    WebkitTapHighlightColor: 'transparent',
    WebkitAppearance: 'none',
    ...(multiline
      ? {
          resize: 'vertical' as const,
          minHeight: '80px',
        }
      : {}),
    ...(disabled
      ? {
          opacity: 0.4,
          cursor: 'not-allowed',
        }
      : {}),
  };

  const sharedProps = {
    id: inputId,
    value,
    onChange: handleChange,
    placeholder,
    disabled,
    'aria-label': label || placeholder,
    style: inputStyle,
  };

  return (
    <>
      <style>{`
        .glass-input:focus {
          border-color: var(--accent-muted) !important;
          box-shadow: var(--glass-inner-glow), var(--accent-ring) !important;
        }
        .glass-input::placeholder {
          color: var(--text-tertiary);
        }
        .glass-input::-webkit-input-placeholder {
          color: var(--text-tertiary);
        }
      `}</style>
      <div className={className} style={wrapperStyle}>
        {label && (
          <label htmlFor={inputId} style={labelStyle}>
            {label}
          </label>
        )}
        <div style={fieldWrapperStyle}>
          {icon && (
            <span style={iconWrapperStyle} aria-hidden="true">
              {icon}
            </span>
          )}
          {multiline ? (
            <textarea
              {...sharedProps}
              rows={rows}
              className="glass-input"
            />
          ) : (
            <input
              {...sharedProps}
              type="text"
              className="glass-input"
            />
          )}
        </div>
      </div>
    </>
  );
}

export default GlassInput;
