"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadArtworkImage = uploadArtworkImage;
exports.getArtworkImageUrl = getArtworkImageUrl;
exports.uploadEmbeddingIndex = uploadEmbeddingIndex;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const hasAwsCredentials = Boolean(process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
const s3Client = hasAwsCredentials
    ? new client_s3_1.S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    })
    : null;
const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';
const EMBEDDINGS_BUCKET = process.env.S3_EMBEDDINGS_BUCKET || '';
function getS3Client() {
    if (!s3Client || !BUCKET_NAME || !EMBEDDINGS_BUCKET) {
        throw new Error('S3 client is not configured. Set AWS and S3 environment variables.');
    }
    return s3Client;
}
async function uploadArtworkImage(museumId, artworkId, imageBuffer, contentType = 'image/jpeg') {
    const client = getS3Client();
    const key = `museums/${museumId}/artworks/${artworkId}.jpg`;
    const command = new client_s3_1.PutObjectCommand({
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
async function getArtworkImageUrl(s3Key) {
    const client = getS3Client();
    const command = new client_s3_1.GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(client, command, { expiresIn: 3600 });
}
async function uploadEmbeddingIndex(museumId, indexBuffer) {
    const client = getS3Client();
    const key = `embeddings/${museumId}/index.bin`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: EMBEDDINGS_BUCKET,
        Key: key,
        Body: indexBuffer,
        ContentType: 'application/octet-stream',
    });
    await client.send(command);
    return key;
}
