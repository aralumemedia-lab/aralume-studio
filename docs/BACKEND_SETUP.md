# Backend Setup

## Scope

This setup covers the Sprint 2 backend foundation only:

- Express HTTP server;
- environment validation;
- request ID middleware;
- JSON parser;
- not found handler;
- error handler;
- request logging;
- `GET /health`.

No domain work is included yet.

The current backend also exposes operational surfaces for observability and readiness:

- `GET /live`
- `GET /ready`
- `GET /health`
- `GET /ops/health`
- `GET /ops/metrics`

## Install

From the repository root:

```bash
bun install
```

## Run the backend

Development mode:

```bash
bun run backend:dev
```

Production build:

```bash
bun run backend:build
```

Typecheck the backend only:

```bash
bun run backend:check
```

Start the built server:

```bash
bun run backend:start
```

## Health check

The backend exposes:

```bash
GET /health
```

Expected response:

```json
{
  "ok": true,
  "service": "aralume-api",
  "environment": "development",
  "version": "0.1.0",
  "liveness": { "ok": true, "status": "alive" },
  "readiness": { "ok": true, "status": "ready" },
  "metrics": { "totalRequests": 0, "activeRequests": 0 }
}
```

## Environment variables used now

Required for this foundation:

- `ARALUME_ENV` (`development`, `test`, `staging`, or `production`)
- `ARALUME_LOG_LEVEL`

Required in staging/production:

- `ARALUME_AUTH_SIGNING_SECRET`
- `ARALUME_ASSET_STORAGE_ROOT`
- `ARALUME_TRUSTED_PROXY_HOPS`
- `ARALUME_ALLOWED_HOSTS`
- `ARALUME_ALLOWED_ORIGINS`

Optional for this foundation:

- `DATABASE_URL`
- `TEST_DATABASE_URL`
- `ARALUME_AUTH_TEST_BYPASS` (test only)
- `ARALUME_BUILD_ID`
- `ARALUME_MAX_BODY_BYTES`
- `ARALUME_REQUEST_TIMEOUT_MS`
- `ARALUME_SHUTDOWN_TIMEOUT_MS`

The backend will start with safe defaults in development and test. Staging and production fail closed before listeners open if the required secrets or storage root are missing or invalid.

## Future variables not required now

The following remain documented for later phases and are not required by Sprint 2:

- `OPERATOR_ACCOUNTS_JSON`
- `OPERATOR_SESSION_TTL_MINUTES`
- `ARALUME_OPENAI_API_KEY`
- `ARALUME_TTS_API_KEY`
- `ARALUME_TTS_MODEL`
- `ARALUME_TTS_PROVIDER`
- `ARALUME_TTS_VOICE`
- `ARALUME_FFMPEG_PATH`
- `ARALUME_FFPROBE_PATH`
- `ARALUME_VIDEO_RENDERER`
- `ARALUME_PUBLICATION_OFFICIAL_ADAPTERS`
- `ARALUME_PUBLICATION_TOKEN_SECRET`
- `ARALUME_TIKTOK_ACCOUNT`
- `ARALUME_YOUTUBE_CLIENT_ID`
- `ARALUME_YOUTUBE_CLIENT_SECRET`
- `ARALUME_YOUTUBE_REDIRECT_URI`

## Validation commands

Frontend and backend checks:

```bash
bun run lint
bunx tsc --noEmit
bun run build
bun run backend:check
bun run backend:build
bun run test
```

## Package manager

Bun is the official package manager for this repository. Keep `bun.lock` as the only lockfile and avoid regenerating `package-lock.json`.

## Out of scope

Sprint 2 does not include:

- Canais domain;
- CRUD real;
- frontend/backend integration;
- authentication;
- Supabase;
- OAuth;
- AI;
- video;
- publication;
- workers;
- queues;
- rendering.
