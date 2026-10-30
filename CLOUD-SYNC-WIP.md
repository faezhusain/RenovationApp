# Cross-device sync: work in progress

This branch contains components for the requested private, signed-in project sync. It is not ready for deployment and does not change the current app's browser-only storage.

## Prepared

- `server/project-api.js` defines a project API using injected authentication, request-origin checking and storage. Project keys come from a verified user ID; writes require a version precondition.
- `server/netlify-adapter.js` maps those controls to the official Netlify Identity and strongly consistent Blobs interfaces; its wiring is tested with substitutes, not a deployed service.
- `public/cloud-sync.js` queues changes, handles stale-write conflicts and retains unsent values while a save is pending or has failed. `public/cloud-session.js` keeps separate browser drafts per user and tab until acknowledged.
- `public/migration.js` validates a local backup, produces a review summary and flags an existing cloud project without overwriting it. This helper is not yet connected to the interface.
- Automated tests use in-memory substitutes to check isolation, cross-origin rejection, write conflicts, queued edits and retries.

## Remaining before use

1. Install and lock the official packages and validate the Netlify build and function. Package downloads from multiple official HTTPS registry endpoints failed with a TLS error in the current environment; do not disable certificate or TLS checks to work around it. A branch-only GitHub Actions check has been added as an independent build check.
2. Test sign-in, invitation handling, sign-out and per-user storage against the real Netlify service. Verify Identity is invite-only before importing data.
3. Verify first-run backup import and recovery through the actual interface. Never put the backup or workbook in `public/` or the Git repository.
4. Verify sync, offline, retry and conflict states from two real devices, including unsynced export and the 4 MB project-size limit.
5. Complete a security review and verify the real Netlify provider, request-origin checks, versioning, migration, backup and recovery in a private test deployment before enabling production use.

This branch now contains an **unverified** integration and must not be merged or published to production until the above checks pass. The in-memory tests do not verify the Netlify service or make the application production-ready. The production site and the original local app remain unchanged.
