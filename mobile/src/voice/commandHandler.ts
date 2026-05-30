import { VoiceCommand } from './commandTypes';

interface CommandContext {
  gameState: unknown;
  navigation: unknown;
  validateTile: (tileNumber: number) => void;
  showHint: () => void;
  showLeaderboard: () => void;
  startNewGame: () => void;
  repeatCurrentPrompt: () => void;
  showHelp: () => void;
  cancelAction: () => void;
  describeCurrentArtwork: () => void;
  goToNextArtwork: () => void;
  reportScore: () => void;
  resumeScanning: () => void;
  speak: (text: string) => void;
}

export class CommandHandler {
  static async execute(
    command: VoiceCommand,
    context: CommandContext,
  ): Promise<{ executed: boolean; message?: string; error?: string }> {
    try {
      switch (command.intent) {
        case 'VALIDATE_TILE': {
          const tileNumber = command.slots?.tileNumber;
          if (tileNumber && typeof tileNumber === 'number') {
            context.validateTile(tileNumber);
            context.speak(`Validating tile ${tileNumber}`);
          } else {
            context.speak('Which tile number would you like to validate?');
          }
          return { executed: true, message: `Validating tile ${tileNumber || '?'}` };
        }
        case 'GIVE_HINT':
          context.showHint();
          context.speak('Here is a hint for you.');
          return { executed: true, message: 'Hint shown' };
        case 'SHOW_LEADERBOARD':
          context.showLeaderboard();
          context.speak('Opening leaderboard.');
          return { executed: true, message: 'Leaderboard opened' };
        case 'START_NEW_GAME':
          context.startNewGame();
          context.speak('Starting a new game.');
          return { executed: true, message: 'New game started' };
        case 'REPEAT_PROMPT':
          context.repeatCurrentPrompt();
          return { executed: true, message: 'Repeating prompt' };
        case 'HELP':
          context.showHelp();
          context.speak('You can say: validate tile, give me a hint, show leaderboard, new game, repeat, what is this, next artwork, my score, or resume scanning.');
          return { executed: true, message: 'Help displayed' };
        case 'CANCEL':
          context.cancelAction();
          context.speak('Cancelled. Tap the mic when you are ready.');
          return { executed: true, message: 'Action cancelled' };
        case 'WHAT_IS_THIS':
          context.describeCurrentArtwork();
          return { executed: true, message: 'Describing artwork' };
        case 'NEXT_ARTWORK':
          context.goToNextArtwork();
          context.speak('Moving to the next artwork.');
          return { executed: true, message: 'Next artwork' };
        case 'SCORE':
          context.reportScore();
          return { executed: true, message: 'Score reported' };
        case 'RESUME_SCANNING':
          context.resumeScanning();
          context.speak('Resuming scanning.');
          return { executed: true, message: 'Resumed scanning' };
        default:
          context.speak('Command not recognized. Say help to see available commands.');
          return { executed: false, error: 'Unknown intent' };
      }
    } catch (err) {
      return {
        executed: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}
