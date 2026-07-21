// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createHmac } from "node:crypto";
import type { Plugin } from "vite";
import { createE2EIdentityChallengeGuard } from "./server/src/routes/e2e-identity-challenge";

function stripTanStackDevtoolsSourceAttributes(): Plugin {
  return {
    name: "aralume-strip-tanstack-devtools-source-attributes",
    enforce: "post",
    transform(code, id) {
      if (!/\.[cm]?[jt]sx?$/.test(id) || !code.includes("data-tsd-source")) {
        return null;
      }

      const transformed = code.replace(/\sdata-tsd-source="[^"]*"/g, "");
      if (transformed === code) {
        return null;
      }

      return {
        code: transformed,
        map: null,
      };
    },
  };
}

function e2eIdentityPlugin(): Plugin {
  const challengeGuard = createE2EIdentityChallengeGuard();
  return {
    name: "aralume-e2e-identity",
    configureServer(server) {
      server.middlewares.use("/__aralume/e2e-identity", (request, response) => {
        const runId = process.env.ARALUME_E2E_RUN_ID?.trim();
        const identitySecret = process.env.ARALUME_E2E_IDENTITY_SECRET?.trim();
        if (process.env.ARALUME_ENV !== "test" || !runId) {
          response.statusCode = 404;
          response.end();
          return;
        }

        const port = response.socket?.localPort;
        const issuedChallenge =
          identitySecret && request.headers["x-aralume-e2e-issue-challenge"] === "1"
            ? challengeGuard.issue(runId)
            : null;
        const challenge = request.headers["x-aralume-e2e-challenge"]?.toString().trim();
        const identityMac =
          identitySecret && challenge && port && challengeGuard.consume(runId, challenge)
            ? createHmac("sha256", identitySecret)
                .update(
                  [challenge, "aralume-web", runId, String(process.pid), String(port)].join("\n"),
                )
                .digest("hex")
            : undefined;

        response.statusCode = 200;
        response.setHeader("content-type", "application/json; charset=utf-8");
        response.end(
          JSON.stringify({
            ok: true,
            service: "aralume-web",
            runId,
            startupNonce: process.env.ARALUME_E2E_STARTUP_NONCE,
            pid: process.pid,
            port,
            ...(issuedChallenge ? { identityChallenge: issuedChallenge } : {}),
            ...(identityMac ? { identityMac } : {}),
          }),
        );
      });
    },
  };
}

export default defineConfig({
  plugins: [stripTanStackDevtoolsSourceAttributes(), e2eIdentityPlugin()],
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
