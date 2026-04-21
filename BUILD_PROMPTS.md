# TMS Pro — Claude Code Build Prompts

**How to use this document:**
1. Open Claude Code in your project folder: `cd D:\Suraj\Projects\Licious\TMS Pro && claude`
2. Copy **one prompt at a time** and paste into Claude Code
3. Let it finish, then run the **Test Checklist** for that phase
4. Only move to the next prompt when all tests pass
5. Commit after each successful phase

**Before starting:** Make sure `CLAUDE.md` is at the root of `TMS Pro`. This file is the contract — Claude Code re-reads it every prompt.

---

## PHASE 0 — One-time setup (you do this manually)

```powershell
# Create project folder
cd D:\Suraj\Projects\Licious
mkdir "TMS Pro"
cd "TMS Pro"

# Drop CLAUDE.md into the root (copy from the file I gave you)

# Initialize git
git init
git add CLAUDE.md
git commit -m "docs: add project constitution"

# Launch Claude Code
claude
```

You should also:
1. Create a Firebase project at https://console.firebase.google.com (name it `tms-pro` or similar)
2. Enable **Authentication** → Email/Password + Google sign-in
3. Enable **Firestore Database** in test mode
4. Enable **Cloud Functions** (requires Blaze plan — free tier is plenty, but needs a billing card)
5. Get your Firebase config keys (Project settings → General → Your apps → Web)
6. Get a Gemini API key from https://aistudio.google.com/app/apikey

Keep these ready. You'll plug them in during Phase 1 and Phase 7.

---

## PHASE 1 — Project scaffold

**Paste this into Claude Code:**

```
Read CLAUDE.md in full before starting.

Task: Scaffold the TMS Pro project from scratch.

Steps:
1. Initialize Vite with React + TypeScript: npm create vite@latest . -- --template react-ts (use current directory)
2. Install core dependencies:
   - firebase
   - firebase-admin (for functions later)
   - idb
   - framer-motion
   - react-router-dom
   - react-hook-form zod @hookform/resolvers
   - date-fns
   - lucide-react
   - clsx tailwind-merge
3. Install and configure Tailwind CSS 3 with PostCSS
4. Replace src/index.css with Tailwind directives + CSS variables from section 4 of CLAUDE.md (both light and dark theme)
5. Configure tailwind.config.ts to:
   - Use CSS variables for colors (primary, bg, surface, text, etc.)
   - Extend fontFamily with "display" (Bebas Neue), "sans" (DM Sans), "mono" (JetBrains Mono)
   - darkMode: ["class", "[data-theme='dark']"]
6. Update index.html to:
   - Load Google Fonts for Bebas Neue, DM Sans (400-700), JetBrains Mono
   - Set lang="en" and a proper title "TMS Pro — Task Management"
   - Add meta viewport for mobile
7. Create the full folder structure from section 3 of CLAUDE.md. For each folder, add an empty .gitkeep file so git tracks it.
8. Create src/lib/utils.ts with a `cn()` helper that combines clsx + tailwind-merge
9. Create src/types/task.ts, src/types/user.ts, src/types/team.ts with the interfaces from section 5 of CLAUDE.md
10. Create .env.example with all VITE_FIREBASE_* variables from section 10 (blank values)
11. Create .env.local with the same keys (leave blank — user will fill in)
12. Update .gitignore to include .env.local, node_modules, dist, .firebase, functions/node_modules, functions/lib
13. Set up src/lib/firebase.ts that reads env vars and exports `auth`, `db`, `functions` (but don't call initializeApp yet if env vars are blank — guard it)
14. Replace src/App.tsx with a minimal placeholder that renders "TMS Pro — setup complete" centered with Bebas Neue heading and a cream background, to verify Tailwind + fonts work
15. Delete src/assets/react.svg and any Vite boilerplate we don't need
16. Verify the project builds: run `npm run build` and confirm zero errors
17. Commit: "feat: scaffold project with vite, tailwind, firebase stubs"

Do NOT write any feature code yet. Only scaffolding and configs.
```

### ✅ Phase 1 Test Checklist

Run these yourself:

- [ ] `npm run dev` opens a page saying "TMS Pro — setup complete"
- [ ] The heading uses Bebas Neue font (tall, condensed letters)
- [ ] Background is warm cream (`#FAF6EF`), not white
- [ ] `npm run build` completes with zero errors
- [ ] Folder structure matches section 3 of CLAUDE.md exactly
- [ ] `.env.local` is gitignored (run `git status` — should not show it)
- [ ] `src/types/task.ts` exists with correct `Task` interface

If all pass, fill in your Firebase keys in `.env.local`, then move to Phase 2.

---

## PHASE 2 — Welcome, Onboarding, Auth, Theme

