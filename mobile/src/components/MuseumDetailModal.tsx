import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { HistoricalMuseum } from '../types/museums';

interface MuseumDetailModalProps {
  visible: boolean;
  museum: HistoricalMuseum | null;
  onClose: () => void;
}

type AppNavigation = NavigationProp<Record<string, object | undefined>>;

export const MuseumDetailModal: React.FC<MuseumDetailModalProps> = ({ visible, museum, onClose }) => {
  const navigation = useNavigation<AppNavigation>();

  if (!museum) {
    return null;
  }

  const handleStartGame = () => {
    onClose();
    navigation.navigate('Game', { museumId: museum.id, museumName: museum.name });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{museum.name}</Text>
            <Text style={styles.location}>
              {museum.city}, {museum.state}
            </Text>
            <Text style={styles.description}>{museum.description}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
                <Text style={styles.startText}>Start Bingo</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: '#1a1a2e' },
  location: { fontSize: 14, color: '#666', marginBottom: 12 },
  description: { fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  closeButton: {
    backgroundColor: '#efefef',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  closeText: { color: '#222', fontWeight: '600' },
  startText: { color: '#fff', fontWeight: '700' },
});
