/**
 * Shared MCP server factory for ngsrv tunnels.
 * Used by stdio (local CLI) and HTTP (Smithery capability scan) transports.
 */
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const SUPABASE_URL =
  process.env.NGSRV_SUPABASE_URL ||
  "https://clldaoylkqqqcjssqphs.supabase.co";
const ANON_KEY = process.env.NGSRV_SUPABASE_ANON_KEY || "";

export const SERVER_INSTRUCTIONS = `ngsrv MCP exposes local HTTP ports on public HTTPS URLs.

Routing:
- User needs a public URL for a local port → call tunnel.start with port (e.g. 3000).
- User asks what tunnels are running → call tunnel.list.
- User wants to stop a tunnel → call tunnel.stop with the same port.
- User needs an API token → call token.provision (12h trial if NGSRV_API_TOKEN unset).
- User asks how to install CLI or MCP → call docs.install.

Requires ngsrv CLI on PATH or NGSRV_CLI_PATH. Agent tokens skip the Free-tier visitor warning page.`;

type TunnelRecord = {
  pid: number;
  port: number;
  publicUrl: string;
  startedAt: string;
};

const tunnels = new Map<string, TunnelRecord>();

/** Legacy snake_case names from earlier releases. */
const TOOL_ALIASES: Record<string, string> = {
  start_tunnel: "tunnel.start",
  list_tunnels: "tunnel.list",
  stop_tunnel: "tunnel.stop",
  provision_agent_token: "token.provision",
  ngsrv_install_help: "docs.install",
};

export type CreateNgsrvMcpServerOptions = {
  /**
   * When false (HTTP / Smithery scan), tools/list includes outputSchema and annotations.
   * When true (stdio), heavy fields are stripped to stay under MCP message size limits.
   */
  leanToolsList?: boolean;
};

function resolveToolName(name: string): string {
  return TOOL_ALIASES[name] ?? name;
}

function toolResult(data: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

function deviceIdPath(): string {
  const dir = join(homedir(), ".ngsrv");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, "mcp-device-id");
}

function getDeviceId(): string {
  if (process.env.NGSRV_DEVICE_ID?.trim()) {
    return process.env.NGSRV_DEVICE_ID.trim();
  }
  const path = deviceIdPath();
  if (existsSync(path)) {
    return readFileSync(path, "utf8").trim();
  }
  const id = randomUUID();
  writeFileSync(path, id, "utf8");
  return id;
}

async function ensureToken(): Promise<string> {
  const env = process.env.NGSRV_API_TOKEN?.trim();
  if (env?.startsWith("ngsrv_")) return env;

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/agent-trial-start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ANON_KEY ? { apikey: ANON_KEY } : {}),
    },
    body: JSON.stringify({ device_id: getDeviceId() }),
  });

  const data = (await resp.json()) as { token?: string; error?: string };
  if (!resp.ok || !data.token) {
    throw new Error(
      data.error ||
        "No NGSRV_API_TOKEN set and trial start failed. Sign up at https://ngsrv.com/login"
    );
  }
  return data.token;
}

function ngsrvBin(): string {
  return process.env.NGSRV_CLI_PATH || "ngsrv";
}

/** Strip heavy fields so stdio Smithery scanner stays under tools/list size limits. */
function toolsForList(
  tools: Array<Record<string, unknown>>,
  lean: boolean
): Array<Record<string, unknown>> {
  if (!lean) return tools;
  return tools.map((tool) => {
    const { outputSchema, execution, _meta, ...rest } = tool;
    return rest;
  });
}

