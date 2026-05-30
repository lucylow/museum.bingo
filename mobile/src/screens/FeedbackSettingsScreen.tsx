import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { soundService } from '../services/SoundService';
import { useHapticFeedback, type HapticType } from '../hooks/useHapticFeedback';
import { useValidationFeedback } from '../hooks/useValidationFeedback';

export const FeedbackSettingsScreen: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.8);
  const { isEnabled: hapticEnabled, intensity, updateSettings: updateHapticSettings } = useHapticFeedback();
  const [hapticIntensity, setHapticIntensity] = useState<HapticType>('impactMedium');
  const { triggerFeedback } = useValidationFeedback();

  useEffect(() => {
    void soundService.init().then(() => {
      const settings = soundService.getSettings();
      setSoundEnabled(settings.isEnabled);
      setSoundVolume(settings.volume);
    });
  }, []);

  useEffect(() => {
    setHapticIntensity(intensity);
  }, [intensity]);

  const toggleSound = async (value: boolean) => {
    setSoundEnabled(value);
    await soundService.updateSettings({ isEnabled: value });
  };

  const changeVolume = async (value: number) => {
    setSoundVolume(value);
    await soundService.updateSettings({ volume: value });
  };

  const toggleHaptic = async (value: boolean) => {
    await updateHapticSettings({ isEnabled: value });
  };

  const changeHapticIntensity = async (next: HapticType) => {
    setHapticIntensity(next);
    await updateHapticSettings({ intensity: next });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Feedback Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sound Effects</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Enable sound effects</Text>
          <Switch value={soundEnabled} onValueChange={toggleSound} />
        </View>
        <View style={styles.sliderRow}>
          <Text style={styles.label}>Volume</Text>
          <Slider
            value={soundVolume}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            onValueChange={setSoundVolume}
            onSlidingComplete={changeVolume}
          />
        </View>
        <Text style={styles.hint}>- Chip drop sound when validating tiles</Text>
        <Text style={styles.hint}>- Celebration fanfare on Bingo</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Haptic Feedback</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Enable vibration feedback</Text>
          <Switch value={hapticEnabled} onValueChange={toggleHaptic} />
        </View>

        {hapticEnabled && (
          <View style={styles.intensityRow}>
            <Text style={styles.label}>Intensity</Text>
            <View style={styles.buttonGroup}>
              {(['impactLight', 'impactMedium', 'impactHeavy'] as HapticType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.intensityButton, hapticIntensity === type && styles.activeButton]}
                  onPress={() => changeHapticIntensity(type)}
                >
                  <Text style={[styles.buttonText, hapticIntensity === type && styles.activeText]}>
                    {type.replace('impact', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.hint}>- Light/medium/heavy touch patterns for validation states</Text>
      </View>

      <TouchableOpacity style={styles.testButton} onPress={() => triggerFeedback('normal')}>
        <Text style={styles.testButtonText}>Test Feedback</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  section: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderRow: { marginBottom: 12 },
  intensityRow: { marginTop: 8 },
  label: { fontSize: 16 },
  buttonGroup: { flexDirection: 'row', marginTop: 8 },
  intensityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  activeButton: { backgroundColor: '#4CAF50' },
  buttonText: { fontSize: 14 },
  activeText: { color: '#FFF' },
  hint: { fontSize: 12, color: '#666', marginTop: 4 },
  testButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  testButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
