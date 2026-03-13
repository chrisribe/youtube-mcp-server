import { google, youtube_v3 } from 'googleapis';

/**
 * Shared YouTube API client.
 * Initialized lazily on first use with the YOUTUBE_API_KEY environment variable.
 * Injected into services via constructor to eliminate duplicated init logic.
 */
export class YouTubeClient {
  private client: youtube_v3.Youtube | null = null;

  getClient(): youtube_v3.Youtube {
    if (this.client) return this.client;

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YOUTUBE_API_KEY environment variable is not set.');
    }

    this.client = google.youtube({ version: 'v3', auth: apiKey });
    return this.client;
  }
}

// Singleton instance shared across all services
export const youtubeClient = new YouTubeClient();
