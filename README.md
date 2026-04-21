# Simple Weight Tracker

Track your weight over time with a web app and Android app, backed by Supabase.

## Features

- Log weight by date with optional notes
- Interactive chart with multiple time filters (7d, 30d, 90d, 1yr, year view, custom range)
- Period change card showing weight trend and percentage change
- Calendar view to browse and edit past entries
- History tab with entries grouped by week, filterable by date range
- CSV import and export
- Dark mode
- Android app with full feature parity

## Stack

| Layer | Web | Mobile |
|---|---|---|
| Framework | Next.js 14 (App Router) | Expo (React Native) |
| Styling | Tailwind CSS | NativeWind |
| Charts | Recharts | Victory Native |
| Auth + DB | Supabase | Supabase |
| Language | TypeScript | TypeScript |

## Monorepo Structure

```
simple-weight-tracker/
├── apps/
│   ├── web/          # Next.js 14
│   └── mobile/       # Expo / React Native
├── packages/
│   └── shared/       # Shared types, Zod schemas, Supabase client
├── supabase/
│   └── migrations/   # SQL migrations
├── package.json      # pnpm workspace root
└── turbo.json
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase project (free tier works)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

**Web** — create `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

**Mobile** — create `apps/mobile/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### 3. Apply database migrations

```bash
supabase link --project-ref <project-ref>
supabase db push
```

## Running Locally

```bash
# Web (http://localhost:3000)
pnpm --filter web dev

# Mobile (opens Expo DevTools)
pnpm --filter mobile start
```

## Building the Android APK

```bash
cd apps/mobile

# Bundle JS
node ../../node_modules/expo/bin/cli export:embed \
  --platform android --dev false \
  --entry-file index.ts \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

# Build APK
cd android && ./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

## Database Schema

```sql
profiles (id, name, created_at)
weight_logs (id, user_id, weight_kg, logged_at, notes, created_at, updated_at)
```

Row-level security enabled on both tables — users can only read and write their own data.
