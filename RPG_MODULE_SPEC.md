# Life OS — RPG Gamification Module Spec

## A) Product Pitch

Life Quest transforms your daily productivity into a deeply satisfying RPG adventure. Every workout set, journal entry, task completed, and prayer logged earns XP toward 9 life-mapped stats, unlocks perks across 5 skill trees, and spawns optional turn-based encounters against enemies that represent real-life challenges. Progression is driven entirely by actions you're already taking — never punitive, always offline-first, and designed as secondary delight that rewards consistency over perfection. No dark patterns. No monetization. Just your real life, gamified.

## B) UI/UX Wireframes

### 1. Character Screen
```
┌─────────────────────────────┐
│  ← RPG              ⚙️     │  Header
├─────────────────────────────┤
│    [Avatar Silhouette]      │  Circular frame, aura color based on
│     Level 14 Warrior        │  dominant stat. Title below.
│     ████████░░ 72% to 15    │  XP progress bar
├─────────────────────────────┤
│  STATS                      │
│  STR  ████████░░  18        │  9 stat bars, colored by category
│  END  ██████░░░░  14        │
│  DIS  █████████░  24        │
│  WIS  ███████░░░  17        │
│  CHA  █████░░░░░  12        │
│  FOC  ███████░░░  17        │
│  CRA  ██████░░░░  15        │
│  STW  ████░░░░░░  10        │
│  FAI  ████████░░  16        │
├─────────────────────────────┤
│  EQUIPPED TRUTHS            │
│  1. "I respond with calm    │  Up to 3 slots
│      strength" (+Resistance)│
│  2. [Empty Slot]            │
│  3. [Empty Slot]            │
├─────────────────────────────┤
│  GEAR & TITLE               │
│  🛡️ Cloak of Consistency    │
│  👑 Title: "Steady Shepherd"│
└─────────────────────────────┘
```

### 2. Quests Screen
```
┌─────────────────────────────┐
│  ← Quests     Daily|Weekly  │  Chip toggle
├─────────────────────────────┤
│  TODAY'S QUESTS (5/7)       │
│  ✅ Morning Discipline      │  Workout → 100 STR + 50 DIS
│  ✅ Body Maintenance         │  Mobility → 75 END
│  ✅ The Top 3 Challenge      │  All Top 3 → 150 DIS + 100 FOC
│  ⬜ Daily Reflection         │  Journal → 100 WIS
│  ⬜ Morning Offering         │  Prayer → 100 FAI
│  ✅ Supplement Protocol      │  Supps → 50 DIS
│  ✅ Money Minute             │  Finance → 75 STW
├─────────────────────────────┤
│  ACTIVE QUESTLINES          │
│  ⚔️ The Iron Disciple (3/6) │  Week 3 of 6
│     "PR Attempts" — Set a   │
│      new personal record    │
│     ████████░░░░ 58%        │
└─────────────────────────────┘
```

