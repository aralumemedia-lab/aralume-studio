import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const contextSource = readFileSync("src/components/aralume/channel-context.tsx", "utf8");

test("ChannelProvider does not import mock channels directly", () => {
  assert.equal(contextSource.includes("@/mocks"), false);
  assert.equal(contextSource.includes("mockChannels"), false);
  assert.ok(contextSource.includes('from "@/services/channels-api"'));
  assert.ok(contextSource.includes("loading: channelsQuery.isPending"));
  assert.ok(contextSource.includes("refreshChannels: channelsQuery.refetch"));
});
