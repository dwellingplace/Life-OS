'use client'

import React, { useState, useCallback, useMemo, type CSSProperties } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GlassChip } from '@/components/ui/GlassChip'
import { GlassSheet } from '@/components/ui/GlassSheet'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassInput } from '@/components/ui/GlassInput'
import {
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  SettingsIcon,
  ClockIcon,
  CheckIcon,
  XIcon,
  LayersIcon,
  StarIcon,
} from '@/components/ui/Icons'
import Header from '@/components/layout/Header'
import { db } from '@/lib/db'
import type { Template, ScheduleRule, TemplateItem, AppSettings, TemplateType, TimeBlock, Instance } from '@/lib/db/schema'
import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuid } from 'uuid'
import { getDateStr } from '@/lib/engine/todayGenerator'

// ── Types ──

type PlanTab = 'customize' | 'templates' | 'schedule'
type Preset = 'minimal' | 'standard' | 'full'

const PLAN_TABS: { id: PlanTab; label: string }[] = [
  { id: 'customize', label: 'Customize' },
  { id: 'templates', label: 'Templates' },
  { id: 'schedule', label: 'Schedule' },
]

const PRESETS: { id: Preset; label: string; description: string }[] = [
  { id: 'minimal', label: 'Minimal', description: 'Quick mobility + journal' },
  { id: 'standard', label: 'Standard', description: 'Full daily routine' },
  { id: 'full', label: 'Full', description: 'Everything on' },
]

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Map 0=Sun..6=Sat to Mon-first index (0=Mon..6=Sun)
function dayOfWeekToColumnIndex(dow: number): number {
  return dow === 0 ? 6 : dow - 1
}

const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  workout: 'Workout',
  mobility: 'Mobility',
  supplements: 'Supplements',
  'charisma-deck': 'Charisma',
  'work-focus': 'Work',
  'audio-training': 'Audio',
  finance: 'Finance',
  'custom-module': 'Custom',
}

const TEMPLATE_TYPE_OPTIONS: { value: TemplateType; label: string }[] = [
  { value: 'workout', label: 'Workout' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'supplements', label: 'Supplements' },
  { value: 'charisma-deck', label: 'Charisma Deck' },
  { value: 'work-focus', label: 'Work Focus' },
  { value: 'audio-training', label: 'Audio Training' },
  { value: 'finance', label: 'Finance' },
  { value: 'custom-module', label: 'Custom Module' },
]

// ── Default icons per template type ──
function getTemplateIcon(template: Template): string {
  if (template.icon) return template.icon
  const iconMap: Record<TemplateType, string> = {
    workout: '\u{1F3CB}',
    mobility: '\u{1F9D8}',
    supplements: '\u{1F48A}',
    'charisma-deck': '\u{2728}',
    'work-focus': '\u{1F4BC}',
    'audio-training': '\u{1F3A7}',
    finance: '\u{1F4B0}',
    'custom-module': '\u{1F527}',
  }
  return iconMap[template.type] ?? '\u{1F4CB}'
}

// ── Toggle Switch Component ──

interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  ariaLabel: string
}

