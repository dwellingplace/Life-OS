# Life OS — Web-First PWA Product Specification

**Version:** 1.0 — February 2026
**Platform:** Progressive Web App (iOS-first, Add to Home Screen)
**Stack:** Next.js + Dexie (IndexedDB) + Supabase (Postgres/Auth/Storage) + Tesseract.js

---

## 1. Product Concept

Life OS is a local-first Progressive Web App that unifies workouts, tasks, journaling, supplements, work focus, and personal growth into a single calm daily runway. Instead of forcing users to bounce between apps, Life OS generates a time-blocked "Today" feed from lightweight templates — so the morning routine takes under 60 seconds of tapping, not 10 minutes of planning. All data lives on-device first (IndexedDB via Dexie), syncs to Supabase when online, and works fully offline. The hybrid model means Today is action-first (do the next right thing), while a Plan tab handles templates and customization. A universal Quick Add bar, global search, and a consistent Edit Ladder (edit today / this week / template) eliminate "where does this live?" confusion. The app ships with a curated starter plan (workouts, mobility, supplements, charisma reminders) but every module can be disabled, replaced, or extended through a no-code Module Builder — so it grows with the user instead of overwhelming them on day one.

---

## 2. Information Architecture

### Tab Bar (5 tabs, fixed bottom)

| # | Tab | Icon | Primary Content |
|---|------|------|-----------------|
| 1 | **Today** | Sun/calendar | Time-blocked runway of cards (Morning → Midday → Workout → Evening). Busy Day mode. Quick Add FAB. |
| 2 | **Plan** | Layers/template | Template Library, Customize Today (presets + per-module toggles), Module Builder, Schedule Editor. |
| 3 | **Tasks** | Checkbox | Inbox, Today tasks, Upcoming (7–14 days), Projects. Top 3 pinned area. |
| 4 | **Journal** | Book/pen | Daily entries (text + photo/OCR), Reminders view (starred lines), search/filter. |
| 5 | **Progress** | Bar-chart (minimal) | Weekly review, streak dots, workout volume trends, completion rates. No guilt metrics. |

### Global Elements (always accessible)

- **Quick Add FAB** — floating button (bottom-right on Today; contextual elsewhere). Opens command bar overlay.
- **Global Search** — pull-down or search icon in header. Searches across all modules.
- **Sync Status** — subtle pill in header: "Synced" / "Syncing..." / "Offline (changes will sync)".
- **Profile/Settings** — avatar icon top-right → account, notification prefs, data export, module management.

### What Lives Where

| Content | Primary Home | Also Appears On |
|---------|-------------|-----------------|
| Today's workout | Today (Workout block) | Plan (template), Progress (history) |
| Tasks | Tasks tab | Today (Daily To-Do card, Top 3) |
| Journal entries | Journal tab | Today (Journal card), Progress (streak) |
| Supplements | Plan (template) | Today (checklist cards) |
| Work Focus | Plan (department setup) | Today (1 summary card) |
| Mobility | Plan (template) | Today (Morning/Evening cards) |
| Charisma reminders | Plan (deck library) | Today (1 card in Morning) |
| Money Minute | Plan (module toggle) | Today (Evening card) |
| Custom modules | Plan (Module Builder) | Today (scheduled cards) |
| Reminders (starred) | Journal → Reminders view | Today (if "surface in Today" is set) |

---

## 3. Core UX Principles

1. **"Do the next right thing" first.** Today is the home screen. Planning is secondary. The user should see their next action within 1 second of opening the app.

2. **1–2 taps to complete anything.** Every card has a primary completion action (tap checkbox, swipe to done, tap "Log"). No multi-step wizards for daily use.

3. **Calm, not a guilt tracker.** No red "overdue" shame. No streak-break punishments. Overdue items collapse quietly. Language is encouraging ("Pick up where you left off") not accusatory.

4. **Offline is the default.** Every interaction writes locally first. The user never sees a spinner for their own data. Sync is invisible plumbing, not a feature.

5. **One Edit Ladder everywhere.** When the user edits anything, the same bottom sheet appears: "Edit Today Only / Edit This Week / Edit Template." This is the single mental model for change scope.

6. **Minimal defaults, optional depth.** Ship with Beginner mode active. Advanced fields (duration estimates, priority levels, progression rules) are hidden until the user opts in. The app grows with the user.

7. **Everything is searchable.** Global search spans all modules — text, tags, dates, photos (via OCR text). If the user created it, they can find it.

8. **Modules are equal citizens.** Built-in modules (Workout, Tasks, Journal) and custom modules share the same interface contract: schedule, card, completion, history, search, Edit Ladder. No second-class modules.

9. **Never nag.** Max 2 push notifications/day (AM + PM anchors) plus user-set reminders. In-app nudges are subtle. Disabled modules produce zero noise. Quiet hours are sacred.

10. **Data is the user's.** Export, backup, and delete are rights, not features. Past data is never broken by template changes. Tombstone deletions preserve sync integrity.

---

## 4. Screen-by-Screen Specification

### 4.1 Today Runway

**Purpose:** The primary screen. A vertical, scrollable feed of cards organized into time blocks.

#### Layout (top to bottom)

```
┌─────────────────────────────┐
│ [avatar]  Today, Wed Feb 6  │  ← header: date, sync pill, profile
│           ● Synced          │
├─────────────────────────────┤
│ ☀ Good morning, John        │  ← greeting (time-aware)
│ 8 items today               │  ← subtle count
├─────────────────────────────┤
│ ═══ TOP 3 ═══               │  ← pinned area, always visible
│ ☐ Confirm volunteer sched   │
│ ☐ Review chapel AV setup    │
│ ☐ Call mom                  │
├─────────────────────────────┤
│ ─── MORNING ───             │  ← block header
│ [Charisma Reminder card]    │
│ [Mobility: Morning card]    │
│ [Supplements: Morning card] │
│ [Journal Prompt card]       │
├─────────────────────────────┤
│ ─── MIDDAY ───              │
│ [Work Focus card]           │
│ [Supplements: Midday card]  │
│ [Daily To-Do card]          │
├─────────────────────────────┤
│ ─── WORKOUT ───             │
│ [Today's Workout card]      │
│ [Supplements: Pre-WO card]  │
├─────────────────────────────┤
│ ─── EVENING ───             │
│ [Mobility: Evening card]    │
│ [Money Minute card]         │
│ [Supplements: Night card]   │
│ [Journal: Evening card]     │
│ [Shutdown card]             │
├─────────────────────────────┤
│         [+ Quick Add FAB]   │  ← floating action button
├─────────────────────────────┤
│ [Today] [Plan] [Tasks]      │  ← tab bar
│ [Journal] [Progress]        │
└─────────────────────────────┘
```

#### Card States

| State | Visual | Behavior |
|-------|--------|----------|
| **Default** | White card, normal text | Tap to expand or complete |
| **Completed** | Subtle green-grey, checkmark, muted text | Stays in place, doesn't disappear (collapses after 30 min) |
| **Skipped** | Light grey, "Skipped" label | User swiped left or tapped skip |
| **In Progress** | Subtle blue left-border accent | Timer running or partially completed |
| **Overdue** | Amber dot (not red), collapsed by default | Tap "Show overdue (3)" to expand |
| **Disabled Today** | Not rendered | Module was disabled for today |

#### Gestures

| Gesture | Action |
|---------|--------|
| **Tap card** | Expand inline (checklist, sets table, text entry) |
| **Long press card** | Open Edit Ladder bottom sheet |
| **Swipe right** | Complete / mark done |
| **Swipe left** | Skip / snooze (shows options) |
| **Drag handle** | Reorder within block (marks Today as "Customized") |
| **Pull down** | Refresh / regenerate (respects pins + custom order) |

#### Busy Day Mode

- **Trigger:** Tap "Busy Day" chip at top of Today (appears near greeting).
- **Effect:** Today collapses to show ONLY:
  - Top 3 tasks
  - 1 mobility card (Morning, shortest)
  - 1 journal prompt ("One sentence: how are you?")
  - 1 Work Focus summary line
- **Everything else:** collapsed into "Show all (12 more)" expandable row at bottom.
- **Duration:** Until end of day or user taps "Exit Busy Day."
- **Evening:** Busy Day auto-suggests expanding evening block at 7 PM.

#### Empty State

```
┌─────────────────────────────┐
│                             │
│      ☀ Welcome to Life OS   │
│                             │
│  Your day is a blank slate. │
│  Let's set up your first    │
│  week in under 2 minutes.   │
│                             │
│  [Use John Starter Plan]    │  ← primary CTA
│  [Start Minimal]            │
│  [Build from Scratch]       │
│                             │
└─────────────────────────────┘
```

#### Loading State

- Skeleton cards (grey shimmer) in block layout. Never a blank screen.
- Local data loads instantly (<100ms from IndexedDB); skeleton only shows if first launch and DB is empty.

#### Error State

- If Today generation fails: "Something went wrong loading today. [Try Again] [Use Yesterday's Plan]"
- Non-blocking: individual card errors show inline "Couldn't load this card. [Retry]" — rest of Today still works.

