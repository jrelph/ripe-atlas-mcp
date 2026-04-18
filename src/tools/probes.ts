import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiGet, handleApiError } from "../services/api.js";
import { ProbeSearchSchema, ProbeGetSchema } from "../schemas/probes.js";
import { ResponseFormat, CHARACTER_LIMIT } from "../constants.js";
import type { ProbeResponse, PaginatedResponse } from "../types.js";

function formatProbe(p: ProbeResponse, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(p, null, 2);
  }
  const lines = [
    `# Probe ${p.id}`,
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Country** | ${p.country_code} |`,
    `| **Status** | ${p.status?.name ?? "Unknown"} (since ${p.status?.since ?? "?"}) |`,
    `| **ASN v4** | ${p.asn_v4 ?? "—"} |`,
    `| **ASN v6** | ${p.asn_v6 ?? "—"} |`,
    `| **Prefix v4** | ${p.prefix_v4 ?? "—"} |`,
    `| **Prefix v6** | ${p.prefix_v6 ?? "—"} |`,
    `| **Is Anchor** | ${p.is_anchor ? "Yes" : "No"} |`,
    `| **Description** | ${p.description || "—"} |`,
  ];
  if (p.tags && p.tags.length > 0) {
    lines.push(
      `| **Tags** | ${p.tags.map((t) => t.slug || t.name).join(", ")} |`
    );
  }
  if (p.geometry?.coordinates) {
    lines.push(
      `| **Location** | ${p.geometry.coordinates[1]}, ${p.geometry.coordinates[0]} |`
    );
  }
  return lines.join("\n");
}

function formatProbeList(
  data: PaginatedResponse<ProbeResponse>,
  format: ResponseFormat
): string {
  if (format === ResponseFormat.JSON) {
    const output = JSON.stringify(
      {
        count: data.count,
        has_more: data.next !== null,
        probes: data.results,
      },
      null,
      2
    );
    if (output.length > CHARACTER_LIMIT) {
      const truncated = data.results.slice(0, Math.ceil(data.results.length / 2));
      return JSON.stringify(
        {
          count: data.count,
          shown: truncated.length,
          truncated: true,
          probes: truncated,
          message: "Truncated. Use pagination or filters to narrow results.",
        },
        null,
        2
      );
    }
    return output;
  }

  const lines = [
    `# Probes (${data.results.length} of ${data.count})`,
    "",
    "| ID | Country | ASN v4 | Status | Anchor | Description |",
    "|----|---------|--------|--------|--------|-------------|",
  ];
  for (const p of data.results) {
    lines.push(
      `| ${p.id} | ${p.country_code} | ${p.asn_v4 ?? "—"} | ${p.status?.name ?? "?"} | ${p.is_anchor ? "✓" : ""} | ${(p.description || "—").slice(0, 30)} |`
    );
  }
  if (data.next) {
    lines.push("", `_More results available. Increase page number._`);
  }
  return lines.join("\n");
}

export function registerProbeTools(server: McpServer): void {
  server.registerTool(
    "atlas_search_probes",
    {
      title: "Search RIPE Atlas Probes",
      description: `Search for RIPE Atlas probes worldwide with filters for location, network, and status.

Args:
  - country (string): Two-letter ISO country code (e.g. 'DE', 'US', 'AU')
  - asn (number): Filter by ASN (IPv4)
  - asn_v6 (number): Filter by ASN (IPv6)
  - prefix (string): Filter by IPv4 prefix (e.g. '193.0.0.0/21')
  - prefix_v6 (string): Filter by IPv6 prefix
  - status (1|2|3): 1=Connected, 2=Disconnected, 3=Abandoned
  - is_anchor (bool): Only anchor probes
  - tags (string): Comma-separated tag slugs
  - search (string): Free-text search
  - sort (string): Sort field (e.g. 'id', '-id')
  - page/page_size: Pagination

Returns: Paginated list of probes with ID, country, ASN, status, tags.`,
      inputSchema: ProbeSearchSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const queryParams: Record<string, unknown> = {
          page: params.page,
          page_size: params.page_size,
        };
        if (params.asn) queryParams.asn_v4 = params.asn;
        if (params.asn_v6) queryParams.asn_v6 = params.asn_v6;
        if (params.prefix) queryParams.prefix_v4 = params.prefix;
        if (params.prefix_v6) queryParams.prefix_v6 = params.prefix_v6;
        if (params.country) queryParams.country_code = params.country;
        if (params.status) queryParams.status = params.status;
        if (params.is_anchor !== undefined) queryParams.is_anchor = params.is_anchor;
        if (params.tags) queryParams.tags = params.tags;
        if (params.search) queryParams.search = params.search;
        if (params.sort) queryParams.sort = params.sort;

        const data = await apiGet<PaginatedResponse<ProbeResponse>>(
          "probes/",
          queryParams
        );
        return {
          content: [
            {
              type: "text" as const,
              text: formatProbeList(data, params.response_format),
            },
          ],
        };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "atlas_get_probe",
    {
      title: "Get RIPE Atlas Probe Details",
      description: `Get detailed information about a specific RIPE Atlas probe by ID.

Args:
  - probe_id (number): The probe ID to retrieve
  - response_format ('json'|'markdown'): Output format

Returns: Probe details including country, ASN, prefix, status, tags, coordinates.`,
      inputSchema: ProbeGetSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const data = await apiGet<ProbeResponse>(`probes/${params.probe_id}/`);
        return {
          content: [
            {
              type: "text" as const,
              text: formatProbe(data, params.response_format),
            },
          ],
        };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );
}
