import React, { createRef, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { BingoChipCanvas, type BingoChipCanvasHandle } from './BingoChipCanvas';
import { soundService } from '../services/SoundService';
import { useValidationFeedback } from '../hooks/useValidationFeedback';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

const { width, height } = Dimensions.get('window');

interface Props {
  isBingoCompleted: boolean;
  onAnimationComplete?: () => void;
}

const CASCADE_POSITIONS = [
  { x: width * 0.2, y: height * 0.3 },
  { x: width * 0.5, y: height * 0.2 },
  { x: width * 0.8, y: height * 0.35 },
  { x: width * 0.35, y: height * 0.5 },
  { x: width * 0.65, y: height * 0.55 },
  { x: width * 0.5, y: height * 0.7 },
];

export const CelebrationChipCascade: React.FC<Props> = ({ isBingoCompleted, onAnimationComplete }) => {
  const [visible, setVisible] = useState(false);
  const completionCount = useRef(0);
  const chipRefs = useMemo(
    () => CASCADE_POSITIONS.map(() => createRef<BingoChipCanvasHandle>()),
    [],
  );
  const { triggerFeedback } = useValidationFeedback();
  const { trigger: triggerHaptic } = useHapticFeedback();

  useEffect(() => {
    if (!isBingoCompleted) return;

    setVisible(true);
    completionCount.current = 0;
    soundService.playCelebration();
    triggerHaptic('impactHeavy');
    triggerFeedback('celebratory');

    const timers: ReturnType<typeof setTimeout>[] = [];
    CASCADE_POSITIONS.forEach((position, index) => {
      const timer = setTimeout(() => {
        chipRefs[index].current?.drop(position.x, position.y);
      }, index * 180);
      timers.push(timer);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [chipRefs, isBingoCompleted, triggerFeedback, triggerHaptic]);

  const handleChipComplete = () => {
    completionCount.current += 1;
    if (completionCount.current === CASCADE_POSITIONS.length) {
      setVisible(false);
      onAnimationComplete?.();
    }
  };

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {chipRefs.map((chipRef, index) => (
        <BingoChipCanvas
          key={`cascade-chip-${index}`}
          ref={chipRef}
          visible={visible}
          onAnimationComplete={handleChipComplete}
        />
      ))}
    </View>
  );
};
