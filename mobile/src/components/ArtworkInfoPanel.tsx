import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { translationService } from '../services/TranslationService';

interface ArtworkInfo {
  title: string;
  artist: string;
  description: string;
  period?: string;
  medium?: string;
}

interface Props {
  artwork: ArtworkInfo;
  onClose: () => void;
}

export const ArtworkInfoPanel: React.FC<Props> = ({ artwork, onClose }) => {
  const { currentLanguage, refreshKey } = useLanguage();
  const [translated, setTranslated] = useState<ArtworkInfo>(artwork);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const translateFields = async () => {
      if (currentLanguage === 'en') {
        if (isMounted) {
          setTranslated(artwork);
        }
        return;
      }
      setLoading(true);
      try {
        const [title, artist, description, period, medium] = await translationService.batchTranslate([
          artwork.title,
          artwork.artist,
          artwork.description,
          artwork.period || '',
          artwork.medium || '',
        ]);

        if (isMounted) {
          setTranslated({
            title,
            artist,
            description,
            period: period || undefined,
            medium: medium || undefined,
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void translateFields();
    return () => {
      isMounted = false;
    };
  }, [artwork, currentLanguage, refreshKey]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>X</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
      ) : (
        <>
          <Text style={styles.title}>{translated.title}</Text>
          <Text style={styles.artist}>{translated.artist}</Text>
          {translated.period && <Text style={styles.metadata}>Period: {translated.period}</Text>}
          {translated.medium && <Text style={styles.metadata}>Medium: {translated.medium}</Text>}
          <Text style={styles.description}>{translated.description}</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  closeButton: { alignSelf: 'flex-end', padding: 4 },
  closeText: { fontSize: 18, color: '#999' },
  loader: { marginVertical: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  artist: { fontSize: 16, color: '#555', marginBottom: 12 },
  metadata: { fontSize: 14, color: '#777', marginBottom: 4 },
  description: { fontSize: 14, color: '#333', marginTop: 12, lineHeight: 20 },
});
