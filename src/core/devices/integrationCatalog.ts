import type { DeviceCapability, DeviceTransport } from "./types";

export type IntegrationProduct = "agroclimate" | "inventra" | "info-solutions";
export type IntegrationMode = "browser-peripheral" | "native-device" | "managed-gateway" | "external-service";
export type IntegrationReadiness = "shared-framework" | "product-adapter-required" | "dedicated-gateway-required" | "external-connector-required";

export interface HardwareIntegrationDefinition {
  id: string;
  productId: IntegrationProduct;
  productName: string;
  serviceArea: string;
  integrationMode: IntegrationMode;
  readiness: IntegrationReadiness;
  hardware: string[];
  purpose: string;
  dataFlow: "inbound" | "outbound" | "bidirectional" | "control";
  capabilities: DeviceCapability[];
  transports: DeviceTransport[];
  userSetup: "none" | "permission-only";
  safetyBoundary?: string;
}

/**
 * Product-specific integration catalogue for the shared Amineva runtime.
 * A catalogue entry describes an intended integration boundary, not proof that
 * a particular make/model has been physically certified or deployed.
 */
export const HARDWARE_INTEGRATION_CATALOG: HardwareIntegrationDefinition[] = [
  {
    id: "agroclimate-agtrans-telematics",
    productId: "agroclimate",
    productName: "AgroClimate",
    serviceArea: "AGTrans — transport and vehicle monitoring",
    integrationMode: "managed-gateway",
    readiness: "product-adapter-required",
    hardware: ["Vehicle GNSS trackers", "Fleet telematics units", "Driver smartphones (for driver-side workflows)"],
    purpose: "Receive authorised vehicle position and agreed telematics data for transport visibility and trip monitoring.",
    dataFlow: "inbound",
    capabilities: ["location", "gnss"],
    transports: ["network-gateway", "native-bridge", "web-serial"],
    userSetup: "none",
    safetyBoundary: "Read-only tracking and telemetry. No vehicle control, immobilisation or safety-critical command channel."
  },
  {
    id: "agroclimate-agroforecast-weather",
    productId: "agroclimate",
    productName: "AgroClimate",
    serviceArea: "AgroForecast — weather observations and alerts",
    integrationMode: "managed-gateway",
    readiness: "product-adapter-required",
    hardware: ["Weather stations", "Rain gauges", "Wind sensors", "Temperature and humidity sensors"],
    purpose: "Ingest station observations for forecasting support, local conditions and weather alerts.",
    dataFlow: "inbound",
    capabilities: ["temperature", "humidity", "rainfall", "wind", "environmental"],
    transports: ["network-gateway", "web-bluetooth", "web-serial"],
    userSetup: "none"
  },
  {
    id: "agroclimate-agrorisk-sensors",
    productId: "agroclimate",
    productName: "AgroClimate",
    serviceArea: "AgroRisk — soil and environmental monitoring",
    integrationMode: "managed-gateway",
    readiness: "product-adapter-required",
    hardware: ["Soil-moisture probes", "Soil-temperature probes", "Soil-pH sensors", "Electrical-conductivity sensors", "Water-level sensors"],
    purpose: "Route validated, site-bound environmental measurements into AgroRisk assessments.",
    dataFlow: "inbound",
    capabilities: ["soil-moisture", "soil-temperature", "soil-ph", "electrical-conductivity", "water-level", "temperature"],
    transports: ["network-gateway", "web-bluetooth", "web-serial"],
    userSetup: "none"
  },
  {
    id: "agroclimate-aerial-console",
    productId: "agroclimate",
    productName: "AgroClimate",
    serviceArea: "Aerial Console — aircraft telemetry",
    integrationMode: "managed-gateway",
    readiness: "product-adapter-required",
    hardware: ["Compatible agricultural drones", "Aircraft telemetry radios and ground stations"],
    purpose: "Receive approved aircraft position, status and battery telemetry for the Aerial Console.",
    dataFlow: "inbound",
    capabilities: ["flight-telemetry", "location", "gnss", "power"],
    transports: ["network-gateway", "native-bridge", "web-serial"],
    userSetup: "none",
    safetyBoundary: "Read-only telemetry only. No arming, navigation, payload release or flight-control commands."
  },
  {
    id: "agroclimate-inventory-peripherals",
    productId: "agroclimate",
    productName: "AgroClimate",
    serviceArea: "Agro Inventory — stock capture and weighing",
    integrationMode: "browser-peripheral",
    readiness: "product-adapter-required",
    hardware: ["Barcode scanners", "QR scanners", "RFID readers", "Digital weighing scales", "Label printers"],
    purpose: "Capture produce, input and stock identifiers and validated weights in Agro Inventory workflows.",
    dataFlow: "bidirectional",
    capabilities: ["barcode", "qr-code", "weight", "inventory-count", "printing", "scanning"],
    transports: ["web-hid", "web-serial", "native-bridge"],
    userSetup: "permission-only"
  },
  {
    id: "agroclimate-farm-handler",
    productId: "agroclimate",
    productName: "AgroClimate",
    serviceArea: "Farm Handler — field-work execution",
    integrationMode: "native-device",
    readiness: "product-adapter-required",
    hardware: ["Android phones", "Rugged smartphones", "Tablets", "Device camera and location services"],
    purpose: "Support assigned field tasks, evidence capture, QR scanning and location-aware workflows using the managed mobile application.",
    dataFlow: "bidirectional",
    capabilities: ["camera", "location", "gnss", "qr-code"],
    transports: ["native-bridge"],
    userSetup: "permission-only",
    safetyBoundary: "Location and camera access are requested only when the relevant task requires them; no background tracking without an explicit, disclosed operational basis."
  },
  {
    id: "agroclimate-post-harvest",
    productId: "agroclimate",
    productName: "AgroClimate",
    serviceArea: "Post-Harvest — dedicated storage monitoring",
    integrationMode: "managed-gateway",
    readiness: "dedicated-gateway-required",
    hardware: ["Storage temperature probes", "Humidity sensors", "Bluetooth data loggers", "Dedicated post-harvest monitoring stations"],
    purpose: "Send paired, timestamped storage-condition readings through the dedicated Post-Harvest station gateway.",
    dataFlow: "inbound",
    capabilities: ["temperature", "humidity", "environmental"],
    transports: ["network-gateway", "web-bluetooth", "web-serial"],
    userSetup: "none",
    safetyBoundary: "Uses the dedicated Post-Harvest station registry and validation path; it is not treated as generic AgroRisk telemetry."
  },
  {
    id: "inventra-stock-capture",
    productId: "inventra",
    productName: "Inventra",
    serviceArea: "Stock control and receiving",
    integrationMode: "browser-peripheral",
    readiness: "product-adapter-required",
    hardware: ["USB and Bluetooth barcode scanners", "QR scanners", "RFID readers", "Android handheld inventory terminals"],
    purpose: "Capture product identifiers, stock movements, receiving and stock counts against Inventra records.",
    dataFlow: "bidirectional",
    capabilities: ["barcode", "qr-code", "scanning", "inventory-count"],
    transports: ["web-hid", "web-serial", "native-bridge"],
    userSetup: "permission-only"
  },
  {
    id: "inventra-weighing",
    productId: "inventra",
    productName: "Inventra",
    serviceArea: "Product weighing",
    integrationMode: "browser-peripheral",
    readiness: "product-adapter-required",
    hardware: ["Digital retail scales", "Platform scales", "Bluetooth weighing devices"],
    purpose: "Capture measured quantities and associate them with the active product or transaction.",
    dataFlow: "inbound",
    capabilities: ["weight"],
    transports: ["web-bluetooth", "web-hid", "web-serial", "native-bridge"],
    userSetup: "permission-only"
  },
  {
    id: "inventra-sales-peripherals",
    productId: "inventra",
    productName: "Inventra",
    serviceArea: "Sales, checkout and receipts",
    integrationMode: "browser-peripheral",
    readiness: "product-adapter-required",
    hardware: ["POS terminals", "Receipt printers", "Label printers", "Cash drawers where supported by the POS terminal"],
    purpose: "Connect checkout peripherals to Inventra sales workflows using model-specific drivers.",
    dataFlow: "bidirectional",
    capabilities: ["point-of-sale", "printing"],
    transports: ["web-hid", "web-serial", "native-bridge"],
    userSetup: "permission-only",
    safetyBoundary: "Payment authorisation remains with the configured payment provider; a connected POS peripheral does not itself prove that a payment succeeded."
  },
  {
    id: "info-solutions-kiosks",
    productId: "info-solutions",
    productName: "Info Solutions",
    serviceArea: "Information kiosks and self-service terminals",
    integrationMode: "native-device",
    readiness: "product-adapter-required",
    hardware: ["Touchscreen kiosks", "Public information terminals", "Interactive display terminals"],
    purpose: "Run the appropriate information and self-service experience in a managed kiosk shell.",
    dataFlow: "bidirectional",
    capabilities: ["display", "touch"],
    transports: ["native-bridge", "network-gateway"],
    userSetup: "none",
    safetyBoundary: "Kiosk lockdown, session reset, accessibility and privacy controls belong to the managed kiosk deployment."
  },
  {
    id: "info-solutions-digital-signage",
    productId: "info-solutions",
    productName: "Info Solutions",
    serviceArea: "Digital signage and information displays",
    integrationMode: "managed-gateway",
    readiness: "product-adapter-required",
    hardware: ["Digital signage screens", "Commercial displays", "Managed media players"],
    purpose: "Publish approved information content and receive device health/status from managed display endpoints.",
    dataFlow: "bidirectional",
    capabilities: ["display", "power"],
    transports: ["network-gateway", "native-bridge"],
    userSetup: "none"
  },
  {
    id: "info-solutions-document-capture",
    productId: "info-solutions",
    productName: "Info Solutions",
    serviceArea: "Document capture and assisted service",
    integrationMode: "browser-peripheral",
    readiness: "product-adapter-required",
    hardware: ["Document scanners", "Multifunction printers", "Webcams and document cameras"],
    purpose: "Capture documents and images for an explicitly selected information or service workflow.",
    dataFlow: "inbound",
    capabilities: ["scanning", "camera", "printing"],
    transports: ["web-hid", "native-bridge"],
    userSetup: "permission-only",
    safetyBoundary: "Captured documents remain within the selected service's access controls and retention policy."
  },
  {
    id: "info-solutions-printers",
    productId: "info-solutions",
    productName: "Info Solutions",
    serviceArea: "Public terminal printing",
    integrationMode: "managed-gateway",
    readiness: "product-adapter-required",
    hardware: ["Network printers", "Managed USB printers", "Print-release stations"],
    purpose: "Route authorised print jobs from public terminals to the assigned printer and release workflow.",
    dataFlow: "outbound",
    capabilities: ["printing"],
    transports: ["network-gateway", "native-bridge"],
    userSetup: "none"
  }
];

export const INTEGRATION_PRODUCTS: Array<{ id: IntegrationProduct; name: string; scope: string }> = [
  { id: "agroclimate", name: "AgroClimate", scope: "Agricultural field, environmental, aerial, transport and post-harvest integrations." },
  { id: "inventra", name: "Inventra", scope: "Retail and wholesale stock, weighing, checkout and printing peripherals." },
  { id: "info-solutions", name: "Info Solutions", scope: "Kiosks, public terminals, interactive displays, document capture and printing." }
];

export function getIntegrationsForProduct(productId: IntegrationProduct): HardwareIntegrationDefinition[] {
  return HARDWARE_INTEGRATION_CATALOG.filter(item => item.productId === productId);
}
