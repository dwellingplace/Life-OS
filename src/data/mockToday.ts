import type { TodayCard, Task, CharismaReminder, MobilityItem, SupplementItem } from '@/types'

// ── Today's Date Helpers ──
const today = new Date()
export const todayFormatted = today.toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
})

export const greeting = (() => {
  const hour = today.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})()

// ── Top 3 Tasks ──
export const top3Tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Confirm volunteer schedule',
    priority: 'p1',
    isTop3: true,
    top3Date: today.toISOString(),
    status: 'active',
    scheduledDate: today.toISOString(),
    dueDate: new Date(today.getTime() + 2 * 86400000).toISOString(),
    tags: ['Chapel'],
    subtasks: [],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: 'task-2',
    title: 'Review chapel AV setup notes',
    priority: 'p1',
    isTop3: true,
    top3Date: today.toISOString(),
    status: 'active',
    scheduledDate: today.toISOString(),
    tags: ['Audio', 'Chapel'],
    subtasks: [],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: 'task-3',
    title: 'Call mom',
    priority: 'p2',
    isTop3: true,
    top3Date: today.toISOString(),
    status: 'active',
    scheduledDate: today.toISOString(),
    dueTime: '18:00',
    tags: ['Family'],
    subtasks: [],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
]

// ── Charisma Reminder ──
export const todayCharisma: CharismaReminder = {
  id: 'charisma-1',
  text: '3-Second Arrival: pause, stack posture, warm eyes, speak one clear sentence.',
  theme: 'Presence',
  isFavorited: false,
}

// ── Morning Mobility ──
export const morningMobility: MobilityItem[] = [
  { id: 'mob-1', name: 'Wall posture reset', duration: '1 min', durationSeconds: 60, isCompleted: false },
  { id: 'mob-2', name: 'Cat-Cow', duration: '6-8 reps', durationSeconds: 45, isCompleted: false },
  { id: 'mob-3', name: 'Hip flexor stretch', duration: '30 sec/side', durationSeconds: 60, isCompleted: false },
  { id: 'mob-4', name: 'Deep nasal breathing', duration: '1-2 min', durationSeconds: 90, isCompleted: false },
]

// ── Evening Mobility ──
export const eveningMobility: MobilityItem[] = [
  { id: 'mob-e1', name: 'Deep squat hold', duration: '1-2 min', durationSeconds: 90, isCompleted: false },
  { id: 'mob-e2', name: 'Couch stretch', duration: '45-60 sec/side', durationSeconds: 90, isCompleted: false },
  { id: 'mob-e3', name: 'Supine spinal twist', duration: '30 sec/side', durationSeconds: 60, isCompleted: false },
  { id: 'mob-e4', name: 'Box breathing', duration: '2-3 min', durationSeconds: 150, isCompleted: false },
]

// ── Morning Supplements ──
export const morningSupplements: SupplementItem[] = [
  { id: 'sup-m1', name: 'Creatine', dosage: '5g', isChecked: false },
  { id: 'sup-m2', name: 'Glutamine', dosage: '5g', timing: 'empty stomach', isChecked: false },
  { id: 'sup-m3', name: 'Tyrosine', dosage: '500-1000mg', timing: 'empty stomach', isChecked: false },
  { id: 'sup-m4', name: 'Rhodiola', dosage: '200-400mg', timing: 'empty stomach', isChecked: false },
  { id: 'sup-m5', name: "Lion's Mane", dosage: '500-1000mg', isChecked: false },
  { id: 'sup-m6', name: 'Vitamin D3 + K2', dosage: '5000 IU / 180mcg', timing: 'with fat meal', isChecked: false },
]

// ── Midday Supplements ──
export const middaySupplements: SupplementItem[] = [
  { id: 'sup-d1', name: 'Fish Oil', dosage: '3g EPA/DHA', timing: 'with fat meal', isChecked: false },
  { id: 'sup-d2', name: 'Curcumin + Black Pepper', dosage: '500-1000mg + piperine', timing: 'with fat meal', isChecked: false },
]

// ── Pre-Workout Supplements ──
export const preWorkoutSupplements: SupplementItem[] = [
  { id: 'sup-p1', name: 'Alpha GPC', dosage: '300-600mg', timing: '30-60 min pre', isChecked: false },
]

// ── Night Supplements ──
export const nightSupplements: SupplementItem[] = [
  { id: 'sup-n1', name: 'Glutamine', dosage: '5g', timing: 'empty stomach', isChecked: false },
  { id: 'sup-n2', name: 'Ashwagandha', dosage: '500-600mg', timing: 'with dinner', isChecked: false },
  { id: 'sup-n3', name: 'Zinc', dosage: '25-30mg', timing: 'with food', isChecked: false },
  { id: 'sup-n4', name: 'Magnesium', dosage: '300-400mg', isChecked: false },
]

