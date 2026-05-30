import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { Skia } from '@shopify/react-native-skia';
import { useSkiaFrameProcessor } from 'react-native-vision-camera-skia';
import { runOnJS } from 'react-native-reanimated';
import { runAsync } from 'react-native-worklets-core';
import { ArtworkRecognizer, type RecognitionResult } from '../ai/ArtworkRecognizer';
import { EmbeddingDownloader } from '../ai/EmbeddingDownloader';
import { BingoChipCanvas, type BingoChipCanvasHandle } from '../components/BingoChipCanvas';
import { SkiaCompassOverlay } from '../components/SkiaCompassOverlay';
import { useHeatVision } from '../hooks/useHeatVision';
import { useValidationFeedback } from '../hooks/useValidationFeedback';
import { gameplayStatsTracker } from '../stats/tracker';
import { appTheme } from '../theme/tokens';
import { SpatialCameraHud } from '../components/immersive/SpatialCameraHud';

interface HeatVisionArtwork {
  id: string;
  title: string;
  tileId: string;
  lat: number;
  lng: number;
  hasBeenValidated?: boolean;
  beaconId?: string;
  apBssid?: string;
}

interface Props {
  museumId: string;
  artworks?: HeatVisionArtwork[];
  onArtworkValidated: (artworkId: string, tileId: string) => Promise<boolean>;
  userId?: string;
  sessionId?: string;
  roomId?: string | null;
  onClose?: () => void;
}

