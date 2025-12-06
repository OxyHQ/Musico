import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AlbumModel } from '../models/Album';
import { TrackModel } from '../models/Track';
import { ArtistModel } from '../models/Artist';
import { toApiFormat, toApiFormatArray } from '../utils/musicHelpers';
import { isDatabaseConnected } from '../utils/database';
import { AuthRequest } from '../middleware/auth';
import { getAuthenticatedUserId } from '../utils/auth';
import { CreateAlbumRequest } from '@musico/shared-types';
import { extractDominantColor } from '../services/colorExtractionService';
import { logger } from '../utils/logger';

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
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
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
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Album not found' });
    }
    
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

/**
 * POST /api/albums
 * Create a new album (authenticated, requires artist profile)
 */
export const createAlbum = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const userId = getAuthenticatedUserId(req);
    const data: CreateAlbumRequest = req.body;

    if (!data.title || !data.artistId || !data.releaseDate || !data.coverArt) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Title, artistId, releaseDate, and coverArt are required' 
      });
    }

    // Verify user owns the artist
    const artist = await ArtistModel.findOne({ 
      _id: data.artistId,
      ownerOxyUserId: userId 
    }).lean();

    if (!artist) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You do not own this artist profile' 
      });
    }

    // Extract dominant color from cover art
    let dominantColor: string | undefined;
    try {
      dominantColor = await extractDominantColor(data.coverArt);
    } catch (error) {
      // Continue without dominant color if extraction fails
    }

    // Create album
    const album = new AlbumModel({
      title: data.title,
      artistId: data.artistId,
      artistName: artist.name,
      releaseDate: data.releaseDate,
      coverArt: data.coverArt,
      genre: data.genre || [],
      type: data.type || 'album',
      label: data.label,
      copyright: data.copyright,
      isExplicit: data.isExplicit || false,
      totalTracks: 0,
      totalDuration: 0,
      dominantColor,
      popularity: 0,
    });

    await album.save();

    // Update artist stats
    await ArtistModel.updateOne(
      { _id: data.artistId },
      { $inc: { 'stats.albums': 1 } }
    );

    const formattedAlbum = toApiFormat(album);
    res.status(201).json(formattedAlbum);
  } catch (error: any) {
    logger.error('[AlbumsController] Error creating album:', error);
    next(error);
  }
};

