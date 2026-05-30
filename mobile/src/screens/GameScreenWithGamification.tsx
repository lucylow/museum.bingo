import React, { useEffect, useRef, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { MockImageFrame } from '../components/mock/MockImageFrame';
import { MockBadgeArt } from '../components/mock/MockBadgeArt';
import { MOCK_BADGE_ART, MOCK_EMPTY_STATES, MOCK_EVENT_THEMES, getMockArtworkBySeed } from '../mock/mockVisualContent';
import { MockEmptyState } from '../components/mock/MockEmptyState';
import { CameraScreenWithHeatVision } from './CameraScreenWithHeatVision';
import { ImmersiveSceneShell } from '../components/immersive/ImmersiveSceneShell';
import { SpatialBingoBoard } from '../components/immersive/SpatialBingoBoard';
import { FloatingArtworkCard3D } from '../components/immersive/FloatingArtworkCard3D';
import { SpatialWaypointOverlay } from '../components/immersive/SpatialWaypointOverlay';
import { useImmersiveSettingsStore } from '../store/immersiveSettingsStore';
import { useDeviceMotion } from '../hooks/useDeviceMotion';
import { classifyPerformanceTier, computeAdaptiveIntensity } from '../utils/ImmersivePerformance';

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
  const [immersiveActive, setImmersiveActive] = useState(false);
  const [scanModeActive, setScanModeActive] = useState(false);
  const [focusedTileId, setFocusedTileId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const gamificationState = useGamificationStore();
  const { triggerCelebration } = useBingoCelebration();
  const { latestSnapshot, startSession, endSession, track } = useGameplayStats();
  const engineRef = useRef(new GamificationEngine({}, BADGES));
  const { settings: immersiveSettings, sceneMode, updateSettings, markOnboardingSeen, onboardingSeen } = useImmersiveSettingsStore();
  const motion = useDeviceMotion(immersiveActive, immersiveSettings.motionSensitivity);

  useEffect(() => {
    gamificationState.resetSession(museumId, userId, sessionId);
    setLoadError(null);
    void getMuseumBingoCard(museumId)
      .then(setCard)
      .catch(() => {
        setCard([]);
        setLoadError('Unable to load bingo card. Check your connection and try again.');
      });
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

  useEffect(() => {
    if (immersiveSettings.enabled) {
      setImmersiveActive(true);
    }
  }, [immersiveSettings.enabled]);

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
    setFocusedTileId(tileId);
  };

  const runTileValidationSafely = async (tileId: string): Promise<boolean> => {
    try {
      await handleTileValidation(tileId);
      return true;
    } catch {
      Alert.alert('Scan failed', 'We could not validate that tile right now. Please try again.');
      return false;
    }
  };

  const fallbackTier = classifyPerformanceTier(immersiveSettings.lowPowerMode ? 36 : 18);
  const adaptiveIntensity = computeAdaptiveIntensity(fallbackTier, {
    motion: immersiveSettings.motionSensitivity,
    depth: immersiveSettings.depthIntensity,
    glow: immersiveSettings.lightingContrast,
  });
  const unresolvedTileId = card.length
    ? `${Math.floor(gamificationState.tilesValidated.length / Math.max(1, card.length)) % card.length}_${gamificationState.tilesValidated.length % card.length}`
    : '0_0';
  const activeArtwork = getMockArtworkBySeed(focusedTileId ?? unresolvedTileId);

  useEffect(() => {
    if (immersiveActive && fallbackTier === 'fallback2D') {
      setImmersiveActive(false);
    }
  }, [fallbackTier, immersiveActive]);

  if (scanModeActive) {
    return (
      <CameraScreenWithHeatVision
        museumId={museumId}
        artworks={[]}
        onArtworkValidated={async (_artworkId, tileId) => {
          return runTileValidationSafely(tileId);
        }}
        userId={userId}
        sessionId={sessionId}
        onClose={() => setScanModeActive(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {immersiveActive ? (
        <ImmersiveSceneShell
          settings={{ ...immersiveSettings, motionSensitivity: adaptiveIntensity.motion, depthIntensity: adaptiveIntensity.depth }}
          sceneMode={sceneMode}
          tiltX={motion.tiltX}
          tiltY={motion.tiltY}
          onboardingVisible={!onboardingSeen}
          onDismissOnboarding={markOnboardingSeen}
          onExit={() => setImmersiveActive(false)}
          onToggleComfort={() => updateSettings({ comfortMode: !immersiveSettings.comfortMode })}
        >
          <View style={styles.immersiveTopRow}>
            <Text style={styles.score}>⭐ {gamificationState.totalScore}</Text>
            <Text style={styles.immersiveHint}>Move phone for depth • Tap card focus</Text>
            <Text style={styles.immersiveTier}>Tier {fallbackTier}</Text>
            {fallbackTier === 'fallback2D' ? <Text style={styles.fallbackHint}>Performance fallback active</Text> : null}
          </View>
          {!immersiveSettings.minimalOverlayMode ? (
            <View style={styles.immersiveCardWrap}>
              <FloatingArtworkCard3D
                token={activeArtwork.token}
                title={activeArtwork.title}
                artist={activeArtwork.artist}
                museumLabel={activeArtwork.museumLabel}
                statusLabel={focusedTileId ? 'Focused target' : 'Active target'}
                bonusLabel={gamificationState.currentStreak >= 2 ? 'Streak bonus active' : undefined}
                highlighted
                tiltX={motion.tiltX}
                tiltY={motion.tiltY}
                onPress={() => setScanModeActive(true)}
              />
            </View>
          ) : null}
          <SpatialWaypointOverlay
            relativeBearing={motion.heading}
            distanceMeters={Math.max(3, 28 - gamificationState.tilesValidated.length)}
            targetTitle={activeArtwork.title}
            compact={immersiveSettings.minimalOverlayMode}
          />
          <SpatialBingoBoard
            card={card}
            completedTiles={gamificationState.tilesValidated}
            onTileValidate={(tileIdArg) => {
              void runTileValidationSafely(tileIdArg);
            }}
            focusedTileId={focusedTileId}
            onFocusTile={setFocusedTileId}
          />
          <Text style={styles.scanLink} onPress={() => setScanModeActive(true)}>
            Open scan mode
          </Text>
          <Text style={styles.scanLink} onPress={() => setShowRecap(true)}>
            View session recap
          </Text>
        </ImmersiveSceneShell>
      ) : (
        <>
          <AppPanel style={styles.header}>
            <Text style={styles.score}>⭐ {gamificationState.totalScore}</Text>
            <StreakIndicator
              streak={gamificationState.currentStreak}
              isActive={gamificationState.currentStreak >= 2}
            />
            <RankChangeIndicator change={gamificationState.rankChange} />
          </AppPanel>
          {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
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
          <View style={styles.themeBanner}>
            <MockImageFrame
              token={MOCK_EVENT_THEMES[0].token}
              label={MOCK_EVENT_THEMES[0].name}
              subtitle="Seasonal challenge board"
              compact
            />
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <TranslatedBingoCard
              card={card}
              completedTiles={gamificationState.tilesValidated}
              onTileValidate={(tileIdArg) => {
                void runTileValidationSafely(tileIdArg);
              }}
            />
            <Text style={styles.scanLink} onPress={() => setScanModeActive(true)}>
              Open scan mode
            </Text>
            <AppPanel style={styles.badgeShelf}>
              <Text style={styles.badgeShelfTitle}>Reward shelf</Text>
              <View style={styles.badgeRow}>
                {(newBadges.length ? newBadges : BADGES.slice(0, 4)).map((badge) => (
                  <MockBadgeArt
                    key={badge.id}
                    token={MOCK_BADGE_ART[badge.id] ?? MOCK_BADGE_ART.first_scan}
                    rarity={badge.rarity}
                    iconText={badge.icon}
                  />
                ))}
              </View>
              {!newBadges.length ? (
                <MockEmptyState
                  token={{ ...MOCK_EVENT_THEMES[2].token, type: 'emptyState', id: 'badge-shelf-empty', aspect: 'landscape' }}
                  title={MOCK_EMPTY_STATES.noBadges.title}
                  body={MOCK_EMPTY_STATES.noBadges.body}
                />
              ) : null}
            </AppPanel>
          </ScrollView>
          <Text style={styles.recapLink} onPress={() => setShowRecap(true)}>
            View session recap
          </Text>
          <Text style={styles.immersiveToggleLink} onPress={() => setImmersiveActive(true)}>
            Enter immersive mode
          </Text>
        </>
      )}

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
  immersiveTopRow: {
    marginHorizontal: appTheme.spacing.md,
    marginBottom: appTheme.spacing.xs,
    borderRadius: appTheme.radius.md,
    borderColor: appTheme.colors.borderSoft,
    borderWidth: 1,
    padding: appTheme.spacing.xs,
    backgroundColor: appTheme.colors.overlayDark,
    gap: 4,
  },
  immersiveHint: { color: appTheme.colors.textSecondary, fontSize: appTheme.typography.caption },
  immersiveTier: { color: appTheme.colors.accentWarm, fontSize: appTheme.typography.overline, fontWeight: '700' },
  fallbackHint: { color: appTheme.colors.accentWarning, fontSize: appTheme.typography.overline, fontWeight: '700' },
  immersiveCardWrap: {
    marginHorizontal: appTheme.spacing.md,
    marginBottom: appTheme.spacing.xs,
  },
  themeBanner: {
    marginHorizontal: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.xs,
  },
  content: { padding: appTheme.spacing.xs, paddingBottom: appTheme.spacing.xl },
  badgeShelf: { marginTop: appTheme.spacing.sm },
  badgeShelfTitle: {
    color: appTheme.colors.textPrimary,
    fontSize: appTheme.typography.body,
    fontWeight: '800',
    marginBottom: appTheme.spacing.xs,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: appTheme.spacing.sm, marginBottom: appTheme.spacing.xs },
  recapLink: {
    textAlign: 'center',
    marginBottom: appTheme.spacing.xs,
    color: appTheme.colors.accent,
    fontWeight: '700',
  },
  scanLink: {
    textAlign: 'center',
    color: appTheme.colors.accentWarm,
    fontWeight: '700',
    marginVertical: appTheme.spacing.xs,
  },
  immersiveToggleLink: {
    textAlign: 'center',
    marginBottom: appTheme.spacing.sm,
    color: appTheme.colors.accentSuccess,
    fontWeight: '700',
  },
  errorText: {
    marginHorizontal: appTheme.spacing.sm,
    marginBottom: appTheme.spacing.xs,
    color: appTheme.colors.accentDanger,
    fontSize: appTheme.typography.caption,
  },
});
