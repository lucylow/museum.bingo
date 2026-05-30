import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { arConfetti } from '../native/ARConfetti';

interface ARConfettiViewProps {
  visible: boolean;
  duration?: number;
  onComplete?: () => void;
  fallbackOnError?: boolean;
}

export const ARConfettiView: React.FC<ARConfettiViewProps> = ({
  visible,
  duration = 4000,
  onComplete,
  fallbackOnError = true,
}) => {
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackTokens, setFallbackTokens] = useState<number[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedRef = useRef(false);
  const opacity = useRef(new Animated.Value(0)).current;

  const fallbackTopOffsets = useMemo(
    () =>
      fallbackTokens.map((token, index) => {
        const normalized = ((token * 37 + index * 53) % 80) / 100;
        return `${10 + normalized * 70}%`;
      }),
    [fallbackTokens],
  );

  useEffect(() => {
    if (!visible) return;
    hasCompletedRef.current = false;

    const completeOnce = () => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      onComplete?.();
    };

    const stopAndComplete = () => {
      void arConfetti.stop();
      completeOnce();
    };

    const startFallback = () => {
      if (!fallbackOnError) {
        stopAndComplete();
        return;
      }

      setShowFallback(true);
      setFallbackTokens(Array.from({ length: 24 }, (_, i) => i + Date.now()));
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(Math.max(400, duration - 420)),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setShowFallback(false);
        completeOnce();
      });
    };

    void arConfetti
      .start({
        onError: () => {
          startFallback();
        },
      })
      .then((success) => {
        if (!success) {
          startFallback();
          return;
        }

        timeoutRef.current = setTimeout(() => {
          stopAndComplete();
        }, duration);
      });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      void arConfetti.stop();
      opacity.stopAnimation();
      opacity.setValue(0);
      hasCompletedRef.current = false;
      setShowFallback(false);
    };
  }, [duration, fallbackOnError, onComplete, opacity, visible]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {showFallback && (
        <Animated.View style={[styles.fallbackContainer, { opacity }]}>
          <Text style={styles.fallbackTitle}>BINGO!</Text>
          <View style={styles.fallbackConfettiField}>
            {fallbackTopOffsets.map((top, index) => (
              <Text key={`fallback-confetti-${index}`} style={[styles.fallbackParticle, { top }]}>
                {index % 2 ? '✦' : '●'}
              </Text>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 6, 14, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackTitle: {
    color: '#FFD700',
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: 1,
  },
  fallbackConfettiField: {
    ...StyleSheet.absoluteFillObject,
  },
  fallbackParticle: {
    position: 'absolute',
    left: '50%',
    color: '#FFC107',
    marginLeft: -6,
    fontSize: 14,
    opacity: 0.9,
  },
});
