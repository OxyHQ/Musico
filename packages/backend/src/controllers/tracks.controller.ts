import { Request, Response, NextFunction } from 'express';
import { Track } from '@musico/shared-types';

/**
 * Mock tracks data - replace with database queries later
 */
const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Blinding Lights',
    artistId: 'artist1',
    artistName: 'The Weeknd',
    albumId: 'album1',
    albumName: 'After Hours',
    duration: 180,
    trackNumber: 1,
    audioSource: {
      url: '/api/audio/test-song.mp3',
      format: 'mp3',
      bitrate: 320,
      duration: 180,
    },
    coverArt: 'https://example.com/cover/after-hours.jpg',
    isExplicit: false,
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Stay',
    artistId: 'artist2',
    artistName: 'The Kid LAROI & Justin Bieber',
    albumId: 'album2',
    albumName: 'F*CK LOVE 3',
    duration: 180,
    trackNumber: 1,
    audioSource: {
      url: '/api/audio/test-song.mp3',
      format: 'mp3',
      bitrate: 320,
      duration: 180,
    },
    coverArt: 'https://example.com/cover/fck-love.jpg',
    isExplicit: true,
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Test Song',
    artistId: 'test-artist',
    artistName: 'Test Artist',
    albumId: 'test-album',
    albumName: 'Test Album',
    duration: 180,
    trackNumber: 1,
    audioSource: {
      url: '/api/audio/test-song.mp3',
      format: 'mp3',
      bitrate: 320,
      duration: 180,
    },
    coverArt: null,
    isExplicit: false,
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Song Title 4',
    artistId: 'artist4',
    artistName: 'Artist 4',
    albumId: 'album4',
    albumName: 'Album 4',
    duration: 180,
    trackNumber: 1,
    audioSource: {
      url: '/api/audio/test-song.mp3',
      format: 'mp3',
      bitrate: 320,
      duration: 180,
    },
    coverArt: null,
    isExplicit: false,
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Song Title 5',
    artistId: 'artist5',
    artistName: 'Artist 5',
    albumId: 'album5',
    albumName: 'Album 5',
    duration: 180,
    trackNumber: 1,
    audioSource: {
      url: '/api/audio/test-song.mp3',
      format: 'mp3',
      bitrate: 320,
      duration: 180,
    },
    coverArt: null,
    isExplicit: false,
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * GET /api/tracks
 * Get all tracks with pagination
 */
export const getTracks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const tracks = mockTracks.slice(offset, offset + limit);
    
    res.json({
      tracks,
      total: mockTracks.length,
      limit,
      offset,
      hasMore: offset + limit < mockTracks.length,
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
    const { id } = req.params;
    const track = mockTracks.find(t => t.id === id);

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.json(track);
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
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const filteredTracks = mockTracks.filter(track =>
      track.title.toLowerCase().includes(query.toLowerCase()) ||
      track.artistName.toLowerCase().includes(query.toLowerCase())
    );

    const tracks = filteredTracks.slice(offset, offset + limit);

    res.json({
      tracks,
      total: filteredTracks.length,
      limit,
      offset,
      hasMore: offset + limit < filteredTracks.length,
    });
  } catch (error) {
    next(error);
  }
};