**Paste this into Claude Code:**

```
Read CLAUDE.md in full.

Task: Build the entry flow — Welcome → Onboarding → Login — plus theme + auth infrastructure.

Requirements:

1. IndexedDB setup (src/lib/db.ts):
   - Open "tms-pro" DB v1 with stores: "user", "tasks", "settings", "jarvis_history"
   - Export helpers: getUser(), setUser(), getSettings(), setSettings(key, value), etc.
   - Use the `idb` library

2. ThemeContext (src/contexts/ThemeContext.tsx + src/hooks/useTheme.ts):
   - Reads initial theme from IndexedDB settings, falls back to prefers-color-scheme
   - Sets data-theme attribute on <html>
   - Exposes `theme`, `toggleTheme()`, `setTheme()`
   - Persists changes to IndexedDB

3. AuthContext (src/contexts/AuthContext.tsx + src/hooks/useAuth.ts):
   - Wraps Firebase auth state
   - Exposes `user`, `loading`, `signInWithGoogle()`, `signInWithEmail()`, `signUpWithEmail()`, `signOut()`
   - `user` includes role from Firestore member doc

4. Welcome page (src/pages/Welcome.tsx + src/components/welcome/):
   - Heading "Welcome to your Task Manager" — each word animates in via Framer Motion, 180ms apart, spring from y:30 opacity:0
   - Below heading: Licious logo placeholder (a red circle div for now, 120px, labeled "LICIOUS" — user will swap for GIF later)
   - After 2.5s, render PixelDissolve component:
     - 20x30 grid of divs over the whole screen, each with background matching the page at that position (easiest: use solid page-bg color for all)
     - Each pixel animates with y: window.innerHeight, x: random(-100, 100), rotate: random(-180, 180), duration: 1.5 + random, staggered 0-800ms
   - After dissolve completes (total ~3s), navigate to /onboarding (if no user in IndexedDB) or /app/personal
   - Use `useEffect` with cleanup to prevent state updates after unmount

5. Onboarding page (src/pages/Onboarding.tsx):
   - Centered input: "What should I call you?"
   - On submit: show "Hello, {name}" for 1.5s with the name text using `layoutId="user-name"` from Framer Motion
   - Then navigate to /login
   - Save {id, name, createdAt} to IndexedDB "user" store

6. Login page (src/pages/Login.tsx):
   - Split layout (50/50 on desktop, stacked on mobile)
   - Left side: 3 rotating phrases crossfading every 4s ("Organize your day", "Work smarter, not harder", "Your tasks, your rules")
   - Right side: form card with:
     - Role selector (segmented control): Employee / Manager
     - "Sign in with Google" button (outline style, Google icon from lucide)
     - Divider with "or"
     - Email + password inputs
     - "Sign in" and "Create account" toggle
   - On successful auth: write/update user doc in Firestore (collection: "users", doc ID: uid) with role, email, displayName
   - On success, navigate to /app/personal

7. Routing (src/routes.tsx and App.tsx):
   - Use React Router v6
   - Routes:
     - "/" → logic: if !settings.hasSeenWelcome → /welcome; else if !user → /login; else → /app/personal
     - "/welcome" → Welcome
     - "/onboarding" → Onboarding
     - "/login" → Login
     - "/app" → placeholder "<div>Dashboard coming in Phase 3</div>" for now
     - "*" → NotFound (simple 404 page)
   - Wrap app in AuthProvider + ThemeProvider

8. UI primitives (src/components/ui/):
   - Button.tsx — variants: primary, outline, ghost, danger. Sizes: sm, md, lg. Uses Framer Motion for hover/tap
   - Input.tsx — with label, error, hint
   - Card.tsx — surface container with subtle shadow
   - Spinner.tsx — small circular loader using primary color

9. Theme toggle: expose a small ThemeToggle component in src/components/ui/ThemeToggle.tsx (sun/moon icon). Don't place it yet — we'll add in Phase 3 header.

10. Test the full flow:
    - Clear IndexedDB manually → should land on /welcome
    - Go through onboarding → land on /login
    - Sign in with email → land on /app
    - Refresh → should skip welcome and onboarding
    - Toggle theme via React DevTools → colors switch

11. Commit: "feat: welcome, onboarding, auth, theme infrastructure"

Quality bar:
- No prop drilling — use contexts
- No `any` types
- All async flows show loading state
- Animations feel smooth, not janky
- Zero console errors
```

### ✅ Phase 2 Test Checklist

