import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { scanAndValidateArtwork } from '../api/artwork';
import { getMuseumBingoCard } from '../api/museum';
import { BadgeUnlockToast } from '../components/BadgeUnlockToast';
import { PointsPopup } from '../components/PointsPopup';
import { RankChangeIndicator } from '../components/RankChangeIndicator';
import { StreakIndicator } from '../components/StreakIndicator';
import { SessionRecapModal } from '../components/stats/SessionRecapModal';
import { StatCard } from '../components/stats/StatCard';
import { TranslatedBingoCard } from '../components/TranslatedBingoCard';
import { AppPanel } from '../components/ui/AppPanel';
import { BADGES } from '../gamification/badges';
import { GamificationEngine } from '../gamification/GamificationEngine';
import { BadgeEarned } from '../gamification/types';
import { useBingoCelebration } from '../hooks/useBingoCelebration';
import { useGameplayStats } from '../hooks/useGameplayStats';
import { useGamificationStore } from '../store/gamificationStore';
import { appTheme } from '../theme/tokens';

interface GameScreenWithGamificationProps {
  museumId: string;
  userId: string;
  sessionId: string;
}

interface PopupState {
  points: number;
  icon: string;
  message?: string;
}

export const GameScreenWithGamification: React.FC<GameScreenWithGamificationProps> = ({
  museumId,
  userId,
  sessionId,
}) => {
  const [card, setCard] = useState<string[][]>([]);
  const [newBadges, setNewBadges] = useState<BadgeEarned[]>([]);
  const [localPointsPopup, setLocalPointsPopup] = useState<PopupState | null>(null);
  const [showRecap, setShowRecap] = useState(false);

  const gamificationState = useGamificationStore();
  const { triggerCelebration } = useBingoCelebration();
  const { latestSnapshot, startSession, endSession, track } = useGameplayStats();
  const engineRef = useRef(new GamificationEngine({}, BADGES));

  useEffect(() => {
    gamificationState.resetSession(museumId, userId, sessionId);
    void getMuseumBingoCard(museumId).then(setCard);
    startSession({
      userId,
      sessionId,
      mode: 'solo',
      museumId,
    });
    track({
      type: 'scan_started',
      userId,
      sessionId,
      museumId,
      metadata: { source: 'game_screen_open' },
      idempotencyKey: `initial-scan-${sessionId}`,
    });
    return () => {
      endSession({
        museumId,
        finalScore: gamificationState.totalScore,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [museumId, sessionId, userId]);

  const handleTileValidation = async (tileId: string) => {
    const scanStartedAt = Date.now();
    track({
      type: 'scan_started',
      userId,
      sessionId,
      museumId,
      tileId,
      idempotencyKey: `scan-start-${sessionId}-${tileId}-${scanStartedAt}`,
    });
    const { isNewLine, isBingo } = await scanAndValidateArtwork(tileId, museumId);
    const now = Date.now();

    const { newState, scoreEvents, newBadges: unlockedBadges } = engineRef.current.processTileValidation(
      gamificationState,
      tileId,
      isNewLine,
      isBingo
    );
    track({
      type: 'scan_success',
      userId,
      sessionId,
      museumId,
      tileId,
      resultType: 'success',
      metadata: {
        validateDurationMs: now - scanStartedAt,
      },
      idempotencyKey: `scan-success-${sessionId}-${tileId}-${newState.tilesValidated.length}`,
    });
    track({
      type: 'tile_completed',
      userId,
      sessionId,
      museumId,
      tileId,
      pointsGained: scoreEvents.reduce((sum, event) => sum + event.points, 0),
      streakBefore: gamificationState.currentStreak,
      streakAfter: newState.currentStreak,
      idempotencyKey: `tile-completed-${sessionId}-${tileId}`,
    });
    track({
      type: 'streak_updated',
      userId,
      sessionId,
      museumId,
      streakBefore: gamificationState.currentStreak,
      streakAfter: newState.currentStreak,
      idempotencyKey: `streak-${sessionId}-${tileId}-${newState.currentStreak}`,
    });
    if (isNewLine) {
      track({
        type: 'line_completed',
        userId,
        sessionId,
        museumId,
        tileId,
        idempotencyKey: `line-${sessionId}-${newState.linesCompleted}`,
      });
    }
    if (isBingo) {
      track({
        type: 'bingo_completed',
        userId,
        sessionId,
        museumId,
        tileId,
        metadata: {
          fullCardCompleted: newState.tilesValidated.length >= 25,
          elapsedMs: now - (latestSnapshot?.sessionStats.startedAt ?? now),
        },
        idempotencyKey: `bingo-${sessionId}-${newState.bingosCompleted}`,
      });
    }

    gamificationState.updateState(newState);
    for (const event of scoreEvents) {
      gamificationState.addScoreEvent(event);
    }
    if (unlockedBadges.length > 0) {
      setNewBadges((prev) => [...prev, ...unlockedBadges]);
      for (const badge of unlockedBadges) {
        track({
          type: 'badge_unlocked',
          userId,
          sessionId,
          museumId,
          metadata: {
            badgeId: badge.id,
            rarity: badge.rarity,
          },
          idempotencyKey: `badge-${sessionId}-${badge.id}`,
        });
      }
    }

    const mainEvent = scoreEvents.find((event) => event.type === 'tile_validated') ?? scoreEvents[0];
    if (mainEvent) {
      setLocalPointsPopup({
        points: mainEvent.points,
        icon: mainEvent.type === 'tile_validated' ? '🖼️' : '🎉',
        message:
          mainEvent.type === 'streak_bonus'
            ? `Streak ${String(mainEvent.metadata?.streak ?? gamificationState.currentStreak)}!`
            : undefined,
      });
    }

    if (isBingo) {
      void triggerCelebration();
    }

    const { newRank, rankChange } = engineRef.current.updateRank(newState, [
      { userId: 'player-1', score: 140 },
      { userId, score: newState.totalScore },
      { userId: 'player-2', score: 95 },
    ]);
    gamificationState.updateState({ rank: newRank, rankChange });
    track({
      type: 'leaderboard_rank_changed',
      userId,
      sessionId,
      museumId,
      metadata: {
        rank: newRank,
        rankChange,
      },
      idempotencyKey: `rank-${sessionId}-${newRank}-${newState.totalScore}`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppPanel style={styles.header}>
        <Text style={styles.score}>⭐ {gamificationState.totalScore}</Text>
        <StreakIndicator
          streak={gamificationState.currentStreak}
          isActive={gamificationState.currentStreak >= 2}
        />
        <RankChangeIndicator change={gamificationState.rankChange} />
      </AppPanel>
      <View style={styles.statsRow}>
        <StatCard
          title="Accuracy"
          value={`${Math.round(latestSnapshot?.sessionStats.accuracy ?? 0)}%`}
          subtitle="Session"
          accentColor="#2563EB"
        />
        <StatCard
          title="Hints"
          value={latestSnapshot?.sessionStats.hintsUsed ?? 0}
          subtitle="Heat vision"
          accentColor="#F97316"
        />
        <StatCard
          title="Badges"
          value={latestSnapshot?.sessionStats.badgesEarned ?? 0}
          subtitle="Unlocked"
          accentColor="#A855F7"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TranslatedBingoCard
          card={card}
          completedTiles={gamificationState.tilesValidated}
          onTileValidate={(tileIdArg) => void handleTileValidation(tileIdArg)}
        />
      </ScrollView>

      {localPointsPopup ? (
        <PointsPopup
          {...localPointsPopup}
          onComplete={() => {
            setLocalPointsPopup(null);
          }}
        />
      ) : null}

      {newBadges.map((badge) => (
        <BadgeUnlockToast
          key={`${badge.id}-${badge.earnedAt}`}
          badge={badge}
          onDismiss={() => {
            setNewBadges((prev) =>
              prev.filter((entry) => entry.id !== badge.id || entry.earnedAt !== badge.earnedAt)
            );
          }}
        />
      ))}
      <Text style={styles.recapLink} onPress={() => setShowRecap(true)}>
        View session recap
      </Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: appTheme.colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: appTheme.spacing.sm,
    paddingVertical: appTheme.spacing.sm,
  },
  score: { fontSize: appTheme.typography.subtitle, fontWeight: '800', color: appTheme.colors.accentWarm },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: appTheme.spacing.sm,
    paddingTop: appTheme.spacing.xs,
  },
  content: { padding: appTheme.spacing.xs, paddingBottom: appTheme.spacing.xl },
  recapLink: {
    textAlign: 'center',
    marginBottom: appTheme.spacing.sm,
    color: appTheme.colors.accent,
    fontWeight: '700',
  },
});
