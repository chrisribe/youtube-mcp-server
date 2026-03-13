import { YouTubeClient } from './youtube-client.js';
import {
  PlaylistParams,
  PlaylistItemsParams,
  SearchParams,
  CreatePlaylistParams,
  UpdatePlaylistParams,
  DeletePlaylistParams,
  AddToPlaylistParams,
  RemoveFromPlaylistParams,
  ReorderPlaylistItemParams,
} from '../types.js';

/**
 * Service for interacting with YouTube playlists
 */
export class PlaylistService {
  private client: YouTubeClient;

  constructor(client: YouTubeClient) {
    this.client = client;
  }

  private get youtube() {
    return this.client.getClient();
  }

  /**
   * Get information about a YouTube playlist
   */
  async getPlaylist({ 
    playlistId 
  }: PlaylistParams): Promise<any> {
    try {
      
      const response = await this.youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        id: [playlistId]
      });
      
      return response.data.items?.[0] || null;
    } catch (error) {
      throw new Error(`Failed to get playlist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get videos in a YouTube playlist
   */
  async getPlaylistItems({ 
    playlistId, 
    maxResults = 50 
  }: PlaylistItemsParams): Promise<any[]> {
    try {
      
      const response = await this.youtube.playlistItems.list({
        part: ['snippet', 'contentDetails'],
        playlistId,
        maxResults
      });
      
      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to get playlist items: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for playlists on YouTube
   */
  async searchPlaylists({ 
    query, 
    maxResults = 10 
  }: SearchParams): Promise<any[]> {
    try {
      
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        maxResults,
        type: ['playlist']
      });
      
      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to search playlists: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ===========================================================================
  // WRITE OPERATIONS (OAuth2 required)
  // ===========================================================================

  async createPlaylist({ title, description = '', privacyStatus = 'private' }: CreatePlaylistParams): Promise<any> {
    try {
      this.client.requireAuth();
      const response = await this.youtube.playlists.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: { title, description },
          status: { privacyStatus },
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create playlist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async updatePlaylist({ playlistId, title, description = '', privacyStatus }: UpdatePlaylistParams): Promise<any> {
    try {
      this.client.requireAuth();
      const requestBody: any = { id: playlistId, snippet: { title, description } };
      if (privacyStatus) {
        requestBody.status = { privacyStatus };
      }
      const response = await this.youtube.playlists.update({
        part: ['snippet', 'status'],
        requestBody,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update playlist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deletePlaylist({ playlistId }: DeletePlaylistParams): Promise<{ success: boolean }> {
    try {
      this.client.requireAuth();
      await this.youtube.playlists.delete({ id: playlistId });
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete playlist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addToPlaylist({ playlistId, videoId, position }: AddToPlaylistParams): Promise<any> {
    try {
      this.client.requireAuth();
      const requestBody: any = {
        snippet: {
          playlistId,
          resourceId: { kind: 'youtube#video', videoId },
        },
      };
      if (position !== undefined) {
        requestBody.snippet.position = position;
      }
      const response = await this.youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add video to playlist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async removeFromPlaylist({ playlistItemId }: RemoveFromPlaylistParams): Promise<{ success: boolean }> {
    try {
      this.client.requireAuth();
      await this.youtube.playlistItems.delete({ id: playlistItemId });
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to remove item from playlist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async reorderPlaylistItem({ playlistItemId, playlistId, position }: ReorderPlaylistItemParams): Promise<any> {
    try {
      this.client.requireAuth();
      // Must fetch the existing item first to get its snippet (required for update)
      const existing = await this.youtube.playlistItems.list({
        part: ['snippet'],
        id: [playlistItemId],
      });
      const item = existing.data.items?.[0];
      if (!item) throw new Error(`Playlist item not found: ${playlistItemId}`);

      const response = await this.youtube.playlistItems.update({
        part: ['snippet'],
        requestBody: {
          id: playlistItemId,
          snippet: { ...item.snippet, playlistId, position },
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to reorder playlist item: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}