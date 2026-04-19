# Simple Weight Tracker

A weight-logging app with a Next.js web app, Expo (React Native) Android app, and Supabase backend.

## Monorepo Structure

```
simple-weight-tracker/
├── apps/
│   ├── web/          # Next.js 14 (App Router, Tailwind CSS)
│   └── mobile/       # Expo SDK (React Native, NativeWind)
├── packages/
│   └── shared/       # Shared TypeScript types, Zod schemas, Supabase client
├── supabase/
│   └── migrations/   # SQL migration files applied to Supabase
├── package.json      # pnpm workspace root
└── turbo.json        # Turborepo pipeline config
```

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Expo CLI (`pnpm add -g expo-cli`)
- Supabase CLI (`brew install supabase/tap/supabase` or `scoop install supabase`)

## Running Locally

```bash
# Install all dependencies
pnpm install

# Run both web and mobile dev servers in parallel
pnpm dev

# Run web only
pnpm --filter web dev

# Run mobile only
pnpm --filter mobile start
```

Web runs at http://localhost:3000. Mobile opens Expo DevTools — scan QR code with Expo Go (Android) or press `a` to open Android emulator.

## Environment Variables

### Web (`apps/web/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Mobile (`apps/mobile/.env`)
```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Never commit `.env.local` or `.env` — they are gitignored.

## Supabase

### Apply migrations to a local Supabase instance
```bash
supabase start
supabase db push
```

### Apply migrations to production
```bash
supabase link --project-ref <project-ref>
supabase db push
```

### Reset local DB and re-apply migrations
```bash
supabase db reset
```

## Build Commands

```bash
pnpm build          # Build all apps and packages
pnpm lint           # Lint all workspaces
pnpm typecheck      # TypeScript check all workspaces
```

## Android Build (via EAS)

```bash
cd apps/mobile
eas build --platform android --profile preview   # APK for sideloading
eas build --platform android --profile production # AAB for Play Store
```

## Commit Message Style

Use concise imperative messages — one commit per logical unit of work:

```
Create charts feature
Implement weight log CRUD
Refactor auth middleware to use server actions
Use Zod schemas for shared form validation
Add RLS policies for weight_logs table
```

Do not use past tense ("Added", "Fixed") or ticket references in commit titles.

## Architecture Reference

Full implementation plan: `.claude/plans/we-are-creating-the-purring-sunrise.md`

Key decisions:
- **Auth**: Supabase Auth (email + password) with httpOnly cookies on web
- **Database**: `profiles` + `weight_logs` tables, RLS on both
- **Shared code**: Types, Zod schemas, and Supabase client live in `packages/shared`
- **Charts**: Recharts (web), Victory Native (mobile)
- **Calendar**: custom component (web), `react-native-calendars` (mobile)
