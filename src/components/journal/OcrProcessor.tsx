'use client'

import React, { useState, useCallback, useEffect, type CSSProperties } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassSheet } from '@/components/ui/GlassSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'
import { CheckIcon, XIcon } from '@/components/ui/Icons'

// ── Types ──

interface OcrProcessorProps {
  attachmentId: string
  imageUri: string
  existingOcr?: { id: string; rawText: string; editedText: string; confidence?: number }
  onSave: (attachmentId: string, rawText: string, confidence: number) => Promise<void>
  onUpdate: (ocrId: string, editedText: string) => Promise<void>
}

type OcrStatus = 'idle' | 'loading' | 'processing' | 'done' | 'error'

// ── Styles ──

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
}

const progressBarOuter: CSSProperties = {
  width: '100%',
  height: '4px',
  borderRadius: 'var(--radius-full)',
  background: 'var(--glass-bg-secondary)',
  overflow: 'hidden',
}

const statusTextStyle: CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-sans)',
  textAlign: 'center',
}

const confidenceStyle: CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-sans)',
}

const actionRowStyle: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  justifyContent: 'flex-end',
  paddingTop: 'var(--space-2)',
}

// ── Component ──

export function OcrProcessor({
  attachmentId,
  imageUri,
  existingOcr,
  onSave,
  onUpdate,
}: OcrProcessorProps) {
  const [status, setStatus] = useState<OcrStatus>(existingOcr ? 'done' : 'idle')
  const [progress, setProgress] = useState(0)
  const [rawText, setRawText] = useState(existingOcr?.rawText ?? '')
  const [editedText, setEditedText] = useState(existingOcr?.editedText ?? '')
  const [confidence, setConfidence] = useState(existingOcr?.confidence ?? 0)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runOcr = useCallback(async () => {
    if (status === 'processing' || status === 'loading') return

    setStatus('loading')
    setProgress(0)
    setError(null)

    try {
      // Dynamic import to keep bundle small
      const Tesseract = await import('tesseract.js')

      setStatus('processing')

      const result = await Tesseract.recognize(imageUri, 'eng', {
        logger: (info: { status: string; progress: number }) => {
          if (info.status === 'recognizing text') {
            setProgress(Math.round(info.progress * 100))
          }
        },
      })

      const text = result.data.text.trim()
      const conf = Math.round(result.data.confidence)

      setRawText(text)
      setEditedText(text)
      setConfidence(conf)
      setStatus('done')

      // Save to database
      await onSave(attachmentId, text, conf)
    } catch (err) {
      console.error('OCR failed:', err)
      setError(err instanceof Error ? err.message : 'OCR processing failed')
      setStatus('error')
    }
  }, [status, imageUri, attachmentId, onSave])

  const handleSaveEdit = useCallback(async () => {
    if (!existingOcr) return
    await onUpdate(existingOcr.id, editedText)
    setIsEditing(false)
  }, [existingOcr, editedText, onUpdate])

  const handleCancelEdit = useCallback(() => {
    setEditedText(existingOcr?.editedText ?? rawText)
    setIsEditing(false)
  }, [existingOcr, rawText])

  // ── Idle: Show "Scan Text" button ──
  if (status === 'idle') {
    return (
      <div style={containerStyle}>
        <GlassButton variant="secondary" size="sm" onClick={runOcr}>
          Scan Text (OCR)
        </GlassButton>
      </div>
    )
  }

  // ── Loading / Processing: Show progress ──
  if (status === 'loading' || status === 'processing') {
    return (
      <div style={containerStyle}>
        <div style={progressBarOuter}>
          <div
            style={{
              width: `${status === 'loading' ? 10 : progress}%`,
              height: '100%',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent)',
              transition: 'width 300ms ease-out',
            }}
          />
        </div>
        <p style={statusTextStyle}>
          {status === 'loading' ? 'Loading OCR engine...' : `Scanning... ${progress}%`}
        </p>
      </div>
    )
  }

  // ── Error ──
  if (status === 'error') {
    return (
      <div style={containerStyle}>
        <p style={{ ...statusTextStyle, color: '#f87171' }}>
          {error || 'OCR failed. Try again.'}
        </p>
        <GlassButton variant="secondary" size="sm" onClick={runOcr}>
          Retry
        </GlassButton>
      </div>
    )
  }

  // ── Done: Show extracted text with edit option ──
  return (
    <div style={containerStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)' as unknown as number,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Extracted Text
        </span>
        <span style={confidenceStyle}>
          {confidence}% confidence
        </span>
      </div>

      {isEditing ? (
        <>
          <GlassInput
            value={editedText}
            onChange={setEditedText}
            multiline
            rows={4}
            placeholder="Edit extracted text..."
          />
          <div style={actionRowStyle}>
            <GlassButton variant="ghost" size="sm" onClick={handleCancelEdit}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" size="sm" onClick={handleSaveEdit}>
              Save
            </GlassButton>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              padding: 'var(--space-3)',
              background: 'var(--glass-bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--glass-border)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          >
            {editedText || '(No text detected)'}
          </div>
          <div style={actionRowStyle}>
            <GlassButton variant="ghost" size="sm" onClick={runOcr}>
              Re-scan
            </GlassButton>
            <GlassButton variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </GlassButton>
          </div>
        </>
      )}
    </div>
  )
}

export default OcrProcessor
