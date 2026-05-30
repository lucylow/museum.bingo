import * as tf from '@tensorflow/tfjs-react-native';

/**
 * Assesses whether a camera frame is suitable for CLIP recognition.
 * Checks blur, brightness, and edge density.
 */
export async function assessFrameQuality(
  frame: Uint8Array,
  width: number,
  height: number
): Promise<{ score: number; reason?: string }> {
  const tensor = tf.tensor3d(frame, [height, width, 3], 'int32');

  try {
    const gray = tf.image.rgbToGrayscale(tensor.div(255));

    // 1) Blur detection via variance of Laplacian approximation.
    const laplacian = tf.conv2d(gray as any, tf.ones([3, 3, 1, 1]), 1, 'same');
    const variance = laplacian.variance().arraySync() as number;
    if (variance < 300) {
      return { score: 0.2, reason: 'Frame too blurry' };
    }

    // 2) Brightness checks.
    const brightness = gray.mean().arraySync() as number;
    if (brightness < 0.1) {
      return { score: 0.1, reason: 'Too dark' };
    }
    if (brightness > 0.9) {
      return { score: 0.1, reason: 'Overexposed' };
    }

    // 3) Edge density proxy for framing quality.
    const edges = tf.image.sobelEdges(gray as any);
    const edgeDensity = edges.mean().arraySync() as number;
    if (edgeDensity < 0.05) {
      return { score: 0.3, reason: 'No distinct edges - point at artwork' };
    }

    let score = 0.5;
    if (variance > 500) {
      score += 0.2;
    }
    if (edgeDensity > 0.1) {
      score += 0.2;
    }
    if (brightness > 0.3 && brightness < 0.7) {
      score += 0.1;
    }

    return { score: Math.min(0.95, score) };
  } finally {
    tensor.dispose();
  }
}
