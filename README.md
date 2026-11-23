# Friction — Campus Issue Intelligence

**Friction** is a spatial campus issue reporting, peer-validation, and facilities triage platform built for university campuses (configured for **IGDTUW**). It connects students and campus administrators through a structured feedback loop: students pin issues to exact buildings and rooms, peers confirm shared disruptions in one tap, duplicate reports are automatically clustered in the backend, and facilities teams triage by clear priority tiers and interactive analytics.

---

## Key Features

### Student Portal
- **Privacy-First Landing Page**: Introduces the platform workflow, transparent priority tiers, and role-based portal entry without exposing live complaint records to unauthenticated visitors.
- **Home Dashboard**: Live status KPIs, campus resolution progress bar, top **Campus Friction Hotspots** (first 4 with expand toggle), and **Recent Campus Reports** (first 4 with expand toggle) with one-tap *"I'm experiencing this too"* peer confirmation.
- **Interactive Campus Map**: Powered by **Leaflet** and **OpenStreetMap**, allowing students to inspect building hotspots, filter by category/severity/status, or click anywhere on the map to drop a reverse-geocoded pin and prefill a report.
- **Structured Issue Reporting**: Guided submission form with real-time duplicate similarity detection, rolling 24-hour anti-spam allowance tracking, impact severity selection, and optional real photo evidence upload (stored in Supabase Storage in production mode).
- **My Reports & Notifications**: Track submission status (`Pending Review`, `Published`, `In Progress`, `Needs Clarification`, `Resolved`, `Rejected`), respond to admin clarification requests inline, flag inaccurate reports, and view timeline updates.

### Campus Administration
- **Operations Overview (Visual Analytics)**:
  - **Highest-Priority Campus Issues**: Interactive priority-ranked horizontal stacked bar chart comparing report volume and peer confirmations.
  - **Category Share**: Interactive SVG donut chart breaking down reports across 9 campus domains.
  - **Building Friction Pressure**: Zone coverage donut and clickable building pressure bars that jump directly to the corresponding building in **Campus Map View**.
  - **Resolution Pipeline & Severity Mix**: Segmented lifecycle distribution and severity breakdown cards, plus recent campus audit activity.
- **Automatic Backend Grouping**: Incoming submissions are automatically clustered against open canonical reports in the same building and category using similarity scoring (PostgreSQL `pg_trgm` triggers in Supabase mode; token/trigram/room matching in demo mode), eliminating manual duplicate-merging workflows.
- **Moderation & Flag Queues**: Verify pending submissions, calibrate impact severity, request clarifications, post official admin notes, review community flags, manage daily report quotas, edit content-check rules, and enforce progressive abuse strikes.
- **Role-Scoped Campus Map View**: Administrators can inspect hotspots, review localized issues, and place or reposition building coordinates (`Place pin` / `Move pin`) without student complaint-submission clutter.

---

## Priority Tiers

Rather than exposing opaque numeric scores to users, Friction translates report volume, peer confirmations, and impact severity internally into four clear triage tiers:

| Tier | Description |
| :--- | :--- |
| **Critical Priority** | Immediate safety hazards, accessibility barriers, or high-volume essential utility outages. |
| **High Priority** | Disruptive issues backed by multiple peer confirmations across classes or labs. |
| **Medium Priority** | Ongoing facility problems affecting daily routines with partial workarounds. |
| **Low Priority** | Localized minor inconveniences queued for routine maintenance rounds. |

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Mapping & Geocoding**: Leaflet (`leaflet`), OpenStreetMap tiles, Nominatim reverse geocoding
- **Backend & Auth (Optional / Production)**: Supabase (Google OAuth, PostgreSQL + `pg_trgm`, Row Level Security, Storage bucket `issue-photos`)
- **Offline / Demo Persistence**: `localStorage` fallback with instant Student / Admin persona switching when Supabase env vars are not set

---

## Project Structure

