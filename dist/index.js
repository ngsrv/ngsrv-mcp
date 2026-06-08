#!/usr/bin/env node
/**
 * Stdio MCP server for ngsrv tunnels (localhost to public HTTPS).
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createNgsrvMcpServer } from "./createServer.js";
export { createNgsrvMcpServer, TOOL_DEFINITIONS, SERVER_INSTRUCTIONS } from "./createServer.js";
async function main() {
    const server = createNgsrvMcpServer({ leanToolsList: true });
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
