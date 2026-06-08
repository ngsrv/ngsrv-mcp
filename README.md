# ngsrv-mcp

MCP server for ngsrv tunnels — expose localhost on public HTTPS from **Cursor** and other MCP clients.

ngsrv is a **developer tunnel tool** (CLI, YAML, webhooks). This package is the optional MCP integration.

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

## Registry install (optional)

Some MCP clients support [Smithery](https://smithery.ai/servers/ngsrv/ngsrv):

```bash
smithery mcp add ngsrv/ngsrv
```

## Docs

https://ngsrv.com/docs/ai-agents
