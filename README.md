# ngsrv-mcp

MCP server for ngsrv tunnels — **Cursor** (and other MCP clients) expose localhost on public HTTPS.

## Install (Smithery)

[![smithery badge](https://smithery.ai/badge/ngsrv/ngsrv)](https://smithery.ai/servers/ngsrv/ngsrv)

**Use Smithery for install and updates:** https://smithery.ai/servers/ngsrv/ngsrv

```bash
smithery mcp add ngsrv/ngsrv
```

## Cursor

`~/.cursor/mcp.json`:

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

First `tunnel.start` provisions a **free 12-hour device trial** (no signup). Agent tokens skip the Free-tier visitor warning page.

Optional: `NGSRV_API_TOKEN` from [ngsrv.com](https://ngsrv.com/login) → API Tokens → Create agent token.

## Tools

| Tool | Description |
|------|-------------|
| `tunnel.start` | `port` → public HTTPS URL |
| `tunnel.list` | Active tunnels in this process |
| `tunnel.stop` | Stop by port |
| `token.provision` | 12h agent token (trial or refresh) |
| `docs.install` | Cursor config + install snippets |

Legacy aliases (`start_tunnel`, etc.) still work.

## Docs

https://ngsrv.com/docs/ai-agents
