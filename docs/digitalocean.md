# DigitalOcean static deployment

The deployment specification is `.do/app.yaml`. It builds the requested feature
branch as one static site, serves `dist` at `/`, and uses `index.html` for the SPA
fallback. No web service, worker, database, Droplet, or server secret is required.
Do not add resources to the existing TradeRep server.

Before creating the app, verify the account still has a free static-app slot and
that DigitalOcean displays $0/month. Stop if a paid component or plan is proposed.
The specification alone cannot verify account quota or billing eligibility.

Build: `npm ci && npm test && npm run build`.
Local full verification: `npm run check`.
The GitHub Pages workflow explicitly retains its own `/open-sourced/` base path.
App Platform uses the root path by default. Auto-deploy is disabled so unverified
future commits do not publish automatically.

## AI on static hosting

Connect OpenRouter in the Generate screen. Each visitor uses a session-scoped
OAuth key in their own browser tab. Photo transcription always uses
`openrouter/free`, never falls back to a paid model, and supports PNG/JPEG/WebP up
to 8 MB each. OpenRouter's free router filters for image-input support:
https://openrouter.ai/docs/guides/routing/routers/free-router

Free model availability and quota depend on OpenRouter. No shared key is bundled
in the build. Existing optional paid text models still require explicit per-use
confirmation; deploying this site does not select or authorize them. The optional
Express API is not deployed. Study sets and progress stay in browser local storage;
use the app's backup feature to move them between devices.

## Verification limits

Automated tests exercise image request construction, file rejection, quota/errors,
partial upload success, image-to-draft integration, generated-output validation,
OAuth exchange, and all five study modes. AI responses are mocked in tests.
A real image-to-cards smoke test requires the user's OpenRouter authorization.
Live App Platform deployment and mobile browser QA must be checked after account
access is available; a passing build is not proof of a live deployment.
