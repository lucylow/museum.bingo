import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Group, Paint } from '@shopify/react-native-skia';
import { useAnimatedBingoChip } from '../hooks/useAnimatedBingoChip';

const OUTER_RING = '#FFD966';
const INNER_RING = '#FFB347';
const CENTER_HIGHLIGHT = '#FFFFFF';
const GLOW_COLOR = '#FFA500CC';

export interface BingoChipCanvasHandle {
  drop: (targetX: number, targetY: number) => void;
}

interface Props {
  visible?: boolean;
  onAnimationComplete?: () => void;
}

export const BingoChipCanvas = forwardRef<BingoChipCanvasHandle, Props>(
  ({ visible = true, onAnimationComplete }, ref) => {
    const { x, y, scale, opacity, startAnimation } = useAnimatedBingoChip();
    const [isActive, setIsActive] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        drop: (targetX: number, targetY: number) => {
          setIsActive(true);
          startAnimation(targetX, targetY, () => {
            setIsActive(false);
            onAnimationComplete?.();
          });
        },
      }),
      [onAnimationComplete, startAnimation],
    );

    if (!visible && !isActive) return null;

    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Group transform={[{ translateX: x }, { translateY: y }]}>
            <Group transform={[{ scale }]} opacity={opacity}>
              <Circle cx={0} cy={0} r={35} color={GLOW_COLOR}>
                <Paint style="stroke" strokeWidth={8} />
              </Circle>
              <Circle cx={0} cy={0} r={28} color={OUTER_RING} />
              <Circle cx={0} cy={0} r={22} color={INNER_RING} />
              <Circle cx={0} cy={0} r={6} color={CENTER_HIGHLIGHT} />
            </Group>
          </Group>
        </Canvas>
      </View>
    );
  },
);

BingoChipCanvas.displayName = 'BingoChipCanvas';
