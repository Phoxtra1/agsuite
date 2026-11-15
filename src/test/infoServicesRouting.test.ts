import { describe, expect, it } from "vitest";
import { getProductRedirectUrl } from "@/lib/productRouting";

describe("Info Services product routing", () => {
  it("opens the internal Info Services page for legacy product records", () => {
    expect(getProductRedirectUrl("datalens")).toBe("/explainer/info-services");
  });
});
