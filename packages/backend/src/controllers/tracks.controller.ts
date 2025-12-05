import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { TrackModel } from '../models/Track';
import { toApiFormat, toApiFormatArray } from '../utils/musicHelpers';
import { isDatabaseConnected } from '../utils/database';

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

