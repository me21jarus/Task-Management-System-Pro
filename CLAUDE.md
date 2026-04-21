# TMS Pro — Project Constitution

**Read this file in full before executing ANY prompt. This is the source of truth.**

---

## 1. What we're building

A premium, AI-assisted Task Management System with two modes:
- **Personal dashboard** — local-first (IndexedDB), full CRUD, voice + text AI assistant ("Jarvis"), calendar, filters
- **Teams dashboard** — Firebase-backed, role-based (manager/employee), comments, file/link attachments

Target: a portfolio-grade frontend SDE-1 deliverable that showcases architecture, animation craft, and AI integration.

---

## 2. Tech stack (immutable)

| Layer | Choice |
|---|---|
| Bundler | Vite 5 |
| Framework | React 18 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3 + CSS variables for theming |
| Animations | Framer Motion 11 |
| Routing | React Router v6 |
| Auth | Firebase Auth (Google + email/password) |
| Teams DB | Firestore |
| Personal storage | IndexedDB via `idb` library |
| AI | Gemini 2.0 Flash via Firebase Cloud Function proxy |
| Voice | Web Speech API (native `SpeechRecognition` + `SpeechSynthesis`) |
| Icons | lucide-react |
| Forms | react-hook-form + zod |
| Dates | date-fns |
| Deployment | Firebase Hosting |

**Do not swap any of these. Do not add Redux, MobX, styled-components, Material UI, Chakra, or any other competing library.**

---

## 3. Folder structure

```
tms-pro/
├── CLAUDE.md                    # this file
├── README.md
├── .env.local                   # firebase config (gitignored)
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── firebase.json
├── firestore.rules
├── functions/                   # Firebase Cloud Functions
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── jarvis.ts            # Gemini proxy
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css                # Tailwind + CSS vars
    ├── assets/
    │   └── licious-logo.gif     # user will drop in
    ├── components/
    │   ├── ui/                  # primitives (Button, Input, Modal, etc.)
    │   ├── layout/              # Header, Sidebar, RightRail
    │   ├── tasks/               # TaskCard, TaskList, TaskForm, FilterPanel
    │   ├── calendar/            # CalendarWidget
    │   ├── jarvis/              # JarvisPanel, VoiceButton, ChatBubble
    │   ├── teams/               # TeamBoard, MemberList, CommentThread
    │   └── welcome/             # WelcomeScreen, PixelDissolve
    ├── pages/
    │   ├── Welcome.tsx
    │   ├── Onboarding.tsx
    │   ├── Login.tsx
    │   ├── PersonalDashboard.tsx
    │   ├── TeamsDashboard.tsx
    │   └── NotFound.tsx
    ├── hooks/
    │   ├── useTasks.ts          # CRUD + filters for personal tasks
    │   ├── useAuth.ts           # Firebase auth state
    │   ├── useTheme.ts
    │   ├── useJarvis.ts         # AI conversation state
    │   ├── useVoice.ts          # Web Speech API wrapper
    │   └── useTeam.ts           # Firestore team tasks
    ├── lib/
    │   ├── firebase.ts          # Firebase init
    │   ├── db.ts                # IndexedDB schema + helpers
    │   ├── jarvis-tools.ts      # function-calling schemas
    │   └── utils.ts
    ├── contexts/
    │   ├── AuthContext.tsx
    │   └── ThemeContext.tsx
    ├── types/
    │   ├── task.ts
    │   ├── user.ts
    │   └── team.ts
    └── routes.tsx
```

---

## 4. Design system (Licious theme)

### Color palette

