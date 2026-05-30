import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const hasAwsCredentials = Boolean(
  process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
);

const s3Client = hasAwsCredentials
  ? new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    })
  : null;

const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';
const EMBEDDINGS_BUCKET = process.env.S3_EMBEDDINGS_BUCKET || '';

function getS3Client(): S3Client {
  if (!s3Client || !BUCKET_NAME || !EMBEDDINGS_BUCKET) {
    throw new Error('S3 client is not configured. Set AWS and S3 environment variables.');
  }
  return s3Client;
}

export async function uploadArtworkImage(
  museumId: string,
  artworkId: string,
  imageBuffer: Buffer,
  contentType = 'image/jpeg'
): Promise<string> {
  const client = getS3Client();
  const key = `museums/${museumId}/artworks/${artworkId}.jpg`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: imageBuffer,
    ContentType: contentType,
    Metadata: {
      museumId,
      artworkId,
      uploadedAt: Date.now().toString(),
    },
  });
  await client.send(command);
  return key;
}

export async function getArtworkImageUrl(s3Key: string): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function uploadEmbeddingIndex(museumId: string, indexBuffer: Buffer): Promise<string> {
  const client = getS3Client();
  const key = `embeddings/${museumId}/index.bin`;
  const command = new PutObjectCommand({
    Bucket: EMBEDDINGS_BUCKET,
    Key: key,
    Body: indexBuffer,
    ContentType: 'application/octet-stream',
  });
  await client.send(command);
  return key;
}
