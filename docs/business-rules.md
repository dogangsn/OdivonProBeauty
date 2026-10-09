# Business rules

Appointment creation validates active customer, branch service availability, staff competency and shift, then customer/staff/room/device overlap, contraindications, package balance and minimum session interval. Duration is service time plus five-minute preparation and recovery buffers. All overlap queries and the write execute with an idempotency key.

Completing an appointment is one Firestore transaction: create session and usage records, increment used and decrement remaining sessions, calculate next due date, consume service-recipe stock, accrue deferred package commission, update appointment state, schedule satisfaction notification and append audit records. A repeated key returns the previous result. No-show does not consume a session by default. Cancellation inside 24 hours is policy-controlled.

Package purchase creates deferred revenue. Usage requires an active, non-expired, non-frozen package and positive remaining balance. Freeze is limited to once and sixty days. Refundable value is based on unused sessions under the configured policy.

Cash must be open before payment. Split parts are separate payment records. Tips are excluded from commission. Refund creates a negative payment linked to the original and cannot exceed its remaining refundable amount. Service commission is accrued at payment; package commission at session use.

Session completion creates recipe-based `consumption` inventory transactions. Negative stock is rejected unless explicitly enabled. Falling to or below critical stock schedules manager push/email. Stock count records theoretical, physical and variance quantities.

Scheduled jobs cover 24-hour SMS, 2-hour push, one-hour satisfaction survey, package/session due reminders three days ahead, birthday at branch-local 10:00, 60/90-day recovery, critical stock and daily cash summary. Provider ports remain `not-configured` until secrets and a real adapter are supplied.
