# Copilot instructions for this repo

These rules help AI coding agents be productive in this codebase right away. Keep responses concise, cite concrete files, and follow the repo’s conventions.

## What this project is
- Next.js 15 app (App Router) with TypeScript, Tailwind (shadcn/ui), and Firebase.
- Domain: simple payments dashboard (PesiX) with mocked payment APIs (M-Pesa STK/C2B, Card) and Firestore-backed data (users, payoutAccounts, paymentLinks, transactions).
- AI: Genkit configured with Gemini via `src/ai/genkit.ts` and optional dev runner in `src/ai/dev.ts`.

## Key architecture and flows
- Entrypoint/layout: `src/app/layout.tsx` wires ThemeProvider, AuthProvider, and Toaster. Root page (`src/app/page.tsx`) immediately redirects to `/login`.
- Auth:
  - Firebase Auth initialized in `src/lib/firebase.ts`; context in `src/contexts/auth-context.tsx` exposes `{ user, loading, initialLoadComplete }` and creates a minimal Firestore user doc if missing.
  - Email/password login at `src/app/login/page.tsx` and signup at `src/app/signup/page.tsx`; Google sign-in via redirect. Signup writes `users/{uid}` with `themePreference: 'system'`.
- Theme persistence:
  - `src/contexts/theme-provider.tsx` syncs a `themePreference` field on the user document with localStorage and DOM class `dark`. Public `setTheme(theme)` updates Firestore and local state.
- Dashboard shell:
  - `src/app/dashboard/layout.tsx` protects routes (redirects unauthenticated to `/login`), renders `MainSidebar` (`src/components/dashboard/main-sidebar.tsx`) and page content (children).
- Data model (see `src/lib/types.ts`): `UserProfile`, `PayoutAccount`, `PaymentLink`, `Transaction`, plus `PublicPaymentLinkDetails`/`PaymentOutcomeDetails` for public pages.
- Mock payment APIs (Next.js Route Handlers):
  - `src/app/api/mpesa/initiate-payment/route.ts` (STK push simulation)
  - `src/app/api/mpesa/confirm-c2b/route.ts` (C2B confirmation simulation)
  - `src/app/api/card/authorize-payment/route.ts` (card authorization simulation)
- Seed data utilities: `src/lib/seed.ts` (server action) and UI trigger `src/components/dashboard/seed-data-dialog.tsx`. It clears and re-seeds collections for the current user with realistic dummy data.

## Conventions and patterns
- Path aliases via tsconfig: use `@/...` imports (e.g., `@/lib/firebase`). Do not use relative traversal for app code.
- Client vs server:
  - Mark client components/files that access browser APIs or React hooks with "use client". Most dashboard components are client.
  - API route handlers in `src/app/api/**/route.ts` are server by default.
  - `src/lib/seed.ts` is a server action (`'use server'`) and runs on the server; call from client components by invoking the exported function.
- Styling: Tailwind with CSS variables; dark mode toggled by `html.dark` (see `tailwind.config.ts` and `src/app/globals.css`). Use `cn` from `@/lib/utils` to compose classes.
- UI library: shadcn/ui components live in `src/components/ui/**`. Reuse them—don’t reimplement primitives.
- Auth guard: In dashboard layouts/pages, always respect `initialLoadComplete` before redirecting based on `user`.
- Firestore shape: Collections `users`, `payoutAccounts`, `paymentLinks`, `transactions`. When creating docs, prefer serverTimestamp() for times and keep numeric money as numbers in Firestore.

## Local development
- Install and run:
  - Dev server: `npm run dev` (Next.js on port 9002; `allowedDevOrigins` configured in `next.config.ts`).
  - Type check: `npm run typecheck` (tsc), lint: `npm run lint`, build: `npm run build`.
  - Genkit local: `npm run genkit:dev` or `npm run genkit:watch` for AI flows.
