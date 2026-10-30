# Cloud sync and deployment

The hosted app uses Netlify Identity for sign-in and a private, user-scoped Netlify Blob for the project. The browser sends versioned conditional writes so stale edits produce a conflict rather than silently replacing another device's work. Preview and production use separate stores. The local development URL still stores its data in its own browser and does not sync to the hosted site.

## Transfer a local project

1. In the original local app, select **More → Export backup**. Keep that JSON file private and retain a copy.
2. Sign in to the production site, open **More → Restore backup**, select the file, and confirm the replacement. This replaces the project associated with the signed-in account.
3. Wait for **Saved to cloud** and verify the project details, costs, payments, and appliances before using another device. Keep the original backup.

The entire project, including encoded receipts, is limited to 4 MiB; individual receipt files are limited to 1 MiB. Financial details and backups must not be committed to the public repository.

## Everyday use

Use the hosted address and the same account on each device. Wait for **Saved to cloud** before closing the app. Refresh before editing on another device. If a conflict occurs, export the unsent draft before reloading; resolve it against the current cloud project. The app does not automatically merge conflicting edits. Export backups regularly.

## Deployment

The Netlify project must use Identity with invite-only registration. Builds install the dependencies and run `npm run build`. Pushes to the configured production branch trigger Netlify's deployment; `cloud-sync-wip` is a separate branch deploy for testing. The Identity and Blobs integration depends on Netlify's runtime and requires a deployed test; unit tests and the browser smoke test use substitutes. Never import a real backup into a public repository or use real data in a preview test.
