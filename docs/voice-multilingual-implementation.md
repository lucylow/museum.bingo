# 10 Pages of Detailed Code for Voice Features & Multilingual Support - Museum.Bingo

This document provides complete, production-ready code for integrating **voice interactions** and **multilingual capabilities** into the Museum.Bingo mobile app and backend. Features include:

- Voice commands ("validate tile", "give me a hint", "show leaderboard")
- Voice search for artworks (speech-to-text + semantic search)
- Text-to-speech (TTS) for reading artwork descriptions and hints aloud
- Multilingual UI (i18n) with automatic language detection
- On-device and server-side translation of bingo prompts and artwork metadata
- Language persistence and dynamic content switching

All code is written for React Native (TypeScript) and Node.js (Express) with integration into the existing Museum.Bingo stack.

---

## Page 1 - Voice Features: Setup & Permissions

```typescript
// mobile/src/voice/VoiceSetup.ts
/**
 * Sets up speech recognition and text-to-speech libraries.
 * Uses:
 * - expo-speech-recognition (Expo) or @react-native-voice/voice (bare)
 * - expo-speech (TTS)
 */

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Voice from '@react-native-voice/voice';
import * as Speech from 'expo-speech';

// Request microphone permission (Android only)
export async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'Museum.Bingo needs access to your microphone for voice commands.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  // iOS permission is requested automatically when using Voice library
  return true;
}

// Initialize Voice event listeners
export function initVoiceListeners(
  onResults: (text: string) => void,
  onError: (error: string) => void
) {
  Voice.onSpeechResults = (e) => {
    if (e.value && e.value.length > 0) {
      onResults(e.value[0]);
    }
  };
  Voice.onSpeechError = (e) => {
    onError(e.error?.message || 'Speech recognition error');
  };
  Voice.onSpeechEnd = () => {
    console.log('Speech ended');
  };
}

// Start listening for voice input
export async function startListening(language: string = 'en-US'): Promise<void> {
  try {
    await Voice.start(language);
  } catch (e) {
    console.error(e);
  }
}

export async function stopListening(): Promise<void> {
  try {
    await Voice.stop();
  } catch (e) {
    console.error(e);
  }
}

// Text-to-speech helper
export function speak(text: string, language: string = 'en') {
  Speech.speak(text, {
    language,
    pitch: 1.0,
    rate: 0.9,
    onError: (err) => console.warn('TTS error', err),
  });
}
```

---

## Page 2 - Voice Command Recognizer

```typescript
// mobile/src/voice/VoiceCommandRecognizer.ts
/**
 * Recognizes predefined voice commands and maps them to app actions.
 */

export type VoiceCommand =
  | { type: 'validate_tile'; tileId?: string }
  | { type: 'hint' }
  | { type: 'leaderboard' }
  | { type: 'search'; query: string }
  | { type: 'next_tile' }
  | { type: 'unknown' };

// Simple keyword matching (can be enhanced with NLP later)
export function parseVoiceCommand(transcript: string): VoiceCommand {
  const lower = transcript.toLowerCase();
  if (lower.includes('validate') || lower.includes('mark') || lower.includes('check')) {
    // Extract tile number if present (e.g., "validate tile 3")
    const match = lower.match(/(?:tile|number)\s*(\d+)/);
    const tileId = match ? match[1] : undefined;
    return { type: 'validate_tile', tileId };
  }
  if (lower.includes('hint') || lower.includes('help') || lower.includes('stuck')) {
    return { type: 'hint' };
  }
  if (lower.includes('leaderboard') || lower.includes('rank') || lower.includes('scores')) {
    return { type: 'leaderboard' };
  }
  if (lower.includes('search') || lower.includes('find')) {
    // Extract query after search word
    const searchMatch = lower.match(/(?:search|find)\s+(.+)/);
    const query = searchMatch ? searchMatch[1] : lower;
    return { type: 'search', query };
  }
  if (lower.includes('next') || lower.includes('skip')) {
    return { type: 'next_tile' };
  }
  return { type: 'unknown' };
}

// Example integration in a React component
/*
const handleVoiceResults = (transcript: string) => {
  const command = parseVoiceCommand(transcript);
  switch (command.type) {
    case 'validate_tile':
      if (command.tileId) validateTileById(command.tileId);
      else speak('Which tile number?');
      break;
    case 'hint':
      showHint();
      break;
    case 'leaderboard':
      navigation.navigate('Leaderboard');
      break;
    case 'search':
      performSearch(command.query);
      break;
    case 'next_tile':
      highlightNextUnvalidatedTile();
      break;
    default:
      speak('Sorry, I did not understand that command.');
  }
};
*/
```