```css
/* Light theme */
--color-bg: #FAF6EF;              /* warm cream */
--color-surface: #FFFFFF;
--color-surface-elevated: #FFF8EE;
--color-text: #1A1A1A;
--color-text-muted: #5C5C5C;
--color-border: #E8DECB;

/* Brand */
--color-primary: #C41230;         /* Licious crimson */
--color-primary-hover: #A50E28;
--color-primary-soft: #F7E0E5;
--color-accent: #E05A0A;          /* burnt orange */
--color-gold: #C8A97E;            /* warm gold for Low priority */

/* Semantic */
--color-success: #2D6A4F;
--color-warning: #E05A0A;
--color-danger: #C41230;
--color-info: #4A5859;

/* Dark theme — override in [data-theme='dark'] */
--color-bg: #0C0C0C;
--color-surface: #181818;
--color-surface-elevated: #222222;
--color-text: #F0E8D5;
--color-text-muted: #9A9A9A;
--color-border: #2A2A2A;
--color-primary: #E63050;
--color-primary-hover: #FF4560;
--color-primary-soft: rgba(230,48,80,0.12);
```

### Typography

- **Display / Headings**: Bebas Neue (bold, editorial)
- **Body / UI**: DM Sans (400, 500, 600, 700)
- **Monospace (timestamps, IDs)**: JetBrains Mono

Load via Google Fonts in `index.html`.

### Spacing & radius

- Base unit: 4px
- Radius scale: sm=6px, md=10px, lg=14px, xl=20px, pill=9999px
- Shadows: use subtle, warm-toned shadows in light mode; use soft glows (`0 0 0 1px rgba(255,255,255,0.04)`) in dark mode.

### Motion principles

1. **Every mount animates in.** Never pop onto screen.
2. **Spring physics for interactive elements** — `{ type: "spring", stiffness: 300, damping: 24 }`
3. **Staggered children** when rendering lists (stagger: 40–60ms)
4. **Easing for everything else** — `[0.22, 1, 0.36, 1]` (custom ease-out)
5. **Hover lifts** — `y: -2, scale: 1.01` on interactive cards
6. **No bounce on critical feedback** (errors, deletions) — keep it crisp

### Forbidden
- Generic blue/violet Tailwind defaults (`bg-blue-500`, `text-purple-600`, etc.)
- Neon gradients, Y2K aesthetics, glassmorphism overdose
- `border-radius: 50%` for anything other than avatars
- Emojis inside UI components (except explicit user-facing icons via lucide-react)

---

## 5. Data models

### IndexedDB (personal — device-local)

Database name: `tms-pro`, version: 1.

```typescript
// Store: "user"
interface User {
  id: string;             // uuid
  name: string;
  email?: string;         // if logged in via Firebase
  firebaseUid?: string;
  role?: "employee" | "manager";
  createdAt: number;
}

// Store: "tasks"
interface Task {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  dueDate?: string;       // ISO date
  status: "pending" | "completed";
  createdAt: number;
  updatedAt: number;
  attachments: Attachment[];
  sourceTaskId?: string;  // if accepted from a team assignment
  teamId?: string;
}

interface Attachment {
  id: string;
  type: "link" | "file";
  name: string;
  url: string;            // for files: object URL or Firebase Storage URL
  size?: number;
}

// Store: "settings"
interface Settings {
  id: "user-settings";    // single-row pattern
  theme: "light" | "dark";
  hasSeenWelcome: boolean;
  lastFilters?: FilterState;
}

// Store: "jarvis_history"
interface JarvisMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  functionCall?: { name: string; args: Record<string, unknown> };
}
```

### Firestore (teams — shared)

```
/teams/{teamId}
  name: string
  createdAt: timestamp
  managerIds: string[]   // uid list
  memberIds: string[]    // uid list (includes managers)

/teams/{teamId}/members/{userId}
  email: string
  displayName: string
  role: "manager" | "employee"
  joinedAt: timestamp

/teams/{teamId}/tasks/{taskId}
  title: string
  description: string
  priority: "Low" | "Medium" | "High"
  dueDate?: string
  status: "pending" | "completed"
  assignedTo: string     // uid
  assignedBy: string     // uid (manager)
  createdAt: timestamp
  acceptedByUser: boolean
  attachments: Attachment[]

/teams/{teamId}/tasks/{taskId}/comments/{commentId}
  authorId: string
  authorName: string
  text: string
  attachments: Attachment[]
  createdAt: timestamp
```

