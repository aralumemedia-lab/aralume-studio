import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync("src/routes/media-assets.tsx", "utf8");

test("media assets route uses the real API client and surfaces loading/error/empty states", () => {
  assert.equal(routeSource.includes("@/mocks"), false);
  assert.ok(routeSource.includes('from "@/services/api-client"'));
  assert.ok(routeSource.includes("createMediaAsset"));
  assert.ok(routeSource.includes("updateMediaAsset"));
  assert.ok(routeSource.includes("saveMutation.mutate()"));
  assert.equal(routeSource.includes("saveMutation.mutateAsync()"), false);
  assert.ok(routeSource.includes("LoadingState"));
  assert.ok(routeSource.includes("ErrorState"));
  assert.ok(routeSource.includes("EmptyState"));
  assert.ok(routeSource.includes("SectionHeader"));
  assert.ok(routeSource.includes('data-testid="media-assets-form"'));
  assert.ok(routeSource.includes('data-testid="media-assets-submit"'));
  assert.ok(routeSource.includes('data-testid="media-assets-save-state"'));
  assert.ok(routeSource.includes('data-testid="media-assets-channel-summary"'));
  assert.ok(routeSource.includes('to="/ideas"'));
  assert.ok(routeSource.includes('to="/research"'));
});
