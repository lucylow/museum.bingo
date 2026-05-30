import { useEffect, useRef, useState } from 'react';
import { runOnJS } from 'react-native-reanimated';
import { useFrameProcessor } from 'react-native-vision-camera';
import { runAsync } from 'react-native-worklets-core';
import { MobileCLIPModel } from './MobileCLIPModel';
import { ArtworkIndex } from './ArtworkIndex';

export interface RecognitionResult {
  artworkId: string;
  tileId: string;
  title: string;
  confidence: number;
  embeddingLatencyMs: number;
}

export class FrameProcessorRecognizer {
  private clipModel: MobileCLIPModel;
  private index: ArtworkIndex | null = null;

  constructor() {
    this.clipModel = new MobileCLIPModel();
  }

  async initialize(): Promise<void> {
    await this.clipModel.load();
  }

  setIndex(index: ArtworkIndex): void {
    this.index = index;
  }

  async recognizeFrame(
    rgbData: Uint8Array,
    width: number,
    height: number,
  ): Promise<RecognitionResult | null> {
    if (!this.index) return null;
    const { embedding, latencyMs } = await this.clipModel.encodeImage(rgbData, width, height);
    const match = this.index.search(embedding);
    if (!match) return null;

    return {
      artworkId: match.metadata.id,
      tileId: match.metadata.bingoTileId,
      title: match.metadata.title,
      confidence: match.similarity,
      embeddingLatencyMs: latencyMs,
    };
  }
}

interface UseFrameProcessorRecognizerOptions {
  onArtworkRecognized?: (result: RecognitionResult) => void;
  confidenceThreshold?: number;
}

export function useFrameProcessorRecognizer(options: UseFrameProcessorRecognizerOptions = {}) {
  const { onArtworkRecognized, confidenceThreshold = 0.85 } = options;
  const recognizerRef = useRef<FrameProcessorRecognizer>(new FrameProcessorRecognizer());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    recognizerRef.current.initialize().then(() => {
      if (isMounted) setIsReady(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (!isReady) return;

      runAsync(frame, async () => {
        const rgb = new Uint8Array(frame.toArrayBuffer());
        const result = await recognizerRef.current.recognizeFrame(rgb, frame.width, frame.height);
        if (result && result.confidence > confidenceThreshold && onArtworkRecognized) {
          runOnJS(onArtworkRecognized)(result);
        }
      });
    },
    [confidenceThreshold, isReady, onArtworkRecognized],
  );

  return {
    frameProcessor,
    isReady,
    setIndex: recognizerRef.current.setIndex.bind(recognizerRef.current),
  };
}
