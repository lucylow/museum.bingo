import { loadTensorFlowModel } from 'react-native-fast-tflite';
import * as FileSystem from 'expo-file-system';

export interface CLIPModel {
  run(input: number[]): Promise<number[][]>;
  getEmbeddingDim(): number;
}

class MobileCLIPModel implements CLIPModel {
  private interpreter: any = null;
  private readonly inputSize = 224;
  private readonly embeddingDim = 512;

  async load(modelPath: string): Promise<void> {
    // Load quantized TFLite model from bundled assets or downloaded from server.
    const modelBinary = await FileSystem.readAsStringAsync(modelPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    this.interpreter = await loadTensorFlowModel(modelBinary, {
      inputShape: [1, this.inputSize, this.inputSize, 3],
      outputShape: [1, this.embeddingDim],
    });
  }

  async run(input: number[]): Promise<number[][]> {
    if (!this.interpreter) {
      throw new Error('Model not loaded');
    }
    // input: flattened RGB array of size 224*224*3 normalized to CLIP stats.
    const output = await this.interpreter.runSync([input]);
    return output as number[][];
  }

  getEmbeddingDim(): number {
    return this.embeddingDim;
  }
}

export const clipModel = new MobileCLIPModel();

// Preprocess image bytes to model input.
export function preprocessImage(pixelData: Uint8Array, width: number, height: number): number[] {
  const resized = resizeBilinear(pixelData, width, height, 224, 224);
  const rgb = convertRGBAtoRGB(resized);

  // Normalize using CLIP image stats.
  const mean = [0.48145466, 0.4578275, 0.40821073];
  const std = [0.26862954, 0.26130258, 0.27577711];
  const normalized = new Array(224 * 224 * 3);

  for (let i = 0; i < rgb.length; i++) {
    const channel = i % 3;
    normalized[i] = (rgb[i] / 255 - mean[channel]) / std[channel];
  }

  return normalized;
}

function resizeBilinear(
  src: Uint8Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): Uint8Array {
  // Stub for MVP docs/examples. Replace with GPU-accelerated resize in app runtime.
  const dst = new Uint8Array(dstW * dstH * 4);
  void src;
  void srcW;
  void srcH;
  return dst;
}

function convertRGBAtoRGB(rgba: Uint8Array): Uint8Array {
  const rgb = new Uint8Array((rgba.length / 4) * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i];
    rgb[j + 1] = rgba[i + 1];
    rgb[j + 2] = rgba[i + 2];
  }
  return rgb;
}
