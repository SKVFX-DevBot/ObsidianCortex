import { existsSync } from 'fs';
import { join } from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { spawn, ChildProcess } from 'child_process';

const LOG = (...args: unknown[]) => console.log('[Cortex]', ...args);
const WARN = (...args: unknown[]) => console.warn('[Cortex]', ...args);

// ---------------------------------------------------------------------------
// Binary detection
// ---------------------------------------------------------------------------

export function findClaudeBinary(settingsOverride?: string): string | null {
  LOG('findClaudeBinary — platform:', process.platform);

  if (settingsOverride) {
    LOG('  trying settings override:', settingsOverride);
    if (existsSync(settingsOverride)) return settingsOverride;
    WARN('  settings override not found');
  }

  // On Windows, use 'where'; on Mac/Linux use 'which'
  try {
    const cmd = process.platform === 'win32' ? 'where claude' : 'which claude';
    LOG('  trying PATH lookup:', cmd);
    const result = execSync(cmd, { encoding: 'utf8' }).trim().split('\n')[0];
    if (result && existsSync(result)) {
      LOG('  found via PATH:', result);
      return result;
    }
  } catch { /* not found in PATH */ }

  const home = os.homedir();
  const candidates = [
    // Windows
    join(home, 'AppData', 'Local', 'Programs', 'claude', 'claude.exe'),
    join(home, 'AppData', 'Roaming', 'npm', 'claude.cmd'),
    join(home, 'AppData', 'Roaming', 'npm', 'claude'),
    join(home, '.local', 'bin', 'claude.exe'),
    // Mac / Linux
    join(home, '.local', 'bin', 'claude'),
    join(home, '.npm-global', 'bin', 'claude'),
    '/usr/local/bin/claude',
  ];

  LOG('  trying candidate paths…');
  for (const c of candidates) {
    if (existsSync(c)) {
      LOG('  found at:', c);
      return c;
    }
  }

  WARN('  claude binary not found anywhere');
  return null;
}

// ---------------------------------------------------------------------------
// Spawn
// ---------------------------------------------------------------------------

export interface SpawnOptions {
  binaryPath: string;
  prompt: string;
  vaultRoot: string;
  env: Record<string, string>;
  resumeSessionId?: string;
}

export function spawnClaude(opts: SpawnOptions): ChildProcess {
  const args = [
    '--output-format', 'stream-json',
    '--print',
    '--dangerously-skip-permissions',
  ];

  if (opts.resumeSessionId) {
    args.push('--resume', opts.resumeSessionId);
  }

  args.push(opts.prompt);

  LOG('spawnClaude:', opts.binaryPath, args.slice(0, -1), '— cwd:', opts.vaultRoot);

  const proc = spawn(opts.binaryPath, args, {
    cwd: opts.vaultRoot,
    env: opts.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  LOG('  pid:', proc.pid);
  return proc;
}

// ---------------------------------------------------------------------------
// Stream-JSON parsing
// ---------------------------------------------------------------------------

export interface StreamCallbacks {
  onText: (delta: string) => void;
  onToolCall: (tool: string, input: unknown) => void;
  onDone: (sessionId?: string) => void;
  onError: (err: string) => void;
}

export function parseStreamOutput(proc: ChildProcess, cb: StreamCallbacks): void {
  let buffer = '';
  let sessionId: string | undefined;

  proc.stdout?.on('data', (chunk: Buffer) => {
    const raw = chunk.toString();
    LOG('stdout chunk:', raw.substring(0, 200));
    buffer += raw;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line) as Record<string, unknown>;
        LOG('  parsed msg type:', msg.type);
        handleMessage(msg, cb, (id) => { sessionId = id; });
      } catch {
        LOG('  non-JSON line:', line.substring(0, 100));
      }
    }
  });

  proc.stderr?.on('data', (chunk: Buffer) => {
    const text = chunk.toString();
    WARN('stderr:', text);
    cb.onError(text);
  });

  proc.on('close', (code) => {
    LOG('process closed — exit code:', code, '— sessionId:', sessionId);
    cb.onDone(sessionId);
  });
}

function handleMessage(
  msg: Record<string, unknown>,
  cb: StreamCallbacks,
  setSessionId: (id: string) => void,
): void {
  switch (msg.type) {
    case 'system':
      if (msg.session_id) setSessionId(msg.session_id as string);
      break;
    case 'content_block_delta': {
      const delta = msg.delta as Record<string, unknown> | undefined;
      if (delta?.type === 'text_delta') {
        cb.onText((delta.text as string) ?? '');
      }
      break;
    }
    case 'tool_use':
      cb.onToolCall(msg.name as string, msg.input);
      break;
    case 'message_stop':
      // onDone is called via process 'close' event
      break;
  }
}
