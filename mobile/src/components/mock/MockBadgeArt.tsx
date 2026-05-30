import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MockImageToken, rarityGlow } from '../../mock/visualSystem';
import { appTheme } from '../../theme/tokens';

interface Props {
  token: MockImageToken;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  iconText: string;
  style?: StyleProp<ViewStyle>;
}

export const MockBadgeArt: React.FC<Props> = ({ token, rarity, iconText, style }) => (
  <View
    style={[
      styles.badge,
      {
        borderColor: rarityGlow[rarity],
        backgroundColor: token.palette[0],
      },
      style,
    ]}
    accessibilityRole="image"
    accessibilityLabel={token.alt}
  >
    <View style={[styles.tint, { backgroundColor: token.palette[1] }]} />
    <View style={[styles.inner, { borderColor: token.palette[2] }]}>
      <Text style={styles.icon}>{iconText}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  inner: {
    width: 35,
    height: 35,
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 12, 26, 0.35)',
  },
  icon: {
    color: appTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
});
