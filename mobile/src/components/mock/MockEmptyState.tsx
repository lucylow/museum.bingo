import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MockImageToken } from '../../mock/visualSystem';
import { appTheme } from '../../theme/tokens';
import { MockImageFrame } from './MockImageFrame';

interface Props {
  token: MockImageToken;
  title: string;
  body: string;
}

export const MockEmptyState: React.FC<Props> = ({ token, title, body }) => (
  <View style={styles.container}>
    <MockImageFrame token={token} compact style={styles.visual} />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.body}>{body}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
    backgroundColor: appTheme.colors.bgCard,
    padding: appTheme.spacing.sm,
    alignItems: 'center',
    marginTop: appTheme.spacing.xs,
  },
  visual: {
    width: '100%',
    maxWidth: 260,
    marginBottom: appTheme.spacing.sm,
  },
  title: {
    color: appTheme.colors.textPrimary,
    fontWeight: '800',
    fontSize: appTheme.typography.body,
    textAlign: 'center',
  },
  body: {
    marginTop: appTheme.spacing.xs,
    color: appTheme.colors.textSecondary,
    textAlign: 'center',
    fontSize: appTheme.typography.caption,
    maxWidth: 300,
  },
});
