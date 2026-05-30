import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
};

export const StatCard: React.FC<Props> = ({ title, value, subtitle, accentColor = '#4CAF50' }) => (
  <View style={[styles.card, { borderLeftColor: accentColor }]}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.value}>{value}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    minWidth: 110,
    marginRight: 10,
    elevation: 2,
  },
  title: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  value: {
    marginTop: 6,
    fontSize: 22,
    color: '#111827',
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    color: '#4B5563',
  },
});
