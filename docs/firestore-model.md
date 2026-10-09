# Firestore model

Business collections live below `tenants/{tenantId}`: `beautyBranches`, `beautyStaff`, `beautyCustomers`, `beautyCustomerHealth`, `beautySkinAnalyses`, `beautyConsentForms`, `beautyServiceCategories`, `beautyServices`, `beautyServicePackages`, `beautyAppointments`, `beautyAppointmentServices`, `beautySessions`, `beautySessionNotes`, `beautyCustomerPackages`, `beautyPackageUsages`, `beautyDevices`, `beautyRooms`, `beautyPayments`, `beautyInvoices`, `beautyExpenses`, `beautyProducts`, `beautyInventoryTransactions`, `beautySuppliers`, `beautyCommissions`, `beautyShifts`, `beautyTimeOff`, `beautyReviews`, `beautyCampaigns`, `beautyCampaignLogs`, `beautyNotifications`, `beautyWaitlist`, `beautyMedia`, `beautySettings`, `beautyAuditLogs`, `beautyKvkkConsents`, `beautyCashShifts`, `beautyStockCounts` and `beautyIdempotency`.

Every mutable document has `id`, `tenantId`, `branchId` where applicable, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt`, `deletedBy` and `version`. Soft-deleted documents are excluded by default. Media records contain purpose, owner entity, content type, byte size, checksum, object path, upload state and retention class; business documents never expose `gs://` URLs directly.

```json
{
  "id": "apt_001", "tenantId": "tenant_01", "branchId": "br_01",
  "customerId": "cus_123", "staffId": "stf_45", "roomId": "room_02",
  "deviceId": "dev_laser_01", "serviceIds": ["svc_laser_leg"],
  "customerPackageId": "cpkg_001", "sessionNumber": 3,
  "startAt": "2026-10-15T14:00:00Z", "endAt": "2026-10-15T14:45:00Z",
  "status": "confirmed", "source": "online", "remindersSent": ["24h", "2h"],
  "createdAt": "2026-10-07T09:00:00Z", "createdBy": "usr_rec_01", "version": 1
}
```

Composite indexes include appointments by `(branchId,startAt)`, `(staffId,startAt)`, `(roomId,startAt)`, `(deviceId,startAt)`, `(customerId,startAt desc)` and `(status,startAt)`; packages by `(customerId,status)` and `(status,nextSessionDueAt)`; sessions by `(customerId,performedAt desc)` and `(customerPackageId,sessionNumber)`; payments by `(branchId,createdAt desc)` and `(customerId,createdAt desc)`; inventory by `(productId,createdAt desc)`; audit by `(entityType,entityId,createdAt desc)`.
