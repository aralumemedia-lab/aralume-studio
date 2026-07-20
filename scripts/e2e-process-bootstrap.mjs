const runId = process.env.ARALUME_E2E_RUN_ID?.trim();
const nonce = process.env.ARALUME_E2E_STARTUP_NONCE?.trim();

if (
  process.env.ARALUME_E2E_BOOTSTRAP_DISABLED !== "true" &&
  runId &&
  nonce &&
  typeof process.send === "function"
) {
  process.send({
    type: "aralume-e2e-started",
    runId,
    nonce,
    pid: process.pid,
  });
}
