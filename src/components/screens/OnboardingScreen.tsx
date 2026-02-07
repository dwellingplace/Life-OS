'use client'

import { useState, type CSSProperties } from 'react'
import { PRESETS, applyPreset, type OnboardingPreset, type PresetConfig } from '@/lib/onboarding/presets'
import { seedDatabase } from '@/lib/db/seed'

interface OnboardingScreenProps {
  onComplete: () => void
}

const TOTAL_STEPS = 3

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0)
  const [selectedPreset, setSelectedPreset] = useState<PresetConfig | null>(null)

  const handleNext = () => {
    if (step === 1 && !selectedPreset) return
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleStart = async () => {
    // Seed first so templates + settings record exist before applying preset
    await seedDatabase()
    if (selectedPreset) {
      await applyPreset(selectedPreset.id)
    }
    onComplete()
  }

  // ---- Styles ----

  const containerStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--glass-bg-primary)',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    padding: 'var(--space-6)',
    overflow: 'hidden',
  }

  const indicatorContainerStyle: CSSProperties = {
    display: 'flex',
    gap: 'var(--space-2)',
    position: 'absolute',
    top: 'var(--space-8)',
  }

  const dotStyle = (index: number): CSSProperties => ({
    width: index === step ? 24 : 8,
    height: 8,
    borderRadius: 'var(--radius-full)',
    background: index === step ? 'var(--accent)' : 'var(--accent-muted)',
    transition: 'all 0.3s ease',
  })

  const contentWrapperStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: 480,
    width: '100%',
    gap: 'var(--space-6)',
    animation: 'settle-in var(--duration-settle) var(--ease-out)',
  }

  const titleStyle: CSSProperties = {
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--weight-bold)' as unknown as number,
    color: 'var(--text-primary)',
    margin: 0,
  }

  const descriptionStyle: CSSProperties = {
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    color: 'var(--text-secondary)',
    margin: 0,
    lineHeight: 1.6,
  }

  const presetsContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
    width: '100%',
  }

  const presetCardStyle = (preset: PresetConfig): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
    padding: 'var(--space-4)',
    background:
      selectedPreset?.id === preset.id
        ? 'var(--accent-subtle)'
        : 'var(--glass-bg-secondary)',
    border:
      selectedPreset?.id === preset.id
        ? '2px solid var(--accent)'
        : '2px solid transparent',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    minHeight: 'var(--tap-min)',
  })

  const presetIconStyle: CSSProperties = {
    fontSize: 'var(--text-2xl)',
    flexShrink: 0,
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--glass-bg-modal)',
    borderRadius: 'var(--radius-md)',
  }

  const presetNameStyle: CSSProperties = {
    fontSize: 'var(--text-lg)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: 'var(--text-primary)',
    margin: 0,
  }

  const presetDescStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-tertiary)',
    margin: 0,
    marginTop: 'var(--space-1)',
    lineHeight: 1.4,
  }

  const buttonRowStyle: CSSProperties = {
    display: 'flex',
    gap: 'var(--space-3)',
    width: '100%',
    maxWidth: 480,
    marginTop: 'var(--space-4)',
  }

  const primaryButtonStyle = (disabled?: boolean): CSSProperties => ({
    flex: 1,
    padding: 'var(--space-3) var(--space-6)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    fontFamily: 'var(--font-sans)',
    color: '#fff',
    background: disabled ? 'var(--accent-muted)' : 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-xl)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minHeight: 'var(--tap-min)',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
  })

  const secondaryButtonStyle: CSSProperties = {
    padding: 'var(--space-3) var(--space-6)',
    fontSize: 'var(--text-md)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    background: 'var(--glass-bg-secondary)',
    border: 'none',
    borderRadius: 'var(--radius-xl)',
    cursor: 'pointer',
    minHeight: 'var(--tap-min)',
    transition: 'all 0.2s ease',
  }

  // ---- Step Content ----

  const renderWelcome = () => (
    <div key="welcome" style={contentWrapperStyle}>
      <h1 style={titleStyle}>Welcome to Life OS</h1>
      <p style={descriptionStyle}>
        Your all-in-one productivity system for tasks, habits, journaling, and
        personal growth. Let&apos;s set things up so it works perfectly for you.
      </p>
    </div>
  )

  const renderPresets = () => (
    <div
      key="presets"
      style={contentWrapperStyle}
    >
      <h1 style={titleStyle}>Choose Your Setup</h1>
      <p style={descriptionStyle}>
        Pick a starting point. You can always customize everything later.
      </p>
      <div style={presetsContainerStyle}>
        {PRESETS.map((preset, index) => (
          <div
            key={preset.id}
            style={{
              ...presetCardStyle(preset),
              animation: `settle-in var(--duration-settle) var(--ease-out)`,
              animationDelay: `${index * 80}ms`,
              animationFillMode: 'backwards',
            }}
            onClick={() => setSelectedPreset(preset)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelectedPreset(preset)
              }
            }}
          >
            <div style={presetIconStyle}>{preset.icon}</div>
            <div>
              <p style={presetNameStyle}>{preset.name}</p>
              <p style={presetDescStyle}>{preset.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderReady = () => (
    <div key="ready" style={contentWrapperStyle}>
      <h1 style={titleStyle}>You&apos;re All Set</h1>
      <p style={descriptionStyle}>
        Your Life OS is ready to go
        {selectedPreset ? ` with the ${selectedPreset.name} setup` : ''}.
        Start building the life you want, one day at a time.
      </p>
    </div>
  )

  const stepContent = [renderWelcome, renderPresets, renderReady]

  // ---- Render ----

  return (
    <div style={containerStyle}>
      {/* Step indicator */}
      <div style={indicatorContainerStyle}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={dotStyle(i)} />
        ))}
      </div>

      {/* Current step content */}
      {stepContent[step]()}

      {/* Navigation buttons */}
      <div style={buttonRowStyle}>
        {step > 0 && (
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={handleBack}
          >
            Back
          </button>
        )}

        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            style={primaryButtonStyle(step === 1 && !selectedPreset)}
            onClick={handleNext}
            disabled={step === 1 && !selectedPreset}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            style={primaryButtonStyle(false)}
            onClick={handleStart}
          >
            Start
          </button>
        )}
      </div>
    </div>
  )
}
