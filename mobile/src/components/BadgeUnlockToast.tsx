import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BadgeEarned } from '../gamification/types';

interface BadgeUnlockToastProps {
  badge: BadgeEarned;
  onDismiss: () => void;
  autoDismissMs?: number;
}

const rarityColors: Record<string, string> = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FF9800',
};

export const BadgeUnlockToast: React.FC<BadgeUnlockToastProps> = ({
  badge,
  onDismiss,
  autoDismissMs = 3000,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 8,
      }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }).start(onDismiss);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs, fadeAnim, onDismiss, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity: fadeAnim,
          borderColor: rarityColors[badge.rarity] ?? rarityColors.common,
        },
      ]}
    >
      <Text style={styles.icon}>{badge.icon}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{badge.nameKey}</Text>
        <Text style={styles.description}>{badge.descriptionKey}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss}>
        <Text style={styles.dismiss}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 5,
    zIndex: 2000,
  },
  icon: { fontSize: 32, marginRight: 12 },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  description: { fontSize: 12, color: '#CCC' },
  dismiss: { fontSize: 18, color: '#999', padding: 4 },
});