- [ ] First visit → Welcome screen plays, words animate in sequence
- [ ] Pixel dissolve happens and page clears smoothly (no white flash)
- [ ] Onboarding accepts name, shows "Hello, X" animation, proceeds
- [ ] Login page renders split layout, phrases rotate
- [ ] Google sign-in works (opens popup, signs in)
- [ ] Email sign-up creates user, auto-signs-in
- [ ] Refreshing page after login skips welcome/onboarding
- [ ] IndexedDB (DevTools → Application → IndexedDB → tms-pro) has `user` and `settings` records
- [ ] Theme toggle via React DevTools changes colors on <html>
- [ ] `npm run build` succeeds
- [ ] Mobile view (375px) — login stacks vertically, looks intentional

---

## PHASE 3 — Personal dashboard layout shell

**Paste this into Claude Code:**

```
Read CLAUDE.md in full.

Task: Build the three-column layout shell for /app/personal with Header, Sidebar, and Right Rail. No task CRUD yet — just the structure, theme, and navigation.

Requirements:

1. Layout component (src/components/layout/AppLayout.tsx):
   - Header at top (fixed, 64px)
   - Below header: 3-column grid
     - Left sidebar: 260px (collapses to hamburger on mobile)
     - Main content: flex-1
     - Right rail: 320px (hidden below 1024px)
   - Use CSS Grid, not flexbox, for the columns
   - Wrap children with <Outlet /> for nested routing

2. Header (src/components/layout/Header.tsx):
   - Left: Licious logo placeholder (40px red circle for now) + "TMS Pro" wordmark in Bebas Neue
   - Center: rotating tagline — 6 phrases from section 8 of CLAUDE.md, crossfade every 8s using AnimatePresence
   - Right: ThemeToggle + UserButton
   - UserButton: 
     - Avatar circle (first letter of name)
     - Name chip with layoutId="user-name" so it animates in from onboarding page
     - Click → dropdown with "Sign out" option
   - Use motion.header with slide-down entrance

3. Sidebar (src/components/layout/Sidebar.tsx):
   - "+ New Task" button at top (primary, full-width) — click opens modal (stub: just log "open task modal" for now)
   - Below button: counter cards
     - "Pending" — shows count with blinking red dot if > 0 (use motion.div with animate={{ opacity: [1, 0.3, 1] }} loop)
     - "Completed" — shows count
     - "Total" — shows count
     - Counters are clickable (fire a setFilter callback — stub for now)
   - Below counters: divider + "My Team" label + placeholder "No team yet" text
   - Fake counts for now: Pending 3, Completed 5, Total 8

4. Right Rail (src/components/layout/RightRail.tsx):
   - Top section: Calendar placeholder — simple month grid showing current month, today highlighted in primary color (no task dots yet)
   - Bottom section: Jarvis panel placeholder — card with title "Jarvis", subtitle "Your AI assistant", mic button + text input (disabled for now)
   - Use a flex-col with gap-4 layout

5. PersonalDashboard page (src/pages/PersonalDashboard.tsx):
   - Renders inside AppLayout
   - Main content area (middle column): 
     - Search bar placeholder (full width)
     - Filter button beside it
     - Below: "No tasks yet" empty state with illustration (can be simple SVG or lucide icon)
   - Just placeholders — wire real CRUD in Phase 4

6. Route guard:
   - Create src/components/layout/ProtectedRoute.tsx
   - Redirects to /login if no authenticated user
   - Wrap /app routes with it

7. Responsive behavior:
   - Below 768px: sidebar becomes a slide-in drawer toggled by hamburger in header
   - Below 1024px: right rail hides (will add a mobile toggle later)
   - Above 1280px: extra padding on sides

8. Logout:
   - UserButton dropdown → "Sign out" → calls signOut() from AuthContext → navigates to /login
   - Clear Firebase auth session but KEEP IndexedDB user (so welcome doesn't play again)

9. Test the layout visually:
   - At 1280px+: full 3-column view
   - At 1024px: right rail hidden, 2-col
   - At 768px: sidebar becomes drawer
   - At 375px: mobile view, drawer works
   - Theme toggle flips everything cleanly (no broken colors)

10. Commit: "feat: personal dashboard layout shell with header, sidebar, right rail"

Quality bar:
- No layout shift on page load
- Header tagline crossfade is smooth, no flicker
- All hover states feel deliberate (subtle, use motion.div with whileHover)
- Empty state in main area is not ugly — looks intentional
```

### ✅ Phase 3 Test Checklist

- [ ] /app/personal renders the full 3-column layout
- [ ] Header tagline rotates every 8s, crossfade is smooth
- [ ] User name chip persists from onboarding → header (layoutId animation works)
- [ ] Sidebar counters show fake values, pending counter blinks
- [ ] Right rail shows calendar for current month, today highlighted
- [ ] Sign out from user dropdown → returns to /login
- [ ] Sign in again → lands on /app/personal (no welcome)
- [ ] Resize window from 1400px → 375px — no horizontal scroll, layout adapts
- [ ] Theme toggle works everywhere, no missed elements
- [ ] Lighthouse Accessibility ≥ 90

