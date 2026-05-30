## 10 Pages of Code: Virtual Confetti - AR Plane Detection for Bingo Celebration

This feature adds native AR confetti hooks for iOS (ARKit) and Android (ARCore), plus React Native wrappers and UI integration so Bingo wins can trigger immersive celebration effects with fallback behavior.

### Implemented Files

- `mobile/package.json`: added `react`, `react-native`, and `react-native-nitro-modules`
- `mobile/ios/Podfile`: documented AR bridge pod requirements and added `React-Core`
- `mobile/ios/MuseumBingo/ARConfettiModule.swift`: ARKit + SceneKit bridge module
- `mobile/ios/MuseumBingo/ARConfettiModule.m`: Objective-C bridge exports
- `mobile/ios/Confetti.scnp`: SceneKit particle configuration
- `mobile/android/app/build.gradle`: ARCore/Sceneform dependencies
- `mobile/android/app/src/main/AndroidManifest.xml`: AR camera/ARCore requirements
- `mobile/android/app/src/main/java/com/museumbingo/ARConfettiModule.java`: Android native bridge
- `mobile/android/app/src/main/java/com/museumbingo/ARConfettiPackage.java`: React package registration
- `mobile/src/native/ARConfetti.ts`: unified RN API
- `mobile/src/components/ARConfettiView.tsx`: declarative confetti UI with fallback
- `mobile/src/hooks/useBingoCelebration.ts`: reusable celebration hook
- `mobile/src/utils/ARPerformance.ts`: capability + performance manager scaffold
- `mobile/src/screens/DemoARConfettiScreen.tsx`: manual validation screen
- `mobile/src/screens/GameScreenWithConfetti.tsx`: integration screen wrapper
- `mobile/src/components/BingoGameWithAI.tsx`: Bingo completion trigger integration
- `mobile/assets/particles/confetti_particles.js`: web canvas fallback asset

### Runtime Behavior

1. Bingo is completed in `BingoGameWithAI`.
2. `useBingoCelebration` triggers sound/haptics and starts AR confetti via native bridge.
3. `ARConfettiView` keeps the celebration visible and auto-stops after a duration.
4. If native AR is unavailable, fallback visual celebration renders instead.

---

## Page 1 - Overview: Augmenting Museum.Bingo with Delightful AR

The three AR polish features in Museum.Bingo transform a standard scavenger hunt into a magical, immersive experience. This section details the technical architecture, implementation pathways, and creative design considerations for Overlay Animation, AR Hint Mode (Heat Vision), and Virtual Confetti.

- **Overlay Animation**: When the camera identifies an artwork, a playful bingo chip drops onto the screen with a "cha-ching" sound. This immediate feedback loop reinforces successful discovery and provides a satisfying gamified "hit" that keeps users engaged.
- **AR Hint Mode**: If a player is stuck, they activate "heat vision" - the app shows a compass arrow pointing toward the nearest unfulfilled prompt. This feature elegantly resolves player frustration while preserving the challenge of discovery.
- **Virtual Confetti**: Upon achieving bingo, the screen explodes with AR confetti that lands on the floor around the player. This celebratory moment creates a shareable, memorable climax to the gameplay session.

All three features are built on a stack of React Native, VisionCamera v4 for frame processing, Shopify React Native Skia for GPU-accelerated graphics, and platform-specific AR frameworks (ARKit on iOS, ARCore on Android) for plane detection and environmental understanding.

---

## Page 2 - Overlay Animation: Real-Time Bingo Chip Dropping

The bingo chip drop is triggered the instant the camera recognizes an artwork. The implementation uses the VisionCamera Skia plugin (`react-native-vision-camera-skia`), which exposes a high-performance, GPU-accelerated drawing canvas directly inside a frame processor worklet. This enables the app to draw 2D graphics onto the live camera feed in real time with zero latency.

The **Skia plugin** converts native camera buffers into GPU-backed `SkImage` objects, which are then drawn onto an offscreen canvas managed by a per-thread surface cache. These rendered textures are displayed via the `SkiaCameraCanvas` component, which synchronizes rendering with the device's display refresh rate. This architecture ensures the animation runs at 60 FPS without blocking the main UI thread.

For the bingo chip effect, the frame processor calls `frame.render()` to composite the camera feed, then uses Skia canvas methods (`drawCircle`, `drawPath`, etc.) to animate a chip that scales, rotates, and translates across the screen. The chip's opacity and position are animated over time using `sharedValue` and the `withTiming` hook from React Native Reanimated. At the moment of full arrival, a sound effect (see Section 3) and haptic feedback (Section 4) complete the multimodal reward.

**Implementation Steps**:

| Step | Library / Hook | Action |
|------|----------------|--------|
| 1 | `react-native-vision-camera` | Install v4 and configure frame processor |
| 2 | `@shopify/react-native-skia` + `react-native-vision-camera-skia` | Add drawing capabilities |
| 3 | `useSkiaFrameProcessor` | Inside worklet, `frame.render()` then draw chip |
| 4 | `react-native-reanimated` | Animate chip position and scale via `withTiming` |
| 5 | `react-native-haptic-feedback` + `react-native-sound` | Trigger haptic and audio at final frame |

