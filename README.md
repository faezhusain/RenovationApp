# Renovation Companion

A responsive renovation planning and budget application, prepared for a private GitHub repository and a later Netlify deployment.

## Run locally

Requires Node.js 20 or newer. No packages are needed.

```powershell
node server.js
```

Open http://127.0.0.1:4173. On Windows, `Start Renovation App.cmd` is also available; keep its window open while using the app. Run tests with `node --test` and the public-file privacy check with `node scripts/check-public.mjs`.

## Data and privacy

This code-only version does not include the renovation workbook, receipts, contacts or existing browser data. **The current application uses browser-local storage.** It has no login or cloud synchronisation: opening it on another device starts a separate project, and clearing browser storage may delete its data. Do not treat a Netlify deployment of this version as a shared, durable or secure financial database.

The current local app can export a JSON backup under More. A backup can be restored into another browser, replacing that browser's current project; it is a manual one-time copy, not live synchronisation. Backups contain private financial data, contacts and receipt files; store them securely. Never commit a backup, workbook, receipt or secret to the repository or put them inside `public/`.

If the app is later deployed, everything in `public/` can be downloaded by visitors, regardless of GitHub repository visibility. The Netlify build runs `scripts/check-public.mjs` to help catch common private file types, but it is not a complete privacy or security audit.

## Later Netlify setup

Import the private GitHub repository in Netlify. The included `netlify.toml` sets the publish directory to `public` and runs the privacy check. The local Node server is only for development; Netlify serves the static files. A production setup for the same project on multiple devices requires sign-in, private cloud storage, conflict handling and migration of the local data. Those capabilities are not implemented in this code-only version.
