import { YouTubeClient } from './youtube-client.js';
import { ChannelParams, ChannelVideosParams } from '../types.js';

/**
 * Service for interacting with YouTube channels
 */
export class ChannelService {
  private client: YouTubeClient;

  constructor(client: YouTubeClient) {
    this.client = client;
  }

  private get youtube() {
    return this.client.getClient();
  }

  /**
   * Get channel details
   */
  async getChannel({ 
    channelId 
  }: ChannelParams): Promise<any> {
    try {
      
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: [channelId]
      });

      return response.data.items?.[0] || null;
    } catch (error) {
      throw new Error(`Failed to get channel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get authenticated user's channel details (OAuth2 required)
   */
  async getMyChannel(): Promise<any> {
    try {
      const channels = await this.getMyChannels();
      return channels[0] || null;
    } catch (error) {
      throw new Error(`Failed to get authenticated channel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List all channels for the authenticated user (OAuth2 required)
   */
  async getMyChannels(): Promise<any[]> {
    try {
      this.client.requireAuth();

      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        mine: true
      });

      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to list authenticated channels: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get channel playlists
   */
  async getPlaylists({ 
    channelId, 
    maxResults = 50 
  }: ChannelVideosParams): Promise<any[]> {
    try {
      
      const response = await this.youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        channelId,
        maxResults
      });

      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to get channel playlists: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get channel videos
   */
  async listVideos({ 
    channelId, 
    maxResults = 50 
  }: ChannelVideosParams): Promise<any[]> {
    try {
      
      const response = await this.youtube.search.list({
        part: ['snippet'],
        channelId,
        maxResults,
        order: 'date',
        type: ['video']
      });

      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to list channel videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get channel statistics
   */
  async getStatistics({ 
    channelId 
  }: ChannelParams): Promise<any> {
    try {
      
      const response = await this.youtube.channels.list({
        part: ['statistics'],
        id: [channelId]
      });

      return response.data.items?.[0]?.statistics || null;
    } catch (error) {
      throw new Error(`Failed to get channel statistics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}