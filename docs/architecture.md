# Architecture

## Runtime topology

```text
Angular PWA / Flutter
  -> Firebase Authentication (sign-in only)
  -> HTTPS + Authorization: Bearer <Firebase-ID-token>
MainApi /api/v1/beauty
  -> tenant and branch authorization
  -> Firestore transactions, Admin Storage, FCM
Firebase project: odivon-main-api-a2095
```

The web app is standalone Angular with strict TypeScript, lazy feature routes, signals, Signal Forms, functional guards/interceptors and a service-worker shell. Reads use typed signal resources; writes use the typed API client. Business data and media never bypass MainApi.

MainApi resolves the tenant from `users/{uid}` and then scopes each query to `tenants/{tenantId}`. Branch-aware operations require `branchId` and validate membership. The shared root `users` and `tenants` documents remain authoritative; product data uses `beauty`-prefixed tenant subcollections.

## Web boundaries

- `core`: auth, API, guards, interceptors, models and app-wide state.
- `shared`: presentation primitives, utilities, badges, KPI cards and drawers.
- `layout`: responsive shell, sidebar and top bar.
- `features`: lazy domain slices for dashboard, appointments, CRM, sessions, catalog, resources, staff, finance, inventory, campaigns, reports, settings, AI and portal.
- `public/i18n`: Turkish default and English secondary translations.

Offline caching is deliberately limited to the application shell and a minimum appointment-summary response. Health, finance, media and mutations are excluded.

## Security and privacy

Firestore and Storage rules deny every client read and write. MainApi uses Firebase Admin SDK. Critical writes include actor, role, IP, user-agent, request ID, branch, before/after and timestamp audit data. Health data has a separate permission boundary. Deletion requests anonymize regulated business records rather than breaking accounting/audit chains.
