import { describe, expect, it } from "vitest";
import { parseSwitchBillingEvent } from "./switchBridge";

const validEvent = {
  schema_version: "1.0",
  event_id: "evt_123",
  event_type: "payment.succeeded",
  application_id: "app_inventra",
  occurred_at: "2026-11-15T10:30:00Z",
  customer: {
    external_customer_id: "customer_123",
    amineva_customer_id: "amv_customer_123",
    account_type: "organization",
  },
  resource: {
    external_id: "txn_123",
    invoice_id: "invoice_123",
    transaction_id: "txn_123",
  },
  money: {
    amount_minor: 45000,
    currency: "GHS",
  },
  status: "paid",
};

describe("Switch Bridge event contract", () => {
  it("accepts a valid payment event", () => {
    expect(parseSwitchBillingEvent(validEvent)).toMatchObject(validEvent);
  });

  it("rejects floating-point amounts", () => {
    expect(() =>
      parseSwitchBillingEvent({
        ...validEvent,
        money: { amount_minor: 45.5, currency: "GHS" },
      }),
    ).toThrow();
  });

  it("rejects non-ISO currency codes", () => {
    expect(() =>
      parseSwitchBillingEvent({
        ...validEvent,
        money: { amount_minor: 4500, currency: "Ghana Cedi" },
      }),
    ).toThrow();
  });

  it("rejects unknown event types", () => {
    expect(() =>
      parseSwitchBillingEvent({
        ...validEvent,
        event_type: "payment.maybe",
      }),
    ).toThrow();
  });

  it("rejects unexpected fields", () => {
    expect(() =>
      parseSwitchBillingEvent({
        ...validEvent,
        provider_secret: "must-not-be-forwarded",
      }),
    ).toThrow();
  });
});
