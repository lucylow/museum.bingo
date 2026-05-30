import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BingoGameWithAI } from '../components/BingoGameWithAI';
import { LanguageProvider } from '../context/LanguageContext';

interface Props {
  museumId: string;
}

export const GameScreenWithConfetti: React.FC<Props> = ({ museumId }) => {
  return (
    <LanguageProvider>
      <View style={styles.container}>
        <BingoGameWithAI museumId={museumId} />
      </View>
    </LanguageProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10131b',
  },
});
