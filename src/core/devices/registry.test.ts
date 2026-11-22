import { describe, expect, it } from "vitest";
import { COMPONENT_DEVICE_REQUIREMENTS, matchDeviceToComponents } from "./registry";

describe("central device capability registry", () => {
 it("maps soil and environmental BLE capabilities to AgroClimate components", () => {
  const matches = matchDeviceToComponents(["soil-moisture", "temperature"], "web-bluetooth");
  expect(matches.map(item => item.componentId)).toContain("soil-monitoring");
  expect(matches.map(item => item.componentId)).toContain("agro-risk");
 });
 it("does not match a capability when the transport is not supported by the component", () => {
  expect(matchDeviceToComponents(["printing"], "web-bluetooth")).toHaveLength(0);
 });
 it("keeps Market Link transactions out of generic device telemetry", () => {
  expect(COMPONENT_DEVICE_REQUIREMENTS.some(item => item.appId === "agroclimate" && item.componentId === "market-link")).toBe(false);
 });
 it("keeps application mappings distinct and documents unvalidated profiles", () => {
  expect(COMPONENT_DEVICE_REQUIREMENTS.some(item => item.appId === "inventra" && item.componentId === "sales-checkout")).toBe(true);
  expect(COMPONENT_DEVICE_REQUIREMENTS.some(item => item.appId === "info-solutions" && item.componentId === "information-kiosks")).toBe(true);
  expect(COMPONENT_DEVICE_REQUIREMENTS.every(item => item.description.includes("validation is required"))).toBe(true);
 });
});