export const TOOL_DEFINITIONS = [
  {
    name: "tunnel.start",
    title: "Start tunnel",
    description:
      "Expose a local HTTP server on a public HTTPS URL via ngsrv. " +
      "Returns public_url and local_port. Use for webhooks, OAuth callbacks, and sharing dev servers. " +
      "Call tunnel.list afterward to see active tunnels.",
    inputSchema: {
      type: "object",
      properties: {
        port: {
          type: "number",
          description:
            "TCP port your local HTTP server listens on. Example: 3000 for Next.js, 8080 for APIs, 4242 for Stripe CLI.",
          minimum: 1,
          maximum: 65535,
        },
      },
      required: ["port"],
    },
    outputSchema: {
      type: "object",
      properties: {
        public_url: {
          type: "string",
          description: "Public HTTPS URL that forwards to localhost.",
        },
        local_port: {
          type: "number",
          description: "Local port that was exposed.",
        },
        agent_token: {
          type: "boolean",
          description: "True when an agent token was used.",
        },
        interstitial: {
          type: "boolean",
          description: "False for agent tokens (no visitor warning page on Free).",
        },
        docs: { type: "string", description: "Documentation URL." },
      },
      required: ["public_url", "local_port"],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "tunnel.list",
    title: "List tunnels",
    description:
      "List HTTPS tunnels started by this MCP process in the current session. " +
      "Returns port, public_url, and started_at for each tunnel. " +
      "Call this before tunnel.stop to confirm which port to close.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description:
            "Maximum number of tunnels to return. Omit to return all active tunnels in this process.",
          minimum: 1,
        },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        tunnels: {
          type: "array",
          description: "Active tunnels in this MCP process.",
          items: {
            type: "object",
            properties: {
              port: { type: "number", description: "Local port." },
              public_url: { type: "string", description: "Public HTTPS URL." },
              started_at: {
                type: "string",
                description: "ISO 8601 timestamp when the tunnel started.",
              },
            },
            required: ["port", "public_url", "started_at"],
          },
        },
      },
      required: ["tunnels"],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "tunnel.stop",
    title: "Stop tunnel",
    description:
      "Stop an ngsrv tunnel started by this MCP session. " +
      "Pass the same port given to tunnel.start. " +
      "Call tunnel.list first if you are unsure which ports are active.",
    inputSchema: {
      type: "object",
      properties: {
        port: {
          type: "number",
          description:
            "Local port of the tunnel to stop. Must match a port from tunnel.list. Example: 3000.",
          minimum: 1,
          maximum: 65535,
        },
      },
      required: ["port"],
    },
    outputSchema: {
      type: "object",
      properties: {
        stopped: { type: "boolean", description: "True when the tunnel was stopped." },
        port: { type: "number", description: "Port that was stopped." },
        message: { type: "string", description: "Human-readable result." },
      },
      required: ["stopped", "port", "message"],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: "token.provision",
    title: "Provision agent token",
    description:
      "Obtain a 12-hour ngsrv agent token for tunnel commands. " +
      "Uses NGSRV_API_TOKEN when set; otherwise starts a free device trial (no signup). " +
      "Returns token_prefix and expiry — not the full secret.",
    inputSchema: {
      type: "object",
      properties: {
        refresh: {
          type: "boolean",
          description:
            "When true, request a new trial token even if NGSRV_API_TOKEN is already set.",
        },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        token_prefix: {
          type: "string",
          description: "First characters of the token for identification.",
        },
        token_hint: {
          type: "string",
          description: "Short hash hint for matching tokens in logs.",
        },
        expires_in_hours: {
          type: "number",
          description: "Hours until the token expires.",
        },
        env: { type: "string", description: "Shell export example." },
        docs: { type: "string", description: "Documentation URL." },
      },
      required: ["token_prefix", "expires_in_hours", "docs"],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "docs.install",
    title: "Install help",
    description:
      "Return ngsrv CLI install commands and MCP client configuration snippets. " +
      "Call when the user asks how to install ngsrv, configure Cursor, or use npx. " +
      "Does not start a tunnel.",
    inputSchema: {
      type: "object",
      properties: {
        client: {
          type: "string",
          description:
            "MCP client to tailor config for. Example: cursor, claude, windsurf.",
        },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        cli_install: { type: "string", description: "Shell one-liner to install CLI." },
        npx_cli: { type: "string", description: "npx command for the CLI wrapper." },
        npx_mcp: { type: "string", description: "npx command for this MCP server." },
        mcp_config: {
          type: "object",
          description: "Example Cursor mcp.json entry.",
        },
        docs: { type: "string", description: "Documentation URL." },
      },
      required: ["cli_install", "npx_cli", "npx_mcp", "docs"],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
];

/**
 * Creates a configured ngsrv MCP Server instance with tools, prompts, and resources.
 */
export function createNgsrvMcpServer(
  options: CreateNgsrvMcpServerOptions = {}
): Server {
  const leanToolsList = options.leanToolsList ?? true;

  const server = new Server(
    { name: "ngsrv", version: "1.0.4" },
    {
      capabilities: { tools: {}, prompts: {}, resources: {} },
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolsForList(TOOL_DEFINITIONS, leanToolsList),
  }));

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: "tunnel.quickstart",
        title: "Expose localhost",
        description:
          "Step-by-step prompt to expose a local dev server (default port 3000) on a public HTTPS URL.",
        arguments: [
          {
            name: "port",
            description: "Local HTTP port to expose. Example: 3000.",
            required: false,
          },
        ],
      },
      {
        name: "docs.setup",
        title: "MCP setup",
        description:
          "Shows how to add ngsrv to Cursor or Claude Desktop using npx and optional API token.",
        arguments: [],
      },
    ],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === "tunnel.quickstart") {
      const port = String((args as { port?: string })?.port || "3000");
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Expose my local HTTP server on port ${port} with ngsrv.\n` +
                `1. Call token.provision if NGSRV_API_TOKEN is not configured.\n` +
                `2. Call tunnel.start with port ${port}.\n` +
                `3. Return the public_url and remind me it forwards to http://localhost:${port}.`,
            },
          },
        ],
      };
    }
    if (name === "docs.setup") {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                "Show ngsrv MCP setup: npx -y @ngsrv/mcp, optional NGSRV_API_TOKEN, " +
                "and npx @ngsrv/cli http 3000 for CLI-only usage. Link https://ngsrv.com/docs/ai-agents",
            },
          },
        ],
      };
    }
    throw new Error(`Unknown prompt: ${name}`);
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: "ngsrv://docs/quickstart",
        name: "quickstart",
        title: "ngsrv quickstart",
        description:
          "Install commands and links for ngsrv CLI, npx @ngsrv/cli, and @ngsrv/mcp.",
        mimeType: "text/plain",
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri !== "ngsrv://docs/quickstart") {
      throw new Error(`Unknown resource: ${request.params.uri}`);
    }
    const text = [
      "ngsrv quickstart",
      "",
      "CLI: curl -fsSL https://get.ngsrv.com | sh",
      "npx CLI: npx @ngsrv/cli http 3000",
      "MCP: npx -y @ngsrv/mcp",
      "Docs: https://ngsrv.com/docs/ai-agents",
      "Smithery: https://smithery.ai/servers/ngsrv/ngsrv",
    ].join("\n");
    return { contents: [{ uri: request.params.uri, mimeType: "text/plain", text }] };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = resolveToolName(request.params.name);
    const args = request.params.arguments;

    try {
      if (tool === "token.provision") {
        const token = await ensureToken();
        const hint = createHash("sha256").update(token).digest("hex").slice(0, 8);
        return toolResult({
          token_prefix: token.slice(0, 12) + "...",
          token_hint: hint,
          expires_in_hours: 12,
          env: "export NGSRV_API_TOKEN=<token>",
          docs: "https://ngsrv.com/docs/ai-agents",
        });
      }

      if (tool === "docs.install") {
        return toolResult({
          cli_install: "curl -fsSL https://get.ngsrv.com | sh",
          npx_cli: "npx @ngsrv/cli http 3000",
          npx_mcp: "npx -y @ngsrv/mcp",
          mcp_config: {
            mcpServers: {
              ngsrv: {
                command: "npx",
                args: ["-y", "@ngsrv/mcp@latest"],
                env: { NGSRV_API_TOKEN: "<optional>" },
              },
            },
          },
          docs: "https://ngsrv.com/docs/ai-agents",
        });
      }

      if (tool === "tunnel.list") {
        const limit = Number((args as { limit?: number })?.limit);
        let list = [...tunnels.entries()].map(([port, t]) => ({
          port: Number(port),
          public_url: t.publicUrl,
          started_at: t.startedAt,
        }));
        if (limit > 0) list = list.slice(0, limit);
        return toolResult({ tunnels: list });
      }

      if (tool === "tunnel.stop") {
        const port = Number((args as { port?: number })?.port);
        const rec = tunnels.get(String(port));
        if (!rec) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  stopped: false,
                  port,
                  message: `No tunnel on port ${port}`,
                }),
              },
            ],
            isError: true,
          };
        }
        try {
          process.kill(rec.pid);
        } catch {
          /* already dead */
        }
        tunnels.delete(String(port));
        return toolResult({
          stopped: true,
          port,
          message: `Stopped tunnel on port ${port}`,
        });
      }

      if (tool === "tunnel.start") {
        const port = Number((args as { port?: number })?.port);
        if (!port || port < 1 || port > 65535) {
          return {
            content: [{ type: "text", text: "Invalid port (use 1–65535)" }],
            isError: true,
          };
        }
        const token = await ensureToken();
        const child = spawn(
          ngsrvBin(),
          ["http", String(port), "--json", "--no-tui", "-q"],
          {
            env: { ...process.env, NGSRV_API_TOKEN: token, NGSRV_NO_TUI: "1" },
            detached: false,
            stdio: ["ignore", "pipe", "pipe"],
          }
        );

        const result = await new Promise<{ publicUrl: string }>((resolve, reject) => {
          let stdout = "";
          child.stdout.on("data", (c) => {
            stdout += c.toString();
          });
          const t = setTimeout(() => reject(new Error("timeout")), 90_000);
          const iv = setInterval(() => {
            const line = stdout
              .split("\n")
              .find((l) => l.trim().startsWith("{"));
            if (line) {
              clearTimeout(t);
              clearInterval(iv);
              try {
                const p = JSON.parse(line) as { public_url?: string };
                resolve({ publicUrl: p.public_url || "" });
              } catch (e) {
                reject(e);
              }
            }
          }, 200);
          child.on("exit", (code) => {
            clearTimeout(t);
            clearInterval(iv);
            if (!stdout.includes("public_url")) {
              reject(new Error(`ngsrv exited ${code}`));
            }
          });
        });

        tunnels.set(String(port), {
          pid: child.pid!,
          port,
          publicUrl: result.publicUrl,
          startedAt: new Date().toISOString(),
        });

        return toolResult({
          public_url: result.publicUrl,
          local_port: port,
          agent_token: true,
          interstitial: false,
          docs: "https://ngsrv.com/docs/ai-agents",
        });
      }

      return {
        content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
        isError: true,
      };
    } catch (e) {
      return {
        content: [
          {
            type: "text",
            text: e instanceof Error ? e.message : String(e),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}