export const CameraScreenWithHeatVision: React.FC<Props> = ({
  museumId,
  artworks = [],
  onArtworkValidated,
  userId,
  sessionId,
  roomId = null,
  onClose,
}) => {
  const device = useCameraDevice('back');
  const recognizerRef = useRef(new ArtworkRecognizer());
  const chipCanvasRef = useRef<BingoChipCanvasHandle>(null);
  const validatingRef = useRef(false);
  const [showChip, setShowChip] = useState(false);
  const [scanState, setScanState] = useState<'scanning' | 'almost' | 'matched' | 'error'>('scanning');
  const [confidence, setConfidence] = useState(0);
  const { triggerFeedback } = useValidationFeedback();

  const {
    heatVisionActive,
    toggleHeatVision,
    currentTarget,
    userPosition,
    indoorReady,
    error,
    markTileCompleted,
  } = useHeatVision({
    museumId,
    artworks,
    enableWifiRTT: false,
  });

  const transitionHint =
    scanState === 'matched'
      ? 'Validation complete, returning to gallery state.'
      : scanState === 'almost'
        ? 'Transitioning from scan to lock-on.'
        : 'Live camera + spatial HUD active.';

  useEffect(() => {
    if (error) {
      setScanState('error');
      return;
    }
    if (scanState === 'error') {
      setScanState('scanning');
    }
  }, [error, scanState]);

  useEffect(() => {
    recognizerRef.current.initialize().then(() => {
      void loadMuseumEmbeddings(museumId);
      if (userId && sessionId) {
        gameplayStatsTracker.trackEvent({
          type: 'scan_started',
          userId,
          sessionId,
          museumId,
          roomId,
          metadata: { source: 'heat_vision_camera' },
          idempotencyKey: `heat-scan-init-${sessionId}`,
        });
      }
    });
  }, [museumId, roomId, sessionId, userId]);

  const loadMuseumEmbeddings = async (id: string) => {
    const presignedUrl = `https://api.museum.bingo/museums/${id}/embeddings`;
    const index = await EmbeddingDownloader.downloadIndex(id, presignedUrl);
    await recognizerRef.current.loadMuseumIndex(id, index);
  };

  const handleValidated = async (result: RecognitionResult, chipX: number, chipY: number) => {
    if (validatingRef.current) return;
    const startedAt = Date.now();
    validatingRef.current = true;

    setShowChip(true);
    chipCanvasRef.current?.drop(chipX, chipY);
    triggerFeedback('normal');

    try {
      const success = await onArtworkValidated(result.artworkId, result.tileId);
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
            validateDurationMs: Date.now() - startedAt,
            source: 'heat_vision',
          },
          idempotencyKey: `heat-scan-result-${sessionId}-${result.tileId}-${success ? 'ok' : 'fail'}`,
        });
      }
      if (success) {
        markTileCompleted(result.tileId);
      }
    } finally {
      validatingRef.current = false;
    }
  };

  const frameProcessor = useSkiaFrameProcessor(
    (frame) => {
      'worklet';
      if (!recognizerRef.current.isReady()) return;

      runAsync(frame, async () => {
        const result = await recognizerRef.current.recognizeFrame(frame);
        if (!result) return;
        if (result.confidence > 0.62) {
          runOnJS(setScanState)(result.confidence > 0.85 ? 'matched' : 'almost');
          runOnJS(setConfidence)(result.confidence);
        }
        if (result.confidence <= 0.85) return;
        frame.drawCircle(frame.width / 2, frame.height / 2, 80, Skia.Color('#4CAF50'));
        runOnJS(handleValidated)(result, frame.width / 2, frame.height / 2);
      });
    },
    [museumId],
  );

  if (!device) return <Text style={styles.error}>No camera device</Text>;

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive frameProcessor={frameProcessor} frameProcessorFps={30} />

      <View style={styles.viewfinderWrap} pointerEvents="none">
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
          <View style={[styles.scanLine, scanState === 'almost' && styles.scanLineWarm, scanState === 'matched' && styles.scanLineSuccess]} />
        </View>
      </View>
      <SpatialCameraHud confidence={confidence} scanState={scanState} />

      <SkiaCompassOverlay
        visible={heatVisionActive && Boolean(currentTarget)}
        relativeBearing={currentTarget?.relativeBearing ?? 0}
      />

      <BingoChipCanvas ref={chipCanvasRef} visible={showChip} onAnimationComplete={() => setShowChip(false)} />

      {heatVisionActive && currentTarget && (
        <View style={styles.targetInfo}>
          <Text style={styles.targetTitle}>{currentTarget.title}</Text>
          <Text style={styles.targetDistance}>{Math.round(currentTarget.distanceMeters)}m away</Text>
        </View>
      )}

      <View style={styles.statusPanel}>
        <Text style={styles.scanStateLabel}>
          {scanState === 'matched'
            ? 'Match confirmed'
            : scanState === 'almost'
              ? 'Almost there'
              : scanState === 'error'
                ? 'Sensor issue'
                : 'Scanning artwork'}
        </Text>
        <View style={styles.confidenceTrack}>
          <View style={[styles.confidenceFill, { width: `${Math.round(confidence * 100)}%` }]} />
        </View>
        <Text style={styles.confidenceText}>Confidence {Math.round(confidence * 100)}%</Text>
        <Text style={styles.statusText}>
          {error
            ? `Heat vision error: ${error}`
            : indoorReady
              ? `Source: ${userPosition?.source ?? 'initializing'} | Accuracy: ${Math.round(userPosition?.accuracy ?? 0)}m`
              : 'Preparing indoor positioning...'}
        </Text>
        <Text style={styles.transitionText}>{transitionHint}</Text>
      </View>

      <TouchableOpacity
        style={styles.heatVisionButton}
        onPress={() => {
          toggleHeatVision();
          if (userId && sessionId) {
            gameplayStatsTracker.trackEvent({
              type: 'hint_used',
              userId,
              sessionId,
              museumId,
              roomId,
              metadata: { hintType: 'heat_vision_toggle' },
              idempotencyKey: `hint-heat-vision-${sessionId}-${Date.now()}`,
            });
          }
        }}
      >
        <Text style={styles.buttonText}>{heatVisionActive ? 'HEAT VISION ON' : 'HEAT VISION OFF'}</Text>
      </TouchableOpacity>
      {onClose ? (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Exit scan</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  error: { color: appTheme.colors.accentDanger, textAlign: 'center', marginTop: 50 },
  viewfinderWrap: { position: 'absolute', top: '25%', left: 32, right: 32, alignItems: 'center' },
  viewfinder: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: appTheme.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: appTheme.colors.accent,
  },
  cornerTopLeft: { top: 10, left: 10, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  cornerTopRight: { top: 10, right: 10, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  cornerBottomLeft: { bottom: 10, left: 10, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  cornerBottomRight: { bottom: 10, right: 10, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  scanLine: {
    height: 3,
    width: '100%',
    backgroundColor: appTheme.colors.accent,
    marginTop: '48%',
    opacity: 0.85,
  },
  scanLineWarm: { backgroundColor: appTheme.colors.accentWarm },
  scanLineSuccess: { backgroundColor: appTheme.colors.accentSuccess },
  heatVisionButton: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: appTheme.colors.overlayDark,
    paddingVertical: 12,
    borderRadius: appTheme.radius.pill,
    borderWidth: 1,
    borderColor: appTheme.colors.borderStrong,
    alignItems: 'center',
    ...appTheme.elevation.floating,
  },
  buttonText: { color: appTheme.colors.textPrimary, fontWeight: '700', letterSpacing: 0.4 },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 16,
    borderRadius: appTheme.radius.pill,
    backgroundColor: appTheme.colors.overlayDark,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeText: {
    color: appTheme.colors.textPrimary,
    fontWeight: '700',
  },
  targetInfo: {
    position: 'absolute',
    bottom: 174,
    left: 20,
    right: 20,
    backgroundColor: appTheme.colors.overlayDark,
    padding: 12,
    borderRadius: appTheme.radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
  },
  targetTitle: { color: appTheme.colors.accentWarm, fontSize: appTheme.typography.body, fontWeight: '700' },
  targetDistance: { color: appTheme.colors.textSecondary, fontSize: appTheme.typography.caption, marginTop: 4 },
  statusPanel: {
    position: 'absolute',
    top: 58,
    left: 12,
    right: 12,
    borderRadius: appTheme.radius.md,
    backgroundColor: appTheme.colors.overlayDark,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.borderSoft,
  },
  scanStateLabel: { color: appTheme.colors.textPrimary, textAlign: 'center', fontWeight: '700', marginBottom: 6 },
  confidenceTrack: {
    height: 6,
    borderRadius: appTheme.radius.pill,
    backgroundColor: appTheme.colors.bgMuted,
    overflow: 'hidden',
  },
  confidenceFill: { height: '100%', backgroundColor: appTheme.colors.accentSuccess },
  confidenceText: { color: appTheme.colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 4, fontSize: 11 },
  statusText: { color: appTheme.colors.textSecondary, fontSize: appTheme.typography.caption, textAlign: 'center' },
  transitionText: { color: appTheme.colors.info, fontSize: appTheme.typography.overline, textAlign: 'center', marginTop: 3 },
});
