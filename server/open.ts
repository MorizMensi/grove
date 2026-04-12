import { Router } from "express";
import { exec } from "node:child_process";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";

type Action = "terminal" | "zed" | "claude";

const VALID_ACTIONS = new Set<Action>(["terminal", "zed", "claude"]);

function buildCommand(action: Action, absDir: string): string {
  const escaped = absDir.replace(/"/g, '\\"');
  switch (action) {
    case "terminal":
      return `open -a Terminal "${escaped}"`;
    case "zed":
      return `/usr/local/bin/zed "${escaped}"`;
    case "claude":
      return `osascript -e 'tell app "Terminal" to do script "cd \\"${escaped}\\" && claude"'`;
  }
}

export function openRouter(docsDir: string): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const { action, path: relPath } = req.body ?? {};

    if (!action || !VALID_ACTIONS.has(action)) {
      res.status(400).json({
        error: 'Invalid action. Must be "terminal", "zed", or "claude".',
      });
      return;
    }

    if (typeof relPath !== "string") {
      res.status(400).json({ error: "Missing path." });
      return;
    }

    if (relPath.includes("..") || relPath.startsWith("/")) {
      res.status(400).json({ error: "Invalid path" });
      return;
    }

    const absDir = relPath ? resolve(docsDir, relPath) : docsDir;

    if (!absDir.startsWith(docsDir)) {
      res.status(400).json({ error: "Invalid path" });
      return;
    }

    try {
      const s = await stat(absDir);
      if (!s.isDirectory() && action !== "zed") {
        res.status(400).json({ error: "Path is not a directory" });
        return;
      }
    } catch {
      res.status(404).json({ error: "Directory not found" });
      return;
    }

    const command = buildCommand(action as Action, absDir);
    exec(command, (err) => {
      if (err) {
        res.status(500).json({ error: `Failed to open: ${err.message}` });
        return;
      }
      res.json({ ok: true });
    });
  });

  return router;
}
