import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, apiDelete, handleApiError } from "../services/api.js";
import {
  PingSchema,
  TracerouteSchema,
  DnsSchema,
  TlsSchema,
  HttpSchema,
  NtpSchema,
} from "../schemas/measurements.js";
import {
  ResponseFormatSchema,
  PaginationSchema,
  buildProbeSpecs,
} from "../schemas/common.js";
import { ResponseFormat, CHARACTER_LIMIT, STATUS_LABELS } from "../constants.js";
import type {
  MeasurementCreateResponse,
  MeasurementResponse,
  PaginatedResponse,
} from "../types.js";

// --- Helpers ---

function buildDefinition(
  type: string,
  params: Record<string, unknown>
): Record<string, unknown> {
  const excludeKeys = new Set([
    "probe_count",
    "from_country",
    "from_asn",
    "from_prefix",
    "from_area",
    "from_probes",
    "include_tags",
    "exclude_tags",
    "response_format",
  ]);

  const def: Record<string, unknown> = { type };
  for (const [key, value] of Object.entries(params)) {
    if (!excludeKeys.has(key) && value !== undefined) {
      def[key] = value;
    }
  }
  return def;
}

function formatMeasurementCreated(
  data: MeasurementCreateResponse,
  format: ResponseFormat
): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(data, null, 2);
  }
  const ids = data.measurements;
  const lines = [
    "# Measurement Created",
    "",
    `**Measurement ID(s):** ${ids.join(", ")}`,
    "",
    `View results: https://atlas.ripe.net/measurements/${ids[0]}/`,
    "",
    `Get results via this MCP: use \`atlas_get_results\` with measurement_id=${ids[0]}`,
  ];
  return lines.join("\n");
}

function formatMeasurement(m: MeasurementResponse, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(m, null, 2);
  }
  const statusLabel = STATUS_LABELS[m.status?.id] ?? String(m.status?.id);
  const lines = [
    `# Measurement ${m.id}`,
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Type** | ${m.type} |`,
    `| **Target** | ${m.target || "N/A"} |`,
    `| **Target IP** | ${m.target_ip || "N/A"} |`,
    `| **Status** | ${statusLabel} |`,
    `| **AF** | IPv${m.af} |`,
    `| **Description** | ${m.description || "—"} |`,
    `| **One-off** | ${m.is_oneoff ? "Yes" : `No (interval: ${m.interval}s)`} |`,
    `| **Probes** | ${m.probes_scheduled}/${m.probes_requested} |`,
    `| **Created** | ${new Date(m.creation_time * 1000).toISOString()} |`,
    `| **Started** | ${m.start_time ? new Date(m.start_time * 1000).toISOString() : "—"} |`,
    `| **Stopped** | ${m.stop_time ? new Date(m.stop_time * 1000).toISOString() : "—"} |`,
    `| **Public** | ${m.is_public ? "Yes" : "No"} |`,
    "",
    `[View on RIPE Atlas](https://atlas.ripe.net/measurements/${m.id}/)`,
  ];
  return lines.join("\n");
}

function formatMeasurementList(
  data: PaginatedResponse<MeasurementResponse>,
  format: ResponseFormat
): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(
      {
        count: data.count,
        has_more: data.next !== null,
        measurements: data.results,
      },
      null,
      2
    );
  }
  const lines = [
    `# Measurements (${data.results.length} of ${data.count})`,
    "",
    "| ID | Type | Target | Status | AF | Description |",
    "|-----|------|--------|--------|----|-------------|",
  ];
  for (const m of data.results) {
    const statusLabel = STATUS_LABELS[m.status?.id] ?? "?";
    lines.push(
      `| ${m.id} | ${m.type} | ${m.target || "—"} | ${statusLabel} | ${m.af} | ${(m.description || "—").slice(0, 40)} |`
    );
  }
  if (data.next) {
    lines.push("", `_More results available. Increase page number._`);
  }
  return lines.join("\n");
}

