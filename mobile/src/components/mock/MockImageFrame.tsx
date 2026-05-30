import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle, useColorScheme } from 'react-native';
import { appTheme } from '../../theme/tokens';
import { MockImageToken, mockAspectRatio, mockVisualRadii, mockVisualShadow, visualCardBorder } from '../../mock/visualSystem';

interface Props {
  token: MockImageToken;
  style?: StyleProp<ViewStyle>;
  label?: string;
  subtitle?: string;
  compact?: boolean;
}

export const MockImageFrame: React.FC<Props> = ({ token, style, label, subtitle, compact = false }) => {
  const radius = mockVisualRadii[token.aspect];
  const scheme = useColorScheme();
  const captionBg = scheme === 'light' ? 'rgba(245, 248, 255, 0.64)' : 'rgba(5, 9, 20, 0.36)';
  const captionColor = scheme === 'light' ? '#1A2745' : appTheme.colors.textPrimary;
  const subcaptionColor = scheme === 'light' ? '#334771' : appTheme.colors.textSecondary;
  return (
    <View
      accessibilityRole="image"
      accessible
      accessibilityLabel={token.alt}
      style={[styles.frame, { backgroundColor: token.fallbackColor, borderRadius: radius, aspectRatio: mockAspectRatio[token.aspect] }, style]}
    >
      <View style={[styles.gradientLayer, { backgroundColor: token.palette[1] }]} />
      <View style={[styles.glowLayer, { backgroundColor: token.palette[2] }]} />
      <View style={styles.strokeRows}>
        <View style={[styles.stroke, { backgroundColor: token.palette[2] }]} />
        <View style={[styles.stroke, styles.strokeShort, { backgroundColor: token.palette[0] }]} />
      </View>
      <View style={[styles.captionWrap, { backgroundColor: captionBg }]}>
        <Text style={[styles.caption, { color: captionColor }]}>{label ?? token.label}</Text>
        {!compact && subtitle ? <Text style={[styles.subcaption, { color: subcaptionColor }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: appTheme.spacing.sm,
    ...mockVisualShadow,
    ...visualCardBorder,
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.34,
    transform: [{ rotate: '-15deg' }, { scale: 1.2 }],
  },
  glowLayer: {
    position: 'absolute',
    width: '68%',
    height: '50%',
    right: -20,
    top: -12,
    borderRadius: 80,
    opacity: 0.24,
  },
  strokeRows: {
    marginTop: appTheme.spacing.xs,
    gap: appTheme.spacing.xxs,
  },
  stroke: {
    height: 7,
    width: '78%',
    borderRadius: appTheme.radius.pill,
    opacity: 0.6,
  },
  strokeShort: {
    width: '54%',
    opacity: 0.36,
  },
  captionWrap: {
    marginTop: 'auto',
    borderRadius: appTheme.radius.md,
    padding: appTheme.spacing.xs,
  },
  caption: {
    fontSize: appTheme.typography.caption,
    fontWeight: '800',
  },
  subcaption: {
    marginTop: 2,
    fontSize: appTheme.typography.overline,
    fontWeight: '600',
  },
});