#### Offline State

- Header sync pill: "Offline (changes will sync)" in muted amber.
- All interactions work normally. No disabled buttons. No warnings on every action.
- Photos taken offline queue for sync; thumbnail shows immediately.

---

### 4.2 Customize Today

**Access:** Plan tab → "Customize Today" or Today header → gear icon.

#### Layout

```
┌─────────────────────────────┐
│ ← Customize Today           │
├─────────────────────────────┤
│ PRESETS                     │
│ (○) Minimal                 │  ← Tasks + Workout + Journal
│ (●) Standard                │  ← + Mobility + Charisma + Supps
│ (○) Full                    │  ← Everything enabled
├─────────────────────────────┤
│ ESSENTIALS                  │
│ ┌───────────────────┬─────┐ │
│ │ Daily To-Do       │ [●] │ │  ← toggle on/off
│ │ Morning block     │     │ │  ← time block assignment
│ │ [Disable today]   │     │ │
│ ├───────────────────┼─────┤ │
│ │ Workout           │ [●] │ │
│ │ Workout block     │     │ │
│ │ [Disable today]   │     │ │
│ ├───────────────────┼─────┤ │
│ │ Mobility          │ [●] │ │
│ │ Morn + Eve blocks │     │ │
│ ├───────────────────┼─────┤ │
│ │ Journal           │ [●] │ │
│ │ Morn + Eve blocks │     │ │
│ ├───────────────────┼─────┤ │
│ │ Charisma Reminder │ [●] │ │
│ │ Morning block     │     │ │
│ └───────────────────┴─────┘ │
├─────────────────────────────┤
│ OPTIONAL                    │
│ ┌───────────────────┬─────┐ │
│ │ Supplements       │ [●] │ │
│ │ Morn/Mid/Eve/Night│     │ │
│ ├───────────────────┼─────┤ │
│ │ Work Focus        │ [●] │ │
│ │ Midday block      │     │ │
│ ├───────────────────┼─────┤ │
│ │ Money Minute      │ [○] │ │  ← off by default in Standard
│ │ Evening block     │     │ │
│ ├───────────────────┼─────┤ │
│ │ Audio Training    │ [○] │ │
│ │ Midday block      │     │ │
│ └───────────────────┴─────┘ │
├─────────────────────────────┤
│ CUSTOM MODULES              │
│ (none yet)                  │
│ [+ Create Module]           │
├─────────────────────────────┤
│ ──────────────────────────  │
│ [Disable forever...]        │  ← danger zone, confirmation
│ [Reset Today to Default]    │
└─────────────────────────────┘
```

#### Per-Module Options (tap module row to expand)

- **Show on Today** (toggle)
- **Time block:** Morning / Midday / Workout / Evening (picker)
- **Disable today only** — hides from Today, re-enables tomorrow
- **Disable forever** — confirmation dialog: "This stops [Module] from appearing on Today going forward. Your past data is preserved. You can re-enable anytime from Plan." → [Disable] / [Cancel]
- **Replace template** — opens template picker (for Workout, Supplements, etc.)

---

### 4.3 Plan / Template Library + Module Builder

**Purpose:** Where users set up and modify their recurring plans and create custom modules.

#### Layout

```
┌─────────────────────────────┐
│ ← Plan                      │
├─────────────────────────────┤
│ [Customize Today]           │  ← prominent link
├─────────────────────────────┤
│ MY TEMPLATES                │
│ ┌───────────────────────┐   │
│ │ 🏋️ Workout Plan       │   │
│ │ 3-Day Split (John)    │   │
│ │ Mon / Wed / Fri       │   │
│ │ [Edit] [Swap Day]     │   │
│ ├───────────────────────┤   │
│ │ 🧘 Mobility           │   │
│ │ Daily AM + PM         │   │
│ │ [Edit]                │   │
│ ├───────────────────────┤   │
│ │ 💊 Supplements        │   │
│ │ 4 time slots / day    │   │
│ │ [Edit]                │   │
│ ├───────────────────────┤   │
│ │ 💼 Work Focus         │   │
│ │ 5 departments         │   │
│ │ [Edit]                │   │
│ ├───────────────────────┤   │
│ │ 💡 Charisma Deck      │   │
│ │ 30 reminders          │   │
│ │ [Browse] [Add Custom] │   │
│ └───────────────────────┘   │
├─────────────────────────────┤
│ CUSTOM MODULES              │
│ (none yet)                  │
│ [+ Build a Module]          │  ← opens Module Builder
├─────────────────────────────┤
│ SCHEDULE OVERVIEW           │
│ Mon: Push Day, Mobility,    │
│      Supps, Tasks, Journal  │
│ Tue: Mobility, Supps,       │
│      Tasks, Journal         │
│ ...                         │
│ [Edit Weekly Schedule]      │
└─────────────────────────────┘
```

#### Module Builder Flow

**Step 1: Name + Icon**
```
Module name: [Swim Training        ]
Icon: [🏊] (pick from set or emoji)
Description: [optional]
```

**Step 2: Choose Building Blocks**
```
What does a session include?
☑ Checklist (list of items to check off)
☐ Timer (count up or countdown)
☑ Log (record a number or text)
☐ Prompt (daily question/reflection)
☐ Counter (tap to increment)
☐ Media (photo + optional OCR)
☐ Link/Resource (URL or reference)
```

**Step 3: Define Fields** (for each selected block)
```
CHECKLIST ITEMS:
 1. [Warm-up: 200m easy      ]  [×]
 2. [Main set: 4x100m        ]  [×]
 3. [Cool-down: 100m easy    ]  [×]
 [+ Add item]

LOG FIELDS:
 1. Label: [Total yards  ]  Type: [Number ▾]  Unit: [yards]
 2. Label: [Pace notes   ]  Type: [Text   ▾]  Unit: [—]
 [+ Add field]
```

**Step 4: Schedule + Completion**
```
SCHEDULE:
Days: [Mon] [Tue] [Wed] [Thu] [Fri] [Sat] [Sun]
      [ ●]  [  ]  [ ●]  [  ]  [ ●]  [  ]  [  ]
Time block: [Workout ▾]

COMPLETION RULE:
(●) All checklist items checked
(○) Any log field filled
(○) Manual "Done" tap
(○) Timer completed
```

**Step 5: Preview + Save**
```
Preview card as it will appear on Today:
┌─────────────────────────────┐
│ 🏊 Swim Training            │
│ ☐ Warm-up: 200m easy        │
│ ☐ Main set: 4x100m          │
│ ☐ Cool-down: 100m easy      │
│ Total yards: [____]          │
│ Pace notes: [____]           │
│              [Mark Complete]  │
└─────────────────────────────┘
[Save Module]
```

---

### 4.4 Workout Session

**Access:** Today → tap "Today's Workout" card → expands inline OR opens full-screen session.

#### Full-Screen Session Layout

```
┌─────────────────────────────┐
│ ← Push Day (Monday)     ⏱   │  ← back + rest timer toggle
│ 2 of 9 exercises done       │  ← progress indicator
├─────────────────────────────┤
│ ▼ Incline DB Press ✓        │  ← completed, collapsed
├─────────────────────────────┤
│ ▼ Flat DB Press             │  ← current exercise, expanded
│                             │
│ Last time: 70 lbs × 10 × 3 │  ← "last time" line
│                             │
│ Set │ lbs  │ Reps │  ✓     │
│  1  │ [70] │ [10] │  [●]  │  ← prefilled from last time
│  2  │ [70] │ [10] │  [ ]  │
│  3  │ [70] │ [10] │  [ ]  │
│  [+ Add Set]               │
│                             │
│ [Copy last] [+5 lbs] [Note]│  ← quick actions
│                             │
│ Notes: [                 ]  │
│                             │
│ ⏱ Rest: 1:30  [Start Rest] │  ← rest timer
├─────────────────────────────┤
│ ▶ Pec Deck / Cable Fly     │  ← next, collapsed
│ ▶ DB Lateral Raises         │
│ ▶ Cable Rear Delt Fly       │
│ ▶ DB Overhead Press          │
│ ▶ Rope Pushdowns            │
│ ▶ Overhead Triceps Ext      │
├─────────────────────────────┤
│       [Finish Workout]      │
└─────────────────────────────┘
```

#### Exercise Card Details

- **Header:** exercise name + optional variant label
- **"Last time" line:** shows weight × reps × sets from last completed instance
  - Source priority: (1) same exercise in same workout template → (2) same exercise anywhere
  - Format: "Last time: 70 lbs × 10 × 3 — Jan 29"
- **Sets table:** columns for weight, reps, completed toggle
  - Prefilled from last time by default (setting: "Auto-prefill last time values" ON)
  - Editable inline — tap a cell to change
- **Quick actions row:**
  - "Copy last" — resets all sets to last time values
  - "+5 lbs" — increments weight on all uncompleted sets (increment configurable in settings: 2.5/5/10 lbs)
  - "Note" — adds note to this exercise instance
  - Progression suggestion (optional, user-controlled): if user hit all reps last time, suggest "+5 lbs" automatically