function ToggleSwitch({ checked, onChange, ariaLabel }: ToggleSwitchProps) {
  const trackStyle: CSSProperties = {
    position: 'relative',
    width: '44px',
    height: '24px',
    borderRadius: 'var(--radius-full)',
    background: checked ? 'var(--accent)' : 'var(--glass-bg-secondary)',
    border: `1px solid ${checked ? 'var(--accent-muted)' : 'var(--glass-border-strong)'}`,
    cursor: 'pointer',
    transition: `background var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)`,
    flexShrink: 0,
    WebkitTapHighlightColor: 'transparent',
  }

  const thumbStyle: CSSProperties = {
    position: 'absolute',
    top: '2px',
    left: checked ? '22px' : '2px',
    width: '18px',
    height: '18px',
    borderRadius: 'var(--radius-full)',
    background: checked ? '#0f1219' : 'var(--text-tertiary)',
    transition: `left var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      style={trackStyle}
    >
      <span style={thumbStyle} aria-hidden="true" />
    </button>
  )
}

// ── Shimmer Loading Skeleton ──

function ShimmerSkeleton({ count = 3, height = 64 }: { count?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-shimmer"
          style={{
            height: `${height}px`,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--glass-bg-primary)',
            border: '1px solid var(--glass-border)',
            opacity: 0,
            animation: `settle-in var(--duration-settle) var(--ease-out) ${200 + i * 100}ms both`,
          }}
        />
      ))}
    </div>
  )
}

// ── Main Screen ──

interface PlanScreenProps {
  onSearchPress?: () => void
}

export default function PlanScreen({ onSearchPress }: PlanScreenProps) {
  const [activeTab, setActiveTab] = useState<PlanTab>('customize')

  // ── Live Queries ──

  const templates = useLiveQuery(
    async (): Promise<Template[]> => {
      return db.templates.filter(t => !t.deletedAt).sortBy('sortOrder')
    },
    [],
    [] as Template[]
  )

  const settings = useLiveQuery(
    async (): Promise<AppSettings | undefined> => {
      return db.appSettings.get('user-settings')
    },
    [],
    undefined as AppSettings | undefined
  )

  const scheduleRules = useLiveQuery(
    async (): Promise<ScheduleRule[]> => {
      return db.scheduleRules.filter(r => !r.deletedAt).toArray()
    },
    [],
    [] as ScheduleRule[]
  )

  const allTemplateItems = useLiveQuery(
    async (): Promise<TemplateItem[]> => {
      return db.templateItems.filter(ti => !ti.deletedAt).toArray()
    },
    [],
    [] as TemplateItem[]
  )

  // ── Derived Data ──

  const templateItemCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of allTemplateItems) {
      counts[item.templateId] = (counts[item.templateId] ?? 0) + 1
    }
    return counts
  }, [allTemplateItems])

  const templateItemsByTemplateId = useMemo(() => {
    const map: Record<string, TemplateItem[]> = {}
    for (const item of allTemplateItems) {
      if (!map[item.templateId]) {
        map[item.templateId] = []
      }
      map[item.templateId].push(item)
    }
    // Sort each group by sortOrder
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.sortOrder - b.sortOrder)
    }
    return map
  }, [allTemplateItems])

  const scheduleRulesByTemplateId = useMemo(() => {
    const map: Record<string, ScheduleRule[]> = {}
    for (const rule of scheduleRules) {
      if (!map[rule.templateId]) {
        map[rule.templateId] = []
      }
      map[rule.templateId].push(rule)
    }
    return map
  }, [scheduleRules])

  const templateMap = useMemo(() => {
    const map: Record<string, Template> = {}
    for (const t of templates) {
      map[t.id] = t
    }
    return map
  }, [templates])

  const isLoading = settings === undefined && templates.length === 0

  // ── Styles ──

  const screenStyle: CSSProperties = {
    height: '100%',
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'calc(var(--tabbar-height) + var(--space-8))',
  }

  const contentStyle: CSSProperties = {
    padding: '0 var(--space-4)',
  }

  const segmentedRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-1)',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    opacity: 0,
    animation: 'settle-in var(--duration-settle) var(--ease-out) 100ms both',
  }

  return (
    <div style={screenStyle}>
      <Header title="Plan" syncStatus="synced" onSearchPress={onSearchPress} />

      <div style={contentStyle}>
        {/* Tab selector */}
        <div style={segmentedRowStyle} role="tablist" aria-label="Plan views">
          {PLAN_TABS.map(tab => (
            <GlassChip
              key={tab.id}
              label={tab.label}
              selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              size="sm"
            />
          ))}
        </div>

        {/* Active view */}
        {activeTab === 'customize' && (
          <CustomizeView
            templates={templates}
            settings={settings}
            templateItemsByTemplateId={templateItemsByTemplateId}
            scheduleRulesByTemplateId={scheduleRulesByTemplateId}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'templates' && (
          <TemplatesView
            templates={templates}
            templateItemCounts={templateItemCounts}
            templateItemsByTemplateId={templateItemsByTemplateId}
            scheduleRulesByTemplateId={scheduleRulesByTemplateId}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'schedule' && (
          <ScheduleView
            templates={templates}
            templateMap={templateMap}
            scheduleRules={scheduleRules}
            isLoading={isLoading}
          />
        )}

        <div style={{ height: 'var(--space-16)' }} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Customize Today View
// ══════════════════════════════════════════════════════════════

interface CustomizeViewProps {
  templates: Template[]
  settings: AppSettings | undefined
  templateItemsByTemplateId: Record<string, TemplateItem[]>
  scheduleRulesByTemplateId: Record<string, ScheduleRule[]>
  isLoading: boolean
}

function CustomizeView({ templates, settings, templateItemsByTemplateId, scheduleRulesByTemplateId, isLoading }: CustomizeViewProps) {
  const currentPreset = settings?.todayPrefs?.preset ?? 'standard'
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const handlePresetSelect = useCallback(async (preset: Preset) => {
    await db.appSettings.update('user-settings', {
      'todayPrefs.preset': preset,
      updatedAt: new Date().toISOString(),
    })
  }, [])

  const handleToggleTemplate = useCallback(async (template: Template) => {
    const newActive = !template.isActive
    await db.templates.update(template.id, {
      isActive: newActive,
      disabledAt: newActive ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }, [])

  const handleOpenDetail = useCallback((template: Template) => {
    setSelectedTemplate(template)
    setDetailOpen(true)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false)
    setSelectedTemplate(null)
  }, [])

  const handleToggleSelectedActive = useCallback(async () => {
    if (!selectedTemplate) return
    const newActive = !selectedTemplate.isActive
    await db.templates.update(selectedTemplate.id, {
      isActive: newActive,
      disabledAt: newActive ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }, [selectedTemplate])

  const handleUpdateSelectedName = useCallback(async (name: string) => {
    if (!selectedTemplate) return
    await db.templates.update(selectedTemplate.id, {
      name,
      updatedAt: new Date().toISOString(),
    })
  }, [selectedTemplate])

  if (isLoading) {
    return <ShimmerSkeleton count={4} height={72} />
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 var(--space-3)',
    padding: 'var(--space-3) 0 0',
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      role="tabpanel"
      aria-label="Customize Today"
    >
      {/* ── Preset Selection ── */}
      <section>
        <h3
          style={{
            ...sectionTitleStyle,
            opacity: 0,
            animation: 'settle-in var(--duration-settle) var(--ease-out) 150ms both',
          }}
        >
          Daily Preset
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-2)',
            opacity: 0,
            animation: 'settle-in var(--duration-settle) var(--ease-out) 200ms both',
          }}
          role="radiogroup"
          aria-label="Select daily preset"
        >
          {PRESETS.map(preset => {
            const isSelected = currentPreset === preset.id
            return (
              <PresetButton
                key={preset.id}
                label={preset.label}
                description={preset.description}
                isSelected={isSelected}
                onClick={() => handlePresetSelect(preset.id)}
              />
            )
          })}
        </div>
      </section>

      {/* ── Module Toggles ── */}
      <section>
        <h3
          style={{
            ...sectionTitleStyle,
            opacity: 0,
            animation: 'settle-in var(--duration-settle) var(--ease-out) 300ms both',
          }}
        >
          Modules
        </h3>
        <GlassCard padding="sm" animationDelay={350}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {templates.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-4)',
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                No templates yet. Create one in the Templates tab.
              </div>
            ) : (
              templates.map((template, i) => (
                <ModuleToggleRow
                  key={template.id}
                  template={template}
                  onToggle={() => handleToggleTemplate(template)}
                  onClick={() => handleOpenDetail(template)}
                  animationDelay={400 + i * 60}
                  isLast={i === templates.length - 1}
                />
              ))
            )}
          </div>
        </GlassCard>
      </section>

      {/* Template Detail Sheet (from Customize) */}
      {selectedTemplate && (
        <TemplateDetailSheet
          isOpen={detailOpen}
          onClose={handleCloseDetail}
          template={selectedTemplate}
          items={templateItemsByTemplateId[selectedTemplate.id] ?? []}
          scheduleRules={scheduleRulesByTemplateId[selectedTemplate.id] ?? []}
          onToggleActive={handleToggleSelectedActive}
          onUpdateName={handleUpdateSelectedName}
        />
      )}
    </div>
  )
}

// ── Preset Button ──

interface PresetButtonProps {
  label: string
  description: string
  isSelected: boolean
  onClick: () => void
}

function PresetButton({ label, description, isSelected, onClick }: PresetButtonProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-1)',
    padding: 'var(--space-3) var(--space-2)',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${isSelected ? 'var(--accent-muted)' : 'var(--glass-border)'}`,
    background: isSelected ? 'var(--accent-subtle)' : 'var(--glass-bg-primary)',
    cursor: 'pointer',
    transition: `all var(--duration-fast) var(--ease-out)`,
    WebkitTapHighlightColor: 'transparent',
    minHeight: 'var(--tap-min)',
    textAlign: 'center',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  }

  const labelStyle: CSSProperties = {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
    lineHeight: 1.3,
  }

  const descStyle: CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-regular)' as unknown as number,
    color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)',
    lineHeight: 1.3,
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${label}: ${description}`}
      onClick={onClick}
      style={containerStyle}
    >
      <span style={labelStyle}>{label}</span>
      <span style={descStyle}>{description}</span>
    </button>
  )
}

// ── Module Toggle Row ──

interface ModuleToggleRowProps {
  template: Template
  onToggle: () => void
  onClick?: () => void
  animationDelay: number
  isLast: boolean
}

function ModuleToggleRow({ template, onToggle, onClick, animationDelay, isLast }: ModuleToggleRowProps) {
  const icon = getTemplateIcon(template)

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-2) var(--space-1)',
    minHeight: 'var(--tap-min)',
    borderBottom: isLast ? 'none' : '1px solid var(--glass-border)',
    opacity: 0,
    animation: `settle-in var(--duration-settle) var(--ease-out) ${animationDelay}ms both`,
  }

  const iconStyle: CSSProperties = {
    fontSize: 'var(--text-lg)',
    width: '28px',
    textAlign: 'center',
    flexShrink: 0,
    lineHeight: 1,
  }

  const nameStyle: CSSProperties = {
    flex: 1,
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    color: template.isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
    transition: `color var(--duration-fast) var(--ease-out)`,
  }

  return (
    <div style={rowStyle}>
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flex: 1,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: onClick ? 'pointer' : 'default',
          fontFamily: 'var(--font-sans)',
          textAlign: 'left',
          minWidth: 0,
        }}
        aria-label={`View ${template.name} details`}
      >
        <span style={iconStyle} aria-hidden="true">{icon}</span>
        <span style={nameStyle}>{template.name}</span>
        {onClick && <ChevronRightIcon size={14} color="var(--text-tertiary)" />}
      </button>
      <ToggleSwitch
        checked={template.isActive}
        onChange={onToggle}
        ariaLabel={`Toggle ${template.name} ${template.isActive ? 'off' : 'on'}`}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Templates View
// ══════════════════════════════════════════════════════════════

interface TemplatesViewProps {
  templates: Template[]
  templateItemCounts: Record<string, number>
  templateItemsByTemplateId: Record<string, TemplateItem[]>
  scheduleRulesByTemplateId: Record<string, ScheduleRule[]>
  isLoading: boolean
}

function TemplatesView({
  templates,
  templateItemCounts,
  templateItemsByTemplateId,
  scheduleRulesByTemplateId,
  isLoading,
}: TemplatesViewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  // Create template form state
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<TemplateType>('custom-module')
  const [newDescription, setNewDescription] = useState('')

  const handleOpenDetail = useCallback((template: Template) => {
    setSelectedTemplate(template)
    setDetailOpen(true)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false)
    setSelectedTemplate(null)
  }, [])

  const handleOpenCreate = useCallback(() => {
    setNewName('')
    setNewType('custom-module')
    setNewDescription('')
    setCreateOpen(true)
  }, [])

  const handleCloseCreate = useCallback(() => {
    setCreateOpen(false)
  }, [])

  const handleCreateTemplate = useCallback(async () => {
    if (!newName.trim()) return

    const now = new Date().toISOString()
    const maxSort = templates.reduce((max, t) => Math.max(max, t.sortOrder), 0)

    await db.templates.add({
      id: crypto.randomUUID(),
      type: newType,
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      isActive: true,
      config: {},
      version: 1,
      sortOrder: maxSort + 1,
      createdAt: now,
      updatedAt: now,
    })

    setCreateOpen(false)
    setNewName('')
    setNewDescription('')
  }, [newName, newType, newDescription, templates])

  const handleToggleTemplateActive = useCallback(async (template: Template) => {
    const newActive = !template.isActive
    await db.templates.update(template.id, {
      isActive: newActive,
      disabledAt: newActive ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }, [])

  const handleUpdateTemplateName = useCallback(async (templateId: string, name: string) => {
    await db.templates.update(templateId, {
      name,
      updatedAt: new Date().toISOString(),
    })
  }, [])

  if (isLoading) {
    return <ShimmerSkeleton count={4} height={80} />
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
      role="tabpanel"
      aria-label="Templates"
    >
      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          subtitle="Templates define your daily modules and routines."
          actionLabel="Create Template"
          onAction={handleOpenCreate}
        />
      ) : (
        templates.map((template, i) => (
          <TemplateCard
            key={template.id}
            template={template}
            itemCount={templateItemCounts[template.id] ?? 0}
            onClick={() => handleOpenDetail(template)}
            animationDelay={200 + i * 80}
          />
        ))
      )}

      {/* Create Template Button */}
      {templates.length > 0 && (
        <div
          style={{
            padding: 'var(--space-2) 0',
            opacity: 0,
            animation: `settle-in var(--duration-settle) var(--ease-out) ${200 + templates.length * 80 + 100}ms both`,
          }}
        >
          <GlassButton
            variant="secondary"
            icon={<PlusIcon size={16} />}
            onClick={handleOpenCreate}
            fullWidth
          >
            Create Template
          </GlassButton>
        </div>
      )}

      {/* Template Detail Sheet */}
      {selectedTemplate && (
        <TemplateDetailSheet
          isOpen={detailOpen}
          onClose={handleCloseDetail}
          template={selectedTemplate}
          items={templateItemsByTemplateId[selectedTemplate.id] ?? []}
          scheduleRules={scheduleRulesByTemplateId[selectedTemplate.id] ?? []}
          onToggleActive={() => handleToggleTemplateActive(selectedTemplate)}
          onUpdateName={(name) => handleUpdateTemplateName(selectedTemplate.id, name)}
        />
      )}

      {/* Create Template Sheet */}
      <GlassSheet
        isOpen={createOpen}
        onClose={handleCloseCreate}
        title="Create Template"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <GlassInput
            value={newName}
            onChange={setNewName}
            placeholder="Template name"
            label="Name"
          />

          {/* Type selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)' as unknown as number,
                color: 'var(--text-secondary)',
              }}
            >
              Type
            </span>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
              }}
              role="radiogroup"
              aria-label="Template type"
            >
              {TEMPLATE_TYPE_OPTIONS.map(opt => (
                <GlassChip
                  key={opt.value}
                  label={opt.label}
                  selected={newType === opt.value}
                  onClick={() => setNewType(opt.value)}
                  size="sm"
                />
              ))}
            </div>
          </div>

          <GlassInput
            value={newDescription}
            onChange={setNewDescription}
            placeholder="Optional description"
            label="Description"
            multiline
            rows={2}
          />

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              paddingTop: 'var(--space-2)',
            }}
          >
            <GlassButton
              variant="ghost"
              onClick={handleCloseCreate}
              style={{ flex: 1 }}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleCreateTemplate}
              disabled={!newName.trim()}
              style={{ flex: 1 }}
            >
              Create
            </GlassButton>
          </div>
        </div>
      </GlassSheet>
    </div>
  )
}

// ── Template Card ──

interface TemplateCardProps {
  template: Template
  itemCount: number
  onClick: () => void
  animationDelay: number
}

function TemplateCard({ template, itemCount, onClick, animationDelay }: TemplateCardProps) {
  const icon = getTemplateIcon(template)

  const typeBadgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-medium)' as unknown as number,
    color: 'var(--text-tertiary)',
    background: 'var(--glass-bg-secondary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '1px 6px',
    lineHeight: 1.4,
  }

  const statusDotStyle: CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: 'var(--radius-full)',
    background: template.isActive ? 'var(--accent)' : 'var(--text-tertiary)',
    flexShrink: 0,
    transition: `background var(--duration-fast) var(--ease-out)`,
  }

  return (
    <GlassCard
      padding="md"
      onClick={onClick}
      animationDelay={animationDelay}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}
      >
        {/* Icon */}
        <span
          style={{
            fontSize: 'var(--text-lg)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            background: 'var(--glass-bg-secondary)',
            border: '1px solid var(--glass-border)',
            flexShrink: 0,
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          {icon}
        </span>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: '2px',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--weight-medium)' as unknown as number,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {template.name}
            </span>
            <span style={typeBadgeStyle}>{TEMPLATE_TYPE_LABELS[template.type]}</span>
          </div>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
            }}
          >
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Status + Chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
          <span style={statusDotStyle} aria-label={template.isActive ? 'Active' : 'Inactive'} />
          <ChevronRightIcon size={16} color="var(--text-tertiary)" />
        </div>
      </div>
    </GlassCard>
  )
}

// ── Template Detail Sheet ──

interface TemplateDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  template: Template
  items: TemplateItem[]
  scheduleRules: ScheduleRule[]
  onToggleActive: () => void
  onUpdateName: (name: string) => void
}

function TemplateDetailSheet({
  isOpen,
  onClose,
  template,
  items,
  scheduleRules,
  onToggleActive,
  onUpdateName,
}: TemplateDetailSheetProps) {
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(template.name)
  const [addToDate, setAddToDate] = useState(() => getDateStr())
  const [addedConfirm, setAddedConfirm] = useState(false)

  // Reset name value when template changes
  React.useEffect(() => {
    setNameValue(template.name)
    setEditingName(false)
    setAddedConfirm(false)
  }, [template.id, template.name])

  const handleSaveName = useCallback(() => {
    if (nameValue.trim() && nameValue.trim() !== template.name) {
      onUpdateName(nameValue.trim())
    }
    setEditingName(false)
  }, [nameValue, template.name, onUpdateName])

  const handleAddToDay = useCallback(async () => {
    const now = new Date().toISOString()
    const timeBlock = scheduleRules.length > 0 ? scheduleRules[0].timeBlock : 'morning'
    const cardTypeMap: Record<string, string> = {
      workout: 'workout', mobility: 'mobility', supplements: 'supplements',
      'charisma-deck': 'charisma', 'work-focus': 'work-focus',
      'audio-training': 'audio-training', finance: 'money-minute', 'custom-module': 'custom-module',
    }

    const instance: Instance = {
      id: uuid(),
      templateId: template.id,
      instanceDate: addToDate,
      timeBlock: timeBlock as TimeBlock,
      status: 'pending',
      isCustomized: true,
      sortOrder: template.sortOrder,
      cardType: cardTypeMap[template.type] ?? 'custom-module',
      title: template.name,
      subtitle: `${items.length} item${items.length !== 1 ? 's' : ''}`,
      createdAt: now,
      updatedAt: now,
    }

    await db.instances.add(instance)
    setAddedConfirm(true)
    setTimeout(() => setAddedConfirm(false), 2000)
  }, [template, items, scheduleRules, addToDate])

  const icon = getTemplateIcon(template)

  const sectionLabelStyle: CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontWeight: 'var(--weight-semibold)' as unknown as number,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 'var(--space-2)',
  }

  // Format schedule rule days
  function formatDays(daysOfWeek: number[]): string {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    if (daysOfWeek.length === 7) return 'Every day'
    if (
      daysOfWeek.length === 5 &&
      [1, 2, 3, 4, 5].every(d => daysOfWeek.includes(d))
    ) {
      return 'Weekdays'
    }
    if (
      daysOfWeek.length === 2 &&
      [0, 6].every(d => daysOfWeek.includes(d))
    ) {
      return 'Weekends'
    }
    return daysOfWeek.map(d => dayNames[d]).join(', ')
  }

  return (
    <GlassSheet isOpen={isOpen} onClose={onClose} title={undefined}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Header with icon + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span
            style={{
              fontSize: '24px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              background: 'var(--glass-bg-secondary)',
              border: '1px solid var(--glass-border)',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {icon}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <GlassInput
                  value={nameValue}
                  onChange={setNameValue}
                  placeholder="Template name"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  aria-label="Save name"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-subtle)',
                    border: '1px solid var(--accent-muted)',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <CheckIcon size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                aria-label={`Edit template name: ${template.name}`}
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--weight-semibold)' as unknown as number,
                  color: 'var(--text-primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'left',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {template.name}
              </button>
            )}
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
              }}
            >
              {TEMPLATE_TYPE_LABELS[template.type]}
            </span>
          </div>
        </div>

        {/* Active toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--glass-bg-secondary)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-medium)' as unknown as number,
              color: 'var(--text-primary)',
            }}
          >
            Active
          </span>
          <ToggleSwitch
            checked={template.isActive}
            onChange={onToggleActive}
            ariaLabel={`Toggle ${template.name} ${template.isActive ? 'off' : 'on'}`}
          />
        </div>

        {/* Template Items */}
        <section>
          <h4 style={sectionLabelStyle}>Items ({items.length})</h4>
          {items.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-4)',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-sm)',
                background: 'var(--glass-bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
              }}
            >
              No items in this template
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-md)',
                background: 'var(--glass-bg-primary)',
                border: '1px solid var(--glass-border)',
                overflow: 'hidden',
              }}
            >
              {items.map((item, i) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-2) var(--space-3)',
                    borderBottom: i < items.length - 1 ? '1px solid var(--glass-border)' : 'none',
                    minHeight: 'var(--tap-min)',
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--glass-bg-secondary)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-tertiary)',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                  {item.isOptional && (
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                        fontStyle: 'italic',
                      }}
                    >
                      optional
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Schedule Info */}
        <section>
          <h4 style={sectionLabelStyle}>Schedule</h4>
          {scheduleRules.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-4)',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-sm)',
                background: 'var(--glass-bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
              }}
            >
              No schedule rules configured
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              {scheduleRules.map(rule => (
                <div
                  key={rule.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--glass-bg-primary)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <ClockIcon size={16} color="var(--text-tertiary)" />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--weight-medium)' as unknown as number,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {formatDays(rule.daysOfWeek)}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {rule.timeBlock} block{rule.timeHint ? ` \u00B7 ${rule.timeHint}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add to Day */}
        <section>
          <h4 style={sectionLabelStyle}>Add to Day</h4>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--glass-bg-primary)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <input
              type="date"
              value={addToDate}
              onChange={(e) => setAddToDate(e.target.value)}
              style={{
                flex: 1,
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--glass-bg-secondary)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                colorScheme: 'dark',
              }}
            />
            <GlassButton
              variant={addedConfirm ? 'ghost' : 'primary'}
              onClick={handleAddToDay}
              disabled={addedConfirm}
            >
              {addedConfirm ? 'Added!' : 'Add'}
            </GlassButton>
          </div>
        </section>

        {/* Close Button */}
        <div style={{ paddingTop: 'var(--space-2)' }}>
          <GlassButton variant="ghost" onClick={onClose} fullWidth>
            Close
          </GlassButton>
        </div>
      </div>
    </GlassSheet>
  )
}

