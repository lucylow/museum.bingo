import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { appTheme } from '../../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
}

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
}) => (
  <Pressable
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [
      styles.base,
      variant === 'primary' && styles.primary,
      variant === 'secondary' && styles.secondary,
      variant === 'ghost' && styles.ghost,
      pressed && !disabled && styles.pressed,
      disabled && styles.disabled,
      style,
    ]}
  >
    <Text style={[styles.text, variant === 'ghost' && styles.ghostText]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    borderRadius: appTheme.radius.pill,
    paddingVertical: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primary: {
    backgroundColor: appTheme.colors.accent,
  },
  secondary: {
    backgroundColor: appTheme.colors.bgMuted,
    borderWidth: 1,
    borderColor: appTheme.colors.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
  },
  text: {
    color: appTheme.colors.bg,
    fontWeight: '700',
    fontSize: appTheme.typography.body,
  },
  ghostText: {
    color: appTheme.colors.textPrimary,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.45,
  },
});
