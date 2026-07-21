# Aralume Studio 1.0.0 — Security assessment

Candidate: `fa28cd8e61f86baed46dd6271b8afde7fc871ffa`

## Verified locally

- `bun audit` returned zero vulnerabilities.
- The bounded source secret scan found no high-confidence credential assignment
  outside ignored local/generated paths; `.env.local` is not tracked.
- Focused authentication tests confirmed missing/invalid credentials fail closed,
  role checks precede mutations, channel scope is enforced and decisions are
  audited without credentials.
- HTTP tests cover bounded body/depth validation, sanitised envelopes, ingress
  rejection and the E2E identity challenge control.
- Recovery tests reject tampered manifests, nested paths and filesystem aliases.

## Production security gaps

No actual production identity provider, secret injection path, TLS edge,
hosted secret scan, deployment environment or external integration credential
was supplied. The local HMAC runner is evidence for test harness identity; it
is not evidence that a production identity lifecycle, key rotation or operator
access procedure is configured.

The source-level controls are therefore **not a production security approval**.
The lack of hosted CI/protection is tracked as RLS-02, and lack of configured
secrets/environment as RLS-03.

## Finding requiring remediation

RLS-06 records React hydration-mismatch console errors emitted by current
browser execution. Its production impact is not yet bounded; it must be
reproduced or disproven against the production build before release approval.
