import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import test from "node:test";

import { createApp } from "../src/app.js";

test("cockpit projections use real repositories and keep channels isolated", async () => {
  const app = createApp({
    authTestBypass: true,
    env: { ARALUME_ENV: "test", ARALUME_LOG_LEVEL: "error" },
  });
  const server = app.listen(0);
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const dashboardResponse = await fetch(`${baseUrl}/api/dashboard/summary?channelId=ch_historia`);
    assert.equal(dashboardResponse.status, 200);
    const dashboard = (await dashboardResponse.json()) as {
      data: { costByChannel: { channelId: string }[]; activeWorkflows: number };
      meta: { requestId: string };
    };
    assert.equal(dashboard.meta.requestId.length > 0, true);
    assert.equal(
      dashboard.data.costByChannel.every((row) => row.channelId === "ch_historia"),
      true,
    );
    assert.equal(dashboard.data.activeWorkflows > 0, true);

    const agentsResponse = await fetch(`${baseUrl}/api/agents?channelId=ch_historia`);
    assert.equal(agentsResponse.status, 200);
    const agents = (await agentsResponse.json()) as { data: { id: string }[] };
    assert.ok(agents.data.some((agent) => agent.id === "agent_research"));

    const snapshotResponse = await fetch(
      `${baseUrl}/api/agent-office/snapshot?channelId=ch_historia`,
    );
    assert.equal(snapshotResponse.status, 200);
    const snapshot = (await snapshotResponse.json()) as {
      data: { agents: { channelId: string }[]; workflows: { id: string }[] };
    };
    assert.equal(
      snapshot.data.agents.every((agent) => agent.channelId === "ch_historia"),
      true,
    );
    assert.ok(snapshot.data.workflows.some((workflow) => workflow.id === "wf_idea_01"));

    const crossChannelResponse = await fetch(
      `${baseUrl}/api/workflows/wf_idea_01?channelId=ch_curiosidades`,
    );
    assert.equal(crossChannelResponse.status, 404);
    const crossChannel = (await crossChannelResponse.json()) as {
      error: { message: string };
    };
    assert.equal(crossChannel.error.message, "Workflow not found");

    const invalidQueryResponse = await fetch(`${baseUrl}/api/workflows/wf_idea_01`);
    assert.equal(invalidQueryResponse.status, 400);

    const unknownChannelResponse = await fetch(
      `${baseUrl}/api/dashboard/summary?channelId=ch_unknown`,
    );
    assert.equal(unknownChannelResponse.status, 404);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
  }
});
