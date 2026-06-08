import { Server } from "@modelcontextprotocol/sdk/server/index.js";
export declare const SERVER_INSTRUCTIONS = "ngsrv MCP exposes local HTTP ports on public HTTPS URLs.\n\nRouting:\n- User needs a public URL for a local port \u2192 call tunnel.start with port (e.g. 3000).\n- User asks what tunnels are running \u2192 call tunnel.list.\n- User wants to stop a tunnel \u2192 call tunnel.stop with the same port.\n- User needs an API token \u2192 call token.provision (12h trial if NGSRV_API_TOKEN unset).\n- User asks how to install CLI or MCP \u2192 call docs.install.\n\nRequires ngsrv CLI on PATH or NGSRV_CLI_PATH. Agent tokens skip the Free-tier visitor warning page.";
export type CreateNgsrvMcpServerOptions = {
    /**
     * When false (HTTP / Smithery scan), tools/list includes outputSchema and annotations.
     * When true (stdio), heavy fields are stripped to stay under MCP message size limits.
     */
    leanToolsList?: boolean;
};
export declare const TOOL_DEFINITIONS: ({
    name: string;
    title: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            port: {
                type: string;
                description: string;
                minimum: number;
                maximum: number;
            };
            limit?: undefined;
            refresh?: undefined;
            client?: undefined;
        };
        required: string[];
        additionalProperties?: undefined;
    };
    outputSchema: {
        type: string;
        properties: {
            public_url: {
                type: string;
                description: string;
            };
            local_port: {
                type: string;
                description: string;
            };
            agent_token: {
                type: string;
                description: string;
            };
            interstitial: {
                type: string;
                description: string;
            };
            docs: {
                type: string;
                description: string;
            };
            tunnels?: undefined;
            stopped?: undefined;
            port?: undefined;
            message?: undefined;
            token_prefix?: undefined;
            token_hint?: undefined;
            expires_in_hours?: undefined;
            env?: undefined;
            cli_install?: undefined;
            npx_cli?: undefined;
            npx_mcp?: undefined;
            mcp_config?: undefined;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
} | {
    name: string;
    title: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            limit: {
                type: string;
                description: string;
                minimum: number;
            };
            port?: undefined;
            refresh?: undefined;
            client?: undefined;
        };
        additionalProperties: boolean;
        required?: undefined;
    };
    outputSchema: {
        type: string;
        properties: {
            tunnels: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        port: {
                            type: string;
                            description: string;
                        };
                        public_url: {
                            type: string;
                            description: string;
                        };
                        started_at: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            public_url?: undefined;
            local_port?: undefined;
            agent_token?: undefined;
            interstitial?: undefined;
            docs?: undefined;
            stopped?: undefined;
            port?: undefined;
            message?: undefined;
            token_prefix?: undefined;
            token_hint?: undefined;
            expires_in_hours?: undefined;
            env?: undefined;
            cli_install?: undefined;
            npx_cli?: undefined;
            npx_mcp?: undefined;
            mcp_config?: undefined;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
} | {
    name: string;
    title: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            port: {
                type: string;
                description: string;
                minimum: number;
                maximum: number;
            };
            limit?: undefined;
            refresh?: undefined;
            client?: undefined;
        };
        required: string[];
        additionalProperties?: undefined;
    };
    outputSchema: {
        type: string;
        properties: {
            stopped: {
                type: string;
                description: string;
            };
            port: {
                type: string;
                description: string;
            };
            message: {
                type: string;
                description: string;
            };
            public_url?: undefined;
            local_port?: undefined;
            agent_token?: undefined;
            interstitial?: undefined;
            docs?: undefined;
            tunnels?: undefined;
            token_prefix?: undefined;
            token_hint?: undefined;
            expires_in_hours?: undefined;
            env?: undefined;
            cli_install?: undefined;
            npx_cli?: undefined;
            npx_mcp?: undefined;
            mcp_config?: undefined;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
} | {
    name: string;
    title: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            refresh: {
                type: string;
                description: string;
            };
            port?: undefined;
            limit?: undefined;
            client?: undefined;
        };
        additionalProperties: boolean;
        required?: undefined;
    };
    outputSchema: {
        type: string;
        properties: {
            token_prefix: {
                type: string;
                description: string;
            };
            token_hint: {
                type: string;
                description: string;
            };
            expires_in_hours: {
                type: string;
                description: string;
            };
            env: {
                type: string;
                description: string;
            };
            docs: {
                type: string;
                description: string;
            };
            public_url?: undefined;
            local_port?: undefined;
            agent_token?: undefined;
            interstitial?: undefined;
            tunnels?: undefined;
            stopped?: undefined;
            port?: undefined;
            message?: undefined;
            cli_install?: undefined;
            npx_cli?: undefined;
            npx_mcp?: undefined;
            mcp_config?: undefined;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
} | {
    name: string;
    title: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            client: {
                type: string;
                description: string;
            };
            port?: undefined;
            limit?: undefined;
            refresh?: undefined;
        };
        additionalProperties: boolean;
        required?: undefined;
    };
    outputSchema: {
        type: string;
        properties: {
            cli_install: {
                type: string;
                description: string;
            };
            npx_cli: {
                type: string;
                description: string;
            };
            npx_mcp: {
                type: string;
                description: string;
            };
            mcp_config: {
                type: string;
                description: string;
            };
            docs: {
                type: string;
                description: string;
            };
            public_url?: undefined;
            local_port?: undefined;
            agent_token?: undefined;
            interstitial?: undefined;
            tunnels?: undefined;
            stopped?: undefined;
            port?: undefined;
            message?: undefined;
            token_prefix?: undefined;
            token_hint?: undefined;
            expires_in_hours?: undefined;
            env?: undefined;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
    };
})[];
/**
 * Creates a configured ngsrv MCP Server instance with tools, prompts, and resources.
 */
export declare function createNgsrvMcpServer(options?: CreateNgsrvMcpServerOptions): Server;