// ── Today's Tasks (non-Top 3) ──
export const todayTasks: Task[] = [
  {
    id: 'task-4',
    title: 'Pick up dry cleaning',
    priority: 'p3',
    isTop3: false,
    status: 'active',
    scheduledDate: today.toISOString(),
    tags: [],
    subtasks: [],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: 'task-5',
    title: "Reply to pastor's email",
    priority: 'p2',
    isTop3: false,
    status: 'active',
    scheduledDate: today.toISOString(),
    tags: ['Chapel', 'Leadership'],
    subtasks: [],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
  {
    id: 'task-6',
    title: 'Submit expense report',
    priority: 'p2',
    isTop3: false,
    status: 'active',
    dueDate: today.toISOString(),
    tags: ['Finances'],
    subtasks: [],
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  },
]

// ── Workout (Push Day) ──
export const todayWorkout = {
  id: 'workout-push',
  name: 'Push Day',
  dayLabel: 'Monday',
  exerciseCount: 9,
  exercises: [
    'Incline DB Press',
    'Flat DB Press',
    'Pec Deck / Cable Fly',
    'DB Lateral Raises',
    'Cable Rear Delt Fly',
    'DB Overhead Press',
    'Rope Pushdowns',
    'Overhead Triceps Extension',
  ],
}

// ── Work Focus Items ──
export const workFocusItems = [
  'Finalize chapel AV plan',
  'Prep worship night set',
  'Review Q1 audio budget',
]

// ── Today Cards (ordered by block + sortOrder) ──
export const todayCards: TodayCard[] = [
  // Morning
  {
    id: 'card-charisma',
    type: 'charisma',
    title: 'Daily Reminder',
    subtitle: 'Presence',
    timeBlock: 'morning',
    status: 'pending',
    sortOrder: 0,
  },
  {
    id: 'card-mobility-am',
    type: 'mobility',
    title: 'Morning Mobility',
    subtitle: '5 min · 4 stretches',
    timeBlock: 'morning',
    status: 'pending',
    sortOrder: 1,
  },
  {
    id: 'card-supp-am',
    type: 'supplements',
    title: 'Morning Supplements',
    subtitle: '6 items',
    timeBlock: 'morning',
    status: 'pending',
    sortOrder: 2,
  },
  {
    id: 'card-journal-am',
    type: 'journal',
    title: 'Morning Journal',
    subtitle: 'Prayer & intention',
    timeBlock: 'morning',
    status: 'pending',
    sortOrder: 3,
  },
  // Midday
  {
    id: 'card-work-focus',
    type: 'work-focus',
    title: 'Work Focus',
    subtitle: '3 items this week',
    timeBlock: 'midday',
    status: 'pending',
    sortOrder: 0,
  },
  {
    id: 'card-supp-mid',
    type: 'supplements',
    title: 'Midday Supplements',
    subtitle: '2 items',
    timeBlock: 'midday',
    status: 'pending',
    sortOrder: 1,
  },
  {
    id: 'card-daily-todo',
    type: 'daily-todo',
    title: 'Daily To-Do',
    subtitle: '3 tasks today',
    timeBlock: 'midday',
    status: 'pending',
    sortOrder: 2,
  },
  // Workout
  {
    id: 'card-workout',
    type: 'workout',
    title: 'Push Day',
    subtitle: 'Monday · 9 exercises',
    timeBlock: 'workout',
    status: 'pending',
    sortOrder: 0,
  },
  {
    id: 'card-supp-pre',
    type: 'supplements',
    title: 'Pre-Workout',
    subtitle: '1 item',
    timeBlock: 'workout',
    status: 'pending',
    sortOrder: 1,
  },
  // Evening
  {
    id: 'card-mobility-pm',
    type: 'mobility',
    title: 'Evening Mobility',
    subtitle: '5-10 min · 4 stretches',
    timeBlock: 'evening',
    status: 'pending',
    sortOrder: 0,
  },
  {
    id: 'card-money',
    type: 'money-minute',
    title: 'Money Minute',
    subtitle: 'Quick check-in',
    timeBlock: 'evening',
    status: 'pending',
    sortOrder: 1,
  },
  {
    id: 'card-supp-night',
    type: 'supplements',
    title: 'Night Supplements',
    subtitle: '4 items',
    timeBlock: 'evening',
    status: 'pending',
    sortOrder: 2,
  },
  {
    id: 'card-journal-pm',
    type: 'journal',
    title: 'Evening Journal',
    subtitle: 'Gratitude & reflection',
    timeBlock: 'evening',
    status: 'pending',
    sortOrder: 3,
  },
]
