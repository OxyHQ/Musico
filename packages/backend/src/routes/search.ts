import express, { Request, Response } from "express";
import { logger } from '../utils/logger';
import { SearchCategory, SearchResult } from '@musico/shared-types';

const router = express.Router();

/**
 * GET /api/search
 * Unified search across tracks, albums, artists, and playlists
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { q, category = 'all', limit = 20, offset = 0 } = req.query;
    const query = (q as string) || '';

    // Mock search results
    const results: SearchResult = {
      query,
      results: {
        tracks: [],
        albums: [],
        artists: [],
        playlists: [],
      },
      counts: {
        tracks: 0,
        albums: 0,
        artists: 0,
        playlists: 0,
        total: 0,
      },
      hasMore: false,
      offset: parseInt(offset as string) || 0,
      limit: parseInt(limit as string) || 20,
    };

    res.json(results);
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      message: "Error performing search",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
