#!/usr/bin/env node

import { resolve } from 'node:path';
import { stat } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { createApp } from '../index.js';

const args = process.argv.slice(2);

let folderPath: string | null = null;
let port = 3000;
let noOpen = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error('Error: --port must be a number between 1 and 65535');
      process.exit(1);
    }
    i++;
  } else if (arg === '--no-open') {
    noOpen = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`Usage: grove <folder> [options]

Options:
  --port <number>  Port to serve on (default: 3000)
  --no-open        Don't auto-open browser
  -h, --help       Show this help`);
    process.exit(0);
  } else if (!arg.startsWith('-')) {
    folderPath = arg;
  }
}

if (!folderPath) {
  console.error('Error: Please provide a folder path.\nUsage: grove <folder> [--port 3000] [--no-open]');
  process.exit(1);
}

const resolvedPath = resolve(folderPath);

try {
  const s = await stat(resolvedPath);
  if (!s.isDirectory()) {
    console.error(`Error: "${resolvedPath}" is not a directory.`);
    process.exit(1);
  }
} catch {
  console.error(`Error: "${resolvedPath}" does not exist.`);
  process.exit(1);
}

const app = createApp(resolvedPath);

const server = app.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`Grove serving "${resolvedPath}"`);
  console.log(`Open ${url}`);

  if (!noOpen) {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${cmd} ${url}`);
  }
});

const shutdown = () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 3000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
