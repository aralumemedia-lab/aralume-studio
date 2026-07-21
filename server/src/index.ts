import { pathToFileURL } from "node:url";

import { defaultPort, serviceName } from "./config.js";
import { createApp } from "./app.js";
import { EnvValidationError, loadEnv } from "./env.js";
import type { OperationalRuntime } from "./operational.js";
import { attachGracefulShutdown, getServerAddress } from "./server-lifecycle.js";

export function startServer(): void {
  try {
    const env = loadEnv();
    const app = createApp({
      env,
      authTestBypass: env.ARALUME_ENV === "test" && env.ARALUME_AUTH_TEST_BYPASS === "true",
    });
    const operational = app.locals.operational as OperationalRuntime;
    const server = app.listen(defaultPort, "127.0.0.1");
    const lifecycle = attachGracefulShutdown(server, operational, console);

    server.requestTimeout = operational.policy.requestTimeoutMs;
    server.headersTimeout = Math.max(operational.policy.requestTimeoutMs + 1_000, 5_000);
    server.keepAliveTimeout = 5_000;

    server.once("listening", () => {
      const address = getServerAddress(server);
      if (address) {
        operational.setListening(address.address, address.port);
      }

      console.info(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          service: serviceName,
          environment: operational.environment,
          event: "startup_complete",
          listener: address?.address ?? "127.0.0.1",
          port: address?.port ?? defaultPort,
          ready: operational.snapshotHealth().ok,
        }),
      );
    });

    server.once("error", (error) => {
      lifecycle.dispose();
      const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
      console.error(message);
      process.exitCode = 1;
    });
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error("Backend environment validation failed.");
      console.error(JSON.stringify({ issues: error.issues }, null, 2));
      process.exitCode = 1;
      return;
    }

    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  startServer();
}
