# ngsrv-mcp

MCP server for ngsrv tunnels. Expose a local HTTP port on a public HTTPS URL from Cursor, Claude Desktop, or other MCP clients.

Agent tokens (12h) skip the Free-tier visitor warning page.

## Quick start (no signup)

```bash
npx -y ngsrv-mcp
```

Add to Cursor (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "ngsrv": {
      "command": "npx",
      "args": ["-y", "ngsrv-mcp@latest"]
    }
  }
}
```

First `start_tunnel` call provisions a **free 12-hour device trial** automatically.

## With an account

```bash
curl -fsSL https://get.ngsrv.com | sh
# Dashboard → API Tokens → Create Agent Token
export NGSRV_API_TOKEN=ngsrv_...
```

```json
{
  "mcpServers": {
    "ngsrv": {
      "command": "npx",
      "args": ["-y", "ngsrv-mcp@latest"],
      "env": {
        "NGSRV_API_TOKEN": "ngsrv_your_token"
      }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `start_tunnel` | `port` → public HTTPS URL |
| `list_tunnels` | Tunnels started in this MCP process |
| `stop_tunnel` | Stop by port |
| `provision_agent_token` | 12h agent token (trial or refresh) |
| `ngsrv_install_help` | Install + MCP config snippets |

## Smithery

[![smithery badge](https://smithery.ai/badge/ngsrv/ngsrv)](https://smithery.ai/servers/ngsrv/ngsrv)

Install from [Smithery](https://smithery.ai/servers/ngsrv/ngsrv).

Capability scans need a **live HTTP** endpoint (stdio MCPB alone scores 0/40 on tool quality). After deploy:

```bash
smithery mcp publish https://ngsrv.com/api/mcp -n ngsrv/ngsrv
```

Standalone HTTP server (Cloud Run): `npm run start:http` or `node dist/http.js` on `/mcp`.

## Docs

https://ngsrv.com/docs/ai-agents
