/**
 * Video details parameters
 */
export interface VideoParams {
  videoId: string;
  parts?: string[];
}

/**
 * Search videos parameters
 */
export interface SearchParams {
  query: string;
  maxResults?: number;
}

/**
 * Trending videos parameters
 */
export interface TrendingParams {
  regionCode?: string;
  maxResults?: number;
  videoCategoryId?: string;
}

/**
 * Related videos parameters
 */
export interface RelatedVideosParams {
  videoId: string;
  maxResults?: number;
}

/**
 * Transcript parameters
 */
export interface TranscriptParams {
  videoId: string;
  language?: string;
}

/**
 * Search transcript parameters
 */
export interface SearchTranscriptParams {
  videoId: string;
  query: string;
  language?: string;
}

/**
 * Channel parameters
 */
export interface ChannelParams {
  channelId: string;
}

/**
 * Channel videos parameters
 */
export interface ChannelVideosParams {
  channelId: string;
  maxResults?: number;
}

/**
 * Playlist parameters
 */
export interface PlaylistParams {
  playlistId: string;
}

/**
 * Playlist items parameters
 */
export interface PlaylistItemsParams {
  playlistId: string;
  maxResults?: number;
}

// =============================================================================
// PLAYLIST WRITE PARAMS (OAuth2 required)
// =============================================================================

export type PrivacyStatus = 'public' | 'private' | 'unlisted';

export interface CreatePlaylistParams {
  title: string;
  description?: string;
  privacyStatus?: PrivacyStatus;
}

export interface UpdatePlaylistParams {
  playlistId: string;
  title: string;
  description?: string;
  privacyStatus?: PrivacyStatus;
}

export interface DeletePlaylistParams {
  playlistId: string;
}

export interface AddToPlaylistParams {
  playlistId: string;
  videoId: string;
  position?: number;
}

export interface RemoveFromPlaylistParams {
  playlistItemId: string;
}

export interface ReorderPlaylistItemParams {
  playlistItemId: string;
  playlistId: string;
  position: number;
}

