import type { VideoService } from '../services/video.js';
import type { TranscriptService } from '../services/transcript.js';
import type { PlaylistService } from '../services/playlist.js';
import type { ChannelService } from '../services/channel.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolContext {
  videoService: VideoService;
  transcriptService: TranscriptService;
  playlistService: PlaylistService;
  channelService: ChannelService;
}

export interface ToolHandler {
  (args: Record<string, unknown>, context: ToolContext): Promise<unknown>;
}

export interface Tool {
  definition: ToolDefinition;
  handler: ToolHandler;
}
