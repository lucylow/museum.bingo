import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MuseumStats, RoomStats, SessionStats } from '../../stats/types';
import { MuseumRoomStatsPanel } from './MuseumRoomStatsPanel';
import { ProgressRing } from './ProgressRing';
import { StatCard } from './StatCard';
import { StreakMeter } from './StreakMeter';
import { MockImageFrame } from '../mock/MockImageFrame';
import { MockEmptyState } from '../mock/MockEmptyState';
import { MOCK_ARTWORKS, MOCK_EMPTY_STATES, MOCK_EVENT_THEMES } from '../../mock/mockVisualContent';
import { useMonetization } from '../../hooks/useMonetization';
import { canUsePremiumRecapExport } from '../../monetization/gates';

type Props = {
  visible: boolean;
  summary: SessionStats | null;
  museumStats?: MuseumStats | null;
  roomStats?: RoomStats | null;
  onClose: () => void;
};

export const SessionRecapModal: React.FC<Props> = ({ visible, summary, museumStats = null, roomStats = null, onClose }) => (
  <RecapContent visible={visible} summary={summary} museumStats={museumStats} roomStats={roomStats} onClose={onClose} />
);

const RecapContent: React.FC<Props> = ({ visible, summary, museumStats = null, roomStats = null, onClose }) => {
  const { state: monetizationState } = useMonetization();
  const recapGate = canUsePremiumRecapExport(monetizationState);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Session Recap</Text>
          {summary ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <MockImageFrame
                token={MOCK_EVENT_THEMES[2].token}
                label="Session Memory Card"
                subtitle={`${summary.pointsEarned} pts • ${summary.tilesCompleted} tiles`}
                style={styles.hero}
              />
              <View style={styles.timelineRow}>
                {MOCK_ARTWORKS.slice(0, 3).map((art) => (
                  <MockImageFrame key={art.id} token={art.token} label={art.title} compact style={styles.timelineCard} />
                ))}
              </View>
              <View style={styles.rings}>
                <ProgressRing value={summary.accuracy} label="Accuracy" />
                <ProgressRing
                  value={summary.timeToBingoCompletionMs ? Math.max(1, 100 - summary.timeToBingoCompletionMs / 1000) : 0}
                  label="Speed"
                  color="#8B5CF6"
                />
              </View>
              <View style={styles.row}>
                <StatCard title="Points" value={summary.pointsEarned} accentColor="#F59E0B" />
                <StatCard title="Tiles" value={summary.tilesCompleted} accentColor="#10B981" />
                <StatCard title="Bingos" value={summary.bingosCompleted} accentColor="#6366F1" />
              </View>
              <View style={styles.row}>
                <StatCard title="Hints" value={summary.hintsUsed} accentColor="#EC4899" />
                <StatCard
                  title="Avg Validate"
                  value={`${Math.round(summary.averageTimeToValidateMs)}ms`}
                  accentColor="#06B6D4"
                />
              </View>
              <StreakMeter streak={summary.streak.currentStreak} bestStreak={summary.streak.longestStreak} />
              <MuseumRoomStatsPanel museumStats={museumStats} roomStats={roomStats} />

              <View style={styles.exportPanel}>
                <Text style={styles.exportTitle}>Shareable Recap Exports</Text>
                <Text style={styles.exportBody}>
                  Free: standard recap card. Premium: animated poster, victory frame, collectible showcase layouts.
                </Text>
                <Text style={styles.exportState}>{recapGate.allowed ? 'Premium templates unlocked' : recapGate.reason}</Text>
              </View>

              <View style={styles.exportPanel}>
                <Text style={styles.exportTitle}>Sponsored and Affiliate Offers</Text>
                <Text style={styles.exportBody}>
                  Sponsored offers are clearly labeled and shown only after session completion.
                </Text>
                <Text style={styles.exportState}>Example: Museum cafe coupon, gift shop discount, membership cross-promo.</Text>
              </View>
            </ScrollView>
          ) : (
            <MockEmptyState
              token={{ ...MOCK_EVENT_THEMES[1].token, id: 'recap-empty-state', type: 'emptyState' }}
              title={MOCK_EMPTY_STATES.noHistory.title}
              body={MOCK_EMPTY_STATES.noHistory.body}
            />
          )}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  rings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  hero: { marginBottom: 12 },
  timelineRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  timelineCard: { flex: 1 },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  empty: {
    color: '#6B7280',
    marginBottom: 18,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  exportPanel: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportTitle: { fontWeight: '700', color: '#111827' },
  exportBody: { marginTop: 4, color: '#4B5563' },
  exportState: { marginTop: 6, color: '#6D28D9', fontSize: 12, fontWeight: '600' },
});
