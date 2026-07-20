import type { RequestHandler } from "express";

import { serviceName, serviceVersion } from "../config.js";
import type { RuntimeEnv } from "../env.js";

export function createHealthHandler(env: RuntimeEnv): RequestHandler {
  return (_req, res) => {
    const testIdentity =
      env.ARALUME_ENV === "test" &&
      env.ARALUME_E2E_RUN_ID &&
      env.ARALUME_E2E_STARTUP_NONCE &&
      res.socket?.localPort;
    const payload = {
      ok: true,
      service: serviceName,
      environment: env.ARALUME_ENV,
      version: serviceVersion,
      ...(testIdentity
        ? {
            runId: env.ARALUME_E2E_RUN_ID,
            startupNonce: env.ARALUME_E2E_STARTUP_NONCE,
            pid: process.pid,
            port: res.socket.localPort,
          }
        : {}),
    };
    res.json(payload);
  };
}
