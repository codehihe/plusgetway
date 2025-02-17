import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Force development mode for Replit environment
process.env.NODE_ENV = "development";

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    // Setup Vite for development
    await setupVite(app, server);

    // Try ports in sequence if default is in use
    const tryPort = async (port: number): Promise<number> => {
      try {
        await new Promise((resolve, reject) => {
          server.listen(port, "0.0.0.0")
            .once('listening', () => {
              server.removeListener('error', reject);
              resolve(port);
            })
            .once('error', (err) => {
              server.removeListener('listening', resolve);
              reject(err);
            });
        });
        return port;
      } catch (error) {
        if (error.code === 'EADDRINUSE' && port < 5010) {
          return tryPort(port + 1);
        }
        throw error;
      }
    };

    try {
      const PORT = await tryPort(5000);
      log(`Server running at http://0.0.0.0:${PORT}`);
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
})();