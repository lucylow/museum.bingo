import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LifetimeStats, SessionStats } from '../../stats/types';
import { MiniBarChart } from './MiniBarChart';
import { StatCard } from './StatCard';

type Props = {
  lifetime: LifetimeStats;
  recentSessions: SessionStats[];
};

export const LifetimeStatsPanel: React.FC<Props> = ({ lifetime, recentSessions }) => {
  const pointsByDay = Object.values(lifetime.dailySummaries).slice(-7);
  const tilesBySession = recentSessions.slice(0, 6).map((session) => session.tilesCompleted).reverse();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
        <StatCard title="Sessions" value={lifetime.totalSessions} accentColor="#10B981" />
        <StatCard title="Accuracy" value={`${lifetime.averageAccuracy}%`} accentColor="#0EA5E9" />
        <StatCard title="Best Streak" value={lifetime.bestStreak} accentColor="#F97316" />
        <StatCard title="Bingos" value={lifetime.totalBingos} accentColor="#6366F1" />
        <StatCard title="Badges" value={lifetime.totalBadges} accentColor="#EC4899" />
      </ScrollView>
      <View style={styles.charts}>
        <MiniBarChart title="Points per day" values={pointsByDay.length ? pointsByDay : [0]} />
        <MiniBarChart title="Tiles per session" values={tilesBySession.length ? tilesBySession : [0]} color="#10B981" />
      </View>
      {lifetime.replayabilityInsights.length > 0 ? (
        <View style={styles.insights}>
          {lifetime.replayabilityInsights.map((insight) => (
            <Text key={insight} style={styles.insightText}>
              - {insight}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  cards: {
    paddingBottom: 8,
  },
  charts: {
    gap: 10,
    marginTop: 8,
  },
  insights: {
    marginTop: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 10,
  },
  insightText: {
    fontSize: 12,
    color: '#3730A3',
    marginBottom: 4,
  },
});
