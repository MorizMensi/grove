import express from 'express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentsRouter } from './documents.js';
import { openRouter } from './open.js';
import { capabilitiesRouter } from './capabilities.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export function createApp(docsDir: string): express.Application {
  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // API routes
  app.use('/api/documents', documentsRouter(docsDir));
  app.use('/api/open', openRouter(docsDir));
  app.use('/api/capabilities', capabilitiesRouter());

  // Serve Angular frontend
  // __dirname = dist/server/, frontend build = dist/frontend/browser/
  const frontendDir = join(__dirname, '../frontend/browser');
  app.use(express.static(frontendDir));

  // Serve documents directory for file content fetching
  app.use('/documents', express.static(docsDir, { redirect: false }));

  // Angular catch-all for client-side routing
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(join(frontendDir, 'index.html'));
  });

  return app;
}
