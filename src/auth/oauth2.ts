import { google } from 'googleapis';
import { createServer } from 'http';
import { URL } from 'url';
import { loadTokens, saveTokens, type TokenData } from './token-store.js';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
];

const REDIRECT_PORT = 8765;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth2callback`;

export function createOAuth2Client() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET environment variables are required for OAuth2. ' +
      'Run the server with --auth to set up authentication first.'
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
}

/**
 * Load tokens from disk and attach to the OAuth2 client.
 * Returns null if no tokens are stored (needs auth flow).
 */
export function loadAuthClient() {
  const tokens = loadTokens();
  if (!tokens) return null;

  const auth = createOAuth2Client();
  auth.setCredentials(tokens);

  // Auto-save refreshed tokens
  auth.on('tokens', (newTokens) => {
    const merged: TokenData = {
      access_token: newTokens.access_token ?? tokens.access_token,
      refresh_token: newTokens.refresh_token ?? tokens.refresh_token,
      expiry_date: newTokens.expiry_date ?? tokens.expiry_date,
      token_type: newTokens.token_type ?? tokens.token_type,
      scope: newTokens.scope ?? tokens.scope,
      ...(newTokens.id_token != null ? { id_token: newTokens.id_token } : {}),
    };
    saveTokens(merged);
  });

  return auth;
}

/**
 * Run the browser-based OAuth2 consent flow.
 * Opens the auth URL for the user to visit, waits for the callback,
 * exchanges the code for tokens, and stores them.
 */
export async function runAuthFlow(): Promise<void> {
  const auth = createOAuth2Client();

  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // force consent to always get refresh_token
  });

  console.log('\n=== YouTube OAuth2 Setup ===');
  console.log('Open this URL in your browser to authorize:');
  console.log('\n' + authUrl + '\n');

  // Start local server to receive the callback
  const code = await waitForAuthCode();

  const { tokens } = await auth.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      'No refresh token received. This usually means the app is in "Testing" mode in Google Cloud Console ' +
      'and the token has already been issued. Revoke access at https://myaccount.google.com/permissions and try again, ' +
      'or publish your OAuth consent screen.'
    );
  }

  saveTokens(tokens as TokenData);
  console.log('✓ Authorization successful. Tokens stored at ~/.youtube-mcp/tokens.json');
}

function waitForAuthCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      try {
        const url = new URL(req.url ?? '/', `http://localhost:${REDIRECT_PORT}`);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400);
          res.end(`Authorization failed: ${error}`);
          server.close();
          reject(new Error(`OAuth2 error: ${error}`));
          return;
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h2>Authorization successful!</h2><p>You can close this tab and return to the terminal.</p>');
          server.close();
          resolve(code);
        }
      } catch (err) {
        res.writeHead(500);
        res.end('Internal error');
        server.close();
        reject(err);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(`Waiting for OAuth2 callback on port ${REDIRECT_PORT}...`);
    });

    server.on('error', (err) => {
      reject(new Error(`Failed to start callback server on port ${REDIRECT_PORT}: ${err.message}`));
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('OAuth2 flow timed out after 5 minutes'));
    }, 5 * 60 * 1000);
  });
}
