# Life OS — Implementation Plan

## Build Order (Context-Safe Checkpoints)

### Checkpoint 1: Foundation ✅ (current)
- [x] Next.js project with TypeScript + PWA config
- [x] Design system tokens (CSS custom properties)
- [x] Glass component library (Card, Button, Chip, TabBar, Sheet, Input)
- [x] Layout shell with 5-tab navigation
- [x] Signature animations (settle, snap, aura)
- [x] Today Runway with mock data (Morning/Midday/Workout/Evening blocks)

### Checkpoint 2: Local Database + Core Models ✅
- [x] Dexie.js setup with all core tables (25+ tables)
- [x] Template/Instance/Entry data layer
- [x] Today generation engine (from templates + schedule rules + charisma selection)
- [x] Edit Ladder bottom sheet (today/week/template + disable today/forever)
- [x] Seed data: 3 workout plans, 2 mobility, 4 supplements, 30 charisma reminders, 5 departments, 10 tags, 5 sample tasks, default settings
- [x] useToday hook with Dexie live queries
- [x] TodayScreen wired to live IndexedDB data
- [x] Instance entry tracking for checklist completion state

### Checkpoint 3: Tasks Module ✅
- [x] Task repository (CRUD, queries, snooze, top3, complete/toggle)
- [x] Tasks screen with 4 sub-views (Inbox/Today/Upcoming/Projects)
- [x] Top 3 pin system with auto-demote at capacity
- [x] Snooze flow (tonight/tomorrow/next-workday/next-week/pick-date)
- [x] Task detail bottom sheet + Snooze bottom sheet
- [x] useTasks hook with live queries + upcoming grouping

### Checkpoint 4: Workout Module ✅
- [x] Workout repository (exercises, sets, history, prefill, complete)
- [x] Full-screen Workout Session screen (expand/collapse exercises)
- [x] Sets table (weight/reps inputs, completion checkboxes)
- [x] "Last time" defaults + exercise history (2-tier priority)
- [x] Rest timer (countdown with accent glow)
- [x] Quick actions (Copy last, +5 lbs, Notes)
- [x] Workout completion animation
- [x] useWorkoutSession hook + wired into Today Runway

### Checkpoint 5: Journal Module ✅
- [x] Daily entry editor (sections: prayer, leadership, gratitude, free notes)
- [x] Photo capture + crop/rotate
- [x] OCR with Tesseract.js (web worker, progress, review/edit)
- [x] Starred lines → ReminderItems
- [x] Reminders view (pin/reorder/snooze/surface)

### Checkpoint 6: Supporting Modules ✅
- [x] Supplements (checklist cards, 4 time slots)
- [x] Mobility (AM/PM with timers)
- [x] Charisma Reminders (deck, daily pick, 7-day no-repeat)
- [x] Work Focus (departments, goals, weekly focus)
- [x] Money Minute (amount + category + note)
- [x] Audio Training (default card)

### Checkpoint 7: Plan Tab + Customize Today ✅
- [x] Customize Today (3 presets + per-module toggles)
- [x] Template Library view
- [x] Module Builder (5-step creation flow)
- [x] Schedule Editor

### Checkpoint 8: Search + Progress ✅
- [x] Global search (keyword across modules, filter chips)
- [x] Topic auto-tagging (rules-based keyword scoring)
- [x] Progress tab (weekly stats, streak dots)
- [x] Weekly Review guided flow

### Checkpoint 9: Sync + Auth ✅
- [x] Supabase project setup
- [x] Auth (email + Google OAuth)
- [x] Sync outbox queue
- [x] Idempotent sync with client_event_id
- [x] Conflict resolution (LWW + journal versioning)
- [x] Tombstone deletions
- [x] Push notifications (iOS 16.4+)

### Checkpoint 10: Polish + PWA ✅
- [x] Service worker caching strategy
- [x] Offline photo queue
- [x] Quick Add command bar (parsing + typeahead)
- [x] Busy Day mode
- [x] Beginner mode defaults
- [x] Onboarding flow (3 presets)
- [x] Light mode variant
- [x] Accessibility audit (contrast, reduce motion, dynamic type)
- [x] Performance audit (<100ms interactions)
