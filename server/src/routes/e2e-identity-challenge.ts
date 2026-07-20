import { randomBytes } from "node:crypto";

const DEFAULT_TTL_MS = 5_000;
const MAX_ISSUED_CHALLENGES = 1_024;

function parseIssuedAt(challenge: string) {
  const match = /^([0-9a-z]+)\.([0-9a-f]{64})$/i.exec(challenge);
  if (!match) {
    return null;
  }

  const issuedAt = Number.parseInt(match[1], 36);
  return Number.isSafeInteger(issuedAt) ? issuedAt : null;
}

export function createE2EIdentityChallengeGuard(ttlMs = DEFAULT_TTL_MS) {
  const issued = new Map<string, { expiresAt: number; consumed: boolean }>();

  function prune(now: number) {
    for (const [key, state] of issued) {
      if (state.expiresAt <= now) {
        issued.delete(key);
      }
    }
  }

  return {
    issue(runId: string, now = Date.now()) {
      prune(now);
      if (issued.size >= MAX_ISSUED_CHALLENGES) {
        return null;
      }
      const challenge = now.toString(36) + "." + randomBytes(32).toString("hex");
      issued.set(runId + "\n" + challenge, {
        expiresAt: now + ttlMs,
        consumed: false,
      });
      return challenge;
    },
    consume(runId: string, challenge: string, now = Date.now()) {
      prune(now);
      const issuedAt = parseIssuedAt(challenge);
      if (issuedAt === null || issuedAt > now + 1_000 || now - issuedAt > ttlMs) {
        return false;
      }

      const key = runId + "\n" + challenge;
      const state = issued.get(key);
      if (!state || state.consumed) {
        return false;
      }
      state.consumed = true;
      return true;
    },
    size() {
      prune(Date.now());
      return issued.size;
    },
  };
}