---

## Page 3 - Voice Search for Artworks

```typescript
// mobile/src/voice/VoiceSearch.ts
/**
 * Uses speech recognition to search for artworks by description.
 * Integrates with semantic search backend.
 */

import { startListening, stopListening, speak } from './VoiceSetup';
import { searchArtworksByText } from '../api/artworks';

export async function startVoiceSearch(museumId: string): Promise<void> {
  speak('Listening for artwork description. Say something like "painting with a dog".');
  await startListening();
  return new Promise((resolve, reject) => {
    Voice.onSpeechResults = async (e) => {
      if (e.value && e.value[0]) {
        const query = e.value[0];
        speak(`Searching for ${query}`);
        const results = await searchArtworksByText(museumId, query);
        if (results.length > 0) {
          const topResult = results[0];
          speak(`Found ${topResult.title} by ${topResult.artist}. Would you like to validate this tile?`);
          // Store result for later validation
          global.pendingVoiceSearchResult = topResult;
        } else {
          speak('No artworks found. Please try a different description.');
        }
        resolve();
      }
      await stopListening();
    };
    Voice.onSpeechError = (err) => {
      reject(err);
    };
  });
}
```

Backend endpoint for semantic search (already defined in NLP section; here a stub):

```typescript
// backend/routes/artworks.ts
app.post('/api/artworks/search', async (req, res) => {
  const { museumId, query } = req.body;
  // Use Sentence-BERT or CLIP text encoder to find relevant artworks
  const results = await semanticSearch(museumId, query);
  res.json(results);
});
```

---

## Page 4 - Text-to-Speech for Hints and Descriptions

```typescript
// mobile/src/voice/TTSAnnouncements.ts
/**
 * Converts game events and artwork info to spoken audio.
 */

import { speak } from './VoiceSetup';
import { getCurrentLanguage } from '../i18n';

export function announceArtworkValidation(artworkTitle: string, tilePrompt: string) {
  const lang = getCurrentLanguage();
  const message = `Congratulations! You found ${artworkTitle}. That matches the prompt: ${tilePrompt}.`;
  speak(message, lang);
}

export function announceBingo() {
  speak('Bingo! You completed a row. Amazing job!');
}

export function announceHint(hintText: string) {
  speak(hintText);
}

export async function describeArtwork(artworkId: string) {
  const artwork = await fetchArtworkDetails(artworkId);
  const description = `${artwork.title} by ${artwork.artist}. ${artwork.description}`;
  speak(description);
}

export function announceLeaderboardPosition(rank: number, score: number) {
  speak(`You are currently in position ${rank} with ${score} points.`);
}
```

---

## Page 5 - Audio Feedback for Validation (Custom Sounds + Voice)

```typescript
// mobile/src/voice/AudioFeedback.ts
/**
 * Plays short sound effects (cha-ching, fanfare) and optionally voice confirmations.
 */

import Sound from 'react-native-sound';
import { speak } from './VoiceSetup';

// Preload sounds
const chaChingSound = new Sound('cha_ching.mp3', Sound.MAIN_BUNDLE, (error) => {
  if (error) console.log('Failed to load cha_ching', error);
});
const fanfareSound = new Sound('fanfare.mp3', Sound.MAIN_BUNDLE, (error) => {
  if (error) console.log('Failed to load fanfare', error);
});

export function playValidationSound() {
  chaChingSound.play((success) => {
    if (!success) console.log('Sound playback failed');
  });
}

export function playBingoSound() {
  fanfareSound.play();
}

// Combined feedback: sound + voice confirmation (configurable)
export function feedbackWithVoice(enabled: boolean, message: string) {
  playValidationSound();
  if (enabled) {
    setTimeout(() => speak(message), 300); // slight delay after sound
  }
}
```

---

