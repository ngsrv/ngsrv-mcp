#!/usr/bin/env node
/**
 * Stateless Streamable HTTP MCP endpoint for Smithery capability scanning.
 * Deploy to Cloud Run; publish URL with: smithery mcp publish <url>/mcp -n ngsrv/ngsrv
 */
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createNgsrvMcpServer } from "./createServer.js";
const app = createMcpExpressApp({ host: "0.0.0.0" });
app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "ngsrv-mcp-http" });
});
app.post("/mcp", async (req, res) => {
    const server = createNgsrvMcpServer({ leanToolsList: false });
    try {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        res.on("close", () => {
            transport.close();
            server.close();
        });
    }
    catch (error) {
        console.error("MCP HTTP error:", error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: "2.0",
                error: { code: -32603, message: "Internal server error" },
                id: null,
            });
        }
    }
});
app.get("/mcp", (_req, res) => {
    res.status(405).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed." },
        id: null,
    });
});
app.delete("/mcp", (_req, res) => {
    res.status(405).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed." },
        id: null,
    });
});
const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, "0.0.0.0", (error) => {
    if (error) {
        console.error("Failed to start MCP HTTP server:", error);
        process.exit(1);
    }
    console.log(`ngsrv MCP HTTP listening on :${PORT} (/mcp, /health)`);
});