### 3. Adventure Screen
```
┌─────────────────────────────┐
│  ← Adventure                │
├─────────────────────────────┤
│  AVAILABLE ENCOUNTERS (2/3) │
│  ┌───────────────────────┐  │
│  │ 👹 Chaos Gremlin      │  │  Tap to fight
│  │ Easy • DIS/FOC        │  │
│  │ "Spawned after Top 3" │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 🐉 Fatigue Beast      │  │
│  │ Medium • STR/END      │  │
│  │ "Spawned after workout"│  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│  BATTLE VIEW (when active): │
│  ┌───────────────────────┐  │
│  │   [Enemy Sprite]      │  │
│  │   Chaos Gremlin       │  │
│  │   HP ████████░░ 65    │  │
│  ├───────────────────────┤  │
│  │   [Your Avatar]       │  │
│  │   HP █████████░ 145   │  │
│  │   EN ██████░░░░ 35    │  │
│  ├───────────────────────┤  │
│  │ [Attack] [Defend]     │  │  4 action buttons
│  │ [Skill ] [Truth ]     │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### 4. Goals Screen
```
┌─────────────────────────────┐
│  ← Goals                    │
├─────────────────────────────┤
│  ACTIVE GOALS               │
│  ┌───────────────────────┐  │
│  │ 💪 Hit 225lb Bench    │  │  Real goal
│  │ Progress: 205/225 lbs │  │
│  │ ████████░░ 91%        │  │
│  │ Milestone: +5 STR     │  │  RPG reward on completion
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 💰 Pay Off Credit Card│  │
│  │ Progress: $3,200/$4,000│ │
│  │ ████████░░ 80%        │  │
│  │ Milestone: "Debt Slayer"│ │  Title unlock
│  └───────────────────────┘  │
│  [+ Add Goal]               │
└─────────────────────────────┘
```

### 5. Logbook Screen
```
┌─────────────────────────────┐
│  ← Logbook                  │
├─────────────────────────────┤
│  RECENT                     │
│  Feb 6 • Level 14 → 15 ⬆️   │
│    +1 Perk Point            │
│    STR 18→19                │
│  Feb 6 • Chaos Gremlin ⚔️   │
│    Victory • +50 XP         │
│    Loot: Focus Shard        │
│  Feb 5 • Quest Complete 📜  │
│    "Iron Week" • 500 STR XP │
│  Feb 4 • Achievement 🏆     │
│    "50 Workouts" badge      │
├─────────────────────────────┤
│  STATS OVER TIME            │
│  [Mini sparkline charts     │
│   showing stat growth over  │
│   past 30 days]             │
└─────────────────────────────┘
```

## C) Full Stat System

### Core Stats

| Stat | Abbr | Driven By | Description |
|------|------|-----------|-------------|
| Strength | STR | Workouts (sets, weights, volume) | Physical power and training consistency |
| Endurance | END | Mobility, consistency streaks, daily completions | Sustained effort and recovery |
| Discipline | DIS | Task completion, Top 3, streaks, supplements | Follow-through and routine adherence |
| Wisdom | WIS | Journal entries, reflections, starred truths, OCR | Insight, self-awareness, learning |
| Charisma | CHA | Leadership prompts, communication reps, family actions | Influence and relational skill |
| Focus | FOC | Deep work blocks, high-priority tasks, work focus | Concentration and flow state |
| Craft | CRA | Audio reps, practice sessions, system design | Technical mastery and creative skill |
| Stewardship | STW | Finance check-ins, budget reviews, debt payoff | Resource management and financial wisdom |
| Faith | FAI | Prayer/meditation, scripture, devotional consistency | Spiritual grounding and inner peace |

### Secondary Stats (derived)

| Stat | Formula | Role |
|------|---------|------|
| HP (Vitality) | 100 + (STR × 3) + (END × 2) + (FAI × 1) | Damage capacity in battle |
| Energy | 50 + (END × 2) + (DIS × 1) | Resource spent on skills |
| Crit (Momentum) | 5% + (FOC × 0.5%) + (DIS × 0.3%) | Bonus damage chance |
| Resistance | 10 + (WIS × 2) + (FAI × 1) + (END × 1) | Reduces enemy damage |
| Initiative | 5 + (DIS × 1) + (FOC × 0.5) | Turn order in battle |

### Stat Growth
- Stats start at 1, soft cap at 50, hard cap at 99
- Each stat point requires stat-specific XP
- Thresholds: levels 1-20 → `100 + (n-1) × 20` XP per level; levels 21-50 → `500 + (n-20) × 50` XP per level

## D) XP + Leveling Curves

### Character Level
Total XP = sum of all stat XP earned. Formula: `XP_required(level) = floor(100 × level^1.5)`

| Level | Total XP Required | Cumulative XP | Pace |
|-------|------------------|---------------|------|
| 1→2 | 100 | 100 | Day 1 |
| 5→6 | 1,118 | 3,336 | Day 3-4 |
| 10→11 | 3,162 | 15,848 | Week 2 |
| 15→16 | 5,809 | 41,179 | Week 3-4 |
| 20→21 | 8,944 | 82,462 | Week 5-6 |
| 30→31 | 16,432 | 220,727 | Week 10-12 |
| 40→41 | 25,298 | 431,866 | Week 20+ |
| 50→51 | 35,355 | 726,483 | Week 35+ |

### Anti-Grind Rules
- Daily XP cap per category (max 500 STR XP/day, 300 DIS from tasks, etc.)
- Diminishing returns: sets 1-3 = full XP, 4-6 = 75%, 7+ = 50%
- Rest day: planned rest grants 50 WIS + 25 END (self-care bonus)
- No negative XP. Missing a day = 0 XP, never punishment.

### Prestige System (after level 50)
- Resets character level to 1; keeps titles, gear, truths, perk unlocks
- Prestige Star badge (visible on profile)
- +5% passive XP bonus per prestige (max 5 prestiges = +25%)
- Stat levels do NOT reset

## E) Skill Trees / Perks

### Tree 1: Warrior's Path (Strength + Endurance)
| # | Perk | Prereq | Effect |
|---|------|--------|--------|
| 1 | Iron Will | None | +10% STR XP from workouts |
| 2 | Second Wind | Iron Will | Recover 15 Energy once per encounter |
| 3 | Heavy Lifter | Lvl 5, STR 10 | Bonus XP for sets exceeding previous PR |
| 4 | Unbreakable | Heavy Lifter | +20 HP |
| 5 | Marathon Spirit | Iron Will | +15% END XP from mobility |
| 6 | Consistency Engine | Marathon Spirit, 7-day streak | 1 missed day/week won't break workout streak |
| 7 | Steel Body | Unbreakable, STR 20 | +15 Resistance |
| 8 | Power Surge | Heavy Lifter | Skill: "Power Strike" — STR × 2 damage, 15 Energy |
| 9 | Recovery Master | Marathon Spirit, END 15 | Rest days grant 2× END XP |
| 10 | Titan's Resolve | Steel Body + Power Surge, Lvl 20 | Ultimate: "Titan Mode" — +50% damage 3 turns, 30 Energy |
| 11 | Fortified | Steel Body | +10 HP, +5 Resistance |
| 12 | Endurance Runner | Marathon Spirit, END 20 | Mobility sessions count 3/day instead of 2 |
| 13 | PR Hunter | Heavy Lifter, STR 25 | PR sets grant 3× normal STR XP |
| 14 | Battle Hardened | Titan's Resolve | Start encounters with +20 HP shield |
| 15 | Iron Discipline | Consistency Engine, DIS 15 | Workout streaks grant +5% STR XP per week |
| 16 | Crushing Blow | Power Surge, STR 30 | Skill: "Crush" — STR × 3 damage, 25 Energy |
| 17 | Regeneration | Recovery Master, END 25 | Heal 5 HP per turn passively |
| 18 | Dual Strike | Crushing Blow | Skill: "Double Hit" — Attack twice, 20 Energy |
| 19 | Unstoppable | Fortified + Battle Hardened, Lvl 35 | Immune to enemy debuffs for first 3 turns |
| 20 | Warrior's Zenith | Unstoppable + Regeneration, Lvl 40 | Ultimate: "Immortal Stand" — survive fatal blow at 1 HP once per encounter |

### Tree 2: Sage's Path (Wisdom + Faith)
| # | Perk | Prereq | Effect |
|---|------|--------|--------|
| 1 | Deep Thinker | None | +10% WIS XP from journal entries |
| 2 | Truth Seeker | Deep Thinker | Equipped Truths grant +5% buff effect |
| 3 | Inner Light | None | +10% FAI XP from prayer/devotionals |
| 4 | Clarity | Deep Thinker, WIS 10 | +5% Crit chance |
| 5 | Stillness | Inner Light, FAI 10 | +20 Resistance vs Tension Wraith enemies |
| 6 | Archivist | Truth Seeker | OCR journal entries grant 2× WIS XP |
| 7 | Meditation Master | Stillness, FAI 20 | Start battles with +10 Energy |
| 8 | Oracle's Sight | Clarity + Archivist | Skill: "Foresight" — see enemy's next move, 10 Energy |
| 9 | Sermon of Calm | Stillness | Skill: "Calm Word" — enemy attack -30% for 2 turns, 12 Energy |
| 10 | Sage's Transcendence | Oracle's Sight + Meditation Master, Lvl 25 | Ultimate: "Enlightenment" — full heal + clear all debuffs, 35 Energy |
| 11 | Reflective Shield | Stillness, WIS 15 | Reflect 15% of damage back to enemy |
| 12 | Inspired Writing | Deep Thinker, WIS 20 | Journal entries 200+ words grant 2× WIS XP |
| 13 | Prayer Warrior | Inner Light, FAI 25 | Prayer streaks grant +10% FAI XP per consecutive day |
| 14 | Truth Arsenal | Truth Seeker, 10 truths collected | Equip 4 truths instead of 3 |
| 15 | Mind Fortress | Reflective Shield, WIS 25 | +25 Resistance |
| 16 | Divine Insight | Meditation Master, FAI 30 | Skill: "Revelation" — deals WIS × 2.5 damage, 20 Energy |
| 17 | Grateful Heart | Prayer Warrior | Gratitude journal sections grant bonus FAI XP |
| 18 | Wisdom Aura | Mind Fortress + Clarity | All incoming damage reduced by 10% passively |
| 19 | Sage's Library | Truth Arsenal + Inspired Writing, Lvl 35 | Truths grant double buff effects |
| 20 | Transcendent Peace | Sage's Library + Wisdom Aura, Lvl 40 | Ultimate: "Perfect Clarity" — auto-dodge next 3 enemy attacks, 40 Energy |

### Tree 3: Leader's Path (Charisma + Discipline + Focus)
| # | Perk | Prereq | Effect |
|---|------|--------|--------|
| 1 | Clear Voice | None | +10% CHA XP from leadership prompts |
| 2 | Task Master | None | +10% DIS XP from completed tasks |
| 3 | Department Head | Clear Voice, 5 Work Focus items | Work Focus completions grant 1.5× XP |
| 4 | Laser Focus | Task Master, FOC 10 | High-priority task XP +25% |
| 5 | Rallying Cry | Clear Voice, CHA 10 | Skill: "Rally" — own attack +20% for 2 turns, 10 Energy |
| 6 | Streak Commander | Task Master, 14-day streak | +1 streak protection per month |
| 7 | Flow State | Laser Focus, FOC 20 | Deep work blocks grant 2× FOC XP |
| 8 | Executive Presence | Department Head + Rallying Cry | Skill: "Command" — stun enemy 1 turn, 15 Energy |
| 9 | Triple Threat | Top 3 completed 30 days | Top 3 completions grant +10 XP to all stats |
| 10 | Commander's Authority | Executive Presence + Flow State, Lvl 25 | Ultimate: "Leadership Aura" — all stats +10% for encounter, 30 Energy |
| 11 | Delegation | Department Head, CHA 15 | Work Focus weekly quests grant 1.5× rewards |
| 12 | Productivity Surge | Task Master, DIS 20 | First 5 tasks/day grant +50% DIS XP |
| 13 | Presence | Clear Voice, CHA 20 | +15% CHA XP from all sources |
| 14 | Hyperfocus | Flow State, FOC 25 | Skill: "Zone In" — next attack deals FOC × 2 damage, 18 Energy |
| 15 | Mentor's Gift | Delegation + Presence | Completing questline steps grants 2× perk point progress |
| 16 | Strategic Mind | Laser Focus + Triple Threat | All daily quest rewards +20% |
| 17 | Commanding Strike | Executive Presence, CHA 25 | Skill: "Authority" — CHA × 2 damage + reduce enemy attack 20%, 22 Energy |
| 18 | Unshakable Routine | Streak Commander, DIS 30 | Streaks grant cumulative +2% all XP per week |
| 19 | Visionary | Strategic Mind + Hyperfocus, Lvl 35 | See all enemy patterns from turn 1 |
| 20 | Leader's Zenith | Visionary + Commanding Strike, Lvl 40 | Ultimate: "Inspire" — deal CHA+DIS+FOC combined damage, 45 Energy |

### Tree 4: Tuner's Path (Craft + Focus)
| # | Perk | Prereq | Effect |
|---|------|--------|--------|
| 1 | Practiced Ear | None | +10% CRA XP from audio reps |
| 2 | Micro Mastery | Practiced Ear | Daily micro-practice grants +25 bonus CRA XP |
| 3 | Deep Dive | Practiced Ear | Weekly deep practice grants 2× CRA XP |
| 4 | Signal Clarity | Micro Mastery, CRA 10 | +20 Resistance vs Signal Goblin enemies |
| 5 | Sonic Strike | Deep Dive, CRA 15 | Skill: "Resonance" — CRA × 2 damage, 15 Energy |
| 6 | Flow of Sound | Signal Clarity + Sonic Strike | Audio + work focus combined grants FOC bonus |
| 7 | Perfect Pitch | Flow of Sound, CRA 25 | Audio streaks grant +10% CRA XP/week |
| 8 | Creative Burst | Sonic Strike, CRA 20 | Skill: "Inspiration" — next 2 attacks +40% damage, 20 Energy |
| 9 | Master's Technique | Perfect Pitch + Creative Burst, CRA 35 | All CRA XP sources +25% |
| 10 | Tuner's Zenith | Master's Technique, Lvl 30 | Ultimate: "Perfect Frequency" — ignores enemy defense for 3 turns, 40 Energy |

### Tree 5: Steward's Path (Stewardship + Discipline)
| # | Perk | Prereq | Effect |
|---|------|--------|--------|
| 1 | Penny Wise | None | +10% STW XP from Money Minute |
| 2 | Budget Hawk | Penny Wise | Weekly finance review grants 2× STW XP |
| 3 | Debt Destroyer | Penny Wise | Debt payoff tasks grant bonus STW + DIS XP |
| 4 | Fiscal Shield | Budget Hawk, STW 10 | +20 Resistance vs Budget Bandit enemies |
| 5 | Calculated Strike | Debt Destroyer, STW 15 | Skill: "Audit" — STW × 2 damage, 15 Energy |
| 6 | Compound Interest | Fiscal Shield + Calculated Strike | STW streaks grant cumulative +5% STW XP/week |
| 7 | Financial Freedom | Compound Interest, STW 25 | Unlock bonus "Steward" questlines |
| 8 | Resource Surge | Calculated Strike, STW 20 | Skill: "Invest" — recover 20 Energy + 10 HP, 0 Energy (once/battle) |
| 9 | Master Steward | Financial Freedom + Resource Surge, STW 35 | All STW sources +25% |
| 10 | Steward's Zenith | Master Steward, Lvl 30 | Ultimate: "Abundance" — heal to full HP + double next attack, 40 Energy |

Perk Points: 1 per character level + 1 per questline completion.

## F) Reward System

### XP
Earned from every tracked activity. Split into stat-specific XP (grows that stat) and counts toward total character XP.

### Perk Points
1 per character level-up. 1 bonus per completed questline. Spent in skill trees.

### Cosmetic Rewards
- **Titles**: "Steady Shepherd," "Systems Tuner," "Calm Leader," "Iron Disciple," "The Archivist," "Budget Sage," "Flow Master," "Worship Warrior"
- **Gear** (visual + small bonus): "Cloak of Consistency" (+5% streak protection), "Gauntlets of Iron Will" (+STR visual), "Crown of Clarity" (+WIS visual), "Steward's Ring" (+STW visual)
- **Auras**: Color effect on avatar based on dominant stat (Red=STR, Blue=WIS, Gold=FAI, Green=CRA, etc.)
- **Badges**: Achievement markers (100 workouts, 50 journal entries, 30-day streak, First Prestige, etc.)

### Battle Loot (deterministic, no gacha)
- XP orbs (bonus XP to stat of choice)
- Cosmetic items (gear, titles)
- Quest tokens (unlock bonus questlines)
- Essence fragments (collect 10 → forge symbolic gear)

No monetization. No randomized loot boxes. All rewards earned through real actions.

## G) Battle System

### Overview
Turn-based, 1v1. Player vs themed enemy. 1-3 minutes per encounter. Entirely optional.

### Actions per turn
1. **Attack** — Damage = (primary stat × 1.5) - enemy defense. 0 Energy cost.
2. **Defend** — Reduce incoming damage 50% this turn. Recover 5 Energy.
3. **Skill** — Use unlocked perk skill. Costs Energy. Various effects.
4. **Truth** — Use equipped Truth as spell card. 1 use per battle. Effect based on truth's theme.

### Enemies

| Enemy | Theme | Stats Used | Spawns After | Difficulty |
|-------|-------|-----------|-------------|-----------|
| Chaos Gremlin | Distractions | DIS, FOC | Completing Top 3 | Easy |
| Tension Wraith | Conflict avoidance | CHA, WIS | Leadership prompt | Medium |
| Fatigue Beast | Exhaustion | STR, END | Workout completion | Medium |
| Budget Bandit | Financial neglect | STW, DIS | Weekly finance review | Medium |
| Signal Goblin | Audio interference | CRA, FOC | Audio practice | Medium |
| Doubt Shade | Self-doubt | FAI, WIS | Starring a journal truth | Hard |
| Procrastination Hydra | Avoidance | All stats | 5+ daily quests in a week | Hard (weekly boss) |
| The Entropy Lord | Chaos | All stats | Monthly quest completion | Boss |

### Enemy Patterns
Each enemy has repeating 2-3 move patterns. Players learn to anticipate.
- Chaos Gremlin: Attack → Distract (FOC -20%) → Attack → repeat
- Fatigue Beast: Heavy Slam → Rest → Heavy Slam + Drain (END -10%) → repeat
- Doubt Shade: Whisper (FAI -15%) → Shadow Strike → Whisper → Shadow Strike → Despair (WIS -20%) → repeat

### Damage Formulas
- Player attack: `(primaryStat × 1.5) + (level × 0.5) - enemyDefense`
- Enemy attack: `enemyPower - playerResistance`
- Crit: roll < critChance → damage × 1.5

### Battle Rewards
- XP: 50 (Easy), 100 (Medium), 200 (Hard), 500 (Boss)
- Deterministic loot per enemy type
- Quest progress if applicable

### Encounter Rules
- Max 3 pending encounters at once
- Expire after 48 hours (no penalty)
- Completely optional — skipping has zero consequence

## H) Quest Generation System

### Daily Quests
Auto-generated each day at midnight (local time) based on the user's active habits and modules. Each quest maps directly to a Life OS action.

| Quest | Trigger | XP Reward | Stat(s) |
|-------|---------|-----------|---------|
| Morning Discipline | Log a workout | 100 STR + 50 DIS | STR, DIS |
| Body Maintenance | Complete mobility session | 75 END | END |
| The Top 3 Challenge | Complete all 3 Top 3 tasks | 150 DIS + 100 FOC | DIS, FOC |
| Daily Reflection | Write a journal entry | 100 WIS | WIS |
| Morning Offering | Log prayer or devotional | 100 FAI | FAI |
| Supplement Protocol | Check off all supplements | 50 DIS | DIS |
| Money Minute | Complete finance check-in | 75 STW | STW |
| Creative Practice | Log an audio rep or practice session | 75 CRA | CRA |
| Connection Point | Complete a leadership prompt or family action | 75 CHA | CHA |
| Deep Work Block | Log 1+ hour focused work | 100 FOC | FOC |

**Rules:**
- Only quests for **enabled modules** appear (e.g., if user has no finance module, no Money Minute quest)
- 5-8 daily quests generated depending on active modules
- Bonus quest: "Perfect Day" — complete all daily quests → bonus 200 XP distributed evenly across all stats
- Daily quests expire at midnight; incomplete quests vanish (no penalty)

### Weekly Quests
Generated each Monday. Require sustained effort across the week.

| Quest | Requirement | XP Reward |
|-------|-------------|-----------|
| Iron Week | 5+ workouts | 500 STR |
| The Disciplined | Complete Top 3 five days | 400 DIS + 200 FOC |
| Sage's Journal | 5+ journal entries | 400 WIS |
| Faithful Week | 6+ prayer/devotional logs | 400 FAI |
| Budget Review | Complete weekly finance review | 300 STW |
| Practice Makes | 4+ creative practice sessions | 300 CRA |
| Social Leader | 3+ leadership or family actions | 300 CHA |
| Endurance Protocol | 4+ mobility sessions | 300 END |

**Weekly Bonus:** Complete 5+ weekly quests → "Weekly Champion" badge progress + 500 bonus XP

### Questlines (Multi-week arcs)
Narrative-driven quest chains spanning 2-8 weeks. Unlocked by reaching stat or level thresholds.

| Questline | Unlock | Steps | Final Reward |
|-----------|--------|-------|-------------|
| The Iron Disciple | STR 10 | 6 steps (escalating workout targets) | Title: "Iron Disciple" + 1 Perk Point |
| Path of the Sage | WIS 10 | 5 steps (journal depth challenges) | Title: "The Archivist" + 1 Perk Point |
| Shepherd's Journey | CHA 10 | 5 steps (leadership + relational actions) | Title: "Steady Shepherd" + 1 Perk Point |
| Tuner's Apprenticeship | CRA 10 | 4 steps (progressive practice targets) | Title: "Systems Tuner" + 1 Perk Point |
| Financial Fortress | STW 10 | 4 steps (finance consistency) | Title: "Budget Sage" + 1 Perk Point |
| The Focused Mind | FOC 15, DIS 15 | 6 steps (deep work + task mastery) | Title: "Flow Master" + 1 Perk Point |
| Trial of Faith | FAI 15 | 5 steps (prayer + devotional streaks) | Title: "Worship Warrior" + 1 Perk Point |
| The Entropy War | Level 25 | 8 steps (cross-stat challenges) | Title: "Order Keeper" + Legendary Gear + 2 Perk Points |

**Questline Rules:**
- Only 2 active questlines at a time (prevents overwhelm)
- Steps auto-advance when conditions are met
- Failing a step resets that step only (not the whole questline)
- Each step has a 1-week time window; missed steps can be re-attempted the following week
- Completion notification with fanfare animation + loot reveal screen

## I) Activity-to-Stat Mapping Table

### Complete Mapping: Life OS Action → RPG Reward

| Life OS Module | Action | Primary Stat | Secondary Stat | Base XP | Notes |
|----------------|--------|-------------|----------------|---------|-------|
| **Workout** | Log a set | STR | — | 15 per set | Scales with weight: +0.1 XP per lb over bodyweight |
| Workout | Complete full workout | STR | END | 50 + set bonus | Triggers encounter spawn |
| Workout | PR (personal record) | STR | DIS | 100 | Requires previous data for comparison |
| Workout | Log bodyweight | END | — | 10 | Consistency tracking |
| **Mobility** | Complete mobility session | END | STR | 75 | Max 2 sessions/day for full XP |
| **Tasks** | Complete any task | DIS | — | 20 per task | Capped at 15 tasks/day for full XP |
| Tasks | Complete a Top 3 item | DIS | FOC | 50 per item | Higher priority = more XP |
| Tasks | Complete all Top 3 | DIS | FOC | 150 bonus | Daily quest completion |
| Tasks | Complete high-priority task | FOC | DIS | 40 | Flagged tasks get FOC bonus |
| **Journal** | Write entry (any length) | WIS | — | 50 | Minimum threshold |
| Journal | Entry 200+ words | WIS | — | 100 | Thoughtful entries rewarded |
| Journal | Entry 500+ words | WIS | FAI | 150 | Deep reflection bonus |
| Journal | Star a truth/insight | WIS | — | 25 | Collected truths for equipping |
| Journal | OCR import (photo of writing) | WIS | CRA | 75 | Bridging analog + digital |
| **Prayer/Devotional** | Log prayer session | FAI | — | 75 | |
| Prayer/Devotional | Log scripture reading | FAI | WIS | 50 | |
| Prayer/Devotional | Devotional streak (3+ days) | FAI | DIS | +25 bonus/day | Streak multiplier |
| **Supplements** | Check off daily supplements | DIS | END | 30 | All-or-nothing per day |
| **Finance** | Money Minute check-in | STW | DIS | 50 | |
| Finance | Weekly finance review | STW | — | 150 | |
| Finance | Debt payoff milestone | STW | DIS | 200 | Per milestone logged |
| **Work Focus** | Complete work focus item | FOC | DIS | 40 | |
| Work Focus | Complete all daily work items | FOC | CHA | 100 bonus | |
| Work Focus | Deep work block (1+ hour) | FOC | — | 100 | Self-reported or timer |
| **Audio/Practice** | Log audio rep | CRA | FOC | 50 | |
| Audio/Practice | Practice session (30+ min) | CRA | — | 100 | |
| Audio/Practice | Weekly practice streak (4+) | CRA | DIS | +50 bonus | |
| **Leadership** | Complete leadership prompt | CHA | WIS | 75 | |
| Leadership | Family action logged | CHA | FAI | 50 | |
| Leadership | Communication rep | CHA | — | 40 | |
| **Goals** | Goal milestone hit | Varies | Varies | 200 | Stat based on goal category |
| Goals | Goal completed | Varies | Varies | 500 + Title | Major achievement |
| **Streaks** | 7-day module streak | DIS | — | 100 bonus | Any module |
| Streaks | 30-day module streak | DIS | END | 500 bonus | Achievement unlock |
| Streaks | 100-day module streak | DIS | ALL | 2000 bonus | Legendary achievement |

### Idempotency Rules
- Each action generates a `client_event_id` (UUID) to prevent double-counting
- XP is granted once per unique event
- If a workout is edited (sets added/removed), XP is recalculated as a delta
- Syncing from offline doesn't duplicate XP — events deduplicated server-side by `client_event_id`

## J) Level-Up Moment UX

### Character Level-Up
When total XP crosses a level threshold:

1. **Freeze screen** with subtle dark overlay
2. **Fanfare animation**: golden particles rise from bottom of screen
3. **Level badge** pulses into center: "LEVEL 15" with old → new transition
4. **Stat summary** slides up: shows which stats contributed most
5. **Perk Point notification**: "You earned 1 Perk Point! [View Skill Tree]"
6. **Sound**: Short, satisfying chime (if device audio enabled, respects system mute)
7. **Duration**: 3 seconds auto-dismiss, or tap to dismiss early
8. **Logbook entry** created automatically

### Stat Level-Up
When a specific stat crosses its threshold:

1. **Toast notification** at top of screen: "STR leveled up! 17 → 18"
2. **Stat bar flash**: The relevant stat bar on the character screen pulses the stat's color
3. **Duration**: 2 seconds, non-blocking (doesn't interrupt current activity)
4. **Logbook entry** created automatically

### Quest Completion
1. **Completion banner** slides down: "Quest Complete: Morning Discipline"
2. **XP awarded** shown with floating numbers: "+100 STR +50 DIS"
3. **Encounter spawn** (if applicable): "A Chaos Gremlin appeared!" with creature silhouette
4. **Duration**: 2 seconds auto-dismiss

### Questline Step / Completion
1. **Full-screen celebration** for questline completion
2. **Narrative text**: "After weeks of discipline, you have forged yourself anew..."
3. **Reward reveal**: Title + Perk Point shown with chest-opening animation
4. **Share option**: Screenshot-friendly card (optional, no social API needed — just device screenshot)

### Battle Victory
1. **Enemy defeat animation**: Enemy fades with particle dissolve
2. **Victory screen**: "Victory!" with XP earned and loot drops shown
3. **Loot cards** flip over one at a time
4. **Return to adventure screen** with cleared encounter slot

### Prestige
1. **Full-screen cinematic**: Stars spiral, level counter resets from current to 1
2. **Prestige star** awarded with explanation text
3. **Retained items** summary: "Your titles, gear, perks, and truths carry forward"
4. **New journey text**: "The path begins again, but you are not the same."

## K) Safety, Health, and Anti-Dark-Pattern Guardrails

### Core Principles
1. **Never punitive**: Missing a day = 0 XP gained. No XP loss. No streak destruction guilt.
2. **No negative reinforcement**: No "You missed your workout!" notifications. No shame screens.
3. **Rest is rewarded**: Planned rest days grant 50 WIS + 25 END ("Rest Day Wisdom")
4. **Caps prevent obsession**: Daily XP caps per category prevent grinding loops
5. **No monetization**: Zero in-app purchases. No premium tiers. No ads. No loot boxes.

### Streak Protection
- Streaks are tools for encouragement, not punishment
- 1 free "grace day" per week where missing doesn't break a streak (built-in, no perk needed)
- Perks can extend grace to 2 days
- If a streak breaks: encouraging message ("Streaks come and go. Your growth doesn't reset.")
- No leaderboards or competitive streak comparisons between users

### Notification Philosophy
- **Default: Minimal notifications**
- Optional daily reminder: "Your quests are ready" (morning, user-set time)
- Never: "You're falling behind!" or "Your streak is about to break!"
- Level-up and quest completion notifications are in-app only (no push)
- User can disable ALL RPG notifications in settings

### Physical Health Safeguards
- Workout XP has diminishing returns past reasonable thresholds (prevents overtraining incentive)
- No XP bonus for working out while injured or sick
- "Recovery Mode" toggle: user can declare recovery week (reduced quests, rest XP bonus)
- No body weight XP that rewards loss or gain — only logging consistency

### Mental Health Considerations
- Journal depth XP is capped (no incentive to ruminate for XP)
- Battle system is entirely optional — zero game progression locked behind battles
- Enemy themes are abstract (Chaos Gremlin, not "Your Depression")
- No social comparison features
- "Pause RPG" button: temporarily hides all gamification while preserving data

### Data Integrity
- All RPG data stored locally first (Dexie.js) then synced (Supabase)
- Offline-first: full RPG functionality without internet
- No server-authoritative game state — client is source of truth
- XP recalculation tool available if data gets out of sync

## L) Technical Data Model

### Dexie.js (IndexedDB) Tables

```typescript
// Character state
interface CharacterState {
  id: string              // Always 'current' (single character per user)
  userId: string
  level: number
  totalXp: number
  prestigeCount: number
  prestigeXpBonus: number // 0.05 per prestige
  title: string
  gear: string[]          // Array of gear IDs
  auraColor: string       // Derived from dominant stat
  equippedTruths: string[] // Max 3 (or 4 with perk)
  createdAt: string
  updatedAt: string
  clientEventId: string
}

