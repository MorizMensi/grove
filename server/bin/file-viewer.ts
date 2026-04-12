#!/usr/bin/env node

import { resolve } from 'node:path';
import { stat } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { createApp } from '../index.js';
import { buildWiki } from '../wiki/build.js';

const args = process.argv.slice(2);

// Subcommand dispatch: `grove build-wiki ...`
if (args[0] === 'build-wiki') {
  let docsDir: string | null = null;
  let outDir = 'dist-wiki';
  let baseHref = '/';
  let siteName: string | undefined;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--docs' && args[i + 1]) {
      docsDir = args[++i];
    } else if (arg === '--out' && args[i + 1]) {
      outDir = args[++i];
    } else if (arg === '--base-href' && args[i + 1]) {
      baseHref = args[++i];
    } else if (arg === '--site-name' && args[i + 1]) {
      siteName = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: grove build-wiki --docs <path> [--out <path>] [--base-href <href>] [--site-name <name>]

Build a static GitHub-Pages-ready wiki from a folder of markdown files,
rendered by Grove's own frontend.

Options:
  --docs <path>       Path to the markdown documentation folder (required)
  --out <path>        Output directory (default: dist-wiki)
  --base-href <href>  Deploy base path (default: /)
  --site-name <name>  Site name shown in the breadcrumb brand + browser
                      title (default: "Grove")
  -h, --help          Show this help

Example:
  grove build-wiki --docs docs --out dist-wiki --base-href /my-lib/ --site-name "My Lib"`);
      process.exit(0);
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  if (!docsDir) {
    console.error('Error: --docs is required. Run `grove build-wiki --help` for usage.');
    process.exit(1);
  }

  try {
    await buildWiki({ docsDir, outDir, baseHref, siteName });
    process.exit(0);
  } catch (err) {
    console.error(`grove build-wiki: ${(err as Error).message}`);
    process.exit(1);
  }
}

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
    console.log(`Usage: grove [folder] [options]

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
  folderPath = '.';
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
