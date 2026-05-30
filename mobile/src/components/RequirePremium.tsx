import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePremiumStatus } from '../hooks/usePremiumStatus';

interface RequirePremiumProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgradePress?: () => void;
}

export const RequirePremium: React.FC<RequirePremiumProps> = ({
  children,
  fallback,
  onUpgradePress,
}) => {
  const { isPremium, loading } = usePremiumStatus();

  if (loading) {
    return null;
  }

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Optional Premium Feature</Text>
      <Text style={styles.message}>
        Core bingo stays free. Premium unlocks convenience and style upgrades for frequent museum visits.
      </Text>
      <TouchableOpacity style={styles.button} onPress={onUpgradePress}>
        <Text style={styles.buttonText}>View Plans</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  message: { fontSize: 16, textAlign: 'center', marginBottom: 24, color: '#666' },
  button: { backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
