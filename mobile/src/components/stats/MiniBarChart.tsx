import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  values: number[];
  color?: string;
};

export const MiniBarChart: React.FC<Props> = ({ title, values, color = '#2563EB' }) => {
  const max = Math.max(1, ...values);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chart}>
        {values.map((value, index) => (
          <View key={`${title}-${index}`} style={styles.barWrapper}>
            <View style={[styles.bar, { height: `${Math.max(6, (value / max) * 100)}%`, backgroundColor: color }]} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    minHeight: 110,
    elevation: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 3,
    height: '100%',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 6,
  },
});
