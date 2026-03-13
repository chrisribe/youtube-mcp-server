import { graphql } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { Tool, ToolContext } from '../../types/tools.js';
import { typeDefs } from '../../graphql/schema.js';
import { createResolvers } from '../../graphql/resolvers.js';
import type { VideoService } from '../../services/video.js';

interface YouTubeGraphqlArgs {
  query: string;
  variables?: Record<string, unknown>;
}

// Cache schema per VideoService instance (proxy for the whole service set)
const schemaCache = new WeakMap<VideoService, ReturnType<typeof makeExecutableSchema>>();

function getOrCreateSchema(context: ToolContext) {
  let schema = schemaCache.get(context.videoService);
  if (!schema) {
    const resolvers = createResolvers(
      context.videoService,
      context.transcriptService,
      context.playlistService,
      context.channelService
    );
    schema = makeExecutableSchema({ typeDefs, resolvers });
    schemaCache.set(context.videoService, schema);
  }
  return schema;
}

async function execute(args: Record<string, unknown>, context: ToolContext) {
  const { query, variables } = args as unknown as YouTubeGraphqlArgs;

  if (!query || typeof query !== 'string') {
    return { errors: [{ message: 'query is required and must be a string' }] };
  }

  try {
    const schema = getOrCreateSchema(context);
    const result = await graphql({
      schema,
      source: query,
      variableValues: variables ?? {},
    });

    const response: Record<string, unknown> = {};
    if (result.data) response.data = result.data;
    if (result.errors?.length) {
      response.errors = result.errors.map(e => ({
        message: e.message,
        path: e.path?.map(String),
      }));
    }
    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { errors: [{ message: `GraphQL execution error: ${msg}` }] };
  }
}

export const youtubeTool: Tool = {
  definition: {
    name: 'youtube-graphql',
    description: `GraphQL interface for YouTube. Use queries to search and retrieve data, mutations (Phase 3) to manage playlists.

QUERIES:
{ searchVideos(query: "lofi hip hop", maxResults: 5) { videoId title channelTitle } }
{ video(videoId: "abc123") { title description stats { viewCount likeCount } } }
{ trendingVideos(regionCode: "US", maxResults: 10) { videoId title } }
{ relatedVideos(videoId: "abc123") { videoId title } }
{ channel(channelId: "UCxxx") { title subscriberCount videoCount } }
{ myChannel { channelId title subscriberCount uploadsPlaylistId } }
{ myChannels { channelId title subscriberCount uploadsPlaylistId } }
{ channelVideos(channelId: "UCxxx", maxResults: 20) { videoId title } }
{ channelPlaylists(channelId: "UCxxx") { playlistId title itemCount } }
{ playlist(playlistId: "PLxxx") { title itemCount } }
{ playlistItems(playlistId: "PLxxx", maxResults: 50) { playlistItemId videoId title position } }
{ searchPlaylists(query: "workout music") { playlistId title channelTitle } }
{ transcript(videoId: "abc123") { segments { timestamp text } } }
{ searchTranscript(videoId: "abc123", query: "introduction") { matches { timestamp text } totalMatches } }

MUTATIONS (OAuth2 required - run with --auth first):
mutation { createPlaylist(title: "My Mix", privacyStatus: private) { success playlistId } }
mutation { updatePlaylist(playlistId: "PLxxx", title: "New Name") { success } }
mutation { deletePlaylist(playlistId: "PLxxx") { success } }
mutation { addToPlaylist(playlistId: "PLxxx", videoId: "abc123") { success playlistItemId position } }
mutation { removeFromPlaylist(playlistItemId: "PLitemsxxx") { success } }
mutation { reorderPlaylistItem(playlistItemId: "PLitemsxxx", playlistId: "PLxxx", position: 0) { success position } }`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'GraphQL query string',
        },
        variables: {
          type: 'object',
          description: 'Optional GraphQL variables',
          additionalProperties: true,
        },
      },
      required: ['query'],
    },
  },
  handler: execute,
};
