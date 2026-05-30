import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AppButton } from '../components/ui/AppButton';
import { AppPanel } from '../components/ui/AppPanel';
import { useLocation } from '../context/LocationContext';
import { RootStackParamList } from '../navigation/types';
import { appTheme } from '../theme/tokens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
  const { currentMuseum, userLocation, locationPermissionGranted, refreshLocation } = useLocation();
  const navigation = useNavigation<NavigationProp>();
  const detectionLabel =
    currentMuseum?.detectionMethod === 'manual'
      ? 'Selected manually'
      : `Detected via ${currentMuseum?.detectionMethod ?? 'unknown'}`;

  const handleStartGame = () => {
    if (currentMuseum) {
      navigation.navigate('Game', { museumId: currentMuseum.placeId, museumName: currentMuseum.name });
      return;
    }
    navigation.navigate('MuseumSelector');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.eyebrow}>Museum AR Hunt</Text>
      <Text style={styles.title}>Museum.Bingo</Text>
      {currentMuseum ? (
        <AppPanel style={styles.museumCard}>
          <Text style={styles.museumName}>{`📍 ${currentMuseum.name}`}</Text>
          <Text style={styles.detectionMethod}>{detectionLabel}</Text>
          <AppButton label="Start Hunt" onPress={handleStartGame} />
        </AppPanel>
      ) : (
        <AppPanel style={styles.noMuseumCard}>
          <Text style={styles.noMuseumText}>No museum detected nearby</Text>
          <AppButton
            label="Select Museum"
            onPress={() => navigation.navigate('MuseumSelector')}
            variant="secondary"
          />
          {userLocation ? (
            <Text style={styles.coords}>
              {`Your location: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
            </Text>
          ) : null}
          <AppButton label="Refresh Location" onPress={() => void refreshLocation()} variant="ghost" style={styles.refreshButton} />
        </AppPanel>
      )}
      {!locationPermissionGranted ? (
        <Text style={styles.permissionWarning}>Location permission required for auto-detection.</Text>
      ) : null}
      <AppButton label="Location Settings" onPress={() => navigation.navigate('LocationSettings')} variant="ghost" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: appTheme.spacing.lg,
    backgroundColor: appTheme.colors.bg,
  },
  eyebrow: {
    color: appTheme.colors.accentWarm,
    marginBottom: appTheme.spacing.xs,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: appTheme.typography.hero,
    fontWeight: '800',
    marginBottom: appTheme.spacing.xl,
    color: appTheme.colors.textPrimary,
  },
  museumCard: {
    alignItems: 'center',
    width: '100%',
    gap: appTheme.spacing.sm,
  },
  museumName: { fontSize: appTheme.typography.subtitle, fontWeight: '700', color: appTheme.colors.textPrimary },
  detectionMethod: { fontSize: appTheme.typography.body, color: appTheme.colors.textSecondary, marginBottom: appTheme.spacing.sm },
  noMuseumCard: { alignItems: 'center', width: '100%', gap: appTheme.spacing.sm },
  noMuseumText: { fontSize: appTheme.typography.body, color: appTheme.colors.textSecondary, marginBottom: appTheme.spacing.xs },
  coords: { fontSize: appTheme.typography.caption, color: appTheme.colors.textMuted, marginTop: appTheme.spacing.sm },
  refreshButton: { marginTop: appTheme.spacing.xs, width: '100%' },
  permissionWarning: { marginTop: appTheme.spacing.md, color: appTheme.colors.accentDanger, fontSize: appTheme.typography.caption },
});
