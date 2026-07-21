import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import type { Socket } from "node:net";

import { serviceName } from "./config.js";
import type { OperationalRuntime } from "./operational.js";

type StructuredLogger = Pick<Console, "info" | "warn" | "error">;

type ShutdownController = {
  shutdown(signal?: NodeJS.Signals): Promise<void>;
  dispose(): void;
};

export function attachGracefulShutdown(
  server: Server,
  runtime: OperationalRuntime,
  logger: StructuredLogger = console,
): ShutdownController {
  const sockets = new Set<Socket>();
  let shutdownPromise: Promise<void> | null = null;

  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.once("close", () => sockets.delete(socket));
  });

  const shutdown = async (signal: NodeJS.Signals = "SIGTERM") => {
    if (!shutdownPromise) {
      shutdownPromise = performShutdown(signal);
    }

    return shutdownPromise;
  };

  const onSigterm = () => {
    shutdown("SIGTERM").catch((error) => {
      logger.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          service: serviceName,
          environment: runtime.environment,
          event: "shutdown_failed",
          message: error instanceof Error ? error.message : String(error),
        }),
      );
      process.exitCode = 1;
    });
  };

  const onSigint = () => {
    shutdown("SIGINT").catch((error) => {
      logger.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          service: serviceName,
          environment: runtime.environment,
          event: "shutdown_failed",
          message: error instanceof Error ? error.message : String(error),
        }),
      );
      process.exitCode = 1;
    });
  };

  process.once("SIGTERM", onSigterm);
  process.once("SIGINT", onSigint);

  async function performShutdown(signal: NodeJS.Signals): Promise<void> {
    runtime.beginShutdown(signal);
    logger.info(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: serviceName,
        environment: runtime.environment,
        event: "shutdown_started",
        signal,
        listener: runtime.state.listenerPort,
      }),
    );

    const closePromise = new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    const timeoutPromise = new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        for (const socket of sockets) {
          socket.destroy();
        }
        if (typeof server.closeAllConnections === "function") {
          server.closeAllConnections();
        }
        resolve();
      }, runtime.policy.shutdownTimeoutMs);
      closePromise.finally(() => clearTimeout(timer));
    });

    await Promise.race([closePromise, timeoutPromise]);
    await closePromise.catch((error) => {
      throw error;
    });
    runtime.completeShutdown();
    logger.info(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        service: serviceName,
        environment: runtime.environment,
        event: "shutdown_complete",
        signal,
        openSockets: sockets.size,
      }),
    );
  }

  return {
    shutdown,
    dispose() {
      process.off("SIGTERM", onSigterm);
      process.off("SIGINT", onSigint);
      sockets.forEach((socket) => socket.destroy());
      sockets.clear();
    },
  };
}

export function getServerAddress(server: Server): AddressInfo | null {
  const address = server.address();
  if (!address || typeof address === "string") {
    return null;
  }

  return address;
}
