import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MockImageToken } from '../../mock/visualSystem';
import { MockImageFrame } from '../mock/MockImageFrame';
import { appTheme } from '../../theme/tokens';
import { immersiveTokens } from '../../immersive/immersiveSystem';

interface Props {
  token: MockImageToken;
  title: string;
  artist: string;
  museumLabel: string;
  statusLabel: string;
  bonusLabel?: string;
  highlighted?: boolean;
  tiltX?: number;
  tiltY?: number;
  onPress?: () => void;
}

export const FloatingArtworkCard3D: React.FC<Props> = ({
  token,
  title,
  artist,
  museumLabel,
  statusLabel,
  bonusLabel,
  highlighted,
  tiltX = 0,
  tiltY = 0,
  onPress,
}) => {
  const rotateY = `${tiltX * immersiveTokens.card.rotationMaxDeg}deg`;
  const rotateX = `${tiltY * immersiveTokens.card.rotationMaxDeg * -0.8}deg`;
  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.card,
          highlighted && styles.highlighted,
          {
            transform: [{ perspective: 900 }, { rotateY }, { rotateX }, { scale: highlighted ? 1.04 : 1 }],
          },
        ]}
      >
        <MockImageFrame token={token} label={title} subtitle={artist} />
        <View style={styles.metaRow}>
          <Text style={styles.tag}>{museumLabel}</Text>
          <Text style={styles.status}>{statusLabel}</Text>
        </View>
        {bonusLabel ? <Text style={styles.bonus}>{bonusLabel}</Text> : null}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
    padding: appTheme.spacing.xs,
    backgroundColor: 'rgba(12, 21, 38, 0.82)',
    ...appTheme.elevation.floating,
  },
  highlighted: {
    borderColor: appTheme.colors.accentWarm,
    shadowColor: appTheme.colors.accentWarm,
    shadowOpacity: 0.33,
    shadowRadius: 20,
  },
  metaRow: {
    marginTop: appTheme.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tag: {
    color: appTheme.colors.textSecondary,
    fontSize: appTheme.typography.caption,
  },
  status: {
    color: appTheme.colors.accentSuccess,
    fontWeight: '700',
    fontSize: appTheme.typography.caption,
  },
  bonus: {
    marginTop: 4,
    color: appTheme.colors.accentWarm,
    fontSize: appTheme.typography.overline,
  },
});
