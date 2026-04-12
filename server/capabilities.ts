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
    zed: boolean;
    claude: boolean;
  };
}

export function capabilitiesRouter(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const platform = process.platform;
    const capabilities: Capabilities = {
      platform,
      supports: {
        terminal: platform === 'darwin',
        // `zed` is cross-platform; we optimistically report true and
        // let the actual open call fail if the binary is not on PATH.
        zed: true,
        claude: platform === 'darwin',
      },
    };
    res.json(capabilities);
  });

  return router;
}