---

## PHASE 4 — Task CRUD

**Paste this into Claude Code:**

```
Read CLAUDE.md in full.

Task: Implement the complete task management system on the personal dashboard — create, read, update, delete, toggle complete, all backed by IndexedDB.

Requirements:

1. useTasks hook (src/hooks/useTasks.ts):
   - Loads tasks from IndexedDB on mount
   - Exposes: tasks, createTask, updateTask, deleteTask, toggleComplete, refresh
   - All mutations update IndexedDB AND local state optimistically
   - Returns loading and error state

2. TaskForm (src/components/tasks/TaskForm.tsx):
   - Used in both "create" and "edit" modes (prop: task?: Task)
   - Fields: title (required, 1-100 chars), description (optional, max 500), priority (radio pills Low/Medium/High), due date (optional)
   - Use react-hook-form + zod for validation
   - Attachment section: 
     - "Add link" → input for URL + label
     - "Add file" → file picker, store as object URL in attachments array (don't upload to Firebase yet)
   - Submit button disabled when invalid
   - Cancel button

3. TaskCard (src/components/tasks/TaskCard.tsx):
   - Displays: title, description (truncated to 2 lines), priority pill, due date, attachment count
   - Priority pill colors: Low=gold, Medium=burnt orange, High=primary red
   - Left edge has a colored stripe matching priority
   - Checkbox on left to toggle complete — completed tasks get 60% opacity + strikethrough
   - Overdue tasks (dueDate < today AND not completed): due date shows in red with "Overdue" badge
   - Hover: subtle lift (y: -2, scale: 1.01)
   - Actions menu (three dots) on right: Edit, Delete
   - On delete: show ConfirmModal (custom, not window.confirm)

4. TaskList (src/components/tasks/TaskList.tsx):
   - Renders tasks in a vertical stack, staggered entrance (40ms delay between each)
   - Empty state: illustration + "No tasks yet" + "Create your first task" button
   - View toggle (list/card) — in list view, cards are full-width; in card view, 2-3 per row grid
   - Use AnimatePresence for add/remove animations

5. TaskModal (src/components/tasks/TaskModal.tsx):
   - Bottom-sheet on mobile, centered modal on desktop
   - Wraps TaskForm
   - Spring entrance: cubic-bezier(0.34, 1.56, 0.64, 1)
   - Esc closes, click-outside closes
   - Focus trap inside modal

6. ConfirmModal (src/components/ui/ConfirmModal.tsx):
   - Reusable: title, message, confirmText, cancelText, onConfirm, onCancel
   - Destructive variant (red confirm button) for deletes

7. Wire the Sidebar "+ New Task" button to open TaskModal in create mode
8. Wire sidebar counters to real counts from useTasks()
9. Wire counter clicks to filter (set a filter state in the dashboard — will expand in Phase 5)
10. Main area: render TaskList with current tasks
11. Add view toggle (list/card) in the main area header

12. Attachments display on TaskCard:
    - If any attachments, show a paperclip icon + count
    - Click to expand a small panel listing them with "Open" links

13. Keyboard shortcut: Ctrl/Cmd + K opens new task modal (globally, only when authenticated)

14. Commit: "feat: task CRUD with attachments, filters, modals"

Quality bar:
- Creating a task feels instant (optimistic update)
- Deleting a task animates out smoothly
- Toggling complete animates the strikethrough
- Form validation errors appear inline, not alert()s
- Modal is keyboard-accessible (Tab cycles inside it)
```

### ✅ Phase 4 Test Checklist

- [ ] Create task → appears instantly with spring animation
- [ ] Edit task → form pre-fills, save updates UI
- [ ] Delete task → confirm modal → task animates out
- [ ] Toggle complete → strikethrough + opacity animates
- [ ] Overdue tasks show red due date + badge
- [ ] Attachments (link + file) save and display
- [ ] Sidebar counters update in real-time
- [ ] Click "Pending" counter → filters to pending only
- [ ] Ctrl+K opens new task modal
- [ ] Refresh page → tasks persist (IndexedDB)
- [ ] List ↔ card view toggle works
- [ ] All animations ≥ 60fps in DevTools Performance tab

---

## PHASE 5 — Search, Filter panel, Calendar integration

**Paste this into Claude Code:**

