import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  value: number;
  label: string;
  color?: string;
};

export const ProgressRing: React.FC<Props> = ({ value, label, color = '#4CAF50' }) => {
  const normalized = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.container}>
      <View style={[styles.ring, { borderColor: `${color}40` }]}>
        <View style={[styles.fill, { borderColor: color, transform: [{ rotate: `${normalized * 1.8}deg` }] }]} />
        <Text style={styles.value}>{Math.round(normalized)}%</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  ring: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
});
