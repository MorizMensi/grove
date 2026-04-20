import { Router } from 'express';

/**
 * Reports which `/api/open` actions are supported on the current
 * platform, plus which write-side features are unlocked by CLI flags.
 * The frontend calls this once at bootstrap and hides buttons that
 * would otherwise return HTTP 501 from `/api/open` or 403 from the
 * write routes.
 */
export interface Capabilities {
  platform: NodeJS.Platform;
  supports: {
    terminal: boolean;
    claude: boolean;
    /** Reflects `--allow-edits`. The real gate is `requireEdits` middleware. */
    edits: boolean;
    /** Reflects `--git-commit`. Always false until Phase 6 wires the flag. */
    gitCommit: boolean;
  };
}

export interface CapabilitiesOptions {
  allowEdits?: boolean;
  gitCommit?: boolean;
}

export function capabilitiesRouter(options: CapabilitiesOptions = {}): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const platform = process.platform;
    const capabilities: Capabilities = {
      platform,
      supports: {
        terminal: platform === 'darwin',
        claude: platform === 'darwin',
        edits: options.allowEdits === true,
        gitCommit: options.gitCommit === true,
      },
    };
    res.json(capabilities);
  });

  return router;
}
