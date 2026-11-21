# Amineva central device discovery, protocol drivers and secure component routing

## Central AGSuite implementation

AGSuite is the shared device-control and observation-routing layer. It includes:

- Owner-scoped device registration bound to one application and component.
- User-initiated browser discovery for Web Bluetooth LE, WebHID and Web Serial.
- Protocol driver profiles and decoders for Bluetooth SIG Environmental Sensing, Bluetooth SIG Weight Scale (IEEE-11073 SFLOAT), vendor-specific BLE characteristics, configurable HID scale reports, JSON-lines serial sensors, checksum-validated NMEA 0183 RMC/GGA and read-only MAVLink v1/v2 telemetry.
- Metric/unit/range validation and a least-privilege capability check before ingestion.
- Authenticated Edge Function ingestion. The function verifies the signed-in owner, device ownership, connection status, app/component binding, registered capability, metric, unit, value range and timestamp.
- Idempotent observation persistence, retry of transient delivery failures within the active session, device heartbeat updates and Supabase Realtime distribution to component subscribers.
- Component SDK hook `useComponentDeviceData(ownerId, appId, componentId)`, which loads persisted history and subscribes to new measurements.
- Disconnect/revoke handling and physical disconnect monitoring.

## Live AgroClimate component delivery

AgroClimate uses a separate Supabase project from AGSuite. AGSuite therefore does not assume the two projects share a session or user UUID. Instead, a device must also have an owner-provisioned credential in the target AgroClimate gateway:

1. Register the target device in the relevant AgroClimate device registry. For Post-Harvest, use its dedicated station registry. The gateway issues a high-entropy token once; it stores only the token hash.
2. Paste that one-time device token into the AGSuite Device Center. The token is held in page memory only; it is never written to the AGSuite device table, localStorage or IndexedDB.
3. AGSuite sends measurements to its authenticated `amineva-device-ingest` function. That function verifies the AGSuite user and device record, then forwards the observation to the AgroClimate gateway using the target device token.
4. The AgroClimate gateway validates the token, active device status, expected component, component metric and registered device capability before persisting the observation. Existing AgroClimate component hooks receive the persisted row through Supabase Realtime.

The AgroClimate shared gateway project URL defaults to `https://apoqexuhlysoirtcvgfo.supabase.co`. Set the following secret in the AGSuite Supabase project:

- `AGROCLIMATE_SUPABASE_ANON_KEY`: the AgroClimate project's anon/publishable key. This is a public project key, but it is kept server-side in the AGSuite Edge Function configuration.
- `AGROCLIMATE_SUPABASE_URL`: optional override; the default above is used when omitted.

The central ingestion function requires a valid AGSuite JWT. The device token is separate from the user's login and is never stored in the central registry. The AgroClimate gateway PR adds the expected-component and capability checks required by this bridge.

## Post-Harvest routing

Post-Harvest intentionally uses the dedicated `post-harvest-station` gateway. AGSuite stores each temperature and humidity observation, then forwards a paired reading only when both values are present and no older than 30 minutes. Temperature is converted to Celsius when supplied in Fahrenheit. The dedicated station gateway performs its own owner/device token, timestamp, range and idempotency checks.

## Protocol driver profiles

| Profile | Protocol | Decoder / behavior |
|---|---|---|
| Bluetooth SIG Environmental Sensing | BLE GATT | Temperature 0x2A6E (signed 0.01 °C) and humidity 0x2A6F (unsigned 0.01 %RH) notifications |
| Bluetooth SIG Weight Scale | BLE GATT | Weight Scale Measurement 0x2A9D; IEEE-11073 16-bit SFLOAT with lb/kg flag |
| Vendor-specific sensor | BLE GATT | Manufacturer-provided service/characteristic UUID, metric, unit, data format, byte offset, scale and additive offset |
| Configurable scale | WebHID | Float32 LE or UInt16 LE report decoding with manufacturer-specified byte offset, multiplier and unit |
| Serial sensor | Web Serial | Newline-delimited JSON metric/value/unit messages; metric aliases and accepted units are validated |
| Vehicle GNSS tracker | Web Serial | NMEA 0183 RMC/GGA with checksum validation; latitude/longitude and knots-to-m/s conversion |
| Aircraft telemetry | Web Serial | MAVLink v1/v2 read-only GLOBAL_POSITION_INT, GPS_RAW_INT and SYS_STATUS telemetry; no flight-control writes |

Custom driver configuration must be copied from the exact manufacturer's documentation for the selected model and firmware. A category match or a decoded packet is not a physical compatibility certification.

## Security controls

- Raw AgroClimate device credentials are held in active page memory only.
- The central Edge Function requires the signed-in AGSuite JWT and checks the device owner on every ingestion.
- Device observations cannot change their registered app, component, owner or capability.
- The target AgroClimate gateway checks that the token belongs to the expected component and that its provisioned capability list permits the measurement.
- Metric/unit allowlists, numeric ranges, timestamp limits, bounded metadata and event idempotency are enforced before persistence.
- RLS allows authenticated users to read only their own device records and observations; observation inserts are server-side only.
- MAVLink integration is read-only.

## Deployment and validation

Apply the AGSuite SQL migration through the project's normal Supabase migration workflow and deploy `amineva-device-ingest` with JWT verification enabled. Set the AgroClimate key secret as described above. Deploy the component-bound gateway update in AgroClimate (PR #74) before enabling external delivery.

Automated unit tests cover BLE, HID, JSON serial and NMEA decoders. CI/build checks and browser/device acceptance tests must be run on the deployed branch. No claim is made that an unnamed physical sensor model has been independently tested.
