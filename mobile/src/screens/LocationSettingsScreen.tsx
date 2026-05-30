import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { beaconService } from '../services/BeaconService';
import { geofencingService } from '../services/GeofencingService';
import { useLocation } from '../context/LocationContext';

export const LocationSettingsScreen: React.FC = () => {
  const { locationPermissionGranted, refreshLocation } = useLocation();
  const [beaconScanningEnabled, setBeaconScanningEnabled] = useState(true);
  const [geofencingEnabled, setGeofencingEnabled] = useState(true);

  const openAppSettings = () => {
    void Linking.openSettings();
  };

  const toggleGeofencing = async (enabled: boolean) => {
    setGeofencingEnabled(enabled);
    if (enabled) {
      await geofencingService.startMonitoringAll();
      return;
    }
    await geofencingService.stopMonitoring();
  };

  const toggleBeaconScan = async (enabled: boolean) => {
    setBeaconScanningEnabled(enabled);
    if (enabled) {
      await beaconService.initialize();
      beaconService.startRanging([
        { identifier: 'test-region', uuid: '12345678-1234-1234-1234-123456789abc' },
      ]);
      return;
    }
    beaconService.stopRanging();
  };

  const testGeofence = () => {
    Alert.alert('Test', 'Geofence listeners are active. Walk near a configured museum to trigger callbacks.');
  };

  const testBeaconScan = async () => {
    Alert.alert('Test', 'Starting beacon scan for 10 seconds...');
    await beaconService.initialize();
    beaconService.startRanging([{ identifier: 'test', uuid: '12345678-1234-1234-1234-123456789abc' }]);
    setTimeout(() => {
      beaconService.stopRanging();
    }, 10000);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Location Settings</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permissions</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Location Permission</Text>
          <Text style={[styles.status, locationPermissionGranted ? styles.granted : styles.denied]}>
            {locationPermissionGranted ? 'Granted' : 'Denied'}
          </Text>
        </View>
        {!locationPermissionGranted ? (
          <TouchableOpacity style={styles.button} onPress={openAppSettings}>
            <Text style={styles.buttonText}>Open App Settings</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Background Location (Geofencing)</Text>
          <Switch value={geofencingEnabled} onValueChange={(value) => void toggleGeofencing(value)} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>iBeacon Scanning</Text>
          <Switch value={beaconScanningEnabled} onValueChange={(value) => void toggleBeaconScan(value)} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Tools</Text>
        <TouchableOpacity style={styles.debugButton} onPress={() => void refreshLocation()}>
          <Text style={styles.debugText}>Refresh Current Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.debugButton} onPress={testGeofence}>
          <Text style={styles.debugText}>Simulate Geofence Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.debugButton} onPress={() => void testBeaconScan()}>
          <Text style={styles.debugText}>Test Beacon Scan</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Museum.Bingo uses location to detect when you enter a museum and guide you to artworks. iBeacons provide
        room-level accuracy inside galleries. No location data is shared outside gameplay features.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 16, flexShrink: 1, paddingRight: 12 },
  status: { fontSize: 14, fontWeight: '500' },
  granted: { color: '#4CAF50' },
  denied: { color: '#f44336' },
  button: { backgroundColor: '#2196F3', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600' },
  debugButton: { backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 8 },
  debugText: { color: '#333' },
  footer: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 20, marginBottom: 40 },
});
