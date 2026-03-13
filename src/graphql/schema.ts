// =============================================================================
// CORE TYPES
// =============================================================================

const VideoType = `#graphql
  """Video statistics"""
  type VideoStats {
    viewCount: String
    likeCount: String
    commentCount: String
    subscriberCount: String
  }

  """Full video details"""
  type Video {
    videoId: String!
    title: String!
    description: String
    channelId: String
    channelTitle: String
    publishedAt: String
    duration: String
    thumbnailUrl: String
    stats: VideoStats
  }
`;

const SearchResultType = `#graphql
  """Lightweight search result (use for lists, not full details)"""
  type SearchResult {
    videoId: String
    playlistId: String
    channelId: String
    title: String!
    channelTitle: String
    description: String
    publishedAt: String
    thumbnailUrl: String
    kind: String
  }
`;

const ChannelType = `#graphql
  """Channel details"""
  type Channel {
    channelId: String!
    title: String!
    description: String
    publishedAt: String
    thumbnailUrl: String
    subscriberCount: String
    videoCount: String
    viewCount: String
    uploadsPlaylistId: String
  }
`;

const PlaylistType = `#graphql
  """Playlist details"""
  type Playlist {
    playlistId: String!
    title: String!
    description: String
    channelId: String
    channelTitle: String
    publishedAt: String
    thumbnailUrl: String
    itemCount: Int
  }
`;

const PlaylistItemType = `#graphql
  """Item in a playlist"""
  type PlaylistItem {
    playlistItemId: String!
    videoId: String
    title: String!
    channelTitle: String
    description: String
    position: Int
    publishedAt: String
    thumbnailUrl: String
  }
`;

const TranscriptSegmentType = `#graphql
  """Single segment of a transcript"""
  type TranscriptSegment {
    timestamp: String!
    text: String!
    startTimeMs: Float!
    durationMs: Float!
  }
`;

const TranscriptType = `#graphql
  """Full video transcript"""
  type Transcript {
    videoId: String!
    language: String!
    segments: [TranscriptSegment!]!
  }

  """Transcript search results"""
  type TranscriptSearchResult {
    videoId: String!
    query: String!
    matches: [TranscriptSegment!]!
    totalMatches: Int!
  }
`;

// =============================================================================
// QUERIES
// =============================================================================

const QueryType = `#graphql
  type Query {
    """Get full details for a specific video"""
    video(videoId: String!): Video

    """Search YouTube videos"""
    searchVideos(query: String!, maxResults: Int): [SearchResult!]!

    """Get trending videos"""
    trendingVideos(regionCode: String, maxResults: Int, categoryId: String): [Video!]!

    """Get related videos for a given video"""
    relatedVideos(videoId: String!, maxResults: Int): [SearchResult!]!

    """Get channel details"""
    channel(channelId: String!): Channel

    """List videos from a channel"""
    channelVideos(channelId: String!, maxResults: Int): [SearchResult!]!

    """List playlists for a channel"""
    channelPlaylists(channelId: String!, maxResults: Int): [Playlist!]!

    """Get playlist details"""
    playlist(playlistId: String!): Playlist

    """Get videos in a playlist"""
    playlistItems(playlistId: String!, maxResults: Int): [PlaylistItem!]!

    """Search for playlists"""
    searchPlaylists(query: String!, maxResults: Int): [SearchResult!]!

    """Get transcript for a video"""
    transcript(videoId: String!, language: String): Transcript

    """Search within a video transcript"""
    searchTranscript(videoId: String!, query: String!, language: String): TranscriptSearchResult
  }
`;

// =============================================================================
// COMBINED SCHEMA EXPORT
// =============================================================================

export const typeDefs = [
  VideoType,
  SearchResultType,
  ChannelType,
  PlaylistType,
  PlaylistItemType,
  TranscriptSegmentType,
  TranscriptType,
  QueryType,
].join('\n');