```
Read CLAUDE.md in full.

Task: Build the search, advanced filter panel, and wire the calendar to filter tasks by date.

Requirements:

1. Search bar (src/components/tasks/SearchBar.tsx):
   - Full-width input with search icon
   - Filters tasks in real-time (title + description match, case-insensitive)
   - Clear button (X) when text present

2. FilterPanel (src/components/tasks/FilterPanel.tsx):
   - "Filter" button next to search — click toggles panel open below
   - Panel contents:
     - Priority: multi-select chips (Low, Medium, High)
     - Status: segmented control (All, Pending, Completed)
     - Date range: from + to date inputs
     - Sort by: dropdown (Created date, Due date, Priority, Name) + direction toggle (asc/desc)
   - "Apply" button + "Clear all" button
   - Filters persist to IndexedDB settings.lastFilters
   - Reopening panel shows currently active filters
   - Closing panel KEEPS filters applied (per spec)
   - Small badge on Filter button showing count of active filters

3. useTasks expansion:
   - Add filter state: filters + setFilters
   - `filteredTasks` derived value applying all filters + search + date
   - Persist filters to IndexedDB on change

4. Calendar widget (src/components/calendar/CalendarWidget.tsx):
   - Month view with navigation arrows (prev/next month)
   - Today cell highlighted in primary color outline
   - Days with pending tasks show a dot underneath
   - Days with completed-only tasks show a muted dot
   - Click a day → sets dateFilter to that day, main area shows only tasks due on that day
   - "Clear date" link appears above calendar when filter active
   - Animated month transitions (slide left/right)

5. Integrate calendar with useTasks:
   - When a date is selected, filter main area to tasks with dueDate === selectedDate
   - Sidebar counters should still show global counts (not filtered)

6. Empty state variants:
   - No tasks at all → "Create your first task"
   - No tasks match filters → "No tasks match your filters" + "Clear filters" button
   - No tasks on selected date → "Nothing due on this day"

7. Filter summary chip row:
   - Above task list, show active filters as removable chips (e.g., "Priority: High ×", "Date: Apr 22 ×")
   - Click × to remove that specific filter

8. Performance:
   - If task count > 50, virtualize the list (use react-window or equivalent)
   - Memoize filteredTasks derivation

9. Commit: "feat: search, filter panel, calendar filter integration"

Quality bar:
- Typing in search bar feels instant (no lag)
- Filter panel expand/collapse is smooth
- Calendar date clicks feel snappy
- Active filter chips match the actual filter state
- Clearing all filters returns to full list smoothly
```

### ✅ Phase 5 Test Checklist

- [ ] Search filters tasks live as you type
- [ ] Filter panel opens/closes, remembers state
- [ ] Multi-select priority filters work (e.g., High + Medium only)
- [ ] Date range filter correctly limits tasks
- [ ] Sort by each option works both asc/desc
- [ ] Filter badge shows correct active count
- [ ] Calendar dots appear on correct days
- [ ] Clicking a calendar day filters main area to that day
- [ ] "Clear date" link removes date filter
- [ ] Filter chip row displays and ×-to-remove works
- [ ] Filters persist across page refresh
- [ ] All counters still reflect global counts, not filtered

---

## PHASE 6 — Teams (Firestore + manager/employee + comments)

**Paste this into Claude Code:**

```
Read CLAUDE.md in full.

Task: Build the Teams feature — Firestore-backed, with role-based access, task assignment, and comment threads.

Requirements:

1. Firestore security rules (firestore.rules):
   - Implement the rules from CLAUDE.md section 5
   - Deploy via firebase deploy --only firestore:rules

2. Firestore helpers (src/lib/firestore.ts):
   - createTeam(name, managerUid)
   - inviteMember(teamId, email, role)
   - removeMember(teamId, uid)
   - getTeams(uid) → teams where user is a member
   - subscribeToTasks(teamId, callback) → real-time listener
   - createTeamTask, updateTeamTask, deleteTeamTask
   - addComment, subscribeToComments

3. useTeam hook (src/hooks/useTeam.ts):
   - Subscribes to team tasks in real-time
   - Exposes: tasks, members, currentUserRole, CRUD methods
   - Auto-unsubscribes on unmount

4. TeamsDashboard page (/app/teams):
   - Lists all teams user belongs to
   - "Create team" button (shows modal to name it — user becomes manager)
   - Click a team → navigate to /app/teams/:teamId

5. TeamBoard page (/app/teams/:teamId):
   - Completely different UI from personal dashboard — NO sidebar layout, full-width content
   - Top: team name, member avatars, (if manager) "Add member" + "Add task" buttons
   - Tabs: "All Tasks" | "Assigned to Me" | "Members"
   - Task view: table/board hybrid
     - Columns: Title, Priority, Assignee, Due Date, Status
     - Manager sees all; employee sees all but can only toggle status on their own
   - Click a task → opens TaskDetail drawer on right with comments + attachments

6. TaskDetail drawer (src/components/teams/TaskDetailDrawer.tsx):
   - Slides in from right (Framer Motion)
   - Shows task info, assignee, status controls
   - Below: comment thread
   - Manager actions: Edit, Delete, Reassign, Change priority
   - Employee actions: Toggle complete, Add comment

7. Comment thread (src/components/teams/CommentThread.tsx):
   - Vertical list of comments, each with avatar + name + timestamp
   - Styling inspired by https://ui.aceternity.com/blocks/illustrations — soft cards, illustration accent
   - Supports attachments (link or file)
   - Input at bottom to post new comment + attach files/links
   - Real-time updates (Firestore onSnapshot)

8. Task assignment flow:
   - Manager creates task → selects assignee from team members
   - Task appears in employee's Team board + a "New assignment" notification badge
   - Employee can click "Accept to personal" button → task copies to IndexedDB personal tasks with sourceTaskId link
   - Status changes on either side sync back (if accepted into personal, toggling there also updates Firestore)

9. Manager-only: Member management
   - Members tab: list with role badges
   - "Invite by email" → creates a pending invite in Firestore (stub; actual email sending is optional)
   - If invited user signs up with same email, auto-add to team
   - Remove member button (confirm modal)

10. Notification badge:
    - In the main header (personal dashboard), show a small badge on the user button if there are new team assignments
    - Click → go to /app/teams/:teamId

11. Cross-dashboard link:
    - In personal Sidebar "My Team" section, list team members with avatars (clickable to team page)

12. Commit: "feat: teams with firestore, roles, assignments, comments"

Quality bar:
- Firestore rules actually block unauthorized writes (test by temporarily signing in as employee and trying to delete)
- Real-time updates feel instant (<500ms)
- No flash of unauthorized content (handle loading states properly)
- Manager UI is visibly different from employee UI (buttons visible/hidden appropriately)
```

