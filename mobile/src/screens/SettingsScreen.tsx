import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { LanguageSelector } from '../components/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../services/TranslationService';
import { translationCache } from '../utils/localizationHelpers';

export const SettingsScreen: React.FC = () => {
  const { currentLanguage, availableLanguages, isModelDownloading, downloadProgress, refreshTranslations } =
    useLanguage();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);

  const getLanguageName = (code: string) =>
    availableLanguages.find((lang) => lang.code === code)?.nativeName || code;

  const handleClearCache = async () => {
    Alert.alert('Clear Translation Cache', 'Clear in-memory translation cache?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          translationCache.clear();
          refreshTranslations();
          Alert.alert('Done', 'Translation cache cleared.');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language</Text>
        <TouchableOpacity style={styles.row} onPress={() => setShowLanguageSelector(true)}>
          <Text style={styles.label}>App Language</Text>
          <Text style={styles.value}>{getLanguageName(currentLanguage)}</Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <Text style={styles.label}>Auto-translate on-device</Text>
          <Switch value={autoTranslate} onValueChange={setAutoTranslate} />
        </View>
        {isModelDownloading && (
          <Text style={styles.hint}>Downloading language model... Please wait.</Text>
        )}
        <TouchableOpacity style={styles.clearButton} onPress={() => void handleClearCache()}>
          <Text style={styles.clearText}>Clear Translation Cache</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Installed Languages</Text>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <View key={lang.code} style={styles.languageRow}>
            <Text style={styles.languageName}>{lang.nativeName}</Text>
            <Text style={styles.languageStatus}>
              {lang.downloaded
                ? 'Downloaded'
                : downloadProgress[lang.code] > 0
                  ? `${Math.round(downloadProgress[lang.code] * 100)}%`
                  : 'Not downloaded'}
            </Text>
          </View>
        ))}
      </View>

      <LanguageSelector visible={showLanguageSelector} onClose={() => setShowLanguageSelector(false)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 24 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },
  label: { fontSize: 16 },
  value: { fontSize: 16, color: '#2196F3' },
  hint: { fontSize: 12, color: '#888', marginTop: 8 },
  clearButton: {
    marginTop: 12,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  clearText: { color: '#d32f2f' },
  languageRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  languageName: { fontSize: 14 },
  languageStatus: { fontSize: 14, color: '#4CAF50' },
});
