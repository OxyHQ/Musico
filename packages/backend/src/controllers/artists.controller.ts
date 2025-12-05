import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ArtistModel } from '../models/Artist';
import { AlbumModel } from '../models/Album';
import { toApiFormat, toApiFormatArray } from '../utils/musicHelpers';
import { isDatabaseConnected } from '../utils/database';

/**
 * GET /api/artists
 * Get all artists
 */
export const getArtists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const [artists, total] = await Promise.all([
      ArtistModel.find()
        .sort({ popularity: -1, 'stats.followers': -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      ArtistModel.countDocuments(),
    ]);

    const formattedArtists = toApiFormatArray(artists);

    res.json({
      artists: formattedArtists,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/artists/:id
 * Get artist by ID
 */
export const getArtistById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    
    const artist = await ArtistModel.findById(id).lean();

    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const formattedArtist = toApiFormat(artist);
    res.json(formattedArtist);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/artists/:id/albums
 * Get artist albums
 */
export const getArtistAlbums = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    
    // Verify artist exists
    const artist = await ArtistModel.findById(id).lean();
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Fetch albums for this artist, sorted by release date
    const albums = await AlbumModel.find({ artistId: id })
      .sort({ releaseDate: -1 })
      .lean();

    const formattedAlbums = toApiFormatArray(albums);

    res.json({
      albums: formattedAlbums,
      artistId: id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/artists/:id/follow
 * Follow artist (requires auth)
 */
export const followArtist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock - just return success
    res.json({
      success: true,
      message: 'Artist followed',
      artistId: id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/artists/:id/unfollow
 * Unfollow artist (requires auth)
 */
export const unfollowArtist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock - just return success
    res.json({
      success: true,
      message: 'Artist unfollowed',
      artistId: id,
    });
  } catch (error) {
    next(error);
  }
};

