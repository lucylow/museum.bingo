import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getRoom, updateTileValidation } from '../api/multiplayer';
import { LanguageSelector } from '../components/LanguageSelector';
import { MultiplayerLeaderboard } from '../components/MultiplayerLeaderboard';
import { SessionRecapModal } from '../components/stats/SessionRecapModal';
import { StatCard } from '../components/stats/StatCard';
import { TranslatedBingoCard } from '../components/TranslatedBingoCard';
import { useAuth } from '../context/AuthContext';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { useGameplayStats } from '../hooks/useGameplayStats';
import { useMultiplayerSync } from '../hooks/useMultiplayerSync';
import { useMultiplayerSocket } from '../hooks/useMultiplayerSocket';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { appTheme } from '../theme/tokens';
import { MOCK_EVENT_THEMES } from '../mock/mockVisualContent';
import { MockImageFrame } from '../components/mock/MockImageFrame';
import { MultiplayerSpatialRoom } from '../components/immersive/MultiplayerSpatialRoom';
import { useImmersiveSettingsStore } from '../store/immersiveSettingsStore';

type PlayerState = {
  userId: string;
  displayName: string;
  score: number;
  completedTiles: string[];
};

type GameRoute = {
  params: {
    roomId: string;
    museumId: string;
    isHost: boolean;
  };
};

type GameProps = {
  route: GameRoute;
  navigation: { goBack: () => void };
};

