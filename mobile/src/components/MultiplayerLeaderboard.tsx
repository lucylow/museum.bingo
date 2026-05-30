import React, { useEffect, useMemo, useState } from 'react';
import { Animated, FlatList, StyleSheet, Text, View } from 'react-native';
import { getLeaderboard, LeaderboardEntry as ApiLeaderboardEntry } from '../api/multiplayer';
import { useMultiplayerSocket } from '../hooks/useMultiplayerSocket';
import { appTheme } from '../theme/tokens';

export type LeaderboardEntry = ApiLeaderboardEntry;

interface Props {
  roomId: string;
  currentUserId: string;
  initialPlayers: Record<string, LeaderboardEntry>;
  onRankChange?: (rank: number) => void;
}

export const MultiplayerLeaderboard: React.FC<Props> = ({ roomId, currentUserId, initialPlayers, onRankChange }) => {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [activityLine, setActivityLine] = useState('Waiting for players...');
  const [pulse] = useState(() => new Animated.Value(1));
  const { on } = useMultiplayerSocket();

  const sortPlayers = (playersObj: Record<string, LeaderboardEntry>) =>
    Object.values(playersObj).sort((a, b) => b.score - a.score);

  useEffect(() => {
    setPlayers(sortPlayers(initialPlayers));
  }, [initialPlayers]);

  useEffect(() => {
    const rank = players.findIndex((player) => player.userId === currentUserId) + 1;
    if (rank > 0) {
      onRankChange?.(rank);
    }
  }, [currentUserId, onRankChange, players]);

  useEffect(() => {
    let mounted = true;
    void getLeaderboard(roomId)
      .then((entries) => {
        if (mounted) {
          const playersObj = entries.reduce<Record<string, LeaderboardEntry>>((acc, entry) => {
            acc[entry.userId] = entry;
            return acc;
          }, {});
          setPlayers(sortPlayers(playersObj));
        }
      })
      .catch(() => {
        // Socket updates will still hydrate leaderboard.
      });

    const unsubScore = on('score-update', (payload: unknown) => {
      const { userId, newScore } = payload as { userId: string; newScore: number };
      setPlayers((prev) => {
        const name = prev.find((player) => player.userId === userId)?.displayName ?? 'A player';
        setActivityLine(`${name} scored. New score: ${newScore}`);
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.03, duration: 140, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
        return prev
          .map((player) => (player.userId === userId ? { ...player, score: newScore } : player))
          .sort((a, b) => b.score - a.score);
      });
    });

    const unsubJoin = on('player-joined', (payload: unknown) => {
      const { players: allPlayers } = payload as { players: Record<string, LeaderboardEntry> };
      setPlayers(sortPlayers(allPlayers));
    });

    const unsubLeft = on('player-left', (payload: unknown) => {
      const { userId } = payload as { userId: string };
      setPlayers((prev) => prev.filter((player) => player.userId !== userId));
    });

    const unsubLeaderboard = on('leaderboard-update', (payload: unknown) => {
      const leaderboard = payload as LeaderboardEntry[];
      const playersObj = leaderboard.reduce<Record<string, LeaderboardEntry>>((acc, entry) => {
        acc[entry.userId] = entry;
        return acc;
      }, {});
      setPlayers(sortPlayers(playersObj));
    });

    return () => {
      mounted = false;
      unsubScore();
      unsubJoin();
      unsubLeft();
      unsubLeaderboard();
    };
  }, [on, pulse, roomId]);

  const data = useMemo(() => players, [players]);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulse }] }]}>
      <Text style={styles.title}>Leaderboard</Text>
      <Text style={styles.activity}>{activityLine}</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.userId}
        renderItem={({ item, index }) => {
          const rank = index + 1;
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
          const isCurrent = item.userId === currentUserId;
          return (
            <Animated.View style={[styles.row, rank === 1 && styles.winnerRow, isCurrent && styles.currentRow]}>
              <Text style={styles.rank}>{medal}</Text>
              <Text style={styles.name}>
                {item.displayName} {isCurrent ? '(you)' : ''}
              </Text>
              <Text style={styles.score}>{item.score} pts</Text>
            </Animated.View>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.bgCard,
    borderRadius: appTheme.radius.lg,
    padding: appTheme.spacing.sm,
    margin: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
    ...appTheme.elevation.card,
  },
  title: {
    fontSize: appTheme.typography.subtitle,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
    color: appTheme.colors.textPrimary,
  },
  activity: {
    textAlign: 'center',
    color: appTheme.colors.accentWarm,
    fontSize: appTheme.typography.caption,
    marginBottom: appTheme.spacing.sm,
  },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: appTheme.spacing.xs,
    paddingHorizontal: appTheme.spacing.xs,
    borderBottomWidth: 0.5,
    borderColor: appTheme.colors.borderSoft,
    borderRadius: appTheme.radius.sm,
  },
  currentRow: { backgroundColor: appTheme.colors.glowCyan },
  winnerRow: { borderColor: appTheme.colors.accentWarm, borderWidth: 1 },
  rank: {
    width: 40,
    fontSize: appTheme.typography.body,
    fontWeight: 'bold',
    textAlign: 'center',
    color: appTheme.colors.textPrimary,
  },
  name: { flex: 1, fontSize: appTheme.typography.body, color: appTheme.colors.textPrimary },
  score: {
    fontSize: appTheme.typography.body,
    fontWeight: '700',
    marginRight: appTheme.spacing.sm,
    color: appTheme.colors.accentSuccess,
  },
});
