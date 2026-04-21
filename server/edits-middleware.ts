import type { NextFunction, Request, Response } from 'express';

/**
 * Reject state-changing requests when the `--allow-edits` flag is
 * absent. This is the *real* gate: UI hiding is cosmetic.
 * A hostile tab cannot flip the flag from the browser.
 */
export function requireEdits(allowEdits: boolean) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (!allowEdits) {
      res.status(403).json({ error: 'edits-disabled' });
      return;
    }
    next();
  };
}

/**
 * Reject state-changing requests whose `Origin` host:port does not
 * match `Host`. Blocks drive-by writes from malicious pages that know
 * Grove runs on `localhost:3000` (or wherever). Missing or
 * unparseable Origin is treated as a mismatch.
 *
 * The `Host` header is already echoed by Express from the HTTP
 * request-line; we compare url.host (hostname:port) against it.
 */
export function csrfOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (typeof origin !== 'string' || typeof host !== 'string' || !host) {
    res.status(403).json({ error: 'bad-origin' });
    return;
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    res.status(403).json({ error: 'bad-origin' });
    return;
  }
  if (originHost !== host) {
    res.status(403).json({ error: 'bad-origin' });
    return;
  }
  next();
}
