import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync("src/routes/publications.tsx", "utf8");

test("publications route uses the real API client and exposes assisted publication states", () => {
  assert.equal(routeSource.includes("@/mocks"), false);
  assert.ok(routeSource.includes('from "@/services/api-client"'));
  assert.ok(routeSource.includes("getPublicationTargets"));
  assert.ok(routeSource.includes("createPublicationJob"));
  assert.ok(routeSource.includes("createPublicationTarget"));
  assert.ok(routeSource.includes("reschedulePublicationJob"));
  assert.ok(routeSource.includes("Sem auto-send externo"));
  assert.ok(routeSource.includes("Publicacao assistida"));
  assert.ok(routeSource.includes("Aprovacao"));
  assert.ok(routeSource.includes("Conformidade"));
  assert.ok(routeSource.includes("humanConfirmed"));
  assert.ok(routeSource.includes("privacyStatus"));
  assert.ok(routeSource.includes("metadata"));
  assert.ok(routeSource.includes("Confirmacao humana"));
  assert.ok(routeSource.includes("createJobMutation.mutate({"));
  assert.ok(routeSource.includes("Evidencias"));
  assert.ok(routeSource.includes("Novo alvo"));
  assert.ok(routeSource.includes("leitura limitada à descoberta dos canais"));
  assert.ok(routeSource.includes("Reconectar YouTube"));
  assert.ok(routeSource.includes("Listando canais YouTube autorizados"));
  assert.ok(routeSource.includes("Nenhum canal YouTube foi encontrado"));
  assert.ok(routeSource.includes("Não foi possível listar os canais autorizados"));
});
