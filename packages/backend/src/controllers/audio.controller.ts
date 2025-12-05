import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { TrackModel } from '../models/Track';
import { streamTrackAudio, getTrackAudioMetadata } from '../services/audioStorageService';
import { toApiFormat } from '../utils/musicHelpers';

/**
 * Parse Range header (e.g., "bytes=0-1023" or "bytes=1024-")
 */
function parseRange(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
  if (!rangeHeader) return null;

  const matches = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!matches) return null;

  const start = parseInt(matches[1], 10);
  const end = matches[2] ? parseInt(matches[2], 10) : fileSize - 1;

  // Validate range
  if (start > end || start < 0 || end >= fileSize) {
    return null;
  }

  return { start, end };
}

/**
 * Stream audio file with Range Request support (Spotify-style)
 * GET /api/audio/:trackId
 * Uses MongoDB ObjectId to identify tracks
 */
export const streamAudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trackId } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(trackId)) {
      return res.status(400).json({ error: 'Invalid track ID' });
    }

    // Fetch track from database
    const trackDoc = await TrackModel.findById(trackId).lean();
    if (!trackDoc) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = toApiFormat(trackDoc);

    // Check if track is available
    if (!track.isAvailable) {
      return res.status(403).json({ error: 'Track is not available' });
    }

    // Get audio metadata from S3
    const metadata = await getTrackAudioMetadata(track);
    if (!metadata || !metadata.contentLength) {
      return res.status(404).json({ error: 'Audio file not found in storage' });
    }

    const fileSize = metadata.contentLength;
    const mimeType = metadata.contentType || `audio/${track.audioSource.format || 'mpeg'}`;
    const rangeHeader = req.headers.range;

    // Set common headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Handle Range Request (for seeking/streaming)
    if (rangeHeader) {
      const range = parseRange(rangeHeader, fileSize);
      
      if (!range) {
        // Invalid range, return 416 Range Not Satisfiable
        res.setHeader('Content-Range', `bytes */${fileSize}`);
        return res.status(416).json({ error: 'Range Not Satisfiable' });
      }

      const { start, end } = range;

      // Stream from S3 with range
      const { stream, contentLength, contentRange } = await streamTrackAudio(track, {
        start,
        end,
      });

      // Set partial content headers
      res.status(206); // Partial Content
      res.setHeader('Content-Length', contentLength);
      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
      } else {
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      }

      // Pipe stream to response
      stream.pipe(res);

      stream.on('error', (error) => {
        logger.error('[AudioController] Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error' });
        }
      });
    } else {
      // No range header - send entire file
      const { stream, contentLength } = await streamTrackAudio(track);
      
      res.status(200);
      res.setHeader('Content-Length', contentLength);

      stream.pipe(res);

      stream.on('error', (error) => {
        logger.error('[AudioController] Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error' });
        }
      });
    }
  } catch (error) {
    logger.error('[AudioController] Error streaming audio:', error);
    if (!res.headersSent) {
      next(error);
    }
  }
};

/**
 * Get audio file metadata
 * GET /api/audio/:trackId/info
 */
export const getAudioInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trackId } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(trackId)) {
      return res.status(400).json({ error: 'Invalid track ID' });
    }

    // Fetch track from database
    const trackDoc = await TrackModel.findById(trackId).lean();
    if (!trackDoc) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = toApiFormat(trackDoc);

    // Get audio metadata from S3
    const metadata = await getTrackAudioMetadata(track);
    if (!metadata) {
      return res.status(404).json({ error: 'Audio file not found in storage' });
    }

    res.json({
      trackId: track.id,
      size: metadata.contentLength,
      mimeType: metadata.contentType || `audio/${track.audioSource.format || 'mpeg'}`,
      lastModified: metadata.lastModified?.toISOString(),
      etag: metadata.etag,
    });
  } catch (error) {
    logger.error('[AudioController] Error getting audio info:', error);
    next(error);
  }
};

