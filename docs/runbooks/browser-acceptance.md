# Runbook — Browser Acceptance

## Purpose

Run the consolidated browser / runner acceptance suite for the release
remediation unit.

## Command

```bash
npm run release:browser
```

## Expected output

- one result line per official runner
- exit code recorded for each runner
- no orphaned browser or backend processes

## Notes

- the wrapper script runs the official Sprint 15–21 runners plus the HMAC gate
- screenshots and logs are kept by the underlying runner scripts
