'use client';

import React, { type ReactNode, type CSSProperties, type ButtonHTMLAttributes } from 'react';

export type GlassButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type GlassButtonSize = 'sm' | 'md' | 'lg';

export interface GlassButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  children: ReactNode;
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  style?: CSSProperties;
}

const sizeStyles: Record<GlassButtonSize, CSSProperties> = {
  sm: {
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--text-sm)',
    gap: 'var(--space-1)',
  },
  md: {
    minHeight: 'var(--tap-min)',
    padding: 'var(--space-3) var(--space-5)',
    fontSize: 'var(--text-base)',
    gap: 'var(--space-2)',
  },
  lg: {
    minHeight: '52px',
    padding: 'var(--space-4) var(--space-6)',
    fontSize: 'var(--text-md)',
    gap: 'var(--space-2)',
  },
};

const variantStyles: Record<GlassButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: '#0f1219',
    border: '1px solid transparent',
    boxShadow: 'var(--accent-glow)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
  },
  secondary: {
    background: 'var(--glass-bg-primary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border-strong)',
    boxShadow: 'var(--glass-inner-glow)',
    backdropFilter: 'blur(var(--blur-light))',
    WebkitBackdropFilter: 'blur(var(--blur-light))',
    fontWeight: 'var(--weight-medium)' as unknown as number,
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
    boxShadow: 'none',
    fontWeight: 'var(--weight-medium)' as unknown as number,
  },
  danger: {
    background: 'var(--status-danger-muted)',
    color: 'var(--status-danger)',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    boxShadow: 'none',
    fontWeight: 'var(--weight-medium)' as unknown as number,
  },
};

const disabledStyle: CSSProperties = {
  opacity: 0.4,
  cursor: 'not-allowed',
  pointerEvents: 'none',
};

export function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  icon,
  style,
  className,
  ...rest
}: GlassButtonProps) {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-sans)',
    lineHeight: 'var(--leading-tight)',
    cursor: 'pointer',
    transition: `
      transform var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out),
      background var(--duration-fast) var(--ease-out),
      opacity var(--duration-fast) var(--ease-out)
    `.trim(),
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    outline: 'none',
    ...(fullWidth ? { width: '100%' } : {}),
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...(disabled ? disabledStyle : {}),
    ...style,
  };

  return (
    <>
      <style>{`
        .glass-button:focus-visible {
          box-shadow: var(--accent-ring) !important;
          outline: none;
        }
        .glass-button:active:not(:disabled) {
          transform: scale(0.97);
        }
        .glass-button.variant-primary:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        .glass-button.variant-secondary:hover:not(:disabled) {
          background: var(--glass-bg-elevated);
          border-color: var(--glass-border-strong);
        }
        .glass-button.variant-ghost:hover:not(:disabled) {
          background: var(--glass-bg-secondary);
          color: var(--text-primary);
        }
        .glass-button.variant-danger:hover:not(:disabled) {
          background: rgba(248, 113, 113, 0.2);
        }
        @media (prefers-reduced-motion: reduce) {
          .glass-button:active:not(:disabled) {
            transform: none;
          }
        }
      `}</style>
      <button
        className={`glass-button variant-${variant}${className ? ` ${className}` : ''}`}
        style={baseStyle}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        {...rest}
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
        {children}
      </button>
    </>
  );
}

export default GlassButton;
