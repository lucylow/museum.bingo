import { useCallback, useEffect, useRef } from 'react';
import { audioManager, type AudioLanguage } from '../audio/AudioManager';
import { formatMessage, VOICE_MESSAGES } from '../audio/MessageTemplates';
import { tts } from '../audio/TextToSpeechService';

interface UseVoiceGuidanceOptions {
  autoLanguage?: boolean;
  autoQueue?: boolean;
  cooldownMs?: number;
}

export function useVoiceGuidance(options: UseVoiceGuidanceOptions = {}) {
  const { autoLanguage = true, autoQueue = true, cooldownMs = 1200 } = options;
  const messageCooldownRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const init = async () => {
      await audioManager.initialize();
      const settings = audioManager.getSettings();
      if (autoLanguage) {
        await tts.setLanguage(settings.voiceLanguage);
      }
    };
    void init();

    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      void tts.stop();
    };
  }, [autoLanguage]);

  const startCooldown = useCallback(() => {
    messageCooldownRef.current = true;
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = setTimeout(() => {
      messageCooldownRef.current = false;
    }, cooldownMs);
  }, [cooldownMs]);

  const speakMessage = useCallback(
    async (
      messageKey: keyof typeof VOICE_MESSAGES,
      variables: Record<string, string | number> = {},
      priority?: number,
    ) => {
      if (messageCooldownRef.current) return;

      const message = VOICE_MESSAGES[messageKey];
      if (!message) return;

      const settings = audioManager.getSettings();
      if (!settings.voiceEnabled) return;

      const text = formatMessage(message, settings.voiceLanguage, variables);
      const level = priority ?? message.priority;

      if (autoQueue) {
        await tts.speakWithQueue(
          text,
          {
            language: settings.voiceLanguage,
            gender: settings.voiceGender,
            speed: settings.voiceSpeed,
            pitch: settings.voicePitch,
          },
          level,
        );
      } else {
        await tts.speak(text, {
          language: settings.voiceLanguage,
          gender: settings.voiceGender,
          speed: settings.voiceSpeed,
          pitch: settings.voicePitch,
        });
      }

      startCooldown();
    },
    [autoQueue, startCooldown],
  );

  const announceTileValidated = useCallback(
    (points: number) => {
      void speakMessage('tileValidated', { points });
      audioManager.playSound('tileValidated');
    },
    [speakMessage],
  );

  const announceStreakBonus = useCallback(
    (streak: number, bonus: number) => {
      void speakMessage('streakBonus', { streak, bonus });
      audioManager.playSound('streakBonus');
    },
    [speakMessage],
  );

  const announceLineComplete = useCallback(
    (points: number) => {
      void speakMessage('lineComplete', { points });
      audioManager.playSound('lineComplete');
    },
    [speakMessage],
  );

  const announceBingo = useCallback(
    (points: number) => {
      void speakMessage('bingoWin', { points });
      audioManager.playSound('bingoWin');
    },
    [speakMessage],
  );

  const announceHint = useCallback(
    (hintText: string) => {
      void speakMessage('hintProvided', { hintText });
      audioManager.playSound('hintReceived');
    },
    [speakMessage],
  );

  const announceOneAway = useCallback(() => {
    void speakMessage('oneAway');
  }, [speakMessage]);

  const announceBadgeUnlocked = useCallback(
    (badgeName: string) => {
      void speakMessage('badgeUnlocked', { badgeName });
      audioManager.playSound('badgeUnlocked');
    },
    [speakMessage],
  );

  const announceScanError = useCallback(() => {
    void speakMessage('scanError');
    audioManager.playSound('scanError');
  }, [speakMessage]);

  const announceLowLight = useCallback(() => {
    void speakMessage('lowLight');
  }, [speakMessage]);

  const setLanguage = useCallback(async (language: AudioLanguage) => {
    await tts.setLanguage(language);
    await audioManager.updateSettings({ voiceLanguage: language });
  }, []);

  const stopSpeaking = useCallback(async () => {
    await tts.stop();
  }, []);

  return {
    speakMessage,
    announceTileValidated,
    announceStreakBonus,
    announceLineComplete,
    announceBingo,
    announceHint,
    announceOneAway,
    announceBadgeUnlocked,
    announceScanError,
    announceLowLight,
    setLanguage,
    stopSpeaking,
  };
}
