import { google, youtube_v3 } from 'googleapis';
import { loadAuthClient } from '../auth/oauth2.js';

/**
 * Shared YouTube API client.
 * Prefers OAuth2 (full access, required for write operations).
 * Falls back to API key for read-only access if no OAuth2 tokens are stored.
 * Injected into services via constructor.
 */
export class YouTubeClient {
  private client: youtube_v3.Youtube | null = null;
  private isAuthenticated = false;

  getClient(): youtube_v3.Youtube {
    if (this.client) return this.client;

    // Try OAuth2 first (enables write operations)
    const auth = loadAuthClient();
    if (auth) {
      this.client = google.youtube({ version: 'v3', auth });
      this.isAuthenticated = true;
      return this.client;
    }

    // Fall back to API key (read-only)
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
      this.client = google.youtube({ version: 'v3', auth: apiKey });
      return this.client;
    }

    throw new Error(
      'No YouTube credentials found. Either:\n' +
      '  1. Set YOUTUBE_API_KEY for read-only access\n' +
      '  2. Run with --auth for full OAuth2 access (required for playlist management)'
    );
  }

  /** Returns true if authenticated via OAuth2 (write operations available) */
  get authenticated(): boolean {
    this.getClient(); // ensure initialized
    return this.isAuthenticated;
  }

  /** Throws if not OAuth2 authenticated — call before any write operation */
  requireAuth(): void {
    if (!this.authenticated) {
      throw new Error(
        'This operation requires OAuth2 authentication. Run the server with --auth to set up access.'
      );
    }
  }
}

// Singleton instance shared across all services
export const youtubeClient = new YouTubeClient();
