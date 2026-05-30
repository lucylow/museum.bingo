import RhinoManager, { Inference } from '@picovoice/rhino-react-native';
import VoiceProcessor from '@picovoice/react-native-voice-processor';
import { Platform } from 'react-native';
import { VoiceCommand, VoiceCommandResult, VoiceConfig, VoiceIntent } from './commandTypes';

const intentMap: Record<string, VoiceIntent> = {
  validateTile: 'VALIDATE_TILE',
  giveHint: 'GIVE_HINT',
  showLeaderboard: 'SHOW_LEADERBOARD',
  startNewGame: 'START_NEW_GAME',
  repeatPrompt: 'REPEAT_PROMPT',
  help: 'HELP',
  cancel: 'CANCEL',
  whatIsThis: 'WHAT_IS_THIS',
  nextArtwork: 'NEXT_ARTWORK',
  score: 'SCORE',
  resumeScanning: 'RESUME_SCANNING',
};

class RhinoVoiceService {
  private rhinoManager: RhinoManager | null = null;
  private isListening = false;
  private inferenceCallback: ((result: VoiceCommandResult) => void) | null = null;

  async init(accessKey: string, _config: VoiceConfig): Promise<void> {
    await VoiceProcessor.getInstance().addEventListener('error', (error) => {
      console.error('[Rhino] Audio processor error:', error);
    });

    this.rhinoManager = await RhinoManager.create(accessKey, (inference: Inference) => {
      this.handleInference(inference);
    }, {
      builtinLanguage: 'en',
      modelPath: undefined,
      forceProcessAudio: Platform.OS === 'android',
    });
  }

  private handleInference(inference: Inference): void {
    if (!inference.isFinalized) return;

    if (!inference.isUnderstood) {
      this.inferenceCallback?.({
        success: false,
        command: null,
        error: 'Command not understood',
      });
      return;
    }

    const command: VoiceCommand = {
      intent: intentMap[inference.intent] || 'HELP',
      slots: inference.slots,
      confidence: 1,
    };

    this.inferenceCallback?.({
      success: true,
      command,
    });
  }

  async startListening(callback: (result: VoiceCommandResult) => void): Promise<void> {
    if (!this.rhinoManager) {
      throw new Error('Rhino not initialized');
    }

    this.inferenceCallback = callback;
    const hasPermission = await VoiceProcessor.getInstance().hasRecordAudioPermission();
    if (!hasPermission) {
      await VoiceProcessor.getInstance().requestRecordAudioPermission();
    }
    await this.rhinoManager.process();
    this.isListening = true;
  }

  async stopListening(): Promise<void> {
    if (this.rhinoManager) {
      await this.rhinoManager.reset();
    }
    this.isListening = false;
  }

  get listening(): boolean {
    return this.isListening;
  }
}

export default RhinoVoiceService;