- **Rest timer:** configurable per exercise or global default (60s/90s/120s/180s)
  - Starts on tap; shows countdown; optional vibration on completion
  - Auto-start option: begins rest when a set is checked off

#### "Swap Day / Make-up Workout" Flow

1. User long-presses workout card on Today → Edit Ladder appears.
2. Selects "Swap workout day."
3. Bottom sheet: "Move Push Day to which day?" → shows this week's days with existing assignments.
4. User picks a day → confirmation: "Push Day moved to Thursday this week. Your template is unchanged."
5. This modifies only the current week's schedule (instance-level).
6. Optional: "Also update template?" toggle at bottom of confirmation.

#### Empty State (Rest Day)

```
┌─────────────────────────────┐
│ 🏋️ Workout                  │
│ Rest day — no workout       │
│ scheduled today.            │
│                             │
│ [Do a make-up workout]      │
│ [Log a quick exercise]      │
└─────────────────────────────┘
```

#### Workout History (accessible from Progress tab or exercise card)

- Per-exercise: chart of weight × reps over time (line chart, simple).
- Per-workout: date list with total volume (sets × reps × weight).

---

### 4.5 Tasks

#### Views

**Inbox** — unsorted tasks with no scheduled date. Triage point.
```
┌─────────────────────────────┐
│ ← Inbox (4)                 │
├─────────────────────────────┤
│ ☐ Research new mic stands   │
│ ☐ Read chapter 5            │
│ ☐ Update worship setlist    │
│ ☐ Dentist appointment       │
│                             │
│ [+ Add task]                │
├─────────────────────────────┤
│ Empty state:                │
│ "Inbox zero — nice work."   │
└─────────────────────────────┘
```

**Today Tasks** (also shown on Today Runway)
```
┌─────────────────────────────┐
│ ═══ TOP 3 ═══               │
│ ★ ☐ Confirm volunteer sched │
│ ★ ☐ Review chapel AV setup  │
│ ★ ☐ Call mom @ 6pm          │
├─────────────────────────────┤
│ ─── Scheduled Today ───     │
│ ☐ Pick up dry cleaning      │
│ ☐ Reply to pastor's email   │
├─────────────────────────────┤
│ ─── Due Today ───           │
│ ☐ Submit expense report     │
├─────────────────────────────┤
│ ▶ Overdue (2)               │  ← collapsed by default
│   ☐ Follow up with vendor   │
│   ☐ Update budget sheet     │
└─────────────────────────────┘
```

**Upcoming (7–14 days)**
```
┌─────────────────────────────┐
│ ← Upcoming                  │
├─────────────────────────────┤
│ Tomorrow, Thu Feb 7         │
│ ☐ Team meeting prep         │
│ ☐ Grocery run               │
├─────────────────────────────┤
│ Fri Feb 8                   │
│ ☐ Worship rehearsal prep    │
├─────────────────────────────┤
│ Next week                   │
│ ☐ Quarterly review prep     │
│ ☐ Order new cables          │
└─────────────────────────────┘
```

**Projects**
```
┌─────────────────────────────┐
│ ← Projects                  │
├─────────────────────────────┤
│ 📁 Chapel AV Upgrade  (5)   │
│ 📁 Worship Night 2026 (3)   │
│ 📁 Personal Goals     (7)   │
│                             │
│ [+ New Project]             │
├─────────────────────────────┤
│ Empty state:                │
│ "No projects yet. Projects  │
│  group related tasks."      │
│ [Create a Project]          │
└─────────────────────────────┘
```

#### Task Detail (bottom sheet or inline expand)

```
┌─────────────────────────────┐
│ Confirm volunteer schedule  │
│                             │
│ 📅 Do date:  Wed, Feb 6     │
│ 🔴 Due date: Fri, Feb 8     │
│ ⏰ Due time: 2:00 PM        │
│ ⏱ Duration:  15 min         │
│ 🔺 Priority: P1             │
│ 📁 Project:  Chapel AV      │
│                             │
│ Notes:                      │
│ Check with Sarah about      │
│ Sunday morning slots.       │
│                             │
│ Subtasks:                   │
│ ☑ Email Sarah               │
│ ☐ Update shared doc         │
│ ☐ Confirm with pastor       │
│                             │
│ 🔁 Repeat: none             │
│ 🏷 Tags: Chapel, Leadership │
│                             │
│ [Complete] [Snooze ▾]       │
│ [Promote to Top 3]          │
│ [Delete]                    │
└─────────────────────────────┘
```

#### Task Actions from Today

| Action | How | Result |
|--------|-----|--------|
| **Complete** | Swipe right or tap checkbox | Marked done with timestamp |
| **Snooze** | Swipe left → pick option | Moves scheduled_date |
| | Tonight | scheduled_date = today, moved to Evening block |
| | Tomorrow | scheduled_date = tomorrow |
| | Next workday | scheduled_date = next Mon–Fri |
| | Next week | scheduled_date = next Monday |
| | Pick date | date picker |
| **Promote to Top 3** | Long press → "Add to Top 3" | Pins to Top 3 area |
| **Add note** | Tap card → expand → notes field | Inline edit |
| **Set repeat** | Task detail → Repeat field | daily / weekdays / weekly / biweekly / monthly / custom |
| **Drag reorder** | Drag handle | Reorders Today only (instance order) |

#### Task Sync Rules for Today

1. **Today's "Daily To-Do" card shows:** tasks where `scheduled_date = today` OR `due_date = today` OR `due_date < today` (overdue).
2. **Default:** if user sets only `due_date`, then `scheduled_date` auto-sets to `due_date` (user can change).
3. **Overdue:** tasks where `due_date < today AND NOT completed`. Shown collapsed. No red/angry styling — amber dot, muted.
4. **Completed tasks:** stay in Today (muted) until next day.

---

### 4.6 Journal

#### Daily Entry Screen

```
┌─────────────────────────────┐
│ ← Journal     Wed, Feb 6    │
│               [📷] [🔍]     │  ← camera, search
├─────────────────────────────┤
│ PRAYER / MEDITATION         │  ← optional prompt section
│ [Write or skip...         ] │
│                             │
├─────────────────────────────┤
│ LEADERSHIP GROWTH           │
│ [What did you learn today?] │
│                             │
├─────────────────────────────┤
│ GRATITUDE                   │
│ [3 things you're thankful  ]│
│ [for...                    ]│
│                             │
├─────────────────────────────┤
│ FREE NOTES                  │
│ [Anything on your mind...  ]│
│                             │
│ ★ "I respond with calm      │  ← starred line (tap star icon)
│    strength in every room." │
│                             │
├─────────────────────────────┤
│ PHOTOS                      │
│ [img1.jpg] [img2.jpg]       │  ← thumbnails
│ [+ Add Photo]               │
├─────────────────────────────┤
│ 🏷 Tags: Faith, Leadership  │  ← auto-suggested, editable
│                             │
│ [Save Entry]                │
└─────────────────────────────┘
```

#### Photo Capture + OCR Flow

```
Step 1: Tap [📷] → camera opens (or choose from library)
Step 2: Photo taken → crop/rotate screen
  ┌─────────────────────────┐
  │ [Crop handles]          │
  │                         │
  │   photo preview         │
  │                         │
  │ [Rotate] [Enhance]      │
  │ [Run OCR] [Save Photo]  │
  └─────────────────────────┘
Step 3a: [Run OCR] →
  ┌─────────────────────────┐
  │ Processing...  ██░░░ 40%│  ← Tesseract.js progress
  └─────────────────────────┘
Step 3b: OCR result screen →
  ┌─────────────────────────┐
  │ OCR Result              │
  │ ─────────────────────── │
  │ [Editable text area     │
  │  with recognized text   │
  │  that user can correct] │
  │                         │
  │ Tip: You can also use   │
  │ iOS Live Text to copy   │
  │ text from the photo.    │
  │                         │
  │ [Save Text + Photo]     │
  │ [Run OCR Again]         │
  │ [Discard Text, Keep     │
  │  Photo Only]            │
  └─────────────────────────┘
Step 4: text + photo saved to journal entry
```

#### Starred Lines → Reminders View

- Any line in a journal entry can be starred (tap star icon in left gutter).
- Starring creates a **ReminderItem** (snapshot):
  - `text`: copy of the starred text
  - `source_entry_id`: backlink to journal entry
  - `created_at`, `pinned`, `snooze_until`, `surface_in_today`, `surface_time`
- Editing the ReminderItem edits only the reminder. Original journal entry is unchanged.
- Deleting a journal entry does NOT delete its ReminderItems.

#### Reminders View (sub-tab of Journal)

