'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import TodayScreen from '@/components/screens/TodayScreen'
import TasksScreen from '@/components/screens/TasksScreen'
import JournalScreen from '@/components/screens/JournalScreen'
import PlanScreen from '@/components/screens/PlanScreen'
import ProgressScreen from '@/components/screens/ProgressScreen'
import RpgScreen from '@/components/screens/RpgScreen'
import OnboardingScreen from '@/components/screens/OnboardingScreen'
import { isOnboardingComplete } from '@/lib/onboarding/presets'
import type { TabId } from '@/types'

export default function HomePage() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    isOnboardingComplete().then((complete) => {
      setShowOnboarding(!complete)
    })
  }, [])

  // Still loading onboarding check
  if (showOnboarding === null) return null

  if (showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
  }

  return (
    <AppShell>
      {(activeTab: TabId, onSearchPress: () => void, onTabChange: (tab: TabId) => void) => {
        switch (activeTab) {
          case 'today':
            return <TodayScreen onSearchPress={onSearchPress} onTabChange={onTabChange} />
          case 'tasks':
            return <TasksScreen onSearchPress={onSearchPress} />
          case 'journal':
            return <JournalScreen onSearchPress={onSearchPress} />
          case 'plan':
            return <PlanScreen onSearchPress={onSearchPress} />
          case 'progress':
            return <ProgressScreen onSearchPress={onSearchPress} />
          case 'rpg':
            return <RpgScreen onSearchPress={onSearchPress} />
          default:
            return null
        }
      }}
    </AppShell>
  )
}