### ✅ Phase 6 Test Checklist

- [ ] Create team as manager → appears in teams list
- [ ] Invite member (create a second test account) → member joins team
- [ ] As manager: create task, assign to employee → employee sees it
- [ ] As employee: see task assigned to me, comment on it
- [ ] Toggle status as employee → manager sees update in real-time
- [ ] Employee cannot see delete button on task (UI permission)
- [ ] Employee cannot delete via Firestore directly (rules block) — test in console
- [ ] Comments with file/link attachments save and render
- [ ] "Accept to personal" copies task to personal IndexedDB
- [ ] Status sync: toggle on personal side updates Firestore
- [ ] Sign out as manager, sign in as employee — different UI rendered

---

## PHASE 7 — Jarvis AI (text chat + function calling)

**Paste this into Claude Code:**

```
Read CLAUDE.md in full.

Task: Implement Jarvis — the text-based AI assistant using Gemini 2.0 Flash via a Firebase Cloud Function proxy, with function calling.

Requirements:

1. Cloud Function (functions/src/jarvis.ts):
   - HTTP callable function (requires Firebase Auth)
   - Input: { messages: ChatMessage[], currentTasks: Task[] }
   - Calls Gemini 2.0 Flash API with the message history + tool definitions from CLAUDE.md section 7
   - Returns Gemini's response (either functionCall spec or text)
   - Gemini API key read from functions config (never from the client)
   - Handle rate limit errors gracefully

2. functions/package.json dependencies:
   - firebase-functions firebase-admin @google/generative-ai

3. Tool definitions (src/lib/jarvis-tools.ts):
   - Export the 11 tools from CLAUDE.md section 7 with Zod schemas
   - Each tool has: name, description, parameters schema, example phrases
   - Export a `toolExecutors` object mapping tool name → function that takes args + taskManager instance and returns a result

4. Task manager adapter (src/lib/task-manager.ts):
   - Wraps useTasks hook's mutations in a plain-object interface Jarvis can call
   - Methods mirror the tool names
   - Smart matching: for "deleteTask(query)", finds tasks by substring match on title, returns list if ambiguous

5. useJarvis hook (src/hooks/useJarvis.ts):
   - State: messages (ChatMessage[]), loading, error
   - sendMessage(text) → appends user message, calls Cloud Function, processes response
   - If functionCall returned: executes the tool, sends result back to Gemini for narration, appends assistant message
   - Loads history from IndexedDB on mount (last 20 messages)
   - Saves to IndexedDB on every new message
   - clearHistory() method

6. JarvisPanel (src/components/jarvis/JarvisPanel.tsx):
   - Replaces placeholder in right rail
   - Header: "Jarvis" + status dot (idle/listening/thinking/speaking)
   - Messages list (scrollable): user messages right-aligned (primary bg), assistant left-aligned (surface bg)
   - Each message fades in from bottom
   - Input at bottom: text field + send button (mic button disabled for now, Phase 8)
   - "Clear chat" menu option

7. Context awareness:
   - Every message sent to Jarvis includes current task state (so it can answer "what's pending today" accurately)
   - Also sends current filters (so "clear filters" makes sense)
   - System prompt (set in Cloud Function): "You are Jarvis, a concise task management assistant. Be brief. Use function calls to perform actions. Today's date is {TODAY}."

8. Tool execution confirmations:
   - For destructive actions (deleteTask), Jarvis confirms first ("I found 3 tasks matching 'report'. Should I delete the top priority one titled X?") unless the match is unambiguous
   - Every tool execution results in a spoken confirmation message

9. Example interactions to verify:
   - "Add a high priority task to review the Q3 report due Friday" → creates task
   - "What's on my plate today?" → lists today's pending tasks
   - "Sort by priority" → changes sort
   - "Mark shopping as done" → toggles
   - "Clear filters" → resets
   - "Switch to dark mode" → toggles theme

10. Error handling:
    - If Cloud Function returns error (rate limit, network), show fallback message in chat
    - If Gemini calls a tool that doesn't exist, log and tell user "I tried to do something I don't know how to do"

11. Deploy function: firebase deploy --only functions

12. Commit: "feat: jarvis ai with gemini function calling"

Quality bar:
- Round-trip under 3 seconds for simple queries
- No API key visible in browser DevTools Network tab
- Function-call results feel natural (not robotic "function X executed")
- Chat history persists across page refresh
```

