# Switch Bridge — secure billing integration

**Short name:** Switch Bridge  
**Status:** Integration foundation and contract; production endpoints are not enabled by this change.

## Purpose

Switch is the unified billing visibility and management layer for Amineva Global. It is not a replacement payment gateway and does not take over the payment backends of Inventra, DataLens, SikaSem or other applications.

Each product remains authoritative for its own:
- payment-provider connection and checkout;
- provider-side transaction verification;
- invoice and subscription lifecycle;
- refunds, reversals and chargebacks;
- product access and entitlement decisions.

Switch receives a minimal, standardised copy of billing facts so a customer or authorised organisation member can monitor billing across products.

## Integration topology

`Product backend → authenticated Switch ingestion API → event inbox/idempotency ledger → central billing read model → Switch dashboard`

Products must communicate from trusted server environments. Browser applications must never hold application integration secrets or send authoritative payment events directly.

## Event delivery

Use HTTPS webhooks for near-real-time updates and a server-to-server reconciliation API for recovery. The initial event vocabulary is:

- `invoice.created`, `invoice.updated`
- `payment.succeeded`, `payment.failed`, `payment.refunded`
- `subscription.created`, `subscription.updated`, `subscription.cancelled`, `subscription.expired`

The TypeScript/Zod contract is in `src/core/billing/switchBridge.ts`. It validates the event envelope and common fields. It does not authenticate the sender or verify a payment.

### Required delivery controls

1. Register each product as a distinct integration client.
2. Issue a separate secret per product and environment; store it only in the product backend's secret manager.
3. Sign the exact raw request body with HMAC-SHA256 and include a timestamp and key identifier in request headers.
4. Reject stale timestamps, invalid signatures, unknown/revoked clients and unsupported schema versions.
5. Enforce a unique constraint on `(application_id, event_id)`; duplicate delivery must return an idempotent acknowledgement without duplicating a financial record.
6. Persist the event to a durable inbox before acknowledging it; process asynchronously with retry and dead-letter handling.
7. Keep an append-only audit trail of sender, event ID, received time, processing outcome and correlation ID.
8. Reconcile periodically using the originating product's server-to-server API. Webhooks are notifications, not the only source of truth.

Suggested headers:
- `X-Amineva-Application`: registered application ID
- `X-Amineva-Key-Id`: active signing key identifier
- `X-Amineva-Timestamp`: Unix timestamp in seconds
- `X-Amineva-Signature`: `v1=<hex HMAC-SHA256>`

The signature input should be the timestamp, a period, and the exact raw body bytes: `<timestamp>.<raw-body>`. Compare signatures in constant time. Support key rotation by allowing a short overlap between active and retiring keys.

## Canonical event envelope

All amounts use integer minor units and an explicit ISO 4217 currency. Never use floating point for money. The `resource.external_id` and optional invoice/subscription/transaction references point back to the originating product's records.

Example only:

```json
{
  "schema_version": "1.0",
  "event_id": "evt_01J...",
  "event_type": "payment.succeeded",
  "application_id": "app_inventra",
  "occurred_at": "2026-11-15T10:30:00Z",
  "customer": {
    "external_customer_id": "inv_customer_104",
    "amineva_customer_id": "amv_customer_208",
    "account_type": "organization"
  },
  "resource": {
    "external_id": "txn_8042",
    "invoice_id": "inv_2026_0042",
    "transaction_id": "txn_8042"
  },
  "money": {
    "amount_minor": 45000,
    "currency": "GHS"
  },
  "status": "paid"
}
```

## Trust and authority rules

- A product emits `payment.succeeded` only after its backend has independently verified the provider transaction, including provider reference, expected amount, currency and final status.
- Switch must not infer payment success from a browser redirect, screenshot, client-side callback or an unverified provider reference.
- Switch must not create product access entitlements merely because an event arrived. The originating application remains authoritative for its own access decision.
- A Switch cancellation/refund action is a request routed to the originating application. The application performs the action and reports the resulting state.
- Switch's billing read model is a projection, not the financial system of record. Preserve source application IDs and source record IDs on every record.
- Never transmit card PAN, CVV, Mobile Money PINs, bank credentials, provider secret keys or unnecessary full provider payloads.
- Use customer identity mappings; never merge accounts solely because email addresses match.
- Organisation-level visibility must be checked against current membership and billing roles, not just a client-side filter.

## Minimum central records

The central service should maintain:
- application registry and active signing key IDs;
- external customer identity mappings;
- billing accounts and organisation access grants;
- invoice read models;
- payment/transaction read models;
- subscription read models;
- event inbox/idempotency records;
- reconciliation checkpoints and audit records.

Store amounts as integer minor units with ISO currency. Retain source timestamps and Switch receipt/processing timestamps separately.

## Product-specific treatment

| Product | Source remains authoritative for | Switch receives |
|---|---|---|
| Inventra | Its own checkout, sales invoices, payments and any subscription lifecycle | Invoice/payment/subscription status and references |
| DataLens | Service request, quotation, acceptance, invoice and verified payment | Quote/invoice lifecycle and payment status; do not invent recurring subscriptions |
| SikaSem | Its own financial operations and any approved product subscription | Relevant product subscription/invoice/payment facts only; never customer financial-operation ledger data |
| Other products | Their own commercial and payment logic | Only approved billing facts using this contract |

Do not assume every product is subscription-based. Product catalogue and commercial model must be explicitly approved before a paid price or entitlement is created.

## Implementation sequence

1. **Contract (this change):** shared event schema, naming and security rules.
2. **Central ingestion service:** choose and confirm the production backend, add client registry, signing-key management, durable inbox, idempotency and read-model persistence.
3. **Read API:** expose authenticated, account-scoped invoice, transaction and subscription queries to Switch.
4. **Dashboard:** replace placeholder billing copy with real empty/loading/error/data states backed by the read API.
5. **First connector:** integrate one product in a test environment; verify signature failure, replay, duplicate delivery, delayed delivery, amount/currency mismatch and reconciliation.
6. **Rollout:** onboard DataLens, Inventra, SikaSem and other products individually after security and access-isolation tests.

## Deployment gate

This repository currently documents multiple backend options and a provider-neutral billing design. Do not deploy a webhook receiver or apply billing tables to a live database until the production identity/database authority, hosting target, secret storage, existing schema and operational owners are confirmed. This change intentionally does not invent credentials, connect payment providers, migrate product databases or claim that live billing data is available.
