import * as tf from '@tensorflow/tfjs-node';

/**
 * Analyses user feedback text to estimate sentiment.
 * Uses a lightweight DistilBERT-style TFJS graph model.
 */
let sentimentModel: tf.GraphModel | null = null;

export async function loadSentimentModel(): Promise<void> {
  sentimentModel = await tf.loadGraphModel('file://models/distilbert_sentiment/model.json');
}

export async function analyzeFeedback(
  text: string
): Promise<{ sentiment: 'positive' | 'neutral' | 'negative'; confidence: number }> {
  if (!sentimentModel) {
    await loadSentimentModel();
  }

  const tokens = tokenize(text);
  const inputIds = tf.tensor([tokens], undefined, 'int32');
  const attentionMask = tf.ones(inputIds.shape, 'int32');

  const prediction = sentimentModel!.predict({
    input_ids: inputIds,
    attention_mask: attentionMask,
  } as any) as tf.Tensor;

  const probs = await prediction.data();
  const positiveProb = probs[1];

  let sentiment: 'positive' | 'neutral' | 'negative';
  if (positiveProb > 0.6) {
    sentiment = 'positive';
  } else if (positiveProb < 0.4) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  inputIds.dispose();
  attentionMask.dispose();
  prediction.dispose();

  return { sentiment, confidence: Math.max(positiveProb, 1 - positiveProb) };
}

function tokenize(text: string): number[] {
  // Simplified tokenizer stub: truncate/pad to fixed length.
  return Array(128)
    .fill(0)
    .map((_, i) => (i < text.length ? text.charCodeAt(i) : 0));
}
