import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MockAvatarProfile } from '../../mock/mockVisualContent';
import { rarityGlow } from '../../mock/visualSystem';
import { appTheme } from '../../theme/tokens';

interface Props {
  profile: MockAvatarProfile;
  size?: number;
  status?: 'active' | 'inactive' | 'winner';
  style?: StyleProp<ViewStyle>;
}

const frameColor: Record<MockAvatarProfile['frame'], string> = {
  basic: '#98A7C4',
  winner: rarityGlow.legendary,
  streak: rarityGlow.rare,
  legend: rarityGlow.epic,
};

export const MockAvatar: React.FC<Props> = ({ profile, size = 42, status = 'active', style }) => {
  const badgeTone = status === 'winner' ? rarityGlow.legendary : status === 'inactive' ? '#667089' : '#76D4A1';
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={profile.token.alt} style={[styles.wrap, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: profile.token.palette[0],
            borderColor: frameColor[profile.frame],
          },
        ]}
      >
        <View style={[styles.tint, { backgroundColor: profile.token.palette[1] }]} />
        <Text style={[styles.initials, { fontSize: size * 0.32 }]}>{profile.initials}</Text>
      </View>
      <View style={[styles.dot, { backgroundColor: badgeTone }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.32,
  },
  initials: {
    fontWeight: '800',
    color: appTheme.colors.textPrimary,
    letterSpacing: 0.4,
  },
  dot: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    right: -1,
    bottom: -1,
    borderWidth: 1.5,
    borderColor: appTheme.colors.bgCard,
  },
});
