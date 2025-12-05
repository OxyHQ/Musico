/**
 * Album-related types for Musico music streaming app
 */

import { Timestamps } from './common';
import { Track } from './track';

/**
 * Album - A collection of tracks
 */
export interface Album extends Timestamps {
  id: string;
  _id?: string;
  title: string;
  artistId: string;
  artistName: string;
  releaseDate: string; // ISO date string
  coverArt: string; // URL to album cover
  genre?: string[];
  totalTracks: number;
  totalDuration: number; // total duration in seconds
  type: 'album' | 'single' | 'ep' | 'compilation';
  label?: string; // record label
  copyright?: string;
  upc?: string; // Universal Product Code
  popularity?: number; // 0-100
  isExplicit: boolean;
}

/**
 * Album with tracks
 */
export interface AlbumWithTracks extends Album {
  tracks: Track[];
}

/**
 * Album track reference (lightweight)
 */
export interface AlbumTrack {
  trackId: string;
  trackNumber: number;
  discNumber?: number;
  title: string;
  duration: number;
  isExplicit: boolean;
}

/**
 * Create album request
 */
export interface CreateAlbumRequest {
  title: string;
  artistId: string;
  releaseDate: string;
  coverArt: string;
  genre?: string[];
  type?: 'album' | 'single' | 'ep' | 'compilation';
  label?: string;
  copyright?: string;
  isExplicit?: boolean;
}

/**
 * Update album request
 */
export interface UpdateAlbumRequest {
  title?: string;
  releaseDate?: string;
  coverArt?: string;
  genre?: string[];
  type?: 'album' | 'single' | 'ep' | 'compilation';
  label?: string;
  copyright?: string;
}

