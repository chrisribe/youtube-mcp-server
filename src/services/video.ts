import { YouTubeClient } from './youtube-client.js';
import { VideoParams, SearchParams, TrendingParams, RelatedVideosParams } from '../types.js';

/**
 * Service for interacting with YouTube videos
 */
export class VideoService {
  private client: YouTubeClient;

  constructor(client: YouTubeClient) {
    this.client = client;
  }

  private get youtube() {
    return this.client.getClient();
  }

  /**
   * Get detailed information about a YouTube video
   */
  async getVideo({ 
    videoId, 
    parts = ['snippet', 'contentDetails', 'statistics'] 
  }: VideoParams): Promise<any> {
    try {
      
      const response = await this.youtube.videos.list({
        part: parts,
        id: [videoId]
      });
      
      return response.data.items?.[0] || null;
    } catch (error) {
      throw new Error(`Failed to get video: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search for videos on YouTube
   */
  async searchVideos({ 
    query, 
    maxResults = 10 
  }: SearchParams): Promise<any[]> {
    try {
      
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        maxResults,
        type: ['video']
      });
      
      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to search videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get video statistics like views, likes, and comments
   */
  async getVideoStats({ 
    videoId 
  }: { videoId: string }): Promise<any> {
    try {
      
      const response = await this.youtube.videos.list({
        part: ['statistics'],
        id: [videoId]
      });
      
      return response.data.items?.[0]?.statistics || null;
    } catch (error) {
      throw new Error(`Failed to get video stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get trending videos
   */
  async getTrendingVideos({ 
    regionCode = 'US', 
    maxResults = 10,
    videoCategoryId = ''
  }: TrendingParams): Promise<any[]> {
    try {
      
      const params: any = {
        part: ['snippet', 'contentDetails', 'statistics'],
        chart: 'mostPopular',
        regionCode,
        maxResults
      };
      
      if (videoCategoryId) {
        params.videoCategoryId = videoCategoryId;
      }
      
      const response = await this.youtube.videos.list(params);
      
      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to get trending videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get related videos for a specific video
   */
  async getRelatedVideos({ 
    videoId, 
    maxResults = 10 
  }: RelatedVideosParams): Promise<any[]> {
    try {
      
      // relatedToVideoId was removed from the googleapis types in newer versions;
      // cast to any to retain functionality until we migrate to GraphQL in Phase 2
      const response = await (this.youtube.search.list as any)({
        part: ['snippet'],
        relatedToVideoId: videoId,
        maxResults,
        type: ['video']
      });

      return response.data.items || [];
    } catch (error) {
      throw new Error(`Failed to get related videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}