// Stat levels
interface StatLevel {
  id: string              // `${userId}_${statAbbr}`
  userId: string
  stat: 'STR' | 'END' | 'DIS' | 'WIS' | 'CHA' | 'FOC' | 'CRA' | 'STW' | 'FAI'
  level: number
  currentXp: number       // XP toward next stat level
  totalXp: number         // All-time XP for this stat
  updatedAt: string
  clientEventId: string
}

// XP events (immutable log)
interface XpEvent {
  id: string              // UUID
  userId: string
  clientEventId: string   // For idempotency
  sourceModule: string    // 'workout' | 'journal' | 'tasks' | etc.
  sourceAction: string    // 'complete_set' | 'write_entry' | etc.
  sourceItemId: string    // ID of the triggering item
  primaryStat: string
  primaryXp: number
  secondaryStat?: string
  secondaryXp?: number
  bonusXp?: number        // From perks, streaks, etc.
  bonusSource?: string    // 'perk:iron_will' | 'streak:7day' | etc.
  timestamp: string
  syncedAt?: string
}

// Perk unlocks
interface PerkUnlock {
  id: string              // `${userId}_${treeId}_${perkNumber}`
  userId: string
  treeId: string          // 'warrior' | 'sage' | 'leader' | 'tuner' | 'steward'
  perkNumber: number
  unlockedAt: string
  clientEventId: string
}

