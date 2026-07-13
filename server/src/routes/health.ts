import type { RequestHandler } from "express";

import { serviceName, serviceVersion } from "../config.js";
import type { RuntimeEnv } from "../env.js";

export function createHealthHandler(env: RuntimeEnv): RequestHandler {
  return (_req, res) => {
    res.json({
      ok: true,
      service: serviceName,
      environment: env.ARALUME_ENV,
      version: serviceVersion,
    });
  };
}
