import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

function getTokenPath(): string {
  const dir = join(homedir(), '.youtube-mcp');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  return join(dir, 'tokens.json');
}

export function loadTokens(): TokenData | null {
  try {
    const path = getTokenPath();
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as TokenData;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: TokenData): void {
  const path = getTokenPath();
  // Write with restricted permissions (owner read/write only)
  writeFileSync(path, JSON.stringify(tokens, null, 2), { mode: 0o600 });
}

export function clearTokens(): void {
  const path = getTokenPath();
  if (existsSync(path)) {
    writeFileSync(path, '', { mode: 0o600 });
  }
}

export function getTokenPath_public(): string {
  return getTokenPath();
}
