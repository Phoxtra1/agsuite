# Amineva Global shared software environment — hardware integration architecture

## Purpose

Amineva Global is the single user-facing software environment and managed gateway for product integrations. The shared framework supplies common infrastructure; it does not flatten different products into one generic hardware workflow.

## Shared platform capabilities

1. **Product integration registry** — records each product service area, supported hardware class, integration mode, transport and readiness.
2. **Device identity and registry** — centrally identifies deployed devices, their tenant/organisation, deployment site, product adapter, assigned component, model, firmware and lifecycle state.
3. **Provisioning and trust** — device credentials are issued and rotated by authorised administrators or deployment partners. Secrets are stored server-side as hashes or managed secrets; raw credentials are not exposed to end users or persisted in browser storage.
4. **Adapter runtime** — product-specific adapters translate each manufacturer's protocol into that product's agreed domain events. A shared transport does not imply shared business logic.
5. **Permission broker** — checks user, organisation, product entitlement, assigned site, component and requested capability before access. Browser/native permissions are requested only when the user invokes a feature that needs them.
6. **Secure message and observation routing** — validates schema, capability, timestamp, units, bounds, tenant and target product before forwarding. Product backends remain authoritative for their operational data.
7. **Health and lifecycle monitoring** — reports last contact, connectivity, firmware/model, error state, data freshness and revocation. Missing data is never presented as a zero reading.
8. **Audit and diagnostics** — records provisioning, assignment, access, command, data-ingest, configuration and revocation events with actor and timestamp.
9. **Offline and retry handling** — bounded, idempotent delivery queues for supported data flows; retries must not duplicate stock movements, sales, payments or other business transactions.
10. **Versioned compatibility** — adapter compatibility is tied to exact manufacturer, model, firmware and protocol version. A generic category label is not device certification.

## Product-specific integration boundaries

### AgroClimate

- **AGTrans:** vehicle GNSS/fleet telematics and driver-side mobile workflows. Read-only location/telemetry; no vehicle control.
- **AgroForecast:** weather stations, rain gauges, wind, temperature and humidity sensors.
- **AgroRisk:** soil-moisture, soil-temperature, pH, electrical-conductivity and water-level sensors.
- **Aerial Console:** compatible aircraft/drone read-only telemetry. No flight-control commands.
- **Agro Inventory:** barcode/QR scanners, RFID readers, weighing scales and label printers. This is an inventory workflow adapter, not generic environmental telemetry.
- **Farm Handler:** managed Android phones/rugged phones/tablets using camera, QR and location APIs as required by assigned field tasks. Permissions are contextual; no blanket background tracking.
- **Post-Harvest:** dedicated storage temperature/humidity monitoring path and dedicated station gateway. It is not merged into AgroRisk's generic telemetry path.
- **Market Link:** marketplace operations and transactions are product workflows. Do not represent them as a generic hardware integration. A supported payment or logistics provider is connected through its own verified API integration.

### Inventra

- Barcode and QR scanners; RFID readers; Android handheld inventory terminals.
- Digital weighing scales and platform scales.
- POS terminals, receipt/label printers and supported cash-drawer peripherals.
- Inventory events and sales/payment state remain separate. Payment success must be confirmed by the configured payment provider, never inferred from a connected terminal or a printer response.

### Info Solutions

- Touchscreen information kiosks and public self-service terminals.
- Digital signage screens and managed media players.
- Document scanners, multifunction printers, webcams/document cameras and network print-release stations.
- Kiosk lockdown, privacy, accessibility, session reset and print-release controls are part of the deployment-specific adapter and management policy.

### Explicit scope boundary

DataLens is not part of this hardware-integration scope. It remains a separate cloud and IT infrastructure management service. No hardware manufacturing is planned; the framework integrates compatible third-party devices and existing equipment.

## User experience and operations

- Ordinary users do not register, pair, configure, provision or paste device credentials.
- Administrators/deployment partners pre-provision and assign devices to the correct organisation, site, product and component.
- When a user opens a feature, the platform checks entitlement and assignment. The application uses an authorised managed endpoint where available.
- A browser/native permission prompt may appear only when required by the operating system and only for the active feature. This is not device setup.
- If no compatible assigned device exists, show a clear availability message and route provisioning to the responsible administrator. Do not expose a raw device registry or credential form to the user.
- Product applications receive only the measurements or actions they are authorised to use. They do not gain access to unrelated product devices.

## Current repository implementation boundary

The repository already contains a central device registry, protocol decoders, a browser driver runtime, authenticated observation ingestion, component subscriptions and a device centre. These are reusable foundations, not proof that every product adapter or hardware model is production-ready.

The product integration catalogue and admin-facing catalogue view define the product-specific scope. Remaining production work is adapter implementation and backend authorisation for each product, secure managed provisioning, native/network gateway agents where browser APIs are insufficient, and real model/firmware acceptance testing. Do not expose the existing manual discovery workflow as the normal end-user setup path.

## Release gates

- Verify RLS and server-side role checks for every provisioning, assignment and revocation action.
- Verify tenant/site/product/component binding on every ingest and command.
- Test duplicate delivery, replay, stale timestamps, malformed payloads, unit conversion and out-of-range readings.
- Test offline/reconnect behavior without duplicate business transactions.
- Verify data is routed only to the intended product backend and that other product records remain isolated.
- Physically test each supported model and firmware revision before marking it certified or production-ready.
