import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { YouTubeClient } from './services/youtube-client.js';
import { VideoService } from './services/video.js';
import { TranscriptService } from './services/transcript.js';
import { PlaylistService } from './services/playlist.js';
import { ChannelService } from './services/channel.js';
import { ToolRegistry } from './tools/index.js';

export async function startMcpServer() {
    const server = new Server(
        { name: 'youtube-mcp-server', version: '2.0.0' },
        { capabilities: { tools: {} } }
    );

    const youtubeClient = new YouTubeClient();
    const context = {
        videoService: new VideoService(youtubeClient),
        transcriptService: new TranscriptService(),
        playlistService: new PlaylistService(youtubeClient),
        channelService: new ChannelService(youtubeClient),
    };

    const registry = new ToolRegistry();

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: registry.getDefinitions(),
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
            const result = await registry.handle(name, (args ?? {}) as Record<string, unknown>, context);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        } catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
                isError: true,
            };
        }
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Keep stdout clean for MCP JSON-RPC frames; diagnostics must go to stderr.
    console.error('YouTube MCP Server v2.0.0 started successfully');
    return server;
}
