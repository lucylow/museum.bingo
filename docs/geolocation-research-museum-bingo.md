# 10-Page Research Document: Geolocation for Museum.Bingo

**Domain:** `museum.bingo`  
**Focus:** GPS geofencing, Google Places API, and location-aware architecture for automatic museum detection.

---

## Page 1 - Introduction: Why Geolocation Matters for Museum.Bingo

Museum.Bingo transforms a passive museum visit into an interactive, AR-powered scavenger hunt. The moment a visitor steps across a museum threshold, the app must recognize the venue, load the correct bingo card, and prepare for real-time artwork validation. This trigger is mission-critical, and it depends on reliable geolocation.

Geolocation for Museum.Bingo operates at two scales:

- **Macro-detection (10-50 m accuracy)** - Determines that the user has entered a specific museum building. This is handled by **GPS geofencing** combined with the **Google Places API** to retrieve place metadata.
- **Micro-detection (1-5 m accuracy)** - Understands which gallery or wing the user is in, enabling room-specific bingo prompts and artwork preloading. This requires **indoor positioning systems** (BLE beacons, Wi-Fi RTT, NFC) or a fallback manual selection.

This research synthesizes platform documentation, academic studies, production-grade React Native libraries, and real-world museum implementations. It provides a complete, actionable foundation for implementing geolocation in a 13-day hackathon while showing how the architecture can scale into a production-ready application.

---

## Page 2 - Google Places API: The Foundation for Museum Detection

Before the app can monitor geofences, it must know where geofences should be placed. The Google Places API provides the authoritative dataset of museum locations (names, coordinates, place types, websites, and opening hours) that powers initial geofence setup.

### 2.1 SKU Pricing and Free Tier (as of 2026)

In March 2025, Google Maps Platform replaced the flat monthly credit with per-SKU free usage caps, changing how cost accumulates. The Places API now operates across tiers:

| SKU | Tier | Free per Month | Price per 1K (0-100K) |
|---|---|---:|---:|
| Autocomplete (per request) | Essentials | 10,000 | $2.83 |
| Geocoding | Essentials | 10,000 | $5.00 |
| Place Details (Essentials) | Essentials | 10,000 | $5.00 |
| Place Details (Pro) | Pro | 5,000 | $17.00 |
| Nearby Search (Pro) | Pro | 5,000 | $32.00 |
| Text Search (Pro) | Pro | 5,000 | $32.00 |

*Data compiled from Google Maps Platform documentation.*

For Museum.Bingo, **Nearby Search (Pro)** at $32 per 1,000 requests is the key SKU for discovering museums near the user location. **Place Details (Essentials)** at $5 per 1,000 is enough for basic museum info (name, address, coordinates).

Google also offers subscription plans for predictable usage:

| Plan | Monthly Cost | Included Calls | Effective Rate |
|---|---:|---:|---:|
| Starter | $100 | 50,000 | $2.00/1K |
| Essentials | $275 | 100,000 | $2.75/1K |
| Pro | $1,200 | 250,000 | $4.80/1K |

*Data from Google Maps Platform subscriptions documentation.*

For the hackathon MVP (estimated 2,000 daily active users, one Nearby Search each at app startup), monthly costs are likely within free usage.

### 2.2 Usage Optimization: Field Masks

The Places API (New) requires a **field mask** that defines exactly which fields are returned. Omitting the field mask results in an error. Billing is based on the highest SKU among requested fields, so mixing Essentials and Pro fields bills at Pro.

```typescript
// Example: Request only needed fields to control cost
curl -X POST 'https://places.googleapis.com/v1/places:searchNearby' \
  -H 'X-Goog-FieldMask: places.displayName,places.id,places.location' \
  -H 'Content-Type: application/json' \
  -d '{
    "includedTypes": ["museum", "art_gallery"],
    "maxResultCount": 20,
    "locationRestriction": {
      "circle": {"center": {"latitude": 40.7580, "longitude": -73.9855}, "radius": 500.0}
    }
  }'
```

### 2.3 Autocomplete Sessions

For museum search UIs, Google recommends linking Autocomplete and Place Details calls with a shared session token. This supports search-as-you-type while improving request grouping and cost visibility.

### 2.4 Alternatives for Cost-Sensitive Scale

If Museum.Bingo grows beyond free usage and subscriptions become expensive, alternatives include **Foursquare Places API**, **Geocode Earth** (OpenStreetMap-based), and **LocationIQ**. For a hackathon and early MVP, Google remains a practical default.

---

## Page 3 - Geofencing Fundamentals: How Virtual Perimeters Work

Geofencing allows Museum.Bingo to monitor areas and trigger actions when a device enters or exits a predefined zone. Unlike continuous GPS polling, geofencing relies on hardware-assisted, event-driven monitoring and is significantly more battery-efficient.