function formatResults(
  results: unknown[],
  format: ResponseFormat,
  measurementId: number
): string {
  if (format === ResponseFormat.JSON) {
    const output = JSON.stringify({ measurement_id: measurementId, count: results.length, results }, null, 2);
    if (output.length > CHARACTER_LIMIT) {
      const truncated = results.slice(0, Math.ceil(results.length / 2));
      return JSON.stringify(
        {
          measurement_id: measurementId,
          count: truncated.length,
          total_available: results.length,
          truncated: true,
          results: truncated,
          message: "Response truncated. Use start/stop time filters or probe_ids to narrow results.",
        },
        null,
        2
      );
    }
    return output;
  }

  const lines = [
    `# Results for Measurement ${measurementId}`,
    "",
    `**${results.length} result(s) returned**`,
    "",
  ];

  for (const r of results.slice(0, 50) as Record<string, unknown>[]) {
    const probeId = r.prb_id ?? r.probe_id ?? "?";
    const from = r.from ?? "?";
    const dst = r.dst_addr ?? r.dst_name ?? "?";
    const ts = r.timestamp
      ? new Date((r.timestamp as number) * 1000).toISOString()
      : "?";

    lines.push(`### Probe ${probeId} (${from}) → ${dst} at ${ts}`);

    if (r.avg !== undefined) {
      lines.push(
        `- RTT: avg=${r.avg}ms min=${r.min}ms max=${r.max}ms sent=${r.sent} rcvd=${r.rcvd}`
      );
    }
    if (r.answers !== undefined) {
      lines.push(`- Answers: ${JSON.stringify(r.answers)}`);
    }
    if (r.result !== undefined && Array.isArray(r.result)) {
      lines.push(`- Hops: ${(r.result as unknown[]).length}`);
    }
    lines.push("");
  }

  if (results.length > 50) {
    lines.push(`_Showing 50 of ${results.length} results. Use JSON format for full data._`);
  }

  return lines.join("\n");
}

// --- Tool Registration ---

async function createMeasurement(
  type: string,
  params: Record<string, unknown>,
  format: ResponseFormat
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  try {
    const definition = buildDefinition(type, params);
    const probes = buildProbeSpecs(params as any);

    const body = {
      definitions: [definition],
      probes,
      is_oneoff: params.is_oneoff ?? true,
    };

    const data = await apiPost<MeasurementCreateResponse>("measurements/", body);
    return {
      content: [{ type: "text", text: formatMeasurementCreated(data, format) }],
    };
  } catch (error) {
    return { content: [{ type: "text", text: handleApiError(error) }] };
  }
}

