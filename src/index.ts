#!/usr/bin/env node
/**
 * RIPE Atlas MCP Server
 *
 * Provides tools to interact with the RIPE Atlas network measurement platform
 * via the Model Context Protocol (MCP). Supports creating measurements (ping,
 * traceroute, DNS, TLS, HTTP, NTP), retrieving results, searching probes,
 * and checking credit balance.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerMeasurementTools } from "./tools/measurements.js";
import { registerProbeTools } from "./tools/probes.js";
import { registerCreditTools } from "./tools/credits.js";

const server = new McpServer({
  name: "ripe-atlas-mcp-server",
  version: "1.0.0",
});

// Register all tool groups
registerMeasurementTools(server);
registerProbeTools(server);
registerCreditTools(server);

async function main(): Promise<void> {
  if (!process.env.RIPE_ATLAS_API_KEY) {
    console.error(
      "WARNING: RIPE_ATLAS_API_KEY not set. Read-only operations will work, but measurement creation requires an API key."
    );
    console.error("Set it with: export RIPE_ATLAS_API_KEY=your_key_here");
    console.error("Get a key at: https://atlas.ripe.net/keys/");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("RIPE Atlas MCP server running via stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
