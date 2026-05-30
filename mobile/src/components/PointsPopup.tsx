import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface PointsPopupProps {
  points: number;
  icon?: string;
  message?: string;
  onComplete: () => void;
}

export const PointsPopup: React.FC<PointsPopupProps> = ({
  points,
  icon = '⭐',
  message,
  onComplete,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => onComplete());
  }, [onComplete, opacity, translateY]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.points}>+{points}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1000,
  },
  icon: { fontSize: 24 },
  points: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  message: { fontSize: 14, color: '#FFF' },
});
