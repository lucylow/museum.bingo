import React, { useEffect, useRef } from 'react';
import { GameScreenWithGamification } from './GameScreenWithGamification';
import { useVoiceGuidance } from '../hooks/useVoiceGuidance';
import { useGamificationStore } from '../store/gamificationStore';
import { type ScoreEvent } from '../gamification/types';

interface GameScreenWithAudioProps {
  museumId: string;
  userId: string;
  sessionId: string;
}

export const GameScreenWithAudio: React.FC<GameScreenWithAudioProps> = ({
  museumId,
  userId,
  sessionId,
}) => {
  const scoreEvents = useGamificationStore((state) => state.scoreEvents);
  const badgesEarned = useGamificationStore((state) => state.badgesEarned);
  const lastProcessedEventRef = useRef(0);
  const lastProcessedBadgeRef = useRef(0);

  const {
    announceTileValidated,
    announceStreakBonus,
    announceLineComplete,
    announceBingo,
    announceBadgeUnlocked,
  } = useVoiceGuidance();

  useEffect(() => {
    if (scoreEvents.length <= lastProcessedEventRef.current) return;

    const nextEvents = scoreEvents.slice(lastProcessedEventRef.current);
    nextEvents.forEach((event: ScoreEvent) => {
      switch (event.type) {
        case 'tile_validated':
          announceTileValidated(event.points);
          break;
        case 'streak_bonus':
          announceStreakBonus(Number(event.metadata?.streak ?? 0), event.points);
          break;
        case 'line_bonus':
          announceLineComplete(event.points);
          break;
        case 'bingo_bonus':
          announceBingo(event.points);
          break;
        case 'badge_bonus':
        default:
          break;
      }
    });

    lastProcessedEventRef.current = scoreEvents.length;
  }, [
    announceBingo,
    announceLineComplete,
    announceStreakBonus,
    announceTileValidated,
    scoreEvents,
  ]);

  useEffect(() => {
    if (badgesEarned.length <= lastProcessedBadgeRef.current) return;
    const nextBadges = badgesEarned.slice(lastProcessedBadgeRef.current);
    nextBadges.forEach((badge) => {
      announceBadgeUnlocked(badge.nameKey);
    });
    lastProcessedBadgeRef.current = badgesEarned.length;
  }, [announceBadgeUnlocked, badgesEarned]);

  return (
    <GameScreenWithGamification museumId={museumId} userId={userId} sessionId={sessionId} />
  );
};
