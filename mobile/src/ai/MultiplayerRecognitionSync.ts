import { RecognitionResult } from './ArtworkRecognizer';
import { socket } from '../services/websocket';

export class MultiplayerRecognitionSync {
  private roomId: string | null = null;
  private userId: string | null = null;

  joinRoom(roomId: string, userId: string): void {
    this.roomId = roomId;
    this.userId = userId;
    socket.emit('join-recognition-room', { roomId, userId });
  }

  async broadcastRecognition(result: RecognitionResult): Promise<void> {
    if (!this.roomId || !this.userId) return;

    socket.emit('artwork-recognized', {
      roomId: this.roomId,
      userId: this.userId,
      artworkId: result.artworkId,
      tileId: result.tileId,
      confidence: result.confidence,
      timestamp: Date.now(),
    });
  }

  subscribeToRoom(callback: (data: any) => void): () => void {
    const handler = (data: any) => callback(data);
    socket.on('artwork-recognized', handler);
    return () => socket.off('artwork-recognized', handler);
  }
}
