import { defaultPort, serviceName } from "./config.js";
import { createApp } from "./app.js";
import { EnvValidationError, loadEnv } from "./env.js";

function startServer(): void {
  try {
    const env = loadEnv();
    const app = createApp({
      env,
      authTestBypass: env.ARALUME_ENV === "test" && process.env.ARALUME_AUTH_TEST_BYPASS === "true",
    });

    app.listen(defaultPort, "127.0.0.1", () => {
      console.info(
        `${serviceName} listening at http://127.0.0.1:${defaultPort} (${env.ARALUME_ENV}, ${env.ARALUME_LOG_LEVEL})`,
      );
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

startServer();
