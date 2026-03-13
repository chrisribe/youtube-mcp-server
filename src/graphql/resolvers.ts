import type { VideoService } from '../services/video.js';
import type { TranscriptService } from '../services/transcript.js';
import type { PlaylistService } from '../services/playlist.js';
import type { ChannelService } from '../services/channel.js';

// =============================================================================
// MAPPERS — raw YouTube API responses → GraphQL types
// =============================================================================

function mapVideo(item: any) {
  if (!item) return null;
  const snippet = item.snippet || {};
  const details = item.contentDetails || {};
  const stats = item.statistics || {};
  const id = typeof item.id === 'string' ? item.id : item.id?.videoId;
  return {
    videoId: id,
    title: snippet.title || '',
    description: snippet.description,
    channelId: snippet.channelId,
    channelTitle: snippet.channelTitle,
    publishedAt: snippet.publishedAt,
    duration: details.duration,
    thumbnailUrl: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url,
    stats: {
      viewCount: stats.viewCount,
      likeCount: stats.likeCount,
      commentCount: stats.commentCount,
    },
  };
}

function mapSearchResult(item: any) {
  if (!item) return null;
  const snippet = item.snippet || {};
  return {
    videoId: item.id?.videoId ?? null,
    playlistId: item.id?.playlistId ?? null,
    channelId: item.id?.channelId ?? snippet.channelId ?? null,
    title: snippet.title || '',
    channelTitle: snippet.channelTitle,
    description: snippet.description,
    publishedAt: snippet.publishedAt,
    thumbnailUrl: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url,
    kind: item.id?.kind,
  };
}

function mapChannel(item: any) {
  if (!item) return null;
  const snippet = item.snippet || {};
  const stats = item.statistics || {};
  const details = item.contentDetails || {};
  return {
    channelId: item.id,
    title: snippet.title || '',
    description: snippet.description,
    publishedAt: snippet.publishedAt,
    thumbnailUrl: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url,
    subscriberCount: stats.subscriberCount,
    videoCount: stats.videoCount,
    viewCount: stats.viewCount,
    uploadsPlaylistId: details.relatedPlaylists?.uploads,
  };
}

function mapPlaylist(item: any) {
  if (!item) return null;
  const snippet = item.snippet || {};
  const details = item.contentDetails || {};
  return {
    playlistId: item.id,
    title: snippet.title || '',
    description: snippet.description,
    channelId: snippet.channelId,
    channelTitle: snippet.channelTitle,
    publishedAt: snippet.publishedAt,
    thumbnailUrl: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url,
    itemCount: details.itemCount ?? null,
  };
}

function mapPlaylistItem(item: any) {
  if (!item) return null;
  const snippet = item.snippet || {};
  return {
    playlistItemId: item.id,
    videoId: snippet.resourceId?.videoId ?? null,
    title: snippet.title || '',
    channelTitle: snippet.videoOwnerChannelTitle,
    description: snippet.description,
    position: snippet.position,
    publishedAt: snippet.publishedAt,
    thumbnailUrl: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url,
  };
}

function mapTranscriptSegment(item: any) {
  const seconds = (item.offset ?? 0) / 1000;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return {
    timestamp: `${minutes}:${secs.toString().padStart(2, '0')}`,
    text: item.text || '',
    startTimeMs: item.offset ?? 0,
    durationMs: item.duration ?? 0,
  };
}

// =============================================================================
// RESOLVERS
// =============================================================================

export function createResolvers(
  videoService: VideoService,
  transcriptService: TranscriptService,
  playlistService: PlaylistService,
  channelService: ChannelService
) {
  return {
    Query: {
      video: async (_: unknown, args: { videoId: string }) => {
        const item = await videoService.getVideo({ videoId: args.videoId });
        return mapVideo(item);
      },

      searchVideos: async (_: unknown, args: { query: string; maxResults?: number }) => {
        const items = await videoService.searchVideos({ query: args.query, maxResults: args.maxResults });
        return items.map(mapSearchResult);
      },

      trendingVideos: async (_: unknown, args: { regionCode?: string; maxResults?: number; categoryId?: string }) => {
        const items = await videoService.getTrendingVideos({
          regionCode: args.regionCode,
          maxResults: args.maxResults,
          videoCategoryId: args.categoryId,
        });
        return items.map(mapVideo);
      },

      relatedVideos: async (_: unknown, args: { videoId: string; maxResults?: number }) => {
        const items = await videoService.getRelatedVideos({ videoId: args.videoId, maxResults: args.maxResults });
        return items.map(mapSearchResult);
      },

      channel: async (_: unknown, args: { channelId: string }) => {
        const item = await channelService.getChannel({ channelId: args.channelId });
        return mapChannel(item);
      },

      channelVideos: async (_: unknown, args: { channelId: string; maxResults?: number }) => {
        const items = await channelService.listVideos({ channelId: args.channelId, maxResults: args.maxResults });
        return items.map(mapSearchResult);
      },

      channelPlaylists: async (_: unknown, args: { channelId: string; maxResults?: number }) => {
        const items = await channelService.getPlaylists({ channelId: args.channelId, maxResults: args.maxResults });
        return items.map(mapPlaylist);
      },

      playlist: async (_: unknown, args: { playlistId: string }) => {
        const item = await playlistService.getPlaylist({ playlistId: args.playlistId });
        return mapPlaylist(item);
      },

      playlistItems: async (_: unknown, args: { playlistId: string; maxResults?: number }) => {
        const items = await playlistService.getPlaylistItems({ playlistId: args.playlistId, maxResults: args.maxResults });
        return items.map(mapPlaylistItem);
      },

      searchPlaylists: async (_: unknown, args: { query: string; maxResults?: number }) => {
        const items = await playlistService.searchPlaylists({ query: args.query, maxResults: args.maxResults });
        return items.map(mapSearchResult);
      },

      transcript: async (_: unknown, args: { videoId: string; language?: string }) => {
        const result = await transcriptService.getTimestampedTranscript({ videoId: args.videoId, language: args.language });
        return {
          videoId: result.videoId,
          language: result.language,
          segments: result.timestampedTranscript,
        };
      },

      searchTranscript: async (_: unknown, args: { videoId: string; query: string; language?: string }) => {
        const result = await transcriptService.searchTranscript({ videoId: args.videoId, query: args.query, language: args.language });
        return {
          videoId: result.videoId,
          query: result.query,
          matches: result.matches.map(mapTranscriptSegment),
          totalMatches: result.totalMatches,
        };
      },
    },
  };
}
