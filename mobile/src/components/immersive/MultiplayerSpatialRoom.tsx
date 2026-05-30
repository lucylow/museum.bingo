import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../../theme/tokens';
import { MockAvatar } from '../mock/MockAvatar';
import { getMockAvatarBySeed } from '../../mock/mockVisualContent';

interface Player {
  userId: string;
  displayName: string;
  score: number;
}

interface Props {
  players: Player[];
  currentUserId: string;
}

export const MultiplayerSpatialRoom: React.FC<Props> = ({ players, currentUserId }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shared room space</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {sorted.map((player, index) => {
          const isCurrent = player.userId === currentUserId;
          const highlighted = index === 0 || isCurrent;
          return (
            <View key={player.userId} style={[styles.playerCard, highlighted && styles.highlighted]}>
              <MockAvatar profile={getMockAvatarBySeed(player.userId)} status={index === 0 ? 'winner' : 'active'} size={48} />
              <Text style={styles.name}>{isCurrent ? `${player.displayName} (you)` : player.displayName}</Text>
              <Text style={styles.score}>#{index + 1} • {player.score}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: appTheme.spacing.sm,
    marginTop: appTheme.spacing.xs,
    marginBottom: appTheme.spacing.xs,
  },
  title: {
    color: appTheme.colors.textSecondary,
    marginBottom: appTheme.spacing.xs,
    fontWeight: '700',
  },
  row: {
    gap: appTheme.spacing.xs,
    paddingRight: appTheme.spacing.sm,
  },
  playerCard: {
    width: 134,
    borderRadius: appTheme.radius.lg,
    borderColor: appTheme.colors.borderSoft,
    borderWidth: 1,
    padding: appTheme.spacing.xs,
    backgroundColor: appTheme.colors.bgCard,
    alignItems: 'center',
    ...appTheme.elevation.card,
  },
  highlighted: {
    borderColor: appTheme.colors.accentWarm,
    transform: [{ translateY: -2 }],
  },
  name: {
    color: appTheme.colors.textPrimary,
    marginTop: 6,
    fontSize: appTheme.typography.caption,
    textAlign: 'center',
  },
  score: {
    color: appTheme.colors.accentSuccess,
    fontWeight: '700',
    fontSize: appTheme.typography.caption,
    marginTop: 2,
  },
});
