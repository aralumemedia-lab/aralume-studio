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
import { createChannelsRepository } from "./modules/channels/channel.repository.js";
import { createChannelsRouter } from "./modules/channels/channel.routes.js";
import { createChannelsService } from "./modules/channels/channel.service.js";
import type { ChannelsRepository } from "./modules/channels/channel.types.js";
import { channelDemoSeed } from "./modules/channels/channel.seed.js";
import { createEditorialRepository } from "./modules/editorial/editorial.repository.js";
import { createEditorialRouter } from "./modules/editorial/editorial.routes.js";
import { createEditorialService } from "./modules/editorial/editorial.service.js";
import type { EditorialRepository } from "./modules/editorial/editorial.types.js";
import { editorialDemoSeed } from "./modules/editorial/editorial.seed.js";

export type CreateAppOptions = {
  env?: RuntimeEnv;
  logger?: Pick<Console, "info" | "warn" | "error">;
  channelsRepository?: ChannelsRepository;
  editorialRepository?: EditorialRepository;
};

export function createApp(options: CreateAppOptions = {}) {
  const env = options.env ?? loadEnv();
  const channelsRepository =
    options.channelsRepository ?? createChannelsRepository(channelDemoSeed);
  const editorialRepository =
    options.editorialRepository ??
    (options.channelsRepository
      ? createEditorialRepository()
      : createEditorialRepository(editorialDemoSeed));
  const channelsService = createChannelsService(channelsRepository);
  const editorialService = createEditorialService(editorialRepository, channelsRepository);
  const app = express();

  app.disable("x-powered-by");
  app.use(requestContextMiddleware());
  app.use(requestLoggerMiddleware(env.ARALUME_LOG_LEVEL, options.logger ?? console));
  app.use(jsonParserMiddleware());
  app.get("/health", createHealthHandler(env));
  app.use("/api/channels", createChannelsRouter(channelsService));
  app.use("/api", createEditorialRouter(editorialService));
  app.use(notFoundMiddleware());
  app.use(errorHandlerMiddleware);

  return app;
}