// Available perk points
interface PerkPoints {
  id: string              // `${userId}_perkpoints`
  userId: string
  available: number       // Unspent points
  totalEarned: number     // Lifetime points earned
  updatedAt: string
  clientEventId: string
}

// Quests
interface Quest {
  id: string              // UUID
  userId: string
  type: 'daily' | 'weekly'
  name: string
  description: string
  targetModule: string
  targetAction: string
  targetCount: number
  currentCount: number
  xpReward: Record<string, number> // { STR: 100, DIS: 50 }
  status: 'active' | 'completed' | 'expired'
  createdAt: string
  completedAt?: string
  expiresAt: string
  clientEventId: string
}

// Questlines
interface Questline {
  id: string              // questline template ID + userId
  userId: string
  templateId: string      // 'iron_disciple' | 'path_of_sage' | etc.
  name: string
  currentStep: number
  totalSteps: number
  status: 'active' | 'completed' | 'abandoned'
  stepDeadline: string    // Current step must complete by this date
  rewards: {
    title?: string
    gear?: string
    perkPoints: number
  }
  startedAt: string
  completedAt?: string
  clientEventId: string
}

// Battle encounters
interface Encounter {
  id: string              // UUID
  userId: string
  enemyId: string         // 'chaos_gremlin' | 'fatigue_beast' | etc.
  enemyName: string
  difficulty: 'easy' | 'medium' | 'hard' | 'boss'
  enemyHp: number
  enemyMaxHp: number
  enemyPower: number
  enemyDefense: number
  enemyPattern: string[]  // Array of move IDs
  enemyPatternIndex: number
  playerHp: number
  playerMaxHp: number
  playerEnergy: number
  playerMaxEnergy: number
  status: 'pending' | 'active' | 'victory' | 'defeat' | 'expired'
  turnsElapsed: number
  loot: LootDrop[]
  spawnedBy: string       // Source action that triggered spawn
  createdAt: string
  expiresAt: string       // 48 hours from creation
  completedAt?: string
  clientEventId: string
}

