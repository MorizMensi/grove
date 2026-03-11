import express from 'express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentsRouter } from './documents.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export function createApp(docsDir: string): express.Application {
  const app = express();

  // API routes
  app.use('/api/documents', documentsRouter(docsDir));

  // Serve Angular frontend
  // __dirname = dist/server/server/, frontend build = dist/frontend/browser/
  const frontendDir = join(__dirname, '../../frontend/browser');
  app.use(express.static(frontendDir));

  // Serve documents directory for file content fetching
  app.use('/documents', express.static(docsDir, { redirect: false }));

  // Angular catch-all for client-side routing
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(join(frontendDir, 'index.html'));
  });

  return app;
}
