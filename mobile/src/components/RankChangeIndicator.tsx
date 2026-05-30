import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RankChangeIndicatorProps {
  change: number;
}

export const RankChangeIndicator: React.FC<RankChangeIndicatorProps> = ({ change }) => {
  if (change === 0) {
    return null;
  }

  const isUp = change > 0;
  return (
    <View style={[styles.container, isUp ? styles.up : styles.down]}>
      <Text style={styles.icon}>{isUp ? '⬆️' : '⬇️'}</Text>
      <Text style={styles.changeText}>{Math.abs(change)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  up: { backgroundColor: '#4CAF50' },
  down: { backgroundColor: '#F44336' },
  icon: { fontSize: 12, marginRight: 4 },
  changeText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
});
