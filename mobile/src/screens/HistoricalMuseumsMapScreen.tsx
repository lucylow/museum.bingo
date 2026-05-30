import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Region } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { api } from '../api/client';
import { ClusteredMapView } from '../components/ClusteredMapView';
import { MuseumDetailModal } from '../components/MuseumDetailModal';
import { MuseumFilterPanel } from '../components/MuseumFilterPanel';
import { useNearbyMuseums } from '../hooks/useNearbyMuseums';
import { HistoricalMuseum, MuseumType } from '../types/museums';

const DEFAULT_USA_REGION: Region = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

export const HistoricalMuseumsMapScreen: React.FC = () => {
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [allMuseums, setAllMuseums] = useState<HistoricalMuseum[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | MuseumType>('all');
  const [selectedMuseum, setSelectedMuseum] = useState<HistoricalMuseum | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { nearby } = useNearbyMuseums(15000);

  useEffect(() => {
    void Promise.all([fetchMuseums(), getUserLocation()]);
  }, []);

  const fetchMuseums = async () => {
    try {
      const museums = await api.get<HistoricalMuseum[]>('/museums/historical');
      setAllMuseums(museums.data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch museums', error);
      setAllMuseums([]);
    }
  };

  const getUserLocation = async () => {
    Geolocation.requestAuthorization('whenInUse');

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: DEFAULT_USA_REGION.latitudeDelta,
          longitudeDelta: DEFAULT_USA_REGION.longitudeDelta,
        });
        setUserRegion({
          latitude,
          longitude,
          latitudeDelta: DEFAULT_USA_REGION.latitudeDelta,
          longitudeDelta: DEFAULT_USA_REGION.longitudeDelta,
        });
        setLoading(false);
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.warn('Location permission denied or unavailable', error.message);
        setMapRegion(DEFAULT_USA_REGION);
        setUserRegion(DEFAULT_USA_REGION);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const filteredMuseums = useMemo(() => {
    if (activeFilter === 'all') {
      return allMuseums;
    }
    return allMuseums.filter((museum) => museum.type === activeFilter);
  }, [activeFilter, allMuseums]);

  const handleMarkerPress = (museumId: string) => {
    const museum = allMuseums.find((entry) => entry.id === museumId);
    if (!museum) {
      return;
    }
    setSelectedMuseum(museum);
    setModalVisible(true);
  };

  if (loading || !mapRegion) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MuseumFilterPanel activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <ClusteredMapView
        museums={filteredMuseums}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        onMarkerPress={handleMarkerPress}
      />

      <TouchableOpacity
        style={styles.centerButton}
        onPress={() => {
          setMapRegion(userRegion ?? DEFAULT_USA_REGION);
        }}
      >
        <Text style={styles.centerButtonText}>Center</Text>
      </TouchableOpacity>

      {nearby.length > 0 ? (
        <View style={styles.nearbyBanner}>
          <Text style={styles.nearbyText}>Nearby: {nearby[0].name}</Text>
        </View>
      ) : null}

      <MuseumDetailModal visible={modalVisible} museum={selectedMuseum} onClose={() => setModalVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerButton: {
    position: 'absolute',
    bottom: 28,
    right: 16,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 5,
  },
  centerButtonText: { fontSize: 12, fontWeight: '700', color: '#1a1a2e' },
  nearbyBanner: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    right: 110,
    backgroundColor: 'rgba(26, 26, 46, 0.88)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nearbyText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