export function registerMeasurementTools(server: McpServer): void {
  // --- Ping ---
  server.registerTool(
    "atlas_measure_ping",
    {
      title: "RIPE Atlas Ping Measurement",
      description: `Create a ping measurement on the RIPE Atlas network.

Sends ICMP echo requests from distributed probes worldwide to a target host.

Args:
  - target (string): Target hostname or IP address
  - af (4|6): Address family (default: 4)
  - packets (1-16): Number of packets (default: 3)
  - size (1-2048): Packet size in bytes (default: 48)
  - probe_count (1-1000): Number of probes (default: 5)
  - from_country/from_asn/from_prefix/from_area/from_probes: Probe selection
  - is_oneoff (bool): One-shot measurement (default: true)
  - response_format ('json'|'markdown'): Output format

Returns: Measurement ID(s) and link to results.

Requires: RIPE_ATLAS_API_KEY with 'create measurement' permission.`,
      inputSchema: PingSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => createMeasurement("ping", params as Record<string, unknown>, params.response_format)
  );

  // --- Traceroute ---
  server.registerTool(
    "atlas_measure_traceroute",
    {
      title: "RIPE Atlas Traceroute Measurement",
      description: `Create a traceroute measurement on the RIPE Atlas network.

Traces the network path from distributed probes to a target, showing each hop.

Args:
  - target (string): Target hostname or IP
  - protocol ('ICMP'|'UDP'|'TCP'): Protocol (default: ICMP)
  - max_hops (1-255): Max TTL (default: 32)
  - paris (0-64): Paris traceroute mode (default: 16, 0=standard)
  - port (1-65535): Destination port (TCP only)
  - probe_count, from_country, etc.: Probe selection

Returns: Measurement ID(s).

Requires: RIPE_ATLAS_API_KEY with 'create measurement' permission.`,
      inputSchema: TracerouteSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => createMeasurement("traceroute", params as Record<string, unknown>, params.response_format)
  );

  // --- DNS ---
  server.registerTool(
    "atlas_measure_dns",
    {
      title: "RIPE Atlas DNS Measurement",
      description: `Create a DNS measurement on the RIPE Atlas network.

Performs DNS lookups from distributed probes. Can query specific DNS servers or use the probe's local resolver.

Args:
  - query_argument (string): DNS name to query (e.g. 'example.com')
  - query_type: Record type (A, AAAA, MX, NS, SOA, TXT, CNAME, DNSKEY, etc.)
  - target (string, optional): DNS server to query. Omit to use probe's resolver.
  - set_rd_bit: Recursion Desired (default: true)
  - set_do_bit: DNSSEC OK flag
  - set_cd_bit: DNSSEC Checking Disabled
  - set_nsid_bit: Request Name Server ID
  - protocol ('UDP'|'TCP'): Transport (default: UDP)
  - probe_count, from_country, etc.: Probe selection

Returns: Measurement ID(s).

Requires: RIPE_ATLAS_API_KEY with 'create measurement' permission.`,
      inputSchema: DnsSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => {
      const p = params as Record<string, unknown>;
      // If no target, use probe resolver
      if (!p.target) {
        p.use_probe_resolver = true;
      }
      return createMeasurement("dns", p, params.response_format);
    }
  );

  // --- TLS/SSL ---
  server.registerTool(
    "atlas_measure_tls",
    {
      title: "RIPE Atlas TLS Certificate Measurement",
      description: `Create a TLS/SSL certificate check measurement on the RIPE Atlas network.

Connects to a target and retrieves its TLS certificate from distributed probes worldwide.

Args:
  - target (string): Target hostname or IP
  - port (1-65535): Port to connect to (default: 443)
  - probe_count, from_country, etc.: Probe selection

Returns: Measurement ID(s).

Requires: RIPE_ATLAS_API_KEY with 'create measurement' permission.`,
      inputSchema: TlsSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => createMeasurement("sslcert", params as Record<string, unknown>, params.response_format)
  );

  // --- HTTP ---
  server.registerTool(
    "atlas_measure_http",
    {
      title: "RIPE Atlas HTTP Measurement",
      description: `Create an HTTP measurement on the RIPE Atlas network.

Makes HTTP requests from distributed probes to a target web server.

Args:
  - target (string): Target hostname or IP
  - method ('GET'|'HEAD'|'POST'): HTTP method (default: GET)
  - path (string): URL path (default: '/')
  - port (1-65535): Port (default: 80)
  - version (string): HTTP version (default: '1.1')
  - header_bytes: Max header bytes to capture
  - body_bytes: Max body bytes to capture
  - timing_verbosity (0|1|2): Detail level
  - probe_count, from_country, etc.: Probe selection

Returns: Measurement ID(s).

Requires: RIPE_ATLAS_API_KEY with 'create measurement' permission.`,
      inputSchema: HttpSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => createMeasurement("http", params as Record<string, unknown>, params.response_format)
  );

  // --- NTP ---
  server.registerTool(
    "atlas_measure_ntp",
    {
      title: "RIPE Atlas NTP Measurement",
      description: `Create an NTP measurement on the RIPE Atlas network.

Queries NTP time servers from distributed probes to measure clock offset and delay.

Args:
  - target (string): NTP server hostname or IP
  - packets (1-16): Number of packets (default: 3)
  - timeout: Timeout per packet in ms
  - probe_count, from_country, etc.: Probe selection

Returns: Measurement ID(s).

Requires: RIPE_ATLAS_API_KEY with 'create measurement' permission.`,
      inputSchema: NtpSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => createMeasurement("ntp", params as Record<string, unknown>, params.response_format)
  );

  // --- List Measurements ---
  const ListMeasurementsSchema = PaginationSchema.extend({
    search: z.string().optional().describe("Free-text search (target or description)"),
    type: z
      .enum(["ping", "traceroute", "dns", "sslcert", "http", "ntp"])
      .optional()
      .describe("Filter by measurement type"),
    status: z
      .enum(["0", "1", "2", "4", "5", "6", "7", "8"])
      .optional()
      .describe("Filter by status: 0=Specified, 1=Scheduled, 2=Ongoing, 4=Stopped"),
    af: z.union([z.literal(4), z.literal(6)]).optional().describe("Address family filter"),
    is_oneoff: z.boolean().optional().describe("Filter one-off vs recurring"),
    target: z.string().optional().describe("Filter by exact target"),
    target_contains: z.string().optional().describe("Filter by target containing string"),
    mine: z.boolean().default(false).describe("List only your own measurements (requires API key)"),
    sort: z.string().optional().describe("Sort field (e.g. '-id', 'start_time')"),
    response_format: ResponseFormatSchema,
  }).strict();

  server.registerTool(
    "atlas_list_measurements",
    {
      title: "List RIPE Atlas Measurements",
      description: `Search and list RIPE Atlas measurements with comprehensive filters.

Args:
  - search: Free-text search on target/description
  - type: Filter by measurement type (ping, traceroute, dns, sslcert, http, ntp)
  - status: Filter by status (2=Ongoing, 4=Stopped, etc.)
  - af: Address family (4 or 6)
  - target/target_contains: Filter by target
  - mine: Show only your measurements (requires API key)
  - page/page_size: Pagination
  - sort: Sort order (e.g. '-id' for newest first)

Returns: Paginated list of measurements.`,
      inputSchema: ListMeasurementsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const endpoint = params.mine ? "measurements/my/" : "measurements/";
        const queryParams: Record<string, unknown> = {
          page: params.page,
          page_size: params.page_size,
        };
        if (params.search) queryParams.search = params.search;
        if (params.type) queryParams.type = params.type;
        if (params.status) queryParams.status = params.status;
        if (params.af) queryParams.af = params.af;
        if (params.is_oneoff !== undefined) queryParams.is_oneoff = params.is_oneoff;
        if (params.target) queryParams.target = params.target;
        if (params.target_contains) queryParams.target__contains = params.target_contains;
        if (params.sort) queryParams.sort = params.sort;

        const data = await apiGet<PaginatedResponse<MeasurementResponse>>(
          endpoint,
          queryParams
        );
        return {
          content: [
            {
              type: "text" as const,
              text: formatMeasurementList(data, params.response_format),
            },
          ],
        };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );

  // --- Get Measurement ---
  const GetMeasurementSchema = z
    .object({
      measurement_id: z
        .number()
        .int()
        .positive()
        .describe("The measurement ID to retrieve"),
      response_format: ResponseFormatSchema,
    })
    .strict();

  server.registerTool(
    "atlas_get_measurement",
    {
      title: "Get RIPE Atlas Measurement Details",
      description: `Get detailed information about a specific RIPE Atlas measurement by ID.

Args:
  - measurement_id (number): The measurement ID
  - response_format ('json'|'markdown'): Output format

Returns: Full measurement metadata including type, target, status, probes, timestamps.`,
      inputSchema: GetMeasurementSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const data = await apiGet<MeasurementResponse>(
          `measurements/${params.measurement_id}/`
        );
        return {
          content: [
            { type: "text" as const, text: formatMeasurement(data, params.response_format) },
          ],
        };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );

  // --- Get Results ---
  const GetResultsSchema = z
    .object({
      measurement_id: z
        .number()
        .int()
        .positive()
        .describe("The measurement ID to get results for"),
      start: z
        .number()
        .int()
        .optional()
        .describe("Only results after this Unix timestamp"),
      stop: z
        .number()
        .int()
        .optional()
        .describe("Only results before this Unix timestamp"),
      probe_ids: z
        .string()
        .optional()
        .describe("Comma-separated list of probe IDs to filter results"),
      latest: z
        .boolean()
        .default(false)
        .describe("If true, fetch only the latest results instead of historical"),
      response_format: ResponseFormatSchema,
    })
    .strict();

  server.registerTool(
    "atlas_get_results",
    {
      title: "Get RIPE Atlas Measurement Results",
      description: `Retrieve results from a RIPE Atlas measurement.

Can fetch all results, latest results only, or filter by time range and probe IDs.

Args:
  - measurement_id (number): The measurement ID
  - latest (bool): If true, get only latest results (default: false)
  - start (unix timestamp): Only results after this time
  - stop (unix timestamp): Only results before this time
  - probe_ids (string): Comma-separated probe IDs to filter
  - response_format ('json'|'markdown'): Output format

Returns: Measurement results with per-probe data (RTT, hops, DNS answers, etc.)`,
      inputSchema: GetResultsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const endpoint = params.latest
          ? `measurements/${params.measurement_id}/latest/`
          : `measurements/${params.measurement_id}/results/`;

        const queryParams: Record<string, unknown> = {};
        if (params.start) queryParams.start = params.start;
        if (params.stop) queryParams.stop = params.stop;
        if (params.probe_ids) queryParams.probe_ids = params.probe_ids;

        const data = await apiGet<unknown[]>(endpoint, queryParams);
        return {
          content: [
            {
              type: "text" as const,
              text: formatResults(data, params.response_format, params.measurement_id),
            },
          ],
        };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );

  // --- Stop Measurement ---
  const StopMeasurementSchema = z
    .object({
      measurement_id: z
        .number()
        .int()
        .positive()
        .describe("The measurement ID to stop"),
    })
    .strict();

  server.registerTool(
    "atlas_stop_measurement",
    {
      title: "Stop RIPE Atlas Measurement",
      description: `Stop a running RIPE Atlas measurement.

Args:
  - measurement_id (number): The measurement ID to stop

Returns: Confirmation of the stop request.

Requires: RIPE_ATLAS_API_KEY with appropriate permissions.`,
      inputSchema: StopMeasurementSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        await apiDelete(`measurements/${params.measurement_id}/`);
        return {
          content: [
            {
              type: "text" as const,
              text: `Measurement ${params.measurement_id} has been stopped.`,
            },
          ],
        };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );
}