```text
├── public/
│   └── assets/                  # Brand mark and static public assets
├── src/
│   ├── assets/images/           # Bundled hero illustration
│   ├── components/
│   │   ├── BrandLogo.tsx        # Symbol + Friction wordmark component
│   │   ├── CampusMap.tsx        # Leaflet interactive map & building inspector
│   │   ├── Charts.tsx           # Priority bars, donut charts, pipeline & badges
│   │   └── LandingPage.tsx      # Public landing page & portal entry
│   ├── domain/
│   │   └── friction.ts          # Domain models, seed data, priority tiers & auto-grouping
│   ├── lib/
│   │   ├── remoteStore.ts       # Supabase queries, RPC calls & photo uploads
│   │   └── supabase.ts          # Supabase client initialization
│   ├── auth.tsx                 # AuthProvider, Google OAuth & AccountMenu
│   ├── App.tsx                  # Sidebar workspace shell, student & admin views
│   ├── index.css                # Tailwind entrypoint & theme tokens
│   └── main.tsx                 # React entrypoint
├── supabase/
│   └── schema.sql               # Postgres schema, RLS policies, pg_trgm triggers & storage
├── .env.example                 # Environment variable template
├── TESTING.md                   # End-to-end acceptance test checklist
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### 1. Run Locally (Demo Mode)
Without environment variables, Friction runs in **Demo Mode** backed by `localStorage` with a built-in Student / Admin persona switcher in the sidebar footer.

```bash
npm install
npm run dev
```

The development server runs on **`http://localhost:3000`**.

### 2. Build for Production

```bash
npm run build
npm run preview
```

---

## Supabase & Google OAuth Setup (Production Mode)

1. **Create a Supabase Project**
   - Open **Project Settings → API** and copy your **Project URL** and **anon/public key**.
   - Create `.env.local` from `.env.example`:
     ```bash
     cp .env.example .env.local
     ```
     Fill in:
     ```env
     VITE_SUPABASE_URL=https://your-project-ref.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

2. **Initialize the Database**
   - Open the **Supabase SQL Editor**, paste the contents of `supabase/schema.sql`, and run it (idempotent / safe to re-run).
   - This provisions tables (`profiles`, `app_settings`, `buildings`, `issues`, `confirmations`, `flags`, `admin_notes`, `audit_log`, `notifications`), Row Level Security policies, `pg_trgm` auto-grouping & moderation triggers, and the public `issue-photos` storage bucket.

3. **Configure Google Cloud OAuth**
   - In [Google Cloud Console](https://console.cloud.google.com/), configure the **OAuth consent screen** (add test users if in Testing mode).
   - Create an **OAuth Client ID** (**Web application**):
     - **Authorized JavaScript origins**: `http://localhost:3000` and your deployed app URL
     - **Authorized redirect URI**: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`

4. **Enable Google Provider in Supabase**
   - **Authentication → Providers → Google**: enable and enter your Client ID and Client Secret.
   - **Authentication → URL Configuration**: set your Site URL and add `http://localhost:3000/**` and your deployed URL under Redirect URLs.

5. **Promote an Administrator Account**
   - Sign in once via Google, then run in the Supabase SQL Editor:
     ```sql
     update public.profiles
     set role = 'admin'
     where email = 'you@example.com';
     ```

---

## Database-Enforced Integrity Rules

In Supabase mode, rules are enforced directly at the database level via PostgreSQL triggers and RLS policies:
- **Anti-Spam Rate Limit**: Configurable max reports per rolling 24 hours per student (`app_settings.daily_report_limit`, default `3`).
- **One-Tap Peer Confirmation**: One confirmation per user per issue; reporters cannot confirm their own submission.
- **Automatic Similarity Clustering**: `issues_before_insert` / `issues_after_insert` triggers use `pg_trgm` text similarity within the same `building_id` and `category` to link duplicates (`>= 0.62`) or related observations (`0.35–0.62`) automatically.
- **Auto-Moderation & Flagging**: Submissions with links, blocked words, gibberish, or active account strikes are held for review; reaching the open-flag threshold moves published reports to `Flagged` without deleting records.
- **Strict Role Access Control**: Only administrators can modify issue status, severity, official notes, building coordinates, or account restrictions (`record_abuse` / `lift_restriction`).
- **Audit & Notification Trail**: Every status, severity, auto-grouping, and confirmation event is logged to `audit_log` and generates reporter notifications.

---

## Testing

See [`TESTING.md`](./TESTING.md) for a step-by-step verification checklist covering student reporting, peer confirmation, map pinning, moderation queues, abuse enforcement, and auto-grouping.
