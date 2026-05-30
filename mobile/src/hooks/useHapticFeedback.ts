import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import HapticFeedback from 'react-native-haptic-feedback';

export type HapticType = 'impactLight' | 'impactMedium' | 'impactHeavy' | 'notificationSuccess';

interface HapticSettings {
  isEnabled: boolean;
  intensity: HapticType;
}

const HAPTIC_SETTINGS_KEY = 'hapticSettings';

const DEFAULT_SETTINGS: HapticSettings = {
  isEnabled: true,
  intensity: 'impactMedium',
};

const HAPTIC_OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const useHapticFeedback = () => {
  const [settings, setSettings] = useState<HapticSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const loadSettings = async () => {
      const saved = await AsyncStorage.getItem(HAPTIC_SETTINGS_KEY);
      if (!saved) return;

      try {
        const parsed = JSON.parse(saved) as Partial<HapticSettings>;
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch {
        // Ignore corrupt persisted settings.
      }
    };

    void loadSettings();
  }, []);

  const trigger = useCallback(
    (type?: HapticType) => {
      if (!settings.isEnabled) return;
      HapticFeedback.trigger(type ?? settings.intensity, HAPTIC_OPTIONS);
    },
    [settings.intensity, settings.isEnabled],
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<HapticSettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem(HAPTIC_SETTINGS_KEY, JSON.stringify(updated));
    },
    [settings],
  );

  return {
    trigger,
    updateSettings,
    isEnabled: settings.isEnabled,
    intensity: settings.intensity,
  };
};
