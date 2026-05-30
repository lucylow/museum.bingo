import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  streak: number;
  bestStreak: number;
};

export const StreakMeter: React.FC<Props> = ({ streak, bestStreak }) => {
  const progress = bestStreak > 0 ? Math.min(1, streak / bestStreak) : 0;
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.title}>Streak</Text>
        <Text style={styles.value}>
          {streak} / {Math.max(bestStreak, streak)}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(4, progress * 100)}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    color: '#F97316',
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#374151',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#F97316',
  },
});
