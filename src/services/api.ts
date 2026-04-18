import axios, { AxiosError } from "axios";
import { API_BASE_URL, DEFAULT_TIMEOUT } from "../constants.js";

const apiKey = process.env.RIPE_ATLAS_API_KEY;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Key ${apiKey}`;
  }
  return headers;
}

export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T> {
  const response = await axios.get<T>(`${API_BASE_URL}/${endpoint}`, {
    params,
    headers: getHeaders(),
    timeout: DEFAULT_TIMEOUT,
  });
  return response.data;
}

export async function apiPost<T>(
  endpoint: string,
  data: unknown
): Promise<T> {
  const response = await axios.post<T>(`${API_BASE_URL}/${endpoint}`, data, {
    headers: getHeaders(),
    timeout: DEFAULT_TIMEOUT,
  });
  return response.data;
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await axios.delete<T>(`${API_BASE_URL}/${endpoint}`, {
    headers: getHeaders(),
    timeout: DEFAULT_TIMEOUT,
  });
  return response.data;
}

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const detail =
        typeof data === "object" && data !== null
          ? JSON.stringify(data, null, 2)
          : String(data);

      switch (status) {
        case 400:
          return `Error: Bad request. ${detail}\nCheck your parameters and try again.`;
        case 401:
          return "Error: Authentication failed. Set RIPE_ATLAS_API_KEY environment variable with a valid API key. Get one at https://atlas.ripe.net/keys/";
        case 403:
          return "Error: Permission denied. Your API key may not have the required permissions. Check key permissions at https://atlas.ripe.net/keys/";
        case 404:
          return "Error: Resource not found. Verify the measurement/probe ID is correct.";
        case 429:
          return "Error: Rate limit exceeded. Wait a moment before retrying.";
        default:
          return `Error: API returned status ${status}. ${detail}`;
      }
    } else if (error.code === "ECONNABORTED") {
      return "Error: Request timed out. The RIPE Atlas API may be slow — try again.";
    } else if (error.code === "ENOTFOUND") {
      return "Error: Cannot reach atlas.ripe.net. Check your internet connection.";
    }
  }
  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}
