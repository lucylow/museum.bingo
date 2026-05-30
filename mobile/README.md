# Mobile AI Setup

## Download MobileCLIP assets

```bash
curl -L -O https://huggingface.co/anton96vice/mobileclip2_tflite/resolve/main/mobileclip_s2_datacompdr_last.tflite
curl -L -O https://huggingface.co/anton96vice/mobileclip2_tflite/resolve/main/id_mapping.json
```

Place both files in:

- `android/app/src/main/assets/models/`

For iOS, bundle the same assets in your Xcode target resources so they resolve from `MainBundlePath`.

## Heat Vision setup

Heat Vision (AR hint compass) depends on the following runtime capabilities:

- Compass heading (`react-native-nitro-compass`)
- GPS fallback (`react-native-geolocation-service`)
- Indoor beacon ranging (`react-native-beacon-kit`)
- Optional Android Wi-Fi RTT native module (`WifiRTTModule`)

Permissions required:

- iOS: location (when in use), Bluetooth usage descriptions
- Android: fine/coarse location, Bluetooth scan/connect, foreground service

The core implementation lives in:

- `src/services/CompassService.ts`
- `src/services/BeaconService.ts`
- `src/services/WifiRTTService.ts`
- `src/services/PositioningService.ts`
- `src/services/HeatVisionTargetService.ts`
- `src/hooks/useHeatVision.ts`
- `src/screens/CameraScreenWithHeatVision.tsx`
