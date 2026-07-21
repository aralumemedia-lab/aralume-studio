# Runbook — Rollback

## Purpose

Return the disposable staging stack to the last known good artifact and config.

## Commands

```bash
docker compose -f compose.staging.yml down
docker compose -f compose.staging.yml up --build -d
```

## Expected behavior

- the previous build or configuration is restored explicitly
- no silent overwrite is treated as success
- smoke checks after rollback return the healthy state

## Related recovery helper

- `node scripts/sprint27-backup-restore.mjs`
