import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync("src/routes/clips.tsx", "utf8");

test("clips route uses real video and derived-clip APIs with operational states", () => {
  assert.equal(routeSource.includes("@/mocks"), false);
  assert.ok(routeSource.includes('from "@/services/api-client"'));
  assert.ok(routeSource.includes("getVideoAssets"));
  assert.ok(routeSource.includes("getDerivedClips"));
  assert.ok(routeSource.includes("createDerivedClip"));
  assert.ok(routeSource.includes("LoadingState"));
  assert.ok(routeSource.includes("ErrorState"));
  assert.ok(routeSource.includes("EmptyState"));
  assert.ok(routeSource.includes("mutate("));
  assert.equal(routeSource.includes("mutateAsync"), false);
});

test("videos route does not leave render mutations as unhandled promises", () => {
  const videosRouteSource = readFileSync("src/routes/videos.tsx", "utf8");

  assert.equal(videosRouteSource.includes("mutateAsync"), false);
  assert.ok(videosRouteSource.includes("createRenderMutation.mutate("));
});