### ✅ Phase 7 Test Checklist

- [ ] "Add a task to finish report, high priority, due Friday" → task created with correct fields
- [ ] "What's pending today?" → Jarvis lists today's pending tasks
- [ ] "Show me only high priority" → filters applied
- [ ] "Clear filters" → resets
- [ ] "Delete the report task" → confirms, then deletes
- [ ] "Mark it complete" (contextual) → handles it
- [ ] Open Network tab → no direct Gemini API calls from browser (only to Cloud Function)
- [ ] No API key in any .js bundle (check with Ctrl+F in DevTools Sources)
- [ ] Refresh → chat history restored
- [ ] Error state when Cloud Function is down: shows helpful message, no crash

---

## PHASE 8 — Jarvis voice input/output

**Paste this into Claude Code:**

```
Read CLAUDE.md in full.

Task: Add voice input (speech-to-text) and voice output (text-to-speech) to Jarvis using the Web Speech API.

Requirements:

1. useVoice hook (src/hooks/useVoice.ts):
   - Wraps webkitSpeechRecognition
   - Exposes: isSupported, isListening, transcript, interimTranscript, startListening(), stopListening(), error
   - Config: continuous=false, interimResults=true, language='en-US'
   - Auto-stops after 5 seconds of silence

2. Text-to-speech utility (src/lib/speech.ts):
   - speak(text, { rate, pitch, onEnd }) → uses SpeechSynthesis
   - Stop any ongoing speech before starting new
   - Prefer a natural-sounding voice from getVoices() (e.g., Google US English, Samantha)

3. JarvisPanel voice integration:
   - Mic button (round, primary color) — click to start listening
   - While listening: button pulses, shows interim transcript as "Listening: {text}..."
   - On final transcript: sends to Jarvis automatically
   - Assistant responses speak aloud by default
   - Toggle in panel header: voice output on/off (save pref to settings)
   - Keyboard shortcut: Space bar (when Jarvis panel is focused) to start/stop listening

4. Visual state indicator:
   - Jarvis status dot animates based on state:
     - Idle: solid
     - Listening: pulsing red
     - Thinking: rotating dashes
     - Speaking: waving bars

5. Browser support fallback:
   - If Web Speech API not supported, hide mic button and show a small "Voice not supported in this browser" tooltip on hover over a placeholder

6. Permissions:
   - On first mic tap, request microphone permission via the browser prompt
   - If denied, show helpful message in chat with instructions to enable

7. Edge cases:
   - If user is speaking while Jarvis is still speaking, cut Jarvis off (interrupt-friendly)
   - Don't listen when the Jarvis panel is not visible (e.g., on Teams page)

8. Commit: "feat: jarvis voice input and output"

Quality bar:
- Voice-to-action works end-to-end in under 4 seconds total
- Speaking feels natural (pick a good voice)
- No double-responses or dropped transcripts
- Graceful degradation in Firefox/Safari if API unavailable
```

### ✅ Phase 8 Test Checklist

- [ ] Click mic → pulse animation + "Listening" indicator
- [ ] Speak "Add a task to buy groceries" → task is created
- [ ] Jarvis speaks back the confirmation
- [ ] Status dot reflects each state accurately
- [ ] Voice output toggle turns narration off
- [ ] Space bar starts/stops when panel focused
- [ ] Test in Chrome (full support) and Firefox (should degrade gracefully)
- [ ] Revoke mic permission → helpful message appears
- [ ] Voice disabled on Teams page

