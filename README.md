# RIPE Atlas MCP Server

[![npm version](https://img.shields.io/npm/v/ripe-atlas-mcp-server)](https://www.npmjs.com/package/ripe-atlas-mcp-server)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA4LTggNHoiLz48L3N2Zz4=)](https://www.npmjs.com/package/ripe-atlas-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the [RIPE Atlas](https://atlas.ripe.net) network measurement platform. Enables AI assistants to create network measurements, retrieve results, search probes, and manage credits.

## Features

- **All 6 measurement types**: ping, traceroute, DNS, TLS/SSL, HTTP, NTP
- **Flexible probe selection**: by country, ASN, prefix, geographic area, specific probes, or tags
- **Rich result retrieval**: time-range filtering, probe filtering, latest-only mode
- **Dual output format**: JSON (structured) and Markdown (human-readable)
- **Probe discovery**: search 12,000+ probes worldwide by location, network, status
- **Credit management**: check balance and usage statistics

## Quick Start

### Using npx (recommended)

```bash
npx ripe-atlas-mcp-server
```

### Install globally

```bash
npm install -g ripe-atlas-mcp-server
```

## Configuration

### Prerequisites

1. Create a free account at [atlas.ripe.net](https://atlas.ripe.net)
2. Create an API key at [atlas.ripe.net/keys/](https://atlas.ripe.net/keys/) with "Create measurements" permission
3. Set the environment variable: `export RIPE_ATLAS_API_KEY=your_key_here`

> **Note:** Read-only operations (listing measurements, searching probes) work without an API key. Creating measurements requires an API key.

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ripe-atlas": {
      "command": "npx",
      "args": ["-y", "ripe-atlas-mcp-server"],
      "env": {
        "RIPE_ATLAS_API_KEY": "your_key_here"
      }
    }
  }
}
```

### VS Code / GitHub Copilot

Add to your VS Code settings or `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "ripe-atlas": {
      "command": "npx",
      "args": ["-y", "ripe-atlas-mcp-server"],
      "env": {
        "RIPE_ATLAS_API_KEY": "your_key_here"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP config:

```json
{
  "mcpServers": {
    "ripe-atlas": {
      "command": "npx",
      "args": ["-y", "ripe-atlas-mcp-server"],
      "env": {
        "RIPE_ATLAS_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Tools

### Measurement Creation

| Tool | Description |
|------|-------------|
| `atlas_measure_ping` | Create ICMP ping measurements from distributed probes |
| `atlas_measure_traceroute` | Create traceroute measurements (ICMP/UDP/TCP) |
| `atlas_measure_dns` | Create DNS lookup measurements with DNSSEC support |
| `atlas_measure_tls` | Create TLS/SSL certificate check measurements |
| `atlas_measure_http` | Create HTTP request measurements (GET/HEAD/POST) |
| `atlas_measure_ntp` | Create NTP time query measurements |

### Measurement Management

| Tool | Description |
|------|-------------|
| `atlas_list_measurements` | Search and list measurements with filters |
| `atlas_get_measurement` | Get detailed measurement information by ID |
| `atlas_get_results` | Retrieve measurement results with time/probe filters |
| `atlas_stop_measurement` | Stop a running measurement |

### Probes

| Tool | Description |
|------|-------------|
| `atlas_search_probes` | Search probes by country, ASN, prefix, status, tags |
| `atlas_get_probe` | Get detailed probe information by ID |

### Account

| Tool | Description |
|------|-------------|
| `atlas_get_credits` | Check credit balance and usage statistics |

### Common Parameters

All measurement creation tools support:

| Parameter | Description |
|-----------|-------------|
| `target` | Target hostname or IP address |
| `af` | Address family: `4` (IPv4) or `6` (IPv6) |
| `probe_count` | Number of probes (1-1000, default: 5) |
| `from_country` | Two-letter ISO country code (e.g. `AU`, `DE`, `US`) |
| `from_asn` | Autonomous System Number |
| `from_prefix` | IP prefix (e.g. `193.0.0.0/21`) |
| `from_area` | Geographic area: `WW`, `West`, `North-Central`, `South-Central`, `North-East`, `South-East` |
| `from_probes` | Comma-separated probe IDs |
| `include_tags` / `exclude_tags` | Filter probes by tags |
| `is_oneoff` | One-shot (`true`, default) or recurring (`false`) |
| `response_format` | `json` (default) or `markdown` |

## Examples

**Ping a target from 10 random probes:**
> "Ping 1.1.1.1 from 10 probes worldwide"

**Check DNS propagation:**
> "Do a DNS lookup for example.com AAAA records from 50 probes across the world"

**Find probes in a country:**
> "Show me all connected RIPE Atlas probes in Australia"

**Trace a route:**
> "Run a traceroute to 8.8.8.8 from 5 probes in Germany using ICMP"

## What is RIPE Atlas?

[RIPE Atlas](https://atlas.ripe.net) is a global Internet measurement network operated by [RIPE NCC](https://www.ripe.net). It consists of thousands of hardware and software probes hosted by volunteers worldwide. Users can run network measurements (ping, traceroute, DNS, TLS, HTTP, NTP) from these distributed vantage points, providing visibility into Internet routing, performance, and DNS resolution globally.

## Development

```bash
git clone https://github.com/jrelph/ripe-atlas-mcp.git
cd ripe-atlas-mcp-server
npm install
npm run build
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE)
