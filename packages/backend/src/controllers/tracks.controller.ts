import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { TrackModel } from '../models/Track';
import { ArtistModel } from '../models/Artist';
import { AlbumModel } from '../models/Album';
import { toApiFormat, toApiFormatArray } from '../utils/musicHelpers';
import { isDatabaseConnected } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { getAuthenticatedUserId } from '../utils/auth';
import { uploadTrackAudio } from '../services/audioStorageService';
import { logger } from '../utils/logger';
import { extractDominantColor } from '../services/colorExtractionService';

/**
 * GET /api/tracks
 * Get all tracks with pagination
 */
export const getTracks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const [tracks, total] = await Promise.all([
      TrackModel.find({ isAvailable: true })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      TrackModel.countDocuments({ isAvailable: true }),
    ]);

    const formattedTracks = toApiFormatArray(tracks);

    res.json({
      tracks: formattedTracks,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tracks/:id
 * Get track by ID
 */
export const getTrackById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    const track = await TrackModel.findById(id).lean();

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const formattedTrack = toApiFormat(track);
    res.json(formattedTrack);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tracks/search
 * Search tracks
 */
export const searchTracks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!query.trim()) {
      return res.json({
        tracks: [],
        total: 0,
        hasMore: false,
      });
    }

    const searchRegex = new RegExp(query, 'i');
    const [tracks, total] = await Promise.all([
      TrackModel.find({
        isAvailable: true,
        $or: [
          { title: searchRegex },
          { artistName: searchRegex },
        ],
      })
        .sort({ popularity: -1, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      TrackModel.countDocuments({
        isAvailable: true,
        $or: [
          { title: searchRegex },
          { artistName: searchRegex },
        ],
      }),
    ]);

    const formattedTracks = toApiFormatArray(tracks);

    res.json({
      tracks: formattedTracks,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    next(error);
  }
};

// Configure multer for audio file uploads
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    // Accept audio formats
    const allowedMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/mpeg3',
      'audio/x-mpeg-3',
      'audio/flac',
      'audio/ogg',
      'audio/vorbis',
      'audio/mp4',
      'audio/x-m4a',
      'audio/wav',
      'audio/x-wav',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files (mp3, flac, ogg, m4a, wav) are allowed.'));
    }
  },
}).single('audioFile');

/**
 * POST /api/tracks/upload
 * Upload a new track (authenticated, requires artist profile)
 */
export const uploadTrack = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Handle file upload
  audioUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'Upload error', message: err.message });
    }

    try {
      if (!isDatabaseConnected()) {
        return res.status(503).json({ error: 'Database not available' });
      }

      const userId = getAuthenticatedUserId(req);
      const file = (req as any).file;

      if (!file) {
        return res.status(400).json({ error: 'Missing file', message: 'Audio file is required' });
      }

      // Get form data
      const { title, artistId, albumId, coverArt, genre, isExplicit, duration } = req.body;

      if (!title || !artistId) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          message: 'Title and artistId are required' 
        });
      }

      // Verify user owns the artist
      const artist = await ArtistModel.findOne({ 
        _id: artistId,
        ownerOxyUserId: userId 
      }).lean();

      if (!artist) {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'You do not own this artist profile' 
        });
      }

      // Validate album if provided
      let album = null;
      if (albumId) {
        album = await AlbumModel.findOne({ 
          _id: albumId,
          artistId: artistId 
        }).lean();

        if (!album) {
          return res.status(404).json({ 
            error: 'Album not found', 
            message: 'Album does not exist or does not belong to this artist' 
          });
        }
      }

      // Determine audio format from file
      const formatMap: Record<string, 'mp3' | 'flac' | 'ogg' | 'm4a' | 'wav'> = {
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/mpeg3': 'mp3',
        'audio/x-mpeg-3': 'mp3',
        'audio/flac': 'flac',
        'audio/ogg': 'ogg',
        'audio/vorbis': 'ogg',
        'audio/mp4': 'm4a',
        'audio/x-m4a': 'm4a',
        'audio/wav': 'wav',
        'audio/x-wav': 'wav',
      };

      const format = formatMap[file.mimetype] || 'mp3';
      const durationNum = duration ? parseFloat(duration) : 0;

      if (durationNum <= 0) {
        return res.status(400).json({ 
          error: 'Invalid duration', 
          message: 'Duration must be greater than 0' 
        });
      }

      // Extract dominant color from cover art if provided
      let dominantColor: string | undefined;
      if (coverArt) {
        try {
          dominantColor = await extractDominantColor(coverArt);
        } catch (error) {
          // Continue without dominant color if extraction fails
        }
      }

      // Create track record
      const track = new TrackModel({
        title,
        artistId: artistId,
        artistName: artist.name,
        albumId: albumId || undefined,
        albumName: album?.title,
        duration: durationNum,
        audioSource: {
          url: '', // Will be set after upload
          format,
        },
        coverArt: coverArt || undefined,
        metadata: {
          genre: genre ? (Array.isArray(genre) ? genre : [genre]) : undefined,
          explicit: isExplicit === 'true' || isExplicit === true,
        },
        isExplicit: isExplicit === 'true' || isExplicit === true,
        isAvailable: true,
        playCount: 0,
        popularity: 0,
      });

      await track.save();

      // Upload audio file to S3
      const trackFormatted = toApiFormat(track);
      await uploadTrackAudio(trackFormatted, file.buffer);

      // Update track with audio URL
      track.audioSource.url = `/api/audio/${track._id.toString()}`;
      await track.save();

      // Update artist stats
      await ArtistModel.updateOne(
        { _id: artistId },
        { $inc: { 'stats.tracks': 1 } }
      );

      // Update album stats if track is part of album
      if (albumId) {
        await AlbumModel.updateOne(
          { _id: albumId },
          { 
            $inc: { totalTracks: 1, totalDuration: durationNum }
          }
        );
      }

      const finalTrack = toApiFormat(track);
      res.status(201).json(finalTrack);
    } catch (error: any) {
      logger.error('[TracksController] Error uploading track:', error);
      next(error);
    }
  });
};

