import type { RequestHandler } from "express";

import { serviceName, serviceVersion } from "../config.js";
import type { RuntimeEnv } from "../env.js";

export function createHealthHandler(env: RuntimeEnv): RequestHandler {
  return (_req, res) => {
    const payload = {
      ok: true,
      service: serviceName,
      environment: env.ARALUME_ENV,
      version: serviceVersion,
      ...(env.ARALUME_E2E_RUN_ID ? { runId: env.ARALUME_E2E_RUN_ID } : {}),
    };
    res.json(payload);
  };
}
