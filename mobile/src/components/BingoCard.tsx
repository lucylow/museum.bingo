import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { appTheme } from '../theme/tokens';

interface Props {
  card: string[][];
  completedTiles: string[];
  onTileValidate: (tileId: string, points: number) => void;
  disabled?: boolean;
}

export const BingoCard: React.FC<Props> = ({ card, completedTiles, onTileValidate, disabled }) => {
  const tileId = (row: number, col: number) => `${row}_${col}`;
  const isCompleted = (row: number, col: number) => completedTiles.includes(tileId(row, col));

  const handlePress = (row: number, col: number) => {
    if (disabled || isCompleted(row, col)) {
      return;
    }
    onTileValidate(tileId(row, col), 10);
  };

  return (
    <View style={styles.container}>
      {card.map((row, i) => (
        <View key={`row-${i}`} style={styles.row}>
          {row.map((prompt, j) => (
            <TouchableOpacity
              key={`${i}-${j}`}
              style={[styles.tile, isCompleted(i, j) && styles.completedTile]}
              onPress={() => handlePress(i, j)}
              disabled={disabled || isCompleted(i, j)}
            >
              <Text style={[styles.prompt, isCompleted(i, j) && styles.completedText]}>{prompt}</Text>
              {isCompleted(i, j) && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: appTheme.spacing.md,
    backgroundColor: appTheme.colors.bgCard,
    borderRadius: appTheme.radius.lg,
    margin: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
  },
  row: { flexDirection: 'row', justifyContent: 'center' },
  tile: {
    flex: 1,
    aspectRatio: 1,
    margin: appTheme.spacing.xxs,
    backgroundColor: appTheme.colors.bgElevated,
    borderRadius: appTheme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: appTheme.spacing.xs,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
  },
  completedTile: { backgroundColor: '#1C3F33', borderColor: appTheme.colors.accentSuccess },
  prompt: { fontSize: appTheme.typography.caption, textAlign: 'center', fontWeight: '500', color: appTheme.colors.textPrimary },
  completedText: { color: appTheme.colors.textPrimary },
  check: { fontSize: 20, fontWeight: 'bold', color: appTheme.colors.accentSuccess, marginTop: 4 },
});
