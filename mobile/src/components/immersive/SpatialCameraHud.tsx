import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../../theme/tokens';

interface Props {
  confidence: number;
  scanState: 'scanning' | 'almost' | 'matched' | 'error';
}

export const SpatialCameraHud: React.FC<Props> = ({ confidence, scanState }) => {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={styles.reticleOuter}>
        <View style={[styles.reticleInner, scanState === 'matched' && styles.reticleSuccess]} />
        <Text style={styles.reticleText}>{Math.round(confidence * 100)}%</Text>
      </View>
      <View style={styles.arcTrack}>
        <View style={[styles.arcFill, { width: `${Math.max(10, Math.round(confidence * 100))}%` }]} />
      </View>
      <Text style={styles.stateLabel}>
        {scanState === 'matched'
          ? 'Match confidence high'
          : scanState === 'almost'
            ? 'Hover and steady'
            : scanState === 'error'
              ? 'Sensor issue'
              : 'Finding artwork'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: '34%',
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: appTheme.spacing.xs,
  },
  reticleOuter: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderColor: 'rgba(255,255,255,0.28)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleInner: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: appTheme.colors.accent,
    backgroundColor: 'rgba(83, 208, 255, 0.14)',
  },
  reticleSuccess: {
    borderColor: appTheme.colors.accentSuccess,
    backgroundColor: 'rgba(97, 226, 148, 0.16)',
  },
  reticleText: {
    color: appTheme.colors.textPrimary,
    fontWeight: '800',
  },
  arcTrack: {
    width: 220,
    height: 8,
    borderRadius: appTheme.radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  arcFill: {
    height: '100%',
    backgroundColor: appTheme.colors.accentWarm,
  },
  stateLabel: {
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.typography.caption,
  },
});
