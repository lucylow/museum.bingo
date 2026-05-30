import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BingoChipCanvas, type BingoChipCanvasHandle } from './BingoChipCanvas';
import { useValidationFeedback } from '../hooks/useValidationFeedback';
import { useTranslatedText } from '../hooks/useTranslatedText';

interface Props {
  tileId: string;
  prompt: string;
  isCompleted: boolean;
  onValidate: (tileId: string, x: number, y: number) => void;
}

export const BingoTile: React.FC<Props> = ({ tileId, prompt, isCompleted, onValidate }) => {
  const [showChip, setShowChip] = useState(false);
  const containerRef = useRef<View>(null);
  const chipCanvasRef = useRef<BingoChipCanvasHandle>(null);
  const { triggerFeedback } = useValidationFeedback();
  const { translated: translatedPrompt } = useTranslatedText(prompt);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (isCompleted) return;

    containerRef.current?.measureInWindow((x, y, width, height) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const pageX = x + centerX;
      const pageY = y + centerY;

      scale.value = withSpring(0.95, { damping: 12, stiffness: 320 }, () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 240 });
      });

      setShowChip(true);
      chipCanvasRef.current?.drop(centerX, centerY);
      triggerFeedback('normal');
      onValidate(tileId, pageX, pageY);
    });
  };

  return (
    <View ref={containerRef} collapsable={false} style={styles.tileContainer}>
      <TouchableOpacity onPress={handlePress} disabled={isCompleted} activeOpacity={0.8}>
        <Animated.View style={[styles.tile, isCompleted && styles.completedTile, animatedStyle]}>
          <Text style={[styles.prompt, isCompleted && styles.completedText]}>{translatedPrompt}</Text>
          {isCompleted && <Text style={styles.checkMark}>OK</Text>}
        </Animated.View>
      </TouchableOpacity>
      <BingoChipCanvas
        ref={chipCanvasRef}
        visible={showChip}
        onAnimationComplete={() => setShowChip(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tileContainer: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 8,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completedTile: { backgroundColor: '#4CAF50' },
  prompt: { fontSize: 12, textAlign: 'center' },
  completedText: { color: '#FFF' },
  checkMark: { fontSize: 14, color: '#FFF', fontWeight: 'bold', marginTop: 4 },
});
