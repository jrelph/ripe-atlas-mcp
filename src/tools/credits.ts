import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, handleApiError } from "../services/api.js";
import { ResponseFormatSchema } from "../schemas/common.js";
import { ResponseFormat } from "../constants.js";
import type { CreditResponse } from "../types.js";

const GetCreditsSchema = z
  .object({
    response_format: ResponseFormatSchema,
  })
  .strict();

function formatCredits(c: CreditResponse, format: ResponseFormat): string {
  if (format === ResponseFormat.JSON) {
    return JSON.stringify(c, null, 2);
  }
  const lines = [
    "# RIPE Atlas Credit Balance",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| **Current Balance** | ${c.current_balance?.toLocaleString() ?? "?"} |`,
    `| **Est. Daily Income** | ${c.estimated_daily_income?.toLocaleString() ?? "?"} |`,
    `| **Est. Daily Spend** | ${c.estimated_daily_expenditure?.toLocaleString() ?? "?"} |`,
    `| **Daily Balance Change** | ${c.estimated_daily_balance_change?.toLocaleString() ?? "?"} |`,
    `| **Past Day Results** | ${c.past_day_measurement_results?.toLocaleString() ?? "?"} |`,
    `| **Past Day Credits Spent** | ${c.past_day_credits_spent?.toLocaleString() ?? "?"} |`,
  ];
  if (c.estimated_runout_seconds !== null && c.estimated_runout_seconds !== undefined) {
    const days = Math.round(c.estimated_runout_seconds / 86400);
    lines.push(`| **Est. Runout** | ${days} days |`);
  }
  return lines.join("\n");
}

export function registerCreditTools(server: McpServer): void {
  server.registerTool(
    "atlas_get_credits",
    {
      title: "Get RIPE Atlas Credit Balance",
      description: `Check your RIPE Atlas credit balance and usage statistics.

Args:
  - response_format ('json'|'markdown'): Output format

Returns: Current balance, daily income/expenditure, estimated runout.

Requires: RIPE_ATLAS_API_KEY environment variable.`,
      inputSchema: GetCreditsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const data = await apiGet<CreditResponse>("credits/");
        return {
          content: [
            {
              type: "text" as const,
              text: formatCredits(data, params.response_format),
            },
          ],
        };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }] };
      }
    }
  );
}