```
┌─────────────────────────────┐
│ Journal  [Entries] [Remind] │  ← segmented control
├─────────────────────────────┤
│ PINNED                      │
│ ★ "I respond with calm      │
│    strength." — Feb 6       │
│   [📖 View entry] [Unpin]  │
│                             │
│ ★ "Pray before reacting."  │
│   — Jan 30                  │
│   [📖 View entry] [Unpin]  │
├─────────────────────────────┤
│ RECENT                      │
│ ★ "Patience is leadership." │
│   — Feb 4                   │
│   [Pin] [Snooze] [Surface]  │
│   [Edit] [Delete]           │
├─────────────────────────────┤
│ [Show all reminders]        │
└─────────────────────────────┘
```

#### Journal Search

- Global search or Journal-specific search icon.
- Filters: date range, has photo, tags/topics, has starred lines, keyword.
- Results show entry previews with highlighted matches.

#### Empty State

```
"Start your first entry — even one sentence counts."
[Write Now]
```

---

### 4.7 Work Focus (Departments)

#### Overview Screen

```
┌─────────────────────────────┐
│ ← Work Focus                │
├─────────────────────────────┤
│ THIS WEEK'S FOCUS           │
│ • Finalize chapel AV plan   │
│ • Prep worship night set    │
│ • Review Q1 audio budget    │
├─────────────────────────────┤
│ DEPARTMENTS                 │
│ ┌───────────────────────┐   │
│ │ Leadership/Admin      │   │
│ │ 2 active goals        │   │
│ │ ●● On track           │   │
│ ├───────────────────────┤   │
│ │ Audio                 │   │
│ │ 1 active goal         │   │
│ │ ●○ At risk            │   │
│ ├───────────────────────┤   │
│ │ Worship               │   │
│ │ 3 active goals        │   │
│ │ ●●● On track          │   │
│ ├───────────────────────┤   │
│ │ Production            │   │
│ │ 1 active goal         │   │
│ │ ●○ Blocked            │   │
│ ├───────────────────────┤   │
│ │ Chapel                │   │
│ │ 2 active goals        │   │
│ │ ●● On track           │   │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

#### Department Detail

```
┌─────────────────────────────┐
│ ← Audio                     │
├─────────────────────────────┤
│ QUARTERLY OUTCOMES (Q1 26)  │
│ 1. Upgrade main sanctuary   │
│    monitor system            │
│ 2. Train 2 new audio        │
│    volunteers                │
│ 3. Reduce setup time to     │
│    < 20 min                  │
├─────────────────────────────┤
│ ACTIVE GOALS                │
│ ┌───────────────────────┐   │
│ │ Research monitor specs │   │
│ │ Status: At risk        │   │
│ │ Due: Feb 28            │   │
│ │ Note: waiting on quote │   │
│ │ [Update] [Mark Done]   │   │
│ └───────────────────────┘   │
├─────────────────────────────┤
│ WEEKLY FOCUS                │
│ 1. [Review Q1 audio budget ]│
│ 2. [                       ]│
│ 3. [                       ]│
├─────────────────────────────┤
│ KEY RHYTHMS                 │
│ ☐ Weekly: Check equipment   │
│ ☐ Monthly: Review budget    │
│ ☐ Monthly: 1-on-1 with     │
│   audio team lead           │
└─────────────────────────────┘
```

#### Today Card (Work Focus)

Single card in Midday block showing top 1–3 Weekly Focus items across all departments:
```
┌─────────────────────────────┐
│ 💼 Work Focus               │
│ • Finalize chapel AV plan   │
│ • Prep worship night set    │
│ • Review Q1 audio budget    │
│                     [View →]│
└─────────────────────────────┘
```

Long press → Edit Ladder (edit today's items / this week's focus / department template).

---

### 4.8 Progress

**Purpose:** Minimal insights. Not a dashboard — a calm weekly check-in.

#### Layout

```
┌─────────────────────────────┐
│ ← Progress                  │
├─────────────────────────────┤
│ THIS WEEK                   │
│ ┌───────────────────────┐   │
│ │ Workouts: 2/3 done    │   │
│ │ ● ● ○                 │   │  ← dot indicators, not charts
│ ├───────────────────────┤   │
│ │ Tasks completed: 12   │   │
│ │ Top 3 hit rate: 80%   │   │
│ ├───────────────────────┤   │
│ │ Journal: 5/7 days     │   │
│ │ ● ● ● ● ● ○ ○        │   │
│ ├───────────────────────┤   │
│ │ Mobility: 6/7 days    │   │
│ │ ● ● ● ● ● ● ○        │   │
│ └───────────────────────┘   │
├─────────────────────────────┤
│ WEEKLY REVIEW               │
│ Not yet completed this week │
│ [Start Weekly Review]       │  ← guided 5-question flow
├─────────────────────────────┤
│ TRENDS (tap to expand)      │
│ ▶ Workout volume (4 weeks)  │
│ ▶ Task completion (4 weeks) │
│ ▶ Journal streak            │
├─────────────────────────────┤
│ FINANCES (if enabled)       │
│ This week: $142 spent       │
│ Top category: Groceries     │
│ [View breakdown]            │
└─────────────────────────────┘
```

#### Weekly Review Flow (guided)

```
1. "What went well this week?" → free text
2. "What was your biggest challenge?" → free text
3. "Rate your energy this week" → 1–5 scale
4. "Anything to adjust for next week?" → free text
5. "Pick your Top 3 for next week" → task picker or free text
→ [Save Review]
```

#### Empty State

```
"Complete a few days and your trends will appear here."
"No rush — consistency beats intensity."
```

---

## 5. Card System Design

### Card Type Reference

#### 5.1 Workout Card (Today)

| Field | Value |
|-------|-------|
| **Title** | "Push Day" (from template name) |
| **Subtitle** | "Monday — 9 exercises" |
| **Content** | Collapsed: first 3 exercise names. Expanded: full session view |
| **Actions** | Tap to open session, long press for Edit Ladder |
| **Completion** | All exercises have at least 1 set checked |
| **Badge** | None (clean) |

#### 5.2 Exercise Card (within Workout Session)

| Field | Value |
|-------|-------|
| **Title** | Exercise name + optional variant |
| **"Last time" line** | "Last: 70 lbs × 10 × 3 — Jan 29" |
| **Sets table** | Rows: set #, weight, reps, completed toggle |
| **Quick actions** | Copy last, +5 lbs, Note |
| **Rest timer** | Configurable countdown |
| **Notes** | Free text per exercise instance |
| **Completion** | At least 1 set completed |

#### 5.3 Checklist Card (Supplements, Mobility, Custom)

| Field | Value |
|-------|-------|
| **Title** | "Morning Supplements" / "Morning Mobility" |
| **Items** | List of items with checkboxes |
| **Per-item** | Label, optional dosage/duration, checkbox |
| **Timer** | Optional per-item (e.g., "30 sec/side") |
| **Actions** | Check items, tap for timer, long press for Edit Ladder |
| **Completion** | All items checked |

#### 5.4 Timer Card (Mobility items, Custom)

| Field | Value |
|-------|-------|
| **Title** | "Hip flexor stretch" |
| **Duration** | "30 sec/side" |
| **Display** | Countdown timer with start/pause/reset |
| **Actions** | Start, pause, reset, "Done" |
| **Completion** | Timer reached zero OR user tapped "Done" |

#### 5.5 Task Card (on Today)

| Field | Value |
|-------|-------|
| **Title** | Task title |
| **Metadata line** | Due time (if set), project name, priority badge |
| **Subtasks** | Inline checklist (if any) |
| **Actions** | Complete (swipe right), snooze (swipe left), long press for detail |
| **Completion** | Checkbox checked |
| **Visual priority** | P1: bold title. P2: normal. P3: muted |

#### 5.6 Daily To-Do Module Card (on Today)

| Field | Value |
|-------|-------|
| **Title** | "Daily To-Do" |
| **Content** | List of today's tasks (scheduled + due + overdue collapsed) |
| **Top 3 section** | Pinned at top with star icons |
| **Actions** | Tap task to expand, complete inline, add task |
| **Completion** | N/A (composite card — individual tasks complete) |

#### 5.7 Journal Card (on Today)

| Field | Value |
|-------|-------|
| **Title** | "Journal" (Morning or Evening variant) |
| **Prompt** | Optional: "One thing on your mind..." |
| **Content** | Text input area (auto-expands) |
| **Actions** | Write text, add photo, star a line, view full entry |
| **Completion** | Any text entered OR photo added |

#### 5.8 Reminder Card (on Today, if surfaced)

| Field | Value |
|-------|-------|
| **Title** | Starred text preview |
| **Source** | "From journal — Feb 4" (backlink) |
| **Actions** | Got it (dismiss for today), Pin, Snooze, Edit |
| **Completion** | "Got it" tapped |

#### 5.9 Top-Reminders Card (on Today, Reminders section)

| Field | Value |
|-------|-------|
| **Title** | "Reminders" |
| **Content** | 1–3 pinned/surfaced reminders |
| **Actions** | Tap to view source, dismiss, snooze |
| **Completion** | All items dismissed or acknowledged |

#### 5.10 Charisma Reminder Card

| Field | Value |
|-------|-------|
| **Title** | "Daily Reminder" |
| **Content** | Single reminder text (from deck) |
| **Theme label** | e.g., "Presence" / "Voice" / "Listening" |
| **Actions** | Got it, Pin (3–7 days), Favorite, Swap (new random), Snooze (30 days) |
| **Completion** | "Got it" tapped |

#### 5.11 Work Focus Card (on Today)

| Field | Value |
|-------|-------|
| **Title** | "Work Focus" |
| **Content** | 1–3 Weekly Focus items (across departments) |
| **Actions** | Tap to go to Work Focus, long press for Edit Ladder |
| **Completion** | N/A (informational — individual items have their own completion) |

#### 5.12 Money Minute Card

| Field | Value |
|-------|-------|
| **Title** | "Money Minute" |
| **Content** | Amount input + category picker + optional note |
| **Categories** | Groceries, Dining, Transport, Bills, Personal, Other (editable) |
| **Actions** | Enter amount, pick category, add note, save |
| **Completion** | At least one entry saved |

#### 5.13 Supplement Card (Checklist variant)

| Field | Value |
|-------|-------|
| **Title** | "Morning Supplements" / "Midday" / "Pre-Workout" / "Night" |
| **Items** | Supplement name + dosage + timing note + checkbox |
| **Actions** | Check items, long press for Edit Ladder |
| **Completion** | All items checked |

#### 5.14 Custom Module Card

| Field | Value |
|-------|-------|
| **Title** | User-defined module name + icon |
| **Content** | Rendered from field definitions (checklist items, log fields, timers, etc.) |
| **Actions** | Per-field interactions + "Mark Complete" |
| **Completion** | Per module's completion rule |

---

## 6. On-the-Fly Update Flows

### 6.1 Edit Ladder Flows

**Trigger:** Long press any card on Today.

**Bottom Sheet:**

```
┌─────────────────────────────┐
│ Edit Incline DB Press       │
│                             │
│ [Edit Today Only]           │
│  Changes apply to today's   │
│  session only.              │
│                             │
│ [Edit This Week]            │
│  Changes apply to all       │
│  remaining sessions this    │
│  week.                      │
│                             │
│ [Edit Template]             │
│  Changes apply to all       │
│  future sessions.           │
│                             │
│ [Cancel]                    │
└─────────────────────────────┘
```

**Flow for each option:**

**Edit Today Only:**
1. User selects "Edit Today Only."
2. Inline editing activates on the card (add/remove items, change values, reorder).
3. Changes saved to the **Instance** record only.
4. Tomorrow regenerates from template as normal.

**Edit This Week:**
1. User selects "Edit This Week."
2. Same editing interface opens.
3. Changes saved to a **WeekOverride** record (applies to remaining instances this week).
4. Next week regenerates from template.

**Edit Template:**
1. User selects "Edit Template."
2. Opens the full template editor (Plan tab context).
3. Confirmation: "This changes all future [Mon Push Days]. Past workouts are unchanged."
4. Changes saved to **Template** record.
5. Future instances generated from updated template.

### 6.2 Disable Today vs. Disable Forever

**Disable Today:**
1. From Customize Today or long-press card → "Disable today."
2. Card removed from Today immediately (instance deleted or marked skipped).
3. Module reappears tomorrow on its normal schedule.
4. No history impact. No confirmation needed.

**Disable Forever:**
1. From Customize Today → module row → "Disable forever."
2. Confirmation dialog:
   ```
   Disable Supplements?

   This stops Supplements from appearing on
   Today going forward. Your past logs are
   preserved. You can re-enable anytime from
   Plan → Customize Today.

   [Cancel]  [Disable]
   ```
3. Module template marked `disabled_at = now`.
4. No future instances generated.
5. Past entries/logs remain intact and searchable.
6. Re-enable: Plan → Customize Today → toggle back on → instances resume.

### 6.3 Swap Workout Day (This Week)

1. Long-press "Today's Workout" card → Edit Ladder.
2. Select "Swap workout day."
3. Bottom sheet shows this week's calendar:
   ```
   Move Push Day to:
   Mon ← (current, greyed)
   Tue
   Wed — Pull Day scheduled
   Thu ← (user taps)
   Fri — Full Body scheduled
   Sat
   Sun
   ```
4. User taps Thursday.
5. Confirmation: "Push Day moved to Thursday this week. Pull Day stays on Wednesday."
6. Option toggle: "Also update my template?" (default OFF).
7. Changes:
   - Today (Monday): workout card removed, becomes rest day card.
   - Thursday instance: Push Day generated.
   - Template unchanged (unless toggle was ON).
8. History: Monday is logged as "rest day" (no workout entry created). Thursday logs the Push Day workout when completed.

### 6.4 Task Snooze / Reschedule + Do Date vs Due Date

**Snooze from Today:**
1. Swipe task left → snooze options appear:
   ```
   [Tonight] [Tomorrow] [Next workday] [Next week] [Pick date]
   ```
2. User picks "Tomorrow."
3. `scheduled_date` changes to tomorrow. `due_date` unchanged.
4. Task disappears from Today, appears tomorrow.
5. If `due_date` is today or past, task shows amber "Due [date]" badge on Tomorrow view.

**Do Date vs Due Date logic:**
- `scheduled_date` (Do date): "When should I work on this?" Controls when it appears on Today.
- `due_date` (Deadline): "When must this be done?" Controls overdue status.
- If user sets only `due_date`, `scheduled_date` defaults to `due_date`.
- User can set `scheduled_date` earlier than `due_date` (e.g., do Monday, due Friday).
- Snoozeing moves `scheduled_date` only. `due_date` never auto-changes.

### 6.5 Journal Star → Reminders + OCR Review/Edit

**Starring a line:**
1. User writes in journal: "I respond with calm strength in every room."
2. Taps the star icon (left gutter or highlight menu) on that line.
3. System creates a **ReminderItem**:
   - `text`: "I respond with calm strength in every room."
   - `source_entry_id`: points to today's journal entry
   - `source_line_ref`: line number or text hash for backlink
   - `pinned`: false
   - `surface_in_today`: false (default)
4. Star icon turns filled. Line has subtle highlight.
5. ReminderItem appears in Journal → Reminders view.

**Surfacing a reminder on Today:**
1. In Reminders view, tap a reminder → "Surface in Today."
2. Pick time block: Morning / Midday / Evening.
3. Reminder card appears on Today at chosen block.

**OCR Review/Edit:**
1. After OCR runs on a photo, user sees editable text field.
2. User corrects errors inline.
3. Taps "Save Text + Photo."
4. Both the original image and the corrected text are stored on the journal entry.
5. OCR text is indexed for search.
6. User can re-run OCR anytime from the photo attachment.

### 6.6 Custom Module Creation + Scheduling

1. Plan tab → Custom Modules → "+ Build a Module."
2. **Name + Icon:** "Swim Training" + 🏊
3. **Building Blocks:** User selects Checklist + Log.
4. **Fields:**
   - Checklist: Warm-up 200m, Main set 4x100m, Cool-down 100m
   - Log: "Total yards" (number, yards), "Pace notes" (text)
5. **Schedule:** Mon/Wed/Fri, Workout block.
6. **Completion rule:** All checklist items checked.
7. **Save** → creates `CustomModuleTemplate` + `CustomModuleFieldDefinition` records.
8. On next Mon/Wed/Fri, Today generates a Swim Training card in the Workout block.
9. User interacts with card (checks items, logs yards, adds notes).
10. On completion, creates `CustomModuleEntry` with logged data as JSON.
11. Data searchable by module name, field values, date.

---

## 7. Data Model

### Entity Relationship Overview

```
User
 ├── Templates (workout, mobility, supplements, task-repeat, custom modules, etc.)
 │    ├── FieldDefinitions (for custom modules)
 │    └── ScheduleRules
 ├── Instances (today's generated cards — one per template per day)
 │    └── Entries/Logs (workout sets, checklist checks, journal text, etc.)
 ├── Tasks
 │    └── Subtasks
 ├── JournalEntries
 │    ├── Attachments (photos)
 │    │    └── OCRText
 │    └── ReminderItems (starred lines)
 ├── WorkFocusDepartments
 │    ├── QuarterlyOutcomes
 │    ├── Goals
 │    ├── WeeklyFocus
 │    └── KeyRhythms
 ├── CharismaReminders (deck)
 ├── FinanceEntries (money minute)
 ├── Tags/Topics
 ├── SyncOutbox
 └── SyncLedger
```

### Core Tables

#### Users
```
users
  id: UUID (PK)
  email: string
  display_name: string
  avatar_url: string (nullable)
  settings: JSONB (notification prefs, quiet hours, beginner mode, etc.)
  onboarding_preset: enum (john_starter | minimal | empty)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable, tombstone)
