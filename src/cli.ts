#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { startMcpServer } from './server.js';
import { runAuthFlow } from './auth/oauth2.js';
import { loadTokens, getTokenPath_public } from './auth/token-store.js';

// Load .env file from project root (no dependency needed)
try {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env file is optional
}

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
    // Keep stdout reserved for MCP protocol output.
    console.error('Note: Running in read-only mode (API key). Playlist write operations require OAuth2.');
    console.error(`      Run with --auth to enable full access. Tokens stored at: ${getTokenPath_public()}`);
  }

  startMcpServer()
    .catch(error => {
      console.error('Failed to start YouTube MCP Server:', error);
      process.exit(1);
    });
}