interface LootDrop {
  type: 'xp_orb' | 'gear' | 'title' | 'quest_token' | 'essence_fragment'
  itemId: string
  amount?: number
  stat?: string
}

// Battle log (per encounter)
interface BattleTurn {
  id: string
  encounterId: string
  turnNumber: number
  playerAction: 'attack' | 'defend' | 'skill' | 'truth'
  playerSkillUsed?: string
  playerDamageDealt: number
  enemyAction: string
  enemyDamageDealt: number
  playerHpAfter: number
  enemyHpAfter: number
  playerEnergyAfter: number
  isCrit: boolean
  timestamp: string
}

// Collected truths (from journal)
interface Truth {
  id: string
  userId: string
  text: string            // The starred journal insight
  sourceEntryId: string   // Journal entry ID
  theme: 'strength' | 'wisdom' | 'faith' | 'discipline' | 'courage' | 'peace'
  battleEffect: string    // What it does when used in battle
  battlePower: number     // Scales with WIS
  isEquipped: boolean
  collectedAt: string
  clientEventId: string
}

// Achievements / Badges
interface Achievement {
  id: string              // achievement template ID
  userId: string
  name: string
  description: string
  icon: string
  unlockedAt: string
  clientEventId: string
}

// Cosmetic inventory
interface CosmeticItem {
  id: string
  userId: string
  type: 'gear' | 'title' | 'aura' | 'badge'
  itemId: string
  name: string
  description: string
  effect?: string         // Minor cosmetic bonus description
  isEquipped: boolean
  acquiredAt: string
  clientEventId: string
}
```

### Supabase Tables (mirror for sync)

All tables above have corresponding Supabase tables with:
- Same schema + `synced_at` timestamp
- RLS policies: `auth.uid() = user_id`
- `client_event_id` unique constraint for idempotent upserts
- Same sync engine pattern as existing Life OS tables (Dexie → Supabase push/pull)

### Computed Values (not stored, derived at render time)

```typescript
// Secondary stats — computed from stat levels
function computeSecondaryStats(stats: Record<string, number>) {
  return {
    hp: 100 + (stats.STR * 3) + (stats.END * 2) + (stats.FAI * 1),
    energy: 50 + (stats.END * 2) + (stats.DIS * 1),
    crit: 5 + (stats.FOC * 0.5) + (stats.DIS * 0.3),
    resistance: 10 + (stats.WIS * 2) + (stats.FAI * 1) + (stats.END * 1),
    initiative: 5 + (stats.DIS * 1) + (stats.FOC * 0.5),
  }
}

