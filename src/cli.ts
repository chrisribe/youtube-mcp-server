#!/usr/bin/env node

import { startMcpServer } from './server.js';
import { runAuthFlow } from './auth/oauth2.js';
import { loadTokens, getTokenPath_public } from './auth/token-store.js';

const args = process.argv.slice(2);

// --auth: run OAuth2 consent flow then exit
if (args.includes('--auth')) {
  runAuthFlow()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Auth failed:', error.message);
      process.exit(1);
    });
} else {
  // Warn if neither OAuth2 tokens nor API key are available
  const hasTokens = loadTokens() !== null;
  const hasApiKey = !!process.env.YOUTUBE_API_KEY;

  if (!hasTokens && !hasApiKey) {
    console.error('Error: No YouTube credentials found.');
    console.error('  For read-only access:  set YOUTUBE_API_KEY environment variable');
    console.error('  For full access:       run with --auth to complete OAuth2 setup');
    process.exit(1);
  }

  if (!hasTokens && hasApiKey) {
    console.log('Note: Running in read-only mode (API key). Playlist write operations require OAuth2.');
    console.log(`      Run with --auth to enable full access. Tokens stored at: ${getTokenPath_public()}`);
  }

  startMcpServer()
    .catch(error => {
      console.error('Failed to start YouTube MCP Server:', error);
      process.exit(1);
    });
}

