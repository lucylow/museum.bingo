import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VoiceCommand, VoiceCommandResult, VoiceConfig } from '../voice/commandTypes';
import VoiceRecognitionService from '../voice/voiceRecognitionService';

const DEFAULT_CONFIG: VoiceConfig = {
  wakeWordEnabled: false,
  wakeWord: 'hey museum',
  language: 'en',
  autoStopAfterCommand: true,
  showVisualFeedback: true,
};

export function useVoiceCommands(
  onCommand: (command: VoiceCommand) => void | Promise<void>,
  config: Partial<VoiceConfig> = {},
) {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const serviceRef = useRef<VoiceRecognitionService>(new VoiceRecognitionService());
  const commandInProgress = useRef(false);
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  const handleSpeechResult = useCallback(async (result: VoiceCommandResult) => {
    if (commandInProgress.current) return;
    commandInProgress.current = true;

    if (result.success && result.command) {
      setLastCommand(result.command);
      await onCommand(result.command);
    } else if (result.error) {
      setError(result.error);
      setTimeout(() => setError(null), 3000);
    }

    if (finalConfig.autoStopAfterCommand) {
      await serviceRef.current.stopListening();
      setIsListening(false);
    }

    setTimeout(() => {
      commandInProgress.current = false;
    }, 500);
  }, [finalConfig.autoStopAfterCommand, onCommand]);

  const toggleListening = useCallback(async (start?: boolean) => {
    const shouldStart = start ?? !isListening;
    if (shouldStart && !isListening) {
      setError(null);
      await serviceRef.current.startListening((result) => {
        void handleSpeechResult(result);
      });
      setIsListening(true);
      return;
    }

    if (!shouldStart && isListening) {
      await serviceRef.current.stopListening();
      setIsListening(false);
    }
  }, [handleSpeechResult, isListening]);

  const cleanup = useCallback(async () => {
    if (isListening) {
      await serviceRef.current.stopListening();
    }
  }, [isListening]);

  useEffect(() => {
    return () => {
      void cleanup();
    };
  }, [cleanup]);

  return {
    isListening,
    lastCommand,
    error,
    toggleListening,
    cleanup,
  };
}