```

#### Templates
```
templates
  id: UUID (PK)
  user_id: UUID (FK → users)
  type: enum (workout | mobility | supplements | charisma_deck | work_focus |
              audio_training | finance | custom_module)
  name: string
  icon: string (nullable, emoji or icon key)
  description: string (nullable)
  is_active: boolean (true = generates instances)
  disabled_at: timestamp (nullable — "disabled forever")
  config: JSONB (type-specific configuration)
  version: integer (for schema evolution)
  sort_order: integer
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable, tombstone)
```

#### Schedule Rules
```
schedule_rules
  id: UUID (PK)
  template_id: UUID (FK → templates)
  user_id: UUID (FK → users)
  days_of_week: integer[] (0=Sun, 1=Mon, ..., 6=Sat)
  time_block: enum (morning | midday | workout | evening)
  time_hint: time (nullable — suggested time within block)
  repeat_type: enum (daily | specific_days | weekly | biweekly | monthly | custom)
  repeat_config: JSONB (nullable — for complex repeat rules)
  effective_from: date
  effective_until: date (nullable)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Template Items (exercises, checklist items, supplement items, etc.)
```
template_items
  id: UUID (PK)
  template_id: UUID (FK → templates)
  user_id: UUID (FK → users)
  label: string
  item_type: enum (exercise | checklist_item | supplement | stretch | prompt |
                   timer | counter | log_field | link)
  config: JSONB (type-specific: {sets: 3, reps: 10, weight_unit: "lbs",
                  dosage: "5g", duration_seconds: 30, side: "each", ...})
  sort_order: integer
  is_optional: boolean (default false — for "optional" exercises)
  variant: string (nullable — e.g., "incline", "decline")
  normalized_exercise_id: string (nullable — for exercise matching: "barbell_bench_press")
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Instances (generated daily cards)
```
instances
  id: UUID (PK)
  template_id: UUID (FK → templates, nullable for one-offs)
  user_id: UUID (FK → users)
  instance_date: date
  time_block: enum (morning | midday | workout | evening)
  status: enum (pending | in_progress | completed | skipped | disabled)
  is_customized: boolean (user reordered/edited today)
  sort_order: integer (within block, for user-reordered Today)
  completed_at: timestamp (nullable)
  config_override: JSONB (nullable — Edit Today Only / Edit This Week overrides)
  week_override_id: UUID (nullable — FK to week_overrides if this week was edited)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Week Overrides
