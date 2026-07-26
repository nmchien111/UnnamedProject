import "reflect-metadata";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import path, { resolve } from "path";
import passport from "passport";
import session from "express-session";
import DatabaseConfig from "./config/database";
import { entities } from "./database/models";
import logger from "./shared/utils/logger";
import corsMiddleware from "@/shared//middleware/cors.middleware";
import cookieParser from "cookie-parser";
import { initializePassport } from "./config/passport";
import V1Router from "./routes/v1.route";
import { autoClearTempJob } from "./job/autoClearTemp.job";
import { errorHandler } from "./shared/middleware/error.middleware";
import { createServer } from "http";
import Socket from "@/config/socket";
import { config } from "./config/env";

class App {
  public app: express.Application;
  private isInitialized: boolean = false;

  constructor() {
    this.app = express();
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.initializeDatabase();
      this.initializeMiddlewares();
      this.initializeRoutes();
      this.initializeErrorHandling();
      this.initializeJobs();
      this.isInitialized = true;
    } catch (error) {
      logger.error("Failed to initialize app:", error);
      process.exit(1);
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      await DatabaseConfig.initialize();
      logger.info("🎲 Database connected successfully");

      const fullRepo = Object.fromEntries(
        entities.map((entity) => [
          entity.name,
          DatabaseConfig.getRepository(entity),
        ]),
      );

      this.app.use((req, res, next) => {
        res.locals.fullRepo = fullRepo;
        res.locals.dataSource = DatabaseConfig;
        next();
      });

      // if (!RedisConfig.isConnected()) {
      //   await RedisConfig.connect();
      // }
    } catch (error) {
      logger.error("Database connection failed:", error);
      process.exit(1);
    }
  }

  private async initializeMiddlewares(): Promise<void> {
    this.app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
    this.app.use(corsMiddleware);
    this.app.use(compression() as any);
    this.app.use(morgan("combined"));
    this.app.use(express.json({ limit: "100mb" }));
    this.app.use(express.urlencoded({ limit: "100mb", extended: true }));
    this.app.use(cookieParser());

    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || "your-secret-key",
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24, // 1 day
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        },
      }),
    );

    this.app.use(passport.initialize());
    this.app.use(passport.session()); // ← Quan trọng!
    initializePassport();
    logger.info("✅ Passport initialized");
  }

  private async initializeRoutes(): Promise<void> {
    this.app.use("/v1", V1Router);
    this.app.get("/test", async (req, res) => {
      res.status(200).json({ message: "Test function executed" });
    });
    this.app.use("/", (req, res) => {
      res.status(200).json({
        status: "Welcome",
        message: "Welcome to the API",
        data: [],
      });
    });
  }

  private initializeJobs(): void {
    autoClearTempJob.start();
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async listen(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // ✅ Tạo HTTP server duy nhất
    const httpServer = createServer(this.app);

    // Gắn socket.io vào server đó
    Socket.init(httpServer);

    // Chạy server chung
    httpServer.listen(config.PORT, () => {
      logger.info(`🚀 Server running on port ${config.PORT}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
    });
  }
}

const app = new App();
// app.listen();

// process.on("SIGINT", async () => {
//   logger.info("SIGINT received. Shutting down gracefully...");
//   await app.shutdown();
// });
// process.on("SIGTERM", async () => {
//   logger.info("SIGTERM received. Shutting down gracefully...");
//   await app.shutdown();
// });
// process.on("uncaughtException", async (error) => {
//   logger.error("Uncaught Exception:", error);
//   await app.shutdown();
// });
// process.on("unhandledRejection", async (reason, promise) => {
//   logger.error("Unhandled Rejection at:", promise, "reason:", reason);
//   await app.shutdown();
// });
