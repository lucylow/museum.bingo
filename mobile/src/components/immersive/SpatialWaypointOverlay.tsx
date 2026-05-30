import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getDirectionalCue, getMoveCloserCue } from '../../immersive/immersiveSystem';
import { appTheme } from '../../theme/tokens';

interface Props {
  relativeBearing: number;
  distanceMeters: number;
  targetTitle: string;
}

export const SpatialWaypointOverlay: React.FC<Props> = ({ relativeBearing, distanceMeters, targetTitle }) => {
  const direction = getDirectionalCue(relativeBearing);
  const proximity = getMoveCloserCue(distanceMeters);
  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        <Text style={styles.arrow}>{direction === 'left' ? '↺' : direction === 'right' ? '↻' : direction === 'behind' ? '⟲' : '↑'}</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.title}>{targetTitle}</Text>
        <Text style={styles.meta}>
          {Math.round(distanceMeters)}m • {direction} • {proximity}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: appTheme.spacing.xs,
    marginTop: appTheme.spacing.sm,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: appTheme.colors.accentWarm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 176, 86, 0.16)',
  },
  arrow: {
    color: appTheme.colors.accentWarm,
    fontSize: 28,
    fontWeight: '800',
  },
  panel: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: appTheme.radius.pill,
    borderColor: appTheme.colors.borderSoft,
    borderWidth: 1,
    backgroundColor: appTheme.colors.overlayDark,
  },
  title: {
    color: appTheme.colors.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
  },
  meta: {
    color: appTheme.colors.textSecondary,
    textAlign: 'center',
    fontSize: appTheme.typography.caption,
  },
});
