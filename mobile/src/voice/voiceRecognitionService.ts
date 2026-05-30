import Voice, { SpeechErrorEvent, SpeechResultsEvent } from '@react-native-voice/voice';
import { VoiceCommandResult, VoiceIntent } from './commandTypes';

class VoiceRecognitionService {
  private isListening = false;
  private resultCallback: ((result: VoiceCommandResult) => void) | null = null;

  private commandMap: Record<string, VoiceIntent> = {
    'validate tile': 'VALIDATE_TILE',
    'mark tile': 'VALIDATE_TILE',
    'confirm tile': 'VALIDATE_TILE',
    tile: 'VALIDATE_TILE',
    'give me a hint': 'GIVE_HINT',
    'i need a hint': 'GIVE_HINT',
    'hint please': 'GIVE_HINT',
    'show leaderboard': 'SHOW_LEADERBOARD',
    "what's the score": 'SHOW_LEADERBOARD',
    leaderboard: 'SHOW_LEADERBOARD',
    'new game': 'START_NEW_GAME',
    'start over': 'START_NEW_GAME',
    reset: 'START_NEW_GAME',
    repeat: 'REPEAT_PROMPT',
    'say that again': 'REPEAT_PROMPT',
    'what was that': 'REPEAT_PROMPT',
    help: 'HELP',
    'what can i say': 'HELP',
    commands: 'HELP',
    cancel: 'CANCEL',
    'stop listening': 'CANCEL',
    nevermind: 'CANCEL',
    'what is this': 'WHAT_IS_THIS',
    'tell me about this': 'WHAT_IS_THIS',
    'describe artwork': 'WHAT_IS_THIS',
    'next artwork': 'NEXT_ARTWORK',
    "what's next": 'NEXT_ARTWORK',
    'next piece': 'NEXT_ARTWORK',
    "what's my score": 'SCORE',
    'my score': 'SCORE',
    score: 'SCORE',
    'resume scanning': 'RESUME_SCANNING',
    'start scanning': 'RESUME_SCANNING',
    'back to camera': 'RESUME_SCANNING',
  };

  constructor() {
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
  }

  private onSpeechResults(e: SpeechResultsEvent): void {
    if (!this.resultCallback) return;

    const spoken = e.value?.[0]?.toLowerCase().trim() ?? '';
    let intent: VoiceIntent = 'HELP';
    let tileNumber: number | undefined;

    const commandEntry = Object.entries(this.commandMap).find(([phrase]) => {
      return spoken.includes(phrase) || phrase.includes(spoken);
    });
    if (commandEntry) {
      intent = commandEntry[1];
    }

    if (intent === 'VALIDATE_TILE') {
      const match = spoken.match(/\d+/);
      if (match) {
        tileNumber = parseInt(match[0], 10);
      }
    }

    this.resultCallback({
      success: true,
      command: {
        intent,
        slots: typeof tileNumber === 'number' ? { tileNumber } : undefined,
        confidence: 0.85,
        rawText: spoken,
      },
    });

    void this.stopListening();
  }

  private onSpeechError(e: SpeechErrorEvent): void {
    this.resultCallback?.({
      success: false,
      command: null,
      error: e.error?.message || 'Speech recognition failed',
    });
    void this.stopListening();
  }

  private onSpeechEnd(): void {
    this.isListening = false;
  }

  async startListening(callback: (result: VoiceCommandResult) => void): Promise<void> {
    this.resultCallback = callback;
    try {
      await Voice.start('en-US');
      this.isListening = true;
    } catch (err) {
      this.resultCallback({
        success: false,
        command: null,
        error: String(err),
      });
    }
  }

  async stopListening(): Promise<void> {
    if (this.isListening) {
      await Voice.stop();
    }
    this.isListening = false;
  }
}

export default VoiceRecognitionService;
