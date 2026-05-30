import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { api } from '../api/client';
import { useLocation } from '../context/LocationContext';
import { RootStackParamList } from '../navigation/types';
import { museumDetection } from '../services/MuseumDetectionService';
import { MockImageFrame } from '../components/mock/MockImageFrame';
import { MockEmptyState } from '../components/mock/MockEmptyState';
import { MOCK_EMPTY_STATES, MOCK_MUSEUMS } from '../mock/mockVisualContent';

interface Museum {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MuseumSelector'>;

export const MuseumSelectorScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userLocation } = useLocation();
  const [museums, setMuseums] = useState<Museum[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!userLocation) return;
    void fetchNearbyMuseums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.latitude, userLocation?.longitude]);

  const fetchNearbyMuseums = async () => {
    if (!userLocation) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get<Museum[]>('/places/nearby', {
        params: {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          radius: 10000,
          type: 'museum',
        },
      });
      setMuseums(response.data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMuseum = (museum: Museum) => {
    museumDetection.setManualMuseumSelection({
      placeId: museum.placeId,
      name: museum.name,
      location: museum.location,
    });
    navigation.navigate('Game', { museumId: museum.placeId, museumName: museum.name });
  };

  const filteredMuseums = useMemo(() => {
    if (!searchQuery.trim()) return museums;
    const normalized = searchQuery.toLowerCase();
    return museums.filter((museum) => museum.name.toLowerCase().includes(normalized));
  }, [museums, searchQuery]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Museum</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search museum name..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredMuseums}
        keyExtractor={(item) => item.placeId}
        renderItem={({ item, index }) => {
          const mock = MOCK_MUSEUMS[index % MOCK_MUSEUMS.length];
          const isActive = index === 0;
          return (
          <TouchableOpacity style={[styles.museumItem, isActive && styles.activeMuseumItem]} onPress={() => handleSelectMuseum(item)}>
            <MockImageFrame
              token={mock.token}
              label={item.name}
              subtitle={`${mock.promptCount} prompts • ${mock.roomCount} rooms`}
              style={styles.cardVisual}
            />
            <View style={styles.cardHeader}>
            <Text style={styles.museumName}>{item.name}</Text>
              <Text style={[styles.status, isActive && styles.statusActive]}>{isActive ? 'Active' : mock.visitStatus}</Text>
            </View>
            <Text style={styles.museumAddress}>{item.formattedAddress}</Text>
            <Text style={styles.meta}>{mock.locationLabel}</Text>
          </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <MockEmptyState
            token={{ ...MOCK_MUSEUMS[0].token, type: 'emptyState', id: 'museum-selector-empty', label: 'No museums found' }}
            title={MOCK_EMPTY_STATES.noMuseum.title}
            body={MOCK_EMPTY_STATES.noMuseum.body}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  searchInput: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 16 },
  museumItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  activeMuseumItem: {
    borderWidth: 1,
    borderColor: '#7AA7FF',
    shadowOpacity: 0.18,
  },
  cardVisual: { marginBottom: 10 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  museumName: { fontSize: 18, fontWeight: '600' },
  status: {
    textTransform: 'capitalize',
    color: '#707b8e',
    fontWeight: '700',
    fontSize: 12,
  },
  statusActive: {
    color: '#3E63DD',
  },
  museumAddress: { fontSize: 14, color: '#666', marginTop: 4 },
  meta: { marginTop: 6, color: '#4F5F80', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});
