# Production payment architecture

## Boundaries

`IPaymentProvider` is the outbound port. `RazorpayClientService` is its only Razorpay adapter; application services never depend on Razorpay response types or credentials. `IPaymentService` and `IPaymentWebhookService` are inbound application ports and controllers contain no business rules. Prisma models are persistence adapters for the domain records.

The module remains inside the modular monolith so booking and payment changes can share PostgreSQL transactions. It can later be extracted because provider and application boundaries are explicit.

## Data and state

Internal primary keys, opaque public references, and provider IDs are separate. Amounts sent to providers are integer minor units. Existing `Transaction` is the booking-level ledger summary; `PaymentOrder`, `PaymentQrCode`, and append-only `PaymentAttempt` retain provider history. Plans, subscriptions, mandates, refunds, webhook inbox records, idempotency leases, and audit logs are normalized independently.

State machines permit only explicit transitions. Optimistic `version` columns and conditional updates protect concurrent webhook/API processing. Unique provider IDs, receipts, webhook event IDs, and owner/operation/idempotency hashes prevent duplicate financial effects.

## Reliability model

Order creation is recorded as `CREATING` before the provider call. A unique receipt permits operational reconciliation after ambiguous network/database failures. Webhooks are verified over exact raw bytes, persisted before acknowledgement, then processed by BullMQ with exponential retries. Duplicate delivery returns success without reprocessing. Payment amount, currency, order, and ownership are checked before any booking transition.

Webhook delivery is the normal synchronization path. The recurring reconciliation worker expires stale orders and QRs in bounded batches. Manual reconciliation is authenticated and only fetches a provider payment when a known local attempt requires it.

## Security

Required secrets are `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Optional settings are `RAZORPAY_BASE_URL` and `RAZORPAY_TIMEOUT_MS`. Secrets remain in environment-backed configuration and are never returned or logged. Signatures use HMAC-SHA256 and constant-time comparison. Provider calls have bounded timeouts and return stable, non-sensitive errors. New client APIs return public references only.

Configure Razorpay to send webhooks to `POST /api/v1/webhooks/razorpay`. Preserve the `X-Razorpay-Signature` and `X-Razorpay-Event-Id` headers. Terminate TLS at a trusted proxy and restrict request bodies to the application limit.

## API

- `POST /api/v1/payments` requires authentication and `Idempotency-Key`.
- `GET /api/v1/payments/:reference` reads local state.
- `DELETE /api/v1/payments/:reference` closes an active QR and cancels locally.
- `POST /api/v1/payments/:reference/reconcile` performs an authenticated repair check.
- `POST /api/v1/payments/subscriptions/weekly` requires authentication and `Idempotency-Key`.
- `PATCH /api/v1/payments/subscriptions/:reference` accepts pause, resume, or cancel.

The legacy signature-verification route remains temporarily for compatibility. It should be removed after clients migrate because webhook-confirmed state is authoritative.

## Deployment and operations

Apply migration `20260728000100_production_payment_module` before deploying application code. PostgreSQL must support `gen_random_uuid()` (native in supported PostgreSQL releases). Redis must use durable production configuration because BullMQ holds processing retries.

Alert on webhook `FAILED` counts, queue age, provider timeout rate, orders stuck in `CREATING`, reconciliation mismatches, and subscriptions in `HALTED`. Never put raw payloads or credentials in application logs; persisted webhook payload access should be restricted to finance/incident roles and follow the retention policy.

## Testing strategy

Unit-test every state transition and provider adapter validator. Application-service tests should mock `IPaymentProvider` and Prisma transaction behavior for duplicate idempotency keys, provider timeout after order creation, QR partial failure, amount mismatch, and concurrent capture events. Integration tests should use PostgreSQL and Redis containers to prove uniqueness and queue retry behavior. Contract tests should replay sanitized Razorpay fixtures. E2E tests should cover authentication/authorization, response schemas, invalid signatures, duplicate event IDs, booking confirmation, subscription lifecycle, and cancellation. Run reconciliation and webhook concurrency tests before every payment release; use Razorpay test mode for smoke tests, never production credentials in CI.