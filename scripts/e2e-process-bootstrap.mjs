const runId = process.env.ARALUME_E2E_RUN_ID?.trim();
const nonce = process.env.ARALUME_E2E_STARTUP_NONCE?.trim();
const correlationId = process.env.ARALUME_E2E_STARTUP_CORRELATION_ID?.trim();

if (
  process.env.ARALUME_E2E_BOOTSTRAP_DISABLED !== "true" &&
  runId &&
  nonce &&
  correlationId &&
  typeof process.send === "function"
) {
  process.send({
    type: "aralume-e2e-started",
    runId,
    nonce,
    correlationId,
    pid: process.pid,
  });
}