---

## Page 3 - Sound Design: The "Cha-Ching" Auditory Cue

The auditory component of validation is a critical but often overlooked part of AR polish. The "cha-ching" cash register sound serves three purposes:

- It provides immediate, unambiguous feedback that the artwork has been correctly recognized.
- It triggers a dopamine response similar to a slot machine payout, reinforcing continued play.
- It offers an accessibility benefit for users with visual impairments who may miss the visual bingo chip.

In React Native, the `react-native-sound` library is the most reliable for playing short sound files with low latency. Sound files are pre-loaded when the camera component mounts and played instantly upon validation. Volume is controlled relative to the device's media volume, with an option to disable sound effects in the app settings.

A sample JSON configuration for the sound system:

```json
{
  "validation_confirm": {
    "path": "assets/sounds/cha_ching.mp3",
    "volume": 0.8,
    "loops": 0
  },
  "bingo_win": {
    "path": "assets/sounds/fanfare.mp3",
    "volume": 1.0,
    "loops": 0
  }
}
```

To ensure compatibility, MP3 files should be encoded at 128kbps or lower, and the library will automatically fall back to no audio if the file fails to load.

---

## Page 4 - Haptics: Physical Validation Feedback

Haptics are the third pillar of the validation feedback triad. While visual and auditory signals engage sight and hearing, a subtle vibration confirms recognition through the user's sense of touch, creating a truly multimodal experience that feels "real" and responsive.

- **iOS**: `UIImpactFeedbackGenerator` with `.medium` intensity for single confirmation.
- **Android**: `Vibration.vibrate(50)` for a short, crisp buzz.

In React Native, `react-native-haptic-feedback` provides a unified API across both platforms. The haptic trigger is placed inside the frame processor worklet, immediately after the CLIP embedding match is confirmed but before the chip animation completes. This timing ensures the haptic pulse arrives at the exact moment the user expects the "accept" feedback.

For accessibility, users who are deaf-blind can rely entirely on the haptic channel. For extended gameplay sessions, haptics can be reduced or disabled in settings to conserve battery.

---

## Page 5 - AR Hint Mode: "Heat Vision" Concept

The "heat vision" hint mode is a compass-based system that helps a stuck player locate the nearest artwork that satisfies an uncompleted bingo prompt (e.g., "A painting with a fountain"). The user activates this mode by tapping a dedicated button in the bottom toolbar, which toggles a new overlay showing a 2D arrow (or 3D pointer) pointing in the direction they need to move.

This mode relies on two distinct positioning technologies:

1. **Outdoor / Near-Entrance**: GPS plus device compass provide coarse heading. Accuracy is low indoors, but sufficient for large museum wings.
2. **Indoor**: BLE iBeacons or Wi-Fi RTT provide sub-5m positioning. The device's compass still provides absolute orientation.

The heat vision overlay is rendered via the VisionCamera Skia plugin, drawing the pointer directly onto the camera feed. Its position on screen is calculated from the angle between the user's current heading (from the compass) and the bearing to the target artwork's coordinates (stored in Firebase). The target artwork is determined by scanning the bingo card for the closest unvalidated prompt, pre-filtered by the user's current geofenced museum zone.

---

## Page 6 - iBeacon Technology for Indoor Positioning

iBeacon technology underpins the precise location awareness required for heat vision to work inside galleries. Beacons are small Bluetooth Low Energy (BLE) transmitters that broadcast a unique identifier. By measuring the received signal strength (RSSI) from multiple beacons, a mobile device can estimate its position with room-level accuracy (2-5m).

Museum.Bingo would deploy beacons (e.g., Kontakt.io, Estimote) at key positions such as gallery entrances, near large exhibits, and hallway intersections. The system uses trilateration (multiple beacon RSSI readings) to calculate coordinates and applies A* pathfinding to determine the walking route to the target artwork. The heat vision arrow then points along the first segment of that path.

- **Advantages**: Low deployment cost (~$20 per beacon), long battery life (2+ years), works with any smartphone.
- **Limitations**: Requires physical installation; RSSI can be noisy due to reflections.

For museums that cannot install beacons, a fallback method uses GPS (for large outdoor museums) or a simple "thataway" compass direction based on the relative positions of rooms stored in the app's floor plan data.

---

## Page 7 - AR Navigation with ARKit / ARCore (Heat Vision Optional)

For a more visually immersive heat vision mode, Museum.Bingo can use **ARKit (iOS) / ARCore (Android)** to project a 3D path arrow or a series of floating waypoints directly onto the floor of the camera view. This turns the phone into a true AR navigation device. The implementation follows a three-stage process:

1. **Indoor positioning**: Determine user location via beacons or visual markers.
2. **Route computation**: Calculate the path from current position to the target artwork's known coordinates.
3. **AR rendering**: Draw a continuous line, arrow, or set of glowing dots on the floor, using plane detection to anchor the graphics to the physical ground.

