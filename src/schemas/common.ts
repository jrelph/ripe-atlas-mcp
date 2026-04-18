import { z } from "zod";
import { ResponseFormat } from "../constants.js";

export const ResponseFormatSchema = z
  .nativeEnum(ResponseFormat)
  .default(ResponseFormat.JSON)
  .describe("Output format: 'json' for structured data or 'markdown' for human-readable");

export const ProbeSelectionSchema = z.object({
  probe_count: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(5)
    .describe("Number of probes to use (1-1000, default: 5)"),
  from_country: z
    .string()
    .length(2)
    .optional()
    .describe("Two-letter ISO country code to select probes from (e.g. 'DE', 'US')"),
  from_asn: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("ASN number to select probes from"),
  from_prefix: z
    .string()
    .optional()
    .describe("IP prefix to select probes from (e.g. '193.0.0.0/21')"),
  from_area: z
    .enum(["WW", "West", "North-Central", "South-Central", "North-East", "South-East"])
    .optional()
    .describe("Geographic area to select probes from"),
  from_probes: z
    .string()
    .optional()
    .describe("Comma-separated list of specific probe IDs to use"),
  include_tags: z
    .array(z.string())
    .optional()
    .describe("Only include probes with these tags (e.g. ['system-ipv6-works'])"),
  exclude_tags: z
    .array(z.string())
    .optional()
    .describe("Exclude probes with these tags"),
});

export const BaseMeasurementSchema = z.object({
  target: z.string().describe("Target hostname or IP address"),
  af: z
    .union([z.literal(4), z.literal(6)])
    .default(4)
    .describe("Address family: 4 for IPv4, 6 for IPv6"),
  description: z
    .string()
    .optional()
    .describe("Human-readable description of the measurement"),
  is_oneoff: z
    .boolean()
    .default(true)
    .describe("If true (default), run once. If false, run periodically at 'interval'"),
  interval: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Interval in seconds between measurements (only used when is_oneoff=false)"),
  resolve_on_probe: z
    .boolean()
    .default(false)
    .describe("Resolve DNS names on probe instead of RIPE servers"),
  tags: z
    .array(z.string())
    .optional()
    .describe("Tags to apply to the measurement"),
  response_format: ResponseFormatSchema,
});

export type ProbeSelection = z.infer<typeof ProbeSelectionSchema>;

export function buildProbeSpecs(params: ProbeSelection): Array<Record<string, unknown>> {
  const probes: Array<Record<string, unknown>> = [];

  if (params.from_probes) {
    probes.push({
      type: "probes",
      value: params.from_probes,
      requested: params.probe_count,
    });
  } else if (params.from_asn) {
    probes.push({
      type: "asn",
      value: params.from_asn,
      requested: params.probe_count,
      ...(params.include_tags || params.exclude_tags
        ? {
            tags: {
              ...(params.include_tags ? { include: params.include_tags } : {}),
              ...(params.exclude_tags ? { exclude: params.exclude_tags } : {}),
            },
          }
        : {}),
    });
  } else if (params.from_prefix) {
    probes.push({
      type: "prefix",
      value: params.from_prefix,
      requested: params.probe_count,
    });
  } else if (params.from_country) {
    probes.push({
      type: "country",
      value: params.from_country,
      requested: params.probe_count,
      ...(params.include_tags || params.exclude_tags
        ? {
            tags: {
              ...(params.include_tags ? { include: params.include_tags } : {}),
              ...(params.exclude_tags ? { exclude: params.exclude_tags } : {}),
            },
          }
        : {}),
    });
  } else if (params.from_area) {
    probes.push({
      type: "area",
      value: params.from_area,
      requested: params.probe_count,
    });
  } else {
    probes.push({
      type: "area",
      value: "WW",
      requested: params.probe_count,
      ...(params.include_tags || params.exclude_tags
        ? {
            tags: {
              ...(params.include_tags ? { include: params.include_tags } : {}),
              ...(params.exclude_tags ? { exclude: params.exclude_tags } : {}),
            },
          }
        : {}),
    });
  }

  return probes;
}

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1).describe("Page number (default: 1)"),
  page_size: z
    .number()
    .int()
    .min(1)
    .max(500)
    .default(25)
    .describe("Results per page (1-500, default: 25)"),
});
