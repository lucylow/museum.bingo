import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../services/TranslationService';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ visible, onClose }) => {
  const { currentLanguage, setLanguage, availableLanguages, isModelDownloading, downloadProgress } =
    useLanguage();
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(currentLanguage);

  useEffect(() => {
    setSelectedLang(currentLanguage);
  }, [currentLanguage]);

  const handleSelect = async (code: SupportedLanguage) => {
    setSelectedLang(code);
    await setLanguage(code);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select Language</Text>
          <FlatList
            data={availableLanguages}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const isSelected = item.code === selectedLang;
              const isCurrent = item.code === currentLanguage;
              const progress = downloadProgress[item.code];
              const isDownloading = isModelDownloading && progress > 0 && progress < 1;
              const isDownloaded = item.downloaded || item.code === 'en' || progress >= 1;

              return (
                <TouchableOpacity
                  style={[styles.item, isSelected && styles.selectedItem]}
                  onPress={() => void handleSelect(item.code)}
                  disabled={isDownloading}
                >
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, isSelected && styles.selectedText]}>
                      {item.nativeName} ({item.name})
                    </Text>
                    {isDownloading && (
                      <View style={styles.progressContainer}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                        <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
                      </View>
                    )}
                    {!isDownloading && !isDownloaded && item.code !== 'en' && (
                      <Text style={styles.downloadHint}>Tap to download</Text>
                    )}
                    {isCurrent && <Text style={styles.currentBadge}>OK</Text>}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  list: { gap: 8 },
  item: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#f5f5f5' },
  selectedItem: { backgroundColor: '#e3f2fd' },
  itemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16 },
  selectedText: { color: '#2196F3', fontWeight: '600' },
  currentBadge: { fontSize: 12, color: '#4CAF50', fontWeight: '700' },
  downloadHint: { fontSize: 12, color: '#888' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressText: { fontSize: 12, color: '#4CAF50' },
  closeButton: { marginTop: 12, padding: 12, alignItems: 'center' },
  closeText: { fontSize: 16, color: '#666' },
});
