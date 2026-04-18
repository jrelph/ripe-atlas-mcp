import { z } from "zod";
import { ResponseFormatSchema, PaginationSchema } from "./common.js";

export const ProbeSearchSchema = PaginationSchema.extend({
  asn: z.number().int().positive().optional().describe("Filter by ASN (v4)"),
  asn_v6: z.number().int().positive().optional().describe("Filter by ASN (v6)"),
  prefix: z.string().optional().describe("Filter by IPv4 prefix"),
  prefix_v6: z.string().optional().describe("Filter by IPv6 prefix"),
  country: z
    .string()
    .length(2)
    .optional()
    .describe("Filter by two-letter ISO country code"),
  status: z
    .union([z.literal(1), z.literal(2), z.literal(3)])
    .optional()
    .describe("Probe status: 1=Connected, 2=Disconnected, 3=Abandoned"),
  is_anchor: z.boolean().optional().describe("Filter for anchor probes only"),
  tags: z.string().optional().describe("Comma-separated tag slugs to filter by"),
  search: z
    .string()
    .optional()
    .describe("Free-text search across probe fields"),
  sort: z
    .string()
    .optional()
    .describe("Sort field (e.g. 'id', '-id' for descending)"),
  response_format: ResponseFormatSchema,
}).strict();

export const ProbeGetSchema = z
  .object({
    probe_id: z.number().int().positive().describe("The probe ID to retrieve"),
    response_format: ResponseFormatSchema,
  })
  .strict();
