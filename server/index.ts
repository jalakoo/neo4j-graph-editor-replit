import express, { type Request, Response, NextFunction } from "express";
import { fileURLToPath } from "url";
import { createServer } from 'net';
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Function to check if a port is available
  const isPortAvailable = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const testServer = createServer();
      testServer.once('error', () => {
        testServer.close();
        resolve(false);
      });
      testServer.once('listening', () => {
        testServer.close(() => resolve(true));
      });
      testServer.listen(port, '0.0.0.0');
    });
  };

  // Find an available port starting from 5000
  const findAvailablePort = async (startPort: number, maxAttempts = 10): Promise<number> => {
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i;
      if (await isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(`No available ports found between ${startPort} and ${startPort + maxAttempts - 1}`);
  };

  // Start the server on an available port
  const startServer = async (port: number): Promise<void> => {
    const availablePort = await findAvailablePort(port);
    
    return new Promise((resolve, reject) => {
      const onListen = () => {
        log(`Server is running on http://0.0.0.0:${availablePort}`);
        server.off('error', onError);
        resolve();
      };
      
      const onError = (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          log(`Port ${availablePort} is in use, trying next port...`);
          startServer(availablePort + 1).then(resolve).catch(reject);
        } else {
          reject(error);
        }
      };
      
      server.on('error', onError);
      server.listen(availablePort, '0.0.0.0', onListen);
    });
  };

  // Start the server on port 5000 or the next available port
  try {
    await startServer(5000);
  } catch (error: unknown) {
    if (error instanceof Error) {
      log('Failed to start server:', error.message);
    } else {
      log('Failed to start server: Unknown error');
    }
    process.exit(1);
  }
})();