// ══════════════════════════════════════════════════════════════
// Schedule View
// ══════════════════════════════════════════════════════════════

interface ScheduleViewProps {
  templates: Template[]
  templateMap: Record<string, Template>
  scheduleRules: ScheduleRule[]
  isLoading: boolean
}

function ScheduleView({ templates, templateMap, scheduleRules, isLoading }: ScheduleViewProps) {
  // Build a map: columnIndex (0=Mon..6=Sun) -> array of { template, timeBlock, rule }
  const weekGrid = useMemo(() => {
    const grid: Array<Array<{ template: Template; timeBlock: string; ruleId: string }>> = Array.from(
      { length: 7 },
      () => []
    )

    for (const rule of scheduleRules) {
      const template = templateMap[rule.templateId]
      if (!template || !template.isActive) continue

      for (const dow of rule.daysOfWeek) {
        const colIdx = dayOfWeekToColumnIndex(dow)
        grid[colIdx].push({
          template,
          timeBlock: rule.timeBlock,
          ruleId: rule.id,
        })
      }
    }

    // Sort each column by time block order
    const blockOrder: Record<string, number> = {
      morning: 0,
      midday: 1,
      workout: 2,
      evening: 3,
    }
    for (const col of grid) {
      col.sort((a, b) => (blockOrder[a.timeBlock] ?? 99) - (blockOrder[b.timeBlock] ?? 99))
    }

    return grid
  }, [scheduleRules, templateMap])

  if (isLoading) {
    return <ShimmerSkeleton count={3} height={120} />
  }

  if (scheduleRules.length === 0) {
    return (
      <EmptyState
        title="No schedule rules"
        subtitle="Add schedule rules to your templates to see them here."
      />
    )
  }

  // Color mapping for time blocks
  const blockColors: Record<string, string> = {
    morning: 'rgba(250, 204, 21, 0.15)',
    midday: 'rgba(96, 165, 250, 0.15)',
    workout: 'rgba(248, 113, 113, 0.15)',
    evening: 'rgba(167, 139, 250, 0.15)',
  }

  const blockBorderColors: Record<string, string> = {
    morning: 'rgba(250, 204, 21, 0.3)',
    midday: 'rgba(96, 165, 250, 0.3)',
    workout: 'rgba(248, 113, 113, 0.3)',
    evening: 'rgba(167, 139, 250, 0.3)',
  }

  const blockTextColors: Record<string, string> = {
    morning: 'rgba(250, 204, 21, 0.9)',
    midday: 'rgba(96, 165, 250, 0.9)',
    workout: 'rgba(248, 113, 113, 0.9)',
    evening: 'rgba(167, 139, 250, 0.9)',
  }

  return (
    <div
      role="tabpanel"
      aria-label="Weekly Schedule"
      style={{
        opacity: 0,
        animation: 'settle-in var(--duration-settle) var(--ease-out) 200ms both',
      }}
    >
      {/* Week Grid */}
      <GlassCard padding="sm">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
          }}
        >
          {/* Day headers */}
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              style={{
                textAlign: 'center',
                padding: 'var(--space-2) 0',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)' as unknown as number,
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--glass-border)',
              }}
            >
              {label}
            </div>
          ))}

          {/* Day columns */}
          {weekGrid.map((entries, colIdx) => (
            <div
              key={colIdx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                padding: 'var(--space-1) 0',
                minHeight: '80px',
              }}
            >
              {entries.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-tertiary)',
                    fontSize: '10px',
                  }}
                  aria-label={`${DAY_LABELS[colIdx]}: No scheduled items`}
                >
                  &mdash;
                </div>
              ) : (
                entries.map((entry, i) => (
                  <div
                    key={`${entry.ruleId}-${i}`}
                    title={`${entry.template.name} (${entry.timeBlock})`}
                    style={{
                      padding: '2px 3px',
                      borderRadius: 'var(--radius-sm)',
                      background: blockColors[entry.timeBlock] ?? 'var(--glass-bg-secondary)',
                      border: `1px solid ${blockBorderColors[entry.timeBlock] ?? 'var(--glass-border)'}`,
                      fontSize: '9px',
                      fontWeight: 'var(--weight-medium)' as unknown as number,
                      color: blockTextColors[entry.timeBlock] ?? 'var(--text-secondary)',
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                    }}
                    aria-label={`${DAY_LABELS[colIdx]}: ${entry.template.name}, ${entry.timeBlock} block`}
                  >
                    {entry.template.name}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-1)',
          marginTop: 'var(--space-2)',
        }}
      >
        {(['morning', 'midday', 'workout', 'evening'] as const).map(block => (
          <div
            key={block}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: blockColors[block],
                border: `1px solid ${blockBorderColors[block]}`,
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                textTransform: 'capitalize',
              }}
            >
              {block}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Shared Components
// ══════════════════════════════════════════════════════════════

interface EmptyStateProps {
  title: string
  subtitle: string
  actionLabel?: string
  onAction?: () => void
}

function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-16) var(--space-6)',
        textAlign: 'center',
        minHeight: '40vh',
      }}
    >
      <p
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--weight-semibold)' as unknown as number,
          color: 'var(--text-primary)',
          margin: '0 0 var(--space-2)',
          opacity: 0,
          animation: 'settle-in var(--duration-settle) var(--ease-out) 200ms both',
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
          margin: '0 0 var(--space-6)',
          opacity: 0,
          animation: 'settle-in var(--duration-settle) var(--ease-out) 300ms both',
        }}
      >
        {subtitle}
      </p>
      {actionLabel && onAction && (
        <div
          style={{
            opacity: 0,
            animation: 'settle-in var(--duration-settle) var(--ease-out) 400ms both',
          }}
        >
          <GlassButton
            variant="secondary"
            icon={<PlusIcon size={16} />}
            onClick={onAction}
          >
            {actionLabel}
          </GlassButton>
        </div>
      )}
    </div>
  )
}
