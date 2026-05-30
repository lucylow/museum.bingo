import RNFS from 'react-native-fs';
import { loadTensorflowModel } from 'react-native-fast-tflite';

export interface CLIPModel {
  runSync(input: [number[]]): number[][];
}

export interface CLIPOutput {
  embedding: Float32Array;
  latencyMs: number;
}

export class MobileCLIPModel {
  private interpreter: CLIPModel | null = null;
  private readonly inputSize = 224;
  private readonly embeddingDim = 512;
  private readonly mean = [0.48145466, 0.4578275, 0.40821073];
  private readonly std = [0.26862954, 0.26130258, 0.27577711];
  private isLoaded = false;

  async load(modelPath?: string): Promise<void> {
    if (this.isLoaded) return;

    const resolvedModelPath =
      modelPath ?? `${RNFS.MainBundlePath}/assets/models/mobileclip_s2_quant.tflite`;
    this.interpreter = (await loadTensorflowModel({
      url: `file://${resolvedModelPath}`,
    })) as unknown as CLIPModel;
    this.isLoaded = true;
  }

  async encodeImage(rgbData: Uint8Array, width: number, height: number): Promise<CLIPOutput> {
    if (!this.interpreter) throw new Error('Model not loaded');
    const start = performance.now();

    const resized = this.resizeBilinear(rgbData, width, height, this.inputSize, this.inputSize);
    const normalized = this.normalize(resized);
    const outputs = this.interpreter.runSync([normalized]);
    const embedding = new Float32Array(outputs[0]);

    return { embedding, latencyMs: performance.now() - start };
  }

  private resizeBilinear(
    src: Uint8Array,
    srcW: number,
    srcH: number,
    dstW: number,
    dstH: number,
  ): Float32Array {
    const dst = new Float32Array(dstW * dstH * 3);
    const xRatio = srcW / dstW;
    const yRatio = srcH / dstH;

    for (let y = 0; y < dstH; y++) {
      const srcY = y * yRatio;
      const yFloor = Math.floor(srcY);
      const yCeil = Math.min(yFloor + 1, srcH - 1);
      const yFrac = srcY - yFloor;

      for (let x = 0; x < dstW; x++) {
        const srcX = x * xRatio;
        const xFloor = Math.floor(srcX);
        const xCeil = Math.min(xFloor + 1, srcW - 1);
        const xFrac = srcX - xFloor;

        for (let c = 0; c < 3; c++) {
          const srcIdx = (yFloor * srcW + xFloor) * 3 + c;
          const srcIdxNextRow = (yCeil * srcW + xFloor) * 3 + c;
          const srcIdxNextCol = (yFloor * srcW + xCeil) * 3 + c;
          const srcIdxNextDiag = (yCeil * srcW + xCeil) * 3 + c;

          const top = src[srcIdx] * (1 - xFrac) + src[srcIdxNextCol] * xFrac;
          const bottom = src[srcIdxNextRow] * (1 - xFrac) + src[srcIdxNextDiag] * xFrac;
          dst[(y * dstW + x) * 3 + c] = top * (1 - yFrac) + bottom * yFrac;
        }
      }
    }

    return dst;
  }

  private normalize(rgb: Float32Array): number[] {
    const result = new Array(this.inputSize * this.inputSize * 3);
    for (let i = 0; i < rgb.length; i++) {
      const channel = i % 3;
      result[i] = (rgb[i] / 255 - this.mean[channel]) / this.std[channel];
    }
    return result;
  }

  getEmbeddingDim(): number {
    return this.embeddingDim;
  }

  isModelLoaded(): boolean {
    return this.isLoaded;
  }
}