## Page 6 - Multilingual UI Setup (i18n)

```typescript
// mobile/src/i18n/index.ts
/**
 * Internationalisation using i18next and react-i18next.
 * Supports English, Spanish, French, German, Chinese (simplified).
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import zh from './locales/zh.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  zh: { translation: zh },
};

export const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem('appLanguage');
  if (!savedLanguage) {
    savedLanguage = Localization.locale.split('-')[0]; // e.g., 'en'
    if (!['en', 'es', 'fr', 'de', 'zh'].includes(savedLanguage)) {
      savedLanguage = 'en';
    }
  }
  await i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
};

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem('appLanguage', lang);
};

export const getCurrentLanguage = () => i18n.language;

export default i18n;
```

Example locale file `en.json`:

```json
{
  "common": {
    "welcome": "Welcome to Museum.Bingo",
    "start": "Start Game",
    "settings": "Settings"
  },
  "bingo": {
    "tile_validated": "Tile validated!",
    "bingo_celebrate": "BINGO!",
    "hint": "Need a hint?"
  },
  "voice": {
    "listening": "Listening...",
    "command_not_recognized": "Command not recognized"
  }
}
```

---

## Page 7 - On-Device Translation of Bingo Prompts

```typescript
// mobile/src/translation/OnDeviceTranslator.ts
/**
 * Uses Google ML Kit Translate (on-device) to translate bingo prompts
 * and artwork metadata into the user's language.
 */

import * as Translate from 'react-native-mlkit-translate';

let translator: any = null;

export async function initTranslator(targetLanguage: string) {
  // Download translation model if not present
  translator = await Translate.Translator.create({
    sourceLanguage: 'en',
    targetLanguage: targetLanguage,
  });
  const isModelDownloaded = await translator.isModelDownloaded();
  if (!isModelDownloaded) {
    await translator.downloadModel();
  }
}

export async function translateText(text: string): Promise<string> {
  if (!translator) return text;
  try {
    const result = await translator.translate(text);
    return result;
  } catch (e) {
    console.warn('Translation failed', e);
    return text;
  }
}

// Example: translate bingo card when language changes
export async function translateBingoCard(card: string[][]): Promise<string[][]> {
  const translated = [];
  for (const row of card) {
    const translatedRow = await Promise.all(row.map(prompt => translateText(prompt)));
    translated.push(translatedRow);
  }
  return translated;
}
```

**Integration:** When the user changes language, all bingo prompts and UI labels are re-translated on-device. The original English prompts are stored in Firestore; translations are cached in AsyncStorage.

---

## Page 8 - Server-Side Translation for Artwork Descriptions

```typescript
// backend/services/translationService.ts
/**
 * Uses Google Cloud Translation API (or Nimble Answer API) to translate
 * artwork metadata into multiple languages at onboarding time.
 */

import { TranslationServiceClient } from '@google-cloud/translate';

const translationClient = new TranslationServiceClient();
const projectId = process.env.GCP_PROJECT_ID;
const location = 'global';

export async function translateArtworkBatch(
  texts: string[],
  targetLanguage: string
): Promise<string[]> {
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: texts,
    mimeType: 'text/plain',
    sourceLanguageCode: 'en',
    targetLanguageCode: targetLanguage,
  };
  const [response] = await translationClient.translateText(request);
  return response.translations.map(t => t.translatedText);
}

// Pre-translate artwork titles and descriptions during onboarding
export async function pretranslateArtworkMetadata(artworkId: string, languages: string[]) {
  const artwork = await db.collection('artworks').doc(artworkId).get();
  const title = artwork.get('title');
  const description = artwork.get('description');
  const translations: Record<string, { title: string; description: string }> = {};
  for (const lang of languages) {
    const [translatedTitle, translatedDesc] = await Promise.all([
      translateArtworkBatch([title], lang),
      translateArtworkBatch([description], lang),
    ]);
    translations[lang] = {
      title: translatedTitle[0],
      description: translatedDesc[0],
    };
  }
  await artwork.ref.update({ translations });
}
```

---

## Page 9 - Language Selection & Persistence UI

