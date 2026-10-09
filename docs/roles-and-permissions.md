# Roles and permissions

Legend: `CRUD` full lifecycle, `CRU` no hard delete, `R` read, `Own` row-level own records, `-` denied. Delete operations are generally soft-delete commands.

| Resource | Owner | Admin | Manager | Receptionist | Specialist | Cashier | Customer | Auditor |
|---|---|---|---|---|---|---|---|---|
| Branch/settings/roles | CRUD | CRU | R | R | R | R | - | R |
| Staff/shifts/time-off | CRUD | CRUD | CRUD | R | Own | R | - | R |
| Services/packages | CRUD | CRUD | CRU | R | R | R | R | R |
| Customers | CRUD | CRUD | CRU | CRU | Own | R | Own | R |
| Health/skin/consent | CRUD | CRUD | CRU | consent only | Own CRU | - | Own CRU | R audited |
| Appointments | CRUD | CRUD | CRUD | CRUD | Own CRU | R | Own CRU | R |
| Sessions/notes | CRUD | CRUD | CRUD | R | Own CRU | R | Own R | R |
| Payments/invoices/cash | CRUD | CRUD | CRUD | CRU | R | CRUD | Own R | R |
| Inventory/suppliers | CRUD | CRUD | CRUD | R | consumption | R | - | R |
| Campaigns/notifications | CRUD | CRUD | CRUD | CRU | Own R | R | Own R | R |
| Reports/commissions | CRUD | R | R | limited R | Own R | cash R | Own R | R |
| Audit/KVKK | CRUD | CRU | R | request | Own R | - | Own request | R |

Authorization is product-scoped to `beauty`. Specialist queries are constrained to their `staffId`; customer queries to the linked `customerId`. A client-supplied tenant or actor identifier is never trusted. Health access creates a read-access audit event in addition to normal write audits.
