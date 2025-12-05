/**
 * Artist-related types for Musico music streaming app
 */

import { Timestamps } from './common';

/**
 * Artist statistics
 */
export interface ArtistStats {
  followers: number;
  albums: number;
  tracks: number;
  totalPlays: number;
  monthlyListeners?: number;
}

/**
 * Artist - A music artist/band
 */
export interface Artist extends Timestamps {
  id: string;
  _id?: string;
  name: string;
  bio?: string;
  image?: string; // URL to artist image/photo
  genres?: string[];
  verified?: boolean;
  popularity?: number; // 0-100
  stats: ArtistStats;
}

/**
 * Artist with additional context for UI
 */
export interface ArtistWithContext extends Artist {
  isFollowed?: boolean;
}

/**
 * Create artist request
 */
export interface CreateArtistRequest {
  name: string;
  bio?: string;
  image?: string;
  genres?: string[];
  verified?: boolean;
}

/**
 * Update artist request
 */
export interface UpdateArtistRequest {
  name?: string;
  bio?: string;
  image?: string;
  genres?: string[];
  verified?: boolean;
}

/**
 * Follow/Unfollow artist request
 */
export interface FollowArtistRequest {
  artistId: string;
}

export interface UnfollowArtistRequest {
  artistId: string;
}

