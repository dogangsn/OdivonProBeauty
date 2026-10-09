# Testing, CI and operations

MainApi uses Jest unit tests for pure rules and services, Supertest plus Firebase Emulator for integration, and explicit suites for tenant isolation, role/row permissions, transaction retries and idempotency. Angular uses Vitest for zoneless components/services and Playwright for role journeys. Flutter uses unit/widget tests for repositories, state and role routing.

Acceptance paths cover onboarding; all appointment conflict dimensions; package purchase and atomic session completion; open cash, split payment, refund and close variance; health access denial; KVKK export/anonymization and audit; phone OTP portal; mobile role shells; and provider/AI `not-configured` behavior.

GitHub Actions run dependency installation, tests and production builds on pull requests and `main`. Mobile CI uploads an Android debug APK. No workflow deploys Firebase Hosting or production services.

Environments are `dev`, `staging` and `prod` with distinct Firebase configuration supplied by secret stores. MainApi is container-ready for Cloud Run or an equivalent host. Daily Firestore exports, point-in-time recovery policy, audit retention, key rotation and restore drills are operational requirements. Never place service account JSON, API keys or `.env` files in source control.
