import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../../theme/tokens';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const STEPS = [
  'Move your phone to look around',
  'Tap a card to focus',
  'Use Scan Mode to validate artwork',
  'Toggle comfort mode anytime',
  'Immersive mode is optional',
];

export const ImmersiveOnboardingOverlay: React.FC<Props> = ({ visible, onDismiss }) => {
  if (!visible) return null;
  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>Immersive mode</Text>
        {STEPS.map((step, index) => (
          <Text key={step} style={styles.step}>
            {index + 1}. {step}
          </Text>
        ))}
        <Pressable style={styles.button} onPress={onDismiss}>
          <Text style={styles.buttonText}>Start exploring</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 10, 22, 0.74)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.md,
    zIndex: 80,
  },
  card: {
    width: '100%',
    borderRadius: appTheme.radius.xl,
    borderColor: appTheme.colors.borderStrong,
    borderWidth: 1,
    backgroundColor: appTheme.colors.bgCard,
    padding: appTheme.spacing.md,
  },
  title: {
    fontSize: appTheme.typography.subtitle,
    color: appTheme.colors.textPrimary,
    fontWeight: '800',
    marginBottom: appTheme.spacing.sm,
  },
  step: {
    color: appTheme.colors.textSecondary,
    marginBottom: appTheme.spacing.xs,
    fontSize: appTheme.typography.body,
  },
  button: {
    marginTop: appTheme.spacing.sm,
    borderRadius: appTheme.radius.pill,
    backgroundColor: appTheme.colors.accent,
    paddingVertical: appTheme.spacing.sm,
    alignItems: 'center',
  },
  buttonText: {
    color: '#062234',
    fontWeight: '800',
  },
});
