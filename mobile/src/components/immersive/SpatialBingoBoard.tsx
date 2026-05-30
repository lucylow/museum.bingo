import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../../theme/tokens';

interface Props {
  card: string[][];
  completedTiles: string[];
  onTileValidate: (tileId: string, points: number) => void;
  focusedTileId?: string | null;
  onFocusTile?: (tileId: string) => void;
}

export const SpatialBingoBoard: React.FC<Props> = ({
  card,
  completedTiles,
  onTileValidate,
  focusedTileId,
  onFocusTile,
}) => {
  const tileId = (row: number, col: number) => `${row}_${col}`;
  const completionSet = useMemo(() => new Set(completedTiles), [completedTiles]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spatial board</Text>
      {card.map((row, i) => (
        <View key={`row-${i}`} style={styles.row}>
          {row.map((prompt, j) => {
            const id = tileId(i, j);
            const done = completionSet.has(id);
            const focused = focusedTileId === id;
            return (
              <Pressable
                key={id}
                onPress={() => {
                  onFocusTile?.(id);
                  onTileValidate(id, 10);
                }}
                style={({ pressed }) => [
                  styles.tile,
                  done && styles.tileDone,
                  focused && styles.tileFocused,
                  pressed && !done && styles.tilePressed,
                ]}
              >
                <Text numberOfLines={2} style={[styles.prompt, done && styles.doneText]}>
                  {prompt}
                </Text>
                <Text style={styles.badge}>{done ? 'FOUND' : 'TARGET'}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: appTheme.spacing.sm,
    borderRadius: appTheme.radius.xl,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
    backgroundColor: 'rgba(12, 19, 38, 0.7)',
    padding: appTheme.spacing.sm,
  },
  title: {
    color: appTheme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: appTheme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
  },
  tile: {
    flex: 1,
    minHeight: 72,
    margin: 4,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
    padding: appTheme.spacing.xs,
    justifyContent: 'space-between',
    transform: [{ perspective: 800 }, { rotateX: '2deg' }],
  },
  tilePressed: {
    transform: [{ scale: 0.98 }],
  },
  tileDone: {
    borderColor: appTheme.colors.accentSuccess,
    backgroundColor: '#1A3C36',
  },
  tileFocused: {
    borderColor: appTheme.colors.accentWarm,
    backgroundColor: '#2F2B3A',
    transform: [{ scale: 1.04 }],
    zIndex: 5,
  },
  prompt: {
    color: appTheme.colors.textPrimary,
    fontSize: appTheme.typography.caption,
    fontWeight: '600',
  },
  doneText: {
    color: appTheme.colors.accentSuccess,
  },
  badge: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.overline,
    alignSelf: 'flex-end',
    fontWeight: '700',
  },
});
