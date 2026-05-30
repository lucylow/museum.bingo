import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { Skia } from '@shopify/react-native-skia';
import { useSkiaFrameProcessor } from 'react-native-vision-camera-skia';
import { runOnJS } from 'react-native-reanimated';
import { runAsync } from 'react-native-worklets-core';
import { ArtworkRecognizer, type RecognitionResult } from '../ai/ArtworkRecognizer';
import { EmbeddingDownloader } from '../ai/EmbeddingDownloader';
import { BingoChipCanvas, type BingoChipCanvasHandle } from '../components/BingoChipCanvas';
import { useValidationFeedback } from '../hooks/useValidationFeedback';
import { soundService } from '../services/SoundService';

interface Props {
  museumId: string;
  onArtworkValidated: (artworkId: string, tileId: string) => Promise<boolean>;
}

const RECOGNITION_COOLDOWN_MS = 1200;

export const CameraScreenWithChip: React.FC<Props> = ({ museumId, onArtworkValidated }) => {
  const device = useCameraDevice('back');
  const recognizerRef = useRef<ArtworkRecognizer>(new ArtworkRecognizer());
  const chipCanvasRef = useRef<BingoChipCanvasHandle>(null);
  const isValidatingRef = useRef(false);
  const lastRecognitionAtRef = useRef(0);
  const [initError, setInitError] = useState<string | null>(null);
  const [showChip, setShowChip] = useState(false);
  const { triggerFeedback } = useValidationFeedback();

  useEffect(() => {
    void soundService.init();
  }, []);

  useEffect(() => {
    let mounted = true;
    const initializeRecognizer = async () => {
      try {
        await recognizerRef.current.initialize();
        await loadMuseumEmbeddings(museumId);
      } catch (error) {
        if (mounted) {
          console.warn('Failed to initialize artwork recognizer', error);
          setInitError('Camera AI failed to initialize');
        }
      }
    };

    void initializeRecognizer();
    return () => {
      mounted = false;
    };
  }, [museumId]);

  const loadMuseumEmbeddings = async (id: string) => {
    const presignedUrl = `https://api.museum.bingo/museums/${id}/embeddings`;
    const artworks = await EmbeddingDownloader.downloadIndex(id, presignedUrl);
    await recognizerRef.current.loadMuseumIndex(id, artworks);
  };

  const handleArtworkValidated = useCallback(async (result: RecognitionResult, chipX: number, chipY: number) => {
    const now = Date.now();
    if (now - lastRecognitionAtRef.current < RECOGNITION_COOLDOWN_MS) return;
    if (isValidatingRef.current) return;
    isValidatingRef.current = true;
    lastRecognitionAtRef.current = now;

    setShowChip(true);
    chipCanvasRef.current?.drop(chipX, chipY);
    triggerFeedback('normal');

    try {
      await onArtworkValidated(result.artworkId, result.tileId);
    } finally {
      isValidatingRef.current = false;
    }
  }, [onArtworkValidated, triggerFeedback]);

  const frameProcessor = useSkiaFrameProcessor(
    (frame) => {
      'worklet';
      if (!recognizerRef.current.isReady()) return;

      runAsync(frame, async () => {
        const result = await recognizerRef.current.recognizeFrame(frame);
        if (!result || result.confidence <= 0.85) return;

        frame.drawCircle(frame.width / 2, frame.height / 2, 80, Skia.Color('#4CAF50'));
        runOnJS(handleArtworkValidated)(result, frame.width / 2, frame.height / 2);
      });
    },
    [museumId],
  );

  if (!device) return <Text style={styles.error}>No camera device</Text>;
  if (initError) return <Text style={styles.error}>{initError}</Text>;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        frameProcessor={frameProcessor}
        frameProcessorFps={12}
      />
      <BingoChipCanvas
        ref={chipCanvasRef}
        visible={showChip}
        onAnimationComplete={() => setShowChip(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  error: { color: 'red', textAlign: 'center', marginTop: 50 },
});
