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
import { createAuditRepository } from "./modules/audit/audit.repository.js";
import { createAuditRouter } from "./modules/audit/audit.routes.js";
import { createAuditService } from "./modules/audit/audit.service.js";
import type { AuditRepository } from "./modules/audit/audit.types.js";
import { auditDemoSeed } from "./modules/audit/audit.seed.js";
import { createEditorialRepository } from "./modules/editorial/editorial.repository.js";
import { createEditorialRouter } from "./modules/editorial/editorial.routes.js";
import { createEditorialService } from "./modules/editorial/editorial.service.js";
import type { EditorialRepository } from "./modules/editorial/editorial.types.js";
import { editorialDemoSeed } from "./modules/editorial/editorial.seed.js";
import { createCostsRepository } from "./modules/costs/costs.repository.js";
import { createCostsRouter } from "./modules/costs/costs.routes.js";
import { createCostsService } from "./modules/costs/costs.service.js";
import type { CostsRepository } from "./modules/costs/costs.types.js";
import { costsDemoSeed } from "./modules/costs/costs.seed.js";
import { createGovernanceRepository } from "./modules/governance/governance.repository.js";
import { createGovernanceRouter } from "./modules/governance/governance.routes.js";
import { createGovernanceService } from "./modules/governance/governance.service.js";
import type { GovernanceRepository } from "./modules/governance/governance.types.js";
import { governanceDemoSeed } from "./modules/governance/governance.seed.js";

export type CreateAppOptions = {
  env?: RuntimeEnv;
  logger?: Pick<Console, "info" | "warn" | "error">;
  channelsRepository?: ChannelsRepository;
  editorialRepository?: EditorialRepository;
  governanceRepository?: GovernanceRepository;
  costsRepository?: CostsRepository;
  auditRepository?: AuditRepository;
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
  const governanceRepository =
    options.governanceRepository ??
    (!options.channelsRepository && !options.editorialRepository
      ? createGovernanceRepository(governanceDemoSeed)
      : createGovernanceRepository());
  const auditRepository =
    options.auditRepository ??
    (!options.channelsRepository ? createAuditRepository(auditDemoSeed) : createAuditRepository());
  const costsRepository =
    options.costsRepository ??
    (!options.channelsRepository ? createCostsRepository(costsDemoSeed) : createCostsRepository());
  const channelsService = createChannelsService(channelsRepository);
  const editorialService = createEditorialService(editorialRepository, channelsRepository);
  const governanceService = createGovernanceService(
    governanceRepository,
    editorialRepository,
    channelsRepository,
  );
  const auditService = createAuditService(auditRepository);
  const costsService = createCostsService(costsRepository, {
    channelsRepository,
    auditRepository,
  });
  const app = express();

  app.disable("x-powered-by");
  app.use(requestContextMiddleware());
  app.use(requestLoggerMiddleware(env.ARALUME_LOG_LEVEL, options.logger ?? console));
  app.use(jsonParserMiddleware());
  app.get("/health", createHealthHandler(env));
  app.use("/api/channels", createChannelsRouter(channelsService));
  app.use("/api", createEditorialRouter(editorialService));
  app.use("/api", createGovernanceRouter(governanceService));
  app.use("/api", createCostsRouter(costsService));
  app.use("/api", createAuditRouter(auditService));
  app.use(notFoundMiddleware());
  app.use(errorHandlerMiddleware);

  return app;
}
