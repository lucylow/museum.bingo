import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface StreakIndicatorProps {
  streak: number;
  isActive: boolean;
}

export const StreakIndicator: React.FC<StreakIndicatorProps> = ({ streak, isActive }) => {
  const scale = useSharedValue(1);
  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  React.useEffect(() => {
    if (!isActive || streak < 2) {
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(withSequence(withTiming(1.2, { duration: 500 }), withTiming(1, { duration: 500 })), -1);
  }, [isActive, scale, streak]);

  if (streak === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.flame, flameStyle]}>🔥</Animated.Text>
      <Text style={styles.streakNumber}>{streak}</Text>
      <Text style={styles.streakLabel}>streak</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  flame: { fontSize: 18, marginRight: 6 },
  streakNumber: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginRight: 4 },
  streakLabel: { fontSize: 12, color: '#FFF' },
});