const MultiplayerGameScreenContent: React.FC<GameProps> = ({ route, navigation }) => {
  const { roomId, isHost } = route.params;
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const { emit, on } = useMultiplayerSocket();
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<Record<string, PlayerState>>({});
  const [bingoCard, setBingoCard] = useState<string[][]>([]);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [showRecap, setShowRecap] = useState(false);
  const [sessionId] = useState(() => `mp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const [spatialRoomMode, setSpatialRoomMode] = useState(false);
  const immersiveEnabled = useImmersiveSettingsStore((state) => state.settings.enabled);

  const completedTiles = useMultiplayerStore((state) => state.completedTiles);
  const setScore = useMultiplayerStore((state) => state.setScore);
  const addCompletedTile = useMultiplayerStore((state) => state.addCompletedTile);
  const { isReconnecting } = useMultiplayerSync(roomId, user?.uid ?? '');
  const { latestSnapshot, startSession, endSession, track } = useGameplayStats();

  useEffect(() => {
    if (!user) {
      return;
    }
    startSession({
      userId: user.uid,
      sessionId,
      mode: 'multiplayer',
      museumId: route.params.museumId,
      roomId,
    });

    void getRoom(roomId)
      .then((room) => {
        setPlayers(room.players as Record<string, PlayerState>);
        setBingoCard(room.bingoCard);
        setGameStarted(room.status === 'playing');
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to load room');
        navigation.goBack();
      });

    emit('join-room', { roomId, displayName: user.displayName });
    track({
      type: 'room_joined',
      userId: user.uid,
      sessionId,
      museumId: route.params.museumId,
      roomId,
      metadata: { isHost },
      idempotencyKey: `room-joined-${sessionId}-${roomId}`,
    });

    const unsubStart = on('game-started', () => setGameStarted(true));
    const unsubScore = on('score-update', (payload: unknown) => {
      const { userId, newScore } = payload as { userId: string; newScore: number };
      if (userId === user.uid) {
        setScore(newScore);
      }
      setPlayers((prev) => {
        const next = {
          ...prev,
          [userId]: { ...(prev[userId] || { userId, displayName: 'Player', completedTiles: [] }), score: newScore },
        };
        if (userId === user.uid) {
          const sorted = Object.values(next).sort((a, b) => b.score - a.score);
          const rank = sorted.findIndex((entry) => entry.userId === user.uid) + 1;
          track({
            type: 'leaderboard_rank_changed',
            userId: user.uid,
            sessionId,
            museumId: route.params.museumId,
            roomId,
            metadata: { rank },
            idempotencyKey: `rank-${sessionId}-${rank}-${newScore}`,
          });
        }
        return next;
      });
    });
    const unsubTileCompleted = on('tile-completed', (payload: unknown) => {
      const { userId, tileId, newScore } = payload as { userId: string; tileId: string; newScore: number };
      if (userId === user.uid) {
        setScore(newScore);
        addCompletedTile(tileId);
      }
    });

    return () => {
      unsubStart();
      unsubScore();
      unsubTileCompleted();
      track({
        type: 'room_left',
        userId: user.uid,
        sessionId,
        museumId: route.params.museumId,
        roomId,
        idempotencyKey: `room-left-${sessionId}-${roomId}`,
      });
      endSession({
        roomId,
        museumId: route.params.museumId,
      });
      emit('leave-room');
    };
  }, [
    addCompletedTile,
    emit,
    endSession,
    isHost,
    navigation,
    on,
    roomId,
    route.params.museumId,
    sessionId,
    setScore,
    startSession,
    track,
    user,
  ]);

  const handleTileValidate = async (tileId: string, _points: number) => {
    if (!user) {
      return;
    }
    if (!gameStarted) {
      Alert.alert('Game not started', 'Wait for the host to start the game');
      return;
    }

    const result = await updateTileValidation(roomId, tileId, tileId);
    if (!result.success) {
      track({
        type: 'scan_failure',
        userId: user.uid,
        sessionId,
        museumId: route.params.museumId,
        roomId,
        tileId,
        resultType: 'failure',
      });
      Alert.alert('Error', result.message || 'Tile already completed or invalid');
      return;
    }
    track({
      type: 'scan_success',
      userId: user.uid,
      sessionId,
      museumId: route.params.museumId,
      roomId,
      tileId,
      resultType: 'success',
    });
    track({
      type: 'tile_completed',
      userId: user.uid,
      sessionId,
      museumId: route.params.museumId,
      roomId,
      tileId,
      pointsGained: result.newScore,
    });
  };

  const startGame = () => {
    if (isHost) {
      emit('start-game', { roomId });
    }
  };

  if (!bingoCard.length) {
    return <Text style={styles.loading}>Loading game...</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roomCode}>Room: {roomId.slice(-6)}</Text>
        <StatCard
          title="Accuracy"
          value={`${Math.round(latestSnapshot?.sessionStats.accuracy ?? 0)}%`}
          subtitle="session"
          accentColor="#0EA5E9"
        />
        {isReconnecting && <Text style={styles.waiting}>Reconnecting...</Text>}
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setShowLanguageSelector(true)}
        >
          <Text style={styles.languageButtonText}>{currentLanguage.toUpperCase()}</Text>
        </TouchableOpacity>
        {!gameStarted && isHost && (
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.startText}>Start Game</Text>
          </TouchableOpacity>
        )}
        {!gameStarted && !isHost && <Text style={styles.waiting}>Waiting for host to start...</Text>}
      </View>
      <View style={styles.statusRow}>
        <Text style={styles.statusChip}>Players {Object.keys(players).length}</Text>
        <Text style={styles.statusChip}>Tiles {completedTiles.length}</Text>
        {rank ? <Text style={styles.statusChip}>Rank #{rank}</Text> : null}
        {immersiveEnabled ? (
          <Text style={styles.statusChip} onPress={() => setSpatialRoomMode((prev) => !prev)}>
            {spatialRoomMode ? 'Spatial off' : 'Spatial on'}
          </Text>
        ) : null}
      </View>
      <View style={styles.bannerWrap}>
        <MockImageFrame
          token={MOCK_EVENT_THEMES[0].token}
          label="Room Activity"
          subtitle={`${Object.keys(players).length} players in live gallery race`}
          compact
        />
      </View>

      <TranslatedBingoCard
        card={bingoCard}
        completedTiles={completedTiles}
        onTileValidate={handleTileValidate}
        disabled={!gameStarted}
      />
      {spatialRoomMode && user ? (
        <MultiplayerSpatialRoom players={Object.values(players)} currentUserId={user.uid} />
      ) : null}
      <LanguageSelector visible={showLanguageSelector} onClose={() => setShowLanguageSelector(false)} />

      {user && (
        <MultiplayerLeaderboard
          roomId={roomId}
          currentUserId={user.uid}
          initialPlayers={players}
          onRankChange={(rank) => {
            setRank(rank);
            track({
              type: 'leaderboard_rank_changed',
              userId: user.uid,
              sessionId,
              museumId: route.params.museumId,
              roomId,
              metadata: { rank },
            });
          }}
        />
      )}
      <TouchableOpacity style={styles.recapButton} onPress={() => setShowRecap(true)}>
        <Text style={styles.recapText}>Session recap</Text>
      </TouchableOpacity>
      <SessionRecapModal
        visible={showRecap}
        summary={latestSnapshot?.sessionStats ?? null}
        museumStats={latestSnapshot?.museumStats ?? null}
        roomStats={latestSnapshot?.roomStats ?? null}
        onClose={() => setShowRecap(false)}
      />
    </SafeAreaView>
  );
};

export const MultiplayerGameScreen: React.FC<GameProps> = ({ route, navigation }) => (
  <LanguageProvider>
    <MultiplayerGameScreenContent route={route} navigation={navigation} />
  </LanguageProvider>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: appTheme.colors.bg },
  header: {
    padding: appTheme.spacing.md,
    margin: appTheme.spacing.sm,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
    backgroundColor: appTheme.colors.bgCard,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: appTheme.spacing.xs,
  },
  roomCode: { color: appTheme.colors.textPrimary, fontSize: appTheme.typography.caption, fontFamily: 'monospace' },
  startButton: {
    backgroundColor: appTheme.colors.accentSuccess,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.xs,
    borderRadius: appTheme.radius.pill,
  },
  startText: { color: appTheme.colors.bg, fontWeight: 'bold' },
  languageButton: {
    backgroundColor: appTheme.colors.bgMuted,
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 6,
    borderRadius: appTheme.radius.pill,
    borderWidth: 1,
    borderColor: appTheme.colors.borderStrong,
  },
  languageButtonText: { color: appTheme.colors.textPrimary, fontWeight: '600', fontSize: appTheme.typography.caption },
  waiting: { color: appTheme.colors.accentWarm, fontSize: appTheme.typography.caption },
  statusRow: { flexDirection: 'row', gap: appTheme.spacing.xs, paddingHorizontal: appTheme.spacing.sm, marginBottom: appTheme.spacing.xs },
  bannerWrap: { paddingHorizontal: appTheme.spacing.sm, marginBottom: appTheme.spacing.xs },
  statusChip: {
    color: appTheme.colors.textSecondary,
    backgroundColor: appTheme.colors.bgMuted,
    borderRadius: appTheme.radius.pill,
    overflow: 'hidden',
    paddingHorizontal: appTheme.spacing.sm,
    paddingVertical: 4,
    fontSize: appTheme.typography.caption,
  },
  loading: { flex: 1, textAlign: 'center', marginTop: 50, color: appTheme.colors.textPrimary },
  recapButton: {
    marginHorizontal: appTheme.spacing.md,
    marginBottom: appTheme.spacing.sm,
    backgroundColor: appTheme.colors.bgCard,
    borderRadius: appTheme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
    paddingVertical: appTheme.spacing.sm,
  },
  recapText: { color: appTheme.colors.textPrimary, fontWeight: '700' },
});
