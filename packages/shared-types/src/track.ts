/**
 * Track-related types for Musico music streaming app
 */

import { Timestamps } from './common';

/**
 * Audio source for a track
 */
export interface AudioSource {
  url: string;
  format: 'mp3' | 'flac' | 'ogg' | 'm4a' | 'wav';
  bitrate?: number; // in kbps
  duration?: number; // in seconds (can be calculated from file if not provided)
}

/**
 * Track metadata
 */
export interface TrackMetadata {
  genre?: string[];
  bpm?: number;
  key?: string;
  explicit?: boolean;
  language?: string;
  isrc?: string; // International Standard Recording Code
  copyright?: string;
  publisher?: string;
}

/**
 * Track - A single song/audio recording
 */
export interface Track extends Timestamps {
  id: string;
  _id?: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string;
  albumName?: string;
  duration: number; // in seconds
  trackNumber?: number; // position in album
  discNumber?: number; // disc number for multi-disc albums
  audioSource: AudioSource;
  coverArt?: string; // URL to cover art image
  metadata?: TrackMetadata;
  isExplicit: boolean;
  popularity?: number; // 0-100
  playCount?: number;
  isAvailable: boolean; // whether track is available for playback
}

/**
 * Track with additional context for UI
 */
export interface TrackWithContext extends Track {
  isLiked?: boolean;
  isInPlaylist?: boolean;
  playlists?: string[]; // playlist IDs containing this track
}

/**
 * Create track request
 */
export interface CreateTrackRequest {
  title: string;
  artistId: string;
  albumId?: string;
  duration: number;
  audioSource: AudioSource;
  coverArt?: string;
  metadata?: TrackMetadata;
  isExplicit?: boolean;
}

/**
 * Update track request
 */
export interface UpdateTrackRequest {
  title?: string;
  albumId?: string;
  trackNumber?: number;
  discNumber?: number;
  coverArt?: string;
  metadata?: Partial<TrackMetadata>;
  isAvailable?: boolean;
}

