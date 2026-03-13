import { YouTubeClient } from '../services/youtube-client.js';
import { VideoService } from '../services/video.js';
import { PlaylistService } from '../services/playlist.js';
import { TranscriptService } from '../services/transcript.js';
import { ChannelService } from '../services/channel.js';
import { createResolvers } from '../graphql/resolvers.js';
import { typeDefs } from '../graphql/schema.js';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';

const client = new YouTubeClient();
const resolvers = createResolvers(
  new VideoService(client),
  new TranscriptService(),
  new PlaylistService(client),
  new ChannelService(client),
);
const schema = makeExecutableSchema({ typeDefs, resolvers });

async function run(label: string, q: string) {
  console.log(`\n--- ${label} ---`);
  const r = await graphql({ schema, source: q });
  if (r.errors) console.error(JSON.stringify(r.errors, null, 2));
  console.log(JSON.stringify(r.data, null, 2));
  return r.data as Record<string, any> | null;
}

// 1. Search for Avicii
const search = await run('Search', `{ searchVideos(query: "Avicii Wake Me Up official", maxResults: 3) { videoId title channelTitle } }`);
const videoId = search?.searchVideos?.[0]?.videoId;
console.log('\nUsing video:', videoId, '-', search?.searchVideos?.[0]?.title);

// 2. Create playlist
const pl = await run('Create Playlist',
  `mutation { createPlaylist(title: "Avicii Favorites", description: "Curated by YouTube MCP Server", privacyStatus: private) { success playlistId error } }`
);
const plId = pl?.createPlaylist?.playlistId;

// 3. Add video
if (plId && videoId) {
  await new Promise(r => setTimeout(r, 1500));
  await run('Add Track', `mutation { addToPlaylist(playlistId: "${plId}", videoId: "${videoId}") { success playlistItemId videoId position error } }`);
  console.log(`\nDone! "Avicii Favorites" playlist created in your YouTube account.`);
  console.log(`View it at: https://www.youtube.com/playlist?list=${plId}`);
}
