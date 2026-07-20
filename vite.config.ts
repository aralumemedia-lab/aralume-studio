// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

function e2eIdentityPlugin(): Plugin {
  return {
    name: "aralume-e2e-identity",
    configureServer(server) {
      server.middlewares.use("/__aralume/e2e-identity", (_request, response) => {
        const runId = process.env.ARALUME_E2E_RUN_ID?.trim();
        if (process.env.ARALUME_ENV !== "test" || !runId) {
          response.statusCode = 404;
          response.end();
          return;
        }

        response.statusCode = 200;
        response.setHeader("content-type", "application/json; charset=utf-8");
        response.end(JSON.stringify({ ok: true, service: "aralume-web", runId }));
      });
    },
  };
}

export default defineConfig({
  plugins: [e2eIdentityPlugin()],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      proxy: {
        "/api": "http://127.0.0.1:3001",
      },
    },
  },
});