### Firestore security rules (summary)

- Read team doc: must be in `memberIds`
- Write team tasks (create/update/delete): must be in `managerIds`
- Employees can only **update their assigned task's status** (pending ↔ completed) and `acceptedByUser`
- Comments: any member can create; only author can edit/delete their own

---

## 6. Routing

```
/                     → redirect to /welcome (first visit) or /app/personal (returning)
/welcome              → WelcomeScreen (one-time; flag in IndexedDB settings)
/onboarding           → Ask name; save to IndexedDB
/login                → Google sign-in + email/password + role selector
/app                  → layout wrapper (auth guard)
/app/personal         → PersonalDashboard
/app/teams            → TeamsDashboard (team list if multiple)
/app/teams/:teamId    → TeamBoard
*                     → NotFound
```

Auth guard: If `settings.hasSeenWelcome === false` → `/welcome`. Else if no Firebase user → `/login`. Else → requested route.

---

## 7. Jarvis AI contract

### Tool definitions (what Gemini can call)

```typescript
export const jarvisTools = [
  {
    name: "addTask",
    description: "Create a new task in the user's personal dashboard",
    parameters: {
      title: "string (required)",
      description: "string (optional)",
      priority: "Low | Medium | High (default Medium)",
      dueDate: "ISO date string (optional, resolve relative dates like 'Friday')"
    }
  },
  { name: "deleteTask", parameters: { query: "task id or title fragment" } },
  { name: "markComplete", parameters: { query: "task id or title fragment" } },
  { name: "markIncomplete", parameters: { query: "task id or title fragment" } },
  { name: "updateTask", parameters: { query: "string", updates: "partial Task" } },
  { name: "filterTasks", parameters: { priority, status, dateFrom, dateTo } },
  { name: "sortTasks", parameters: { by: "priority | date | name | created" } },
  { name: "clearFilters", parameters: {} },
  { name: "searchTasks", parameters: { query: "string" } },
  { name: "getTasksSummary", parameters: {} },     // returns JSON for Gemini to narrate
  { name: "switchTheme", parameters: { theme: "light | dark" } }
];
```

### Flow

1. User speaks (mic) or types → transcript captured
2. Frontend sends `{ messages: ConversationHistory, currentTaskState: Task[] }` to Cloud Function
3. Cloud Function calls Gemini with tools + auth-verified user context
4. Gemini returns either:
   - A `functionCall` → frontend executes on local task store, responds with result, sends back to Gemini for natural-language confirmation
   - A plain text answer → spoken via `SpeechSynthesis`, shown in chat
5. Message logged to `jarvis_history` in IndexedDB

### Where Jarvis appears

**Personal dashboard only.** Right rail, above calendar. Toggle between text input and mic button. Not available on Teams pages.

---

## 8. Non-negotiable UX details

### Welcome screen (first visit)
- "Welcome to your Task Manager" — each word animates in 180ms apart, springs from `y: 30, opacity: 0`
- Below: Licious logo GIF plays once (user will provide the file; use a placeholder until then)
- After GIF finishes, entire page shatters into a 20×30 pixel grid — each pixel falls with gravity (random x drift, rotation)
- Pixels fully cleared after 3 seconds
- **Skip gyroscope tilt for now** — build hook as `useDeviceTilt()` stub returning no-op, wire in Phase 5 if time permits

### Onboarding
- Single input centered, "What should I call you?" placeholder
- Submit → "Hello, {name}" — name text animates from center to the top-right user button position (layoutId shared element)
- Save to IndexedDB, set `hasSeenWelcome = true`

