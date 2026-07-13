import express from "express";

import { loadEnv, type RuntimeEnv } from "./env.js";
import {
  errorHandlerMiddleware,
  jsonParserMiddleware,
  notFoundMiddleware,
  requestContextMiddleware,
  requestLoggerMiddleware,
} from "./http/middleware.js";
import { createHealthHandler } from "./routes/health.js";

export type CreateAppOptions = {
  env?: RuntimeEnv;
  logger?: Pick<Console, "info" | "warn" | "error">;
};

export function createApp(options: CreateAppOptions = {}) {
  const env = options.env ?? loadEnv();
  const app = express();

  app.disable("x-powered-by");
  app.use(requestContextMiddleware());
  app.use(requestLoggerMiddleware(env.ARALUME_LOG_LEVEL, options.logger ?? console));
  app.use(jsonParserMiddleware());
  app.get("/health", createHealthHandler(env));
  app.use(notFoundMiddleware());
  app.use(errorHandlerMiddleware);

  return app;
}
