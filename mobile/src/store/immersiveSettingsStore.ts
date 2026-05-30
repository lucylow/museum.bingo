import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { defaultImmersiveSettings, type ImmersiveSettings } from '../immersive/immersiveSystem';

interface ImmersiveSettingsStore {
  settings: ImmersiveSettings;
  sceneMode: 'classicGallery' | 'modernGallery' | 'nightMuseum' | 'familyFun' | 'challenge';
  onboardingSeen: boolean;
  updateSetting: <K extends keyof ImmersiveSettings>(key: K, value: ImmersiveSettings[K]) => void;
  updateSettings: (partial: Partial<ImmersiveSettings>) => void;
  setSceneMode: (sceneMode: ImmersiveSettingsStore['sceneMode']) => void;
  markOnboardingSeen: () => void;
  resetImmersiveSettings: () => void;
}

export const useImmersiveSettingsStore = create<ImmersiveSettingsStore>()(
  persist(
    (set) => ({
      settings: defaultImmersiveSettings,
      sceneMode: 'classicGallery',
      onboardingSeen: false,
      updateSetting: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value,
          },
        })),
      updateSettings: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...partial,
          },
        })),
      setSceneMode: (sceneMode) => set({ sceneMode }),
      markOnboardingSeen: () => set({ onboardingSeen: true }),
      resetImmersiveSettings: () =>
        set({
          settings: defaultImmersiveSettings,
          sceneMode: 'classicGallery',
          onboardingSeen: false,
        }),
    }),
    {
      name: 'immersive-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
