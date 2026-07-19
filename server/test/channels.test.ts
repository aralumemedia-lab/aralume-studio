import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import type { Server } from "node:http";

import { createApp } from "../src/app.js";
import { AppError } from "../src/http/errors.js";
import { createChannelsRepository } from "../src/modules/channels/channel.repository.js";
import { createChannelsService } from "../src/modules/channels/channel.service.js";

type Harness = {
  repository: ReturnType<typeof createChannelsRepository>;
  service: ReturnType<typeof createChannelsService>;
};

function createHarness(): Harness {
  const repository = createChannelsRepository([]);
  let tick = 0;
  let nextId = 1;
  const service = createChannelsService(repository, {
    clock: () => new Date(Date.parse("2026-07-13T03:30:00.000Z") + tick++ * 1000),
    idFactory: () => String(nextId++).padStart(4, "0"),
  });

  return { repository, service };
}

async function startServer(repository = createChannelsRepository([])) {
  const logLines: string[] = [];
  const app = createApp({
    authTestBypass: true,
    env: {
      ARALUME_ENV: "test",
      ARALUME_LOG_LEVEL: "info",
    },
    logger: {
      info: (message: string) => logLines.push(message),
      warn: (message: string) => logLines.push(message),
      error: (message: string) => logLines.push(message),
    },
    channelsRepository: repository,
  });

  const server = app.listen(0);
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected TCP address");
  }

  return {
    baseUrl: `http://127.0.0.1:${(address as AddressInfo).port}`,
    logLines,
    server,
  };
}

async function stopServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

test("channels repository instances do not share state", () => {
  const first = createChannelsRepository([]);
  const second = createChannelsRepository([]);

  const serviceA = createChannelsService(first, {
    clock: () => new Date("2026-07-13T03:30:00.000Z"),
    idFactory: () => "shared-1",
  });

  serviceA.createChannel({
    name: "Canal A",
    slug: "canal-a",
    status: "draft",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
  });

  assert.equal(first.listChannels().length, 1);
  assert.equal(second.listChannels().length, 0);
});

test("service creates, lists, updates and resolves settings", () => {
  const { repository, service } = createHarness();

  const created = service.createChannel({
    name: "Canal Operacional",
    slug: "Canal-Operacional",
    status: "draft",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
  });

  assert.equal(created.id, "ch_0001");
  assert.equal(created.slug, "canal-operacional");
  assert.equal(created.description, "");
  assert.equal(created.costStatus, "not_configured");

  assert.equal(service.listChannels().length, 1);
  assert.equal(service.getChannel(created.id).name, "Canal Operacional");
  assert.equal(service.getChannelSettings(created.id).channelId, created.id);

  const updated = service.updateChannel(created.id, {
    name: "Canal Operacional 2",
    status: "warning",
  });

  assert.equal(updated.name, "Canal Operacional 2");
  assert.equal(updated.status, "warning");
  assert.equal(updated.costStatus, "attention");
  assert.equal(updated.createdAt, created.createdAt);
  assert.notEqual(updated.updatedAt, created.updatedAt);
  assert.equal(updated.riskLevel, "warning");

  const activated = service.updateChannel(created.id, {
    status: "active",
  });

  assert.equal(activated.status, "active");
  assert.equal(activated.costStatus, "healthy");
  assert.equal(activated.riskLevel, "ok");

  assert.equal(repository.listChannels().length, 1);
});

test("service rejects duplicate slugs", () => {
  const { service } = createHarness();

  service.createChannel({
    name: "Canal A",
    slug: "canal-a",
    status: "draft",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
  });

  assert.throws(
    () =>
      service.createChannel({
        name: "Canal B",
        slug: "CANAL-A",
        status: "active",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
      }),
    (error) => error instanceof AppError && error.code === "CONFLICT",
  );
});

