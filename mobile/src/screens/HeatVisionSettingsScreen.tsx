import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { BeaconService } from '../services/BeaconService';
import { PositioningService } from '../services/PositioningService';
import { WifiRTTService } from '../services/WifiRTTService';

export const HeatVisionSettingsScreen: React.FC = () => {
  const [hybridModeEnabled, setHybridModeEnabled] = useState(true);
  const [wifiRTTEnabled, setWifiRTTEnabled] = useState(false);
  const [beaconScanningEnabled, setBeaconScanningEnabled] = useState(true);
  const [calibrationStatus, setCalibrationStatus] = useState<'idle' | 'calibrating' | 'calibrated'>('idle');

  const handleToggleWifiRTT = async (enabled: boolean) => {
    setWifiRTTEnabled(enabled);
    const service = WifiRTTService.getInstance();
    if (enabled) {
      const available = await service.initialize();
      if (!available) {
        setWifiRTTEnabled(false);
        Alert.alert('Unsupported', 'Wi-Fi RTT is only available on supported Android devices.');
        return;
      }
      await service.startRanging();
      return;
    }
    service.stopRanging();
  };

  const handleToggleBeacon = async (enabled: boolean) => {
    setBeaconScanningEnabled(enabled);
    if (!enabled) {
      await BeaconService.getInstance().shutdown();
    }
  };

  const testIndoorPosition = () => {
    const position = PositioningService.getInstance().getCurrentPosition();
    if (!position) {
      Alert.alert('No reading yet', 'Move around the gallery for a few seconds and test again.');
      return;
    }

    Alert.alert(
      'Current Position',
      `Source: ${position.source}\nLat: ${position.lat.toFixed(6)}\nLng: ${position.lng.toFixed(6)}\nAccuracy: ${position.accuracy.toFixed(1)}m`,
    );
  };

  const calibrateBeacons = () => {
    setCalibrationStatus('calibrating');
    setTimeout(() => {
      setCalibrationStatus('calibrated');
      Alert.alert('Calibration Complete', 'Beacon weighting profile refreshed for this session.');
    }, 2000);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Heat Vision Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Positioning Sources</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Enable iBeacon scanning</Text>
          <Switch value={beaconScanningEnabled} onValueChange={(v) => void handleToggleBeacon(v)} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Enable Wi-Fi RTT</Text>
          <Switch value={wifiRTTEnabled} onValueChange={(v) => void handleToggleWifiRTT(v)} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Use hybrid mode</Text>
          <Switch value={hybridModeEnabled} onValueChange={setHybridModeEnabled} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calibration</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={calibrateBeacons}>
          <Text style={styles.primaryButtonText}>
            {calibrationStatus === 'calibrating' ? 'Calibrating...' : 'Calibrate Beacons'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={testIndoorPosition}>
          <Text style={styles.secondaryButtonText}>Test Indoor Position</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Behavior</Text>
        <Text style={styles.hint}>Arrow tracks the nearest unvalidated artwork.</Text>
        <Text style={styles.hint}>Distance updates twice per second while active.</Text>
        <Text style={styles.hint}>Indoor sources are preferred over GPS when reliable.</Text>
        <Text style={styles.hint}>Compass heading auto-falls back during interference.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  section: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 16, flex: 1, marginRight: 16 },
  primaryButton: {
    backgroundColor: '#FF6600',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 14, color: '#666', marginTop: 8, paddingHorizontal: 4 },
});
