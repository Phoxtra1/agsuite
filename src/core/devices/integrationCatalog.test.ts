import { describe, expect, it } from "vitest";
import { HARDWARE_INTEGRATION_CATALOG, INTEGRATION_PRODUCTS, getIntegrationsForProduct } from "./integrationCatalog";

describe("Amineva product-specific hardware integration catalogue", () => {
  it("keeps AgroClimate, Inventra and Info Solutions as distinct product adapters", () => {
    expect(INTEGRATION_PRODUCTS.map(product => product.id)).toEqual(["agroclimate", "inventra", "info-solutions"]);
    expect(getIntegrationsForProduct("agroclimate").every(item => item.productId === "agroclimate")).toBe(true);
    expect(getIntegrationsForProduct("inventra").every(item => item.productId === "inventra")).toBe(true);
    expect(getIntegrationsForProduct("info-solutions").every(item => item.productId === "info-solutions")).toBe(true);
  });

  it("keeps DataLens outside the hardware integration scope", () => {
    expect(HARDWARE_INTEGRATION_CATALOG.some(item => (item.productId as string) === "datalens")).toBe(false);
  });

  it("keeps AgroClimate's Post-Harvest path dedicated rather than generic telemetry", () => {
    const postHarvest = HARDWARE_INTEGRATION_CATALOG.find(item => item.id === "agroclimate-post-harvest");
    expect(postHarvest?.readiness).toBe("dedicated-gateway-required");
    expect(postHarvest?.safetyBoundary).toContain("dedicated Post-Harvest station registry");
  });

  it("keeps aircraft integration read-only", () => {
    const aerial = HARDWARE_INTEGRATION_CATALOG.find(item => item.id === "agroclimate-aerial-console");
    expect(aerial?.dataFlow).toBe("inbound");
    expect(aerial?.safetyBoundary).toContain("Read-only telemetry only");
  });

  it("does not expose manual device setup to ordinary users", () => {
    expect(HARDWARE_INTEGRATION_CATALOG.every(item => item.userSetup === "none" || item.userSetup === "permission-only")).toBe(true);
  });

  it("documents that model compatibility still requires product-specific adapter validation", () => {
    expect(HARDWARE_INTEGRATION_CATALOG.every(item => item.readiness !== "shared-framework" || item.transports.length > 0)).toBe(true);
  });
});
