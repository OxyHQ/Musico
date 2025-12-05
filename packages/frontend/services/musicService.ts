import { api } from '@/utils/api';
import { Track, Album, Artist, Playlist } from '@musico/shared-types';

/**
 * Music API service
 * Handles all music-related API calls
 */
export const musicService = {
  // Tracks
  async getTracks(params?: { limit?: number; offset?: number }): Promise<{ tracks: Track[]; total: number; hasMore: boolean }> {
    const response = await api.get<{ tracks: Track[]; total: number; hasMore: boolean }>('/api/tracks', params);
    return response.data;
  },

  async getTrackById(id: string): Promise<Track> {
    const response = await api.get<Track>(`/api/tracks/${id}`);
    return response.data;
  },

  async searchTracks(query: string, params?: { limit?: number; offset?: number }): Promise<{ tracks: Track[]; total: number; hasMore: boolean }> {
    const response = await api.get<{ tracks: Track[]; total: number; hasMore: boolean }>('/api/tracks/search', { q: query, ...params });
    return response.data;
  },

  // Albums
  async getAlbums(params?: { limit?: number; offset?: number }): Promise<{ albums: Album[]; total: number; hasMore: boolean }> {
    const response = await api.get<{ albums: Album[]; total: number; hasMore: boolean }>('/api/albums', params);
    return response.data;
  },

  async getAlbumById(id: string): Promise<Album> {
    const response = await api.get<Album>(`/api/albums/${id}`);
    return response.data;
  },

  async getAlbumTracks(albumId: string): Promise<{ tracks: Track[] }> {
    const response = await api.get<{ tracks: Track[] }>(`/api/albums/${albumId}/tracks`);
    return response.data;
  },

  // Artists
  async getArtists(params?: { limit?: number; offset?: number }): Promise<{ artists: Artist[]; total: number; hasMore: boolean }> {
    const response = await api.get<{ artists: Artist[]; total: number; hasMore: boolean }>('/api/artists', params);
    return response.data;
  },

  async getArtistById(id: string): Promise<Artist> {
    const response = await api.get<Artist>(`/api/artists/${id}`);
    return response.data;
  },

  async getArtistAlbums(artistId: string): Promise<{ albums: Album[] }> {
    const response = await api.get<{ albums: Album[] }>(`/api/artists/${artistId}/albums`);
    return response.data;
  },

  async followArtist(artistId: string): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>(`/api/artists/${artistId}/follow`);
    return response.data;
  },

  async unfollowArtist(artistId: string): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>(`/api/artists/${artistId}/unfollow`);
    return response.data;
  },

  // Playlists
  async getPlaylistById(id: string): Promise<Playlist> {
    const response = await api.get<Playlist>(`/api/playlists/${id}`);
    return response.data;
  },

  async getUserPlaylists(): Promise<{ playlists: Playlist[]; total: number }> {
    const response = await api.get<{ playlists: Playlist[]; total: number }>('/api/playlists');
    return response.data;
  },

  async createPlaylist(data: { name: string; description?: string; coverArt?: string; isPublic?: boolean }): Promise<Playlist> {
    const response = await api.post<Playlist>('/api/playlists', data);
    return response.data;
  },
};

