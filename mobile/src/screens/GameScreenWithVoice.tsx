import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VoiceFeedbackOverlay } from '../components/VoiceFeedbackOverlay';
import { useVoiceCommands } from '../hooks/useVoiceCommands';
import { VoiceConfig } from '../voice/commandTypes';
import { CommandHandler } from '../voice/commandHandler';
import TTSHelper from '../voice/ttsHelper';

const VOICE_CONFIG: VoiceConfig = {
  wakeWordEnabled: false,
  wakeWord: 'hey museum',
  language: 'en',
  autoStopAfterCommand: true,
  showVisualFeedback: true,
};

export const GameScreenWithVoice: React.FC = () => {
  const [gameState, setGameState] = useState({ currentTile: 1, score: 0 });
  const navigation = useRef<unknown>(null);
  const ttsHelper = TTSHelper.getInstance();

  const { isListening, lastCommand, error, toggleListening } = useVoiceCommands(
    async (command) => {
      const context = {
        gameState,
        navigation: navigation.current,
        validateTile: (num: number) => Alert.alert('Validate', `Tile ${num} validated!`),
        showHint: () => Alert.alert('Hint', 'Try scanning the artwork on your left.'),
        showLeaderboard: () => Alert.alert('Leaderboard', 'You are in 1st place!'),
        startNewGame: () => setGameState({ currentTile: 1, score: 0 }),
        repeatCurrentPrompt: () => Alert.alert('Prompt', 'Find a painting with a dog.'),
        showHelp: () => {
          Alert.alert('Help', 'Available voice commands: validate tile #, give me a hint, show leaderboard, new game, what is this, next artwork, my score, resume scanning.');
        },
        cancelAction: () => console.log('Cancelled'),
        describeCurrentArtwork: () => {
          Alert.alert('Artwork', 'This is "The Starry Night" by Vincent van Gogh.');
        },
        goToNextArtwork: () => {
          setGameState((prev) => ({ ...prev, currentTile: prev.currentTile + 1 }));
        },
        reportScore: () => Alert.alert('Score', `Your current score is ${gameState.score}`),
        resumeScanning: () => console.log('Resume scanning'),
        speak: (text: string) => {
          void ttsHelper.speak(text, VOICE_CONFIG);
        },
      };

      await CommandHandler.execute(command, context);
    },
    VOICE_CONFIG,
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.score}>Score: {gameState.score}</Text>
        <TouchableOpacity onPress={() => void toggleListening()} style={styles.micButton}>
          <Text style={styles.micButtonText}>{isListening ? '🔴' : '🎤'}</Text>
        </TouchableOpacity>
      </View>
      <VoiceFeedbackOverlay
        isListening={isListening}
        lastCommand={lastCommand?.rawText}
        error={error}
      />
      <View style={styles.content} />
      <Text style={styles.voiceHint}>Tap the mic then say "validate tile 1"</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  voiceHint: {
    textAlign: 'center',
    padding: 12,
    color: '#888',
    fontSize: 12,
  },
});
