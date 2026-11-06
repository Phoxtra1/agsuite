# Amineva ID and Central Billing — schema design

**Status:** Design specification only. This file does not create tables or apply migrations.  
**Target:** The Amineva Global Supabase project, after its identity, current schema and migration history are confirmed.

## 1. Design rules

- Use Supabase Auth as the central authentication authority once the project connection is confirmed.
- Support verified email or phone registration.
- A user has an individual account and may also create or join one or more organisation accounts.
- An organisation is an account/customer in its own right, not merely a renamed user profile.
- Keep product-specific records in their current product backends during the initial rollout.
- Map existing product identities to Amineva ID; do not force-merge or delete existing accounts.
- Central billing records customer identity, invoices, transactions, subscriptions and product entitlements. It does not need to store each product's operational data.
- Use integer minor currency units and an explicit ISO currency code. Never use floating-point values for money.
- Do not store card numbers, security codes or raw payment credentials.
- Browser clients may read only the billing information permitted to the signed-in user or organisation. Trusted server functions verify payments and write authoritative billing state.

## 2. Reuse existing foundations carefully

The checked-in migrations already contain:
- Supabase Auth users.
- profiles and per-application profile/access structures.
- applications and user_app_access.
- ensure_self_app_access and related app-access helpers.

The existing profiles table has an application-specific history and should not be repurposed as the sole personal or organisation account table. Preserve its per-app responsibilities and add a clean central account model.

## 3. Proposed entities

### Identity and organisations

| Table | Purpose |
|---|---|
| account_profiles | One central personal profile per auth user; account-level display and contact preferences. |
| organizations | Legal/display name, country, registration details and creator/owner. |
| organization_members | User-to-organisation membership, role, invitation state and membership status. |
| external_identities | Maps a central auth user to an existing product's user identifier during controlled integration or migration. |

Suggested organization roles: owner, administrator, billing_manager, member, viewer. Enforce permissions in database policies and server functions, not only in the UI.

### Billing customers and catalogue

| Table | Purpose |
|---|---|
| billing_customers | One customer record associated with either an individual user or an organisation. Exactly one owner reference must be set. |
| billing_products | Central product code, display name, active status and commercial model. |
| billing_prices | Product price, currency, billing interval, provider and provider price reference. |

Commercial model values should include free, subscription and service. Keep product pricing configurable rather than hardcoding amounts in the frontend.

### Billing records

| Table | Purpose |
|---|---|
| billing_quotes | A scoped quotation, especially for DataLens service requests. |
| billing_quote_items | Quoted deliverables, quantities, unit prices and totals. |
| billing_invoices | Issued invoice, customer, currency, total, due date and lifecycle status. |
| billing_invoice_items | Itemised invoice lines and tax/discount details where applicable. |
| billing_transactions | Payment attempts and provider references, with verified status and timestamps. |
| billing_subscriptions | Subscription provider reference, product/price, status and billing period. |
| product_entitlements | The authoritative permission to use a product or feature, linked to the individual or organisation and the source invoice/subscription/grant. |
| billing_provider_events | Idempotency ledger for incoming provider webhook events and their processing outcomes. |

### DataLens service flow

A service request can be represented by a separate service_requests table with requester, optional organisation, requested scope, status, assigned reviewer and linked quote/invoice IDs.

The intended flow is:

Request received → scope reviewed → quotation prepared → customer accepts → invoice issued → payment verified → work authorised → delivery recorded.

Do not force DataLens into a recurring subscription model.

## 4. Product business models

| Product | Billing model | Central billing behaviour |
|---|---|---|
| Workspace | Free | No paid subscription required; normal account access applies. |
| AgroClimate | Subscription | Subscription and entitlement records. |
| Sikasɛm | Subscription | Subscription and entitlement records. |
| Adesua | Subscription | Subscription and entitlement records. |
| DataLens | Service-based | Request, quotation, invoice and verified payment. |
| Other products | To be confirmed | Do not create a price or paid entitlement until the commercial model is approved. |

A free product should not require a fake subscription record. Entitlements can explicitly represent free access or a product's baseline policy.

## 5. Authoritative payment and entitlement flow

1. The user selects a product or accepts a service quotation.
2. The server creates a pending billing record and starts the payment-provider workflow.
3. The provider sends a signed webhook or the server independently verifies the transaction using the provider API.
4. The server validates the provider reference, expected amount, currency, customer, product and transaction status.
5. The server records the provider event idempotently.
6. Only after successful verification does the server mark the invoice/transaction paid and create or update the relevant entitlement.
7. The product checks the central entitlement or a securely issued entitlement assertion.
8. Refunds, chargebacks, cancellations and expired subscriptions update entitlements through the same trusted server-side path.

A browser redirect, screenshot, client-side success message or unverified reference must never grant paid access.

## 6. Row Level Security and server permissions

- Users may read and update their own account_profiles record.
- Organisation members may read the organisations they belong to, subject to membership status.
- Only organisation owners/administrators may manage membership. Billing records require a billing_manager or owner role.
- Individual billing customers are visible only to the linked user.
- Organisation billing customers are visible only to authorised members of that organisation.
- Browser clients may read their own invoices, subscriptions, transactions and entitlements.
- Browser clients must not directly write authoritative payment status, subscription status, entitlements, provider events or invoice payment timestamps.
- Only trusted server functions using service-role credentials may write verified billing state. Service-role credentials must never be bundled into frontend code.
- Security-definer helpers must have a fixed search_path, restricted execute grants and tests for cross-organisation access.
- Every organisation-scoped table must enforce the organisation boundary in RLS, including joins and nested data.

## 7. Cost and data-minimisation rules

- Store only customer, billing and entitlement facts needed for service delivery, compliance and reconciliation.
- Do not duplicate public Information Discovery content or Workspace editing activity in billing tables.
- Keep provider webhook payloads minimal; store a hash and selected verified fields where possible, not unnecessary full payloads.
- Index foreign keys, provider references and frequently queried status/date columns.
- Use idempotent webhook processing and avoid polling payment providers from the browser.
- Establish retention rules for old provider events, audit records and completed invoices.
- Monitor database size, storage, bandwidth, function invocations and authentication use after launch.

## 8. Migration order

1. Confirm the actual Supabase project connected through Lovable, project URL, public browser key and applied migration history.
2. Review the existing profiles, applications, user_app_access, team_members and payment-related structures in the live database.
3. Agree the final identity and organisation role model.
4. Create and test account_profiles, organizations and organization_members with RLS.
5. Map existing product identities without removing old product accounts.
6. Create billing customer, catalogue, quote, invoice, transaction, subscription and entitlement tables.
7. Implement provider-specific server verification and idempotent webhooks.
8. Integrate one subscription product and one service/quotation product in a test environment.
9. Test cross-user and cross-organisation isolation, duplicate webhooks, refunds, failed payments and expired subscriptions.
10. Roll out product by product only after reconciliation and rollback tests pass.

Do not apply this design as a blind SQL migration. It must be reconciled with the live project's schema and actual payment integrations first.
