import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useSkiaFrameProcessor } from 'react-native-vision-camera-skia';
import { Skia } from '@shopify/react-native-skia';
import { runOnJS } from 'react-native-reanimated';
import { runAsync } from 'react-native-worklets-core';
import { ArtworkRecognizer, RecognitionResult } from '../ai/ArtworkRecognizer';
import { EmbeddingDownloader } from '../ai/EmbeddingDownloader';
import { gameplayStatsTracker } from '../stats/tracker';
import { appTheme } from '../theme/tokens';

interface CameraScreenProps {
  museumId: string;
  onArtworkValidated: (artworkId: string, tileId: string) => Promise<boolean>;
  userId?: string;
  sessionId?: string;
  roomId?: string | null;
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  museumId,
  onArtworkValidated,
  userId,
  sessionId,
  roomId = null,
}) => {
  const device = useCameraDevice('back');
  const recognizerRef = useRef<ArtworkRecognizer>(new ArtworkRecognizer());
  const [isActive, setIsActive] = useState(true);
  const [recognitionState, setRecognitionState] = useState<'idle' | 'scanning' | 'recognized' | 'error'>('idle');
  const [lastResult, setLastResult] = useState<RecognitionResult | null>(null);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    recognizerRef.current.initialize().then(() => {
      void loadMuseumEmbeddings(museumId);
      setRecognitionState('scanning');
      if (userId && sessionId) {
        gameplayStatsTracker.trackEvent({
          type: 'scan_started',
          userId,
          sessionId,
          museumId,
          roomId,
          metadata: { source: 'camera_init' },
          idempotencyKey: `camera-scan-init-${sessionId}`,
        });
      }
    });
  }, [museumId, roomId, sessionId, userId]);

  const loadMuseumEmbeddings = async (id: string) => {
    const presignedUrl = `https://api.museum.bingo/museums/${id}/embeddings`;
    const artworks = await EmbeddingDownloader.downloadIndex(id, presignedUrl);
    await recognizerRef.current.loadMuseumIndex(id, artworks);
  };

  const handleRecognition = (result: RecognitionResult) => {
    const scanStartedAt = Date.now();
    setLastResult(result);
    setRecognitionState('recognized');
    setConfidence(result.confidence);
    onArtworkValidated(result.artworkId, result.tileId).then((success) => {
      if (userId && sessionId) {
        gameplayStatsTracker.trackEvent({
          type: success ? 'scan_success' : 'scan_failure',
          userId,
          sessionId,
          museumId,
          roomId,
          tileId: result.tileId,
          artworkId: result.artworkId,
          resultType: success ? 'success' : 'failure',
          metadata: {
            confidence: result.confidence,
            validateDurationMs: Date.now() - scanStartedAt,
          },
          idempotencyKey: `camera-recognition-${sessionId}-${result.tileId}-${success ? 'ok' : 'fail'}`,
        });
      }
      if (success) {
        setTimeout(() => setRecognitionState('idle'), 2000);
      }
    });
  };

  const frameProcessor = useSkiaFrameProcessor(
    (frame) => {
      'worklet';
      if (!recognizerRef.current.isReady()) return;

      runAsync(frame, async () => {
        const result = await recognizerRef.current.recognizeFrame(frame);
        if (!result || result.confidence <= 0.85) return;

        frame.drawCircle(frame.width / 2, frame.height / 2, 80, Skia.Color('#4CAF50'));
        frame.drawRect(frame.width / 2 - 100, frame.height - 100, 200, 40, Skia.Color('#000000CC'));
        runOnJS(handleRecognition)(result);
      });
    },
    [museumId],
  );

  if (!device) return <Text style={styles.error}>No camera device</Text>;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        frameProcessorFps={30}
        pixelFormat="yuv"
        enablePreviewSizedOutputBuffers
      />

      <View style={styles.topPanel}>
        <Text style={styles.panelTitle}>
          {recognitionState === 'recognized' ? 'Artwork recognized' : recognitionState === 'scanning' ? 'Scanning' : 'Ready'}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(confidence * 100)}%` }]} />
        </View>
      </View>

      {recognitionState === 'recognized' && lastResult && (
        <View style={styles.recognitionBadge}>
          <Text style={styles.badgeText}>
            ✓ {lastResult.artworkTitle} ({Math.round(lastResult.confidence * 100)}%)
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={() => setIsActive(false)}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  error: { color: appTheme.colors.accentDanger, textAlign: 'center', marginTop: 50 },
  topPanel: {
    position: 'absolute',
    top: 54,
    left: 16,
    right: 16,
    backgroundColor: appTheme.colors.overlayDark,
    borderRadius: appTheme.radius.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
    padding: appTheme.spacing.sm,
  },
  panelTitle: { color: appTheme.colors.textPrimary, marginBottom: appTheme.spacing.xs, textAlign: 'center', fontWeight: '700' },
  track: { height: 6, backgroundColor: appTheme.colors.bgMuted, borderRadius: appTheme.radius.pill, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: appTheme.colors.accentSuccess },
  recognitionBadge: {
    position: 'absolute',
    bottom: 92,
    left: 20,
    right: 20,
    backgroundColor: appTheme.colors.overlayDark,
    padding: 12,
    borderRadius: appTheme.radius.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appTheme.colors.accentSuccess,
  },
  badgeText: { color: appTheme.colors.textPrimary, fontWeight: 'bold' },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: appTheme.colors.overlayDark,
    borderColor: appTheme.colors.borderSoft,
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
  },
  closeText: { fontSize: 20, fontWeight: 'bold', color: appTheme.colors.textPrimary },
});
