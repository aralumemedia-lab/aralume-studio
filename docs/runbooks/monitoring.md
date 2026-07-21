# Runbook — Monitoring

## Purpose

Validate that the operational surfaces emit bounded and sanitized telemetry.

## Commands

```bash
curl -fsS http://127.0.0.1:3001/ops/metrics
curl -fsS http://127.0.0.1:3001/health
```

## Expected behavior

- request / latency / error counters are present
- labels remain bounded
- requestId is present in logs but not used as a metrics label

## Definitions

- dashboard source: `observability/dashboards/release-1.0.0.json`
- alerts source: `observability/alerts/release-1.0.0.yml`
