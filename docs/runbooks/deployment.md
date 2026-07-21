# Runbook — Deployment

## Purpose

Start the staging topology in a disposable environment and verify the runtime
boundary before any later release authorization.

## Commands

```bash
docker compose -f compose.staging.yml config
docker compose -f compose.staging.yml up --build -d
```

## Smoke checks

- `GET /live`
- `GET /ready`
- `GET /health`
- `GET /ops/metrics`

## Expected behavior

- the immutable artifact is built from the current commit
- readiness is true only when the runtime is available
- the ingress proxy routes `/api` and operational endpoints to the backend
- `docker compose down` removes the disposable stack cleanly
