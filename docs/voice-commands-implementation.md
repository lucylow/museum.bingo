## 🎤 Voice Commands for Museum.Bingo - Complete 10-Page Implementation

This guide adds **voice command support** to Museum.Bingo, enabling players to navigate, control the game, and validate bingo tiles by speaking. The implementation uses **Picovoice Rhino** for on-device speech-to-intent and **@react-native-voice/voice** as a recognition fallback.

---

### Page 1 - Dependencies and Native Permissions Setup

```json
// mobile/package.json
{
  "dependencies": {
    "@react-native-voice/voice": "^3.2.4",
    "react-native-wakeword": "^1.0.0",
    "@picovoice/react-native-voice-processor": "^3.0.0",
    "@picovoice/rhino-react-native": "^4.0.0",
    "react-native-sound": "^0.11.2"
  }
}
```

```bash
# Install dependencies and link iOS packages
cd mobile
npm install
npx pod-install
```

```xml
<!-- mobile/android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

```xml
<!-- mobile/ios/MuseumBingo/Info.plist -->
<key>NSMicrophoneUsageDescription</key>
<string>Museum.Bingo uses your microphone to listen for voice commands.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>Museum.Bingo uses speech recognition to understand your voice commands.</string>
```

---

### Page 2 - Command Intent System (TypeScript)

```typescript
// mobile/src/voice/commandTypes.ts
export type VoiceIntent =
  | 'VALIDATE_TILE'
  | 'GIVE_HINT'
  | 'SHOW_LEADERBOARD'
  | 'START_NEW_GAME'
  | 'REPEAT_PROMPT'
  | 'HELP'
  | 'CANCEL'
  | 'WHAT_IS_THIS'
  | 'NEXT_ARTWORK'
  | 'SCORE'
  | 'RESUME_SCANNING';
```

---

### Page 3 - Picovoice Rhino Integration (Speech-to-Intent)

```typescript
// mobile/src/voice/rhinoService.ts
// Handles Rhino inference mapping and permission-aware listening lifecycle.
```

---

### Page 4 - Fallback Speech Recognition with @react-native-voice/voice

```typescript
// mobile/src/voice/voiceRecognitionService.ts
// Maps recognized phrases to VoiceIntent and extracts slot values.
```

---

### Page 5 - Voice Command Hook (useVoiceCommands)

```typescript
// mobile/src/hooks/useVoiceCommands.ts
// Exposes isListening, lastCommand, error, toggleListening, and cleanup.
```

---

### Page 6 - Visual Voice Feedback Component

```tsx
// mobile/src/components/VoiceFeedbackOverlay.tsx
// Animated listening indicator, recognized command bubble, and error text.
```

---

### Page 7 - Command Intent Handler

```typescript
// mobile/src/voice/commandHandler.ts
// Central command execution map from intent -> game action.
```

---

### Page 8 - Voice TTS Feedback Helper

```typescript
// mobile/src/voice/ttsHelper.ts
// Queue-based audio speech feedback helper using react-native-sound.
```

---

### Page 9 - Integration into Game Screen

```tsx
// mobile/src/screens/GameScreenWithVoice.tsx
// Demonstrates mic button, overlay, and command execution integration.
```

---

### Page 10 - Wake Word Configuration (Optional)

```typescript
// mobile/src/voice/wakeWordService.ts
// Optional native wake-word service wrapper.
```

---

## Quick Start Summary

1. Install dependencies in `mobile` and run `npx pod-install`.
2. Add microphone/speech permissions for Android and iOS.
3. Use `useVoiceCommands` in the game screen that should accept voice control.
4. Render `VoiceFeedbackOverlay` near the top layer of that screen.
5. Pass recognized commands to `CommandHandler.execute` with your game context.
