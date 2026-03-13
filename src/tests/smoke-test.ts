/**
 * Quick smoke test for the GraphQL layer.
 * Run: node --env-file=.env dist/tests/smoke-test.js
 */
import { graphql } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { YouTubeClient } from '../services/youtube-client.js';
import { VideoService } from '../services/video.js';
import { TranscriptService } from '../services/transcript.js';
import { PlaylistService } from '../services/playlist.js';
import { ChannelService } from '../services/channel.js';
import { typeDefs } from '../graphql/schema.js';
import { createResolvers } from '../graphql/resolvers.js';

const client = new YouTubeClient();
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: createResolvers(
    new VideoService(client),
    new TranscriptService(),
    new PlaylistService(client),
    new ChannelService(client),
  ),
});

async function test(label: string, query: string) {
  console.log(`\n--- ${label} ---`);
  const result = await graphql({ schema, source: query });
  if (result.errors) {
    console.error('ERRORS:', JSON.stringify(result.errors, null, 2));
  } else {
    console.log(JSON.stringify(result.data, null, 2));
  }
}

await test(
  'searchVideos',
  `{ searchVideos(query: "lofi hip hop", maxResults: 3) { videoId title channelTitle } }`
);

await test(
  'trendingVideos',
  `{ trendingVideos(regionCode: "US", maxResults: 3) { videoId title channelTitle } }`
);

await test(
  'searchPlaylists',
  `{ searchPlaylists(query: "chill music mix", maxResults: 3) { playlistId title channelTitle } }`
);

console.log('\n✓ Smoke test complete');
