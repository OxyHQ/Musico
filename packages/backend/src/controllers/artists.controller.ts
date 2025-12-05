import { Request, Response, NextFunction } from 'express';
import { Artist } from '@musico/shared-types';

/**
 * Mock artists data
 */
const mockArtists: Artist[] = [
  {
    id: 'artist1',
    name: 'The Weeknd',
    bio: 'Canadian singer, songwriter, and record producer.',
    image: 'https://example.com/artist/the-weeknd.jpg',
    genres: ['Pop', 'R&B'],
    verified: true,
    popularity: 95,
    stats: {
      followers: 50000000,
      albums: 5,
      tracks: 80,
      totalPlays: 1000000000,
      monthlyListeners: 70000000,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'artist2',
    name: 'The Kid LAROI',
    bio: 'Australian rapper, singer, and songwriter.',
    image: 'https://example.com/artist/kid-laroi.jpg',
    genres: ['Hip-Hop', 'Pop'],
    verified: true,
    popularity: 90,
    stats: {
      followers: 15000000,
      albums: 3,
      tracks: 45,
      totalPlays: 500000000,
      monthlyListeners: 20000000,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * GET /api/artists
 * Get all artists
 */
export const getArtists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const artists = mockArtists.slice(offset, offset + limit);

    res.json({
      artists,
      total: mockArtists.length,
      limit,
      offset,
      hasMore: offset + limit < mockArtists.length,
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
    const { id } = req.params;
    const artist = mockArtists.find(a => a.id === id);

    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json(artist);
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
    const { id } = req.params;
    // Mock - return empty albums array for now
    res.json({
      albums: [],
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

