## Amineva Central Auth Suite — Identity & Authorization Redesign

### Problem (confirmed from current schema)
- `profiles` has no `app_id` and no unique constraint on `user_id` → first-record / shared-profile loads possible.
- No `applications` registry. No `user_app_access` table. Authorization is implicit (any authenticated user can land anywhere).
- `handle_new_user` trigger creates a single global profile per `auth.users` row → reused across every app.
- RLS on `profiles` is correct per-user but app scoping doesn't exist, so cross-app contamination cannot be prevented at the DB layer.
- Frontend `AuthContext` maps `supabase.auth.getUser()` directly with no app context, no access check, and no cache reset on account switch.

### Architecture (target)

```text
                ┌──────────────────────────┐
                │ Amineva Central Auth     │  (Supabase Auth — identity only)
                └──────────┬───────────────┘
                           │ JWT (user.id)
                           ▼
       ┌───────────────────────────────────────────┐
       │ Authorization Layer (user_app_access)     │
       │  user_id × app_id → role + permissions    │
       └──────────┬───────────────────────┬────────┘
                  │ allowed               │ denied
                  ▼                       ▼
        app-scoped profiles         /access-denied
        (profiles.user_id+app_id)
```

Authentication = global. Authorization = per-app. Profile = per (user, app).

### Database changes (single migration)

1. `applications` — registry
   - `id uuid pk`, `app_slug text unique`, `app_name`, `app_key text unique` (server-side identifier), `app_type`, `status`, timestamps
   - Seed: `agis`, `aminevaops`, `amniva` (extensible — future apps just INSERT a row)
   - RLS: public SELECT for active apps; writes service-role only

2. `user_app_access` — authorization
   - `id`, `user_id uuid` → auth.users, `app_id uuid` → applications, `role text`, `permissions jsonb default '{}'`, `active bool default true`, timestamps
   - UNIQUE (`user_id`, `app_id`)
   - RLS: user can SELECT their own rows; INSERT/UPDATE/DELETE service-role / admins only
   - SECURITY DEFINER fn `has_app_access(_user_id uuid, _app_slug text) returns boolean`

3. `profiles` — restructure for app isolation
   - Add `app_id uuid not null` (backfill: assign existing rows to a default "suite" app, or migrate to one row per existing app the user already used)
   - Drop old single-row uniqueness; add UNIQUE (`user_id`, `app_id`)
   - RLS rewrite: SELECT/UPDATE/INSERT only when `auth.uid() = user_id` AND `has_app_access(auth.uid(), app_slug_of(app_id))`
   - Remove `handle_new_user` auto-insert into a global profile (it caused the shared-dashboard bug). Replace with `ensure_app_profile(_app_slug)` SECURITY DEFINER fn called explicitly when a user is granted access to an app.

4. Triggers
   - `updated_at` triggers on new tables
   - On `user_app_access` INSERT (active=true): auto-create matching `profiles` row via `ensure_app_profile`

### Frontend changes

1. `src/core/auth/AppContext.ts` (new) — resolves "current app" from route/subdomain/env. Each app sets its `APP_SLUG` constant.
2. `src/contexts/AuthContext.tsx` — extend:
   - On every `SIGNED_IN` / `TOKEN_REFRESHED`: clear all in-memory caches (profile, dashboard) before rehydrating.
   - On `SIGNED_OUT`: wipe `localStorage`/`sessionStorage` keys under known prefixes; clear React Query cache.
   - Expose `currentApp`, `appAccess`, `appProfile`.
3. `src/lib/auth/appAccess.ts` (new) — `loadAppAccess(userId, appSlug)` → calls `has_app_access` + reads `user_app_access` row. Returns `{ allowed, role, permissions }`.
4. `src/lib/auth/appProfile.ts` (new) — `loadAppProfile(userId, appId)` strictly `eq('user_id', userId).eq('app_id', appId).maybeSingle()`. **No** `.limit(1)` first-record fallbacks anywhere.
5. `src/components/auth/AppAuthGate.tsx` (new) — wraps every protected route:
   1. Wait for auth
   2. Resolve current app
   3. `loadAppAccess`; if denied → `/access-denied`
   4. `loadAppProfile`; if missing and access exists → call `ensure_app_profile` then reload
6. Replace any `.from('profiles').select().limit(1)` / `.single()` without filters — audit & fix.
7. New page `src/pages/AccessDenied.tsx`.
8. Admin UI (Amineva Console): grid to grant/revoke `user_app_access` per (user, app, role).

### Session & cache hygiene

- Central `resetClientState()` util: clears React Query, Zustand stores, and any `coms_*` / `acs_*` / `suite_*` keys in storage.
- Called on: logout, account switch (detected by `user.id` change in `onAuthStateChange`), and access-denied redirect.

### Backfill strategy (safe, non-destructive)

- Create a synthetic `applications` row `suite` (the central hub).
- Backfill existing `profiles.app_id` → `suite`.
- For each existing `auth.users` row, INSERT `user_app_access(user_id, suite_app_id, role='user', active=true)` so no current user is locked out.
- Existing app-specific access (AGIS / AminevaOps / Amniva) starts EMPTY — admins must grant explicitly. This is the intended behaviour: it stops the "one login → all apps" leak immediately.

### Files to add / change

New
- `supabase/migrations/<ts>_central_auth_authz.sql`
- `src/core/auth/AppContext.ts`
- `src/lib/auth/appAccess.ts`
- `src/lib/auth/appProfile.ts`
- `src/lib/auth/resetClientState.ts`
- `src/components/auth/AppAuthGate.tsx`
- `src/pages/AccessDenied.tsx`
- `src/components/admin/UserAppAccessManager.tsx`

Edit
- `src/contexts/AuthContext.tsx` (state reset, app context plumbing)
- `src/App.tsx` (wrap routes in `AppAuthGate`, add `/access-denied`)
- `src/components/admin/AminevaConsole.tsx` (mount the access manager)
- Audit: `src/adapters/lovable/users.ts`, anything that reads `profiles` — switch to `loadAppProfile`.

### Verification checklist

- [ ] Two distinct emails → two distinct `profiles` rows per app; dashboards differ.
- [ ] User with access to AGIS only → AminevaOps redirects to `/access-denied`.
- [ ] Logout → `localStorage`/`sessionStorage` cleaned; next login starts cold.
- [ ] Account switch in same tab → no stale profile flash.
- [ ] New app enrollment = INSERT into `applications` + grant `user_app_access`. Zero code changes.
- [ ] Supabase linter passes; RLS enabled on every new table.

### Confirmation needed before I run the migration

This is a structural change that touches `profiles` and the signup trigger. I'll execute it as one migration with backfill so nobody is locked out, but please confirm:

1. **Default app for existing users** — should every current `auth.users` row receive `user_app_access` for the central `suite` app only (recommended), or also pre-grant AGIS/AminevaOps/Amniva to existing users to avoid manual provisioning?
2. **App slugs** — confirm `agis`, `aminevaops`, `amniva` (plus `suite` for the central hub). Any others to seed now?
3. **Admin role** — should `super_admin` / `manager` (existing roles in `user_metadata`) get an automatic blanket grant across all apps via `has_app_access` shortcut?

Reply with answers (or "go with recommended defaults") and I'll ship the migration + code in the next turn.
