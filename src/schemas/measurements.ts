import { z } from "zod";
import { BaseMeasurementSchema, ProbeSelectionSchema } from "./common.js";

// Ping measurement schema
export const PingSchema = BaseMeasurementSchema.merge(ProbeSelectionSchema)
  .extend({
    packets: z
      .number()
      .int()
      .min(1)
      .max(16)
      .default(3)
      .describe("Number of packets to send (1-16, default: 3)"),
    size: z
      .number()
      .int()
      .min(1)
      .max(2048)
      .default(48)
      .describe("Packet size in bytes excluding headers (1-2048, default: 48)"),
    packet_interval: z
      .number()
      .int()
      .min(2)
      .max(30000)
      .default(1000)
      .describe("Time between packets in ms (2-30000, default: 1000)"),
  })
  .strict();

// Traceroute measurement schema
export const TracerouteSchema = BaseMeasurementSchema.merge(ProbeSelectionSchema)
  .extend({
    packets: z
      .number()
      .int()
      .min(1)
      .max(16)
      .default(3)
      .describe("Number of packets per hop (1-16, default: 3)"),
    size: z
      .number()
      .int()
      .min(1)
      .max(2048)
      .default(48)
      .describe("Packet size in bytes (1-2048, default: 48)"),
    protocol: z
      .enum(["ICMP", "UDP", "TCP"])
      .default("ICMP")
      .describe("Protocol to use: ICMP, UDP, or TCP"),
    timeout: z
      .number()
      .int()
      .min(1)
      .default(4000)
      .describe("Timeout per packet in ms"),
    dont_fragment: z.boolean().default(false).describe("Set Don't Fragment flag"),
    paris: z
      .number()
      .int()
      .min(0)
      .max(64)
      .default(16)
      .describe("Paris traceroute variant (0=standard, 1-64=Paris, default: 16)"),
    first_hop: z
      .number()
      .int()
      .min(1)
      .max(255)
      .default(1)
      .describe("First TTL hop (1-255, default: 1)"),
    max_hops: z
      .number()
      .int()
      .min(1)
      .max(255)
      .default(32)
      .describe("Maximum TTL hops (1-255, default: 32)"),
    port: z
      .number()
      .int()
      .min(1)
      .max(65535)
      .optional()
      .describe("Destination port (TCP only)"),
    destination_option_size: z
      .number()
      .int()
      .optional()
      .describe("IPv6 destination option header size"),
    hop_by_hop_option_size: z
      .number()
      .int()
      .optional()
      .describe("IPv6 hop-by-hop option header size"),
  })
  .strict();

// DNS measurement schema
export const DnsSchema = BaseMeasurementSchema.merge(ProbeSelectionSchema)
  .extend({
    target: z
      .string()
      .optional()
      .describe(
        "Target DNS server IP/hostname. If omitted, the probe's resolver is used."
      ),
    query_argument: z
      .string()
      .describe("DNS name to query (e.g. 'example.com')"),
    query_type: z
      .enum([
        "A", "AAAA", "ANY", "CNAME", "DNSKEY", "DS", "HINFO", "MX", "NAPTR",
        "NS", "NSEC", "NSEC3", "NSEC3PARAM", "PTR", "RRSIG", "SOA",
        "SRV", "SSHFP", "TLSA", "TXT",
      ])
      .default("A")
      .describe("DNS query type (default: A)"),
    query_class: z
      .enum(["IN", "CHAOS"])
      .default("IN")
      .describe("DNS query class (default: IN)"),
    set_rd_bit: z.boolean().default(true).describe("Set Recursion Desired flag"),
    set_do_bit: z.boolean().default(false).describe("Set DNSSEC OK flag (RFC3225)"),
    set_cd_bit: z
      .boolean()
      .default(false)
      .describe("Set DNSSEC Checking Disabled flag (RFC4035)"),
    set_nsid_bit: z
      .boolean()
      .default(false)
      .describe("Include EDNS Name Server ID request"),
    udp_payload_size: z
      .number()
      .int()
      .min(512)
      .max(4096)
      .optional()
      .describe("EDNS UDP payload size (512-4096)"),
    protocol: z
      .enum(["UDP", "TCP"])
      .default("UDP")
      .describe("Transport protocol for DNS query"),
    retry: z.number().int().min(0).optional().describe("Number of retries"),
  })
  .strict();

// TLS/SSL certificate measurement schema
export const TlsSchema = BaseMeasurementSchema.merge(ProbeSelectionSchema)
  .extend({
    port: z
      .number()
      .int()
      .min(1)
      .max(65535)
      .default(443)
      .describe("Port to connect to (default: 443)"),
  })
  .strict();

// HTTP measurement schema
export const HttpSchema = BaseMeasurementSchema.merge(ProbeSelectionSchema)
  .extend({
    port: z
      .number()
      .int()
      .min(1)
      .max(65535)
      .default(80)
      .describe("Port number (default: 80)"),
    header_bytes: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Max bytes to retrieve from response header (0=no limit)"),
    version: z
      .string()
      .default("1.1")
      .describe("HTTP version (e.g. '1.0', '1.1')"),
    method: z
      .enum(["GET", "HEAD", "POST"])
      .default("GET")
      .describe("HTTP method"),
    path: z.string().default("/").describe("URL path (default: '/')"),
    query_string: z.string().optional().describe("Query string to append to path"),
    user_agent: z.string().optional().describe("Custom User-Agent header"),
    body_bytes: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Max bytes to retrieve from response body (0=no limit)"),
    timing_verbosity: z
      .union([z.literal(0), z.literal(1), z.literal(2)])
      .default(0)
      .describe("Timing detail: 0=none, 1=basic, 2=per-read"),
  })
  .strict();

// NTP measurement schema
export const NtpSchema = BaseMeasurementSchema.merge(ProbeSelectionSchema)
  .extend({
    packets: z
      .number()
      .int()
      .min(1)
      .max(16)
      .default(3)
      .describe("Number of packets (1-16, default: 3)"),
    timeout: z
      .number()
      .int()
      .min(1)
      .default(4000)
      .describe("Timeout per packet in ms"),
  })
  .strict();