### 3.1 How Geofencing Works

When the app registers a geofence (`latitude`, `longitude`, `radius`), the operating system monitors boundary crossings and wakes the app on entry or exit events.

**Best practice:** Use a minimum radius of **100-150 meters** for reliability. Smaller radii increase missed events due to GPS variance.

### 3.2 Platform-Specific Constraints

**Android constraints:**

- Apps targeting Android 10 (API 29+) require `ACCESS_BACKGROUND_LOCATION`, with "Allow all the time" for reliable background geofencing.
- Single-user devices allow up to **100 geofences per app**.
- On Android 8.0+ (API 26+), background updates can be batched and delayed.

**iOS constraints:**

- Maximum of **20 monitored regions** in nearby scope.
- Updates are not continuous; delivery can be delayed by movement and system heuristics.

These constraints require conservative strategy: larger radii (>=100 m), tolerance for delayed events, and a robust manual fallback when confidence is low.

### 3.3 Battery Optimization

Geofencing is already lower-power than continuous tracking, but implementation still matters:

- Keep the engine in geofence-first mode, not continuous high-frequency streams.
- Explain Wi-Fi, mobile network, and location accuracy dependencies in permission UX.
- Minimize wakeups and avoid redundant location listeners.

---

## Page 4 - React Native Implementation: Production Libraries

Museum.Bingo is built with React Native, so geofencing must work on iOS and Android, including background scenarios.

### 4.1 `react-native-background-geolocation` (Transistor Software)

A mature, production-proven library used at scale.

| Aspect | Details |
|---|---|
| License | Paid for release builds (debug is free). |
| Key Feature | Motion-aware tracking and strong battery strategy. |
| Permissions | `NSLocationAlwaysAndWhenInUseUsageDescription` (iOS), `ACCESS_BACKGROUND_LOCATION` (Android). |

This is an excellent production upgrade path but may be outside hackathon budget.

### 4.2 `@rn-org/react-native-geofencing`

A newer open-source module with TypeScript support and React Native >= 0.72 compatibility.

```typescript
import Geofencing from '@rn-org/react-native-geofencing';

await Geofencing.requestLocation({ allowAlways: true });

Geofencing.addGeofence({
  id: 'met_museum',
  latitude: 40.779,
  longitude: -73.963,
  radius: 100,
  notifyOnEntry: true,
  notifyOnExit: true
});
```

Platform support: iOS and Android.

### 4.3 `expo-geofencing` (Expo managed workflow)

If using Expo-managed workflow, `expo-geofencing` can simplify implementation with managed permissions and background APIs.

### 4.4 Hackathon Recommendation

For a 13-day build, **`@rn-org/react-native-geofencing`** is the practical default: open-source, lightweight, and sufficient for proving automatic museum detection. Document Transistor as a post-hackathon production path.

---

## Page 5 - Accuracy Analysis and Real-World Performance

GPS accuracy varies significantly by environment.

- Open spaces can approach ~5-10 m.
- Dense urban areas may degrade to 15-50 m or worse due to multipath/NLOS.
- Indoor environments generally lose reliable GPS entirely.

Museums are often in dense urban zones, so this variability directly impacts detection quality.

### 5.1 Environment Risk Profile

| Environment | Typical GPS Accuracy | Risk for Museum.Bingo |
|---|---|---|
| Open suburban museum | 5-10 m | Low |
| Downtown museum with high-rise interference | 15-50 m | Medium |
| Entrance under canopy/arcade | 20-50 m | Medium |
| Indoor gallery | No reliable GPS | High |

### 5.2 Geofence Radius Implications

Given urban GPS drift, geofence radii should be **100-150 m**. Over-triggering nearby streets is acceptable if followed by a secondary check (BLE or user confirmation) before session activation.

### 5.3 Indoor GPS Failure and Hybrid Need

GPS is the correct first trigger, not the final truth. Once inside, the system should hand off to indoor signals (BLE/Wi-Fi RTT/NFC) or a manual confirmation flow.

---

## Page 6 - Hybrid Detection Architecture: Outdoor to Indoor Handoff

Use a three-layer detection model:

### Layer 1 - Outdoor Approach (GPS + Places)

- Monitor low-power location/geofence context.
- When user is within ~200 m, prefetch museum metadata and bingo configuration.
- Register 100-150 m geofences for nearby museums.

### Layer 2 - Threshold Crossing (Geofence Trigger)

On geofence entry:

- Do not auto-start gameplay immediately.
- Start BLE scan for known museum beacon IDs.
- If beacon confidence passes threshold, mark user as confirmed inside.
- If no confirmation after ~30s, present manual confirmation prompt.

