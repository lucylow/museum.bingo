import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

interface VoiceFeedbackOverlayProps {
  isListening: boolean;
  lastCommand?: string;
  error?: string | null;
  onAnimationComplete?: () => void;
}

export const VoiceFeedbackOverlay: React.FC<VoiceFeedbackOverlayProps> = ({
  isListening,
  lastCommand,
  error,
  onAnimationComplete,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return;
    }

    pulseAnim.setValue(0);
    if (onAnimationComplete) {
      setTimeout(onAnimationComplete, 300);
    }
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isListening, onAnimationComplete, pulseAnim, slideAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  if (!isListening && !lastCommand && !error) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      {isListening && (
        <Animated.View style={[styles.micIcon, { transform: [{ scale }] }]}>
          <Text style={styles.micText}>🎤</Text>
        </Animated.View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {lastCommand && !isListening && !error && (
        <View style={styles.commandBubble}>
          <Text style={styles.commandText}>🗣 "{lastCommand}"</Text>
        </View>
      )}
      <Text style={styles.hint}>
        {isListening ? 'Listening...' : 'Tap the mic to speak a command'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micText: {
    fontSize: 32,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  commandBubble: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
  },
  commandText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    marginTop: 8,
    color: '#DDD',
    fontSize: 12,
  },
});