// Level from total XP
function levelFromXp(totalXp: number): number {
  // XP_required(level) = floor(100 * level^1.5)
  // Inverse: level = floor((totalXp / 100)^(2/3))
  let level = 1
  let cumulative = 0
  while (true) {
    const needed = Math.floor(100 * Math.pow(level, 1.5))
    if (cumulative + needed > totalXp) break
    cumulative += needed
    level++
  }
  return level
}

// Stat level from stat XP
function statLevelFromXp(statXp: number): number {
  let level = 1
  let cumulative = 0
  while (level < 99) {
    const needed = level <= 20
      ? 100 + (level - 1) * 20
      : 500 + (level - 20) * 50
    if (cumulative + needed > statXp) break
    cumulative += needed
    level++
  }
  return level
}

// Dominant stat for aura color
function dominantStat(stats: Record<string, number>): string {
  return Object.entries(stats).reduce((a, b) => a[1] > b[1] ? a : b)[0]
}
```

### Migration Strategy
- New Dexie tables added alongside existing ones (non-breaking)
- RPG tables use same `version()` upgrade pattern as existing schema
- Supabase migration adds RPG tables with RLS, same as existing pattern
- Feature flag: `rpg_enabled` in user settings — all RPG UI hidden until enabled
- Zero impact on existing Life OS functionality when RPG is disabled

## M) Alternative Flavor / Theming Options

### RGB Clarification
"RGB" in the original prompt referred to Rich, Gamified, Bold design — not literal RGB colors. The RPG module uses a cohesive color palette:

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| STR (Strength) | Crimson Red | #DC2626 | Stat bar, warrior aura |
| END (Endurance) | Amber | #D97706 | Stat bar, endurance effects |
| DIS (Discipline) | Steel Blue | #2563EB | Stat bar, discipline effects |
| WIS (Wisdom) | Deep Purple | #7C3AED | Stat bar, sage aura |
| CHA (Charisma) | Warm Gold | #CA8A04 | Stat bar, leader aura |
| FOC (Focus) | Cyan | #0891B2 | Stat bar, focus effects |
| CRA (Craft) | Emerald | #059669 | Stat bar, tuner aura |
| STW (Stewardship) | Silver | #6B7280 | Stat bar, steward effects |
| FAI (Faith) | Radiant Gold | #EAB308 | Stat bar, faith aura |
| XP Bar | Electric Blue | #3B82F6 | Character level progress |
| HP | Soft Red | #EF4444 | Battle HP bars |
| Energy | Teal | #14B8A6 | Battle energy bar |
| Victory | Gold | #F59E0B | Victory screen, loot |
| Background | Dark Slate | #0F1219 | Matches Life OS theme |

### Flavor Packs (future cosmetic themes — same mechanics, different aesthetics)

| Pack | Theme | Stat Names | Enemy Flavor |
|------|-------|-----------|-------------|
| **Classic RPG** (default) | Medieval fantasy | STR, END, DIS, WIS... | Gremlins, Wraiths, Beasts |
| **Sci-Fi** | Space explorer | PWR, STA, SYS, DAT... | Glitches, Anomalies, Drones |
| **Samurai** | Feudal Japan | 力, 耐, 律, 智... | Oni, Yokai, Ronin |
| **Noir Detective** | 1940s mystery | Brawn, Grit, Method, Insight... | Suspects, Red Herrings, The Syndicate |

Flavor packs change only text labels, colors, and enemy descriptions. All underlying mechanics, XP curves, and formulas remain identical. Implementation: a simple theme config object swapped at render time.

---

## Sample Day Walkthrough

**John, Level 14 Warrior. Tuesday, February 10.**

**6:30 AM** — John opens Life OS, sees his daily quests:
- Morning Discipline (workout)
- Body Maintenance (mobility)
- The Top 3 Challenge
- Daily Reflection (journal)
- Morning Offering (prayer)
- Supplement Protocol
- Money Minute

**7:00 AM** — Completes prayer and devotional.
- → Quest "Morning Offering" ✅ → +100 FAI XP
- → FAI stat: 16 → still 16 (needs 60 more XP)
- → 3-day prayer streak → +25 bonus FAI XP (Devotional streak perk)

**7:30 AM** — Logs workout: 5 sets bench press (185 lbs), 4 sets rows, 3 sets curls.
- → Sets XP: 12 sets × 15 = 180 STR XP
- → Weight bonus: 185 lbs bench × 0.1 × 5 sets = 92.5 → 92 bonus STR XP
- → Workout completion: +50 STR + 25 END XP
- → Quest "Morning Discipline" ✅ → +100 STR + 50 DIS XP
- → Total: 422 STR + 25 END + 50 DIS XP
- → Iron Will perk (+10% STR): 42 bonus STR XP
- → STR stat: 18 → 18 (toast: "464 / 480 to STR 19!")
- → **Encounter spawned**: Fatigue Beast (Medium) 🐉

**7:45 AM** — Takes supplements.
- → Quest "Supplement Protocol" ✅ → +50 DIS XP

**8:00 AM** — Checks finance dashboard, logs Money Minute.
- → Quest "Money Minute" ✅ → +75 STW XP

**8:15 AM** — Starts work. Completes Top 3 tasks by noon.
- → 3 tasks completed: 3 × 50 = 150 DIS + 150 FOC XP
- → Quest "The Top 3 Challenge" ✅ → +150 DIS + 100 FOC bonus
- → **Encounter spawned**: Chaos Gremlin (Easy) 👹

**12:30 PM** — Decides to fight the Chaos Gremlin during lunch break.
- → Battle: 4 turns. Uses "Attack, Attack, Defend, Attack"
- → Chaos Gremlin defeated! +50 XP (distributed to DIS/FOC)
- → Loot: Focus Shard (cosmetic) + 25 bonus FOC XP
- → Logbook entry created

**5:00 PM** — Completes mobility session.
- → Quest "Body Maintenance" ✅ → +75 END XP
- → END stat: 14 → 14 (32 more to go)

**8:00 PM** — Writes journal entry (320 words). Stars one truth: "Consistency beats intensity."
- → 200+ word bonus: +100 WIS XP
- → Quest "Daily Reflection" ✅ → +100 WIS XP
- → Truth collected: "Consistency beats intensity" → available for equipping
- → **Encounter spawned**: Doubt Shade (Hard) — John ignores it (optional, no penalty)

**8:30 PM** — John checks his character screen:
- → 6/7 daily quests complete (missed Deep Work Block — no penalty)
- → Total XP earned today: ~1,400 across all stats
- → Level 14: 72% → 78% toward Level 15
- → Active questline "The Iron Disciple" step 3/6: needs 1 more PR attempt this week
- → Fatigue Beast encounter still pending (will auto-expire in 48h if ignored)
- → 1 unspent perk point from yesterday's level-up

**John closes the app. His data saves to IndexedDB, syncs to Supabase in the background. Tomorrow, a fresh set of quests awaits.**

---

*End of RPG Gamification Module Spec — Life OS v2.0*