```
week_overrides
  id: UUID (PK)
  template_id: UUID (FK → templates)
  user_id: UUID (FK → users)
  week_start: date (Monday of the week)
  override_config: JSONB (changes from template for this week)
  created_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Instance Entries (logged data: workout sets, checklist completions, etc.)
```
instance_entries
  id: UUID (PK)
  instance_id: UUID (FK → instances)
  template_item_id: UUID (FK → template_items, nullable for ad-hoc entries)
  user_id: UUID (FK → users)
  entry_type: enum (set | check | log | timer | text | counter | media)
  data: JSONB (type-specific:
    set: {set_number: 1, weight: 135, reps: 8, completed: true, unit: "lbs"}
    check: {completed: true, completed_at: "..."}
    log: {value: 1200, unit: "yards"}
    timer: {duration_seconds: 30, completed: true}
    text: {content: "Felt strong today"}
    counter: {count: 25}
    media: {attachment_id: "UUID"} )
  sort_order: integer
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Exercise History (denormalized for fast "last time" lookups)
```
exercise_history
  id: UUID (PK)
  user_id: UUID (FK → users)
  normalized_exercise_id: string (e.g., "barbell_bench_press")
  variant: string (nullable)
  template_id: UUID (FK → templates, nullable)
  instance_id: UUID (FK → instances)
  instance_date: date
  sets_data: JSONB ([{set: 1, weight: 135, reps: 8}, ...])
  best_set: JSONB ({weight: 135, reps: 10} — for quick reference)
  total_volume: integer (sum of weight × reps across sets)
  notes: string (nullable)
  created_at: timestamp
```

#### Tasks
```
tasks
  id: UUID (PK)
  user_id: UUID (FK → users)
  title: string
  notes: string (nullable)
  scheduled_date: date (nullable — "do date")
  due_date: date (nullable — "deadline")
  due_time: time (nullable)
  duration_minutes: integer (nullable)
  priority: enum (p1 | p2 | p3) (default p3)
  project_id: UUID (nullable, FK → projects)
  is_top3: boolean (default false)
  top3_date: date (nullable — Top 3 for which date)
  status: enum (inbox | active | completed)
  completed_at: timestamp (nullable)
  repeat_rule_id: UUID (nullable, FK → schedule_rules)
  sort_order: integer (for Today ordering)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Subtasks
```
subtasks
  id: UUID (PK)
  task_id: UUID (FK → tasks)
  user_id: UUID (FK → users)
  title: string
  is_completed: boolean
  completed_at: timestamp (nullable)
  sort_order: integer
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Projects
```
projects
  id: UUID (PK)
  user_id: UUID (FK → users)
  name: string
  description: string (nullable)
  color: string (nullable — hex)
  sort_order: integer
  is_archived: boolean (default false)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Journal Entries
```
journal_entries
  id: UUID (PK)
  user_id: UUID (FK → users)
  entry_date: date
  sections: JSONB ({
    prayer: "text...",
    leadership: "text...",
    gratitude: "text...",
    free_notes: "text..."
  })
  full_text: string (concatenated, for search indexing)
  tags: string[] (auto-suggested + user-edited)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Journal Entry Versions (for conflict resolution)
```
journal_entry_versions
  id: UUID (PK)
  journal_entry_id: UUID (FK → journal_entries)
  user_id: UUID (FK → users)
  sections: JSONB (snapshot of sections at this version)
  source: enum (local | remote)
  client_event_id: UUID
  created_at: timestamp
```

#### Attachments
```
attachments
  id: UUID (PK)
  user_id: UUID (FK → users)
  parent_type: enum (journal_entry | instance_entry | task | custom_module_entry)
  parent_id: UUID
  file_name: string
  file_type: string (mime type)
  file_size: integer (bytes)
  storage_key: string (object storage path)
  local_uri: string (nullable — local file path for offline)
  thumbnail_uri: string (nullable)
  upload_status: enum (pending | uploaded | failed)
  created_at: timestamp
  deleted_at: timestamp (nullable)
```

#### OCR Text
```
ocr_texts
  id: UUID (PK)
  attachment_id: UUID (FK → attachments)
  user_id: UUID (FK → users)
  raw_text: string (original OCR output)
  edited_text: string (user-corrected text)
  confidence: float (nullable — overall OCR confidence)
  engine: string (e.g., "tesseract.js@5.0")
  created_at: timestamp
  updated_at: timestamp
```

#### Reminder Items (from starred journal lines)
```
reminder_items
  id: UUID (PK)
  user_id: UUID (FK → users)
  text: string (snapshot of starred text)
  source_entry_id: UUID (nullable, FK → journal_entries — backlink)
  source_line_ref: string (nullable — line number or text hash)
  is_pinned: boolean (default false)
  pin_order: integer (nullable)
  snooze_until: date (nullable)
  surface_in_today: boolean (default false)
  surface_time_block: enum (morning | midday | evening) (nullable)
  is_favorited: boolean (default false)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Charisma Reminders (Deck)
```
charisma_reminders
  id: UUID (PK)
  user_id: UUID (FK → users)
  text: string
  theme: string (nullable — e.g., "Presence", "Voice", "Listening")
  is_default: boolean (true for shipped deck)
  is_custom: boolean (false for shipped deck)
  is_favorited: boolean
  last_shown_at: date (nullable)
  snooze_until: date (nullable)
  pin_until: date (nullable)
  created_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Work Focus
```
work_focus_departments
  id: UUID (PK)
  user_id: UUID (FK → users)
  name: string
  sort_order: integer
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)

work_focus_outcomes
  id: UUID (PK)
  department_id: UUID (FK → work_focus_departments)
  user_id: UUID (FK → users)
  quarter: string (e.g., "2026-Q1")
  text: string
  sort_order: integer
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)

work_focus_goals
  id: UUID (PK)
  department_id: UUID (FK → work_focus_departments)
  user_id: UUID (FK → users)
  title: string
  status: enum (on_track | at_risk | blocked | completed)
  due_date: date (nullable)
  notes: string (nullable)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)

work_focus_weekly
  id: UUID (PK)
  department_id: UUID (FK → work_focus_departments)
  user_id: UUID (FK → users)
  week_start: date
  items: JSONB ([{text: "...", completed: false}, ...])
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)

work_focus_rhythms
  id: UUID (PK)
  department_id: UUID (FK → work_focus_departments)
  user_id: UUID (FK → users)
  title: string
  frequency: enum (daily | weekly | biweekly | monthly | quarterly)
  last_completed_at: timestamp (nullable)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Finance Entries
```
finance_entries
  id: UUID (PK)
  user_id: UUID (FK → users)
  entry_date: date
  amount: decimal
  category: string
  note: string (nullable)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Custom Module Templates
