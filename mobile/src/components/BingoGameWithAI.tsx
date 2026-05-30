import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraScreenWithChip } from '../screens/CameraScreenWithChip';
import { BingoTile } from './BingoTile';
import { CelebrationChipCascade } from './CelebrationChipCascade';
import { ARConfettiView } from './ARConfettiView';
import { useBingoStore } from '../store/bingoStore';
import { useBingoCelebration } from '../hooks/useBingoCelebration';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import { useTranslatedText } from '../hooks/useTranslatedText';

export const BingoGameWithAI: React.FC<{ museumId: string }> = ({ museumId }) => {
  const { bingoCard, markTile, checkBingo, getRemainingTiles } = useBingoStore();
  const [showCamera, setShowCamera] = useState(false);
  const [pendingTileId, setPendingTileId] = useState<string | null>(null);
  const [isBingoCompleted, setIsBingoCompleted] = useState(false);
  const [showARConfetti, setShowARConfetti] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { currentLanguage } = useLanguage();
  const { translated: translatedTitle } = useTranslatedText('Museum Bingo');
  const { translated: translatedRemaining } = useTranslatedText(`${getRemainingTiles()} tiles remaining`);
  const { triggerCelebration } = useBingoCelebration();

  const handleArtworkValidated = async (artworkId: string, tileId: string): Promise<boolean> => {
    if (pendingTileId && pendingTileId !== tileId) {
      return false;
    }

    const success = await markTile(tileId, artworkId);
    if (success) {
      const bingoComplete = checkBingo();
      if (bingoComplete) {
        setIsBingoCompleted(true);
        setShowARConfetti(true);
        void triggerCelebration({
          duration: 5000,
          onComplete: () => {
            setShowARConfetti(false);
          },
        });
      }
      setShowCamera(false);
      setPendingTileId(null);
    }
    return success;
  };

  const handleTilePress = (tileId: string) => {
    if (bingoCard.find((t) => t.id === tileId)?.completed) return;
    setPendingTileId(tileId);
    setShowCamera(true);
  };

  if (showCamera) {
    return <CameraScreenWithChip museumId={museumId} onArtworkValidated={handleArtworkValidated} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{translatedTitle}</Text>
          <Text style={styles.subtitle}>{translatedRemaining}</Text>
        </View>
        <TouchableOpacity style={styles.languageButton} onPress={() => setShowLanguageModal(true)}>
          <Text style={styles.languageButtonText}>{currentLanguage.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {bingoCard.map((tile) => (
          <BingoTile
            key={tile.id}
            tileId={tile.id}
            prompt={tile.prompt}
            isCompleted={tile.completed}
            onValidate={(tileId) => handleTilePress(tileId)}
          />
        ))}
      </View>
      <CelebrationChipCascade
        isBingoCompleted={isBingoCompleted}
        onAnimationComplete={() => setIsBingoCompleted(false)}
      />
      <ARConfettiView
        visible={showARConfetti}
        duration={5000}
        onComplete={() => setShowARConfetti(false)}
        fallbackOnError
      />
      <LanguageSelector visible={showLanguageModal} onClose={() => setShowLanguageModal(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#666' },
  languageButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  languageButtonText: { fontSize: 14, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
