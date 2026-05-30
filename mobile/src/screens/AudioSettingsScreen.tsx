import Slider from '@react-native-community/slider';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { type AudioLanguage, type AudioSettings, audioManager } from '../audio/AudioManager';
import { tts } from '../audio/TextToSpeechService';
import { useVoiceGuidance } from '../hooks/useVoiceGuidance';

const SUPPORTED_LANGUAGES: Array<{ code: AudioLanguage; name: string; nativeName: string }> = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
];

export const AudioSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<AudioSettings | null>(null);
  const { speakMessage, stopSpeaking } = useVoiceGuidance({ autoQueue: false });

  useEffect(() => {
    const load = async () => {
      await audioManager.initialize();
      setSettings(audioManager.getSettings());
    };
    void load();
  }, []);

  const updateSetting = async <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => {
    if (!settings) return;

    const next = { ...settings, [key]: value };
    await audioManager.updateSettings({ [key]: value });
    setSettings(next);

    if (key === 'voiceLanguage') {
      await tts.setLanguage(value as AudioLanguage);
    }
  };

  const testVoice = async () => {
    await stopSpeaking();
    await speakMessage('tileValidated', { points: 25 }, 10);
  };

  if (!settings) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading audio settings...</Text>
      </View>
    );
  }

  const activeLanguage = SUPPORTED_LANGUAGES.find((item) => item.code === settings.voiceLanguage);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sound Effects</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Play sound effects</Text>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(value) => {
              void updateSetting('soundEnabled', value);
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Voice Guidance</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Enable voice guidance</Text>
          <Switch
            value={settings.voiceEnabled}
            onValueChange={(value) => {
              void updateSetting('voiceEnabled', value);
            }}
          />
        </View>

        {settings.voiceEnabled ? (
          <>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Language</Text>
              <TouchableOpacity
                style={styles.languageSelector}
                onPress={() => {
                  Alert.alert(
                    'Select Language',
                    '',
                    SUPPORTED_LANGUAGES.map((language) => ({
                      text: `${language.name} (${language.nativeName})`,
                      onPress: () => {
                        void updateSetting('voiceLanguage', language.code);
                      },
                    })),
                  );
                }}
              >
                <Text style={styles.languageText}>{activeLanguage?.name ?? 'English'}</Text>
                <Text style={styles.chevron}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sliderRow}>
              <Text style={styles.settingLabel}>Speech speed</Text>
              <Slider
                style={styles.slider}
                value={settings.voiceSpeed}
                minimumValue={0.5}
                maximumValue={1.5}
                step={0.1}
                onSlidingComplete={(value) => {
                  void updateSetting('voiceSpeed', value);
                }}
              />
              <Text style={styles.sliderValue}>{settings.voiceSpeed.toFixed(1)}x</Text>
            </View>

            <View style={styles.sliderRow}>
              <Text style={styles.settingLabel}>Speech pitch</Text>
              <Slider
                style={styles.slider}
                value={settings.voicePitch}
                minimumValue={0.5}
                maximumValue={1.5}
                step={0.1}
                onSlidingComplete={(value) => {
                  void updateSetting('voicePitch', value);
                }}
              />
              <Text style={styles.sliderValue}>{settings.voicePitch.toFixed(1)}</Text>
            </View>

            <TouchableOpacity style={styles.testButton} onPress={() => void testVoice()}>
              <Text style={styles.testButtonText}>Test Voice</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What You Will Hear</Text>
        <Text style={styles.infoText}>- Tile validation confirmations</Text>
        <Text style={styles.infoText}>- Streak bonus announcements</Text>
        <Text style={styles.infoText}>- Line and Bingo celebrations</Text>
        <Text style={styles.infoText}>- Hints and guidance</Text>
        <Text style={styles.infoText}>- Badge unlock announcements</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    paddingRight: 12,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  languageText: {
    fontSize: 16,
    color: '#333',
    marginRight: 6,
  },
  chevron: {
    fontSize: 10,
    color: '#666',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  slider: {
    flex: 1,
    marginHorizontal: 12,
  },
  sliderValue: {
    width: 42,
    textAlign: 'right',
    color: '#666',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    paddingVertical: 4,
  },
});
