export const API_BASE_URL = "https://atlas.ripe.net/api/v2";
export const CHARACTER_LIMIT = 25000;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 500;
export const DEFAULT_PROBE_COUNT = 5;
export const DEFAULT_TIMEOUT = 30000;

export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json",
}

export enum MeasurementType {
  PING = "ping",
  TRACEROUTE = "traceroute",
  DNS = "dns",
  SSLCERT = "sslcert",
  HTTP = "http",
  NTP = "ntp",
}

export enum MeasurementStatus {
  SPECIFIED = 0,
  SCHEDULED = 1,
  ONGOING = 2,
  STOPPED = 4,
  FORCED_STOP = 5,
  NO_PROBES = 6,
  FAILED = 7,
  ARCHIVED = 8,
}

export const STATUS_LABELS: Record<number, string> = {
  0: "Specified",
  1: "Scheduled",
  2: "Ongoing",
  4: "Stopped",
  5: "Forced to stop",
  6: "No suitable probes",
  7: "Failed",
  8: "Archived",
};

export enum AddressFamily {
  IPV4 = 4,
  IPV6 = 6,
}
