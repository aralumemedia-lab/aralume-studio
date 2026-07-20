import type { RequestHandler } from "express";
import { createHmac } from "node:crypto";

import { serviceName, serviceVersion } from "../config.js";
import type { RuntimeEnv } from "../env.js";
import { createE2EIdentityChallengeGuard } from "./e2e-identity-challenge.js";

export function createHealthHandler(env: RuntimeEnv): RequestHandler {
  const challengeGuard = createE2EIdentityChallengeGuard();
  return (req, res) => {
    const identitySecret = env.ARALUME_E2E_IDENTITY_SECRET;
    const runId = env.ARALUME_E2E_RUN_ID;
    const startupNonce = env.ARALUME_E2E_STARTUP_NONCE;
    const port = res.socket?.localPort;
    const testIdentity =
      env.ARALUME_ENV === "test" && runId && startupNonce && identitySecret && port;
    const challenge = req.get("x-aralume-e2e-challenge")?.trim();
    const identityMac =
      testIdentity && challenge && challengeGuard.consume(runId, challenge)
        ? createHmac("sha256", identitySecret)
            .update([challenge, serviceName, runId, String(process.pid), String(port)].join("\n"))
            .digest("hex")
        : undefined;
    const payload = {
      ok: true,
      service: serviceName,
      environment: env.ARALUME_ENV,
      version: serviceVersion,
      ...(testIdentity
        ? {
            runId,
            startupNonce,
            pid: process.pid,
            port: res.socket.localPort,
            ...(identityMac ? { identityMac } : {}),
          }
        : {}),
    };
    res.json(payload);
  };
}