```
custom_module_templates
  id: UUID (PK, also used as templates.id)
  user_id: UUID (FK → users)
  name: string
  icon: string
  description: string (nullable)
  building_blocks: string[] (e.g., ["checklist", "log", "timer"])
  completion_rule: enum (all_checked | any_logged | manual | timer_completed)
  schema_version: integer (increments on field changes)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)

custom_module_field_definitions
  id: UUID (PK)
  module_template_id: UUID (FK → custom_module_templates)
  user_id: UUID (FK → users)
  field_type: enum (checklist_item | timer | log_number | log_text | log_select |
                    prompt | counter | media | link)
  label: string
  config: JSONB ({
    unit: "yards",
    options: ["easy", "moderate", "hard"],
    duration_seconds: 60,
    validation: {min: 0, max: 10000},
    ...
  })
  sort_order: integer
  schema_version_added: integer (track when field was added)
  schema_version_removed: integer (nullable — track when field was removed)
  created_at: timestamp
  updated_at: timestamp

custom_module_entries
  id: UUID (PK)
  module_template_id: UUID (FK → custom_module_templates)
  instance_id: UUID (FK → instances)
  user_id: UUID (FK → users)
  entry_date: date
  data: JSONB ({
    "field_id_1": {completed: true},
    "field_id_2": {value: 1200, unit: "yards"},
    "field_id_3": {content: "Felt fast today"}
  })
  schema_version: integer (matches template version at time of entry)
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp (nullable)
```

#### Tags / Topics
```
tags
  id: UUID (PK)
  user_id: UUID (FK → users)
  name: string (e.g., "Faith/Prayer", "Leadership/Admin", etc.)
  is_default: boolean
  keywords: string[] (for rules-based auto-tagging)
  color: string (nullable)
  created_at: timestamp
  deleted_at: timestamp (nullable)

taggables (polymorphic join)
  id: UUID (PK)
  tag_id: UUID (FK → tags)
  taggable_type: enum (journal_entry | task | instance | reminder_item |
                       finance_entry | custom_module_entry)
  taggable_id: UUID
  auto_assigned: boolean (true if rules-based, false if user-assigned)
  created_at: timestamp
```

#### Sync Outbox
```
sync_outbox
  id: UUID (PK)
  user_id: UUID
  client_event_id: UUID (unique — ensures idempotent sync)
  entity_type: string (table name)
  entity_id: UUID
  operation: enum (insert | update | delete)
  payload: JSONB (full entity state or diff)
  status: enum (pending | in_flight | synced | failed)
  retry_count: integer (default 0)
  created_at: timestamp
  synced_at: timestamp (nullable)
```

#### Sync Ledger
```
sync_ledger
  id: UUID (PK)
  user_id: UUID
  client_event_id: UUID (unique — dedup check)
  entity_type: string
  entity_id: UUID
  operation: enum (insert | update | delete)
  server_timestamp: timestamp
  created_at: timestamp
```

#### User Settings / Preferences (stored in users.settings JSONB)
```
settings schema:
{
  notification_prefs: {
    am_anchor_time: "07:00",
    pm_anchor_time: "21:00",
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    task_reminders: true
  },
  workout_prefs: {
    auto_prefill_last_time: true,
    default_rest_seconds: 90,
    weight_increment: 5,
    weight_unit: "lbs"
  },
  today_prefs: {
    preset: "standard",
    module_order: [...],
    busy_day_active: false
  },
  beginner_mode: true,
  theme: "system"
}
```

---

## 8. Rules Engine & Smart Surfacing

### 8.1 Today Generation Rules

