/**
 * End-to-end GraphQL test: full CRUD cycle through the GraphQL layer.
 * Requires OAuth2 tokens (run with --auth first).
 *
 * Usage: node dist/tests/e2e-graphql-test.js
 */
import { YouTubeClient } from '../services/youtube-client.js';
import { VideoService } from '../services/video.js';
import { TranscriptService } from '../services/transcript.js';
import { PlaylistService } from '../services/playlist.js';
import { ChannelService } from '../services/channel.js';
import { createResolvers } from '../graphql/resolvers.js';
import { typeDefs } from '../graphql/schema.js';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';

const client = new YouTubeClient();
console.log('Auth:', client.authenticated ? 'OAuth2 ✓' : 'API key only (mutations will fail)');

const resolvers = createResolvers(
  new VideoService(client),
  new TranscriptService(),
  new PlaylistService(client),
  new ChannelService(client),
);
const schema = makeExecutableSchema({ typeDefs, resolvers });

async function run(label: string, query: string) {
  console.log(`\n--- ${label} ---`);
  const result = await graphql({ schema, source: query });
  if (result.errors) {
    console.error('ERRORS:', JSON.stringify(result.errors, null, 2));
  }
  console.log(JSON.stringify(result.data, null, 2));
  return result.data as Record<string, any> | null;
}

// 1. Read test: search videos
await run('Search Videos', `{ searchVideos(query: "Avicii Levels", maxResults: 2) { videoId title channelTitle } }`);

// 2. Create a private test playlist
const createData = await run('Create Playlist',
  `mutation { createPlaylist(title: "E2E Test Playlist", privacyStatus: private) { success playlistId error } }`
);
const plId = createData?.createPlaylist?.playlistId;

if (!plId) {
  console.error('\nFailed to create playlist — cannot continue CRUD test.');
  process.exit(1);
}

// 3. Add a video (Avicii - Levels, official VEVO)
const addData = await run('Add Video to Playlist',
  `mutation { addToPlaylist(playlistId: "${plId}", videoId: "_ovdm2yX4MA") { success playlistItemId videoId position error } }`
);
const itemId = addData?.addToPlaylist?.playlistItemId;

// 4. List playlist items (short delay for YouTube API propagation)
await new Promise(r => setTimeout(r, 2000));
await run('List Playlist Items',
  `{ playlistItems(playlistId: "${plId}") { playlistItemId videoId title position } }`
);

// 5. Remove the video
if (itemId) {
  await run('Remove Video from Playlist',
    `mutation { removeFromPlaylist(playlistItemId: "${itemId}") { success error } }`
  );
}

// 6. Delete the test playlist
await run('Delete Playlist',
  `mutation { deletePlaylist(playlistId: "${plId}") { success error } }`
);

console.log('\n=== Full CRUD cycle complete ===');
