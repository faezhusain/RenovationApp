# Cross-device sync: work in progress

This branch contains components for the requested private, signed-in project sync. It is not ready for deployment and does not change the current app's browser-only storage.

## Prepared

- `server/project-api.js` defines a project API using injected authentication, request-origin checking and storage. Project keys come from a verified user ID; writes require a version precondition.
- `public/cloud-sync.js` queues changes, handles stale-write conflicts and retains unsent values while a save is pending or has failed.
- Automated tests use in-memory substitutes to check isolation, cross-origin rejection, write conflicts, queued edits and retries.

## Remaining before use

1. Install and lock the official `@netlify/identity` and `@netlify/blobs` packages, then add and test the Netlify Functions adapters. The package download in the current environment failed with a TLS error; do not disable certificate or TLS checks to work around it.
2. Implement sign-in, invitation handling, sign-out, per-user storage and the actual application integration. Configure Netlify Identity to invite-only before inviting the owner.
3. Implement a safe first-run migration of the current browser's exported backup, with preview, conflict protection and recovery. Never put the backup or workbook in `public/` or the Git repository.
4. Provide clear sync, offline, retry and conflict states, including a way to export unsynced edits. Check request and receipt size limits before saving; currently the prototype holds receipt files inside the project snapshot.
5. Verify the real Netlify provider, access control, request-origin checks, versioning, migration, backup and recovery in a private test deployment from two devices before enabling production use.

The Netlify build and the existing app in this branch still serve only the static local-storage prototype. The in-memory tests do not verify the Netlify service or make the application production-ready.
