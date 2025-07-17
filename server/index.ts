import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import { startupService } from "./services/startupService";
import { permissionService } from "./services/permissionService";
import { dbInitService } from "./services/dbInit";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint for deployment readiness
app.get("/health", async (req, res) => {
  try {
    // Check database connection with timeout
    const client = (await Promise.race([
      pool.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database connection timeout")), 5000)
      ),
    ])) as any;
    await client.query("SELECT 1");
    client.release();

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    log(`Health check failed: ${error}`, "health");
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
});

// Readiness check endpoint
app.get("/ready", (req, res) => {
  res.status(200).json({
    status: "ready",
    timestamp: new Date().toISOString(),
  });
});

// Startup metrics endpoint for monitoring
app.get("/metrics", (req, res) => {
  res.status(200).json({
    startupMetrics: startupService.getStartupMetrics(),
    startupDuration: startupService.getStartupDuration(),
    timestamp: new Date().toISOString(),
  });
});

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

let server: any = null;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  log(`Received ${signal}, starting graceful shutdown...`, "shutdown");

  if (server) {
    server.close(async (err: any) => {
      if (err) {
        log(`Error during server shutdown: ${err}`, "shutdown");
      } else {
        log("Server closed successfully", "shutdown");
      }

      // Close database pool
      try {
        await pool.end();
        log("Database pool closed successfully", "shutdown");
      } catch (dbErr) {
        log(`Error closing database pool: ${dbErr}`, "shutdown");
      }

      process.exit(err ? 1 : 0);
    });
  } else {
    process.exit(0);
  }
};

// Register graceful shutdown handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

(async () => {
  try {
    log("Starting application initialization...", "startup");
    startupService.markStartupEvent("initialization_start");

    // Test database connection first
    try {
      await startupService.measureAsync("database_test", async () => {
        const client = (await Promise.race([
          pool.connect(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Database connection timeout")),
              10000
            )
          ),
        ])) as any;
        await client.query("SELECT 1");
        client.release();
        log("Database connection verified", "startup");
      });
      startupService.markStartupEvent("database_connected");
    } catch (dbError) {
      log(`Database connection failed: ${dbError}`, "startup");
      // Continue startup without database for now
    }

    // Initialize database schema
    try {
      await startupService.measureAsync("database_init", async () => {
        await dbInitService.initializeDatabase();
      });
      startupService.markStartupEvent("database_initialized");
    } catch (dbInitError) {
      log(`Database initialization failed: ${dbInitError}`, "startup");
      // Continue startup - might be a connection issue that resolves
    }

    // Register routes and initialize services
    server = await startupService.measureAsync(
      "route_registration",
      async () => {
        return await registerRoutes(app);
      }
    );
    startupService.markStartupEvent("routes_registered");

    // Initialize permission system with error handling
    try {
      await startupService.measureAsync("permission_init", async () => {
        await permissionService.initializePermissions();
      });
      startupService.markStartupEvent("permissions_initialized");
    } catch (permError) {
      log(`Permission initialization failed: ${permError}`, "startup");
      // Continue startup - permissions can be initialized later
    }

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // Setup Vite in development or serve static files in production
    if (app.get("env") === "development") {
      await startupService.measureAsync("vite_setup", async () => {
        await setupVite(app, server);
      });
      startupService.markStartupEvent("vite_setup_complete");
    } else {
      startupService.measureSync("static_setup", () => {
        serveStatic(app);
      });
      startupService.markStartupEvent("static_setup_complete");
    }

    // Start the server
    const port = process.env.PORT || 5000;
    server.listen(parseInt(port.toString()), "127.0.0.1", () => {
      startupService.markStartupEvent("server_listening");
      log(`Server is ready and serving on port ${port}`, "startup");
      startupService.logStartupComplete();
    });
  } catch (error) {
    log(`Failed to start application: ${error}`, "startup");
    process.exit(1);
  }
})();