### Layer 3 - Indoor Positioning (BLE/Wi-Fi RTT/NFC)

- **BLE beacons:** low-cost hardware, practical 2-5 m range.
- **Wi-Fi RTT:** strong accuracy where compatible APs exist.
- **NFC tags:** exhibit-level intentional triggers.

For hackathon scope, implement Layers 1 and 2 with manual fallback; treat indoor precision as roadmap.

```text
User outside museum (Layer 1)
        |
        v  Geofence crossed (100-150 m)
Layer 2 threshold
        |
        +--> BLE detected? yes --> Confirm inside -> Open bingo card
        |
        +--> no after timeout --> Manual "Start" prompt
```

---

## Page 7 - Indoor Positioning Technologies for Museums

| Technology | Typical Accuracy | Deployment Effort | Battery Impact | Suitability |
|---|---|---|---|---|
| BLE beacons (RSSI) | 2-5 m | Low | Low | High |
| BLE + inertial fusion | 2-3 m | Medium | Low | High |
| Wi-Fi RTT (802.11mc) | 1-2 m | Medium | Low | Medium/High |
| Near-ultrasound | <50 cm | Medium/High | Low | Very high accuracy, higher complexity |
| NFC tags | Contact range | Low | None | Very high for exhibit-specific triggers |

### 7.1 Near-Ultrasound

Near-ultrasound systems can achieve very high precision in constrained indoor spaces, but they require specialized hardware deployment and calibration.

### 7.2 Practical Recommendation

For hackathon delivery, assume one active bingo session maps to one museum building. Add room-level precision later as a premium feature with partner-installed infrastructure.

---

## Page 8 - Case Studies: Geolocation in Cultural Heritage Apps

### ExhibitXplorer (2023)

Used contextual geofencing and personalized content in museum contexts, with positive user response in field tests.

### Brooklyn Museum - "Inside Out"

Uses location context to separate pre-visit information from in-visit engagement, matching Museum.Bingo's intended flow.

### SCA Route 66 Project (2026)

Demonstrates geofencing maturity for cultural storytelling experiences tied to physical locations.

### Key Takeaways

- Geofencing in cultural venues is proven in production.
- Users respond well to location-triggered, contextual content.
- The "outside = pre-visit, inside = interactive" model is established.

---

## Page 9 - Cost Analysis and Optimization Strategy

### 9.1 Estimated Monthly Costs (2,000 DAU Example)

| API/Service | Monthly Usage | Free Tier | Estimated Cost |
|---|---:|---:|---:|
| Places Nearby Search (Pro) | 2,000 requests | 5,000 | $0 |
| Places Details (Essentials) | 2,000 requests | 10,000 | $0 |
| Device geofencing | Client-side | N/A | $0 |
| BLE infrastructure | Venue-side | N/A | B2B deployment cost |

For the MVP, location infrastructure costs can remain near zero cloud spend.

### 9.2 Optimization Strategies

- Cache Place Details and refresh with TTL (for example, 30 days).
- Register geofences in batches by relevance (not globally).
- Keep field masks minimal and avoid high-tier fields by default.
- Use plan-based pricing when sustained demand exceeds free usage.

### 9.3 Cost-Sensitive Alternatives

At larger scale, evaluate Foursquare, Geocode Earth, or LocationIQ depending on POI coverage, latency, contract terms, and legal/data requirements.

---

## Page 10 - Strategic Recommendations for the Hackathon

Prioritize reliability, demonstrability, and low operational cost.

### Core Implementation (Days 1-7)

| Component | Implementation | Why It Matters |
|---|---|---|
| Nearby Search | Fetch museums within 500 m of user | Candidate venue discovery |
| Geofence registration | 100-150 m radius around selected museums | Reliable entry detection |
| Geofence listener | Show welcome + suggested start action | Visible proof in demo |
| Manual fallback | Searchable museum list | Guaranteed usability |
| Permission UX | Explain always-on location need | Trust and policy compliance |

### Stretch Goal (Days 8-10)

- BLE beacon proof-of-concept in demo environment.
- Hybrid transition logic: geofence event -> BLE check -> verified inside state.

### Post-Hackathon Roadmap

- Partner-managed beacon rollout.
- Wi-Fi RTT integration in compatible venues.
- Advanced indoor precision (including ultrasound where justified).
- Scalable geofence orchestration for large partner networks.

### Final Recommendation

Implement a **hybrid automatic-plus-manual detection system** using Google Places API and `@rn-org/react-native-geofencing`. Use 100-150 m geofence radii to handle urban GPS variability. Include a manual museum selection fallback in all cases. Document BLE/Wi-Fi RTT/ultrasound as the roadmap for post-MVP indoor precision.

This approach keeps the MVP robust for hackathon judging while preserving a credible production path.
