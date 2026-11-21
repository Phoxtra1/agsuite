# Amineva central device discovery and integration

AGSuite now contains a shared device capability registry, browser-native discovery adapters for Web Bluetooth, WebHID and Web Serial, an in-session live event bus, a Device Center page, and an owner-scoped Supabase device registry migration.

## Runtime behavior
- Device discovery is explicitly user initiated; browser/OS device chooser and permissions are mandatory.
- Web Bluetooth can pair and establish GATT connections. A service/characteristic profile is still required to read or subscribe to measurements.
- WebHID opens a selected device and streams raw input report bytes. Model-specific decoding is required.
- Web Serial opens a selected port and streams newline-delimited data. JSON lines are parsed; other lines are emitted as raw text.
- Events are broadcast to AGSuite subscribers while the page/session is active.
- Device registry rows are scoped to the signed-in Supabase user using RLS.
- Component matches are candidates based on declared capabilities and transport, never a claim that a specific model is certified.

## Scope and limits
The capability manifest covers AgroClimate weather, soil, risk, aerial telemetry, field handler, inventory, post-harvest, transport, market and forecast workflows; Inventra stock, checkout, weighing and printing; and Info Solutions kiosks, displays, capture and terminals.

A browser cannot silently discover arbitrary nearby devices or guarantee background operation. Native bridges or local gateways are required for unsupported Android/browser APIs, background connections, network devices and proprietary manufacturer SDKs. Exact model/revision, protocol, decoding, units, calibration and acceptance testing remain required before production use. No physical device was available for end-to-end testing as part of this repository change.

## Database setup
Apply the SQL migration through the normal Supabase migration workflow. This repository change does not apply it to the hosted project or alter cloud configuration.

## Validation
Run npm test -- --run, npm run lint and npm run build. Then test each target browser/OS and exact physical hardware model. Keep the PR draft until CI and physical acceptance tests are complete.
