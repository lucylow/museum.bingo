import { runOnJS } from 'react-native-reanimated';
import { useFrameProcessor } from 'react-native-vision-camera';
import { useResizer } from 'react-native-vision-camera-resizer';
import { runAsync, runAtTargetFps } from 'react-native-worklets-core';
import { ArtworkRecognizer, RecognitionResult } from './ArtworkRecognizer';

export function useOptimizedFrameProcessor(
  recognizer: ArtworkRecognizer,
  onResult: (result: RecognitionResult) => void,
  targetFps = 15,
) {
  const resizer = useResizer();

  return useFrameProcessor(
    (frame) => {
      'worklet';
      if (!recognizer.isReady()) return;

      runAtTargetFps(targetFps, () => {
        const resizedFrame = resizer.resize(frame, {
          width: 224,
          height: 224,
          pixelFormat: 'rgb',
        });

        runAsync(resizedFrame, async () => {
          const result = await recognizer.recognizeFrame(resizedFrame);
          if (result && result.confidence > 0.85) {
            runOnJS(onResult)(result);
          }
        });
      });
    },
    [recognizer, onResult, targetFps, resizer],
  );
}
