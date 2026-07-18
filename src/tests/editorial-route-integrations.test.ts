import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ideasSource = readFileSync("src/routes/ideas.tsx", "utf8");
const researchSource = readFileSync("src/routes/research.tsx", "utf8");
const scriptsSource = readFileSync("src/routes/scripts.tsx", "utf8");
const productionSource = readFileSync("src/routes/production.tsx", "utf8");
const approvalsSource = readFileSync("src/routes/approvals.tsx", "utf8");
const complianceSource = readFileSync("src/routes/compliance.tsx", "utf8");
const governanceActionsSource = readFileSync(
  "src/components/governance/governance-check-actions.tsx",
  "utf8",
);

test("editorial routes use the real API client and surface loading/error/empty states", () => {
  const expectations = new Map<string, string[]>([
    ["ideas", ["getContentIdeas", "createContentIdea", "updateContentIdea"]],
    [
      "research",
      [
        "getResearchSessions",
        "createResearchSession",
        "createResearchSource",
        "createClaimEvidence",
      ],
    ],
    ["scripts", ["getScripts", "getScriptVersions", "createScript", "createScriptVersion"]],
    ["production", ["getVisualPlans", "getScenePlans", "createVisualPlan", "createScenePlan"]],
  ]);

  for (const [label, source] of [
    ["ideas", ideasSource],
    ["research", researchSource],
    ["scripts", scriptsSource],
    ["production", productionSource],
  ] as const) {
    assert.equal(source.includes("@/mocks"), false);
    assert.ok(source.includes('from "@/services/api-client"'));
    assert.ok(source.includes("LoadingState"));
    assert.ok(source.includes("ErrorState"));
    assert.ok(source.includes("EmptyState"));
    for (const token of expectations.get(label) ?? []) {
      assert.ok(source.includes(token), `${label} route should include ${token}`);
    }
  }
});

test("governance routes expose real quality, compliance and approval mutations", () => {
  for (const [label, source] of [
    ["approvals", approvalsSource],
    ["compliance", complianceSource],
  ] as const) {
    assert.equal(source.includes("@/mocks"), false);
    assert.ok(
      source.includes("GovernanceCheckActions"),
      `${label} should expose governance actions`,
    );
    assert.ok(source.includes("LoadingState"));
    assert.ok(source.includes("ErrorState"));
    assert.ok(source.includes("EmptyState"));
  }

  assert.ok(approvalsSource.includes("createApproval"));
  assert.ok(approvalsSource.includes("approveApproval"));
  assert.ok(approvalsSource.includes("requestApprovalChanges"));
  assert.ok(approvalsSource.includes("getApprovalHistory"));
  assert.ok(governanceActionsSource.includes("createQualityCheck"));
  assert.ok(governanceActionsSource.includes("createComplianceCheck"));
  assert.ok(governanceActionsSource.includes('role="alert"'));
});
