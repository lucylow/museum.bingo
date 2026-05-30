import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LanguageSelector } from '../components/LanguageSelector';
import { TranslatedBingoCard } from '../components/TranslatedBingoCard';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  museumId: string;
  bingoCard: string[][];
  completedTiles: string[];
  score: number;
  onTilePress: (tileId: string, points: number) => void;
}

export const GameScreen: React.FC<Props> = ({
  museumId: _museumId,
  bingoCard,
  completedTiles,
  score,
  onTilePress,
}) => {
  const { currentLanguage } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.score}>Score: {score}</Text>
        <TouchableOpacity onPress={() => setShowLanguageModal(true)} style={styles.languageButton}>
          <Text style={styles.languageButtonText}>{currentLanguage.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
      <TranslatedBingoCard
        card={bingoCard}
        completedTiles={completedTiles}
        onTileValidate={onTilePress}
      />
      <LanguageSelector visible={showLanguageModal} onClose={() => setShowLanguageModal(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  score: { fontSize: 20, fontWeight: 'bold' },
  languageButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  languageButtonText: { fontSize: 14, fontWeight: '600' },
});
