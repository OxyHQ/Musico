import { api } from '@/utils/api';
import { SearchResult, SearchCategory } from '@musico/shared-types';

/**
 * Search API service
 * Handles music search across tracks, albums, artists, and playlists
 */
export const searchService = {
  async search(query: string, params?: { category?: SearchCategory; limit?: number; offset?: number }): Promise<SearchResult> {
    const response = await api.get<SearchResult>('/api/search', { q: query, ...params });
    return response.data;
  },
};
