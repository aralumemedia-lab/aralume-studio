# Runbook — Configuration

## Purpose

Validate the production-like configuration contract before opening listeners.

## Commands

```bash
cp .env.example .env.local
npm run backend:check
npm run backend:start
```

## Expected behavior

- required production-like variables fail closed when missing or invalid
- no secret value is printed to the console
- listeners do not open if validation fails

## Notes

- `.env.example` remains placeholder-only
- production-like startup must not accept test-only controls
