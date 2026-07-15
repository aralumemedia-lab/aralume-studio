import { readJsonFile, resolveStateFilePath, writeJsonFile } from "../shared/persistent-state.js";
import type {
  OAuthStateRecord,
  YouTubeRepository,
  YouTubeSeed,
  YouTubeStoredConnection,
} from "./youtube.types.js";

const clone = <T>(value: T): T => structuredClone(value);

export function createYouTubeRepository(
  seed?: YouTubeSeed,
  storageRoot?: string,
): YouTubeRepository {
  const file = resolveStateFilePath(storageRoot, "youtube-integration-state.json");
  const persisted = readJsonFile<YouTubeSeed>(file);
  const connections = new Map<string, YouTubeStoredConnection>();
  const states = new Map<string, OAuthStateRecord>();
  const initial = persisted ?? seed ?? {};
  initial.connections?.forEach((item) => connections.set(item.channelId, clone(item)));
  initial.oauthStates?.forEach((item) => states.set(item.stateHash, clone(item)));
  const persist = () =>
    writeJsonFile(file, {
      connections: [...connections.values()],
      oauthStates: [...states.values()],
    });
  return {
    getConnection: (channelId) => {
      const value = connections.get(channelId);
      return value ? clone(value) : undefined;
    },
    upsertConnection: (connection) => {
      connections.set(connection.channelId, clone(connection));
      persist();
    },
    listConnections: () => [...connections.values()].map(clone),
    getState: (stateHash) => {
      const value = states.get(stateHash);
      return value ? clone(value) : undefined;
    },
    upsertState: (state) => {
      states.set(state.stateHash, clone(state));
      persist();
    },
    consumeState: (stateHash, now) => {
      const value = states.get(stateHash);
      if (!value || value.usedAt || value.expiresAt <= now) return undefined;
      const consumed = { ...value, usedAt: now };
      states.set(stateHash, consumed);
      persist();
      return clone(consumed);
    },
  };
}
