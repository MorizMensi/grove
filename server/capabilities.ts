import { Router } from 'express';

/**
 * Reports which `/api/open` actions are supported on the current
 * platform. The frontend calls this once at bootstrap and hides
 * buttons that would otherwise return HTTP 501 from `/api/open`.
 */
export interface Capabilities {
  platform: NodeJS.Platform;
  supports: {
    terminal: boolean;
    claude: boolean;
  };
}

export function capabilitiesRouter(): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const platform = process.platform;
    const capabilities: Capabilities = {
      platform,
      supports: {
        terminal: platform === 'darwin',
        claude: platform === 'darwin',
      },
    };
    res.json(capabilities);
  });

  return router;
}
