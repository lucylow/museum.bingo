import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MuseumType } from '../types/museums';

const FILTER_TYPES: Array<{ id: 'all' | MuseumType; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'history', label: 'General History' },
  { id: 'living_history', label: 'Living History' },
  { id: 'immigration', label: 'Immigration' },
  { id: 'military_history', label: 'Military' },
  { id: 'penal_history', label: 'Penal' },
  { id: 'holocaust', label: 'Holocaust' },
  { id: 'transportation', label: 'Transportation' },
  { id: 'pioneer', label: 'Pioneer' },
];

interface MuseumFilterPanelProps {
  activeFilter: 'all' | MuseumType;
  onFilterChange: (type: 'all' | MuseumType) => void;
}

export const MuseumFilterPanel: React.FC<MuseumFilterPanelProps> = ({ activeFilter, onFilterChange }) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {FILTER_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.filterChip, activeFilter === type.id ? styles.activeChip : null]}
            onPress={() => onFilterChange(type.id)}
          >
            <Text style={[styles.filterText, activeFilter === type.id ? styles.activeText : null]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 8, left: 0, right: 0, zIndex: 5 },
  scrollContent: { paddingHorizontal: 12, gap: 8 },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    elevation: 2,
  },
  activeChip: { backgroundColor: '#9C27B0' },
  filterText: { fontSize: 14, color: '#333' },
  activeText: { color: '#fff', fontWeight: '600' },
});