### Header (persistent across `/app/*`)
- Left: Licious GIF (small, 40px)
- Center: rotating tagline, crossfade every 8 seconds, 6 phrases:
  1. "Order your tasks"
  2. "Getting things done, efficiently"
  3. "One task closer to freedom"
  4. "Fresh priorities, daily"
  5. "Ship, don't stall"
  6. "Plan. Do. Repeat."
- Right: theme toggle + user button with name chip

### Sidebar (Personal dashboard)
- Primary button: `+ New Task`
- Counters: Pending (N), Completed (N), Total (N)
  - Pending count blinks (WhatsApp unread style) if N > 0 — subtle pulse, 2s interval, primary color dot
  - **Counters ARE clickable** — act as quick filters (overriding user's original spec per my recommendation)
- Below: "My Team" section — avatar list of team members (links to team page)

### Main area
- Full-width search bar
- "Filter" button to its right → expands a panel below when clicked (not a dropdown)
- Filter panel: priority, status, date range, sort by — Apply + Clear buttons
- Filters persist in IndexedDB settings
- Task cards below — list view by default, card view toggleable

### Right rail
- Calendar (month view) with dots on days that have tasks
- Clicking a date filters main area to that date's tasks
- "Clear date filter" link appears when active
- Below calendar: Jarvis panel

### Teams page
- **Completely different visual treatment** — no sidebar layout, more of a Kanban/table
- Employees: read-only except their own task status + comments
- Managers: full CRUD + member management
- Comment thread uses illustration block inspiration from https://ui.aceternity.com/blocks/illustrations

### Logout page
- Split layout: left = 3 rotating phrases with slow crossfade; right = login form
- "Sign in with Google" + email/password + role selector (employee/manager)

---

## 9. Coding conventions

- **TypeScript strict mode**, no `any` without explicit comment justifying it
- **Named exports** for all components (no `default` except pages)
- **One component per file**, file name matches component name
- **Props interfaces** declared above component, suffix `Props`
- **Hooks** start with `use`, one hook per file
- **No inline styles** except dynamic values that can't be Tailwind
- **No `console.log` in committed code** — use a tiny `logger.ts` wrapper
- **Error boundaries** around each route
- **Loading states** for every async operation — never show blank
- **Empty states** for every list — illustrated, not just "No tasks"

### Commit style
- Conventional commits: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`
- Commit after each Phase prompt completes successfully

---

## 10. Environment variables

`.env.local` (gitignored):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Cloud Function env (set via `firebase functions:config:set`):
```
gemini.api_key=...
```

`.env.example` mirrors `.env.local` with blank values.

---

## 11. Build phases (Claude Code executes one per prompt)

- **Phase 1** — Scaffold: Vite + TS + Tailwind + Firebase init + folder structure + routes
- **Phase 2** — Welcome, Onboarding, Login, Auth flow, Theme
- **Phase 3** — Personal dashboard layout (Header, Sidebar, RightRail shell)
- **Phase 4** — Task CRUD (IndexedDB + TaskCard + TaskForm + TaskList)
- **Phase 5** — Search, Filter panel, Calendar integration
- **Phase 6** — Teams: Firestore setup, TeamBoard, member management, comments
- **Phase 7** — Jarvis: Cloud Function, tool schemas, text chat
- **Phase 8** — Jarvis: voice input/output
- **Phase 9** — Polish, Aceternity sprinkles, README, deploy

Each phase ends with a manual test checklist. **Do not proceed to next phase until tests pass.**

---

## 12. Testing checklist (applied after every phase)

1. `npm run build` succeeds with zero errors
2. `npm run dev` serves with no console errors or warnings
3. All routes in scope render without blank screens
4. Theme toggle works and persists
5. No hardcoded secrets or API keys in git diff
6. Responsive: test at 375px, 768px, 1280px widths
7. Lighthouse score ≥ 85 on Performance and Accessibility

---

**End of CLAUDE.md. Always re-read this file at the start of each prompt.**