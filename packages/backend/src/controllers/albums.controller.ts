import { Request, Response, NextFunction } from 'express';
import { Album } from '@musico/shared-types';

/**
 * Mock albums data
 */
const mockAlbums: Album[] = [
  {
    id: 'album1',
    title: 'After Hours',
    artistId: 'artist1',
    artistName: 'The Weeknd',
    releaseDate: '2020-03-20',
    coverArt: 'https://example.com/cover/after-hours.jpg',
    genre: ['Pop', 'R&B'],
    totalTracks: 14,
    totalDuration: 3600,
    type: 'album',
    isExplicit: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'album2',
    title: 'F*CK LOVE 3',
    artistId: 'artist2',
    artistName: 'The Kid LAROI',
    releaseDate: '2021-07-23',
    coverArt: 'https://example.com/cover/fck-love.jpg',
    genre: ['Hip-Hop', 'Pop'],
    totalTracks: 12,
    totalDuration: 2400,
    type: 'album',
    isExplicit: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * GET /api/albums
 * Get all albums
 */
export const getAlbums = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const albums = mockAlbums.slice(offset, offset + limit);

    res.json({
      albums,
      total: mockAlbums.length,
      limit,
      offset,
      hasMore: offset + limit < mockAlbums.length,
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
    const { id } = req.params;
    const album = mockAlbums.find(a => a.id === id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    res.json(album);
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
    const { id } = req.params;
    // Mock - return empty tracks array for now
    // In real implementation, fetch tracks where albumId === id
    res.json({
      tracks: [],
      albumId: id,
    });
  } catch (error) {
    next(error);
  }
};

