import Slider from '@react-native-community/slider';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useImmersiveSettingsStore } from '../store/immersiveSettingsStore';
import { appTheme } from '../theme/tokens';

const sceneModes = [
  { id: 'classicGallery', label: 'Classic gallery' },
  { id: 'modernGallery', label: 'Modern gallery' },
  { id: 'nightMuseum', label: 'Night museum' },
  { id: 'familyFun', label: 'Family fun' },
  { id: 'challenge', label: 'Challenge mode' },
] as const;

export const ImmersiveSettingsScreen: React.FC = () => {
  const { settings, sceneMode, updateSetting, setSceneMode, resetImmersiveSettings } = useImmersiveSettingsStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Immersive settings</Text>
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Enable immersive mode</Text>
          <Switch value={settings.enabled} onValueChange={(value) => updateSetting('enabled', value)} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Comfort mode</Text>
          <Switch value={settings.comfortMode} onValueChange={(value) => updateSetting('comfortMode', value)} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Reduced motion</Text>
          <Switch value={settings.reducedMotion} onValueChange={(value) => updateSetting('reducedMotion', value)} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>High contrast UI</Text>
          <Switch value={settings.highContrastUI} onValueChange={(value) => updateSetting('highContrastUI', value)} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Minimal overlay mode</Text>
          <Switch value={settings.minimalOverlayMode} onValueChange={(value) => updateSetting('minimalOverlayMode', value)} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Low power mode</Text>
          <Switch value={settings.lowPowerMode} onValueChange={(value) => updateSetting('lowPowerMode', value)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Motion and depth</Text>
        {[
          { key: 'motionSensitivity', label: 'Motion sensitivity' },
          { key: 'cameraTiltStrength', label: 'Camera tilt strength' },
          { key: 'floatingIntensity', label: 'Floating intensity' },
          { key: 'depthIntensity', label: 'Depth intensity' },
          { key: 'animationSpeed', label: 'Animation speed' },
          { key: 'lightingContrast', label: 'Lighting contrast' },
        ].map((entry) => (
          <View key={entry.key} style={styles.sliderWrap}>
            <Text style={styles.sliderLabel}>
              {entry.label}: {settings[entry.key as keyof typeof settings].toFixed(2)}
            </Text>
            <Slider
              value={Number(settings[entry.key as keyof typeof settings])}
              minimumValue={0}
              maximumValue={entry.key === 'animationSpeed' ? 1.4 : 1}
              step={0.05}
              onSlidingComplete={(value) => updateSetting(entry.key as keyof typeof settings, value as never)}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scene ambiance</Text>
        <View style={styles.modeRow}>
          {sceneModes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[styles.modeButton, sceneMode === mode.id && styles.modeButtonActive]}
              onPress={() => setSceneMode(mode.id)}
            >
              <Text style={[styles.modeText, sceneMode === mode.id && styles.modeTextActive]}>{mode.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetImmersiveSettings}>
        <Text style={styles.resetText}>Reset immersive preferences</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: appTheme.colors.bg },
  content: { padding: appTheme.spacing.md, paddingBottom: appTheme.spacing.xl },
  title: { color: appTheme.colors.textPrimary, fontSize: appTheme.typography.title, fontWeight: '800', marginBottom: appTheme.spacing.sm },
  section: {
    backgroundColor: appTheme.colors.bgCard,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
    padding: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.sm,
  },
  sectionTitle: { color: appTheme.colors.textPrimary, fontWeight: '700', marginBottom: appTheme.spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  label: { color: appTheme.colors.textSecondary, flex: 1, paddingRight: appTheme.spacing.sm },
  sliderWrap: { marginBottom: 8 },
  sliderLabel: { color: appTheme.colors.textSecondary, marginBottom: 2 },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeButton: {
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
  },
  modeButtonActive: { borderColor: appTheme.colors.accentWarm, backgroundColor: 'rgba(255,176,86,0.12)' },
  modeText: { color: appTheme.colors.textSecondary, fontSize: appTheme.typography.caption },
  modeTextActive: { color: appTheme.colors.accentWarm, fontWeight: '700' },
  resetButton: {
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderStrong,
    backgroundColor: appTheme.colors.bgCard,
    alignItems: 'center',
    paddingVertical: appTheme.spacing.sm,
  },
  resetText: { color: appTheme.colors.textPrimary, fontWeight: '700' },
});