---

## PHASE 9 — Polish, Aceternity components, README, deploy

**Paste this into Claude Code:**

```
Read CLAUDE.md in full.

Task: Final polish pass — sprinkle Aceternity-inspired components, add missing empty/loading/error states, write README, and deploy.

Requirements:

1. Aceternity-inspired touches (recreate patterns, don't copy code):
   - Spotlight effect on login page background
   - Animated border gradient on "Create Team" card
   - Hover card reveal on team member avatars
   - Text generate effect on Jarvis responses (typewriter-style)
   - Animated tooltip on counter cards

2. Comprehensive empty states:
   - Personal dashboard (no tasks): SVG illustration + CTA
   - Search no results: magnifier illustration
   - Teams (no teams): onboarding-style "Create or join a team"
   - Jarvis (no messages): example prompts as clickable chips

3. Loading states:
   - Skeleton loaders for tasks, teams, comments
   - Suspense boundaries around routes
   - Fine-grained loading (not a full-page spinner for small updates)

4. Error boundaries:
   - One per route, with a reset button
   - Friendly error message, not a stack trace
   - Report button (mailto link for now)

5. Micro-interactions:
   - Confetti burst when completing a task (small, not overwhelming)
   - Subtle haptic via vibration API on mobile task completion
   - Success toast after task creation (bottom-right, auto-dismiss 2s)

6. Performance pass:
   - React.memo on TaskCard, CommentItem
   - Lazy-load Teams and Jarvis bundles via React.lazy + Suspense
   - Preload fonts with rel=preload
   - Image optimization (if any)

7. Accessibility pass:
   - Run axe DevTools, fix all violations
   - All interactive elements have aria-labels
   - Focus indicators visible on keyboard navigation
   - Color contrast ≥ WCAG AA for text

8. SEO basics:
   - Proper <title> on each route (use react-helmet-async)
   - Open Graph meta tags
   - favicon

9. README.md (comprehensive):
   - Project overview with 2-3 screenshots
   - Feature list
   - Tech stack
   - Architecture diagram (ASCII or image)
   - Setup instructions (env vars, Firebase config, deploy)
   - Design decisions (why local-first personal + cloud teams, why Gemini with function calling, etc.)
   - Credits (Aceternity inspiration, Licious branding)

10. Deploy:
    - firebase deploy (hosting + functions + firestore rules)
    - Verify live URL works end-to-end
    - Add deploy badge to README

11. Gyroscope pixel tilt (optional — only if time):
    - useDeviceTilt hook using DeviceOrientationEvent
    - Request permission on iOS Safari
    - Translate pixel positions based on beta/gamma
    - Only active during welcome screen's first 5 seconds

12. Commit: "chore: polish, a11y, readme, deploy"
    Tag: v1.0.0

Quality bar:
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90
- No console errors on any route
- Works in Chrome, Firefox, Safari
- Loads on a mid-range phone in under 4s on 4G
```

### ✅ Phase 9 Test Checklist

- [ ] Lighthouse scores meet targets
- [ ] All empty states look intentional, not broken
- [ ] Errors show the boundary UI, not a white screen
- [ ] Keyboard-only navigation works end-to-end
- [ ] Screen reader announces page changes and button actions
- [ ] Deploy succeeds, live URL works
- [ ] README is reviewer-ready
- [ ] Tagged v1.0.0

---

## 🎯 Final submission checklist (before sharing with the reviewer)

- [ ] Deployed URL works on a fresh browser (no cache)
- [ ] Test account credentials in README (so reviewer doesn't need to sign up)
- [ ] Screenshots in README are current
- [ ] Video walkthrough (2-3 min) recorded and linked
- [ ] Repository public on GitHub with README as landing
- [ ] No secrets in commit history (run `git log -p | grep -i "api_key\|secret"`)
- [ ] All phases committed with clean history
- [ ] License file (MIT) added

---

## 💡 Tips for working with Claude Code

1. **One prompt at a time.** Resist the urge to combine phases — Claude Code does better with bounded scope.
2. **Read its plan before approving.** When it proposes a file tree, check it against CLAUDE.md.
3. **Test before committing.** Each phase has a checklist — run it.
4. **If it drifts, reset with context.** Say: "Stop. Re-read CLAUDE.md section X. Now continue."
5. **Screenshots help.** If UI looks off, screenshot and paste into Claude Code — it can read images.
6. **Use `/clear` between phases.** Fresh context = better adherence to CLAUDE.md.
7. **Commit often within a phase.** If Claude Code creates 10 files, commit after every 3-4 so you can roll back partial changes.

Good luck. Ship something you're proud of.