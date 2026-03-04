# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # ESLint
```

There are no tests configured.

## Architecture

This is a **Next.js 16 App Router** dashboard for Meta Ads analytics. It is admin-only, gated by Supabase Auth + role-based access control.

### Auth & Access Control

- **`proxy.ts`** (root) — replaces Next.js `middleware.ts`. Runs on every request, checks Supabase session and queries `public.profiles` for `role = 'admin'`. Uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) for the profiles lookup.
- **`app/auth/callback/route.ts`** — handles OAuth code exchange after email verification.
- Non-admins are redirected to `/unauthorized`. The unauthorized page calls `supabase.auth.signOut()` before navigating to `/login` to avoid a redirect loop.
- Two Supabase clients exist: `app/lib/supabase/server.ts` (cookie-based, SSR) and `app/lib/supabase/client.ts` (browser).

### Core Data Flow

1. User uploads a Meta Ads CSV → `app/lib/csvParser.ts` parses it and calculates derived metrics (CPLI, CTR, CPM) and assigns actions ("Escalar", "Optimizar", "Pausar HOY", "Estable").
2. Results are passed to `app/components/DashboardApp.tsx`, the main stateful container.
3. From there: `Sidebar` (campaign list) → `DashboardContent` / `ChartsSection` (Chart.js visualizations).

### AI Integration

- `app/api/claude/route.ts` — server-side API route that calls the Anthropic SDK with campaign data and returns a structured audit report.
- `app/lib/claude.ts` — client-side wrapper that calls `/api/claude`.
- `ApiKeyModal.tsx` — allows the user to provide their own Anthropic API key, stored in `localStorage`.

### PDF Export

Two modes in `DashboardApp.tsx`:
- **Visual PDF** — `html2canvas` screenshot of the dashboard. Tailwind v4 uses `lab()`/`oklch()` colors that `html2canvas` can't parse, so colors are stripped before capture.
- **Audit PDF** — `jsPDF` renders the AI-generated text report with multi-page support.

### State & Theming

- All state lives in React hooks inside `DashboardApp.tsx` (no Redux/Zustand).
- Dark/light theme toggled via CSS class, persisted to `localStorage` as `proy_theme`.

## Environment Variables

| Variable | Used in |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Both client and server Supabase clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both client and server Supabase clients |
| `SUPABASE_SERVICE_ROLE_KEY` | `proxy.ts` only — never expose to client |
| `ANTHROPIC_API_KEY` | `app/api/claude/route.ts` only |

## Key Constraints

- `proxy.ts` must export a function named `proxy` (not `middleware`) — Vercel requires this and will fail the build if `middleware.ts` also exists.
- The `profiles` table in Supabase must have a row per user with `role = 'admin'`; a missing row causes redirect to `/unauthorized`.
