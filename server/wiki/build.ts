import { readFile, writeFile, mkdir, cp, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_URL_PREFIX } from '../../shared/content-url.js';
import { buildManifest } from './manifest.js';

const PLACEHOLDER_BASE_HREF = '/__GROVE_BASE__/';

export interface BuildWikiOptions {
  docsDir: string;
  outDir: string;
  baseHref: string;
  siteName?: string;
}

export async function buildWiki(opts: BuildWikiOptions): Promise<void> {
  const docsDir = resolve(opts.docsDir);
  const outDir = resolve(opts.outDir);

  // Normalize base-href: must have leading and trailing slash.
  let baseHref = opts.baseHref;
  if (!baseHref.startsWith('/')) baseHref = '/' + baseHref;
  if (!baseHref.endsWith('/')) baseHref = baseHref + '/';

  // docsDir must exist and be a directory.
  try {
    const s = await stat(docsDir);
    if (!s.isDirectory()) {
      throw new Error(`docs path is not a directory: ${docsDir}`);
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`docs folder does not exist: ${docsDir}`);
    }
    throw err;
  }

  // Locate the pre-built wiki bundle that ships with this package.
  // This file, at runtime, is dist/server/wiki/build.js; the bundle is
  // dist/frontend/wiki/, which is ../../frontend/wiki/ from this file.
  const bundleDir = fileURLToPath(
    new URL('../../frontend/wiki/', import.meta.url),
  );
  try {
    await stat(join(bundleDir, 'index.html'));
  } catch {
    throw new Error(
      `Grove wiki bundle not found at ${bundleDir}. ` +
        `Did you run \`npm run build:wiki\` (or \`npm run build:all\`) first?`,
    );
  }

  // Fresh output directory. Destructive on existing out to guarantee
  // no stale files survive across runs.
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // Copy the bundle.
  await cp(bundleDir, outDir, { recursive: true });

  // Rewrite <base href> in index.html and produce 404.html.
  const indexPath = join(outDir, 'index.html');
  const indexContent = await readFile(indexPath, 'utf-8');
  const rewritten = indexContent.split(PLACEHOLDER_BASE_HREF).join(baseHref);
  await writeFile(indexPath, rewritten, 'utf-8');
  await writeFile(join(outDir, '404.html'), rewritten, 'utf-8');

  // Write the manifest.
  const manifest = await buildManifest(docsDir, { siteName: opts.siteName });
  await writeFile(
    join(outDir, 'wiki-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8',
  );

  // Copy the consumer's docs into <out>/_content/ (NOT <out>/documents/).
  // CONTENT_URL_PREFIX is the single source of truth for this name.
  await cp(docsDir, join(outDir, CONTENT_URL_PREFIX), { recursive: true });

  console.log(`Grove wiki bundle written to ${outDir}`);
  console.log(`  base-href: ${baseHref}`);
  console.log(`  docs:      ${docsDir}`);
  if (opts.siteName) console.log(`  site-name: ${opts.siteName}`);
  console.log(
    `  manifest:  ${Object.keys(manifest.directories).length} directories`,
  );
}