ARKit and ARCore both provide plane detection APIs that identify flat surfaces (floors, tables) in the camera view, allowing the app to pin AR objects to those surfaces with realistic occlusion. The rendered arrow updates its orientation and scale every frame based on the user's movement relative to the planned path. For iOS, `ARGeoTrackingConfiguration` can even be used to align AR content with real-world GPS coordinates when outdoors.

**Limitation**: This approach requires continuous camera usage, which can be battery-intensive and may obstruct the view of actual artworks. For Museum.Bingo's MVP, a 2D compass arrow overlaid on the camera (via Skia) is sufficient; full 3D AR navigation can be offered as a premium feature.

---

## Page 8 - Virtual Confetti: AR Party in Your Space

The ultimate reward in Museum.Bingo is the virtual confetti explosion upon achieving bingo. Unlike standard screen-based confetti, the AR version uses **plane detection** to make the confetti interact with the physical environment: the user sees paper strips fly through the air and then settle on the floor, some landing on nearby furniture or the ground, tracked by the device's understanding of the room's geometry.

The implementation on iOS uses **ARKit's `particle systems`** attached to a scene node positioned in world space. ARKit can create realistic effects such as snow, rain, fire, and confetti, complete with physics and gravity. The `SCNParticleSystem` allows tuning of birth rate, lifetime, velocity, and color over time. For Android, **ARCore's `Augmented Faces` or custom particle emitters** provide similar capabilities, though ARCore's plane detection must first be configured to identify the floor as a horizontal plane.

The confetti effect is triggered by the `bingo_win` event in JavaScript. The call is made to the native AR session via a bridge method. On iOS, this may involve invoking a Swift function that adds the particle system to the ARSCNView's scene; on Android, the Kotlin code would instantiate an `Anchor` at the camera's position and attach a particle emitter to it.

**Performance considerations**: Particle systems are GPU-intensive. For lower-end devices, the confetti can be replaced with a screen-scale particle effect (non-AR) or a simple animated image sequence, selectable via a performance settings toggle.

---

## Page 9 - Plane Detection: The Foundation of Grounded AR

Plane detection is the magic behind the confetti "landing on the floor." Both ARKit and ARCore can identify flat surfaces in the camera view, providing anchors at which to place 3D objects. In Museum.Bingo, the confetti uses the floor plane(s) as the collision surface.

- **ARKit**: Plane detection is configured when creating the `ARSession`. The session can detect horizontal planes (floors, tables) and vertical planes (walls, poster boards). Each detected plane is represented by an `ARPlaneAnchor` that provides its center, extent, and geometric shape. The app can add a particle system that falls onto these planes using SceneKit's physics engine.
- **ARCore**: Similarly, `Session.Config` sets `PlaneFindingMode` to `HORIZONTAL`. Detected planes are surfaced via `Plane` objects, and anchors can be attached to them.

The confetti effect first checks for a valid floor plane within a certain radius of the user. If one exists, the particle system is attached to an anchor placed just above the plane at the user's feet. As the user moves, the particle system remains world-locked, so confetti already on the floor stays put. If no plane is detected (e.g., in a dark or featureless space), the effect falls back to a screen-space particle overlay that does not interact with the environment.

**Startup sequence** (iOS example using ARKit plus SceneKit):

```swift
let configuration = ARWorldTrackingConfiguration()
configuration.planeDetection = [.horizontal]
sceneView.session.run(configuration)
```

---

## Page 10 - Integration Roadmap and Hackathon Implementation

This final page synthesizes the three AR polish features into a single, coherent development roadmap for the 13-day hackathon.

**Day 1-3: Overlay Animation (Core)**

- Set up VisionCamera v4 with Skia plugin.
- Implement `useSkiaFrameProcessor` to draw a bingo chip overlay on frame.
- Integrate `react-native-haptic-feedback` and `react-native-sound` for multimodal feedback.

**Day 4-6: AR Hint Mode (Heat Vision)**

- Add compass listener (`react-native-geolocation` plus orientation).
- Implement logic to select nearest unvalidated bingo prompt.
- Draw a Skia compass arrow on frame (2D version first).

**Day 7-8: iBeacon plus Indoor Positioning (Optional MVP)**

- Deploy two test Estimote beacons in mock museum environment.
- Implement RSSI scanning with `react-native-ble-plx`.
- Calculate rough position and feed into heat vision logic.

**Day 9-10: Virtual Confetti plus Plane Detection**

- Bridge to native AR session (ARKit / ARCore).
- Configure plane detection and particle system for confetti.
- Implement fallback to screen-space particles if plane detection fails.

**Day 11-13: Polish, Performance Testing, and Submission**

- Optimize frame processor (reduce GPU load, drop frames if needed).
- Test on both iOS and Android devices.
- Record demo video highlighting all three AR polish features.

**Why This Wins**:

- **Overlay Animation** with Skia demonstrates near-native GPU performance in React Native.
- **Heat Vision** elegantly solves player frustration using practical indoor positioning.
- **Virtual Confetti** with plane detection delivers a magical, shareable reward.
- The entire feature set is built on mature, well-documented libraries and platform APIs, ensuring the judges see both creativity and technical rigor.
