# API and DTO contracts

All endpoints use `/api/v1/beauty`, Firebase bearer authentication unless marked public, and the envelope `{ success, data, meta: { requestId } }`. Lists use `cursor` and `limit`; timestamps are ISO-8601 UTC; money is integer minor units plus ISO currency.

## Resource groups

| Group | Routes |
|---|---|
| Auth/onboarding | `POST /auth/sync-user`, `POST /auth/logout`, `GET /auth/me`, `POST /onboarding` |
| Branches | CRUD `/branches` |
| Customers | CRUD `/customers`; `/history`, `/packages`, `/sessions`, `/consents`, `/health`, `/skin-analysis` |
| Appointments | CRUD `/appointments`; `/check-availability`, `/:id/status`, `/:id/reschedule`, `/:id/check-in`, `/:id/complete` |
| Sessions/packages | CRUD `/sessions`, `/packages`, `/customer-packages`; freeze, unfreeze and use-session commands |
| Catalog/resources | CRUD `/service-categories`, `/services`, `/devices`, `/rooms` |
| Staff | CRUD `/staff`; schedules, shifts, time-off, performance and commissions |
| Finance | `/payments`, refunds, `/invoices`, `/expenses`, cash-shift open/close and reconciliation |
| Inventory | CRUD `/products`, `/suppliers`; transactions, critical stock and stock-count commands |
| Engagement | CRUD `/campaigns`; send command, notifications, waitlist and provider status |
| Governance | reports, settings, roles, audit logs, KVKK export/delete requests |
| Portal/mobile | public catalog and availability; token/OTP appointment and account routes; role bootstrap |
| AI | `POST /ai/recommendations/preview`, `POST /ai/recommendations/:id/approve`, `GET /ai/provider-status` |

## Core DTO shapes

```ts
interface BranchScopedDto { branchId: string }
interface CursorQuery { cursor?: string; limit?: number }
interface CreateAppointmentDto extends BranchScopedDto {
  customerId: string; staffId: string; roomId?: string; deviceId?: string;
  serviceIds: string[]; customerPackageId?: string;
  startAt: string; idempotencyKey: string; notes?: string;
}
interface CompleteAppointmentDto extends BranchScopedDto {
  idempotencyKey: string; session: SessionInputDto;
  payments?: PaymentPartDto[];
}
interface RecommendationPreviewDto extends BranchScopedDto {
  customerId: string; skinAnalysisId?: string; goals: string[];
}
```

All command DTOs are validated with `class-validator`, transformed with `class-transformer` and described in Swagger. Unknown fields are rejected. Recommendation preview returns a provider status, contraindication warnings, evidence inputs and an approval token; it never calls a model in this delivery.

Provider ports share `configured`, `provider`, `capabilities` and `status` fields. SMS, WhatsApp, email, payments, e-invoice and AI default to `not-configured` and cannot perform an external call.
