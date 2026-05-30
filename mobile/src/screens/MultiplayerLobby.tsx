import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createRoom as apiCreateRoom, joinRoom as apiJoinRoom } from '../api/multiplayer';
import { getMuseumBingoCard } from '../api/museum';
import { LifetimeStatsPanel } from '../components/stats/LifetimeStatsPanel';
import { AppButton } from '../components/ui/AppButton';
import { AppPanel } from '../components/ui/AppPanel';
import { useAuth } from '../context/AuthContext';
import { useGameplayStats } from '../hooks/useGameplayStats';
import { appTheme } from '../theme/tokens';

type LobbyProps = {
  navigation: { navigate: (screen: string, params: Record<string, unknown>) => void };
  route: { params: { museumId: string } };
};

export const MultiplayerLobby: React.FC<LobbyProps> = ({ navigation, route }) => {
  const { museumId } = route.params;
  const { user } = useAuth();
  const { lifetimeStats, sessionHistory } = useGameplayStats();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  const getDisplayName = () => user?.displayName?.trim() || 'Museum Player';
  const normalizedRoomCode = roomCode.trim();
  const mockActivity = [
    'Maya found "Sunflowers at Night" (+30)',
    'Team Neon completed a line',
    'Room 8A4B12 is in final round',
  ];

  const createRoom = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in before creating a room.');
      return;
    }
    setLoading(true);
    try {
      const bingoCard = await getMuseumBingoCard(museumId);
      const roomId = await apiCreateRoom(museumId, bingoCard, false);
      navigation.navigate('MultiplayerGame', {
        roomId,
        museumId,
        isHost: true,
      });
    } catch (error) {
      console.warn('Failed to create room', error);
      Alert.alert('Error', 'Unable to create room right now.');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in before joining a room.');
      return;
    }
    if (!normalizedRoomCode) {
      Alert.alert('Error', 'Please enter a room code');
      return;
    }
    setLoading(true);
    void apiJoinRoom(normalizedRoomCode, getDisplayName())
      .then(() => {
        navigation.navigate('MultiplayerGame', {
          roomId: normalizedRoomCode,
          museumId,
          isHost: false,
        });
      })
      .catch((error: unknown) => {
        console.warn('Failed to join room', error);
        Alert.alert('Error', 'Room not found or not joinable');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Social Hunt</Text>
      <Text style={styles.title}>Multiplayer Rooms</Text>

      <AppPanel style={styles.roomPanel}>
        <Text style={styles.panelTitle}>Start a Room</Text>
        <Text style={styles.panelSubtitle}>Create a live scavenger room for this museum.</Text>
        <AppButton label="Create New Room" onPress={() => void createRoom()} disabled={loading} />
      </AppPanel>

      <View style={styles.divider}>
        <Text style={styles.orText}>OR</Text>
      </View>

      <AppPanel>
        <Text style={styles.panelTitle}>Join with Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Room Code"
          placeholderTextColor={appTheme.colors.textMuted}
          value={roomCode}
          onChangeText={(text) => setRoomCode(text.replace(/[^a-zA-Z0-9]/g, ''))}
          autoCapitalize="characters"
        />

        <AppButton label="Join Room" onPress={joinRoom} disabled={loading} variant="secondary" />
      </AppPanel>

      <Text style={styles.info}>Rooms expire after 4 hours.</Text>
      <AppPanel style={styles.feedPanel}>
        <Text style={styles.panelTitle}>Live Activity</Text>
        {mockActivity.map((event) => (
          <Text key={event} style={styles.feedItem}>
            • {event}
          </Text>
        ))}
      </AppPanel>
      <LifetimeStatsPanel lifetime={lifetimeStats} recentSessions={sessionHistory} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: appTheme.spacing.lg, backgroundColor: appTheme.colors.bg },
  content: { paddingVertical: appTheme.spacing.lg, gap: appTheme.spacing.sm },
  eyebrow: { color: appTheme.colors.accentWarm, fontWeight: '700', textAlign: 'center', marginBottom: appTheme.spacing.xs },
  title: {
    fontSize: appTheme.typography.title,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: appTheme.spacing.md,
    color: appTheme.colors.textPrimary,
  },
  roomPanel: { marginBottom: appTheme.spacing.xs },
  panelTitle: { fontSize: appTheme.typography.subtitle, color: appTheme.colors.textPrimary, fontWeight: '700', marginBottom: appTheme.spacing.xs },
  panelSubtitle: { color: appTheme.colors.textSecondary, marginBottom: appTheme.spacing.sm },
  divider: { alignItems: 'center', marginVertical: appTheme.spacing.xs },
  orText: { fontSize: appTheme.typography.caption, color: appTheme.colors.textMuted, fontWeight: '700', letterSpacing: 1.2 },
  input: {
    backgroundColor: appTheme.colors.bgMuted,
    padding: 14,
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
    marginBottom: appTheme.spacing.sm,
    fontSize: 16,
    color: appTheme.colors.textPrimary,
    letterSpacing: 1.4,
  },
  info: { textAlign: 'center', color: appTheme.colors.textMuted, marginTop: appTheme.spacing.sm },
  feedPanel: { marginTop: appTheme.spacing.xs },
  feedItem: { color: appTheme.colors.textSecondary, marginTop: appTheme.spacing.xxs },
});
