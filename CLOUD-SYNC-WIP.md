# Cross-device sync: work in progress

This branch contains components for the requested private, signed-in project sync. It is not ready for deployment and does not change the current app's browser-only storage.

## Prepared

- `server/project-api.js` defines a project API using injected authentication, request-origin checking and storage. Project keys come from a verified user ID; writes require a version precondition.
- `server/netlify-adapter.js` maps those controls to the official Netlify Identity and strongly consistent Blobs interfaces; its wiring is tested with substitutes, not a deployed service.
- `public/cloud-sync.js` queues changes, handles stale-write conflicts and retains unsent values while a save is pending or has failed.
- `public/migration.js` validates a local backup, produces a review summary and flags an existing cloud project without overwriting it. This helper is not yet connected to the interface.
- Automated tests use in-memory substitutes to check isolation, cross-origin rejection, write conflicts, queued edits and retries.

## Remaining before use

1. Install and lock the official `@netlify/identity` and `@netlify/blobs` packages, then connect and test the adapter in a Netlify Function. Package downloads from multiple official HTTPS registry endpoints failed with a TLS error in the current environment; do not disable certificate or TLS checks to work around it.
2. Implement sign-in, invitation handling, sign-out, per-user storage and the actual application integration. Configure Netlify Identity to invite-only before inviting the owner.
3. Implement a safe first-run migration of the current browser's exported backup, with preview, conflict protection and recovery. Never put the backup or workbook in `public/` or the Git repository.
4. Provide clear sync, offline, retry and conflict states, including a way to export unsynced edits. Check request and receipt size limits before saving; currently the prototype holds receipt files inside the project snapshot.
5. Verify the real Netlify provider, access control, request-origin checks, versioning, migration, backup and recovery in a private test deployment from two devices before enabling production use.

The Netlify build and the existing app in this branch still serve only the static local-storage prototype. The in-memory tests do not verify the Netlify service or make the application production-ready.
