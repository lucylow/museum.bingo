import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { appTheme } from '../../theme/tokens';

interface AppPanelProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AppPanel: React.FC<AppPanelProps> = ({ children, style }) => (
  <View style={[styles.panel, style]}>{children}</View>
);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: appTheme.colors.bgCard,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
    padding: appTheme.spacing.md,
    ...appTheme.elevation.card,
  },
});
