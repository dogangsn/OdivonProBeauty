# Cloudflare Pages deployment

The production site is deployed from `main` to the `odivonpro-beauty` Cloudflare Pages project. Pull requests receive isolated preview deployments. The Angular production output is `dist/odivon-pro-beauty/browser`; `_redirects` provides SPA route fallback.

GitHub Actions requires repository secrets named `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. The token must be narrowly scoped to Cloudflare Pages edit access for the target account. Never commit or print the token.

Local authenticated deployment is available through `npm run deploy:cloudflare`. Production API and Firebase public client configuration must be supplied at build time without placing server credentials in the repository.
