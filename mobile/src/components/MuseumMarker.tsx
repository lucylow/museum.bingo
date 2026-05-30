import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Callout, Marker } from 'react-native-maps';
import { HistoricalMuseum } from '../types/museums';

interface MuseumMarkerProps {
  museum: HistoricalMuseum;
  onPress: (museumId: string) => void;
}

export const MuseumMarker: React.FC<MuseumMarkerProps> = ({ museum, onPress }) => {
  return (
    <Marker
      coordinate={{ latitude: museum.latitude, longitude: museum.longitude }}
      title={museum.name}
      description={`${museum.city}, ${museum.state}`}
      pinColor="#9C27B0"
    >
      <Callout tooltip onPress={() => onPress(museum.id)}>
        <TouchableOpacity style={styles.calloutContainer} activeOpacity={0.8}>
          <View style={styles.calloutHeader}>
            <Text style={styles.calloutTitle}>{museum.name}</Text>
            <Text style={styles.calloutSubtitle}>
              {museum.city}, {museum.state}
            </Text>
          </View>
          <Text style={styles.calloutDescription} numberOfLines={2}>
            {museum.description}
          </Text>
          <Text style={styles.calloutLink}>Tap to start bingo</Text>
        </TouchableOpacity>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  calloutContainer: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 5,
  },
  calloutHeader: { marginBottom: 8 },
  calloutTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  calloutSubtitle: { fontSize: 12, color: '#666' },
  calloutDescription: { fontSize: 12, color: '#333', marginBottom: 8 },
  calloutLink: { fontSize: 12, color: '#4CAF50', fontWeight: '600' },
});
