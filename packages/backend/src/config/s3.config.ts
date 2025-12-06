import { S3Client } from '@aws-sdk/client-s3';
import { logger } from '../utils/logger';

/**
 * S3 Client Configuration
 * Creates and exports a configured S3 client instance
 */

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_ENDPOINT_URL = process.env.AWS_ENDPOINT_URL;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  logger.warn('[S3Config] AWS credentials not found. S3 operations will fail.');
}

const s3ClientConfig: {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  endpoint?: string;
  forcePathStyle?: boolean;
} = {
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
};

// Add custom endpoint if provided (useful for LocalStack, MinIO, etc.)
if (AWS_ENDPOINT_URL) {
  s3ClientConfig.endpoint = AWS_ENDPOINT_URL;
  // Most S3-compatible services require path-style addressing
  s3ClientConfig.forcePathStyle = true;
  logger.info(`[S3Config] Using custom endpoint: ${AWS_ENDPOINT_URL}`);
}

export const s3Client = new S3Client(s3ClientConfig);

export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'musico-audio';
export const S3_AUDIO_PREFIX = process.env.S3_AUDIO_PREFIX || 'audio';

/**
 * Get S3 key for an audio file
 * Format: audio/{artistId}/{albumId}/{trackId}.{format}
 */
export function getS3AudioKey(trackId: string, artistId: string, albumId: string | undefined, format: string): string {
  const extension = format.startsWith('.') ? format : `.${format}`;
  if (albumId) {
    return `${S3_AUDIO_PREFIX}/${artistId}/${albumId}/${trackId}${extension}`;
  }
  return `${S3_AUDIO_PREFIX}/${artistId}/${trackId}${extension}`;
}