test("GET /api/channels and write endpoints work with standard envelopes", async () => {
  const repository = createChannelsRepository([]);
  const { baseUrl, server } = await startServer(repository);

  try {
    const listResponse = await fetch(`${baseUrl}/api/channels`);
    const listPayload = (await listResponse.json()) as {
      data: unknown[];
      meta: {
        requestId: string;
        generatedAt: string;
        total: number;
        page: number;
        pageSize: number;
      };
    };

    assert.equal(listResponse.status, 200);
    assert.equal(listPayload.data.length, 0);
    assert.equal(listPayload.meta.total, 0);
    assert.equal(listPayload.meta.page, 1);
    assert.equal(listPayload.meta.pageSize, 0);
    assert.ok(listPayload.meta.requestId);

    const createResponse = await fetch(`${baseUrl}/api/channels`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Canal Teste",
        slug: "Canal-Teste",
        status: "draft",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
      }),
    });
    const created = (await createResponse.json()) as {
      data: {
        id: string;
        slug: string;
        name: string;
        status: string;
        createdAt: string;
        updatedAt: string;
      };
      meta: { requestId: string; generatedAt: string };
    };

    assert.equal(createResponse.status, 201);
    assert.equal(created.data.slug, "canal-teste");
    assert.equal(created.data.name, "Canal Teste");
    assert.equal(created.data.status, "draft");
    assert.ok(created.data.id.startsWith("ch_"));
    assert.ok(created.meta.requestId);

    const getResponse = await fetch(`${baseUrl}/api/channels/${created.data.id}`);
    const found = (await getResponse.json()) as { data: { id: string; name: string } };
    assert.equal(getResponse.status, 200);
    assert.equal(found.data.id, created.data.id);
    assert.equal(found.data.name, "Canal Teste");

    const patchResponse = await fetch(`${baseUrl}/api/channels/${created.data.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Canal Atualizado", status: "active" }),
    });
    const patched = (await patchResponse.json()) as {
      data: { name: string; status: string; createdAt: string };
    };
    assert.equal(patchResponse.status, 200);
    assert.equal(patched.data.name, "Canal Atualizado");
    assert.equal(patched.data.status, "active");
    assert.equal(patched.data.createdAt, created.data.createdAt);

    const settingsResponse = await fetch(`${baseUrl}/api/channels/${created.data.id}/settings`);
    const settings = (await settingsResponse.json()) as {
      data: { channelId: string; id: string; averageVideoDurationSeconds: number };
    };
    assert.equal(settingsResponse.status, 200);
    assert.equal(settings.data.channelId, created.data.id);
    assert.equal(settings.data.id, `cs_${created.data.id}`);
    assert.equal(settings.data.averageVideoDurationSeconds, 600);

    const profileResponse = await fetch(`${baseUrl}/api/channels/${created.data.id}/profile`);
    const profile = (await profileResponse.json()) as {
      data: {
        channel: { id: string; language: string };
        editorialRules: { minimumSources: number };
      };
    };
    assert.equal(profileResponse.status, 200);
    assert.equal(profile.data.channel.id, created.data.id);
    assert.equal(profile.data.editorialRules.minimumSources, 3);

    const profilePatchResponse = await fetch(`${baseUrl}/api/channels/${created.data.id}/profile`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        editorialTone: "Didatico",
        language: "en-US",
        audience: "Publico A",
        allowedFormats: ["horizontal", "vertical"],
        editorialRules: {
          minimumSources: 4,
          prohibitedClaims: ["claim-a"],
          complianceNotes: ["nota-a"],
        },
      }),
    });
    const profilePatch = (await profilePatchResponse.json()) as {
      data: {
        channel: { language: string; audience: string };
        editorialRules: { minimumSources: number };
      };
      meta: { requestId: string };
    };
    assert.equal(profilePatchResponse.status, 200);
    assert.equal(profilePatch.data.channel.language, "en-US");
    assert.equal(profilePatch.data.editorialRules.minimumSources, 4);
    assert.ok(profilePatch.meta.requestId);

    const auditResponse = await fetch(`${baseUrl}/api/audit-logs?channelId=${created.data.id}`);
    const auditJson = (await auditResponse.json()) as {
      data: Array<{ action: string; entityType: string; requestId?: string }>;
    };
    assert.equal(auditResponse.status, 200);
    assert.equal(
      auditJson.data.some((entry) => entry.action === "channel.profile.updated"),
      true,
    );
  } finally {
    await stopServer(server);
  }
});

test("channels endpoints reject invalid or missing resources without leaking stack traces", async () => {
  const { baseUrl, server } = await startServer();

  try {
    const invalidCreate = await fetch(`${baseUrl}/api/channels`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "",
        slug: "invalid slug",
        status: "draft",
        timezone: "not-a-zone",
        language: "pt-BR",
      }),
    });
    const invalidCreatePayload = (await invalidCreate.json()) as {
      error: {
        code: string;
        message: string;
        details: { issues: Array<{ path: string; code: string; message: string }> };
      };
    };

    assert.equal(invalidCreate.status, 400);
    assert.equal(invalidCreatePayload.error.code, "VALIDATION_ERROR");
    assert.equal(JSON.stringify(invalidCreatePayload).includes("stack"), false);
    assert.ok(invalidCreatePayload.error.details.issues.length >= 1);

    const missing = await fetch(`${baseUrl}/api/channels/does-not-exist`);
    const missingPayload = (await missing.json()) as {
      error: { code: string; message: string; details: { id: string } };
    };
    assert.equal(missing.status, 404);
    assert.equal(missingPayload.error.code, "NOT_FOUND");
    assert.equal(missingPayload.error.message, "Channel not found");

    const emptyPatch = await fetch(`${baseUrl}/api/channels/does-not-exist`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const emptyPatchPayload = (await emptyPatch.json()) as {
      error: { code: string };
    };
    assert.equal(emptyPatch.status, 400);
    assert.equal(emptyPatchPayload.error.code, "VALIDATION_ERROR");

    const immutablePatch = await fetch(`${baseUrl}/api/channels/does-not-exist`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "change-me" }),
    });
    const immutablePatchPayload = (await immutablePatch.json()) as {
      error: { code: string };
    };
    assert.equal(immutablePatch.status, 400);
    assert.equal(immutablePatchPayload.error.code, "VALIDATION_ERROR");
  } finally {
    await stopServer(server);
  }
});
