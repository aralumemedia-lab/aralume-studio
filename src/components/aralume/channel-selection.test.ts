import assert from "node:assert/strict";
import test from "node:test";

import type { Channel } from "@/contracts/types";
import { deriveChannelSelection } from "./channel-selection";

const channels: Channel[] = [
  {
    id: "ch_1",
    name: "Canal 1",
    slug: "canal-1",
    description: "",
    status: "active",
    niche: "",
    audience: "",
    language: "pt-BR",
    region: "",
    timezone: "America/Sao_Paulo",
    editorialTone: "",
    publishingFrequency: "",
    monthlyBudgetCents: 0,
    monthlyCostUsedCents: 0,
    costStatus: "healthy",
    riskLevel: "ok",
    healthScore: 100,
    activeWorkflowsCount: 0,
    pendingApprovalsCount: 0,
    connectedPlatformsCount: 0,
    lastActivityAt: "2026-07-13T03:30:00.000Z",
    createdAt: "2026-07-13T03:30:00.000Z",
    updatedAt: "2026-07-13T03:30:00.000Z",
  },
  {
    id: "ch_2",
    name: "Canal 2",
    slug: "canal-2",
    description: "",
    status: "paused",
    niche: "",
    audience: "",
    language: "pt-BR",
    region: "",
    timezone: "America/Sao_Paulo",
    editorialTone: "",
    publishingFrequency: "",
    monthlyBudgetCents: 0,
    monthlyCostUsedCents: 0,
    costStatus: "not_configured",
    riskLevel: "attention",
    healthScore: 80,
    activeWorkflowsCount: 0,
    pendingApprovalsCount: 0,
    connectedPlatformsCount: 0,
    lastActivityAt: "2026-07-13T03:30:00.000Z",
    createdAt: "2026-07-13T03:30:00.000Z",
    updatedAt: "2026-07-13T03:30:00.000Z",
  },
];

test("deriveChannelSelection keeps empty lists empty", () => {
  const result = deriveChannelSelection([], undefined, false);
  assert.equal(result.activeChannelId, undefined);
  assert.equal(result.selectionInitialized, false);
});

test("deriveChannelSelection selects the first channel on initial load", () => {
  const result = deriveChannelSelection([...channels], undefined, false);
  assert.equal(result.activeChannelId, "ch_1");
  assert.equal(result.selectionInitialized, true);
});

test("deriveChannelSelection preserves explicit all-channels selection", () => {
  const result = deriveChannelSelection([...channels], undefined, true);
  assert.equal(result.activeChannelId, undefined);
  assert.equal(result.selectionInitialized, true);
});

test("deriveChannelSelection falls back when the current channel disappears", () => {
  const result = deriveChannelSelection([channels[1]], "ch_1", true);
  assert.equal(result.activeChannelId, "ch_2");
  assert.equal(result.selectionInitialized, true);
});

test("deriveChannelSelection keeps a valid selection", () => {
  const result = deriveChannelSelection([...channels], "ch_2", true);
  assert.equal(result.activeChannelId, "ch_2");
  assert.equal(result.selectionInitialized, true);
});
