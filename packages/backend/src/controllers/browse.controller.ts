import { Request, Response, NextFunction } from 'express';
import { TrackModel } from '../models/Track';
import { AlbumModel } from '../models/Album';
import { ArtistModel } from '../models/Artist';
import { PlaylistModel } from '../models/Playlist';
import { toApiFormatArray, formatTracksWithCoverArt, formatArtistsWithImage, formatPlaylistsWithCoverArt, formatAlbumsWithCoverArt } from '../utils/musicHelpers';
import { isDatabaseConnected } from '../utils/database';

/**
 * Default genre colors for genre cards (Spotify-like colors)
 */
const GENRE_COLORS: Record<string, string> = {
  'Rock': '#E13300',
  'Pop': '#8D67AB',
  'Hip-Hop': '#BA5D07',
  'Jazz': '#148A08',
  'Classical': '#E8115B',
  'Electronic': '#E1118C',
  'Country': '#D84000',
  'R&B': '#EB1E32',
  'Reggae': '#D84000',
  'Latin': '#BA5D07',
  'Indie': '#E1118C',
  'Alternative': '#E8115B',
  'Dance': '#1E3264',
  'Blues': '#148A08',
  'Folk': '#1E3264',
};

/**
 * GET /api/browse/genres
 * Get list of available genres with sample content
 */
export const getGenres = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Aggregate unique genres from albums and artists
    const [albumGenres, artistGenres] = await Promise.all([
      AlbumModel.distinct('genre'),
      ArtistModel.distinct('genres'),
    ]);

    // Flatten and get unique genres
    const allGenres = [...new Set([
      ...albumGenres.flat(),
      ...artistGenres.flat(),
    ].filter(Boolean))];

    // Get sample albums/artists for each genre
    const genresWithSamples = await Promise.all(
      allGenres.slice(0, 20).map(async (genre) => {
        const [sampleAlbums, sampleArtists] = await Promise.all([
          AlbumModel.find({ genre: genre })
            .sort({ popularity: -1 })
            .limit(1)
            .lean(),
          ArtistModel.find({ genres: genre })
            .sort({ popularity: -1 })
            .limit(1)
            .lean(),
        ]);

        const sampleAlbum = sampleAlbums[0];
        const sampleArtist = sampleArtists[0];

        return {
          name: genre,
          color: GENRE_COLORS[genre] || '#1E3264',
          coverArt: sampleAlbum?.coverArt || sampleArtist?.image || null,
        };
      })
    );

    res.json({ genres: genresWithSamples });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/browse/popular/tracks
 * Get popular/trending tracks
 */
export const getPopularTracks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const tracks = await TrackModel.find({ isAvailable: true })
      .sort({ popularity: -1, playCount: -1, createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const formattedTracks = await formatTracksWithCoverArt(tracks);

    res.json({
      tracks: formattedTracks,
      total: formattedTracks.length,
      hasMore: formattedTracks.length === limit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/browse/popular/albums
 * Get popular/trending albums
 */
export const getPopularAlbums = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const albums = await AlbumModel.find()
      .sort({ popularity: -1, releaseDate: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const formattedAlbums = toApiFormatArray(albums);

    res.json({
      albums: formattedAlbums,
      total: formattedAlbums.length,
      hasMore: formattedAlbums.length === limit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/browse/popular/artists
 * Get popular/trending artists
 */
export const getPopularArtists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const artists = await ArtistModel.find()
      .sort({ popularity: -1, 'stats.followers': -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const formattedArtists = formatArtistsWithImage(artists);

    res.json({
      artists: formattedArtists,
      total: formattedArtists.length,
      hasMore: formattedArtists.length === limit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/browse/made-for-you
 * Get personalized recommendations (uses popular content for now)
 */
export const getMadeForYou = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const limit = parseInt(req.query.limit as string) || 20;

    // For now, return a mix of popular albums and playlists
    // In the future, this could use user listening history for personalization
    const [albums, playlists] = await Promise.all([
      AlbumModel.find()
        .sort({ popularity: -1 })
        .limit(Math.floor(limit / 2))
        .lean(),
      PlaylistModel.find({ isPublic: true })
        .sort({ followers: -1, createdAt: -1 })
        .limit(Math.floor(limit / 2))
        .lean(),
    ]);

    res.json({
      albums: formatAlbumsWithCoverArt(albums),
      playlists: formatPlaylistsWithCoverArt(playlists),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/browse/charts
 * Get top charts/top songs
 */
export const getCharts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const limit = parseInt(req.query.limit as string) || 50;

    const tracks = await TrackModel.find({ isAvailable: true })
      .sort({ popularity: -1, playCount: -1 })
      .limit(limit)
      .lean();

    const formattedTracks = await formatTracksWithCoverArt(tracks);

    res.json({
      tracks: formattedTracks,
      total: formattedTracks.length,
    });
  } catch (error) {
    next(error);
  }
};