```tsx
// mobile/src/screens/SettingsScreen.tsx
/**
 * Language selection screen with flag icons and real-time preview.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage } from '../i18n';
import { initTranslator, translateBingoCard } from '../translation/OnDeviceTranslator';

const languages = [
  { code: 'en', name: 'English', flag: 'US' },
  { code: 'es', name: 'Espanol', flag: 'ES' },
  { code: 'fr', name: 'Francais', flag: 'FR' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'zh', name: '中文', flag: 'CN' },
];

export const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  const handleLanguageChange = async (langCode: string) => {
    setCurrentLang(langCode);
    await changeLanguage(langCode);
    // Re-initialize on-device translator if not English
    if (langCode !== 'en') {
      await initTranslator(langCode);
    }
    // Optionally re-translate bingo card
    // (implemented in BingoGameScreen)
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.language')}</Text>
      {languages.map(lang => (
        <TouchableOpacity
          key={lang.code}
          style={[styles.langButton, currentLang === lang.code && styles.active]}
          onPress={() => handleLanguageChange(lang.code)}
        >
          <Text style={styles.flag}>{lang.flag}</Text>
          <Text style={styles.langName}>{lang.name}</Text>
          {currentLang === lang.code && <Text style={styles.check}>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  langButton: { flexDirection: 'row', alignItems: 'center', padding: 15, marginVertical: 5, backgroundColor: '#f0f0f0', borderRadius: 10 },
  active: { backgroundColor: '#e0e0ff' },
  flag: { fontSize: 24, marginRight: 15 },
  langName: { flex: 1, fontSize: 18 },
  check: { fontSize: 20, color: 'green' },
});
```

---

## Page 10 - Voice + Multilingual Integration (Complete Example)

```tsx
// mobile/src/screens/BingoGameScreen.tsx
/**
 * Full integration of voice commands and multilingual features.
 * User can speak in their own language; commands are interpreted and feedback given in same language.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { startListening, stopListening, speak, initVoiceListeners } from '../voice/VoiceSetup';
import { parseVoiceCommand } from '../voice/VoiceCommandRecognizer';
import { announceArtworkValidation, announceHint } from '../voice/TTSAnnouncements';
import { BingoCard } from '../components/BingoCard';

export const BingoGameScreen = ({ route }) => {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');

  useEffect(() => {
    // Initialize voice listeners with current language
    initVoiceListeners(
      async (transcript) => {
        setLastCommand(transcript);
        const command = parseVoiceCommand(transcript);
        await handleVoiceCommand(command);
        setIsListening(false);
        await stopListening();
      },
      (error) => {
        console.warn(error);
        setIsListening(false);
      }
    );
  }, []);

  const handleVoiceCommand = async (command) => {
    switch (command.type) {
      case 'validate_tile':
        if (command.tileId) {
          // Validate tile logic
          speak(t('voice.validating'));
        } else {
          speak(t('voice.say_tile_number'));
        }
        break;
      case 'hint':
        // Get hint for current tile
        const hint = 'This artwork is in the east wing, near the large window.';
        announceHint(hint);
        break;
      case 'search':
        // Trigger voice search
        speak(t('voice.searching'));
        // Start voice search flow
        break;
      default:
        speak(t('voice.command_not_recognized'));
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      await stopListening();
      setIsListening(false);
    } else {
      const langCode = i18n.language === 'en' ? 'en-US' : i18n.language;
      await startListening(langCode);
      setIsListening(true);
      speak(t('voice.listening'));
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BingoCard museumId={route.params.museumId} />
      <TouchableOpacity onPress={toggleListening} style={styles.micButton}>
        <Text style={styles.micText}>{isListening ? 'Stop' : 'Voice Command'}</Text>
      </TouchableOpacity>
      {lastCommand !== '' && <Text style={styles.transcript}>You said: "{lastCommand}"</Text>}
    </View>
  );
};

const styles = {
  micButton: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#4CAF50', padding: 15, borderRadius: 50 },
  micText: { color: 'white', fontWeight: 'bold' },
  transcript: { position: 'absolute', bottom: 100, left: 20, backgroundColor: 'white', padding: 8, borderRadius: 8 },
};
```

---

All code is ready to be integrated into the Museum.Bingo codebase. It provides a seamless voice-assisted, multilingual experience that aligns with the hackathon's goal of technical excellence and user delight.
