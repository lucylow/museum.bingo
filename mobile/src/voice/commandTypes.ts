export type VoiceIntent =
  | 'VALIDATE_TILE'
  | 'GIVE_HINT'
  | 'SHOW_LEADERBOARD'
  | 'START_NEW_GAME'
  | 'REPEAT_PROMPT'
  | 'HELP'
  | 'CANCEL'
  | 'WHAT_IS_THIS'
  | 'NEXT_ARTWORK'
  | 'SCORE'
  | 'RESUME_SCANNING';

export interface VoiceCommand {
  intent: VoiceIntent;
  slots?: Record<string, string | number>;
  confidence: number;
  rawText?: string;
}

export interface VoiceCommandResult {
  success: boolean;
  command: VoiceCommand | null;
  error?: string;
}

export interface VoiceConfig {
  wakeWordEnabled: boolean;
  wakeWord: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'zh';
  autoStopAfterCommand: boolean;
  showVisualFeedback: boolean;
}
