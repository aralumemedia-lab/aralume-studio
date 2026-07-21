import type { RequestHandler } from "express";
import { createHmac } from "node:crypto";

import { serviceName } from "../config.js";
import type { RuntimeEnv } from "../env.js";
import type { OperationalRuntime } from "../operational.js";
import {
  createOperationalLiveHandler,
  createOperationalMetricsHandler,
  createOperationalReadyHandler,
} from "../operational.js";
import { createE2EIdentityChallengeGuard } from "./e2e-identity-challenge.js";

export function createHealthHandler(env: RuntimeEnv, runtime: OperationalRuntime): RequestHandler {
  const challengeGuard = createE2EIdentityChallengeGuard();
  return (req, res) => {
    const identitySecret = env.ARALUME_E2E_IDENTITY_SECRET;
    const runId = env.ARALUME_E2E_RUN_ID;
    const startupNonce = env.ARALUME_E2E_STARTUP_NONCE;
    const port = res.socket?.localPort;
    const testIdentity =
      env.ARALUME_ENV === "test" && runId && startupNonce && identitySecret && port;
    const issuedChallenge =
      testIdentity && req.get("x-aralume-e2e-issue-challenge") === "1"
        ? challengeGuard.issue(runId)
        : null;
    const challenge = req.get("x-aralume-e2e-challenge")?.trim();
    const identityMac =
      testIdentity && challenge && challengeGuard.consume(runId, challenge)
        ? createHmac("sha256", identitySecret)
            .update([challenge, serviceName, runId, String(process.pid), String(port)].join("\n"))
            .digest("hex")
        : undefined;
    const snapshot = runtime.snapshotHealth();

    const payload = {
      ...snapshot,
      ...(testIdentity
        ? {
            runId,
            startupNonce,
            pid: process.pid,
            port: res.socket.localPort,
            ...(issuedChallenge ? { identityChallenge: issuedChallenge } : {}),
            ...(identityMac ? { identityMac } : {}),
          }
        : {}),
    };
    res.json(payload);
  };
}

export const createLiveHandler = createOperationalLiveHandler;
export const createReadyHandler = createOperationalReadyHandler;
export const createMetricsHandler = createOperationalMetricsHandler;
