import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./src/server/api";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  // Request logger for server debugging
  app.use((req, res, next) => {
    console.log(`[Express API] ${req.method} ${req.path}`);
    next();
  });

  // Mount e-commerce API routes
  app.use("/api", apiRouter);

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    console.log("Mounting Vite developer middleware for Hot Module Replacement...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production build assets from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Neelu Vora Fashion Backend] Server booted and online!`);
    console.log(`[Access URL] http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL: Failed to boot Neelu Vora Fashion server", err);
});
