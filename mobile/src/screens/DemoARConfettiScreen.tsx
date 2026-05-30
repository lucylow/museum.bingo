import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ARConfettiView } from '../components/ARConfettiView';
import { arConfetti } from '../native/ARConfetti';

export const DemoARConfettiScreen: React.FC = () => {
  const [showConfetti, setShowConfetti] = useState(false);

  const testARAvailability = async () => {
    const success = await arConfetti.start({
      onError: (msg) => Alert.alert('AR unavailable', msg),
      onConfettiStarted: () => {
        Alert.alert('Success', 'AR confetti started.');
        setTimeout(() => {
          void arConfetti.stop();
        }, 1500);
      },
    });

    if (!success) {
      Alert.alert('Fallback', 'Native AR confetti is unavailable on this device/build.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AR Confetti Demo</Text>
      <Text style={styles.subtitle}>Plane-aware confetti with fallback celebration mode.</Text>

      <TouchableOpacity style={styles.button} onPress={() => setShowConfetti(true)}>
        <Text style={styles.buttonText}>Celebrate Bingo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={testARAvailability}>
        <Text style={styles.buttonText}>Test AR Support</Text>
      </TouchableOpacity>

      <ARConfettiView
        visible={showConfetti}
        duration={5000}
        onComplete={() => setShowConfetti(false)}
        fallbackOnError
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0a0a2a',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffd700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#d2d4de',
    textAlign: 'center',
    marginBottom: 34,
  },
  button: {
    backgroundColor: '#ff6a00',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginVertical: 8,
  },
  secondaryButton: {
    backgroundColor: '#2a7bff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
