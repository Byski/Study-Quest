# Study Quest

Study planning application with role-based dashboards for students and educators. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

---

## Features

- **Role-based dashboards** — separate views for students and educators
- **Course management** — create and manage courses
- **Assignment tracking** — calendar-based assignment views with full detail pages
- **Notifications** — in-app notification system
- **Auth** — Supabase-backed registration and sign-in

## Stack

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Supabase (auth + database)
- Jest · React Testing Library

---

## Setup

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
# http://localhost:3000
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
app/
  auth/               # Login + registration
  dashboard/[type]/   # Role-based dashboards (student / educator)
  courses/            # Course management
  assignments/        # Assignments, calendar, detail pages
components/           # Shared UI components
lib/                  # Supabase client + utilities
__tests__/            # Jest + React Testing Library suite
```
