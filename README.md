# TMS Pro — Task Management System

> Order your tasks. Ship, don't stall.

A premium, AI-assisted Task Management System built for Licious. TMS Pro combines a local-first personal dashboard with real-time team collaboration and an embedded text AI assistant ("Jarvis") powered by Groq + Llama 4.

**Live demo:** *(coming soon after deploy)*

---

## Screenshots

| Login & Spotlight | Personal Dashboard | Teams Board |
| :---: | :---: | :---: |
| *(add screenshot)* | *(add screenshot)* | *(add screenshot)* |

---

## Features

- **Personal Dashboard** — local-first task tracking (list/card views), full CRUD, search, filters, due-date calendar
- **Team Collaboration** — real-time Firestore-backed boards, role-based access (Manager/Employee), comment threads, file/link attachments
- **Jarvis AI** — text-based assistant powered by Groq (Llama 4 Scout); understands natural language to create, delete, filter, sort and summarise tasks via function calling
- **Offline-first** — personal tasks live in IndexedDB; works without a network connection
- **Licious design system** — crimson & warm-cream theme, Bebas Neue headings, DM Sans body, Framer Motion animations throughout
- **Dark / Light mode** — persisted across sessions
- **Aceternity-inspired touches** — spotlight cursor on login, animated gradient borders, typewriter Jarvis responses, hover card reveals

---

## Tech Stack

| Layer | Choice |
|---|---|
| Bundler | Vite 5 |
| Framework | React 18 + TypeScript (strict) |
| Styling | Tailwind CSS 3 + CSS variables |
| Animations | Framer Motion 11 |
| Routing | React Router v6 |
| Auth | Firebase Auth (Google + email/password) |
| Teams DB | Firestore |
| Personal storage | IndexedDB via `idb` |
| AI model | Llama 4 Scout (via Groq) |
| AI proxy | Firebase Cloud Functions |
| Icons | lucide-react |
| Deployment | Firebase Hosting |

---

## Architecture

```
Browser
  └── React SPA (Vite)
        ├── /app/personal  ← IndexedDB (idb) — fully offline
        │     └── Jarvis panel → Firebase HTTPS Callable
        │                              └── Groq API (Llama 4 Scout)
        └── /app/teams     ← Firestore real-time listeners
              └── Auth guard (Firebase Auth)

Firebase
  ├── Hosting  (serves dist/)
  ├── Auth     (Google OAuth + email/password)
  ├── Firestore (teams, tasks, comments)
  └── Cloud Functions
        └── jarvis()  — validates auth, calls Groq, returns tool calls + text
```

```
src/
├── components/
│   ├── calendar/    CalendarWidget
│   ├── jarvis/      JarvisPanel
│   ├── layout/      Header, Sidebar, RightRail, AppLayout
│   ├── tasks/       TaskCard, TaskList, TaskForm, FilterPanel, FilterChips
│   ├── teams/       CommentThread, MemberList, TaskDetailDrawer
│   └── ui/          Button, Input, Modal, Spinner, AnimatedGradientBorder, TypewriterEffect …
├── contexts/        AuthContext, TaskContext, ThemeContext, ToastContext
├── hooks/           useAuth, useTasks, useTeam, useJarvis, useTheme
├── lib/             firebase.ts, db.ts, jarvis-tools.ts, task-manager.ts, logger.ts
├── pages/           Welcome, Onboarding, Login, PersonalDashboard, TeamsDashboard, TeamBoard
└── routes.tsx
```

---

## Getting Started

### Prerequisites

- Node 18+
- Firebase CLI — `npm i -g firebase-tools`
- A Firebase project with Auth, Firestore, and Functions enabled
- A [Groq](https://console.groq.com) API key

### Clone & install

```bash
git clone https://github.com/your-org/tms-pro.git
cd tms-pro
npm install
cd functions && npm install && cd ..
```

### Firebase setup

1. Go to [Firebase Console](https://console.firebase.google.com) → create a project
2. Enable **Authentication** (Google + Email/Password providers)
3. Enable **Firestore** (start in production mode, deploy rules below)
4. Enable **Cloud Functions** (Blaze plan required)

### Environment variables

Create `.env.local` in the project root:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Create `functions/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### Run locally

```bash
npm run dev
# App at http://localhost:5173
```

To test Jarvis locally with the emulator:

```bash
firebase emulators:start --only functions
```

### Deploy

```bash
npm run build
firebase deploy
```

This deploys hosting (dist/) + Cloud Functions in one step.

---

## Design Decisions

**Local-first personal + cloud teams**
Personal tasks live in IndexedDB so the dashboard works offline and never touches a server. Team tasks need real-time multi-user sync, so they live in Firestore. The split keeps costs near zero for solo users.

**Groq + Llama 4 Scout over a simple chat API**
Jarvis uses function calling — the model decides which tool to invoke (addTask, filterTasks, markComplete …) and the frontend executes it against the local task store. This means the AI actually *does* things rather than just describing them.

**Custom Licious theme over Material / Tailwind defaults**
The brief required Licious brand fidelity. Generic blue/violet defaults would clash. All colours are CSS variables so the dark-mode swap is a single attribute toggle on `<html>`.

**IndexedDB over localStorage**
localStorage is synchronous, limited to ~5 MB, and stores only strings. IndexedDB supports structured queries, larger payloads, and async access — necessary for task history and Jarvis conversation logs.

---

## Test Accounts

*(Fill in after first deploy with two real Firebase accounts)*

| Role | Email | Password |
|---|---|---|
| Manager | `manager@example.com` | *(set after deploy)* |
| Employee | `employee@example.com` | *(set after deploy)* |

---

## Roadmap

- [ ] Voice input / output for Jarvis (Web Speech API — Phase 8 skipped for stability)
- [ ] Mobile PWA with push notifications
- [ ] Jarvis on the Teams board (team-scoped context)
- [ ] Analytics dashboard for managers (task completion rates, burndown)
- [ ] Drag-and-drop Kanban reordering

---

## Credits

- UI patterns inspired by [Aceternity UI](https://ui.aceternity.com)
- Branding & colour palette — Licious
- AI powered by [Groq](https://groq.com) — Llama 4 Scout