import type { Tool, ToolDefinition, ToolContext } from '../types/tools.js';
import { youtubeTool } from './youtube-graphql/index.js';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    this.register(youtubeTool);
  }

  private register(tool: Tool): void {
    this.tools.set(tool.definition.name, tool);
  }

  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  async handle(toolName: string, args: Record<string, unknown>, context: ToolContext): Promise<unknown> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    return tool.handler(args, context);
  }

  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }
}
