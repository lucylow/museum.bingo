import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ImmersiveOnboardingOverlay } from './ImmersiveOnboardingOverlay';
import { computeParallaxShift, sceneModePalette, type ImmersiveSceneMode, type ImmersiveSettings } from '../../immersive/immersiveSystem';
import { appTheme } from '../../theme/tokens';

interface Props {
  settings: ImmersiveSettings;
  sceneMode: ImmersiveSceneMode;
  tiltX: number;
  tiltY: number;
  onboardingVisible: boolean;
  onDismissOnboarding: () => void;
  onExit: () => void;
  onToggleComfort: () => void;
  children: React.ReactNode;
}

export const ImmersiveSceneShell: React.FC<Props> = ({
  settings,
  sceneMode,
  tiltX,
  tiltY,
  onboardingVisible,
  onDismissOnboarding,
  onExit,
  onToggleComfort,
  children,
}) => {
  const palette = sceneModePalette[sceneMode];
  const far = useMemo(() => computeParallaxShift('far', tiltX, tiltY, settings), [settings, tiltX, tiltY]);
  const mid = useMemo(() => computeParallaxShift('mid', tiltX, tiltY, settings), [settings, tiltX, tiltY]);
  const near = useMemo(() => computeParallaxShift('near', tiltX, tiltY, settings), [settings, tiltX, tiltY]);
  const contrastBoost = settings.highContrastUI ? 1.2 : 1;

  return (
    <View style={styles.container}>
      <View style={[styles.bgFar, { backgroundColor: palette.bgBottom, transform: [{ translateX: far.x }, { translateY: far.y }] }]} />
      <View style={[styles.bgMid, { backgroundColor: palette.bgTop, transform: [{ translateX: mid.x }, { translateY: mid.y }] }]} />
      <View style={[styles.ambientHalo, { backgroundColor: palette.particle, opacity: settings.lightingContrast * 0.6 }]} />
      <View style={[styles.content, { transform: [{ translateX: near.x * 0.48 }, { translateY: near.y * 0.48 }, { scale: contrastBoost }] }]}>
        {children}
      </View>
      <View style={styles.topControls}>
        <Pressable style={styles.controlButton} onPress={onExit}>
          <Text style={styles.controlText}>Exit immersive</Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={onToggleComfort}>
          <Text style={styles.controlText}>{settings.comfortMode ? 'Comfort on' : 'Comfort off'}</Text>
        </Pressable>
      </View>
      <ImmersiveOnboardingOverlay visible={onboardingVisible} onDismiss={onDismissOnboarding} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  bgFar: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.92,
  },
  bgMid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.62,
  },
  ambientHalo: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    top: -110,
    left: -70,
  },
  content: {
    flex: 1,
    paddingTop: 58,
  },
  topControls: {
    position: 'absolute',
    top: appTheme.spacing.sm,
    left: appTheme.spacing.sm,
    right: appTheme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    borderRadius: appTheme.radius.pill,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 6,
    backgroundColor: appTheme.colors.overlayDark,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
  },
  controlText: {
    color: appTheme.colors.textPrimary,
    fontSize: appTheme.typography.caption,
    fontWeight: '700',
  },
});
