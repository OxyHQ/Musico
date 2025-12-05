import { Request, Response, NextFunction } from 'express';
import { Playlist } from '@musico/shared-types';
import { extractDominantColor } from '../services/colorExtractionService';

/**
 * Mock playlists data
 */
const mockPlaylists: Playlist[] = [
  {
    id: 'playlist1',
    name: 'My Liked Songs',
    description: 'Songs I like',
    ownerOxyUserId: 'user1',
    ownerUsername: 'user1',
    visibility: 'private' as any,
    trackCount: 0,
    totalDuration: 0,
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * GET /api/playlists
 * Get user's playlists (requires auth)
 */
export const getUserPlaylists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock - filter by owner
    const playlists = mockPlaylists.filter(p => p.ownerOxyUserId === userId);

    res.json({
      playlists,
      total: playlists.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/playlists/:id
 * Get playlist by ID
 */
export const getPlaylistById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const playlist = mockPlaylists.find(p => p.id === id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json(playlist);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/playlists
 * Create playlist (requires auth)
 */
export const createPlaylist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, coverArt, visibility, isPublic } = req.body;

    // Extract dominant color from cover art if provided
    let dominantColor: string | undefined;
    if (coverArt) {
      try {
        dominantColor = await extractDominantColor(coverArt);
      } catch (error) {
        // Continue without dominant color if extraction fails
        console.error('[PlaylistController] Failed to extract color:', error);
      }
    }

    // Mock - create new playlist
    const newPlaylist: Playlist = {
      id: `playlist${Date.now()}`,
      name,
      description,
      ownerOxyUserId: userId,
      ownerUsername: userId, // Mock
      coverArt,
      visibility: visibility || 'private',
      trackCount: 0,
      totalDuration: 0,
      isPublic: isPublic || false,
      dominantColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockPlaylists.push(newPlaylist);

    res.status(201).json(newPlaylist);
  } catch (error) {
    next(error);
  }
};

