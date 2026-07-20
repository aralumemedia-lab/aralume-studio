const DEFAULT_TTL_MS = 5_000;
const MAX_CONSUMED_CHALLENGES = 1_024;

function parseIssuedAt(challenge: string) {
  const match = /^([0-9a-z]+)\.([0-9a-f]{64})$/i.exec(challenge);
  if (!match) {
    return null;
  }

  const issuedAt = Number.parseInt(match[1], 36);
  return Number.isSafeInteger(issuedAt) ? issuedAt : null;
}

export function createE2EIdentityChallengeGuard(ttlMs = DEFAULT_TTL_MS) {
  const consumed = new Map<string, number>();

  function prune(now: number) {
    for (const [key, expiresAt] of consumed) {
      if (expiresAt <= now) {
        consumed.delete(key);
      }
    }
  }

  return {
    consume(runId: string, challenge: string, now = Date.now()) {
      prune(now);
      const issuedAt = parseIssuedAt(challenge);
      if (issuedAt === null || issuedAt > now + 1_000 || now - issuedAt > ttlMs) {
        return false;
      }

      const key = runId + "\n" + challenge;
      if (consumed.has(key)) {
        return false;
      }

      while (consumed.size >= MAX_CONSUMED_CHALLENGES) {
        const oldest = consumed.keys().next().value;
        if (oldest === undefined) {
          break;
        }
        consumed.delete(oldest);
      }
      consumed.set(key, issuedAt + ttlMs);
      return true;
    },
    size() {
      prune(Date.now());
      return consumed.size;
    },
  };
}