**Trigger:** App open (if today hasn't been generated) OR midnight rollover.

**Algorithm:**

```
1. Get all active templates for user
2. For each template:
   a. Check schedule_rules → does this template run today? (day of week match)
   b. Check disabled_at → skip if "disabled forever"
   c. Check week_overrides → apply any this-week changes
   d. Generate instance record with status = pending
   e. Assign to time_block from schedule_rules
3. Sort instances within each block:
   a. If user has custom sort_order for today → use it
   b. Else use default: template sort_order within block
4. Add task-derived cards:
   a. Query tasks where scheduled_date = today OR due_date = today OR
      (due_date < today AND status != completed)
   b. Generate Daily To-Do module card
   c. Separate Top 3 tasks (is_top3 = true, top3_date = today)
5. Add charisma reminder:
   a. Pick random from deck where last_shown_at NOT in last 7 days
      AND snooze_until < today AND pin_until < today (unless pinned)
   b. If pinned reminder exists → show pinned one
6. Add surfaced reminders:
   a. Query reminder_items where surface_in_today = true AND
      (snooze_until IS NULL OR snooze_until < today)
7. Mark today as "generated" — future opens reuse existing instances
```

**Regeneration (pull-to-refresh or "Reset Today to Default"):**

```
1. Preserve: pinned items, user sort_order, completed instances
2. Re-run generation for non-customized, non-completed instances
3. "Reset Today to Default": clears is_customized, re-runs full generation
   (but preserves completed items)
```

### 8.2 Block Default Schedules

| Block | Default Time Range | Default Modules |
|-------|-------------------|-----------------|
| **Morning** | 6:00 AM – 11:59 AM | Charisma Reminder, Morning Mobility, Morning Supplements, Journal (AM prompt) |
| **Midday** | 12:00 PM – 3:59 PM | Work Focus, Midday Supplements, Daily To-Do, Audio Training |
| **Workout** | 4:00 PM – 5:59 PM | Today's Workout, Pre-Workout Supplements |
| **Evening** | 6:00 PM – 11:59 PM | Evening Mobility, Night Supplements, Money Minute, Journal (PM), Shutdown |

Users can move modules between blocks in Customize Today.

### 8.3 Notification Rules

**Push Notifications (iOS 16.4+ PWA):**

| Notification | Default Time | Content | Configurable |
|--------------|-------------|---------|-------------|
| AM Anchor | 7:00 AM | "Good morning. You have [N] items today." | Time, on/off |
| PM Anchor | 9:00 PM | "Wind down: [evening items remaining]." | Time, on/off |
| Task reminder | User-set | "[Task title] — due at [time]" | Per-task |

**Rules:**
- Max 2 anchors + unlimited user-set task reminders.
- Quiet hours: no notifications between `quiet_hours_start` and `quiet_hours_end`.
- Disabled modules produce zero notifications.
- User can mute all notifications globally.

### 8.4 In-App Nudge Rules

| Nudge | Trigger | Display | Dismissal |
|-------|---------|---------|-----------|
| "Next up" row | Scroll past current block | Sticky row at top: "Next: [card name]" | Auto-hides on scroll |
| Overdue badge | Tasks overdue | Small amber dot on Tasks tab icon | Clears when tasks addressed |
| Journal streak | 3+ consecutive days | Subtle "3-day streak" below journal card | Informational only |
| Incomplete count | Items remaining at evening | "4 items left — [finish up] or [skip for today]" | Tap to dismiss |

**Never:**
- Guilt language ("You missed...", "You failed to...")
- Red badges or alarming colors for non-critical items
- Nudges for disabled modules
- Nudges during quiet hours

### 8.5 Charisma Reminder Selection Algorithm

```
1. Pool = all charisma_reminders WHERE deleted_at IS NULL
         AND snooze_until IS NULL OR snooze_until < today
2. If any reminder has pin_until >= today → select pinned one
3. Else: exclude reminders where last_shown_at within last 7 days
4. From remaining pool: random pick
5. If pool is empty (all shown recently): expand window to 14 days, then random
6. Update selected reminder: last_shown_at = today
```

### 8.6 Topic Auto-Tagging (Rules-Based)

**Algorithm:**
```
1. Input: text content (journal entry, task title+notes, etc.)
2. Lowercase + tokenize
3. For each tag in user's tag set:
   a. Count keyword matches (tag.keywords array)
   b. Score = match_count / total_words (normalized)
4. Sort tags by score descending
5. Assign top 1–3 tags where score > threshold (0.02)
6. Mark as auto_assigned = true
7. User can edit: add/remove tags, which updates auto_assigned = false for manual ones
```

**Default Tag Keywords:**

| Tag | Default Keywords |
|-----|-----------------|
| Faith/Prayer | prayer, pray, God, faith, scripture, Bible, devotion, worship, spirit, blessing, grace, meditation |
| Leadership/Admin | leadership, lead, team, meeting, strategy, vision, delegate, manage, admin, decision |
| Family | family, wife, husband, kids, children, mom, dad, parent, home, dinner |
| Audio | audio, sound, mix, speaker, monitor, mic, cable, eq, gain, signal |
| Worship | worship, song, setlist, rehearsal, music, chord, lyric, band |
| Production | production, stage, lights, video, camera, screen, graphics, slides |
| Chapel | chapel, service, congregation, ministry, volunteer, event |
| Finances | money, budget, expense, cost, income, savings, invest, bill, payment |
| Health/Fitness | workout, exercise, gym, run, swim, stretch, mobility, supplement, sleep, nutrition |
| Other | (catch-all — no keywords) |

Users can add custom keywords per tag.

### 8.7 Beginner Mode Defaults

When `beginner_mode = true`:

| Feature | Beginner Setting | Advanced Setting |
|---------|-----------------|-----------------|
| Task priority | Hidden (all P3) | P1/P2/P3 visible |
| Task duration | Hidden | Visible |
| Workout progression suggestions | Hidden | Configurable |
| Module Builder | Simplified (fewer block types) | Full |
| Work Focus | Collapsed (show weekly focus only) | Full departments |
| Finance categories | 3 presets | Custom categories |
| Search filters | Basic (type + date) | Full chip set |
| Today customization | Presets only | Per-module toggles |

User can toggle beginner mode off in Settings at any time.

### 8.8 Global Search

**Search across:**
- Tasks (title, notes, subtask text)
- Journal entries (all sections, OCR text)
- Reminder items (text)
- Workout logs (exercise names, notes)
- Finance entries (category, notes)
- Custom module entries (all text fields)
- Charisma reminders (text)
- Work Focus (goals, weekly items, rhythms)

**Filter chips (combinable):**
- **Type:** Tasks, Journal, Workouts, Reminders, Finances, [Custom modules]
- **Tags:** Any tag from taxonomy
- **Date:** Today, This week, This month, Custom range
- **Has photo:** Yes/No
- **Status:** Completed/Uncompleted (for tasks/workouts)
- **Priority:** P1/P2/P3 (for tasks)

**Results format:**
```
┌─────────────────────────────┐
│ 🔍 [search query        ] x │
│ [Tasks] [Journal] [All ▾]   │  ← filter chips
├─────────────────────────────┤
│ 📝 "patience in leadership" │
│ Journal — Feb 4 — Faith     │
│ "...praying for patience    │
│  in leadership moments..."  │
│                             │
│ ☐ "Review patience training"│
│ Task — Feb 8 — Leadership   │
│                             │
│ ★ "I respond with calm      │
│   strength"                 │
│ Reminder — Feb 6 — starred  │
└─────────────────────────────┘
```

---

## 9. MVP Scope & Phased Roadmap

### Phase 1 — Core Experience (MVP)

**Goal:** Ship a usable daily driver with the core loop: open → see Today → do things → close.

**Includes:**
- [ ] PWA setup (Next.js + manifest + service worker + A2HS)
- [ ] Supabase Auth (email + Google OAuth)
- [ ] IndexedDB local database (Dexie) with all core tables
- [ ] Sync engine (outbox queue + idempotent client_event_id + last-write-wins)
- [ ] Sync status indicator (Synced / Syncing / Offline)
- [ ] Today Runway (time blocks, card rendering, gestures, Busy Day mode)
- [ ] Today generation + regeneration (from templates, respecting pins + custom order)
- [ ] Edit Ladder (today / this week / template) — consistent everywhere
- [ ] Tasks (Inbox, Today, Upcoming, Projects, Top 3, snooze, repeat rules)
- [ ] Workout module (template-based, sets/reps/weight, "last time" defaults, rest timer, swap day)
- [ ] Default workout plan (John Default 3-Day Split)
- [ ] Mobility module (AM/PM checklists with timers)
- [ ] Journal (daily entry with sections, text input, tags)
- [ ] Journal photo capture + OCR (Tesseract.js, crop/rotate, review/edit flow)
- [ ] Starred lines → Reminder Items (snapshot model, backlinks)
- [ ] Reminders view in Journal tab
- [ ] Charisma Reminder deck (30 defaults, daily pick, avoid repeats, pin/snooze/favorite/swap)
- [ ] Supplements module (checklist cards at 4 time slots)
- [ ] Work Focus (departments, quarterly outcomes, active goals, weekly focus, key rhythms)
- [ ] Money Minute (daily entry: amount + category + note)
- [ ] Audio Training (default card, quick notes)
- [ ] Customize Today (3 presets + per-module toggles + disable today / forever)
- [ ] Quick Add (command bar — task, journal, workout log, schedule, money minute)
- [ ] Global Search (basic: keyword across all modules, type filter, date filter)
- [ ] Topic auto-tagging (rules-based keyword scoring)
- [ ] Push notifications (AM/PM anchors + task reminders, iOS 16.4+)
- [ ] Onboarding (3 preset choices: John Starter / Minimal / Empty)
- [ ] Beginner mode defaults
- [ ] Offline-first: all interactions work offline, photos queue for sync
- [ ] Tombstone deletions for sync integrity
- [ ] Profile/Settings (notification prefs, quiet hours, weight unit, beginner toggle)

**Not in Phase 1:**
- Custom Module Builder
- Advanced search filters
- Export/backup
- Weekly review (Progress tab)
- RPG/gamification

### Phase 2 — Module Builder + Enhanced Search + Insights

**Goal:** Let users extend the app and find anything.

**Includes:**
- [ ] Custom Module Builder (name, icon, building blocks, fields, schedule, completion rule)
- [ ] Custom module cards on Today (full interface contract)
- [ ] Versioned field definitions (schema evolution for custom modules)
- [ ] Advanced search (full chip filters: has photo, priority, tags, status, date range)
- [ ] Search result highlighting and previews
- [ ] Progress tab (weekly stats: workout count, task completion, journal streak)
- [ ] Weekly Review guided flow (5 questions)
- [ ] Workout volume trends (simple line chart, 4-week view)
- [ ] Finance weekly/monthly breakdown
- [ ] Journal version history (for conflict resolution)
- [ ] Export: journal entries (PDF), workout logs (CSV), task history (CSV)
- [ ] Backup/restore (JSON dump to Supabase Storage)
- [ ] Account deletion flow
- [ ] Custom categories for Money Minute
- [ ] Workout progression suggestions (optional, deterministic: "You hit all reps — try +5 lbs")

### Phase 3 — RPG Integration + Advanced Reviews

**Goal:** Add opt-in gamification layer and deeper reflection tools.

**Includes:**
- [ ] RPG module (XP, levels, character stats — separate design prompt)
- [ ] XP tied to completions (idempotent via client_event_id — no double XP)
- [ ] Advanced weekly/monthly review templates
- [ ] Goal tracking with milestones
- [ ] Department quarterly review flow
- [ ] Richer workout analytics (PR tracking, muscle group balance)
- [ ] Custom reminder deck creation (beyond charisma)
- [ ] Supplement interaction notes / journal correlation
- [ ] Data visualization improvements
- [ ] Sharing preparation (data model supports it — design sharing UX)

### Future Considerations (Not Scoped)

- Multi-user sharing / workspaces
- Native app (if PWA limitations become blocking)
- AI-powered journaling insights (opt-in, privacy-first)
- Wearable integrations (Apple Health)
- Habit formation science features (cue-routine-reward mapping)
- Team/ministry dashboards (builds on sharing)

---

## Appendix A: Quick Add Command Language

| Pattern | Parsed As | Example |
|---------|-----------|---------|
| `Task: [text]` | New task with title | "Task: Buy new cables by Friday" |
| `Task: [text] by [date] [time]` | Task with due_date + due_time | "Task: Submit report by Fri 2pm" |
| `Schedule: [text] [date] [time]` | Task with scheduled_date + time | "Schedule: Call mom tomorrow 6pm" |
| `Workout: [exercise] [weight]x[reps]x[sets]` | Log exercise sets | "Workout: bench 135x8x3" |
| `Log [exercise] [weight]x[reps]` | Log single set | "Log bench 135x8" |
| `Journal: [text]` | Add to today's journal (free notes) | "Journal: prayer about patience" |
| `Photo` / `Add journal photo` | Open camera for journal | "Add journal photo to today" |
| `Star: '[text]'` | Create reminder item | "Star: 'I respond with calm strength'" |
| `Money: [amount] [category] [note]` | Finance entry | "Money: $42 groceries" |
| `Add module: [name]` | Open Module Builder | "Add module: Swim training" |
| `Reminder swap` | Swap today's charisma reminder | "Reminder swap" |
| `Pin reminder [days]` | Pin charisma reminder | "Pin reminder 7 days" |
| `Busy day` | Activate Busy Day mode | "Busy day" |
| `Top 3: [text]` | Create task + promote to Top 3 | "Top 3: Finalize budget" |

**Ambiguity handling:** If input doesn't match a pattern, show single clarifying question:
```
"What would you like to do with this?"
[Add as Task]  [Add to Journal]  [Log Workout]
```

---

## Appendix B: Default Charisma Reminder Themes

| # | Theme | Reminder Text |
|---|-------|--------------|
| 1–6 | Presence | Physical presence, posture, movement |
| 7–12 | Voice | Pace, pitch, silence, authority |
| 13–16 | Warmth | Connection, safety, rapport |
| 17–20 | Listening | Active listening, reflection |
| 21–26 | Authority | Directness, boundaries, standards |
| 27–29 | Regulation | Emotional control, composure |
| 30 | Ritual | Daily shutdown + reset |

---

## Appendix C: Supabase RLS Policy Guidelines

Every table with `user_id` must have Row Level Security:

```sql
-- Example: tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

Apply equivalent policies to ALL user-scoped tables. This ensures multi-account isolation without application-level filtering.

---

*End of Specification — Life OS v1.0*
