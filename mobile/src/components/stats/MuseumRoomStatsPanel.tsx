import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MuseumStats, RoomStats } from '../../stats/types';
import { StatCard } from './StatCard';

type Props = {
  museumStats: MuseumStats | null;
  roomStats: RoomStats | null;
};

export const MuseumRoomStatsPanel: React.FC<Props> = ({ museumStats, roomStats }) => (
  <View style={styles.container}>
    {museumStats ? (
      <View style={styles.section}>
        <Text style={styles.heading}>Museum Snapshot</Text>
        <View style={styles.row}>
          <StatCard title="Artworks" value={museumStats.artworksScanned} accentColor="#14B8A6" />
          <StatCard title="Tiles Here" value={museumStats.tilesCompleted} accentColor="#10B981" />
          <StatCard title="Hint Uses" value={museumStats.hintsUsed} accentColor="#F97316" />
        </View>
      </View>
    ) : null}
    {roomStats ? (
      <View style={styles.section}>
        <Text style={styles.heading}>Room Snapshot</Text>
        <View style={styles.row}>
          <StatCard title="Players" value={roomStats.playersJoined} accentColor="#0EA5E9" />
          <StatCard title="Rank Events" value={roomStats.rankHistory.length} accentColor="#8B5CF6" />
          <StatCard title="Room Tiles" value={roomStats.totalTilesCompletedByRoom} accentColor="#6366F1" />
        </View>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    gap: 8,
  },
  section: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
  },
  heading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
});
