import { z } from "zod";

/**
 * Switch Bridge is the provider-neutral contract used by Amineva applications
 * to publish billing facts to Amineva Switch. This module validates data shape
 * only; signature verification and authoritative payment verification belong
 * in a trusted server-side integration service.
 */

export const SWITCH_EVENT_TYPES = [
  "invoice.created",
  "invoice.updated",
  "payment.succeeded",
  "payment.failed",
  "payment.refunded",
  "subscription.created",
  "subscription.updated",
  "subscription.cancelled",
  "subscription.expired",
] as const;

export const SwitchEventTypeSchema = z.enum(SWITCH_EVENT_TYPES);

const CurrencySchema = z.string().regex(/^[A-Z]{3}$/, "Use an ISO 4217 currency code.");
const ReferenceSchema = z.string().trim().min(1).max(160);

export const SwitchBillingEventSchema = z.object({
  schema_version: z.literal("1.0"),
  event_id: ReferenceSchema,
  event_type: SwitchEventTypeSchema,
  application_id: ReferenceSchema,
  occurred_at: z.string().datetime({ offset: true }),
  customer: z.object({
    external_customer_id: ReferenceSchema,
    amineva_customer_id: ReferenceSchema.optional(),
    account_type: z.enum(["individual", "organization"]).optional(),
  }).strict(),
  resource: z.object({
    external_id: ReferenceSchema,
    invoice_id: ReferenceSchema.optional(),
    subscription_id: ReferenceSchema.optional(),
    transaction_id: ReferenceSchema.optional(),
    refund_id: ReferenceSchema.optional(),
  }).strict(),
  money: z.object({
    amount_minor: z.number().int().nonnegative(),
    currency: CurrencySchema,
  }).strict().optional(),
  status: z.enum([
    "draft",
    "pending",
    "open",
    "paid",
    "failed",
    "partially_paid",
    "refunded",
    "cancelled",
    "active",
    "past_due",
    "paused",
    "expired",
  ]).optional(),
  effective_at: z.string().datetime({ offset: true }).optional(),
  due_at: z.string().datetime({ offset: true }).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
}).strict();

export type SwitchBillingEvent = z.infer<typeof SwitchBillingEventSchema>;
export type SwitchEventType = z.infer<typeof SwitchEventTypeSchema>;

/** Parse an untrusted event body before it enters application processing. */
export function parseSwitchBillingEvent(input: unknown): SwitchBillingEvent {
  return SwitchBillingEventSchema.parse(input);
}
