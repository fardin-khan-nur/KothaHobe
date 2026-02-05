import type { Express } from "express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../client/dist");

  app.use(express.static(distPath));

  app.get("/*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
