import { Request, Response, NextFunction } from 'express';
import { AlbumModel } from '../models/Album';
import { TrackModel } from '../models/Track';
import { toApiFormat, toApiFormatArray } from '../utils/musicHelpers';
import { isDatabaseConnected } from '../utils/database';

/**
 * GET /api/albums
 * Get all albums
 */
export const getAlbums = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const [albums, total] = await Promise.all([
      AlbumModel.find()
        .sort({ releaseDate: -1, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      AlbumModel.countDocuments(),
    ]);

    const formattedAlbums = toApiFormatArray(albums);

    res.json({
      albums: formattedAlbums,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/albums/:id
 * Get album by ID
 */
export const getAlbumById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    const album = await AlbumModel.findById(id).lean();

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const formattedAlbum = toApiFormat(album);
    res.json(formattedAlbum);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/albums/:id/tracks
 * Get tracks in album
 */
export const getAlbumTracks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { id } = req.params;
    
    // Verify album exists
    const album = await AlbumModel.findById(id).lean();
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Fetch tracks for this album, sorted by track number
    const tracks = await TrackModel.find({ albumId: id, isAvailable: true })
      .sort({ discNumber: 1, trackNumber: 1 })
      .lean();

    const formattedTracks = toApiFormatArray(tracks);

    res.json({
      tracks: formattedTracks,
      albumId: id,
    });
  } catch (error) {
    next(error);
  }
};

