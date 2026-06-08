# Security

`ngsrv-mcp` is a **public** repository. Do not commit secrets here.

## Safe in this repo

- Supabase **project URL** (public project ref)
- Tool descriptions, MCP schemas, and open-source server code
- Placeholders like `NGSRV_API_TOKEN=<token>` in docs and examples

## Never commit

- `NGSRV_API_TOKEN` or any `ngsrv_*` user/agent tokens
- Supabase **service role** keys
- npm, GitHub, Smithery, or Stripe API keys
- `.env` files

## Runtime secrets

Users pass tokens via **environment variables** or MCP client config. The HTTP scan endpoint on Cloud Run does not embed credentials in source.

## CI secrets

Deploy and npm publish use **GitHub Actions secrets** (`GCP_*`, `NPM_TOKEN`). These are encrypted by GitHub and are not visible in the public repo or workflow logs.

## Report issues

Open a private security report at https://ngsrv.com or email the maintainers via GitHub Issues if you find credential leakage in a release.
