import type { RequestHandler } from "express";
import { createHmac } from "node:crypto";

import { serviceName, serviceVersion } from "../config.js";
import type { RuntimeEnv } from "../env.js";

export function createHealthHandler(env: RuntimeEnv): RequestHandler {
  return (req, res) => {
    const identitySecret = env.ARALUME_E2E_IDENTITY_SECRET;
    const testIdentity =
      env.ARALUME_ENV === "test" &&
      env.ARALUME_E2E_RUN_ID &&
      env.ARALUME_E2E_STARTUP_NONCE &&
      identitySecret &&
      res.socket?.localPort;
    const challenge = req.get("x-aralume-e2e-challenge")?.trim();
    const identityMac =
      testIdentity && challenge
        ? createHmac("sha256", identitySecret)
            .update(
              [
                challenge,
                serviceName,
                env.ARALUME_E2E_RUN_ID,
                String(process.pid),
                String(res.socket.localPort),
              ].join("\n"),
            )
            .digest("hex")
        : undefined;
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
            ...(identityMac ? { identityMac } : {}),
          }
        : {}),
    };
    res.json(payload);
  };
}
