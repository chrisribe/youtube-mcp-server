# YouTube MCP Server — Refactor & Feature Plan

> Forked from [ZubeidHendricks/youtube-mcp-server](https://github.com/ZubeidHendricks/youtube-mcp-server) (MIT License)

## Goal

Transform this YouTube MCP server into a clean, GraphQL-based architecture (following simple-memory-mcp patterns) with full playlist management — enabling an LLM to build customized music playlists based on user feedback and preferences.

---

## Phase 1: Clean Foundation

**Objective:** Remove dead code, extract shared YouTube client, enable strict TypeScript.

- [ ] Delete `src/functions/` (excluded from build, dead code)
- [ ] Delete duplicate files: `youtube-mcp-readme.md`, `youtube-readme.md`, `zubeid-youtube-mcp-server-1.0.0.tgz`
- [ ] Remove Smithery/Docker config (not needed for personal use): `smithery.yaml`, `Dockerfile`, `.dockerignore`
- [ ] Deduplicate `src/cli.ts` and `src/index.ts` (identical logic)
- [ ] Create `src/services/youtube-client.ts` — shared YouTube API client
  - Single `initialize()` with lazy init
  - Eliminates 4x copy-pasted init pattern across services
  - Services receive the client via constructor injection
- [ ] Refactor all 4 services to use shared client
- [ ] Update `tsconfig.json`:
  - `strict: true`
  - `noImplicitAny: true`
  - Remove `functions/` exclude (deleted)
  - Include all of `src/`
- [ ] Fix types: remove `as unknown as` casts in server.ts
- [ ] Verify build: `npm run build`

**Done when:** Build passes with strict mode, no duplicated init code, no dead files.

---

## Phase 2: ToolRegistry + GraphQL

**Objective:** Replace 7 inline MCP tools with 1 GraphQL tool, following simple-memory-mcp architecture.

### 2a: ToolRegistry Pattern
- [ ] Create `src/types/tools.ts` — Tool, ToolDefinition, ToolContext interfaces
- [ ] Create `src/tools/index.ts` — ToolRegistry class (from simple-memory pattern)
- [ ] Refactor `src/server.ts` to use ToolRegistry instead of inline switch

### 2b: GraphQL Schema
- [ ] Create `src/graphql/schema.ts` — YouTube GraphQL type definitions
  ```graphql
  type Video { videoId, title, description, channelTitle, duration, stats, ... }
  type Channel { channelId, title, description, stats, ... }
  type Playlist { playlistId, title, description, itemCount, ... }
  type Transcript { videoId, language, segments: [TranscriptSegment] }
  type TranscriptSegment { timestamp, text, startTimeMs, durationMs }
  type SearchResult { videoId, title, channelTitle, description }

  type Query {
    video(videoId: String!): Video
    searchVideos(query: String!, maxResults: Int): [SearchResult!]!
    trendingVideos(regionCode: String, maxResults: Int): [Video!]!
    relatedVideos(videoId: String!, maxResults: Int): [SearchResult!]!
    channel(channelId: String!): Channel
    channelVideos(channelId: String!, maxResults: Int): [SearchResult!]!
    channelPlaylists(channelId: String!, maxResults: Int): [Playlist!]!
    playlist(playlistId: String!): Playlist
    playlistItems(playlistId: String!, maxResults: Int): [Video!]!
    searchPlaylists(query: String!, maxResults: Int): [Playlist!]!
    transcript(videoId: String!, language: String): Transcript
    searchTranscript(videoId: String!, query: String!): TranscriptSearchResult
  }
  ```

### 2c: GraphQL Resolvers
- [ ] Create `src/graphql/resolvers.ts` — Maps queries to existing service methods
- [ ] Wire up all currently-unused service methods:
  - `VideoService.getVideoStats()`
  - `VideoService.getTrendingVideos()`
  - `VideoService.getRelatedVideos()`
  - `PlaylistService.searchPlaylists()`
  - `TranscriptService.searchTranscript()`
  - `TranscriptService.getTimestampedTranscript()`
  - `ChannelService.getPlaylists()`
  - `ChannelService.getStatistics()`

### 2d: YouTube GraphQL Tool
- [ ] Create `src/tools/youtube-graphql/index.ts` — Single MCP tool
- [ ] Remove old inline tool definitions from server.ts
- [ ] Update server.ts to slim MCP setup (delegates to ToolRegistry)
- [ ] Verify build + manual test with a GraphQL query

**Done when:** 1 MCP tool (`youtube-graphql`) handles all read operations that previously needed 7+ tools.

---

## Phase 3: OAuth2 + Playlist Write Operations

**Objective:** Add authenticated playlist management (create, modify, delete).

### 3a: OAuth2 Authentication

OAuth2 replaces the API key entirely — it handles both read and write operations,
so there's no reason to maintain two auth mechanisms.

- [ ] Create `src/auth/oauth2.ts`
  - OAuth2 flow using `googleapis` built-in OAuth2 client
  - Browser-based consent flow for initial authorization
  - Token storage (file-based, e.g. `~/.youtube-mcp/tokens.json`)
  - Automatic token refresh
- [ ] Create `src/auth/token-store.ts` — secure token persistence
- [ ] Update `src/services/youtube-client.ts` to use OAuth2 only (remove API key support)
- [ ] Remove `YOUTUBE_API_KEY` env var requirement from `src/index.ts`
- [ ] Add env vars: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`
- [ ] Add setup command or first-run flow for OAuth consent

### 3b: Playlist Write Service Methods
- [ ] Add to `PlaylistService`:
  - `createPlaylist({ title, description, privacyStatus })` → `youtube.playlists.insert()`
  - `updatePlaylist({ playlistId, title, description, privacyStatus })` → `youtube.playlists.update()`
  - `deletePlaylist({ playlistId })` → `youtube.playlists.delete()`
  - `addToPlaylist({ playlistId, videoId, position? })` → `youtube.playlistItems.insert()`
  - `removeFromPlaylist({ playlistItemId })` → `youtube.playlistItems.delete()`
  - `reorderPlaylistItem({ playlistItemId, position })` → `youtube.playlistItems.update()`

### 3c: GraphQL Mutations
- [ ] Add mutations to schema:
  ```graphql
  type Mutation {
    createPlaylist(title: String!, description: String, privacyStatus: PrivacyStatus): PlaylistResult!
    updatePlaylist(playlistId: String!, title: String, description: String): PlaylistResult!
    deletePlaylist(playlistId: String!): DeleteResult!
    addToPlaylist(playlistId: String!, videoId: String!, position: Int): PlaylistItemResult!
    removeFromPlaylist(playlistItemId: String!): DeleteResult!
    reorderPlaylistItem(playlistItemId: String!, position: Int!): PlaylistItemResult!
  }
  ```
- [ ] Add mutation resolvers
- [ ] Test full CRUD cycle: create playlist → search videos → add to playlist → verify

**Done when:** LLM can create and manage YouTube playlists through GraphQL mutations.

---

## Phase 4: Simple-Memory Integration

**Objective:** Connect with simple-memory-mcp for preference-driven playlist curation.

- [ ] Document the workflow in copilot-instructions or agent config:
  1. LLM searches YouTube for music based on user request
  2. User gives feedback ("I like this", "too heavy", "more like X")
  3. LLM stores preferences in simple-memory (tags: `music-pref`, `playlist`)
  4. On future requests, LLM searches memory first to recall taste profile
  5. LLM curates playlists informed by accumulated preferences
- [ ] Add example prompts / workflow documentation
- [ ] Consider: copilot instructions snippet for MCP clients that have both servers configured

**Done when:** LLM can build personalized playlists that improve over time based on stored feedback.

---

## Phase 5: Polish & Publish

- [ ] Update README.md with new architecture, GraphQL examples, setup instructions
- [ ] Update package.json (name, author, description, repository)
- [ ] Add NOTICES file with original attribution
- [ ] Add proper error messages for missing/expired OAuth2 config
- [ ] Add `CLAUDE.md` / `copilot-instructions.md` for AI context
- [ ] Consider: tests for GraphQL resolvers
- [ ] Consider: npm publish under your own package name

---

## Architecture Reference

### Current (inherited)
```
src/
├── index.ts          # Entry point (duplicated with cli.ts)
├── cli.ts            # CLI entry (identical to index.ts)
├── server.ts         # 250-line monolith: tool defs + switch routing
├── types.ts          # Flat interfaces
├── functions/        # Dead code (excluded from build)
└── services/
    ├── video.ts      # 4x duplicated init pattern
    ├── transcript.ts
    ├── playlist.ts
    └── channel.ts
```

### Target
```
src/
├── index.ts                    # Entry point
├── server.ts                   # Slim MCP setup, delegates to ToolRegistry
├── auth/
│   ├── oauth2.ts               # OAuth2 flow + token refresh
│   └── token-store.ts          # Secure token persistence
├── services/
│   ├── youtube-client.ts       # Shared client (OAuth2)
│   ├── video.ts                # Injected client, no init duplication
│   ├── transcript.ts
│   ├── playlist.ts             # + write operations
│   └── channel.ts
├── graphql/
│   ├── schema.ts               # YouTube GraphQL type definitions
│   └── resolvers.ts            # Maps to service methods
├── tools/
│   ├── index.ts                # ToolRegistry
│   └── youtube-graphql/
│       └── index.ts            # Single MCP tool
└── types/
    ├── index.ts                # Domain interfaces
    └── tools.ts                # Tool/ToolDefinition/ToolContext
```

---

## Notes

- **OAuth2** = single auth mechanism for all operations (read + write) — Phase 3
- **GraphQL** replaces N individual MCP tools with 1 flexible tool
- YouTube Data API v3 quota: 10,000 units/day. Search = 100 units, list = 1 unit. Be mindful.
- Original repo: MIT License by Zubeid Hendricks