- Required env vars (Firebase web config) consumed in `src/lib/firebase.ts`:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`.
- First run tips:
  - Sign up via `/signup` or Google from `/login`. Firestore rules must allow authenticated reads/writes for the referenced collections during development.
  - If the UI looks unstyled, ensure Tailwind content globs in `tailwind.config.ts` include your paths and the dev server was restarted after edits.

## How to extend safely (examples)
- Add a dashboard page: create `src/app/dashboard/<slug>/page.tsx` and it will inherit the protected layout. Use data types from `@/lib/types` and UI from `@/components/ui`.
- Add an API endpoint: create `src/app/api/<segment>/route.ts` and return `NextResponse.json(...)`. For mocked payments, follow the patterns and response shapes used in the existing mock routes.
- Persist user prefs: read/write from `users/{uid}` and keep `themePreference` synchronized via `ThemeProvider.setTheme`.
- Seeding: call `seedFirestoreData(user.uid, counts)` from a client component (see `seed-data-dialog.tsx`). It chunks Firestore batch writes within limits.

## Mocks vs real provider (how to swap)
- Mocks (default local flows):
  - M-Pesa STK: `src/app/api/mpesa/initiate-payment/route.ts`
  - M-Pesa C2B confirm: `src/app/api/mpesa/confirm-c2b/route.ts`
  - Card authorize: `src/app/api/card/authorize-payment/route.ts`
  - Use these for demos and local dev when no external provider is configured.
- Real provider (Furp):
  - Adapter: `src/lib/providers/furp.ts` (handles auth, rate validation, initiation, status mapping).
  - Initiate collections: `POST /api/collections/initiate` (see `src/app/api/collections/initiate/route.ts`). It creates a local transaction first, then calls Furp, returning `paymentUrl` for redirect.
  - Webhook: `POST /api/collections/webhook` updates our local transaction status from provider callbacks.
  - Configure env: set `FURP_*` vars in `.env` and a public `NEXT_PUBLIC_BASE_URL` for webhook URLs. See `.env.example`.
  - Swap guideline: Prefer using `/api/collections/initiate` in app flows when `FURP_API_KEY` is set; otherwise, use the mock endpoints. Keep Firestore as the system of record and store `provider`/`providerReference` only as optional linkage.

## Notifications (use Sonner)
- Use Sonner for all end-user notifications and keep copy friendly and actionable.
- Library: `sonner` (install if missing). In `src/app/layout.tsx`, render Sonner’s `<Toaster />` near the root. Prefer `import { toast } from 'sonner'` for notifications.
- Message patterns:
  - Success: “Payment link created” with a short next-step (“Copy link to share”).
  - Progress: “Seeding data… this may take ~10s” with optimistic updates.
  - Error: Human-friendly reason and a suggested fix (“Could not authorize card. Please verify card details or try another method.”).
- For legacy pages using shadcn toasts via `useToast`, prefer new code to use Sonner; migrate old toasts opportunistically.

## Gotchas and edge cases
- Don’t reference `window` or `localStorage` outside client components; ThemeProvider guards for SSR.
- Always gate redirects on `initialLoadComplete` to avoid flicker loops.
- Firestore batch limit is handled (490 ops per commit). If you add more collections to seed, keep limits in mind.
- When changing Tailwind tokens (CSS variables), update `globals.css` and verify dark mode against `html.dark`.

## File map to remember
- Firebase/Types: `src/lib/firebase.ts`, `src/lib/types.ts`
- Contexts: `src/contexts/auth-context.tsx`, `src/contexts/theme-provider.tsx`
- Dashboard shell: `src/app/dashboard/layout.tsx`, `src/components/dashboard/main-sidebar.tsx`
- Seed: `src/lib/seed.ts`, `src/components/dashboard/seed-data-dialog.tsx`
- Mock APIs: `src/app/api/**/route.ts`
- AI setup: `src/ai/genkit.ts`, `src/ai/dev.ts`

If anything above is unclear or missing, ask for the specific workflow you’re targeting (e.g., deployment, Firestore rules), and we’ll add it.