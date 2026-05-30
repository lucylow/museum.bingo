import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppPanel } from './ui/AppPanel';
import { useLanguage } from '../context/LanguageContext';
import { translationService } from '../services/TranslationService';
import { appTheme } from '../theme/tokens';

interface Props {
  card: string[][];
  completedTiles: string[];
  onTileValidate: (tileId: string, points: number) => void;
  disabled?: boolean;
}

export const TranslatedBingoCard: React.FC<Props> = ({
  card,
  completedTiles,
  onTileValidate,
  disabled,
}) => {
  const { currentLanguage, refreshKey } = useLanguage();
  const [translatedCard, setTranslatedCard] = useState<string[][]>(card);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const translate = async () => {
      if (currentLanguage === 'en') {
        if (isMounted) {
          setTranslatedCard(card);
        }
        return;
      }
      setIsTranslating(true);
      try {
        const translated = await translationService.translateBingoCard(card, currentLanguage);
        if (isMounted) {
          setTranslatedCard(translated);
        }
      } finally {
        if (isMounted) {
          setIsTranslating(false);
        }
      }
    };

    void translate();
    return () => {
      isMounted = false;
    };
  }, [card, currentLanguage, refreshKey]);

  const tileId = (row: number, col: number) => `${row}_${col}`;
  const isCompleted = (row: number, col: number) => completedTiles.includes(tileId(row, col));
  const totalTiles = translatedCard.flat().length;
  const completionRatio = totalTiles ? completedTiles.length / totalTiles : 0;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const completedLines = useMemo(() => {
    if (!translatedCard.length) {
      return 0;
    }
    let lines = 0;
    const size = translatedCard.length;
    for (let i = 0; i < size; i += 1) {
      const rowDone = translatedCard[i].every((_, j) => isCompleted(i, j));
      const colDone = translatedCard.every((_, j) => isCompleted(j, i));
      if (rowDone) lines += 1;
      if (colDone) lines += 1;
    }
    const diagA = translatedCard.every((_, i) => isCompleted(i, i));
    const diagB = translatedCard.every((_, i) => isCompleted(i, size - i - 1));
    if (diagA) lines += 1;
    if (diagB) lines += 1;
    return lines;
  }, [completedTiles, translatedCard]);

  useEffect(() => {
    if (completionRatio <= 0) {
      return;
    }
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.03, duration: appTheme.motion.quick, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: appTheme.motion.quick, useNativeDriver: true }),
    ]).start();
  }, [completionRatio, pulseAnim]);

  if (isTranslating) {
    return (
      <AppPanel style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={appTheme.colors.accent} />
        <Text style={styles.loadingText}>Loading {currentLanguage.toUpperCase()}...</Text>
      </AppPanel>
    );
  }

  return (
    <AppPanel style={styles.container}>
      <View style={styles.boardHeader}>
        <Text style={styles.boardTitle}>Bingo Board</Text>
        <Text style={styles.boardMeta}>{completedTiles.length}/{totalTiles} found</Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: `${Math.max(8, Math.round(completionRatio * 100))}%`, transform: [{ scaleX: pulseAnim }] },
          ]}
        />
      </View>
      <Text style={styles.lineText}>{completedLines} lines completed</Text>
      {translatedCard.map((row, i) => (
        <View key={`row-${i}`} style={styles.row}>
          {row.map((prompt, j) => (
            <Pressable
              key={`${i}-${j}`}
              style={({ pressed }) => [
                styles.tile,
                isCompleted(i, j) && styles.completedTile,
                !isCompleted(i, j) && completionRatio > 0.7 && styles.nearBingoTile,
                pressed && !isCompleted(i, j) && styles.tilePressed,
              ]}
              onPress={() => onTileValidate(tileId(i, j), 10)}
              disabled={disabled || isCompleted(i, j)}
            >
              <Text style={[styles.tileBadge, isCompleted(i, j) && styles.tileBadgeDone]}>
                {isCompleted(i, j) ? 'FOUND' : 'TARGET'}
              </Text>
              <Text style={[styles.prompt, isCompleted(i, j) && styles.completedText]}>{prompt}</Text>
              {isCompleted(i, j) ? <Text style={styles.check}>✓</Text> : <Text style={styles.pending}>○</Text>}
            </Pressable>
          ))}
        </View>
      ))}
    </AppPanel>
  );
};

const styles = StyleSheet.create({
  container: { margin: appTheme.spacing.sm, padding: appTheme.spacing.sm },
  boardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: appTheme.spacing.xs },
  boardTitle: { color: appTheme.colors.textPrimary, fontSize: appTheme.typography.subtitle, fontWeight: '800' },
  boardMeta: { color: appTheme.colors.textSecondary, fontSize: appTheme.typography.caption, fontWeight: '700' },
  progressTrack: {
    height: 8,
    borderRadius: appTheme.radius.pill,
    backgroundColor: appTheme.colors.bgMuted,
    overflow: 'hidden',
    marginBottom: appTheme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: appTheme.radius.pill,
    backgroundColor: appTheme.colors.accentSuccess,
  },
  lineText: { color: appTheme.colors.accentWarm, fontSize: appTheme.typography.caption, marginBottom: appTheme.spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'center' },
  tile: {
    flex: 1,
    aspectRatio: 1,
    margin: appTheme.spacing.xxs,
    backgroundColor: appTheme.colors.bgElevated,
    borderRadius: appTheme.radius.md,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: appTheme.spacing.xs,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
  },
  completedTile: {
    backgroundColor: '#1C3F33',
    borderColor: appTheme.colors.accentSuccess,
    shadowColor: appTheme.colors.accentSuccess,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 5,
  },
  nearBingoTile: {
    borderColor: appTheme.colors.accentWarm,
  },
  tilePressed: { transform: [{ scale: 0.98 }] },
  tileBadge: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.overline,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  tileBadgeDone: { color: appTheme.colors.accentSuccess },
  prompt: { fontSize: appTheme.typography.caption, color: appTheme.colors.textPrimary, fontWeight: '600' },
  completedText: { color: appTheme.colors.textPrimary },
  check: { fontSize: 20, fontWeight: '800', color: appTheme.colors.accentSuccess, alignSelf: 'flex-end' },
  pending: { fontSize: 18, color: appTheme.colors.textMuted, alignSelf: 'flex-end' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center', padding: appTheme.spacing.xxl, margin: appTheme.spacing.sm },
  loadingText: { marginTop: appTheme.spacing.sm, fontSize: appTheme.typography.body, color: appTheme.colors.textSecondary },
});
