import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

// Resolve path to assets directory
// Works both in development (src/) and production (dist/)
// Try going up from current location, or use process.cwd() as fallback
const getAudioAssetsDir = (): string => {
  // If __dirname contains 'dist', we're in compiled code
  if (__dirname.includes('dist')) {
    // From dist/src/controllers -> ../../../assets/audio
    return path.resolve(__dirname, '../../../assets/audio');
  } else {
    // From src/controllers -> ../../assets/audio
    return path.resolve(__dirname, '../../assets/audio');
  }
};

const AUDIO_ASSETS_DIR = getAudioAssetsDir();

/**
 * Get MIME type based on file extension
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.mpeg': 'audio/mpeg',
    '.flac': 'audio/flac',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.wav': 'audio/wav',
    '.aac': 'audio/aac',
  };
  return mimeTypes[ext] || 'audio/mpeg';
}

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
 * GET /api/audio/:filename
 */
export const streamAudio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(AUDIO_ASSETS_DIR, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const mimeType = getMimeType(filename);
    const rangeHeader = req.headers.range;

    // Set common headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Handle Range Request (for seeking/streaming)
    if (rangeHeader) {
      const range = parseRange(rangeHeader, fileSize);
      
      if (!range) {
        // Invalid range, return 416 Range Not Satisfiable
        res.setHeader('Content-Range', `bytes */${fileSize}`);
        return res.status(416).json({ error: 'Range Not Satisfiable' });
      }

      const { start, end } = range;
      const chunkSize = end - start + 1;

      // Set partial content headers
      res.status(206); // Partial Content
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);

      // Stream the requested range
      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);

      stream.on('error', (error) => {
        logger.error('[AudioController] Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream error' });
        }
      });
    } else {
      // No range header - send entire file
      res.status(200);
      res.setHeader('Content-Length', fileSize);

      const stream = fs.createReadStream(filePath);
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
 * GET /api/audio/:filename/info
 */
export const getAudioInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filename } = req.params;
    
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(AUDIO_ASSETS_DIR, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const stats = fs.statSync(filePath);
    const mimeType = getMimeType(filename);

    res.json({
      filename,
      size: stats.size,
      mimeType,
      lastModified: stats.mtime.toISOString(),
    });
  } catch (error) {
    logger.error('[AudioController] Error getting audio info:', error);
    next(error);
  }
};

